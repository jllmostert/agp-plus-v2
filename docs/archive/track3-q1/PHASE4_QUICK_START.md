# Phase 4 Quick Start

**🎯 Goal**: Extract UI state to UIContext  
**⏱️ Time**: 3-4 hours  
**📊 Progress**: Track 3 currently 75% → will be 100%

---

## ✅ Prerequisites Check

Before starting, verify:
- ✅ Phase 1 (DataContext) complete
- ✅ Phase 2 (PeriodContext) complete  
- ✅ Phase 3 (MetricsContext) complete
- ✅ Session 38 day profiles bug fixed
- ✅ App running and 100% functional
- ✅ All tests passing

**Current app status**: 🎉 Fully functional, ready for final refactoring!

---

## 📖 Quick Context

**What we're extracting**:
- 8 UI state variables from AGPGenerator
- Patient info, workdays, day profile count
- UI expansion states, toasts, dialogs

**Why**:
- Complete the Context API refactoring (100%)
- AGPGenerator becomes pure coordination (no state!)
- Better separation of concerns

**Impact**:
- AGPGenerator: 1687 → ~1600 lines (5% reduction)
- Total reduction (all phases): 27% 🎉

---

## 🚀 Step-by-Step (3-4 hours)

### Step 1: Read the Plan (15 min)
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
cat docs/handoffs/track3-q1/PHASE4_PLAN.md
```

**Key sections**:
- UI state to extract (8 variables)
- UIContext architecture
- Potential issues & solutions
- Testing checklist

### Step 2: Create UIContext (45 min)
```bash
# Create files
touch src/contexts/UIContext.jsx
touch src/hooks/useUI.js

# Open in editor and start coding
# Follow PHASE4_PLAN.md structure
```

**What to implement**:
- UIContext with all 8 state variables
- Helper methods (updatePatientInfo, showToast, etc.)
- Computed values (hasPatientInfo, hasWorkdays)
- useUIContext hook with error handling

### Step 3: Create useUI Hook (15 min)
Export convenience hooks for common patterns:
```javascript
export function usePatientInfo() { ... }
export function useWorkdays() { ... }
export function useToast() { ... }
// etc.
```

### Step 4: Wrap AGPGenerator (30 min)
**Challenge**: MetricsProvider needs `workdays` and `numDaysProfile`

**Solution**: Use wrapper pattern (see PHASE4_PLAN.md Step 3)

```javascript
export default function AGPGenerator() {
  return (
    <UIProvider>
      <MetricsWrapper />
    </UIProvider>
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

### Step 5: Refactor AGPGeneratorContent (90 min)
**Work in small batches**:

**Batch 1**: Patient & Features (15 min)
- Remove: patientInfo, workdays, numDaysProfile state
- Add: `const { patientInfo, workdays, numDaysProfile } = useUI()`
- Test hot reload

**Batch 2**: UI Expansion (15 min)
- Remove: dataImportExpanded, dataExportExpanded
- Add to useUI() destructure
- Test hot reload

**Batch 3**: Notifications & Dialogs (30 min)
- Remove: loadToast, batchAssignmentDialog, pendingUpload
- Add to useUI() destructure
- Update all usage sites
- Test hot reload

**Batch 4**: Helper Methods (30 min)
- Find all setState calls
- Replace with helper methods from useUI()
- Test hot reload

### Step 6: Test Everything (45 min)
Use this checklist:
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

### Step 7: Document (30 min)
- Copy PHASE4_CHECKLIST.md template
- Fill in completion checkboxes
- Update PROGRESS.md with Session XX
- Create SESSION_XX_SUMMARY.md
- Commit!

---

## 🎯 Success = All Checkboxes ✅

When done:
- [ ] UIContext.jsx created (~150 lines)
- [ ] useUI.js created (~30 lines)
- [ ] AGPGenerator refactored (8 state vars removed)
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Committed to git

**Result**: 🎉 Track 3 Sprint Q1 = 100% COMPLETE!

---

## 💡 Tips

**If stuck**:
1. Read PHASE4_PLAN.md "Potential Issues" section
2. Check Phases 2 & 3 for similar patterns
3. Use console.log to debug context values
4. Test after EVERY change (hot reload is your friend!)

**If hot reload breaks**:
1. Check for syntax errors
2. Verify context is properly wrapped
3. Ensure hook is called inside provider
4. Restart server if needed

**If tests fail**:
1. Check console for errors
2. Verify all state is available in context
3. Check helper methods are exported
4. Test one feature at a time

---

## 🤔 Common Questions

**Q: Do I need Phase 4?**  
A: No! App is 100% functional. Phase 4 is optional polish.

**Q: What if I break something?**  
A: Git to the rescue! You have clean commits at each phase.

**Q: How long does it really take?**  
A: 3-4 hours if you follow the plan. Could be 5-6 if exploring.

**Q: What after Phase 4?**  
A: Track 3 Sprint Q1 DONE! 🎉 Pick new track or enjoy your app!

---

## 🚨 Red Flags

**STOP if**:
- Hot reload completely breaks (restart server)
- App crashes on load (syntax error, check console)
- Context hook called outside provider (check wrapper)
- More than 5 hours invested (take a break, reassess)

**Get help**:
- Re-read PHASE4_PLAN.md
- Check PROGRESS.md for similar issues in Phase 2-3
- Start fresh session with Claude (hand off this doc)

---

## 📞 Next Session Handoff

If you need to stop and continue later:

**Tell Claude**:
> "I'm continuing Phase 4 (UIContext extraction). I'm at [step X]. 
> Here's what I've done: [list accomplishments].
> Here's my current issue: [describe problem].
> 
> Read docs/handoffs/track3-q1/PHASE4_PLAN.md and PHASE4_QUICK_START.md 
> and help me continue from here."

**Claude will**:
- Read the plan
- Understand where you are
- Help debug or continue implementation
- Keep documentation updated

---

**Ready?** Let's finish Track 3! 💪

**Not ready?** That's okay too! App works great as-is. 😊

**Questions?** Read PHASE4_PLAN.md for full details.

---

**Good luck! 🚀**
