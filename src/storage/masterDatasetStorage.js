/**
 * Master Dataset Storage Engine for AGP+ v3.0
 * 
 * Handles incremental storage with month-bucketing strategy:
 * - Group readings by month (YYYY-MM)
 * - Deduplicate by timestamp (keep first)
 * - Cache merged sorted array for fast access
 * - Lazy evaluation: rebuild cache only when dirty
 * 
 * Key Functions:
 * - appendReadingsToMaster(): Add new readings to buckets
 * - rebuildSortedCache(): Flatten all buckets into sorted array
 * - loadOrRebuildCache(): Get cache (rebuild if needed)
 * - invalidateCache(): Mark cache as dirty
 */

import { 
  openDB, 
  STORES, 
  getAllRecords, 
  getRecord, 
  putRecord 
} from './db.js';

/**
 * Generate month key from Date
 * @param {Date} date
 * @returns {string} "YYYY-MM"
 */
function getMonthKey(date) {
  return date.toISOString().slice(0, 7);  // "2025-10-15..." → "2025-10"
}

/**
 * Group readings by month
 * @param {Array} readings - Array of reading objects with timestamp
 * @returns {Map} Map<monthKey, Array<readings>>
 */
function groupByMonth(readings) {
  const byMonth = new Map();
  
  for (const reading of readings) {
    const monthKey = getMonthKey(reading.timestamp);
    
    if (!byMonth.has(monthKey)) {
      byMonth.set(monthKey, []);
    }
    
    byMonth.get(monthKey).push(reading);
  }
  
  return byMonth;
}

/**
 * Append readings to specific month bucket with deduplication
 * @param {string} monthKey - "YYYY-MM"
 * @param {Array} newReadings - Readings to append
 * @param {string} sourceFile - CSV filename for audit trail
 */
async function appendToMonthBucket(monthKey, newReadings, sourceFile) {
  console.log(`[AppendBucket] ${monthKey}: ${newReadings.length} readings from ${sourceFile}`);
  
  // Load existing bucket (or create empty)
  let bucket = await getRecord(STORES.READING_BUCKETS, monthKey);
  
  if (!bucket) {
    bucket = {
      monthKey,
      readings: [],
      count: 0,
      dateRange: { min: null, max: null },
      lastUpdated: null
    };
  }
  
  // Build map of existing timestamps for fast lookup
  const existingMap = new Map(
    bucket.readings.map(r => [r.timestamp.getTime(), r])
  );
  
  let addedCount = 0;
  let conflictCount = 0;
  
  for (const reading of newReadings) {
    const ts = reading.timestamp.getTime();
    
    if (!existingMap.has(ts)) {
      // New reading - add it
      bucket.readings.push({ ...reading, sourceFile });
      existingMap.set(ts, reading);
      addedCount++;
    } else {
      // Duplicate timestamp - check if values differ
      const existing = existingMap.get(ts);
      
      if (Math.abs(existing.glucose - reading.glucose) > 1) {
        // Significant difference - log warning
        console.warn(
          `[Conflict] ${reading.timestamp.toISOString()}: ` +
          `${existing.glucose} (${existing.sourceFile}) vs ` +
          `${reading.glucose} (${sourceFile})`
        );
        conflictCount++;
        // Keep first (existing), don't overwrite
      }
      // Else: exact duplicate, ignore silently
    }
  }
  
  // Sort bucket by timestamp
  bucket.readings.sort((a, b) => a.timestamp - b.timestamp);
  
  // Update metadata
  bucket.count = bucket.readings.length;
  bucket.dateRange = {
    min: bucket.readings[0]?.timestamp,
    max: bucket.readings[bucket.readings.length - 1]?.timestamp
  };
  bucket.lastUpdated = new Date();
  
  // Save bucket
  await putRecord(STORES.READING_BUCKETS, bucket);
  
  console.log(
    `[AppendBucket] ${monthKey}: Added ${addedCount}, ` +
    `Conflicts ${conflictCount}, Total ${bucket.count}`
  );
}

/**
 * Append new readings to master dataset
 * Main entry point for adding data
 * 
 * @param {Array} newReadings - Readings with timestamp, glucose, etc.
 * @param {string} sourceFile - CSV filename
 */
export async function appendReadingsToMaster(newReadings, sourceFile) {
  console.log(`[AppendToMaster] ${newReadings.length} readings from ${sourceFile}`);
  const startTime = performance.now();
  
  // Group by month
  const byMonth = groupByMonth(newReadings);
  console.log(`[AppendToMaster] Grouped into ${byMonth.size} months`);
  
  // Append to each bucket
  for (const [monthKey, monthReadings] of byMonth) {
    await appendToMonthBucket(monthKey, monthReadings, sourceFile);
  }
  
  // Invalidate cache (will rebuild on next access)
  await invalidateCache();
  
  const elapsed = performance.now() - startTime;
  console.log(`[AppendToMaster] ✅ Complete in ${elapsed.toFixed(0)}ms`);
}

/**
 * Rebuild sorted cache from all month buckets
 * Called when cache is dirty or missing
 */
export async function rebuildSortedCache() {
  console.log('[RebuildCache] Starting...');
  const startTime = performance.now();
  
  // Load all buckets
  const buckets = await getAllRecords(STORES.READING_BUCKETS);
  console.log(`[RebuildCache] Loaded ${buckets.length} month buckets`);
  
  if (buckets.length === 0) {
    // No data yet
    const emptyCache = {
      id: 'cache',
      allReadings: [],
      dateRange: { min: null, max: null },
      lastUpdated: new Date(),
      isDirty: false,
      version: '3.0.0'
    };
    await putRecord(STORES.MASTER_DATASET, emptyCache);
    return emptyCache;
  }
  
  // Flatten all buckets into single array
  const allReadings = buckets.flatMap(b => b.readings);
  console.log(`[RebuildCache] Flattened to ${allReadings.length} readings`);
  
  // Sort by timestamp (should already be mostly sorted)
  allReadings.sort((a, b) => a.timestamp - b.timestamp);
  
  // Build cache object
  const cache = {
    id: 'cache',
    allReadings,
    dateRange: {
      min: allReadings[0]?.timestamp,
      max: allReadings[allReadings.length - 1]?.timestamp
    },
    lastUpdated: new Date(),
    isDirty: false,
    version: '3.0.0'
  };
  
  // Save cache
  await putRecord(STORES.MASTER_DATASET, cache);
  
  const elapsed = performance.now() - startTime;
  console.log(
    `[RebuildCache] ✅ ${allReadings.length} readings in ${elapsed.toFixed(0)}ms`
  );
  
  return cache;
}

/**
 * Load cache or rebuild if dirty/missing
 * Main entry point for accessing master dataset
 */
export async function loadOrRebuildCache() {
  // Try to load existing cache
  const savedCache = await getRecord(STORES.MASTER_DATASET, 'cache');
  
  if (savedCache && !savedCache.isDirty) {
    console.log('[LoadCache] Using saved cache');
    return savedCache;
  }
  
  // Cache missing or dirty - rebuild
  console.log('[LoadCache] Cache dirty or missing, rebuilding...');
  return await rebuildSortedCache();
}

/**
 * Mark cache as dirty (needs rebuild)
 * Called after appending new data
 */
export async function invalidateCache() {
  const cache = await getRecord(STORES.MASTER_DATASET, 'cache');
  
  if (cache) {
    cache.isDirty = true;
    await putRecord(STORES.MASTER_DATASET, cache);
    console.log('[InvalidateCache] Cache marked dirty');
  }
}

/**
 * Get stats about stored data
 * @returns {Object} { bucketCount, totalReadings, dateRange }
 */
export async function getMasterDatasetStats() {
  const buckets = await getAllRecords(STORES.READING_BUCKETS);
  
  if (buckets.length === 0) {
    return {
      bucketCount: 0,
      totalReadings: 0,
      dateRange: { min: null, max: null }
    };
  }
  
  const totalReadings = buckets.reduce((sum, b) => sum + b.count, 0);
  
  const allDates = buckets
    .flatMap(b => [b.dateRange.min, b.dateRange.max])
    .filter(d => d !== null)
    .sort((a, b) => a - b);
  
  return {
    bucketCount: buckets.length,
    totalReadings,
    dateRange: {
      min: allDates[0],
      max: allDates[allDates.length - 1]
    }
  };
}

/**
 * Save ProTime workdays to settings (V3)
 * @param {Set} workdaySet - Set of date strings (YYYY/MM/DD format)
 */
export async function saveProTimeData(workdaySet) {
  if (!workdaySet || workdaySet.size === 0) {
    console.warn('[saveProTimeData] Empty workday set');
    return;
  }

  // Convert Set to Array for storage
  const workdayArray = Array.from(workdaySet);
  
  await putRecord(STORES.SETTINGS, {
    key: 'protime_workdays',
    workdays: workdayArray,
    lastUpdated: Date.now()
  });
  
  console.log(`[saveProTimeData] Saved ${workdayArray.length} workdays`);
}

/**
 * Load ProTime workdays from settings (V3)
 * @returns {Set|null} Set of date strings or null if not found
 */
export async function loadProTimeData() {
  const record = await getRecord(STORES.SETTINGS, 'protime_workdays');
  
  if (!record || !record.workdays) {
    return null;
  }
  
  // Convert Array back to Set
  return new Set(record.workdays);
}
