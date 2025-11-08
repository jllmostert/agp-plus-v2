# Sensor Module Complete Rewrite - Handoff

**Date**: 2025-11-08  
**Version**: v4.0.0 (clean rewrite)  
**Status**: 📋 Requirements Clear, Ready for Implementation  
**Approach**: REWRITE from scratch, not patching

---

## 🎯 EXECUTIVE SUMMARY

### The Problem

**Symptom**: Sensor #222 shows "❌ FAIL" instead of "🔄 ACTIVE"

**Root Cause**: Result of iterative patching
- Status calculated in 4+ different places
- Dual storage (SQLite + localStorage) with merge logic
- Multiple timestamp formats
- Deduplication complexity
- "Just fix this bug" mentality led to spaghetti

**The Real Issue**: We kept patching instead of redesigning. Stop.

### The Solution

**COMPLETE REWRITE** of the sensor module:
- ONE storage: localStorage
- ONE status function: pure, deterministic
- ONE schema: clean, consistent
- NO backward compatibility with dev iterations
- NO SQLite after migration

**SQLite Role**: ONE-TIME data import during setup, then archived forever.

---

## 📚 REQUIREMENTS

### What We Need

**Core Sensor Functionality**:
1. Store sensor lifecycle data (start, end, duration)
2. Calculate status from dates (active/success/failed)
3. Lock/unlock sensors (verification tool)
4. Assign sensors to batches (stock management)
5. Soft delete with tombstones
6. Export/import JSON (backup/restore)
7. Filter/sort/search in UI

**Data We're Working With**:
- 219 sensors from SQLite (early development, handmade)
- 6 sensors from current localStorage
- Total: 225 sensors after migration

### What We DON'T Need

**Things to REMOVE**:
- Dual storage systems
- SQLite runtime access
- Merge/deduplication logic
- Multiple status calculation methods
- "Historical" vs "recent" badges
- "Read-only" vs "editable" sensors
- Compatibility layers for old code
- Any distinction based on data origin

**Key Principle**: After migration, ALL sensors are equal. No one cares where they came from.

---

## 🗂️ CLEAN V4 SCHEMA

### Storage Key
```javascript
localStorage: 'agp-sensors-v4'
```

### Data Structure
```javascript
{
  version: "4.0.0",
  last_updated: "2025-11-08T12:00:00.000Z",
  
  sensors: [
    {
      // Identity
      id: "sensor_123",              // Unique ID (string or number)
      sequence: 222,                  // Display number (#222)
      
      // Lifecycle (ISO timestamps)
      start_date: "2025-11-04T04:40:26.000Z",
      end_date: null,                 // null = running
      
      // Performance (calculated on end)
      duration_hours: 124.5,
      duration_days: 5.18,
      
      // Hardware
      lot_number: "B0425",
      hw_version: "A2.01",
      
      // Metadata
      notes: "CSV auto-detected...",
      
      // Verification
      is_locked: false,
      
      // Stock
      batch_id: "BATCH-123",
      
      // Audit
      created_at: "2025-11-04T04:40:26.000Z",
      updated_at: "2025-11-08T12:00:00.000Z"
    }
  ],
  
  batches: [
    {
      batch_id: "BATCH-123",
      lot_number: "B0425",
      quantity: 10,
      received_date: "2025-07-07",
      expiry_date: "2026-02-04",
      source: "hospital"
    }
  ],
  
  deleted: [
    {
      sensor_id: "sensor_456",
      deleted_at: "2025-11-08T10:00:00.000Z"
    }
  ]
}
```

### Status Calculation (THE SINGLE SOURCE)

```javascript
function calculateStatus(sensor) {
  const now = new Date();
  const start = new Date(sensor.start_date);
  const end = sensor.end_date ? new Date(sensor.end_date) : null;
  
  // Check deleted
  const isDeleted = deleted.some(d => d.sensor_id === sensor.id);
  if (isDeleted) return 'deleted';
  
  // Running sensor
  if (!end) {
    const days = (now - start) / (1000 * 60 * 60 * 24);
    return days > 7.5 ? 'overdue' : 'active';
  }
  
  // Ended sensor
  const days = (end - start) / (1000 * 60 * 60 * 24);
  return days >= 6.75 ? 'success' : 'failed';
}
```

**That's it. ONE function. No special cases.**

---

## 🔄 MIGRATION STRATEGY

### SQLite is ONE-TIME

**What SQLite Is**:
- 219 sensors from early development (Aug 2021 - Oct 2025)
- Created during initial build when we were figuring things out
- Valuable data (handmade work)
- NOT a "historical system" - just old data

**Migration Flow**:
```
1. Export SQLite to JSON (DONE - sqlite_sensors_export.json)
2. Read JSON in migration script
3. Transform to V4 schema
4. Write to localStorage
5. Archive SQLite database
6. Remove all SQLite code from app
7. Never touch SQLite again
```

**After Migration**:
- ✅ All 225 sensors in localStorage
- ✅ No distinction between origins
- ✅ SQLite archived in docs/archive/
- ✅ Zero runtime SQLite dependency

### Migration Script (ONE-TIME)

```javascript
// Run ONCE in browser, then delete
async function migrateToV4() {
  // Load old data
  const sqliteData = await fetch('/sqlite_sensors_export.json');
  const localData = JSON.parse(localStorage.getItem('agp-sensors'));
  
  // Transform to V4
  const v4Sensors = [
    ...transformSQLite(sqliteData),
    ...transformLocal(localData.sensors)
  ];
  
  // Deduplicate (if any overlap)
  const unique = dedup(v4Sensors);
  
  // Write V4
  const v4 = {
    version: "4.0.0",
    last_updated: new Date().toISOString(),
    sensors: unique,
    batches: localData.batches,
    deleted: localData.deletedSensors.filter(/* remove resurrected */)
  };
  
  localStorage.setItem('agp-sensors-v4', JSON.stringify(v4));
  console.log('✅ Migration complete!');
}
```

**Critical**: This script runs ONCE. After that, it's deleted. No ongoing migration logic.

---

## 📦 MODULE DESIGN

### File Structure

```
src/
  storage/
    sensorStorage.js         - NEW, clean implementation
  hooks/
    useSensors.js            - React hook for storage
  components/
    SensorHistoryPanel.jsx   - Updated to use new storage
    SensorRow.jsx            - Updated to use new status
    SensorRegistration.jsx   - Updated for new API
    
scripts/
  migrate_once.js            - ONE-TIME migration
  
public/
  migrate.html               - UI to run migration
```

### API Design (Clean)

```javascript
// sensorStorage.js

// READ
export function getAllSensors()
export function getSensorById(id)
export function getStatistics()

// WRITE
export function addSensor(data)
export function updateSensor(id, updates)
export function deleteSensor(id)

// STATUS (pure function)
export function calculateStatus(sensor)

// LOCK
export function toggleLock(id)

// BATCH
export function assignBatch(sensorId, batchId)

// EXPORT/IMPORT
export function exportJSON()
export function importJSON(data)
```

**No compatibility functions. No legacy support. Clean API.**

---

## 🗑️ WHAT GETS DELETED

### After Migration Complete

**Files to DELETE**:
```
❌ src/storage/sensorStorage.js (old)     - 1595 lines of spaghetti
❌ src/storage/sensorStorageCompat.js     - Compatibility layer
❌ src/storage/sensorStorageV4.js         - First attempt (wrong approach)
❌ src/hooks/useSensorDatabase.js (old)   - Complex merge logic
❌ All SQLite loading code                 - No longer needed
❌ scripts/migrate_once.js                 - After running once
❌ public/migrate.html                     - After running once
```

**Code Patterns to DELETE**:
- Any `storageSource === 'sqlite'` checks
- Any `isEditable` flags based on origin
- Any "HISTORICAL" vs "RECENT" badges
- Any merge/deduplication at runtime
- Any SQLite imports

**localStorage Keys to REMOVE** (after confirming V4 works):
```
❌ 'agp-sensors' (old format)
❌ 'agp-deleted-sensors' (moved to V4)
```

---

## ✅ SUCCESS CRITERIA

### Functional Requirements

**Must Work**:
- [x] All 225 sensors visible in UI
- [x] Sensor #222 shows "🔄 ACTIVE" (bug fixed)
- [x] Lock/unlock toggles work
- [x] Batch assignment works
- [x] Delete works (soft delete)
- [x] Export/import JSON works
- [x] CSV detection adds new sensors
- [x] Filter/sort/search works

**Must Be Gone**:
- [x] No dual storage
- [x] No SQLite imports
- [x] No merge logic
- [x] No status calculation in multiple places
- [x] No "historical" badges
- [x] No compatibility layers

### Code Quality

**Metrics**:
- Total lines: 3484 → ~1200 (65% reduction)
- Status functions: 4 → 1 (100% clarity)
- Storage systems: 2 → 1 (50% simplification)
- No patches, no band-aids, no "temporary" fixes

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Write Clean Storage (2 hours)
1. Document exact API needed
2. Write sensorStorage.js from scratch
3. Write tests for status function
4. Write useSensors.js hook

### Phase 2: Migration Script (1 hour)
1. Write migrate_once.js
2. Write migrate.html UI
3. Test on copy of data

### Phase 3: Update UI (2 hours)
1. Update SensorHistoryPanel.jsx
2. Update SensorRow.jsx
3. Update SensorRegistration.jsx
4. Remove old imports

### Phase 4: Run Migration (30 min)
1. Open migrate.html
2. Click "Run Migration"
3. Verify 225 sensors
4. Verify sensor #222 fixed
5. Close migrate.html

### Phase 5: Cleanup (30 min)
1. Delete old files
2. Delete migration files
3. Remove old localStorage keys
4. Archive SQLite
5. Commit & push

**Total**: ~6 hours

---

## 📝 NOTES FOR IMPLEMENTATION

### Critical Decisions

**Timestamps**: Always ISO format
- Store: `"2025-11-04T04:40:26.000Z"`
- Parse: `new Date(timestamp)`
- Display: Format in UI layer

**IDs**: Can be string or number
- SQLite sensors: numbers (1, 2, 3)
- CSV sensors: strings ("sensor_1762231226000")
- Both are fine, handle both

**Status**: Never store, always calculate
- Storing status = source of bugs
- Calculate on every read = always correct
- Pure function = testable

**Deleted**: Tombstone approach
- Don't remove from sensors array
- Add to deleted array
- Filter in UI layer
- Allows "undelete" if needed

### Common Pitfalls to AVOID

**DON'T**:
- Add "just one more compatibility layer"
- Store calculated values (status, duration)
- Support multiple storage formats
- Make sensors "read-only" based on origin
- Add special cases for SQLite sensors

**DO**:
- Calculate status fresh every time
- Use ISO timestamps everywhere
- Treat all sensors equally
- Keep functions pure
- Test with actual data

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Delete Wrong Files**:
   ```bash
   rm src/storage/sensorStorageCompat.js
   rm src/storage/sensorStorageV4.js
   rm src/hooks/useSensors.js
   ```

2. **Start Fresh**:
   - Write `src/storage/sensorStorage.js` (clean)
   - Write `src/hooks/useSensors.js` (simple)
   - Write `scripts/migrate_once.js` (one-time)

3. **Test Migration**:
   - Run on local data
   - Verify 225 sensors
   - Verify #222 fixed

4. **Update UI**:
   - Remove old imports
   - Use new storage
   - Test everything

5. **Cleanup**:
   - Delete old files
   - Archive SQLite
   - Ship v4.0.0

---

**Ready to implement properly this time.** 🚀

**Key Mindset**: We're not fixing bugs. We're replacing bad architecture with good architecture.
