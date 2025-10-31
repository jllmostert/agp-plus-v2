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
 * 
 * @module sensorStorage
 * @version 3.6.0
 */

const STORAGE_KEY = 'agp-sensor-database';

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
 * Sync unlocked sensors to localStorage
 * Ensures all "workable" sensors (≤30 days old) are persisted in localStorage
 * so DELETE operations work. Locked sensors (>30 days) stay in SQLite only.
 * 
 * This is called once at app startup after merging SQLite + localStorage sensors.
 * 
 * @param {Array} allSensors - Merged sensor array from useSensorDatabase
 */
export function syncUnlockedSensorsToLocalStorage(allSensors) {
  try {
    const db = getSensorDatabase();
    if (!db) {
      console.error('[syncUnlockedSensors] No database found');
      return;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Filter sensors that are ≤30 days old (unlocked)
    const unlockedSensors = allSensors.filter(s => {
      if (!s.start_date) return false;
      const startDate = new Date(s.start_date);
      return startDate >= thirtyDaysAgo;
    });

    console.log('[syncUnlockedSensors] Syncing unlocked sensors:', {
      total: allSensors.length,
      unlocked: unlockedSensors.length,
      alreadyInDb: db.sensors.length
    });

    // Build a Set of existing sensor IDs to avoid duplicates
    const existingIds = new Set(db.sensors.map(s => s.sensor_id));

    // Add unlocked sensors that aren't already in localStorage
    // Convert to localStorage format before storing
    let addedCount = 0;
    unlockedSensors.forEach(sensor => {
      if (!existingIds.has(sensor.sensor_id)) {
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
        existingIds.add(sensor.sensor_id);
        addedCount++;
      }
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
 * @returns {Object} Result object
 * @returns {boolean} .success - Whether deletion succeeded
 * @returns {string} .message - User-friendly message
 */
export function deleteSensorWithLockCheck(sensorId) {
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
  
  // Check manual lock status
  const lockStatus = getManualLockStatus(sensorId);
  
  if (lockStatus.isLocked) {
    return {
      success: false,
      message: '🔒 Sensor is vergrendeld. Klik eerst op het slotje om te ontgrendelen.'
    };
  }
  
  // Proceed with deletion
  db.sensors = db.sensors.filter(s => s.sensor_id !== sensorId);
  db.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  
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
 * 
 * @param {string} sensorId - Sensor ID to toggle
 * @returns {Object} Result object
 */
export function toggleSensorLock(sensorId) {
  const db = getSensorDatabase();
  if (!db || !db.sensors) {
    return {
      success: false,
      message: 'Database niet gevonden',
      isLocked: null
    };
  }

  const sensor = db.sensors.find(s => s.sensor_id === sensorId);
  if (!sensor) {
    return {
      success: false,
      message: 'Sensor niet gevonden',
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

  return {
    success: true,
    isLocked: sensor.is_manually_locked,
    message: sensor.is_manually_locked ? 'Sensor vergrendeld' : 'Sensor ontgrendeld'
  };
}

/**
 * Get manual lock status for a sensor
 * Returns the is_manually_locked field, or auto-calculates if not set
 * 
 * @param {string} sensorId - Sensor ID
 * @returns {Object} Lock status
 */
export function getManualLockStatus(sensorId) {
  const db = getSensorDatabase();
  if (!db || !db.sensors) {
    return { isLocked: false, autoCalculated: true };
  }

  const sensor = db.sensors.find(s => s.sensor_id === sensorId);
  if (!sensor) {
    return { isLocked: false, autoCalculated: true };
  }

  // If manual lock not set, calculate based on age
  if (sensor.is_manually_locked === undefined) {
    const daysSinceStart = Math.floor((new Date() - new Date(sensor.start_date)) / (1000 * 60 * 60 * 24));
    return {
      isLocked: daysSinceStart > 30,
      autoCalculated: true
    };
  }

  return {
    isLocked: sensor.is_manually_locked,
    autoCalculated: false
  };
}
