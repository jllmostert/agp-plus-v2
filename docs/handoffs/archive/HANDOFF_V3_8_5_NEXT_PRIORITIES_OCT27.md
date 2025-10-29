# 🎯 HANDOFF V3.8.5 - Next Priorities & Roadmap Status

**Datum:** 27 oktober 2025  
**Status:** 🚧 PLANNING  
**Branch:** v3.0-dev  
**Current Version:** v3.8.4

---

## 📊 WAAR STAAN WE?

### ✅ Recent Voltooid (v3.8.3 - v3.8.4)
1. **Sensor History Modal** - Complete with:
   - 219 sensors uit SQLite database
   - 3-tier status badges (groen/oranje/rood)
   - DateTime display (datum + tijd)
   - Recalculated duration (JavaScript, not DB)
   - Chronological index (#1-219)
   
2. **Brutalist Paper/Ink Theme** - Consistent across app
3. **Phase 2A & 2B** - Sensor integration complete

### 🚧 In Progress
Phase 3 bugs remain:
1. Comparison date validation failing
2. ProTime workday persistence issues  
3. Cartridge change rendering not showing

### 📋 Phase Status (from V3_IMPLEMENTATION_GUIDE.md)

**PHASE 1: Storage Schema ✅ DONE**
- v3.0-dev branch created
- IndexedDB schema updated to v3
- Month-bucketing implemented

**PHASE 2: Migration & Events ✅ MOSTLY DONE**
- CSV upload to v3 working
- Event storage (sensors, cartridges) working
- Sensor database integration ✅
- Cartridge detection needs debugging 🐛

**PHASE 3: UI Integration ⚠️ PARTIAL**
- Date range selection ✅
- Comparison mode 🐛 (date validation bug)
- Export working ✅
- ProTime workdays 🐛 (persistence bug)

**PHASE 4: Direct CSV → V3 ⏳ NOT STARTED**
- Bypass localStorage entirely
- Direct IndexedDB from CSV
- Sensor SQLite → IndexedDB migration

---

## 🎯 IMMEDIATE PRIORITIES (Next Session)

### PRIORITY 1: Test CSV Preparation
**File:** `/Users/jomostert/Documents/Diabetes Care/26okt/Jo Mostert 26-10-2025_sample14d.csv`

**Tasks:**
1. **Anonimiseer CSV**
   - Patient naam → "Test Patient" / "Jan Jansen"
   - Device serial → "XXXXXXXX"
   - Persoonlijke notities → generic text
   - Bewaar structuur volledig

2. **Introduceer Edge Cases**
   - Sensor gap mid-day (simulate premature failure)
   - Cartridge change zonder alert (manual detection test)
   - Missing glucose readings (data gaps)
   - Duplicate timestamps (deduplication test)
   - Out-of-order timestamps (sorting test)
   - Extreme glucose values (54 mg/dL, 400 mg/dL)
   - Midnight boundary readings (cross-day test)
   - Leap year date if applicable

3. **Save Gemanipuleerde Versie**
   - Naam: `Jo_Mostert_14d_TEST_SAMPLE_anonymized.csv`
   - Locatie: `/Users/jomostert/Documents/Projects/agp-plus/test-data/`
   - Documenteer edge cases in README

**Output:**
- Anonieme test CSV met alle edge cases
- README.md met legenda van geïntroduceerde scenarios
- Ready for comprehensive app testing

---

### PRIORITY 2: Data Cleanup Functionaliteit

**Requirement:** Gebruiker moet data kunnen verwijderen zonder alles te deleten

**Design:**

```
┌─────────────────────────────────────────┐
│  DATA OPRUIMEN                          │
├─────────────────────────────────────────┤
│                                         │
│  ⚠️ WAARSCHUWING                        │
│  Deze actie verwijdert glucose data    │
│  maar behoudt sensor informatie        │
│                                         │
│  Periode: [14 dagen ▼] [Bevestigen]    │
│           - 14 dagen                    │
│           - 30 dagen                    │
│           - Custom bereik...            │
│                                         │
│  ☐ Inclusief cartridge changes         │
│                                         │
│  [OPRUIMEN] [Annuleren]                 │
└─────────────────────────────────────────┘
```

**Functionaliteit:**

**1. Verwijder Glucose Readings**
- Alleen readings uit geselecteerde periode
- Default: laatste 14 dagen
- Opties: 14d / 30d / custom date range

**2. Verwijder Cartridge Changes** (optioneel)
- Checkbox: "Inclusief cartridge changes"
- Default: UIT (behoud cartridge data)
- Kunnen makkelijk opnieuw geïmporteerd

**3. BEHOUD Sensor Database**
- Sensor informatie NOOIT verwijderen
- SQLite database blijft intact
- Geen duplicaten bij re-import

**Implementation Plan:**

**Files to Create:**
```
src/components/DataCleanupModal.jsx       - UI component
src/core/cleanup-engine.js                - Pure functions
src/hooks/useDataCleanup.js               - React hook
```

**Functions Needed:**

```javascript
// cleanup-engine.js
export function calculateAffectedData(dateRange) {
  // Count readings, events in range
  // Return preview stats
}

export async function cleanupGlucoseData(dateRange, options) {
  // Delete readings from IndexedDB
  // Optionally delete cartridge events
  // Preserve sensor database
  // Invalidate cache
  // Return summary
}
```

**UI Flow:**
1. Button in header/settings: "DATA OPRUIMEN"
2. Modal opens with period selector
3. Preview shows: "X readings, Y cartridge events"
4. Checkbox: Include cartridge data?
5. Confirm button6. User confirms
7. Cleanup executes with progress indicator
8. Summary: "Verwijderd: 2,016 readings, 3 cartridge events"
9. Cache rebuild automatically

**Edge Cases:**
- [ ] What if cleanup removes ALL data? → Warning
- [ ] What if custom range is invalid? → Validation
- [ ] What if cleanup fails mid-operation? → Rollback?
- [ ] What about comparisons using deleted data? → Invalidate

**Testing:**
- [ ] Delete 14d → verify only those days gone
- [ ] Custom range → verify exact dates
- [ ] Preserve sensors → verify database intact
- [ ] Re-import same CSV → deduplication works
- [ ] Comparisons update correctly

---

### PRIORITY 3: Fix Phase 3 Bugs (from Roadmap)

**Bug 1: Comparison Date Validation**
- File: `src/hooks/useComparison.js`
- Issue: Previous period calculation fails silently
- Fix: Add date range validation before query
- Test: Previous period outside dataset → show helpful error

**Bug 2: ProTime Workday Persistence**
- File: `src/hooks/useMasterDataset.js`
- Issue: Workdays don't survive page reload
- Fix: Ensure `await updateMetadata(metadata)`
- Test: Import workdays → reload → verify present

**Bug 3: Cartridge Change Rendering**
- File: `src/components/DayProfileCard.jsx`
- Issue: Orange dashed lines not showing
- Fix: Debug SVG coordinates and filter condition
- Test: Known cartridge change → verify orange line visible

---

## 🗺️ COMPLETE ROADMAP STATUS

### Week 1 (Q4 2025 Roadmap)
- [ ] P1-1: Console.log cleanup sweep
- [ ] P1-2: Version number consistency audit
- [ ] P1-3: PROJECT_BRIEFING enhancement

### Week 2
- [ ] P2-1: Fix comparison date validation ⬆️ (Priority 3)
- [ ] P2-2: Fix ProTime workday persistence ⬆️ (Priority 3)
- [ ] P2-3: Debug cartridge change rendering ⬆️ (Priority 3)
- [ ] P2-4: Clean up backup files
- [ ] P2-5: Remove .gitkeep files
- [ ] P2-6: Add performance benchmarks
- [ ] P2-7: Update documentation read times
- [ ] P2-8: Clarify console.log policy

### Week 3-4
- Advanced features (sensor timeline, Y-axis scaling)
- Documentation polish
- Performance optimization

---

## 📦 DIVIDE & CONQUER STATUS

Based on `IMPROVEMENT_ROADMAP_2025_Q4.md`:

**High Priority (Next 3 Sessions):**
1. ✅ Sensor table improvements (DONE v3.8.4)
2. 🎯 Test CSV preparation (Priority 1)
3. 🎯 Data cleanup feature (Priority 2)
4. 🐛 Phase 3 bug fixes (Priority 3)

**Medium Priority (Week 2-3):**
- Console.log cleanup
- Version consistency
- Documentation improvements
- Backup file cleanup

**Low Priority (Week 4):**
- Performance benchmarks
- Read time updates
- Advanced UI features

---

## 🎯 ACTIONABLE NEXT STEPS

**Voor nieuwe chat:**

1. **Start met Test CSV Manipulatie**
   ```bash
   # Lees origineel
   DC: read_file /Users/jomostert/Documents/Diabetes Care/26okt/Jo Mostert 26-10-2025_sample14d.csv
   
   # Anonimiseer + edge cases
   # Save als test sample
   ```

2. **Dan Data Cleanup Feature**
   - Design DataCleanupModal component
   - Implement cleanup-engine.js
   - Hook up to UI
   - Test thoroughly

3. **Fix Phase 3 Bugs**
   - Comparison validation
   - ProTime persistence
   - Cartridge rendering

4. **Console Cleanup Sweep**
   - grep -r "console.log" src/
   - Remove systematically
   - Keep only console.error

---

## 📚 KEY DOCUMENTS

**Current State:**
- CHANGELOG.md → v3.8.4 entry
- V3_ARCHITECTURE.md → Overall design
- V3_IMPLEMENTATION_GUIDE.md → Phase roadmap
- MASTER_INDEX_V3_8.md → Quick reference

**Archived:**
- IMPROVEMENT_ROADMAP_2025_Q4.md → Week-by-week plan
- PHASE_2_COMPLETE.md → Sensor integration done
- PROJECT_BRIEFING_V3_8_IMPROVED.md → Enhanced briefing draft

---

## 🚀 READY FOR NEXT SESSION

**Server Status:** localhost:3001 running  
**Branch:** v3.0-dev (up to date)  
**Git:** Clean working directory  
**Version:** v3.8.4  

**First Action:**
```
"Lees de test CSV en maak een geanonimiseerde versie met edge cases"
```

---

**Handoff Complete** ✅  
**Status:** Ready for new chat  
**Focus:** Test data + cleanup feature + bug fixes
