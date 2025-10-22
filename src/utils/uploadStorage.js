/**
 * AGP+ Upload Storage Manager
 * 
 * Manages persistent storage of CSV uploads using browser LocalStorage.
 * Uploads can be locked (read-only) or unlocked (deletable).
 * 
 * Features:
 * - Persist multiple uploads
 * - Lock/unlock mechanism (slotje)
 * - Switch between saved uploads
 * - Auto-naming or custom labels
 * - ~5-10MB storage limit (browser dependent)
 * 
 * @version 1.0.0
 */

const STORAGE_KEY = 'agp_uploads';
const MAX_UPLOADS = 20; // Reasonable limit

/**
 * Generate unique ID for upload
 */
const generateId = () => {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate auto-name from date range
 */
const autoGenerateName = (dateRange) => {
  if (!dateRange) return 'Unnamed Upload';
  
  const start = dateRange.min;
  const end = dateRange.max;
  
  const monthNames = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  
  const startMonth = monthNames[start.getMonth()];
  const endMonth = monthNames[end.getMonth()];
  const year = start.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${year}`;
  }
  
  return `${startMonth}-${endMonth} ${year}`;
};

/**
 * Storage Manager
 */
export const uploadStorage = {
  
  /**
   * Get all uploads from storage
   * @returns {Array} Array of upload objects
   */
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Failed to load uploads:', err);
      return [];
    }
  },
  
  /**
   * Get active upload ID
   * @returns {string|null}
   */
  getActiveId() {
    try {
      return localStorage.getItem('agp_active_upload');
    } catch (err) {
      return null;
    }
  },
  
  /**
   * Set active upload
   * @param {string} id
   */
  setActive(id) {
    try {
      localStorage.setItem('agp_active_upload', id);
    } catch (err) {
      console.error('Failed to set active upload:', err);
    }
  },
  
  /**
   * Save new upload
   * @param {Object} data - {csvData, dateRange, proTimeData, name}
   * @returns {string} Upload ID
   */
  save(data) {
    try {
      const uploads = this.getAll();
      
      // Check limit
      if (uploads.length >= MAX_UPLOADS) {
        // Remove oldest unlocked upload
        const unlocked = uploads.filter(u => !u.locked);
        if (unlocked.length === 0) {
          throw new Error(`Maximum ${MAX_UPLOADS} uploads reached. Unlock some to add more.`);
        }
        unlocked.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        this.delete(unlocked[0].id);
      }
      
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
      
      uploads.push(upload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
      this.setActive(upload.id);
      
      return upload.id;
    } catch (err) {
      console.error('Failed to save upload:', err);
      throw err;
    }
  },
  
  /**
   * Get upload by ID
   * @param {string} id
   * @returns {Object|null}
   */
  get(id) {
    const uploads = this.getAll();
    const upload = uploads.find(u => u.id === id);
    
    if (!upload) return null;
    
    // Deserialize dates
    return {
      ...upload,
      dateRange: upload.dateRange ? {
        min: new Date(upload.dateRange.min),
        max: new Date(upload.dateRange.max)
      } : null,
      proTimeData: upload.proTimeData ? new Set(upload.proTimeData) : null
    };
  },
  
  /**
   * Update upload name
   * @param {string} id
   * @param {string} name
   */
  rename(id, name) {
    try {
      const uploads = this.getAll();
      const upload = uploads.find(u => u.id === id);
      
      if (!upload) throw new Error('Upload not found');
      if (upload.locked) throw new Error('Cannot rename locked upload');
      
      upload.name = name;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
    } catch (err) {
      console.error('Failed to rename upload:', err);
      throw err;
    }
  },
  
  /**
   * Lock upload (make read-only)
   * @param {string} id
   */
  lock(id) {
    try {
      const uploads = this.getAll();
      const upload = uploads.find(u => u.id === id);
      
      if (!upload) throw new Error('Upload not found');
      
      upload.locked = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
    } catch (err) {
      console.error('Failed to lock upload:', err);
      throw err;
    }
  },
  
  /**
   * Unlock upload (make deletable)
   * @param {string} id
   */
  unlock(id) {
    try {
      const uploads = this.getAll();
      const upload = uploads.find(u => u.id === id);
      
      if (!upload) throw new Error('Upload not found');
      
      upload.locked = false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
    } catch (err) {
      console.error('Failed to unlock upload:', err);
      throw err;
    }
  },
  
  /**
   * Delete upload (only if unlocked)
   * @param {string} id
   */
  delete(id) {
    try {
      const uploads = this.getAll();
      const upload = uploads.find(u => u.id === id);
      
      if (!upload) throw new Error('Upload not found');
      if (upload.locked) throw new Error('Cannot delete locked upload. Unlock first.');
      
      const filtered = uploads.filter(u => u.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      
      // If deleted active, clear active
      if (this.getActiveId() === id) {
        localStorage.removeItem('agp_active_upload');
      }
    } catch (err) {
      console.error('Failed to delete upload:', err);
      throw err;
    }
  },
  
  /**
   * Clear all uploads (dangerous!)
   * @param {boolean} force - Must be true to confirm
   */
  clearAll(force = false) {
    if (!force) {
      throw new Error('Must pass force=true to clear all uploads');
    }
    
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('agp_active_upload');
    } catch (err) {
      console.error('Failed to clear uploads:', err);
      throw err;
    }
  },
  
  /**
   * Get storage usage info
   * @returns {Object} {used, total, percentage}
   */
  getStorageInfo() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const used = data ? new Blob([data]).size : 0;
      const total = 5 * 1024 * 1024; // ~5MB estimate
      
      return {
        used,
        total,
        percentage: Math.round((used / total) * 100),
        usedMB: (used / 1024 / 1024).toFixed(2),
        totalMB: (total / 1024 / 1024).toFixed(0)
      };
    } catch (err) {
      return {used: 0, total: 0, percentage: 0, usedMB: '0', totalMB: '5'};
    }
  }
};
