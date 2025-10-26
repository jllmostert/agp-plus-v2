# AGP+ v3.0 FUSION - Project Briefing

**Version:** 3.0.0-dev  
**Codenaam:** FUSION (Full Unified Storage Integration)  
**Branch:** v3.0-dev  
**Status:** Phase 1 Complete ✅ | Phase 2 Starting  
**Last Updated:** October 25, 2025

---

## 🎯 MISSION

Transform AGP+ from single-upload analyzer to multi-year incremental dataset manager.

**User Problem:**
- v2.x: Upload one CSV, analyze that period only, repeat for each month
- ProTime per-upload (workdays reset each upload)
- No persistent device event tracking
- Can't see longitudinal trends across years

**v3.0 Solution:**
- Merge ALL uploads into master dataset automatically
- Global date-based ProTime (workdays apply to calendar dates)
- Persistent sensor/cartridge change database
- Filter any date range from complete history
- Upload incrementally, data accumulates

---

## 🏗️ ARCHITECTURE OVERVIEW

### Three-Layer Model (Preserved from v2.x)

```
COMPONENTS (React UI, presentation only)
    ↓ call
HOOKS (State management, orchestration)
    ↓ call
ENGINES (Pure business logic, no React)
    ↓ use
STORAGE (IndexedDB persistence)
```

**CRITICAL:** This separation MUST be maintained in v3.0.

### Storage Schema (IndexedDB v3)

```
agp-plus-db (version 3)
├── uploads (v2.x compat) - Original upload metadata
├── settings (v2.x compat) - Active upload, patient info
├── readingBuckets (NEW) - Month-keyed glucose readings
├── sensorEvents (NEW) - Persistent sensor changes
├── cartridgeEvents (NEW) - Persistent cartridge changes
└── masterDataset (NEW) - Cached merged sorted array
```

**Design Decision:** Keep v2.x stores for rollback safety.

---

## 💾 STORAGE LAYER DETAILS

### Month-Bucketing Strategy

**Why months?**
- 1 month ≈ 2,000-3,000 readings (manageable to sort)
- 3 years = 36 buckets (reasonable DB query count)
- Natural mental model (users think in months)
- Fast append (sort 2k, not 500k)

**Bucket Structure:**
```javascript
{
  monthKey: "2025-10",  // YYYY-MM (primary key)
  readings: [
    {
      timestamp: Date,
      glucose: number,
      sensorGlucose: number,
      insulin: number,
      alarm: string,
      sourceFile: "carelink-2025-10.csv"
    }
  ],
  count: 2134,
  dateRange: { min: Date, max: Date },
  lastUpdated: Date
}
```

### Deduplication Algorithm

**Problem:** User re-uploads same CSV multiple times.

**Solution:** Idempotent by timestamp
```javascript
// Keep FIRST reading by timestamp
if (!existingMap.has(timestamp)) {
  bucket.readings.push(reading);
}

// If values differ significantly, log warning
if (Math.abs(existing.glucose - reading.glucose) > 1) {
  console.warn('Conflict detected');
  // Keep first, log conflict
}
```

**Result:** Re-uploading same CSV = no duplicates, conflicts logged.

### Cache Management

**Problem:** 500k readings is too large to query every time.

**Solution:** Lazy-evaluated cached sorted array
```javascript
masterDataset: {
  id: "cache",
  allReadings: [...],  // Sorted by timestamp
  dateRange: { min, max },
  isDirty: false,      // Needs rebuild?
  lastUpdated: Date,
  version: "3.0.0"
}
```

**Flow:**
1. User uploads CSV → append to buckets → mark cache dirty
2. User opens AGP view → check cache → rebuild if dirty
3. Cache rebuilt → flatten all buckets → sort → save
4. Next access → use cached array (fast!)

---

## 🔄 DATA FLOW

### Upload Flow (v3.0)

```
User uploads CSV
    ↓
parseCSV() (existing v2.x parser)
    ↓
appendReadingsToMaster(readings, filename)
    ↓
groupByMonth(readings)
    ↓
For each month:
  appendToMonthBucket(monthKey, readings, filename)
    ↓
  Load existing bucket (or create new)
    ↓
  Deduplicate by timestamp
    ↓
  Sort bucket
    ↓
  Save bucket
    ↓
invalidateCache()
```

### Query Flow (v3.0)

```
User selects date range (Oct-Nov 2025)
    ↓
loadOrRebuildCache()
    ↓
Check if cache.isDirty
    ↓
If dirty: rebuildSortedCache()
  - Load all month buckets
  - Flatten to single array
  - Sort by timestamp
  - Save cache
    ↓
If not dirty: return cached allReadings
    ↓
Filter by date range
    ↓
Pass to existing engines (calculateMetrics, generateDayProfiles)
    ↓
Render UI
```

---

## 🎨 KEY FILES IN v3.0

### New Storage Layer

| File | Purpose | LOC | Status |
|------|---------|-----|--------|
| `src/storage/db.js` | IndexedDB schema v3 | 212 | ✅ Done |
| `src/storage/masterDatasetStorage.js` | Month-bucketing engine | 281 | ✅ Done |
| `src/storage/eventStorage.js` | Device events | 184 | ✅ Done |
| `src/storage/migrations/migrateToV3.js` | v2→v3 migration | TBD | ⏳ Phase 2 |

### New React Layer (Phase 3)

| File | Purpose | Status |
|------|---------|--------|
| `src/hooks/useMasterDataset.js` | Master dataset state | ⏳ Phase 3 |
| `src/components/MigrationBanner.jsx` | Migration UI | ⏳ Phase 3 |
| `src/components/DateRangeFilter.jsx` | Date filter UI | ⏳ Phase 3 |

### Modified from v2.x (Phase 3)

| File | Change | Status |
|------|--------|--------|
| `src/components/AGPGenerator.jsx` | Use useMasterDataset | ⏳ Phase 3 |
| `src/hooks/useMetrics.js` | Accept date range | ⏳ Phase 3 |

---

## 🔧 CRITICAL IMPLEMENTATION RULES

### 1. Don't Break Main Branch

**RULE:** v2.x (main branch) must stay 100% functional.

**How:**
- All v3.0 work on `v3.0-dev` branch
- Never merge breaking changes to main until v3.0 complete
- Test v2.x functionality regularly on main

**Worst case:** If migration fails, user starts fresh with v3.0.

### 2. Preserve v2.x Storage

**RULE:** Never delete 'uploads' or 'settings' stores.

**Why:**
- Rollback safety (user can downgrade to v2.x)
- Audit trail (see original upload metadata)
- Debug capability (compare v2 vs v3 processing)

### 3. Maintain Three-Layer Architecture

**RULE:** Components → Hooks → Engines → Storage

**Never:**
- Components calling storage directly
- Engines importing React
- Mixing business logic in components

### 4. Test Incrementally

**RULE:** Test after each phase, not at the end.

**Checkpoints:**
- Phase 1: Test storage functions directly
- Phase 2: Test migration with v2.x data
- Phase 3: Test UI integration
- Phase 4: Full E2E with 3 years data

---

## 📊 PERFORMANCE TARGETS

**With 3 years of data (500k readings):**

| Operation | Target | How |
|-----------|--------|-----|
| Append new month | <1s | Sort 2k readings, not 500k |
| Rebuild cache | <2s | Flatten + sort (mostly sorted) |
| Calculate metrics | <1s | Existing engine, tested with 90 days |
| Filter by date | <100ms | Array.filter on cached array |
| Load on mount | <3s | Load cache from IndexedDB |

**Memory:** ~200 MB for 500k readings in cache (acceptable).

---

## 🚨 CRITICAL SAFETY MEASURES

### Migration Safety

1. **Check version first** - Don't re-migrate
2. **Non-destructive** - v2.x data stays intact
3. **Atomic operations** - All-or-nothing
4. **Progress logging** - User sees what's happening
5. **Rollback possible** - User can downgrade

### Data Integrity

1. **Timestamp is truth** - Primary key for deduplication
2. **Keep first** - Predictable behavior
3. **Log conflicts** - Warn if values differ
4. **Validate dates** - Reject invalid timestamps
5. **Audit trail** - Track sourceFile for each reading

---

## 📚 REFERENCE DOCUMENTS

**Core Documentation:**
- `docs/V3_ARCHITECTURE.md` - Technical architecture
- `docs/GIT_WORKFLOW_V3.md` - Git branch management
- `MIGRATING_TO_V3.md` - User migration guide
- `FUSION_CHECKLIST.md` - Phase-by-phase tasks

**Progress Tracking:**
- `V3_PROGRESS.md` - Development status
- `SESSION_SUMMARY.md` - Last session notes

**v2.x Baseline:**
- `docs/PROJECT_BRIEFING_V2_2_0_PART1.md` - Current architecture
- `docs/MASTER_INDEX_V2_2_0.md` - Quick reference

---

## 🎯 SUCCESS CRITERIA

**v3.0 is ready when:**
- [ ] Migration completes without data loss
- [ ] 3 years data loads in <3 seconds
- [ ] v2.x rollback works
- [ ] All v2.x features still work
- [ ] Date range filtering works
- [ ] Persistent events work
- [ ] No console errors
- [ ] Performance targets met

---

**Next: Read FUSION_CHECKLIST.md for phase-by-phase implementation.**
