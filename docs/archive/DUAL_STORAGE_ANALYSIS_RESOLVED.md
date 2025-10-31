# SQLite + localStorage Dual Storage Architecture Analysis

**Date**: 2025-10-31  
**Context**: Analyzing potential issues with hybrid SQLite/localStorage sensor storage  
**Status**: 🔴 CRITICAL ISSUES IDENTIFIED

---

## 🎯 EXECUTIVE SUMMARY

**Verdict**: ⚠️ **The current architecture WILL cause problems**

**Risk Level**: MEDIUM-HIGH (not catastrophic, but problematic in edge cases)

**Key Issues Identified**:
1. ❌ **Sync race conditions** - syncUnlockedSensorsToLocalStorage can re-add deleted sensors
2. ⚠️ **Lock state inconsistency** - SQLite sensors have no lock state, localStorage does
3. 🔄 **Delete persistence gaps** - Deleted sensors list can grow indefinitely
4. 🤔 **Data source confusion** - No clear indicator which storage backs each sensor

**Good News**: 
- ✅ Deduplication prevents most visible duplication
- ✅ Current fixes (v3.1.0) handle the obvious bugs well
- ✅ Architecture is salvageable with targeted fixes

---

## 🔍 DETAILED ANALYSIS

### Issue #1: Sync Race Condition (HIGH RISK)

**Location**: `sensorStorage.js:syncUnlockedSensorsToLocalStorage()`

**Problem**: 
```javascript
// Current logic:
const deletedSensors = getDeletedSensors();
const unlockedSensors = allSensors.filter(s => {
  const isDeleted = deletedSensors.includes(s.sensor_id);
  return isRecent && !isDeleted && !alreadyInLocalStorage;
});
```

This PREVENTS deleted sensors from being re-synced ✅

**BUT**:
- Deleted sensors list is stored separately in `agp-deleted-sensors`
- If user clears localStorage (for debugging/reset), deleted list is lost
- Next sync will re-add all deleted sensors from SQLite
- User: "WTF I deleted that sensor!"

**Severity**: MEDIUM
- Uncommon scenario (user clears localStorage manually)
- But VERY confusing when it happens
- No UI warning about this behavior

**Fix Complexity**: EASY
- Add warning on localStorage clear
- Or: store deleted list in IndexedDB (persistent across localStorage clears)
- Or: add "deleted" flag to SQLite database itself

---

### Issue #2: Lock State Inconsistency (MEDIUM RISK)

**Location**: `sensorStorage.js:getManualLockStatus()`

**Problem**:
```javascript
// For SQLite-only sensors (not in localStorage):
if (!sensor) {
  if (startDate) {
    const daysSinceStart = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
    return {
      isLocked: daysSinceStart > 30,
      autoCalculated: true,
      reason: 'sqlite-only'
    };
  }
  return { isLocked: true, autoCalculated: true, reason: 'no-start-date' };
}
```

**Issues**:
1. **SQLite sensors have no `is_manually_locked` field**
   - Lock state is calculated on-the-fly
   - Can't be toggled (by design)
   - But what if sensor becomes <30 days old? (clock rollback, timezone change)

2. **User confusion**:
   - "Why can't I unlock this sensor?" 
   - No clear explanation that SQLite = read-only
   - UI shows lock icon but toggle fails

3. **Inconsistent defaults**:
   - localStorage sensors: `is_manually_locked` = undefined initially → auto-calc
   - SQLite sensors: always auto-calc
   - After toggle: localStorage only → desync risk

**Severity**: MEDIUM
- Functional impact: LOW (toggle just fails for SQLite sensors)
- UX impact: MEDIUM (confusing error messages)
- Data integrity: LOW (no corruption)

**Fix Complexity**: MEDIUM
- Add clear UI distinction (badge: "Read-only" for SQLite sensors)
- Disable lock toggle UI for SQLite sensors
- Better error messages

---

### Issue #3: Deleted Sensors List Growth (LOW RISK)

**Location**: `sensorStorage.js:addDeletedSensor()`

**Problem**:
```javascript
export function addDeletedSensor(sensorId) {
  const deleted = getDeletedSensors();
  if (!deleted.includes(sensorId)) {
    deleted.push(sensorId);
    localStorage.setItem(DELETED_SENSORS_KEY, JSON.stringify(deleted));
  }
}
```

**Issues**:
1. **No garbage collection**
   - Deleted list grows forever
   - After years: potentially hundreds of sensor IDs
   - Impacts sync performance (filter check)

2. **No expiry**
   - Sensors deleted years ago still in list
   - No cleanup mechanism
   - localStorage quota (5-10MB) unlikely to be hit, but still wasteful

**Severity**: LOW
- Performance impact: NEGLIGIBLE (filter is O(n), n is small)
- Storage impact: NEGLIGIBLE (~30 bytes per sensor ID)
- Only becomes issue after years of use

**Fix Complexity**: EASY
- Add cleanup: remove sensor IDs >1 year old
- Or: store deletion timestamp, expire after 90 days
- Or: add "Clear deleted sensors list" in settings

---

### Issue #4: Data Source Confusion (LOW-MEDIUM RISK)

**Location**: Throughout app

**Problem**:
- No clear indicator which storage backs each sensor
- User sees sensor in UI, assumes it's editable
- Tries to edit/delete → surprise! It's read-only (SQLite)

**Example Flow**:
```
1. User sees sensor in list (from SQLite, >30 days old)
2. User clicks delete → works fine
3. User refreshes → sensor is BACK (re-synced from SQLite)
4. User: "DELETE IS BROKEN!"
```

Wait... this is actually prevented by `addDeletedSensor()` ✅

**But still confusing**:
- No visual indicator "This sensor is from SQLite"
- No explanation why some sensors can't be unlocked
- Toggle lock fails with generic error

**Severity**: LOW-MEDIUM
- Functional: LOW (delete works, just confusing)
- UX: MEDIUM (unclear why some actions fail)

**Fix Complexity**: EASY-MEDIUM
- Add badge: "SQLite" vs "Recent"
- Add tooltip: "Read-only (historical data)"
- Improve error messages

---

## 🔄 DATA FLOW ANALYSIS

### Current Flow (Simplified)

```
App Startup
    ↓
useSensorDatabase()
    ↓
1. Load SQLite sensors (read-only, old)
2. Load localStorage sensors (editable, recent)
3. Deduplicate (prefer localStorage version)
4. syncUnlockedSensorsToLocalStorage() ← FIRST RISK POINT
    ├─ Filter: <30 days, not deleted, not in localStorage
    └─ Add to localStorage (make editable)
    ↓
5. Return merged array
    ↓
SensorHistoryModal displays all
    ↓
User clicks delete
    ↓
deleteSensorWithLockCheck()
    ├─ Check manual lock (only works for localStorage sensors)
    ├─ Remove from localStorage
    └─ addDeletedSensor() ← SECOND RISK POINT
    ↓
User refreshes
    ↓
Deleted sensor NOT re-synced (deleted list prevents it) ✅
```

### Edge Cases That Could Break

**Scenario A: localStorage Clear During Active Session**
```
1. User has app open
2. Opens DevTools, runs localStorage.clear()
3. App still running, has sensors in memory
4. User uploads new CSV
5. Detection runs, calls addSensor()
6. localStorage now has NEW data but deleted list is GONE
7. Next refresh → all deleted sensors come back from SQLite
```

**Likelihood**: LOW (requires manual localStorage manipulation)  
**Impact**: HIGH (user loses delete history)  
**Prevention**: Add warning when localStorage is cleared

---

**Scenario B: Clock Rollback**
```
1. Sensor from 31 days ago in SQLite (locked, read-only)
2. System clock rolls back 2 days (timezone change, bug)
3. Sensor is now 29 days old → unlocked, should be in localStorage
4. User refreshes → syncUnlockedSensors tries to add it
5. Works! Sensor now editable
6. Clock fixes itself → sensor 31 days old again
7. Next refresh → sensor back to SQLite-only? Or still in localStorage?
```

**Likelihood**: VERY LOW (clock issues rare)  
**Impact**: MEDIUM (data inconsistency, minor confusion)  
**Prevention**: Timestamp validation, max age cap

---

**Scenario C: Concurrent Writes**
```
1. User uploads CSV → detection adds sensor A
2. Simultaneously, user deletes sensor B
3. Both call localStorage.setItem(STORAGE_KEY)
4. Race condition: which write wins?
```

**Likelihood**: LOW (localStorage is synchronous, no true concurrency)  
**Impact**: MEDIUM (last write wins, could lose delete)  
**Prevention**: localStorage is atomic in browser (no true race)

---

## 🎯 CRITICAL CODE PATTERNS

### Pattern #1: Deleted Sensor Check (GOOD)

```javascript
// In syncUnlockedSensorsToLocalStorage():
const deletedSensors = getDeletedSensors();
const unlockedSensors = allSensors.filter(s => {
  const isDeleted = deletedSensors.includes(s.sensor_id);
  return isRecent && !isDeleted && !alreadyInLocalStorage;
});
```

✅ **This prevents re-adding deleted sensors** (main fix from v3.1.0)

**But**: Relies on deleted list being intact

---

### Pattern #2: Lock Status Fallback (PROBLEMATIC)

```javascript
// In getManualLockStatus():
const sensor = db.sensors.find(s => s.sensor_id === sensorId);
if (!sensor) {
  // SQLite-only sensor - auto-calculate lock
  if (startDate) {
    const daysSinceStart = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
    return {
      isLocked: daysSinceStart > 30,
      autoCalculated: true,
      reason: 'sqlite-only'
    };
  }
  return { isLocked: true, autoCalculated: true };
}
```

⚠️ **Problem**: 
- No error/warning that sensor is read-only
- Just returns calculated lock state
- User tries to toggle → fails in `toggleSensorLock()`
- Error message is generic: "Sensor is read-only"

**Better approach**:
- Return `{ isLocked, isReadOnly, storageSource: 'sqlite' }`
- UI can show different icon/tooltip for read-only sensors
- Toggle button disabled proactively

---

### Pattern #3: Deduplication (GOOD)

```javascript
// In useSensorDatabase():
const sensorMap = new Map();

// Add localStorage sensors first (prefer these)
localSensorsConverted.forEach(s => {
  sensorMap.set(s.sensor_id, s);
});

// Add SQLite sensors only if NOT already in map
sensorData.forEach(s => {
  if (!sensorMap.has(s.sensor_id)) {
    sensorMap.set(s.sensor_id, s);
  }
});

const allSensors = Array.from(sensorMap.values());
```

✅ **This is excellent**
- Prevents duplicate display (main bug from earlier)
- Prefers localStorage version (more recent/accurate)
- Clean Map-based approach

---

## 🛠️ RECOMMENDED FIXES

### Priority 1: Add Storage Source Indicator (EASY)

**Goal**: Make it obvious which storage backs each sensor

**Implementation**:
```javascript
// In useSensorDatabase, add source field:
const localSensorsConverted = localStorageSensors.map(s => ({
  ...s,
  storageSource: 'localStorage',
  isEditable: true
}));

const sensorData = rows.map(row => ({
  ...row,
  storageSource: 'sqlite',
  isEditable: false
}));
```

**UI Changes**:
- Add badge in SensorHistoryModal: "Recent" (green) vs "Historical" (gray)
- Tooltip: "Historical sensors are read-only"
- Lock toggle button disabled for SQLite sensors

**Effort**: 2 hours  
**Impact**: HIGH (massive UX improvement)

---

### Priority 2: Improve Lock Status API (MEDIUM)

**Goal**: Return more context about why lock can't be toggled

**Implementation**:
```javascript
export function getManualLockStatus(sensorId, startDate = null) {
  const db = getSensorDatabase();
  const sensor = db?.sensors.find(s => s.sensor_id === sensorId);
  
  if (!sensor) {
    // SQLite-only sensor
    return {
      isLocked: startDate ? calculateLock(startDate) : true,
      autoCalculated: true,
      isEditable: false,
      storageSource: 'sqlite',
      reason: 'read-only-historical'
    };
  }
  
  return {
    isLocked: sensor.is_manually_locked ?? calculateLock(sensor.start_date),
    autoCalculated: sensor.is_manually_locked === undefined,
    isEditable: true,
    storageSource: 'localStorage',
    reason: 'manual'
  };
}
```

**UI Changes**:
- Show "🔒 Read-only" for SQLite sensors (no toggle)
- Show "🔓 Unlocked" or "🔒 Locked" for localStorage sensors (with toggle)
- Better error messages

**Effort**: 3 hours  
**Impact**: MEDIUM (reduces user confusion)

---

### Priority 3: Add Deleted List Expiry (LOW)

**Goal**: Prevent deleted list from growing forever

**Implementation**:
```javascript
export function cleanupDeletedSensors() {
  const deleted = JSON.parse(localStorage.getItem(DELETED_SENSORS_KEY) || '[]');
  const now = Date.now();
  const EXPIRY_DAYS = 90;
  
  // If deleted sensors don't have timestamps yet, add them
  const withTimestamps = deleted.map(entry => {
    if (typeof entry === 'string') {
      // Old format: just sensor ID
      return { sensorId: entry, deletedAt: now };
    }
    return entry; // New format: { sensorId, deletedAt }
  });
  
  // Filter out entries older than 90 days
  const active = withTimestamps.filter(entry => {
    const age = (now - entry.deletedAt) / (1000 * 60 * 60 * 24);
    return age < EXPIRY_DAYS;
  });
  
  localStorage.setItem(DELETED_SENSORS_KEY, JSON.stringify(active));
  return { removed: withTimestamps.length - active.length };
}
```

**Call on app startup**:
```javascript
// In useSensorDatabase, before sync:
cleanupDeletedSensors();
```

**Effort**: 1 hour  
**Impact**: LOW (nice to have, prevents long-term bloat)

---

### Priority 4: Add localStorage Clear Warning (EASY)

**Goal**: Warn user if they clear localStorage manually

**Implementation**:
```javascript
// In App.jsx or main component, add check:
useEffect(() => {
  const hasDatabase = localStorage.getItem(STORAGE_KEY);
  const hasDeletedList = localStorage.getItem(DELETED_SENSORS_KEY);
  
  if (!hasDatabase && !hasDeletedList) {
    // Both missing → likely fresh start OR manual clear
    console.warn('[App] localStorage appears cleared - deleted sensor history lost');
    // Could show toast or modal
  }
}, []);
```

**Effort**: 30 minutes  
**Impact**: LOW (edge case, but helpful for debugging)

---

## 🎬 IMPLEMENTATION PLAN

### Phase 1: Quick Wins (2 hours)
- [ ] Add `storageSource` field to sensors
- [ ] Add badge in UI (Recent / Historical)
- [ ] Disable lock toggle for SQLite sensors

### Phase 2: Improve Lock System (3 hours)
- [ ] Enhance `getManualLockStatus()` return value
- [ ] Update `toggleSensorLock()` error messages
- [ ] Update SensorHistoryModal to use new API

### Phase 3: Maintenance Features (2 hours)
- [ ] Add deleted list expiry
- [ ] Add localStorage clear warning
- [ ] Add "Clear deleted history" button in settings

**Total Effort**: ~7 hours
**Risk Level After Fixes**: LOW

---

## 🧪 TEST SCENARIOS

### Test 1: Delete Persistence
```
1. Delete sensor from localStorage
2. Refresh app
3. ✅ Sensor should NOT reappear
4. Check deleted list: sensor ID should be present
```

### Test 2: SQLite Sensor Immutability
```
1. Find sensor >30 days old (from SQLite)
2. Try to toggle lock
3. ✅ Should show error: "Read-only sensor"
4. Try to delete
5. ✅ Should work, add to deleted list
6. Refresh
7. ✅ Sensor should NOT reappear
```

### Test 3: localStorage Clear Recovery
```
1. Delete sensor A
2. Open DevTools, run localStorage.clear()
3. Refresh app
4. ❌ Sensor A WILL reappear (deleted list lost)
5. After fix: show warning modal
```

### Test 4: Deduplication
```
1. Upload CSV with sensor already in SQLite
2. ✅ Should show only ONE sensor (no duplicate)
3. Check console: "duplicatesRemoved: 1"
```

---

## 📊 RISK MATRIX

| Issue | Likelihood | Impact | Severity | Fix Priority |
|-------|-----------|--------|----------|--------------|
| Sync race condition | LOW | HIGH | MEDIUM | P1 |
| Lock inconsistency | MEDIUM | MEDIUM | MEDIUM | P2 |
| Deleted list growth | LOW | LOW | LOW | P3 |
| Data source confusion | HIGH | MEDIUM | MEDIUM | P1 |

**Overall Risk**: MEDIUM (manageable, fixable)

---

## 💡 ALTERNATIVE ARCHITECTURES (Future Consideration)

### Option A: Single Source of Truth (SQLite Only)

**Pros**:
- No sync issues
- No deduplication needed
- Clear data ownership

**Cons**:
- Need server to update SQLite
- Can't edit in browser
- Complex deployment

**Verdict**: ❌ Too complex for AGP+

---

### Option B: Single Source of Truth (IndexedDB Only)

**Pros**:
- Persistent across localStorage clears
- Better for large datasets
- Browser-native

**Cons**:
- More complex API
- Async queries (loading states)
- No easy CSV export

**Verdict**: 🤔 Worth considering for v4.0

---

### Option C: Current Hybrid (localStorage + SQLite)

**Pros**:
- Best of both worlds
- Easy to implement
- Fast reads (synchronous)

**Cons**:
- Sync complexity
- Potential inconsistencies
- Need deduplication

**Verdict**: ✅ KEEP but FIX issues above

---

## 📝 CONCLUSION

**Should we keep SQLite + localStorage?**

**YES, but with fixes.**

**Why?**
- Current architecture is 90% solid
- Issues are edge cases, not showstoppers
- Fixes are straightforward (7 hours total)
- Benefits outweigh costs:
  - Historical sensors in SQLite (static, read-only)
  - Recent sensors in localStorage (editable, fast)
  - Deduplication prevents duplication bugs

**What needs to happen?**
1. ✅ **Deduplication** (already done in v3.1.0)
2. ✅ **Deleted sensors list** (already done in v3.1.0)
3. 🔄 **Add storage source indicator** (Priority 1)
4. 🔄 **Improve lock system** (Priority 2)
5. 🔄 **Add deleted list cleanup** (Priority 3)

**Bottom Line**:
- Architecture is **salvageable**
- Issues are **manageable**
- Fixes are **straightforward**
- Risk after fixes: **LOW**

**Recommendation**: 
- Implement Priority 1 + Priority 2 fixes
- Monitor for edge cases
- Consider IndexedDB migration in v4.0 if scaling becomes issue

---

**Analysis complete. Ready to implement fixes?**
