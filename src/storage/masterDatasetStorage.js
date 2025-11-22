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
 * 
 * v4.4.1: ProTime, TDD, BG, and cleanup functions extracted to separate modules
 *         Re-exported here for backwards compatibility
 */

import { 
  openDB, 
  STORES, 
  getAllRecords, 
  getRecord, 
  putRecord,
  deleteRecord
} from './db.js';
import { debug } from '../utils/debug.js';

// Re-export from extracted modules (backwards compatibility)
export { 
  saveProTimeData, 
  loadProTimeData, 
  deleteProTimeData,
  deleteProTimeDataInRange 
} from './protimeStorage.js';

export { 
  saveTDDData,
  loadTDDData, 
  deleteTDDData 
} from './tddStorage.js';

export {
  deleteGlucoseDataInRange,
  cleanupRecords
} from './dataCleanup.js';

export {
  addBGReadings,
  getAllBGReadings,
  getBGReadingsInRange,
  getBGReadingsForDate
} from './bgReadingsStorage.js';

/**
 * Generate month key from Date
 * @param {Date} date
 * @returns {string} "YYYY-MM"
 */
function getMonthKey(date) {
  // Guard: Ensure we have a valid Date object
  if (!(date instanceof Date)) {
    throw new Error(`[getMonthKey] Expected Date object, got ${typeof date}: ${date}`);
  }
  
  if (isNaN(date.getTime())) {
    throw new Error(`[getMonthKey] Invalid Date object: ${date}`);
  }
  
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
        // Significant difference - keep first (existing), don't overwrite
        conflictCount++;
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
}

/**
 * Append new readings to master dataset
 * Main entry point for adding data
 * 
 * @param {Array} newReadings - Readings with timestamp, glucose, etc.
 * @param {string} sourceFile - CSV filename
 */
export async function appendReadingsToMaster(newReadings, sourceFile) {
  // Group by month
  const byMonth = groupByMonth(newReadings);
  
  // Append to each bucket
  for (const [monthKey, monthReadings] of byMonth) {
    await appendToMonthBucket(monthKey, monthReadings, sourceFile);
  }
  
  // Invalidate cache (will rebuild on next access)
  await invalidateCache();
}

/**
 * Rebuild sorted cache from all month buckets
 * Called when cache is dirty or missing
 */
export async function rebuildSortedCache() {
  // Load all buckets
  const buckets = await getAllRecords(STORES.READING_BUCKETS);
  
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
    return savedCache;
  }
  
  // Cache missing or dirty - rebuild
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
  }
}

/**
 * Get all month buckets for export
 * @returns {Promise<Array>} Array of month bucket objects
 */
export async function getAllMonthBuckets() {
  return await getAllRecords(STORES.READING_BUCKETS);
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

// ProTime and TDD functions moved to protimeStorage.js and tddStorage.js
// Re-exported above for backwards compatibility

/**
 * Detect device events from CSV readings (NO storage)
 * Returns detected events for pre-storage processing
 * @param {Array} readings - Parsed CSV readings
 * @returns {Object} { sensorEvents: Array, cartridgeEvents: Array }
 */
async function detectSensors(readings) {
  
  // Import dependencies
  const { deduplicateSensorEvents, clusterEventsByTime, getRepresentativeEvent } = 
    await import('../utils/eventClustering.js');
  
  // ===== SENSOR CHANGE DETECTION =====
  
  // Extract all sensor alerts from CSV
  const allSensorAlerts = readings
    .filter(row => row.alert && row.date && row.time)
    .map(row => {
      const [year, month, day] = row.date.split('/').map(Number);
      const [hours, minutes, seconds] = row.time.split(':').map(Number);
      return {
        timestamp: new Date(year, month - 1, day, hours, minutes, seconds),
        date: row.date,
        time: row.time,
        alert: row.alert
      };
    })
    .filter(event => !isNaN(event.timestamp.getTime()));
  
  
  // Deduplicate using intelligent clustering
  const { confirmedEvents, ambiguousGroups } = deduplicateSensorEvents(allSensorAlerts);
  
  // Collect all sensor events (confirmed + ambiguous representatives)
  const sensorEvents = [...confirmedEvents];
  
  // Handle ambiguous groups (>60 min apart on same day)
  if (ambiguousGroups.length > 0) {
    for (const group of ambiguousGroups) {
      const representative = getRepresentativeEvent(group.events);
      sensorEvents.push(representative);
    }
  }
  
  // ===== CARTRIDGE CHANGE DETECTION =====
  
  // Extract rewind events
  const rewindEvents = readings
    .filter(row => row.rewind === true && row.date && row.time)
    .map(row => {
      const [year, month, day] = row.date.split('/').map(Number);
      const [hours, minutes, seconds] = row.time.split(':').map(Number);
      return {
        timestamp: new Date(year, month - 1, day, hours, minutes, seconds),
        date: row.date,
        time: row.time
      };
    })
    .filter(event => !isNaN(event.timestamp.getTime()));
  
  
  // Cluster cartridge changes (unlikely but possible to have multiple same day)
  const cartridgeClusters = clusterEventsByTime(rewindEvents, 60);
  
  // Collect cartridge events
  const cartridgeEvents = cartridgeClusters.map(cluster => 
    getRepresentativeEvent(cluster)
  );
  
  // Return detected events (not stored yet!)
  return {
    sensorEvents,
    cartridgeEvents
  };
}

/**
 * Pre-store hook: Find batch matches for detected sensors
 * Called BEFORE sensors are stored, to enable atomic assignment
 * @param {Object} detectedEvents - Result from detectSensors()
 * @param {Array} detectedEvents.sensorEvents - Sensor change events
 * @returns {Array} Suggestions array: [{ sensorId, matches }]
 */
async function findBatchSuggestionsForSensors(detectedEvents) {
  try {
    // Extract sensor IDs from events with collision detection
    const sensorIdSet = new Set();
    const sensorIds = detectedEvents.sensorEvents.map((event, index) => {
      // Sensor ID format: "Sensor-YYYY-MM-DD-HHMMSS"
      const timestamp = new Date(event.timestamp);
      const year = timestamp.getFullYear();
      const month = String(timestamp.getMonth() + 1).padStart(2, '0');
      const day = String(timestamp.getDate()).padStart(2, '0');
      const hours = String(timestamp.getHours()).padStart(2, '0');
      const minutes = String(timestamp.getMinutes()).padStart(2, '0');
      const seconds = String(timestamp.getSeconds()).padStart(2, '0');
      
      // Generate base sensor ID
      let sensorId = `Sensor-${year}-${month}-${day}-${hours}${minutes}${seconds}`;
      
      // Check for collision
      if (sensorIdSet.has(sensorId)) {
        console.warn(
          `[Stock] Sensor ID collision detected at ${timestamp.toISOString()}`,
          `- adding suffix to ensure uniqueness`
        );
        sensorId = `${sensorId}-${index}`;
      }
      
      sensorIdSet.add(sensorId);
      return sensorId;
    });
    
    // Log summary if collisions occurred
    const collisions = sensorIds.length - sensorIdSet.size;
    if (collisions > 0) {
      console.warn(`[Stock] Resolved ${collisions} sensor ID collision(s)`);
    }
    
    if (sensorIds.length === 0) {
      return [];
    }
    
    // Get batch suggestions using stock engine
    const { suggestBatchAssignments } = await import('../core/stock-engine.js');
    return suggestBatchAssignments(sensorIds);
    
  } catch (err) {
    console.warn('[findBatchSuggestionsForSensors] Failed:', err);
    return [];
  }
}

/**
 * Store detected device events
 * @param {Object} detectedEvents - Result from detectSensors()
 * @param {Array} detectedEvents.sensorEvents - Sensor change events
 * @param {Array} detectedEvents.cartridgeEvents - Cartridge change events
 */
async function storeSensors(detectedEvents) {
  const { addCartridgeChange } = await import('./cartridgeStorage.js');
  
  // Store cartridge changes
  for (const event of detectedEvents.cartridgeEvents) {
    try {
      await addCartridgeChange(event.timestamp, 'Rewind', 'CSV Upload');
    } catch (err) {
      if (!err.message.includes('duplicate')) {
        console.warn('[storeSensors] Failed to store cartridge event:', err);
      }
    }
  }
}

/**
 * Detect and store device events (LEGACY - kept for compatibility)
 * Uses intelligent clustering to deduplicate events
 * @param {Array} readings - Parsed CSV readings
 */
async function detectAndStoreEvents(readings) {
  const detected = await detectSensors(readings);
  await storeSensors(detected);
}

/**
 * Initialize events from existing master dataset
 * Called on page load if no events exist in localStorage
 */
export async function initEventsFromMasterDataset() {
  const { hasCartridgeChanges } = await import('./cartridgeStorage.js');
  
  // Check if events already exist
  if (await hasCartridgeChanges()) {
    return;
  }
  
  
  // Load all readings from cache
  const cache = await loadOrRebuildCache();
  
  if (!cache || cache.allReadings.length === 0) {
    return;
  }
  
  // Transform to CSV format for detectAndStoreEvents
  const readings = cache.allReadings.map(reading => ({
    date: formatDateFromTimestamp(reading.timestamp),
    time: formatTimeFromTimestamp(reading.timestamp),
    rewind: reading.rewind || false
  }));
  
  // Detect and store events
  await detectAndStoreEvents(readings);
  
}

/**
 * Helper: Format timestamp to YYYY/MM/DD
 */
function formatDateFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * Helper: Format timestamp to HH:MM:SS
 */
function formatTimeFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Upload CSV directly to V3 storage (bypasses V2 completely)
 * @param {string} csvText - Raw CSV text from CareLink export
 * @returns {Object} Upload result with stats
 */
export async function uploadCSVToV3(csvText) {
  // Import CSV parser and metadata extractor
  const { parseCSV, parseCSVMetadata } = await import('../core/parsers.js');
  
  // Parse CSV to get readings array, section1, and section2 data
  // Returns: {data: Array, section1: Array, section2: Array}
  const parsed = parseCSV(csvText);
  
  // Extract and save patient metadata (name, device serial, CGM, etc.)
  try {
    const metadata = parseCSVMetadata(csvText);
    
    if (metadata && Object.keys(metadata).length > 0) {
      const { patientStorage } = await import('../utils/patientStorage.js');
      
      // Check if patient info is locked - don't overwrite if locked
      const existingInfo = await patientStorage.get();
      
      if (existingInfo?.isLocked) {
        debug.log('[uploadCSVToV3] Patient info is LOCKED - skipping CSV update');
      } else {
        // Save metadata (merge with existing user-entered fields)
        await patientStorage.save({
          name: metadata.name || existingInfo?.name || '',
          dob: existingInfo?.dob || '', // Preserve existing DOB (user-entered)
          cgm: metadata.cgm || existingInfo?.cgm || '',
          physician: existingInfo?.physician || '', // Preserve physician (user-entered)
          email: existingInfo?.email || '', // Preserve email (user-entered)
          deviceSerial: metadata.deviceSerial || existingInfo?.deviceSerial || '',
          device: metadata.device || existingInfo?.device || '',
          isLocked: existingInfo?.isLocked || false // Preserve lock state!
        });
        
        debug.log('[uploadCSVToV3] Patient metadata saved:', metadata);
      }
    }
  } catch (err) {
    // Non-fatal: metadata extraction failure shouldn't block upload
    debug.warn('[uploadCSVToV3] Failed to extract/save patient metadata:', err);
  }
  const readings = parsed.data || parsed; // Backwards compatibility
  const section1 = parsed.section1 || []; // Meal boluses (new in v3.1)
  const section2 = parsed.section2 || []; // Auto insulin data (new in v3.1)
  
  if (!readings || readings.length === 0) {
    throw new Error('No valid readings found in CSV');
  }
  
  // Log Section 1/2 data availability
  if (section1.length > 0) {
  }
  if (section2.length > 0) {
  }
  
  // Calculate and store TDD (Total Daily Dose) data if available
  if (section1.length > 0 && section2.length > 0) {
    try {
      const { calculateDailyTDD, calculateTDDStatistics, validateTDDData } = 
        await import('../core/insulin-engine.js');
      
      // Calculate TDD for new upload
      const newTddByDay = calculateDailyTDD(section1, section2);
      
      // Load existing TDD data from storage
      const existingTddRecord = await getRecord(STORES.SETTINGS, 'tdd_data');
      const existingTddByDay = existingTddRecord?.tddByDay || {};
      
      // Merge: new data overwrites old data for same dates, old dates preserved
      const mergedTddByDay = {
        ...existingTddByDay,
        ...newTddByDay
      };
      
      debug.log('[uploadCSVToV3] TDD merge:', {
        existingDays: Object.keys(existingTddByDay).length,
        newDays: Object.keys(newTddByDay).length,
        totalDays: Object.keys(mergedTddByDay).length
      });
      
      // Recalculate statistics over merged data
      const tddStats = calculateTDDStatistics(mergedTddByDay);
      const validation = validateTDDData(mergedTddByDay);
      
      // Store merged TDD data in settings
      await putRecord(STORES.SETTINGS, {
        key: 'tdd_data',
        tddByDay: mergedTddByDay,
        tddStats,
        validation,
        lastUpdated: Date.now()
      });
      
    } catch (err) {
      debug.warn('[uploadCSVToV3] TDD calculation failed (non-fatal):', err);
    }
  } else {
    debug.warn('[uploadCSVToV3] Skipping TDD calculation (missing Section 1 or 2)');
  }
  
  // Extract and store BG readings (fingerprick/meter measurements)
  try {
    const bgReadings = readings
      .filter(r => r.bg && r.bg > 0)
      .map(r => {
        const [year, month, day] = r.date.split('/').map(Number);
        const [hour, minute, second] = r.time.split(':').map(Number);
        const timestamp = new Date(year, month - 1, day, hour, minute, second);
        
        return {
          timestamp,
          value: r.bg,
          source: 'meter', // CSV BG readings are from meter/fingerprick
          sourceFile: 'csv-upload'
        };
      });
    
    if (bgReadings.length > 0) {
      const { addBGReadings } = await import('./bgReadingsStorage.js');
      const result = await addBGReadings(bgReadings);
      debug.log(`[uploadCSVToV3] BG readings: ${result.added} added, ${result.duplicates} duplicates`);
    }
  } catch (err) {
    debug.warn('[uploadCSVToV3] BG readings extraction failed (non-fatal):', err);
  }
  
  // Transform readings to add timestamp field (required by storage layer)
  const readingsWithTimestamps = readings.map((reading, index) => {
    // Parse date/time into timestamp Date object
    const [year, month, day] = reading.date.split('/').map(Number);
    const [hour, minute, second] = reading.time.split(':').map(Number);
    const timestamp = new Date(year, month - 1, day, hour, minute, second);
    
    // Validate timestamp
    if (isNaN(timestamp.getTime())) {
      console.error(`[uploadCSVToV3] Invalid timestamp at row ${index}:`, {
        date: reading.date,
        time: reading.time,
        parsed: { year, month, day, hour, minute, second },
        result: timestamp
      });
      throw new Error(`Invalid date/time at row ${index}: ${reading.date} ${reading.time}`);
    }
    
    return {
      ...reading,
      timestamp
    };
  });
  
  // Append readings to master dataset (handles bucketing, deduplication, etc.)
  await appendReadingsToMaster(readingsWithTimestamps);
  
  // Detect sensors (but don't store yet - new two-phase flow)
  const detectedEvents = await detectSensors(readingsWithTimestamps);
  
  // Pre-store hook: Find batch matches BEFORE storage
  const suggestions = await findBatchSuggestionsForSensors(detectedEvents);
  
  // If matches found, pause for user confirmation
  if (suggestions.length > 0) {
    debug.log('[uploadCSVToV3] Found batch matches, awaiting user confirmation');
    return {
      success: true,
      needsConfirmation: true,
      suggestions,
      detectedEvents,
      readingsAdded: readings.length
    };
  }
  
  // No matches → store sensors immediately
  debug.log('[uploadCSVToV3] No batch matches, storing sensors immediately');
  await storeSensors(detectedEvents);
  
  // Rebuild cache for immediate access
  await rebuildSortedCache();
  
  // Get stats
  const stats = await getMasterDatasetStats();
  
  return {
    success: true,
    readingsAdded: readings.length,
    totalReadings: stats.totalReadings,
    dateRange: stats.dateRange
  };
}


/**
 * Complete CSV upload after user confirms batch assignments
 * Called after user confirms suggestions in BatchAssignmentDialog
 * @param {Object} detectedEvents - Events from detectSensors()
 * @param {Array} confirmedAssignments - [{ sensorId, batchId }]
 * @returns {Object} Upload completion result
 */
export async function completeCSVUploadWithAssignments(detectedEvents, confirmedAssignments) {
  const startTime = performance.now();
  const storedSensorIds = [];
  const createdAssignmentIds = [];
  
  try {
    // Phase 1: Store sensors
    await storeSensors(detectedEvents);
    
    // Track stored sensor IDs (reconstruct from events)
    detectedEvents.sensorEvents.forEach(e => {
      const timestamp = new Date(e.timestamp);
      const year = timestamp.getFullYear();
      const month = String(timestamp.getMonth() + 1).padStart(2, '0');
      const day = String(timestamp.getDate()).padStart(2, '0');
      const hours = String(timestamp.getHours()).padStart(2, '0');
      const minutes = String(timestamp.getMinutes()).padStart(2, '0');
      const seconds = String(timestamp.getSeconds()).padStart(2, '0');
      storedSensorIds.push(`Sensor-${year}-${month}-${day}-${hours}${minutes}${seconds}`);
    });
    
    debug.log('[completeCSVUploadWithAssignments] Phase 1 complete - Sensors stored:', {
      count: storedSensorIds.length,
      ids: storedSensorIds
    });
    
    // Phase 2: Create batch assignments
    const { assignSensorToBatch } = await import('./stockStorage.js');
    for (const { sensorId, batchId } of confirmedAssignments) {
      const result = assignSensorToBatch(sensorId, batchId, 'auto');
      createdAssignmentIds.push(result.assignment_id);
    }
    
    debug.log('[completeCSVUploadWithAssignments] Phase 2 complete - Assignments created:', {
      count: createdAssignmentIds.length,
      ids: createdAssignmentIds
    });
    
    // Phase 3: Rebuild cache
    await rebuildSortedCache();
    
    // Get stats
    const stats = await getMasterDatasetStats();
    const duration = performance.now() - startTime;
    
    debug.log('[completeCSVUploadWithAssignments] Complete:', {
      duration: `${duration.toFixed(0)}ms`,
      sensorsStored: storedSensorIds.length,
      assignmentsCreated: createdAssignmentIds.length
    });
    
    return {
      success: true,
      totalReadings: stats.totalReadings,
      dateRange: stats.dateRange,
      assignmentsCreated: createdAssignmentIds.length,
      duration
    };
    
  } catch (err) {
    // ROLLBACK LOGGING - Store recovery data for partial failures
    const rollbackRecord = {
      timestamp: new Date().toISOString(),
      error: {
        message: err.message,
        stack: err.stack
      },
      progress: {
        sensorsStored: storedSensorIds.length,
        sensorsExpected: detectedEvents.sensorEvents.length,
        assignmentsCreated: createdAssignmentIds.length,
        assignmentsExpected: confirmedAssignments.length
      },
      data: {
        storedSensorIds,
        createdAssignmentIds,
        pendingAssignments: confirmedAssignments.slice(createdAssignmentIds.length)
      }
    };
    
    // Store rollback record for manual recovery
    const recordKey = `agp-failed-upload-${Date.now()}`;
    try {
      localStorage.setItem(recordKey, JSON.stringify(rollbackRecord));
      console.error('[completeCSVUploadWithAssignments] PARTIAL FAILURE - Rollback record saved:', {
        key: recordKey,
        record: rollbackRecord
      });
    } catch (storageErr) {
      console.error('[completeCSVUploadWithAssignments] Failed to save rollback record:', storageErr);
    }
    
    // Enhanced error message for user
    throw new Error(
      `Upload partially failed: ${storedSensorIds.length}/${detectedEvents.sensorEvents.length} sensors stored, ` +
      `${createdAssignmentIds.length}/${confirmedAssignments.length} assignments created. ` +
      `Recovery data saved. Original error: ${err.message}`
    );
  }
}


// Delete and cleanup functions moved to dataCleanup.js
// Re-exported above for backwards compatibility


/**
 * AUTO-ASSIGN SENSORS TO BATCHES
 * 
 * Called after CSV upload to suggest batch assignments for newly detected sensors.
 * Uses lot number matching to find appropriate batches.
 * 
 * @returns {Promise<Array>} Suggestions array: [{sensorId, matches}]
 */
export async function getSensorBatchSuggestions() {
  try {
    // Import dependencies
    const { getAllSensors } = await import('./sensorStorage.js');
    const { suggestBatchAssignments } = await import('../core/stock-engine.js');
    
    // Get recent sensors (last 30 days, unlocked only)
    const allSensors = await getAllSensors();
    if (!allSensors || allSensors.length === 0) {
      return [];
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSensorIds = allSensors
      .filter(s => {
        const startDate = new Date(s.start_date);
        return startDate >= thirtyDaysAgo && !s.is_locked;
      })
      .map(s => s.id);
    
    // Get batch suggestions
    return suggestBatchAssignments(recentSensorIds);
    
  } catch (err) {
    console.warn('[getSensorBatchSuggestions] Failed:', err);
    return [];
  }
}

// cleanupRecords moved to dataCleanup.js
// Re-exported above for backwards compatibility
