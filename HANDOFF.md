---
tier: 1
status: active
last_updated: 2025-11-01
purpose: Current session state - Priority 1 architecture fixes after Tier 2 analysis
---

# 🎯 HANDOFF - Priority 1 Architecture Fixes

**Date**: 2025-11-01  
**Session Focus**: Implement quick-win validation and UX improvements  
**Estimated Time**: 2 hours  
**Risk Level**: LOW (additive changes, no breaking modifications)

---

## 📍 CONTEXT - WHERE WE ARE

### Analysis Complete ✅
- **Tier 2 Synthesis**: Complete review of 4,258 LOC across 12 core files
- **Verdict**: Architecture fundamentally sound (7.9/10) but needs validation layers
- **Document**: `/docs/analysis/TIER2_SYNTHESIS.md` (764 lines)

### Key Findings
1. ❌ **No batch capacity validation** - can over-assign sensors
2. ❌ **No storage source indicator** - users confused by read-only SQLite sensors  
3. ❌ **Sensor ID collisions possible** - rare but unhandled (same-second detection)

### Current State
- ✅ **v3.1.0 working** - deduplication fixed, deleted sensors persistent
- ⚠️ **Production-ready** with known limitations
- 🎯 **Goal**: Close gaps with 3 quick fixes (2 hours total)

---

## 🎯 MISSION - PRIORITY 1 FIXES

Implement 3 high-value, low-risk improvements:

### Fix #1: Batch Capacity Validation (15 min)
**Problem**: Can assign 12 sensors to batch with quantity=10  
**Impact**: Data quality, inventory tracking unreliable  
**File**: `src/storage/stockStorage.js:129`

### Fix #2: Storage Source Indicator (30 min)
**Problem**: No visual distinction between localStorage vs SQLite sensors  
**Impact**: Users try to edit read-only sensors, confusing errors  
**Files**: `src/hooks/useSensorDatabase.js:50`, `src/components/SensorHistoryModal.jsx`

### Fix #3: Sensor ID Uniqueness Check (30 min)
**Problem**: Two sensors detected at same second → ID collision → silent overwrite  
**Impact**: Data loss (rare but undetected)  
**File**: `src/storage/masterDatasetStorage.js:413`

---

## 🔧 IMPLEMENTATION GUIDE

### ⚡ Fix #1: Batch Capacity Validation

**Location**: `src/storage/stockStorage.js`  
**Function**: `assignSensorToBatch()` (line ~129)

**Current Code**:
```javascript
export function assignSensorToBatch(sensorId, batchId, assignedBy = 'manual') {
  const assignments = getAllAssignments();
  
  // ❌ NO VALIDATION HERE
  
  const filtered = assignments.filter(a => a.sensor_id !== sensorId);
  const newAssignment = {
    assignment_id: `ASSIGN-${Date.now()}`,
    sensor_id: sensorId,
    batch_id: batchId,
    assigned_at: new Date().toISOString(),
    assigned_by: assignedBy
  };
  
  filtered.push(newAssignment);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(filtered));
  return newAssignment;
}
```

**Add This** (after line 130):
```javascript
export function assignSensorToBatch(sensorId, batchId, assignedBy = 'manual') {
  const assignments = getAllAssignments();
  
  // ✅ NEW: Validate batch exists and has capacity
  const batch = getBatchById(batchId);
  if (!batch) {
    throw new Error(`Batch ${batchId} not found - cannot assign sensor`);
  }
  
  const currentAssignments = assignments.filter(a => a.batch_id === batchId);
  if (batch.total_quantity && currentAssignments.length >= batch.total_quantity) {
    const remaining = batch.total_quantity - currentAssignments.length;
    throw new Error(
      `Batch ${batch.lot_number} is at capacity ` +
      `(${currentAssignments.length}/${batch.total_quantity} sensors assigned). ` +
      `Cannot assign additional sensors.`
    );
  }
  
  // Remove existing assignment for this sensor (if any)
  const filtered = assignments.filter(a => a.sensor_id !== sensorId);
  
  const newAssignment = {
    assignment_id: `ASSIGN-${Date.now()}`,
    sensor_id: sensorId,
    batch_id: batchId,
    assigned_at: new Date().toISOString(),
    assigned_by: assignedBy
  };
  
  filtered.push(newAssignment);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(filtered));
  
  return newAssignment;
}
```

**Testing**:
```javascript
// In browser console or test file:
import { createBatch, assignSensorToBatch } from './src/storage/stockStorage.js';

// Create batch with capacity 2
const batch = createBatch({
  lot_number: 'TEST-001',
  total_quantity: 2,
  received_date: '2025-11-01'
});

// Should succeed
assignSensorToBatch('sensor-1', batch.batch_id, 'test');  // ✅ 1/2
assignSensorToBatch('sensor-2', batch.batch_id, 'test');  // ✅ 2/2

// Should FAIL with clear error
assignSensorToBatch('sensor-3', batch.batch_id, 'test');  // ❌ "Batch TEST-001 is at capacity"
```

---

### ⚡ Fix #2: Storage Source Indicator

#### Part A: Add Fields to Sensors (Backend)

**Location**: `src/hooks/useSensorDatabase.js`  
**Function**: Main sensor loading logic (line ~50-80)

**Current Code**:
```javascript
// Convert localStorage sensors
const localSensorsConverted = localStorageSensors.map(s => ({
  sensor_id: s.sensor_id,
  start_date: s.start_date,
  end_date: s.end_date,
  is_manually_locked: s.is_manually_locked
}));

// Load SQLite sensors
const sensorData = rows.map(row => ({
  sensor_id: row.sensor_id,
  start_date: row.start_date,
  end_date: row.end_date
}));
```

**Change To**:
```javascript
// Convert localStorage sensors
const localSensorsConverted = localStorageSensors.map(s => ({
  sensor_id: s.sensor_id,
  start_date: s.start_date,
  end_date: s.end_date,
  is_manually_locked: s.is_manually_locked,
  storageSource: 'localStorage',  // ✅ NEW
  isEditable: true                // ✅ NEW
}));

// Load SQLite sensors
const sensorData = rows.map(row => ({
  sensor_id: row.sensor_id,
  start_date: row.start_date,
  end_date: row.end_date,
  storageSource: 'sqlite',        // ✅ NEW
  isEditable: false               // ✅ NEW
}));
```

#### Part B: Update UI (Frontend)

**Location**: `src/components/SensorHistoryModal.jsx`  
**Function**: Sensor table rendering

**Find**: The table cell that shows sensor ID or lock status  
**Add**: Badge next to sensor information

**Add This Helper** (top of component):
```javascript
const StorageSourceBadge = ({ source }) => {
  if (source === 'localStorage') {
    return (
      <span 
        className="storage-badge storage-badge-recent"
        title="Recent sensor - editable"
      >
        RECENT
      </span>
    );
  }
  
  return (
    <span 
      className="storage-badge storage-badge-historical"
      title="Historical sensor - read-only (from SQLite database)"
    >
      HISTORICAL
    </span>
  );
};
```

**Add CSS** (in `SensorHistoryModal.jsx` or global styles):
```css
.storage-badge {
  display: inline-block;
  padding: 2px 6px;
  margin-left: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 2px solid;
  background: white;
}

.storage-badge-recent {
  color: #059669;
  border-color: #059669;
}

.storage-badge-historical {
  color: #6b7280;
  border-color: #6b7280;
}
```

**Use in Table**:
```javascript
// In sensor row rendering:
<td>
  {sensor.sensor_id}
  <StorageSourceBadge source={sensor.storageSource} />
</td>
```

#### Part C: Disable Lock Toggle for SQLite Sensors

**Location**: Same file, lock toggle button

**Find**: Button that calls `toggleSensorLock()`

**Change From**:
```javascript
<button onClick={() => toggleSensorLock(sensor.sensor_id)}>
  {isLocked ? '🔒 Locked' : '🔓 Unlocked'}
</button>
```

**Change To**:
```javascript
<button 
  onClick={() => toggleSensorLock(sensor.sensor_id)}
  disabled={!sensor.isEditable}  // ✅ NEW
  title={!sensor.isEditable ? 'Historical sensors are read-only' : ''}
  className={!sensor.isEditable ? 'disabled' : ''}
>
  {isLocked ? '🔒 Locked' : '🔓 Unlocked'}
</button>
```

**Testing**:
1. Upload CSV with recent sensors → should see green "RECENT" badge
2. Find sensor >30 days old → should see gray "HISTORICAL" badge
3. Try to toggle lock on historical sensor → button should be disabled
4. Hover over disabled button → tooltip should explain why

---

### ⚡ Fix #3: Sensor ID Uniqueness Check

**Location**: `src/storage/masterDatasetStorage.js`  
**Function**: `findBatchSuggestionsForSensors()` (line ~413)

**Current Code**:
```javascript
async function findBatchSuggestionsForSensors(detectedEvents) {
  // Extract sensor IDs from events
  const sensorIds = detectedEvents.sensorEvents.map(event => {
    const timestamp = new Date(event.timestamp);
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const hours = String(timestamp.getHours()).padStart(2, '0');
    const minutes = String(timestamp.getMinutes()).padStart(2, '0');
    const seconds = String(timestamp.getSeconds()).padStart(2, '0');
    return `Sensor-${year}-${month}-${day}-${hours}${minutes}${seconds}`;
  });
  
  // Get batch suggestions
  const { suggestBatchAssignments } = await import('../core/stock-engine.js');
  return suggestBatchAssignments(sensorIds);
}
```

**Change To**:
```javascript
async function findBatchSuggestionsForSensors(detectedEvents) {
  // Extract sensor IDs from events with collision detection
  const sensorIdSet = new Set();
  const sensorIds = detectedEvents.sensorEvents.map((event, index) => {
    const timestamp = new Date(event.timestamp);
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const hours = String(timestamp.getHours()).padStart(2, '0');
    const minutes = String(timestamp.getMinutes()).padStart(2, '0');
    const seconds = String(timestamp.getSeconds()).padStart(2, '0');
    
    // Generate base sensor ID
    let sensorId = `Sensor-${year}-${month}-${day}-${hours}${minutes}${seconds}`;
    
    // ✅ NEW: Check for collision
    if (sensorIdSet.has(sensorId)) {
      console.warn(
        `[Stock] Sensor ID collision detected at ${timestamp.toISOString()}`,
        `- adding suffix to ensure uniqueness`
      );
      sensorId = `${sensorId}-${index}`;
    }
    
    sensorIdSet.add(sensorId);
    return sensorId;
  });
  
  // Log summary
  const collisions = sensorIds.length - sensorIdSet.size;
  if (collisions > 0) {
    console.warn(`[Stock] Resolved ${collisions} sensor ID collision(s)`);
  }
  
  // Get batch suggestions
  const { suggestBatchAssignments } = await import('../core/stock-engine.js');
  return suggestBatchAssignments(sensorIds);
}
```

**Testing**:
```javascript
// Create test CSV with two sensors at same timestamp
const testData = {
  sensorEvents: [
    { timestamp: '2025-11-01T14:23:45Z', type: 'sensor_insert' },
    { timestamp: '2025-11-01T14:23:45Z', type: 'sensor_insert' }  // Same second!
  ]
};

// Expected result:
// - Sensor-2025-11-01-142345
// - Sensor-2025-11-01-142345-1  (suffix added)
// - Console warning logged
```

---

## ✅ ACCEPTANCE CRITERIA

### Fix #1: Batch Capacity
- [ ] `assignSensorToBatch()` throws error when batch is at capacity
- [ ] Error message includes batch lot number and current count
- [ ] Existing assignments are checked correctly
- [ ] Test case passes (2 assigns succeed, 3rd fails)

### Fix #2: Storage Source
- [ ] All sensors have `storageSource` field ('localStorage' or 'sqlite')
- [ ] All sensors have `isEditable` field (true/false)
- [ ] UI shows "RECENT" badge for localStorage sensors (green)
- [ ] UI shows "HISTORICAL" badge for SQLite sensors (gray)
- [ ] Lock toggle button disabled for SQLite sensors
- [ ] Tooltip explains why historical sensors are read-only

### Fix #3: Sensor ID Uniqueness
- [ ] Collision detection works (Set-based checking)
- [ ] Collisions get suffix added (`-0`, `-1`, etc.)
- [ ] Console warning logged when collision occurs
- [ ] Summary shows total collisions resolved
- [ ] Test case with same-second timestamps passes

---

## 🧪 TESTING PLAN

### Manual Testing Workflow

1. **Start Dev Server**
   ```bash
   cd /Users/jomostert/Documents/Projects/agp-plus
   export PATH="/opt/homebrew/bin:$PATH"
   npx vite --port 3001
   ```

2. **Test Fix #1 (Batch Capacity)**
   - Open Stock Management
   - Create batch with `total_quantity = 2`
   - Assign 2 sensors → should succeed
   - Try to assign 3rd sensor → should fail with clear error
   - Verify error message shows lot number + capacity

3. **Test Fix #2 (Storage Source)**
   - Upload recent CSV → check for green "RECENT" badges
   - Find sensor >30 days old → check for gray "HISTORICAL" badge
   - Try to toggle lock on historical sensor → button should be disabled
   - Hover over disabled button → tooltip should appear

4. **Test Fix #3 (Sensor ID Uniqueness)**
   - Open DevTools Console
   - Upload CSV (or simulate detection)
   - Check console for collision warnings (if any same-second detections)
   - Verify sensor IDs in database have suffixes if needed

---

## 📝 COMMIT STRATEGY

### After Fix #1
```bash
git add src/storage/stockStorage.js
git commit -m "feat(stock): add batch capacity validation

- Prevent over-assignment of sensors to batches
- Check batch.total_quantity before assignment
- Throw descriptive error with lot number + capacity
- Addresses TIER2_SYNTHESIS Priority 1 Action 1.1

Closes #[issue-number] (if tracking)"
```

### After Fix #2
```bash
git add src/hooks/useSensorDatabase.js src/components/SensorHistoryModal.jsx
git commit -m "feat(sensors): add storage source indicators

- Add storageSource field ('localStorage' | 'sqlite')
- Add isEditable field (true | false)
- Show 'RECENT' badge for localStorage sensors (green)
- Show 'HISTORICAL' badge for SQLite sensors (gray)
- Disable lock toggle for read-only historical sensors
- Add tooltip explaining read-only restriction
- Addresses TIER2_SYNTHESIS Priority 1 Action 1.2

Closes #[issue-number]"
```

### After Fix #3
```bash
git add src/storage/masterDatasetStorage.js
git commit -m "feat(sensors): prevent sensor ID collisions

- Add Set-based collision detection in ID generation
- Append suffix (-0, -1, etc.) when collision detected
- Log warning when collisions occur
- Add summary of total collisions resolved
- Addresses TIER2_SYNTHESIS Priority 1 Action 1.3

Closes #[issue-number]"
```

### Final Integration Commit
```bash
git commit --allow-empty -m "chore(release): prepare v3.1.1

Priority 1 fixes implemented:
- Batch capacity validation (data quality)
- Storage source indicators (UX clarity)
- Sensor ID collision prevention (data integrity)

Total changes: ~50 LOC
Risk: LOW (additive changes, no breaking)
Testing: Manual validation complete

See docs/analysis/TIER2_SYNTHESIS.md for full context"
```

---

## 🚦 NEXT STEPS AFTER COMPLETION

### Immediate (Today)
- [ ] Complete all 3 Priority 1 fixes
- [ ] Run manual test plan
- [ ] Commit each fix with descriptive messages
- [ ] Update `project/STATUS.md` with completion

### Short-term (This Week)
- [ ] Implement Priority 2: Error recovery logging (1 hour)
- [ ] Document known limitations in README
- [ ] Consider creating GitHub issues for Priority 3-4 items

### Long-term (v3.2.0 / v4.0.0)
- [ ] Priority 3: Maintenance features (2 hours)
- [ ] Priority 4: IndexedDB migration (8-12 hours)
- [ ] Performance profiling
- [ ] Advanced metrics (GRI, CONGA) if needed

---

## 📚 REFERENCE DOCUMENTS

**Required Reading**:
- `/docs/analysis/TIER2_SYNTHESIS.md` - Full analysis + all 4 priorities
- `/reference/metric_definitions.md` - If touching metrics
- `/reference/minimed_780g_ref.md` - Device context

**Optional Context**:
- `/docs/analysis/DUAL_STORAGE_ANALYSIS.md` - Deep dive on storage issues
- `/project/V3_ARCHITECTURE.md` - Overall system design
- `/reference/GIT_WORKFLOW.md` - Commit conventions

---

## ⏱️ TIME TRACKING

**Estimated Breakdown**:
- Fix #1 (Batch Capacity): 15 minutes
- Fix #2 (Storage Source): 30 minutes
- Fix #3 (Sensor ID): 30 minutes
- Testing: 30 minutes
- Documentation: 15 minutes
- **Total: ~2 hours**

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

- [ ] All 3 fixes implemented
- [ ] Manual testing complete
- [ ] Git commits pushed
- [ ] `STATUS.md` updated with completion
- [ ] This handoff archived to `/docs/handoffs/2025-11-01_priority1-fixes.md`
- [ ] New handoff created for next session (Priority 2 or other work)

---

**Last Updated**: 2025-11-01 14:30  
**Status**: ðŸŸ¡ Ready to start  
**Assigned**: Jo or Claude (pick up and execute)  
**Priority**: HIGH (closes architectural gaps)
