# Context API Refactoring - Analysis & Design

**Sprint**: Track 3, Q1  
**Date**: 2025-11-15  
**Status**: 📋 Planning  
**Estimated Effort**: 20 hours

---

## 🎯 GOALS

1. **Extract shared state** from AGPGenerator.jsx into Context providers
2. **Reduce AGPGenerator** by ~300-400 lines (target: 1400-1500 lines)
3. **Enable better state sharing** across components without prop drilling
4. **Maintain current functionality** - zero breaking changes
5. **Improve testability** - contexts can be tested independently

---

## 📊 CURRENT STATE ANALYSIS

### AGPGenerator.jsx State Variables (Line 100-180)

**Data Management** (6 variables):
```javascript
const masterDataset = useMasterDataset();          // V3 master dataset hook
const dataStatus = useDataStatus(masterDataset);   // Green/yellow/red light
const { csvData, dateRange, loadCSV } = useCSVData(); // V2 legacy CSV
const [v3UploadError, setV3UploadError] = useState(null);
const uploadStorage = useUploadStorage();          // Upload management
const [tddByDay, setTddByDay] = useState(null);   // TDD statistics
```

**Period Selection** (3 variables):
```javascript
const [startDate, setStartDate] = useState(null);
const [endDate, setEndDate] = useState(null);
const [selectedDateRange, setSelectedDateRange] = useState({ start: null, end: null });
```

**Optional Features** (8 variables):
```javascript
const [workdays, setWorkdays] = useState(null);
const [dayNightEnabled, setDayNightEnabled] = useState(false);
const [dataImportExpanded, setDataImportExpanded] = useState(false);
const [dataExportExpanded, setDataExportExpanded] = useState(false);
const [patientInfo, setPatientInfo] = useState(null);
const [loadToast, setLoadToast] = useState(null);
const [numDaysProfile, setNumDaysProfile] = useState(7);
const [batchAssignmentDialog, setBatchAssignmentDialog] = useState({ open: false });
const [pendingUpload, setPendingUpload] = useState(null);
```

**Already Extracted** (Phase 1):
```javascript
const modals = useModalState();                    // ✅ Extracted
const navigation = usePanelNavigation();           // ✅ Extracted
const importExport = useImportExport();            // ✅ Extracted
```

**Total:** 17 state variables still in AGPGenerator (down from 22 before Phase 1)

---

## 🏗️ PROPOSED CONTEXT ARCHITECTURE

### Context 1: DataContext
**Purpose:** Manage master dataset, readings, and data status  
**State:**
- `masterDataset` (from useMasterDataset hook)
- `dataStatus` (from useDataStatus hook)
- `csvData`, `dateRange` (V2 legacy, during migration)
- `v3UploadError`
- `uploadStorage` (from useUploadStorage hook)
- `tddByDay`

**Methods:**
- `loadCSV(files)`
- `refreshData()`
- `clearError()`

**Benefits:**
- All data loading logic in one place
- Components can consume data without prop drilling
- Easier to migrate from V2 to V3

---

### Context 2: PeriodContext
**Purpose:** Manage date range selection and filtering  
**State:**
- `startDate`, `setStartDate`
- `endDate`, `setEndDate`
- `selectedDateRange`, `setSelectedDateRange`

**Computed:**
- `isValid` - Whether current period is valid
- `dayCount` - Number of days in period
- `canCompare` - Whether comparison is available

**Methods:**
- `selectPeriod(start, end)`
- `selectLast14Days()`
- `selectLast30Days()`
- `clearPeriod()`

**Benefits:**
- Period selection logic centralized
- Easier to add preset ranges
- Auto-selection logic in one place

---

### Context 3: AppStateContext
**Purpose:** Manage application-wide settings and UI state  
**State:**
- `patientInfo`
- `workdays`
- `dayNightEnabled`
- `dataImportExpanded`, `dataExportExpanded`
- `numDaysProfile`
- `loadToast`
- `batchAssignmentDialog`
- `pendingUpload`

**Methods:**
- `updatePatientInfo(info)`
- `setWorkdays(days)`
- `toggleDayNight()`
- `setNumDaysProfile(n)`
- `showToast(message)`
- `openBatchDialog(suggestions)`
- `setPendingUpload(upload)`

**Benefits:**
- All app-wide settings in one place
- Easier to persist settings to localStorage
- Cleaner separation of concerns

---

## 📁 FILE STRUCTURE

```
src/
├── contexts/
│   ├── DataContext.jsx           # NEW - Master dataset & data loading
│   ├── PeriodContext.jsx         # NEW - Date range selection
│   ├── AppStateContext.jsx       # NEW - App settings & UI state
│   └── index.js                  # NEW - Export all contexts
│
├── hooks/
│   ├── useData.js                # NEW - Hook to consume DataContext
│   ├── usePeriod.js              # NEW - Hook to consume PeriodContext
│   ├── useAppState.js            # NEW - Hook to consume AppStateContext
│   │
│   ├── useModalState.js          # ✅ EXISTS (Phase 1)
│   ├── usePanelNavigation.js     # ✅ EXISTS (Phase 1)
│   └── useImportExport.js        # ✅ EXISTS (Phase 1)
│
├── components/
│   └── AGPGenerator.jsx          # REFACTOR - Use contexts instead of state
```

---

## 🔄 MIGRATION STRATEGY

### Option A: Big Bang (NOT RECOMMENDED)
- Create all 3 contexts at once
- Refactor AGPGenerator in one go
- High risk, hard to test

### Option B: Incremental (RECOMMENDED)
**Week 1:**
- Create DataContext
- Migrate data loading logic
- Test thoroughly

**Week 2:**
- Create PeriodContext
- Migrate period selection
- Test thoroughly

**Week 3:**
- Create AppStateContext
- Migrate app settings
- Final integration testing

---

## ✅ ACCEPTANCE CRITERIA

**Functionality:**
- [ ] All existing features work unchanged
- [ ] No regressions in data loading
- [ ] Period selection works correctly
- [ ] Patient info persists correctly

**Code Quality:**
- [ ] AGPGenerator.jsx reduced to 1400-1500 lines
- [ ] Zero ESLint warnings
- [ ] All contexts have JSDoc comments
- [ ] All hooks have proper dependencies

**Testing:**
- [ ] Manual testing of all features
- [ ] No console errors
- [ ] Performance unchanged or improved
- [ ] Memory leaks checked (React DevTools Profiler)

---

## 🎯 SUCCESS METRICS

**Before (Current):**
- AGPGenerator.jsx: 1819 lines
- State variables: 17 in component
- Prop drilling: Heavy (5-6 levels)

**After (Target):**
- AGPGenerator.jsx: 1400-1500 lines (22% reduction)
- State variables: 3-5 in component
- Prop drilling: Minimal (contexts used)
- New files: 6 (3 contexts + 3 hooks)

---

## 🚧 RISKS & MITIGATION

**Risk 1: Breaking Changes**
- Mitigation: Incremental migration, test after each context
- Fallback: Git branches, easy rollback

**Risk 2: Performance Regression**
- Mitigation: React.memo on expensive components
- Mitigation: useMemo for computed values
- Test: React DevTools Profiler before/after

**Risk 3: Over-Engineering**
- Mitigation: Only extract truly shared state
- Mitigation: Keep contexts focused and simple
- Review: Does this state need to be in context?

---

## 📝 NEXT STEPS

1. **Phase 1: DataContext** (6-8 hours)
   - [ ] Create DataContext.jsx
   - [ ] Create useData.js hook
   - [ ] Wrap App in DataProvider
   - [ ] Migrate AGPGenerator data state
   - [ ] Test data loading thoroughly

2. **Phase 2: PeriodContext** (4-6 hours)
   - [ ] Create PeriodContext.jsx
   - [ ] Create usePeriod.js hook
   - [ ] Wrap App in PeriodProvider
   - [ ] Migrate AGPGenerator period state
   - [ ] Test period selection

3. **Phase 3: AppStateContext** (6-8 hours)
   - [ ] Create AppStateContext.jsx
   - [ ] Create useAppState.js hook
   - [ ] Wrap App in AppStateProvider
   - [ ] Migrate AGPGenerator app state
   - [ ] Test all features

4. **Phase 4: Integration & Testing** (2-4 hours)
   - [ ] Integration testing
   - [ ] Performance profiling
   - [ ] Documentation updates
   - [ ] PROGRESS.md update

**Total Estimated:** 18-26 hours (target: 20 hours)

---

**Ready to start?** Let's begin with Phase 1: DataContext! 🚀
