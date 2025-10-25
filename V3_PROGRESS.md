# AGP+ v3.0 Development Progress

**Branch:** v3.0-dev  
**Started:** October 25, 2025  
**Status:** Phase 1 Complete ✅

---

## ✅ COMPLETED

### Documentation (on main branch)
- [x] `docs/V3_ARCHITECTURE.md` - Technical architecture overview
- [x] `docs/GIT_WORKFLOW_V3.md` - Branch management tutorial
- [x] `MIGRATING_TO_V3.md` - User-facing migration guide

### Git Setup
- [x] Created `v3.0-dev` branch from main (v2.2.1)
- [x] Added development warning banner to README
- [x] Pushed to GitHub

### Phase 1: Storage Foundation
- [x] `src/storage/db.js` - IndexedDB v3 schema with 6 stores
- [x] `src/storage/masterDatasetStorage.js` - Month-bucketing + caching
- [x] `src/storage/eventStorage.js` - Device event persistence

**Commit:** `b5a678e` - "feat: add v3.0 IndexedDB schema and storage engines"

---

## 🚧 NEXT STEPS

### Phase 2: Migration Script (2-3 hours)

**File to create:** `src/storage/migrations/migrateToV3.js`

**What it does:**
1. Check if already migrated (version check)
2. Load all v2.x uploads from 'uploads' store
3. Extract readings from each upload
4. Call `appendReadingsToMaster()` for each
5. Backfill device events (sensor/cartridge)
6. Rebuild cache
7. Mark migration complete

**Test with:**
- Fresh install (no v2.x data)
- 1 upload (small dataset)
- 10+ uploads (realistic scenario)
- Measure performance

### Phase 3: React Integration (3-4 hours)

**Files to create:**
1. `src/hooks/useMasterDataset.js` - Master dataset state
2. `src/components/MigrationBanner.jsx` - Migration UI
3. `src/components/DateRangeFilter.jsx` - Filter UI

**Files to modify:**
1. `src/components/AGPGenerator.jsx` - Use useMasterDataset
2. `src/hooks/useMetrics.js` - Accept date range

### Phase 4: Testing & Polish (2 hours)

- [ ] Test with real 3-year CSV data
- [ ] Performance profiling
- [ ] Bug fixes
- [ ] Documentation updates

---

## 📊 ARCHITECTURE SUMMARY

### Storage Schema (IndexedDB v3)

```
agp-plus-db (v3)
├── uploads (v2.x compat)
├── settings (v2.x compat)
├── readingBuckets (NEW) - Month-keyed glucose data
├── sensorEvents (NEW) - Persistent sensor changes
├── cartridgeEvents (NEW) - Persistent cartridge changes
└── masterDataset (NEW) - Cached merged data
```

### Data Flow

```
CSV Upload
    ↓
appendReadingsToMaster()
    ↓
Group by month → Append to buckets → Deduplicate
    ↓
invalidateCache()
    ↓
User accesses data
    ↓
loadOrRebuildCache()
    ↓
Pass to existing engines (metrics-engine.js)
    ↓
Render UI
```

### Deduplication Strategy

- **Key:** Timestamp (milliseconds)
- **Rule:** Keep FIRST reading
- **Conflict:** Log if values differ >1 mg/dL
- **Result:** Idempotent (re-upload same CSV = no duplicates)

---

## 🔧 KEY DECISIONS MADE

### 1. Git Branching
**Choice:** Long-lived `v3.0-dev` branch  
**Why:** Clear separation, safe experimentation, easy v2.x maintenance

### 2. Storage Technology
**Choice:** IndexedDB (vanilla, no Dexie)  
**Why:** Already familiar, no new dependencies, perfect scale

### 3. Bucketing Strategy
**Choice:** Month buckets (YYYY-MM)  
**Why:** Fast append, reasonable count (36 for 3 years), natural mental model

### 4. Cache Strategy
**Choice:** Lazy evaluation + IndexedDB persistence  
**Why:** Fast load between sessions, rebuild only when dirty

### 5. Backward Compatibility
**Choice:** Keep v2.x 'uploads' store intact  
**Why:** Rollback safety, audit trail, debug capability

---

## 🎯 SUCCESS METRICS

**Phase 1 Goals (ACHIEVED):**
- ✅ Schema supports 3+ years of data
- ✅ Deduplication prevents duplicates
- ✅ Month-bucketing enables fast append
- ✅ Event storage with idempotent IDs
- ✅ Cache management for performance

**Overall v3.0 Goals:**
- [ ] Load 3 years data in <3 seconds
- [ ] Append new month in <1 second
- [ ] Zero data loss during migration
- [ ] Rollback to v2.x works
- [ ] User-friendly migration UI

---

## 📝 NOTES FOR NEXT SESSION

### Testing Strategy

Create test scenarios:
1. **Empty database** - Fresh v3.0 install
2. **Single v2.x upload** - Simple migration
3. **Multiple uploads** - Realistic scenario
4. **Overlapping uploads** - Test deduplication
5. **3 years data** - Performance test

### Performance Checkpoints

Measure:
- Time to append 30k readings (1 month)
- Time to rebuild cache (500k readings)
- Time to query by date range
- Memory usage with full dataset

### Migration Edge Cases

Handle:
- Corrupted v2.x data
- Partial uploads
- Missing timestamps
- Invalid glucose values

---

## 🚀 TO START NEXT SESSION

```bash
# 1. Switch to v3.0-dev branch
git checkout v3.0-dev

# 2. Pull latest changes
git pull origin v3.0-dev

# 3. Read this progress doc
view /Users/jomostert/Documents/Projects/agp-plus/V3_PROGRESS.md

# 4. Continue with Phase 2 (migration script)
```

---

**Last Updated:** October 25, 2025 - 23:15 CET  
**Next Milestone:** Migration script + testing  
**ETA for v3.0.0:** December 2025
