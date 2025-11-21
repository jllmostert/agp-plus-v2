# 🚀 NEW SESSION PROMPT - Track 3 Q1 Phase 1 Completion

**Copy this entire prompt to start a new session:**

---

## Context

I'm continuing work on AGP+ (Ambulatory Glucose Profile medical app). We're in the middle of Track 3, Sprint Q1: Context API refactoring. Phase 1 (DataContext) is 70% complete - the context is created and working, but child components still need to be updated to use it instead of props.

## What's Already Done

- ✅ DataContext.jsx created (manages all data state)
- ✅ useData() hook created (consumes context)
- ✅ App wrapped in DataProvider
- ✅ AGPGenerator uses useData() internally

## What Needs Doing

Update child components to use DataContext instead of receiving data as props. This will complete Phase 1.

**Specific tasks:**
1. Update ImportPanel.jsx to use useData()
2. Update ExportPanel.jsx to use useData()  
3. Remove data props from AGPGenerator component calls
4. Test everything works
5. Update PROGRESS.md

## Desktop Commander Instructions

**Project path:** `/Users/jomostert/Documents/Projects/agp-plus`

**Read the continuation plan:**
```
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/track3-q1/SESSION_CONTINUATION.md
```

This file contains:
- Complete context of what's done
- Step-by-step tasks with code examples
- File paths
- Testing instructions
- Success criteria

**After reading, start with Task 1** (Update ImportPanel.jsx).

## Expected Outcome

- AGPGenerator.jsx reduced from 1739 to ~1650 lines
- ImportPanel and ExportPanel use useData() hook
- No data props passed between components
- All functionality working unchanged
- Phase 1 complete in 1-2 hours

## Key Files

```
src/contexts/DataContext.jsx          - Already created ✅
src/hooks/useData.js                  - Already created ✅
src/components/AGPGenerator.jsx       - Needs prop removal
src/components/panels/ImportPanel.jsx - Needs useData() integration
src/components/panels/ExportPanel.jsx - Needs useData() integration
```

## Start Here

1. Read SESSION_CONTINUATION.md (path above)
2. Follow Task 1: Update ImportPanel.jsx
3. Continue through all 6 tasks
4. Test thoroughly
5. Update PROGRESS.md

Let me know when you're ready and I'll start working through the tasks!
