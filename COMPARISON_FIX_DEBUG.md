## 🐛 BUG FIX: Comparison Features Broken in V3 Mode

**Date:** October 26, 2025  
**Branch:** v3.0-dev  
**Status:** Fixed - Needs Testing

---

### Problem Identified

When Phase 3.5 implemented the V2/V3 transformation layer, it broke the **comparison features**:
1. ❌ Period comparison (14d vs previous 14d) not showing
2. ❌ Workday/Rest day split not showing

### Root Cause

The `useComparison` hook needs the **FULL dataset date range** to check if there's enough historical data for comparison, but `safeDateRange` was being calculated from the **filtered range** (e.g., "last 14 days only").

#### Example of the Bug:
```javascript
// User filters to "Last 14d" (Oct 12-26)
safeDateRange = { min: Oct 12, max: Oct 26 }

// useComparison checks: "Is there data before Oct 12?"
// Answer: NO (because safeDateRange.min = Oct 12)
// Reality: YES! Master dataset goes back to July!
```

---

### Fix Applied

**File:** `src/components/AGPGenerator.jsx`

#### Change 1: Created Two Separate Date Ranges

```javascript
// FULL dataset range (for comparison availability checks)
const fullDatasetRange = useMemo(() => {
  if (useV3Mode && masterDataset.stats?.dateRange) {
    const { min, max } = masterDataset.stats.dateRange;
    if (min && max) {
      return {
        min: new Date(min),
        max: new Date(max)
      };
    }
  }
  // V2 mode: use CSV dateRange
  if (dateRange && dateRange.min && dateRange.max) {
    return dateRange;
  }
  return null;
}, [useV3Mode, masterDataset.stats, dateRange]);

// FILTERED range (for current period calculations)
const safeDateRange = useMemo(() => {
  if (useV3Mode && activeDateRange) {
    return {
      min: new Date(activeDateRange.start),
      max: new Date(activeDateRange.end)
    };
  }
  return fullDatasetRange;
}, [useV3Mode, activeDateRange, fullDatasetRange]);
```

#### Change 2: Pass Correct Range to useComparison

```javascript
// BEFORE (wrong):
const comparisonData = useComparison(activeReadings, startDate, endDate, safeDateRange);

// AFTER (correct):
const comparisonData = useComparison(activeReadings, startDate, endDate, fullDatasetRange);
```

#### Change 3: Added Debug Logging

```javascript
useEffect(() => {
  console.log('[AGPGenerator] Comparison Data:', comparisonData ? 'EXISTS' : 'NULL');
  console.log('[AGPGenerator] Workdays:', workdays ? `${workdays.size} days` : 'NULL');
  console.log('[AGPGenerator] Workday Metrics:', metricsResult?.workdayMetrics ? 'EXISTS' : 'NULL');
  console.log('[AGPGenerator] Restday Metrics:', metricsResult?.restdayMetrics ? 'EXISTS' : 'NULL');
}, [comparisonData, workdays, metricsResult]);
```

---

### What Should Work Now

✅ **Period Comparison:**
- Select "Last 14d" → Should show comparison with previous 14 days
- Select "Last 30d" → Should show comparison with previous 30 days
- Select "Last 90d" → No comparison (intentionally disabled)
- Custom range → No comparison

✅ **Workday/Rest Day Split:**
- Load ProTime JSON → Should activate workday split
- Should show separate metrics for work days vs rest days

---

### Testing Checklist

Open app at `http://localhost:3001` (or `http://localhost:5173` if Vite default):

#### Test 1: Period Comparison
- [ ] Click "LAST 14D" button
- [ ] Check console: Should say "Comparison Data: EXISTS"
- [ ] Scroll down: Should see "Period Comparison" section
- [ ] Should show current vs previous 14 days

#### Test 2: Workday Split
- [ ] Load ProTime JSON via FileUpload
- [ ] Check console: Should say "Workdays: X days"
- [ ] Check console: Should say "Workday Metrics: EXISTS"
- [ ] Scroll down: Should see "Workday Split" section

#### Test 3: Edge Cases
- [ ] Custom date range → No comparison (expected)
- [ ] Last 90d → No comparison (expected)
- [ ] Switch between periods → Comparison updates correctly

---

### If Still Not Working

**Check Console for:**
1. "Comparison Data: NULL" → `fullDatasetRange` not being calculated correctly
2. "Workdays: NULL" → ProTime not loaded or state not set
3. "Workday Metrics: NULL" → `useMetrics` not calculating workday split

**Possible Issues:**
- `masterDataset.stats` not loaded yet → check timing
- `workdays` Set not being passed to `useMetrics` correctly
- Conditional rendering `&&` chain failing on one condition

---

### Next Steps After Testing

If comparison works:
1. Remove debug logging
2. Commit changes
3. Update PHASE_3_5_COMPLETE.md
4. Move to Phase 4.0

If still broken:
1. Share console output
2. Check what values are actually in `fullDatasetRange`
3. Verify `masterDataset.stats.dateRange` structure
