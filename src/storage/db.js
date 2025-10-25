/**
 * IndexedDB Schema for AGP+ v3.0
 * 
 * CRITICAL MIGRATION NOTE:
 * v3.0 adds new stores but PRESERVES v2.x 'uploads' store for rollback safety.
 * 
 * Stores:
 * - uploads (v2.x compat): Individual CSV upload metadata
 * - settings (v2.x compat): Active upload ID, patient info
 * - readingBuckets (NEW v3.0): Month-keyed glucose readings
 * - sensorEvents (NEW v3.0): Persistent sensor change database
 * - cartridgeEvents (NEW v3.0): Persistent cartridge change database
 * - masterDataset (NEW v3.0): Cached merged data + version info
 */

const DB_NAME = 'agp-plus-db';
const DB_VERSION = 3;  // Increment from v2.x version 1 → v3.0 version 3

// Store names
export const STORES = {
  UPLOADS: 'uploads',              // v2.x compat
  SETTINGS: 'settings',            // v2.x compat
  READING_BUCKETS: 'readingBuckets',     // NEW v3.0
  SENSOR_EVENTS: 'sensorEvents',         // NEW v3.0
  CARTRIDGE_EVENTS: 'cartridgeEvents',   // NEW v3.0
  MASTER_DATASET: 'masterDataset'        // NEW v3.0
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
      
      console.log(`[DB] Upgrading from v${oldVersion} to v${DB_VERSION}`);
      
      // === v2.x STORES (preserve if exist) ===
      
      if (!db.objectStoreNames.contains(STORES.UPLOADS)) {
        const uploadStore = db.createObjectStore(STORES.UPLOADS, { keyPath: 'id' });
        uploadStore.createIndex('timestamp', 'timestamp', { unique: false });
        uploadStore.createIndex('locked', 'locked', { unique: false });
        console.log('[DB] Created uploads store');
      }
      
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        console.log('[DB] Created settings store');
      }
      
      // === v3.0 NEW STORES ===
      
      if (!db.objectStoreNames.contains(STORES.READING_BUCKETS)) {
        const bucketStore = db.createObjectStore(STORES.READING_BUCKETS, { 
          keyPath: 'monthKey'  // "YYYY-MM"
        });
        bucketStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        console.log('[DB] Created readingBuckets store');
      }
      
      if (!db.objectStoreNames.contains(STORES.SENSOR_EVENTS)) {
        const sensorStore = db.createObjectStore(STORES.SENSOR_EVENTS, { 
          keyPath: 'id'  // "sensor_YYYYMMDD_HHMMSS"
        });
        sensorStore.createIndex('timestamp', 'timestamp', { unique: false });
        sensorStore.createIndex('confirmed', 'confirmed', { unique: false });
        console.log('[DB] Created sensorEvents store');
      }
      
      if (!db.objectStoreNames.contains(STORES.CARTRIDGE_EVENTS)) {
        const cartridgeStore = db.createObjectStore(STORES.CARTRIDGE_EVENTS, { 
          keyPath: 'id'  // "cartridge_YYYYMMDD_HHMMSS"
        });
        cartridgeStore.createIndex('timestamp', 'timestamp', { unique: false });
        cartridgeStore.createIndex('confirmed', 'confirmed', { unique: false });
        console.log('[DB] Created cartridgeEvents store');
      }
      
      if (!db.objectStoreNames.contains(STORES.MASTER_DATASET)) {
        db.createObjectStore(STORES.MASTER_DATASET, { keyPath: 'id' });
        console.log('[DB] Created masterDataset store');
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
