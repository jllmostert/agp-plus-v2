# AGP+ v3.1 Phase 0 - TDD Metrics Implementation Handoff

**Datum:** 29 oktober 2025  
**Status:** READY TO IMPLEMENT  
**Branch:** v3.1-insulin  
**Phase:** 0 of 4  
**Base:** v3.0-dev (verified & production ready)

---

## MISSION: Add Accurate TDD Tracking

**What:** Implement Total Daily Dose (TDD) calculation and display  
**Why:** CSV Section 2 contains accurate auto insulin data (98.7% verified)  
**Goal:** Display per-day TDD in brutalist design, no emojis

---

## CRITICAL BUGS TO FIX FIRST

### BUG 1: Emoji Corruption in Day Profile Headers

**Symptom:** Unicode characters display as garbage  
**Location:** DayProfileCard.jsx headers  
**Expected:** Clean text labels (e.g., "TDD", "Auto", "Meal")  
**Actual:** Corrupted Unicode (e.g., "ðŸ'‰", "ðŸ"‰")

**Fix Required:**
- Remove ALL emoji/Unicode icons from day profile headers
- Use plain text labels only
- Maintain brutalist aesthetic with borders and colors

**Files to Check:**
```
/src/components/DayProfileCard.jsx
/src/components/AGPGenerator.jsx
/src/core/insulin-engine.js (when created)
```

**Test After Fix:**
1. Load CSV with TDD data
2. Verify day profile headers show clean text
3. Check Safari AND Chrome rendering
4. Verify print preview (black & white)

---

## IMPLEMENTATION CHECKLIST

### Phase 0: TDD Metrics (This Phase)

**Files to Create:**
- [ ] `/src/core/insulin-engine.js` - TDD calculation logic
- [ ] `/public/test-insulin-tdd.html` - Debug tool

**Files to Update:**
- [ ] `/src/core/parsers.js` - Add Section 2 parsing
- [ ] `/src/components/DayProfileCard.jsx` - Add TDD header (NO EMOJIS)
- [ ] `/src/components/AGPGenerator.jsx` - Add TDD summary section

**Code Standards:**
- NO emojis or Unicode icons anywhere
- Brutalist design: 3px borders, monospace fonts, high contrast
- Print-compatible: patterns not colors
- mg/dL units only (no mmol/L)

---

## TEST STRATEGY

### Test Phase 1: Core Engine (Isolated)

**Goal:** Verify TDD calculations match CareLink PDF

**Test File:** `Jo_Mostert_28-10-2025_7d.csv`

**Expected Results (from PDF 27/10/2025):**
```javascript
const expectedTDD = {
  '2025/10/27': { 
    tdd: 29.4,  // Total
    auto: 11.0, // CLOSED_LOOP_AUTO_INSULIN (Section 2)
    meal: 18.4  // CLOSED_LOOP_BG_CORRECTION_AND_FOOD_BOLUS (Section 1)
  }
};
```

**Verification Code:**
```javascript
// In test-insulin-tdd.html
const tolerance = 0.6; // 2% tolerance for rounding
const tddMatch = Math.abs(calculated.tdd - expected.tdd) < tolerance;
const autoMatch = Math.abs(calculated.auto - expected.auto) < 0.3;
const mealMatch = Math.abs(calculated.meal - expected.meal) < 0.5;

console.log(`27/10: TDD ${tddMatch ? 'PASS' : 'FAIL'}`);
```

**Test Steps:**
1. Create `insulin-engine.js` with calculation functions
2. Create `test-insulin-tdd.html` debug tool
3. Load test CSV and parse Section 2
4. Calculate TDD for 27/10/2025
5. Verify matches PDF within tolerance
6. Repeat for all 7 days in CSV

**Success Criteria:**
- All 7 days match PDF within 2%
- Auto insulin matches Section 2 data
- Meal bolus matches Section 1 delivered boluses only

---

### Test Phase 2: Parser Integration

**Goal:** Verify Section 2 parsing extracts correct data

**Test File:** `Jo_Mostert_28-10-2025_7d.csv`

**Section 2 Location:** Line ~458
```
-------;MiniMed 780G MMT-1886;Pump;NG4114235H;Aggregated Auto Insulin Data
```

**Expected Columns:**
- Column 1: Date (YYYY/MM/DD)
- Column 13: Bolus Volume Delivered (U)
- Column 44: Bolus Source (CLOSED_LOOP_AUTO_INSULIN)

**Verification Code:**
```javascript
// In parsers.js
const section2 = parseSection2(csvText);

console.log('Section 2 entries:', section2.length); // Should be 7
console.log('First entry:', section2[0]);
// Expected: { date: '2025/10/21', bolusVolumeDelivered: 11.234, bolusSource: 'CLOSED_LOOP_AUTO_INSULIN' }
```

**Test Steps:**
1. Update `parseCSV()` to call `parseSection2()`
2. Verify divider detection works
3. Verify column indices correct
4. Check decimal separator handling (comma vs dot)
5. Verify date format parsing

**Success Criteria:**
- Section 2 detected correctly
- 7 daily auto insulin entries extracted
- Values match manual CSV inspection
- No header rows included

---

### Test Phase 3: UI Integration

**Goal:** Verify TDD displays correctly in day profiles

**Test Approach:** Visual inspection + automated checks

**Day Profile Header Layout:**
```
+------------------------------------------+
| [TDD 29.4E] [Auto 37% | 11.0E] [Meal 63% | 18.4E] |
+------------------------------------------+
```

**Visual Checklist (per day):**
- [ ] TDD badge: Yellow background (#fef08a), black text
- [ ] Auto badge: Cyan background (#e0f2fe), cyan text (#0891b2)
- [ ] Meal badge: Orange background (#ffedd5), orange text (#f97316)
- [ ] NO emojis or corrupted Unicode
- [ ] Monospace font rendering
- [ ] 3px borders on all badges
- [ ] Horizontal layout, evenly spaced

**Automated Check:**
```javascript
// In DayProfileCard.jsx render test
const dayTDD = tddData['2025/10/27'];
expect(dayTDD.tdd).toBeCloseTo(29.4, 1);
expect(dayTDD.autoPercent).toBeCloseTo(37, 0);
```

**Test Steps:**
1. Update DayProfileCard.jsx with TDD header
2. Load test CSV in AGP+
3. Check day profile for 27/10/2025
4. Verify badge colors and text
5. Verify NO emoji corruption
6. Test in Safari (primary)
7. Test in Chrome (secondary)
8. Print preview (black & white check)

**Success Criteria:**
- All 7 days show correct TDD
- No Unicode corruption
- Print-compatible rendering
- Brutalist aesthetic maintained

---

### Test Phase 4: AGP Summary Integration

**Goal:** Verify TDD statistics in AGP summary

**Expected Statistics (7-day average):**
```javascript
{
  meanTDD: ~28.5,
  sdTDD: ~2.5,
  cvTDD: ~8.8,
  minTDD: ~24.0,
  maxTDD: ~32.0,
  avgAutoPercent: ~40,
  avgMealPercent: ~60
}
```

**Visual Checklist:**
- [ ] "INSULIN METRICS" section appears
- [ ] Average TDD ± SD displayed
- [ ] TDD range (min-max) shown
- [ ] Auto/Meal ratio percentage
- [ ] Clinical guideline reference
- [ ] Monospace font, 3px borders

**Test Steps:**
1. Add insulin metrics section to AGPGenerator.jsx
2. Calculate statistics from all days
3. Verify mean/SD formulas correct
4. Check percentage calculations
5. Verify layout and formatting

**Success Criteria:**
- Statistics match manual calculation
- SD formula correct (population SD)
- Percentages sum to 100%
- Layout matches brutalist design

---

### Test Phase 5: Edge Cases

**Goal:** Handle incomplete/unusual data gracefully

**Test Scenarios:**

#### Scenario 1: Day with Sensor Change
**Setup:** Oct 25, 2025 (sensor change at 07:31)
**Expected:** Lower TDD, no warning (partial day is normal)
**Verify:** TDD calculated only for available hours

#### Scenario 2: Missing Section 2 Data
**Setup:** CSV with only Section 1 and Section 3
**Expected:** Auto insulin = 0, meal bolus only
**Verify:** TDD = meal bolus, graceful degradation

#### Scenario 3: Day with <70% Coverage
**Setup:** Day with multiple sensor/cartridge changes
**Expected:** TDD calculated, but flagged in validation
**Verify:** Warning shown but calculation correct

#### Scenario 4: First/Last Incomplete Days
**Setup:** CSV starts/ends mid-day
**Expected:** Partial TDD calculated correctly
**Verify:** No false warnings for boundary days

**Test Steps:**
1. Create test CSVs for each scenario
2. Load in debug tool
3. Verify TDD calculations
4. Check validation warnings
5. Verify UI handles edge cases

**Success Criteria:**
- No crashes on edge cases
- Sensible warnings for users
- Calculations correct for available data

---

### Test Phase 6: Performance & Integration

**Goal:** Verify v3.1 works with existing v3.0 features

**Integration Checklist:**
- [ ] TDD works with comparison mode
- [ ] TDD displays in exported HTML
- [ ] TDD included in JSON export
- [ ] No performance regression (28k+ readings)
- [ ] IndexedDB storage updated correctly
- [ ] ProTime workday data persists

**Performance Targets:**
- CSV upload: <2 seconds
- TDD calculation: <100ms
- Day profile render: <50ms per day
- No memory leaks

**Test Steps:**
1. Load 7-day CSV in v3.1
2. Verify TDD calculations fast
3. Switch to comparison mode
4. Export HTML, check TDD included
5. Export JSON, verify structure
6. Reload page, check persistence

**Success Criteria:**
- All v3.0 features still work
- TDD integrated seamlessly
- No performance degradation
- Data persists correctly

---

## DEBUG TOOL: test-insulin-tdd.html

**Location:** `/public/test-insulin-tdd.html`

**Purpose:** Interactive testing of TDD calculations

**Features:**
1. **Load CSV:** Upload test file
2. **Parse Section 2:** Extract auto insulin data
3. **Parse Section 1:** Extract meal boluses
4. **Calculate TDD:** Run insulin-engine calculations
5. **Compare PDF:** Show expected vs actual
6. **Visual Verification:** Display in table format

**Layout:**
```
+--------------------------------------------------+
| INSULIN TDD DEBUG TOOL                           |
+--------------------------------------------------+
| [Upload CSV]                                     |
+--------------------------------------------------+
| SECTION 2 AUTO INSULIN                           |
| 2025/10/27: 11.548E                              |
| 2025/10/26: 10.234E                              |
| ...                                              |
+--------------------------------------------------+
| SECTION 1 MEAL BOLUSES                           |
| 2025/10/27: 13:16 5.25E, 17:42 7.88E, ... = 17.5E|
| ...                                              |
+--------------------------------------------------+
| TDD CALCULATIONS                                 |
| Date       | Auto  | Meal  | TDD   | PDF   | Match|
| 2025/10/27 | 11.5E | 17.5E | 29.0E | 29.4E | PASS |
| ...                                              |
+--------------------------------------------------+
```

**Usage:**
```bash
# Start server
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001

# Open browser
open http://localhost:3001/test-insulin-tdd.html

# Test workflow
1. Click "Upload CSV"
2. Select Jo_Mostert_28-10-2025_7d.csv
3. Click "Parse Section 2"
4. Click "Parse Section 1 Meal Boluses"
5. Click "Calculate TDD"
6. Review table for discrepancies
```

---

## IMPLEMENTATION ORDER

**Critical Path (do in order):**

### Step 1: Fix Emoji Bug (FIRST!)
1. Search for all emoji usage in codebase
2. Remove from DayProfileCard.jsx
3. Remove from AGPGenerator.jsx
4. Replace with plain text labels
5. Test in Safari + Chrome
6. Commit: "fix: remove emoji corruption from headers"

### Step 2: Create insulin-engine.js
1. Create file skeleton
2. Implement `calculateDailyTDD()`
3. Implement `calculateTDDStatistics()`
4. Implement `validateTDDData()`
5. Add unit tests in debug tool

### Step 3: Update parsers.js
1. Add `parseSection2()` function
2. Update `parseCSV()` to call it
3. Test Section 2 detection
4. Verify column indices
5. Handle decimal separators

### Step 4: Create Debug Tool
1. Create test-insulin-tdd.html
2. Add CSV upload
3. Add Section 2 parsing
4. Add TDD calculation
5. Add PDF comparison table
6. Test with real CSV

### Step 5: Update DayProfileCard.jsx
1. Add TDD data prop
2. Create TDD header component
3. Style badges (NO EMOJIS)
4. Test rendering
5. Verify brutalist design

### Step 6: Update AGPGenerator.jsx
1. Call insulin-engine calculations
2. Pass TDD data to DayProfileCard
3. Add insulin metrics summary section
4. Style summary (brutalist)
5. Test integration

### Step 7: Test & Verify
1. Load 7-day CSV
2. Verify all 7 days show TDD
3. Check PDF accuracy
4. Test edge cases
5. Performance check
6. Export HTML/JSON test

### Step 8: Documentation & Commit
1. Update CHANGELOG.md
2. Update START_HERE.md
3. Commit with detailed message
4. Push to v3.1-insulin branch

---

## SUCCESS CRITERIA

Phase 0 complete when:
- [ ] NO emoji corruption anywhere
- [ ] `insulin-engine.js` created with 3 core functions
- [ ] `parsers.js` updated with Section 2 parsing
- [ ] TDD calculations match PDF within 2% (all 7 days)
- [ ] Day profile headers show TDD badges (brutalist design)
- [ ] AGP summary shows TDD statistics
- [ ] `test-insulin-tdd.html` debug tool working
- [ ] All edge cases handled
- [ ] Performance targets met
- [ ] Documentation updated
- [ ] Code committed to v3.1-insulin

---

## FILES TO ARCHIVE

**Move to `/docs/archive/handoffs-v3.0/`:**
- HANDOFF_2025_10_27_FINAL.md
- HANDOFF_2025_10_27_SESSION2.md
- Keep HANDOFF_2025_10_28_VERIFIED.md in docs/ (it's the v3.0 reference)

**Reason:** v3.0 is complete, these are historical

---

## KNOWN CONSTRAINTS

### Desktop Commander Required
ALL file operations MUST use Desktop Commander:
```bash
# Read file
DC: read_file path="/Users/jomostert/Documents/Projects/agp-plus/..."

# Search
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus/src" 
                pattern="emoji" searchType="content"

# Edit
DC: edit_block file_path="..." old_string="..." new_string="..."
```

### Server Port 3001
```bash
# Kill existing
lsof -ti:3001 | xargs kill -9

# Start server
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### Git Workflow
```bash
# Check branch
git branch  # Should show v3.1-insulin

# Commit
git add .
git commit -m "feat(v3.1): implement TDD metrics - Phase 0 complete"

# Push (with timeout!)
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && 
                   git push origin v3.1-insulin" timeout_ms=10000
```

---

## DOCUMENTATION HIERARCHY

**Tier 1 - START HERE:**
- `START_HERE.md` - Quick orientation
- `HANDOFF_V3_1_PHASE_0_TDD_READY.md` - This file (current work)

**Tier 2 - Phase 0 Reference:**
- `V3_1_PHASE_0_TDD_METRICS.md` - Complete implementation guide
- `minimed_780g_ref.md` - Device/CSV specifications

**Tier 3 - v3.0 Archive:**
- `HANDOFF_2025_10_28_VERIFIED.md` - v3.0 verification report
- `PROJECT_BRIEFING_V3_0.md` - Complete v3.0 technical reference

---

## NEXT SESSION QUICK START

**If continuing Phase 0 implementation:**

1. Read this handoff (YOU ARE HERE)
2. Check current branch: `git branch`
3. Start server: Port 3001
4. Search for emojis FIRST: 
   ```bash
   DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus/src" 
                   pattern="💉|📊|🔉" searchType="content"
   ```
5. Fix emoji bug before implementing TDD
6. Follow implementation order above
7. Use test-insulin-tdd.html for verification

**Quick Commands:**
```bash
# Server
./start.sh

# Debug tool
open http://localhost:3001/test-insulin-tdd.html

# Test CSV location
/Users/jomostert/Downloads/Jo_Mostert_28-10-2025_7d.csv
```

---

## WARNINGS & GOTCHAS

**CRITICAL:**
1. **NO EMOJIS** - They corrupt in certain environments
2. **Desktop Commander** - Standard bash won't work
3. **Port 3001** - Required for Chrome connector
4. **Decimal Separators** - CSV uses commas (European format)
5. **Column Indices** - Zero-based, Section 2 different from Section 1
6. **Brutalist Design** - Maintain 3px borders, monospace, high contrast

**TESTING:**
1. Always test in Safari (primary browser)
2. Check Chrome for compatibility
3. Verify print preview (black & white)
4. Test with real 7-day CSV, not synthetic data
5. Compare with CareLink PDF for accuracy

---

**Status:** READY TO IMPLEMENT  
**Branch:** v3.1-insulin  
**Base:** v3.0-dev (verified)  
**Priority:** Fix emoji bug FIRST, then implement TDD  
**Estimated Time:** 4-6 hours development + 2 hours testing

---

*Generated: 29 October 2025*  
*AGP+ v3.1 Phase 0 - Clean Implementation Handoff*
