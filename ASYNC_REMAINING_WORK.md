# ASYNC REFACTOR - Remaining Work

## ✅ COMPLETED (Phases 1-3)

1. ✅ sensorStorage.js - All functions async
2. ✅ useSensors.js - Async load function  
3. ✅ SensorHistoryPanel.jsx - All handlers async
4. ✅ masterDatasetStorage.js - getSensorBatchSuggestions fixed
5. ✅ DataManagementModal.jsx - clearAllSensors awaited

## 🔄 REMAINING WORK

### Option A: Keep day-profile-engine SYNC (RECOMMENDED)
**Rationale**: Day profiles are computed in useMemo, cannot be async

**Changes needed**:
1. Remove getAllSensors() import from day-profile-engine.js
2. Load sensors in useDayProfiles.js hook
3. Pass sensors as parameter to getLastSevenDays()
4. Pass sensors to getDayProfile()
5. Pass sensors to detectSensorChanges()  
6. Keep all functions SYNC

**Benefits**:
- No async cascade
- Cleaner architecture
- Single load point for sensors
- Works with useMemo

**Estimated time**: 20-30 minutes

### Option B: Make day-profiles ASYNC (MORE WORK)
**Changes needed**:
1. Convert useMemo to useState + useEffect in useDayProfiles.js
2. Make getLastSevenDays async
3. Make getDayProfile async
4. Make detectSensorChanges async
5. Update all callers

**Estimated time**: 45-60 minutes
**Risk**: Cascade effects on other files

## RECOMMENDATION

Use Option A - keep day-profile-engine SYNC and pass sensors as parameter.
This is the cleanest solution and avoids async cascade issues.

## FILES TO CHECK AFTER FIX

Run comprehensive search for any remaining sensorStorage. calls:
- Import statements (comments) - ignore
- .OLD.jsx files - ignore
- Actual function calls - verify await

**Time**: 23:26
**Status**: Ready to implement Option A
