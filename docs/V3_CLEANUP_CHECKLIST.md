# AGP+ v3.9.0 - Cleanup Checklist

**Quick reference for completing console.log cleanup**

---

## ✅ COMPLETED (6 files)

- [x] `hooks/useComparison.js`
- [x] `hooks/useSensorDatabase.js`
- [x] `components/AGPGenerator.jsx`
- [x] `components/DateRangeFilter.jsx`
- [x] `components/SensorHistoryModal.jsx`
- [x] `components/DataManagementModal.jsx`

---

## 🚧 REMAINING FILES WITH CONSOLE STATEMENTS

### High Priority - Core Engines (Business Logic)
- [ ] `core/metrics-engine.js`
- [ ] `core/day-profile-engine.js`
- [ ] `core/parsers.js`
- [ ] `core/html-exporter.js`
- [ ] `core/day-profiles-exporter.js`
- [ ] `core/sensor-history-engine.js`

### Medium Priority - Hooks (Orchestration)
- [ ] `hooks/useMetrics.js`
- [ ] `hooks/useCSVData.js`
- [ ] `hooks/useMasterDataset.js`
- [ ] `hooks/useUploadStorage.js`
- [ ] `hooks/useDayProfiles.js`
- [ ] `hooks/useDataStatus.js`

### Lower Priority - Components (Presentation)
- [ ] `components/FileUpload.jsx`
- [ ] `components/MetricsDisplay.jsx`
- [ ] `components/AGPChart.jsx`
- [ ] `components/ComparisonView.jsx`
- [ ] `components/DayNightSplit.jsx`
- [ ] `components/WorkdaySplit.jsx`
- [ ] `components/PatientInfo.jsx`
- [ ] `components/SavedUploadsList.jsx`
- [ ] `components/DayProfileCard.jsx`
- [ ] `components/DayProfilesModal.jsx`
- [ ] `components/HypoglycemiaEvents.jsx`
- [ ] `components/PeriodSelector.jsx`
- [ ] `components/SensorImport.jsx`
- [ ] `components/MigrationBanner.jsx`

### Storage Modules (If any logs exist)
- [ ] `storage/export.js`
- [ ] `storage/masterDataset.js`
- [ ] `storage/workdayStorage.js`
- [ ] `storage/cartridgeStorage.js`
- [ ] `utils/patientStorage.js`
- [ ] `utils/uploadStorage.js`

---

## 📋 SYSTEMATIC CLEANUP PROCESS

For each file:

### Step 1: Read File
```bash
DC: read_file path="/Users/jomostert/Documents/Projects/agp-plus/src/[category]/[filename]"
```

### Step 2: Check for Console Statements
Look for:
- `console.log(`
- `console.error(`
- `console.warn(`
- `console.info(`

### Step 3: Add Debug Import
```bash
DC: edit_block file_path="..."
               old_string="import { ... } from '...';"
               new_string="import { ... } from '...';\nimport { debug } from '../utils/debug.js';"
```

### Step 4: Replace Console Calls
```bash
# For each console statement:
DC: edit_block file_path="..."
               old_string="console.log(...)"
               new_string="debug.log(...)"

# Errors:
old_string="console.error(...)"
new_string="debug.error(...)"

# Warnings:
old_string="console.warn(...)"
new_string="debug.warn(...)"
```

### Step 5: Test in Browser
- Open http://localhost:3001 (or 5173)
- Trigger the code path
- Verify logs appear in dev mode
- Check for errors

### Step 6: Mark Complete
Update this checklist with [x]

---

## 🎯 TESTING CHECKPOINTS

**After every 5 files:**
- [ ] Reload page
- [ ] Test main workflow
- [ ] Check console for errors
- [ ] Verify debug logs visible

**When 50% complete:**
- [ ] Production build: `npm run build`
- [ ] Preview: `npm run preview`
- [ ] Check console (should be quieter)

**When 100% complete:**
- [ ] Final production build
- [ ] Open in multiple browsers
- [ ] Console should be SILENT
- [ ] Test all features
- [ ] Export all file types
- [ ] Ready for deployment!

---

## 🔍 QUICK COMMANDS

```bash
# Count remaining console statements
grep -r "console\." src/ --include="*.js" --include="*.jsx" | wc -l

# Find files with most logs
grep -r "console\." src/ --include="*.js" --include="*.jsx" -c | sort -t: -k2 -nr | head -10

# Search with Desktop Commander
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus/src" 
                 pattern="console\." searchType="content"

# Build production
npm run build

# Preview production  
npm run preview
```

---

## ⚠️ COMMON PITFALLS

1. **Forgot to add import**
   - Symptom: `ReferenceError: debug is not defined`
   - Fix: Add `import { debug } from '../utils/debug.js';`

2. **Wrong relative path**
   - Symptom: `Cannot find module '../utils/debug.js'`
   - Fix: Check directory depth (might need `../../utils/debug.js`)

3. **Left patient data in logs**
   - Symptom: Full sensor objects in console
   - Fix: Only log counts/IDs, not full objects

4. **Forgot to test**
   - Symptom: Code breaks in production
   - Fix: Test after every few files

---

## ✨ VICTORY CONDITIONS

**v3.9.0 is ready when:**

- [ ] All files checked off above
- [ ] Production build generates NO console output
- [ ] All features work correctly
- [ ] README shows v3.9.0
- [ ] CHANGELOG has v3.9.0 entry
- [ ] Footer shows v3.9.0
- [ ] Exports work (AGP, Day Profiles, DB JSON)
- [ ] No errors in browser console
- [ ] Multi-browser tested
- [ ] Git commit pushed

---

**Last updated:** October 27, 2025  
**Files fixed:** 6 / ~25 (24% complete)  
**Estimated time remaining:** 2-3 hours
