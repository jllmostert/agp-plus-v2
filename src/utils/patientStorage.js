/**
 * Patient Storage Manager
 * 
 * v3.0 MIGRATION NOTE:
 * Now uses shared db.js module for v3.0 compatibility.
 * 
 * Handles patient information in IndexedDB settings store.
 * Single patient profile per installation (personal use case).
 * 
 * Storage key: 'patientInfo'
 * 
 * Data structure:
 * {
 *   name: string,     // "LASTNAME, Firstname"
 *   email: string,    // Optional
 *   dob: string,      // ISO date format
 *   physician: string,
 *   cgm: string       // Device info
 * }
 */

import { openDB, STORES, getRecord, putRecord } from '../storage/db.js';

const SETTINGS_STORE = STORES.SETTINGS;
const PATIENT_KEY = 'patientInfo';

/**
 * Patient Storage API
 */
export const patientStorage = {
  /**
   * Get patient information
   * @returns {Promise<Object|null>} Patient info or null if not set
   */
  async get() {
    try {
      const db = await openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(SETTINGS_STORE, 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get(PATIENT_KEY);
        
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('Failed to get patient info:', err);
      return null;
    }
  },

  /**
   * Save patient information
   * @param {Object} patientData - Patient info object
   * @returns {Promise<void>}
   */
  async save(patientData) {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ 
        key: PATIENT_KEY, 
        value: {
          name: patientData.name || '',
          email: patientData.email || '',
          dob: patientData.dob || '',
          physician: patientData.physician || '',
          cgm: patientData.cgm || '',
          updatedAt: new Date().toISOString()
        }
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Update specific patient information fields
   * @param {Object} updates - Partial patient info to update
   * @returns {Promise<void>}
   */
  async update(updates) {
    const existing = await this.get();
    const merged = { ...existing, ...updates };
    return this.save(merged);
  },

  /**
   * Clear patient information
   * @returns {Promise<void>}
   */
  async clear() {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.delete(PATIENT_KEY);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Check if patient info exists
   * @returns {Promise<boolean>}
   */
  async exists() {
    const info = await this.get();
    return info !== null && info.name !== '';
  }
};
