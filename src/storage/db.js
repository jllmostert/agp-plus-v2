/**
 * IndexedDB Schema for AGP+ v4.5
 * 
 * Stores:
 * - uploads (v2.x compat): Individual CSV upload metadata
 * - settings (v2.x compat): Active upload ID, patient info
 * - readingBuckets (v3.0): Month-keyed glucose readings
 * - masterDataset (v3.0): Cached merged data + version info
 * - sensorData (v3.6): Sensor database
 * - seasons (v4.4): Device era tracking
 * 
 * Note: sensorEvents and cartridgeEvents stores removed in v4.5
 * (sensor events in sensorData, cartridge events in localStorage)
 */

const DB_NAME = 'agp-plus-db';
const DB_VERSION = 7;  // v7: Remove unused sensorEvents/cartridgeEvents stores

// Store names
export const STORES = {
  UPLOADS: 'uploads',              // v2.x compat
  SETTINGS: 'settings',            // v2.x compat
  READING_BUCKETS: 'readingBuckets',     // v3.0
  MASTER_DATASET: 'masterDataset',       // v3.0
  SENSOR_DATA: 'sensorData',             // v3.6
  SEASONS: 'seasons'                     // v4.4 - Device era tracking
};

/**
 * Open or upgrade database
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      
      
      // === v2.x STORES (preserve if exist) ===
      
      if (!db.objectStoreNames.contains(STORES.UPLOADS)) {
        const uploadStore = db.createObjectStore(STORES.UPLOADS, { keyPath: 'id' });
        uploadStore.createIndex('timestamp', 'timestamp', { unique: false });
        uploadStore.createIndex('locked', 'locked', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
      
      // === v3.0 STORES ===
      
      if (!db.objectStoreNames.contains(STORES.READING_BUCKETS)) {
        const bucketStore = db.createObjectStore(STORES.READING_BUCKETS, { 
          keyPath: 'monthKey'  // "YYYY-MM"
        });
        bucketStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
      
      // === v7: Remove unused sensorEvents/cartridgeEvents stores ===
      // These were created but never actually used - data lives elsewhere
      if (db.objectStoreNames.contains('sensorEvents')) {
        db.deleteObjectStore('sensorEvents');
      }
      if (db.objectStoreNames.contains('cartridgeEvents')) {
        db.deleteObjectStore('cartridgeEvents');
      }
      
      if (!db.objectStoreNames.contains(STORES.MASTER_DATASET)) {
        db.createObjectStore(STORES.MASTER_DATASET, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.SENSOR_DATA)) {
        db.createObjectStore(STORES.SENSOR_DATA, { keyPath: 'id' });
      } else if (oldVersion < 5) {
        // v5: Add keyPath to existing SENSOR_DATA store
        // Must delete and recreate to change keyPath

        db.deleteObjectStore(STORES.SENSOR_DATA);
        db.createObjectStore(STORES.SENSOR_DATA, { keyPath: 'id' });
      }
      
      // === v4.4 SEASONS STORE ===
      if (!db.objectStoreNames.contains(STORES.SEASONS)) {
        const seasonStore = db.createObjectStore(STORES.SEASONS, { keyPath: 'id' });
        seasonStore.createIndex('season', 'season', { unique: true });
        seasonStore.createIndex('start', 'start', { unique: false });

      }
    };
  });
}

/**
 * Helper: Get all records from a store
 */
export function getAllRecords(storeName) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper: Get single record by key
 */
export function getRecord(storeName, key) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper: Put (insert or update) record
 */
export function putRecord(storeName, record) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(record);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper: Delete record by key
 */
export function deleteRecord(storeName, key) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper: Query by index with range
 */
export function queryByIndex(storeName, indexName, range) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = range ? index.getAll(range) : index.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper: Clear all records from a store (dangerous!)
 */
export function clearStore(storeName) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}
