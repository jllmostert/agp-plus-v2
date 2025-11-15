# 🎯 HANDOFF SESSION 1: Extract useModalState Hook

**Datum**: 2025-11-15  
**Fase**: 1.1 - Quick Wins  
**Doel**: Extract modal state management naar custom hook  
**Geschatte tijd**: 45-60 minuten  
**Status**: 🟢 READY TO START

---

## 📋 PRE-SESSION CHECKLIST

### Before you start:
- [ ] Read this entire document first (prevents context overflow)
- [ ] Navigate to project: `cd /Users/jomostert/Documents/Projects/agp-plus`
- [ ] Check current branch: `git branch` (should be `main`)
- [ ] Pull latest changes: `git pull origin main`
- [ ] Start dev server: `export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001`
- [ ] Open app: http://localhost:3001
- [ ] Test current functionality works (open a few modals)
- [ ] Create PROGRESS.md if not exists: `touch PROGRESS_SESSION_1.md`

---

## 🎯 SESSION GOAL

**Single Focus**: Extract all modal state management from AGPGenerator.jsx into a new `useModalState` hook.

**What we're doing**:
1. Create new file: `src/hooks/useModalState.js`
2. Extract 7 modal states + setters
3. Add helper methods: openModal(), closeModal(), closeAll()
4. Update AGPGenerator.jsx to use the hook
5. Test everything still works
6. Commit + push

**What we're NOT doing** (save for next session):
- ❌ Don't touch usePanelNavigation yet
- ❌ Don't touch useImportExport yet
- ❌ Don't refactor anything else
- ❌ Don't add new features

---

## 🚀 IMPLEMENTATION STEPS

### STEP 1: Create the hook file (10 min)

**Location**: `/Users/jomostert/Documents/Projects/agp-plus/src/hooks/useModalState.js`

**Action**: Create new file with this exact code:

```javascript
import { useState } from 'react';

/**
 * Centralized modal state management
 * Manages all modal open/close states in one place
 * 
 * Extracted from AGPGenerator.jsx to reduce component size
 * Part of Phase 1 refactoring (Quick Wins)
 */
export function useModalState() {
  // Individual modal states
  const [patientInfoOpen, setPatientInfoOpen] = useState(false);
  const [dayProfilesOpen, setDayProfilesOpen] = useState(false);
  const [sensorHistoryOpen, setSensorHistoryOpen] = useState(false);
  const [sensorRegistrationOpen, setSensorRegistrationOpen] = useState(false);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [dataImportModalOpen, setDataImportModalOpen] = useState(false);

  // Helper: Open any modal by name
  const openModal = (name) => {
    const setters = {
      patientInfo: setPatientInfoOpen,
      dayProfiles: setDayProfilesOpen,
      sensorHistory: setSensorHistoryOpen,
      sensorRegistration: setSensorRegistrationOpen,
      dataManagement: setDataManagementOpen,
      stock: setShowStockModal,
      dataImport: setDataImportModalOpen
    };
    setters[name]?.(true);
  };

  // Helper: Close any modal by name
  const closeModal = (name) => {
    const setters = {
      patientInfo: setPatientInfoOpen,
      dayProfiles: setDayProfilesOpen,
      sensorHistory: setSensorHistoryOpen,
      sensorRegistration: setSensorRegistrationOpen,
      dataManagement: setDataManagementOpen,
      stock: setShowStockModal,
      dataImport: setDataImportModalOpen
    };
    setters[name]?.(false);
  };

  // Helper: Close all modals at once
  const closeAll = () => {
    setPatientInfoOpen(false);
    setDayProfilesOpen(false);
    setSensorHistoryOpen(false);
    setSensorRegistrationOpen(false);
    setDataManagementOpen(false);
    setShowStockModal(false);
    setDataImportModalOpen(false);
  };

  return {
    // Individual states (read access)
    patientInfoOpen,
    dayProfilesOpen,
    sensorHistoryOpen,
    sensorRegistrationOpen,
    dataManagementOpen,
    showStockModal,
    dataImportModalOpen,
    
    // Individual setters (for direct control if needed)
    setPatientInfoOpen,
    setDayProfilesOpen,
    setSensorHistoryOpen,
    setSensorRegistrationOpen,
    setDataManagementOpen,
    setShowStockModal,
    setDataImportModalOpen,
    
    // Helper methods (recommended API)
    openModal,
    closeModal,
    closeAll
  };
}
```

**Update PROGRESS.md**:
```
## Session 1 Progress
- [x] Created src/hooks/useModalState.js
- [ ] Updated AGPGenerator.jsx imports
- [ ] Replaced useState calls
- [ ] Tested modals
- [ ] Committed changes
```

**Checkpoint**: File created, no errors. ✅

---

### STEP 2: Update AGPGenerator imports (5 min)

**Location**: `src/components/AGPGenerator.jsx`

**Find this line** (around line 10-20):
```javascript
import { useState, useEffect, useCallback } from 'react';
```

**Add after it**:
```javascript
import { useModalState } from '../hooks/useModalState';
```

**Update PROGRESS.md**:
```
- [x] Updated AGPGenerator.jsx imports
```

**Checkpoint**: No import errors. ✅

---

### STEP 3: Replace modal states in AGPGenerator (15 min)

**Location**: `src/components/AGPGenerator.jsx`

**Find these lines** (around line 40-60, remove them):
```javascript
const [patientInfoOpen, setPatientInfoOpen] = useState(false);
const [dayProfilesOpen, setDayProfilesOpen] = useState(false);
const [sensorHistoryOpen, setSensorHistoryOpen] = useState(false);
const [sensorRegistrationOpen, setSensorRegistrationOpen] = useState(false);
const [dataManagementOpen, setDataManagementOpen] = useState(false);
const [showStockModal, setShowStockModal] = useState(false);
const [dataImportModalOpen, setDataImportModalOpen] = useState(false);
```

**Replace with** (add around line 40):
```javascript
// Modal state management (extracted to custom hook)
const modals = useModalState();
```

**Update PROGRESS.md**:
```
- [x] Replaced useState calls with useModalState hook
```

**Checkpoint**: Component compiles, no errors. ✅

---

### STEP 4: Update modal prop references (15 min)

**Strategy**: Use find-replace carefully. Do **one modal at a time**.

**Pattern**: Replace `modalNameOpen` with `modals.modalNameOpen`

#### 4a. Patient Info Modal

**Find**:
```javascript
<PatientInfoModal
  open={patientInfoOpen}
  onClose={() => setPatientInfoOpen(false)}
```

**Replace with**:
```javascript
<PatientInfoModal
  open={modals.patientInfoOpen}
  onClose={() => modals.setPatientInfoOpen(false)}
```

**Also find** (button that opens it):
```javascript
onClick={() => setPatientInfoOpen(true)}
```

**Replace with**:
```javascript
onClick={() => modals.openModal('patientInfo')}
```

#### 4b. Day Profiles Modal

**Find**:
```javascript
<DayProfilesModal
  open={dayProfilesOpen}
  onClose={() => setDayProfilesOpen(false)}
```

**Replace with**:
```javascript
<DayProfilesModal
  open={modals.dayProfilesOpen}
  onClose={() => modals.closeModal('dayProfiles')}
```

**Find** (open button):
```javascript
onClick={() => setDayProfilesOpen(true)}
```

**Replace with**:
```javascript
onClick={() => modals.openModal('dayProfiles')}
```

#### 4c. Sensor History Modal

**Find**:
```javascript
<SensorHistoryModal
  open={sensorHistoryOpen}
  onClose={() => setSensorHistoryOpen(false)}
```

**Replace with**:
```javascript
<SensorHistoryModal
  open={modals.sensorHistoryOpen}
  onClose={() => modals.closeModal('sensorHistory')}
```

#### 4d. Continue for remaining modals

**Pattern**:
- sensorRegistration → `modals.sensorRegistrationOpen`
- dataManagement → `modals.dataManagementOpen`
- stock → `modals.showStockModal`
- dataImport → `modals.dataImportModalOpen`

**Pro tip**: Use VS Code's find-replace (Cmd+Shift+H):
- Find: `setPatientInfoOpen\(false\)` (regex)
- Replace: `modals.setPatientInfoOpen(false)`
- Review each match before replacing!

**Update PROGRESS.md after each modal**:
```
- [x] Updated Patient Info Modal
- [x] Updated Day Profiles Modal
- [x] Updated Sensor History Modal
- [x] Updated Sensor Registration Modal
- [x] Updated Data Management Modal
- [x] Updated Stock Modal
- [x] Updated Data Import Modal
```

**Checkpoint**: No TypeScript/lint errors. App compiles. ✅

---

### STEP 5: Test functionality (10 min)

**Open http://localhost:3001**

**Test each modal**:
1. ✅ Open Patient Info Modal → works
2. ✅ Close with X button → works
3. ✅ Close with Escape key → works (if implemented)
4. ✅ Open Day Profiles Modal → works
5. ✅ Open Sensor History Modal → works
6. ✅ Open Stock Modal → works
7. ✅ Open Data Import Modal → works
8. ✅ Open multiple modals quickly → no crashes
9. ✅ Check console → no errors

**Update PROGRESS.md**:
```
- [x] Tested all 7 modals - WORKING ✅
```

**If bugs found**:
- Don't panic! Read error message carefully
- Check you replaced ALL occurrences
- Check for typos in modal names (patientInfo vs patientinfo)
- If stuck: revert with `git checkout src/components/AGPGenerator.jsx`

---

### STEP 6: Commit & push (5 min)

**Check what changed**:
```bash
git status
git diff src/components/AGPGenerator.jsx
git diff src/hooks/useModalState.js
```

**Stage changes**:
```bash
git add src/hooks/useModalState.js
git add src/components/AGPGenerator.jsx
```

**Commit**:
```bash
git commit -m "refactor(phase1): extract modal state to useModalState hook

- Created src/hooks/useModalState.js
- Extracted 7 modal states from AGPGenerator
- Added helper methods: openModal(), closeModal(), closeAll()
- AGPGenerator.jsx: -7 useState declarations (~20 lines removed)
- All modals tested and working

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

SESSION 1 COMPLETE! 🎉
Time taken: [YOUR TIME HERE]
Next: Session 2 (usePanelNavigation hook)
```

---

## 🚨 TROUBLESHOOTING

### Problem: "Cannot find module '../hooks/useModalState'"

**Cause**: File not in correct location  
**Fix**: 
```bash
ls -la src/hooks/useModalState.js
# Should exist. If not, recreate it.
```

---

### Problem: "modals.patientInfoOpen is undefined"

**Cause**: Typo in property name  
**Fix**: Check exact spelling:
- ✅ `patientInfoOpen` (camelCase)
- ❌ `patientinfoopen` (wrong case)

---

### Problem: "App crashes when opening modal"

**Cause**: Likely passed undefined handler  
**Fix**: 
1. Check console error for exact line
2. Verify all `onClose={() => modals.closeModal('modalName')}` correct
3. Verify modal name matches exactly: 'patientInfo' not 'patientinfo'

---

### Problem: Modal opens but won't close

**Cause**: Close handler not wired up  
**Fix**: 
1. Find modal JSX
2. Check `onClose` prop exists
3. Check it calls `modals.closeModal('correctName')`

---

## 📊 SUCCESS CRITERIA

**Before committing, verify**:
- ✅ All 7 modals open correctly
- ✅ All 7 modals close correctly
- ✅ No console errors
- ✅ App performance unchanged
- ✅ AGPGenerator.jsx is ~20 lines shorter
- ✅ Code is cleaner (no 7 useState declarations)

---

## 💾 CONTEXT PRESERVATION

**If session crashes/times out**:

1. **Save PROGRESS.md immediately** (copy to safe location)
2. **Check what was completed**: `git status`
3. **If partially done**: 
   - Commit what works: `git commit -m "WIP: partial useModalState extraction"`
   - Push: `git push origin main`
4. **Next session**: Start from last checkpoint in PROGRESS.md

**Recovery commands**:
```bash
# See what changed
git diff

# Discard changes if broken
git checkout src/components/AGPGenerator.jsx

# Start over from clean state
git reset --hard origin/main
```

---

## 📈 METRICS

**Starting state**:
- AGPGenerator.jsx: 1999 lines
- Modal useState calls: 7
- State variables: 32

**After Session 1**:
- AGPGenerator.jsx: ~1980 lines (-20)
- Modal useState calls: 0 (-7)
- State variables: 25 (-7)
- New files: +1 (useModalState.js)

**Progress**: 3.5% of Phase 1 complete! 💪

---

## 🎯 NEXT SESSION PREP

**Session 2 will extract**: `usePanelNavigation` hook

**Estimated impact**: -80 lines from AGPGenerator.jsx

**No action needed now** - just be aware.

---

## ⏰ TIME MANAGEMENT

**Target timeline**:
- STEP 1 (Create hook): 10 min
- STEP 2 (Import): 5 min
- STEP 3 (Replace useState): 15 min
- STEP 4 (Update refs): 15 min
- STEP 5 (Test): 10 min
- STEP 6 (Commit): 5 min

**Total: 60 minutes**

**If hitting 45 min mark**:
- ✅ Commit what's working
- ✅ Mark incomplete items in PROGRESS.md
- ✅ Push to GitHub
- ✅ Continue next session

**Better to do 70% well than 100% rushed!**

---

## 🔥 EMERGENCY PROCEDURES

### If app won't compile:

1. **Read error message** (don't guess!)
2. **Check file locations**: `ls -la src/hooks/useModalState.js`
3. **Check imports**: syntax correct?
4. **Revert if needed**: `git checkout src/components/AGPGenerator.jsx`
5. **Ask for help**: Include error message in chat

### If app compiles but modals broken:

1. **Check console** for runtime errors
2. **Check modal names** match exactly (case-sensitive!)
3. **Check all setters** are wired up
4. **Test one modal at a time** (easier to debug)

### If git conflicts:

```bash
# Should not happen (working alone on main)
# But if it does:
git status
git pull origin main
# Fix conflicts manually
git add .
git commit -m "fix: merge conflicts"
git push origin main
```

---

## ✅ PRE-COMMIT CHECKLIST

Before running `git commit`:

- [ ] All modals tested and working
- [ ] No console errors
- [ ] App compiles without warnings
- [ ] PROGRESS.md updated
- [ ] Changes reviewed with `git diff`
- [ ] Files staged with `git add`
- [ ] Commit message follows convention

---

## 🎓 LEARNING NOTES

**What you'll learn**:
- ✅ How to extract state to custom hooks
- ✅ How to refactor incrementally
- ✅ How to test React changes thoroughly
- ✅ Git workflow for refactoring

**Key principle**: **Small, tested, committed changes** beat big risky rewrites!

---

**End of Session 1 Handoff**

**Status**: 📋 READY TO EXECUTE  
**Next**: Session 2 (usePanelNavigation)  
**Estimated time**: 45-60 minutes  

**Good luck! You got this! 💪**
