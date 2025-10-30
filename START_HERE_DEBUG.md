# 🐛 DEBUG SESSION - Sensor endTime Missing

## Problem Statement

When registering new sensors from CSV, only the **startTime** is written to IndexedDB. The **endTime** of the previous sensor is never updated, causing all sensors to appear "active" with no duration.

## Quick Context

**Phase**: v3.1 Phase 4 - Sensor Registration  
**Status**: UI works, but data incomplete  
**Server**: http://localhost:3001/ (PID 31953)

## The Issue

```
CURRENT BEHAVIOR:
Sensor #219: start=2025-09-15 10:00, end=null ❌
Sensor #220: start=2025-10-25 12:30, end=null ❌

EXPECTED BEHAVIOR:
Sensor #219: start=2025-09-15 10:00, end=2025-10-25 08:11 ✅
Sensor #220: start=2025-10-25 12:30, end=null ✅
```

## Root Cause

The gap detection gives us BOTH timestamps:
```javascript
candidate.gaps[0] = {
  startTime: "2025-10-25T08:11:00Z",  // OLD sensor END
  endTime: "2025-10-25T12:30:00Z",    // NEW sensor START
  duration: 259  // minutes
}
```

But `handleConfirm` only uses one:
```javascript
// ❌ WRONG - Only sets new sensor start
await addSensor({
  start_timestamp: candidate.timestamp,
  end_timestamp: null
});

// ✅ CORRECT - Should ALSO update previous sensor end
const lastSensor = await getLastSensor();
await updateSensor(lastSensor.id, {
  end_timestamp: candidate.gaps[0].startTime
});
```

## Files Involved

1. `src/storage/sensorStorage.js` - Check if `updateSensor()` exists
2. `src/components/SensorRegistration.jsx` - Fix `handleConfirm()`

## Fix Strategy

**Step 1**: Verify storage API has update function  
**Step 2**: Modify handleConfirm to update previous sensor  
**Step 3**: Test with ONE candidate first  
**Step 4**: Check IndexedDB to verify both timestamps

## Test Data

**CSV**: `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv`  
**Gap**: Oct 25, 08:11 → 12:30 (259 minutes)  
**Expected**: Sensor #219 ends at 08:11, #220 starts at 12:30

## Next Steps

1. Read `sensorStorage.js` to check for `updateSensor`
2. If missing, create it
3. Update `handleConfirm` to set both timestamps
4. Test and verify in IndexedDB

---

**Full Details**: [HANDOFF_2025-10-30_14-30.md](./HANDOFF_2025-10-30_14-30.md)  
**Documentation**: Phase 4 sensor registration debug  
**Status**: Ready to fix - clear root cause identified
