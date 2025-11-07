# AGP+ Import/Export Overzicht - Complete Analyse

**Date**: 2025-11-07  
**Version**: v3.8.0  
**Purpose**: Volledig overzicht van alle import/export functionaliteit

---

## 📥 IMPORT FUNCTIONALITEIT

### 1. RAW DATA IMPORT (Bronbestanden)

#### 1.1 Medtronic CareLink CSV
**Bestand**: `src/components/FileUpload.jsx`  
**Type**: CSV file upload  
**Formaat**: Medtronic CareLink CSV export (90-dagen data)

**Wat wordt geïmporteerd**:
- Glucose readings (CGM data)
- Sensor changes
- Cartridge changes  
- Insulin delivery (basal + bolus)
- BG readings (vingerprik)
- Alerts & notifications
- Device settings

**Validatie**:
```javascript
if (!text.includes('YYYY/MM/DD') && !text.includes('Sensor Glucose')) {
  error('Not a Medtronic CareLink CSV');
}
```

**Parser**: `src/core/parsers.js` → `parseCSV()`

**Flow**:
```
FileUpload.jsx (upload)
  ↓
parsers.js (parse sections)
  ↓
csvSectionParser.js (parse each section)
  ↓
masterDatasetStorage.js (store in IndexedDB)
```

---

#### 1.2 ProTime PDF (Workday Data)
**Bestand**: `src/components/FileUpload.jsx`  
**Type**: PDF file upload (single or multiple)  
**Formaat**: ProTime timecard export PDF

**Wat wordt geïmporteerd**:
- Workday dates (dagen dat je werkte)
- Voor workday/non-workday split analysis

**Parser**: `src/utils/pdfParser.js` → `extractTextFromPDF()`

**Validatie**:
```javascript
if (!extractedText.includes('Datum') && !extractedText.includes('Week')) {
  error('Not a ProTime PDF');
}
```

**Flow**:
```
FileUpload.jsx (upload)
  ↓
pdfParser.js (extract text)
  ↓
Parse dates from text
  ↓
Store in localStorage (workday-dates)
```

---

### 2. DATABASE IMPORT (Verwerkte Data)

#### 2.1 SQLite Sensor Database Import
**Bestand**: `src/storage/sensorImport.js`  
**Type**: SQLite .db file  
**Formaat**: sensor_database.db (Guardian 4 sensor history)

**Wat wordt geïmporteerd**:
- Sensor change history
- Lot numbers
- Start/end timestamps
- Duration calculations
- Status & confidence scores

**Functie**: `importSensorsFromFile(file)`

**Database Schema** (SQLite):
```sql
SELECT 
  id,
  start_timestamp,
  end_timestamp,
  duration_hours,
  duration_days,
  reason_stop,
  status,
  confidence,
  lot_number,
  notes
FROM sensors
```

**Flow**:
```
SensorImport.jsx (upload .db file)
  ↓
sensorImport.js (read SQLite)
  ↓
sensorStorage.js (convert & store in localStorage)
```

**Status**: ✅ Currently working (read-only from /public/sensor_database.db)

---

#### 2.2 JSON Master Dataset Import
**Bestand**: `src/storage/export.js` (functie ontbreekt nog)  
**Type**: JSON file  
**Formaat**: agp-master-{timestamp}.json

**Wat zou geïmporteerd kunnen worden**:
- Glucose readings (by month buckets)
- Sensor change history
- Cartridge change history
- ProTime workday data
- Patient info
- All metadata

**Current Status**: ❌ **NOT IMPLEMENTED YET**

**Proposed Schema** (JSON):
```json
{
  "version": "3.8.0",
  "exportDate": "2025-11-07T00:00:00Z",
  "generator": "AGP+ v3.8.0",
  "totalReadings": 12345,
  "totalMonths": 3,
  "totalSensors": 10,
  "totalCartridges": 5,
  "months": [...],     // IndexedDB glucose data
  "sensors": [...],    // localStorage sensor history
  "cartridges": [...], // localStorage cartridge history
  "workdays": [...],   // localStorage ProTime data
  "patient": {...}     // localStorage patient info
}
```

**Use Case**: 
- Backup/restore
- Transfer data tussen devices
- Clean install met oude data

---

#### 2.3 Sensor JSON Import (Specific)
**Bestand**: Zou in `src/storage/sensorStorage.js` kunnen  
**Type**: JSON file  
**Formaat**: agp-sensors-{date}.json

**Example Export**:
```json
[
  {
    "sensor_id": "...",
    "started_at": "2025-09-15T...",
    "stopped_at": "2025-09-25T...",
    "lot_number": "...",
    "batch": "...",
    "hw_version": "A2.01",
    "lifecycle": "ended",
    "detection_method": "exact_alert"
  }
]
```

**Current Status**: ❌ **NOT IMPLEMENTED YET**

---

## 📤 EXPORT FUNCTIONALITEIT

### 1. RAPPORTEN (HTML Exports)

#### 1.1 AGP Report (Ambulatory Glucose Profile)
**Bestand**: `src/core/html-exporter.js`  
**Type**: Standalone HTML file  
**Formaat**: AGP_Report_{timestamp}.html

**Wat zit erin**:
- Patient info header
- Date range selector
- Hero metrics (TIR, Mean, CV, GMI, TDD)
- AGP curve (percentiles p5-p95)
- Clinical summary (automated interpretation)
- Time in ranges (TIR/TAR/TBR breakdown)
- Hypoglycemia events table
- Sensor lifecycle table
- Glucose distribution histogram

**Features**:
- ✅ Print-optimized (A4, black/white)
- ✅ Self-contained (no external dependencies)
- ✅ Dynamic Y-axis (250-400 mg/dL based on data)
- ✅ Brutalist design (3px borders, monospace)

**Functie**: `generateHTML(metrics, agpData, ...)`

**Download**: `downloadHTML(htmlContent, filename)`

---

#### 1.2 Day Profiles Report
**Bestand**: `src/core/day-profiles-exporter.js`  
**Type**: Standalone HTML file  
**Formaat**: Day_Profiles_{date}.html

**Wat zit erin**:
- Individual day curves (glucose over 24h)
- Sensor/cartridge change markers
- Hypoglycemia events per day
- AGP reference curve overlay
- Date + metrics per day
- Max 2 A4 pages (3-4 profiles per page)

**Features**:
- ✅ Print-optimized (A4)
- ✅ Dynamic Y-axis (0-250/400 mg/dL)
- ✅ Compact layout (efficient space)
- ✅ Self-contained

**Functie**: `generateDayProfilesHTML(dayProfiles, ...)`

**Download**: Via DayProfilesModal component

---

#### 1.3 Sensor History Report
**Bestand**: `src/core/sensor-history-engine.js` (+ UI in SensorHistoryModal)  
**Type**: UI component (could be exported to HTML/PDF)  
**Formaat**: Table/list view in app

**Wat zit erin**:
- Sensor change history
- Lot numbers / Batch numbers
- Hardware version (A1.01 / A2.01)
- Start/end timestamps
- Lifecycle status (ended/active)
- Detection method (exact_alert/fallback/estimated)
- Duration calculations
- Top 10 most used batches

**Features**:
- ✅ Sortable columns
- ✅ Lock/unlock sensors (manual override)
- ✅ Delete sensors
- ✅ Assign stock batches

**Current Status**: ✅ UI only (no HTML export yet)

**Possible Enhancement**: Export to HTML table (similar to AGP)

---

### 2. DATABASE EXPORTS (Data Backup)

#### 2.1 Master Dataset Export (All Data)
**Bestand**: `src/storage/export.js`  
**Type**: JSON file  
**Formaat**: agp-master-{timestamp}.json

**Functie**: `exportMasterDataset()`

**Wat wordt geëxporteerd**:
- ✅ Glucose readings (IndexedDB, by month)
- ✅ Sensor history (localStorage)
- ✅ Cartridge history (localStorage)
- ❌ ProTime workday data (NOT YET)
- ❌ Patient info (NOT YET)
- ❌ Stock batches (NOT YET)

**Schema** (current):
```json
{
  "version": "3.0",
  "exportDate": "2025-11-07T...",
  "generator": "AGP+ v3.8.0",
  "totalReadings": 12345,
  "totalMonths": 3,
  "totalSensors": 10,
  "totalCartridges": 5,
  "months": [
    {
      "month": "2025-09",
      "readings": [
        {
          "timestamp": "2025-09-15T...",
          "glucose": 142,
          "isig": 12.5
        }
      ]
    }
  ],
  "sensors": [...],
  "cartridges": [...]
}
```

**Status**: ✅ **PARTIALLY IMPLEMENTED**  
**Missing**: ProTime data, Patient info, Stock batches

---

#### 2.2 Selective Feature Export (Feature Mask)
**Bestand**: `src/components/DataExportModal.jsx`  
**Type**: JSON file with selectable categories  
**Formaat**: agp-export-{timestamp}.json

**UI**: Modal with checkboxes for data categories

**Available Categories**:
- [ ] Glucose Readings (CGM data)
- [ ] Sensor Changes (Guardian 4 history)
- [ ] Cartridge Changes (reservoir replacements)
- [ ] Insulin Delivery (basal + bolus)
- [ ] BG Readings (fingerstick tests)
- [ ] ProTime Data (workday schedule)
- [ ] Patient Info (name, DOB, settings)

**Functie**: `onConfirm(selectedFeatures)`

**Status**: ✅ UI COMPLETE, ❌ BACKEND NOT IMPLEMENTED

**Example Selection**:
```json
{
  "glucose_readings": true,
  "sensors": true,
  "cartridges": true,
  "insulin_delivery": true,
  "bg_readings": false,
  "protime_workdays": false,
  "patient_info": false
}
```

**Proposed Export Format**:
```json
{
  "schema_version": "3.8.0",
  "exportDate": "2025-11-07T...",
  "generator": "AGP+ v3.8.0",
  "include": {
    "glucose_readings": true,
    "sensors": true,
    ...
  },
  "data": {
    "glucose_readings": [...],  // Only if included
    "sensors": [...],            // Only if included
    ...
  }
}
```

---

#### 2.3 Sensor-Only Export
**Bestand**: Could be in `src/storage/sensorStorage.js`  
**Type**: JSON file  
**Formaat**: agp-sensors-{date}.json

**Functie**: `exportSensorHistory()` (not yet implemented)

**What it would export**:
```json
[
  {
    "sensor_id": "...",
    "started_at": "2025-09-15T12:34:56Z",
    "stopped_at": "2025-09-25T08:12:34Z",
    "lot_number": "AB12345",
    "batch": "AB12345",
    "hw_version": "A2.01",
    "lifecycle": "ended",
    "detection_method": "exact_alert",
    "is_manually_locked": false,
    "notes": ""
  }
]
```

**Status**: ❌ **NOT IMPLEMENTED**

---

## 🔄 IMPORT/EXPORT SYMMETRY ANALYSIS

### Current State: **ASYMMETRIC** ⚠️

**What CAN be exported**: ✅
- Master dataset (glucose + sensors + cartridges)
- AGP reports (HTML)
- Day profiles (HTML)

**What CANNOT be imported back**: ❌
- Master dataset JSON → No import function
- Sensor JSON → No import function
- ProTime data → No export in master dataset

---

### Proposed Solution: **SYMMETRIC DATA FLOW**

#### Goal: Export → Import Round-Trip

**Scenario**: 
1. User exports all data as JSON
2. User reinstalls app (clean slate)
3. User imports JSON → **Restore complete state**

**Required Changes**:

#### 1. **Add JSON Import Function**

**File**: `src/storage/import.js` (new)

```javascript
/**
 * Import master dataset from JSON export
 * @param {File} file - JSON file from previous export
 * @returns {Promise<{success, stats, errors}>}
 */
export async function importMasterDataset(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validate schema version
    if (data.version !== '3.8.0') {
      console.warn('Schema version mismatch');
    }
    
    // Import month buckets → IndexedDB
    for (const month of data.months) {
      await storeMonthBucket(month.month, month.readings);
    }
    
    // Import sensors → localStorage
    for (const sensor of data.sensors) {
      await addSensor(sensor);
    }
    
    // Import cartridges → localStorage
    for (const cartridge of data.cartridges) {
      await addCartridgeChange(cartridge);
    }
    
    // Import workdays (if present)
    if (data.workdays) {
      localStorage.setItem('workday-dates', JSON.stringify(data.workdays));
    }
    
    // Import patient info (if present)
    if (data.patient) {
      localStorage.setItem('patient-info', JSON.stringify(data.patient));
    }
    
    return {
      success: true,
      stats: {
        readings: data.totalReadings,
        sensors: data.sensors.length,
        cartridges: data.cartridges.length
      }
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [error.message]
    };
  }
}
```

---

#### 2. **Enhance Export to Include All Data**

**File**: `src/storage/export.js`

**Add to `exportMasterDataset()`**:

```javascript
// Add ProTime workdays
const workdaysRaw = localStorage.getItem('workday-dates');
const workdays = workdaysRaw ? JSON.parse(workdaysRaw) : [];

// Add patient info
const patientRaw = localStorage.getItem('patient-info');
const patient = patientRaw ? JSON.parse(patientRaw) : null;

// Add stock batches
const stockBatches = await getStockBatches();

// Enhanced export object
const exportData = {
  version: "3.8.0",
  exportDate: new Date().toISOString(),
  generator: "AGP+ v3.8.0",
  totalReadings,
  totalMonths: months.length,
  totalSensors: sensors.length,
  totalCartridges: cartridges.length,
  totalWorkdays: workdays.length,
  months,
  sensors,
  cartridges,
  workdays,           // NEW
  patient,            // NEW
  stockBatches        // NEW
};
```

---

#### 3. **Add Validation & Dry-Run Mode**

**File**: `src/storage/import.js`

```javascript
/**
 * Validate import file without writing data
 * @param {File} file - JSON file to validate
 * @returns {Promise<{valid, stats, warnings, errors}>}
 */
export async function validateImportFile(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    const warnings = [];
    const errors = [];
    
    // Check schema version
    if (!data.version) {
      errors.push('Missing version field');
    } else if (data.version !== '3.8.0') {
      warnings.push(`Schema version ${data.version} (current: 3.8.0)`);
    }
    
    // Check required fields
    if (!data.months) errors.push('Missing months data');
    if (!data.sensors) errors.push('Missing sensors data');
    
    // Check data integrity
    const monthsValid = Array.isArray(data.months);
    const sensorsValid = Array.isArray(data.sensors);
    
    if (!monthsValid) errors.push('Invalid months format');
    if (!sensorsValid) errors.push('Invalid sensors format');
    
    // Calculate stats
    const stats = {
      readings: data.totalReadings || 0,
      sensors: data.sensors?.length || 0,
      cartridges: data.cartridges?.length || 0,
      workdays: data.workdays?.length || 0
    };
    
    return {
      valid: errors.length === 0,
      stats,
      warnings,
      errors
    };
    
  } catch (error) {
    return {
      valid: false,
      errors: [`File parsing failed: ${error.message}`]
    };
  }
}
```

---

#### 4. **Add Import UI**

**File**: `src/components/DataImportModal.jsx` (new)

**Features**:
- File upload (drag & drop + click)
- Validation preview (dry-run)
- Merge strategy selection:
  - **Replace**: Delete existing data, import new
  - **Append**: Keep existing, add new
  - **Smart Merge**: Deduplicate by timestamp/ID
- Import progress indicator
- Success/error reporting

**UI Flow**:
```
1. User uploads JSON file
   ↓
2. Validate file (dry-run)
   ↓
3. Show preview:
   - Schema version
   - Data counts (readings, sensors, etc.)
   - Warnings (if any)
   ↓
4. User selects merge strategy
   ↓
5. Confirm import
   ↓
6. Import data (with progress)
   ↓
7. Show results (success/errors)
```

---

## 📊 PRIORITY RANKING

### High Priority (Core Functionality)
1. **JSON Import Function** (Task 7.2) - 1 hour
   - Enable restore from backup
   - Implement `importMasterDataset()`
   - Add validation & dry-run

2. **Enhanced Export** - 30 min
   - Include ProTime data
   - Include patient info
   - Include stock batches

### Medium Priority (Better UX)
3. **Import UI Modal** - 1 hour
   - DataImportModal component
   - Drag & drop upload
   - Preview validation results

4. **Selective Export Backend** (Task 7.1) - 1 hour
   - Implement feature mask filtering
   - Connect DataExportModal to backend

### Low Priority (Nice-to-Have)
5. **Sensor-Only Import/Export** - 30 min
   - Quick sensor backup/restore
   - Share sensor history between users

6. **HTML Report Import** - Low priority
   - Parse HTML back to data (complex, not recommended)

---

## 🎯 RECOMMENDATION: v3.9.0 ROADMAP

### Phase 1: Complete Symmetry (Tasks 7.1 & 7.2)
**Goal**: Export → Import round-trip working

**Tasks**:
- [ ] Implement `importMasterDataset()` (1h)
- [ ] Add validation & dry-run (30min)
- [ ] Enhance export to include all data (30min)
- [ ] Implement selective export backend (1h)

**Total**: ~3 hours  
**Result**: Full data portability

---

### Phase 2: Better UX
**Goal**: User-friendly import/export

**Tasks**:
- [ ] Create DataImportModal (1h)
- [ ] Add merge strategy options (30min)
- [ ] Import progress indicator (30min)

**Total**: ~2 hours  
**Result**: Professional backup/restore UX

---

## 💡 USE CASES

### Use Case 1: Backup Before Update
```
1. User: Export all data (JSON)
2. User: Update AGP+ to new version
3. If problems: Import old data (restore)
```

### Use Case 2: Device Transfer
```
1. User on Device A: Export all data
2. User on Device B: Import data
3. Result: Same state on both devices
```

### Use Case 3: Selective Analysis
```
1. User: Export only sensors + glucose
2. Share with healthcare provider
3. Provider imports subset for analysis
```

### Use Case 4: Clean Start with History
```
1. User: Clear browser cache (clean slate)
2. User: Import previous export
3. Result: Fresh app with old data intact
```

---

## 📋 TECHNICAL CHECKLIST

### Export Completeness
- [✅] Glucose readings (IndexedDB months)
- [✅] Sensor history (localStorage)
- [✅] Cartridge history (localStorage)
- [❌] ProTime workday data (localStorage) - **MISSING**
- [❌] Patient info (localStorage) - **MISSING**
- [❌] Stock batches (localStorage) - **MISSING**

### Import Capability
- [❌] JSON master dataset → **NOT IMPLEMENTED**
- [✅] SQLite sensor database → Working (read-only)
- [❌] Sensor JSON → **NOT IMPLEMENTED**
- [❌] Validation before import → **NOT IMPLEMENTED**
- [❌] Merge strategy options → **NOT IMPLEMENTED**

### Symmetry Status
- Export: **70% complete** (missing 3 data types)
- Import: **10% complete** (only SQLite sensors)
- Round-trip: **NOT POSSIBLE YET**

---

## ✅ NEXT STEPS

**For v3.9.0**:

1. **Implement Tasks 7.1 & 7.2** (~3h)
   - JSON import function
   - Validation & dry-run
   - Enhanced export (all data types)
   - Selective export backend

2. **Test Round-Trip** (~1h)
   - Export full dataset
   - Clear app state
   - Import dataset
   - Verify integrity

3. **Document Import/Export** (~30min)
   - User guide
   - Developer docs
   - Schema versioning

**Total Estimate**: ~4.5 hours  
**Result**: Complete data portability for AGP+ v3.9.0

---

**End of Analysis**  
**Status**: Clear path forward for symmetric import/export in v3.9.0
