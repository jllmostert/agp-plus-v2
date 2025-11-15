---
tier: 2
status: active
last_updated: 2025-10-29
purpose: Test scenarios and validation criteria for AGP+ v3.0
---

# AGP+ v3.0 TEST PLAN

**Version:** v3.0.0  
**Date:** October 29, 2025  
**Status:** Ready for comprehensive testing

---

## 🎯 TESTING OBJECTIVES

1. **Clinical Accuracy**: Verify all calculations match ADA/ATTD standards
2. **Data Integrity**: Ensure no data loss across sessions/uploads
3. **Event Detection**: Confirm sensor/cartridge changes detected correctly
4. **Performance**: Validate acceptable speed with large datasets
5. **Edge Cases**: Handle malformed data gracefully
6. **User Workflows**: Verify complete end-to-end scenarios

---

## ✅ COMPLETED TESTS (Oct 28-29)

### Sensor Detection Verification ✅
**Test File:** `Jo Mostert 28-10-2025.csv` (7 days, Oct 21-28)

**Results:**
- ✅ SENSOR CONNECTED alerts detected
- ✅ CHANGE SENSOR alerts detected
- ✅ LOST SENSOR SIGNAL correctly ignored
- ✅ SENSOR UPDATING correctly ignored
- ✅ Alert clustering (60-min window) working
- ✅ Red dashed lines appear at correct times in day profiles
- ✅ No false positives from warmup/lost signal events

**Evidence:**
- Day profiles show 2 sensor changes (Oct 23, Oct 26)
- Interactive test tool (`test-sensor-detection.html`) passes all checks
- Console logs confirm correct event timestamps

---

## 📋 PRIORITY 1: CLINICAL VALIDATION

### Test 1.1: 30-Day TIR Calculation
**Objective:** Verify Time in Range calculation matches clinical standards

**Test Data:**
- Upload: 30-day CSV from Medtronic CareLink
- Expected: TIR% within 70-180 mg/dL range

**Validation Steps:**
1. Count total readings in period
2. Count readings between 70-180 mg/dL
3. Calculate: (in-range / total) × 100
4. Compare with AGP+ display

**Success Criteria:**
- AGP+ TIR% matches manual calculation
- Difference < 0.1% (rounding tolerance)

**Manual Calculation Formula:**
```javascript
const inRange = readings.filter(r => r.value >= 70 && r.value <= 180).length;
const tir = (inRange / readings.length) * 100;
```

---

### Test 1.2: GMI Calculation
**Objective:** Verify Glucose Management Indicator formula

**Formula (ADA):**
```
GMI (%) = 3.31 + 0.02392 × [mean glucose in mg/dL]
```

**Test Steps:**
1. Calculate mean glucose from dataset
2. Apply formula
3. Compare with AGP+ display

**Success Criteria:**
- GMI matches formula (±0.01%)

**Example:**
- Mean glucose: 150 mg/dL
- Expected GMI: 3.31 + (0.02392 × 150) = 6.898%

---

### Test 1.3: TAR/TBR Thresholds
**Objective:** Verify correct threshold boundaries

**Thresholds:**
- TBR < 54 mg/dL (Level 2)
- TBR < 70 mg/dL (Level 1)
- TIR 70-180 mg/dL
- TAR > 180 mg/dL (Level 1)
- TAR > 250 mg/dL (Level 2)

**Test Steps:**
1. Create test dataset with known values
2. Upload to AGP+
3. Verify each threshold category

**Test Data:**
```javascript
const testData = [
  { value: 50 },  // TBR Level 2
  { value: 60 },  // TBR Level 1
  { value: 100 }, // TIR
  { value: 200 }, // TAR Level 1
  { value: 300 }, // TAR Level 2
];
```

**Success Criteria:**
- Each reading classified correctly

---

### Test 1.4: Multiple Sensor Changes in One Day
**Objective:** Handle sensor failures/restarts within 24h

**Test Scenario:**
- Sensor change at 08:00
- Sensor failure at 14:00 (lost signal)
- Sensor change at 15:00

**Expected Behavior:**
- 2 sensor change events detected (08:00, 15:00)
- Lost signal event ignored
- Red lines at 08:00 and 15:00 only

**Validation:**
```javascript
const events = JSON.parse(localStorage.getItem('agp_detected_events'));
const sensorEvents = events.filter(e => e.type === 'sensor' && e.date === testDate);
console.log('Sensor events:', sensorEvents.length); // Should be 2
```

---

### Test 1.5: Cartridge + Sensor Same Day
**Objective:** Detect both events on same date

**Test Scenario:**
- Cartridge change (Rewind) at 10:00
- Sensor change at 10:30

**Expected Behavior:**
- 2 distinct events stored
- 2 red lines in day profile (30 minutes apart)
- Event labels distinguish between types

---

## 📋 PRIORITY 2: EDGE CASES

### Test 2.1: CSV with Data Gaps
**Objective:** Handle missing readings gracefully

**Test Data:**
- Morning: 06:00-12:00 (readings)
- Gap: 12:00-18:00 (no readings)
- Evening: 18:00-23:59 (readings)

**Expected Behavior:**
- Glucose curve stops at 12:00
- No line drawn during gap
- Curve resumes at 18:00
- Gap NOT interpreted as sensor change

---

### Test 2.2: Out-of-Range Values
**Objective:** Handle extreme glucose values

**Test Data:**
- Value: 25 mg/dL (severe hypoglycemia)
- Value: 450 mg/dL (severe hyperglycemia)

**Expected Behavior:**
- Values plotted correctly
- Y-axis scales to accommodate
- No crashes or rendering errors

---

### Test 2.3: Timezone Changes
**Objective:** Handle travel across timezones

**Test Scenario:**
- Day 1-5: UTC+1 (Brussels)
- Day 6-7: UTC-5 (New York)

**Expected Behavior:**
- All timestamps converted to local time
- Day profiles show correct 24h period
- No duplicate/missing readings

---

### Test 2.4: Daylight Saving Time
**Objective:** Handle DST transitions

**Test Scenario:**
- Spring forward: Clock jumps 02:00 → 03:00
- Fall back: Clock repeats 02:00-03:00

**Expected Behavior:**
- No duplicate timestamps in database
- Readings maintain correct temporal order
- Day profiles handle 23h/25h days

---

### Test 2.5: Duplicate CSV Upload
**Objective:** Verify deduplication

**Test Steps:**
1. Upload CSV file
2. Immediately upload same CSV again
3. Check reading count in IndexedDB

**Expected Behavior:**
- No duplicate readings added
- Reading count unchanged after 2nd upload
- Console message: "Deduplication: X duplicates skipped"

---

### Test 2.6: Overlapping CSV Files
**Objective:** Handle partial overlaps

**Test Scenario:**
- CSV 1: Oct 1-15
- CSV 2: Oct 10-25 (5-day overlap)

**Expected Behavior:**
- Overlapping readings deduplicated
- Total readings = unique readings only
- No data corruption

---

## 📋 PRIORITY 3: PERFORMANCE

### Test 3.1: Large Dataset (6 Months)
**Objective:** Verify acceptable performance with 28,000+ readings

**Test Steps:**
1. Upload 6 months of CSV data
2. Measure IndexedDB write time
3. Measure day profile render time
4. Check browser memory usage

**Success Criteria:**
- Upload completes < 10 seconds
- Day profile renders < 1 second
- Memory usage < 500 MB
- No browser freezing/lag

---

### Test 3.2: Year of Data
**Objective:** Test maximum realistic dataset

**Test Steps:**
1. Upload 12 months of CSV data (~50,000 readings)
2. Generate full AGP report
3. Export database JSON

**Success Criteria:**
- All operations complete without errors
- UI remains responsive
- Export file size reasonable (< 10 MB)

---

### Test 3.3: Comparison Calculations
**Objective:** Measure calculation time for comparisons

**Test Scenario:**
- Select 90-day period
- Enable all 3 comparisons:
  - Period-to-period
  - Day/Night
  - Workday/Rest

**Measurements:**
```javascript
console.time('comparison-calc');
// Trigger comparison
console.timeEnd('comparison-calc');
```

**Success Criteria:**
- Total calculation time < 2 seconds

---

## 📋 PRIORITY 4: USER WORKFLOWS

### Test 4.1: Export & Re-import Database
**Objective:** Verify data portability

**Steps:**
1. Upload CSV data
2. Add sensor changes
3. Upload ProTime PDF
4. Export database JSON
5. Clear all data
6. Re-import JSON file
7. Verify all data restored

**Validation:**
- Same reading count
- Events preserved
- Workday dates preserved
- Metrics recalculate correctly

---

### Test 4.2: Month Bucket Deletion
**Objective:** Verify selective data removal

**Steps:**
1. Upload 3 months of data (Jan, Feb, Mar)
2. Delete February bucket
3. Verify:
   - Feb data removed
   - Jan + Mar data intact
   - Metrics recalculate for remaining data

---

### Test 4.3: ProTime PDF Workflow
**Objective:** Verify workday detection end-to-end

**Steps:**
1. Upload ProTime PDF
2. Verify workday dates extracted
3. Refresh page (test persistence)
4. Check comparison view shows workday metrics
5. Export database (verify workday dates included)

---

### Test 4.4: Print HTML Report
**Objective:** Verify print layout

**Steps:**
1. Generate full AGP report
2. Print to PDF (Cmd+P)
3. Verify:
   - All sections visible
   - Black & white readable
   - No content cut off
   - Page breaks appropriate

---

### Test 4.5: Mobile Browser Testing
**Objective:** Verify mobile compatibility

**Browsers:**
- iOS Safari
- iOS Chrome
- Android Chrome

**Test Areas:**
- CSV file upload works
- Day profiles render correctly
- Touch interactions responsive
- No horizontal scrolling

---

## 🔬 DEBUG CHECKLIST

For each failed test, use this debug workflow:

1. **Check Console**
   ```javascript
   // Look for errors
   // Check logged data
   ```

2. **Inspect Storage**
   ```javascript
   // IndexedDB
   masterDataset.getAllReadings().then(console.log);
   
   // localStorage
   console.log(JSON.parse(localStorage.getItem('agp_detected_events')));
   ```

3. **Verify Data Flow**
   ```javascript
   // Add logs at each stage
   console.log('1. CSV parsed:', csvData);
   console.log('2. Stored in IndexedDB:', success);
   console.log('3. Events detected:', events);
   console.log('4. Metrics calculated:', metrics);
   ```

4. **Use Test Tool**
   - Open `test-sensor-detection.html`
   - Paste CSV data
   - Check detection logic

---

## 📊 TEST RESULTS TRACKING

### Test Session Template

```markdown
## Test Session: [Date]
**Tester:** [Name]
**Version:** v3.0.0
**Test Data:** [CSV filename]

### Results
- [ ] Test 1.1: TIR Calculation - PASS/FAIL
- [ ] Test 1.2: GMI Calculation - PASS/FAIL
- [ ] Test 1.3: TAR/TBR Thresholds - PASS/FAIL
- [ ] Test 1.4: Multiple Sensor Changes - PASS/FAIL
- [ ] Test 1.5: Cartridge + Sensor Same Day - PASS/FAIL

### Issues Found
1. [Description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce:
   - Expected behavior:
   - Actual behavior:

### Notes
[Any additional observations]
```

---

## ✅ SIGN-OFF CRITERIA

AGP+ v3.0 is production-ready when:

- [ ] All Priority 1 tests passing
- [ ] 90% of Priority 2 tests passing
- [ ] No critical bugs in Priority 3/4 tests
- [ ] Documentation updated
- [ ] Code cleaned (no debug logs)
- [ ] Git tagged (v3.0.0)

---

END OF TEST PLAN
