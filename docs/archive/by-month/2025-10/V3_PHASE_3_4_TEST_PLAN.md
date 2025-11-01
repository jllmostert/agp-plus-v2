# Phase 3.4 Integration - Test Plan

**Date:** October 25, 2025 - 22:00 CET  
**Branch:** v3.0-dev  
**Server:** http://localhost:3003

---

## ✅ CODE CHANGES COMPLETE

### Files Modified:
1. `src/components/AGPGenerator.jsx` - Added v3 integration

### Changes Made:
- ✅ Import useMasterDataset hook
- ✅ Import MigrationBanner component
- ✅ Import DateRangeFilter component
- ✅ Add masterDataset hook initialization
- ✅ Add selectedDateRange state
- ✅ Implement dual-mode data loading (v2/v3)
- ✅ Add handleDateRangeChange handler
- ✅ Update metrics to use activeReadings
- ✅ Add MigrationBanner to UI
- ✅ Add DateRangeFilter to UI (conditional)
- ✅ Update render conditionals for dual-mode
- ✅ Add v3 auto-initialization effect
- ✅ Fix circular dependency in useEffect

---

## 🧪 MANUAL TESTING REQUIRED

### Test 1: Fresh Start (No Migration Needed)
**Starting state:** Clean browser (clear IndexedDB)

**Steps:**
1. Open http://localhost:3003
2. Open browser console (F12)
3. Check for JavaScript errors
4. Verify MigrationBanner does NOT appear (no data to migrate)
5. Verify DateRangeFilter does NOT appear (no v3 data yet)
6. Upload CSV file
7. Verify data loads in v2 mode
8. Verify AGP displays correctly

**Expected:**
- ✅ No errors in console
- ✅ No migration banner (nothing to migrate)
- ✅ No date range filter (v2 mode)
- ✅ CSV loads and AGP works (v2 mode)

---

### Test 2: V2 → V3 Migration Flow
**Starting state:** Has v2 uploads in storage

**Steps:**
1. Refresh page
2. Check if MigrationBanner appears (blue → green)
3. Wait for "Migration complete" message
4. Verify banner auto-dismisses after 3s
5. Check if DateRangeFilter appears
6. Verify it shows correct dataset range
7. Check console for migration stats

**Expected:**
- ✅ Blue banner: "Migrating to v3..."
- ✅ Green banner: "✓ Migration complete! ..."
- ✅ Stats show: readings, sensors, cartridges
- ✅ Banner dismisses automatically
- ✅ DateRangeFilter appears
- ✅ Filter shows dataset range at bottom

---

### Test 3: Date Range Filter Functionality
**Starting state:** V3 mode active, data migrated

**Steps:**
1. Check initial date range (should be last 14 days)
2. Click "7 Days" button
3. Verify AGP updates to show last 7 days
4. Click "30 Days" button
5. Verify AGP updates to show last 30 days
6. Click "All Time" button
7. Verify AGP shows full dataset
8. Click "Custom" to enable custom mode
9. Select custom date range
10. Click "Apply"
11. Verify AGP updates to custom range

**Expected:**
- ✅ Each quick range button works
- ✅ AGP updates instantly on click
- ✅ Metrics recalculate for selected range
- ✅ TIR percentages change correctly
- ✅ Custom mode allows manual date selection
- ✅ Apply button updates AGP

---

### Test 4: Dual-Mode Switching
**Starting state:** V3 mode active

**Steps:**
1. Verify DateRangeFilter is visible
2. Upload new CSV file
3. Check if app switches to v2 mode
4. Verify DateRangeFilter disappears
5. Verify AGP still works (v2 mode)
6. Refresh page
7. Check if migration runs again
8. Verify app returns to v3 mode

**Expected:**
- ✅ V3 mode shows filter
- ✅ New CSV switches to v2 mode
- ✅ Filter disappears in v2 mode
- ✅ AGP works in both modes
- ✅ Migration runs on refresh
- ✅ Returns to v3 mode after migration

---

### Test 5: Metrics Accuracy
**Starting state:** V3 mode with known dataset

**Steps:**
1. Select "7 Days" range
2. Note TIR percentage
3. Select "14 Days" range
4. Note TIR percentage (should be different)
5. Open browser console
6. Run: `console.log('Readings:', window.debugReadings?.length)`
7. Verify reading count matches selected range

**Expected:**
- ✅ Different ranges show different TIR
- ✅ Metrics are accurate for each range
- ✅ Reading count matches range
- ✅ No duplicate readings
- ✅ All calculations correct

---

### Test 6: Edge Cases
**Starting state:** V3 mode active

**Edge cases to test:**
1. Select range with < 14 days of data
2. Select range with no data (outside dataset)
3. Select start date > end date (should be prevented)
4. Rapidly click different range buttons
5. Switch between custom and preset modes
6. Clear all data and start fresh

**Expected:**
- ✅ Handles short datasets gracefully
- ✅ Shows appropriate message for no data
- ✅ Prevents invalid date selections
- ✅ No race conditions on rapid clicks
- ✅ Smooth mode transitions
- ✅ Clean reset on fresh start

---

## 🐛 KNOWN ISSUES TO WATCH FOR

### Potential Problems:
- [ ] DateRangeFilter not appearing after migration
- [ ] AGP not updating when range changes
- [ ] Duplicate readings in filtered dataset
- [ ] Memory leaks from hook subscriptions
- [ ] Race conditions during migration
- [ ] Invalid date calculations
- [ ] Missing readings in filtered range

### Debug Commands:
```javascript
// Check v3 mode status
console.log('V3 Mode:', window.debugV3Mode);

// Check master dataset
(async () => {
  const { loadOrRebuildCache } = await import('/src/storage/masterDatasetStorage.js');
  const cache = await loadOrRebuildCache();
  console.log('Readings:', cache.allReadings?.length);
  console.log('Range:', cache.dateRange);
})();

// Check active readings
console.log('Active Readings:', window.debugActiveReadings?.length);

// Check selected range
console.log('Selected Range:', window.debugSelectedRange);
```

---

## ✅ TEST COMPLETION CHECKLIST

Once ALL tests pass:
- [ ] No console errors
- [ ] Migration works correctly
- [ ] Date range filter appears and functions
- [ ] All quick range buttons work
- [ ] Custom mode works
- [ ] Metrics update correctly
- [ ] Dual-mode switching works
- [ ] Edge cases handled
- [ ] Performance is acceptable
- [ ] No memory leaks

**Then:** Ready to commit Phase 3.4! 🚀

---

## 📝 TEST RESULTS

### Test 1: Fresh Start
**Status:** ⏳ NOT TESTED YET  
**Notes:**

### Test 2: V2 → V3 Migration
**Status:** ⏳ NOT TESTED YET  
**Notes:**

### Test 3: Date Range Filter
**Status:** ⏳ NOT TESTED YET  
**Notes:**

### Test 4: Dual-Mode Switching
**Status:** ⏳ NOT TESTED YET  
**Notes:**

### Test 5: Metrics Accuracy
**Status:** ⏳ NOT TESTED YET  
**Notes:**

### Test 6: Edge Cases
**Status:** ⏳ NOT TESTED YET  
**Notes:**

---

**Next Step:** Run manual tests in browser, document results above
