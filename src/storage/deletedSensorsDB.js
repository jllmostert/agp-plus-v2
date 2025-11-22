/**
 * DELETED SENSORS INDEXEDDB STORAGE
 * 
 * Persistent storage for deleted sensors that survives localStorage.clear()
 * 
 * Architecture:
 * - IndexedDB = Source of truth (persistent)
 * - localStorage = Fast cache (rebuilt from IndexedDB)
 * 
 * Database: agp-user-actions
 * Store: deleted_sensors
 * Schema: { sensor_id (PK), deleted_at, version }
 * 
 * @module deletedSensorsDB
 * @version 1.0
 */

const DB_NAME = 'agp-user-actions';
const DB_VERSION = 1;
const STORE_NAME = 'deleted_sensors';

import { debug } from '../utils/debug.js';

/**
 * Open IndexedDB connection
 * Creates database and object store if they don't exist
 * 
 * @returns {Promise<IDBDatabase>} Database connection
 */
export function openDeletedSensorsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('[deletedSensorsDB] Failed to open database:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'sensor_id' });
        
        // Create index on deleted_at for cleanup queries
        objectStore.createIndex('deleted_at', 'deleted_at', { unique: false });
        
        debug.log('[deletedSensorsDB] Created deleted_sensors object store');
      }
    };
  });
}

/**
 * Add sensor to deleted list (IndexedDB)
 * This is the source of truth that survives localStorage.clear()
 * 
 * @param {string} sensorId - Sensor ID to mark as deleted
 * @returns {Promise<void>}
 */
export async function addDeletedSensorToDB(sensorId) {
  try {
    const db = await openDeletedSensorsDB();
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const deletedSensor = {
      sensor_id: sensorId,
      deleted_at: new Date().toISOString(),
      version: 1
    };
    
    // Use put() to handle duplicates (idempotent)
    const request = store.put(deletedSensor);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        debug.log('[deletedSensorsDB] Added sensor to IndexedDB:', sensorId);
        resolve();
      };
      
      request.onerror = () => {
        console.error('[deletedSensorsDB] Error adding sensor:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.error('[deletedSensorsDB] Error in addDeletedSensorToDB:', err);
    throw err;
  }
}

/**
 * Get all deleted sensor IDs from IndexedDB
 * This is the source of truth
 * 
 * @returns {Promise<Array<string>>} Array of deleted sensor IDs
 */
export async function getDeletedSensorsFromDB() {
  try {
    const db = await openDeletedSensorsDB();
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const sensors = request.result;
        const sensorIds = sensors.map(s => s.sensor_id);
        
        debug.log('[deletedSensorsDB] Loaded from IndexedDB:', {
          count: sensorIds.length,
          sensors: sensorIds
        });
        
        resolve(sensorIds);
      };
      
      request.onerror = () => {
        console.error('[deletedSensorsDB] Error reading deleted sensors:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.error('[deletedSensorsDB] Error in getDeletedSensorsFromDB:', err);
    return []; // Fallback: return empty array
  }
}

/**
 * Get all deleted sensors with full metadata (ID + timestamp)
 * Used for export functionality - includes deletion timestamps
 * 
 * @returns {Promise<Array<Object>>} Array of deleted sensor objects
 *   Each object: { sensorId: string, deletedAt: number (timestamp in ms) }
 */
export async function getDeletedSensorsWithTimestamps() {
  try {
    const db = await openDeletedSensorsDB();
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const sensors = request.result;
        
        // Convert to export format: { sensorId, deletedAt }
        const formatted = sensors.map(s => ({
          sensorId: s.sensor_id,
          deletedAt: new Date(s.deleted_at).getTime() // Convert ISO to timestamp
        }));
        
        debug.log('[deletedSensorsDB] Loaded with timestamps:', {
          count: formatted.length
        });
        
        resolve(formatted);
      };
      
      request.onerror = () => {
        console.error('[deletedSensorsDB] Error reading deleted sensors with timestamps:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.error('[deletedSensorsDB] Error in getDeletedSensorsWithTimestamps:', err);
    return []; // Fallback: return empty array
  }
}

/**
 * Count deleted sensors with breakdown by age
 * Useful for UI to show "Clear Old Sensors (X old / Y total)"
 * 
 * @returns {Promise<Object>} Count breakdown { totalCount, oldCount, recentCount }
 */
export async function countDeletedSensors() {
  try {
    const db = await openDeletedSensorsDB();
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('deleted_at');
    
    const now = new Date();
    const EXPIRY_DAYS = 90;
    const cutoffDate = new Date(now - EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    const request = index.openCursor();
    
    let totalCount = 0;
    let oldCount = 0;
    let recentCount = 0;
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          const sensor = cursor.value;
          const deletedAt = new Date(sensor.deleted_at);
          
          totalCount++;
          if (deletedAt < cutoffDate) {
            oldCount++;
          } else {
            recentCount++;
          }
          
          cursor.continue();
        }
      };
      
      request.onerror = () => {
        console.error('[deletedSensorsDB] Error counting deleted sensors:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
        resolve({ totalCount, oldCount, recentCount });
      };
    });
  } catch (err) {
    console.error('[deletedSensorsDB] Error in countDeletedSensors:', err);
    return { totalCount: 0, oldCount: 0, recentCount: 0 };
  }
}

/**
 * Remove old deleted sensors (>90 days)
 * Prevents database from growing forever
 * 
 * @returns {Promise<Object>} Cleanup result with counts
 */
export async function cleanupOldDeletedSensorsDB() {
  try {
    const db = await openDeletedSensorsDB();
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('deleted_at');
    
    const now = new Date();
    const EXPIRY_DAYS = 90;
    const cutoffDate = new Date(now - EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    // Get all sensors older than cutoff
    const request = index.openCursor();
    
    let removed = 0;
    let remaining = 0;
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          const sensor = cursor.value;
          const deletedAt = new Date(sensor.deleted_at);
          
          if (deletedAt < cutoffDate) {
            // Delete this old entry
            cursor.delete();
            removed++;
          } else {
            remaining++;
          }
          
          cursor.continue();
        }
      };
      
      request.onerror = () => {
        console.error('[deletedSensorsDB] Error during cleanup:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
        
        if (removed > 0) {
          debug.log('[deletedSensorsDB] Cleanup complete:', { removed, remaining });
        }
        
        resolve({ removed, remaining, originalCount: removed + remaining });
      };
    });
  } catch (err) {
    console.error('[deletedSensorsDB] Error in cleanupOldDeletedSensorsDB:', err);
    return { removed: 0, remaining: 0, originalCount: 0 };
  }
}

/**
 * Check if IndexedDB is available
 * Some browsers/environments don't support it
 * 
 * @returns {boolean} True if IndexedDB is available
 */
export function isIndexedDBAvailable() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch (err) {
    return false;
  }
}

/**
 * Migrate localStorage deleted sensors to IndexedDB
 * One-time migration on app startup
 * 
 * @param {Array<string>} localStorageDeletedSensors - Array of sensor IDs from localStorage
 * @returns {Promise<Object>} Migration result
 */
export async function migrateLocalStorageToIndexedDB(localStorageDeletedSensors) {
  try {
    if (!localStorageDeletedSensors || localStorageDeletedSensors.length === 0) {
      return { migrated: 0, total: 0 };
    }
    
    const db = await openDeletedSensorsDB();
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let migrated = 0;
    
    // Check each localStorage sensor
    for (const sensorId of localStorageDeletedSensors) {
      const checkRequest = store.get(sensorId);
      
      await new Promise((resolve) => {
        checkRequest.onsuccess = () => {
          const exists = checkRequest.result;
          
          if (!exists) {
            // Doesn't exist in IndexedDB - migrate it
            const deletedSensor = {
              sensor_id: sensorId,
              deleted_at: new Date().toISOString(),
              version: 1,
              migrated: true
            };
            
            store.put(deletedSensor);
            migrated++;
          }
          
          resolve();
        };
        
        checkRequest.onerror = () => {
          console.error('[deletedSensorsDB] Error checking sensor:', checkRequest.error);
          resolve();
        };
      });
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = async () => {
        db.close();
        
        if (migrated > 0) {
          debug.log('[deletedSensorsDB] Migration complete:', { migrated, total: localStorageDeletedSensors.length });
        }
        
        // Get final count
        const allDeleted = await getDeletedSensorsFromDB();
        resolve({ migrated, total: allDeleted.length });
      };
      
      transaction.onerror = () => {
        console.error('[deletedSensorsDB] Migration transaction failed:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.error('[deletedSensorsDB] Error in migrateLocalStorageToIndexedDB:', err);
    return { migrated: 0, total: 0 };
  }
}

/**
 * Sync IndexedDB to localStorage (fast cache)
 * Rebuilds localStorage from IndexedDB source of truth
 * 
 * @returns {Promise<void>}
 */
export async function syncIndexedDBToLocalStorage() {
  try {
    const deletedSensors = await getDeletedSensorsFromDB();
    
    // Update localStorage cache
    localStorage.setItem('agp-deleted-sensors', JSON.stringify(deletedSensors));
    
    debug.log('[deletedSensorsDB] Synced IndexedDB to localStorage:', {
      count: deletedSensors.length
    });
  } catch (err) {
    console.error('[deletedSensorsDB] Error syncing to localStorage:', err);
  }
}
