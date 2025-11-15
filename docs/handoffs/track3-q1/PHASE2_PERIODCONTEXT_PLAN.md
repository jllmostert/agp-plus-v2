# Phase 2: PeriodContext Implementation Plan

**Sprint**: Track 3, Q1 - Context API  
**Phase**: 2 of 4  
**Estimated**: 4-6 hours  
**Status**: 📋 Ready to Start

---

## 🎯 PHASE 2 GOAL

Extract period selection state from AGPGenerator.jsx into a dedicated PeriodContext provider.

**What moves:**
- `startDate` state
- `endDate` state
- `safeDateRange` computed value
- Period manipulation handlers
- Custom range detection logic

**Result:** 
- ~100-150 lines removed from AGPGenerator
- Better separation of period concerns
- Cleaner component interfaces
- Easier testing of period logic

---

## 📋 TASK BREAKDOWN

### Task 2.1: Create PeriodContext (90 min)

**File:** `src/contexts/PeriodContext.jsx`

**Purpose**: Centralized period selection and date range management

**Structure:**
```javascript
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const PeriodContext = createContext(null);

export function PeriodProvider({ children, masterDataset }) {
  // ============================================
  // STATE: Period Selection
  // ============================================
  
  // Core period state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // ============================================
  // COMPUTED: Safe Date Range
  // ============================================
  
  const safeDateRange = useMemo(() => {
    if (!masterDataset || masterDataset.length === 0) {
      return { min: null, max: null };
    }
    
    const dates = masterDataset
      .map(r => new Date(r.time))
      .filter(d => !isNaN(d.getTime()));
    
    if (dates.length === 0) {
      return { min: null, max: null };
    }
    
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates))
    };
  }, [masterDataset]);
  
  // ============================================
  // EFFECTS: Auto-set Initial Period
  // ============================================
  
  // Initialize period when data loads
  useEffect(() => {
    if (safeDateRange.max && !startDate && !endDate) {
      const maxDate = safeDateRange.max;
      const twoWeeksAgo = new Date(maxDate);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
      
      setStartDate(twoWeeksAgo);
      setEndDate(maxDate);
    }
  }, [safeDateRange.max, startDate, endDate]);
  
  // ============================================
  // HANDLERS: Period Manipulation
  // ============================================
  
  const updateDateRange = useCallback((newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);
  
  const resetPeriod = useCallback(() => {
    if (safeDateRange.max) {
      const maxDate = safeDateRange.max;
      const twoWeeksAgo = new Date(maxDate);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
      
      setStartDate(twoWeeksAgo);
      setEndDate(maxDate);
    }
  }, [safeDateRange.max]);
  
  // ============================================
  // COMPUTED: Period Info
  // ============================================
  
  const periodInfo = useMemo(() => {
    if (!startDate || !endDate) {
      return {
        isCustomRange: false,
        days: 0,
        description: 'No period selected'
      };
    }
    
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Check if this is a standard 14-day period ending at max date
    const isStandard14Days = 
      days === 14 && 
      safeDateRange.max &&
      Math.abs(endDate - safeDateRange.max) < 24 * 60 * 60 * 1000; // Within 1 day
    
    return {
      isCustomRange: !isStandard14Days,
      days,
      description: `${days} days (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`
    };
  }, [startDate, endDate, safeDateRange.max]);
  
  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value = useMemo(() => ({
    // State
    startDate,
    endDate,
    safeDateRange,
    
    // Setters
    setStartDate,
    setEndDate,
    updateDateRange,
    resetPeriod,
    
    // Computed
    periodInfo
  }), [
    startDate,
    endDate,
    safeDateRange,
    updateDateRange,
    resetPeriod,
    periodInfo
  ]);
  
  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}
```

**Key Points**:
- Receives `masterDataset` as prop (from DataContext)
- Auto-initializes to last 14 days when data loads
- Provides both individual setters and combined updater
- Includes computed `periodInfo` for UI convenience
- Clean separation of concerns

**Estimated Time**: 90 minutes
- 30 min: Structure and state setup
- 30 min: Handlers and computed values
- 30 min: Testing and refinement

---

### Task 2.2: Create usePeriod Hook (30 min)

**File:** `src/hooks/usePeriod.js`

**Purpose**: Convenience hook with common period patterns

**Structure:**
```javascript
import { usePeriod as usePeriodContext } from '../contexts/PeriodContext';

/**
 * Convenience hook for period context
 * Re-exports usePeriod from PeriodContext for consistency
 */
export { usePeriod } from '../contexts/PeriodContext';

/**
 * Hook for components that only need period dates
 * @returns {{ startDate, endDate, updateDateRange }}
 */
export function usePeriodDates() {
  const { startDate, endDate, updateDateRange } = usePeriodContext();
  return { startDate, endDate, updateDateRange };
}

/**
 * Hook for components that only need date range limits
 * @returns {{ min, max }}
 */
export function useDateRange() {
  const { safeDateRange } = usePeriodContext();
  return safeDateRange;
}

/**
 * Hook for components that need period info
 * @returns {{ days, isCustomRange, description }}
 */
export function usePeriodInfo() {
  const { periodInfo } = usePeriodContext();
  return periodInfo;
}
```

**Usage Examples:**
```javascript
// Full context
const { startDate, endDate, periodInfo } = usePeriod();

// Just dates
const { startDate, endDate } = usePeriodDates();

// Just range limits
const { min, max } = useDateRange();

// Just info
const { days, isCustomRange } = usePeriodInfo();
```

**Estimated Time**: 30 minutes
- 15 min: Create convenience exports
- 15 min: Documentation and examples

---

### Task 2.3: Update AGPGenerator (60 min)

**File:** `src/components/AGPGenerator.jsx`

**Changes Required**:

#### 1. Remove Period State (lines ~250-260)
**Search for:**
```javascript
const [startDate, setStartDate] = useState(null);
const [endDate, setEndDate] = useState(null);
```

**Replace with:**
```javascript
// Period state moved to PeriodContext
```

#### 2. Remove safeDateRange Calculation (lines ~350-370)
**Search for:**
```javascript
const safeDateRange = useMemo(() => {
  if (!masterDataset || masterDataset.length === 0) {
    // ... existing code
  }
}, [masterDataset]);
```

**Replace with:**
```javascript
// safeDateRange moved to PeriodContext
```

#### 3. Add PeriodProvider Wrapper
**In App.jsx** (around line 50):
```javascript
<DataProvider>
  <PeriodProvider masterDataset={/* pass from DataContext */}>
    {/* existing content */}
  </PeriodProvider>
</DataProvider>
```

**OR keep PeriodProvider inside AGPGenerator** if you prefer:
```javascript
function AGPGenerator() {
  const { masterDataset } = useData();
  
  return (
    <PeriodProvider masterDataset={masterDataset}>
      <AGPGeneratorContent />
    </PeriodProvider>
  );
}

function AGPGeneratorContent() {
  const { startDate, endDate, safeDateRange } = usePeriod();
  // ... rest of component
}
```

#### 4. Update Period References
**Search for all instances of:**
- `startDate` → ensure they use `const { startDate } = usePeriod()`
- `endDate` → ensure they use `const { endDate } = usePeriod()`
- `safeDateRange` → ensure they use `const { safeDateRange } = usePeriod()`
- `setStartDate` → ensure they use context version
- `setEndDate` → ensure they use context version

#### 5. Remove Period Handler Functions
**Search for and remove**:
```javascript
const handleStartDateChange = (date) => {
  setStartDate(date);
};

const handleEndDateChange = (date) => {
  setEndDate(date);
};
```

These are no longer needed if using context setters directly.

**Estimated Time**: 60 minutes
- 20 min: Remove period state declarations
- 20 min: Add PeriodProvider and usePeriod hook
- 20 min: Update all period references

---

### Task 2.4: Update Child Components (60 min)

**Components to Update:**

#### 2.4.1 PeriodSelector.jsx

**Current signature (estimated):**
```javascript
function PeriodSelector({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  safeDateRange 
}) {
  // ...
}
```

**New signature:**
```javascript
import { usePeriod } from '../../hooks/usePeriod';

function PeriodSelector() {
  const { 
    startDate, 
    endDate, 
    setStartDate, 
    setEndDate, 
    safeDateRange,
    periodInfo
  } = usePeriod();
  
  // Use context values directly
  // ...
}
```

**Steps**:
1. Add `import { usePeriod } from '../../hooks/usePeriod'`
2. Remove props from function signature
3. Add `const { ... } = usePeriod()` inside component
4. Update internal references (should just work)
5. Remove prop passing from AGPGenerator

**Time**: 20 minutes

---

#### 2.4.2 VisualizationContainer.jsx

**Similar updates**:
- Import usePeriod
- Remove period-related props
- Add usePeriod() call
- Update AGPGenerator to not pass period props

**Time**: 15 minutes

---

#### 2.4.3 Other Components (if needed)

**Search for components using:**
```bash
DC: start_search path=/Users/.../src/components pattern="startDate|endDate" searchType=content
```

Check each result to see if it needs updating to use context.

**Time**: 25 minutes

---

### Task 2.5: Testing (45 min)

**Test Checklist:**

#### Build Test
- [ ] Server starts without errors
- [ ] No TypeScript/ESLint errors
- [ ] No console warnings

#### Functionality Test
- [ ] Period selector displays correctly
- [ ] Start date can be changed
- [ ] End date can be changed
- [ ] safeDateRange limits work (can't select dates outside range)
- [ ] Period changes update visualizations
- [ ] Custom period detection works
- [ ] Default 14-day period loads correctly

#### Integration Test
- [ ] Data import → period initializes
- [ ] Period change → charts update
- [ ] Period change → metrics recalculate
- [ ] Export uses current period

**Steps**:
1. Start dev server: `DC: start_process command="cd ... && npx vite --port 3001"`
2. Load app in browser
3. Import test CSV
4. Test period changes
5. Verify charts/metrics update
6. Check console for errors

**Time**: 45 minutes
- 15 min: Build verification
- 20 min: Manual testing
- 10 min: Bug fixes if needed

---

### Task 2.6: Update Documentation (30 min)

**Files to Update:**

#### PROGRESS.md
Add Session 36 summary:
```markdown
## ✅ SESSION 36 - Track 3 Q1 Phase 2 Complete (2025-11-15)

**Status**: ✅ COMPLETE  
**Duration**: ~[X] hours  
**Focus**: PeriodContext extraction

### Accomplishments

1. **PeriodContext.jsx** - Created period state management
   - Exports PeriodProvider and usePeriod
   - Manages startDate, endDate, safeDateRange
   - Auto-initializes to last 14 days
   - ~200 lines

2. **usePeriod.js** - Created convenience hook
   - Re-exports main usePeriod
   - Provides usePeriodDates, useDateRange, usePeriodInfo
   - ~50 lines

3. **AGPGenerator.jsx** - Removed period state
   - Removed startDate/endDate state declarations
   - Removed safeDateRange calculation
   - Now uses usePeriod() hook
   - ~100-150 lines removed

4. **Child Components** - Updated to use context
   - PeriodSelector.jsx uses usePeriod()
   - VisualizationContainer.jsx uses usePeriod()
   - [Other components if updated]

5. **Testing** - All functionality verified
   - Server starts cleanly
   - Period selection works
   - Charts update on period change
   - No console errors

### Results

- **AGPGenerator.jsx**: [OLD] → [NEW] lines ([X] lines removed)
- **New files**: PeriodContext.jsx (200 lines), usePeriod.js (50 lines)
- **Updated components**: [list]
- **Zero breaking changes**
- **Phase 2 COMPLETE**: ✅ Period state in context

### Architecture Notes

**PeriodContext Exports**:
- startDate, endDate, safeDateRange
- setStartDate, setEndDate, updateDateRange, resetPeriod
- periodInfo (days, isCustomRange, description)

**Next Context Migrations**:
- Phase 3: MetricsContext (calculated metrics, AGP data)
- Phase 4: UIContext (panel visibility, UI state)

### Next Steps

**Phase 2: ✅ COMPLETE**

**Ready for Phase 3: MetricsContext** (5-7 hours)
- Extract metrics calculation logic
- Create MetricsContext and useMetrics hook
- Update components using calculated metrics

**Track 3 Overall Progress**:
- Phase 1 (DataContext): ✅ 100% complete
- Phase 2 (PeriodContext): ✅ 100% complete
- Phase 3 (MetricsContext): 0% complete
- Phase 4 (UIContext): 0% complete

**Total Track 3 Progress**: 50% → 75% complete 🎉

---

**Session Quality**: [rate]  
**Code Quality**: [rate]  
**Testing**: [rate]  
**Documentation**: Complete
```

#### Context API Documentation
Create or update `docs/architecture/CONTEXT_API.md`:
- Document PeriodContext structure
- Explain period state management
- Show usage examples
- Note relationship with DataContext

**Time**: 30 minutes
- 20 min: PROGRESS.md update
- 10 min: Architecture docs

---

## 🔍 VERIFICATION CHECKLIST

Before marking Phase 2 complete:

- [ ] **Files Created**
  - [ ] src/contexts/PeriodContext.jsx (~200 lines)
  - [ ] src/hooks/usePeriod.js (~50 lines)

- [ ] **Files Updated**
  - [ ] src/components/AGPGenerator.jsx (~100-150 lines removed)
  - [ ] src/components/PeriodSelector.jsx (uses usePeriod)
  - [ ] src/components/containers/VisualizationContainer.jsx (uses usePeriod)
  - [ ] [Other components if needed]

- [ ] **Testing Complete**
  - [ ] Server starts without errors
  - [ ] Period selector displays
  - [ ] Date changes work
  - [ ] Charts update on period change
  - [ ] No console errors

- [ ] **Documentation Updated**
  - [ ] PROGRESS.md has Session 36 summary
  - [ ] Line counts documented
  - [ ] Architecture notes added

- [ ] **Code Quality**
  - [ ] No ESLint warnings
  - [ ] Consistent code style
  - [ ] Proper error handling
  - [ ] Comments where needed

---

## ⚠️ POTENTIAL ISSUES

### Issue 1: Circular Dependencies
**Problem**: PeriodContext needs masterDataset from DataContext

**Solution Option A**: Pass masterDataset as prop
```javascript
<PeriodProvider masterDataset={masterDataset}>
```

**Solution Option B**: Access DataContext from within PeriodContext
```javascript
// In PeriodContext.jsx
const { masterDataset } = useData();
```

**Recommendation**: Option A (clearer dependency flow)

---

### Issue 2: Period Initialization Timing
**Problem**: Period might initialize before data loads

**Solution**: Handle null states gracefully
```javascript
useEffect(() => {
  if (safeDateRange.max && !startDate && !endDate) {
    // Initialize period
  }
}, [safeDateRange.max, startDate, endDate]);
```

---

### Issue 3: Multiple Period State Updates
**Problem**: Changing both dates might cause double renders

**Solution**: Provide combined updater
```javascript
const updateDateRange = useCallback((newStart, newEnd) => {
  setStartDate(newStart);
  setEndDate(newEnd);
}, []);
```

---

## 📊 EXPECTED OUTCOMES

### Before Phase 2
```
AGPGenerator.jsx: ~1731 lines
- Period state: 2 useState declarations
- safeDateRange: useMemo calculation (~20 lines)
- Period handlers: ~30 lines
- Props drilling to PeriodSelector, VisualizationContainer
```

### After Phase 2
```
AGPGenerator.jsx: ~1580-1630 lines (100-150 lines removed)
- No period state
- Uses usePeriod() hook
- No period handlers
- No prop drilling

New files:
- PeriodContext.jsx: ~200 lines
- usePeriod.js: ~50 lines

Updated components:
- PeriodSelector.jsx: Uses context, fewer props
- VisualizationContainer.jsx: Uses context, fewer props
```

**Net Result**: ~100 lines added, ~100-150 lines removed from AGPGenerator

---

## 🎯 SUCCESS CRITERIA

**Phase 2 is complete when:**

✅ Period state extracted to PeriodContext  
✅ usePeriod hook provides clean API  
✅ AGPGenerator uses context instead of local state  
✅ Child components updated to use context  
✅ All period functionality works (selection, updates, filtering)  
✅ Server starts without errors  
✅ No console warnings or errors  
✅ Documentation updated  
✅ PROGRESS.md has Session 36 summary

---

## 💡 TIPS & BEST PRACTICES

### Tip 1: Work Incrementally
- Create PeriodContext first
- Test it compiles
- Wrap app/component
- Update one component at a time
- Test after each change

### Tip 2: Search Before Editing
```bash
# Find all period state usage
DC: start_search path=.../src pattern="startDate" searchType=content
```

### Tip 3: Use Small Edit Blocks
```javascript
// Good: Minimal context
DC: edit_block file_path=... 
  old_string="const [startDate, setStartDate] = useState(null);
const [endDate, setEndDate] = useState(null);"
  new_string="// Period state moved to PeriodContext"
```

### Tip 4: Test Compilation Frequently
After each major change:
```bash
DC: start_process command="cd ... && npx vite --port 3001"
```

### Tip 5: Keep Original Behavior
- Period should still auto-initialize to last 14 days
- Date selection should still be constrained by safeDateRange
- Custom period detection should still work

---

## 📚 REFERENCE

### Related Files
- `src/contexts/DataContext.jsx` - Data management context (Phase 1)
- `src/hooks/useData.js` - Data hook (Phase 1)
- `docs/handoffs/track3-q1/PHASE1_DATACONTEXT_PLAN.md` - Phase 1 reference
- `docs/handoffs/PROGRESS.md` - Overall progress tracking

### Key Concepts
- React Context API
- Custom hooks
- State lifting
- Prop drilling elimination
- Separation of concerns

---

**Phase 2 Estimated Total Time**: 4-6 hours

**Difficulty**: Medium  
**Risk**: Low (clean separation, well-defined scope)

---

**Ready to start? Begin with Task 2.1: Create PeriodContext.jsx** 🚀
