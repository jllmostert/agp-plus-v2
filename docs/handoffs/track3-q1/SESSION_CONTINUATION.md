# Track 3 Q1 - Phase 1 Continuation Session

**Date**: 2025-11-15  
**Status**: 🟡 70% COMPLETE - Child components need context integration  
**Project**: AGP+ Context API Refactoring  
**Path**: `/Users/jomostert/Documents/Projects/agp-plus`

---

## 🎯 OBJECTIVE

Complete Phase 1 of Context API refactoring by updating child components to use DataContext instead of props.

**What's Done:**
- ✅ DataContext.jsx created (224 lines)
- ✅ useData.js hook created (82 lines)
- ✅ App wrapped in DataProvider (main.jsx)
- ✅ AGPGenerator partially refactored (uses useData)
- ✅ AGPGenerator reduced: 1819 → 1739 lines

**What's Left:**
- ❌ Update ImportPanel.jsx to use useData() instead of props
- ❌ Update ExportPanel.jsx to use useData() instead of props
- ❌ Remove props from AGPGenerator component calls
- ❌ Test everything works
- ❌ Update PROGRESS.md

**Estimated Time**: 1-2 hours

---

## 📂 KEY FILES

```
/Users/jomostert/Documents/Projects/agp-plus/

src/
├── contexts/
│   └── DataContext.jsx                    ✅ Created
├── hooks/
│   └── useData.js                         ✅ Created
├── components/
│   ├── AGPGenerator.jsx                   🟡 Partially done
│   └── panels/
│       ├── ImportPanel.jsx                ❌ Needs update
│       └── ExportPanel.jsx                ❌ Needs update

docs/handoffs/track3-q1/
├── CONTEXT_API_ANALYSIS.md                📚 Reference
├── PHASE1_DATACONTEXT_PLAN.md             📚 Reference
└── SESSION_CONTINUATION.md                📄 This file
```

---

## 🔧 STEP-BY-STEP TASKS

### Task 1: Update ImportPanel.jsx (15 min)

**File**: `/Users/jomostert/Documents/Projects/agp-plus/src/components/panels/ImportPanel.jsx`

**Current State** (line 18-28):
```javascript
function ImportPanel({
  // Data state
  csvData,
  workdays,
  csvError,
  v3UploadError,
  
  // Handlers
  onCSVLoad,
  onProTimeLoad,
  onProTimeDelete,
  onImportDatabase,
  onSensorRegistrationOpen
}) {
```

**Action Required:**

1. **Add import** at top of file:
```javascript
import { useData } from '../../hooks/useData';
```

2. **Replace function signature:**
```javascript
function ImportPanel({
  // Handlers (keep these - they're callback functions)
  onCSVLoad,
  onProTimeLoad,
  onProTimeDelete,
  onImportDatabase,
  onSensorRegistrationOpen
}) {
  // Add this at top of function body
  const { csvData, workdays, csvError, v3UploadError } = useData();
```

3. **Rest of component stays the same** - it already uses these variables

**Desktop Commander:**
```bash
# Read current file
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/panels/ImportPanel.jsx

# After reviewing, use edit_block to update:
# 1. Add import at top
# 2. Update function signature
# 3. Add useData destructuring
```

---

### Task 2: Update ExportPanel.jsx (15 min)

**File**: `/Users/jomostert/Documents/Projects/agp-plus/src/components/panels/ExportPanel.jsx`

**Action Required:**

1. **Read file first** to see what props it currently receives:
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/panels/ExportPanel.jsx
```

2. **Identify data props** (likely similar to ImportPanel):
   - Look for props that come from data context (csvData, masterDataset, etc.)
   - Keep handler props (onExport*, etc.)

3. **Update same pattern as ImportPanel**:
   - Add `import { useData } from '../../hooks/useData'`
   - Remove data props from function signature
   - Add `const { ... } = useData()` inside function

**Desktop Commander:**
```bash
# Read file
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/panels/ExportPanel.jsx

# Edit with edit_block tool
```

---

### Task 3: Update AGPGenerator.jsx Component Calls (30 min)

**File**: `/Users/jomostert/Documents/Projects/agp-plus/src/components/AGPGenerator.jsx`

**Current State** (lines ~1253-1265):
```javascript
<ImportPanel
  csvData={csvData}
  workdays={workdays}
  csvError={csvError}
  v3UploadError={v3UploadError}
  onCSVLoad={handleCSVLoad}
  onProTimeLoad={handleProTimeLoad}
  onProTimeDelete={handleProTimeDelete}
  onImportDatabase={handleDatabaseImport}
  onSensorRegistrationOpen={() => modals.setSensorRegistrationOpen(true)}
/>
```

**Action Required:**

1. **Find all panel component calls** (search for "ImportPanel", "ExportPanel"):
```bash
DC: start_search /Users/jomostert/Documents/Projects/agp-plus/src/components pattern="<ImportPanel" searchType=content
DC: start_search /Users/jomostert/Documents/Projects/agp-plus/src/components pattern="<ExportPanel" searchType=content
```

2. **Remove data props, keep handlers:**
```javascript
<ImportPanel
  onCSVLoad={handleCSVLoad}
  onProTimeLoad={handleProTimeLoad}
  onProTimeDelete={handleProTimeDelete}
  onImportDatabase={handleDatabaseImport}
  onSensorRegistrationOpen={() => modals.setSensorRegistrationOpen(true)}
/>
```

3. **Do same for ExportPanel** (keep onExport* handlers)

**Desktop Commander:**
```bash
# Use edit_block to update each component call
DC: edit_block file_path=/Users/.../AGPGenerator.jsx old_string="<ImportPanel
  csvData={csvData}
  workdays={workdays}
  ..." new_string="<ImportPanel
  onCSVLoad={handleCSVLoad}
  ..."
```

---

### Task 4: Verify Other Child Components (30 min)

**Check these components** - they might also receive data props:

1. **DataLoadingContainer.jsx** (line 1328 in AGPGenerator):
   - Check if it receives `csvData`, `workdays`, `activeReadings`
   - If yes, update to use `useData()`

2. **VisualizationContainer.jsx**:
   - Likely receives metrics/data
   - May need context update

3. **SavedUploadsList.jsx**:
   - Check if receives upload data
   - May be fine as-is if parent manages it

**Desktop Commander:**
```bash
# Read each file to check props
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/containers/DataLoadingContainer.jsx length=50

# Search for component usage in AGPGenerator
DC: start_search /Users/.../src/components pattern="DataLoadingContainer" searchType=content
```

**Update if needed** using same pattern as ImportPanel.

---

### Task 5: Test Everything (20-30 min)

**Start Server:**
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

**Open**: http://localhost:3001

**Test Checklist:**
- [ ] App loads without errors
- [ ] Import panel shows data correctly
- [ ] Can upload new CSV
- [ ] Export panel shows data correctly
- [ ] Can export data
- [ ] Data status light shows correct color
- [ ] No console errors about missing context
- [ ] No warnings about unused props

**Desktop Commander:**
```bash
# Start server
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001" timeout_ms=10000

# Check for errors in output
DC: read_process_output pid=<PID>
```

---

### Task 6: Update PROGRESS.md (10 min)

**File**: `/Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md`

**Add Session Entry:**
```markdown
## ✅ SESSION 35 - Track 3 Q1 Phase 1 Complete (2025-11-15)

**Status**: ✅ COMPLETE
**Duration**: ~2 hours
**Focus**: DataContext integration - child components

### Accomplishments
1. **ImportPanel.jsx** - Updated to use useData()
2. **ExportPanel.jsx** - Updated to use useData()
3. **AGPGenerator.jsx** - Removed data props from panel calls
4. **Testing** - All functionality verified working

### Results
- AGPGenerator.jsx: 1739 → 1650 lines (89 lines removed)
- Prop drilling reduced significantly
- All panels now use DataContext
- Zero breaking changes

### Files Modified
- src/components/panels/ImportPanel.jsx
- src/components/panels/ExportPanel.jsx
- src/components/AGPGenerator.jsx
- docs/handoffs/PROGRESS.md

### Next Steps
Phase 1 COMPLETE! 🎉
Ready for Phase 2: PeriodContext (4-6 hours)
```

**Desktop Commander:**
```bash
# Append to PROGRESS.md
DC: write_file path=/Users/.../docs/handoffs/PROGRESS.md content="..." mode=append
```

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: "useData must be used within DataProvider"
**Cause**: Component using useData() but not wrapped in DataProvider  
**Solution**: Check main.jsx - DataProvider should wrap AGPGenerator

### Issue 2: Props still being passed
**Cause**: Forgot to remove props from AGPGenerator  
**Solution**: Search for component name, remove data props from call

### Issue 3: Component expects props
**Cause**: Didn't update child component to use useData()  
**Solution**: Add useData() destructuring in child component

### Issue 4: Circular dependency
**Cause**: Importing DataContext in a file that DataContext imports  
**Solution**: Check import chain, use base hooks in DataContext

---

## 📊 SUCCESS CRITERIA

**Before Starting:**
- [ ] Read this entire document
- [ ] Understand what needs to be done
- [ ] Have access to project files

**After Task 1-2 (Child Components):**
- [ ] ImportPanel.jsx uses useData()
- [ ] ExportPanel.jsx uses useData()
- [ ] No ESLint errors
- [ ] Files compile

**After Task 3 (AGPGenerator):**
- [ ] No data props passed to panels
- [ ] AGPGenerator line count reduced
- [ ] Still compiles

**After Task 5 (Testing):**
- [ ] App loads
- [ ] Can import data
- [ ] Can export data
- [ ] No console errors
- [ ] All features work

**After Task 6 (Docs):**
- [ ] PROGRESS.md updated
- [ ] Session documented
- [ ] Ready for Phase 2

---

## 🎯 FINAL METRICS

**Target Results:**
- **AGPGenerator.jsx**: 1739 → ~1650 lines (reduce by 90 lines)
- **Prop drilling**: Significantly reduced
- **New patterns**: Child components use context, not props
- **Functionality**: 100% preserved

**Phase 1 Complete Criteria:**
- All child components updated ✓
- AGPGenerator simplified ✓
- Tests passing ✓
- PROGRESS.md updated ✓

---

## 📝 QUICK START

```bash
# 1. Read ImportPanel current state
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/panels/ImportPanel.jsx

# 2. Update ImportPanel to use useData()
# (Add import, change signature, add destructuring)

# 3. Read ExportPanel current state
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/panels/ExportPanel.jsx

# 4. Update ExportPanel to use useData()

# 5. Find ImportPanel usage in AGPGenerator
DC: start_search /Users/jomostert/Documents/Projects/agp-plus/src/components pattern="<ImportPanel" searchType=content

# 6. Remove data props from AGPGenerator calls

# 7. Test
cd /Users/jomostert/Documents/Projects/agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001

# 8. Update PROGRESS.md with session summary
```

---

**Ready? Start with Task 1!** 🚀

**Estimated completion**: 1-2 hours  
**Difficulty**: Medium (straightforward refactoring)  
**Risk**: Low (easy to rollback with git)
