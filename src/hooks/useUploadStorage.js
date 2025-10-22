import { useState, useEffect, useCallback } from 'react';
import { uploadStorage } from '../utils/uploadStorage';

/**
 * useUploadStorage - Custom hook for managing saved uploads
 * 
 * Provides state and handlers for upload persistence with lock/unlock.
 * 
 * @returns {Object} Storage state and handlers
 * @version 1.0.0
 */
export function useUploadStorage() {
  const [savedUploads, setSavedUploads] = useState([]);
  const [activeUploadId, setActiveUploadId] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);

  /**
   * Refresh uploads list from storage
   */
  const refreshUploads = useCallback(() => {
    const uploads = uploadStorage.getAll();
    const activeId = uploadStorage.getActiveId();
    const info = uploadStorage.getStorageInfo();
    
    setSavedUploads(uploads);
    setActiveUploadId(activeId);
    setStorageInfo(info);
  }, []);

  /**
   * Load saved uploads on mount
   */
  useEffect(() => {
    refreshUploads();
  }, [refreshUploads]);

  /**
   * Save current data as new upload
   * @param {Object} data - {csvData, dateRange, proTimeData, name}
   * @returns {string} Upload ID
   */
  const saveUpload = useCallback((data) => {
    try {
      const id = uploadStorage.save(data);
      refreshUploads();
      return id;
    } catch (err) {
      console.error('Failed to save upload:', err);
      throw err;
    }
  }, [refreshUploads]);

  /**
   * Load upload by ID
   * @param {string} id
   * @returns {Object|null} Upload data
   */
  const loadUpload = useCallback((id) => {
    try {
      const upload = uploadStorage.get(id);
      if (upload) {
        uploadStorage.setActive(id);
        setActiveUploadId(id);
      }
      return upload;
    } catch (err) {
      console.error('Failed to load upload:', err);
      return null;
    }
  }, []);

  /**
   * Toggle lock status
   * @param {string} id
   */
  const toggleLock = useCallback((id) => {
    try {
      const upload = savedUploads.find(u => u.id === id);
      if (!upload) return;
      
      if (upload.locked) {
        uploadStorage.unlock(id);
      } else {
        uploadStorage.lock(id);
      }
      
      refreshUploads();
    } catch (err) {
      console.error('Failed to toggle lock:', err);
      throw err;
    }
  }, [savedUploads, refreshUploads]);

  /**
   * Delete upload (only if unlocked)
   * @param {string} id
   */
  const deleteUpload = useCallback((id) => {
    try {
      uploadStorage.delete(id);
      refreshUploads();
    } catch (err) {
      console.error('Failed to delete upload:', err);
      throw err;
    }
  }, [refreshUploads]);

  /**
   * Rename upload (only if unlocked)
   * @param {string} id
   * @param {string} name
   */
  const renameUpload = useCallback((id, name) => {
    try {
      uploadStorage.rename(id, name);
      refreshUploads();
    } catch (err) {
      console.error('Failed to rename upload:', err);
      throw err;
    }
  }, [refreshUploads]);

  /**
   * Update ProTime data for upload
   * @param {string} id
   * @param {Set<string>} proTimeData
   */
  const updateProTimeData = useCallback((id, proTimeData) => {
    try {
      uploadStorage.updateProTimeData(id, proTimeData);
      refreshUploads();
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
    
    // Actions
    saveUpload,
    loadUpload,
    toggleLock,
    deleteUpload,
    renameUpload,
    updateProTimeData,
    refreshUploads
  };
}
