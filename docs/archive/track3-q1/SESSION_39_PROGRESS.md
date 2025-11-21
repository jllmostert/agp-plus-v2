# Session 39: Phase 4 UIContext Extraction - Progress Tracker

**Date**: 2025-11-16  
**Session**: 39  
**Phase**: 4 (UIContext)  
**Status**: 🚀 IN PROGRESS

---

## Session Overview

**Goal**: Complete Phase 4 - Extract 8 UI state variables into UIContext  
**Estimated Time**: 3-4 hours  
**Server**: Running on port 3003

---

## Prerequisites ✅

- [x] Phase 1 (DataContext) complete
- [x] Phase 2 (PeriodContext) complete
- [x] Phase 3 (MetricsContext) complete
- [x] Session 38 day profiles bug fixed
- [x] App running and 100% functional
- [x] Server started (port 3003)

---

## Phase 4 Checklist

### Step 1: Create UIContext (45 min)
- [ ] Create `src/contexts/UIContext.jsx` (~150 lines)
- [ ] Implement 8 state variables
- [ ] Add helper methods
- [ ] Add computed values
- [ ] Export UIProvider and useUIContext hook

### Step 2: Create useUI Hook (15 min)
- [ ] Create `src/hooks/useUI.js` (~30 lines)
- [ ] Export convenience hooks for each state piece

### Step 3: Wrap AGPGenerator (30 min)
- [ ] Create MetricsWrapper component
- [ ] Wrap with UIProvider
- [ ] Pass workdays/numDaysProfile to MetricsProvider

### Step 4: Refactor AGPGeneratorContent (90 min)
- [ ] **Batch 1**: Patient & Features (15 min)
  - [ ] Remove patientInfo, workdays, numDaysProfile state
  - [ ] Add useUI() hook
  - [ ] Test hot reload
  
- [ ] **Batch 2**: UI Expansion (15 min)
  - [ ] Remove dataImportExpanded, dataExportExpanded
  - [ ] Add to useUI() destructure
  - [ ] Test hot reload
  
- [ ] **Batch 3**: Notifications & Dialogs (30 min)
  - [ ] Remove loadToast, batchAssignmentDialog, pendingUpload
  - [ ] Add to useUI() destructure
  - [ ] Update all usage sites
  - [ ] Test hot reload
  
- [ ] **Batch 4**: Helper Methods (30 min)
  - [ ] Replace all setState calls with helper methods
  - [ ] Test hot reload

### Step 5: Test Everything (45 min)
- [ ] Patient info modal works
- [ ] Workdays load from ProTime
- [ ] Day profiles toggle 7/14
- [ ] Import/Export panels expand
- [ ] Toast notifications show
- [ ] Batch dialog works
- [ ] All modals work (Phase 1)
- [ ] Period selection works (Phase 2)
- [ ] Metrics calculate (Phase 3)
- [ ] Day profiles display (Session 38 fix)

### Step 6: Document (30 min)
- [ ] Create PHASE4_CHECKLIST.md
- [ ] Update PROGRESS.md with Session 39
- [ ] Create SESSION_39_SUMMARY.md
- [ ] Commit changes

---

## State Variables to Extract

1. ✅ `patientInfo` - Patient information
2. ✅ `workdays` - ProTime workday data
3. ✅ `numDaysProfile` - 7 or 14 day profiles
4. ✅ `dataImportExpanded` - Import panel expansion
5. ✅ `dataExportExpanded` - Export panel expansion
6. ✅ `loadToast` - Toast notifications
7. ✅ `batchAssignmentDialog` - Batch assignment dialog
8. ✅ `pendingUpload` - Pending upload state

---

## Current Status

**Started**: 03:19 AM  
**Current Step**: About to create UIContext.jsx  
**Issues**: None yet  
**Notes**: Server running smoothly on port 3003

---

## Time Tracking

- 03:19: Session started, server started
- 03:21: Session 39 progress file created
- [Next entries will be added as we progress...]

---

**Status**: 🚀 READY TO START IMPLEMENTATION
