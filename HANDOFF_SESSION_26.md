# HANDOFF - Async Storage Refactor (Session 26)

**Date**: 2025-11-14 23:30  
**Session**: 25 → 26  
**Branch**: `main` (ONLY branch - no feature branches)  
**Status**: ⚠️ ASYNC CONVERSION 90% COMPLETE - One remaining issue

---

## ⚡ CRITICAL: START COMMANDS

**Desktop Commander is vereist!** Werk in: `/Users/jomostert/Documents/Projects/agp-plus`

```bash
# Start dev server
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001

# Server draait op: http://localhost:3001/
```

**⚠️ ALTIJD gebruiken**: Desktop Commander voor alle file operations!

---

## 🎯 WAT ER GEDAAN IS (Session 25)

### Phase 1-3: Core Async Conversion ✅ COMPLEET

**1. sensorStorage.js** (438 lines) - Volledig async
- ✅ `getStorage()` → async IndexedDB read
- ✅ `saveStorage()` → async IndexedDB write
- ✅ Alle 22 exported functions zijn async
- ✅ `calculateStatus()` blijft SYNC (accepts deletedList param)
- ✅ Status calculation werkt correct

**2. useSensors.js** (46 lines) - Async hook
- ✅ `load()` function is async met Promise.all
- ✅ Alle sensorStorage calls hebben await
- ✅ Clean error handling

**3. SensorHistoryPanel.jsx** (~1200 lines) - Alle handlers async
- ✅ useEffect met async IIFE
- ✅ handleToggleLock → async met await
- ✅ handleDelete → async met await
- ✅ handleBatchAssign → async met await
- ✅ handleExport → async met await
- ✅ handleImport (reader.onload) → async met await

### Phase 4: Comprehensive Check ⚠️ 90% COMPLEET

**Fixed:**
- ✅ masterDatasetStorage.js - `getSensorBatchSuggestions()` awaits getAllSensors
- ✅ DataManagementModal.jsx - `clearAllSensors()` awaited

**Remaining Issue:**
- 🔴 day-profile-engine.js - Complex async cascade problem

---

## 🔴 REMAINING WORK (Session 26)

### Problem: day-profile-engine.js Async Cascade

**Current Situation:**
```javascript
// day-profile-engine.js (PROBLEEM)
function detectSensorChanges(allData, targetDate) {
  const sensors = getAllSensors(); // ❌ getAllSensors is NU async!
  // ... rest of function
}

// Called from:
function getDayProfile(data, date) {
  const sensorChanges = detectSensorChanges(data, date); // ❌ Niet async
}

// Called from:
export function getLastSevenDays(data, csvCreatedDate) {
  const profiles = sortedDates.map(date => getDayProfile(data, date)); // ❌ Niet async
}

// Called from useDayProfiles.js:
const dayProfiles = useMemo(() => {
  const profiles = getLastSevenDays(csvData, csvCreatedDate); // ❌ CANNOT be async!
  // useMemo CANNOT return Promise!
}, [deps]);
```

**Why This is a Problem:**
1. getAllSensors() is now async (IndexedDB)
2. detectSensorChanges() calls it → needs to be async
3. getDayProfile() calls detectSensorChanges → needs to be async  
4. getLastSevenDays() calls getDayProfile → needs to be async
5. **BUT**: useMemo cannot be async! 💥

### Solution: Option A (RECOMMENDED)

**Keep day-profile-engine.js SYNC - Pass sensors as parameter**

**Strategy:**
1. Load sensors ONCE in useDayProfiles.js hook
2. Pass sensors as parameter through entire call chain
3. Remove getAllSensors() import from day-profile-engine.js
4. Keep ALL functions SYNC (no async cascade)

**Implementation Steps:**

#### Step 1: Update day-profile-engine.js function signatures
```javascript
// BEFORE:
export function getLastSevenDays(data, csvCreatedDate)
export function getDayProfile(data, date)
function detectSensorChanges(allData, targetDate)

// AFTER:
export function getLastSevenDays(data, csvCreatedDate, sensors = [])
export function getDayProfile(data, date, sensors = [])
function detectSensorChanges(allData, targetDate, sensors = [])
```

#### Step 2: Update detectSensorChanges implementation
```javascript
// BEFORE (line ~199):
function detectSensorChanges(allData, targetDate) {
  const allChanges = [];
  try {
    const sensors = getAllSensors(); // ❌ REMOVE THIS
    // ...
  }
}

// AFTER:
function detectSensorChanges(allData, targetDate, sensors = []) {
  const allChanges = [];
  
  // PRIORITY 1: Check sensor database (high confidence)
  if (sensors && sensors.length > 0) {
    // ... rest of logic (geen try-catch nodig)
  }
  
  // PRIORITY 2: CSV alerts
  // ... (unchanged)
}
```

#### Step 3: Update getDayProfile to pass sensors
```javascript
// BEFORE (line ~78):
const sensorChanges = detectSensorChanges(data, date);

// AFTER:
const sensorChanges = detectSensorChanges(data, date, sensors);
```

#### Step 4: Update getLastSevenDays to pass sensors
```javascript
// BEFORE (line ~52):
const profiles = sortedDates.map(date => getDayProfile(data, date));

// AFTER:
const profiles = sortedDates.map(date => getDayProfile(data, date, sensors));
```

#### Step 5: Update useDayProfiles.js to load and pass sensors
```javascript
// BEFORE (line ~104):
const dayProfiles = useMemo(() => {
  // ...
  const profiles = getLastSevenDays(csvData, csvCreatedDate);
  // ...
}, [csvData, dateRange, currentMetrics, tddData, workdaySet]);

// AFTER:
const [sensors, setSensors] = useState([]);

useEffect(() => {
  (async () => {
    const { getAllSensors } = await import('../storage/sensorStorage');
    const loadedSensors = await getAllSensors();
    setSensors(loadedSensors);
  })();
}, []);

const dayProfiles = useMemo(() => {
  if (!sensors) return null; // Wait for sensors to load
  // ...
  const profiles = getLastSevenDays(csvData, csvCreatedDate, sensors);
  // ...
}, [csvData, dateRange, currentMetrics, tddData, workdaySet, sensors]); // Add sensors dep
```

#### Step 6: Remove getAllSensors import from day-profile-engine.js
```javascript
// BEFORE (line ~15):
import { getAllSensors } from '../storage/sensorStorage.js';

// AFTER:
// (remove this line completely)
```

**Estimated Time**: 20-30 minutes

---

## 📋 IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Desktop Commander actief
- [ ] Werkdirectory: `/Users/jomostert/Documents/Projects/agp-plus`
- [ ] Dev server draait op port 3001
- [ ] PROGRESS.md open voor updates

### Implementation Steps
- [ ] Step 1: Update function signatures in day-profile-engine.js
- [ ] Step 2: Fix detectSensorChanges (remove getAllSensors call, use param)
- [ ] Step 3: Update getDayProfile (pass sensors to detectSensorChanges)
- [ ] Step 4: Update getLastSevenDays (pass sensors to getDayProfile)
- [ ] Step 5: Update useDayProfiles.js (load sensors, pass to functions)
- [ ] Step 6: Remove getAllSensors import from day-profile-engine.js
- [ ] Test: Check browser console for errors
- [ ] Test: Navigate to DAGPROFIELEN panel
- [ ] Test: Verify day profiles render correctly
- [ ] Update PROGRESS.md with completion
- [ ] Commit: "feat: Complete async refactor - day profiles use sensor params"

---

## 📂 KEY FILES

**Modified in Session 25:**
- `src/storage/sensorStorage.js` (438 lines) - Async IndexedDB
- `src/hooks/useSensors.js` (46 lines) - Async hook
- `src/components/panels/SensorHistoryPanel.jsx` (~1200 lines) - Async handlers
- `src/storage/masterDatasetStorage.js` (1036 lines) - Line ~943 fixed
- `src/components/DataManagementModal.jsx` (809 lines) - Line ~434 fixed
- `PROGRESS.md` - Session 25 updates
- `ASYNC_REMAINING_WORK.md` - Detailed implementation plan

**To Modify in Session 26:**
- `src/core/day-profile-engine.js` (462 lines) - Lines ~15, ~35, ~57, ~199
- `src/hooks/useDayProfiles.js` (151 lines) - Lines ~90-110

---

## 🧪 TESTING PLAN

### After Implementation

1. **Server Test**:
   ```bash
   # Should compile without errors
   npx vite --port 3001
   ```

2. **Browser Tests**:
   - [ ] Open http://localhost:3001/
   - [ ] No console errors on load
   - [ ] Navigate to IMPORT panel
   - [ ] Upload test CSV: `test-data/Jo Mostert 14-11-2025.csv`
   - [ ] Navigate to DAGPROFIELEN panel
   - [ ] Verify day profiles render
   - [ ] Check for sensor change markers (should show on chart)
   - [ ] No console errors

3. **Comprehensive Check**:
   ```javascript
   // In browser console:
   // Should return Promise
   import('../storage/sensorStorage').then(s => s.getAllSensors())
   
   // Should show sensors array
   .then(sensors => console.log(sensors))
   ```

---

## 🚨 POTENTIAL ISSUES & SOLUTIONS

### Issue 1: useMemo runs before sensors loaded
**Symptom**: Day profiles empty or null  
**Solution**: Check `if (!sensors) return null;` in useMemo

### Issue 2: Sensors not passed correctly
**Symptom**: Sensor change markers missing from day charts  
**Solution**: Console.log sensors param in detectSensorChanges

### Issue 3: Function signature mismatch
**Symptom**: "sensors is not iterable" error  
**Solution**: Ensure default parameter `sensors = []` in all functions

---

## 💡 WAAROM DEZE AANPAK?

**Alternative Options Considered:**

**❌ Option B: Make entire chain async**
- Would require converting useMemo → useState + useEffect
- More complex, more changes
- Risk of cascade effects
- Estimated: 45-60 minutes

**✅ Option A: Keep SYNC, pass parameters**
- Clean separation of concerns
- Sensors loaded once, passed everywhere
- No async cascade
- Works with existing useMemo pattern
- Estimated: 20-30 minutes

---

## 📊 SESSION METRICS

**Session 25:**
- Duration: ~60 minutes (22:30-23:30)
- Files modified: 5
- Functions converted: 25+
- Bugs fixed: 2
- Status: 90% complete

**Session 26 (estimated):**
- Duration: 20-30 minutes
- Files to modify: 2
- Functions to update: 3
- Status: Will reach 100% complete

---

## 🎯 SUCCESS CRITERIA

Session 26 is complete when:
1. ✅ No console errors on app load
2. ✅ Day profiles render correctly
3. ✅ Sensor change markers show on charts
4. ✅ getAllSensors() called only once (not in every day profile)
5. ✅ No async functions in day-profile-engine.js
6. ✅ PROGRESS.md updated
7. ✅ Committed to main branch

---

## 🔗 REFERENCE DOCUMENTS

- `ASYNC_REFACTOR_ANALYSIS.md` - Original analysis (1071 lines)
- `ASYNC_REMAINING_WORK.md` - Detailed plan for Session 26
- `HANDOFF_SESSION_24.md` - Previous handoff
- `PROGRESS.md` - Complete session log

---

## ⚡ QUICK START (Session 26)

```bash
# 1. Navigate to project (Desktop Commander required!)
cd /Users/jomostert/Documents/Projects/agp-plus

# 2. Start server
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001

# 3. Open in new terminal/Claude window:
# - Read this handoff
# - Open ASYNC_REMAINING_WORK.md
# - Update PROGRESS.md as you work
# - Follow implementation steps 1-6
# - Test thoroughly
# - Commit when done
```

---

**Handoff Date**: 2025-11-14 23:30  
**Branch**: `main` (only branch)  
**Next Steps**: Implement Option A (steps 1-6)  
**Estimated Time**: 20-30 minutes  
**Status**: 🟡 READY TO COMPLETE ⚡

---

**LET'S FINISH THIS!** 🚀
