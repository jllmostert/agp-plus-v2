# AGP+ Refactoring Analysis

**Date**: 2025-11-22  
**Analyzed by**: Claude  
**Scope**: Big Three files for code health evaluation

---

## File: AGPGenerator.jsx

**Spaghetti Index**: 3/5 (Moderate)  
**Lines**: 1558

### Architecture Summary

The component is a **thin orchestration shell** that coordinates between:
- Context providers (UIContext, DataContext, PeriodContext, MetricsContext)
- Custom hooks (useModalState, usePanelNavigation, useImportExport)
- Panel components (ImportPanel, ExportPanel, SensorHistoryPanel, etc.)

**Good patterns already in place**:
- ✅ Context destructuring is well-organized
- ✅ Most state management extracted to contexts
- ✅ Panel navigation extracted to hook
- ✅ Modal state extracted to hook
- ✅ Import/export logic extracted to hook
- ✅ VisualizationContainer handles metric display

### Top Issues

1. **HUGE inline header JSX** (lines 820-1100, ~280 lines)
   - Massive inline styles
   - Complex nested grid layout
   - Could be `<AppHeader>` component

2. **Event handlers in component** (~400 lines, lines 300-700)
   - `handleCSVLoad` (50 lines)
   - `handleProTimeLoad` (40 lines)
   - `handleBatchAssignmentConfirm` (50 lines)
   - `handleImportConfirm` (100+ lines)
   - `handleDataManagementDelete` (50 lines)
   - These could move to a custom hook or controller

3. **Footer inline** (lines 1350-1400)
   - Could be `<AppFooter>` component

4. **Keyboard shortcuts inline** (lines 1410-1470)
   - Could be `<KeyboardShortcutsPopover>` component

5. **Multiple date auto-selection effects** (lines 135-200)
   - 3 separate useEffects for date auto-selection
   - Similar logic, could consolidate

### Quick Wins

- [ ] Extract `<AppHeader>` from lines 820-1100 (~280 lines saved)
- [ ] Extract `<AppFooter>` from lines 1350-1400 (~50 lines saved)
- [ ] Remove `EmptyCSVState` and `EmptyPeriodState` (unused, ~70 lines)
- [ ] Consolidate date auto-selection useEffects

### Large Refactors Needed

- [ ] Extract event handlers to `useDataManagement` hook
- [ ] Move all inline styles to CSS/Tailwind classes
- [ ] Consider splitting wrapper component from content component

### Target After Refactor
- Current: 1558 lines
- Target: <400 lines (orchestration only)

---

## File: metrics-engine.js

**Spaghetti Index**: 2/5 (Clean)  
**Lines**: 701

### Architecture Summary

**Well-organized pure calculation module** with:
- CONFIG constants
- Utils (parseDecimal, parseDate, formatDate, isInTimePeriod)
- MAGE/MODD helper functions (_localExtrema, _magePerDayMeanCross, _computeMODD)
- Main exports (calculateMetrics, calculateAGP, detectEvents)

**Good patterns already in place**:
- ✅ Pure functions throughout
- ✅ Excellent documentation with academic references
- ✅ Clear separation of concerns
- ✅ Performance timing built in
- ✅ Helper functions well-named with underscore prefix

### Top Issues

1. **calculateMetrics is long** (~150 lines)
   - Could split into sub-functions
   - But logic is sequential, splitting may hurt readability

2. **detectEvents could be cleaner** (~100 lines)
   - State machine logic is complex
   - But well-documented

3. **Some duplication in filtering**
   - Same date filtering logic in calculateMetrics, calculateAGP, detectEvents
   - Could extract `filterByDateRange(data, start, end)`

### Quick Wins

- [ ] Extract `filterByDateRange` helper (eliminates 3x duplication)
- [ ] Add JSDoc return type annotations

### Large Refactors Needed (OPTIONAL)

⚠️ **CAUTION**: These metrics are medically critical. Only refactor if necessary.

- [ ] Split into modules: `metrics/index.js`, `metrics/variability.js`, `metrics/timeInRange.js`
- [ ] But: current file is readable and well-tested, splitting may introduce bugs

### Target After Refactor
- Current: 701 lines
- Target: Keep as-is OR split to ~200 lines each (3 modules)
- **Recommendation**: Leave as-is unless specific issues arise

---

## File: sensorStorage.js

**Spaghetti Index**: 2/5 (Clean)  
**Lines**: 494

### Architecture Summary

**Clean async CRUD module** with:
- Constants (storage key, thresholds)
- Storage access (getStorage, saveStorage, initStorage)
- Status calculation (calculateStatus, getStatusInfo)
- Read operations (getAllSensors, getSensorById, getStatistics)
- Write operations (addSensor, updateSensor, deleteSensor)
- Lock operations (toggleLock, setLock)
- Batch operations (assignBatch)
- Export/Import (exportJSON, importJSON)
- Utilities (resequenceSensors, updateHardwareVersions)

**Good patterns already in place**:
- ✅ Single source of truth for status calculation
- ✅ All operations async with proper error handling
- ✅ Clear section comments
- ✅ Default export with named exports available

### Top Issues

1. **Storage schema has unused `batches` field**
   - `importJSON` references `storage.batches` but main storage doesn't use it
   - Batches are in stockStorage.js now

2. **importJSON merge logic is complex** (~60 lines)
   - Handles sensors, batches, lot numbers
   - Could be clearer

3. **updateHardwareVersions hardcoded date**
   - Uses `2025-07-03` cutoff
   - Should reference deviceEras.js instead

### Quick Wins

- [ ] Remove `batches` references (moved to stockStorage.js)
- [ ] Use deviceEras.js in `updateHardwareVersions`

### Large Refactors Needed

- [ ] **NOT NEEDED** - file is well-organized
- [ ] Could extract `sensorExportImport.js` but benefits are minimal

### Target After Refactor
- Current: 494 lines
- Target: ~450 lines (remove dead batch code)
- **Recommendation**: Minor cleanup only

---

## Summary

| File | Lines | Spaghetti | Quick Wins | Major Refactor |
|------|-------|-----------|------------|----------------|
| AGPGenerator.jsx | 1558 | 3/5 | 4 items | Extract header/footer, handlers to hook |
| metrics-engine.js | 701 | 2/5 | 2 items | Optional split (not recommended) |
| sensorStorage.js | 494 | 2/5 | 2 items | Minor cleanup only |

---

## Recommended Priority Order

### Phase 1: Quick Wins (Low Risk)
1. Remove unused `EmptyCSVState`/`EmptyPeriodState` from AGPGenerator
2. Remove `batches` references from sensorStorage.js
3. Extract `filterByDateRange` in metrics-engine.js

### Phase 2: AGPGenerator Cleanup (Medium Risk)
1. Extract `<AppHeader>` component
2. Extract `<AppFooter>` component  
3. Consolidate date auto-selection effects

### Phase 3: Handler Extraction (Higher Risk)
1. Create `useDataManagement` hook for event handlers
2. Move inline styles to CSS classes

### Phase 4: Optional (Only If Needed)
1. Split metrics-engine.js into modules
2. Create sensorExportImport.js

---

## Files NOT Needing Refactor

Based on analysis, these related files are already clean:
- `useModalState.js` - Simple state management
- `usePanelNavigation.js` - Clean navigation logic
- `useImportExport.js` - Well-organized import/export
- `cartridgeStorage.js` - Recently refactored, clean
- `patientStorage.js` - Simple CRUD, clean

---

**Next Step**: Proceed to Fase 2 (Quick Wins) or check in with user for priority confirmation.
