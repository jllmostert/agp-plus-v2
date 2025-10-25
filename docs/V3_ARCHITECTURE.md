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

## ✅ IMPLEMENTATION PHASES

### Phase 1: Storage Foundation
- [x] Create v3.0-dev branch
- [ ] Update Dexie schema
- [ ] Build month-bucketing functions

### Phase 2: Migration
- [ ] Build migration script
- [ ] Add device event storage
- [ ] Test with v2.x data

### Phase 3: UI Integration
- [ ] Create useMasterDataset hook
- [ ] Update AGPGenerator
- [ ] Add date range filter

### Phase 4: Release
- [ ] Performance profiling
- [ ] Merge to main
- [ ] Tag v3.0.0
