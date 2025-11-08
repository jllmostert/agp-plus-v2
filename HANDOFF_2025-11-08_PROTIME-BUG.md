# HANDOFF - CRITICAL BUG: ProTime Workday Parsing Broken

**Date**: 2025-11-08 02:30  
**Priority**: 🔴 HIGH - Production regression  
**Type**: Bug fix (parsing logic)  
**Impact**: ProTime PDF data extraction incorrect

---

## 🚨 BUG REPORT

### Symptom
ProTime PDF parsing returns incorrect workday count. The number of workdays extracted from PDFs is wrong.

### Timeline
- **Working**: Before 2025-11-08
- **Broken**: Today (2025-11-08)
- **Suspected cause**: Recent changes during Session 13/14 (import/export work)

### User Impact
- ❌ ProTime data import unreliable
- ❌ Workday counts incorrect
- ❌ Patient cannot trust imported data

---

## 🎯 DEBUG MISSION

### Goal
Find and fix the ProTime parsing regression that occurred today.

### What to Check

1. **ProTime PDF Parser** (`src/utils/pdfParser.js`)
   - Is parsing logic intact?
   - Are workday extraction functions working?
   - Any recent changes to parsing algorithm?

2. **ProTime Storage** (`src/storage/masterDatasetStorage.js`)
   - Is `storeProTimeData()` working correctly?
   - Check localStorage key: `'agp-protime-data'`
   - Are workdays being saved?

3. **Import Flow** (`src/storage/import.js`)
   - Is ProTime import logic correct?
   - Check `importMasterDataset()` workdays section
   - Any regressions from recent import refactor?

4. **Data Structure**
   - Has the ProTime data schema changed?
   - Are workday objects structured correctly?
   - Check: `{ date, start, end, hoursWorked }`

---

## 🔍 INVESTIGATION STEPS

### Step 1: Verify Current Behavior
```bash
# Start server
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3005
```

**Manual Test**:
1. Upload a known ProTime PDF (with X workdays)
2. Check console logs for parsing output
3. Verify localStorage: `localStorage.getItem('agp-protime-data')`
4. Count actual workdays vs expected

**Expected**: X workdays extracted correctly  
**Actual**: ??? (incorrect count)

---

### Step 2: Review Recent Changes
**Files modified during Session 13-14** (potential culprits):

1. `src/storage/import.js`
   - Lines 150-180: Workday import logic
   - Changed during import/export refactor
   - Check if `storeProTimeData()` call is correct

2. `src/storage/masterDatasetStorage.js`
   - Check if `storeProTimeData()` was modified
   - Verify data structure hasn't changed

3. `src/utils/pdfParser.js`
   - Unlikely culprit (wasn't touched recently)
   - But verify parsing still works

---

### Step 3: Check Git History
```bash
# Find recent changes to ProTime-related files
git log --since="2025-11-07" --oneline -- src/utils/pdfParser.js
git log --since="2025-11-07" --oneline -- src/storage/masterDatasetStorage.js
git log --since="2025-11-07" --oneline -- src/storage/import.js

# Show diff for suspicious commits
git show [commit-hash]
```

---

### Step 4: Compare Working vs Broken Code

**Working state** (before today):
- Check git commit before Session 13 started
- Tag: v3.7.0 or earlier

**Broken state** (current):
- develop branch
- After import/export refactor

**Diff command**:
```bash
git diff v3.7.0..HEAD -- src/storage/import.js
git diff v3.7.0..HEAD -- src/storage/masterDatasetStorage.js
```

---

## 🐛 LIKELY CULPRITS

### Hypothesis 1: Import Logic Changed
**Suspect**: `src/storage/import.js` lines ~150-180

**What might be wrong**:
```javascript
// BEFORE (working)
const workdays = importData.workdays || [];
await storeProTimeData(workdays);

// AFTER (broken?) - possible issues:
// 1. Wrong property name: importData.protime_data?
// 2. Missing await?
// 3. Wrong function call?
// 4. Data not being passed correctly?
```

**Check**:
- Is `importData.workdays` the correct key?
- Is `storeProTimeData()` being called?
- Are workdays being logged correctly?

---

### Hypothesis 2: Data Structure Mismatch
**Suspect**: ProTime data schema changed

**Expected structure**:
```javascript
{
  workdays: [
    { date: '2025-10-01', start: '08:00', end: '16:30', hoursWorked: 8.5 },
    { date: '2025-10-02', start: '08:30', end: '17:00', hoursWorked: 8.5 },
    // ...
  ]
}
```

**Possible issue**:
- Key renamed: `workdays` → `protime_data`?
- Nested differently in import JSON?
- Array flattened incorrectly?

---

### Hypothesis 3: localStorage Key Changed
**Suspect**: Storage key mismatch

**Current key**: `'agp-protime-data'`

**Possible issue**:
- Reading from wrong key?
- Writing to wrong key?
- Key name changed during refactor?

**Verify**:
```javascript
// In browser console:
const data = localStorage.getItem('agp-protime-data');
console.log(JSON.parse(data));
```

---

## 🔧 FIX STRATEGY

### Once Bug Found
1. **Minimal fix** - Change only what's broken
2. **Add logging** - Console.log to verify fix
3. **Test with real PDF** - Upload ProTime PDF, verify count
4. **Regression test** - Test CSV + JSON import (ensure no new breaks)

### If Multiple Issues
- Fix them separately
- Commit after each fix
- Test incrementally

---

## ✅ VERIFICATION CHECKLIST

After fix, verify:
- [ ] ProTime PDF upload works
- [ ] Correct number of workdays extracted
- [ ] Workdays visible in localStorage
- [ ] Workdays display in UI (if applicable)
- [ ] No regressions in CSV import
- [ ] No regressions in JSON import
- [ ] Console logs clean (no errors)

---

## 📝 CODE REFERENCE

### Key Files to Check

**1. src/utils/pdfParser.js**
```javascript
// Function: parseProTimePDF(file)
// Expected: Returns array of workday objects
// Check: Is parsing logic intact?
```

**2. src/storage/masterDatasetStorage.js**
```javascript
// Function: storeProTimeData(workdays)
// Expected: Saves to localStorage['agp-protime-data']
// Check: Is it being called correctly?
```

**3. src/storage/import.js**
```javascript
// Section: Workday import (lines ~150-180)
// Expected: Reads importData.workdays, calls storeProTimeData()
// Check: Is the flow correct?
```

**4. src/components/AGPGenerator.jsx**
```javascript
// Handler: handlePDFUpload()
// Expected: Calls parseProTimePDF(), updates state
// Check: Is the upload handler working?
```

---

## 🎯 SUCCESS CRITERIA

**Bug is fixed when**:
1. Upload ProTime PDF with 10 workdays → extracts exactly 10
2. Console logs show correct parsing
3. localStorage contains correct data
4. No regressions in other import methods

---

## 📊 DEBUGGING COMMANDS

### Console Checks
```javascript
// In browser console after PDF upload:

// 1. Check localStorage
const protimeData = localStorage.getItem('agp-protime-data');
console.log('ProTime data:', JSON.parse(protimeData));

// 2. Count workdays
const workdays = JSON.parse(protimeData);
console.log('Workday count:', workdays?.length || 0);

// 3. Inspect first workday
console.log('First workday:', workdays?.[0]);
```

### Git Commands
```bash
# Find when ProTime code last changed
git log --follow -- src/utils/pdfParser.js

# Show recent commits touching ProTime
git log --all --grep="protime" --grep="workday" -i

# Compare with last working version
git diff HEAD~10 -- src/storage/import.js
```

---

## 🚀 NEXT SESSION START

### Commands
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3005
```

### First Actions
1. Read this handoff
2. Upload a test ProTime PDF
3. Check console for errors
4. Inspect localStorage
5. Find the bug
6. Fix it
7. Test thoroughly
8. Commit fix

---

## 📎 CONTEXT

**Recent Work** (Session 13-14):
- Import/export symmetry complete
- Added merge strategy (append/replace)
- Added backup before import
- Modified `import.js` extensively
- **Likely regression source**: import.js workday section

**Current Status**:
- Branch: develop
- Server: Port 3005
- ProTime parsing: BROKEN ❌
- Other features: Working ✅

**Priority**: Fix this BEFORE continuing with UI refactor

---

**Ready to debug. Good hunting!** 🐛🔫