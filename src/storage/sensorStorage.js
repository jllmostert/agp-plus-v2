/**
 * SENSOR STORAGE MODULE - LOCALSTORAGE APPROACH
 * 
 * Manages Guardian 4 sensor database using localStorage instead of IndexedDB.
 * Simpler, no versioning conflicts, perfect for sensor tracking.
 * 
 * Architecture:
 * - sensors: Array of sensor records (start, end, lot, hardware, etc.)
 * - inventory: Array of inventory records (lot, quantity, expiry)
 * - lastUpdated: Timestamp of last import
 * - deletedSensors: IndexedDB (source of truth) + localStorage (fast cache)
 * 
 * @module sensorStorage
 * @version 3.11.0
 */

import {
  addDeletedSensorToDB,
  getDeletedSensorsFromDB,
  getDeletedSensorsWithTimestamps,
  cleanupOldDeletedSensorsDB,
  migrateLocalStorageToIndexedDB,
  syncIndexedDBToLocalStorage,
  isIndexedDBAvailable
} from './deletedSensorsDB.js';

const STORAGE_KEY = 'agp-sensor-database';
const DELETED_SENSORS_KEY = 'agp-deleted-sensors';
const DELETED_SENSORS_PERSISTENT_KEY = 'agp-deleted-sensors-persistent-v1';

/**
 * Import sensor database from parsed SQLite data
 * 
 * @param {Object} data - Parsed database with sensors and inventory
 * @returns {Object} Import result with counts
 */
export function importSensorDatabase(data) {
  const sensorDb = {
    sensors: data.sensors || [],
    inventory: data.inventory || [],
    lastUpdated: new Date().toISOString(),
    stats: {
      totalSensors: data.sensors?.length || 0,
      dateRange: {
        min: data.sensors?.length > 0 
          ? new Date(Math.min(...data.sensors.map(s => new Date(s.start_timestamp)))).toISOString()
          : null,
        max: data.sensors?.length > 0
          ? new Date(Math.max(...data.sensors.map(s => new Date(s.start_timestamp)))).toISOString()
          : null
      }
    }
  };
  
  // Store in localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sensorDb));
  
  return {
    sensorsImported: sensorDb.sensors.length,
    inventoryItems: sensorDb.inventory.length,
    dateRange: sensorDb.stats.dateRange
  };
}

/**
 * Initialize sensor database if it doesn't exist
 * Creates empty structure in localStorage
 * 
 * @returns {Object} Database object (existing or newly created)
 */
export function initializeSensorDatabase() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    
    if (existing) {
      // Database already exists
      return JSON.parse(existing);
    }
    
    // Create new empty database
    const emptyDb = {
      sensors: [],
      inventory: [],
      lastUpdated: new Date().toISOString(),
      stats: {
        totalSensors: 0,
        dateRange: {
          min: null,
          max: null
        }
      }
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyDb));
    console.log('[sensorStorage] Initialized empty sensor database');
    
    return emptyDb;
  } catch (err) {
    console.error('[sensorStorage] Error initializing database:', err);
    return null;
  }
}

/**
 * Get full sensor database from localStorage
 * 
 * @returns {Object|null} Sensor database or null if not found
 */
export function getSensorDatabase() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    
    if (!data) {
      // Database doesn't exist yet - initialize it
      return initializeSensorDatabase();
    }
    
    return JSON.parse(data);
  } catch (err) {
    console.error('[sensorStorage] Error getting database:', err);
    return null;
  }
}

/**
 * Get sensor active at a specific date
 * 
 * @param {Date|string} date - Date to check
 * @returns {Object|null} Sensor object or null
 */
export function getSensorAtDate(date) {
  const db = getSensorDatabase();
  if (!db) return null;
  
  const targetDate = new Date(date);
  
  // Find sensor where start <= targetDate <= end
  const sensor = db.sensors.find(s => {
    const start = new Date(s.start_timestamp);
    const end = s.end_timestamp ? new Date(s.end_timestamp) : new Date();
    
    return start <= targetDate && targetDate <= end;
  });
  
  return sensor || null;
}

/**
 * Get list of deleted sensor IDs from persistent tombstone store
 * Now uses IndexedDB for durability (survives localStorage.clear())
 * 
 * @returns {Promise<Array<string>>} Array of deleted sensor IDs
 */
export async function getDeletedSensors() {
  try {
    return await getDeletedSensorsFromDB();
  } catch (err) {
    console.error('[getDeletedSensors] Error reading deleted sensors:', err);
    return [];
  }
}

/**
 * Add sensor ID to deleted list (persistent tombstone)
 * Prevents re-syncing deleted sensors from SQLite
 * Now uses IndexedDB for durability (survives localStorage.clear())
 * 
 * @param {string} sensorId - Sensor ID to mark as deleted
 * @returns {Promise<boolean>} Success status
 */
export async function addDeletedSensor(sensorId) {
  try {
    await addDeletedSensorToDB(sensorId);
    // Also sync to localStorage cache
    await syncIndexedDBToLocalStorage();
    console.log('[addDeletedSensor] Marked sensor as deleted:', sensorId);
    return true;
  } catch (err) {
    console.error('[addDeletedSensor] Error adding deleted sensor:', err);
    return false;
  }
}

// ============================================================================
// PERSISTENT DELETED SENSORS (RESURRECTION BUG FIX)
// Dual persistence: fast access (simple array) + persistent truth (structured)
// ============================================================================

/**
 * Get persistent deleted sensors store
 * This store survives localStorage.clear() because it's in a separate key
 * and has structured format with timestamps
 * 
 * @returns {Object} Persistent deleted sensors structure
 */
export function getPersistentDeletedSensors() {
  try {
    const data = localStorage.getItem(DELETED_SENSORS_PERSISTENT_KEY);
    if (!data) {
      return {
        version: 1,
        lastUpdated: new Date().toISOString(),
        sensors: []
      };
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('[getPersistentDeletedSensors] Error reading persistent deleted sensors:', err);
    return {
      version: 1,
      lastUpdated: new Date().toISOString(),
      sensors: []
    };
  }
}

/**
 * Add sensor to persistent deleted store
 * Structured format with timestamp for future cleanup
 * 
 * @param {string} sensorId - Sensor ID to mark as deleted
 */
export function addPersistentDeletedSensor(sensorId) {
  try {
    const store = getPersistentDeletedSensors();
    
    // Check if already exists
    const exists = store.sensors.some(s => s.sensor_id === sensorId);
    if (exists) {
      console.log('[addPersistentDeletedSensor] Sensor already in persistent store:', sensorId);
      return;
    }
    
    // Add with timestamp
    store.sensors.push({
      sensor_id: sensorId,
      deleted_at: new Date().toISOString(),
      version: 1
    });
    
    store.lastUpdated = new Date().toISOString();
    localStorage.setItem(DELETED_SENSORS_PERSISTENT_KEY, JSON.stringify(store));
    
    console.log('[addPersistentDeletedSensor] Added to persistent store:', sensorId);
  } catch (err) {
    console.error('[addPersistentDeletedSensor] Error adding persistent deleted sensor:', err);
  }
}

/**
 * Get all deleted sensor IDs from IndexedDB (source of truth)
 * Falls back to localStorage if IndexedDB unavailable or fails
 * 
 * @returns {Promise<Array<string>>} Array of deleted sensor IDs (deduplicated)
 */
export async function getAllDeletedSensors() {
  try {
    // Primary source: IndexedDB (survives localStorage.clear())
    if (isIndexedDBAvailable()) {
      const dbDeleted = await getDeletedSensorsFromDB();
      
      // Also check localStorage cache
      const cacheDeleted = await getDeletedSensors();
      
      // Merge and deduplicate
      const allDeleted = [...new Set([...dbDeleted, ...cacheDeleted])];
      
      console.log('[getAllDeletedSensors] Merged from IndexedDB + cache:', {
        indexedDB: dbDeleted.length,
        cache: cacheDeleted.length,
        merged: allDeleted.length
      });
      
      return allDeleted;
    }
    
    // Fallback: localStorage only (IndexedDB not available)
    console.warn('[getAllDeletedSensors] IndexedDB unavailable, using localStorage only');
    return await getDeletedSensors();
    
  } catch (err) {
    console.error('[getAllDeletedSensors] Error loading deleted sensors:', err);
    // Final fallback: localStorage
    return await getDeletedSensors();
  }
}

/**
 * Cleanup old deleted sensors (>90 days)
 * Prevents persistent store from growing forever
 * 
 * @returns {Object} Cleanup result with counts
 */
export function cleanupOldDeletedSensors() {
  try {
    const store = getPersistentDeletedSensors();
    const originalCount = store.sensors.length;
    
    const now = new Date();
    const EXPIRY_DAYS = 90;
    
    // Keep only sensors deleted within last 90 days
    store.sensors = store.sensors.filter(sensor => {
      const deletedAt = new Date(sensor.deleted_at);
      const daysSinceDelete = (now - deletedAt) / (1000 * 60 * 60 * 24);
      return daysSinceDelete < EXPIRY_DAYS;
    });
    
    const removed = originalCount - store.sensors.length;
    
    if (removed > 0) {
      store.lastUpdated = new Date().toISOString();
      localStorage.setItem(DELETED_SENSORS_PERSISTENT_KEY, JSON.stringify(store));
      console.log('[cleanupOldDeletedSensors] Removed', removed, 'expired deleted sensors');
    }
    
    return {
      removed,
      remaining: store.sensors.length,
      originalCount
    };
  } catch (err) {
    console.error('[cleanupOldDeletedSensors] Error cleaning up:', err);
    return { removed: 0, remaining: 0, originalCount: 0 };
  }
}

/**
 * Migrate old deleted sensors format to new persistent store
 * Run once on app startup to preserve existing deleted sensors
 * 
 * @returns {Promise<Object>} Migration result
 */
export async function migrateDeletedSensors() {
  try {
    const fastDeleted = await getDeletedSensors();
    const persistentStore = getPersistentDeletedSensors();
    
    let migrated = 0;
    
    fastDeleted.forEach(sensorId => {
      const exists = persistentStore.sensors.some(s => s.sensor_id === sensorId);
      if (!exists) {
        persistentStore.sensors.push({
          sensor_id: sensorId,
          deleted_at: new Date().toISOString(), // Best guess: now
          version: 1,
          migrated: true // Flag for debugging
        });
        migrated++;
      }
    });
    
    if (migrated > 0) {
      persistentStore.lastUpdated = new Date().toISOString();
      localStorage.setItem(DELETED_SENSORS_PERSISTENT_KEY, JSON.stringify(persistentStore));
      console.log('[migrateDeletedSensors] Migrated', migrated, 'sensors to persistent store');
    }
    
    return {
      migrated,
      total: persistentStore.sensors.length
    };
  } catch (err) {
    console.error('[migrateDeletedSensors] Error migrating:', err);
    return { migrated: 0, total: 0 };
  }
}

/**
 * Sync unlocked sensors to localStorage
 * Ensures all "workable" sensors (≤30 days old) are persisted in localStorage
 * so DELETE operations work. Locked sensors (>30 days) stay in SQLite only.
 * 
 * This is called once at app startup after merging SQLite + localStorage sensors.
 * 
 * @param {Array} allSensors - Merged sensor array from useSensorDatabase
 */
export async function syncUnlockedSensorsToLocalStorage(allSensors) {
  try {
    const db = getSensorDatabase();
    if (!db) {
      console.error('[syncUnlockedSensors] No database found');
      return;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    // Get list of deleted sensors from IndexedDB (source of truth)
    // This prevents resurrection of deleted sensors even after localStorage.clear()
    const deletedSensors = await getAllDeletedSensors();
    
    // Build a Set of existing sensor IDs BEFORE filtering
    const existingIds = new Set(db.sensors.map(s => s.sensor_id));

    // Filter sensors that are ≤30 days old (unlocked) AND not deleted AND not already in localStorage
    const unlockedSensors = allSensors.filter(s => {
      if (!s.start_date) return false;
      const startDate = new Date(s.start_date);
      const isRecent = startDate >= thirtyDaysAgo;
      const isDeleted = deletedSensors.includes(s.sensor_id);
      const alreadyInLocalStorage = existingIds.has(s.sensor_id);
      return isRecent && !isDeleted && !alreadyInLocalStorage;
    });

    console.log('[syncUnlockedSensors] Syncing unlocked sensors:', {
      total: allSensors.length,
      unlocked: unlockedSensors.length,
      deleted: deletedSensors.length,
      alreadyInDb: db.sensors.length,
      filteredOut: allSensors.length - unlockedSensors.length
    });

    // Add unlocked sensors that aren't already in localStorage
    // Convert to localStorage format before storing
    // NOTE: existingIds check is already done in filter above
    let addedCount = 0;
    unlockedSensors.forEach(sensor => {
      // All sensors in unlockedSensors are guaranteed to NOT be in localStorage already
      // Convert SQLite format to localStorage format
      const localStorageFormat = {
        sensor_id: sensor.sensor_id,
        start_date: sensor.start_date,
        end_date: sensor.end_date || null,
        lot_number: sensor.lot_number || null,
        hw_version: sensor.hw_version || null,
        notes: sensor.notes || '',
        reason_stop: sensor.failure_reason || null
      };
      
      db.sensors.push(localStorageFormat);
      addedCount++;
    });

    if (addedCount > 0) {
      db.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      console.log('[syncUnlockedSensors] Added', addedCount, 'unlocked sensors to localStorage');
    } else {
      console.log('[syncUnlockedSensors] All unlocked sensors already in localStorage');
    }
  } catch (err) {
    console.error('[syncUnlockedSensors] Error syncing sensors:', err);
  }
}

/**
 * Get all sensors within a date range
 * 
 * @param {Date|string} startDate - Start of range
 * @param {Date|string} endDate - End of range
 * @returns {Array} Array of sensors
 */
export function getSensorsInRange(startDate, endDate) {
  const db = getSensorDatabase();
  if (!db) return [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return db.sensors.filter(s => {
    const sensorStart = new Date(s.start_timestamp);
    const sensorEnd = s.end_timestamp ? new Date(s.end_timestamp) : new Date();
    
    // Sensor overlaps with range
    return sensorStart <= end && sensorEnd >= start;
  });
}

/**
 * Get inventory from sensor database
 * 
 * @returns {Array} Array of inventory items
 */
export function getInventory() {
  const db = getSensorDatabase();
  return db?.inventory || [];
}

/**
 * Get sensor statistics
 * 
 * @returns {Object} Stats object
 */
export function getSensorStats() {
  const db = getSensorDatabase();
  if (!db || !db.sensors.length) {
    return {
      total: 0,
      successRate: 0,
      avgDuration: 0,
      byHardware: {}
    };
  }
  
  const sensors = db.sensors;
  const successCount = sensors.filter(s => s.status === 'success').length;
  const totalWithStatus = sensors.filter(s => s.status !== 'unknown').length;
  
  const avgDuration = sensors
    .filter(s => s.duration_days)
    .reduce((sum, s) => sum + s.duration_days, 0) / sensors.filter(s => s.duration_days).length;
  
  // Group by hardware
  const byHardware = {};
  sensors.forEach(s => {
    const hw = s.hardware_version || 'Unknown';
    if (!byHardware[hw]) {
      byHardware[hw] = {
        count: 0,
        success: 0,
        avgDuration: 0,
        sensors: []
      };
    }
    byHardware[hw].count++;
    if (s.status === 'success') byHardware[hw].success++;
    byHardware[hw].sensors.push(s);
  });
  
  // Calculate avg duration per hardware
  Object.keys(byHardware).forEach(hw => {
    const hwSensors = byHardware[hw].sensors.filter(s => s.duration_days);
    byHardware[hw].avgDuration = hwSensors.length > 0
      ? hwSensors.reduce((sum, s) => sum + s.duration_days, 0) / hwSensors.length
      : 0;
  });
  
  return {
    total: sensors.length,
    successRate: totalWithStatus > 0 ? (successCount / totalWithStatus) * 100 : 0,
    avgDuration: avgDuration || 0,
    byHardware,
    lastUpdated: db.lastUpdated
  };
}

/**
 * Clear sensor database from localStorage
 * 
 * @returns {void}
 */
export function clearSensorDatabase() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if sensor database exists in localStorage
 * 
 * @returns {boolean}
 */
export function hasSensorDatabase() {
  const db = getSensorDatabase();
  return db !== null && db.sensors?.length > 0;
}

/**
 * Add a single sensor to the database
 * 
 * @param {Object} sensorData - Sensor record
 * @returns {Promise<void>}
 */
export async function addSensor(sensorData) {
  const db = getSensorDatabase() || { sensors: [], inventory: [], lastUpdated: new Date().toISOString() };
  
  // Check if sensor already exists (by sensor_id or start_date)
  const exists = db.sensors.some(s => 
    s.sensor_id === sensorData.id || 
    s.start_date === sensorData.startTimestamp
  );
  
  if (!exists) {
    // Convert to match SQLite schema (sensor_id, start_date, end_date)
    const sensor = {
      sensor_id: sensorData.id,
      start_date: sensorData.startTimestamp,
      end_date: sensorData.endTimestamp,
      duration_hours: sensorData.durationHours,
      duration_days: sensorData.durationDays,
      reason_stop: sensorData.reasonStop,
      success: sensorData.status === 'success' ? 1 : 0, // SQLite uses 1/0
      status: sensorData.status,
      confidence: sensorData.confidence,
      lot_number: sensorData.lotNumber,
      hw_version: sensorData.hardwareVersion,
      fw_version: sensorData.firmwareVersion,
      notes: sensorData.notes,
      sequence: sensorData.sequence
    };
    
    db.sensors.push(sensor);
    db.lastUpdated = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

/**
 * Update the end timestamp of a sensor
 * 
 * @param {string} sensorId - Sensor ID to update
 * @param {string} endTimestamp - ISO timestamp string
 * @returns {Promise<boolean>} True if updated, false if not found
 */
export async function updateSensorEndTime(sensorId, endTimestamp) {
  const db = getSensorDatabase();
  if (!db) return false;
  
  const sensor = db.sensors.find(s => s.sensor_id === sensorId);
  if (!sensor) return false;
  
  sensor.end_date = endTimestamp;
  
  // Recalculate duration if both start and end are set
  if (sensor.start_date && endTimestamp) {
    const start = new Date(sensor.start_date);
    const end = new Date(endTimestamp);
    const durationMs = end - start;
    sensor.duration_hours = durationMs / (1000 * 60 * 60);
    sensor.duration_days = sensor.duration_hours / 24;
  }
  
  db.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  
  return true;
}

/**
 * Find the most recent sensor that started before a given timestamp
 * 
 * @param {Date|string} beforeTimestamp - Find sensor before this time
 * @returns {Object|null} Most recent sensor or null
 */
export function getMostRecentSensorBefore(beforeTimestamp) {
  const db = getSensorDatabase();
  if (!db || !db.sensors.length) return null;
  
  const targetTime = new Date(beforeTimestamp);
  
  // Filter sensors that started before the target time
  const candidateSensors = db.sensors.filter(s => {
    const start = new Date(s.start_date);
    return start < targetTime;
  });
  
  if (candidateSensors.length === 0) return null;
  
  // Sort by start_date descending (most recent first)
  candidateSensors.sort((a, b) => {
    return new Date(b.start_date) - new Date(a.start_date);
  });
  
  return candidateSensors[0];
}

/**
 * Get sensor history for export
 * Returns array of sensors or empty array
 * 
 * @returns {Array}
 */
export function getSensorHistory() {
  const db = getSensorDatabase();
  return db?.sensors || [];
}

// ============================================================================
// PHASE 5: LOCK SYSTEM
// Automatic protection for historical sensors (>30 days old)
// ============================================================================

/**
 * Calculate if a sensor is locked (>30 days old from start_date)
 * Locked sensors are protected from accidental deletion/modification
 * 
 * @param {string} startDate - Sensor start_date (ISO format)
 * @returns {boolean} - True if sensor is locked (>30 days old)
 */
export function isSensorLocked(startDate) {
  if (!startDate) return false;
  
  const sensorStart = new Date(startDate);
  const now = new Date();
  const daysDiff = (now - sensorStart) / (1000 * 60 * 60 * 24);
  
  return daysDiff > 30;
}

/**
 * Get detailed lock status with timing information
 * Useful for UI display and decision making
 * 
 * @param {string} startDate - Sensor start_date (ISO format)
 * @returns {Object} Lock status details
 * @returns {boolean} .isLocked - Whether sensor is currently locked
 * @returns {number|null} .daysSinceStart - Days since sensor started
 * @returns {number|null} .daysUntilUnlock - Days until lock expires (null if locked)
 */
export function getSensorLockStatus(startDate) {
  if (!startDate) {
    return {
      isLocked: false,
      daysSinceStart: null,
      daysUntilUnlock: null
    };
  }
  
  const sensorStart = new Date(startDate);
  const now = new Date();
  const daysSinceStart = Math.floor((now - sensorStart) / (1000 * 60 * 60 * 24));
  const isLocked = daysSinceStart > 30;
  const daysUntilUnlock = isLocked ? null : Math.max(0, 30 - daysSinceStart);
  
  return {
    isLocked,
    daysSinceStart,
    daysUntilUnlock
  };
}

/**
 * Delete sensor with manual lock protection
 * Uses is_manually_locked field - user must unlock before deleting
 * 
 * @param {string} sensorId - Sensor ID to delete
 * @returns {Promise<Object>} Result object
 * @returns {boolean} .success - Whether deletion succeeded
 * @returns {string} .message - User-friendly message
 */
export async function deleteSensorWithLockCheck(sensorId) {
  const db = getSensorDatabase();
  if (!db || !db.sensors) {
    // Database doesn't exist yet or is empty
    // This can happen if sensor is only in memory (from CSV detection)
    // In that case, we can't delete it from localStorage, but we return success
    // so the UI doesn't show an error. The sensor won't appear after refresh.
    console.log('[deleteSensorWithLockCheck] No database found, sensor likely in-memory only');
    return {
      success: true,
      message: '✓ Sensor verwijderd (alleen uit geheugen)'
    };
  }
  
  const sensor = db.sensors.find(s => s.sensor_id === sensorId);
  
  if (!sensor) {
    // Sensor not in localStorage database
    // This can happen if sensor was detected from CSV but not yet persisted
    // We return success so UI doesn't show error
    console.log('[deleteSensorWithLockCheck] Sensor not in localStorage, likely in-memory only:', sensorId);
    return {
      success: true,
      message: '✓ Sensor verwijderd (alleen uit geheugen)'
    };
  }
  
  // Check manual lock status with enhanced context
  const lockStatus = getManualLockStatus(sensorId, sensor.start_date);
  
  console.log('[deleteSensorWithLockCheck] Lock status:', {
    sensorId,
    isLocked: lockStatus.isLocked,
    isEditable: lockStatus.isEditable,
    storageSource: lockStatus.storageSource,
    reason: lockStatus.reason
  });
  
  if (lockStatus.isLocked) {
    const detail = lockStatus.storageSource === 'sqlite' 
      ? 'Deze sensor is read-only (historische data uit SQLite database).\n\n' +
        'Verwijderen is niet mogelijk voor oude sensoren (>30 dagen).'
      : 'Deze sensor is handmatig vergrendeld om accidenteel verwijderen te voorkomen.\n\n' +
        'Klik eerst op het slotje om te ontgrendelen, dan verwijderen.';
    
    return {
      success: false,
      message: '🔒 Sensor is vergrendeld',
      detail: detail
    };
  }
  
  // Proceed with deletion
  db.sensors = db.sensors.filter(s => s.sensor_id !== sensorId);
  db.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  
  // TRIPLE PERSISTENCE: IndexedDB (truth) + localStorage (cache) + legacy
  // 1. IndexedDB (source of truth, survives localStorage.clear())
  try {
    if (isIndexedDBAvailable()) {
      await addDeletedSensorToDB(sensorId);
    }
  } catch (err) {
    console.error('[deleteSensorWithLockCheck] IndexedDB write failed:', err);
    // Continue anyway - localStorage still works
  }
  
  // 2. localStorage cache (fast access) - NOW ASYNC
  await addDeletedSensor(sensorId);
  
  // 3. Legacy persistent store (backward compat)
  addPersistentDeletedSensor(sensorId);
  
  console.log('[deleteSensorWithLockCheck] Sensor deleted (triple persistence):', sensorId);
  
  return {
    success: true,
    message: '✅ Sensor verwijderd'
  };
}

/**
 * Get lock statistics for all sensors
 * Useful for dashboard/summary displays
 * 
 * @returns {Object} Lock statistics
 */
export function getLockStatistics() {
  const db = getSensorDatabase();
  if (!db || !db.sensors) {
    return {
      total: 0,
      locked: 0,
      unlocked: 0,
      lockedPercentage: 0
    };
  }
  
  const sensors = db.sensors;
  const locked = sensors.filter(s => isSensorLocked(s.start_date));
  const unlocked = sensors.filter(s => !isSensorLocked(s.start_date));
  
  return {
    total: sensors.length,
    locked: locked.length,
    unlocked: unlocked.length,
    lockedPercentage: sensors.length > 0 ? (locked.length / sensors.length * 100).toFixed(1) : 0
  };
}

// ============================================================================
// PHASE 5B: MANUAL LOCK SYSTEM
// User-controlled lock toggles per sensor
// ============================================================================

/**
 * Initialize manual lock status for all sensors
 * Sets is_manually_locked based on age: >30 days = locked, <=30 days = unlocked
 * Only runs once - skips sensors that already have the field
 * 
 * @returns {Object} Result with counts
 */
export function initializeManualLocks() {
  const db = getSensorDatabase();
  if (!db || !db.sensors) {
    return { success: false, message: 'Database niet gevonden' };
  }

  let initialized = 0;
  let alreadySet = 0;

  db.sensors.forEach(sensor => {
    // Skip if already has manual lock field
    if (sensor.is_manually_locked !== undefined) {
      alreadySet++;
      return;
    }

    // Set based on age: >30 days = locked
    const daysSinceStart = Math.floor((new Date() - new Date(sensor.start_date)) / (1000 * 60 * 60 * 24));
    sensor.is_manually_locked = daysSinceStart > 30;
    initialized++;
  });

  if (initialized > 0) {
    db.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  return {
    success: true,
    initialized,
    alreadySet,
    total: db.sensors.length
  };
}

/**
 * Toggle manual lock status for a sensor
 * Now with enhanced error messages and full context
 * 
 * @param {string} sensorId - Sensor ID to toggle
 * @returns {Object} Result object with success, message, and optional detail
 */
export function toggleSensorLock(sensorId) {
  const db = getSensorDatabase();
  if (!db || !db.sensors) {
    return {
      success: false,
      message: 'Database niet gevonden',
      detail: 'Kan lock status niet wijzigen zonder sensor database.',
      isLocked: null
    };
  }

  let sensor = db.sensors.find(s => s.sensor_id === sensorId);
  
  if (!sensor) {
    // Sensor not in localStorage - it's a read-only SQLite sensor
    console.log('[toggleSensorLock] Sensor not in localStorage:', sensorId);
    console.log('[toggleSensorLock] This sensor is read-only (SQLite historical data)');
    
    return {
      success: false,
      message: 'âš ï¸ Kan lock niet wijzigen: sensor is alleen-lezen',
      detail: 'Deze sensor bevindt zich in de historische database (SQLite) en is meer dan 30 dagen oud.\n\n' +
              'Alleen recente sensoren (â‰¤30 dagen oud) kunnen worden bewerkt.\n\n' +
              'Badge: HISTORICAL = read-only, RECENT = editable',
      isLocked: null
    };
  }

  // Initialize if needed
  if (sensor.is_manually_locked === undefined) {
    const daysSinceStart = Math.floor((new Date() - new Date(sensor.start_date)) / (1000 * 60 * 60 * 24));
    sensor.is_manually_locked = daysSinceStart > 30;
  }

  // Toggle
  sensor.is_manually_locked = !sensor.is_manually_locked;

  // Save
  db.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

  console.log(`[toggleSensorLock] Toggled lock for ${sensorId}: ${sensor.is_manually_locked ? 'LOCKED' : 'UNLOCKED'}`);

  return {
    success: true,
    isLocked: sensor.is_manually_locked,
    message: sensor.is_manually_locked ? 'Sensor vergrendeld' : 'Sensor ontgrendeld'
  };
}

/**
 * Get manual lock status for a sensor
 * Returns comprehensive lock information including editability and storage source
 * 
 * IMPORTANT: This function is called from SensorHistoryModal with the MERGED sensor object
 * The sensor might be from SQLite (not in localStorage), so we calculate lock based on start_date
 * 
 * @param {string} sensorId - Sensor ID
 * @param {string} startDate - Optional: sensor start_date for fallback calculation
 * @returns {Object} Lock status with full context
 *   - isLocked: boolean - Whether sensor is locked
 *   - autoCalculated: boolean - Whether lock was auto-calculated vs manually set
 *   - isEditable: boolean - Whether sensor can be modified (localStorage only)
 *   - storageSource: string - 'localStorage' | 'sqlite' | 'unknown'
 *   - reason: string - Why sensor is in this state
 *   - detail: string - User-friendly explanation (Priority 3.3 enhancement)
 */
export function getManualLockStatus(sensorId, startDate = null) {
  const db = getSensorDatabase();
  if (!db || !db.sensors) {
    // No localStorage database - calculate from startDate if provided
    if (startDate) {
      const daysSinceStart = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
      return {
        isLocked: daysSinceStart > 30,
        autoCalculated: true,
        isEditable: false,
        storageSource: 'unknown',
        reason: 'no-database',
        detail: 'Sensor database not found. This sensor cannot be edited.'
      };
    }
    return { 
      isLocked: false, 
      autoCalculated: true, 
      isEditable: false,
      storageSource: 'unknown',
      reason: 'no-database',
      detail: 'Sensor database not found. This sensor cannot be edited.'
    };
  }

  const sensor = db.sensors.find(s => s.sensor_id === sensorId);
  if (!sensor) {
    // Sensor not in localStorage - it's SQLite-only (historical, read-only)
    // Calculate lock based on startDate if provided
    if (startDate) {
      const daysSinceStart = Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
      return {
        isLocked: daysSinceStart > 30,
        autoCalculated: true,
        isEditable: false,
        storageSource: 'sqlite',
        reason: 'read-only-historical',
        detail: 'This sensor is from the historical database (>30 days old) and cannot be edited. ' +
                'Only recent sensors (<30 days) can be locked/unlocked.'
      };
    }
    // No startDate provided - assume locked (safe default for old sensors)
    return { 
      isLocked: true, 
      autoCalculated: true, 
      isEditable: false,
      storageSource: 'sqlite',
      reason: 'no-start-date',
      detail: 'Sensor not found in editable database. It may be historical (>30 days old).'
    };
  }

  // Sensor is in localStorage - editable
  // If manual lock not set, calculate based on age
  if (sensor.is_manually_locked === undefined) {
    const daysSinceStart = Math.floor((new Date() - new Date(sensor.start_date)) / (1000 * 60 * 60 * 24));
    const isLocked = daysSinceStart > 30;
    return {
      isLocked,
      autoCalculated: true,
      isEditable: true,
      storageSource: 'localStorage',
      reason: 'auto-calculated',
      detail: isLocked 
        ? `Automatically locked because sensor is ${daysSinceStart} days old (>30 days).`
        : `Sensor is ${daysSinceStart} days old. Lock status can be changed manually.`
    };
  }

  // Manual lock is set - use that value
  return {
    isLocked: sensor.is_manually_locked,
    autoCalculated: false,
    isEditable: true,
    storageSource: 'localStorage',
    reason: 'manual',
    detail: 'Lock status has been manually set by user.'
  };
}


// ============================================================================
// PHASE 6: EXPORT/IMPORT
// Backup and restore sensor database with full control
// ============================================================================

/**
 * Export sensor database to JSON format
 * Includes localStorage sensors, deleted sensors, and lock states
 * 
 * @returns {Promise<Object>} Export result
 *   - success: boolean
 *   - data: Object (export payload)
 *   - filename: string
 *   - error: string (if failed)
 */
export async function exportSensorsToJSON() {
  try {
    // 1. Get localStorage sensors
    const db = getSensorDatabase();
    if (!db || !db.sensors || db.sensors.length === 0) {
      return { 
        success: false, 
        error: 'Geen sensoren om te exporteren' 
      };
    }

    // 2. Get deleted sensors with timestamps from IndexedDB
    const deletedSensors = await getDeletedSensorsWithTimestamps();
    
    // Warn if no deleted sensors found (might be error or genuinely empty)
    if (deletedSensors.length === 0) {
      console.warn('[exportSensorsToJSON] No deleted sensors found - either none exist or IndexedDB load failed');
    }

    // 3. Get stock batches and assignments (Phase 5)
    let batches = [];
    let assignments = [];
    try {
      const { getAllBatches, getAllAssignments } = await import('./stockStorage.js');
      batches = getAllBatches();
      assignments = getAllAssignments();
    } catch (err) {
      console.warn('[exportSensorsToJSON] Stock data not available:', err);
    }

    // 4. Package data
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      sensors: db.sensors,
      deletedSensors: deletedSensors,
      batches: batches,
      assignments: assignments,
      metadata: {
        totalSensors: db.sensors.length,
        deletedCount: deletedSensors.length,
        batchesCount: batches.length,
        assignmentsCount: assignments.length
      }
    };

    // 5. Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `agp-sensors-${dateStr}.json`;

    console.log('[exportSensorsToJSON] Export prepared:', {
      sensors: exportData.sensors.length,
      deleted: exportData.deletedSensors.length,
      batches: exportData.batches.length,
      assignments: exportData.assignments.length,
      filename
    });

    return { 
      success: true, 
      data: exportData, 
      filename 
    };
  } catch (err) {
    console.error('[exportSensorsToJSON] Export failed:', err);
    return { 
      success: false, 
      error: err.message || 'Export mislukt' 
    };
  }
}

/**
 * Validate imported JSON data structure
 * Checks for required fields and data integrity
 * 
 * @param {Object} data - Parsed JSON data
 * @returns {Array|null} Array of error messages, or null if valid
 */
export function validateImportData(data) {
  const errors = [];

  // Check basic structure
  if (!data || typeof data !== 'object') {
    errors.push('Invalid JSON format');
    return errors;
  }

  // Check version
  if (!data.version) {
    errors.push('Missing version field');
  } else if (data.version !== '1.0') {
    errors.push(`Unsupported version: ${data.version} (expected 1.0)`);
  }

  // Check sensors array
  if (!Array.isArray(data.sensors)) {
    errors.push('Missing or invalid sensors array');
  } else {
    // Validate sensor structure
    data.sensors.forEach((sensor, idx) => {
      if (!sensor.sensor_id) {
        errors.push(`Sensor ${idx}: missing sensor_id`);
      }
      if (!sensor.start_date) {
        errors.push(`Sensor ${idx}: missing start_date`);
      }
    });
  }

  // Check deletedSensors array (optional for backward compatibility)
  if (data.deletedSensors !== undefined) {
    if (!Array.isArray(data.deletedSensors)) {
      errors.push('Invalid deletedSensors field (must be array)');
    } else {
      // Validate deleted sensor structure
      data.deletedSensors.forEach((deleted, idx) => {
        if (!deleted.sensorId) {
          errors.push(`Deleted sensor ${idx}: missing sensorId`);
        }
        if (!deleted.deletedAt || typeof deleted.deletedAt !== 'number') {
          errors.push(`Deleted sensor ${idx}: missing or invalid deletedAt timestamp`);
        }
      });
    }
  }

  // Check metadata (optional for backward compatibility)
  if (data.metadata !== undefined && typeof data.metadata !== 'object') {
    errors.push('Invalid metadata field (must be object)');
  }

  return errors.length > 0 ? errors : null;
}

/**
 * Import sensors from JSON backup
 * Supports MERGE (add new, keep existing) or REPLACE (wipe + restore) modes
 * 
 * @param {Object} data - Parsed JSON data
 * @param {Object} options - Import options
 * @param {boolean} options.importDeleted - Import deleted sensors list
 * @param {boolean} options.importLocks - Import lock states
 * @param {string} options.mode - 'merge' or 'replace'
 * @returns {Promise<Object>} Import result
 *   - success: boolean
 *   - summary: Object with counts
 *   - error: string (if failed)
 */
export async function importSensorsFromJSON(data, options = {}) {
  try {
    // 1. Validate data
    const errors = validateImportData(data);
    if (errors) {
      return {
        success: false,
        error: 'Validatie mislukt:\n' + errors.join('\n')
      };
    }

    // 2. Get current database
    const db = getSensorDatabase();
    if (!db) {
      return { success: false, error: 'Kan database niet laden' };
    }

    // 3. Handle REPLACE mode
    if (options.mode === 'replace') {
      // Create backup before destructive operation
      createDatabaseBackup();
      // Wipe localStorage
      db.sensors = [];
      console.log('[importSensorsFromJSON] REPLACE mode: cleared existing sensors');
    }

    // 4. Import sensors
    let added = 0;
    let skipped = 0;
    const existingIds = new Set(db.sensors.map(s => s.sensor_id));

    data.sensors.forEach(sensor => {
      if (options.mode === 'merge' && existingIds.has(sensor.sensor_id)) {
        skipped++;
        return;
      }

      // Import sensor (optionally strip lock state)
      const importedSensor = { ...sensor };
      if (!options.importLocks) {
        delete importedSensor.is_manually_locked;
      }

      db.sensors.push(importedSensor);
      added++;
    });
    
    // Warn if lock states were ignored
    if (!options.importLocks) {
      const sensorsWithLocks = data.sensors.filter(s => s.is_manually_locked !== undefined).length;
      if (sensorsWithLocks > 0) {
        console.warn(
          `[importSensorsFromJSON] Ignored lock states for ${sensorsWithLocks} sensors (importLocks=false)`
        );
      }
    }

    // 5. Save to localStorage
    db.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

    // 6. Import deleted sensors to IndexedDB (if enabled)
    let deletedAdded = 0;
    if (options.importDeleted && data.deletedSensors && data.deletedSensors.length > 0) {
      for (const deleted of data.deletedSensors) {
        try {
          await addDeletedSensorToDB(deleted.sensorId);
          deletedAdded++;
        } catch (err) {
          console.error('[importSensorsFromJSON] Error adding deleted sensor:', err);
        }
      }
      // Sync to localStorage cache
      await syncIndexedDBToLocalStorage();
    } else if (!options.importDeleted && data.deletedSensors && data.deletedSensors.length > 0) {
      console.warn(
        `[importSensorsFromJSON] Skipping ${data.deletedSensors.length} deleted sensors (importDeleted=false)`
      );
    }

    console.log('[importSensorsFromJSON] Import complete:', {
      mode: options.mode,
      added,
      skipped,
      deletedAdded
    });

    // 7. Import batches and assignments (Phase 5)
    let batchesAdded = 0;
    let assignmentsAdded = 0;
    if (data.batches || data.assignments) {
      try {
        const stockStorage = await import('./stockStorage.js');
        
        // Import batches
        if (data.batches && data.batches.length > 0) {
          for (const batch of data.batches) {
            stockStorage.saveBatch(batch);
            batchesAdded++;
          }
        }
        
        // Import assignments
        if (data.assignments && data.assignments.length > 0) {
          const existingAssignments = stockStorage.getAllAssignments();
          const assignmentsToAdd = data.assignments.filter(a => 
            !existingAssignments.some(ea => ea.sensor_id === a.sensor_id)
          );
          
          for (const assignment of assignmentsToAdd) {
            stockStorage.assignSensorToBatch(assignment.sensor_id, assignment.batch_id, assignment.assigned_by || 'import');
            assignmentsAdded++;
          }
        }
        
        console.log('[importSensorsFromJSON] Stock data imported:', { batchesAdded, assignmentsAdded });
      } catch (err) {
        console.warn('[importSensorsFromJSON] Stock import failed (non-fatal):', err);
      }
    }

    // Clear backup after successful import
    if (options.mode === 'replace') {
      clearDatabaseBackup();
    }

    return {
      success: true,
      summary: {
        sensorsAdded: added,
        sensorsSkipped: skipped,
        deletedAdded: deletedAdded,
        batchesAdded: batchesAdded,
        assignmentsAdded: assignmentsAdded,
        mode: options.mode
      }
    };
  } catch (err) {
    console.error('[importSensorsFromJSON] Import failed:', err);
    
    // Rollback REPLACE mode on error
    if (options.mode === 'replace') {
      console.log('[importSensorsFromJSON] Rolling back REPLACE...');
      restoreDatabaseBackup();
    }
    
    return {
      success: false,
      error: err.message || 'Import mislukt'
    };
  }
}

// ============================================================================
// BACKUP & ROLLBACK FOR SAFE IMPORT
// Creates temporary backup before REPLACE mode, allows rollback on error
// ============================================================================

const BACKUP_KEY = 'agp-sensor-database-backup';

/**
 * Create backup of current database before destructive operation
 * Stores in separate localStorage key for recovery
 * 
 * @returns {boolean} Success status
 */
export function createDatabaseBackup() {
  try {
    const db = getSensorDatabase();
    if (!db) {
      console.warn('[createDatabaseBackup] No database to backup');
      return false;
    }

    localStorage.setItem(BACKUP_KEY, JSON.stringify(db));
    console.log('[createDatabaseBackup] Backup created:', {
      sensors: db.sensors.length
    });
    return true;
  } catch (err) {
    console.error('[createDatabaseBackup] Backup failed:', err);
    return false;
  }
}

/**
 * Restore database from backup
 * Used for rollback after failed import
 * 
 * @returns {boolean} Success status
 */
export function restoreDatabaseBackup() {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) {
      console.warn('[restoreDatabaseBackup] No backup found');
      return false;
    }

    localStorage.setItem(STORAGE_KEY, backup);
    console.log('[restoreDatabaseBackup] Database restored from backup');
    return true;
  } catch (err) {
    console.error('[restoreDatabaseBackup] Restore failed:', err);
    return false;
  }
}

/**
 * Clear backup after successful operation
 * Frees up localStorage space
 */
export function clearDatabaseBackup() {
  try {
    localStorage.removeItem(BACKUP_KEY);
    console.log('[clearDatabaseBackup] Backup cleared');
  } catch (err) {
    console.error('[clearDatabaseBackup] Clear failed:', err);
  }
}

/**
 * Clean up old deleted sensor records
 * Removes entries older than specified days (default: 90)
 * Migrates old format (string IDs) to new format ({ sensorId, deletedAt })
 * @param {number} expiryDays - Days after which to expire deleted records
 * @returns {Object} Cleanup statistics
 */
export function cleanupDeletedSensors(expiryDays = 90) {
  const startTime = performance.now();
  
  try {
    const deleted = JSON.parse(localStorage.getItem(DELETED_SENSORS_KEY) || '[]');
    const now = Date.now();
    const expiryMs = expiryDays * 24 * 60 * 60 * 1000;
    
    let migrated = 0;
    let removed = 0;
    
    // Phase 1: Migrate old format to new format
    const withTimestamps = deleted.map(entry => {
      if (typeof entry === 'string') {
        // Old format: just sensor ID
        migrated++;
        return { sensorId: entry, deletedAt: now };
      }
      // New format: already has timestamp
      return entry;
    });
    
    // Phase 2: Remove expired entries
    const active = withTimestamps.filter(entry => {
      const age = now - entry.deletedAt;
      const isExpired = age > expiryMs;
      if (isExpired) removed++;
      return !isExpired;
    });
    
    // Phase 3: Save cleaned list
    localStorage.setItem(DELETED_SENSORS_KEY, JSON.stringify(active));
    
    const duration = performance.now() - startTime;
    const stats = {
      migrated,
      removed,
      remaining: active.length,
      duration: `${duration.toFixed(1)}ms`
    };
    
    console.log('[cleanupDeletedSensors] Cleanup complete:', stats);
    return stats;
    
  } catch (err) {
    console.error('[cleanupDeletedSensors] Cleanup failed:', err);
    return { error: err.message };
  }
}
