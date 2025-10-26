# AGP+ v3.0 Architecture Documentation

**Version:** 3.0.0 (In Development)  
**Last Updated:** October 25, 2025  
**Status:** Implementation Phase

---

## 🎯 OVERVIEW

AGP+ v3.0 transforms from **upload-based** to **incremental master dataset** architecture.

**Key Changes:**
- ✅ Merge multiple uploads by timestamp
- ✅ Month-bucketed storage for efficient appending
- ✅ Persistent device event database
- ✅ Global date-based ProTime
- ✅ 3+ years of data support (~500k readings)

---

## 🏗️ ARCHITECTURAL LAYERS

```
USER INTERFACE
  AGPGenerator.jsx | DayProfilesModal.jsx | SettingsPage.jsx
        ↓
REACT HOOKS LAYER
  useMasterDataset | useMetrics | useDeviceEvents
        ↓
BUSINESS LOGIC (Engines)
  incremental-storage-engine.js | metrics-engine.js
  day-profile-engine.js | event-detection-engine.js
        ↓
STORAGE LAYER (IndexedDB)
  readingBuckets | sensorEvents | cartridgeEvents
  masterDataset (cache) | uploads (v2.x compat)
```

---

## 💾 STORAGE SCHEMA

### Reading Buckets (Month-Based)

```javascript
db.readingBuckets
{
  monthKey: "2025-10",  // Primary key: YYYY-MM
  readings: Array<Reading>,
  count: 1234,
  dateRange: { min: Date, max: Date },
  lastUpdated: Date
}
```

### Device Events

```javascript
db.sensorEvents
{
  id: "sensor_20251015_143000",
  timestamp: Date,
  type: "sensor_change",
  gapMinutes: 240,
  sourceFile: "carelink-2025-10.csv",
  confirmed: true,
  notes: null
}
```

---

## ⚙️ CORE ALGORITHMS

### Append Algorithm

```javascript
async function appendReadingsToMaster(newReadings, sourceFile) {
  // 1. Group by month
  const byMonth = groupByMonth(newReadings);
  
  // 2. Append to each bucket with deduplication
  for (const [monthKey, monthReadings] of byMonth) {
    await appendToMonthBucket(monthKey, monthReadings, sourceFile);
  }
  
  // 3. Invalidate cache
  await invalidateCache();
}
```

**Deduplication:** Keep FIRST reading by timestamp, log conflicts.

---

## 📈 PERFORMANCE TARGETS

| Operation | Target |
|-----------|--------|
| Append new month | <1s |
| Rebuild cache | <2s |
| Calculate metrics | <1s |
| Load on mount | <3s |

---

## 🔔 EVENT DETECTION ARCHITECTURE (Phase 3.6)

### localStorage-Based Event Cache

**Decision:** Use localStorage instead of IndexedDB for device events

**Rationale:**
- Events are small (<1MB JSON)
- Synchronous access = no render lag
- Simple API (getItem/setItem)
- Perfect for scan-once-read-many pattern

### 3-Tier Detection System

**Priority Order:**
1. **Sensor Database** (imported from Sensoren project)
   - Source: master_sensors.db (SQLite)
   - Confidence: HIGH
   - Includes lot numbers, hardware versions

2. **CSV Alerts** ("SENSOR CONNECTED", "Rewind")
   - Source: CSV alert columns
   - Confidence: MEDIUM
   - Real-time device events

3. **Gap Detection** (3-10 hour data gaps)
   - Source: Timestamp analysis
   - Confidence: LOW
   - Fallback for old CSVs

### Event Storage Format

```javascript
// localStorage key: 'agp-device-events'
{
  sensorChanges: [
    {
      date: "2025/10/19",
      timestamp: "2025-10-19T01:01:13Z",
      minuteOfDay: 61,
      source: "database|alert|gap",
      confidence: "high|medium|low",
      lotNumber: "MMT-7030A1.01-2024W37" // optional
    }
  ],
  cartridgeChanges: [
    {
      date: "2025/10/22",
      timestamp: "2025-10-22T17:59:00Z",
      minuteOfDay: 1079
    }
  ],
  version: "1.0",
  lastUpdated: "2025-10-26T15:30:00Z",
  lastScanned: "2025-10-26T15:30:00Z"
}
```

### Detection Flow

```
CSV Upload
    ↓
detectAllEvents(csvData) - ONE TIME SCAN
    ├─ Check sensor database (if imported)
    ├─ Check CSV alerts
    └─ Check data gaps
    ↓
Deduplicate (keep highest confidence per date)
    ↓
storeEvents(events) - CACHE IN LOCALSTORAGE
    ↓
Day Profiles: getEventsForDate(date) - INSTANT LOOKUP
    ↓
Render markers (no detection logic)
```

### JSON Export/Import

**Portable Format:** Events can be exported/imported as `.agp-events.json`

**Benefits:**
- Backup & restore
- Share event annotations
- Version control
- Cross-platform compatible

---

## ✅ IMPLEMENTATION PHASES

### Phase 1: Storage Foundation
- [x] Create v3.0-dev branch
- [x] Update Dexie schema
- [x] Build month-bucketing functions
- [x] Create eventStorage.js (localStorage)
- [x] Create sensorStorage.js (localStorage)

### Phase 2: Migration
- [ ] Build migration script
- [ ] Add device event storage
- [ ] Test with v2.x data

### Phase 3: UI Integration
- [ ] Create useMasterDataset hook
- [ ] Update AGPGenerator
- [ ] Add date range filter

### Phase 3.6: Event Detection (Current)
- [x] SensorImport component
- [x] SQLite parser (sql.js)
- [x] Event storage layer
- [ ] Event detection engine (3-tier)
- [ ] EventManager component
- [ ] JSON export/import
- [ ] Day profile integration

### Phase 4: Release
- [ ] Performance profiling
- [ ] Merge to main
- [ ] Tag v3.0.0
