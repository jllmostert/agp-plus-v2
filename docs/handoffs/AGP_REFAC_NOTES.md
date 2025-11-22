# AGP+ Refactoring Analysis

**Date**: 2025-11-22  
**Branch**: main  
**Version**: v4.4.0

---

## 1. File-by-File Analysis

### AGPGenerator.jsx
**Lines**: 632  
**Spaghetti Index**: 1/5 (Clean!)

✅ **Already refactored** - down from 1558 lines (60% reduction)
- Pure orchestration shell
- All state in contexts
- Handlers in useDataManagement hook
- Header/Footer extracted

**No action needed.**

---

### useModalState.js
**Lines**: 77  
**Spaghetti Index**: 0/5 (Excellent)

✅ Clean, focused, single responsibility
- Manages 6 modal states
- Simple open/close/closeAll API

**No action needed.**

---

### usePanelNavigation.js
**Lines**: 85  
**Spaghetti Index**: 0/5 (Excellent)

✅ Clean, focused
- Panel switching
- Keyboard shortcuts
- DevTools toggle with localStorage persistence

**No action needed.**

---

### useImportExport.js
**Lines**: 318  
**Spaghetti Index**: 1/5 (Good)

✅ Well-organized
- Clear validation/import/export separation
- Progress tracking
- Good API surface

**Minor:** Could extract backup logic, but low priority.

---

### metrics-engine.js
**Lines**: 701  
**Spaghetti Index**: 2/5 (Good)

✅ Well-structured with clear exports:
- `CONFIG` - thresholds and settings
- `utils` - helper functions
- `calculateMetrics()` - main metrics
- `calculateAGP()` - AGP curve
- `detectEvents()` - event detection

**Optional improvement:** Could split into separate modules (percentiles, variability, TIR, GMI) but current structure is workable.

---

### day-profile-engine.js
**Lines**: 449  
**Spaghetti Index**: 2/5 (Good)

✅ Clear exports:
- `getLastSevenDays()` - day profiles
- `getDayProfile()` - single day
- `detectBadges()` - badge detection

**Note:** Contains sensor matching logic that touches multiple data sources. Complexity is justified by business requirements.

---

### sensorStorage.js
**Lines**: 462  
**Spaghetti Index**: 1/5 (Clean!)

✅ **Already V4 Clean Implementation**
- IndexedDB only (no localStorage, no SQLite)
- Hard delete (no tombstones)
- Clear CRUD operations
- Status calculation is pure function

**No action needed.**

---

### stockStorage.js
**Lines**: 282  
**Spaghetti Index**: 1/5 (Good)

✅ Clean localStorage-based storage
- Batches + assignments
- Validation helpers
- Clear API

**Minor:** Could migrate to IndexedDB for consistency, but localStorage works fine for this size.

---

### masterDatasetStorage.js ⚠️
**Lines**: 1024  
**Spaghetti Index**: 3/5 (God Module Alert!)

❌ **Too many responsibilities**:
1. Glucose readings (core) - lines 136-265
2. ProTime workdays - lines 269-310
3. TDD data - lines 312-345
4. Sensor change detection - lines 348-500
5. Cartridge change detection - lines 380-500
6. CSV upload flow - lines 559-840
7. Data deletion - lines 841-930
8. Batch suggestions - lines 932-975
9. Cleanup - lines 977-1024

**Recommendation**: Split into focused modules (see Phase 1 below).

---

## 2. Database Architecture Sanity Check

### Current Design

**Three-tier storage (by design)**:

| Tier | Technology | Purpose | Status |
|------|------------|---------|--------|
| Primary | IndexedDB | Glucose readings, sensors, seasons | ✅ Clean |
| Cache | localStorage | Stock batches, pump settings, history | ✅ Appropriate |
| Legacy | SQLite | Historical sensors | ✅ Migrated to IndexedDB |

**Data Flows**:
```
CSV Upload → parsers.js → masterDatasetStorage (IndexedDB)
                       → sensorStorage (IndexedDB)
                       → pumpSettingsStorage (localStorage)

JSON Import → import.js → all storage modules

ProTime PDF → masterDatasetStorage (IndexedDB SETTINGS)
```

### What's Fine (By Design)

1. **localStorage for stock/batches** - Small dataset, sync access needed
2. **localStorage for pump settings** - User preferences, fast access
3. **localStorage for export/import history** - Recent history only (10 items)
4. **IndexedDB for sensors** - Larger dataset, async is fine

### What's a Smell (Should Fix)

1. **masterDatasetStorage is a god module** - 1024 lines, 9+ responsibilities
2. **ProTime and TDD in masterDatasetStorage** - Should be separate modules
3. **Event detection logic mixed with storage** - Should be in core/
4. **CSV upload logic in storage** - Should be in core/ or hooks/

---

## 3. Refactor Proposals

### Quick Wins (≤1 hour, low risk)

1. **Extract ProTimeStorage** (~60 lines)
   - Move `saveProTimeData`, `loadProTimeData`, `deleteProTimeData`, `deleteProTimeDataInRange`
   - New file: `src/storage/protimeStorage.js`

2. **Extract TDDStorage** (~40 lines)
   - Move `loadTDDData`, `deleteTDDData`
   - New file: `src/storage/tddStorage.js`

3. **Remove dead localStorage key** in DataContext
   - Line 4 in DataContext has unused localStorage reference

### Phase 1 – masterDatasetStorage Split (Half-day)

**Target**: Reduce from 1024 to ~400 lines

**Proposed structure**:
```
src/storage/
├── masterDatasetStorage.js  # Core: readings, cache, buckets (~400 lines)
├── protimeStorage.js        # ProTime workdays (~80 lines)
├── tddStorage.js            # TDD data (~50 lines)
├── csvUploadEngine.js       # CSV processing (~300 lines) → move to core/
└── dataCleanup.js           # Deletion, cleanup (~150 lines)
```

**Risk**: Medium - need to update all import paths
**Benefit**: High - single responsibility, easier testing

### Phase 2 – metrics-engine Split (Optional, 2h)

**Current**: 701 lines, 3 main exports

**Proposed structure**:
```
src/core/metrics/
├── index.js          # Re-exports public API
├── config.js         # Thresholds, settings
├── percentiles.js    # p5, p25, p50, p75, p95
├── variability.js    # CV, SD, MAGE, MODD
├── timeInRange.js    # TIR, TAR, TBR
├── gmi.js            # GMI calculation
└── events.js         # Event detection
```

**Risk**: Low (pure functions)
**Benefit**: Medium (easier to test individual metrics)

---

## 4. Priority Ranking

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P1 | Extract ProTimeStorage | 30 min | Clean separation |
| P1 | Extract TDDStorage | 20 min | Clean separation |
| P2 | Extract csvUploadEngine | 2h | Major cleanup |
| P2 | Extract dataCleanup | 1h | Clean separation |
| P3 | Split metrics-engine | 2h | Optional organization |

---

## 5. DO NOT TOUCH

⚠️ **parsers.js** - Multi-pump column handling active
⚠️ **Metric formulas** - Clinically validated
⚠️ **Sensor detection logic** - Complex but correct

---

**Next Step**: Confirm quick wins, then proceed with Phase 1.
