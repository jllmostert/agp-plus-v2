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
 * Get full sensor database from localStorage
 * 
 * @returns {Object|null} Sensor database or null if not found
 */
export function getSensorDatabase() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
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
