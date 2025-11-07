# Changelog - AGP+ (Ambulatory Glucose Profile Plus)

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [v3.8.0 - Session 10: Dynamic AGP Y-Axis + Housekeeping] - 2025-11-07

### 🎨 Final Session: AGP Visualization + Project Organization
**Session**: Session 10 + Housekeeping  
**Goal**: Dynamic Y-axis for main AGP curve, project cleanup

### ✅ Changes

#### Session 10: Dynamic AGP Y-Axis Implementation
**File**: `src/components/AGPChart.jsx`

- ✅ Implemented `calculateAGPYAxis()` function:
  - Finds highest percentile value across all AGP data (p5-p95)
  - Dynamic range: yMax = Math.max(250, Math.min(400, ceil(dataMax/10)*10))
  - Minimum ceiling: 250 mg/dL
  - Maximum ceiling: 400 mg/dL
  - Smart tick generation (always includes 0, 70, 180 when in range)

- ✅ Updated AGPChart components:
  - Dynamic `yScale` function (replaces fixed 0-400)
  - Updated `<GridLines>` to use dynamic ticks
  - Updated `<YAxis>` to use dynamic ticks

- ✅ Verified working:
  - Browser display: Y-axis scales correctly
  - HTML export: Y-axis scales correctly
  - Clinical thresholds (70, 180) visible when in range

**Impact**: Better space utilization, focuses on relevant glucose range instead of wasting space on unused values

#### Housekeeping: Project Organization
**Files**: Multiple archives created, documentation updated

- ✅ Archived 3 old handoffs → `docs/archive/2025-11/handoffs/`
- ✅ Archived 2 obsolete planning docs → `docs/archive/2025-11/planning/`
- ✅ Archived 4 old test exports → `test-data/archive/2025-11/`
- ✅ Created `TASK_BREAKDOWN_v3.8.0.md` (11/14 tasks complete, 79%)
- ✅ Created `HOUSEKEEPING_2025-11-07.md` (execution log)
- ✅ Root directory cleaned: 4 handoffs → 1 current

**Impact**: Clean, organized project structure ready for v3.8.0 release

#### Version Synchronization
**Files**: `package.json`, `index.html`, `src/utils/version.js`

- ✅ Synchronized all version numbers to **3.8.0**
- ✅ package.json: 3.2.0 → 3.8.0
- ✅ index.html: 3.12.0 → 3.8.0 (meta + title)
- ✅ version.js: Fallback 3.2.0 → 3.8.0

**Impact**: Consistent version display across all outputs

### 📊 Session 10 Summary
**Time**: ~45 min development + 15 min housekeeping  
**Files Modified**: 11 (AGPChart.jsx, version files, archives, docs)  
**Status**: ✅ Core v3.8.0 goals 100% complete!  
**Progress**: 11/14 tasks (79%), optional Tasks 7.1 & 7.2 remaining

---

## [v3.8.0 - UI Polish + Build Infrastructure] - 2025-11-07

### 🎨 UI Polish & Build Infrastructure
**Session**: Tasks 5.1, 6.1, 6.2 completed  
**Goal**: Professional presentation, dynamic versioning, golden ratio layout

### ✅ Changes

#### Task 6.1: Golden Ratio Hero Layout
**File**: `MetricsDisplay.jsx`

- ✅ Implemented golden ratio grid: `gridTemplateColumns: '1fr 1.61fr'`
- ✅ Left zone (dark, 1 unit): TIR + Mean±SD stacked
- ✅ Right zone (white, 1.61 units): CV + GMI + TDD in row
- ✅ Brutalist design maintained (3px borders, high contrast, monospace)

**Impact**: Better visual hierarchy, TIR emphasized as primary quality metric

#### Task 6.2: Build-Injected Versioning
**Files**: `.env`, `vite.config.js`, `html-exporter.js`, `day-profiles-exporter.js`

- ✅ Created `.env` with `VITE_APP_VERSION=3.8.0`
- ✅ Updated vite.config.js: defines `__APP_VERSION__` global at build time
- ✅ Updated HTML exporters to use dynamic version
- ✅ Single source of truth (no hardcoded version strings)

**Impact**: Professional version management with centralized control

#### Task 6.1: Golden Ratio Hero Layout
**File**: `MetricsDisplay.jsx`

- ✅ Implemented golden ratio grid: `gridTemplateColumns: '1fr 1.61fr'`
- ✅ Left zone (dark, 1 unit): TIR + Mean±SD stacked
- ✅ Right zone (white, 1.61 units): CV + GMI + TDD in row
- ✅ Brutalist design maintained (3px borders, high contrast, monospace)

**Impact**: Better visual hierarchy, TIR emphasized as primary quality metric

#### Task 6.2: Build-Injected Versioning
**Files**: `.env`, `vite.config.js`, `html-exporter.js`, `day-profiles-exporter.js`

- ✅ Created `.env` with `VITE_APP_VERSION=3.8.0`
- ✅ Updated vite.config.js: defines `__APP_VERSION__` global at build time
- ✅ Updated HTML exporters to use dynamic version
- ✅ Single source of truth (no hardcoded version strings)

**Impact**: Professional version management with centralized control

### 📊 Summary
**Effort**: ~1 hour implementation + 15 min verification  
**Files**: 5 changed (.env, vite.config.js, 2 exporters, MetricsDisplay.jsx)  
**Status**: All UI polish tasks complete, ready for v3.8.0 release

---

## [v3.8.0 - Debug Cycle: Batch UI + hw_version + Exact Timestamps] - 2025-11-06

### 🎯 Quality & Accuracy Improvements
**Goal**: UI cleanup, hardware versioning, precise sensor timestamps

### ✅ Changes

#### 1. Batch Column Consolidation (Task 1.1)
**File**: `SensorHistoryModal.jsx`

- **Removed**: Separate "LOT" column (redundant with BATCH)
- **Enhanced**: BATCH column now shows:
  - Primary display: `lot_number` (from CSV, authoritative)
  - Fallback: `batch` (if lot_number unavailable)
  - Optional: Stock batch assignment dropdown (smaller, subtle)
- **Updated**: Table header "TOP 10 LOTNUMMERS" → "TOP 10 BATCHES"

**Impact**: Cleaner UI, single source of truth for batch identification

#### 2. Hardware Version Auto-Assignment (Task 1.2)
**Files**: `sensorStorage.js`, `useSensorDatabase.js`

**Added**:
- `calculateHwVersion(startedAt)` helper:
  - Cutoff date: 2025-07-03
  - Before cutoff: A1.01 (Guardian Sensor 3)
  - After cutoff: A2.01 (Guardian Sensor 4)
  
- Modified `addSensor()`:
  - Auto-calculates `hw_version` from `startTimestamp`
  - Adds `batch` field (copies from `lot_number`)
  
- **Migration**: `migrateSensorsToV38()`
  - Adds `hw_version` to all existing sensors
  - Adds `batch` field (copies from `lot_number`)
  - Idempotent (safe to run multiple times)
  - Called on app startup
  
**First Run**: Migrated 222 sensors successfully  
**Impact**: All sensors now have hardware version metadata for analysis

#### 3. Exact Sensor Timestamps (Task 2.1)
**Files**: `sensorEventClustering.js`, `sensorDetectionEngine.js`, `SensorRegistration.jsx`

**Added**:
- `getExactAlertTimestamp(alerts, targetAlertType)`:
  - Case-insensitive matching
  - Flexible alert type recognition ("SENSOR CONNECTED", "Sensor Connected", etc.)
  - Returns exact timestamp from alert
  
- `firstValidReadingAfterConnect(glucoseReadings, alerts)`:
  - Fallback when exact alert unavailable
  - Finds first glucose reading within 4 hours of sensor alert
  - More accurate than cluster estimation
  
- Enhanced `analyzeCluster()` with 3-tier priority:
  1. **exactAlertTime** (from SENSOR CONNECTED alert) - Best
  2. **fallbackTime** (from first glucose reading) - Good
  3. **ultimateFallback** (from cluster.startTime) - Acceptable
  
**New Fields**:
- `started_at`: Exact timestamp (priority chain result)
- `detection_method`: 'exact_alert' | 'fallback_reading' | 'estimated' | 'none'

**UI Enhancements** (`SensorRegistration.jsx`):
- New "DETECTION" column in candidates table
- Emoji badges:
  - 🎯 Exact Alert (from SENSOR CONNECTED)
  - 📊 First Reading (from glucose data)
  - ⏱️ Estimated (from cluster)
  - ❓ Unknown
- Tooltips explain each detection method
- Brutalist styling (monospace, high contrast)

**Impact**: Sensor start times now precise to the minute (when alert available)

#### 4. End-of-Life Gap Detection (Task 3.1)
**Files**: `glucoseGapAnalyzer.js`, `sensorDetectionEngine.js`

**Added**:
- `findEndOfLifeGapStart(glucoseReadings, sensorWindow, minGapMinutes)`:
  - Finds first gap ≥2 hours after last valid reading
  - Determines when sensor stopped working
  - Ignores recalibration attempts after EoL gap
  - Returns exact timestamp of sensor end
  
**Enhanced Detection Engine**:
- Calls EoL detection for each sensor window
- Sets `stopped_at` timestamp during CSV parsing
- Sets `lifecycle` field: 'ended', 'active', or 'unknown'
- No longer relies on next sensor start time

**Impact**: Sensor end times determined automatically at parse time, not retrospectively

#### 5. Remove UI Stop Logic (Task 3.2)
**File**: `SensorRegistration.jsx`

**Removed**:
- `updateSensorEndTime()` logic from `handleConfirm()`
- Retrospective sensor end time updates

**Changed**:
- UI now uses `candidate.stopped_at` from detection engine
- Uses `candidate.lifecycle` for sensor status
- Only validation warning if previous sensor missing stop time
- Added comment explaining v3.8.0+ behavior

**Impact**: Clean data flow (Detection → Storage → UI), no circular dependencies

#### 6. Hypo State Machine Rewrite (Task 4.1)
**File**: `metrics-engine.js`

**Problem**: Dual L1/L2 state machines caused double-counting (same drop counted as both)

**Solution**: Single episode tracker with severity classification
- Episode starts: First glucose <70 mg/dL
- Episode continues: Track nadir (lowest point)
- Episode ends: Glucose ≥70 mg/dL for 15+ minutes
- Classify AFTER completion: severity = nadir <54 ? 'severe' : 'low'

**New Output Structure**:
```javascript
hypoEpisodes: {
  count: 5,              // Total episodes
  severeCount: 1,        // Episodes with nadir <54
  lowCount: 4,           // Episodes with nadir 54-70
  events: [...],         // Episode details
  avgDuration: 45.2,     // Average minutes
  avgDurationSevere: 67, // Average for severe
  avgDurationLow: 38     // Average for low
}
```

**Impact**: Accurate hypoglycemia counting, no more artificial inflation

#### 7. Update Hypo Consumers (Task 4.2)
**Files**: `HypoglycemiaEvents.jsx`, `DayProfileCard.jsx`, `day-profile-engine.js`, `day-profiles-exporter.js`, `html-exporter.js`

**Changed**:
- All components now use `hypoEpisodes` structure
- Event markers colored by severity (red = severe, orange = low)
- Badge detection uses `hypoEpisodes.count`
- HTML export updated (AGP summary + markers + cards)
- Day profile cards show severity-specific counts

**Impact**: Consistent hypo display across entire app

### 🔍 Technical Details

**Schema Changes**:
- All sensors now have: `hw_version`, `batch`, `started_at`, `detection_method`, `stopped_at`, `lifecycle`
- Migration runs automatically on app startup
- Backwards compatible (fallback values)

**Detection Quality**:
- Best case: Exact alert timestamp (±1 minute accuracy)
- Good case: First reading after connect (±5 minute accuracy)
- Acceptable: Cluster estimation (±15 minute accuracy)

**Lifecycle States**:
- `ended`: EoL gap detected, sensor stopped working
- `active`: No EoL gap found, sensor still active
- `unknown`: Insufficient data to determine

**Hypoglycemia Changes**:
- Old: Separate L1/L2 state machines (double counting)
- New: Single episode with severity flag (accurate counting)
- Episode duration: Minimum 15 minutes to count

### 📊 Testing
- Migration tested: 222 sensors migrated successfully
- Detection methods verified across multiple CSV uploads
- UI indicators tested with real sensor data
- EoL detection tested with 14-day sensor windows
- Hypo state machine tested: No more double counting

### 🐛 Bugs Fixed
1. **TDD Calculation**: Dashboard values corrected (was overwriting during CSV upload)
2. **Hypo Double Counting**: Same drop <70 no longer creates multiple episodes
3. **Sensor Lifecycle**: End times now determined at parse time (was retrospective)

### 📈 Session Stats
- **Tasks Completed**: 7/14 (50% of v3.8.0 backlog)
- **Lines Changed**: ~600+ across 10 files
- **Files Modified**: 10
- **New Functions**: 6
- **Migrations Added**: 1

---

## [v3.7.2 - Port Enforcement] - 2025-11-03 - Port Management

### 🔌 Port 3001 Enforcement
**Goal**: Standardize on port 3001, eliminate confusion with other ports

### ✅ Changes

#### Port Configuration
- **package.json**: Updated `dev` script to use `--port 3001`
  - `npm run dev` now automatically uses port 3001
  - No more default Vite port 5173
  
#### Documentation Updates
- **HANDOFF.md**: Added comprehensive port management section
  - Port 3001 enforcement
  - Alias setup guide (`alias 3001='...'`)
  - Manual port killing commands
  - Why port 3001 (consistency, alias support, memory aid)
  - Updated all localhost references: 5173 → 3001
  
- **START_HERE.md**: Updated port references
  - All commands now use port 3001
  
- **HANDOFF_PAUSE.md** (Sprint C1): Updated port references
  - Consistent with root docs

#### Port Management Guide
Added to HANDOFF.md:
- **Alias setup**: One-command kill + restart
- **Manual management**: `lsof` commands to check/kill ports
- **Why 3001**: Consistency, alias support, easy to remember

### 🎯 Impact
- **Consistency**: Always port 3001, no more confusion
- **Ease of use**: `npm run dev` or `3001` alias
- **Quick recovery**: Easy to kill stuck processes
- **Documentation clarity**: All docs reference same port

### 📝 Usage
```bash
# Option 1: Standard npm script
npm run dev  # Automatically uses port 3001

# Option 2: Explicit port
npx vite --port 3001

# Option 3: Alias (if configured)
3001  # Kills port 3001 and starts server
```

---

## [v3.7.1 - Documentation Overhaul] - 2025-11-03 - Development Workflow

### 📚 Documentation Restructure
**Goal**: Improve development workflow, prevent context overflow, clarify document roles

### ✅ Changes

#### Core Documentation Rewrite
- **HANDOFF.md**: Completely rewritten
  - Now general development workflow guide (was sprint-specific)
  - Added comprehensive context overflow prevention guide
  - Added healthy development practices
  - Clarified Progress/Status/Changelog roles
  - Added recovery procedures
  
- **DocumentHygiene.md**: Activated
  - Moved from `docs/archive/` to root directory
  - Now actively enforced tier system
  - Updated metadata (tier 1, active status)
  
- **START_HERE.md**: Updated navigation
  - Better routing to current work
  - Clearer documentation structure
  - Added quick commands for common tasks
  
- **PROGRESS.md**: Clarified purpose
  - Now explicitly session log only
  - Added role definitions (vs STATUS, CHANGELOG)
  - Updated current sprint status (C1, paused)
  - Added Session 4 entry (this documentation work)

#### Documentation Philosophy
- Established clear separation:
  - **PROGRESS.md**: Session log, what you did
  - **Sprint PROGRESS.md**: Real-time task tracking
  - **STATUS.md**: High-level project status
  - **CHANGELOG.md**: Formal version history
  - **HANDOFF.md**: General workflow guide
  
- Tier system enforced (DocumentHygiene):
  - Tier 1: Operational (daily updates)
  - Tier 2: Planning (weekly updates)
  - Tier 3: Reference (rarely updated)

#### Context Overflow Prevention
Added comprehensive guide to prevent Claude crashes:
1. One file at a time (non-negotiable)
2. Use references, not full text
3. Strip comments + test data
4. Hard budget in prompts
5. Request minimal outputs
6. Rolling context governor
7. Never include binary/large JSON
8. Work in 30-60 min chunks
9. Use edit_block, not append
10. Automate hygiene with scripts

#### Branch Status Clarification
- Documented current state: `develop` is stable, should become `main`
- Documented planned promotion: `develop` → `main`, `main` → `safety-v3.6.0`
- Added manual action instructions in HANDOFF.md

### 🎯 Impact
- **Clearer workflow**: Easy to start/resume work
- **Better recovery**: PROGRESS.md as anchor after crashes
- **Reduced crashes**: Context overflow prevention tactics
- **Active hygiene**: DocumentHygiene now enforced
- **Role clarity**: Each doc file has clear purpose

### 📝 Next Steps
- Continue Sprint C1 (Component Splitting, 55% complete)
- Follow new workflow guidelines
- Use context management tactics to prevent crashes

---

## [v3.7.0 - Sprint C1 Progress] - 2025-11-02 - Component Refactoring

### 🔄 Sprint C1: Split God Components (55% Complete)
- **Status**: PAUSED after 11/20 hours
- **Target**: AGPGenerator.jsx (1962 lines) → smaller components

### ✅ Completed Tasks
- **Taak 1**: Strategy Planning (2h)
  - Created SPLIT_STRATEGY.md with component hierarchy
  - Identified 3 containers + 5 feature panels
  
- **Taak 2**: Extract Containers (6h)
  - ✅ ModalManager.jsx created (169 lines) - All 7 modals via React portals
  - ✅ DataLoadingContainer.jsx created (250 lines) - All 5 buttons in one row
  - ✅ VisualizationContainer.jsx created (115 lines) - 6 viz sections
  
- **Taak 3**: Extract Features (6h)
  - ⏭️ SKIPPED - Components already exist or don't exist
  - DataImportPanel.jsx ✅ (178 lines) - Already integrated
  - DataExportPanel.jsx ✅ (144 lines) - Already integrated
  - HeroMetricsPanel.jsx ⚠️ (96 lines) - Orphaned, not integrated

### 📊 Impact
- **AGPGenerator.jsx**: 1962 → 1430 lines (-532 lines, -27%)
- **New components**: 3 containers + 2 panels
- **Performance**: Ready for memoization + virtualization

### 🔧 Technical Changes
- Installed `react-window` for table virtualization (ready to use)
- Fixed localStorage + SQLite dual storage issues
- Improved modal rendering via React portals

### ⏸️ Paused Tasks
- **Taak 4**: Table Virtualization (0/3h) - Not started
  - react-window installed and ready
  - Quick wins identified: SensorRow memo + VisualizationContainer memo
  
- **Taak 5**: Testing (0/3h) - Not started

### 📝 Next Session
See `HANDOFF_PAUSE.md` for detailed pickup instructions

---

## [v3.6.0 + Option C] - 2025-11-02 - Development Restructure

### 🏗️ Option C Implementation Started
- **Documentation structure created**: `docs/optionc/`
  - 4 Blocks: A (Docs), B (Safety), C (Robustness), D (Quality)
  - 9 Sprints total, 67 hours implementation
  - Master tracking: `MASTER_PROGRESS.md`
  - Block/sprint specific HANDOFF + PROGRESS files

### 📚 Documentation Overhaul
- **Root docs updated**
  - `START_HERE.md` - Points to `docs/optionc/` hub
  - `HANDOFF.md` - Sprint B1 quick reference
  - `PROGRESS.md` - Session log + tracking
  - `STATUS.md` - What works, known limitations (NEW)
  - `PLAN_VAN_AANPAK.md` - Complete Option C plan (NEW)
  - `GIT_CHEATSHEET.md` - Safety checkpoint workflow

- **Archived old docs**
  - `docs/archive/2025-11/pre-optionc/` - Pre-Option-C backups

### 🔒 Safety Checkpoints
- **Tag created**: `v3.6.0-pre-optionc`
  - Safe fallback point before Option C work
  - Use: `git checkout v3.6.0-pre-optionc`
- **Branch**: `develop` (main work branch)

### 🎯 Current Sprint
- **Sprint B1**: Metrics Validation (7h)
  - Performance benchmarking (3h)
  - Unit tests (4h)
  - Location: `docs/optionc/block-c-robustness/sprint-b1-metrics/`

### 🔍 TIER2 Analysis (Complete)
- **Overall score**: 7.5/10 (solid, actionable issues)
- **6/6 domains analyzed**: A, B, C, D, E, F, G
- **Critical findings**:
  - Domain F: No accessibility (P0 fix needed)
  - Domain G: No JSON import (P0 fix needed)
  - Domain C: God components (P2 refactor)
  - Domain B: No performance tests (P1 validation)

### 📦 Git Commits
- `84aba00` - Pre-Option-C safety checkpoint
- `1f8d211` - Option C structure created
- `7ee57e4` - GIT_CHEATSHEET updated
- `b82f288` - Root docs updated

---

