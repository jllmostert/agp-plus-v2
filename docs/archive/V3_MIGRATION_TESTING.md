# Migration Testing Guide

**Status:** Phase 2 Complete - Ready for Testing  
**Branch:** v3.0-dev

---

## Quick Test (Browser Console)

### 1. Fresh Install Test

```javascript
// In browser console (Dev Tools)
import { testMigration } from './src/storage/migrations/testMigration.js';

// Test with no existing data
await testMigration();
```

**Expected Result:**
```
✅ Migration complete!
Fresh install (no v2.x data)
```

---

### 2. With Existing v2.x Data

**Prerequisites:**
- Have at least 1 CSV uploaded in v2.x (localhost:5173)
- Check IndexedDB in Dev Tools → Application → Storage → IndexedDB → agp-plus-db → uploads

**Run Migration:**
```javascript
import { testMigration } from './src/storage/migrations/testMigration.js';

// This will migrate your existing uploads
await testMigration();
```

**Expected Result:**
```
✅ Migration complete!
Uploads processed: 1 (or more)
Total readings: XXXX
Sensors detected: X
Cartridges detected: X
```

---

### 3. Idempotency Test

```javascript
import { testIdempotency } from './src/storage/migrations/testMigration.js';

// Runs migration twice, verifies same result
await testIdempotency();
```

**Expected Result:**
```
First run: ✅
Second run: ✅ (already migrated)
✅ Idempotency test PASSED
```

---

### 4. Reset & Retest (Dangerous!)

```javascript
import { testMigration } from './src/storage/migrations/testMigration.js';

// ⚠️ This clears all v3.0 stores (but preserves v2.x uploads)
await testMigration(forceReset = true);
```

**Use case:** Testing migration multiple times with same data

---

## Manual Verification (IndexedDB Inspector)

### Before Migration
**Check these stores exist:**
- `uploads` - Should have your CSV data
- `settings` - Should have activeUploadId

### After Migration
**Check these NEW stores:**
- `readingBuckets` - Should have month keys (e.g., "2025-10")
- `sensorEvents` - Should have detected sensor changes
- `cartridgeEvents` - Should have Rewind events
- `masterDataset` - Should have migration record + cache

**Verify Cache:**
```javascript
import { getMasterDatasetStats } from './src/storage/masterDatasetStorage.js';
await getMasterDatasetStats();
```

**Expected Output:**
```javascript
{
  bucketCount: 12,           // Number of months with data
  totalReadings: 5040,       // 5-min resolution for 7 days = ~2016 per week
  cacheSize: 5040,           // Should match totalReadings
  dateRange: {
    min: "2025-10-18T...",
    max: "2025-10-25T..."
  },
  isCacheDirty: false       // Cache is fresh
}
```

---

## Common Issues & Solutions

### Issue: "No v2.x uploads found"
**Cause:** Fresh install or no CSV uploaded yet  
**Solution:** Upload a CSV in the UI first, then run migration

### Issue: "CSV parsing failed"
**Cause:** Corrupted CSV or wrong format  
**Solution:** Check CSV has proper CareLink format (6 header lines, semicolon delimiter)

### Issue: "Migration already complete"
**Cause:** Running migration multiple times (this is OK!)  
**Solution:** Use `resetMigration()` if you need to retest

### Issue: No sensor/cartridge events detected
**Cause:** CSV doesn't span long enough period (needs gaps/rewinds)  
**Solution:** Normal for short test data, will work with real multi-week data

---

## Performance Benchmarks

**Target times for migration:**
- 1 week data (~2,000 readings): <500ms
- 1 month data (~8,600 readings): <2s
- 3 months (~25,000 readings): <5s
- 1 year (~105,000 readings): <20s
- 3 years (~315,000 readings): <60s

**Test yours:**
```javascript
import { migrateToV3 } from './src/storage/migrations/migrateToV3.js';
console.time('migration');
await migrateToV3();
console.timeEnd('migration');
```

---

## Next Steps After Testing

Once Phase 2 testing passes:

1. **Phase 3:** React Integration
   - Create `useMasterDataset` hook
   - Add migration banner to UI
   - Connect to AGPGenerator

2. **Phase 4:** Device Events UI
   - Display sensor/cartridge changes on timeline
   - Add manual event confirmation

3. **Phase 5:** Testing & Polish
   - End-to-end testing with real data
   - Performance optimization
   - Error handling edge cases

---

## Debugging Tips

### Enable Verbose Logging
All migration functions use `console.log` extensively. Check browser console for:
- `[Migration]` - Main migration flow
- `[AppendBucket]` - Month bucket operations
- `[Conflict]` - Duplicate reading warnings

### Inspect IndexedDB Directly
Chrome/Edge: Dev Tools → Application → Storage → IndexedDB → agp-plus-db  
Firefox: Dev Tools → Storage → IndexedDB → agp-plus-db

### Check Cache State
```javascript
import { loadOrRebuildCache } from './src/storage/masterDatasetStorage.js';
const cache = await loadOrRebuildCache();
console.log(`Cache loaded: ${cache.length} readings`);
console.log('First reading:', cache[0]);
console.log('Last reading:', cache[cache.length - 1]);
```

---

**Ready to test?** Start with `testMigration()` in the browser console! 🚀
