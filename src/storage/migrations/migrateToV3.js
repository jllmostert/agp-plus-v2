/**
 * Migration Script: v2.x → v3.0 FUSION
 * 
 * Migrates existing v2.x uploads to new master dataset architecture.
 * 
 * Process:
 * 1. Check if migration already completed (idempotency)
 * 2. Load all v2.x uploads from 'uploads' store
 * 3. Process each upload: parse CSV → append to master dataset
 * 4. Backfill device events from historical data
 * 5. Rebuild sorted cache
 * 6. Mark migration as complete with version flag
 * 
 * Safety:
 * - Idempotent: Can be run multiple times safely
 * - Non-destructive: Preserves v2.x 'uploads' store
 * - Error recovery: Logs errors, continues with other uploads
 * - Performance tracking: Logs timing for each step
 * 
 * Usage:
 *   import { migrateToV3 } from './storage/migrations/migrateToV3.js';
 *   await migrateToV3();
 */

import { 
  openDB, 
  STORES, 
  getAllRecords, 
  getRecord,
  putRecord 
} from '../db.js';

import { 
  appendReadingsToMaster,
  rebuildSortedCache,
  getMasterDatasetStats,
  invalidateCache
} from '../masterDatasetStorage.js';

import { 
  storeSensorChange,
  storeCartridgeChange,
  getEventStats
} from '../eventStorage.js';

import { parseCSV } from '../../core/parsers.js';

// Migration metadata key
const MIGRATION_KEY = 'v3_migration';

// Schema version after migration
const TARGET_VERSION = 3;

/**
 * Check if migration has already been completed
 * @returns {Promise<Object|null>} Migration metadata or null if not migrated
 */
async function checkIfMigrated() {
  try {
    const db = await openDB();
    const migrationRecord = await getRecord(STORES.MASTER_DATASET, MIGRATION_KEY);
    
    if (migrationRecord && migrationRecord.version === TARGET_VERSION) {
      console.log('[Migration] ✅ Already migrated to v3');
      return migrationRecord;
    }
    
    return null;
  } catch (err) {
    console.error('[Migration] Error checking migration status:', err);
    return null;
  }
}

/**
 * Load all v2.x uploads from 'uploads' store
 * @returns {Promise<Array>} Array of upload records
 */
async function loadV2Uploads() {
  try {
    const db = await openDB();
    const uploads = await getAllRecords(STORES.UPLOADS);
    
    console.log(`[Migration] Found ${uploads.length} v2.x uploads`);
    return uploads;
  } catch (err) {
    console.error('[Migration] Error loading v2.x uploads:', err);
    throw new Error(`Failed to load v2.x data: ${err.message}`);
  }
}

/**
 * Migrate readings from a single v2.x upload
 * @param {Object} upload - Upload record with csvData
 * @param {number} index - Upload index for logging
 * @param {number} total - Total uploads for logging
 * @returns {Promise<Object>} Stats {success, readingsAdded, errors}
 */
async function migrateReadings(upload, index, total) {
  const stats = {
    success: false,
    readingsAdded: 0,
    errors: []
  };
  
  try {
    console.log(`[Migration] Processing upload ${index + 1}/${total}: ${upload.filename || upload.id}`);
    
    // Validate upload data
    if (!upload.csvData) {
      stats.errors.push('Missing csvData');
      console.warn(`[Migration] ⚠️ Upload ${upload.id} has no csvData, skipping`);
      return stats;
    }
    
    // Handle CSV data (might be raw text or already parsed)
    let parsedData;
    try {
      // Check if csvData is already parsed (array) or needs parsing (string)
      if (Array.isArray(upload.csvData)) {
        console.log(`[Migration] Using pre-parsed csvData (${upload.csvData.length} rows)`);
        parsedData = upload.csvData;
      } else if (typeof upload.csvData === 'string') {
        console.log(`[Migration] Parsing CSV text`);
        parsedData = parseCSV(upload.csvData);
      } else {
        throw new Error(`Invalid csvData format: ${typeof upload.csvData}`);
      }
    } catch (parseErr) {
      stats.errors.push(`CSV parse error: ${parseErr.message}`);
      console.error(`[Migration] ❌ Failed to parse CSV for ${upload.id}:`, parseErr);
      return stats;
    }
    
    // Transform parsed data to reading objects with timestamps
    const readings = parsedData
      .filter(row => row.glucose !== null)  // Only glucose readings
      .map(row => {
        // Parse date/time to Date object
        const [year, month, day] = row.date.split('/').map(Number);
        const [hours, minutes, seconds] = row.time.split(':').map(Number);
        
        return {
          timestamp: new Date(year, month - 1, day, hours, minutes, seconds),
          glucose: row.glucose,
          // Optional: Include additional context if needed
          // bolus: row.bolus,
          // carbs: row.carbs
        };
      });
    
    if (readings.length === 0) {
      stats.errors.push('No valid glucose readings found');
      console.warn(`[Migration] ⚠️ Upload ${upload.id} has no glucose data`);
      return stats;
    }
    
    // Append to master dataset
    const startTime = performance.now();
    await appendReadingsToMaster(readings, upload.filename || upload.id);
    const duration = (performance.now() - startTime).toFixed(0);
    
    stats.success = true;
    stats.readingsAdded = readings.length;
    console.log(`[Migration] ✅ Added ${readings.length} readings in ${duration}ms`);
    
    return stats;
    
  } catch (err) {
    stats.errors.push(`Unexpected error: ${err.message}`);
    console.error(`[Migration] ❌ Error processing upload ${upload.id}:`, err);
    return stats;
  }
}

/**
 * Backfill device events from historical glucose data
 * Detects sensor changes and cartridge changes from gaps in data
 * @param {Array} uploads - All v2.x uploads
 * @returns {Promise<Object>} Stats {sensorsDetected, cartridgesDetected}
 */
async function backfillEvents(uploads) {
  console.log('[Migration] Backfilling device events...');
  
  const stats = {
    sensorsDetected: 0,
    cartridgesDetected: 0
  };
  
  try {
    // Process each upload to detect events
    for (const upload of uploads) {
      if (!upload.csvData) continue;
      
      try {
        const parsedData = parseCSV(upload.csvData);
        
        // Detect sensor changes from glucose gaps
        // Gap of 2-2.5 hours typically indicates sensor change + warmup
        await detectSensorChanges(parsedData, upload.filename || upload.id, stats);
        
        // Detect cartridge changes from Rewind events
        await detectCartridgeChanges(parsedData, upload.filename || upload.id, stats);
        
      } catch (err) {
        console.warn(`[Migration] ⚠️ Failed to backfill events for ${upload.id}:`, err);
        // Continue with other uploads
      }
    }
    
    console.log(
      `[Migration] ✅ Backfill complete: ${stats.sensorsDetected} sensors, ` +
      `${stats.cartridgesDetected} cartridges`
    );
    
    return stats;
    
  } catch (err) {
    console.error('[Migration] Error during event backfill:', err);
    // Don't throw - event backfill is non-critical
    return stats;
  }
}

/**
 * Detect sensor changes from glucose gaps
 * @param {Array} parsedData - Parsed CSV data
 * @param {string} sourceFile - Filename for event metadata
 * @param {Object} stats - Stats object to update
 */
async function detectSensorChanges(parsedData, sourceFile, stats) {
  // Build array of timestamps with glucose
  const glucoseReadings = parsedData
    .filter(row => row.glucose !== null)
    .map(row => {
      const [year, month, day] = row.date.split('/').map(Number);
      const [hours, minutes, seconds] = row.time.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds);
    })
    .sort((a, b) => a - b);
  
  if (glucoseReadings.length < 2) return;
  
  // Detect gaps indicating sensor changes
  // Typical sensor change: 2-2.5 hour gap (transmitter charge + warmup)
  const MIN_GAP_HOURS = 2.0;
  const MAX_GAP_HOURS = 3.0;
  
  for (let i = 1; i < glucoseReadings.length; i++) {
    const prev = glucoseReadings[i - 1];
    const curr = glucoseReadings[i];
    const gapHours = (curr - prev) / (1000 * 60 * 60);
    
    if (gapHours >= MIN_GAP_HOURS && gapHours <= MAX_GAP_HOURS) {
      // Detected likely sensor change
      // Timestamp = midpoint of gap (approximate change time)
      const changeTime = new Date((prev.getTime() + curr.getTime()) / 2);
      
      try {
        await storeSensorChange({
          timestamp: changeTime,
          confidence: 'estimated',  // Gap-based detection
          source: 'migration',
          notes: `Detected from ${gapHours.toFixed(1)}h gap in ${sourceFile}`
        });
        
        stats.sensorsDetected++;
      } catch (err) {
        // Duplicate event (already exists) - ignore
        if (!err.message.includes('duplicate')) {
          console.warn('[Migration] Failed to store sensor change:', err);
        }
      }
    }
  }
}

/**
 * Detect cartridge changes from Rewind events
 * @param {Array} parsedData - Parsed CSV data
 * @param {string} sourceFile - Filename for event metadata
 * @param {Object} stats - Stats object to update
 */
async function detectCartridgeChanges(parsedData, sourceFile, stats) {
  // Find all Rewind events
  const rewindEvents = parsedData
    .filter(row => row.rewind === true)
    .map(row => {
      const [year, month, day] = row.date.split('/').map(Number);
      const [hours, minutes, seconds] = row.time.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds);
    });
  
  if (rewindEvents.length === 0) return;
  
  // Store each cartridge change
  for (const timestamp of rewindEvents) {
    try {
      await storeCartridgeChange({
        timestamp,
        confidence: 'verified',  // Rewind events are explicit
        source: 'migration',
        notes: `Detected from Rewind event in ${sourceFile}`
      });
      
      stats.cartridgesDetected++;
    } catch (err) {
      // Duplicate event - ignore
      if (!err.message.includes('duplicate')) {
        console.warn('[Migration] Failed to store cartridge change:', err);
      }
    }
  }
}

/**
 * Mark migration as complete
 * @param {Object} migrationStats - Overall migration statistics
 */
async function markMigrationComplete(migrationStats) {
  try {
    const migrationRecord = {
      key: MIGRATION_KEY,
      version: TARGET_VERSION,
      completedAt: new Date(),
      stats: migrationStats
    };
    
    await putRecord(STORES.MASTER_DATASET, migrationRecord);
    console.log('[Migration] ✅ Migration marked as complete');
    
  } catch (err) {
    console.error('[Migration] Error marking migration complete:', err);
    throw err;
  }
}

/**
 * Main migration function
 * @returns {Promise<Object>} Migration summary with stats and errors
 */
export async function migrateToV3() {
  console.log('[Migration] 🔮 Starting v2.x → v3.0 FUSION migration...');
  
  const startTime = performance.now();
  const summary = {
    success: false,
    totalTime: 0,
    uploadsProcessed: 0,
    uploadsFailed: 0,
    totalReadings: 0,
    eventsBackfilled: {
      sensors: 0,
      cartridges: 0
    },
    errors: []
  };
  
  try {
    // Step 1: Check if already migrated
    const existing = await checkIfMigrated();
    if (existing) {
      console.log('[Migration] Migration already complete, skipping');
      return {
        success: true,
        alreadyMigrated: true,
        previousStats: existing.stats
      };
    }
    
    // Step 2: Load v2.x uploads
    const uploads = await loadV2Uploads();
    
    if (uploads.length === 0) {
      console.log('[Migration] No v2.x uploads found, fresh install detected');
      
      // Mark as migrated anyway (empty state)
      await markMigrationComplete({
        freshInstall: true,
        uploadsProcessed: 0
      });
      
      return {
        success: true,
        freshInstall: true
      };
    }
    
    // Step 3: Process each upload
    console.log(`[Migration] Processing ${uploads.length} uploads...`);
    
    for (let i = 0; i < uploads.length; i++) {
      const uploadStats = await migrateReadings(uploads[i], i, uploads.length);
      
      if (uploadStats.success) {
        summary.uploadsProcessed++;
        summary.totalReadings += uploadStats.readingsAdded;
      } else {
        summary.uploadsFailed++;
        summary.errors.push({
          uploadId: uploads[i].id,
          errors: uploadStats.errors
        });
      }
    }
    
    console.log(
      `[Migration] Uploads complete: ${summary.uploadsProcessed} success, ` +
      `${summary.uploadsFailed} failed, ${summary.totalReadings} total readings`
    );
    
    // Step 4: Backfill device events
    const eventStats = await backfillEvents(uploads);
    summary.eventsBackfilled = eventStats;
    
    // Step 5: Rebuild sorted cache
    console.log('[Migration] Rebuilding sorted cache...');
    const cacheStartTime = performance.now();
    await rebuildSortedCache();
    const cacheDuration = (performance.now() - cacheStartTime).toFixed(0);
    console.log(`[Migration] ✅ Cache rebuilt in ${cacheDuration}ms`);
    
    // Step 6: Mark migration complete
    await markMigrationComplete(summary);
    
    // Calculate total time
    summary.totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
    summary.success = true;
    
    // Log final stats
    console.log('[Migration] 🎉 Migration complete!');
    console.log(`[Migration] Time: ${summary.totalTime}s`);
    console.log(`[Migration] Readings: ${summary.totalReadings}`);
    console.log(`[Migration] Events: ${eventStats.sensorsDetected} sensors, ${eventStats.cartridgesDetected} cartridges`);
    
    // Get master dataset stats for verification
    const masterStats = await getMasterDatasetStats();
    console.log('[Migration] Master dataset:', masterStats);
    
    return summary;
    
  } catch (err) {
    summary.success = false;
    summary.totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
    summary.errors.push({
      critical: true,
      message: err.message,
      stack: err.stack
    });
    
    console.error('[Migration] ❌ Migration failed:', err);
    return summary;
  }
}

/**
 * Reset migration (for testing only - dangerous!)
 * Clears all v3.0 stores but preserves v2.x uploads
 */
export async function resetMigration() {
  console.warn('[Migration] ⚠️ RESETTING MIGRATION - ALL V3 DATA WILL BE DELETED');
  
  try {
    const db = await openDB();
    
    // Clear v3.0 stores only
    const tx = db.transaction([
      STORES.READING_BUCKETS,
      STORES.SENSOR_EVENTS,
      STORES.CARTRIDGE_EVENTS,
      STORES.MASTER_DATASET
    ], 'readwrite');
    
    await tx.objectStore(STORES.READING_BUCKETS).clear();
    await tx.objectStore(STORES.SENSOR_EVENTS).clear();
    await tx.objectStore(STORES.CARTRIDGE_EVENTS).clear();
    await tx.objectStore(STORES.MASTER_DATASET).clear();
    
    await tx.complete;
    
    console.log('[Migration] ✅ v3.0 stores cleared, v2.x data preserved');
    
  } catch (err) {
    console.error('[Migration] Error resetting migration:', err);
    throw err;
  }
}
