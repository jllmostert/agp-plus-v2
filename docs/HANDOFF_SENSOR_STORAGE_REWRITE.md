# Sensor Storage Module - Complete Analysis & Rewrite Plan

**Date**: 2025-11-08  
**Version**: Pre-rewrite (v3.9.1)  
**Status**: 🔴 NEEDS REWRITE  
**Author**: Jo Mostert + Claude

---

## 🎯 EXECUTIVE SUMMARY

**Problem**: Sensor #222 (newly detected, still running) shows status "FAIL" instead of "running"

**Root Cause**: Technical debt from multiple development iterations:
- SQLite + localStorage hybrid architecture
- Multiple compatibility layers
- Status calculation scattered across 3+ places
- Unclear data flow and ownership

**Solution**: **Complete rewrite** of sensor storage module
- Single source of truth (localStorage only)
- Keep JSON import/export
- Keep stock batch assignments
- Drop SQLite dependency (archive approach)
- Clean, simple, maintainable

---

## 📊 CURRENT ARCHITECTURE (v3.9.1)

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     USER ACTIONS                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. CSV Upload → Detection → addSensor()                │
│  2. Delete Sensor → deleteSensorWithLockCheck()         │
│  3. Detect Sensors → SensorRegistration.jsx             │
│                                                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  v
┌─────────────────────────────────────────────────────────┐
│              STORAGE LAYER (HYBRID)                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │   SQLite DB      │      │  localStorage     │        │
│  │  (historical)    │      │   (recent)        │        │
│  │                  │      │                   │        │
│  │  - Read-only     │      │  - Editable       │        │
│  │  - >30 days old  │      │  - <30 days old   │        │
│  │  - 1277d history │      │  - Recent sensors │        │
│  └──────────────────┘      └──────────────────┘        │
│           │                         │                    │
│           └─────────┬───────────────┘                    │
│                     │                                    │
│              MERGE + DEDUP                               │
│           (useSensorDatabase)                            │
│                     │                                    │
└─────────────────────┼────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────┐
│                 UI RENDERING                             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  SensorHistoryPanel.jsx                                  │
│      ↓                                                   │
│  SensorRow.jsx → STATUS BADGE                           │
│      ↓                                                   │
│  Calculation:                                            │
│    if (sensor.status === 'running')                     │
│      → '🔄 ACTIVE'                                       │
│    else if (sensor.success)                             │
│      → '✓ OK'                                           │
│    else                                                  │
│      → '❌ FAIL'                                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── storage/
│   ├── sensorStorage.js          ← Main module (1595 lines!)
│   ├── deletedSensorsDB.js       ← IndexedDB for deleted IDs
│   └── stockStorage.js           ← Batch assignments
├── hooks/
│   └── useSensorDatabase.js      ← Loads + merges SQLite + localStorage
├── components/
│   ├── panels/
│   │   └── SensorHistoryPanel.jsx ← UI container
│   ├── SensorRow.jsx              ← Table row with STATUS badge
│   └── SensorRegistration.jsx     ← Detection engine
└── core/
    └── sensor-history-engine.js   ← Stats calculations
```

---

## 🔍 CURRENT IMPLEMENTATION DETAILS

### 1. Storage Layer (`sensorStorage.js`)

**Main Functions**:

```javascript
// CRUD Operations
export function getSensorDatabase()        // Get all sensors from localStorage
export async function addSensor(data)     // Add new sensor (with duplicate check)
export async function deleteSensorWithLockCheck(id) // Delete with lock validation
export async function updateSensorEndTime(id, timestamp) // Update end_date

// Lock Management
export function getManualLockStatus(id)   // Get lock state
export function toggleSensorLock(id)      // Toggle lock
export function initializeManualLocks()   // Init locks for all sensors

// Migration & Sync
export function migrateSensorsToV38()     // Add hw_version + batch fields
export async function syncUnlockedSensorsToLocalStorage(sensors) // SQLite → localStorage
export function calculateHwVersion(date)  // A1.01 vs A2.01 based on date

// Import/Export
export async function exportSensorsToJSON() // Full database backup
export async function importSensorsFromJSON(data, options) // Restore from backup
```

**Data Schema** (localStorage key: `'agp-sensor-database'`):

```javascript
{
  sensors: [
    {
      sensor_id: "sensor_1730704800000",
      start_date: "2025-11-04T05:40:00Z",
      end_date: "2025-11-09T12:00:00Z" | null,  // ← null = running
      duration_hours: 123.5 | null,
      duration_days: 5.15 | null,
      reason_stop: "CHANGE SENSOR" | null,
      success: 1 | 0 | null,  // ← 1=OK, 0=FAIL, null=running
      status: "success" | "failed" | "running",  // ← Text status
      confidence: "high" | "medium" | "low",
      lot_number: "B0425",
      hw_version: "A2.01",
      fw_version: null,
      notes: null,
      sequence: 222,
      batch: "B0425",
      lifecycle: "active" | "ended" | "unknown",  // ← v3.8.0
      is_manually_locked: true | false | undefined,
      storageSource: "localStorage" | "sqlite",  // ← Merge indicator
      isEditable: true | false  // ← Can user edit/delete?
    }
  ],
  inventory: [],
  lastUpdated: "2025-11-08T10:35:00Z",
  stats: {
    totalSensors: 222,
    dateRange: { min: "...", max: "..." }
  }
}
```

**Problem Areas**:

1. **Status calculation scattered**:
   - `addSensor()` sets initial status
   - `calculateSensorStatus()` in `useSensorDatabase.js` recalculates
   - `SensorRow.jsx` renders based on `status` + `success` fields
   - **No single source of truth**

2. **Merge complexity**:
   - SQLite sensors (read-only, historical)
   - localStorage sensors (editable, recent)
   - Deduplication logic (prefer localStorage)
   - **Easy to get out of sync**

3. **Update logic fragile**:
   - `addSensor()` checks if exists: `if (existingIndex === -1)`
   - If exists, UPDATE logic added later (patch on patch)
   - Conditions: `isReactivated = lifecycle === 'active' && !stoppedAt && ...`
   - **Complex boolean logic, error-prone**

---

### 2. Loading Layer (`useSensorDatabase.js`)

**Purpose**: Load sensors from SQLite + localStorage, merge, deduplicate

**Flow**:

```javascript
1. Load SQLite database (sensor_database.db)
2. Query: SELECT * FROM sensors ORDER BY start_timestamp DESC
3. For each SQLite sensor:
   - If no end_date → status = 'running'
   - Add storageSource = 'sqlite'
   - Add isEditable = false

4. Load localStorage sensors (getSensorHistory())
5. For each localStorage sensor:
   - calculateSensorStatus(sensor) → { status, success, duration }
   - Add storageSource = 'localStorage'
   - Add isEditable = true

6. Merge with deduplication:
   - Create Map()
   - Add localStorage sensors first (priority)
   - Add SQLite sensors only if NOT in map
   - Result: Array from map values

7. Sync unlocked sensors to localStorage
   - syncUnlockedSensorsToLocalStorage(allSensors)
   - Filters: <30 days old, not deleted, not in localStorage
   - Adds to localStorage (makes editable)

8. Return merged array to UI
```

**Problem**: 
- `calculateSensorStatus()` runs on EVERY load
- Overwrites whatever `addSensor()` set
- **Status is recalculated, not persisted**

---

### 3. UI Layer (`SensorRow.jsx`)

**Status Badge Rendering**:

```javascript
<td style={{ color: ... }}>
  {sensor.status === 'running' 
    ? '🔄 ACTIVE' 
    : sensor.success 
      ? '✓ OK' 
      : '❌ FAIL'}
</td>
```

**Logic**:
1. Check `sensor.status === 'running'` → ACTIVE
2. Else check `sensor.success` (1 or 0) → OK or FAIL

**Problem**:
- Depends on BOTH `status` and `success` fields
- If `status !== 'running'` but `success === null` → FAIL (wrong!)
- If `end_date` exists but `status === 'running'` → confusion

**Sensor #222 Issue**:
```javascript
{
  sensor_id: "sensor_1730704800000",
  start_date: "2025-11-04T05:40:00Z",
  end_date: null,  // ← Set by addSensor() reactivation fix
  status: "running",  // ← Set by addSensor()
  success: null,  // ← Set by addSensor()
  lifecycle: "active"  // ← Detected correctly
}
```

**But after reload**: `calculateSensorStatus()` might override these values!

---

## 🐛 THE BUG: Why Sensor #222 Shows FAIL

### Timeline

1. **Initial state** (sensor ended):
   ```javascript
   {
     sensor_id: "sensor_1730704800000",
     end_date: "2025-11-09T00:36:00Z",
     status: "failed",
     success: 0,
     lifecycle: "ended"
   }
   ```

2. **User deletes sensor** (`deleteSensorWithLockCheck()`):
   - Removed from localStorage
   - Added to deleted list (IndexedDB)

3. **User uploads new CSV** (sensor still running):
   - Detection engine finds sensor: `lifecycle: "active", stopped_at: null`
   - Calls `addSensor()` with new data

4. **addSensor() logic**:
   ```javascript
   const existingIndex = db.sensors.findIndex(s => 
     s.sensor_id === sensorData.id || 
     s.start_date === sensorData.startTimestamp
   );
   
   if (existingIndex === -1) {
     // New sensor - add it
   } else {
     // Sensor exists - update if reactivated
     const isReactivated = 
       sensorData.lifecycle === 'active' && 
       !sensorData.stoppedAt &&
       (existingSensor.lifecycle === 'ended' || existingSensor.status === 'FAIL');
   }
   ```

5. **Problem**: After deletion, `existingIndex === -1` should be TRUE (sensor is gone)
   - But is it? Need to check if deleted sensor was ACTUALLY removed
   - OR: Detection finds OLD sensor record somehow?

6. **UI refresh**: 
   - `useSensorDatabase()` runs `calculateSensorStatus()`
   - Might recalculate based on old `end_date`?

### Root Cause Hypotheses

**Hypothesis A**: Sensor not actually deleted from localStorage
- `deleteSensorWithLockCheck()` fails silently?
- Old record still exists?

**Hypothesis B**: Detection adds NEW sensor, but old sensor also exists
- Two sensors with same ID?
- Deduplication fails?

**Hypothesis C**: Status recalculation overwrites fix
- `addSensor()` sets `status = 'running'`
- `calculateSensorStatus()` sees `end_date !== null` (old value)
- Overwrites to `status = 'failed'`

**Hypothesis D**: UI doesn't refresh after update
- localStorage updated correctly
- React state not refreshed
- Still showing old data

---

## 💡 WHY REWRITE IS BETTER

### Current Architecture Problems

1. **Dual storage complexity**:
   - SQLite (historical, read-only)
   - localStorage (recent, editable)
   - Sync logic between them
   - Deduplication logic
   - Unclear ownership

2. **Status calculation scattered**:
   - Detection engine calculates
   - `addSensor()` sets
   - `useSensorDatabase()` recalculates
   - UI renders based on fields
   - **No single source of truth**

3. **Technical debt layers**:
   - v1.0: SQLite only
   - v2.0: Add localStorage for recent sensors
   - v3.0: Add deduplication
   - v3.1: Add resurrection fix (deleted sensors list)
   - v3.8: Add lifecycle tracking
   - v3.9: Add reactivation fix
   - **Each layer adds complexity**

4. **Hard to debug**:
   - Data flow unclear
   - State mutations in multiple places
   - Boolean logic complex
   - Need to trace through 5+ files

### Proposed New Architecture

**Single Source of Truth**: localStorage only

```
┌─────────────────────────────────────────┐
│           localStorage                   │
│                                          │
│  {                                       │
│    sensors: [...]  ← All sensors here   │
│    batches: [...]  ← Stock assignments  │
│    deleted: [...]  ← Tombstones         │
│  }                                       │
│                                          │
└─────────────────────────────────────────┘
           │
           v
    Simple CRUD API
           │
           v
         UI
```

**Benefits**:
1. ✅ **Simple**: One storage, one API, clear flow
2. ✅ **Fast**: Synchronous reads, no merge needed
3. ✅ **Debuggable**: Check localStorage directly
4. ✅ **Maintainable**: One place to change
5. ✅ **Reliable**: No sync issues, no deduplication bugs

**Keep**:
- JSON export/import (full database backup/restore)
- Stock batch assignments
- Deleted sensors tombstones
- Lock system

**Drop**:
- SQLite dependency (archive old database as JSON)
- Dual storage sync logic
- Complex deduplication
- calculateSensorStatus() duplication

---

## 📋 REWRITE PLAN

### Phase 1: Archive Current System

**Goal**: Save all data before rewrite

**Steps**:
1. Export current SQLite database:
   ```bash
   cp /Users/jomostert/Documents/Projects/agp-plus/public/sensor_database.db \
      /Users/jomostert/Documents/Projects/agp-plus/docs/archive/sensor_database_2025-11-08.db
   ```

2. Export current localStorage:
   ```javascript
   const backup = {
     sensors: localStorage.getItem('agp-sensor-database'),
     deleted: localStorage.getItem('agp-deleted-sensors'),
     stock: localStorage.getItem('agp-stock-database'),
     patient: localStorage.getItem('agp-patient-info')
   };
   
   // Save to: docs/archive/localStorage_2025-11-08.json
   ```

3. Create JSON export of ALL sensors (SQLite + localStorage):
   - Use existing `exportSensorsToJSON()`
   - Save to: `docs/archive/sensors_complete_2025-11-08.json`

**Deliverable**: Complete backup of all sensor data

---

### Phase 2: Design New Schema

**Goal**: Simple, clear schema for localStorage-only storage

**Schema**:

```javascript
{
  version: "4.0.0",  // Schema version
  lastUpdated: "2025-11-08T12:00:00Z",
  
  sensors: [
    {
      // Identity
      sensor_id: "sensor_1730704800000",  // Unique ID (timestamp-based)
      
      // Lifecycle
      start_date: "2025-11-04T05:40:00Z",  // ISO timestamp
      end_date: "2025-11-09T12:00:00Z" | null,  // null = running
      is_running: true | false,  // Derived from end_date
      
      // Performance
      duration_hours: 123.5 | null,  // Calculated on end
      duration_days: 5.15 | null,    // Calculated on end
      success: true | false | null,  // null = running, true = ≥6.75d, false = <6.75d
      reason_stop: "CHANGE SENSOR" | "SENSOR ERROR" | null,
      
      // Hardware
      lot_number: "B0425" | null,
      hw_version: "A2.01" | null,  // Auto-calculated from start_date
      fw_version: null,
      
      // Metadata
      confidence: "high" | "medium" | "low",  // Detection confidence
      notes: null,
      sequence: 222,  // Chronological index
      
      // Batch assignment
      batch_id: "batch_123" | null,  // Foreign key to batches array
      
      // Lock system
      is_locked: false,  // User can lock to prevent deletion
      
      // Audit
      created_at: "2025-11-04T05:40:00Z",
      updated_at: "2025-11-08T12:00:00Z"
    }
  ],
  
  batches: [
    {
      batch_id: "batch_123",
      lot_number: "B0425",
      quantity: 5,
      received_date: "2025-10-01",
      expiry_date: "2026-10-01",
      notes: null
    }
  ],
  
  deleted: [
    {
      sensor_id: "sensor_1234567890",
      deleted_at: "2025-11-08T10:00:00Z"
    }
  ],
  
  stats: {
    totalSensors: 222,
    runningSensors: 1,
    successRate: 0.55,
    avgDuration: 5.8,
    dateRange: {
      min: "2021-09-15T00:00:00Z",
      max: "2025-11-08T12:00:00Z"
    }
  }
}
```

**Key Simplifications**:
1. **is_running**: Derived from `end_date === null` (no separate `status` field)
2. **success**: Simple boolean (true/false/null), no integer encoding
3. **No lifecycle field**: Just use `is_running`
4. **No storageSource/isEditable**: Everything is editable
5. **Audit fields**: Track when created/updated

---

### Phase 3: Implement New Module

**File**: `src/storage/sensorStorageV4.js`

**API**:

```javascript
// Initialization
export function initSensorStorage()

// CRUD
export function getAllSensors()
export function getSensor(sensorId)
export function addSensor(sensor)
export function updateSensor(sensorId, updates)
export function deleteSensor(sensorId)

// Status helpers
export function calculateStatus(sensor)  // Pure function
export function isRunning(sensor)        // Pure function
export function isSuccess(sensor)        // Pure function

// Lock system
export function toggleLock(sensorId)
export function isLocked(sensorId)

// Batch management
export function assignBatch(sensorId, batchId)
export function unassignBatch(sensorId)

// Import/Export
export function exportToJSON()
export function importFromJSON(data, mode = 'merge')

// Stats
export function getStats()
```

**Design Principles**:
1. **Pure functions** for calculations (no side effects)
2. **Single responsibility** per function
3. **Clear error handling** (return { success, error })
4. **Immutable updates** (copy-on-write)
5. **Validation** on all inputs

---

### Phase 4: Migrate Data

**Goal**: Load old data into new schema

**Steps**:

1. **Import from JSON backup**:
   ```javascript
   const oldData = JSON.parse(oldBackup);
   const newData = migrateToV4(oldData);
   localStorage.setItem('agp-sensors-v4', JSON.stringify(newData));
   ```

2. **Migration function**:
   ```javascript
   function migrateToV4(oldData) {
     return {
       version: "4.0.0",
       lastUpdated: new Date().toISOString(),
       sensors: oldData.sensors.map(s => ({
         sensor_id: s.sensor_id,
         start_date: s.start_date,
         end_date: s.end_date,
         is_running: !s.end_date,  // ← Clear derivation
         duration_hours: s.duration_hours,
         duration_days: s.duration_days,
         success: s.success === 1 ? true : s.success === 0 ? false : null,
         reason_stop: s.reason_stop,
         lot_number: s.lot_number,
         hw_version: s.hw_version,
         confidence: s.confidence,
         sequence: s.sequence,
         batch_id: null,  // Reset, user can reassign
         is_locked: s.is_manually_locked || false,
         created_at: s.start_date,
         updated_at: new Date().toISOString()
       })),
       batches: oldData.batches || [],
       deleted: oldData.deleted || [],
       stats: calculateStats(sensors)
     };
   }
   ```

---

### Phase 5: Update UI

**Goal**: Use new API in all components

**Changes**:

1. **useSensorDatabase.js** → **useSensors.js**:
   ```javascript
   export function useSensors() {
     const [sensors, setSensors] = useState([]);
     
     useEffect(() => {
       const data = getAllSensors();
       setSensors(data);
     }, []);
     
     const reload = () => {
       const data = getAllSensors();
       setSensors(data);
     };
     
     return { sensors, reload };
   }
   ```

2. **SensorRow.jsx** status rendering:
   ```javascript
   {isRunning(sensor)
     ? '🔄 ACTIVE'
     : isSuccess(sensor)
       ? '✓ OK'
       : '❌ FAIL'}
   ```

3. **SensorRegistration.jsx** detection:
   ```javascript
   candidates.forEach(c => {
     addSensor({
       sensor_id: c.timestamp,
       start_date: c.timestamp,
       end_date: c.stopped_at,
       is_running: !c.stopped_at,
       // ... rest
     });
   });
   ```

---

### Phase 6: Testing

**Manual Tests**:
1. ✅ Add new sensor (detection)
2. ✅ Sensor shows as RUNNING (🔄 ACTIVE)
3. ✅ Upload CSV with sensor end → status changes to OK/FAIL
4. ✅ Delete sensor → removed from list
5. ✅ Re-detect same sensor → shows as RUNNING again
6. ✅ Export JSON → valid backup
7. ✅ Import JSON → data restored correctly
8. ✅ Lock sensor → can't delete
9. ✅ Unlock sensor → can delete
10. ✅ Assign batch → assignment persists

**Edge Cases**:
- Sensor with no end_date → RUNNING ✓
- Sensor with end_date < 6.75d → FAIL ✓
- Sensor with end_date ≥ 6.75d → OK ✓
- Delete + Re-detect → RUNNING (no ghost FAIL) ✓
- Import merge mode → no duplicates ✓
- Import replace mode → clean slate ✓

---

## 🎯 ACCEPTANCE CRITERIA

**Before Rewrite**:
- [x] Complete handoff document written
- [x] Current system fully documented
- [x] Bug clearly analyzed
- [x] New design approved

**After Rewrite**:
- [ ] All sensor data backed up (JSON + DB)
- [ ] New module implemented (`sensorStorageV4.js`)
- [ ] Data migration successful
- [ ] UI updated to use new API
- [ ] All tests passing
- [ ] Sensor #222 bug fixed (RUNNING, not FAIL)
- [ ] Export/Import working
- [ ] Stock batches preserved
- [ ] No regressions

**Success Metrics**:
- Code reduced from 1595 lines → ~500 lines
- Status calculation in ONE place (pure function)
- Zero dual-storage complexity
- Clear, debuggable data flow
- Fast UI updates (no merge/dedup overhead)

---

## 📚 REFERENCES

**Current Files**:
- `src/storage/sensorStorage.js` (1595 lines)
- `src/storage/deletedSensorsDB.js` (IndexedDB wrapper)
- `src/storage/stockStorage.js` (batch assignments)
- `src/hooks/useSensorDatabase.js` (349 lines)
- `src/components/panels/SensorHistoryPanel.jsx` (1275 lines)
- `src/components/SensorRow.jsx` (265 lines)
- `src/components/SensorRegistration.jsx` (detection engine)

**Documentation**:
- `DUAL_STORAGE_ANALYSIS.md` (Architecture analysis)
- `HANDOFF_VANILLA.md` (Project overview)
- `minimed_780g_ref.md` (Device specs)
- `metric_definitions.md` (CGM metrics)

---

**Next Steps**: 
1. Review this handoff
2. Approve new design
3. Create backup of all data
4. Implement `sensorStorageV4.js`
5. Migrate data
6. Update UI
7. Test thoroughly
8. Ship it! 🚀

**Estimated Effort**: 4-6 hours (clean rewrite)  
**Risk**: LOW (full backup, can rollback)  
**Benefit**: HIGH (bug fixed, maintainable code, clear architecture)

---

**Status**: Ready for rewrite ✅
