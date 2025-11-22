/**
 * IndexedDB Wrapper for AGP+ Sensor Storage
 * 
 * Purpose: Handle large sensor datasets (>10MB) that exceed localStorage limits
 * Browser Support: Chrome 24+, Firefox 16+, Safari 10+, Edge 12+
 * 
 * Architecture:
 * - Database: 'agp-plus-db' v1
 * - ObjectStore: 'sensors' (keyPath: 'id')
 * - Indexes: sensor_id (unique), start_date, status
 * 
 * @module storage/indexedDB
 */

// ============================================================================
// CONSTANTS
// ============================================================================

import { debug } from '../utils/debug.js';

const DB_NAME = 'agp-plus-db';
const DB_VERSION = 1;
const STORE_NAME = 'sensors';

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initialize IndexedDB database
 * Creates database + object store + indexes if needed
 * 
 * @returns {Promise<IDBDatabase>} Database instance
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    // Check browser support
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }

    debug.log('[IndexedDB] Opening database...');
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handle upgrade needed (first time or version change)
    request.onupgradeneeded = (event) => {
      debug.log('[IndexedDB] Upgrade needed, creating schema...');
      
      const db = event.target.result;

      // Create object store if doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id',
          autoIncrement: false  // We'll provide UUIDs
        });

        // Create indexes
        objectStore.createIndex('sensor_id', 'sensor_id', { unique: true });
        objectStore.createIndex('start_date', 'start_date', { unique: false });
        objectStore.createIndex('status', 'status', { unique: false });

        debug.log('[IndexedDB] Object store + indexes created');
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      debug.log('[IndexedDB] Database opened successfully');
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Database open failed:', event.target.error);
      reject(event.target.error);
    };

    request.onblocked = () => {
      debug.warn('[IndexedDB] Database open blocked (close other tabs?)');
      reject(new Error('Database open blocked - close other tabs'));
    };
  });
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Save sensors to IndexedDB (batch operation)
 * Replaces existing sensors with same sensor_id
 * 
 * @param {Array<Object>} sensors - Array of sensor objects
 * @returns {Promise<Object>} { success: true, count: number }
 */
export async function saveSensors(sensors) {
  if (!Array.isArray(sensors)) {
    throw new Error('saveSensors expects an array');
  }

  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Add each sensor
    sensors.forEach((sensor, idx) => {
      // Ensure sensor has an ID
      if (!sensor.id) {
        sensor.id = crypto.randomUUID();
      }

      const request = store.put(sensor);

      request.onsuccess = () => {
        successCount++;
      };

      request.onerror = (event) => {
        errorCount++;
        errors.push({
          index: idx,
          sensor_id: sensor.sensor_id,
          error: event.target.error.message
        });
        console.error(`[IndexedDB] Failed to save sensor ${sensor.sensor_id}:`, event.target.error);
      };
    });

    transaction.oncomplete = () => {
      debug.log(`[IndexedDB] Batch save complete: ${successCount} saved, ${errorCount} errors`);
      
      if (errorCount > 0) {
        debug.warn('[IndexedDB] Some sensors failed to save:', errors);
      }

      resolve({ 
        success: true, 
        count: successCount,
        errors: errorCount > 0 ? errors : null
      });
    };

    transaction.onerror = (event) => {
      console.error('[IndexedDB] Transaction failed:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Delete a sensor by ID
 * 
 * @param {string} id - Sensor ID (primary key)
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSensor(id) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);

    request.onsuccess = () => {
      debug.log(`[IndexedDB] Deleted sensor: ${id}`);
      resolve(true);
    };

    request.onerror = (event) => {
      console.error(`[IndexedDB] Delete failed for ${id}:`, event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Clear all sensors from database
 * 
 * @returns {Promise<boolean>} Success status
 */
export async function clearAll() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.clear();

    request.onsuccess = () => {
      debug.log('[IndexedDB] All sensors cleared');
      resolve(true);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Clear failed:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get all sensors from IndexedDB
 * 
 * @returns {Promise<Array<Object>>} Array of sensor objects
 */
export async function getAllSensors() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = (event) => {
      const sensors = event.target.result;
      debug.log(`[IndexedDB] Retrieved ${sensors.length} sensors`);
      resolve(sensors);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] GetAll failed:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Get a single sensor by ID
 * 
 * @param {string} id - Sensor ID (primary key)
 * @returns {Promise<Object|null>} Sensor object or null if not found
 */
export async function getSensorById(id) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onsuccess = (event) => {
      const sensor = event.target.result;
      
      if (sensor) {
        debug.log(`[IndexedDB] Found sensor: ${id}`);
      } else {
        debug.log(`[IndexedDB] Sensor not found: ${id}`);
      }
      
      resolve(sensor || null);
    };

    request.onerror = (event) => {
      console.error(`[IndexedDB] Get failed for ${id}:`, event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Get sensor by sensor_id (using index)
 * 
 * @param {string} sensorId - Sensor ID from device (e.g., "SN123456")
 * @returns {Promise<Object|null>} Sensor object or null if not found
 */
export async function getSensorBySensorId(sensorId) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('sensor_id');

    const request = index.get(sensorId);

    request.onsuccess = (event) => {
      const sensor = event.target.result;
      
      if (sensor) {
        debug.log(`[IndexedDB] Found sensor by sensor_id: ${sensorId}`);
      } else {
        debug.log(`[IndexedDB] Sensor not found by sensor_id: ${sensorId}`);
      }
      
      resolve(sensor || null);
    };

    request.onerror = (event) => {
      console.error(`[IndexedDB] Get by sensor_id failed for ${sensorId}:`, event.target.error);
      reject(event.target.error);
    };
  });
}

// ============================================================================
// METADATA & STATISTICS
// ============================================================================

/**
 * Get database statistics
 * 
 * @returns {Promise<Object>} { count, sensors, dbName, version }
 */
export async function getStats() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const countRequest = store.count();

    countRequest.onsuccess = () => {
      const stats = {
        count: countRequest.result,
        dbName: DB_NAME,
        version: DB_VERSION,
        storeName: STORE_NAME
      };

      debug.log('[IndexedDB] Stats:', stats);
      resolve(stats);
    };

    countRequest.onerror = (event) => {
      console.error('[IndexedDB] Count failed:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Check available storage quota
 * 
 * @returns {Promise<Object|null>} Quota info or null if not supported
 */
export async function checkQuota() {
  if (!navigator.storage || !navigator.storage.estimate) {
    debug.warn('[IndexedDB] Storage quota API not supported');
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();

    
    const quota = {
      usage: estimate.usage,
      quota: estimate.quota,
      available: estimate.quota - estimate.usage,
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(1),
      usageMB: (estimate.usage / 1024 / 1024).toFixed(2),
      quotaMB: (estimate.quota / 1024 / 1024).toFixed(2),
      availableMB: ((estimate.quota - estimate.usage) / 1024 / 1024).toFixed(2)
    };

    debug.log('[IndexedDB] Quota:', quota);
    return quota;
    
  } catch (err) {
    console.error('[IndexedDB] Quota check failed:', err);
    return null;
  }
}

/**
 * Validate that import won't exceed quota
 * 
 * @param {number} dataSize - Size of data to import (bytes)
 * @returns {Promise<Object>} { valid: boolean, error?: string, quota?: Object }
 */
export async function validateImportSize(dataSize) {
  const quota = await checkQuota();
  
  if (!quota) {
    // Can't check quota, allow import (with warning)
    debug.warn('[IndexedDB] Cannot validate import size (quota API unavailable)');
    return { valid: true, warning: 'Quota check unavailable' };
  }

  const dataSizeMB = (dataSize / 1024 / 1024).toFixed(2);

  if (dataSize > quota.available) {
    return {
      valid: false,
      error: `Not enough storage space.\n\nNeed: ${dataSizeMB}MB\nAvailable: ${quota.availableMB}MB\n\nPlease free up space and try again.`,
      quota
    };
  }

  debug.log(`[IndexedDB] Import size OK: ${dataSizeMB}MB / ${quota.availableMB}MB available`);
  
  return { valid: true, quota };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if IndexedDB is supported in current browser
 * 
 * @returns {boolean} Support status
 */
export function isSupported() {
  return !!window.indexedDB;
}

/**
 * Delete the entire database (nuclear option)
 * Use with caution!
 * 
 * @returns {Promise<boolean>} Success status
 */
export function deleteDatabase() {
  return new Promise((resolve, reject) => {
    debug.warn('[IndexedDB] Deleting entire database!');

    
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      debug.log('[IndexedDB] Database deleted successfully');
      resolve(true);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Database deletion failed:', event.target.error);
      reject(event.target.error);
    };

    request.onblocked = () => {
      debug.warn('[IndexedDB] Database deletion blocked (close other tabs)');
      reject(new Error('Database deletion blocked'));
    };
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core operations
  initDB,
  saveSensors,
  getAllSensors,
  getSensorById,
  getSensorBySensorId,
  deleteSensor,
  clearAll,
  
  // Metadata
  getStats,
  checkQuota,
  validateImportSize,
  
  // Utilities
  isSupported,
  deleteDatabase
};
