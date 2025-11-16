# Session 42 Quick Start: Integrate UIContext

**Date**: TBD  
**Duration**: 2 hours  
**Goal**: Integrate UIContext in AGPGenerator → 0 useState

---

## 🎯 SESSION OBJECTIVE

Replace 7 useState calls in AGPGenerator with useUI() hook.

**Current**: AGPGenerator has 7 state variables  
**Target**: AGPGenerator has 0 state variables (all in contexts)

---

## ⚡ QUICK START (Read this first!)

### Step 0: Load Context (5 min)

Read these files to understand what was done:
- `docs/handoffs/SESSION_40_STATUS.md` - Full status update
- `docs/handoffs/track3-q1/PHASE4_PLAN.md` - Overall plan
- Session 41 git commit message (search: "Session 41")

### Step 1: Start Server
```bash
cd agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001
```

### Step 2: Verify UIContext Exists
```bash
ls -lh src/contexts/UIContext.jsx src/hooks/useUI.js
```

Should show:
- UIContext.jsx (255 lines)
- useUI.js (20 lines)

---

## 📋 WHAT WAS DONE IN SESSION 41

### Created Files (NOT INTEGRATED YET):

**1. UIContext.jsx** (255 lines)
- 7 state variables:
  - patientInfo
  - workdays
  - dayNightEnabled
  - numDaysProfile
  - loadToast
  - batchAssignmentDialog
  - pendingUpload

- 18 helper methods:
  - Patient: updatePatientInfo, clearPatientInfo
  - Workdays: loadWorkdays, clearWorkdays
  - Toggles: toggleDayNight, setDayProfileCount
  - Toast: showToast, hideToast
  - Dialog: openBatchDialog, closeBatchDialog
  - Upload: setPending, clearPending

- Auto-loads patient info from storage

**2. useUI.js** (20 lines)
- Simple wrapper around UIContext
- Matches pattern of useData, usePeriod, useMetrics

**Decision Made**:
- ❌ Skipped `selectedDateRange` (covered by PeriodContext)
- ✅ 7 variables extracted (not 8)

---

## 🎯 SESSION 42 PLAN

### Part 1: Wrap App in UIProvider (15 min)

**File**: `src/main.jsx`

**Current structure**:
```jsx
<DataProvider>
  <PeriodProvider>
    <MetricsProvider>
      <App />
    </MetricsProvider>
  </PeriodProvider>
</DataProvider>
```

**Add UIProvider**:
```jsx
<DataProvider>
  <PeriodProvider>
    <MetricsProvider>
      <UIProvider>
        <App />
      </UIProvider>
    </MetricsProvider>
  </PeriodProvider>
</DataProvider>
```

**Steps**:
1. Import UIProvider: `import { UIProvider } from './contexts/UIContext';`
2. Wrap App in UIProvider (innermost layer)
3. Test: App still loads without errors

---

### Part 2: Update AGPGenerator (1.5 hours)

**File**: `src/components/AGPGenerator.jsx`

#### Phase 2a: Import useUI (5 min)

Add at top:
```javascript
import useUI from '../hooks/useUI';
```

#### Phase 2b: Replace useState with useUI (1 hour)

**Current state (lines 116-131)**:
```javascript
const [dayNightEnabled, setDayNightEnabled] = useState(false);
const [patientInfo, setPatientInfo] = useState(null);
const [loadToast, setLoadToast] = useState(null);
const [batchAssignmentDialog, setBatchAssignmentDialog] = useState({ open: false, suggestions: [] });
const [pendingUpload, setPendingUpload] = useState(null);
```

**And later (lines 1450-1451)**:
```javascript
const [workdays, setWorkdays] = useState(null);
const [numDaysProfile, setNumDaysProfile] = useState(7);
```

**Replace with**:
```javascript
const ui = useUI();

// Extract what we need (destructure for convenience)
const {
  dayNightEnabled,
  setDayNightEnabled,
  patientInfo,
  setPatientInfo,
  loadToast,
  showToast,
  batchAssignmentDialog,
  setBatchAssignmentDialog,
  openBatchDialog,
  closeBatchDialog,
  pendingUpload,
  setPendingUpload,
  clearPending,
  workdays,
  loadWorkdays,
  numDaysProfile,
  setNumDaysProfile
} = ui;
```

**IMPORTANT**: Delete these lines:
- Line 116: `const [dayNightEnabled, setDayNightEnabled] = useState(false);`
- Line 128-131: All useState for patientInfo, loadToast, batchAssignmentDialog, pendingUpload
- Lines 1450-1451: useState for workdays, numDaysProfile

#### Phase 2c: Update Effects (30 min)

**Current patient info loading (lines ~145-155)**:
```javascript
useEffect(() => {
  const loadPatientInfo = async () => {
    try {
      const { patientStorage } = await import('../utils/patientStorage');
      const info = await patientStorage.get();
      setPatientInfo(info);
    } catch (err) {
      console.error('[AGPGenerator] Failed to load patient info:', err);
    }
  };
  loadPatientInfo();
}, []);
```

**DELETE THIS** - UIContext handles it now!

**Check for other patientInfo effects**:
- Search: `setPatientInfo` in AGPGenerator
- Replace with `ui.setPatientInfo` or destructured `setPatientInfo`

#### Phase 2d: Update Toast Usages (15 min)

**Search**: `setLoadToast` in AGPGenerator

**Replace**:
```javascript
// Old:
setLoadToast("Data geladen!");
setTimeout(() => setLoadToast(null), 3000);

// New (two options):
showToast("Data geladen!"); // Uses default 3s duration
// OR keep manual:
setLoadToast("Data geladen!");
setTimeout(() => setLoadToast(null), 3000);
```

**Recommendation**: Use `showToast()` where possible (cleaner)

---

### Part 3: Test Integration (30 min)

#### Test Checklist:

1. **App Loads** ✓
   - Open http://localhost:3001
   - No console errors
   - All panels visible

2. **Patient Info** ✓
   - Click "Patiënt Info"
   - Modal opens
   - Save patient info
   - Refresh page → info persists

3. **Day/Night Toggle** ✓
   - Toggle day/night split
   - AGP updates correctly

4. **Day Profiles** ✓
   - Open Day Profiles panel
   - Toggle 7d/14d
   - Correct number of days shown

5. **Upload Workflow** ✓
   - Upload CSV
   - Check toast appears
   - Check batch assignment dialog (if applicable)

6. **Workdays** ✓
   - Upload ProTime PDF
   - Workdays data loads
   - No errors

---

### Part 4: Verify Line Count (5 min)

```bash
wc -l src/components/AGPGenerator.jsx
```

**Expected**: ~1100-1200 lines (down from 1546)

**Count useState calls**:
```bash
grep -c "useState" src/components/AGPGenerator.jsx
```

**Expected**: 0 (maybe 1 if useUI destructure on one line)

---

### Part 5: Git Commit (10 min)

```bash
git add -A
git status --short
git commit -m "Session 42: Integrate UIContext in AGPGenerator

COMPLETED:
- Wrapped App in UIProvider (main.jsx)
- Replaced 7 useState calls with useUI()
- Deleted patient info loading effect (handled by UIContext)
- Updated toast usages to use showToast()
- AGPGenerator: 1546 → ~1100-1200 lines

STATE VARIABLES REMOVED:
- dayNightEnabled → ui.dayNightEnabled
- patientInfo → ui.patientInfo
- loadToast → ui.loadToast
- batchAssignmentDialog → ui.batchAssignmentDialog
- pendingUpload → ui.pendingUpload
- workdays → ui.workdays
- numDaysProfile → ui.numDaysProfile

RESULT: AGPGenerator now has 0 useState calls ✅

All functionality tested and working.

NEXT: Session 43 - Final testing + documentation"

git push origin main
```

---

## 📚 REFERENCE FILES

**Read before starting**:
1. `src/contexts/UIContext.jsx` - What's available
2. `src/hooks/useUI.js` - How to import
3. `src/components/AGPGenerator.jsx` - What needs updating

**Line numbers** (approximate, may shift):
- useState calls: 116, 128-131, 1450-1451
- Patient info effect: ~145-155
- Toast usages: Search `setLoadToast`

---

## ⚠️ COMMON PITFALLS

1. **Don't forget to import UIProvider** in main.jsx
2. **Delete the patient info loading effect** - UIContext does this
3. **Use destructuring** for cleaner code (but keep `ui` reference too)
4. **Test after each major change** - don't batch all changes
5. **Commit frequently** - after each phase

---

## 🎯 ACCEPTANCE CRITERIA

- [ ] UIProvider wrapped around App
- [ ] AGPGenerator imports useUI
- [ ] All 7 useState calls removed
- [ ] Patient info loading effect removed
- [ ] All functionality tested and working
- [ ] No console errors
- [ ] AGPGenerator < 1300 lines
- [ ] Git commit + push

---

## 🚀 SUCCESS METRICS

**Before**: 
- AGPGenerator: 1546 lines
- useState calls: 7
- State management: Mixed (contexts + local)

**After**:
- AGPGenerator: ~1100-1200 lines (-350 lines)
- useState calls: 0
- State management: 100% in contexts ✅

**Total Phase 4 Reduction**: 
- Started: 1819 lines (Session 32)
- Target: ~1100 lines
- Total reduction: ~700 lines (-38%)

---

**Ready to start Session 42? Read this document first, then GO!**
