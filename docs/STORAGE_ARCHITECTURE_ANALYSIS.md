# AGP+ Storage Architecture Analysis

**Date**: 2025-11-22  
**Author**: Claude (Chief Senior Software Developer)  
**Purpose**: Complete audit of storage layer for simplification planning

---

## 1. EXECUTIVE SUMMARY

AGP+ currently uses **three storage backends** with significant overlap and inconsistency:

| Backend | Purpose | Status |
|---------|---------|--------|
| **IndexedDB** (`agp-plus-db`) | Primary persistent storage | ✅ Correct choice |
| **localStorage** | Various features, legacy cache | ⚠️ Needs consolidation |
| **SQLite** (sql.js) | Historical sensor import | ❌ No longer needed |

**Key Finding**: Half-finished migrations have left the codebase with:
- **Dead IndexedDB stores** (created but never used)
- **Duplicate data** stored in both localStorage and IndexedDB
- **Inconsistent patterns** (some features use IndexedDB, similar ones use localStorage)
- **Legacy keys** that are only deleted, never written

---

## 2. INDEXEDDB STORES AUDIT

Database: `agp-plus-db` (version 6)

| Store | Purpose | Usage Status | Notes |
|-------|---------|--------------|-------|
| `uploads` | CSV upload metadata | ✅ ACTIVE | v2.x compat, used by uploadStorage.js |
| `settings` | Patient info, workdays | ✅ ACTIVE | v2.x compat, used by patientStorage.js |
| `readingBuckets` | Month-keyed glucose readings | ✅ ACTIVE | v3.0, used by masterDatasetStorage.js |
| `sensorEvents` | Persistent sensor changes | ❌ **DEAD** | Created but NEVER READ! |
| `cartridgeEvents` | Persistent cartridge changes | ⚠️ PARTIAL | Only `.clear()` used |
| `masterDataset` | Cached merged data | ✅ ACTIVE | v3.0, used by masterDatasetStorage.js |
| `sensorData` | Sensor tracking | ✅ ACTIVE | v3.6, used by sensorStorage.js |
| `seasons` | Device era tracking | ✅ ACTIVE | v4.4, used by seasonStorage.js |

### Dead Code Alert: `sensorEvents` Store
- Created in `db.js` line 67-73
- **Zero references** outside of creation
- Should be removed or utilized

### Partial Implementation: `cartridgeEvents` Store
- Created in `db.js` line 75-82
- Only reference: `masterDatasetStorage.js:997-1001` (clear operation)
- Never read from
- Decision needed: remove or complete implementation

---

## 3. LOCALSTORAGE KEYS AUDIT

### Active Keys (Currently Used)

| Key | File | Backend Should Be | Action |
|-----|------|-------------------|--------|
| `agp-device-events` | eventStorage.js | IndexedDB | 🔄 MIGRATE |
| `agp-stock-batches` | stockStorage.js | IndexedDB | 🔄 MIGRATE |
| `agp-stock-assignments` | stockStorage.js | IndexedDB | 🔄 MIGRATE |
| `agp-pump-settings` | pumpSettingsStorage.js | IndexedDB | 🔄 MIGRATE |
| `agp-device-history` | pumpSettingsStorage.js | IndexedDB | 🔄 MIGRATE |
| `agp-export-history` | exportHistory.js | IndexedDB | 🔄 MIGRATE |
| `agp-import-history` | importHistory.js | IndexedDB | 🔄 MIGRATE |
| `patient-info` | import.js/export.js | IndexedDB | ⚠️ DUPLICATE |
| `workday-dates` | import.js/export.js | IndexedDB | ⚠️ DUPLICATE |
| `github-token` | githubSync.js | localStorage | ✅ KEEP (credential) |
| `agp-devtools-enabled` | usePanelNavigation.js | localStorage | ✅ KEEP (UI pref) |

### Legacy/Dead Keys (Should Remove)

| Key | Location | Status |
|-----|----------|--------|
| `agp-v3-cache` | DebugPanel.jsx (read only) | ❌ DEAD - never written |
| `agp-v3-settings` | DebugPanel.jsx (read only) | ❌ DEAD - never written |
| `agp-patient-info` | DataManagementModal.jsx (remove only) | ❌ DEAD - never written |
| `agp-sensors-v4` | migrateToV4.js (script only) | ❌ LEGACY - migration artifact |

---

## 4. DATA DUPLICATION ANALYSIS

### Patient Info Duplication
```
Source 1: IndexedDB → STORES.SETTINGS → key 'patientInfo'
          Used by: patientStorage.js (async API)
          
Source 2: localStorage → key 'patient-info'  
          Used by: import.js, export.js (JSON backup/restore)
```
**Risk**: Data can drift out of sync between sources.
**Fix**: JSON import/export should use patientStorage.js API.

### Workday Dates Duplication
```
Source 1: IndexedDB → STORES.SETTINGS → key 'protime_workdays'
          Used by: masterDatasetStorage.js
          
Source 2: localStorage → key 'workday-dates'
          Used by: import.js, export.js (JSON backup/restore)
```
**Risk**: Same as patient info.
**Fix**: JSON import/export should use IndexedDB API.

### Device Events Duplication (THE BIG ONE)
```
Source 1: IndexedDB → STORES.SENSOR_EVENTS + STORES.CARTRIDGE_EVENTS
          Created but NEVER READ
          
Source 2: localStorage → key 'agp-device-events'
          Used by: eventStorage.js (day-profile-engine.js uses this)
```
**This is why the dual storage problem exists!**
- IndexedDB stores were created for v3.0 migration
- Migration was never completed
- eventStorage.js still uses localStorage
- day-profile-engine.js imports from eventStorage.js

---

## 5. FILE-BY-FILE STORAGE MAPPING

| File | Lines | Backend | Status |
|------|-------|---------|--------|
| `db.js` | 221 | IndexedDB schema | ✅ Keep |
| `indexedDB.js` | 477 | IndexedDB low-level ops | ✅ Keep |
| `masterDatasetStorage.js` | 1042 | IndexedDB | ✅ Keep |
| `sensorStorage.js` | 493 | IndexedDB | ✅ Keep |
| `seasonStorage.js` | 264 | IndexedDB | ✅ Keep |
| `eventStorage.js` | 224 | localStorage | 🔄 Migrate to IndexedDB |
| `stockStorage.js` | 282 | localStorage | 🔄 Migrate to IndexedDB |
| `pumpSettingsStorage.js` | 365 | localStorage | 🔄 Migrate to IndexedDB |
| `exportHistory.js` | 163 | localStorage | 🔄 Migrate to IndexedDB |
| `importHistory.js` | 129 | localStorage | 🔄 Migrate to IndexedDB |
| `sensorImport.js` | 284 | SQLite import | ❌ Remove (SQLite deprecated) |
| `export.js` | 163 | Mixed | ⚠️ Fix duplications |
| `import.js` | 361 | Mixed | ⚠️ Fix duplications |
| `stockImportExport.js` | 321 | Uses stockStorage | Follows stockStorage |

---

## 6. SQLITE ANALYSIS

### Current SQLite Files
- `src/utils/sqliteParser.js` - Parses .db files
- `src/storage/sensorImport.js` - Imports sensors from SQLite
- `src/components/SensorImport.jsx` - UI for SQLite import
- `src/components/panels/DevToolsPanel.jsx` - References SQLite
- `src/scripts/migrateToV4.js` - One-time migration script

### Usage Status
Per Jo's confirmation: **SQLite is no longer actively used.**
- Was used for historical sensor import
- All data now in IndexedDB
- Can be safely removed

---

## 7. RISK ASSESSMENT

### High Risk Issues

1. **Device Events localStorage vs IndexedDB**
   - day-profile-engine.js reads from localStorage
   - IndexedDB stores exist but are unused
   - If localStorage clears → events lost, IndexedDB has nothing
   - **Impact**: Day profiles could show incorrect sensor/cartridge events

2. **Patient Info Duplication**
   - UI uses IndexedDB (patientStorage.js)
   - JSON export uses localStorage
   - If user edits patient info in UI, then exports JSON → old data exported
   - **Impact**: Data loss on restore

### Medium Risk Issues

3. **Incomplete v3.0 Migration**
   - sensorEvents/cartridgeEvents stores created but unused
   - Wasted storage, confusing architecture
   - **Impact**: Technical debt, maintainability

4. **localStorage Size Limits**
   - localStorage has ~5-10MB limit
   - Large export history could hit limit
   - **Impact**: Silent data loss

### Low Risk Issues

5. **Dead localStorage Keys**
   - Keys like `agp-v3-cache` exist in code but never written
   - **Impact**: Confusing code, no functional impact

---

## 8. RECOMMENDED ACTIONS

### Phase 1: Documentation & Dead Code (1-2 hours)
- [x] Create this analysis document
- [ ] Remove DebugPanel.jsx references (dead keys)
- [ ] Remove SQLite-related files
- [ ] Update TECH_DEBT.md

### Phase 2: Fix Critical Duplications (2-3 hours)
- [ ] Update import.js/export.js to use patientStorage.js API
- [ ] Update import.js/export.js to use IndexedDB for workdays
- [ ] Remove localStorage `patient-info` and `workday-dates` usage

### Phase 3: Complete eventStorage Migration (3-4 hours)
- [ ] Option A: Migrate eventStorage.js to use existing IndexedDB stores
- [ ] Option B: Remove unused IndexedDB stores, keep localStorage
- [ ] Update day-profile-engine.js accordingly

### Phase 4: Migrate Remaining localStorage (4-6 hours)
- [ ] Add new IndexedDB stores for: stock, pumpSettings, history
- [ ] Migrate stockStorage.js to IndexedDB
- [ ] Migrate pumpSettingsStorage.js to IndexedDB
- [ ] Migrate exportHistory.js to IndexedDB
- [ ] Migrate importHistory.js to IndexedDB

### Phase 5: Cleanup & Testing (2-3 hours)
- [ ] Remove all dead localStorage keys
- [ ] Remove SQLite files
- [ ] Add migration for existing localStorage data
- [ ] Full regression test

**Total Estimated Effort**: 12-18 hours

---

## 9. DECISION POINTS

### Decision 1: eventStorage Migration Strategy

**Option A: Use Existing IndexedDB Stores**
- Pro: Stores already exist (sensorEvents, cartridgeEvents)
- Pro: Consistent with other v3.0 data
- Con: Need to populate stores retroactively
- Con: API changes needed in eventStorage.js

**Option B: Keep localStorage, Remove Dead IndexedDB Stores**
- Pro: Less code change
- Pro: localStorage works fine for this use case
- Con: Inconsistent architecture
- Con: Dead stores need removal anyway

**Recommendation**: Option A (proper fix)

### Decision 2: New IndexedDB Stores vs Existing

For stock, pumpSettings, history data:

**Option A: Add New Stores**
- Requires DB version bump (7)
- Clear separation of concerns
- New stores: `stock`, `pumpSettings`, `history`

**Option B: Use SETTINGS Store**
- No schema change needed
- All settings-like data in one store
- Keys: `stock_batches`, `pump_settings`, etc.

**Recommendation**: Option B (simpler, no migration needed)

---

## 10. FILES TO DELETE

### SQLite-Related (Safe to Remove)
```
src/utils/sqliteParser.js (284 lines)
src/storage/sensorImport.js (284 lines)
src/components/SensorImport.jsx
```

### Debug Panel (Safe to Remove)
```
src/components/DebugPanel.jsx
src/components/devtools/DebugPanel.jsx
src/components/panels/DevToolsPanel.jsx
```

### Migration Scripts (Keep for Reference)
```
src/scripts/migrateToV4.js (archive to docs/)
```

---

## 11. CONCLUSION

The storage layer has accumulated complexity from partial migrations. The core issues are:

1. **Half-finished IndexedDB migration** (eventStorage)
2. **Duplicate data paths** (patient info, workdays)
3. **Dead code** (unused stores, legacy keys)
4. **Inconsistent patterns** (some features IndexedDB, others localStorage)

The fix is straightforward but requires methodical execution:
- Complete the IndexedDB migration
- Remove dead code
- Standardize on IndexedDB for all persistent data
- Keep localStorage only for credentials and UI preferences

**Risk Level**: MEDIUM (functional code, but fragile edge cases)
**Urgency**: LOW (works now, but tech debt accumulating)
**Effort**: 12-18 hours for complete cleanup

---

**Document Version**: 1.0  
**Next Review**: After Phase 2 completion
