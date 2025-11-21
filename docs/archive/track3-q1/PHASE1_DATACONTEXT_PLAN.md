# Phase 1: DataContext Implementation Plan

**Sprint**: Track 3, Q1 - Context API  
**Phase**: 1 of 4  
**Estimated**: 6-8 hours  
**Status**: 📋 Planning

---

## 🎯 PHASE 1 GOAL

Extract all data management state from AGPGenerator.jsx into a dedicated DataContext provider.

**What moves:**
- Master dataset (useMasterDataset)
- Data status (useDataStatus)
- Upload storage (useUploadStorage)
- CSV data (legacy V2)
- TDD statistics
- Error state

**Result:** 
- 6 state variables removed from AGPGenerator
- ~150-200 lines reduced
- Better data encapsulation

---

## 📋 TASK BREAKDOWN

### Task 1.1: Create DataContext (90 min)

**File:** `src/contexts/DataContext.jsx`

**Structure:**
```javascript
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useMasterDataset } from '../hooks/useMasterDataset';
import { useDataStatus } from '../hooks/useDataStatus';
import { useUploadStorage } from '../hooks/useUploadStorage';
import { useCSVData } from '../hooks/useCSVData';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // ============================================
  // STATE: Data Management
  // ============================================
  
  // V3: Master dataset (incremental storage)
  const masterDataset = useMasterDataset();
  
  // Data status monitoring (green/yellow/red light)
  const dataStatus = useDataStatus(masterDataset.allReadings);
  
  // V2: Legacy CSV uploads (fallback during transition)
  const { csvData, dateRange, loadCSV, loadParsedData, error: csvError } = useCSVData();
  
  // V3 Upload error state
  const [v3UploadError, setV3UploadError] = useState(null);
  
  // Upload storage management
  const uploadStorage = useUploadStorage();
  
  // TDD data by day (all days) from storage
  const [tddByDay, setTddByDay] = useState(null);
  
  // ============================================
  // EFFECTS: Data Loading
  // ============================================
  
  // Load TDD data from storage
  useEffect(() => {
    const loadTDD = async () => {
      try {
        const { loadTDDData } = await import('../storage/masterDatasetStorage');
        const tdd = await loadTDDData();
        if (tdd && tdd.tddByDay) {
          setTddByDay(tdd.tddByDay);
        }
      } catch (err) {
        console.error('[DataContext] Failed to load TDD data:', err);
      }
    };
    loadTDD();
  }, [uploadStorage.activeUploadId]);
  
  // ============================================
  // COMPUTED: Active Data Source
  // ============================================
  
  const useV3Mode = true; // Always use V3 for new uploads (Phase 4.0)
  
  const activeReadings = useMemo(() => {
    const hasV3Data = masterDataset.readings.length > 0;
    return hasV3Data ? masterDataset.readings : csvData;
  }, [masterDataset.readings, csvData]);
  
  const activeDateRange = useMemo(() => {
    return useV3Mode ? masterDataset.stats?.dateRange : dateRange;
  }, [useV3Mode, masterDataset.stats?.dateRange, dateRange]);
  
  const isFilteringData = masterDataset.isLoading && useV3Mode;
  
  // ============================================
  // METHODS: Data Operations
  // ============================================
  
  const clearError = () => {
    setV3UploadError(null);
  };
  
  const refreshData = async () => {
    // Force refresh of master dataset
    await masterDataset.refresh?.();
  };
  
  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value = {
    // Data sources
    masterDataset,
    csvData,
    activeReadings,
    activeDateRange,
    
    // Status
    dataStatus,
    isFilteringData,
    v3UploadError,
    
    // Upload management
    uploadStorage,
    
    // Statistics
    tddByDay,
    
    // Legacy
    dateRange,
    csvError,
    
    // Methods
    loadCSV,
    loadParsedData,
    clearError,
    refreshData,
    
    // Mode
    useV3Mode,
  };
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
```

**Checklist:**
- [ ] Create file `src/contexts/DataContext.jsx`
- [ ] Import all necessary hooks
- [ ] Move data state from AGPGenerator
- [ ] Move data loading effects
- [ ] Add computed properties
- [ ] Add helper methods
- [ ] Export useData hook
- [ ] Add JSDoc comments

---

### Task 1.2: Create useData Hook (30 min)

**File:** `src/hooks/useData.js`

This is just a re-export of the hook from DataContext, but we can add helper hooks:

```javascript
import { useData as useDataContext } from '../contexts/DataContext';

/**
 * Hook to consume DataContext
 * @returns {object} Data context value
 */
export function useData() {
  return useDataContext();
}

/**
 * Hook to get only data status
 * Optimized to prevent unnecessary re-renders
 */
export function useDataStatus() {
  const { dataStatus } = useData();
  return dataStatus;
}

/**
 * Hook to get only active readings
 */
export function useActiveReadings() {
  const { activeReadings } = useData();
  return activeReadings;
}

/**
 * Hook to get only upload storage
 */
export function useUploads() {
  const { uploadStorage } = useData();
  return uploadStorage;
}
```

**Checklist:**
- [ ] Create file `src/hooks/useData.js`
- [ ] Export main useData hook
- [ ] Add optimized selector hooks
- [ ] Add JSDoc comments

---

### Task 1.3: Wrap App in DataProvider (30 min)

**File:** `src/main.jsx` or `src/App.jsx`

**Changes:**
```javascript
import { DataProvider } from './contexts/DataContext';

function App() {
  return (
    <DataProvider>
      <AGPGenerator />
    </DataProvider>
  );
}
```

**Checklist:**
- [ ] Import DataProvider
- [ ] Wrap root component
- [ ] Test that app still loads

---

### Task 1.4: Refactor AGPGenerator (3-4 hours)

**File:** `src/components/AGPGenerator.jsx`

**Remove:**
```javascript
// DELETE THESE LINES:
const masterDataset = useMasterDataset();
const dataStatus = useDataStatus(masterDataset.allReadings);
const { csvData, dateRange, loadCSV, loadParsedData, error: csvError } = useCSVData();
const [v3UploadError, setV3UploadError] = useState(null);
const uploadStorage = useUploadStorage();
const [tddByDay, setTddByDay] = useState(null);

// DELETE TDD loading useEffect
useEffect(() => {
  const loadTDD = async () => { ... }
}, [uploadStorage.activeUploadId]);

// DELETE all activeReadings/activeDateRange computed values
```

**Add:**
```javascript
import { useData } from '../hooks/useData';

// At top of component:
const data = useData();

// Then use:
data.masterDataset
data.dataStatus
data.csvData
data.activeReadings
data.uploadStorage
// etc.
```

**Update all references:**
- `masterDataset.` → `data.masterDataset.`
- `dataStatus.` → `data.dataStatus.`
- `csvData` → `data.csvData`
- `activeReadings` → `data.activeReadings`
- `uploadStorage.` → `data.uploadStorage.`
- etc.

**Checklist:**
- [ ] Import useData hook
- [ ] Replace all data state variables
- [ ] Update all references to use `data.`
- [ ] Remove deleted useEffect hooks
- [ ] Remove deleted useMemo hooks
- [ ] Test that everything compiles
- [ ] Test data loading still works
- [ ] Test upload management still works

---

### Task 1.5: Update Child Components (2-3 hours)

**Components that need updates:**
- `ImportPanel.jsx`
- `ExportPanel.jsx`
- `DataLoadingContainer.jsx`
- `VisualizationContainer.jsx`
- `SavedUploadsList.jsx`
- `FileUpload.jsx`
- `PeriodSelector.jsx`

**Strategy:**
For each component, check if it receives data props. If yes:
1. Remove props from parent
2. Import `useData()` in child
3. Use context instead

**Example:**
```javascript
// BEFORE
function ImportPanel({ csvData, loadCSV, uploadStorage }) {
  // Use props
}

// AFTER
import { useData } from '../hooks/useData';

function ImportPanel() {
  const { csvData, loadCSV, uploadStorage } = useData();
  // Use context
}
```

**Checklist:**
- [ ] Audit all components receiving data props
- [ ] Refactor each component to use useData
- [ ] Remove props from AGPGenerator calls
- [ ] Test each component still works

---

### Task 1.6: Testing & Validation (1-2 hours)

**Test Plan:**

**1. Data Loading**
- [ ] Upload new CSV → Data appears in AGP
- [ ] Upload multiple CSVs → Correct merge
- [ ] Load saved upload → Data loads correctly
- [ ] Switch between uploads → Data updates

**2. Data Status**
- [ ] No data → Red light
- [ ] Partial data → Yellow light
- [ ] Full data → Green light
- [ ] Date range shown correctly

**3. Upload Management**
- [ ] Save upload → Appears in list
- [ ] Rename upload → Name updates
- [ ] Lock upload → Lock icon shows
- [ ] Delete upload → Removed from list

**4. TDD Statistics**
- [ ] TDD data loads correctly
- [ ] TDD stats shown in UI
- [ ] TDD updates on data change

**5. Error Handling**
- [ ] Invalid CSV → Error shown
- [ ] Network error → Error shown
- [ ] Clear error → Error dismissed

**Checklist:**
- [ ] Manual test all scenarios above
- [ ] Check console for errors
- [ ] Check React DevTools for context
- [ ] Verify no memory leaks
- [ ] Document any issues found

---

## 🎯 SUCCESS CRITERIA

**Functionality:**
- [x] All data loading works unchanged
- [x] Upload management works correctly
- [x] TDD statistics load correctly
- [x] Error handling works

**Code Quality:**
- [x] AGPGenerator reduced by 150-200 lines
- [x] DataContext has JSDoc comments
- [x] useData hook has proper types
- [x] Zero ESLint warnings

**Performance:**
- [x] No performance regression
- [x] Context re-renders minimized
- [x] Memory usage unchanged

---

## 📊 METRICS

**Before:**
- AGPGenerator.jsx: 1819 lines
- Data state variables: 6

**After (Expected):**
- AGPGenerator.jsx: 1650-1700 lines (120-170 lines removed)
- Data state variables: 0 (moved to context)
- New files: 2 (DataContext.jsx + useData.js)

---

## 🚧 POTENTIAL ISSUES

**Issue 1: Re-render Performance**
- **Problem:** Context updates trigger all consumers to re-render
- **Solution:** Use React.memo on expensive components
- **Solution:** Split context if too many unrelated updates

**Issue 2: Circular Dependencies**
- **Problem:** Context imports hooks that import context
- **Solution:** Keep hooks pure (no context imports in base hooks)
- **Solution:** Only DataContext uses base hooks

**Issue 3: Testing Difficulty**
- **Problem:** Components now depend on context provider
- **Solution:** Create test wrapper with DataProvider
- **Solution:** Mock context values in tests

---

## 📝 COMMIT STRATEGY

**Commit 1:** Create DataContext and useData hook
```bash
git add src/contexts/DataContext.jsx src/hooks/useData.js
git commit -m "feat(context): Add DataContext for data management state"
```

**Commit 2:** Wrap app in DataProvider
```bash
git add src/main.jsx
git commit -m "feat(context): Wrap app in DataProvider"
```

**Commit 3:** Refactor AGPGenerator
```bash
git add src/components/AGPGenerator.jsx
git commit -m "refactor(agp): Use DataContext instead of local state"
```

**Commit 4:** Update child components
```bash
git add src/components/panels/*.jsx src/components/*.jsx
git commit -m "refactor(components): Use DataContext in child components"
```

**Commit 5:** Testing & docs
```bash
git add docs/handoffs/PROGRESS.md
git commit -m "docs: Update PROGRESS.md with Phase 1 completion"
```

---

## 🔄 ROLLBACK PLAN

If Phase 1 fails:
1. `git revert` all commits in reverse order
2. Return to last working state
3. Document what went wrong
4. Adjust plan before retry

**Branch strategy:**
- Work on `feature/context-api-phase1` branch
- Merge to `develop` after testing
- Merge to `main` after full sprint complete

---

## ✅ PHASE 1 CHECKLIST

**Planning:**
- [x] Create analysis document
- [x] Create implementation plan
- [ ] Review plan with team/user

**Implementation:**
- [ ] Task 1.1: Create DataContext (90 min)
- [ ] Task 1.2: Create useData hook (30 min)
- [ ] Task 1.3: Wrap app in provider (30 min)
- [ ] Task 1.4: Refactor AGPGenerator (3-4 hours)
- [ ] Task 1.5: Update child components (2-3 hours)
- [ ] Task 1.6: Testing & validation (1-2 hours)

**Completion:**
- [ ] All tests passing
- [ ] No console errors
- [ ] PROGRESS.md updated
- [ ] Commits pushed to feature branch
- [ ] Ready for code review

---

**Ready to implement?** Let's start with Task 1.1! 🚀
