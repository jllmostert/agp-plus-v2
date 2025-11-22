/**
 * CSV Upload Engine for AGP+
 * 
 * Orchestrates the complete CSV upload workflow:
 * - Parse CSV data
 * - Extract metadata (patient info, TDD, BG readings)
 * - Detect device events (sensors, cartridges)
 * - Handle batch assignment flow
 * - Store processed data
 * 
 * Extracted from masterDatasetStorage.js (v4.5.0)
 * 
 * @version 4.5.0
 */

import { STORES, getRecord, putRecord } from './db.js';
import { debug } from '../utils/debug.js';

// =============================================================================
// PRIVATE UTILITIES
// =============================================================================

/**
 * Helper: Format timestamp to YYYY/MM/DD
 * @param {Date} timestamp
 * @returns {string} Formatted date string
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
 * @param {Date} timestamp
 * @returns {string} Formatted time string
 */
function formatTimeFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Export format helpers for use by initEventsFromMasterDataset
export { formatDateFromTimestamp, formatTimeFromTimestamp };

// =============================================================================
// DEVICE EVENT DETECTION
// =============================================================================

/**
 * Detect device events (sensors, cartridges) from parsed CSV readings
 * Uses intelligent clustering to deduplicate events
 * @param {Array} readings - Parsed CSV readings with date, time, alert, rewind fields
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

// Export for use by initEventsFromMasterDataset
export { detectSensors };

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
 * Store detected device events (cartridges only - sensors stored elsewhere)
 * @param {Object} detectedEvents - Result from detectSensors()
 * @param {Array} detectedEvents.cartridgeEvents - Cartridge change events
 */
async function storeDetectedEvents(detectedEvents) {
  const { addCartridgeChange } = await import('./cartridgeStorage.js');
  
  // Store cartridge changes
  for (const event of detectedEvents.cartridgeEvents) {
    try {
      await addCartridgeChange(event.timestamp, 'Rewind', 'CSV Upload');
    } catch (err) {
      if (!err.message.includes('duplicate')) {
        console.warn('[storeDetectedEvents] Failed to store cartridge event:', err);
      }
    }
  }
}

/**
 * Detect and store device events (LEGACY - kept for compatibility)
 * Used by initEventsFromMasterDataset
 * @param {Array} readings - Parsed CSV readings
 */
export async function detectAndStoreEvents(readings) {
  const detected = await detectSensors(readings);
  await storeDetectedEvents(detected);
}


// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Upload CSV to AGP+ v3 master dataset
 * 
 * This is the main entry point for CSV uploads. It handles:
 * 1. CSV parsing and validation
 * 2. Patient metadata extraction
 * 3. TDD (Total Daily Dose) calculation
 * 4. BG readings extraction
 * 5. Glucose readings storage
 * 6. Device event detection (sensors, cartridges)
 * 7. Batch assignment suggestions (if matches found)
 * 
 * @param {string} csvText - Raw CSV file content
 * @returns {Object} Upload result with stats and optional batch suggestions
 */
export async function uploadCSVToV3(csvText) {
  // Import dependencies
  const { parseCSV, parseCSVMetadata } = await import('../core/parsers.js');
  const { appendReadingsToMaster, rebuildSortedCache, getMasterDatasetStats } = 
    await import('./masterDatasetStorage.js');
  
  // Parse CSV to get readings array, section1, and section2 data
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
  
  // No matches → store events immediately
  debug.log('[uploadCSVToV3] No batch matches, storing events immediately');
  await storeDetectedEvents(detectedEvents);
  
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
  const { rebuildSortedCache, getMasterDatasetStats } = 
    await import('./masterDatasetStorage.js');
  
  const startTime = performance.now();
  const storedSensorIds = [];
  const createdAssignmentIds = [];
  
  try {
    // Phase 1: Store events (cartridges)
    await storeDetectedEvents(detectedEvents);
    
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
    
    debug.log('[completeCSVUploadWithAssignments] Phase 1 complete - Events stored:', {
      sensorCount: storedSensorIds.length,
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
