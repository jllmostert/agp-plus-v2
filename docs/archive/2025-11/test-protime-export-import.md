# ProTime Export/Import Test

## Current State
- ProTime workdays in app: **16** (correct from PDF)

## Test Steps

### Step 1: Export Current Data
1. Click "Export Master Dataset" button
2. Save the JSON file
3. **CHECK**: Open the JSON file and find the `workdays` array
4. **VERIFY**: Count the array length - should be **16**

### Step 2: Inspect Export Format
Look for this section in the JSON:
```json
{
  "totalWorkdays": 16,
  "workdays": [
    "2025/10/01",
    "2025/10/02",
    "2025/10/03",
    ...
  ]
}
```

**Questions to answer:**
- Is `totalWorkdays` = 16? 
- Is `workdays` array length = 16?
- Are dates in correct format (YYYY/MM/DD)?

### Step 3: Import Back
1. Delete ProTime data (optional - to test clean import)
2. Click "Import Master Dataset"
3. Select the exported JSON
4. Wait for import to complete
5. **CHECK**: How many workdays are shown in UI?

### Step 4: Check Storage Locations
Open browser console and run:
```javascript
// Check IndexedDB
const db = await indexedDB.open('agp-plus-v3', 1);
// Then manually inspect SETTINGS store for 'protime_workdays' key

// Check localStorage
console.log('localStorage workday-dates:', 
  JSON.parse(localStorage.getItem('workday-dates') || 'null'));
```

## Expected Results
- Export: 16 workdays in JSON ✓
- Import: 16 workdays restored ✓
- IndexedDB: 16 workdays stored ✓
- localStorage: 16 workdays stored (V2 compat) ✓

## If Numbers Don't Match
Record the actual numbers:
- Export JSON count: ___
- Import UI count: ___
- IndexedDB count: ___
- localStorage count: ___

This will help pinpoint where the data gets corrupted.
