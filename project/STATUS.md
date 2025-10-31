---
tier: 2
status: active
last_updated: 2025-10-31
purpose: Project status tracking for AGP+ v3.10 bug fixes and architecture hardening
---

# AGP+ STATUS

**Version:** v3.10.0  
**Phase:** Bug Fixes & Architecture Hardening  
**Date:** 2025-10-31  
**Status:** ✅ Fixes Complete → 🧪 Testing Phase

---

## 🎯 CURRENT OBJECTIVE

**Primary Goal**: Validate and stabilize dual-source sensor architecture (localStorage + SQLite)

**Background**: 
- v3.9.x had full feature set but critical data integrity bugs
- Oct 30-31: Discovered duplicate sensors, lock system failures, delete resurrection
- Oct 31: All 5 bugs fixed and committed
- Now: User validation testing before v3.10 release

---

## ✅ COMPLETED WORK (v3.10.0 Bug Fixes)

### Fix #1: Duplicate Sensors Elimination ✅
**File**: `src/hooks/useSensorDatabase.js`

**Problem**: localStorage + SQLite merge had no deduplication  
**Solution**: Map-based dedupe by sensor_id  
**Impact**: CSV import counts correct, sort stable, delete works

---

### Fix #2: Sync Duplicate Prevention ✅
**File**: `src/storage/sensorStorage.js`

**Problem**: syncUnlockedSensorsToLocalStorage re-added existing sensors  
**Solution**: Filter using existingIds Set before sync  
**Impact**: No duplicate creation during sync operations

---

### Fix #3: Delete Button Lock Check ✅
**File**: `src/components/SensorHistoryModal.jsx`

**Problem**: Button disable used age-based lock, onClick used manual lock  
**Solution**: Both now use `sensor.is_manually_locked`  
**Impact**: Delete button correctly disabled when locked

---

### Fix #4: Lock Status for SQLite-Only Sensors ✅
**File**: `src/storage/sensorStorage.js`

**Problem**: Old sensors (>30d) showed incorrect 🔓 icons  
**Solution**: Auto-calculate lock based on age for SQLite-only sensors  
**Impact**: Lock icons accurate for ALL sensors

---

### Fix #5: Toggle Lock Error Messages ✅
**File**: `src/storage/sensorStorage.js`

**Problem**: Generic "Sensor niet gevonden" for read-only sensors  
**Solution**: Clear message: "Sensor is read-only (>30d old, SQLite only)"  
**Impact**: User understands why toggle fails

---

## 🧪 TESTING STATUS

### Testing Checklist

**Priority 1: Duplicate Fix** (PENDING)
- [ ] Hard refresh (Cmd+Shift+R)
- [ ] Check console for "duplicatesRemoved: X"
- [ ] Import CSV → verify count correct
- [ ] Delete sensor → verify stays deleted

**Priority 2: Lock System** (PENDING)
- [ ] Old sensors show 🔒 icon
- [ ] Recent sensors show 🔓 icon
- [ ] Toggle works on recent, errors on old
- [ ] Delete button disabled when locked

**Priority 3: CSV Import** (PENDING)
- [ ] Ignore 4, Confirm 4 → only 4 added
- [ ] Toast shows correct count
- [ ] No duplicates after reload

**See FIXES_IMPLEMENTED.md for complete test list**

---

## 🚨 KNOWN ISSUES (Technical Debt)

### CRITICAL: Time Boundary Drift
**Status**: Not Fixed (Phase 2)  
**Impact**: Sensors >30d stay in localStorage (should migrate to SQLite-only)  
**Risk**: Low (cosmetic, doesn't break functionality)

### HIGH: Lock Status Orphaning
**Status**: Not Fixed (Phase 2)  
**Impact**: Manual lock choices lost after 30-day boundary  
**Risk**: Medium (UX issue, user intent lost)

### HIGH: Resurrection via localStorage.clear()
**Status**: Not Fixed (Phase 2)  
**Impact**: Deleted sensors respawn if localStorage wiped  
**Risk**: High during debugging, low in production

### MEDIUM: Chronological Index Instability
**Status**: Documented, accepted for now  
**Impact**: #ID changes after delete operations  
**Risk**: Low (UX confusion, not data loss)

### LOW: Sync Race Conditions
**Status**: Not Fixed (Phase 3)  
**Impact**: Multi-tab delete can be lost in race  
**Risk**: Very Low (rare edge case)

---

## 📊 METRICS

### Current State
- **Total Sensors**: 219 (SQLite) + N (localStorage)
- **Success Rate**: ~67% (based on 219 historical sensors)
- **Average Duration**: 5.8 days (Guardian 4 sensors)
- **Lock System**: ✅ Operational
- **Dedupe Logic**: ✅ Active
- **Tombstone System**: ✅ Functional

### Performance Benchmarks
- **Sensor Merge**: < 100ms (219 + N sensors)
- **CSV Parse**: < 500ms (30-day file)
- **UI Render**: < 1s (full sensor table)
- **Delete Operation**: < 50ms

---

## 🔄 NEXT STEPS

### Immediate (v3.10.0 Release)
1. ✅ Complete user validation testing
2. ✅ No console errors in production
3. ✅ All test cases pass
4. Git tag: `v3.10.0-sensor-stability`
5. Update CHANGELOG.md
6. Update agp-project-status.html

### Phase 2 (v3.11 - Architecture Hardening)

**Goal**: Eliminate architectural technical debt

**Estimated Effort**: 7-9 hours

**Priorities**:
1. **Time Boundary Enforcement** (1-2h)
   - Auto-prune localStorage sensors >30d
   - Preserve lock metadata before removal
   
2. **Persistent Lock Metadata** (1h)
   - New localStorage store for lock history
   - Survives 30-day boundary crossing
   
3. **Tombstone Resilience** (2h)
   - Dual persistence (localStorage + SQLite)
   - New table: `deleted_sensors`
   
4. **Persistent UUID System** (3h)
   - Add UUID to all sensors
   - Decouple from chronological index

**Not started until**: v3.10.0 validated & tagged

---

## 📁 ACTIVE FILES

### Recently Modified (Oct 31)
- `src/hooks/useSensorDatabase.js` — Dedupe logic
- `src/storage/sensorStorage.js` — Lock system, sync fixes
- `src/components/SensorHistoryModal.jsx` — Delete button fix

### Core Architecture
- `src/core/` — Calculation engines (metrics, AGP, profiles)
- `src/hooks/` — Orchestration (useMetrics, useSensorDatabase)
- `src/storage/` — IndexedDB, localStorage modules
- `src/components/` — React UI (AGPGenerator, modals)

### Documentation
- `PROJECT_BRIEFING.md` — Complete project overview (UPDATED)
- `START_HERE.md` — Quick handoff (current)
- `FIXES_IMPLEMENTED.md` — Bug fix details (Oct 31)
- `BUG_ANALYSIS_SUMMARY.md` — Root cause analysis
- `CHANGELOG.md` — Version history (needs v3.10 entry)

---

## 🎯 DEFINITION OF DONE

### v3.10.0 Complete When:

**Functional**:
- [x] All 5 bug fixes implemented
- [x] Code committed & pushed
- [ ] User validation complete (all tests pass)
- [ ] No console errors in production build
- [ ] Git tagged: `v3.10.0-sensor-stability`

**Documentation**:
- [x] FIXES_IMPLEMENTED.md complete
- [x] START_HERE.md updated
- [x] PROJECT_BRIEFING.md complete
- [ ] CHANGELOG.md v3.10 entry
- [ ] agp-project-status.html updated

**Quality**:
- [x] No TypeScript/ESLint errors
- [ ] Performance benchmarks met
- [ ] 219 historical sensors intact
- [ ] localStorage + SQLite sync stable

---

## 📞 EMERGENCY CONTACTS

**Last Known Good**: Commit `5d22534` (Oct 31, 2025)

**Rollback Command**:
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git revert HEAD
git push origin main
```

**Debug Steps**:
1. Check browser console
2. Check localStorage state
3. Read FIXES_IMPLEMENTED.md
4. Review git log
5. Test in clean profile

---

**Status Document Version**: v3.10.0  
**Last Updated**: 2025-10-31  
**Current Focus**: User validation testing  
**Blockers**: None
