# AGP+ STATUS

**Version:** v3.0 → v3.1  
**Phase:** Sensor Registration from CSV  
**Date:** 2025-10-30  
**Status:** 🔨 In Development

---

## 🎯 V3.1 OBJECTIVE

Build CSV-based sensor registration system to add new sensors from CareLink exports.

**Current limitation**: 219 sensors imported from SQLite (2022-2025), but no way to register new sensors from CSV files.

---

## 📋 IMPLEMENTATION PHASES

### Phase 1: CSV Section Parser ⏳ TODO
**Module**: `src/core/csvSectionParser.js`

**Tasks**:
- [ ] Auto-detect `Index;Date;Time;` headers (3 occurrences)
- [ ] Split sections: deviceEvents, autoInsulin, sensorGlucose
- [ ] Parse with delimiter auto-detection (; vs ,)
- [ ] Return structured: `{ alerts: [], glucose: [], insulin: [] }`

**Test**: 7d CSV should yield ~460 alerts, ~2000 glucose readings

---

### Phase 2: Gap Analyzer ⏳ TODO
**Module**: `src/core/glucoseGapAnalyzer.js`

**Tasks**:
- [ ] Sort glucose readings by timestamp
- [ ] Calculate Δt between consecutive readings
- [ ] Flag gaps ≥120 min (transmitter charge + warmup)
- [ ] Return: `[{ startTime, endTime, durationMin }]`

**Test**: 7d CSV should detect 2+ gaps (Oct 19, Oct 25)

---

### Phase 3: Cluster-Gap Matcher ⏳ TODO
**Module**: `src/core/sensorDetectionEngine.js`

**Tasks**:
- [ ] Integrate `sensorEventClustering.js` (4h window clusters)
- [ ] Match clusters to gaps (±6h window)
- [ ] Assign confidence: high/medium/low
- [ ] Return candidates: `[{ cluster, gap, confidence, timestamp }]`

**Test**: 7d CSV should produce 2 high-confidence candidates

---

### Phase 4: Registration UI ⏳ TODO
**Component**: `src/components/SensorRegistration.jsx`

**Tasks**:
- [ ] CSV file upload input
- [ ] "Load & Analyse" button
- [ ] Candidates table (timestamp, confidence, actions)
- [ ] Actions: ✓ Confirm | ✗ Ignore | ✂ Split
- [ ] Debug log panel (show clusters + gaps)
- [ ] On confirm: `addSensor()` to IndexedDB

**UI**: Brutalist theme, monospace, 3px borders

---

### Phase 5: Lock System ⏳ TODO
**Module**: `src/storage/sensorStorage.js` (extend)

**Tasks**:
- [ ] Add `locked` field to sensor schema
- [ ] `lockSensorsBeforeDate(cutoff)` function
- [ ] Safe delete: only if `locked = false`
- [ ] UI: Show lock icon for protected sensors

**Lock policy**: Cutoff = start of current month (Oct 1, 2025)

---

## 🧪 TEST PLAN

**Primary testdata**: `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv`
- 2826 lines, 3 sections
- Expected: 2 sensor changes (Oct 19 ~01:00, Oct 25 ~08:00)

**Workflow**:
1. Upload CSV
2. Click "Load & Analyse"
3. Verify 2 candidates detected
4. Confirm both
5. Check IndexedDB: 219 → 221 sensors

**Edge cases**:
- Multiple LOST SIGNAL without gap → ignore
- Gap without alerts → flag as unknown
- Re-upload same CSV → idempotent (no duplicates)

---

## 🔧 EXISTING INFRASTRUCTURE (v3.0)

**Storage**:
- ✅ IndexedDB sensor table (219 sensors loaded)
- ✅ `sensorStorage.js` - CRUD operations
- ✅ `sensorImport.js` - SQLite import

**Logic**:
- ✅ `sensorEventClustering.js` - 4h window alert grouping
- ✅ `sensor-history-engine.js` - Statistics

**UI**:
- ✅ `SensorHistoryModal.jsx` - View 219 sensors
- ✅ `SensorImport.jsx` - SQLite .db import button

---

## 🐛 KNOWN ISSUES

None (clean slate for v3.1)

---

## 📊 METRICS (v3.0 Baseline)

**Sensor database**: 219 sensors (March 2022 - Oct 2025)  
**Success rate**: TBD (calculate from existing sensors)  
**Avg duration**: TBD (calculate from existing sensors)

---

## ✅ COMPLETION CRITERIA

- [ ] CSV parser handles 3-section format
- [ ] Gap analyzer finds ≥120 min dropouts
- [ ] Matcher produces confidence-scored candidates
- [ ] UI allows review + confirm/ignore
- [ ] IndexedDB count increases correctly (219 → 221)
- [ ] Lock system protects old sensors
- [ ] Idempotent re-upload

---

## 🔄 NEXT STEPS

1. Implement Phase 1 (CSV Parser)
2. Test with 7d CSV
3. Implement Phase 2 (Gap Analyzer)
4. Test gap detection accuracy
5. Continue through phases sequentially

---

**Last Updated**: 2025-10-30  
**Current Focus**: Phase 1 - CSV Section Parser  
**Blocker**: None
