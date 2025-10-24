/**
 * IndexedDB Storage Manager for AGP+ Uploads
 * 
 * Handles large datasets (5+ years of ProTime data) efficiently.
 * Replaces LocalStorage with IndexedDB for better capacity (50MB+).
 * 
 * Database: 'agp-plus-db'
 * Stores:
 *   - 'uploads': {id, timestamp, name, csvData, dateRange, proTimeData, locked}
 *   - 'settings': {key, value} - for activeUploadId and patient info
 *   - 'patientInfo': {key: 'patient', name, email, dob, physician, cgm}
 */

const DB_NAME = 'agp-plus-db';
const DB_VERSION = 1;
const UPLOAD_STORE = 'uploads';
const SETTINGS_STORE = 'settings';

/**
 * Open IndexedDB connection
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create uploads store
      if (!db.objectStoreNames.contains(UPLOAD_STORE)) {
        const uploadStore = db.createObjectStore(UPLOAD_STORE, { keyPath: 'id' });
        uploadStore.createIndex('timestamp', 'timestamp', { unique: false });
        uploadStore.createIndex('locked', 'locked', { unique: false });
      }
      
      // Create settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Generate unique ID
 */
function generateId() {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Auto-generate upload name from date range
 */
function autoGenerateName(dateRange) {
  if (!dateRange) return 'Unnamed Upload';
  
  const start = new Date(dateRange.min);
  const end = new Date(dateRange.max);
  
  const formatDate = (d) => {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };
  
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Storage Manager
 * 
 * MIGRATION NOTE: This replaces the old LocalStorage implementation with IndexedDB.
 * Old data is automatically migrated on first load. Export name kept as 'uploadStorage'
 * for backwards compatibility with existing components.
 */
export const uploadStorage = {
  /**
   * Get all uploads
   */
  async getAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(UPLOAD_STORE, 'readonly');
      const store = transaction.objectStore(UPLOAD_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get single upload by ID
   */
  async get(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(UPLOAD_STORE, 'readonly');
      const store = transaction.objectStore(UPLOAD_STORE);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Save new upload
   */
  async save(data) {
    const db = await openDB();
    
    const upload = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      name: data.name || autoGenerateName(data.dateRange),
      csvData: data.csvData,
      dateRange: data.dateRange ? {
        min: data.dateRange.min.toISOString(),
        max: data.dateRange.max.toISOString()
      } : null,
      proTimeData: data.proTimeData ? Array.from(data.proTimeData) : null,
      locked: true  // Lock by default
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(UPLOAD_STORE, 'readwrite');
      const store = transaction.objectStore(UPLOAD_STORE);
      const request = store.add(upload);
      
      request.onsuccess = async () => {
        await this.setActive(upload.id);
        resolve(upload.id);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Update existing upload
   */
  async update(id, updates) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(UPLOAD_STORE, 'readwrite');
      const store = transaction.objectStore(UPLOAD_STORE);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const upload = getRequest.result;
        if (!upload) {
          reject(new Error('Upload not found'));
          return;
        }
        
        Object.assign(upload, updates);
        const updateRequest = store.put(upload);
        
        updateRequest.onsuccess = () => resolve(upload);
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  },

  /**
   * Delete upload
   */
  async delete(id) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(UPLOAD_STORE, 'readwrite');
      const store = transaction.objectStore(UPLOAD_STORE);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Set active upload ID
   */
  async setActive(id) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key: 'activeUploadId', value: id });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get active upload ID
   */
  async getActive() {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get('activeUploadId');
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Migrate from LocalStorage to IndexedDB
   * Returns number of uploads migrated
   */
  async migrateFromLocalStorage() {
    const OLD_KEY = 'agp_uploads';
    const OLD_ACTIVE_KEY = 'agp_active_upload';
    
    try {
      const oldData = localStorage.getItem(OLD_KEY);
      if (!oldData) return 0;
      
      const uploads = JSON.parse(oldData);
      if (!Array.isArray(uploads) || uploads.length === 0) return 0;
      
      const db = await openDB();
      
      // Migrate uploads
      const transaction = db.transaction(UPLOAD_STORE, 'readwrite');
      const store = transaction.objectStore(UPLOAD_STORE);
      
      for (const upload of uploads) {
        store.add(upload);
      }
      
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      
      // Migrate active upload ID
      const oldActive = localStorage.getItem(OLD_ACTIVE_KEY);
      if (oldActive) {
        await this.setActive(oldActive);
      }
      
      // Clear old LocalStorage
      localStorage.removeItem(OLD_KEY);
      localStorage.removeItem(OLD_ACTIVE_KEY);
      
      return uploads.length;
      
    } catch (err) {
      console.error('Migration failed:', err);
      throw err;
    }
  },

  /**
   * Get storage info (for debugging)
   */
  async getStorageInfo() {
    const uploads = await this.getAll();
    
    // Calculate approximate size
    const totalSize = uploads.reduce((sum, upload) => {
      const size = JSON.stringify(upload).length;
      return sum + size;
    }, 0);
    
    return {
      uploadCount: uploads.length,
      approximateSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      uploads: uploads.map(u => ({
        id: u.id,
        name: u.name,
        timestamp: u.timestamp,
        locked: u.locked,
        sizeMB: (JSON.stringify(u).length / (1024 * 1024)).toFixed(2)
      }))
    };
  },

  /**
   * Save patient information
   */
  async savePatientInfo(patientInfo) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ 
        key: 'patientInfo', 
        value: {
          name: patientInfo.name || '',
          email: patientInfo.email || '',
          dob: patientInfo.dob || '',
          physician: patientInfo.physician || '',
          cgm: patientInfo.cgm || '',
          lastUpdated: new Date().toISOString()
        }
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get patient information
   */
  async getPatientInfo() {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get('patientInfo');
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }
};
