# Sensor Storage Module - CLEAN REWRITE

**Date**: 2025-11-08  
**Type**: COMPLETE REWRITE (NOT incremental patch)  
**Goal**: Clean, maintainable sensor storage with ZERO legacy baggage

---

## 🎯 CORE PRINCIPLE

**This is a REWRITE, not a migration.**

We are NOT:
- ❌ Maintaining backward compatibility with dev iterations
- ❌ Keeping old code "just in case"
- ❌ Creating compatibility layers for temporary scaffolding
- ❌ Supporting multiple storage formats

We ARE:
- ✅ Writing ONE clean implementation
- ✅ Using ONE clear schema
- ✅ Having ONE source of truth
- ✅ Fixing bugs by design, not patches

---

## 📋 THE PROBLEM

**Current State**: Spaghetti Code
- Status calculated in 4+ different places
- Dual storage (SQLite + localStorage) with complex merge
- Multiple field names for same data (start_timestamp vs start_date)
- Nobody knows what "truth" is anymore
- Bug: Sensor #222 shows FAIL when it should show ACTIVE

**Root Cause**: Too many dev iterations, too many patches, not enough rewrites

---

## 🎯 THE SOLUTION

**Clean Rewrite**:
1. ONE storage location: localStorage
2. ONE schema: Clean, documented
3. ONE status function: Pure, debuggable
4. ONE data format: ISO timestamps, clear fields

**SQLite Database**:
- Role: Dev scaffolding from early build stages
- Purpose: Import historical data ONCE
- Future: Archive it, never touch again
- Import method: Can be done in/outside app, doesn't matter

**Priority**: Functionality over everything
- Get sensors working correctly
- Clean code that's maintainable
- No legacy compatibility needed

---

## 📊 DATA MIGRATION

### What We're Importing
- 219 sensors from SQLite (handmade work, must preserve)
- 6 sensors from current localStorage
- Batch assignments
- Lock states

### How We're Importing
- One-time operation
- Read SQLite export JSON
- Transform to clean V4 schema
- Write to localStorage
- Archive SQLite database
- Never touch it again

### After Import
- All 225 sensors in clean V4 format
- All equal (no "historical" vs "recent")
- All editable (lock = verification, not access control)
- SQLite archived in docs/archive/

---

## 🏗️ CLEAN SCHEMA

```javascript
{
  version: "4.0.0",
  sensors: [
    {
      // Identity
      sensor_id: string | number,
      sequence: number,  // Display: #222
      
      // Lifecycle (ISO timestamps!)
      start_date: "2025-11-04T04:40:26.000Z",
      end_date: "2025-11-08T10:00:00.000Z" | null,
      
      // Performance
      duration_hours: number | null,
      duration_days: number | null,
      is_success: boolean | null,
      reason_stop: string | null,
      
      // Hardware
      lot_number: string | null,
      hw_version: string | null,
      fw_version: string | null,
      
      // Metadata
      confidence: "high" | "medium" | "low",
      notes: string,
      
      // Verification
      is_locked: boolean,
      
      // Stock
      batch_id: string | null,
      
      // Audit
      created_at: ISO timestamp,
      updated_at: ISO timestamp,
      source: "sqlite" | "csv_detection" | "manual"
    }
  ],
  
  batches: [...],
  deleted_sensors: [...]
}
```

**Key Decisions**:
- ISO timestamps EVERYWHERE (no more "2025-10-19 01:01:07" vs "2025-11-04T04:40:26.000Z")
- `is_locked` not `is_manually_locked` (simpler)
- `batch_id` on sensor (not separate assignments array)
- `is_success` not `success` or `status` (clear boolean)

---

## 🔧 CLEAN API

```javascript
// Status (THE source of truth)
calculateSensorStatus(sensor)

// CRUD
getAllSensors()
getSensorById(id)
addSensor(data)
updateSensor(id, updates)
deleteSensor(id)  // Soft delete

// Lock
toggleSensorLock(id)
setSensorLock(id, boolean)

// Batch
getAllBatches()
addBatch(data)
assignBatchToSensor(sensorId, batchId)

// Import/Export
exportData()
importData(json)
```

**No**:
- ❌ No "compat" functions
- ❌ No "legacy" support
- ❌ No multiple ways to do same thing
- ❌ No "getManualLockStatus" vs "getSensorLockStatus"

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Write Clean Storage Module ✅
- `sensorStorageV4.js` - Pure, clean implementation
- No references to old code
- No compatibility checks
- Just clean, working code

### Phase 2: Write Clean Migration Script ✅
- Read SQLite export
- Read localStorage export  
- Transform to V4
- Write once
- Done

### Phase 3: Rewrite UI Components
- SensorHistoryPanel.jsx
- SensorRow.jsx
- Any other component using sensors

**Approach**: 
- Delete old imports
- Import V4 storage
- Rewrite component to use clean API
- Test
- Ship

**NO**:
- ❌ No compatibility layers
- ❌ No "adapter" patterns
- ❌ No "wrapper" functions
- ❌ Just rewrite it properly

---

## 🎯 SUCCESS CRITERIA

**Before**:
- 3484 lines of spaghetti
- Status calculated in 4+ places
- Bug: Sensor #222 shows FAIL
- Merge/dedup complexity
- Dual storage confusion

**After**:
- ~1500 lines of clean code
- Status calculated in ONE place
- Bug fixed: Sensor #222 shows ACTIVE
- No merge/dedup (single storage)
- Clear, maintainable, debuggable

---

## 📝 RULES FOR THIS REWRITE

1. **No Backward Compatibility**
   - Old dev iterations don't matter
   - We're not maintaining museum code
   - Clean slate

2. **No Compatibility Layers**
   - No "compat.js" files
   - No "adapter" patterns
   - If UI needs different API, rewrite UI

3. **No Multiple Ways**
   - One way to do each thing
   - One schema
   - One format
   - One truth

4. **SQLite is History**
   - Import once
   - Archive forever
   - Never reference again

5. **Functionality First**
   - Working code > elegant architecture
   - But also: clean code > patched code
   - No "let me just add one more patch"

---

## 🚧 CURRENT STATUS

**Completed**:
- ✅ Clean V4 storage module written
- ✅ Clean migration script written
- ✅ Backups created

**Now**:
- 🚧 Rewrite UI components to use V4
- ⏳ Delete old storage files
- ⏳ Run migration
- ⏳ Archive SQLite

**Next Session**: Can be "make it pretty" or "add features" - but foundation is CLEAN.

---

**END OF HANDOFF**

This is a REWRITE. Treat it like one.
