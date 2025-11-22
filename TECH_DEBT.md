# AGP+ Technical Debt & Future Cleanup

**Created**: 2025-11-21  
**Context**: Multi-pump CSV parser fixes (pump replacement NG4114235H → NG4231472H)  
**Review Date**: 2026-01-15 (when old pump data is no longer in exports)

---

## 🎯 OVERVIEW

On 21/11/2025, a pump replacement caused CSV exports to contain **two pumps** with different column structures. We added "duct tape" fixes to handle this. Once CareLink exports only contain the new pump data (~4-6 weeks), these can be simplified.

---

## 🔧 CLEANUP ITEMS

### 1. Remove Multi-Pump Parsing Logic

**Files affected:**
- `src/core/parsers.js`
- `src/core/csvSectionParser.js`

**What to remove:**

```javascript
// parsers.js - lines ~680-780
// Remove entire "=== MULTI-PUMP SUPPORT ===" blocks:
// - Sensor section loop (s = 1; s < sensorSections.length)
// - Pump section loop for events

// csvSectionParser.js - lines ~218-268
// Remove entire multi-pump alert parsing block
```

**When safe to remove:**
- When CSV exports no longer contain NG4114235H data
- Estimated: January 2026 (6 weeks after pump change)
- Test: Upload fresh CSV, check if only 1 pump section detected

**Risk if removed too early:**
- Historical data from old pump would be lost on re-import
- But: Data already in JSON backup is safe

---

### 2. Consolidate Duplicate Parsers

**Problem:**
Two separate parsing systems exist that do similar things:
1. `parseCSV()` in `parsers.js` - Used for main glucose data
2. `parseCareLinkSections()` in `csvSectionParser.js` - Used for sensor detection

**Why this is bad:**
- Fixes need to be applied to BOTH parsers
- Different column detection logic (prone to drift)
- Confusing for maintenance

**Recommended fix:**
```
Option A: Merge into single parser
- parseCSV() returns { data, alerts, glucose, metadata }
- Remove csvSectionParser.js entirely
- Update SensorRegistration.jsx to use parseCSV()

Option B: Shared column detection
- Extract findColumnIndices() as shared utility
- Both parsers use same detection logic
- Keep separate for different use cases
```

**Effort estimate:** ~4 hours for Option A, ~2 hours for Option B

**Priority:** Medium (not urgent, but reduces maintenance burden)

---

### 3. Simplify Section Detection

**Current state:**
- `detectSections()` in csvSectionParser.js counts sections 1-3
- `findAllSensorSections()` in parsers.js finds by type ('Sensor'/'Pump')
- Overlap and potential inconsistency

**Future state:**
- Single `findSections(csvText)` function
- Returns all sections with type, serial, boundaries
- Used by both parseCSV and sensor detection

**Location for shared code:** `src/core/csvUtils.js` (new file)

---

## 📅 CLEANUP TIMELINE

| Date | Action |
|------|--------|
| 2025-12-15 | Check if old pump still in exports |
| 2025-12-21 | **~30 days post pump change**: JSON has all historical data, CSV only new pump |
| 2026-01-15 | If clean, remove multi-pump code |
| 2026-02-01 | Consolidate parsers (Option A or B) |
| 2026-02-15 | Final cleanup, update tests |

### Key Insight: JSON + Clean CSV Strategy

After ~30 days (around 2025-12-21):
- **JSON backup** contains ALL historical sensor data (both pumps)
- **Fresh CSV exports** only contain new pump (NG4231472H)
- Multi-pump parsing code becomes unnecessary
- Can simplify back to single-pump parser

---

## ⚠️ BEFORE REMOVING ANY CODE

1. **Export full JSON backup** (includes all historical data)
2. **Test with fresh CSV** (only new pump data)
3. **Verify sensor history** still intact after code removal
4. **Git tag** before cleanup: `git tag pre-parser-cleanup`

---

## 🧪 TEST CASES FOR CLEANUP

After removing multi-pump code, verify:

```
□ Fresh CSV imports correctly (glucose, boluses, alerts)
□ Sensor detection finds new sensors
□ Rewind events detected
□ No console errors about missing sections
□ Historical data in JSON still loads
□ Metrics calculate correctly
```

---

## 📝 CODE MARKERS

Search for these comments to find cleanup locations:

```javascript
// === MULTI-PUMP SUPPORT ===
// TODO: Remove after old pump data expires
```

---

## 💡 LESSONS LEARNED

1. **Hardware changes can break CSV structure** - Column positions aren't guaranteed
2. **Separate parsers = separate fixes** - Consolidation prevents this
3. **Dynamic column detection is essential** - Never hardcode column indices
4. **Document temporary fixes** - This file exists for that reason

---

## 🧹 CODE HYGIENE (Added 2025-11-22)

### ~~4. Console Statement Cleanup~~ (2025-11-22) ✓

Removed 15 debug console.log statements from production code.

**Kept (intentionally):**
- `migrateSensors.js` - migration logs (useful for debugging)
- `parsers.js:476` - console.info for optional columns
- `__tests__/` and `__benchmarks__/` - test output

---

### ~~5. Consolidate IndexedDB Databases~~ (2025-11-22) ✓

**Resolved by removing tombstone system entirely.**

Hard delete (v4.4.0) made tombstones obsolete:
- Deleted `deletedSensorsDB.js` (426 lines)
- Deleted `migrateSensors.js` (487 lines)
- Deleted `migrations/` folder (666 lines)
- Simplified `main.jsx` startup
- Removed unused `restoreSensor()` and 'deleted' status

Now only one IndexedDB: `agp-plus-db`

---

### 6. Split Large Components

**Problem:**
Several components exceed 1000 lines, making them hard to maintain:

| File | Lines | Recommendation |
|------|-------|----------------|
| `AGPGenerator.jsx` | 1,579 | Extract render sections to sub-components |
| `PumpSettingsPanel.jsx` | 1,292 | Split into PumpInfo, CRGrid, ISFGrid, etc. |
| `SensorHistoryPanel.jsx` | 1,163 | Split into SensorTable, SensorStats, etc. |

**Pattern to follow:**
```
panels/
├── SensorHistoryPanel/
│   ├── index.jsx           # Main component
│   ├── SensorTable.jsx     # Table rendering
│   ├── SensorStats.jsx     # Statistics display
│   └── SensorFilters.jsx   # Filter controls
```

**Effort estimate:** ~6 hours total  
**Priority:** Low (code works, just harder to maintain)

---

### 7. Storage Layer Simplification 🔄 IN PROGRESS

**Analysis completed**: 2025-11-22  
**See**: `docs/STORAGE_ARCHITECTURE_ANALYSIS.md`

**Confirmed issues:**
1. `eventStorage.js` stores `sensorChanges` in localStorage → **NEVER READ** (dead code)
2. IndexedDB stores `sensorEvents` and `cartridgeEvents` → **CREATED BUT UNUSED**
3. `patient-info` and `workday-dates` duplicated in localStorage AND IndexedDB
4. SQLite files deprecated (no longer used)
5. DebugPanel references dead localStorage keys

**Cleanup plan** (see `docs/SESSION_HANDOFF_STORAGE_CLEANUP.md`):
- Fase 1: Remove dead code (storeSensorChange, unused stores, SQLite, DebugPanel)
- Fase 2: Rename eventStorage → cartridgeStorage, migrate to IndexedDB
- Fase 3: Fix patient-info/workdays duplication

**Effort estimate:** ~4 hours  
**Priority:** Medium (dead code accumulating, duplication risk)  
**Status:** Ready to execute

---

## ✅ COMPLETED CLEANUP

### ~~Storage Layer Cleanup~~ (2025-11-22) ✓

**Deleted files:**
- `src/storage/deletedSensorsDB.js` (426 lines)
- `src/storage/migrateSensors.js` (487 lines)
- `src/storage/migrations/` folder (666 lines)

**Lines removed:** ~1,579

### ~~Console Statement Cleanup~~ (2025-11-22) ✓

Removed 15 debug console.log statements from production code.

### ~~Dead Code Removal~~ (2025-11-22) ✓

**Deleted files:**
- `src/components/panels/SensorHistoryPanel.OLD.jsx` (1,237 lines)
- `src/components/SensorHistoryModal.jsx.backup`
- Old migration JSON/DB files from public/ and docs/

**Lines removed:** ~1,300

---

**Last updated**: 2025-11-22 (storage analysis complete)
