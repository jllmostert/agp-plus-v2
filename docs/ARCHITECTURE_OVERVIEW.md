# 🏗️ AGP+ Architecture Overview

**Versie**: 4.3.0  
**Laatst bijgewerkt**: 2025-11-16  
**Doel**: Complete overzicht van applicatie architectuur, bestandsstructuur, en design decisions

---

## 📖 TABLE OF CONTENTS

1. [High-Level Architectuur](#high-level-architectuur)
2. [Context API Layers](#context-api-layers)
3. [Bestandsstructuur](#bestandsstructuur)
4. [Data Flow](#data-flow)
5. [Storage Architecture](#storage-architecture)
6. [UI Architecture](#ui-architecture)
7. [Key Design Decisions](#key-design-decisions)

---

## 🎯 HIGH-LEVEL ARCHITECTUUR

AGP+ is een **React-based web application** voor analyse van continue glucose monitoring (CGM) data van Medtronic pompen.

### Core Technology Stack

- **Framework**: React 18 (Vite build)
- **Styling**: Tailwind CSS + Custom brutalist design system
- **Storage**: Dual-layer (IndexedDB + localStorage)
- **Charts**: Recharts
- **State Management**: React Context API (4 layers)

### Architectural Principles

1. **Brutalist Design**: Maximum contrast, print compatibility, clinical efficiency
2. **Offline-First**: All data stored locally, no server dependency
3. **Panel-Based UI**: Full-screen panels instead of modals
4. **Context Separation**: Data, Period, Metrics, and UI contexts
5. **Backwards Compatibility**: V2 (localStorage) + V3 (IndexedDB) support

---

## 🧩 CONTEXT API LAYERS

AGP+ uses a **4-layer context architecture** for clean separation of concerns:

### Layer 1: DataContext (DataProvider)
**Location**: `src/contexts/DataContext.jsx`  
**Purpose**: Master dataset management + V2/V3 compatibility

**Provides**:
- `masterDataset`: V3 IndexedDB dataset
- `csvData`: V2 localStorage readings (legacy)
- `activeReadings`: Filtered readings for current period
- `comparisonReadings`: Full dataset for comparison calculations
- `tddByDay`: Total Daily Dose per day
- `useV3Mode`: Boolean flag for V3 features
- `dateRange`: Min/max timestamps of dataset

**Key Functions**:
- `loadCSVData()`: Import Medtronic CSV
- `clearData()`: Reset all data
- `stats`: Dataset statistics (count, date range, sensors)

### Layer 2: PeriodContext (PeriodProvider)
**Location**: `src/contexts/PeriodContext.jsx`  
**Purpose**: Selected date range management

**Provides**:
- `startDate`: Analysis period start
- `endDate`: Analysis period end  
- `setStartDate()`, `setEndDate()`: Period selectors
- `safeDateRange`: Validated period with fallbacks

**Dependencies**: Depends on DataContext for full dataset range

### Layer 3: MetricsContext (MetricsProvider)
**Location**: `src/contexts/MetricsContext.jsx`  
**Purpose**: All metrics calculations (AGP, TDD, comparisons)

**Provides**:
- `metricsResult`: Current period metrics (TIR, TAR, TBR, CV, GMI, MAGE, MODD)
- `comparisonData`: Previous period comparison metrics
- `dayProfiles`: Individual day profiles (last 7 or 14 days)
- `tddData`: Period-specific TDD statistics

**Dependencies**: Depends on DataContext + PeriodContext

### Layer 4: UIContext (Future)
**Status**: Not yet implemented (Track 3, Phase 4)  
**Purpose**: UI state management (modals, toasts, batch dialogs)

---

## 📁 BESTANDSSTRUCTUUR

### Root Level
```
agp-plus/
├── src/                    # Application source code
├── public/                 # Static assets
├── docs/                   # Documentation (this file!)
├── CHANGELOG.md           # Version history
├── package.json           # Dependencies
└── vite.config.js         # Build configuration
```

### src/ Organization
```
src/
├── main.jsx               # App entry point
├── App.jsx                # Root component (context providers)
│
├── components/            # React components
│   ├── AGPGenerator.jsx     # Main app container (1553 lines)
│   ├── panels/              # Full-screen panel components
│   ├── containers/          # Container components
│   └── [50+ components]     # UI components
│
├── contexts/              # Context API providers
│   ├── DataContext.jsx      # Layer 1: Data management
│   ├── PeriodContext.jsx    # Layer 2: Period selection
│   └── MetricsContext.jsx   # Layer 3: Metrics calculation
│
├── hooks/                 # Custom React hooks
│   ├── useData.js           # DataContext consumer
│   ├── usePeriod.js         # PeriodContext consumer
│   ├── useMetrics.js        # Core metrics calculation
│   ├── useComparison.js     # Comparison logic
│   ├── useDayProfiles.js    # Day profile generation
│   └── [10+ hooks]          # UI, navigation, storage hooks
│
├── core/                  # Business logic (pure functions)
│   ├── metrics-engine.js    # AGP metrics calculation
│   ├── insulin-engine.js    # TDD calculations
│   ├── day-profile-engine.js # Individual day profiles
│   ├── parsers.js           # CSV/ProTime parsing
│   └── [exporters]          # HTML/JSON export logic
│
├── storage/               # Data persistence layer
│   ├── masterDatasetStorage.js  # V3 IndexedDB (primary)
│   ├── sensorStorage.js         # Sensor management (dual)
│   ├── deletedSensorsDB.js      # Tombstone tracking
│   └── [legacy V2 modules]      # localStorage compatibility
│
├── utils/                 # Utility functions
│   ├── debug.js             # Logging utilities
│   ├── version.js           # Version management
│   └── [helpers]            # Date, format, validation
│
└── assets/                # Static resources
    └── logo.svg
```

### Key Files Deep Dive

#### AGPGenerator.jsx (Main Container)
**Lines**: 1553 (down from 1819 after Phase 4 cleanup!)  
**Purpose**: Main application orchestration

**Responsibilities**:
- Context provider composition
- Panel routing (import, dagprofielen, sensoren, export, devtools)
- Modal management (6 modals via ModalManager)
- Event handlers (CSV upload, period selection, exports)
- Migration banner coordination

**Recent Cleanup (Phase 4)**:
- Removed 147 lines of legacy code
- Deleted old collapsible UI system
- Migrated to panel-based architecture

#### metrics-engine.js (Calculation Core)
**Lines**: ~600  
**Purpose**: Pure functions for all glucose metrics

**Functions**:
- `calculateMetrics()`: Main entry point
- `calculatePercentiles()`: AGP curve generation
- `calculateMAGE()`: Glycemic excursions (Service 1970)
- `calculateMODD()`: Day-to-day variability (Molnar 1972)
- `calculateTimeInRanges()`: TIR/TAR/TBR percentages
- `calculateGMI()`: Estimated HbA1c

**Performance**: 3-64ms for full metrics (target <1000ms)

#### sensorStorage.js (Dual Storage Layer)
**Lines**: ~800  
**Purpose**: Sensor management with V2/V3 compatibility

**Critical Functions**:
- `getAllSensors()`: Merged view (localStorage + SQLite)
- `syncUnlockedSensorsToLocalStorage()`: <30 days sync
- `toggleSensorLock()`: Manual lock/unlock
- `detectSensorChanges()`: Auto-detection from CSV

**Issues**: See ARCHITECTURE_DEEP_DIVE.md for naming inconsistencies

---

## 🔄 DATA FLOW

### Upload Flow (CSV Import)
```
User uploads CSV
    ↓
parseCSV() (parsers.js)
    ↓
DataContext.loadCSVData()
    ↓
MasterDataset.addReadings() (V3)
  + localStorage.setItem() (V2 compat)
    ↓
Auto-select last 14 days
    ↓
PeriodContext updates (startDate, endDate)
    ↓
MetricsContext recalculates
    ↓
UI re-renders with new metrics
```

### Period Selection Flow
```
User changes date range
    ↓
PeriodContext.setStartDate/setEndDate()
    ↓
DataContext.getFilteredReadings()
  → activeReadings updated
    ↓
MetricsContext.useMetrics() re-runs
    ↓
metricsResult updated
    ↓
VisualizationContainer re-renders
```

### Sensor Detection Flow
```
CSV uploaded
    ↓
detectSensorChanges() scans for "Sensor>Change sensor"
    ↓
Extract start_date from row timestamp
    ↓
Generate sensor_id (hash of start_date)
    ↓
Check duplicates (getAllSensors)
    ↓
Add to localStorage (recent) OR SQLite (old)
    ↓
Auto-lock if >30 days
```

---

## 💾 STORAGE ARCHITECTURE

### V2: localStorage (Legacy)
**Status**: Backwards compatibility only  
**Keys**:
- `agp-csv-data`: Glucose readings array
- `agp-date-range`: {min, max} timestamps
- `agp-sensors`: Sensor array (editable, <30 days)
- `agp-deleted-sensors`: Tombstone list
- `agp-patient-info`: Patient metadata

**Limitations**:
- 5-10MB quota
- Synchronous API (blocks UI)
- No indexing (slow queries)

### V3: IndexedDB (Primary)
**Database**: `agp-master-dataset`  
**Stores**:
- `readings`: Glucose data (indexed by timestamp)
- `sensors`: Historical sensors (read-only, >30 days)
- `tdd`: Total Daily Dose per day
- `workdays`: ProTime data
- `metadata`: Dataset stats

**Advantages**:
- Unlimited storage (with user permission)
- Async API (non-blocking)
- Indexed queries (fast filtering)
- Transactional integrity

### Dual-Layer Strategy
**Recent sensors (<30 days)**: localStorage (editable)  
**Old sensors (>30 days)**: SQLite/IndexedDB (immutable)  
**Deduplication**: Map-based merge (prefer localStorage version)

**Sync Logic**:
```javascript
const allSensors = [
  ...localStorageSensors,  // Editable, recent
  ...sqliteSensors.filter(s => 
    s.daysOld > 30 && 
    !inLocalStorage(s) &&
    !isDeleted(s)
  )
];
```

---

## 🎨 UI ARCHITECTURE

### Panel-Based Navigation
**System**: usePanelNavigation hook + keyboard shortcuts  
**Panels**:
- `import`: File upload + saved uploads
- `dagprofielen`: Last 7/14 day profiles (NEW toggle!)
- `sensoren`: Sensor history management
- `export`: HTML/JSON/Database export
- `devtools`: Developer diagnostics (Ctrl+Shift+D)

**Navigation Flow**:
- HeaderBar tabs trigger `navigation.setActivePanel('x')`
- Keyboard shortcuts (1-5, Esc) for quick access
- Panels are full-screen overlays (z-index 9999)
- Previous panel routing removed (all panels → import)

### Modal System
**Manager**: ModalManager.jsx (React portals)  
**Active Modals** (6):
1. Patient Info
2. Sensor Registration
3. Sensor History (legacy, replaced by panel)
4. Data Management
5. Stock Management
6. Batch Assignment Dialog

**Removed**: DayProfilesModal (migrated to panel)

### Visualization Components
**Container**: VisualizationContainer.jsx  
**Sections**:
1. Metrics Summary Cards (TIR, TAR, TBR, etc.)
2. AGP Curve (percentile curves + median)
3. Daily Overlay (24-hour view)
4. Statistics Table (CV, SD, MAGE, MODD)
5. Comparison View (previous period)
6. TDD Analysis (if available)

---

## 🧠 KEY DESIGN DECISIONS

### Why Panel Architecture?
**Problem**: Modals were cluttering the UI, navigation was confusing  
**Solution**: Full-screen panels with consistent back navigation  
**Benefits**: 
- Cleaner UX (one thing at a time)
- Better mobile support (full screen)
- Simpler state management (no modal stack)

### Why Dual Storage (V2 + V3)?
**Problem**: Can't break existing users' data  
**Solution**: Run both systems in parallel  
**Trade-offs**:
- More complexity (sync logic, deduplication)
- But: Zero data loss, smooth migration
- Future: V2 can be removed when all users migrated

### Why Context API Over Redux?
**Reasons**:
- Simpler setup (no boilerplate)
- Better TypeScript support
- Clearer data flow (provider tree)
- No external dependencies

### Why Brutalist Design?
**Medical Context**: Clinical efficiency > Aesthetics  
**Requirements**:
- Print compatibility (B&W, high contrast)
- Quick visual scanning (bold borders, monospace)
- Accessibility (AZERTY keyboard, screen readers)
- Low cognitive load (no distractions)

### Why Recharts?
**Alternatives**: Chart.js, D3.js, Plotly  
**Why Recharts**:
- React-first (composable components)
- Responsive by default
- Good TypeScript support
- Smaller bundle size

---

## 📊 PERFORMANCE TARGETS

**Metrics Calculation**: <1000ms (currently 3-64ms ✅)  
**CSV Parse**: <2000ms for 10k rows  
**IndexedDB Query**: <100ms for date range filter  
**Panel Transition**: <200ms (instant feel)  
**Full App Load**: <3000ms (first paint)

---

## 🔧 DEVELOPMENT WORKFLOW

### Local Development
```bash
cd agp-plus
npm run dev  # Vite dev server on :5173
# or
export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001
```

### Building for Production
```bash
npm run build  # → dist/
npm run preview # Test production build
```

### Testing Strategy
**Unit Tests**: Core metrics (25 tests, 100% pass)  
**Integration Tests**: Manual QA checklist  
**Performance Tests**: Metrics benchmark suite

---

## 📚 REFERENCE DOCUMENTS

- **ARCHITECTURE_DEEP_DIVE.md**: Critical analysis of storage layer
- **PROJECT_BRIEFING.md**: Product vision + feature roadmap
- **REFACTOR_MASTER_PLAN.md**: 4-track refactoring plan
- **metric_definitions.md**: AGP metrics specifications
- **minimed_780g_ref.md**: Pump settings reference

---

## 🗺️ FUTURE EVOLUTION

### Track 3: Context API Phase 4 (Optional)
- Extract UIContext for modals, toasts, dialogs
- Reduce AGPGenerator further (target: <1000 lines)

### Track 4: Medical Accuracy
- Advanced glucose variability metrics
- Insulin-on-board visualization
- Basal rate overlay on AGP

### V4.0: Full V3 Migration
- Remove V2 localStorage code
- IndexedDB-only architecture
- Simpler codebase (-500 lines estimated)

---

**Last updated**: 2025-11-16 by Claude  
**Maintainer**: Jo Mostert  
**Version**: AGP+ v4.3.0
