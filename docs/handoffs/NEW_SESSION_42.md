# 🚀 NEW SESSION PROMPT: Session 42

Hey Claude! Welkom bij **Session 42** van het AGP+ project.

---

## 📍 WHERE WE ARE

**Project**: AGP+ v4.3.1 - Medical glucose data visualization  
**Current Work**: Track 3 Phase 4 - UIContext extraction  
**Branch**: main (no feature branches)  
**Server**: http://localhost:3001 (start with: `cd agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001`)

---

## ✅ WHAT WAS JUST DONE (Session 41)

Created **UIContext + useUI hook** (NOT INTEGRATED YET):

**Files Created**:
- `src/contexts/UIContext.jsx` (255 lines)
- `src/hooks/useUI.js` (20 lines)

**State Variables** (7):
1. patientInfo - Patient metadata
2. workdays - Workday data
3. dayNightEnabled - Day/night toggle
4. numDaysProfile - 7 or 14 days
5. loadToast - Toast notifications
6. batchAssignmentDialog - Batch dialog
7. pendingUpload - Upload workflow

**Status**: ✅ Created, committed, pushed to GitHub  
**Status**: ❌ NOT integrated in AGPGenerator yet

---

## 🎯 YOUR TASK (Session 42)

**Goal**: Integrate UIContext in AGPGenerator → **0 useState calls**

**Duration**: 2 hours

**Steps**:
1. Wrap App in UIProvider (main.jsx) - 15 min
2. Import useUI in AGPGenerator - 5 min
3. Replace 7 useState with useUI() - 1 hour
4. Delete patient info loading effect - 5 min
5. Test all functionality - 30 min
6. Git commit + push - 10 min

**Target**: AGPGenerator ~1100-1200 lines (down from 1546)

---

## 📋 DETAILED INSTRUCTIONS

Read this file FIRST:
```
docs/handoffs/track3-q1/SESSION_42_QUICKSTART.md
```

It contains:
- Complete step-by-step plan
- Line numbers to change
- Code examples
- Test checklist
- Common pitfalls

---

## 🔑 KEY FILES

**To Read**:
- `src/contexts/UIContext.jsx` - What's available
- `src/hooks/useUI.js` - How to import
- `src/components/AGPGenerator.jsx` - What needs changing (lines 116, 128-131, 1450-1451)

**To Modify**:
- `src/main.jsx` - Add UIProvider wrapper
- `src/components/AGPGenerator.jsx` - Replace useState with useUI()

---

## ⚠️ IMPORTANT NOTES

1. **Patient info loading** - DELETE the useEffect that loads patient info (lines ~145-155). UIContext handles this automatically.

2. **selectedDateRange** - Skip this! It's covered by PeriodContext. Only extract the 7 variables listed above.

3. **Test frequently** - After each major change, refresh browser and check console.

4. **Small commits** - Commit after each phase (UIProvider wrap, useState replacement, etc).

---

## 🎯 SUCCESS CRITERIA

- [ ] UIProvider wrapped around App
- [ ] AGPGenerator imports useUI
- [ ] All 7 useState calls removed
- [ ] Patient info loading effect removed
- [ ] No console errors
- [ ] All functionality works (patient info, toasts, dialogs, day/night toggle, day profiles)
- [ ] AGPGenerator < 1300 lines
- [ ] Git commit + push

---

## 📊 EXPECTED RESULT

**Before**:
- AGPGenerator: 1546 lines
- useState calls: 7

**After**:
- AGPGenerator: ~1100-1200 lines
- useState calls: 0 ✅

**Next Session**: Session 43 - Final testing + documentation

---

## 🚨 IF STUCK

Read these in order:
1. `SESSION_42_QUICKSTART.md` - Detailed instructions
2. `PHASE4_PLAN.md` - Overall plan
3. `SESSION_40_STATUS.md` - Full project status
4. Git log: `git log --oneline -5` - Recent commits

---

**Ready? Start with reading SESSION_42_QUICKSTART.md, then GO!** 🚀
