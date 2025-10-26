# AGP+ v3.8 - Complete Project Briefing

**Version:** 3.8.2  
**Codenaam:** FUSION (Full Unified Storage Integration)  
**Branch:** v3.0-dev  
**Status:** Phase 2B Complete ✅ | Phase 3 Ready  
**Last Updated:** October 27, 2025

---

## 🎯 EXECUTIVE SUMMARY

AGP+ is a brutalist web application for analyzing continuous glucose monitoring (CGM) data from Medtronic 780G insulin pumps. Version 3.0 "FUSION" transforms the app from single-CSV analysis to multi-year incremental dataset management with persistent sensor tracking.

**Current Capabilities:**
- ✅ Multi-year glucose data storage (IndexedDB, 28k+ readings)
- ✅ Incremental CSV uploads (merge automatically)
- ✅ Global ProTime workday tracking (346 workdays)
- ✅ Sensor database integration (219 sensors, 2022-2025)
- ✅ Sensor visualization in day profiles
- ✅ Database export/import (JSON + SQLite)
- ✅ Comparison analysis (period-to-period)
- ✅ Day profiles with event detection
- ✅ AGP metrics with clinical guidelines

---

## 🏗️ ARCHITECTURE

### Three-Layer Model (Strict Separation)

```
┌─────────────────────────────────────────────┐
│  COMPONENTS (React UI)                       │
│  - AGPGenerator.jsx (orchestrator)          │
│  - DayProfileCard.jsx (visualization)       │
│  - SensorImport.jsx (SQLite upload)         │
└─────────────────┬───────────────────────────┘
                  │ calls hooks
┌─────────────────▼───────────────────────────┐
│  HOOKS (State management)                    │
│  - useMasterDataset (v3 data loading)      │
│  - useMetrics (AGP calculations)            │
│  - useDayProfiles (7-day profiles)          │
│  - useComparison (period comparison)        │
└─────────────────┬───────────────────────────┘
                  │ calls engines
┌─────────────────▼───────────────────────────┐
│  ENGINES (Pure business logic)               │
│  - agp-engine.js (percentile calc)          │
│  - day-profile-engine.js (daily metrics)    │
│  - metrics-engine.js (TIR/TAR/TBR)          │
└─────────────────┬───────────────────────────┘
                  │ uses storage
┌─────────────────▼───────────────────────────┐
│  STORAGE (IndexedDB + localStorage)          │
│  - masterDatasetStorage.js (glucose data)   │
│  - sensorStorage.js (sensor database)       │
│  - eventStorage.js (cartridge changes)      │
│  - export.js (JSON export)                  │
│  - sensorImport.js (SQLite import)          │
└─────────────────────────────────────────────┘
```

**CRITICAL:** Business logic NEVER belongs in components. Hooks orchestrate, engines calculate.

---

## 💾 DATA STORAGE

### IndexedDB Stores (v3.0 FUSION)

```javascript
agp-plus-db (version 3)
├── uploads (v2 compat)      // Original CSV metadata
├── months                   // 🆕 Month-bucketed glucose data
│   └── key: "YYYY-MM"      // e.g., "2025-07", "2025-08"
│       └── readings: [{    // Array of glucose readings
│             date, time, sg, glucose, bolus, ...
│         }]
├── events                   // 🆕 Device events (cartridge changes)
│   └── key: "cartridge"    
│       └── changes: [{     // Detected from "Rewind" alerts
│             timestamp, date, confidence, source
│         }]
└── metadata                 // 🆕 Dataset stats + cache
    └── key: "master"
        └── { min, max, count, sorted, workdays }
```

### localStorage (Sensor Database)

```javascript
'agp-sensor-database': {
  sensors: [                 // 219 Guardian 4 sensors
    {
      id, start_timestamp, end_timestamp,
      duration_hours, duration_days,
      reason_stop, status, confidence,
      lot_number, hardware_version, notes
    }
  ],
  inventory: [],             // Unused inventory
  lastUpdated: "ISO string"
}
```

**Design Decision:** Sensors in localStorage because:
- Small dataset (~20KB for 219 sensors)
- Simpler than IndexedDB async complexity
- Can migrate to IndexedDB later if needed

---

## 📊 DATA FLOW

### CSV Upload → Master Dataset

```
User uploads CareLink.csv
    ↓
[v2parser.js] Parse CSV → normalized array
    ↓
[migrations/migrateToV3.js] Transform to v3 format
    ↓
[masterDatasetStorage.js] Store by month bucket
    ↓ detect
[eventDetection] Scan for cartridge changes
    ↓ store
[eventStorage.js] Persistent event database
    ↓ update
[metadata] Cache sorted array + stats
    ↓
UI auto-refreshes with new data
```

### Sensor Import → Visualization

```
User uploads master_sensors.db (SQLite)
    ↓
[sensorImport.js] Parse via sql.js WebAssembly
    ↓
[sensorStorage.js] Store in localStorage
    ↓
[day-profile-engine.js] detectSensorChanges()
    │ ├─ PRIORITY 1: Check sensor database (high confidence)
    │ └─ FALLBACK: Detect 3-10h data gaps (medium confidence)
    ↓
[DayProfileCard.jsx] Render red dashed lines
    └─ Visual: "SENSOR VERVANGEN" at sensor start time
```

---

## 🎨 DESIGN PHILOSOPHY: BRUTALISM

Medical data demands maximum clarity and print compatibility over aesthetic appeal.

### Core Principles

**Typography:**
- Monospace only (Courier New)
- 3px borders (thick, Soviet-inspired)
- Black/white base with clinical accent colors
- ALL CAPS for section headers

**Color System:**
```css
--bg-primary: #FFFFFF      (white, max contrast)
--bg-secondary: #F5F5F5    (subtle grey for zones)
--border-primary: #000000   (black, 3px thick)
--text-primary: #000000     (black text)
--color-red: #DC2626        (clinical alerts, sensor lines)
--color-yellow: #FCD34D     (warnings, moderate events)
--color-green: #16A34A      (achievements, success)```

**Visual Markers:**
- Sensor changes: Red dashed line (2px, pattern 4,4)
- Cartridge changes: Orange dashed line (2px, pattern 2,2)
- Hypo L2 (<54): Red circle (6px)
- Hypo L1 (<70): Yellow circle (6px)
- Hyper (>250): Red circle (6px)

**Print Compatibility:**
- All patterns work in B&W
- High contrast text (minimum 16pt)
- No color-dependent information
- Dashed patterns distinguish event types

---

## 🔧 KEY MODULES

### 1. Master Dataset Storage (`masterDatasetStorage.js`)

**Purpose:** Central glucose data management with month bucketing

**Key Functions:**
- `addReadingsToMasterDataset(readings)` - Merge new data
- `getMasterDataset(startDate, endDate)` - Query by range
- `getSortedMasterArray()` - Fast cached access
- `getDatasetStats()` - Min/max dates, count
- `clearAllMasterData()` - Full reset

**Performance:**
- Sorted array cached in metadata store
- Month buckets reduce scan size
- Typical query: <50ms for 14 days from 28k readings

### 2. Sensor Storage (`sensorStorage.js`)

**Purpose:** Guardian 4 sensor tracking via localStorage

**Key Functions:**
- `importSensorDatabase(data)` - Import from SQLite parse
- `getSensorDatabase()` - Full database access
- `getSensorAtDate(date)` - Find active sensor
- `getSensorsInRange(start, end)` - Multi-sensor query
- `addSensor(sensorData)` - Single sensor import

**Schema:**
```javascript
{
  id: number,
  start_timestamp: "YYYY-MM-DD HH:MM:SS",
  end_timestamp: "YYYY-MM-DD HH:MM:SS",
  duration_hours: number,
  duration_days: number,
  reason_stop: "expired"|"failed"|"pulled_early",
  status: "success"|"failure"|"unknown",
  confidence: "high"|"medium"|"low",
  lot_number: string,
  hardware_version: string,
  notes: string
}
```

### 3. Day Profile Engine (`day-profile-engine.js`)

**Purpose:** Single-day glucose analysis with events

**Key Functions:**
- `getLastSevenDays(data, csvDate)` - Generate 7 profiles
- `getDayProfile(data, date)` - Single day analysis
- `detectSensorChanges(data, date)` - Sensor events
- `detectCartridgeChanges(dayData)` - Rewind events
- `detectBadges(metrics, events)` - Achievement system

**Sensor Detection Logic:**
```javascript
// Priority 1: Database (high confidence)
if (sensorDb) {
  // Find sensors that started on target date
  // Return exact timestamps with lot numbers
}

// Fallback: Gap detection (medium confidence)
// Find 3-10 hour data gaps
// Less accurate but works without database
```

### 4. Sensor Import (`sensorImport.js`)

**Purpose:** SQLite to localStorage conversion

**Key Functions:**
- `importSensorsFromFile(file)` - Parse .db file
- Uses sql.js WebAssembly for browser SQLite
- Converts snake_case → camelCase schema
- Async/await for file operations

**Error Handling:**
- Failed sensor imports logged but don't block
- Returns success count + error array
- User feedback via alerts

---

## 📈 METRICS & CALCULATIONS

### AGP Metrics (Clinical Guidelines)

**Time in Range (TIR):**
- Target: 70-180 mg/dL
- ADA Goal: ≥70% for adults with T1D
- Calculated: (readings in range / total) × 100

**Time Above Range (TAR):**
- Level 1: 181-250 mg/dL (moderate)
- Level 2: >250 mg/dL (severe)
- ADA Goal: <25% total (both levels)

**Time Below Range (TBR):**
- Level 1: 54-69 mg/dL (moderate)
- Level 2: <54 mg/dL (severe)
- ADA Goal: <4% L1, <1% L2

**Other Metrics:**
- Mean glucose: Average of all readings
- SD (Standard Deviation): Variability measure
- CV (Coefficient of Variation): SD/mean × 100
- GMI (Glucose Management Indicator): Estimated A1C

### Event Detection

**Hypoglycemia:**
- L1: ≥15 min below 70 mg/dL
- L2: ≥15 min below 54 mg/dL
- Consecutive readings required (not single drops)

**Hyperglycemia:**
- ≥15 min above 250 mg/dL
- Extended duration increases severity score

**Sensor Changes:**
- High confidence: Database timestamps (±0 min)
- Medium confidence: 3-10 hour gaps (±30 min)
- Low confidence: CSV alerts (if available)

**Cartridge Changes:**
- Detected via "Rewind" alarm in CSV
- Exact timestamp from pump logs
- High confidence (direct from device)

---

## 🐛 KNOWN ISSUES (Phase 3 TODO)

### 1. Comparison Date Calculation Bug
**Status:** Identified, not fixed  
**Impact:** Comparison feature breaks when prev period outside dataset  
**File:** `src/hooks/useComparison.js`  
**Fix:** Add date range validation before query

### 2. ProTime Workday Persistence
**Status:** Partial fix (localStorage cache)  
**Impact:** Workdays sometimes reset on page reload  
**File:** `src/hooks/useMasterDataset.js`  
**Fix:** Ensure IndexedDB storage for workdays

### 3. Cartridge Change Detection
**Status:** Logic exists but markers don't render  
**Impact:** Orange lines missing in day profiles  
**File:** `src/components/DayProfileCard.jsx`  
**Debug:** Console shows events detected but not visible

---

## 🚀 ROADMAP

### ✅ COMPLETED (v3.0-3.8.2)

**Phase 0: Foundation**
- Multi-year storage architecture (IndexedDB)
- Month-bucketed data structure
- Transformation layer (v2 ↔ v3)
- Migration system from v2

**Phase 1: Core Storage**
- Master dataset CRUD operations
- Sorted array caching
- Date range queries
- Event detection system
- Database export (JSON)

**Phase 2A: Sensor Import**
- SQLite file import (sql.js)
- 219 sensors loaded
- localStorage storage
- UI stats display

**Phase 2B: Sensor Visualization**
- Day profile red dashed lines
- Database-driven detection
- Gap detection fallback
- Metadata (lot, duration)

### 🎯 CURRENT PHASE (Phase 3)

**Bug Fixes:**
- [ ] Fix comparison date validation
- [ ] Ensure ProTime persistence
- [ ] Debug cartridge change rendering

**Testing:**
- [ ] Cross-browser compatibility
- [ ] Large dataset performance (>50k readings)
- [ ] Print layout verification

### 📅 FUTURE PHASES

**Phase 4: Direct CSV Upload**
- Upload CSV directly to v3 (skip v2 layer)
- Faster processing (no transformation)
- Cleaner architecture

**Phase 2C: Sensor Dashboard** (Optional)
- Statistics table (all 219 sensors)
- Success rate by hardware version
- Average duration metrics
- Failure reason analysis

**Phase 5: Advanced Features**
- PDF export (currently HTML only)
- Multi-period comparison (3+ periods)
- Custom target ranges
- A1C correlation tracking

---

## 🔐 TECHNICAL CONSTRAINTS

### Browser Requirements
- IndexedDB support (all modern browsers)
- localStorage (8MB sensor database)
- WebAssembly (sql.js for SQLite)
- ES6+ JavaScript

### Performance Targets
- Dataset query: <50ms for 14 days
- AGP calculation: <200ms for 28k readings
- UI render: <100ms after data load
- Export: <1s for full database

### Data Limits
- IndexedDB: ~50MB quota (browser-dependent)
- localStorage: 10MB max (5MB typical)
- CSV size: Tested up to 2MB files
- Sensor count: Tested with 219 sensors

### Security
- Client-side only (no server)
- Data never leaves browser
- Export files are user-controlled
- No analytics/tracking (privacy-first)

---

## 📚 FILE STRUCTURE

```
agp-plus/
├── src/
│   ├── components/          # React UI
│   │   ├── AGPGenerator.jsx (orchestrator)
│   │   ├── DayProfileCard.jsx (day viz)
│   │   ├── SensorImport.jsx (SQLite upload)
│   │   └── ... (20+ components)
│   ├── hooks/               # State management
│   │   ├── useMasterDataset.js (v3 data)
│   │   ├── useMetrics.js (AGP calc)
│   │   ├── useDayProfiles.js (7-day gen)
│   │   └── useComparison.js (period compare)
│   ├── core/                # Business logic
│   │   ├── agp-engine.js (percentiles)
│   │   ├── day-profile-engine.js (daily)
│   │   ├── metrics-engine.js (TIR/TAR/TBR)
│   │   └── ... (parsers, utils)
│   └── storage/             # Persistence
│       ├── masterDatasetStorage.js (glucose)
│       ├── sensorStorage.js (sensors)
│       ├── eventStorage.js (cartridge)
│       ├── sensorImport.js (SQLite)
│       └── export.js (JSON export)
├── docs/                    # Documentation
│   └── archive/            # Old session docs
├── CHANGELOG.md            # Version history
├── README.md               # Public readme
├── PROJECT_BRIEFING_V3_8.md # This file ⭐
├── PHASE_2_COMPLETE.md     # Phase 2 summary
├── HANDOFF_PHASE2B_VISUALIZATION.md # Implementation guide
└── package.json            # Dependencies
```

---

## 🎓 FOR NEW AI ASSISTANTS

### Quick Start
1. Read this briefing (10 min)
2. Check PHASE_2_COMPLETE.md for recent work
3. Review CHANGELOG.md for version history
4. Server command: `cd agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001`

### Critical Context
- **Use Desktop Commander** for ALL file operations (not in container)
- **Three-layer architecture** is sacred (components → hooks → engines)
- **Clinical accuracy** over aesthetics always
- **Brutalist design** is intentional, not lazy
- **Print compatibility** required for all visuals

### Common Tasks
- Add feature: Check which layer (component/hook/engine)
- Fix bug: Trace from UI → hook → engine → storage
- Update docs: CHANGELOG.md + README.md + handoff doc
- Test: Open day profiles, check console, verify exports

### What NOT to Do
- ❌ Put business logic in components
- ❌ Use regular tools instead of Desktop Commander
- ❌ Add color-dependent information (breaks printing)
- ❌ Remove error logging (keep user-facing errors)
- ❌ Change brutalist design (it's intentional)

---

## 📞 SUPPORT

**Current Maintainer:** Jo Mostert  
**Repository:** jllmostert/agp-plus-v2 (branch: v3.0-dev)  
**Server:** localhost:3001  
**Data Location:** `/Users/jomostert/Documents/Projects/agp-plus/`

**Key Files to Monitor:**
- `src/storage/masterDatasetStorage.js` (data integrity)
- `src/hooks/useMasterDataset.js` (loading logic)
- `src/core/day-profile-engine.js` (sensor detection)
- `CHANGELOG.md` (version history)

---

**Last Updated:** October 27, 2025  
**Version:** 3.8.2  
**Status:** Production Ready (Phase 2 complete) ✅  
**Next:** Phase 3 bug fixes
