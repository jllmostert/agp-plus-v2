import { useState, useEffect, useCallback } from 'react';
import { uploadStorage } from '../utils/uploadStorage';

/**
 * useUploadStorage - Custom hook for managing saved uploads
 * 
 * NOW USING INDEXEDDB - All operations are async!
 * 
 * Provides state and handlers for upload persistence with lock/unlock.
 * Automatically migrates old LocalStorage data on first load.
 * 
 * @returns {Object} Storage state and handlers
 * @version 2.0.0 - IndexedDB migration
 */
export function useUploadStorage() {
  const [savedUploads, setSavedUploads] = useState([]);
  const [activeUploadId, setActiveUploadId] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState(null);

  /**
   * Refresh uploads list from storage (async!)
   */
  const refreshUploads = useCallback(async () => {
    try {
      const uploads = await uploadStorage.getAll();
      const activeId = await uploadStorage.getActive();
      const info = await uploadStorage.getStorageInfo();
      
      setSavedUploads(uploads);
      setActiveUploadId(activeId);
      setStorageInfo(info);
    } catch (err) {
      console.error('Failed to refresh uploads:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load saved uploads on mount + attempt migration
   */
  useEffect(() => {
    const initStorage = async () => {
      try {
        // Attempt migration from LocalStorage
        const migratedCount = await uploadStorage.migrateFromLocalStorage();
        
        if (migratedCount > 0) {
          setMigrationStatus(`Migrated ${migratedCount} uploads to new storage`);
          console.log(`✅ Successfully migrated ${migratedCount} uploads from LocalStorage`);
        }
        
        // Load current data
        await refreshUploads();
        
      } catch (err) {
        console.error('Failed to initialize storage:', err);
        setIsLoading(false);
      }
    };
    
    initStorage();
  }, [refreshUploads]);

  /**
   * Save current data as new upload (async!)
   * @param {Object} data - {csvData, dateRange, proTimeData, name}
   * @returns {Promise<string>} Upload ID
   */
  const saveUpload = useCallback(async (data) => {
    try {
      const id = await uploadStorage.save(data);
      await refreshUploads();
      return id;
    } catch (err) {
      console.error('Failed to save upload:', err);
      throw err;
    }
  }, [refreshUploads]);

  /**
   * Load upload by ID (async!)
   * @param {string} id
   * @returns {Promise<Object|null>} Upload data
   */
  const loadUpload = useCallback(async (id) => {
    try {
      const upload = await uploadStorage.get(id);
      if (upload) {
        await uploadStorage.setActive(id);
        setActiveUploadId(id);
        
        // Deserialize dates and proTimeData
        return {
          ...upload,
          dateRange: upload.dateRange ? {
            min: new Date(upload.dateRange.min),
            max: new Date(upload.dateRange.max)
          } : null,
          proTimeData: upload.proTimeData ? new Set(upload.proTimeData) : null
        };
      }
      return null;
    } catch (err) {
      console.error('Failed to load upload:', err);
      return null;
    }
  }, []);

  /**
   * Toggle lock status (async!)
   * @param {string} id
   */
  const toggleLock = useCallback(async (id) => {
    try {
      const upload = savedUploads.find(u => u.id === id);
      if (!upload) return;
      
      await uploadStorage.update(id, { locked: !upload.locked });
      await refreshUploads();
    } catch (err) {
      console.error('Failed to toggle lock:', err);
      throw err;
    }
  }, [savedUploads, refreshUploads]);

  /**
   * Delete upload (async!)
   * @param {string} id
   */
  const deleteUpload = useCallback(async (id) => {
    try {
      const upload = savedUploads.find(u => u.id === id);
      if (upload?.locked) {
        throw new Error('Cannot delete locked upload. Unlock first.');
      }
      
      await uploadStorage.delete(id);
      await refreshUploads();
    } catch (err) {
      console.error('Failed to delete upload:', err);
      throw err;
    }
  }, [savedUploads, refreshUploads]);

  /**
   * Rename upload (async!)
   * @param {string} id
   * @param {string} name
   */
  const renameUpload = useCallback(async (id, name) => {
    try {
      const upload = savedUploads.find(u => u.id === id);
      if (upload?.locked) {
        throw new Error('Cannot rename locked upload');
      }
      
      await uploadStorage.update(id, { name });
      await refreshUploads();
    } catch (err) {
      console.error('Failed to rename upload:', err);
      throw err;
    }
  }, [savedUploads, refreshUploads]);

  /**
   * Update ProTime data for upload (async!)
   * @param {string} id
   * @param {Set<string>} proTimeData
   */
  const updateProTimeData = useCallback(async (id, proTimeData) => {
    try {
      await uploadStorage.update(id, { 
        proTimeData: proTimeData ? Array.from(proTimeData) : null 
      });
      await refreshUploads();
    } catch (err) {
      console.error('Failed to update ProTime data:', err);
      throw err;
    }
  }, [refreshUploads]);

  return {
    // State
    savedUploads,
    activeUploadId,
    storageInfo,
    isLoading,
    migrationStatus,
    
    // Actions (all async now!)
    saveUpload,
    loadUpload,
    toggleLock,
    deleteUpload,
    renameUpload,
    updateProTimeData,
    refreshUploads
  };
}
