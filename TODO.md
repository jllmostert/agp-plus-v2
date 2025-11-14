# AGP+ TODO - Openstaande Taken

**Laatst bijgewerkt**: 2025-11-14 23:50  
**Versie**: v4.2.1  
**Status**: Async refactor compleet, ready for testing

---

## 🧪 PRIORITEIT 1: TESTEN (Onmiddellijk)

### Session 23 - Sensor & Stock Import/Export Tests
**Status**: ⏳ Implementation done, testing pending  
**Time**: 30-45 minuten  

- [ ] Test sensor JSON import met `agp-sensors-2025-11-10.json`
  - Upload bestand via Developer Tools → Import/Export tab
  - Verify: validation info, import statistics
  - Check: sensors verschijnen in SENSOREN panel
  
- [ ] Test stock export → import roundtrip
  - Export stock batches (📤 EXPORT STOCK button)
  - Re-import same file
  - Verify: duplicate detection werkt
  - Check: sensor assignments behouden
  
- [ ] Test duplicate detection
  - Import zelfde sensor JSON file 2x
  - Expected: "0 sensors geïmporteerd, X duplicaten overgeslagen"
  
- [ ] Test sensor reconnection
  - Export stock met assignments
  - Modify sensor_id in JSON
  - Import → should reconnect via lot_number + start_date
  
- [ ] Test op iPad
  - Touch interactions
  - File uploads werken
  - No mobile-specific bugs

---

### Session 26 - Async Refactor Tests
**Status**: ⏳ Implementation done, testing pending  
**Time**: 15-30 minuten  

- [ ] Test DAGPROFIELEN panel
  - Navigate naar day profiles
  - Verify: profiles renderen correct
  - Check: sensor change markers verschijnen op charts
  - Verify: geen console errors
  
- [ ] Test sensor operations in SENSOREN panel
  - Add new sensor
  - Delete sensor
  - Lock/unlock sensor
  - Assign to batch
  - Verify: all async operations werken
  
- [ ] Performance check
  - Monitor: sensors laden één keer (not per day profile)
  - Check: geen memory leaks
  - Verify: smooth UI interactions

---

## 🚀 PRIORITEIT 2: KLEINERE VERBETERINGEN (Optioneel)

### Import/Export Enhancements
**Estimated**: 2-3 uur totaal  

- [ ] Progress indicators voor grote imports (1h)
  - Show progress bar during sensor import
  - Display "X of Y sensors processed"
  
- [ ] Auto-backup vóór import (30min)
  - Automatically export current data
  - Download backup before importing
  
- [ ] Import history log (45min)
  - Track all imports (timestamp, file, results)
  - Show in Developer Tools
  
- [ ] Batch import (1h)
  - Upload multiple files at once
  - Sequential processing met progress

### Stock Management Enhancements
**Estimated**: 1-2 uur totaal  

- [ ] Manual sensor reconnection UI (1h)
  - When auto-reconnect fails
  - Show list of unmatched sensors
  - Allow manual selection
  
- [ ] Undo/rollback functionaliteit (1h)
  - Undo last import
  - Restore previous state

---

## 📊 PRIORITEIT 3: ANALYSE & OPTIMALISATIE (Later)

### MiniMed 780G Settings Analysis
**Status**: ⏳ Reference docs ready, analysis pending  
**Time**: 2-3 uur  
**Documents**: `minimed_780g_ref.md`, `metric_definitions.md`, `DUAL_STORAGE_ANALYSIS.md`

Jo's huidige metrics (15-29 sept):
- TIR: 73% (doel >70%) ✓
- TBR: 1.8% (doel <5%) ✓
- CV: 34.9% (doel ≤36%) ✓
- GMI: 6.8% (doel <7.0%) ✓

**Mogelijke optimalisaties**:
- [ ] Analyse: Current pump settings vs 1800/500-regel
- [ ] Overweeg: Target 100 mg/dL (van 120?)
  - Expected: TIR 73% → 78-80%
  - Risk: TBR 1.8% → 3-4% (nog steeds safe)
- [ ] Check: ISF/CR per tijdsblok (dawn phenomenon)
- [ ] Review: AIT setting (2u vs 3-4u?)

**Deliverable**: Pump settings optimization report met aanbevelingen

---

### Glucose Variability Analysis
**Status**: ⏳ Pending  
**Time**: 1-2 uur  

Current status:
- MAGE: 48.4 mg/dL (excellent, <60) ✓
- MODD: 52.4 mg/dL (goed, <60) ✓

**Future enhancements**:
- [ ] Track MAGE/MODD trends over tijd
- [ ] Correlatie analyse: MAGE vs maaltijdtijden
- [ ] MODD analyse: werkdagen vs weekenden
- [ ] Add CONGA metrics (optioneel)

---

## 🔧 PRIORITEIT 4: TECHNISCHE SCHULD (Nice to Have)

### Code Cleanup
**Estimated**: 1-2 uur  

- [ ] Remove unused handoff files
  - Archive old HANDOFF_*.md documents
  - Keep only recent sessions
  
- [ ] Remove temp files
  - `temp_fix.txt`
  - Other temporary debugging files
  
- [ ] Cleanup test files
  - Archive old test-data CSVs
  - Organize test scripts

### Documentation Updates
**Estimated**: 30-45 minuten  

- [ ] Update README.md
  - Add async refactor completion
  - Update feature list
  
- [ ] Update CHANGELOG.md
  - Add v4.2.1 entry
  - Document async conversion
  
- [ ] Create USER_GUIDE.md (optioneel)
  - How to use import/export features
  - How to use stock management
  - iPad-specific tips

---

## 🎯 PRIORITEIT 5: NIEUWE FEATURES (Toekomst)

### Mobile Optimization
**Status**: 📝 Planned for future  
**Time**: 4-6 uur  

- [ ] iPad touch gestures optimization
- [ ] Mobile-specific UI improvements
- [ ] Offline support met Service Worker
- [ ] Progressive Web App (PWA) setup

### Data Analysis Features
**Status**: 📝 Ideas, not started  

- [ ] Pump basal rate analysis
  - Compare SmartGuard basaal vs manual patterns
  - Identify Max Basal Rate hits
  
- [ ] Insulin-to-carb ratio analysis
  - Per-meal CR effectiveness
  - Time-of-day patterns
  
- [ ] Correction factor (ISF) analysis
  - Post-correction glucose trends
  - Effectiveness per time block

### Advanced Reporting
**Status**: 📝 Future consideration  

- [ ] Weekly summary reports
- [ ] Monthly trend analysis
- [ ] Pump settings comparison over time
- [ ] Export to PDF voor arts

---

## ✅ VOLTOOID (Recent)

### Session 26 (2025-11-14) ✅
- ✅ Day profile engine async cascade gefixt
- ✅ useDayProfiles sensors loading
- ✅ Syntax error fix (optional chaining)
- ✅ 100% async refactor compleet

### Session 25 (2025-11-14) ✅
- ✅ sensorStorage.js → Async IndexedDB
- ✅ useSensors.js → Async hook
- ✅ SensorHistoryPanel.jsx → All handlers async
- ✅ masterDatasetStorage.js fixes
- ✅ DataManagementModal.jsx fixes

### Session 23 (2025-11-14) ✅
- ✅ Enhanced sensor import (JSON + SQLite)
- ✅ Complete stock import/export system
- ✅ Developer Tools integration
- ✅ Sensor reconnection logic

### Session 22 (2025-11-13) ✅
- ✅ iPad import crash analysis
- ✅ IndexedDB migration planning
- ✅ Feature branch setup

---

## 📋 SUMMARY

**Immediate Actions** (1-2 uur):
1. Test sensor/stock import/export features
2. Test async refactor (day profiles + sensor operations)
3. Verify on iPad

**Short Term** (2-4 uur optioneel):
- Import/export enhancements (progress, backup, history)
- MiniMed 780G settings analysis

**Long Term** (8+ uur):
- Mobile optimization
- Advanced reporting
- New analysis features

**Technical Debt** (1-2 uur):
- Code cleanup
- Documentation updates

---

**Current Status**: ✅ All major features implemented, ready for testing  
**Next Recommended Action**: Test import/export features  
**Overall Health**: 🟢 Excellent - stable, feature-complete, well-documented
