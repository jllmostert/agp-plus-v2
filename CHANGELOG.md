# Changelog - AGP+ (Ambulatory Glucose Profile Plus)

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [v3.6.1] - 2025-11-02 - Development Setup

### 🏗️ Project Structure
- **v4.0 Development branch created**
  - Main branch: v3.6.0-safe (commit 80fb1fd) - production fallback
  - Develop branch: Active development for v4.0 implementation
  - Full Option C chosen: 67 hours implementation (all P0-P3 sprints)

### 📚 Documentation Overhaul
- **New sprint-based structure**
  - Created `docs/sprints/` with 7 sprint directories
  - Sprint B1 (Metrics Validation) - starting point
  - Sprint A1, F1, G1, C1, C2, F2 prepared
  
- **New root-level guides**
  - `START_HERE.md` - Master navigation (replaces old version)
  - `CURRENT_SPRINT.md` - Active sprint tracking
  - `GIT_CHEATSHEET.md` - Branch switching guide
  - `PLAN_VAN_AANPAK.md` - Complete v4.0 roadmap

- **Archived old versions**
  - Old HANDOFF.md → `docs/archive/v3.6.0-handoffs/`
  - Old START_HERE.md → `docs/archive/v3.6.0-handoffs/`

### 🎯 v4.0 Roadmap
**Phase 1: P1 Sprints** (15h)
- Sprint B1: Metrics Validation (7h) ← Starting here
- Sprint A1: Parser Robustness (8h)

**Phase 2: P0 Sprints** (15h)
- Sprint F1: Chart Accessibility (5h)
- Sprint G1: Backup/Restore Complete (10h)

**Phase 3: P2 Sprints** (30h)
- Sprint C1: Split God Components (20h)
- Sprint C2: Table Virtualization (3h)
- Sprint F2: WCAG Full Compliance (9h)

**Total**: 67 hours across 7 sprints

### 🔍 TIER2 Analysis Complete
- 6/6 domains analyzed (A, B, C, D, E, F, G)
- Overall architecture score: 7.5/10
- 30+ issues identified and prioritized
- All analysis documents in `docs/analysis/`

---

---

## [v3.6.0] - 2025-11-01

### 🔒 Critical Improvements
- **[B.6.4] Comprehensive column validation**
  - Added three-tier validation: required, important, and optional columns
  - Clear console warnings for missing important columns (insulin, carbs, alerts)
  - Informational logging for missing optional columns (BWZ fields, BG readings)
  - Enhanced error messages with actionable guidance for users
  - Validates 13 columns total: 3 required, 4 important, 6 optional
  - Risk reduced: Parser fails gracefully with clear feedback

### ✨ Already Implemented (Previous Sessions)
- **[C2.1] Storage source badges** - COMPLETE ✅
  - "RECENT" (green) badges for localStorage sensors (<30 days)
  - "HISTORICAL" (gray) badges for SQLite sensors (>30 days)
  - Tooltips explaining read-only vs editable sensors
  - Lock toggle automatically disabled for historical sensors
  - Clear visual indication of storage backend

### 📊 Architecture Status
- Parser robustness: **EXCELLENT** (dynamic columns + comprehensive validation)
- Storage clarity: **EXCELLENT** (clear UI indicators)
- Technical debt: **7.5/10** (improving steadily)

### 🧪 Testing
- All validation tested with console.log output
- Expected output: INFO for optional, WARNING for important, ERROR for required
- Graceful degradation for missing non-critical columns

---

## [v3.5.0] - 2025-11-01

### 🧪 Testing & Quality
- **[B.8] Parser test suite** (18/18 tests passing)
  - `detectCSVFormat.test.js`: 8/8 tests ✅
  - `findColumnIndices.test.js`: 5/5 tests ✅
  - `parseCSVMetadata.test.js`: 2/2 tests ✅
  - `parseCSV.test.js`: 3/3 integration tests ✅
  - Edge cases: 7 tests created (deferred to v3.6.0 - need full fixtures)
  
- Test fixtures created (6 files):
  - `valid-6line-header.csv` (17 data lines)
  - `valid-8line-header.csv` (15 data lines)
  - `reordered-columns.csv` (16 data lines)
  - `missing-columns.csv` (partial format)
  - `empty-file.csv` (error testing)
  - `malformed.csv` (error testing)

### 📈 Status
- Block B complete: Dynamic columns + format detection + tests
- Code quality improved: 7.2/10 (from 6.5/10)
- All core parser functionality validated

---

## [v3.4.0] - 2025-11-01

### 🔍 Parser Enhancements
- **[B.7] CSV format version detection** implemented
  - `detectCSVFormat()` dynamically finds header row (no hardcoded line 6!)
  - Extracts device model from Line 0 (e.g., "MiniMed 780G MMT-1886")
  - Extracts serial number from Line 1 (e.g., "NG4114235H")
  - Returns format version, header position, confidence level
  - Adapts to different header lengths (6, 8, or variable lines)
  - Clear console logging for debugging

- Updated `parseCSV()`:
  - Uses `format.headerLineCount` instead of hardcoded `CSV_SKIP_LINES`
  - Logs device model and serial number on every parse
  - Warns if confidence is low
  - Clearer error messages with format context

### 📊 Impact
- Robustness: LOW → VERY LOW RISK
  - ✅ B.6: Handles column reordering
  - ✅ B.7: Handles header structure changes
  - ✅ Detects device model + serial automatically
  - ✅ Graceful degradation with confidence scoring

---

## [v3.3.0] - 2025-11-01

### 🔧 Parser Robustness (Block B.6)
- **[CRITICAL] Dynamic column detection implemented**
  - Created `findColumnIndices()` helper function
  - Replaced all 8 hardcoded column indices with dynamic lookup
  - Added `getColumn()` helper with fallback for backwards compatibility
  - Validates required columns (Date, Time, Sensor Glucose)
  - Clear error messages if columns missing

- **Column mapping**:
  - Before: `row[34]`, `row[18]`, `row[13]` (fragile, hardcoded)
  - After: `columnMap['Sensor Glucose (mg/dL)']` (robust, flexible)
  - Fallback: Uses old indices if column name not found (safety net)

- **Error handling**:
  - Missing column detection with clear error messages
  - Header validation before parsing begins
  - Graceful degradation if header malformed

### 🛡️ Safety & Compatibility
- ✅ Backwards compatible with existing CSVs
- ✅ Tested with 90-day CSV (all metrics correct)
- ✅ No console errors
- ✅ Sensor detection working
- ✅ Risk reduced: MEDIUM-HIGH → LOW

### 📁 Files Changed
- `src/core/parsers.js` (+45 lines, significant refactor)

### 🐛 Known Issues (Non-blocking)
- ⚠️ TDD display missing in some daily profiles (P3 - display only)

---

## [v3.2.0] - 2025-11-01

### 🎨 UI Improvements
- **Section reordering in AGP report**
  - Moved Hero Metrics above Hypoglycemia Events
  - New order: TIR Bar → AGP Chart → Hero Metrics → Hypo Events → Day/Night
  - Goal: Chart + Hero Metrics fit on one screen (no scroll needed)

### 🐛 Bug Fixes
- **Fixed async/await bugs in deleted sensors**
  - Added proper async/await chain in `migrateDeletedSensors()`
  - Fixed `getAllDeletedSensors()` to await `getDeletedSensors()` calls
  - Fixed `useSensorDatabase.js` to await migration call
  - Console clean: No more Promise iteration errors

---

## [v3.1.0] - 2025-10-29

### 🔧 Storage Architecture Improvements
- **Dual storage system with deduplication**
  - SQLite for historical sensors (>30 days, read-only)
  - localStorage for recent sensors (<30 days, editable)
  - Automatic deduplication (prefers localStorage version)
  - Storage source tracking (`storageSource` field)

- **Deleted sensors persistence**
  - Moved from localStorage to IndexedDB (`deletedSensorsDB.js`)
  - Tombstone system prevents resurrection of deleted sensors
  - 90-day expiry for deleted sensor records
  - Migration from old localStorage format

### 🛡️ Lock System Enhancements
- **Three-layer protection**:
  1. Auto-lock: Sensors >30 days (historical data)
  2. Manual lock: User-controlled toggle
  3. Read-only: SQLite sensors (no toggle available)

- **Lock status API**:
  - `getManualLockStatus()`: Returns lock state + reason + editability
  - `toggleSensorLock()`: Validates editability before toggle
  - Clear error messages when toggle fails

### ⚙️ Performance
- **Block A: Performance benchmarking complete**
  - Mean/SD/CV: 3-8ms ✅
  - MAGE: 18-42ms ✅
  - MODD: 24-64ms ✅
  - Total: 60-144ms (target: <1000ms) ✅

### ✅ Validation
- **Glucose bounds filtering** (Block B.1)
  - Skip readings <20 mg/dL (sensor error)
  - Skip readings >600 mg/dL (out of range)
  - Log out-of-bounds counts for debugging

---

## [v3.0.0] - 2025-10-15

### 🎯 Major Release - Two-Phase Upload Flow
- **CSV upload workflow redesigned**
  - Phase 1: Sensor detection with batch suggestions
  - Phase 2: Confirmation + assignment + storage
  - Prevents orphaned sensors (no auto-storage until confirmed)

### 📊 Stock Management
- **Batch auto-assignment**
  - Smart lot number matching with fuzzy logic
  - Confidence scoring (HIGH/MEDIUM/LOW)
  - Manual override available
  - Audit trail (manual vs auto assignments)

### 🔐 Sensor Protection
- **Lock system implemented**
  - Protects historical data from accidental deletion
  - Manual toggle for special cases
  - Clear UI feedback (lock icon + tooltip)

---

## [v2.0.0] - 2025-09-20

### 🎨 AGP Report Generation
- Ambulatory Glucose Profile (AGP) chart with percentile curves
- Hero metrics display (TIR, GMI, CV, MAGE, MODD)
- Day/Night glucose split analysis
- Daily profile modal with 24-hour averages
- Hypoglycemia event tracking
- Export to HTML with embedded styles

### 📊 Metrics Engine
- International Consensus metrics (TIR, TAR, TBR, GMI, CV)
- Advanced variability (MAGE, MODD, GRI)
- Clinical validation (matches published literature)
- Timezone-aware calculations (prevents DST bugs)

### 📂 Data Management
- Guardian 4 sensor tracking
- HW version statistics
- Lot number performance analysis
- Export/import functionality (JSON)

---

## [v1.0.0] - 2025-08-01

### 🚀 Initial Release
- CSV parser for Medtronic CareLink exports
- Basic glucose metrics calculation
- Simple sensor history tracking
- File upload with validation

---

**For detailed implementation notes, see `PROGRESS.md`**  
**For architecture analysis, see `docs/analysis/`**
