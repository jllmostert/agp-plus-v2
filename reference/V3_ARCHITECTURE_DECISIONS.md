---
tier: 3
status: stable
last_updated: 2025-10-25
purpose: Architecture decisions and design rationale for v3.0 master dataset
---

# AGP+ v3.0 Architecture Decisions

**Date:** October 25, 2025  
**Status:** APPROVED  
**Version:** v3.0.0 Planning

---

## 🎯 EXECUTIVE SUMMARY

This document records the architectural decisions made for AGP+ v3.0 incremental master dataset feature.

**Key Decisions:**
1. ✅ Long-lived `v3.0-dev` branch for parallel development
2. ✅ IndexedDB with month-bucketing for storage
3. ✅ Hybrid cache strategy (DB + RAM)
4. ✅ Idempotent event storage with timestamp-based IDs
5. ✅ Automatic one-time migration from v2.x

---

## 1. GIT BRANCHING STRATEGY

### DECISION: Long-lived `v3.0-dev` branch

**Rationale:**
- Clear separation between stable (main) and experimental (v3.0-dev)
- Easy to maintain v2.x with bugfixes while developing v3.0
- Safe experimentation without production consequences
- Natural checkpoint for "work in progress"
- Simpler mental model for solo development

**Implementation:**
```bash
git checkout -b v3.0-dev
git push -u origin v3.0-dev
```

**v2.x Maintenance Strategy:**
- Fix bugs on `main` branch
- Cherry-pick or merge into `v3.0-dev` weekly
- Tag v2.x patches: v2.2.2, v2.2.3, etc.

**Deprecation Timeline:**
- Oct 2025: v2.2.1 stable, create v3.0-dev
- Nov 2025: v3.0 development, v2.x critical bugfixes only
- Dec 2025: v3.0.0 beta testing
- Jan 2026: v3.0.0 release → merge v3.0-dev → main
- Feb 2026: v2.x deprecated (read-only docs)

**Alternatives Considered:**
- ❌ Feature branches from main (too risky for breaking changes)
- ❌ Separate v3 repository (overkill, loses git history)

---

## 2. STORAGE ARCHITECTURE

### DECISION: IndexedDB with month-bucketing + in-memory cache

**Schema Design:**
```javascript
db.version(3).stores({
  // v2.x compatibility
  uploads: '++id, uploadDate, filename',
  patientInfo: 'id',
  
  // v3.0 new stores
  readingBuckets: 'monthKey',  // Key: "YYYY-MM"
  sensorEvents: '++id, timestamp, [timestamp+type]',
  cartridgeEvents: '++id, timestamp, [timestamp+type]',
  masterDataset: 'id'  // Metadata + cache
});
```

**Rationale:**
- Already using Dexie.js successfully in v2.x
- Month-bucketing enables efficient appending (only touch new bucket)
- Compound index on events enables fast date range queries
- No bundle bloat (vs SQL.js at 1MB)
- Perfect scale for 3 years (~36 buckets, 500k readings)

**Alternatives Considered:**
- ❌ SQLite via WASM (1MB bundle, overkill for <1000 events)
- ❌ localStorage (5MB limit, no indexing, fragile)
- ❌ Giant sorted array only (O(n log n) append, memory hungry)

---

## 3. DEDUPLICATION STRATEGY

### DECISION: Idempotent IDs based on timestamp, keep first

**Algorithm:**
```javascript
function generateEventId(timestamp, type) {
  const dateStr = timestamp.toISOString()
    .replace(/[:-]/g, '')
    .split('.')[0];
  return `${type}_${dateStr}`;  // e.g., "sensor_20251015T143000"
}

// IndexedDB put() is idempotent: same ID = update, not duplicate
await db.sensorEvents.put({ id, ...eventData });
```

**Rationale:**
- Same timestamp = same event (5-minute resolution makes collisions unlikely)
- IndexedDB `put()` naturally handles overwrite
- No complex conflict resolution needed
- Logging warnings for glucose value mismatches sufficient

**Conflict Handling:**
- If glucose values differ by >1 mg/dL at same timestamp → log warning
- Keep first (earliest upload wins)
- Future v3.1: Add "Conflict Review" UI if users report issues

**Alternatives Considered:**
- ❌ Keep last (overwrites may hide data issues)
- ❌ Complex merge logic (overkill, adds complexity)
- ❌ Keep both (doubles data, confuses metrics)

---

## 4. METRIC RECALCULATION STRATEGY

### DECISION: Lazy evaluation with aggressive caching

**Implementation:**
```javascript
// Recalculate metrics ONLY when:
1. New upload appended → rebuild cache → recalc
2. Date filter changed → filter array → recalc
3. First mount → load cache → recalc

// DO NOT recalculate on every render (cache in state)
```

**Cache Invalidation:**
```javascript
const cache = {
  allReadings: [],  // Sorted, deduplicated
  lastUpdated: Date,
  isDirty: false  // Set true on append, false after rebuild
};
```

**Rationale:**
- Metrics are expensive (O(n) over 500k readings)
- Data changes infrequently (only on upload)
- Cache hit rate will be >95% in typical usage
- IndexedDB persistence avoids rebuild on every mount

**Performance Targets:**
- Append new month: <1s
- Rebuild cache: <2s (500k readings)
- Calculate metrics: <1s (existing engine)
- Filter by date: <100ms (Array.filter)

**Alternatives Considered:**
- ❌ Recalculate on every render (too slow)
- ❌ Web Worker background recalc (overkill, adds complexity)
- ❌ Incremental metrics (complex, error-prone)

---

## 5. MIGRATION STRATEGY

### DECISION: Automatic one-time migration on first v3.0 launch

**Process:**
1. Detect v2.x data (check schema version in IndexedDB)
2. Load all v2.x uploads
3. Append readings to month buckets
4. Backfill device events
5. Build initial cache
6. Mark migration complete
7. Show success banner to user

**Safety Measures:**
- ✅ v2.x uploads table NOT deleted (preserved for rollback)
- ✅ Migration is idempotent (can run multiple times safely)
- ✅ Downgrade possible (v3.0 → v2.x still works, just no merged view)
- ✅ User sees progress UI (not silent migration)

**Rollback Plan:**
- User can downgrade to v2.x anytime
- v2.x uploads table untouched, individual uploads still work
- v3.0 tables (readingBuckets, events) ignored by v2.x
- No data loss in either direction

**Alternatives Considered:**
- ❌ Manual migration (bad UX, users will forget)
- ❌ Delete v2.x data (risky, no rollback)
- ❌ Run both v2.x and v3.0 modes (too complex)

---

## 6. DEVICE EVENT STORAGE

### DECISION: Dedicated IndexedDB stores with idempotent IDs

**Schema:**
```javascript
sensorEvents: {
  id: 'sensor_20251015_143000',  // Timestamp-based
  timestamp: Date,
  type: 'sensor_change',
  gapMinutes: 240,
  sourceFile: 'carelink-2025-10.csv',
  confirmed: true,  // User can mark false positives
  notes: null
}

cartridgeEvents: {
  id: 'cartridge_20251020_091500',
  timestamp: Date,
  type: 'cartridge_change',
  sourceAlarm: 'Rewind',
  sourceFile: 'carelink-2025-10.csv',
  confirmed: true,
  notes: null
}
```

**Rationale:**
- Persistent across CSV re-uploads (idempotent IDs prevent duplicates)
- User can mark false positives (confirmed flag)
- Fast date range queries (timestamp index)
- Separate stores allow different schemas if needed

**Backfill Strategy:**
- On v2.x → v3.0 migration, detect events from ALL historical uploads
- Store with sourceFile reference for traceability
- ~500 sensor changes for 3 years (tiny dataset, fast queries)

**Alternatives Considered:**
- ❌ Detect on-the-fly (slow, inconsistent)
- ❌ Embed in reading records (couples data, harder to query)
- ❌ JSON in localStorage (no indexing, fragile)

---

## 7. DATA FLOW ARCHITECTURE

### Three-Layer Architecture (PRESERVED from v2.x)

```
┌─────────────────────────────────────────┐
│  COMPONENTS (Presentation)              │
│  AGPGenerator.jsx, DayProfileCard.jsx   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  HOOKS (Orchestration + State)          │
│  useMasterDataset.js, useMetrics.js     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  ENGINES (Pure Business Logic)          │
│  incremental-storage-engine.js          │
│  metrics-engine.js                      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  STORAGE (IndexedDB via Dexie)          │
│  readingBuckets, sensorEvents, cache    │
└─────────────────────────────────────────┘
```

**Critical Rule:** Components NEVER call engines directly.

**Data Flow:**
```
CSV Upload → Parse → Append to Buckets (Storage Layer)
  ↓
Rebuild Cache (Engine)
  ↓
Calculate Metrics (Engine)
  ↓
Update State (Hook)
  ↓
Render UI (Component)
```

---

## 8. PERFORMANCE CONSIDERATIONS

### Expected Load

**3 years of CGM data:**
- 288 readings/day × 1095 days = 315,360 readings (realistic)
- Pessimistic: 500,000 readings (includes gaps, duplicates)
- 36 month buckets
- ~500 sensor changes
- ~200 cartridge changes

**Memory Footprint:**
```javascript
// Single reading: ~100 bytes
{
  timestamp: Date,      // 8 bytes
  glucose: number,      // 8 bytes
  sourceFile: string,   // ~30 bytes
  // ... other fields
}

// 500k readings × 100 bytes = 50 MB in RAM (manageable)
// IndexedDB: ~30 MB compressed
```

**Browser Limits:**
- Chrome IndexedDB: ~1 GB (plenty of headroom)
- Safari IndexedDB: ~500 MB (still plenty)
- RAM: 50 MB is <1% of typical 8GB laptop

### Optimization Strategies

1. **Month-bucketing:** Only load relevant months for filtered views
2. **Lazy cache rebuild:** Only rebuild when isDirty flag set
3. **Memoization:** useMemo for expensive calculations
4. **Pagination:** If >3 years, consider virtualized scrolling

---

## 9. TESTING STRATEGY

### Unit Tests (Future v3.1)

```javascript
// test/incremental-storage-engine.test.js
describe('appendToMonthBucket', () => {
  it('deduplicates by timestamp', async () => {
    // Add same reading twice, should only store once
  });
  
  it('handles out-of-order uploads', async () => {
    // Upload Nov before Oct, should sort correctly
  });
  
  it('logs conflicts for differing glucose values', async () => {
    // Same timestamp, different glucose → warning
  });
});
```

### Manual Test Plan (v3.0 Beta)

- [ ] Upload 3 years of real CSV data
- [ ] Measure performance: append, rebuild, render
- [ ] Test migration from v2.2.1
- [ ] Test downgrade from v3.0 → v2.2.1
- [ ] Verify event deduplication (re-upload same CSV)
- [ ] Check memory usage in Chrome DevTools
- [ ] Test with Safari and Firefox

---

## 10. DOCUMENTATION UPDATES NEEDED

### Files to Create/Update

- [x] `docs/V3_ARCHITECTURE_DECISIONS.md` (this file)
- [ ] `docs/V3_IMPLEMENTATION_GUIDE.md`
- [ ] `docs/MIGRATING_TO_V3.md` (user-facing)
- [ ] `docs/GIT_BRANCH_WORKFLOW.md` (dev guide)
- [ ] Update `README.md` (add v3.0 features)
- [ ] Update `CHANGELOG.md` (v3.0.0 entry)
- [ ] Update `PROJECT_BRIEFING_V3_0.md` (full architecture)

### Code Documentation

- Add JSDoc comments to all new engines
- Add inline comments for complex algorithms
- Add README.md in new directories

---

## 11. RISK ASSESSMENT

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| IndexedDB quota exceeded | Low | High | Monitor usage, add warning at 80% |
| Cache rebuild too slow (>5s) | Medium | Medium | Optimize with Web Worker if needed |
| Migration fails silently | Low | High | Add error handling + rollback |
| Merge conflicts in v3.0-dev | Medium | Low | Weekly merge from main |
| Memory leak with large datasets | Low | Medium | Profile with DevTools, test with 3y data |

### Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users confused by breaking changes | High | Medium | Clear migration UI + docs |
| Users want rollback after migration | Low | Low | v2.x data preserved, downgrade supported |
| Performance issues on older browsers | Medium | Medium | Test on Safari, Firefox, add system requirements |

---

## 12. SUCCESS METRICS

### Technical Success

- ✅ Migration completes in <30s for 3 years data
- ✅ Cache rebuild <2s
- ✅ Metric calculation <1s
- ✅ No console errors
- ✅ Memory usage <100 MB
- ✅ All existing tests pass

### User Success

- ✅ Migration "just works" (no user action required)
- ✅ Merged view displays correctly
- ✅ Incremental uploads seamless
- ✅ ProTime applies to correct dates
- ✅ Day profiles show merged data
- ✅ Print/export works with merged data

---

## 13. LESSONS LEARNED (To be filled post-implementation)

_This section will be updated after v3.0 release based on actual implementation experience._

---

## APPROVAL

**Architect:** Jo Mostert  
**Date:** October 25, 2025  
**Status:** ✅ APPROVED - Ready to implement

**Next Action:** Create v3.0-dev branch and begin Phase 1 (Storage Schema)

---

*Last updated: October 25, 2025*  
*Status: Planning Complete, Implementation Starting*
