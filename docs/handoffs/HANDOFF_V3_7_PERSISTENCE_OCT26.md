# 🔧 HANDOFF - V3.7 Data Persistence & Comparison Fixes
**Session Date**: October 26, 2025  
**Time**: 17:30 CET  
**Branch**: v3.0-dev  
**Status**: 🐛 **CRITICAL BUGS - Need Fixes**

---

## 🎯 WHAT'S BROKEN

### Critical Issues Discovered:

1. **❌ Comparison Not Working**
   - User has 4185 readings in master dataset (July-October)
   - Selecting "Last 14 days" shows NO comparison
   - Selecting "Last 30 days" shows NO comparison
   - Console shows: `[useComparison] Insufficient history`
   - **Root cause**: Date range conversion bug in useComparison.js

2. **❌ ProTime Data Not Persistent**
   - Upload ProTime PDF → workdays stored ✅
   - Upload CSV → comparison works with workdays ✅
   - Refresh page → workdays GONE ❌
   - **Root cause**: ProTime workdays in IndexedDB, but not loaded on app init

3. **❌ Cartridge Changes Not Showing**
   - Sensor changes display correctly on day profiles ✅
   - Cartridge changes (rewind events) NOT displaying ❌
   - **Root cause**: Detection logic may be filtering out cartridge changes

---

## 🔍 DEBUGGING INSIGHTS

### Console Logs Analysis:

```javascript
[useMasterDataset] Total readings: 4185
[useComparison] Insufficient history: { prevStart, datasetMin }
```

**What this means:**
- Master dataset HAS data (4185 readings = ~29 days at 5min intervals)
- Comparison calculation starts but fails date range check
- Previous period dates calculated correctly
- But comparison thinks dataset doesn't go back far enough

### The Date Range Bug:

**File**: `src/hooks/useComparison.js` (line 70-76)

```javascript
// Ensure dateRange.min is a Date object (might be string from V3)
const datasetMinDate = dateRange.min instanceof Date 
  ? dateRange.min 
  : new Date(dateRange.min);

// Check if previous period has sufficient data
if (prevStart < datasetMinDate) {
  console.log('[useComparison] Insufficient history:', {...});
  setComparisonData(null);
  return;
}
```

**The Problem:**
- `fullDatasetRange` from AGPGenerator uses `masterDataset.stats.dateRange`
- That dateRange has `{ min: unixTimestamp, max: unixTimestamp }` (numbers)
- AGPGenerator converts to Date: `min: new Date(min), max: new Date(max)`
- But if conversion fails or returns invalid Date, comparison breaks

**Expected Flow:**
1. Dataset: July 1 - Oct 26 (4185 readings)
2. Selected period: Oct 12-26 (14 days)
3. Previous period: Sept 28 - Oct 11 (14 days)
4. Sept 28 is AFTER July 1 → Should work ✅
5. But check fails → Comparison disabled ❌

---

## 🛠️ FIX PLAN

### Priority 1: Fix Comparison Date Logic (15 min)

**File**: `src/hooks/useComparison.js`

**Current Code** (line 70-85):
```javascript
// Ensure dateRange.min is a Date object (might be string from V3)
const datasetMinDate = dateRange.min instanceof Date 
  ? dateRange.min 
  : new Date(dateRange.min);

// Check if previous period has sufficient data
if (prevStart < datasetMinDate) {
  console.log('[useComparison] Insufficient history:', {
    prevStart: prevStart.toISOString(),
    datasetMin: datasetMinDate.toISOString()
  });
  setComparisonData(null);
  return;
}
```

**Fix**:
```javascript
// Ensure dateRange.min is a Date object
// Handle: Date object, Unix timestamp (number), or ISO string
let datasetMinDate;
if (dateRange.min instanceof Date) {
  datasetMinDate = dateRange.min;
} else if (typeof dateRange.min === 'number') {
  datasetMinDate = new Date(dateRange.min);
} else if (typeof dateRange.min === 'string') {
  datasetMinDate = new Date(dateRange.min);
} else {
  console.error('[useComparison] Invalid dateRange.min:', dateRange.min);
  setComparisonData(null);
  return;
}

// Validate Date object
if (isNaN(datasetMinDate.getTime())) {
  console.error('[useComparison] Invalid date conversion:', dateRange.min);
  setComparisonData(null);
  return;
}

// Check if previous period has sufficient data
if (prevStart < datasetMinDate) {
  console.log('[useComparison] Insufficient history:', {
    prevStart: prevStart.toISOString(),
    datasetMin: datasetMinDate.toISOString(),
    currentPeriodDays,
    datasetDays: Math.round((new Date() - datasetMinDate) / (1000 * 60 * 60 * 24))
  });
  setComparisonData(null);
  return;
}

console.log('[useComparison] ✅ Date range check passed:', {
  prevStart: prevStart.toISOString(),
  prevEnd: prevEnd.toISOString(),
  datasetMin: datasetMinDate.toISOString(),
  datasetMax: (dateRange.max ? new Date(dateRange.max).toISOString() : 'unknown')
});
```

**What this fixes:**
- ✅ Handles all date format types (Date, number, string)
- ✅ Validates Date conversion
- ✅ Better error logging to debug failures
- ✅ Shows dataset span vs previous period span

---

### Priority 2: Fix ProTime Persistence (20 min)

**Problem**: ProTime workdays stored in IndexedDB but not loaded on init

**File**: `src/hooks/useMasterDataset.js`

**Current Code** (line 60-80):
```javascript
const loadData = useCallback(async () => {
  try {
    setIsLoading(true);
    setError(null);

    // Load cached dataset
    const cache = await loadOrRebuildCache();
    
    // Get dataset stats
    const datasetStats = await getMasterDatasetStats();
    setStats(datasetStats);

    // Apply date range filter if specified
    let filteredReadings = cache.allReadings;
    
    // ... filtering logic ...
```

**Add After Line 67** (after getting stats):
```javascript
    // Load ProTime workdays from settings
    let workdaySet = null;
    try {
      const { loadProTimeData } = await import('../storage/masterDatasetStorage');
      workdaySet = await loadProTimeData();
      if (workdaySet) {
        console.log('[useMasterDataset] ✅ Loaded ProTime workdays:', workdaySet.size);
      }
    } catch (err) {
      console.warn('[useMasterDataset] ProTime load failed:', err);
    }
```

**Then Update Stats Object** (line 68):
```javascript
    setStats({
      ...datasetStats,
      workdays: workdaySet  // Add workdays to stats
    });
```

**File**: `src/components/AGPGenerator.jsx`

**Find** (around line 90-100):
```javascript
const [workdays, setWorkdays] = useState(null);
```

**Add Effect Below It**:
```javascript
// Load ProTime workdays from master dataset on init
useEffect(() => {
  if (useV3Mode && masterDataset.stats?.workdays) {
    setWorkdays(masterDataset.stats.workdays);
    console.log('[AGPGenerator] ✅ Restored ProTime workdays:', masterDataset.stats.workdays.size);
  }
}, [useV3Mode, masterDataset.stats?.workdays]);
```

**What this fixes:**
- ✅ ProTime workdays loaded from IndexedDB on app init
- ✅ Workdays automatically restored when master dataset loads
- ✅ Works across page refreshes
- ✅ No need to re-upload ProTime after CSV upload

---

### Priority 3: Debug Cartridge Changes (10 min)

**File**: `src/hooks/useDayProfiles.js`

**Add Logging** to see what events are detected:

Find the event detection section (around line 50-100) and add:

```javascript
console.log('[useDayProfiles] Events for', profile.date, ':', {
  sensorChanges: profile.sensorChanges,
  cartridgeChanges: profile.cartridgeChanges,
  totalReadings: profile.readings.length,
  sampleReading: profile.readings[0]
});
```

**File**: `src/components/DayProfileCard.jsx`

**Check Rendering Logic** - verify cartridge changes are being passed to the component:

```javascript
console.log('[DayProfileCard] Props received:', {
  date,
  sensorChanges,
  cartridgeChanges,
  readingCount
});
```

**Expected Output:**
```
[useDayProfiles] Events for 2025/10/19: {
  sensorChanges: [{ minuteOfDay: 61, source: 'database', ... }],
  cartridgeChanges: [{ minuteOfDay: 1079 }],
  totalReadings: 288,
  sampleReading: { date: '2025/10/19', time: '00:00:00', glucose: 120, rewind: false }
}

[DayProfileCard] Props received: {
  date: '2025/10/19',
  sensorChanges: [...],
  cartridgeChanges: [...],
  readingCount: 288
}
```

**If cartridgeChanges is empty:**
- Check if CSV has `rewind` field populated
- Check detection thresholds in day-profile-engine.js
- Verify rewind events aren't filtered out

---

## 📋 TESTING CHECKLIST

### Test 1: Comparison Fix
1. ✅ Open http://localhost:5173
2. ✅ Should see existing data loaded (4185 readings)
3. ✅ Select period: "Last 14 days"
4. ✅ Check console for: `[useComparison] ✅ Date range check passed`
5. ✅ Should see comparison metrics (previous 14 days)
6. ✅ Select period: "Last 30 days"
7. ✅ Should see comparison metrics (previous 30 days)

### Test 2: ProTime Persistence
1. ✅ Upload ProTime PDF
2. ✅ Check console: `[AGPGenerator] ✅ Restored ProTime workdays: X`
3. ✅ Refresh page (Cmd+R)
4. ✅ Check console: `[useMasterDataset] ✅ Loaded ProTime workdays: X`
5. ✅ Check console: `[AGPGenerator] ✅ Restored ProTime workdays: X`
6. ✅ Verify workday comparison shows up if period is 14/30 days

### Test 3: Cartridge Changes
1. ✅ Open day profiles
2. ✅ Check console for event detection logs
3. ✅ Verify sensor changes shown with 🔵 markers
4. ✅ Verify cartridge changes shown with 💧 markers (if any exist)
5. ✅ If no cartridge changes, check CSV for rewind events

---

## 🚀 QUICK START

### Kill Existing Server
```bash
DC: start_process "lsof -ti:5173 | xargs kill -9" timeout_ms=3000
```

### Start Fresh Server
```bash
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && export PATH='/opt/homebrew/bin:$PATH' && npm run dev" timeout_ms=5000
```

### Open in Chrome
```
http://localhost:5173
```

---

## 🎯 SUCCESS CRITERIA

**You're done when:**
1. ✅ Comparison shows for 14/30 day periods (not "Insufficient history")
2. ✅ ProTime workdays persist across page refreshes
3. ✅ Cartridge changes display on day profiles (or confirmed CSV has no rewind events)
4. ✅ No console errors
5. ✅ All existing features still work (AGP, day profiles, export)

---

## 🗂️ FILES TO MODIFY

1. **src/hooks/useComparison.js** - Fix date range validation
2. **src/hooks/useMasterDataset.js** - Load ProTime on init
3. **src/components/AGPGenerator.jsx** - Restore workdays from stats
4. **src/hooks/useDayProfiles.js** - Add event detection logging
5. **src/components/DayProfileCard.jsx** - Add cartridge render logging

---

## 🐛 KNOWN ISSUES

1. **Comparison only works for 14/30 days** - By design, 90 days disabled
2. **ProTime has no glucose data** - Only workday markers, no CGM readings
3. **Date range conversions fragile** - V3 uses timestamps, V2 uses Date objects
4. **Sensor database not connected yet** - Phase 3.6 incomplete, using gap detection fallback

---

## 📊 CURRENT STATE

### What Works:
- ✅ Master dataset storage (4185 readings)
- ✅ CSV upload to master dataset
- ✅ Day profiles generation
- ✅ Sensor change detection (gap-based fallback)
- ✅ HTML/PDF export
- ✅ Date range filtering

### What's Broken:
- ❌ Comparison calculations (date bug)
- ❌ ProTime persistence (not loaded on init)
- ❌ Cartridge change markers (detection or rendering?)

### What's Not Built Yet (Phase 3.6):
- ⏳ Event detection engine (`detectAllEvents()`)
- ⏳ Sensor database integration
- ⏳ EventManager UI
- ⏳ JSON export/import for events

---

## 💡 DEBUGGING TIPS

### Check Master Dataset Contents:
Open DevTools → Application → IndexedDB → `agp-storage` → `reading_buckets`
- Should see month buckets (2025-07, 2025-08, etc.)
- Each bucket has readings array

### Check ProTime Storage:
Open DevTools → Application → IndexedDB → `agp-storage` → `settings`
- Look for key: `protime-workdays`
- Should have: `{ workdays: [...], lastUpdated: timestamp }`

### Check Date Range Values:
Add to AGPGenerator.jsx after fullDatasetRange calculation:
```javascript
console.log('[AGPGenerator] Full dataset range:', {
  min: fullDatasetRange?.min,
  max: fullDatasetRange?.max,
  minType: typeof fullDatasetRange?.min,
  maxType: typeof fullDatasetRange?.max,
  minValid: fullDatasetRange?.min instanceof Date && !isNaN(fullDatasetRange.min.getTime()),
  maxValid: fullDatasetRange?.max instanceof Date && !isNaN(fullDatasetRange.max.getTime())
});
```

---

## 🎨 UI/UX IMPROVEMENTS (For Next Session)

**After bugs are fixed, implement these:**

### Import Section Simplification:
Current clutter:
- CSV Upload
- ProTime PDF
- Sensor Database
- JSON Import
- Delete Options

**Proposed Structure:**
```
IMPORT DATA
├─ 📄 Upload CSV
└─ 📄 Upload ProTime PDF(s)

EXPORT DATA
├─ 💾 Export HTML
└─ 📊 Export PDF

MANAGE DATA
├─ 🗑️ Delete Last 2 Weeks
├─ 🗑️ Delete Custom Range
└─ ⚠️ Delete All Data (with confirmation)
```

### Day Profiles Button Layout:
Current: [Print] ... ... [Close]
Proposed: [Print/Export] [Close to edge]

Close button should be at screen edge, Print more centered.

---

**Ready to fix!** 🔧

*Last updated: October 26, 2025, 17:30 CET*
