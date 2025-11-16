# Phase 4 Ready: UIContext Extraction Plan

**Date**: 2025-11-16  
**Status**: 🎯 READY TO START  
**Estimated Effort**: 3-4 hours  
**Previous Phases**: 1 (Data), 2 (Period), 3 (Metrics) ✅ Complete

---

## 🎯 Phase 4 Goal

Extract remaining UI state from AGPGenerator into UIContext:
- Patient info state
- Optional feature flags (workdays, day/night, num days)
- UI expansion states (import/export panels)
- Toast notifications
- Batch assignment dialog
- Pending upload state

**Result**: AGPGenerator becomes pure coordination layer with ~1600 lines (down from 1747)

---

## 📊 Current State Analysis

### Remaining UI State in AGPGenerator (after Phase 3)

**Patient & Features** (3 variables):
```javascript
const [patientInfo, setPatientInfo] = useState(null);
const [workdays, setWorkdays] = useState(null);      // ProTime workday data
const [numDaysProfile, setNumDaysProfile] = useState(7);  // 7 or 14 days
```

**UI Expansion States** (2 variables):
```javascript
const [dataImportExpanded, setDataImportExpanded] = useState(false);
const [dataExportExpanded, setDataExportExpanded] = useState(false);
```

**Notifications & Dialogs** (3 variables):
```javascript
const [loadToast, setLoadToast] = useState(null);
const [batchAssignmentDialog, setBatchAssignmentDialog] = useState({ open: false });
const [pendingUpload, setPendingUpload] = useState(null);
```

**Already in Contexts**:
- ✅ modals (Phase 1 - useModalState)
- ✅ navigation (Phase 1 - usePanelNavigation)  
- ✅ import/export logic (Phase 1 - useImportExport)
- ✅ data (Phase 1 - DataContext)
- ✅ period (Phase 2 - PeriodContext)
- ✅ metrics (Phase 3 - MetricsContext)

**Total to extract**: 8 state variables

---

## 🏗️ UIContext Architecture

### File: `src/contexts/UIContext.jsx`

**State Variables**:
```javascript
// Patient & Features
const [patientInfo, setPatientInfo] = useState(null);
const [workdays, setWorkdays] = useState(null);
const [numDaysProfile, setNumDaysProfile] = useState(7);

// UI Expansion
const [dataImportExpanded, setDataImportExpanded] = useState(false);
const [dataExportExpanded, setDataExportExpanded] = useState(false);

// Notifications & Dialogs
const [loadToast, setLoadToast] = useState(null);
const [batchAssignmentDialog, setBatchAssignmentDialog] = useState({ 
  open: false, 
  suggestions: [] 
});
const [pendingUpload, setPendingUpload] = useState(null);
```

**Computed Values**:
```javascript
const hasPatientInfo = !!patientInfo;
const hasWorkdays = !!workdays;
const hasPendingUpload = !!pendingUpload;
```

**Helper Methods**:
```javascript
function updatePatientInfo(info) { ... }
function loadWorkdays(data) { ... }
function setDayProfileCount(count) { ... }  // 7 or 14
function toggleImportExpanded() { ... }
function toggleExportExpanded() { ... }
function showToast(message, duration = 3000) { ... }
function hideToast() { ... }
function openBatchDialog(suggestions) { ... }
function closeBatchDialog() { ... }
function setPending(upload) { ... }
function clearPending() { ... }
```

---

## 📁 Files to Create/Modify

### New Files
- `src/contexts/UIContext.jsx` (~150 lines)
- `src/hooks/useUI.js` (~30 lines) - Convenience exports

### Files to Modify
- `src/components/AGPGenerator.jsx` - Remove 8 state vars, use useUI() hook
- `src/contexts/index.js` - Export UIContext (if file exists)

---

## 🔄 Implementation Steps

### Step 1: Create UIContext (45 min)
```bash
# Create context file
touch src/contexts/UIContext.jsx

# Create convenience hook
touch src/hooks/useUI.js
```

**UIContext.jsx structure**:
1. Import React, createContext, useState, useMemo
2. Create UIContext
3. Create UIProvider component with all 8 state variables
4. Add helper methods
5. Compute derived values
6. useMemo() the context value
7. Export UIProvider and useUIContext hook

### Step 2: Create useUI Hook (15 min)
Export individual state pieces for convenience:
```javascript
export function usePatientInfo() {
  const { patientInfo, setPatientInfo, updatePatientInfo } = useUIContext();
  return { patientInfo, setPatientInfo, updatePatientInfo };
}

export function useWorkdays() {
  const { workdays, setWorkdays, loadWorkdays } = useUIContext();
  return { workdays, setWorkdays, loadWorkdays };
}

// ... etc for all state
```

### Step 3: Wrap AGPGenerator (15 min)
Add UIProvider to wrapper:
```javascript
export default function AGPGenerator() {
  const { masterDataset } = useData();
  
  return (
    <PeriodProvider masterDataset={masterDataset}>
      <UIProvider>  {/* NEW */}
        <MetricsProvider workdays={workdays} numDaysProfile={numDaysProfile}>
          <AGPGeneratorContent />
        </MetricsProvider>
      </UIProvider>
    </PeriodProvider>
  );
}
```

**WAIT**: `workdays` and `numDaysProfile` are props to MetricsProvider!

**Solution**: Keep them in AGPGenerator, lift from UIContext:
```javascript
export default function AGPGenerator() {
  const { masterDataset } = useData();
  
  return (
    <PeriodProvider masterDataset={masterDataset}>
      <UIProvider>
        {/* Use render prop or custom hook to get workdays/numDays */}
        <MetricsWrapper />
      </UIProvider>
    </PeriodProvider>
  );
}

function MetricsWrapper() {
  const { workdays, numDaysProfile } = useUI();
  
  return (
    <MetricsProvider workdays={workdays} numDaysProfile={numDaysProfile}>
      <AGPGeneratorContent />
    </MetricsProvider>
  );
}
```

### Step 4: Refactor AGPGeneratorContent (90 min)
1. Remove 8 state variable declarations
2. Add `const ui = useUI()` at top
3. Replace all state references:
   - `patientInfo` → `ui.patientInfo`
   - `setPatientInfo` → `ui.setPatientInfo`
   - etc.
4. Find all places that use these states
5. Update to use `ui.*` 
6. Test hot reload after each batch

### Step 5: Test Everything (45 min)
- [ ] Patient info modal opens and saves
- [ ] Workdays load from ProTime
- [ ] Day profiles toggle 7/14 works
- [ ] Import/Export panels expand/collapse
- [ ] Toast notifications show/hide
- [ ] Batch dialog opens/closes
- [ ] Pending upload state works
- [ ] All modals still work (Phase 1)
- [ ] Period selection still works (Phase 2)
- [ ] Metrics still calculate (Phase 3)

### Step 6: Document (30 min)
- Update PROGRESS.md
- Create PHASE4_CHECKLIST.md
- Create SESSION_XX_SUMMARY.md
- Note any issues or improvements

---

## ⚠️ Potential Issues

### Issue 1: MetricsProvider Dependencies
**Problem**: MetricsProvider needs `workdays` and `numDaysProfile` as props

**Solutions**:
A. Keep them in AGPGenerator wrapper (simplest)
B. Move MetricsProvider inside UIProvider (requires refactor)
C. Use render props pattern

**Recommended**: Solution A (keep wrapper pattern)

### Issue 2: ProTime Loading
**Current**: AGPGenerator has `useEffect` to load workdays from ProTime

**Solution**: Move to UIContext
```javascript
// In UIContext
useEffect(() => {
  async function load() {
    const data = await loadProTimeData();
    setWorkdays(data);
  }
  load();
}, []);
```

### Issue 3: Toast Auto-Hide
**Current**: Toast uses `setTimeout` to auto-hide

**Solution**: Move logic to UIContext
```javascript
function showToast(message, duration = 3000) {
  setLoadToast(message);
  setTimeout(() => setLoadToast(null), duration);
}
```

---

## 📊 Expected Results

**Before Phase 4**:
- AGPGenerator: ~1687 lines
- State variables: 8 in component
- UI logic: Scattered

**After Phase 4**:
- AGPGenerator: ~1600 lines (5% reduction)
- State variables: 0 in component (all in contexts!)
- UI logic: Centralized in UIContext

**Total Reduction** (Phases 1-4):
- Original: ~2200 lines
- After Phase 4: ~1600 lines
- **27% reduction** 🎉

---

## ✅ Success Criteria

**Functionality**:
- [ ] All existing features work unchanged
- [ ] Patient info loads/saves correctly
- [ ] Workdays integrate with day profiles
- [ ] Toast notifications display properly
- [ ] All dialogs open/close correctly

**Code Quality**:
- [ ] No state variables in AGPGeneratorContent
- [ ] Clean separation of concerns
- [ ] All UI state in UIContext
- [ ] Helper methods for common operations

**Testing**:
- [ ] No console errors
- [ ] Hot reload works
- [ ] All manual tests pass
- [ ] User can use all features

---

## 🎯 Phase 4 Checklist Template

Copy to `PHASE4_CHECKLIST.md` when starting:

```markdown
# Phase 4 Completion Checklist

## Files Created
- [ ] src/contexts/UIContext.jsx (~150 lines)
- [ ] src/hooks/useUI.js (~30 lines)

## Files Modified  
- [ ] src/components/AGPGenerator.jsx (remove 8 state vars)
- [ ] Wrapper updated with UIProvider

## State Extracted
- [ ] patientInfo
- [ ] workdays
- [ ] numDaysProfile
- [ ] dataImportExpanded
- [ ] dataExportExpanded
- [ ] loadToast
- [ ] batchAssignmentDialog
- [ ] pendingUpload

## Helper Methods Added
- [ ] updatePatientInfo()
- [ ] loadWorkdays()
- [ ] setDayProfileCount()
- [ ] toggleImportExpanded()
- [ ] toggleExportExpanded()
- [ ] showToast() / hideToast()
- [ ] openBatchDialog() / closeBatchDialog()
- [ ] setPending() / clearPending()

## Testing Complete
- [ ] Patient info works
- [ ] Workdays load
- [ ] Day profiles toggle works
- [ ] Import/Export expand works
- [ ] Toast shows/hides
- [ ] Batch dialog works
- [ ] All Phase 1-3 features still work

## Documentation
- [ ] PROGRESS.md updated
- [ ] PHASE4_CHECKLIST.md completed
- [ ] SESSION_XX_SUMMARY.md created
```

---

## 💡 Tips for Implementation

1. **Work incrementally**: Extract 2-3 state vars at a time
2. **Test after each change**: Use hot reload to verify
3. **Use console.logs**: Debug context values if needed
4. **Follow Phase 3 pattern**: Similar structure, different state
5. **Don't rush**: 3-4 hours is realistic estimate

---

## 🚀 When You're Ready

**To start Phase 4**:
```bash
# Create a new branch (optional)
git checkout -b feature/phase4-ui-context

# Read this document thoroughly
cat docs/handoffs/track3-q1/PHASE4_PLAN.md

# Start with UIContext creation
touch src/contexts/UIContext.jsx
```

**Tell Claude**:
> "I'm ready to start Phase 4 (UIContext extraction). Let's begin with creating UIContext.jsx following the plan in PHASE4_PLAN.md"

---

**Status**: 🎯 Ready to start  
**Estimated Time**: 3-4 hours  
**Complexity**: Medium (similar to Phase 3)  
**Prerequisites**: Phases 1-3 complete ✅

**Good luck! 🚀**
