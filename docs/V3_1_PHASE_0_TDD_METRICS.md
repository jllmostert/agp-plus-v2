# AGP+ v3.1 - Phase 0: TDD Metrics Implementation Guide

**Datum:** 28 oktober 2025  
**Status:** 🚧 IN PROGRESS  
**Branch:** v3.1-insulin  
**Phase:** 0 of 4

---

## 🎯 PHASE 0 OBJECTIVES

**Goal:** Add accurate Total Daily Dose (TDD) tracking to AGP+

**Why This Matters:**
- TDD is a fundamental metric for insulin management
- CSV Section 2 contains accurate daily auto insulin totals
- Verified against CareLink PDF (98.6% match)
- Clinically essential for diabetes care

**Scope:**
- ✅ Create `insulin-engine.js` with TDD calculation logic
- ✅ Update `parsers.js` to extract Section 2 data
- ✅ Display TDD in day profile headers (per day)
- ✅ Show average TDD ± SD in AGP summary
- ✅ Create debug tool for verification
- ✅ Comprehensive testing

---

## 📊 DATA STRUCTURE: CSV SECTION 2

### Location in CSV
**Line ~458:** `-------;MiniMed 780G MMT-1886;Pump;NG4114235H;Aggregated Auto Insulin Data`

### Format
```csv
Index;Date;Time;...;Bolus Volume Delivered (U);...;Bolus Source;...
449,00000;2025/10/28;00:00:00;;;;;;;;;Normal;4,927;4,927;;;;...;CLOSED_LOOP_AUTO_INSULIN;...
450,00000;2025/10/27;00:00:00;;;;;;;;;Normal;11,548;11,548;;;;...;CLOSED_LOOP_AUTO_INSULIN;...
```

### Key Columns
- **Column 1:** Date (YYYY/MM/DD)
- **Column 13:** Bolus Volume Delivered (U) - Daily auto insulin total
- **Column 44:** Bolus Source - Must be "CLOSED_LOOP_AUTO_INSULIN"

### What This Represents
**CLOSED_LOOP_AUTO_INSULIN** contains:
1. **Autobasaal** - SmartGuard basal adjustments every 5 minutes
2. **Micro-bolussen** - Automatic corrections without user interaction
3. **NOT** the programmed basal pattern (that's Section 1 "Basal Rate")

### Verification Data (27/10/2025)
```
CareLink PDF: TDD 29.4E | Basaal 37% (11.0E) | Bolus 63% (18.4E)
CSV Section 2: Auto Insulin 11.548E
CSV Section 1: Meal Bolus 17.475E
CSV TDD: 29.023E (98.7% match ✅)
```

---

## 🏗️ IMPLEMENTATION PLAN

### File Structure
```
/src/
  core/
    insulin-engine.js         ← NEW - TDD calculation logic
    parsers.js                ← UPDATE - Add Section 2 parsing
    bolus-engine.js           ← FUTURE (Phase 1)
  components/
    DayProfileCard.jsx        ← UPDATE - Add TDD header
    AGPGenerator.jsx          ← UPDATE - Add TDD summary
  utils/
    formatters.js             ← UPDATE - Add insulin formatters (optional)

/public/
  test-insulin-tdd.html       ← NEW - Debug tool

/docs/
  V3_1_PHASE_0_TDD_METRICS.md ← YOU ARE HERE
```

---

## 📝 STEP-BY-STEP IMPLEMENTATION

### STEP 1: Create `insulin-engine.js`

**Location:** `/src/core/insulin-engine.js`

**Purpose:** Core TDD calculation logic

**Functions to Implement:**

#### 1.1 `calculateDailyTDD(section1Data, section2Data)`
```javascript
/**
 * Calculate Total Daily Dose for each day
 * @param {Array} section1Data - Parsed Section 1 (meal boluses)
 * @param {Array} section2Data - Parsed Section 2 (auto insulin)
 * @returns {Object} TDD data by date
 */
export function calculateDailyTDD(section1Data, section2Data) {
  const tddByDay = {};
  
  // Step 1: Get auto insulin from Section 2
  const autoInsulinByDay = {};
  section2Data.forEach(row => {
    if (row.bolusSource === 'CLOSED_LOOP_AUTO_INSULIN') {
      const date = row.date; // Format: YYYY/MM/DD
      const amount = parseFloat(row.bolusVolumeDelivered);
      autoInsulinByDay[date] = amount;
    }
  });
  
  // Step 2: Get meal boluses from Section 1
  // Only count DELIVERED boluses (Bolus Volume Delivered > 0)
  const mealBolusByDay = {};
  section1Data.forEach(row => {
    if (row.bolusSource === 'CLOSED_LOOP_BG_CORRECTION_AND_FOOD_BOLUS' && 
        row.bolusVolumeDelivered > 0) {
      const date = row.date;
      if (!mealBolusByDay[date]) mealBolusByDay[date] = 0;
      mealBolusByDay[date] += parseFloat(row.bolusVolumeDelivered);
    }
  });
  
  // Step 3: Calculate TDD for each day
  const allDates = new Set([
    ...Object.keys(autoInsulinByDay),
    ...Object.keys(mealBolusByDay)
  ]);
  
  allDates.forEach(date => {
    const auto = autoInsulinByDay[date] || 0;
    const meal = mealBolusByDay[date] || 0;
    const tdd = auto + meal;
    
    tddByDay[date] = {
      date,
      autoInsulin: auto,
      mealBolus: meal,
      tdd,
      autoPercent: tdd > 0 ? (auto / tdd) * 100 : 0,
      mealPercent: tdd > 0 ? (meal / tdd) * 100 : 0
    };
  });
  
  return tddByDay;
}
```

**Input Example:**
```javascript
section2Data = [
  { date: '2025/10/27', bolusVolumeDelivered: '11,548', bolusSource: 'CLOSED_LOOP_AUTO_INSULIN' }
];

section1Data = [
  { date: '2025/10/27', time: '13:16:47', bolusVolumeDelivered: '5,25', bolusSource: 'CLOSED_LOOP_BG_CORRECTION_AND_FOOD_BOLUS' },
  { date: '2025/10/27', time: '17:42:35', bolusVolumeDelivered: '7,875', bolusSource: 'CLOSED_LOOP_BG_CORRECTION_AND_FOOD_BOLUS' }
  // ... more boluses
];
```

**Output Example:**
```javascript
{
  '2025/10/27': {
    date: '2025/10/27',
    autoInsulin: 11.548,
    mealBolus: 17.475,
    tdd: 29.023,
    autoPercent: 39.8,
    mealPercent: 60.2
  }
}
```

#### 1.2 `calculateTDDStatistics(tddByDay)`
```javascript
/**
 * Calculate aggregate TDD statistics
 * @param {Object} tddByDay - TDD data by date
 * @returns {Object} Statistics (mean, SD, CV, range)
 */
export function calculateTDDStatistics(tddByDay) {
  const tddValues = Object.values(tddByDay).map(d => d.tdd);
  const autoValues = Object.values(tddByDay).map(d => d.autoInsulin);
  const mealValues = Object.values(tddByDay).map(d => d.mealBolus);
  
  if (tddValues.length === 0) {
    return null;
  }
  
  // Calculate mean
  const meanTDD = tddValues.reduce((sum, val) => sum + val, 0) / tddValues.length;
  const meanAuto = autoValues.reduce((sum, val) => sum + val, 0) / autoValues.length;
  const meanMeal = mealValues.reduce((sum, val) => sum + val, 0) / mealValues.length;
  
  // Calculate standard deviation
  const variance = tddValues.reduce((sum, val) => sum + Math.pow(val - meanTDD, 2), 0) / tddValues.length;
  const sdTDD = Math.sqrt(variance);
  
  // Coefficient of variation (CV)
  const cvTDD = (sdTDD / meanTDD) * 100;
  
  // Range
  const minTDD = Math.min(...tddValues);
  const maxTDD = Math.max(...tddValues);
  
  // Average percentages
  const avgAutoPercent = (meanAuto / meanTDD) * 100;
  const avgMealPercent = (meanMeal / meanTDD) * 100;
  
  return {
    meanTDD,
    sdTDD,
    cvTDD,
    minTDD,
    maxTDD,
    meanAuto,
    meanMeal,
    avgAutoPercent,
    avgMealPercent,
    dataPoints: tddValues.length
  };
}
```

**Output Example:**
```javascript
{
  meanTDD: 29.5,
  sdTDD: 3.2,
  cvTDD: 10.8,
  minTDD: 24.1,
  maxTDD: 35.7,
  meanAuto: 11.8,
  meanMeal: 17.7,
  avgAutoPercent: 40.0,
  avgMealPercent: 60.0,
  dataPoints: 7
}
```

#### 1.3 `validateTDDData(tddByDay)`
```javascript
/**
 * Validate TDD data and flag issues
 * @param {Object} tddByDay - TDD data by date
 * @returns {Object} Validation results
 */
export function validateTDDData(tddByDay) {
  const warnings = [];
  const info = [];
  
  Object.entries(tddByDay).forEach(([date, data]) => {
    // Flag unusually low TDD
    if (data.tdd < 15) {
      warnings.push({
        date,
        type: 'LOW_TDD',
        message: `Low TDD (${data.tdd.toFixed(1)}E) - possible incomplete day`,
        severity: 'warning'
      });
    }
    
    // Flag unusually high TDD
    if (data.tdd > 60) {
      warnings.push({
        date,
        type: 'HIGH_TDD',
        message: `High TDD (${data.tdd.toFixed(1)}E) - verify pump data`,
        severity: 'warning'
      });
    }
    
    // Flag unusual auto/meal ratios
    if (data.autoPercent < 20 || data.autoPercent > 70) {
      info.push({
        date,
        type: 'UNUSUAL_RATIO',
        message: `Unusual auto/meal ratio (${data.autoPercent.toFixed(0)}%/${data.mealPercent.toFixed(0)}%)`,
        severity: 'info'
      });
    }
    
    // Flag missing auto insulin
    if (data.autoInsulin === 0 && data.mealBolus > 0) {
      warnings.push({
        date,
        type: 'MISSING_AUTO',
        message: 'No auto insulin data - Section 2 may be incomplete',
        severity: 'error'
      });
    }
  });
  
  return {
    isValid: warnings.filter(w => w.severity === 'error').length === 0,
    warnings,
    info
  };
}
```

---

### STEP 2: Update `parsers.js`

**Location:** `/src/core/parsers.js`

**Changes Required:**

#### 2.1 Add `parseSection2(csvText)` function
```javascript
/**
 * Parse CSV Section 2: Aggregated Auto Insulin Data
 * @param {string} csvText - Raw CSV content
 * @returns {Array} Parsed auto insulin data
 */
export function parseSection2(csvText) {
  const lines = csvText.split('\n');
  const section2Data = [];
  
  // Find Section 2 start (line with "Aggregated Auto Insulin Data")
  let section2Start = -1;
  let section2End = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Aggregated Auto Insulin Data')) {
      section2Start = i + 2; // Skip divider and header
      break;
    }
  }
  
  if (section2Start === -1) {
    console.warn('Section 2 (Aggregated Auto Insulin Data) not found in CSV');
    return [];
  }
  
  // Find Section 2 end (next "-------" divider)
  for (let i = section2Start; i < lines.length; i++) {
    if (lines[i].startsWith('-------')) {
      section2End = i;
      break;
    }
  }
  
  if (section2End === -1) {
    console.warn('Section 2 end marker not found');
    return [];
  }
  
  // Parse Section 2 rows
  for (let i = section2Start; i < section2End; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('Index')) continue; // Skip empty or header rows
    
    const columns = line.split(';');
    
    // Extract relevant columns
    const date = columns[1]?.trim(); // Date (YYYY/MM/DD)
    const bolusVolumeDelivered = columns[13]?.trim(); // Bolus Volume Delivered
    const bolusSource = columns[44]?.trim(); // Bolus Source
    
    // Only include CLOSED_LOOP_AUTO_INSULIN entries
    if (bolusSource && bolusSource.includes('CLOSED_LOOP_AUTO_INSULIN')) {
      section2Data.push({
        date,
        bolusVolumeDelivered: bolusVolumeDelivered ? bolusVolumeDelivered.replace(',', '.') : '0',
        bolusSource
      });
    }
  }
  
  console.log(`Parsed Section 2: ${section2Data.length} auto insulin entries`);
  return section2Data;
}
```

#### 2.2 Update `parseCSV()` to include Section 2
```javascript
export function parseCSV(csvText) {
  // Existing parsing for Section 1 (events)
  const section1 = parseSection1(csvText);
  
  // NEW: Parse Section 2 (auto insulin)
  const section2 = parseSection2(csvText);
  
  // Existing parsing for Section 3 (glucose)
  const section3 = parseSection3(csvText);
  
  return {
    section1,
    section2, // NEW
    section3,
    // ... existing fields
  };
}
```

---

### STEP 3: Update Day Profile Headers

**Location:** `/src/components/DayProfileCard.jsx`

**Add TDD Display Above Glucose Curve:**

```jsx
{/* NEW: TDD Header */}
<div className="day-profile-tdd-header" style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 16px',
  marginBottom: '8px',
  borderBottom: '3px solid #000',
  fontFamily: 'monospace',
  fontSize: '14px',
  fontWeight: 'bold'
}}>
  <span className="tdd-badge" style={{
    backgroundColor: '#fef08a',
    color: '#000',
    padding: '4px 8px',
    border: '2px solid #000'
  }}>
    TDD {dayTDD.tdd.toFixed(1)}E
  </span>
  
  <span className="auto-badge" style={{
    backgroundColor: '#e0f2fe',
    color: '#0891b2',
    padding: '4px 8px',
    border: '2px solid #0891b2'
  }}>
    Auto {dayTDD.autoPercent.toFixed(0)}% | {dayTDD.autoInsulin.toFixed(1)}E
  </span>
  
  <span className="meal-badge" style={{
    backgroundColor: '#ffedd5',
    color: '#f97316',
    padding: '4px 8px',
    border: '2px solid #f97316'
  }}>
    Meal {dayTDD.mealPercent.toFixed(0)}% | {dayTDD.mealBolus.toFixed(1)}E
  </span>
</div>
```

**Calculate dayTDD from props:**
```jsx
// In component function
const dayTDD = useMemo(() => {
  if (!tddData || !tddData[dateKey]) {
    return { tdd: 0, autoInsulin: 0, mealBolus: 0, autoPercent: 0, mealPercent: 0 };
  }
  return tddData[dateKey];
}, [tddData, dateKey]);
```

---

### STEP 4: Update AGP Summary

**Location:** `/src/components/AGPGenerator.jsx` (or summary component)

**Add Insulin Metrics Section:**

```jsx
{/* NEW: Insulin Metrics Summary */}
{tddStats && (
  <div className="insulin-metrics-section" style={{
    border: '3px solid #000',
    padding: '16px',
    marginTop: '16px',
    fontFamily: 'monospace'
  }}>
    <h3 style={{ 
      fontSize: '18px', 
      fontWeight: 'bold', 
      marginBottom: '12px',
      borderBottom: '3px solid #000',
      paddingBottom: '8px'
    }}>
      INSULIN METRICS
    </h3>
    
    <div className="metric-row" style={{ marginBottom: '8px' }}>
      <span className="metric-label" style={{ fontWeight: 'bold' }}>
        Average TDD:
      </span>
      <span className="metric-value" style={{ float: 'right' }}>
        {tddStats.meanTDD.toFixed(1)} ± {tddStats.sdTDD.toFixed(1)}E
      </span>
    </div>
    
    <div className="metric-row" style={{ marginBottom: '8px' }}>
      <span className="metric-label" style={{ fontWeight: 'bold' }}>
        TDD Range:
      </span>
      <span className="metric-value" style={{ float: 'right' }}>
        {tddStats.minTDD.toFixed(1)} - {tddStats.maxTDD.toFixed(1)}E
      </span>
    </div>
    
    <div className="metric-row" style={{ marginBottom: '8px' }}>
      <span className="metric-label" style={{ fontWeight: 'bold' }}>
        Auto/Meal Ratio:
      </span>
      <span className="metric-value" style={{ float: 'right' }}>
        {tddStats.avgAutoPercent.toFixed(0)}% / {tddStats.avgMealPercent.toFixed(0)}%
      </span>
    </div>
    
    <div className="metric-row" style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
      Clinical guideline: 40-50% auto insulin
    </div>
  </div>
)}
```

---

### STEP 5: Create Debug Tool

**Location:** `/public/test-insulin-tdd.html`

**Purpose:** Interactive tool for testing TDD calculations

**Features:**
1. Load CSV file
2. Display Section 2 raw data
3. Show parsed auto insulin by day
4. Show parsed meal boluses by day
5. Calculate and display TDD
6. Compare with expected values (from PDF)
7. Visual verification

**Implementation:** Full HTML file with embedded JavaScript

---

## 🧪 TESTING PLAN

### Test 1: TDD Calculation Accuracy

**Test Data:** `Jo_Mostert_28-10-2025_7d.csv`

**Expected Results (from PDF):**
```javascript
const expectedTDD = {
  '2025/10/27': { tdd: 29.4, auto: 11.0, meal: 18.4 },
  '2025/10/26': { tdd: 28.4, auto: 10.2, meal: 18.2 },
  '2025/10/25': { tdd: 28.4, auto: 10.2, meal: 18.2 },
  // ... fill in all 7 days from PDF
};
```

**Verification Code:**
```javascript
Object.keys(expectedTDD).forEach(date => {
  const calculated = tddByDay[date];
  const expected = expectedTDD[date];
  
  const tddMatch = Math.abs(calculated.tdd - expected.tdd) < 0.6; // 2% tolerance
  const autoMatch = Math.abs(calculated.autoInsulin - expected.auto) < 0.3;
  const mealMatch = Math.abs(calculated.mealBolus - expected.meal) < 0.5;
  
  console.log(`${date}: TDD ${tddMatch ? '✅' : '❌'}, Auto ${autoMatch ? '✅' : '❌'}, Meal ${mealMatch ? '✅' : '❌'}`);
});
```

### Test 2: Edge Cases

**Test Scenarios:**
1. Day with sensor change (partial data)
   - Expected: Lower TDD, flag as warning
2. Day with cartridge change (priming insulin)
   - Expected: Priming NOT counted in TDD
3. Day with <70% coverage
   - Expected: Warning about incomplete data
4. Missing Section 2 data
   - Expected: Graceful fallback, show warning

### Test 3: Visual Verification

**Checklist for 27/10/2025:**
- [ ] Day profile header shows "TDD 29.4E"
- [ ] Auto badge shows "Auto 37% | 11.0E"
- [ ] Meal badge shows "Meal 63% | 18.4E"
- [ ] Colors: Yellow TDD, Cyan auto, Orange meal
- [ ] Monospace font rendering correctly
- [ ] No layout glitches

**Repeat for all 7 days**

---

## ✅ SUCCESS CRITERIA

Phase 0 is complete when:
- [ ] `insulin-engine.js` created with all functions
- [ ] `parsers.js` updated with Section 2 parsing
- [ ] TDD calculations match PDF within 2%
- [ ] All 7 test days show correct TDD
- [ ] Day profile headers display per-day TDD
- [ ] AGP summary displays TDD statistics
- [ ] Debug tool created and functional
- [ ] Edge cases handled gracefully
- [ ] Documentation updated
- [ ] Code committed to v3.1-insulin branch

---

## 🐛 DEBUGGING STRATEGY

### Debug Tool Usage
1. Open `http://localhost:3001/test-insulin-tdd.html`
2. Load CSV: `Jo_Mostert_28-10-2025_7d.csv`
3. Click "Parse Section 2"
4. Verify auto insulin values
5. Click "Parse Section 1 Meal Boluses"
6. Verify meal bolus totals
7. Click "Calculate TDD"
8. Compare with PDF values
9. Check for discrepancies

### Console Logging
```javascript
// In insulin-engine.js
console.log('Section 2 entries:', section2Data.length);
console.log('Auto insulin by day:', autoInsulinByDay);
console.log('Meal bolus by day:', mealBolusByDay);
console.log('TDD by day:', tddByDay);
```

### Common Issues
1. **TDD = 0:** Section 2 not parsed correctly
   - Check divider detection
   - Check column indices
2. **TDD too high:** Priming insulin included
   - Filter out Prime Type entries
3. **TDD doesn't match PDF:** Rounding differences
   - Check decimal separator (comma vs dot)
   - Verify column indices

---

## 📝 OPEN QUESTIONS

**RESOLVED:**
1. ✅ Warnings: No warnings from AGP+ (pump-driven only)
2. ✅ Auto/Meal ratio: Follow clinical guidelines (40-50% auto)
3. ✅ Bolus markers: Any design acceptable (dashed lines chosen)
4. ✅ Debug tool location: `/public/test-*.html` is fine
5. ✅ IOB display: Overlay on glucose (different color)

---

**Phase 0 Status:** 🚧 READY FOR IMPLEMENTATION  
**Next Step:** Create `insulin-engine.js` skeleton  
**Estimated Time:** 2-3 hours of development  
**Token Budget:** 30-40k tokens

---

*Generated: 28 October 2025*  
*AGP+ v3.1 Phase 0 - Complete Implementation Guide* 💉📊
