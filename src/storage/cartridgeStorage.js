/**
 * CARTRIDGE STORAGE MODULE
 * 
 * Manages cartridge change events in IndexedDB (SETTINGS store).
 * Cartridge changes are detected during CSV processing and stored
 * for day profile generation and export.
 * 
 * Storage: IndexedDB → SETTINGS store → key 'cartridge_changes'
 * Format: { key: 'cartridge_changes', changes: [...], lastScanned: ISO }
 * 
 * Migration from localStorage (eventStorage.js) happened in v4.5.0.
 * 
 * @module cartridgeStorage
 * @version 4.5.0
 */

import { STORES, getRecord, putRecord } from './db.js';

const STORAGE_KEY = 'cartridge_changes';

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Get raw data from IndexedDB SETTINGS store
 * @returns {Promise<Object|null>}
 */
async function getRawData() {
  try {
    const record = await getRecord(STORES.SETTINGS, STORAGE_KEY);
    return record || null;
  } catch (err) {
    console.error('[cartridgeStorage] Error reading:', err);
    return null;
  }
}

/**
 * Save raw data to IndexedDB SETTINGS store
 * @param {Array} changes - Array of cartridge change objects
 * @param {string|null} lastScanned - ISO timestamp
 */
async function saveRawData(changes, lastScanned) {
  try {
    await putRecord(STORES.SETTINGS, {
      key: STORAGE_KEY,
      changes,
      lastScanned
    });
  } catch (err) {
    console.error('[cartridgeStorage] Error saving:', err);
    throw err;
  }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Get all cartridge changes
 * @returns {Promise<Array>} Array of cartridge change objects
 */
export async function getAllCartridgeChanges() {
  const data = await getRawData();
  return data?.changes || [];
}

/**
 * Get cartridge changes for a specific date
 * @param {string} date - Date in YYYY/MM/DD format
 * @returns {Promise<Array>} Filtered changes for that date
 */
export async function getCartridgeChangesForDate(date) {
  const changes = await getAllCartridgeChanges();
  return changes.filter(c => c.date === date);
}

/**
 * Check if any cartridge changes exist
 * @returns {Promise<boolean>}
 */
export async function hasCartridgeChanges() {
  const changes = await getAllCartridgeChanges();
  return changes.length > 0;
}

/**
 * Save all cartridge changes (replaces existing)
 * @param {Array} changes - Array of cartridge change objects
 */
export async function saveAllCartridgeChanges(changes) {
  await saveRawData(changes, new Date().toISOString());
}

/**
 * Add a single cartridge change
 * @param {Date} timestamp - When the change occurred
 * @param {string} alarmText - Alarm text (usually "Rewind")
 * @param {string} sourceFile - Source filename
 * @throws {Error} If duplicate change exists
 */
export async function addCartridgeChange(timestamp, alarmText, sourceFile) {
  const changes = await getAllCartridgeChanges();
  
  // Format date and time
  const date = timestamp.toISOString().split('T')[0].replace(/-/g, '/');
  const time = timestamp.toTimeString().split(' ')[0];
  
  // Check for duplicates
  const exists = changes.some(c => c.date === date && c.time === time);
  if (exists) {
    throw new Error('Duplicate cartridge change event');
  }
  
  // Add new change
  changes.push({
    date,
    time,
    timestamp: timestamp.toISOString(),
    alarmText: alarmText || 'Rewind',
    sourceFile
  });
  
  await saveAllCartridgeChanges(changes);
}

/**
 * Get cartridge history for export
 * @returns {Promise<Array>}
 */
export async function getCartridgeHistory() {
  return getAllCartridgeChanges();
}

/**
 * Delete cartridge changes within date range
 * @param {Date} startDate - Start of range (inclusive)
 * @param {Date} endDate - End of range (inclusive)
 * @returns {Promise<number>} Count of deleted changes
 */
export async function deleteCartridgeChangesInRange(startDate, endDate) {
  const changes = await getAllCartridgeChanges();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const filtered = changes.filter(c => {
    const ts = new Date(c.timestamp).getTime();
    return ts < startTime || ts > endTime;
  });
  
  const deleted = changes.length - filtered.length;
  await saveAllCartridgeChanges(filtered);
  
  return deleted;
}

/**
 * Clear all cartridge changes
 */
export async function clearCartridgeChanges() {
  await saveRawData([], null);
}

// ============================================================
// MIGRATION HELPER (remove after v4.6)
// ============================================================

/**
 * Migrate data from localStorage to IndexedDB (one-time)
 * Call this on app startup during transition period
 * @returns {Promise<Object>} Migration result
 */
export async function migrateFromLocalStorage() {
  const OLD_KEY = 'agp-device-events';
  
  try {
    const oldData = localStorage.getItem(OLD_KEY);
    if (!oldData) return { migrated: false, reason: 'no-data' };
    
    const parsed = JSON.parse(oldData);
    const changes = parsed.cartridgeChanges || [];
    
    if (changes.length === 0) {
      localStorage.removeItem(OLD_KEY);
      return { migrated: false, reason: 'empty' };
    }
    
    // Check if IndexedDB already has data
    const existing = await getAllCartridgeChanges();
    if (existing.length > 0) {
      localStorage.removeItem(OLD_KEY);
      return { migrated: false, reason: 'already-migrated' };
    }
    
    // Migrate
    await saveAllCartridgeChanges(changes);
    localStorage.removeItem(OLD_KEY);
    
    console.log(`[cartridgeStorage] Migrated ${changes.length} changes from localStorage`);
    return { migrated: true, count: changes.length };
  } catch (err) {
    console.error('[cartridgeStorage] Migration error:', err);
    return { migrated: false, reason: 'error', error: err.message };
  }
}
