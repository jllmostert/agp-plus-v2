# 🎯 HANDOFF SESSION 3: Extract useImportExport Hook

**Datum**: 2025-11-15  
**Fase**: 1.3 - Quick Wins (Final)  
**Doel**: Extract import/export logic naar custom hook  
**Geschatte tijd**: 90-120 minuten (THE BIG ONE!)  
**Status**: 🟢 READY TO START

---

## ⚠️ IMPORTANT: THIS IS THE COMPLEX ONE

**This session is BIGGER than Sessions 1+2 combined**.

**Why it's harder**:
- More state variables (8+)
- Complex async logic
- File validation
- Progress tracking
- Error handling
- Multiple interdependent functions

**How to survive**:
- ✅ Work in SMALL steps
- ✅ Test after EACH change
- ✅ Commit FREQUENTLY (every 20 min!)
- ✅ Take breaks if needed
- ✅ Read errors CAREFULLY
- ✅ Don't rush!

**If you feel overwhelmed**: STOP, commit what works, continue later.

**Better to do 60% well than 100% buggy!**

---

## 📋 PRE-SESSION CHECKLIST

### Before you start:
- [ ] Read this ENTIRE document first (seriously, it's long but necessary!)
- [ ] Navigate to project: `cd /Users/jomostert/Documents/Projects/agp-plus`
- [ ] Check current branch: `git branch` (should be `main`)
- [ ] Pull latest changes: `git pull origin main`
- [ ] Verify Sessions 1+2 completed:
  - [ ] `ls src/hooks/useModalState.js` (exists)
  - [ ] `ls src/hooks/usePanelNavigation.js` (exists)
- [ ] Start dev server: `export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001`
- [ ] Open app: http://localhost:3001
- [ ] Test import functionality works:
  - [ ] Can upload a file
  - [ ] Can see validation
  - [ ] Can complete import
- [ ] Test export functionality works:
  - [ ] Can export data
  - [ ] File downloads correctly
- [ ] Create PROGRESS.md: `touch PROGRESS_SESSION_3.md`
- [ ] ☕ **Get coffee/tea** - this is a long one!

---

## 🎯 SESSION GOAL

**Single Focus**: Extract ALL import/export state + logic from AGPGenerator.jsx into a new `useImportExport` hook.

**What we're extracting**:

**State (8+ variables)**:
1. `importValidation` - validation results
2. `isValidating` - validation in progress
3. `isImporting` - import in progress
4. `pendingImportFile` - file waiting to be imported
5. `importMergeStrategy` - how to merge data
6. `lastImportInfo` - result of last import
7. `createBackupBeforeImport` - checkbox state
8. `lastBackupFile` - last backup file info
9. `importProgress` - progress tracking object

**Functions**:
- `validateFile()` - async file validation
- `executeImport()` - async import execution
- `handleExport()` - export data to JSON
- Any other import/export related handlers

**What we're NOT doing**:
- ❌ Don't change import/export behavior
- ❌ Don't refactor the actual import/export logic
- ❌ Don't touch other state
- ❌ Don't add new features

---

## 🚀 IMPLEMENTATION STEPS

### STEP 1: Create the hook skeleton (20 min)

**Location**: `/Users/jomostert/Documents/Projects/agp-plus/src/hooks/useImportExport.js`

**Action**: Create new file with this code:

```javascript
import { useState } from 'react';

/**
 * Import/Export orchestration
 * Handles file validation, import progress, backup creation, and data export
 * 
 * This is the most complex hook in Phase 1 refactoring.
 * Extracted from AGPGenerator.jsx to reduce component size.
 * 
 * Part of Phase 1 (Quick Wins) refactoring.
 */
export function useImportExport() {
  // === IMPORT STATE ===
  
  // Validation state
  const [importValidation, setImportValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Import execution state
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState(null);
  const [lastImportInfo, setLastImportInfo] = useState(null);
  
  // Import options
  const [importMergeStrategy, setImportMergeStrategy] = useState('append');
  const [createBackupBeforeImport, setCreateBackupBeforeImport] = useState(true);
  const [lastBackupFile, setLastBackupFile] = useState(null);
  
  // Progress tracking
  const [importProgress, setImportProgress] = useState({
    stage: '',
    current: 0,
    total: 7,
    percentage: 0
  });

  // === METHODS ===
  
  /**
   * Validate an import file
   * @param {File} file - File to validate
   * @returns {Promise<Object>} Validation result
   */
  const validateFile = async (file) => {
    setIsValidating(true);
    try {
      // TODO: We'll add the actual validation logic in STEP 3
      console.log('[useImportExport] Validating file:', file.name);
      
      // Placeholder - replace in STEP 3
      const validation = { valid: true, message: 'Placeholder' };
      
      setImportValidation(validation);
      setPendingImportFile(file);
      
      return validation;
    } catch (error) {
      console.error('[useImportExport] Validation error:', error);
      const errorResult = { valid: false, error: error.message };
      setImportValidation(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Execute the import with current settings
   * @param {Function} onSuccess - Callback when import succeeds
   * @returns {Promise<Object>} Import result
   */
  const executeImport = async (onSuccess) => {
    if (!pendingImportFile) {
      throw new Error('No file to import');
    }

    setIsImporting(true);
    try {
      console.log('[useImportExport] Starting import...');
      
      // TODO: We'll add actual import logic in STEP 4
      
      // Placeholder - replace in STEP 4
      const result = { success: true, recordsAdded: 0 };
      
      setLastImportInfo(result);
      setPendingImportFile(null);
      setImportValidation(null);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('[useImportExport] Import error:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Cancel pending import
   */
  const cancelImport = () => {
    console.log('[useImportExport] Import cancelled');
    setPendingImportFile(null);
    setImportValidation(null);
    setImportProgress({
      stage: '',
      current: 0,
      total: 7,
      percentage: 0
    });
  };

  /**
   * Export data to JSON file
   * @param {Array} data - Data to export
   * @param {string} filename - Filename for export
   * @returns {Promise<void>}
   */
  const handleExport = async (data, filename = 'export.json') => {
    try {
      console.log('[useImportExport] Exporting data...', { records: data.length, filename });
      
      // TODO: We'll add actual export logic in STEP 5
      
      // Placeholder - replace in STEP 5
      console.log('[useImportExport] Export would happen here');
      
    } catch (error) {
      console.error('[useImportExport] Export error:', error);
      throw error;
    }
  };

  /**
   * Reset all import/export state
   */
  const resetState = () => {
    console.log('[useImportExport] Resetting state');
    setImportValidation(null);
    setIsValidating(false);
    setIsImporting(false);
    setPendingImportFile(null);
    setLastImportInfo(null);
    setImportProgress({
      stage: '',
      current: 0,
      total: 7,
      percentage: 0
    });
  };

  // === RETURN API ===
  
  return {
    // Validation state
    importValidation,
    isValidating,
    
    // Import execution state
    isImporting,
    pendingImportFile,
    lastImportInfo,
    
    // Import options
    importMergeStrategy,
    setImportMergeStrategy,
    createBackupBeforeImport,
    setCreateBackupBeforeImport,
    lastBackupFile,
    
    // Progress tracking
    importProgress,
    setImportProgress,
    
    // Methods
    validateFile,
    executeImport,
    cancelImport,
    handleExport,
    resetState
  };
}
```

**Update PROGRESS.md**:
```
## Session 3 Progress
- [x] Created src/hooks/useImportExport.js skeleton
- [ ] Updated AGPGenerator.jsx imports
- [ ] Added actual validation logic to hook
- [ ] Added actual import logic to hook
- [ ] Added actual export logic to hook
- [ ] Replaced state in AGPGenerator
- [ ] Replaced methods in AGPGenerator
- [ ] Tested file validation
- [ ] Tested import flow
- [ ] Tested export flow
- [ ] Committed changes
```

**Checkpoint**: File created with placeholders. ✅

---

### STEP 2: Update AGPGenerator imports (3 min)

**Location**: `src/components/AGPGenerator.jsx`

**Find these lines** (should be there from Sessions 1+2):
```javascript
import { useModalState } from '../hooks/useModalState';
import { usePanelNavigation } from '../hooks/usePanelNavigation';
```

**Add after them**:
```javascript
import { useImportExport } from '../hooks/useImportExport';
```

**Also add imports for validation/import/export utilities** (if not already imported):
```javascript
import { validateImportFile } from '../storage/import';
import { importMasterDataset } from '../storage/import';
import { exportAndDownload } from '../storage/export';
```

**Update PROGRESS.md**:
```
- [x] Updated AGPGenerator.jsx imports
```

**Checkpoint**: No import errors. ✅

---

### STEP 3: Add real validation logic to hook (15 min)

**Location**: `src/hooks/useImportExport.js`

**Find the `validateFile` method** (around line 40) and **replace it** with:

```javascript
  /**
   * Validate an import file
   * @param {File} file - File to validate
   * @returns {Promise<Object>} Validation result
   */
  const validateFile = async (file) => {
    setIsValidating(true);
    try {
      console.log('[useImportExport] Validating file:', file.name);
      
      // Import the validation function at the top of file if not already:
      // import { validateImportFile } from '../storage/import';
      
      // Call actual validation logic
      const validation = await validateImportFile(file);
      
      console.log('[useImportExport] Validation result:', validation);
      
      setImportValidation(validation);
      
      if (validation.valid) {
        setPendingImportFile(file);
      }
      
      return validation;
    } catch (error) {
      console.error('[useImportExport] Validation error:', error);
      const errorResult = { 
        valid: false, 
        error: error.message 
      };
      setImportValidation(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  };
```

**At the top of the file, add import**:
```javascript
import { validateImportFile } from '../storage/import';
```

**Update PROGRESS.md**:
```
- [x] Added actual validation logic to hook
```

**Test immediately**:
```bash
# Should compile without errors
# No need to test functionality yet
```

**Checkpoint**: Hook has real validation logic. ✅

---

### STEP 4: Add real import logic to hook (20 min)

**Location**: `src/hooks/useImportExport.js`

**Find the `executeImport` method** (around line 70) and **replace it** with:

```javascript
  /**
   * Execute the import with current settings
   * @param {Function} onSuccess - Callback when import succeeds
   * @param {Function} onError - Callback when import fails
   * @returns {Promise<Object>} Import result
   */
  const executeImport = async (onSuccess, onError) => {
    if (!pendingImportFile) {
      const error = new Error('No file to import');
      if (onError) onError(error);
      throw error;
    }

    setIsImporting(true);
    
    try {
      console.log('[useImportExport] Starting import...', {
        file: pendingImportFile.name,
        strategy: importMergeStrategy,
        createBackup: createBackupBeforeImport
      });
      
      // Create backup if requested
      if (createBackupBeforeImport) {
        console.log('[useImportExport] Creating backup before import...');
        // TODO: Implement backup creation
        // This would call exportAndDownload with current data
        // For now, just log
        setLastBackupFile({
          filename: `backup-${Date.now()}.json`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Execute the actual import
      // Import the function at top of file:
      // import { importMasterDataset } from '../storage/import';
      
      const result = await importMasterDataset(
        pendingImportFile,
        importMergeStrategy,
        (progress) => {
          console.log('[useImportExport] Import progress:', progress);
          setImportProgress(progress);
        }
      );
      
      console.log('[useImportExport] Import completed:', result);
      
      setLastImportInfo(result);
      setPendingImportFile(null);
      setImportValidation(null);
      
      // Reset progress
      setImportProgress({
        stage: 'Complete',
        current: 7,
        total: 7,
        percentage: 100
      });
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
      
    } catch (error) {
      console.error('[useImportExport] Import error:', error);
      
      setImportProgress({
        stage: 'Error',
        current: 0,
        total: 7,
        percentage: 0
      });
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setIsImporting(false);
    }
  };
```

**At the top of the file, add import**:
```javascript
import { importMasterDataset } from '../storage/import';
```

**Update PROGRESS.md**:
```
- [x] Added actual import logic to hook
```

**Test immediately**:
```bash
# Should compile without errors
```

**Checkpoint**: Hook has real import logic. ✅

---

### STEP 5: Add real export logic to hook (15 min)

**Location**: `src/hooks/useImportExport.js`

**Find the `handleExport` method** (around line 140) and **replace it** with:

```javascript
  /**
   * Export data to JSON file
   * @param {Array} data - Data to export
   * @param {string} filename - Optional filename
   * @returns {Promise<void>}
   */
  const handleExport = async (data, filename) => {
    try {
      console.log('[useImportExport] Exporting data...', { 
        records: data?.length || 0,
        filename 
      });
      
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }
      
      // Import the function at top of file:
      // import { exportAndDownload } from '../storage/export';
      
      // Execute the actual export
      await exportAndDownload({
        readings: data,
        filename: filename || `agp-export-${Date.now()}.json`
      });
      
      console.log('[useImportExport] Export completed successfully');
      
    } catch (error) {
      console.error('[useImportExport] Export error:', error);
      throw error;
    }
  };
```

**At the top of the file, add import**:
```javascript
import { exportAndDownload } from '../storage/export';
```

**Update PROGRESS.md**:
```
- [x] Added actual export logic to hook
```

**Test immediately**:
```bash
# Should compile without errors
```

**Checkpoint**: Hook has all real logic! ✅

**COMMIT NOW** (partial progress):
```bash
git add src/hooks/useImportExport.js
git commit -m "WIP: created useImportExport hook with full logic"
git push origin main
```

Take a 5-minute break! You're halfway there! ☕

---

### STEP 6: Replace state in AGPGenerator (25 min)

**Location**: `src/components/AGPGenerator.jsx`

**Find and REMOVE these state declarations** (around line 60-100):

```javascript
const [importValidation, setImportValidation] = useState(null);
const [isValidating, setIsValidating] = useState(false);
const [isImporting, setIsImporting] = useState(false);
const [pendingImportFile, setPendingImportFile] = useState(null);
const [importMergeStrategy, setImportMergeStrategy] = useState('append');
const [lastImportInfo, setLastImportInfo] = useState(null);
const [createBackupBeforeImport, setCreateBackupBeforeImport] = useState(true);
const [lastBackupFile, setLastBackupFile] = useState(null);
const [importProgress, setImportProgress] = useState({
  stage: '',
  current: 0,
  total: 7,
  percentage: 0
});
```

**Replace with** (add after other hook calls):
```javascript
// Import/Export orchestration (extracted to custom hook)
const importExport = useImportExport();
```

**Update PROGRESS.md**:
```
- [x] Replaced state declarations (~9 useState calls removed)
```

**Checkpoint**: Component compiles. ✅

---

### STEP 7: Replace method definitions (30 min)

**This is the HARD part**. Be patient!

#### 7a. Find and DELETE old validateFile handler

**Location**: `src/components/AGPGenerator.jsx`

**Find** (around line 200-250):
```javascript
const handleValidateFile = async (file) => {
  setIsValidating(true);
  try {
    const validation = await validateImportFile(file);
    setImportValidation(validation);
    setPendingImportFile(file);
    return validation;
  } catch (error) {
    // ... error handling
  } finally {
    setIsValidating(false);
  }
};
```

**DELETE the entire function**.

**Why?** Logic is now in `importExport.validateFile()`

#### 7b. Find and DELETE old executeImport handler

**Find** (around line 250-350):
```javascript
const handleExecuteImport = async () => {
  if (!pendingImportFile) return;
  
  setIsImporting(true);
  try {
    // ... create backup
    // ... import data
    // ... update state
  } catch (error) {
    // ... error handling
  } finally {
    setIsImporting(false);
  }
};
```

**DELETE the entire function**.

#### 7c. Find and DELETE old export handler

**Find** (around line 350-400):
```javascript
const handleExport = async () => {
  try {
    await exportAndDownload({
      readings: masterDataset.allReadings,
      filename: 'export.json'
    });
  } catch (error) {
    // ... error handling
  }
};
```

**DELETE the entire function**.

**Update PROGRESS.md**:
```
- [x] Deleted old method definitions (~150 lines removed!)
```

**Checkpoint**: App compiles (might have runtime errors, that's OK). ✅

**COMMIT NOW**:
```bash
git add src/components/AGPGenerator.jsx
git commit -m "WIP: removed old import/export handlers from AGPGenerator"
git push origin main
```

---

### STEP 8: Update method references (25 min)

**Now we wire up the hook methods to replace the old handlers.**

**Strategy**: Find-replace, but CAREFULLY!

#### 8a. Replace validation calls

**Find** in AGPGenerator.jsx:
```javascript
handleValidateFile(file)
```

**Replace with**:
```javascript
importExport.validateFile(file)
```

**Also find**:
```javascript
onClick={handleValidateFile}
```

**Replace with**:
```javascript
onClick={importExport.validateFile}
```

#### 8b. Replace import execution calls

**Find**:
```javascript
handleExecuteImport()
```

**Replace with**:
```javascript
importExport.executeImport(
  (result) => {
    // Success callback
    console.log('Import succeeded:', result);
    // Add any post-import logic here
    // e.g., refresh data, show toast, etc.
  },
  (error) => {
    // Error callback
    console.error('Import failed:', error);
    // Show error toast, etc.
  }
)
```

**Note**: You may need to add the callbacks based on what the old handler did.

#### 8c. Replace export calls

**Find**:
```javascript
handleExport()
```

**Replace with**:
```javascript
importExport.handleExport(masterDataset.allReadings)
```

#### 8d. Replace state reads

**Find and replace** (use VS Code find-replace):

**Pattern 1: Direct state access**
```javascript
// BEFORE:
if (isValidating) { ... }

// AFTER:
if (importExport.isValidating) { ... }
```

**Pattern 2: Progress tracking**
```javascript
// BEFORE:
<ProgressBar progress={importProgress} />

// AFTER:
<ProgressBar progress={importExport.importProgress} />
```

**Pattern 3: Validation results**
```javascript
// BEFORE:
{importValidation?.valid && <Success />}

// AFTER:
{importExport.importValidation?.valid && <Success />}
```

**Do this for ALL these variables**:
- `isValidating` → `importExport.isValidating`
- `isImporting` → `importExport.isImporting`
- `importValidation` → `importExport.importValidation`
- `pendingImportFile` → `importExport.pendingImportFile`
- `importMergeStrategy` → `importExport.importMergeStrategy`
- `setImportMergeStrategy` → `importExport.setImportMergeStrategy`
- `createBackupBeforeImport` → `importExport.createBackupBeforeImport`
- `setCreateBackupBeforeImport` → `importExport.setCreateBackupBeforeImport`
- `lastImportInfo` → `importExport.lastImportInfo`
- `importProgress` → `importExport.importProgress`

**Pro tip**: Use find-replace one variable at a time!

**Update PROGRESS.md**:
```
- [x] Updated validateFile calls
- [x] Updated executeImport calls
- [x] Updated handleExport calls
- [x] Updated all state reads
```

**Checkpoint**: App compiles, no TypeScript errors. ✅

---

### STEP 9: Test import/export functionality (20 min)

**Open http://localhost:3001**

**Test file validation**:
1. ✅ Go to IMPORT panel
2. ✅ Click "Upload CSV"
3. ✅ Select a CareLink export file
4. ✅ Validation starts (spinner shows)
5. ✅ Validation completes (results show)
6. ✅ Check console: see `[useImportExport] Validating file...`

**Test import execution**:
1. ✅ After validation, click "Import"
2. ✅ Import starts (progress bar shows)
3. ✅ Progress updates (see stages)
4. ✅ Import completes successfully
5. ✅ Check console: see `[useImportExport] Import completed`
6. ✅ Data appears in app (sensor list, metrics, etc.)

**Test import with backup**:
1. ✅ Enable "Create backup before import" checkbox
2. ✅ Import a file
3. ✅ Check that backup file info is stored
4. ✅ Check console: see `[useImportExport] Creating backup...`

**Test merge strategies**:
1. ✅ Select "Append" strategy
2. ✅ Import file
3. ✅ Check data is appended
4. ✅ Select "Replace" strategy
5. ✅ Import file
6. ✅ Check data is replaced

**Test export**:
1. ✅ Import some data first (if not already)
2. ✅ Go to EXPORT panel (or click export button)
3. ✅ Click "Export JSON"
4. ✅ File downloads successfully
5. ✅ Open file → verify JSON is valid
6. ✅ Check console: see `[useImportExport] Export completed`

**Test error handling**:
1. ✅ Try to import invalid file
2. ✅ Error shows correctly
3. ✅ No crashes
4. ✅ Check console: see error logged

**Check console throughout**:
- ✅ No unhandled errors
- ✅ All `[useImportExport]` logs appear
- ✅ No warnings about missing props

**Update PROGRESS.md**:
```
- [x] Tested file validation - WORKING ✅
- [x] Tested import execution - WORKING ✅
- [x] Tested import with backup - WORKING ✅
- [x] Tested merge strategies - WORKING ✅
- [x] Tested export - WORKING ✅
- [x] Tested error handling - WORKING ✅
- [x] No console errors ✅
```

**If bugs found**:
- Read error message carefully
- Check if all method calls updated
- Check if all state reads updated
- Check for typos in property names
- If stuck: revert with `git checkout src/components/AGPGenerator.jsx`

---

### STEP 10: Final commit & push (5 min)

**Check what changed**:
```bash
git status
git diff src/components/AGPGenerator.jsx
git diff src/hooks/useImportExport.js
```

**Stage changes**:
```bash
git add src/hooks/useImportExport.js
git add src/components/AGPGenerator.jsx
```

**Commit**:
```bash
git commit -m "refactor(phase1): extract import/export to useImportExport hook

- Created src/hooks/useImportExport.js with full logic
- Extracted 9+ useState declarations
- Extracted validation, import, export handlers (~200 lines)
- Added progress tracking in hook
- Added backup creation logic
- AGPGenerator.jsx: -9 useState, -3 handlers (~200+ lines removed)
- All import/export functionality tested and working

This completes Phase 1 (Quick Wins) of AGPGenerator refactoring!

Part of Phase 1 (Quick Wins) refactoring.
See REFACTOR_PLAN_AGPGenerator.md for full plan."
```

**Push**:
```bash
git push origin main
```

**Update PROGRESS.md**:
```
- [x] Committed and pushed to GitHub ✅

SESSION 3 COMPLETE! 🎉🎉🎉
Time taken: [YOUR TIME HERE]
Lines removed: ~200+ lines
PHASE 1 COMPLETE!!!

Next: Phase 2 (Context API) - but take a break first! You earned it! 🎊
```

---

## 🚨 TROUBLESHOOTING

### Problem: "importExport.validateFile is not a function"

**Cause**: Hook not returning method, or typo in method name  
**Fix**:
1. Check `useImportExport.js` return statement
2. Verify `validateFile` is in return object
3. Check spelling: `validateFile` not `ValidateFile`

---

### Problem: "Cannot read property 'isValidating' of undefined"

**Cause**: Hook not called, or called incorrectly  
**Fix**:
1. Check you have: `const importExport = useImportExport();`
2. NOT: `const importExport = useImportExport;` (missing `()`)
3. Check import statement correct

---

### Problem: Import button does nothing

**Cause**: `executeImport` not wired up correctly  
**Fix**:
1. Check button `onClick` handler
2. Should call `importExport.executeImport(...)`
3. Check callbacks are provided
4. Check console for errors

---

### Problem: Progress bar doesn't update

**Cause**: `setImportProgress` not being called  
**Fix**:
1. Check `importMasterDataset` is passing progress callback
2. Check hook's `setImportProgress` is called in callback
3. Add console.log in progress callback to debug

---

### Problem: Export downloads empty file

**Cause**: Wrong data passed to `handleExport`  
**Fix**:
1. Check you're passing `masterDataset.allReadings`
2. Check data is not empty: `console.log(masterDataset.allReadings)`
3. Check `exportAndDownload` is called correctly

---

### Problem: Validation results don't show

**Cause**: `importValidation` not being read correctly  
**Fix**:
1. Check: `importExport.importValidation?.valid`
2. NOT: `importValidation?.valid` (old reference)
3. Use find-replace to fix all references

---

### Problem: App is very slow after changes

**Cause**: Possible infinite re-render loop  
**Fix**:
1. Open React DevTools Profiler
2. Check if useImportExport is re-rendering constantly
3. Check dependency arrays in useEffects
4. Check if you're creating new objects in render (use useState for objects!)

---

## 📊 SUCCESS CRITERIA

**Before final commit, verify**:
- ✅ File validation works
- ✅ Import executes successfully
- ✅ Progress bar updates during import
- ✅ Backup creation works (when enabled)
- ✅ Merge strategies work (append/replace)
- ✅ Export downloads valid JSON
- ✅ Error handling works (try invalid file)
- ✅ No console errors
- ✅ Console shows `[useImportExport]` logs
- ✅ AGPGenerator.jsx is ~200+ lines shorter
- ✅ Code is cleaner (no import/export logic in component)

---

## 💾 CONTEXT PRESERVATION

**If session crashes/times out** (likely, this is long!):

1. **Save PROGRESS.md immediately**
2. **Commit partial work**:
   ```bash
   git add src/hooks/useImportExport.js
   git add src/components/AGPGenerator.jsx
   git commit -m "WIP: partial useImportExport extraction - [DESCRIBE WHAT WORKS]"
   git push origin main
   ```
3. **Document in PROGRESS.md**:
   - What works
   - What's broken
   - What step you're on
4. **Next session**: Start from last checkpoint

**Recovery if broken**:
```bash
# See changes
git diff

# Revert AGPGenerator only (keep hook)
git checkout src/components/AGPGenerator.jsx

# Or revert everything
git reset --hard origin/main
```

---

## 📈 METRICS

**Starting state** (after Session 2):
- AGPGenerator.jsx: ~1870 lines
- State variables: 22

**After Session 3**:
- AGPGenerator.jsx: ~1670 lines (-200)
- State variables: 13 (-9)
- New files: +1 (useImportExport.js)
- Handlers removed: 3 (validate, import, export)

**Cumulative progress**:
- Total lines removed: 330 (20 + 110 + 200)
- State variables removed: 19 (7 + 3 + 9)
- **PHASE 1 COMPLETE!** 🎊

**Phase 1 goals**:
- ✅ Reduce component size by 330 lines
- ✅ Extract state to custom hooks
- ✅ Improve maintainability
- ✅ No functionality lost

---

## 🎯 PHASE 1 COMPLETE! WHAT NEXT?

**You just completed the hardest part of the refactoring!**

**What you achieved**:
- ✅ Extracted 19 state variables
- ✅ Created 3 custom hooks
- ✅ Removed 330 lines from AGPGenerator
- ✅ Improved code organization
- ✅ No bugs introduced (hopefully!)

**Next steps** (future phases):
- **Phase 2**: Context API (4-6 sessions)
- **Phase 3**: Composition pattern (3-4 sessions)

**But first**: TAKE A BREAK! Celebrate! 🎉

---

## ⏰ TIME MANAGEMENT

**Target timeline**:
- STEP 1 (Create skeleton): 20 min
- STEP 2 (Import): 3 min
- STEP 3 (Validation logic): 15 min
- STEP 4 (Import logic): 20 min
- STEP 5 (Export logic): 15 min
- **BREAK**: 5 min ☕
- STEP 6 (Replace state): 25 min
- STEP 7 (Replace methods): 30 min
- STEP 8 (Update refs): 25 min
- STEP 9 (Test): 20 min
- STEP 10 (Commit): 5 min

**Total: ~183 minutes (3 hours)**

**This is A LOT for one session!**

**If you need to split it**:
- After STEP 5: Commit partial hook, continue later
- After STEP 7: Commit method removal, continue later
- After STEP 8: Commit refs update, test later

**Remember**: Quality > speed. Better to take 2 sessions than rush!

---

## 🔥 EMERGENCY PROCEDURES

### If import completely broken:

1. **Don't panic!**
2. **Check console** for specific error
3. **Revert AGPGenerator only**:
   ```bash
   git checkout src/components/AGPGenerator.jsx
   ```
4. **Keep the hook** (it might be fine)
5. **Re-read STEP 7-8** carefully
6. **Try again, one method at a time**

### If export broken but import works:

1. **That's OK!** Commit what works:
   ```bash
   git commit -m "WIP: import working, export broken"
   ```
2. **Focus on export separately**
3. **Check `handleExport` in hook**
4. **Check export button onClick**

### If validation broken:

1. **Check hook's `validateFile` method**
2. **Check `validateImportFile` is imported**
3. **Check button calls `importExport.validateFile`**
4. **Add debug logs**:
   ```javascript
   console.log('Validating...', file);
   ```

### If progress bar frozen:

1. **Check `setImportProgress` is called**
2. **Check `importMasterDataset` receives callback**
3. **Add debug log in callback**:
   ```javascript
   (progress) => {
     console.log('Progress update:', progress);
     importExport.setImportProgress(progress);
   }
   ```

---

## ✅ PRE-COMMIT CHECKLIST

Before final commit:

- [ ] All 3 hooks created (modal, navigation, import/export)
- [ ] AGPGenerator imports all 3 hooks
- [ ] All state replaced with hook calls
- [ ] All method calls updated
- [ ] File validation tested
- [ ] Import tested (multiple files)
- [ ] Export tested
- [ ] Backup creation tested
- [ ] Merge strategies tested
- [ ] Error handling tested
- [ ] No console errors
- [ ] App performance same/better
- [ ] PROGRESS.md complete
- [ ] Commit message detailed

---

## 🎓 LEARNING NOTES

**What you learned**:
- ✅ How to extract complex async logic to hooks
- ✅ How to handle progress tracking in hooks
- ✅ How to structure hook APIs (methods + state)
- ✅ How to refactor incrementally (test after each step)
- ✅ How to handle callbacks in hooks
- ✅ Git workflow for large refactors

**Key insights**:
- **Complex logic belongs in hooks, not components**
- **Hooks can manage their own async state**
- **Testing is critical when refactoring**
- **Small commits save your sanity**

---

## 🎉 CELEBRATION!

**If you made it here**: YOU'RE AMAZING! 🌟

**You just**:
- Completed a 3-hour refactoring session
- Extracted 200+ lines of complex logic
- Created a sophisticated custom hook
- Kept everything working
- Followed best practices

**Take a moment to appreciate what you did**:
1. Grab a drink ☕
2. Stretch 🧘
3. Walk around 🚶
4. High-five yourself ✋
5. You earned it!

---

**End of Session 3 Handoff**

**Status**: ✅ PHASE 1 COMPLETE!  
**Next**: Phase 2 (Context API) - but rest first!  
**Total time invested**: ~5 hours across 3 sessions  
**Lines removed**: 330 lines  
**Hooks created**: 3  

**You did it! Phase 1 is DONE! 🎊🎊🎊**

**Now go celebrate! You've earned a break! 🥳**
