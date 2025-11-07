# JSON Import/Export - Complete Handoff & Roadmap

**Version**: v3.9.0 Planning  
**Created**: 2025-11-07  
**Owner**: Jo Mostert  
**Goal**: Complete symmetric data flow with centralized UI

---

## 🎯 EXECUTIVE SUMMARY

**Problem**: AGP+ kan exporteren maar niet importeren → Geen backup/restore  
**Solution**: Symmetric JSON import/export met centralized UI  
**Estimate**: ~8-10 hours total (6h backend, 2-4h UI)  
**Phases**: 3 phases (Foundation, UI, Polish)

**Current State**: 
- ✅ Export: 70% complete (missing 3 data types)
- ❌ Import: 10% complete (only SQLite sensors)
- ❌ Round-trip: NOT POSSIBLE

**Target State**:
- ✅ Export: 100% (all data types)
- ✅ Import: 100% (JSON round-trip)
- ✅ UI: Centralized Data Management section
- ✅ Round-trip: FULLY WORKING

---

## 📊 CURRENT STATE ANALYSIS

### What EXISTS Now ✅

#### IMPORT (3 sources)
1. **Medtronic CSV** ✅
   - File: `src/components/FileUpload.jsx`
   - Parser: `src/core/parsers.js`
   - Status: WORKING
   - UI: Orange "Upload CSV" button

2. **ProTime PDF** ✅
   - File: `src/components/FileUpload.jsx`
   - Parser: `src/utils/pdfParser.js`
   - Status: WORKING
   - UI: Orange "Upload PDF" button (modal with drag & drop)

3. **SQLite Sensor Database** ✅ (read-only)
   - File: `src/storage/sensorImport.js`
   - Source: `/public/sensor_database.db`
   - Status: WORKING (automatic on app load)
   - UI: None (silent background loading)

#### EXPORT (3 types)
1. **AGP Report HTML** ✅
   - File: `src/core/html-exporter.js`
   - Function: `generateHTML()` + `downloadHTML()`
   - Status: WORKING
   - UI: "Download HTML" button in AGP modal

2. **Day Profiles HTML** ✅
   - File: `src/core/day-profiles-exporter.js`
   - Function: `generateDayProfilesHTML()`
   - Status: WORKING
   - UI: "Download HTML" button in Day Profiles modal

3. **JSON Master Dataset** ⚠️ PARTIAL
   - File: `src/storage/export.js`
   - Function: `exportMasterDataset()`
   - Status: WORKING (but incomplete)
   - Missing: ProTime data, Patient info, Stock batches
   - UI: "Export Data" button (somewhere, location unclear)

#### EXPORT UI Components
1. **DataExportModal** ✅ (UI only, no backend)
   - File: `src/components/DataExportModal.jsx`
   - Features: Checkboxes for selective export
   - Status: UI COMPLETE, BACKEND MISSING
   - Categories:
     - [ ] Glucose Readings
     - [ ] Sensor Changes
     - [ ] Cartridge Changes
     - [ ] Insulin Delivery
     - [ ] BG Readings
     - [ ] ProTime Data
     - [ ] Patient Info

---

### What's MISSING ❌

#### IMPORT
1. **JSON Master Dataset Import** ❌
   - No function exists
   - No UI exists
   - Critical gap: Can't restore from backup

2. **JSON Import Validation** ❌
   - No dry-run mode
   - No schema version checking
   - No merge strategy options

3. **Import Progress UI** ❌
   - No progress indicator
   - No success/error reporting

#### EXPORT
4. **Complete Export Data** ❌
   - Missing: ProTime workday data
   - Missing: Patient info
   - Missing: Stock batches

5. **Selective Export Backend** ❌
   - DataExportModal not connected
   - No filtering logic

6. **Export Progress UI** ❌
   - No progress for large datasets
   - No size estimation

#### UI ORGANIZATION
7. **Centralized Data Management** ❌
   - Import buttons scattered (FileUpload component)
   - Export buttons scattered (various modals)
   - No unified "Data Management" section

---

## 🏗️ ARCHITECTURE PLAN

### New File Structure

```
src/
├── components/
│   ├── DataManagementPanel.jsx     (NEW) - Centralized UI
│   ├── DataImportModal.jsx         (NEW) - Import UI
│   ├── DataExportModal.jsx         (EXISTS) - Needs backend connection
│   ├── FileUpload.jsx              (EXISTS) - Keep for CSV/PDF
│   └── ...
├── storage/
│   ├── import.js                   (NEW) - JSON import functions
│   ├── export.js                   (EXISTS) - Needs enhancement
│   └── validation.js               (NEW) - Schema validation
└── core/
    └── merge-strategies.js         (NEW) - Data merge logic
```

---

## 📋 TASK BREAKDOWN - PHASE 1: FOUNDATION (Backend)

**Goal**: Working JSON import/export (no UI polish)  
**Estimate**: ~6 hours  
**Deliverable**: Round-trip works (export → import → data intact)

### 1.1 - Enhanced Export (Complete Data)
**File**: `src/storage/export.js`  
**Estimate**: 45 min  
**Dependencies**: None

**Subtasks**:
- [ ] 1.1.1 - Add ProTime workday data to export (15min)
  ```javascript
  const workdaysRaw = localStorage.getItem('workday-dates');
  const workdays = workdaysRaw ? JSON.parse(workdaysRaw) : [];
  ```
- [ ] 1.1.2 - Add patient info to export (10min)
  ```javascript
  const patientRaw = localStorage.getItem('patient-info');
  const patient = patientRaw ? JSON.parse(patientRaw) : null;
  ```
- [ ] 1.1.3 - Add stock batches to export (10min)
  ```javascript
  const stockBatches = await getStockBatches();
  ```
- [ ] 1.1.4 - Update schema version to "3.9.0" (5min)
- [ ] 1.1.5 - Test export with all data types (5min)

**Verification**:
- [ ] Export JSON file opens in text editor
- [ ] JSON contains `workdays` array
- [ ] JSON contains `patient` object
- [ ] JSON contains `stockBatches` array
- [ ] Schema version is "3.9.0"

---

### 1.2 - JSON Import Function (Core)
**File**: `src/storage/import.js` (NEW)  
**Estimate**: 90 min  
**Dependencies**: None

**Subtasks**:
- [ ] 1.2.1 - Create `import.js` file (5min)
- [ ] 1.2.2 - Implement `importMasterDataset(file)` skeleton (15min)
  - Parse JSON from file
  - Return success/error object
- [ ] 1.2.3 - Import glucose readings to IndexedDB (20min)
  ```javascript
  for (const month of data.months) {
    await storeMonthBucket(month.month, month.readings);
  }
  ```
- [ ] 1.2.4 - Import sensors to localStorage (15min)
  ```javascript
  for (const sensor of data.sensors) {
    await addSensor(sensor);
  }
  ```
- [ ] 1.2.5 - Import cartridges to localStorage (10min)
- [ ] 1.2.6 - Import ProTime workdays to localStorage (10min)
- [ ] 1.2.7 - Import patient info to localStorage (5min)
- [ ] 1.2.8 - Import stock batches to localStorage (10min)

**Verification**:
- [ ] Import function exists and is callable
- [ ] Glucose data appears in IndexedDB
- [ ] Sensors appear in localStorage
- [ ] Cartridges appear in localStorage
- [ ] ProTime data appears in localStorage
- [ ] Patient info appears in localStorage

---

### 1.3 - Validation & Dry-Run
**File**: `src/storage/validation.js` (NEW)  
**Estimate**: 60 min  
**Dependencies**: None

**Subtasks**:
- [ ] 1.3.1 - Create `validation.js` file (5min)
- [ ] 1.3.2 - Implement `validateImportFile(file)` (20min)
  - Check JSON parsing
  - Check schema version
  - Check required fields
- [ ] 1.3.3 - Add data integrity checks (15min)
  - Validate date formats
  - Check array structures
  - Verify data types
- [ ] 1.3.4 - Add warning system (10min)
  - Schema version mismatch warning
  - Optional field missing warning
- [ ] 1.3.5 - Calculate import stats (10min)
  - Count readings, sensors, etc.
  - Estimate storage size

**Verification**:
- [ ] Validation catches invalid JSON
- [ ] Validation catches missing required fields
- [ ] Validation shows warnings (not errors) for minor issues
- [ ] Stats calculation is accurate

---

### 1.4 - Merge Strategies
**File**: `src/core/merge-strategies.js` (NEW)  
**Estimate**: 60 min  
**Dependencies**: 1.2 (import function)

**Subtasks**:
- [ ] 1.4.1 - Create `merge-strategies.js` file (5min)
- [ ] 1.4.2 - Implement REPLACE strategy (15min)
  - Clear all existing data
  - Import new data fresh
- [ ] 1.4.3 - Implement APPEND strategy (20min)
  - Keep existing data
  - Add new data alongside
- [ ] 1.4.4 - Implement SMART_MERGE strategy (20min)
  - Deduplicate by timestamp/ID
  - Keep newest version on conflict

**Verification**:
- [ ] REPLACE clears old data completely
- [ ] APPEND adds without removing
- [ ] SMART_MERGE removes duplicates correctly

---

### 1.5 - Selective Export Backend
**File**: `src/storage/export.js` (UPDATE)  
**Estimate**: 60 min  
**Dependencies**: 1.1 (enhanced export)

**Subtasks**:
- [ ] 1.5.1 - Add `exportWithFeatureMask(selectedFeatures)` function (20min)
  ```javascript
  export async function exportWithFeatureMask(features) {
    const data = { version: "3.9.0", exportDate: new Date().toISOString() };
    if (features.glucose_readings) data.months = await getAllMonthBuckets();
    if (features.sensors) data.sensors = await getSensorHistory();
    // ... etc
    return data;
  }
  ```
- [ ] 1.5.2 - Connect DataExportModal to backend (20min)
  - Wire up onConfirm handler
  - Pass selectedFeatures object
- [ ] 1.5.3 - Add export progress tracking (20min)
  - Count items processed
  - Emit progress events

**Verification**:
- [ ] Export with only glucose works
- [ ] Export with only sensors works
- [ ] Export with all features works
- [ ] DataExportModal triggers correct export

---

### 1.6 - Round-Trip Test
**File**: Manual testing  
**Estimate**: 30 min  
**Dependencies**: 1.1-1.5 (all foundation tasks)

**Test Steps**:
- [ ] 1.6.1 - Export full dataset to JSON (5min)
  - Verify file downloads
  - Open in text editor, check structure
- [ ] 1.6.2 - Clear app state completely (5min)
  - Clear IndexedDB
  - Clear localStorage
  - Refresh app (should be empty)
- [ ] 1.6.3 - Import JSON file (10min)
  - Use import function
  - Wait for completion
- [ ] 1.6.4 - Verify data integrity (10min)
  - Check glucose readings count
  - Check sensors count
  - Check metrics calculations match original
  - Check AGP curve looks identical

**Success Criteria**:
- [ ] Export → Clear → Import → All data restored
- [ ] Metrics match original calculations
- [ ] No console errors
- [ ] No missing data

---

## 📋 TASK BREAKDOWN - PHASE 2: UI (Centralized Interface)

**Goal**: Clean, centralized data management UI  
**Estimate**: ~3 hours  
**Deliverable**: Single "Data Management" panel with all import/export

### 2.1 - DataManagementPanel Component
**File**: `src/components/DataManagementPanel.jsx` (NEW)  
**Estimate**: 60 min  
**Dependencies**: Phase 1 complete

**Design**:
```
┌─────────────────────────────────────────────────────┐
│ 💾 DATA MANAGEMENT                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📥 IMPORT                                           │
│ ┌────────────────┐ ┌────────────────┐             │
│ │ 📄 Upload CSV  │ │ 📆 Upload PDF  │             │
│ └────────────────┘ └────────────────┘             │
│ ┌────────────────────────────────────────────────┐│
│ │ 💾 Import Database (JSON)                      ││
│ └────────────────────────────────────────────────┘│
│                                                     │
│ 📤 EXPORT                                           │
│ ┌────────────────┐ ┌────────────────┐             │
│ │ 📊 AGP Report  │ │ 📈 Day Profiles│             │
│ └────────────────┘ └────────────────┘             │
│ ┌────────────────────────────────────────────────┐│
│ │ 💾 Export Database (JSON)                      ││
│ │    ☐ Select categories...                      ││
│ └────────────────────────────────────────────────┘│
│                                                     │
│ 🗑️ CLEANUP                                          │
│ ┌────────────────────────────────────────────────┐│
│ │ Clear All Data                                  ││
│ └────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Subtasks**:
- [ ] 2.1.1 - Create component skeleton (10min)
- [ ] 2.1.2 - Add brutalist styling (3px borders, monospace) (15min)
- [ ] 2.1.3 - Add IMPORT section with buttons (15min)
  - CSV upload button (reuse FileUpload logic)
  - PDF upload button (reuse FileUpload logic)
  - JSON import button (new)
- [ ] 2.1.4 - Add EXPORT section with buttons (15min)
  - AGP Report button
  - Day Profiles button
  - Database JSON button
- [ ] 2.1.5 - Add CLEANUP section (5min)
  - Clear all data button (with confirmation)

**Verification**:
- [ ] Component renders without errors
- [ ] All buttons are visible
- [ ] Brutalist design matches rest of app
- [ ] Responsive layout (mobile-friendly)

---

### 2.2 - DataImportModal Component
**File**: `src/components/DataImportModal.jsx` (NEW)  
**Estimate**: 90 min  
**Dependencies**: 1.2 (import function), 1.3 (validation)

**Features**:
1. File upload (drag & drop + click)
2. Validation preview (dry-run)
3. Merge strategy selection
4. Import progress indicator
5. Success/error reporting

**Subtasks**:
- [ ] 2.2.1 - Create modal skeleton (10min)
- [ ] 2.2.2 - Add file upload UI (drag & drop) (20min)
  - Click to upload
  - Drag & drop zone
  - File type validation (.json only)
- [ ] 2.2.3 - Add validation preview (20min)
  - Show schema version
  - Show data counts
  - Show warnings/errors
- [ ] 2.2.4 - Add merge strategy selector (15min)
  - Radio buttons: REPLACE / APPEND / SMART_MERGE
  - Descriptions for each strategy
- [ ] 2.2.5 - Add import progress (15min)
  - Progress bar
  - Status text (e.g., "Importing sensors... 5/10")
  - Cancel button
- [ ] 2.2.6 - Add result reporting (10min)
  - Success message with stats
  - Error list (if any)
  - "View Data" button

**Verification**:
- [ ] File upload accepts .json files
- [ ] Validation runs before import
- [ ] Merge strategies work correctly
- [ ] Progress updates during import
- [ ] Success/error messages display correctly

---

### 2.3 - UI Integration
**File**: `src/App.jsx` or main layout  
**Estimate**: 30 min  
**Dependencies**: 2.1, 2.2

**Subtasks**:
- [ ] 2.3.1 - Add DataManagementPanel to app (10min)
  - Place below hero metrics (collapsed by default)
  - Or in Settings section
- [ ] 2.3.2 - Remove scattered import/export buttons (10min)
  - Keep CSV/PDF upload in place (or move)
  - Remove old "Export Data" buttons
  - Point all exports to DataManagementPanel
- [ ] 2.3.3 - Add keyboard shortcuts (10min)
  - Cmd+E: Open export modal
  - Cmd+I: Open import modal

**Verification**:
- [ ] DataManagementPanel is accessible
- [ ] No duplicate import/export buttons
- [ ] Keyboard shortcuts work

---

## 📋 TASK BREAKDOWN - PHASE 3: POLISH (Nice-to-Have)

**Goal**: Professional finish, error handling, UX improvements  
**Estimate**: ~2 hours  
**Deliverable**: Production-ready import/export system

### 3.1 - Error Handling
**Files**: All import/export files  
**Estimate**: 30 min

**Subtasks**:
- [ ] 3.1.1 - Add try-catch to all import functions (10min)
- [ ] 3.1.2 - Add user-friendly error messages (10min)
  - "File is corrupted" instead of "JSON.parse error"
- [ ] 3.1.3 - Add rollback on import failure (10min)
  - If import fails halfway, restore original state

**Verification**:
- [ ] Invalid JSON shows clear error
- [ ] Network errors are caught
- [ ] Partial imports are rolled back

---

### 3.2 - Progress Indicators
**Files**: Import/export modals  
**Estimate**: 30 min

**Subtasks**:
- [ ] 3.2.1 - Add progress for large exports (15min)
  - Show "Exporting month 2/3..."
- [ ] 3.2.2 - Add progress for large imports (15min)
  - Show "Importing 1000/5000 readings..."

**Verification**:
- [ ] Progress updates smoothly
- [ ] Progress reaches 100% on completion

---

### 3.3 - Size Estimation
**Files**: Export functions  
**Estimate**: 20 min

**Subtasks**:
- [ ] 3.3.1 - Calculate export size before download (10min)
  - Show "Estimated file size: 2.3 MB"
- [ ] 3.3.2 - Warn on very large exports (>10MB) (10min)

**Verification**:
- [ ] Size estimation is accurate (±20%)
- [ ] Warning appears for large exports

---

### 3.4 - Documentation
**Files**: README, user guide  
**Estimate**: 40 min

**Subtasks**:
- [ ] 3.4.1 - Write user guide for import/export (20min)
  - How to backup data
  - How to restore data
  - How to transfer between devices
- [ ] 3.4.2 - Write developer docs (20min)
  - JSON schema documentation
  - How to add new export features
  - Version migration guide

**Verification**:
- [ ] User guide is clear
- [ ] Developer docs are accurate

---

## 🎨 UI MOCKUP - DataManagementPanel

### Collapsed State (Default)
```
┌─────────────────────────────────────────────────────┐
│ 💾 DATA MANAGEMENT                            [▼]  │
└─────────────────────────────────────────────────────┘
```

### Expanded State
```
┌─────────────────────────────────────────────────────┐
│ 💾 DATA MANAGEMENT                            [▲]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 📥 IMPORT                                       ││
│ ├─────────────────────────────────────────────────┤│
│ │                                                 ││
│ │ ┌────────────────┐ ┌────────────────┐         ││
│ │ │ 📄 Medtronic   │ │ 📆 ProTime     │         ││
│ │ │    CSV         │ │    PDF         │         ││
│ │ └────────────────┘ └────────────────┘         ││
│ │                                                 ││
│ │ ┌─────────────────────────────────────────────┐││
│ │ │ 💾 Import Database (JSON)                   │││
│ │ │    Restore from backup or transfer data     │││
│ │ └─────────────────────────────────────────────┘││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 📤 EXPORT                                       ││
│ ├─────────────────────────────────────────────────┤│
│ │                                                 ││
│ │ Reports:                                        ││
│ │ ┌────────────────┐ ┌────────────────┐         ││
│ │ │ 📊 AGP Report  │ │ 📈 Day Profiles│         ││
│ │ │    (HTML)      │ │    (HTML)      │         ││
│ │ └────────────────┘ └────────────────┘         ││
│ │                                                 ││
│ │ Database:                                       ││
│ │ ┌─────────────────────────────────────────────┐││
│ │ │ 💾 Export Database (JSON)                   │││
│ │ │    [☑] Glucose  [☑] Sensors  [☑] Insulin   │││
│ │ │    [☐] ProTime  [☐] Patient Info            │││
│ │ │                                    [Export] │││
│ │ └─────────────────────────────────────────────┘││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 🗑️ CLEANUP                                      ││
│ ├─────────────────────────────────────────────────┤│
│ │                                                 ││
│ │ ┌─────────────────────────────────────────────┐││
│ │ │ ⚠️ Clear All Data                            │││
│ │ │    Remove all glucose, sensors, and settings│││
│ │ │                          [⚠️ Clear Data]    │││
│ │ └─────────────────────────────────────────────┘││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] `export.js` - exportMasterDataset() returns valid JSON
- [ ] `export.js` - exportWithFeatureMask() filters correctly
- [ ] `import.js` - importMasterDataset() parses JSON
- [ ] `import.js` - importMasterDataset() handles errors
- [ ] `validation.js` - validateImportFile() catches invalid JSON
- [ ] `validation.js` - validateImportFile() warns on version mismatch
- [ ] `merge-strategies.js` - REPLACE clears old data
- [ ] `merge-strategies.js` - APPEND preserves old data
- [ ] `merge-strategies.js` - SMART_MERGE deduplicates

### Integration Tests
- [ ] Export full dataset → File downloads successfully
- [ ] Export selective (only glucose) → File contains only glucose
- [ ] Import valid JSON → Data appears in app
- [ ] Import + REPLACE → Old data is gone
- [ ] Import + APPEND → Old data remains
- [ ] Import + SMART_MERGE → No duplicates

### Manual Tests
- [ ] Round-trip: Export → Clear → Import → Data intact
- [ ] Transfer: Export on Device A → Import on Device B
- [ ] Selective: Export only sensors → Import → Only sensors restored
- [ ] Error: Import invalid JSON → Clear error message
- [ ] Progress: Large export shows progress
- [ ] UI: All buttons work correctly

---

## 📅 DEVELOPMENT SCHEDULE

### Session 1 (2-3 hours): Foundation Backend
- [x] Task 1.1 - Enhanced Export ✅ (if starting fresh)
- [ ] Task 1.2 - JSON Import Function
- [ ] Task 1.3 - Validation & Dry-Run

**Deliverable**: Can import JSON (basic)

---

### Session 2 (2-3 hours): Merge & Selective
- [ ] Task 1.4 - Merge Strategies
- [ ] Task 1.5 - Selective Export Backend
- [ ] Task 1.6 - Round-Trip Test

**Deliverable**: Full import/export working

---

### Session 3 (2-3 hours): UI
- [ ] Task 2.1 - DataManagementPanel
- [ ] Task 2.2 - DataImportModal
- [ ] Task 2.3 - UI Integration

**Deliverable**: Centralized UI complete

---

### Session 4 (1-2 hours): Polish
- [ ] Task 3.1 - Error Handling
- [ ] Task 3.2 - Progress Indicators
- [ ] Task 3.3 - Size Estimation
- [ ] Task 3.4 - Documentation

**Deliverable**: Production-ready v3.9.0

---

## 🚀 QUICK START (Next Session)

**To begin Phase 1, Task 1.1**:

```bash
# 1. Start server
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001

# 2. Open export.js
# File: src/storage/export.js

# 3. Start with subtask 1.1.1 (Add ProTime data)
```

**First code to write**:
```javascript
// In exportMasterDataset() function
// After line: const cartridges = await getCartridgeHistory();

// Add ProTime workdays
const workdaysRaw = localStorage.getItem('workday-dates');
const workdays = workdaysRaw ? JSON.parse(workdaysRaw) : [];

// Update export object
const exportData = {
  version: "3.9.0",
  exportDate: new Date().toISOString(),
  generator: "AGP+ v3.9.0",
  totalReadings,
  totalMonths: months.length,
  totalSensors: sensors.length,
  totalCartridges: cartridges.length,
  totalWorkdays: workdays.length,  // NEW
  months,
  sensors,
  cartridges,
  workdays  // NEW
};
```

---

## 📊 PROGRESS TRACKER

### Phase 1: Foundation (Backend) - 0/6 tasks complete

**Task 1.1 - Enhanced Export** - ⏳ 0/5 subtasks
- [ ] 1.1.1 - ProTime data
- [ ] 1.1.2 - Patient info
- [ ] 1.1.3 - Stock batches
- [ ] 1.1.4 - Version 3.9.0
- [ ] 1.1.5 - Test export

**Task 1.2 - JSON Import** - ⏳ 0/8 subtasks
- [ ] 1.2.1 - Create file
- [ ] 1.2.2 - Function skeleton
- [ ] 1.2.3 - Import glucose
- [ ] 1.2.4 - Import sensors
- [ ] 1.2.5 - Import cartridges
- [ ] 1.2.6 - Import ProTime
- [ ] 1.2.7 - Import patient
- [ ] 1.2.8 - Import stock

**Task 1.3 - Validation** - ⏳ 0/5 subtasks
- [ ] 1.3.1 - Create file
- [ ] 1.3.2 - Validate function
- [ ] 1.3.3 - Integrity checks
- [ ] 1.3.4 - Warning system
- [ ] 1.3.5 - Stats calculation

**Task 1.4 - Merge Strategies** - ⏳ 0/4 subtasks
- [ ] 1.4.1 - Create file
- [ ] 1.4.2 - REPLACE strategy
- [ ] 1.4.3 - APPEND strategy
- [ ] 1.4.4 - SMART_MERGE strategy

**Task 1.5 - Selective Export** - ⏳ 0/3 subtasks
- [ ] 1.5.1 - Feature mask function
- [ ] 1.5.2 - Connect modal
- [ ] 1.5.3 - Progress tracking

**Task 1.6 - Round-Trip Test** - ⏳ 0/4 subtasks
- [ ] 1.6.1 - Export test
- [ ] 1.6.2 - Clear state
- [ ] 1.6.3 - Import test
- [ ] 1.6.4 - Verify integrity

---

### Phase 2: UI (Centralized Interface) - 0/3 tasks complete

**Task 2.1 - DataManagementPanel** - ⏳ 0/5 subtasks
- [ ] 2.1.1 - Component skeleton
- [ ] 2.1.2 - Brutalist styling
- [ ] 2.1.3 - Import section
- [ ] 2.1.4 - Export section
- [ ] 2.1.5 - Cleanup section

**Task 2.2 - DataImportModal** - ⏳ 0/6 subtasks
- [ ] 2.2.1 - Modal skeleton
- [ ] 2.2.2 - File upload UI
- [ ] 2.2.3 - Validation preview
- [ ] 2.2.4 - Merge strategy selector
- [ ] 2.2.5 - Import progress
- [ ] 2.2.6 - Result reporting

**Task 2.3 - UI Integration** - ⏳ 0/3 subtasks
- [ ] 2.3.1 - Add to app
- [ ] 2.3.2 - Remove scattered buttons
- [ ] 2.3.3 - Keyboard shortcuts

---

### Phase 3: Polish (Nice-to-Have) - 0/4 tasks complete

**Task 3.1 - Error Handling** - ⏳ 0/3 subtasks
- [ ] 3.1.1 - Try-catch blocks
- [ ] 3.1.2 - User-friendly messages
- [ ] 3.1.3 - Rollback on failure

**Task 3.2 - Progress Indicators** - ⏳ 0/2 subtasks
- [ ] 3.2.1 - Export progress
- [ ] 3.2.2 - Import progress

**Task 3.3 - Size Estimation** - ⏳ 0/2 subtasks
- [ ] 3.3.1 - Calculate size
- [ ] 3.3.2 - Warn on large files

**Task 3.4 - Documentation** - ⏳ 0/2 subtasks
- [ ] 3.4.1 - User guide
- [ ] 3.4.2 - Developer docs

---

## 🎯 SUCCESS CRITERIA

**Phase 1 Complete**:
- ✅ Can export full dataset (all data types)
- ✅ Can import JSON file
- ✅ Round-trip works (export → import → data intact)
- ✅ Selective export works (checkboxes filter data)

**Phase 2 Complete**:
- ✅ All import/export in one panel
- ✅ No scattered buttons
- ✅ Clean, professional UI

**Phase 3 Complete**:
- ✅ Error handling is robust
- ✅ Progress indicators work
- ✅ Documentation is complete

**v3.9.0 READY FOR RELEASE**! 🚀

---

## 📝 NOTES & TIPS

### Crash Recovery
- Small tasks (15-20 min each)
- Frequent commits (after each subtask)
- Update this document after each task

### Testing Strategy
- Test each subtask immediately
- Don't move on until current task works
- Keep test CSV/JSON files handy

### UI Guidelines
- Brutalist design (3px borders, monospace)
- High contrast (black/white)
- Mobile-friendly (responsive)
- Accessibility (keyboard navigation)

### Code Quality
- Use TypeScript-style JSDoc comments
- Error handling on all async functions
- Consistent naming conventions
- Small, focused functions

---

**Status**: 📋 READY TO START  
**Next**: Begin Phase 1, Task 1.1 (Enhanced Export)  
**Estimate**: ~8-10 hours total

**End of JSON Import/Export Handoff**
