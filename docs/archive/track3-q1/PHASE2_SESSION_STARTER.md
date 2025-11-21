# Phase 2: PeriodContext - Session Starter Prompt

**Copy this entire prompt into a new Claude chat to start Phase 2**

---

I'm continuing work on AGP+ Context API refactoring. **Phase 1 is complete**, now starting **Phase 2: PeriodContext**.

## 📋 CONTEXT

**Project**: AGP+ (Ambulatory Glucose Profile Plus)  
**Path**: `/Users/jomostert/Documents/Projects/agp-plus`  
**Current Status**: Phase 1 (DataContext) ✅ COMPLETE, Phase 2 (PeriodContext) ready to start

**What's Done**:
- ✅ Phase 1: DataContext extracted, child components updated
- ✅ ImportPanel now uses useData() instead of props
- ✅ AGPGenerator simplified (1739 → 1731 lines)
- ✅ All tests passing, zero breaking changes

**What's Next**:
- 🎯 Phase 2: Extract period selection state to PeriodContext
- Estimated: 4-6 hours
- Goal: Remove period state from AGPGenerator, create usePeriod hook

---

## 📚 REQUIRED READING

**Before starting, read these files in order** (use Desktop Commander):

### 1. Main Reference Document (MUST READ FIRST)
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/track3-q1/PHASE2_PERIODCONTEXT_PLAN.md
```
This is your primary guide. Read it completely before doing anything else.

### 2. Phase 1 Completion Summary (for context)
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md offset=-150 length=150
```
This shows what was just completed and confirms Phase 1 is done.

### 3. Overall Architecture (reference as needed)
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/track3-q1/CONTEXT_API_ANALYSIS.md length=100
```
This explains the overall context architecture plan.

---

## 🛠️ DESKTOP COMMANDER USAGE RULES

**CRITICAL**: Follow these rules to avoid context overflow and errors

### ✅ DO's

1. **Read files in chunks when exploring**:
   ```bash
   # Read first 100 lines to understand structure
   DC: read_file /path/to/file.jsx length=100
   
   # Read specific section
   DC: read_file /path/to/file.jsx offset=500 length=50
   
   # Read end of file
   DC: read_file /path/to/file.jsx offset=-50
   ```

2. **Use edit_block for surgical edits**:
   ```bash
   # Good: Include just enough context (2-5 lines before/after)
   DC: edit_block file_path=/path/to/file.jsx old_string="const [startDate, setStartDate] = useState(null);
   const [endDate, setEndDate] = useState(null);" new_string="// Period state moved to PeriodContext"
   ```

3. **Search before editing**:
   ```bash
   # Find all usages first
   DC: start_search path=/Users/.../src/components pattern="startDate" searchType=content
   DC: get_more_search_results sessionId=search_X_Y length=30
   ```

4. **Work incrementally**:
   - Make 1-2 small edits
   - Test compilation
   - Continue
   - Don't try to do everything at once

5. **Use write_file with mode=append for docs**:
   ```bash
   DC: write_file path=/Users/.../PROGRESS.md content="..." mode=append
   ```

### ❌ DON'Ts

1. **DON'T read entire large files**:
   ```bash
   # BAD: Will overflow context
   DC: read_file /Users/.../AGPGenerator.jsx
   
   # GOOD: Read in sections
   DC: read_file /Users/.../AGPGenerator.jsx length=100
   ```

2. **DON'T use edit_block with huge old_string**:
   ```bash
   # BAD: Including 50+ lines in old_string
   DC: edit_block file_path=... old_string="[massive block]" new_string="..."
   
   # GOOD: Minimal context (2-5 lines)
   DC: edit_block file_path=... old_string="[small unique block]" new_string="..."
   ```

3. **DON'T make multiple large edits without testing**:
   - Make edit → Test → Continue
   - Small iterations prevent catastrophic errors

4. **DON'T forget to start the server for testing**:
   ```bash
   DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && export PATH=\"/opt/homebrew/bin:\$PATH\" && npx vite --port 3001" timeout_ms=15000
   ```

5. **DON'T write huge files in one call**:
   - For files >30 lines, chunk them or use multiple write operations
   - But for most code changes, edit_block is better

---

## 🎯 PHASE 2 OBJECTIVES

**Goal**: Extract period selection state from AGPGenerator into PeriodContext

**What Moves**:
- `startDate` state
- `endDate` state  
- `safeDateRange` computed value
- Period manipulation handlers
- Custom range detection logic

**Result Expected**:
- New PeriodContext.jsx (~200 lines)
- New usePeriod.js hook (~50 lines)
- AGPGenerator reduced by ~100-150 lines
- Better separation of concerns

---

## 📝 TASK BREAKDOWN (from PHASE2_PERIODCONTEXT_PLAN.md)

**Read the plan document for full details**, but here's the overview:

### Task 2.1: Create PeriodContext (90 min)
- File: `src/contexts/PeriodContext.jsx`
- Export: PeriodProvider, usePeriod hook
- State: startDate, endDate, safeDateRange
- Methods: setStartDate, setEndDate, updateDateRange

### Task 2.2: Create usePeriod Hook (30 min)
- File: `src/hooks/usePeriod.js`
- Convenience exports for common patterns
- Documented with examples

### Task 2.3: Update AGPGenerator (60 min)
- Replace local period state with usePeriod()
- Remove period handlers
- Update period-using components

### Task 2.4: Update Child Components (60 min)
- PeriodSelector.jsx
- VisualizationContainer.jsx
- ExportPanel.jsx (if needed)
- Others using period state

### Task 2.5: Test Everything (45 min)
- Server starts
- Period selection works
- Date filtering works
- No console errors

### Task 2.6: Update Documentation (30 min)
- Update PROGRESS.md
- Note line count reductions
- Document architecture changes

---

## 🚀 GETTING STARTED

### Step 1: Confirm Phase 1 Complete
```bash
# Check that Phase 1 is marked complete
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md offset=-100

# Verify ImportPanel uses context
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/panels/ImportPanel.jsx length=30
```

You should see:
- ✅ Session 35 marked complete in PROGRESS.md
- ✅ ImportPanel imports and uses `useData()`

### Step 2: Read Phase 2 Plan
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/track3-q1/PHASE2_PERIODCONTEXT_PLAN.md
```

**Read the ENTIRE plan** before starting to code.

### Step 3: Start with Task 2.1
Create PeriodContext.jsx following the plan's structure exactly.

---

## ⚠️ CRITICAL RULES TO AVOID CONTEXT OVERFLOW

### Rule 1: ASK Before Reading Large Files
If a file is >500 lines, ask me:
> "I need to read AGPGenerator.jsx (1731 lines). Should I:
> A) Read in chunks (recommended)
> B) Search for specific sections first
> C) Read the whole thing (may overflow)"

**I'll guide you to the right approach.**

### Rule 2: Work in Small Chunks
Don't try to:
- Create all files at once
- Make 10 edits without testing
- Read 5 large files simultaneously

Instead:
- Create 1 file → Test
- Make 2-3 edits → Test
- Read 1 section → Make notes → Continue

### Rule 3: Test Frequently
After every major change:
```bash
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && export PATH=\"/opt/homebrew/bin:\$PATH\" && npx vite --port 3001" timeout_ms=15000
```

If errors occur, read only the error output:
```bash
DC: read_process_output pid=XXXXX timeout_ms=5000
```

### Rule 4: Use Search Strategically
Before editing a file:
```bash
# Find all usages of what you're changing
DC: start_search path=/Users/.../src pattern="startDate" searchType=content

# Get manageable chunks of results
DC: get_more_search_results sessionId=search_X_Y length=20 offset=0
```

### Rule 5: Update Docs Incrementally
Don't wait until the end. After each major task:
```bash
DC: write_file path=/Users/.../docs/handoffs/PROGRESS.md content="
## Task 2.1 Complete
- Created PeriodContext.jsx
- 200 lines, exports PeriodProvider
- All tests passing
" mode=append
```

---

## 📊 SUCCESS CRITERIA

**At the end of this session, you should have**:

✅ **Files Created**:
- src/contexts/PeriodContext.jsx (~200 lines)
- src/hooks/usePeriod.js (~50 lines)

✅ **Files Updated**:
- src/components/AGPGenerator.jsx (reduced by ~100-150 lines)
- src/components/PeriodSelector.jsx (uses usePeriod)
- src/components/containers/VisualizationContainer.jsx (uses usePeriod)
- Any other components using period state

✅ **Testing**:
- Server starts without errors
- Period selection works
- Date filtering works
- All existing features preserved

✅ **Documentation**:
- PROGRESS.md updated with Session 36 summary
- Line count reductions documented
- Architecture changes noted

---

## 🔍 VERIFICATION CHECKLIST

Before marking Phase 2 complete, verify:

- [ ] Read PHASE2_PERIODCONTEXT_PLAN.md completely
- [ ] PeriodContext.jsx created and exports working
- [ ] usePeriod.js hook created
- [ ] AGPGenerator uses usePeriod() instead of local state
- [ ] PeriodSelector uses usePeriod()
- [ ] VisualizationContainer uses usePeriod()
- [ ] Server starts on port 3001-3004
- [ ] No console errors
- [ ] Period selection UI works
- [ ] Date filtering works correctly
- [ ] PROGRESS.md updated
- [ ] Phase 2 marked ✅ COMPLETE

---

## 💡 HELPFUL PATTERNS

### Pattern 1: Creating Context
```javascript
// 1. Create context file
// 2. Test it compiles
// 3. Wrap App in provider
// 4. Test App still loads
// 5. Update one component to use it
// 6. Test that component
// 7. Continue updating components
```

### Pattern 2: Surgical File Editing
```javascript
// 1. Search for what you're changing
DC: start_search path=... pattern="const [startDate" searchType=content

// 2. Read the specific section
DC: read_file path=... offset=LINE_NUMBER length=20

// 3. Make minimal edit
DC: edit_block file_path=... old_string="[2-5 lines]" new_string="[new code]"

// 4. Test immediately
DC: start_process command="cd ... && npx vite"
```

### Pattern 3: Testing After Each Change
```javascript
// After creating PeriodContext.jsx
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && export PATH=\"/opt/homebrew/bin:\$PATH\" && npx vite --port 3001" timeout_ms=15000

// Check for errors
DC: read_process_output pid=XXXXX timeout_ms=5000

// If errors, fix immediately before continuing
```

---

## 🎓 LEARNING FROM PHASE 1

**What worked well**:
- Reading plan documents first
- Working in small chunks
- Testing after each change
- Using edit_block for surgical edits
- Updating docs incrementally

**What to avoid**:
- Reading huge files all at once
- Making multiple large changes without testing
- Forgetting to import new hooks
- Not checking for all component usages

---

## 🚦 GETTING STARTED - FIRST ACTIONS

1. **Confirm you understand the task**:
   - Read PHASE2_PERIODCONTEXT_PLAN.md
   - Acknowledge you've read it
   - Ask any clarification questions

2. **Set up your workspace**:
   - Check project is at correct path
   - Verify Phase 1 is complete
   - Read relevant sections of current code

3. **Start Task 2.1**:
   - Create PeriodContext.jsx
   - Test it compiles
   - Continue step-by-step

---

## 📞 COMMUNICATION

**After reading the plan**, start your response with:

> ✅ **Phase 2 Plan Read**
> - I've read PHASE2_PERIODCONTEXT_PLAN.md
> - I understand the task: Extract period state to PeriodContext
> - Estimated: 4-6 hours
> - Ready to start with Task 2.1: Create PeriodContext.jsx
>
> **Strategy**: I'll work incrementally:
> 1. Create PeriodContext.jsx (test)
> 2. Create usePeriod.js (test)
> 3. Update AGPGenerator (test)
> 4. Update child components one-by-one (test each)
> 5. Final testing
> 6. Update docs
>
> **First action**: Reading current AGPGenerator period state to understand what needs to move...

Then proceed with small, testable steps.

---

**Ready? Copy this entire prompt into a new Claude chat and let's build Phase 2!** 🚀

**Expected Duration**: 4-6 hours  
**Difficulty**: Medium  
**Risk**: Low (Phase 1 foundation is solid)

---

**Questions before starting?** Ask in the new session - I'm here to help! 💪
