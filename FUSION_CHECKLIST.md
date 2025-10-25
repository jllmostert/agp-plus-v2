# AGP+ v3.0 FUSION - Implementation Checklist

**Codenaam:** 🔮 FUSION  
**Branch:** v3.0-dev  
**Strategy:** Divide and Conquer - Kleine testbare stappen

---

## ✅ PHASE 1: STORAGE FOUNDATION (COMPLETE)

### 1.1 Git Setup
- [x] Create v3.0-dev branch from main
- [x] Push to GitHub
- [x] Add dev warning to README
- [x] Test branch switching workflow

### 1.2 IndexedDB Schema
- [x] Create `src/storage/db.js`
- [x] Define 6 stores (2 v2.x + 4 new)
- [x] Add indexes (timestamp, confirmed, etc.)
- [x] Write helper functions (getAllRecords, putRecord, etc.)
- [x] Test DB creation in browser

### 1.3 Master Dataset Storage
- [x] Create `src/storage/masterDatasetStorage.js`
- [x] Implement `groupByMonth()` function
- [x] Implement `appendToMonthBucket()` with deduplication
- [x] Implement `appendReadingsToMaster()` entry point
- [x] Implement `rebuildSortedCache()` function
- [x] Implement `loadOrRebuildCache()` lazy eval
- [x] Implement `invalidateCache()` function
- [x] Implement `getMasterDatasetStats()` for debugging

### 1.4 Event Storage
- [x] Create `src/storage/eventStorage.js`
- [x] Implement `generateEventId()` (idempotent IDs)
- [x] Implement `storeSensorChange()`
- [x] Implement `storeCartridgeChange()`
- [x] Implement `getSensorChangesInRange()`
- [x] Implement `getCartridgeChangesInRange()`
- [x] Implement `getEventsForDay()`
- [x] Implement `toggleEventConfirmation()`
- [x] Implement `getEventStats()`

### 1.5 Documentation
- [x] Write `docs/V3_ARCHITECTURE.md`
- [x] Write `docs/GIT_WORKFLOW_V3.md`
- [x] Write `MIGRATING_TO_V3.md`
- [x] Write `V3_PROGRESS.md`
- [x] Write `SESSION_SUMMARY.md`
- [x] Write `PROJECT_BRIEFING_V3_0_FUSION.md`
- [x] Write `FUSION_CHECKLIST.md` (this file)

---

## ✅ PHASE 2: MIGRATION SCRIPT (COMPLETE!)

### 2.1 Migration Foundation
- [x] Create `src/storage/migrations/` directory
- [x] Create `migrateToV3.js` file
- [x] Import storage functions
- [x] Add version check logic

### 2.2 Core Migration Logic
- [x] Function: `checkIfMigrated()` - Check schema version
- [x] Function: `loadV2Uploads()` - Get all v2.x uploads
- [x] Function: `migrateReadings()` - Process each upload
- [x] Function: `backfillEvents()` - Detect historical events ✅
- [x] Function: `markMigrationComplete()` - Set version flag

### 2.3 Migration Testing
- [x] Test: Fresh install (no v2.x data) ✅
- [x] Test: Single upload migration ✅
- [x] Test: Multiple uploads (3 uploads tested) ✅
- [x] Test: Deduplication (72,707 → 28,387 readings) ✅
- [x] Test: Performance (0.37s for 3 uploads) ✅
- [x] Test: Event detection (3 sensors, 32 cartridges) ✅
- [x] Test: Migration idempotency (verified)

### 2.4 Error Handling
- [x] Handle corrupted v2.x data
- [x] Handle partial migrations (resume capability)
- [x] Handle missing uploads store
- [x] Handle invalid dates in CSV data
- [x] Rollback on critical errors (resetMigration function)
- [x] Comprehensive error logging

---

## ⏳ PHASE 3: REACT INTEGRATION (IN PROGRESS - 70%)

### 3.1 Master Dataset Hook
- [x] Create `src/hooks/useMasterDataset.js`
- [x] State: cache, isLoading, error
- [x] Function: `loadCache()` on mount
- [x] Function: `filterByDateRange(start, end)`
- [x] Function: `refreshCache()` manual rebuild
- [x] Export: { readings, stats, isLoading, error, setDateRange, refresh }
- [x] Test with MasterDatasetTest component

### 3.2 Migration Banner Component
- [x] Create `src/components/MigrationBanner.jsx`
- [x] State: migrationStatus (checking/migrating/complete)
- [x] UI: Progress indicator during migration
- [x] UI: Success message with stats
- [x] UI: Auto-dismiss after 3 seconds
- [x] Function: Auto-detect and trigger migration
- [x] Function: needsMigration() export in migrateToV3.js
- [x] Style: Brutalist design (3px borders, monospace)
- [x] Test: Verified auto-migration works

### 3.3 Date Range Filter Component
- [x] Create `src/components/DateRangeFilter.jsx`
- [x] Input: Start date picker
- [x] Input: End date picker
- [x] Presets: Last 7/14/30/90 days + All Time
- [x] Toggle: Quick ranges vs Custom range
- [x] Validation: Start < End
- [x] Callback: `onChange(startDate, endDate)`
- [x] Display: Current dataset range info
- [x] Style: Brutalist design (3px borders, high contrast)
- [x] Test: Verified filtering works with hook

### 3.4 AGPGenerator Integration
- [ ] Import `useMasterDataset` instead of `useCSVData`
- [ ] Add DateRangeFilter component to UI
- [ ] Update data flow: cache → metrics → display
- [ ] Handle loading state (show spinner)
- [ ] Handle error state (show error)
- [ ] Test: Date range filtering affects AGP display

### 3.5 Metrics Hook Update
- [ ] Modify `src/hooks/useMetrics.js` (if needed)
- [ ] Accept filtered readings from useMasterDataset
- [ ] Test: Different date ranges produce correct TIR

---

## ⏳ PHASE 4: DEVICE EVENTS INTEGRATION (2 hours)

### 4.1 Event Detection in Upload
- [ ] Modify upload handler to detect events
- [ ] Call `storeSensorChange()` for each gap
- [ ] Call `storeCartridgeChange()` for each Rewind
- [ ] Log event detection in console

### 4.2 Event Display in Day Profiles
- [ ] Modify `DayProfileCard.jsx`
- [ ] Call `getEventsForDay(date)` for each card
- [ ] Render sensor change marker (red dashed line)
- [ ] Render cartridge change marker (orange dotted line)
- [ ] Test: Events appear at correct times

### 4.3 Event Manager UI (Optional)
- [ ] Create `src/components/EventManager.jsx`
- [ ] List all sensor events with timestamps
- [ ] List all cartridge events with timestamps
- [ ] Toggle confirmed/false positive buttons
- [ ] Filter: Show all / Confirmed only
- [ ] Stats: Total events, date range

---

## ⏳ PHASE 5: TESTING & POLISH (2 hours)

### 5.1 Data Integrity Testing
- [ ] Test: Upload same CSV 3 times → no duplicates
- [ ] Test: Upload overlapping CSVs → correct merge
- [ ] Test: Upload out-of-order (Oct, Dec, Nov) → correct sort
- [ ] Test: Delete bucket, re-upload → data restored

### 5.2 Performance Testing
- [ ] Measure: Append 30k readings (1 month)
- [ ] Measure: Rebuild cache (500k readings)
- [ ] Measure: Calculate metrics on full dataset
- [ ] Measure: Filter by date range
- [ ] Measure: Load on mount (cold start)
- [ ] Document: Actual vs target performance

### 5.3 Rollback Testing
- [ ] Test: v3.0 → v2.x downgrade (uploads still work?)
- [ ] Test: v2.x → v3.0 → v2.x → v3.0 (multiple switches)
- [ ] Verify: v2.x stores untouched by v3.0

### 5.4 User Experience Polish
- [ ] Migration: Clear progress messages
- [ ] Migration: Success message with stats
- [ ] Loading: Spinner during cache rebuild
- [ ] Error: Helpful error messages
- [ ] Performance: No UI freezes during operations

### 5.5 Code Cleanup
- [ ] Remove all console.log() debug statements
- [ ] Add comprehensive inline comments
- [ ] Update version numbers to 3.0.0
- [ ] Run linter (if available)
- [ ] Check for TODOs and FIXMEs

---

## ⏳ PHASE 6: DOCUMENTATION & RELEASE (1 hour)

### 6.1 Documentation Updates
- [ ] Update `README.md` (v3.0 features)
- [ ] Update `CHANGELOG.md` (v3.0.0 entry)
- [ ] Create `docs/V3_USER_GUIDE.md`
- [ ] Update `V3_PROGRESS.md` (mark complete)
- [ ] Archive v2.x docs to `docs/archive/`

### 6.2 Git Cleanup
- [ ] Final commit on v3.0-dev
- [ ] Merge v3.0-dev → main
- [ ] Resolve any conflicts
- [ ] Tag v3.0.0
- [ ] Push main + tags
- [ ] Delete v3.0-dev branch (optional)

### 6.3 Release Notes
- [ ] Write release announcement
- [ ] List breaking changes
- [ ] List new features
- [ ] Migration instructions
- [ ] Known issues (if any)

---

## 📊 PROGRESS SUMMARY

```
Phase 1: Storage Foundation     ████████████████████ 100% ✅
Phase 2: Migration Script        ████████████████████ 100% ✅
Phase 3: React Integration       █████████████░░░░░░░  70% ⏳ IN PROGRESS
Phase 4: Device Events           ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: Testing & Polish        ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: Documentation & Release ░░░░░░░░░░░░░░░░░░░░   0%

Overall Progress: 45.0% (Phase 1, 2 complete + Phase 3 70%)
```

---

## 🎯 CURRENT FOCUS

**Phase 2: COMPLETE!** ✅🎉

**Next Task:** Phase 3.1 - Create `useMasterDataset` hook

**Achievements:**
- ✅ 28,387 readings migrated (0.37s)
- ✅ 3 sensors detected
- ✅ 32 cartridge changes detected
- ✅ Perfect deduplication
- ✅ All tests passing

**Ready for Phase 3!** 🚀

---

## 💡 TESTING STRATEGY

### Test Each Phase Independently

**Phase 2 Testing:**
```javascript
// Direct function calls in browser console
import { migrateToV3 } from './storage/migrations/migrateToV3.js';
await migrateToV3();
// Check: IndexedDB for migrated data
```

**Phase 3 Testing:**
```javascript
// Manual UI testing
// 1. Upload CSV → see migration banner
// 2. Wait for migration → see success
// 3. Change date range → see filtered data
```

**Phase 4 Testing:**
```javascript
// Visual verification
// 1. Upload CSV with gaps
// 2. Open day profiles
// 3. Verify event markers appear
```

### Create Test Datasets

**Small:** 1 month, 1 sensor change  
**Medium:** 6 months, 5 sensor changes  
**Large:** 3 years, 30+ sensor changes

---

## 🚨 BLOCKERS & RISKS

### Known Risks

1. **Migration too slow** - May need progress bar
2. **Memory overflow** - May need streaming for large datasets
3. **IndexedDB quota** - Browser may limit storage
4. **Date parsing errors** - CSV format inconsistencies

### Mitigation Plans

1. Show progress, allow cancellation
2. Process in chunks if needed
3. Check quota before migration, warn user
4. Robust error handling in parser

---

## 📝 NOTES

### Git Workflow Reminder

```bash
# Daily workflow
git checkout v3.0-dev
git pull origin v3.0-dev
# ... make changes ...
git add .
git commit -m "feat: implement X"
git push origin v3.0-dev

# Update checklist
# Mark tasks complete in FUSION_CHECKLIST.md
git add FUSION_CHECKLIST.md
git commit -m "docs: update fusion checklist"
git push origin v3.0-dev
```

### Commit Message Format

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `test:` - Tests only
- `refactor:` - Code refactor
- `perf:` - Performance improvement

---

**Last Updated:** October 25, 2025 - 23:45 CET  
**Next Update:** After Phase 2 complete
