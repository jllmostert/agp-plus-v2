---
version: v3.1
phase: Sensor Registration Debug Cycle
status: active
date: 2025-10-30
---

# HANDOFF — v3.1 Sensor Registration

## 🎯 Mission

Build CSV-based sensor detection and registration system. Currently: 219 sensors imported from SQLite, no way to add new sensors from CareLink exports.

## 🔧 Server Setup

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

Verify: Terminal shows `VITE vX.Y.Z ready in ...`  
Access: http://localhost:3001

## 📂 Project Context

**Location**: `/Users/jomostert/Documents/Projects/agp-plus`  
**Branch**: main (v3.0 stable)  
**Target**: v3.1 feature addition

**Key paths**:
- `src/core/` - Pure calculation engines
- `src/storage/` - IndexedDB + SQLite modules  
- `src/components/` - React UI
- `test-data/` - Real CSV exports (never modify)

## 🧩 Current State Analysis

### ✅ What Exists

**Storage Layer**:
- IndexedDB schema with sensor table
- 219 sensors loaded (March 2022 - Oct 2025)
- `sensorStorage.js` - CRUD operations
- `sensorImport.js` - SQLite → IndexedDB importer

**Logic Layer**:
- `sensorEventClustering.js` - Groups alerts in 4h windows
- `sensor-history-engine.js` - Stats calculation
- Alert types: SENSOR CONNECTED, CHANGE SENSOR, LOST SIGNAL, UPDATING

**UI Layer**:
- `SensorHistoryModal.jsx` - View 219 sensors
- `SensorImport.jsx` - Import .db file button

### ❌ What's Missing

1. **CSV Section Parser** - Auto-detect 3-section CareLink format
2. **Gap Analyzer** - Find glucose dropouts ≥120 min
3. **Cluster-Gap Matcher** - Correlate alerts + gaps → sensor candidates
4. **Registration UI** - Review/confirm/ignore candidates
5. **Lock System** - Protect old sensors, only edit recent

## 📋 Implementation Tasks

### Phase 1: CSV Section Parser

**File**: `src/core/csvSectionParser.js`

```javascript
export function parseCareLinksections(csvText) {
  // 1. Detect "Index;Date;Time;" header lines (3 occurrences)
  // 2. Split into sections: [deviceEvents, autoInsulin, sensorGlucose]
  // 3. Parse each section with proper delimiter (auto-detect ; vs ,)
  // 4. Return: { alerts: [], glucose: [], insulin: [] }
}
```

**Detection logic**:
- Headers on lines 7, ~467, ~last section
- Divider: `-------;MiniMed 780G MMT-1886;...`
- Section 1: Device events & alerts (INDEX 0-456)
- Section 2: Daily insulin aggregates (skip for now)
- Section 3: 5-min glucose readings (INDEX 457+)

**Test**: `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv` (2826 lines)

### Phase 2: Gap Analyzer

**File**: `src/core/glucoseGapAnalyzer.js`

```javascript
export function detectGlucoseGaps(glucoseReadings, minGapMinutes = 120) {
  // 1. Sort by timestamp
  // 2. Calculate Δt between consecutive readings
  // 3. Flag gaps ≥ minGapMinutes
  // 4. Return: [{ startTime, endTime, durationMin }]
}
```

**Gap types**:
- Transmitter charge: ~30 min
- Sensor warmup: ~120 min (2h)
- **Total gap**: ≥120 min = likely sensor change

### Phase 3: Cluster-Gap Matcher

**File**: `src/core/sensorDetectionEngine.js`

```javascript
export function matchClustersToGaps(clusters, gaps, windowHours = 6) {
  // 1. For each cluster (from sensorEventClustering.js)
  // 2. Find gaps within ±windowHours
  // 3. Score confidence: high/medium/low
  // 4. Return: [{ cluster, gap, confidence, timestamp }]
}
```

**Confidence rules**:
- **High**: SENSOR CONNECTED + nearby gap
- **Medium**: CHANGE SENSOR only, or gap only
- **Low**: LOST SIGNAL clusters (ignore)

**Expected output** (test CSV):
- 2 sensor changes: Oct 19 01:00, Oct 25 08:00

### Phase 4: Registration UI

**File**: `src/components/SensorRegistration.jsx`

```jsx
export default function SensorRegistration() {
  // 1. CSV upload input
  // 2. Parse + analyze on "Load & Analyse"
  // 3. Show candidates table: [timestamp, confidence, actions]
  // 4. Actions: ✓ Confirm | ✗ Ignore | ✂ Split
  // 5. On confirm: addSensor() to IndexedDB
}
```

**UI requirements**:
- Brutalist theme (3px borders, monospace)
- Confidence badges: 🟢 HIGH | 🟡 MEDIUM | 🔴 LOW
- Debug log output (show clusters + gaps)

### Phase 5: Lock System

**Extend**: `src/storage/sensorStorage.js`

```javascript
export async function lockSensorsBeforeDate(cutoffDate) {
  // Set locked = true for all sensors before cutoffDate
}

export async function deleteSensor(sensorId) {
  // Only delete if locked = false
  // Throw error if trying to delete locked sensor
}
```

**Lock policy**:
- Cutoff: Start of current month (e.g., Oct 1, 2025)
- Protected: All 219 existing sensors
- Editable: Only new sensors from current month CSV

## 🧪 Test Workflow

1. Start server (see Setup)
2. Open Chrome DevTools console
3. Navigate to sensor registration UI
4. Upload: `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv`
5. Click "Load & Analyse"
6. Verify: 2 candidates detected
7. Check: Oct 19 01:00 (gap ~140 min)
8. Check: Oct 25 08:00 (CONNECTED + CHANGE + gap)
9. Confirm both → IndexedDB count: 221 sensors

## 🔍 Debug Helpers

**Console log structure**:
```javascript
debug.log('[Module] Action', { data });
```

**Check IndexedDB**:
- Chrome DevTools → Application → IndexedDB → agp-plus-v3 → sensors

**Verify parsing**:
- Log section boundaries (line numbers)
- Log alert count (should be ~460 events in 7d CSV)
- Log glucose count (should be ~2000 readings)

## 📊 Success Criteria

- [ ] Parser detects 3 sections correctly
- [ ] Gap analyzer finds 2+ gaps ≥120 min
- [ ] Matcher produces 2 high-confidence candidates
- [ ] UI shows candidates with correct timestamps
- [ ] Confirm adds sensors to IndexedDB (count: 219 → 221)
- [ ] Lock system prevents deletion of old sensors
- [ ] Idempotent: Re-uploading same CSV doesn't duplicate

## 📚 Reference Docs

**CSV Structure**: `docs/minimed_780g_ref.md` (lines 50-150)  
**Gap Detection**: `docs/metric_definitions.md` (continuity metrics)  
**Alert Types**: `docs/minimed_780g_ref.md` (Section 1 format)

## 🚨 Critical Notes

- **Never modify** test-data files (read-only)
- **Never delete** existing 219 sensors
- **Always chunk** file writes ≤30 lines
- **Use Desktop Commander** for all file ops
- **Test with real data** (no dummy values)

## 🔄 Next Session Handoff

Update this section after implementation:

```markdown
## Latest Progress (Date)

**Completed**:
- Phase X: Module Y implemented
- Tests passed: Z/5

**Blocked**:
- Issue with ...

**Next**:
- Implement Phase X+1
- Debug edge case ...
```

---

**Version**: v3.1-dev  
**Server**: Vite port 3001  
**Focus**: CSV sensor registration  
**Status**: Ready to implement Phase 1
