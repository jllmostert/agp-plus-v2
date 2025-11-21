# Phase 3: MetricsContext - Session Starter Prompt

**COPY THIS ENTIRE PROMPT TO START PHASE 3**

---

I'm continuing AGP+ Context API refactoring. **Phases 1 & 2 complete**, starting **Phase 3: MetricsContext**.

## 📋 CONTEXT

**Project**: AGP+ (Ambulatory Glucose Profile Plus)  
**Path**: `/Users/jomostert/Documents/Projects/agp-plus`  
**Current Status**: Phase 2 ✅ Complete, Phase 3 ready to start

**What's Done**:
- ✅ Phase 1: DataContext extracted
- ✅ Phase 2: PeriodContext extracted
- 🎯 Phase 3: Extract metrics calculation to MetricsContext

**Estimated**: 5-7 hours

---

## 🎯 PHASE 3 GOAL

Extract **all calculated metrics state** from AGPGenerator into MetricsContext.

**What moves:**
- `metricsResult` (from useMetrics hook)
- `comparisonData` (from useComparison hook)
- `dayProfiles` (from useDayProfiles hook)
- `tddData` (total daily dose statistics)

**Result**: ~200-300 lines removed from AGPGenerator, cleaner component

---

## 🛠️ DESKTOP COMMANDER RULES

**CRITICAL - Read these before starting**:

✅ **DO's:**
1. Read files in chunks: `DC: read_file path=... length=100`
2. Use edit_block with minimal context (2-5 lines)
3. Search before editing: `DC: start_search ...`
4. Test after each change
5. Update PROGRESS.md frequently

❌ **DON'Ts:**
1. DON'T read entire large files
2. DON'T make multiple edits without testing
3. DON'T use huge old_string in edit_block
4. DON'T forget to start server for testing
5. DON'T wait until end to document

---

## 📚 REQUIRED READING

**Before coding, read these**:

### 1. Verify Phase 2 Complete
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md offset=-100
```
Should show Session 36 complete.

### 2. Check current AGPGenerator structure
```bash
DC: start_search path=/Users/.../src/components/AGPGenerator.jsx pattern="useMetrics|useComparison|useDayProfiles" searchType=content
```

### 3. Read existing hooks
```bash
DC: read_file /Users/.../src/hooks/useMetrics.js length=50
DC: read_file /Users/.../src/hooks/useComparison.js length=50
DC: read_file /Users/.../src/hooks/useDayProfiles.js length=50
```

---

## 📝 TASK BREAKDOWN

### Task 3.1: Create MetricsContext (2 hours)

**File**: `src/contexts/MetricsContext.jsx`

**Purpose**: Centralize all calculated metrics

**What it manages:**
1. useMetrics hook (primary metrics calculation)
2. useComparison hook (period comparison)
3. useDayProfiles hook (daily profiles)
4. TDD calculations

**Structure**:
```javascript
import { useMetrics } from '../hooks/useMetrics';
import { useComparison } from '../hooks/useComparison';
import { useDayProfiles } from '../hooks/useDayProfiles';

export function MetricsProvider({ children }) {
  const { startDate, endDate } = usePeriod();
  const { masterDataset, workdays } = useData();
  
  // Calculated metrics
  const metricsResult = useMetrics(masterDataset, startDate, endDate, workdays);
  const comparisonData = useComparison(masterDataset, startDate, endDate);
  const dayProfiles = useDayProfiles(masterDataset, startDate, endDate, patientInfo);
  
  // TDD calculations (if needed)
  const tddData = useMemo(() => {
    // Calculate TDD from masterDataset
  }, [masterDataset, startDate, endDate]);
  
  const value = useMemo(() => ({
    metricsResult,
    comparisonData,
    dayProfiles,
    tddData
  }), [metricsResult, comparisonData, dayProfiles, tddData]);
  
  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
}
```

**Time**: 2 hours
- 60 min: Create structure and integrate hooks
- 30 min: Handle TDD calculations
- 30 min: Testing and refinement

---

### Task 3.2: Create useMetrics hook (30 min)

**File**: `src/hooks/useMetrics.js` (might already exist!)

Check if it exists first:
```bash
DC: list_directory /Users/.../src/hooks
```

If it exists, verify it's exporting properly.  
If not, create convenience exports.

**Time**: 30 minutes

---

### Task 3.3: Update AGPGenerator (2 hours)

**Changes**:

1. **Add MetricsProvider wrapper**
```javascript
export default function AGPGenerator() {
  const { masterDataset } = useData();
  
  return (
    <PeriodProvider masterDataset={masterDataset}>
      <MetricsProvider>
        <AGPGeneratorContent />
      </MetricsProvider>
    </PeriodProvider>
  );
}
```

2. **Replace hook calls with context**
```javascript
// OLD:
const metricsResult = useMetrics(masterDataset, startDate, endDate, workdays);
const comparisonData = useComparison(masterDataset, startDate, endDate);
const dayProfiles = useDayProfiles(...);

// NEW:
const { metricsResult, comparisonData, dayProfiles, tddData } = useMetricsContext();
```

3. **Remove props from child components**

**Time**: 2 hours
- 45 min: Add MetricsProvider
- 45 min: Update AGPGenerator
- 30 min: Remove props from components

---

### Task 3.4: Update Child Components (1.5 hours)

**Components to check:**
- VisualizationContainer (already updated in Phase 2)
- ExportPanel (might use dayProfiles)
- Any other components receiving metrics props

**Pattern**:
```javascript
// Instead of receiving props:
function MyComponent({ metricsResult }) {
  
// Use context:
import { useMetricsContext } from '../../hooks/useMetrics';
function MyComponent() {
  const { metricsResult } = useMetricsContext();
```

**Time**: 1.5 hours

---

### Task 3.5: Testing (1 hour)

**Test Checklist:**
- [ ] Server starts without errors
- [ ] Metrics display correctly
- [ ] Comparison view works
- [ ] Day profiles generate
- [ ] TDD calculations accurate
- [ ] Export functions work
- [ ] No console errors

**Time**: 1 hour

---

### Task 3.6: Documentation (30 min)

Update:
- PROGRESS.md (Session 37 summary)
- Create SESSION_37_SUMMARY.md
- Document architecture changes

**Time**: 30 minutes

---

## ⚠️ POTENTIAL ISSUES

### Issue 1: Circular Dependencies

**Problem**: MetricsContext needs data from DataContext and PeriodContext

**Solution**: Import and use those contexts inside MetricsProvider:
```javascript
export function MetricsProvider({ children }) {
  const { masterDataset, workdays } = useData();
  const { startDate, endDate } = usePeriod();
  // ... rest
}
```

---

### Issue 2: patientInfo Not in Context

**Problem**: dayProfiles needs patientInfo which might still be in AGPGenerator

**Solution Options**:
A) Move patientInfo to DataContext (Phase 1 extension)
B) Pass as prop to MetricsProvider temporarily
C) Create separate PatientContext (future)

**Recommendation**: Option B for now (pass as prop)

---

### Issue 3: Performance

**Problem**: Re-calculating metrics on every period change

**Solution**: Hooks already use useMemo, just verify dependencies are correct

---

## 📊 EXPECTED OUTCOMES

**Before Phase 3**:
```
AGPGenerator.jsx: ~1730 lines
- Calls useMetrics, useComparison, useDayProfiles
- Passes metrics props to many components
```

**After Phase 3**:
```
AGPGenerator.jsx: ~1430-1530 lines (200-300 lines removed)
- Uses useMetricsContext() instead
- No metrics props needed
- Cleaner component structure

New files:
- MetricsContext.jsx (~250 lines)
- Updated useMetrics.js hook (if needed)
```

---

## ✅ SUCCESS CRITERIA

Phase 3 complete when:

✅ MetricsContext created and working  
✅ useMetricsContext hook provides metrics  
✅ AGPGenerator uses context instead of hooks  
✅ Child components updated  
✅ All metrics functionality works  
✅ Server starts without errors  
✅ No console errors  
✅ Documentation updated

---

## 🚀 GETTING STARTED

### Step 1: Confirm Phase 2 Complete
```bash
DC: read_file /Users/.../docs/handoffs/PROGRESS.md offset=-50
```

Should show Session 36 complete.

### Step 2: Start Server
```bash
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && export PATH=\"/opt/homebrew/bin:\$PATH\" && npx vite --port 3001" timeout_ms=15000
```

### Step 3: Begin Task 3.1
Create MetricsContext.jsx

---

## 💡 HELPFUL PATTERNS

### Pattern 1: Creating MetricsContext
```
1. Create src/contexts/MetricsContext.jsx
2. Import existing hooks (useMetrics, useComparison, useDayProfiles)
3. Get data from DataContext and PeriodContext
4. Call hooks with appropriate parameters
5. Provide values via context
6. Test compilation
```

### Pattern 2: Updating Components
```
1. Search for components receiving metrics props
2. Add useMetricsContext import
3. Remove props from function signature
4. Add context destructuring
5. Remove props from parent component calls
6. Test functionality
```

---

## 📞 START YOUR RESPONSE

After reading everything, begin with:

> ✅ **Phase 3 Ready to Start**
> - Confirmed Phase 2 complete
> - Understand goal: Extract metrics to MetricsContext
> - Estimated: 5-7 hours
> - Strategy: Work incrementally, test frequently
>
> **First action**: Checking current AGPGenerator metrics usage...
> [describe what you're doing]

Then proceed step-by-step!

---

**Ready? Let's build Phase 3!** 🚀

**Difficulty**: Medium-High  
**Risk**: Low  
**Impact**: Major (200-300 lines removed)

---

**Questions before starting?** Ask me in the session!
