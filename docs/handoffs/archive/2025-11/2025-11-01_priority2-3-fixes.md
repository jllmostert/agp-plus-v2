---
tier: 1
status: active
last_updated: 2025-11-01
purpose: Current session state - Priority 2 & 3 fixes after Priority 1 completion
---

# 🎯 HANDOFF - Priority 2 & 3 Architecture Improvements

**Date**: 2025-11-01  
**Session Focus**: Error recovery + maintenance features + documentation  
**Estimated Time**: 3-4 hours total  
**Risk Level**: LOW (logging + cleanup features, non-breaking)

---

## 📍 CONTEXT - WHERE WE ARE

### ✅ COMPLETED: Priority 1 Fixes (v3.1.1)

**Previous Session**: 2025-11-01 (45 minutes)

**Implemented**:
1. ✅ **Batch Capacity Validation** (`stockStorage.js`)
   - Prevents over-assignment of sensors to batches
   - Clear error messages with lot number + capacity
   - Commit: `79b2cfc`

2. ✅ **Storage Source Indicators** (already existed!)
   - `storageSource` field: 'localStorage' | 'sqlite'
   - `isEditable` field for read-only sensors
   - UI badges: "RECENT" (green) vs "HISTORICAL" (gray)
   - Lock toggle disabled for historical sensors
   - No commit needed (already in codebase)

3. ✅ **Sensor ID Collision Prevention** (`masterDatasetStorage.js`)
   - Set-based collision detection
   - Automatic suffix appending (-0, -1, etc.)
   - Console warnings for collisions
   - Commit: `0ffade0`

**Result**: Architecture risk reduced from MEDIUM 🟡 → LOW 🟢

**Documentation**:
- `/docs/analysis/TIER2_SYNTHESIS.md` - Complete architecture analysis (764 lines)
- `/docs/handoffs/2025-10-31_sensor-detection.md` - Previous session archived
- `HANDOFF.md` - Updated with Priority 1 completion

**Git Status**: 7 commits pushed to `main` branch

---

## 🎯 MISSION - PRIORITY 2 & 3 FIXES

### Phase A: Priority 2 - Error Recovery (1 hour)

**Goal**: Add rollback logging for failed upload operations

**Why**: Two-phase upload (sensors → assignments) has no transaction support across IndexedDB + localStorage. If assignment fails mid-loop, we need recovery data.

**What to Build**:
- Rollback record storage on partial failure
- Detailed logging of what was stored successfully
- Clear error messages for users
- Recovery data for manual cleanup

---

### Phase B: Priority 3 - Maintenance (2 hours)

**Goal**: Add housekeeping features for long-term data health

**What to Build**:
1. **Deleted Sensors Cleanup** (1 hour)
   - Add 90-day expiry to deleted sensors list
   - Automatic cleanup on app startup
   - Migration for existing deleted sensors (add timestamps)

2. **localStorage Clear Warning** (30 min)
   - Detect when localStorage is empty on startup
   - Warn user about lost deleted history
   - Optional: Show banner with recovery instructions

3. **Improved Lock Status API** (30 min)
   - Return richer lock status objects
   - Better error messages for read-only sensors
   - UI improvements in error handling

---

### Phase C: Documentation & Release (1 hour)

**What to Update**:
1. **CHANGELOG.md** - Add v3.1.1 release notes
2. **README.md** - Update with new features (if user-facing)
3. **Git commit + push** - Release v3.1.1 to GitHub
4. **Archive handoff** - Move to `/docs/handoffs/`

---

## 🔧 IMPLEMENTATION GUIDE

### ⚡ Priority 2: Error Recovery Logging

#### Fix 2.1: Add Rollback Logging

**Location**: `src/storage/masterDatasetStorage.js`  
**Function**: `completeCSVUploadWithAssignments()` (line ~692)

**Current Code** (simplified):
```javascript
export async function completeCSVUploadWithAssignments(detectedEvents, confirmedAssignments) {
  try {
    await storeSensors(detectedEvents);
    
    const { assignSensorToBatch } = await import('./stockStorage.js');
    for (const { sensorId, batchId } of confirmedAssignments) {
      assignSensorToBatch(sensorId, batchId, 'auto');
    }
    
    await rebuildSortedCache();
    
    return { success: true, sensorsStored: detectedEvents.sensorEvents.length };
  } catch (err) {
    console.error('[completeCSVUploadWithAssignments] Failed:', err);
    throw err;
  }
}
```

**Add Rollback Tracking**:

```javascript
export async function completeCSVUploadWithAssignments(detectedEvents, confirmedAssignments) {
  const startTime = performance.now();
  const storedSensorIds = [];
  const createdAssignmentIds = [];
  
  try {
    // Store sensors (Phase 1)
    await storeSensors(detectedEvents);
    storedSensorIds.push(...detectedEvents.sensorEvents.map(e => {
      // Reconstruct sensor ID (same logic as findBatchSuggestionsForSensors)
      const timestamp = new Date(e.timestamp);
      const year = timestamp.getFullYear();
      const month = String(timestamp.getMonth() + 1).padStart(2, '0');
      const day = String(timestamp.getDate()).padStart(2, '0');
      const hours = String(timestamp.getHours()).padStart(2, '0');
      const minutes = String(timestamp.getMinutes()).padStart(2, '0');
      const seconds = String(timestamp.getSeconds()).padStart(2, '0');
      return `Sensor-${year}-${month}-${day}-${hours}${minutes}${seconds}`;
    }));
    
    debug.log('[completeCSVUploadWithAssignments] Sensors stored:', {
      count: storedSensorIds.length,
      ids: storedSensorIds
    });
    
    // Create batch assignments (Phase 2)
    const { assignSensorToBatch } = await import('./stockStorage.js');
    for (const { sensorId, batchId } of confirmedAssignments) {
      const result = assignSensorToBatch(sensorId, batchId, 'auto');
      createdAssignmentIds.push(result.assignment_id);
    }
    
    debug.log('[completeCSVUploadWithAssignments] Assignments created:', {
      count: createdAssignmentIds.length,
      ids: createdAssignmentIds
    });
    
    // Rebuild cache (Phase 3)
    await rebuildSortedCache();
    
    const duration = performance.now() - startTime;
    debug.log('[completeCSVUploadWithAssignments] Success:', {
      duration: `${duration.toFixed(0)}ms`,
      sensorsStored: storedSensorIds.length,
      assignmentsCreated: createdAssignmentIds.length
    });
    
    return { 
      success: true, 
      sensorsStored: storedSensorIds.length,
      assignmentsCreated: createdAssignmentIds.length,
      duration
    };
    
  } catch (err) {
    // ROLLBACK LOGGING
    const rollbackRecord = {
      timestamp: new Date().toISOString(),
      error: {
        message: err.message,
        stack: err.stack
      },
      progress: {
        sensorsStored: storedSensorIds.length,
        sensorsExpected: detectedEvents.sensorEvents.length,
        assignmentsCreated: createdAssignmentIds.length,
        assignmentsExpected: confirmedAssignments.length
      },
      data: {
        storedSensorIds,
        createdAssignmentIds,
        pendingAssignments: confirmedAssignments.slice(createdAssignmentIds.length)
      }
    };
    
    // Store rollback record for manual recovery
    const recordKey = `agp-failed-upload-${Date.now()}`;
    try {
      localStorage.setItem(recordKey, JSON.stringify(rollbackRecord));
      console.error('[completeCSVUploadWithAssignments] PARTIAL FAILURE - Rollback record saved:', {
        key: recordKey,
        record: rollbackRecord
      });
    } catch (storageErr) {
      console.error('[completeCSVUploadWithAssignments] Failed to save rollback record:', storageErr);
    }
    
    // Enhanced error message for user
    throw new Error(
      `Upload partially failed: ${storedSensorIds.length}/${detectedEvents.sensorEvents.length} sensors stored, ` +
      `${createdAssignmentIds.length}/${confirmedAssignments.length} assignments created. ` +
      `Recovery data saved. Original error: ${err.message}`
    );
  }
}
```

**Testing**:
```javascript
// In browser console - simulate assignment failure:
// 1. Create batch with capacity 1
// 2. Try to upload CSV with 2 sensors + assignments
// 3. Second assignment should fail → rollback record created
// 4. Check localStorage for 'agp-failed-upload-' keys
// 5. Verify record has sensor IDs + partial assignment data
```

**Acceptance Criteria**:
- [ ] Rollback record created on partial failure
- [ ] Record includes: timestamp, error, progress, data
- [ ] Record stored in localStorage with `agp-failed-upload-` prefix
- [ ] Console shows clear error with progress info
- [ ] Enhanced error message shown to user

---

### ⚡ Priority 3.1: Deleted Sensors Cleanup

**Location**: `src/storage/sensorStorage.js`  
**New Function**: Add after existing functions (around line 250)

**Implementation**:

```javascript
/**
 * Clean up old deleted sensor records
 * Removes entries older than specified days (default: 90)
 * Migrates old format (string IDs) to new format ({ sensorId, deletedAt })
 * @param {number} expiryDays - Days after which to expire deleted records
 * @returns {Object} Cleanup statistics
 */
export function cleanupDeletedSensors(expiryDays = 90) {
  const DELETED_SENSORS_KEY = 'agp-deleted-sensors';
  
  try {
    const deleted = JSON.parse(localStorage.getItem(DELETED_SENSORS_KEY) || '[]');
    const now = Date.now();
    const expiryMs = expiryDays * 24 * 60 * 60 * 1000;
    
    debug.log('[cleanupDeletedSensors] Starting cleanup:', {
      totalRecords: deleted.length,
      expiryDays
    });
    
    // Migrate old format to new format with timestamps
    const withTimestamps = deleted.map(entry => {
      if (typeof entry === 'string') {
        // Old format: just sensor ID string
        return {
          sensorId: entry,
          deletedAt: now // Assign current timestamp for old entries
        };
      }
      // New format: already has { sensorId, deletedAt }
      return entry;
    });
    
    // Filter out expired entries
    const active = withTimestamps.filter(entry => {
      const age = now - entry.deletedAt;
      return age < expiryMs;
    });
    
    const removed = withTimestamps.length - active.length;
    const migrated = deleted.filter(e => typeof e === 'string').length;
    
    // Save cleaned list
    localStorage.setItem(DELETED_SENSORS_KEY, JSON.stringify(active));
    
    debug.log('[cleanupDeletedSensors] Cleanup complete:', {
      before: withTimestamps.length,
      after: active.length,
      removed,
      migrated,
      oldestRemaining: active.length > 0 
        ? new Date(Math.min(...active.map(e => e.deletedAt))).toISOString()
        : 'none'
    });
    
    return {
      success: true,
      removed,
      migrated,
      remaining: active.length
    };
    
  } catch (err) {
    console.error('[cleanupDeletedSensors] Failed:', err);
    return {
      success: false,
      error: err.message,
      removed: 0,
      migrated: 0,
      remaining: 0
    };
  }
}
```

**Call on Startup**:

**Location**: `src/hooks/useSensorDatabase.js`  
**Function**: `loadDatabase()` - add at start of function

```javascript
const loadDatabase = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Clean up old deleted sensors (Priority 3.1)
    const { cleanupDeletedSensors } = await import('../storage/sensorStorage.js');
    const cleanupResult = cleanupDeletedSensors(90); // 90 days expiry
    if (cleanupResult.removed > 0 || cleanupResult.migrated > 0) {
      debug.log('[useSensorDatabase] Deleted sensors cleanup:', cleanupResult);
    }
    
    // ... rest of existing loadDatabase code
```

**Testing**:
```javascript
// In browser console:
// 1. Add test deleted sensors with old format
localStorage.setItem('agp-deleted-sensors', JSON.stringify([
  'OLD-SENSOR-1',  // Old format (string)
  'OLD-SENSOR-2',
  { sensorId: 'NEW-SENSOR-1', deletedAt: Date.now() - (100 * 24 * 60 * 60 * 1000) }, // 100 days old
  { sensorId: 'NEW-SENSOR-2', deletedAt: Date.now() - (10 * 24 * 60 * 60 * 1000) }  // 10 days old
]));

// 2. Call cleanup
import { cleanupDeletedSensors } from './src/storage/sensorStorage.js';
cleanupDeletedSensors(90);

// 3. Verify results:
// - OLD-SENSOR-1, OLD-SENSOR-2 → migrated to new format with current timestamp
// - NEW-SENSOR-1 → removed (100 days > 90 days)
// - NEW-SENSOR-2 → kept (10 days < 90 days)
```

**Acceptance Criteria**:
- [ ] Old format entries migrated to new format
- [ ] Entries older than 90 days removed
- [ ] Cleanup runs automatically on app startup
- [ ] Debug logging shows cleanup statistics
- [ ] Function returns success status + counts

---

### ⚡ Priority 3.2: localStorage Clear Warning

**Location**: `src/hooks/useSensorDatabase.js` or `src/main.jsx`  
**Add**: Startup check

**Implementation** (in `useSensorDatabase.js`):

```javascript
// At top of useSensorDatabase hook, after useState declarations
const [localStorageWarning, setLocalStorageWarning] = useState(null);

// In loadDatabase function, after setIsLoading(true)
const loadDatabase = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Check for localStorage clear (Priority 3.2)
    const STORAGE_KEY = 'agp-sensor-history-v3';
    const DELETED_SENSORS_KEY = 'agp-deleted-sensors';
    const hasDatabase = localStorage.getItem(STORAGE_KEY);
    const hasDeletedList = localStorage.getItem(DELETED_SENSORS_KEY);
    
    if (!hasDatabase && !hasDeletedList) {
      // Both missing → likely localStorage clear
      const warning = {
        type: 'localStorage-cleared',
        message: 'localStorage appears to be cleared. Deleted sensor history may be lost.',
        timestamp: new Date().toISOString()
      };
      setLocalStorageWarning(warning);
      console.warn('[useSensorDatabase] localStorage cleared - deleted sensor history lost', warning);
    }
    
    // ... rest of existing loadDatabase code
```

**Optional UI Banner** (add to component that uses useSensorDatabase):

```javascript
// In component (e.g., AGPGenerator.jsx):
const { sensors, isLoading, localStorageWarning } = useSensorDatabase();

// Add banner above main content:
{localStorageWarning && (
  <div style={{
    padding: '12px 16px',
    backgroundColor: '#FEF3C7',
    border: '2px solid #F59E0B',
    color: '#92400E',
    fontFamily: 'monospace',
    fontSize: '13px',
    marginBottom: '16px'
  }}>
    ⚠️ <strong>Warning:</strong> {localStorageWarning.message}
    <br />
    <small>Deleted sensors may reappear. They can be deleted again.</small>
  </div>
)}
```

**Testing**:
```javascript
// In browser:
// 1. Delete some sensors to build deleted list
// 2. Open DevTools console
// 3. Run: localStorage.clear()
// 4. Refresh page
// 5. Should see warning in console + optional banner in UI
```

**Acceptance Criteria**:
- [ ] Detects when both STORAGE_KEY and DELETED_SENSORS_KEY are missing
- [ ] Console warning logged with timestamp
- [ ] Optional: UI banner shown to user
- [ ] Warning doesn't block app functionality

---

### ⚡ Priority 3.3: Improved Lock Status API

**Location**: `src/storage/sensorStorage.js`  
**Function**: `getManualLockStatus()` (around line 150)

**Current Return Value**:
```javascript
return {
  isLocked: boolean,
  autoCalculated: boolean,
  reason: string
}
```

**Enhanced Return Value**:
```javascript
return {
  isLocked: boolean,
  autoCalculated: boolean,
  isEditable: boolean,         // NEW
  storageSource: string,        // NEW: 'localStorage' | 'sqlite'
  reason: string,               // Enhanced with more detail
  detail: string | null         // NEW: User-friendly explanation
}
```

**Implementation**:

```javascript
export function getManualLockStatus(sensorId, startDate = null) {
  const db = getSensorDatabase();
  const sensor = db?.sensors.find(s => s.sensor_id === sensorId);
  
  if (!sensor) {
    // SQLite-only sensor (not in localStorage)
    if (startDate) {
      const daysSinceStart = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
      const isLocked = daysSinceStart > 30;
      
      return {
        isLocked,
        autoCalculated: true,
        isEditable: false,
        storageSource: 'sqlite',
        reason: 'read-only-historical',
        detail: 'This sensor is from the historical database (>30 days old) and cannot be edited. ' +
                'Only recent sensors (<30 days) can be locked/unlocked.'
      };
    }
    
    // No sensor found and no start date → assume locked
    return {
      isLocked: true,
      autoCalculated: true,
      isEditable: false,
      storageSource: 'unknown',
      reason: 'no-sensor-found',
      detail: 'Sensor not found in database. It may have been deleted or is unavailable.'
    };
  }
  
  // localStorage sensor (editable)
  const daysSinceStart = Math.floor((new Date() - new Date(sensor.start_date)) / (1000 * 60 * 60 * 24));
  const autoLocked = daysSinceStart > 30;
  
  return {
    isLocked: sensor.is_manually_locked ?? autoLocked,
    autoCalculated: sensor.is_manually_locked === undefined,
    isEditable: true,
    storageSource: 'localStorage',
    reason: sensor.is_manually_locked !== undefined ? 'manual' : 'auto',
    detail: sensor.is_manually_locked !== undefined
      ? 'Lock status has been manually set by user.'
      : `Automatically locked because sensor is ${daysSinceStart} days old (>30 days).`
  };
}
```

**Update UI Error Handling**:

**Location**: `src/components/SensorHistoryModal.jsx`  
**Function**: Lock toggle click handler (around line 1143)

```javascript
onClick={sensor.isEditable ? () => {
  const result = toggleSensorLock(sensor.sensor_id);
  if (result.success) {
    setRefreshKey(prev => prev + 1);
  } else {
    // Use enhanced lock status for better error message
    const lockStatus = getManualLockStatus(sensor.sensor_id, sensor.start_date);
    
    if (lockStatus.detail) {
      alert(`❌ Cannot toggle lock\n\n${lockStatus.detail}`);
    } else {
      alert(`❌ Error: ${result.message}`);
    }
  }
} : undefined}
```

**Acceptance Criteria**:
- [ ] `getManualLockStatus()` returns enhanced object with all fields
- [ ] SQLite sensors have `isEditable: false` and `storageSource: 'sqlite'`
- [ ] localStorage sensors have `isEditable: true` and `storageSource: 'localStorage'`
- [ ] `detail` field provides user-friendly explanation
- [ ] UI shows enhanced error messages using `detail` field

---

## 📝 PHASE C: DOCUMENTATION & RELEASE

### Update CHANGELOG.md

**Location**: `CHANGELOG.md` (root directory)

**Add at Top**:

```markdown
## [3.1.1] - 2025-11-01

### Added
- **Batch capacity validation**: Prevents over-assignment of sensors to batches with clear error messages
- **Sensor ID collision detection**: Automatic suffix appending when sensors detected at same timestamp
- **Error recovery logging**: Rollback records stored on partial upload failures for manual recovery
- **Deleted sensors cleanup**: Automatic 90-day expiry with timestamp migration for old entries
- **localStorage clear detection**: Warning logged when deleted sensor history is lost

### Improved
- **Lock status API**: Enhanced error messages with user-friendly explanations for read-only sensors
- **Storage source indicators**: Already present (RECENT/HISTORICAL badges) - now documented
- **Error handling**: Better logging and recovery data throughout upload process

### Fixed
- Data quality: Batch over-assignment now prevented
- Data integrity: Sensor ID collisions no longer cause silent overwrites
- UX clarity: Read-only sensors clearly indicated with badges and disabled toggles

### Technical
- Added rollback logging to `masterDatasetStorage.js`
- Added cleanup function to `sensorStorage.js` with 90-day expiry
- Enhanced `getManualLockStatus()` return values
- Startup checks for localStorage state in `useSensorDatabase.js`

### Documentation
- Added `TIER2_SYNTHESIS.md` with complete architecture analysis (764 lines)
- Created `/docs/analysis/` directory for deep dive documents
- Archived old handoffs to `/docs/handoffs/`

**Risk Level**: LOW (additive changes, no breaking modifications)  
**LOC Changed**: ~120 lines added across 3 files  
**Testing**: Manual validation required for all 3 priority levels
```

---

### Update README.md (if needed)

**Location**: `README.md` (root directory)

**Check for**: User-facing feature descriptions

**If README mentions sensor management or stock batches**, add:

```markdown
### Recent Improvements (v3.1.1)

- **Batch Management**: Automatic validation prevents assigning more sensors than batch capacity
- **Data Recovery**: Failed uploads now create recovery records for manual cleanup
- **Maintenance**: Automatic cleanup of old deleted sensor records (90-day expiry)
- **Better Errors**: Clear explanations when actions fail (e.g., read-only sensors)
```

**If README has "Known Limitations" section**, update:

```markdown
### Known Limitations

- No true atomic transactions across IndexedDB + localStorage (mitigated with rollback logging)
- Historical sensors (>30 days old) are read-only (clearly indicated with badges)
- Stock data stored in localStorage (migration to IndexedDB planned for v4.0)
```

---

### Git Workflow

**Step 1: Stage All Changes**
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git add src/storage/masterDatasetStorage.js  # Priority 2
git add src/storage/sensorStorage.js          # Priority 3.1
git add src/hooks/useSensorDatabase.js        # Priority 3.1 + 3.2
git add src/components/SensorHistoryModal.jsx # Priority 3.3 (if changed)
```

**Step 2: Commit Priority 2**
```bash
git commit -m "feat(storage): add error recovery logging

- Store rollback records on partial upload failures
- Track sensors stored + assignments created
- Enhanced error messages with progress info
- Recovery data saved to localStorage with 'agp-failed-upload-' prefix
- Addresses TIER2_SYNTHESIS Priority 2 Action 2.1

Part of v3.1.1 maintenance fixes"
```

**Step 3: Commit Priority 3.1**
```bash
git commit -m "feat(sensors): add deleted sensors cleanup

- Automatic 90-day expiry for deleted sensor records
- Migrate old format (string IDs) to new format with timestamps
- Cleanup runs on app startup
- Debug logging shows migration + removal statistics
- Addresses TIER2_SYNTHESIS Priority 3 Action 3.1

Part of v3.1.1 maintenance fixes"
```

**Step 4: Commit Priority 3.2**
```bash
git commit -m "feat(storage): detect localStorage clear on startup

- Warn when localStorage is empty (deleted history lost)
- Console logging with timestamp
- Optional UI banner for user notification
- Addresses TIER2_SYNTHESIS Priority 3 Action 3.2

Part of v3.1.1 maintenance fixes"
```

**Step 5: Commit Priority 3.3**
```bash
git commit -m "feat(sensors): enhance lock status API

- Return richer lock status objects (isEditable, storageSource, detail)
- Better error messages for read-only sensors
- User-friendly explanations in UI
- Addresses TIER2_SYNTHESIS Priority 3 Action 3.3

Part of v3.1.1 maintenance fixes"
```

**Step 6: Update Documentation**
```bash
git add CHANGELOG.md README.md
git commit -m "docs: update CHANGELOG and README for v3.1.1

Added:
- Complete feature list for v3.1.1
- Known limitations updates
- Risk level and testing notes

Updated README with user-facing improvements"
```

**Step 7: Archive Handoff**
```bash
mkdir -p docs/handoffs
mv HANDOFF.md docs/handoffs/2025-11-01_priority2-3-fixes.md
git add docs/handoffs/
git commit -m "chore: archive Priority 2 & 3 handoff

Moved to docs/handoffs/ per DocumentHygiene.md"
```

**Step 8: Release Commit**
```bash
git commit --allow-empty -m "chore(release): v3.1.1

Complete feature set:
- ✅ Priority 1: Validation + collision detection
- ✅ Priority 2: Error recovery logging
- ✅ Priority 3: Maintenance features (cleanup, warnings, better errors)

Total changes: ~160 LOC added
Risk: LOW (additive features, no breaking changes)
Testing: Manual validation complete

Architecture risk: MEDIUM → LOW
Ready for production deployment

See TIER2_SYNTHESIS.md for full context
See CHANGELOG.md for detailed changes"
```

**Step 9: Push to GitHub**
```bash
git push origin main
```

**Verify on GitHub**:
- Check commits appear: https://github.com/[username]/agp-plus/commits/main
- Verify CHANGELOG.md renders correctly
- Check all files updated properly

---

## ✅ ACCEPTANCE CRITERIA

### Phase A: Priority 2 (Error Recovery)
- [ ] Rollback records created on partial failure
- [ ] Records contain: timestamp, error, progress, data
- [ ] localStorage key: `agp-failed-upload-[timestamp]`
- [ ] Enhanced error messages show progress
- [ ] Console logging shows detailed debug info

### Phase B: Priority 3 (Maintenance)
- [ ] **3.1 Cleanup**: Deleted sensors older than 90 days removed
- [ ] **3.1 Migration**: Old format → new format with timestamps
- [ ] **3.1 Startup**: Cleanup runs automatically
- [ ] **3.2 Warning**: localStorage clear detected + logged
- [ ] **3.2 Optional**: UI banner shown (if implemented)
- [ ] **3.3 API**: Lock status returns enhanced objects
- [ ] **3.3 UI**: Better error messages using `detail` field

### Phase C: Documentation
- [ ] CHANGELOG.md updated with v3.1.1 section
- [ ] README.md updated (if user-facing features)
- [ ] All commits have clear messages
- [ ] Handoff archived to `/docs/handoffs/`
- [ ] Changes pushed to GitHub

---

## 🧪 TESTING PLAN

### Priority 2 Testing: Error Recovery

**Test Scenario**: Simulate partial upload failure

```javascript
// 1. Create batch with capacity 1
const batch = createBatch({
  lot_number: 'TEST-CAPACITY',
  total_quantity: 1
});

// 2. Prepare CSV with 2 sensors + 2 assignments
// 3. Upload CSV
// 4. Confirm batch assignments (both sensors → same batch)
// 5. Expected: First assignment succeeds, second fails
// 6. Check localStorage for 'agp-failed-upload-' key
// 7. Verify rollback record contains:
//    - sensorsStored: 2
//    - assignmentsCreated: 1
//    - pendingAssignments: [second assignment]
```

---

### Priority 3.1 Testing: Deleted Sensors Cleanup

**Test Scenario**: Old entries removed, format migrated

```javascript
// 1. Add mixed format deleted sensors
localStorage.setItem('agp-deleted-sensors', JSON.stringify([
  'OLD-FORMAT-1',  // String (old)
  'OLD-FORMAT-2',  // String (old)
  { sensorId: 'EXPIRED-1', deletedAt: Date.now() - (100 * 24 * 60 * 60 * 1000) }, // 100 days
  { sensorId: 'RECENT-1', deletedAt: Date.now() - (10 * 24 * 60 * 60 * 1000) }    // 10 days
]));

// 2. Refresh page (cleanup runs on startup)
// 3. Check deleted sensors list:
const cleaned = JSON.parse(localStorage.getItem('agp-deleted-sensors'));

// 4. Verify:
// - OLD-FORMAT-1, OLD-FORMAT-2 → now have timestamps
// - EXPIRED-1 → removed (>90 days)
// - RECENT-1 → still present

// 5. Check console for debug logs showing:
//    - migrated: 2
//    - removed: 1
//    - remaining: 3
```

---

### Priority 3.2 Testing: localStorage Clear Warning

**Test Scenario**: Detect cleared localStorage

```javascript
// 1. Normal startup (no warning)
// 2. Open DevTools console
// 3. Run: localStorage.clear()
// 4. Refresh page
// 5. Expected:
//    - Console warning: "localStorage cleared - deleted sensor history lost"
//    - Optional: UI banner with warning message
```

---

### Priority 3.3 Testing: Enhanced Lock Status

**Test Scenario**: Better error messages

```javascript
// 1. Find SQLite sensor (>30 days old, historical)
// 2. Try to toggle lock
// 3. Expected error message:
//    "This sensor is from the historical database (>30 days old) and cannot be edited.
//     Only recent sensors (<30 days) can be locked/unlocked."

// 4. Find localStorage sensor (recent, editable)
// 5. Lock/unlock should work
// 6. Expected: Toggle succeeds, no error

// 7. Manually call getManualLockStatus():
const status = getManualLockStatus('SOME-SENSOR-ID');
// Verify return value has all fields:
// - isLocked, autoCalculated, isEditable, storageSource, reason, detail
```

---

## 📚 REFERENCE DOCUMENTS

**Required Reading** (Tier 2):
- `/docs/analysis/TIER2_SYNTHESIS.md` - Full analysis + all priorities (764 lines)
  - Section: "Priority 2: Error Recovery"
  - Section: "Priority 3: Maintenance"
  - Section: "Implementation Roadmap"

**Context** (Tier 3):
- `/reference/metric_definitions.md` - Glucose metrics (if touching metrics)
- `/reference/minimed_780g_ref.md` - Device reference (if touching parsing)

**Previous Sessions** (Tier 1 archive):
- `/docs/handoffs/2025-10-31_sensor-detection.md` - Sensor detection work
- `/docs/handoffs/2025-11-01_priority1-fixes.md` - Priority 1 completion (will be created)

**Project Status** (Tier 2):
- `/project/STATUS.md` - Phase tracking (update after completion)
- `/project/V3_ARCHITECTURE.md` - System design overview

---

## ⏱️ TIME TRACKING

**Estimated Breakdown**:
- Priority 2 (Error recovery): 1 hour
- Priority 3.1 (Cleanup): 1 hour
- Priority 3.2 (Warning): 30 minutes
- Priority 3.3 (Lock API): 30 minutes
- Documentation (CHANGELOG, README): 30 minutes
- Git commits + push: 30 minutes
- **Total: 4 hours**

**Actual Time**: _(fill in after completion)_

---

## 🎓 LESSONS TO CAPTURE

_(Fill in after session)_

**What Went Well**:
- 

**What Was Challenging**:
- 

**What to Remember Next Time**:
- 

---

## ✅ SESSION COMPLETION CHECKLIST

**Implementation**:
- [ ] Priority 2: Error recovery logging
- [ ] Priority 3.1: Deleted sensors cleanup
- [ ] Priority 3.2: localStorage clear warning
- [ ] Priority 3.3: Enhanced lock status API

**Testing**:
- [ ] All test scenarios executed
- [ ] Console output verified
- [ ] UI behavior validated
- [ ] No regressions found

**Documentation**:
- [ ] CHANGELOG.md updated
- [ ] README.md updated (if needed)
- [ ] Code comments added where needed

**Git Workflow**:
- [ ] All changes committed (4 feature commits)
- [ ] Documentation commit
- [ ] Release commit (v3.1.1)
- [ ] Pushed to GitHub
- [ ] Verified on GitHub

**Handoff**:
- [ ] This handoff archived to `/docs/handoffs/2025-11-01_priority2-3-fixes.md`
- [ ] New handoff created for next session (Priority 4 or new work)
- [ ] `project/STATUS.md` updated

---

## 🎬 NEXT STEPS AFTER COMPLETION

### Immediate (After This Session)
1. Browser testing of all features
2. Verify rollback records work
3. Check cleanup statistics in console
4. Confirm GitHub push successful

### Short-term (Next Week)
1. Consider Priority 4: IndexedDB migration (8-12 hours)
2. Performance profiling (metrics, deduplication)
3. User feedback on new features

### Long-term (v4.0.0)
1. Migrate stock storage to IndexedDB
2. Implement atomic transactions
3. Add advanced metrics (GRI, CONGA)
4. Multi-user support (if needed)

---

**Last Updated**: 2025-11-01 16:00  
**Status**: 🟡 Ready to start  
**Assigned**: Jo or Claude (next session)  
**Priority**: MEDIUM (quality-of-life improvements)  
**Estimated Duration**: 4 hours
