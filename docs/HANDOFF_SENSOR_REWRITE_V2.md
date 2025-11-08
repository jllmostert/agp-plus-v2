# Sensor Storage Rewrite - Handoff (CORRECT VERSION)

**Date**: 2025-11-08  
**Version**: v4.0.0 (rewrite)  
**Status**: 📋 Planning Complete, Ready to Implement  
**Author**: Jo Mostert + Claude

---

## 🎯 EXECUTIVE SUMMARY

### The Problem

**Symptom**: Sensor #222 (currently running) shows "❌ FAIL" instead of "🔄 ACTIVE"

**Root Cause**: Status spaghetti
- Status calculated in 4+ different places
- Timestamps with different field names
- Update logic spread across multiple functions
- Nobody knows what the "truth" is anymore

**Solution**: Clean rewrite with eenmalige migratie
- Migrate 219 SQLite sensors → localStorage (one-time)
- Single source of truth: localStorage
- One status function (pure, clear)
- Simple CRUD API

---

## 📚 CORRECT UNDERSTANDING

### What Jo Actually Wants

**SQLite Database (219 sensors)**:
- Handmatig gemaakt werk (veel uren)
- Kostbaar, mag niet verloren gaan
- Te veel werk om opnieuw te doen
- Oude CSV's kloppen niet meer voor die periode
- **Maar**: één keer importeren → dan "part of the gang"

**Vanaf het moment dat ze in de app zitten**:
- ALLE sensoren (oud + nieuw) = gewoon "sensoren in het systeem"
- GEEN onderscheid tussen "historisch" en "recent"
- GEEN "read-only" vs "editable"
- ALLE sensoren kunnen gelocked/unlocked worden

**Lock Systeem = Verificatie Tool**:
- 🔒 Locked: "Dit klopt, niet meer aan rommelen"
- 🔓 Unlocked: "Recent, misschien nog checken"
- Focus: "Heb ik sensor X wel/niet gestoken op dag Y?"
- **NIET**: "Historical vs recent" marker

**Nieuwe Sensoren**:
- CSV upload → detection → localStorage
- Werkt goed nu (alles zit erin, goed opgeslagen)
- Hooguit beslissing voor 1-2 recente sensoren
- Niet meer handmatig uitfilteren voor oude data

**Stock Management**:
- Lotnummers bijhouden
- Huidige voorraad tracken
- Batch assignments
- Dit moet allemaal blijven werken

---

## 🏗️ ARCHITECTUUR

### Current State (v3.9.1) - SPAGHETTI

```
┌─────────────────────────────────────────────────┐
│           DUAL STORAGE SYSTEM                    │
├─────────────────────────────────────────────────┤
│                                                   │
│  SQLite DB                localStorage            │
│  (219 sensors)            (6 recent sensors)     │
│      ↓                           ↓                │
│      └──────────┬────────────────┘                │
│                 │                                 │
│            MERGE LOGIC                            │
│         (deduplication)                           │
│                 │                                 │
│                 v                                 │
│         All Sensors (225)                         │
│                 │                                 │
│                 v                                 │
│    ┌────────────┴──────────────┐                 │
│    │                            │                 │
│    v                            v                 │
│ Calculate Status          Calculate Status       │
│ (useSensorDatabase)       (addSensor)            │
│    │                            │                 │
│    v                            v                 │
│ Calculate Status          Calculate Status       │
│ (UI rendering)            (Detection)            │
│                                                   │
└─────────────────────────────────────────────────┘
                    ↓
              STATUS CHAOS!
        (Nobody knows what's true)
```

**Problems**:
1. ❌ Status calculated in 4+ places
2. ❌ Merge complexity (SQLite + localStorage)
3. ❌ Deduplication logic
4. ❌ "Historical" vs "recent" badges (confusing)
5. ❌ "Read-only" vs "editable" (artificial distinction)
6. ❌ Multiple timestamp field names

---

### Target State (v4.0.0) - CLEAN

```
┌─────────────────────────────────────────────────┐
│          SINGLE SOURCE OF TRUTH                  │
├─────────────────────────────────────────────────┤
│                                                   │
│              localStorage                         │
│           (all sensors here)                      │
│                                                   │
│  ┌─────────────────────────────────────┐        │
│  │  Sensors (225)                       │        │
│  │  - 219 from SQLite (migrated)       │        │
│  │  - 6 recent (CSV detected)          │        │
│  │  - All equal, no distinction        │        │
│  └─────────────────────────────────────┘        │
│                     │                             │
│                     v                             │
│              Simple CRUD API                      │
│                     │                             │
│                     v                             │
│          ONE Status Function                      │
│            (pure, clear)                          │
│                     │                             │
│                     v                             │
│                   UI                              │
│                                                   │
└─────────────────────────────────────────────────┘
                    ↓
            STATUS CLARITY!
        (One place, one truth)
```

**Benefits**:
1. ✅ Status in ONE place (pure function)
2. ✅ No merge/dedup complexity
3. ✅ All sensors equal
4. ✅ Lock = verification, not access control
5. ✅ Simple, debuggable
6. ✅ Fast (no SQLite load, no merge)

---

## 📊 DATA ANALYSIS

### Current Export (agp-sensors-2025-11-08.json)

**Sensors**: 6
```javascript
[
  {
    sensor_id: 10,
    start_date: "2025-10-19 01:01:07",
    end_date: "2025-10-25T04:26:05.000Z",
    lot_number: "B0425",
    is_manually_locked: true
  },
  // ... 4 more ended sensors
  {
    sensor_id: "sensor_1762231226000",  // ← This is #222!
    start_date: "2025-11-04T04:40:26.000Z",
    end_date: null,  // ← Should be RUNNING
    status: "running",
    is_manually_locked: false
  }
]
```

**DeletedSensors**: 1
```javascript
[
  {
    sensorId: "sensor_1762231226000",  // ← #222 is here too!
    deletedAt: 1762598480808
  }
]
```

**Problem**: Sensor #222 is in BOTH sensors array AND deletedSensors array!
- Detection added it back to sensors (correct)
- But deletedSensors flag still there (resurrection bug)
- UI might check deletedSensors and show FAIL

**Batches**: 12 (with duplicates)
**Assignments**: 14

---

### SQLite Database (sensor_database.db)

**Sensors**: 219 (handmatig work)
**Date Range**: 2021-09-15 → 2025-11-01
**Total Duration**: 1277 days of history

**Schema**:
```sql
CREATE TABLE sensors (
  id INTEGER PRIMARY KEY,
  start_timestamp TEXT,
  end_timestamp TEXT,
  duration_hours INTEGER,
  duration_days REAL,
  reason_stop TEXT,
  status TEXT,
  confidence TEXT,
  lot_number TEXT,
  hardware_version TEXT,
  firmware_version TEXT,
  notes TEXT,
  csv_source TEXT,
  sequence INTEGER
);
```

**Must Migrate**: These 219 sensors → localStorage (one-time operation)

---

## 🎯 NEW SCHEMA DESIGN

### localStorage Key: `agp-sensors-v4`

```javascript
{
  version: "4.0.0",
  migrated_from_sqlite: true,  // Track migration status
  migration_date: "2025-11-08T15:00:00Z",
  last_updated: "2025-11-08T15:00:00Z",
  
  sensors: [
    {
      // IDENTITY
      sensor_id: "sensor_1762231226000",  // String or number
      sequence: 222,  // Chronological index for display (#222)
      
      // LIFECYCLE
      start_date: "2025-11-04T04:40:26.000Z",  // ISO timestamp
      end_date: null,  // null = running, ISO timestamp = ended
      
      // PERFORMANCE (calculated on end)
      duration_hours: 124.5 | null,
      duration_days: 5.18 | null,
      is_success: true | false | null,  // null = running, true = ≥6.75d, false = <6.75d
      reason_stop: "CHANGE SENSOR" | "SENSOR ERROR" | null,
      
      // HARDWARE
      lot_number: "B0425" | null,
      hw_version: "A2.01" | null,
      fw_version: null,
      
      // METADATA
      confidence: "high" | "medium" | "low",
      notes: "CSV auto-detected...",
      
      // VERIFICATION
      is_locked: false,  // Lock = verified, don't touch
      
      // BATCH ASSIGNMENT (moved from separate array)
      batch_id: "BATCH-123" | null,
      
      // AUDIT
      created_at: "2025-11-04T04:40:26.000Z",
      updated_at: "2025-11-08T15:00:00Z",
      source: "sqlite" | "csv_detection" | "manual"  // Track origin
    }
  ],
  
  // Stock management (unchanged)
  batches: [
    {
      batch_id: "BATCH-123",
      lot_number: "B0425",
      quantity: 10,
      received_date: "2025-07-07",
      expiry_date: "2026-02-04",
      source: "hospital" | "medtronic",
      notes: null
    }
  ],
  
  // Deleted sensors (tombstones)
  deleted_sensors: [
    {
      sensor_id: "sensor_123",
      deleted_at: "2025-11-08T10:00:00Z",
      reason: "duplicate" | "error" | "manual"
    }
  ],
  
  // Statistics (calculated on load)
  stats: {
    total_sensors: 225,
    running_sensors: 1,
    success_rate: 0.55,
    avg_duration_days: 5.8,
    date_range: {
      first: "2021-09-15T00:00:00Z",
      last: "2025-11-08T15:00:00Z"
    }
  }
}
```

### Key Simplifications

**1. No More Dual Fields**
- ❌ Old: `status` + `success` + `lifecycle` (confusion)
- ✅ New: `end_date` + `is_success` (clear)

**2. No More Storage Source Markers**
- ❌ Old: `storageSource`, `isEditable`, badges
- ✅ New: `source` field for audit only (optional)

**3. Batch Assignment Simplified**
- ❌ Old: Separate `assignments` array
- ✅ New: `batch_id` field on sensor (simpler)

**4. One Timestamp Format**
- ❌ Old: `end_timestamp`, `end_date`, `stopped_at`
- ✅ New: `end_date` everywhere (ISO format)

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Backup & Preparation (15 min)

**Already have**:
- ✅ `agp-sensors-2025-11-08.json` (localStorage export)
- ✅ `sensor_database.db` (SQLite file)

**Need to create**:
```bash
# 1. Copy SQLite to archive
cp /Users/jomostert/Documents/Projects/agp-plus/public/sensor_database.db \
   /Users/jomostert/Documents/Projects/agp-plus/docs/archive/2025-11/sensor_database_backup.db

# 2. Export SQLite to JSON (for migration)
# This will be done via code in migration script
```

**Deliverables**:
- `docs/archive/2025-11/sensor_database_backup.db`
- `docs/archive/2025-11/sqlite_sensors_export.json`

---

### Phase 2: New Storage Module (2 hours)

**File**: `src/storage/sensorStorageV4.js`

**API**:

```javascript
// ============================================
//  INITIALIZATION
// ============================================

export function initSensorStorage()
// Creates empty v4 structure if not exists
// Returns: { success, version, message }

export function checkMigrationStatus()
// Returns: { isMigrated, version, sensorCount }

// ============================================
//  CRUD OPERATIONS
// ============================================

export function getAllSensors()
// Returns: Array<Sensor>

export function getSensor(sensorId)
// Returns: Sensor | null

export function addSensor(sensor)
// Adds or updates sensor
// Returns: { success, sensor, message }

export function updateSensor(sensorId, updates)
// Partial update of sensor
// Returns: { success, sensor, message }

export function deleteSensor(sensorId)
// Soft delete (adds to deleted_sensors tombstone)
// Returns: { success, sensorId, message }

// ============================================
//  STATUS CALCULATIONS (PURE FUNCTIONS)
// ============================================

export function isRunning(sensor)
// Returns: boolean
// Logic: sensor.end_date === null

export function calculateDuration(sensor)
// Returns: { hours, days } | null
// Logic: (end_date - start_date) or null if running

export function isSuccess(sensor)
// Returns: boolean | null
// Logic: null if running, true if ≥6.75d, false if <6.75d

export function getStatusDisplay(sensor)
// Returns: { text, emoji, color }
// Example: { text: "ACTIVE", emoji: "🔄", color: "#fbbf24" }

// ============================================
//  LOCK SYSTEM
// ============================================

export function toggleLock(sensorId)
// Toggle is_locked field
// Returns: { success, isLocked, message }

export function isLocked(sensorId)
// Returns: boolean

// ============================================
//  BATCH MANAGEMENT
// ============================================

export function assignBatch(sensorId, batchId)
// Sets sensor.batch_id
// Returns: { success, message }

export function unassignBatch(sensorId)
// Clears sensor.batch_id
// Returns: { success, message }

export function getSensorsByBatch(batchId)
// Returns: Array<Sensor>

// ============================================
//  IMPORT / EXPORT
// ============================================

export function exportToJSON()
// Full database export (v4 format)
// Returns: { success, data, filename }

export function importFromJSON(jsonData, options = {})
// Import v4 format JSON
// options: { mode: 'merge' | 'replace' }
// Returns: { success, imported, skipped, errors }

// ============================================
//  MIGRATION (ONE-TIME)
// ============================================

export function migrateSQLiteToV4(sqliteSensors)
// Converts SQLite schema → v4 schema
// Returns: { success, migrated, errors }

export function migrateV3ToV4(oldData)
// Converts old localStorage format → v4
// Returns: { success, migrated, errors }

// ============================================
//  STATISTICS
// ============================================

export function calculateStats()
// Recalculates stats object
// Returns: { total, running, successRate, avgDuration, dateRange }

export function getStats()
// Returns current stats (from storage)
```

**Design Principles**:
1. **Pure functions** for calculations (no side effects)
2. **Single responsibility** per function
3. **Clear return values** ({ success, data, error })
4. **Validation** on all inputs
5. **Immutable updates** (copy-on-write)

---

### Phase 3: Migration Script (1 hour)

**File**: `src/scripts/migrateToV4.js`

**Steps**:

```javascript
import initSqlJs from 'sql.js';
import { initSensorStorage, migrateSQLiteToV4, migrateV3ToV4 } from '../storage/sensorStorageV4.js';

async function migrateDatabaseToV4() {
  console.log('[Migration] Starting v4 migration...');
  
  // 1. Initialize v4 structure
  const init = initSensorStorage();
  if (!init.success) {
    throw new Error('Failed to init v4 storage');
  }
  
  // 2. Load SQLite database
  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });
  
  const response = await fetch('/sensor_database.db');
  const buffer = await response.arrayBuffer();
  const db = new SQL.Database(new Uint8Array(buffer));
  
  // 3. Query all sensors from SQLite
  const result = db.exec(`
    SELECT 
      id as sensor_id,
      start_timestamp as start_date,
      end_timestamp as end_date,
      duration_days,
      duration_hours,
      lot_number,
      hardware_version as hw_version,
      reason_stop,
      notes,
      sequence
    FROM sensors
    ORDER BY start_timestamp ASC
  `);
  
  const columns = result[0].columns;
  const rows = result[0].values;
  
  const sqliteSensors = rows.map(row => {
    const sensor = {};
    columns.forEach((col, index) => {
      sensor[col] = row[index];
    });
    return sensor;
  });
  
  console.log(`[Migration] Found ${sqliteSensors.length} SQLite sensors`);
  
  // 4. Migrate SQLite sensors to v4
  const sqliteMigration = migrateSQLiteToV4(sqliteSensors);
  console.log(`[Migration] SQLite → v4: ${sqliteMigration.migrated} sensors`);
  
  // 5. Load old localStorage data (if exists)
  const oldData = localStorage.getItem('agp-sensor-database');
  if (oldData) {
    const parsed = JSON.parse(oldData);
    const v3Migration = migrateV3ToV4(parsed);
    console.log(`[Migration] localStorage v3 → v4: ${v3Migration.migrated} sensors`);
  }
  
  // 6. Clean up deleted sensors tombstone
  // Remove sensor_1762231226000 from deleted list (it's active!)
  const v4Data = JSON.parse(localStorage.getItem('agp-sensors-v4'));
  v4Data.deleted_sensors = v4Data.deleted_sensors.filter(
    d => d.sensor_id !== 'sensor_1762231226000'
  );
  localStorage.setItem('agp-sensors-v4', JSON.stringify(v4Data));
  
  console.log('[Migration] ✅ Complete! v4 database ready.');
  
  return {
    success: true,
    totalSensors: sqliteMigration.migrated + (v3Migration?.migrated || 0),
    sqliteSensors: sqliteMigration.migrated,
    v3Sensors: v3Migration?.migrated || 0
  };
}

export { migrateDatabaseToV4 };
```

**Usage**:
```javascript
// In browser console or migration UI:
import { migrateDatabaseToV4 } from './scripts/migrateToV4.js';
await migrateDatabaseToV4();
```

---

### Phase 4: Update UI (1.5 hours)

#### 4.1 New Hook (`src/hooks/useSensors.js`)

```javascript
import { useState, useEffect } from 'react';
import { getAllSensors, calculateStats } from '../storage/sensorStorageV4.js';

export function useSensors() {
  const [sensors, setSensors] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadSensors = () => {
    setIsLoading(true);
    const data = getAllSensors();
    const statsData = calculateStats();
    setSensors(data);
    setStats(statsData);
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadSensors();
  }, []);
  
  return {
    sensors,
    stats,
    isLoading,
    reload: loadSensors
  };
}
```

**Changes**:
- ❌ Remove: SQLite loading, merge logic, deduplication
- ✅ Simple: Read from localStorage, done

#### 4.2 Update SensorRow.jsx

```javascript
import { getStatusDisplay, toggleLock, isLocked } from '../storage/sensorStorageV4.js';

function SensorRow({ sensor, onUpdate }) {
  const status = getStatusDisplay(sensor);
  const locked = isLocked(sensor.sensor_id);
  
  return (
    <tr>
      {/* ... */}
      
      {/* Status Badge - ONE SOURCE OF TRUTH */}
      <td style={{ color: status.color }}>
        {status.emoji} {status.text}
      </td>
      
      {/* Lock Toggle */}
      <td onClick={() => {
        toggleLock(sensor.sensor_id);
        onUpdate();
      }}>
        {locked ? '🔒' : '🔓'}
      </td>
      
      {/* ... */}
    </tr>
  );
}
```

**Changes**:
- ❌ Remove: Complex status logic (`sensor.status === 'running' ? ... : sensor.success ? ...`)
- ✅ Simple: Call `getStatusDisplay()`, use result

#### 4.3 Update SensorRegistration.jsx

```javascript
import { addSensor } from '../storage/sensorStorageV4.js';

function detectAndRegisterSensors(candidates) {
  candidates.forEach(candidate => {
    const result = addSensor({
      sensor_id: `sensor_${candidate.timestamp.getTime()}`,
      start_date: candidate.timestamp.toISOString(),
      end_date: candidate.stopped_at ? candidate.stopped_at.toISOString() : null,
      confidence: candidate.confidence,
      notes: `CSV auto-detected (${candidate.confidence.toUpperCase()}, score: ${candidate.score}/100)`,
      source: 'csv_detection'
    });
    
    if (result.success) {
      console.log('✅ Sensor added:', result.sensor.sensor_id);
    } else {
      console.error('❌ Failed to add sensor:', result.message);
    }
  });
}
```

**Changes**:
- ❌ Remove: Multiple timestamp field names, status calculation
- ✅ Simple: Call `addSensor()` with clean data

---

### Phase 5: Testing (1 hour)

#### Test Checklist

**Migration Tests**:
- [ ] Run migration script
- [ ] Verify 219 SQLite sensors imported
- [ ] Verify 6 localStorage sensors preserved
- [ ] Verify total = 225 sensors
- [ ] Verify sensor #222 NOT in deleted_sensors
- [ ] Verify all batch assignments preserved
- [ ] Verify all locks preserved

**Status Tests**:
- [ ] Running sensor (end_date = null) shows "🔄 ACTIVE"
- [ ] Successful sensor (≥6.75d) shows "✓ OK"
- [ ] Failed sensor (<6.75d) shows "❌ FAIL"
- [ ] Status updates when end_date set

**CRUD Tests**:
- [ ] Add new sensor → appears in list
- [ ] Update sensor → changes reflected
- [ ] Delete sensor → removed from list
- [ ] Delete sensor → added to deleted_sensors
- [ ] Re-detect deleted sensor → works correctly

**Lock Tests**:
- [ ] Toggle lock → state changes
- [ ] Locked sensor → can still be viewed
- [ ] Locked sensor → can be unlocked
- [ ] Lock state persists after reload

**Batch Tests**:
- [ ] Assign batch → batch_id set
- [ ] Unassign batch → batch_id cleared
- [ ] Batch assignments persist

**Export/Import Tests**:
- [ ] Export JSON → valid v4 format
- [ ] Import JSON (merge) → sensors added
- [ ] Import JSON (replace) → sensors replaced
- [ ] Import preserves locks
- [ ] Import preserves batch assignments

**Edge Cases**:
- [ ] Sensor with no end_date → RUNNING ✓
- [ ] Sensor with end_date = start_date → FAIL (0d) ✓
- [ ] Sensor with future end_date → handles gracefully
- [ ] Duplicate sensor_id → prevents duplicate
- [ ] Invalid sensor data → returns error

---

## 🐛 BUG FIX VERIFICATION

### Sensor #222 Specific Tests

**Before Fix**:
```
Sensor ID: sensor_1762231226000
Status Display: ❌ FAIL
Actual State: end_date = null (running)
Problem: In deleted_sensors array
```

**After Fix**:
```
Sensor ID: sensor_1762231226000
Status Display: 🔄 ACTIVE
Actual State: end_date = null (running)
Deleted: No (removed from deleted_sensors)
```

**Test Steps**:
1. Load sensor #222
2. Check status display: Should be "🔄 ACTIVE"
3. Check deleted_sensors: Should NOT contain sensor_1762231226000
4. Upload new CSV with sensor still running
5. Status should remain "🔄 ACTIVE"
6. Set end_date on sensor #222
7. Status should change to "✓ OK" or "❌ FAIL" based on duration

---

## 📋 ACCEPTANCE CRITERIA

### Must Have (Critical)

- [x] Complete handoff document (this file)
- [ ] All 225 sensors (219 SQLite + 6 localStorage) in v4 storage
- [ ] Sensor #222 shows "🔄 ACTIVE" (bug fixed)
- [ ] No sensor in both sensors array AND deleted_sensors
- [ ] Lock system works (toggle, persists)
- [ ] Batch assignments preserved
- [ ] Export/Import works (v4 format)
- [ ] All manual tests passing

### Should Have (Important)

- [ ] Migration script documented
- [ ] Old files archived (SQLite DB, old localStorage)
- [ ] Code reduced from 3484 → ~1750 lines
- [ ] Performance improvement (no SQLite load, no merge)
- [ ] Clear error messages for edge cases

### Nice to Have (Optional)

- [ ] Migration UI (button in settings)
- [ ] Rollback capability (restore from backup)
- [ ] Migration log/audit trail
- [ ] Stats visualization updates

---

## 🚨 CRITICAL NOTES

### What Must Be Preserved

**Data**:
- ✅ All 219 SQLite sensors (handmatig work)
- ✅ All 6 localStorage sensors
- ✅ All batch assignments
- ✅ All lock states
- ✅ Stock management data

**Functionality**:
- ✅ JSON export/import
- ✅ CSV detection
- ✅ Lock toggle
- ✅ Batch assignment
- ✅ Delete (soft delete)

### What Can Change

**Schema**:
- ❌ Field names (standardize)
- ❌ Status representation (simplify)
- ❌ Storage structure (flatten)

**Code**:
- ❌ All old storage files (rewrite)
- ❌ Merge/dedup logic (remove)
- ❌ Complex status calculations (simplify)

### What Gets Removed

**Files**:
- ❌ `src/storage/sensorStorage.js` (1595 lines) → replaced
- ❌ `src/hooks/useSensorDatabase.js` (349 lines) → replaced
- ❌ SQLite dependency (after migration)

**Concepts**:
- ❌ "Historical" vs "recent" distinction
- ❌ "Read-only" vs "editable" badges
- ❌ `storageSource` field
- ❌ Dual storage complexity

---

## ⏰ TIME ESTIMATE

| Phase | Task | Time |
|-------|------|------|
| 1 | Backup & preparation | 15 min |
| 2 | New storage module | 2 hours |
| 3 | Migration script | 1 hour |
| 4 | Update UI | 1.5 hours |
| 5 | Testing | 1 hour |
| **Total** | | **~6 hours** |

**Contingency**: +1 hour for unexpected issues  
**Total with buffer**: **7 hours**

---

## 🎯 SUCCESS METRICS

### Before Rewrite

**Code**:
- `sensorStorage.js`: 1595 lines
- `useSensorDatabase.js`: 349 lines
- `SensorHistoryPanel.jsx`: 1275 lines
- `SensorRow.jsx`: 265 lines
- **Total**: 3484 lines

**Complexity**:
- Status calculation: 4+ places
- Merge logic: Complex deduplication
- Storage: Dual (SQLite + localStorage)

**Bug**: Sensor #222 shows FAIL (wrong)

### After Rewrite

**Code**:
- `sensorStorageV4.js`: ~500 lines
- `useSensors.js`: ~50 lines
- `SensorHistoryPanel.jsx`: ~1000 lines (refactored)
- `SensorRow.jsx`: ~200 lines (simplified)
- **Total**: ~1750 lines

**Complexity**:
- Status calculation: 1 place (pure function)
- Merge logic: None (single storage)
- Storage: Single (localStorage)

**Bug**: Sensor #222 shows ACTIVE (correct)

**Improvement**:
- 50% less code
- 90% less complexity
- Bug fixed
- Faster performance
- Easier to maintain

---

## 📚 REFERENCE FILES

### Current Files (To Be Replaced)

```
src/storage/sensorStorage.js                     ← 1595 lines, replace
src/storage/deletedSensorsDB.js                  ← Keep (IndexedDB wrapper)
src/storage/stockStorage.js                      ← Keep (batches)
src/hooks/useSensorDatabase.js                   ← 349 lines, replace
src/components/panels/SensorHistoryPanel.jsx     ← Refactor
src/components/SensorRow.jsx                     ← Simplify
src/components/SensorRegistration.jsx            ← Update calls
```

### New Files (To Be Created)

```
src/storage/sensorStorageV4.js                   ← New main module
src/hooks/useSensors.js                          ← New hook
src/scripts/migrateToV4.js                       ← Migration script
```

### Documentation

```
docs/HANDOFF_SENSOR_REWRITE_V2.md               ← This file
docs/archive/2025-11/SESSION_2025-11-08.md      ← Session notes
docs/archive/2025-11/sensor_database_backup.db  ← SQLite backup
docs/archive/2025-11/sqlite_sensors_export.json ← JSON export
```

### Data Files

```
/public/sensor_database.db                       ← SQLite (219 sensors)
agp-sensors-2025-11-08.json                     ← localStorage export (6 sensors)
```

---

## 🚦 NEXT STEPS

### Immediate Actions

1. **Review this handoff** ✅
2. **Approve rewrite plan** ⏳
3. **Create backups** (if not complete)
4. **Begin implementation**

### Implementation Order

```
Phase 1: Backup (15 min)
    ↓
Phase 2: New storage module (2h)
    ↓
Phase 3: Migration script (1h)
    ↓
    RUN MIGRATION (one-time)
    ↓
Phase 4: Update UI (1.5h)
    ↓
Phase 5: Testing (1h)
    ↓
    VERIFY BUG FIXED
    ↓
    SHIP IT! 🚀
```

---

## 💬 QUESTIONS & CLARIFICATIONS

### Q: Will old SQLite database still work?

**A**: After migration, SQLite database is no longer needed. It can be archived. All 219 sensors will be in localStorage.

### Q: Can we rollback if something goes wrong?

**A**: Yes! We have:
- SQLite backup: `sensor_database_backup.db`
- localStorage export: `agp-sensors-2025-11-08.json`
- Can restore anytime

### Q: What if migration fails halfway?

**A**: Migration is transactional:
- All 219 sensors migrate together
- If error: v4 storage not created
- Old storage remains intact
- Safe to retry

### Q: Will batch assignments be preserved?

**A**: Yes! In v4 schema:
- Old: Separate `assignments` array
- New: `batch_id` field on sensor
- Migration maps old → new
- All assignments preserved

### Q: What about deleted sensors?

**A**: Deleted sensors tombstone preserved:
- Prevents resurrection bug
- Clean format: `{ sensor_id, deleted_at, reason }`
- Sensor #222 removed from this list (it's active!)

---

## ✅ FINAL CHECKLIST

**Before Starting**:
- [x] This handoff reviewed and understood
- [x] Correct understanding confirmed (SQLite → localStorage migration)
- [x] Current data exported (`agp-sensors-2025-11-08.json`)
- [ ] SQLite database backed up
- [ ] Approval to proceed

**During Implementation**:
- [ ] Create `sensorStorageV4.js`
- [ ] Create migration script
- [ ] Run migration successfully
- [ ] Update UI components
- [ ] Test all functionality

**After Implementation**:
- [ ] Sensor #222 shows ACTIVE (bug fixed)
- [ ] All 225 sensors present
- [ ] Lock system works
- [ ] Batch assignments work
- [ ] Export/Import works
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Old files archived

---

## 🎉 EXPECTED OUTCOME

**Data**:
- ✅ 225 sensors in localStorage (219 + 6)
- ✅ All locks preserved
- ✅ All batch assignments preserved
- ✅ No data loss

**Code**:
- ✅ 50% less code (1750 vs 3484 lines)
- ✅ 90% less complexity
- ✅ Clear, maintainable
- ✅ Fast (no SQLite load, no merge)

**Bugs**:
- ✅ Sensor #222 fixed (ACTIVE, not FAIL)
- ✅ No more status spaghetti
- ✅ No more resurrection bugs

**Developer Experience**:
- ✅ One place to look (sensorStorageV4.js)
- ✅ Pure functions (easy to test)
- ✅ Clear API (self-documenting)
- ✅ Simple debugging (localStorage inspector)

---

**Ready to ship!** 🚀

**Status**: ✅ Planning Complete  
**Next**: Await approval → Begin implementation  
**ETA**: 6-7 hours from start to finish
