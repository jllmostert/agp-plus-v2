/**
 * SENSOR STORAGE MODULE
 * 
 * Manages Guardian 4 sensor database in IndexedDB.
 * Imports from master_sensors.db (SQLite) → IndexedDB for browser access.
 * 
 * Architecture:
 * - sensors: Array of sensor records (start, end, lot, hardware, etc.)
 * - inventory: Array of inventory records (lot, quantity, expiry)
 * - lastUpdated: Timestamp of last import
 * 
 * @module sensorStorage
 * @version 3.6.0
 */

import { openDB, STORES } from './db.js';

const SENSOR_STORE = STORES.SENSOR_DATA;
const SENSOR_KEY = 'sensorDatabase';

/**
 * Initialize sensor storage in IndexedDB
 * Store is automatically created by db.js v4 upgrade
 */
export async function initSensorStorage() {
  // Just ensure db is ready - store is created by db.js
  const db = await openDB();
  return db;
}

/**
 * Import sensor database from parsed SQLite data
 * 
 * Expected format:
 * {
 *   sensors: [
 *     {
 *       id, start_timestamp, end_timestamp, duration_hours, duration_days,
 *       reason_stop, status, confidence, lot_number, hardware_version,
 *       firmware_version, notes, csv_source
 *     }
 *   ],
 *   inventory: [
 *     { lot_number, quantity, expiry_date, box_size, notes }
 *   ]
 * }
 * 
 * @param {Object} data - Parsed sensor database
 * @returns {Promise<Object>} Import result with counts
 */
export async function importSensorDatabase(data) {
  const db = await initSensorStorage();
  
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
  
  const tx = db.transaction(SENSOR_STORE, 'readwrite');
  await tx.store.put(sensorDb, SENSOR_KEY);
  await tx.done;
  
  return {
    sensorsImported: sensorDb.sensors.length,
    inventoryItems: sensorDb.inventory.length,
    dateRange: sensorDb.stats.dateRange
  };
}

/**
 * Get full sensor database from IndexedDB
 * 
 * @returns {Promise<Object|null>} Sensor database or null if not found
 */
export async function getSensorDatabase() {
  try {
    const db = await openDB();
    
    // Check if store exists before trying to access it
    if (!db.objectStoreNames.contains(SENSOR_STORE)) {
      console.warn('[sensorStorage] Store not found, database needs upgrade');
      return null;
    }
    
    const tx = db.transaction(SENSOR_STORE, 'readonly');
    const data = await tx.store.get(SENSOR_KEY);
    await tx.done;
    
    return data || null;
  } catch (err) {
    console.error('[sensorStorage] Error getting database:', err);
    return null;
  }
}

/**
 * Get sensor active at a specific date
 * 
 * @param {Date|string} date - Date to check
 * @returns {Promise<Object|null>} Sensor object or null
 */
export async function getSensorAtDate(date) {
  const db = await getSensorDatabase();
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
 * @returns {Promise<Array>} Array of sensors
 */
export async function getSensorsInRange(startDate, endDate) {
  const db = await getSensorDatabase();
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
 * @returns {Promise<Array>} Array of inventory items
 */
export async function getInventory() {
  const db = await getSensorDatabase();
  return db?.inventory || [];
}

/**
 * Get sensor statistics
 * 
 * @returns {Promise<Object>} Stats object
 */
export async function getSensorStats() {
  const db = await getSensorDatabase();
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
 * Clear sensor database from IndexedDB
 * 
 * @returns {Promise<void>}
 */
export async function clearSensorDatabase() {
  const db = await initSensorStorage();
  const tx = db.transaction(SENSOR_STORE, 'readwrite');
  await tx.store.delete(SENSOR_KEY);
  await tx.done;
}

/**
 * Check if sensor database exists in IndexedDB
 * 
 * @returns {Promise<boolean>}
 */
export async function hasSensorDatabase() {
  const db = await getSensorDatabase();
  return db !== null && db.sensors?.length > 0;
}
