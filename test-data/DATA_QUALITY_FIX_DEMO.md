# Data Quality Calculation Fix - Demonstration

**Date**: 2025-11-07  
**Issue**: Time-based vs Day-based calculation  
**File**: `src/core/metrics-engine.js`

---

## Problem

The old calculation used `uniqueDays × 288` to calculate expected readings, which penalized partial days (especially the last ongoing day) by counting them as full days with missing data.

## Example Scenario

**Data**: 14-day period with partial last day
- Days 1-13: Complete (288 readings each) = 3,744 readings
- Day 14: Partial - only 12 hours (144 readings)
- **Total actual readings**: 3,888

---

## Old Calculation (Day-based)

```javascript
const uniqueDays = 14;
const expectedReadings = uniqueDays * 288;  // = 4,032
const actualReadings = 3888;
const missingReadings = 4032 - 3888;  // = 144
const missingPercent = (144 / 4032) * 100;  // = 3.57%
const uptimePercent = 100 - 3.57;  // = 96.43%
```

**Result**: 96.43% data quality

âŒ **Problem**: Day 14 is penalized for 144 "missing" readings that couldn't have happened yet!

---

## New Calculation (Time-based)

```javascript
// Calculate actual time span
const periodStart = "2025-10-24 00:00:00";
const periodEnd = "2025-11-06 12:00:00";  // 13.5 days
const elapsedMinutes = 13.5 * 24 * 60;  // = 19,440 minutes

const expectedReadings = Math.floor(19440 / 5) + 1;  // = 3,889
const actualReadings = 3888;
const missingReadings = 3889 - 3888;  // = 1
const missingPercent = (1 / 3889) * 100;  // = 0.03%
const uptimePercent = 100 - 0.03;  // = 99.97%
```

**Result**: 99.97% data quality

âœ… **Fixed**: Only expects readings for elapsed time, not full days!

---

## Impact

**Improvement**: 96.43% â†' 99.97% (+3.54 percentage points)

**Why this matters**:
- No artificial deflation from ongoing days
- More accurate representation of sensor uptime
- Data quality metric now reflects actual missing readings, not "future" readings

---

## Technical Details

**Change location**: Line 239-253 in `metrics-engine.js`

**Key changes**:
1. Calculate `elapsedMinutes` from first to last timestamp
2. `expectedReadings = floor(elapsedMinutes / 5) + 1`
3. Only count readings within actual time span
4. Complete days threshold: ≥95% of 288 (274+ readings)

**Backwards compatibility**: âœ… Yes - only changes calculation method, not data structure

---

**Conclusion**: Time-based calculation provides more accurate data quality metrics by only expecting readings for time that has actually elapsed.
