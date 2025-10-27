# AGP+ v3.8.2 - Complete Project Briefing
## *"Multi-Year Glucose Intelligence, Brutalist Clarity"*

**Version:** 3.8.2  
**Codenaam:** FUSION (Full Unified Storage Integration)  
**Branch:** v3.0-dev  
**Status:** Phase 2 Complete ✅ | Phase 3 Ready  
**Last Updated:** October 27, 2025

---

## 🎯 MISSION: Why This Matters

**AGP+ transforms diabetes management through radical clarity.**

For people living with diabetes, understanding patterns in 28,000+ glucose readings isn't just data analysis—it's life-saving intelligence. Traditional tools show 14-day snapshots. AGP+ reveals **multi-year trends**, correlates patterns with **sensor changes**, and delivers insights in **print-optimized brutalist clarity** that clinical teams can actually use.

**What We Solve:**
- 📊 **Multi-year visibility**: Analyze years, not days (28,528 readings across 2022-2025)
- 🔬 **Sensor-aware insights**: Correlate glucose patterns with device events (219 sensors tracked)
- 🖨️ **Clinical workflows**: Brutalist design = maximum clarity + print compatibility
- 🔒 **Zero vendor lock-in**: Client-side only, privacy-first, your data stays yours
- ⚡ **Incremental storage**: Add CSVs progressively, never lose history

**The Difference:**
Traditional CGM software requires constant re-uploads and forgets your history. AGP+ builds a **permanent dataset** that grows with every upload, enabling longitudinal analysis that reveals patterns no 14-day window can show.

**Real Impact:**
- Identify failing sensor lots before they cause critical lows
- Correlate workday stress patterns across months
- Track A1C improvements over years, not quarters
- Make data-driven device decisions (pump settings, sensor choices)

---

## 🏛️ DESIGN PHILOSOPHY: Brutalism for Medicine

Medical data demands **maximum clarity over aesthetic appeal**. AGP+ embraces Soviet-inspired brutalism because clinical decisions require instant pattern recognition, not pretty gradients.

### Core Principles

**Why Brutalist Design for Medical Data:**
- ✅ **3px borders**: Thick, unambiguous section boundaries
- ✅ **Monospace only**: Consistent character width for data alignment
- ✅ **High contrast**: Black on white for maximum readability
- ✅ **Print-first**: All visualizations work in black & white
- ✅ **Pattern over color**: Dashed lines distinguish events (4,4 vs 2,2 patterns)
- ✅ **No decoration**: Zero gradients, shadows, or rounded corners

**This Isn't Lazy—It's Intentional:**
Every design choice serves clinical scanning speed. When a hypoglycemic event needs immediate identification at 3 AM, you want thick red circles, not subtle pastel gradients.

**Typography:**
```css
--font-primary: 'Courier New', monospace  /* Only font used */
--size-header: 24px                        /* Section headers */
--size-body: 14px                          /* Standard text */
--size-label: 10px                         /* Chart labels */
--tracking-header: 2px                     /* Wide letter spacing */
```

**Color Palette (Clinical Semantics):**
```css
--white: #FFFFFF        /* Background, maximum contrast */
--black: #000000        /* Text, borders (3px) */
--red: #DC2626          /* Critical alerts, sensor changes, hypo L2 */
--yellow: #FCD34D       /* Warnings, hypo L1 */
--green: #16A34A        /* Success, achievements */
--grey: #F5F5F5         /* Subtle zones (day/night backgrounds) */
```

**Print Compatibility (Non-Negotiable):**
- All patterns visible in B&W printing
- Sensor changes: Red dashed (4px dash, 4px gap)
- Cartridge changes: Orange dashed (2px dash, 2px gap)
- No color-dependent information

---

## 🏗️ ARCHITECTURE: The Three Sacred Layers

**CRITICAL:** Business logic NEVER belongs in components. This separation is non-negotiable.

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: COMPONENTS (React UI - Presentation Only)         │
│  • AGPGenerator.jsx - Main orchestrator                     │
│  • DayProfileCard.jsx - Single day visualization           │
│  • SensorImport.jsx - SQLite file upload                   │
│  • MetricsDisplay.jsx - TIR/TAR/TBR cards                  │
│                                                             │
│  Rule: Props in, JSX out. NO calculations. NO storage.     │
└─────────────────────┬───────────────────────────────────────┘
                      │ calls hooks
┌─────────────────────▼───────────────────────────────────────┐
│  LAYER 2: HOOKS (State Management - Orchestration Only)     │
│  • useMasterDataset.js - V3 data loading & caching         │
│  • useMetrics.js - Coordinate AGP calculations             │
│  • useDayProfiles.js - Generate 7-day profiles             │
│  • useComparison.js - Period-to-period analysis            │
│                                                             │
│  Rule: Orchestrate, don't calculate. Delegate to engines.  │
└─────────────────────┬───────────────────────────────────────┘
                      │ calls engines
┌─────────────────────▼───────────────────────────────────────┐
│  LAYER 3: ENGINES (Business Logic - Pure Functions Only)    │
│  • metrics-engine.js - TIR/TAR/TBR calculations            │
│  • day-profile-engine.js - Daily analysis & events         │
│  • parsers.js - CSV normalization                          │
│  • visualization-utils.js - Chart calculations             │
│                                                             │
│  Rule: Pure functions. No React. No side effects. Testable.│
└─────────────────────┬───────────────────────────────────────┘
                      │ uses storage
┌─────────────────────▼───────────────────────────────────────┐
│  LAYER 4: STORAGE (Persistence - CRUD Only)                 │
│  • masterDatasetStorage.js - Glucose data (IndexedDB)      │
│  • sensorStorage.js - Sensor history (localStorage)        │
│  • eventStorage.js - Cartridge changes (IndexedDB)         │
│  • export.js - JSON export                                 │
│                                                             │
│  Rule: Simple CRUD. No business logic. No transformations. │
└─────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Testability:**
- Engines are pure functions → easy unit tests
- No React coupling → test without mounting components
- Clear contracts between layers → mock boundaries

**Maintainability:**
- Bug location obvious (UI vs logic vs data)
- Changes cascade predictably (engine → hook → component)
- New features follow established pattern

**Performance:**
- Calculations separate from rendering
- useMemo in hooks prevents redundant engine calls
- Storage layer caches aggressively

---

## 💾 DATA STORAGE: Two Systems, One Purpose

### Why Two Storage Systems?

**IndexedDB** for glucose data (large, queryable, structured):
- 28,528+ readings across years
- Month-bucketed for fast range queries
- Sorted array caching for instant access
- Event detection results persisted

**localStorage** for sensor database (small, simple, fast):
- 219 sensors = ~20KB (well under 5MB limit)
- Synchronous access (no async complexity)
- Quick lookups for day profile detection
- Can migrate to IndexedDB if grows beyond 1,000 sensors

### IndexedDB Schema (v3.0 FUSION)

```javascript
Database: "agp-plus-db" (version 3)

Store: "uploads" (v2 compatibility layer)
├── key: uploadId (string)
└── value: { id, filename, uploadDate, patientInfo, csvData, dateRange }

Store: "months" (🆕 Core storage - month-bucketed readings)
├── key: "YYYY-MM" (e.g., "2025-10", "2025-11")
└── value: {
      month: "2025-10",
      readings: [
        {
          date: "2025/10/12",         // YYYY/MM/DD format (sortable)
          time: "07:15:21",            // HH:MM:SS format
          sg: 153,                     // Sensor glucose (mg/dL)
          glucose: 153,                // Alias for sg
          bolus: 0,                    // Insulin bolus (units)
          basal: 0.9,                  // Basal rate (units/hr)
          carbs: 0,                    // Carbohydrate intake (g)
          insulin: 0,                  // Total insulin delivered
          rewind: false,               // Cartridge change flag
          alert: null                  // Pump alerts/alarms (string)
        },
        // ... 2,000-3,000 readings per month
      ],
      count: 2847,                     // Reading count for this month
      dateRange: { 
        min: Date("2025-10-01"),      // First reading (Date object)
        max: Date("2025-10-31")       // Last reading (Date object)
      }
    }

Store: "events" (🆕 Device events - cartridge changes)
├── key: "cartridge"
└── value: {
      type: "cartridge",
      changes: [
        {
          timestamp: Date("2025-10-12T07:15:00Z"),
          date: "2025/10/12",
          minuteOfDay: 435,            // 07:15 = 435 minutes
          confidence: "high",          // "high"|"medium"|"low"
          source: "csv"                // "csv"|"gap"|"manual"
        }
      ]
    }

Store: "metadata" (🆕 Dataset statistics + performance cache)
├── key: "master"
└── value: {
      dateRange: { 
        min: Date("2022-03-15"),       // Earliest reading across all months
        max: Date("2025-10-27")        // Latest reading
      },
      count: 28528,                    // Total readings across all months
      sorted: [                        // 🚀 CACHED sorted array (FAST!)
        { date, time, glucose, bolus, basal, ... },
        // ... all 28,528 readings in chronological order
        // Rebuilt on insert, cached for queries
      ],
      workdays: [                      // ProTime workdays (346 tracked)
        "2025/10/12",
        "2025/10/13",
        // ... all workdays for filtering
      ],
      lastUpdated: "2025-10-27T10:30:00Z"
    }
```

**🚀 Performance Strategy: Sorted Array Cache**

Instead of querying and sorting 28k readings on every request:
1. **On insert**: Readings added to month buckets
2. **After insert**: Rebuild sorted array from all months, store in metadata
3. **On query**: Filter cached sorted array (no DB queries, no sorting)
4. **Result**: Query time <1ms vs ~50ms without cache

**Why Month Bucketing?**
- Natural CSV boundary (CareLink exports monthly)
- Typical analysis: 1-3 months (single bucket fetch)
- Full year: 12 fetches (still fast, ~150ms total)
- Cross-month range: 2-3 fetches (acceptable trade-off)
- Scales to 10+ years without performance issues

### localStorage Schema (Sensor Database)

```javascript
Key: "agp-sensor-database"

Value: {
  sensors: [                           // 219 Guardian 4 sensors
    {
      id: 1,
      start_timestamp: "2025-10-19 01:01:07",  // ISO-ish (local time)
      end_timestamp: "2025-10-26 05:30:00",
      duration_hours: 172.5,                    // Exact hours worn
      duration_days: 7.2,                       // duration_hours / 24
      reason_stop: "expired",                   // "expired"|"failed"|"pulled_early"
      status: "success",                        // "success"|"failure"|"unknown"
      confidence: "high",                       // "high"|"medium"|"low"
      lot_number: "B0425",                      // Manufacturing batch
      hardware_version: "Guardian 4",           // Sensor model
      notes: "Normal wear"                      // Free text
    },
    // ... 219 sensors spanning 2022-2025
  ],
  inventory: [],                       // Unused sensors in stock (future)
  dateRange: {
    min: "2022-03-15",                // First sensor start date
    max: "2025-10-19"                 // Most recent sensor
  },
  lastUpdated: "2025-10-27T08:45:00Z"
}
```

**Why localStorage for Sensors?**
- Size: 219 sensors = ~20KB (well under 5MB browser limit)
- Access: Synchronous (simpler code, no async complexity)
- Lookups: Fast O(n) scan for 219 items (<1ms)
- Future: Can migrate to IndexedDB if dataset exceeds 1,000 sensors

---

## 🌊 DATA FLOWS: From Upload to Insight

### Flow 1: CSV Upload → Master Dataset

```
📄 User selects CareLink CSV file
    ↓
┌──────────────────────────────────────────────────────┐
│ AGPGenerator.jsx - handleUpload()                   │
│ • Browser file picker                               │
│ • Read file as text                                 │
│ • Pass to hook                                      │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│ useMasterDataset.js - importNewCSV()│ • Orchestrates import flow                          │
│ • Error handling + user feedback                    │
└────────────────────┬─────────────────────────────────┘
                     │ calls
┌────────────────────▼─────────────────────────────────┐
│ v2parser.js - parseCSV()                            │
│ • Parse CSV rows → JavaScript objects              │
│ • Normalize field names (SG → sg, Time → time)     │
│ • Handle Medtronic format quirks                   │
│ • Validate timestamps                              │
└────────────────────┬─────────────────────────────────┘
                     │ returns normalized data
┌────────────────────▼─────────────────────────────────┐
│ migrations/migrateToV3.js - transform()            │
│ • V2 format → V3 format conversion                 │
│ • Extract event markers (rewind, alerts)           │
│ • Maintain backward compatibility                  │
└────────────────────┬─────────────────────────────────┘
                     │ calls storage
┌────────────────────▼─────────────────────────────────┐
│ masterDatasetStorage.js                            │
│ - addReadingsToMasterDataset()                     │
│   1. Group readings by month                       │
│   2. Merge with existing month buckets             │
│   3. Rebuild sorted array cache                    │
│   4. Update metadata (count, dateRange)            │
└────────────────────┬─────────────────────────────────┘
                     │ writes to
┌────────────────────▼─────────────────────────────────┐
│ IndexedDB: "months" store                          │
│ • Reading stored in month bucket (2025-10)         │
│ • Automatic deduplication (date+time key)          │
└────────────────────┬─────────────────────────────────┘
                     │ updates
┌────────────────────▼─────────────────────────────────┐
│ IndexedDB: "metadata" store                        │
│ • Sorted array rebuilt (O(n log n) one-time cost) │
│ • Count incremented                                │
│ • Date range expanded if needed                    │
└────────────────────┬─────────────────────────────────┘
                     │ triggers
┌────────────────────▼─────────────────────────────────┐
│ UI Auto-Refresh                                    │
│ • React state updates                              │
│ • Metrics recalculated                             │
│ • Charts re-render                                 │
│ • Success message displayed                        │
└──────────────────────────────────────────────────────┘
```

**Performance Notes:**
- Parse: ~100ms for 2MB CSV (~3,000 readings)
- Migrate: ~50ms (transformation)
- Store: ~200ms (IndexedDB write + cache rebuild)
- Total: ~350ms end-to-end
- User sees spinner, then instant success

---

### Flow 2: Sensor Import → Visualization

```
📁 User uploads master_sensors.db (SQLite file)
    ↓
┌──────────────────────────────────────────────────────┐
│ SensorImport.jsx - handleFileSelect()              │
│ • File picker (<input type="file" accept=".db">)   │
│ • Read as ArrayBuffer                              │
└────────────────────┬─────────────────────────────────┘
                     │ calls
┌────────────────────▼─────────────────────────────────┐
│ sensorImport.js - importSensorsFromFile()          │
│ • Initialize sql.js WebAssembly runtime            │
│ • Load SQLite database from ArrayBuffer            │
│ • Execute: SELECT * FROM sensors                   │
│ • Parse rows, transform snake_case → camelCase     │
│ • Close database cleanly                           │
└────────────────────┬─────────────────────────────────┘
                     │ returns sensor array
┌────────────────────▼─────────────────────────────────┘
│ sensorStorage.js - importSensorDatabase()         │
│ • Wrap sensors in { sensors, inventory } structure │
│ • Calculate date range (min/max)                   │
│ • Add lastUpdated timestamp                        │
│ • localStorage.setItem('agp-sensor-database', ...) │
└────────────────────┬─────────────────────────────────┘
                     │ stored in
┌────────────────────▼─────────────────────────────────┐
│ localStorage: "agp-sensor-database"                │
│ • 219 sensors (~20KB)                              │
│ • Synchronous access                               │
│ • Available to all detection functions             │
└────────────────────┬─────────────────────────────────┘
                     │ used by
┌────────────────────▼─────────────────────────────────┐
│ day-profile-engine.js - detectSensorChanges()     │
│                                                    │
│ PRIORITY 1: Database Detection (High Confidence)  │
│ ├─ getSensorDatabase() from localStorage          │
│ ├─ Filter: sensors.start_timestamp matches date   │
│ ├─ Skip midnight timestamps (day boundary)        │
│ └─ Return: { timestamp, confidence: "high", ... } │
│                                                    │
│ FALLBACK: Gap Detection (Medium Confidence)       │
│ ├─ Find 3-10 hour data gaps                       │
│ ├─ Exclude midnight gaps                          │
│ └─ Return: { timestamp, confidence: "medium", ... }│
└────────────────────┬─────────────────────────────────┘
                     │ returns event array
┌────────────────────▼─────────────────────────────────┐
│ Day Profile Object                                 │
│ sensorChanges: [                                   │
│   {                                                │
│     timestamp: Date("2025-10-19T01:01:07Z"),      │
│     minuteOfDay: 61,  // 01:01 = 61 minutes       │
│     type: "start",                                 │
│     confidence: "high",                            │
│     source: "database",                            │
│     metadata: {                                    │
│       lotNumber: "B0425",                          │
│       duration: 7.2                                │
│     }                                              │
│   }                                                │
│ ]                                                  │
└────────────────────┬─────────────────────────────────┘
                     │ rendered by
┌────────────────────▼─────────────────────────────────┐
│ DayProfileCard.jsx - SVG rendering                │
│ • Filter: sensorChanges.type === 'start'          │
│ • Map to <line> elements                           │
│ • x1/x2: minuteOfDay → xScale                      │
│ • y1: 0, y2: chartHeight (full height)            │
│ • stroke: #dc2626 (clinical red)                   │
│ • strokeDasharray: "4,4" (dashed pattern)          │
│ • Label: "SENSOR VERVANGEN" above line            │
└──────────────────────────────────────────────────────┘

Visual Result: Red dashed line at 01:01 AM on Oct 19
```

**Why Two-Tier Detection?**
- Database = exact timestamps (±0 min accuracy)
- Gaps = inference (~30 min accuracy)
- Database includes metadata (lot number, duration)
- Gaps work without database (graceful degradation)

---

## 📊 CLINICAL METRICS: ADA/ATTD Guidelines

### Time in Range (TIR) - Gold Standard

```javascript
// metrics-engine.js
function calculateTIR(data) {
  const inRange = data.filter(r => 
    r.glucose >= 70 && r.glucose <= 180  // ADA/ATTD standard
  );
  return (inRange.length / data.length) * 100;
}
```

**Clinical Target:** ≥70% for adults with T1D  
**Interpretation:**
- 80-100%: Excellent control
- 70-79%: Good control, small improvements possible
- 50-69%: Moderate control, intervention recommended
- <50%: Poor control, urgent intervention needed

### Time Above Range (TAR)

**Level 1 (181-250 mg/dL):**
- Moderate hyperglycemia
- Target: <25% combined with L2
- Action: Review meal timing, bolus calculations

**Level 2 (>250 mg/dL):**
- Severe hyperglycemia
- Target: <5%
- Action: Urgent pump settings review, possible basal adjustment

### Time Below Range (TBR) - Safety Critical

**Level 1 (54-69 mg/dL):**
- Moderate hypoglycemia
- Target: <4%
- Action: Review basal rates, exercise timing

**Level 2 (<54 mg/dL):**
- Severe hypoglycemia (DANGEROUS)
- Target: <1%
- Action: Immediate intervention, settings adjustment, clinical review

### Glucose Management Indicator (GMI)

```javascript
// Estimated A1C from mean glucose
GMI = 3.31 + (0.02392 × meanGlucose)
```

**Validated Formula:** From Bergenstal et al. (2018)  
**Use Case:** Track A1C trends between lab tests  
**Limitation:** Not a replacement for actual A1C (different measurement)

### Coefficient of Variation (CV)

```javascript
CV = (standardDeviation / mean) × 100
```

**Clinical Target:** ≤36% for stable control  
**Interpretation:**
- <36%: Stable, predictable patterns
- 36-40%: Moderate variability, review patterns
- >40%: High variability, intervention needed

---

## 🐛 KNOWN ISSUES + FIXES (Phase 3 Backlog)

### Issue 1: Comparison Date Validation

**Status:** ⚠️ **P1 - HIGH PRIORITY**  
**Severity:** High - Feature breaks in edge cases  
**Location:** `src/hooks/useComparison.js:45-60`

**Problem:**
When user selects comparison period where previous period falls outside available dataset, query fails silently. Comparison shows "No data" instead of helpful error.

**Example Failure:**
- Dataset: 2024-01-01 → 2025-10-27
- Current period: 2024-02-01 → 2024-02-14
- Previous period: 2024-01-18 → 2024-01-31 (partially outside dataset)
- Result: Silent failure, no comparison data

**Root Cause:**
```javascript
// useComparison.js (CURRENT - BROKEN)
const prevStart = new Date(startDate);
prevStart.setDate(prevStart.getDate() - periodLength);
// No validation if prevStart < dataset.min!
```

**Fix:**
```javascript
// useComparison.js (PROPOSED FIX)
const prevStart = new Date(startDate);
prevStart.setDate(prevStart.getDate() - periodLength);

// Validate against dataset range
if (prevStart < datasetDateRange.min) {
  return {
    error: 'Previous period outside available data',
    suggestedStart: datasetDateRange.min,
    message: `Dataset starts ${datasetDateRange.min.toLocaleDateString()}`
  };
}
```

**Effort:** 2 hours (fix + test + document)  
**Target:** Week 1 of Phase 3

---

### Issue 2: ProTime Workday Persistence

**Status:** ⚠️ **P1 - MEDIUM PRIORITY**  
**Severity:** Medium - Frustrating but not breaking  
**Location:** `src/hooks/useMasterDataset.js:180-200`

**Problem:**
Workdays (346 tracked) stored in metadata.workdays array in IndexedDB, but sometimes not persisting across page reloads. User imports ProTime PDFs, workdays show correctly, but after refresh they're gone.

**Root Cause (Hypothesis):**
Workdays update might be calling updateMetadata() but not awaiting the Promise, causing race condition with page navigation/reload.

**Fix:**
```javascript
// useMasterDataset.js (ENSURE AWAITED)
const handleProTimeImport = async (workdayDates) => {
  const metadata = await getMetadata();
  metadata.workdays = workdayDates;
  
  await updateMetadata(metadata);  // ← MUST AWAIT!
  
  // Only then update React state
  setWorkdays(new Set(workdayDates));
};
```

**Effort:** 2 hours (debug + fix + verify persistence)  
**Target:** Week 1 of Phase 3

---

### Issue 3: Cartridge Change Rendering

**Status:** ⚠️ **P2 - MEDIUM PRIORITY**  
**Severity:** Medium - Feature exists but invisible  
**Location:** `src/components/DayProfileCard.jsx:250-280`

**Problem:**
Cart