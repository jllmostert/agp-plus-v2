# AGP+ v3.0 Implementation Guide

**Version:** v3.0.0  
**Status:** Implementation Roadmap  
**Last Updated:** October 25, 2025

---

## 🎯 OVERVIEW

Step-by-step implementation guide for AGP+ v3.0 incremental master dataset feature.

**Total estimated time:** 18-20 hours across 4 weeks

**Phases:**
1. Storage Schema & Git Setup (Week 1)
2. Migration & Event Storage (Week 2)
3. UI Integration (Week 3)
4. Testing & Release (Week 4)

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

Before starting Phase 1, ensure:

- [x] Architecture decisions documented (V3_ARCHITECTURE_DECISIONS.md)
- [x] Git workflow understood (GIT_BRANCH_WORKFLOW.md)
- [ ] v2.2.1 stable and committed
- [ ] All v2.2.1 tests passing
- [ ] Dev server working (http://localhost:5173)
- [ ] No uncommitted changes on main branch

---

## PHASE 1: STORAGE SCHEMA & GIT SETUP

**Duration:** 5 hours  
**Goal:** Create v3.0-dev branch, update IndexedDB schema, build month-bucketing

### Step 1.1: Create v3.0-dev Branch (15 min)

```bash
# Ensure you're on main, up to date
cd /Users/jomostert/Documents/Projects/agp-plus
git checkout main
git pull origin main

# Create v3.0-dev branch
git checkout -b v3.0-dev

# Push to GitHub
git push -u origin v3.0-dev

# Verify
git branch
# Should show: * v3.0-dev
```

### Step 1.2: Update Dexie Schema (30 min)

**File:** `src/storage/db.js`

**Current schema (v2.x):**
```javascript
db.version(2).stores({
  uploads: '++id, uploadDate, filename',
  patientInfo: 'id'
});
```

**New schema (v3.0):**
```javascript
db.version(3).stores({
  // v2.x compatibility (DO NOT REMOVE)
  uploads: '++id, uploadDate, filename',
  patientInfo: 'id',
  
  // v3.0 new stores
  readingBuckets: 'monthKey',  // Key: "YYYY-MM"
  sensorEvents: '++id, timestamp, [timestamp+type]',
  cartridgeEvents: '++id, timestamp, [timestamp+type]',
  masterDataset: 'id'  // Metadata: version, cache
});
```

**Implementation:**

1. Read current db.js
2. Add v3 stores using `edit_block`
3. Test in browser (open DevTools → Application → IndexedDB)

**Desktop Commander commands:**
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/storage/db.js
DC: edit_block file_path="..." old_string="db.version(2).stores({" new_string="db.version(3).stores({"
# (Add new stores)
```

**Validation:**
- [ ] Dev server restarts without errors
- [ ] IndexedDB shows new stores in browser
- [ ] v2.x uploads table still exists

### Step 1.3: Create Storage Engine (2 hours)

**File:** `src/core/incremental-storage-engine.js`

**Functions to implement:**
```javascript
/**
 * Append readings to master dataset with month-bucketing
 */
export async function appendReadingsToMaster(newReadings, sourceFile) {
  // Group by month
  // Append to each bucket
  // Handle deduplication
}

/**
 * Append to specific month bucket with deduplication
 */
async function appendToMonthBucket(monthKey, newReadings, sourceFile) {
  // Load existing bucket
  // Deduplicate by timestamp
  // Sort
  // Save
}

/**
 * Rebuild sorted cache from all buckets
 */
export async function rebuildSortedCache() {
  // Load all buckets
  // Flatten
  // Sort
  // Return cache object
}

/**
 * Invalidate cache (mark dirty)
 */
export async function invalidateCache() {
  // Set isDirty flag in masterDataset store
}

/**
 * Generate idempotent ID from timestamp
 */
function generateReadingId(timestamp) {
  // "20251015T143000"
}
```

**Implementation approach:**
1. Create file with JSDoc skeleton
2. Implement functions one at a time
3. Add console.log for debugging
4. Test each function in browser console

**Testing:**
```javascript
// In browser console:
import { appendReadingsToMaster } from './src/core/incremental-storage-engine.js';

// Test with sample data
const testReadings = [
  { timestamp: new Date('2025-10-01T10:00:00'), glucose: 120 },
  { timestamp: new Date('2025-10-01T10:05:00'), glucose: 125 }
];

await appendReadingsToMaster(testReadings, 'test.csv');

// Check IndexedDB manually
```

**Validation:**
- [ ] Month bucket created in IndexedDB
- [ ] Readings stored correctly
- [ ] Deduplication works (re-run, no duplicates)
- [ ] No console errors

### Step 1.4: Create Event Detection Engine (1.5 hours)

**File:** `src/core/event-detection-engine.js`

**Functions to implement:**
```javascript
/**
 * Generate idempotent event ID
 */
function generateEventId(timestamp, type) {
  // "sensor_20251015T143000"
}

/**
 * Store sensor change event
 */
export async function storeSensorChange(timestamp, gapMinutes, sourceFile) {
  // Generate ID
  // Put to sensorEvents store (idempotent)
}

/**
 * Store cartridge change event
 */
export async function storeCartridgeChange(timestamp, alarmText, sourceFile) {
  // Generate ID
  // Put to cartridgeEvents store
}

/**
 * Process upload for device events
 */
export async function processUploadForEvents(csvData, filename) {
  // Detect sensor changes (existing algorithm)
  // Detect cartridge changes (Rewind alarms)
  // Store all events
}

/**
 * Query functions
 */
export async function getSensorChangesInRange(startDate, endDate) {}
export async function getCartridgeChangesInRange(startDate, endDate) {}
export async function getEventsForDay(date) {}
```

**Reuse existing detection logic:**
- Sensor changes: Copy from v2.x (gap 2-10 hours)
- Cartridge changes: Filter for "Rewind" alarms

**Validation:**
- [ ] Events stored with idempotent IDs
- [ ] Re-upload same CSV: no duplicate events
- [ ] Query functions work

### Step 1.5: Commit Phase 1 (15 min)

```bash
git add .
git commit -m "feat(storage): v3.0 IndexedDB schema with month-bucketing

- Added v3 stores: readingBuckets, sensorEvents, cartridgeEvents
- Implemented incremental-storage-engine.js
- Implemented event-detection-engine.js
- v2.x compatibility maintained (uploads table untouched)

Ref: V3_ARCHITECTURE_DECISIONS.md"

git push origin v3.0-dev
```

**Phase 1 Complete! ✅**

---

## PHASE 2: MIGRATION & BACKFILL

**Duration:** 5 hours  
**Goal:** Build one-time migration from v2.x to v3.0

### Step 2.1: Create Migration Script (2 hours)

**File:** `src/storage/migrations/migrateToV3.js`

**Structure:**
```javascript
/**
 * One-time migration: v2.x → v3.0
 */
export async function migrateToV3() {
  // Check if already migrated
  // Load v2.x uploads
  // Append to month buckets
  // Backfill events
  // Build initial cache
  // Mark complete
  
  return {
    migrated: boolean,
    uploadCount: number,
    readingCount: number,
    elapsedSeconds: number
  };
}

/**
 * Check migration status
 */
export async function getMigrationStatus() {
  const version = await db.masterDataset.get('version');
  return {
    isV3: version?.schemaVersion >= 3,
    migratedAt: version?.migratedAt,
    fromVersion: version?.migratedFrom
  };
}
```

**Implementation steps:**
1. Create migrations/ directory
2. Write migration logic
3. Add extensive logging (console.log each step)
4. Test with real v2.2.1 data

**Desktop Commander:**
```bash
DC: create_directory /Users/jomostert/Documents/Projects/agp-plus/src/storage/migrations
DC: write_file path="/Users/jomostert/Documents/Projects/agp-plus/src/storage/migrations/migrateToV3.js" ...
```

**Validation:**
- [ ] Migration runs without errors
- [ ] All v2.x uploads converted to buckets
- [ ] Events backfilled
- [ ] Version marked as v3
- [ ] Can run multiple times (idempotent)

### Step 2.2: Create Migration UI (1.5 hours)

**File:** `src/components/MigrationBanner.jsx`

**Component structure:**
```jsx
function MigrationBanner() {
  const [status, setStatus] = useState('checking');
  const [stats, setStats] = useState(null);
  
  // States: checking, migrating, complete, dismissed
  
  useEffect(() => {
    checkAndMigrate();
  }, []);
  
  async function checkAndMigrate() {
    // Check version
    // If v2.x, run migration
    // Show progress
  }
  
  return (
    <div className="migration-banner">
      {/* UI based on status */}
    </div>
  );
}
```

**Design requirements:**
- Brutalist style (3px borders, monospace, high contrast)
- Clear status messages
- Progress indication (spinner during migration)
- Success message with stats
- Dismissible (don't show again)

**Validation:**
- [ ] Renders correctly
- [ ] Shows progress during migration
- [ ] Displays accurate stats
- [ ] Dismisses cleanly
- [ ] Doesn't reappear on refresh

### Step 2.3: Integrate Migration into App (1 hour)

**File:** `src/components/AGPGenerator.jsx`

Add MigrationBanner at top of component:

```jsx
import MigrationBanner from './MigrationBanner';

function AGPGenerator() {
  return (
    <div className="app">
      <MigrationBanner />
      {/* Rest of app */}
    </div>
  );
}
```

**Validation:**
- [ ] Banner shows on first v3.0 launch
- [ ] Migration runs automatically
- [ ] App still works after migration
- [ ] v2.x data still accessible

### Step 2.4: Test Migration End-to-End (30 min)

**Test cases:**

1. **Fresh v3.0 user:**
   - Clear IndexedDB
   - Launch app
   - Should show "no data" (no migration banner)

2. **v2.x user with 1 upload:**
   - Add fake upload to IndexedDB
   - Launch app
   - Should migrate, show success banner

3. **v2.x user with 10 uploads:**
   - Add 10 uploads (use real CSV data)
   - Launch app
   - Measure migration time (<30s target)
   - Verify all data present

4. **Already migrated:**
   - Launch app again
   - Should NOT show migration banner
   - Should load cached data

**Validation:**
- [ ] All test cases pass
- [ ] No console errors
- [ ] Data integrity maintained

### Step 2.5: Commit Phase 2 (15 min)

```bash
git add .
git commit -m "feat(migration): v2.x → v3.0 automatic migration

- Implemented migrateToV3() with backfill
- Created MigrationBanner component
- Integrated into AGPGenerator
- Tested with 10 uploads (migration <30s)
- v2.x data preserved for rollback

Ref: V3_ARCHITECTURE_DECISIONS.md"

git push origin v3.0-dev
```

**Phase 2 Complete! ✅**

---

## PHASE 3: UI INTEGRATION

**Duration:** 5 hours  
**Goal:** Update app to use master dataset, add date filters

### Step 3.1: Create useMasterDataset Hook (2 hours)

**File:** `src/hooks/useMasterDataset.js`

**Hook structure:**
```javascript
export function useMasterDataset() {
  const [cache, setCache] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  
  // Load cache on mount
  useEffect(() => {
    loadOrRebuildCache().then(c => {
      setCache(c);
      setLoading(false);
    });
  }, []);
  
  async function loadOrRebuildCache() {
    // Check for saved cache
    // If dirty, rebuild
    // Return cache
  }
  
  async function handleNewUpload(csvData, filename) {
    // Append to master
    // Rebuild cache
    // Update state
  }
  
  // Filter cache by date range
  const filteredReadings = useMemo(() => {
    if (!cache || !dateRange) return cache?.allReadings;
    return cache.allReadings.filter(r => 
      r.timestamp >= dateRange.start && r.timestamp <= dateRange.end
    );
  }, [cache, dateRange]);
  
  return {
    allReadings: filteredReadings,
    dateRange: cache?.dateRange,
    loading,
    handleNewUpload,
    setDateRange
  };
}
```

**Validation:**
- [ ] Loads cache on mount
- [ ] Handles new uploads
- [ ] Date filtering works
- [ ] Re-renders efficiently (no infinite loops)

### Step 3.2: Update AGPGenerator (1.5 hours)

**File:** `src/components/AGPGenerator.jsx`

**Changes needed:**

Replace:
```javascript
const { csvData, ... } = useCSVData();
```

With:
```javascript
const { allReadings, dateRange, handleNewUpload } = useMasterDataset();
```

**Update CSV upload handler:**
```javascript
async function handleCSVUpload(file) {
  // Parse CSV
  const parsed = parseCSV(await file.text());
  
  // Append to master (not replace)
  await handleNewUpload(parsed.readings, file.name);
  
  // Process events
  await processUploadForEvents(parsed.readings, file.name);
}
```

**Validation:**
- [ ] App loads with master dataset
- [ ] Metrics calculate from merged data
- [ ] Day profiles use merged data
- [ ] New uploads append (don't replace)

### Step 3.3: Create Date Range Filter (1 hour)

**File:** `src/components/DateRangeFilter.jsx`

**Component:**
```jsx
function DateRangeFilter({ dateRange, onRangeChange }) {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  
  function handleApply() {
    onRangeChange({ start, end });
  }
  
  function handleReset() {
    onRangeChange(null);  // Show all data
  }
  
  return (
    <div className="date-range-filter">
      <label>
        From:
        <input 
          type="date" 
          min={dateRange.min} 
          max={dateRange.max}
          value={start}
          onChange={e => setStart(e.target.value)}
        />
      </label>
      <label>
        To:
        <input 
          type="date" 
          min={dateRange.min} 
          max={dateRange.max}
          value={end}
          onChange={e => setEnd(e.target.value)}
        />
      </label>
      <button onClick={handleApply}>Apply</button>
      <button onClick={handleReset}>Show All</button>
    </div>
  );
}
```

**Integration:**
Add to AGPGenerator above metrics display.

**Validation:**
- [ ] Shows correct min/max dates
- [ ] Filtering updates metrics
- [ ] "Show All" restores full dataset
- [ ] Brutalist styling

### Step 3.4: Update useMetrics Hook (30 min)

**File:** `src/hooks/useMetrics.js`

Ensure metrics recalculate when master dataset changes:

```javascript
export function useMetrics(allReadings, dateRange) {
  const metrics = useMemo(() => {
    if (!allReadings) return null;
    
    console.log('[useMetrics] Calculating for', allReadings.length, 'readings');
    return calculateMetrics(allReadings, dateRange);
  }, [allReadings, dateRange]);
  
  return metrics;
}
```

**Validation:**
- [ ] Metrics update when date filter changes
- [ ] No unnecessary recalculations (check console logs)
- [ ] Performance acceptable (<1s for 500k readings)

### Step 3.5: Commit Phase 3 (15 min)

```bash
git add .
git commit -m "feat(ui): integrate master dataset with date filtering

- Created useMasterDataset hook
- Updated AGPGenerator to use merged data
- Added DateRangeFilter component
- Updated useMetrics for filtered calculations
- App now shows complete multi-year history

Ref: V3_ARCHITECTURE_DECISIONS.md"

git push origin v3.0-dev
```

**Phase 3 Complete! ✅**

---

## PHASE 4: TESTING & RELEASE

**Duration:** 3-4 hours  
**Goal:** Comprehensive testing, documentation, release v3.0.0

### Step 4.1: Performance Testing (1 hour)

**Test with real data:**

1. **Load 3 years of CSV files (36 months)**
2. **Measure:**
   - Upload + append time (target: <2s per month)
   - Cache rebuild (target: <2s)
   - Metrics calculation (target: <1s)
   - Initial load (target: <3s)
   - Memory usage (target: <100MB)

**Tools:**
```javascript
// In browser console
performance.now()  // Timestamp
console.time('label')  // Start timer
console.timeEnd('label')  // End timer

// Memory
performance.memory.usedJSHeapSize / 1024 / 1024  // MB
```

**Document results:**
Create `docs/V3_PERFORMANCE_RESULTS.md`

**Validation:**
- [ ] All targets met
- [ ] No memory leaks (test over 5 minutes)
- [ ] UI remains responsive

### Step 4.2: E2E Testing (1 hour)

**Test scenarios:**

1. **Fresh install:**
   - [ ] Clear IndexedDB
   - [ ] Upload first CSV
   - [ ] Verify metrics, day profiles, events
   
2. **Incremental uploads:**
   - [ ] Upload Oct 2023
   - [ ] Upload Nov 2023
   - [ ] Verify merged view spans both months
   - [ ] Upload Oct 2023 again (same data)
   - [ ] Verify no duplicates

3. **Migration:**
   - [ ] Restore v2.2.1 data
   - [ ] Launch v3.0
   - [ ] Verify migration completes
   - [ ] Verify all data accessible

4. **Date filtering:**
   - [ ] Filter to single month
   - [ ] Verify metrics update
   - [ ] Filter to 3-month range
   - [ ] Reset filter (show all)

5. **Device events:**
   - [ ] Upload CSV with sensor changes
   - [ ] Verify events stored
   - [ ] Re-upload same CSV
   - [ ] Verify no duplicate events
   - [ ] Check day profile markers

6. **Print/Export:**
   - [ ] Export main AGP HTML
   - [ ] Export day profiles HTML
   - [ ] Verify merged data in exports

**Validation:**
- [ ] All scenarios pass
- [ ] No console errors
- [ ] UI responsive throughout

### Step 4.3: Documentation Updates (1 hour)

**Files to update:**

1. **README.md:**
   - Add v3.0 features
   - Update screenshots if needed
   - Update installation instructions

2. **CHANGELOG.md:**
   - Add v3.0.0 entry with:
     - Major changes
     - Migration notes
     - Breaking changes (if any)

3. **MIGRATING_TO_V3.md:**
   - User-facing migration guide
   - FAQ
   - Troubleshooting

4. **PROJECT_BRIEFING_V3_0.md:**
   - Complete architecture documentation
   - Code walkthrough
   - Algorithm explanations

**Validation:**
- [ ] All docs updated
- [ ] No dead links
- [ ] Clear and accurate

### Step 4.4: Final Code Cleanup (30 min)

**Checklist:**

- [ ] Remove all console.log() debug statements
- [ ] Remove commented-out code
- [ ] Check JSDoc comments on all functions
- [ ] Run code formatter (if using)
- [ ] Check for unused imports
- [ ] Verify all files have proper headers

**Search for debug code:**
```bash
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus/src" 
                 pattern="console.log" searchType="content"
```

**Validation:**
- [ ] No debug logs in production code
- [ ] Code is clean and readable
- [ ] All functions documented

### Step 4.5: Merge to Main & Release (30 min)

**Final merge:**

```bash
# STEP 1: Final sync (ensure v3.0-dev has latest main)
git checkout v3.0-dev
git merge main
git push origin v3.0-dev

# STEP 2: Final test
npm run dev
# Test everything one more time!

# STEP 3: Merge v3.0-dev → main
git checkout main
git merge v3.0-dev

# STEP 4: Update version in package.json
# Change "version": "2.2.1" → "3.0.0"

# STEP 5: Commit version bump
git add package.json
git commit -m "chore: bump version to v3.0.0"

# STEP 6: Push to main
git push origin main

# STEP 7: Create release tag
git tag -a v3.0.0 -m "Release v3.0.0 - Incremental Master Dataset

Major features:
- Incremental master dataset with month-bucketing
- Automatic v2.x → v3.0 migration
- Persistent device event storage
- Multi-year merged data view
- Date range filtering

See CHANGELOG.md for full details."

git push origin v3.0.0

# STEP 8: Delete v3.0-dev branch (work complete)
git branch -d v3.0-dev
git push origin --delete v3.0-dev
```

**Create GitHub Release:**
- Go to https://github.com/jllmostert/agp-plus-v2/releases
- Click "Draft a new release"
- Select tag v3.0.0
- Copy release notes from tag message
- Publish release

**Validation:**
- [ ] v3.0.0 on main branch
- [ ] Tag pushed to GitHub
- [ ] GitHub release created
- [ ] v3.0-dev branch deleted

**Phase 4 Complete! ✅**  
**v3.0.0 RELEASED! 🎉**

---

## 🎯 SUCCESS CRITERIA

**v3.0.0 is ready when:**

### Technical
- [x] All 4 phases complete
- [ ] No console errors
- [ ] Performance targets met
- [ ] Migration works flawlessly
- [ ] v2.x data preserved
- [ ] All tests pass

### User Experience
- [ ] Migration is transparent (just works)
- [ ] Merged view displays correctly
- [ ] Incremental uploads seamless
- [ ] Date filtering intuitive
- [ ] Print/export works

### Documentation
- [ ] README updated
- [ ] CHANGELOG complete
- [ ] Migration guide clear
- [ ] Architecture documented
- [ ] Git workflow documented

---

## 🚨 ROLLBACK PLAN

**If v3.0 has critical issues after release:**

```bash
# OPTION A: Revert merge commit
git revert -m 1 <merge-commit-hash>
git push origin main

# OPTION B: Hard reset (if not pushed yet)
git reset --hard v2.2.1
git push -f origin main  # DANGEROUS, only if no one else pulled

# OPTION C: Hotfix branch
git checkout -b hotfix-v3.0.1 v3.0.0
# ... fix critical bug ...
git checkout main
git merge hotfix-v3.0.1
git tag v3.0.1
git push origin main v3.0.1
```

**Users can always downgrade:**
- v2.x uploads table preserved
- v3.0 IndexedDB stores ignored by v2.x
- No data loss

---

## 📊 IMPLEMENTATION TRACKING

### Phase 1: Storage Schema ☐
- [ ] 1.1 Create v3.0-dev branch
- [ ] 1.2 Update Dexie schema
- [ ] 1.3 Create storage engine
- [ ] 1.4 Create event detection engine
- [ ] 1.5 Commit Phase 1

### Phase 2: Migration ☐
- [ ] 2.1 Create migration script
- [ ] 2.2 Create migration UI
- [ ] 2.3 Integrate into app
- [ ] 2.4 Test end-to-end
- [ ] 2.5 Commit Phase 2

### Phase 3: UI Integration ☐
- [ ] 3.1 Create useMasterDataset hook
- [ ] 3.2 Update AGPGenerator
- [ ] 3.3 Create date range filter
- [ ] 3.4 Update useMetrics
- [ ] 3.5 Commit Phase 3

### Phase 4: Testing & Release ☐
- [ ] 4.1 Performance testing
- [ ] 4.2 E2E testing
- [ ] 4.3 Documentation updates
- [ ] 4.4 Code cleanup
- [ ] 4.5 Merge & release

---

## 💡 TIPS & TRICKS

**Desktop Commander patterns:**
```bash
# Read with line numbers (easier to edit)
DC: read_file path="..." offset=0 length=50

# Search before editing
DC: start_search path="..." pattern="functionName" searchType="content"

# Edit with exact string matching
DC: edit_block file_path="..." old_string="EXACT match" new_string="new code"
```

**Git workflow:**
```bash
# Always check branch before committing
git branch

# Commit often with clear messages
git commit -m "feat(scope): description"

# Push daily (backup + collaboration ready)
git push origin v3.0-dev
```

**Testing in browser:**
```javascript
// Time operations
console.time('Migration');
await migrateToV3();
console.timeEnd('Migration');

// Check memory
console.log(performance.memory.usedJSHeapSize / 1024 / 1024, 'MB');

// Inspect IndexedDB
// DevTools → Application → IndexedDB → AGPPlusDB
```

---

## 📞 TROUBLESHOOTING

**Problem: Migration fails**
- Check console for errors
- Verify v2.x uploads exist
- Check IndexedDB quota (might be full)

**Problem: Performance too slow**
- Profile with Chrome DevTools
- Check if rebuilding cache on every render
- Verify useMemo dependencies correct

**Problem: Merge conflicts**
- Follow GIT_BRANCH_WORKFLOW.md recovery section
- When in doubt, ask before force-pushing

**Problem: Tests failing**
- Check browser console first
- Add debug console.logs
- Verify data flow (CSV → engines → hooks → components)

---

**Ready to implement? Start with Phase 1! 🚀**

---

*Last updated: October 25, 2025*  
*Status: Ready to implement*  
*Estimated completion: Mid-November 2025*
