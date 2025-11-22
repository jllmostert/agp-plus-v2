/**
 * Sensor Storage Module - V4 Clean Implementation
 * 
 * Single source of truth for sensor data.
 * V4.2.2 - Stock import/export + IndexedDB keyPath fix
 */

import { openDB, STORES, getRecord, putRecord } from './db.js';
import { VERSION } from '../version.js';
import { getEraForDate } from '../core/deviceEras.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'sensors-v4'; // IndexedDB key
const SUCCESS_THRESHOLD_DAYS = 6.75;
const SHORT_THRESHOLD_DAYS = 6.0;

// ============================================================================
// STORAGE ACCESS (ASYNC)
// ============================================================================

async function getStorage() {
  const db = await openDB();
  const stored = await getRecord(STORES.SENSOR_DATA, STORAGE_KEY);
  if (!stored) return await initStorage();
  return stored;
}

async function saveStorage(data) {
  data.last_updated = new Date().toISOString();
  await putRecord(STORES.SENSOR_DATA, { 
    id: STORAGE_KEY, 
    ...data 
  });
}

async function initStorage() {
  const data = {
    version: VERSION,
    last_updated: new Date().toISOString(),
    sensors: [],
    deleted: []
  };
  await saveStorage(data);
  return data;
}

// ============================================================================
// STATUS CALCULATION - THE SINGLE SOURCE OF TRUTH
// ============================================================================

/**
 * Calculate sensor status from dates
 * 
 * IMPORTANT: This is the ONLY place where status is determined.
 * Do NOT store status. Always calculate fresh.
 * 
 * @param {Object} sensor - Sensor with start_date and end_date
 * @returns {string} - 'active' | 'overdue' | 'success' | 'short' | 'failed'
 */
export function calculateStatus(sensor) {
  if (!sensor || !sensor.start_date) return 'unknown';
  
  const now = new Date();
  const start = new Date(sensor.start_date);
  
  // Running sensor
  if (!sensor.end_date) {
    const hours = (now - start) / (1000 * 60 * 60);
    const days = hours / 24;
    const status = days > 7.5 ? 'overdue' : 'active';
    
    return status;
  }
  
  // Ended sensor
  const end = new Date(sensor.end_date);
  const hours = (end - start) / (1000 * 60 * 60);
  const days = hours / 24;
  
  if (days >= SUCCESS_THRESHOLD_DAYS) return 'success';
  if (days >= SHORT_THRESHOLD_DAYS) return 'short';
  return 'failed';
}

/**
 * Get status with UI metadata
 * @param {Object} sensor - Sensor object
 */
export function getStatusInfo(sensor) {
  const status = calculateStatus(sensor);
  
  const info = {
    active: { label: 'Active', colorVar: '--color-yellow' },
    overdue: { label: 'Overdue', colorVar: '--color-orange' },
    success: { label: 'Success', colorVar: '--color-green' },
    short: { label: 'Short', colorVar: '--color-orange' },
    failed: { label: 'Failed', colorVar: '--color-red' },
    unknown: { label: 'Unknown', colorVar: '--ink' }
  };
  
  return {
    status,
    ...info[status]
  };
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

export async function getAllSensors() {
  const storage = await getStorage();
  return storage.sensors.map(sensor => ({
    ...sensor,
    statusInfo: getStatusInfo(sensor)
  }));
}

export async function getSensorById(id) {
  const storage = await getStorage();
  const sensor = storage.sensors.find(s => s.id === id);
  if (!sensor) return null;
  
  return {
    ...sensor,
    statusInfo: getStatusInfo(sensor)
  };
}

export async function getStatistics() {
  const sensors = await getAllSensors();
  const active = sensors.filter(s => s.statusInfo.status === 'active');
  const ended = sensors.filter(s => s.end_date && s.statusInfo.status !== 'deleted');
  const successful = ended.filter(s => s.statusInfo.status === 'success');
  
  return {
    total: sensors.length,
    active: active.length,
    ended: ended.length,
    successful: successful.length,
    success_rate: ended.length > 0 ? (successful.length / ended.length * 100).toFixed(1) : 0
  };
}

// ============================================================================
// WRITE OPERATIONS (ASYNC)
// ============================================================================

export async function addSensor(data) {
  const storage = await getStorage();
  
  const id = data.id || `sensor_${Date.now()}`;
  
  // Check for duplicate
  if (storage.sensors.some(s => s.id === id)) {
    console.warn(`[addSensor] Duplicate sensor ID: ${id} - skipping`);
    return null;
  }
  
  const maxSeq = storage.sensors.reduce((max, s) => Math.max(max, s.sequence || 0), 0);
  
  // Auto-assign season based on start date
  let season_id = data.season_id;
  if (!season_id && data.start_date) {
    const era = getEraForDate(data.start_date);
    season_id = era?.id || null;
  }
  
  const sensor = {
    id,
    sequence: maxSeq + 1,
    start_date: data.start_date,
    end_date: data.end_date || null,
    duration_hours: data.duration_hours || null,
    duration_days: data.duration_days || null,
    lot_number: data.lot_number || null,
    season_id: season_id,
    notes: data.notes || '',
    is_locked: data.is_locked || false,
    batch_id: data.batch_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  storage.sensors.push(sensor);
  await saveStorage(storage);
  
  return sensor;
}

export async function updateSensor(id, updates) {
  const storage = await getStorage();
  const index = storage.sensors.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  storage.sensors[index] = {
    ...storage.sensors[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  await saveStorage(storage);
  return storage.sensors[index];
}

export async function deleteSensor(id) {
  const storage = await getStorage();
  
  // HARD DELETE: Remove sensor from sensors array entirely
  const sensorIndex = storage.sensors.findIndex(s => s.id === id);
  
  if (sensorIndex === -1) {
    return { success: false, error: 'Sensor not found' };
  }
  
  // Remove from sensors array
  storage.sensors.splice(sensorIndex, 1);
  
  await saveStorage(storage);
  
  return { success: true };
}

// ============================================================================
// LOCK OPERATIONS
// ============================================================================

export async function toggleLock(id) {
  const storage = await getStorage();
  const sensor = storage.sensors.find(s => s.id === id);
  
  if (!sensor) return { success: false, error: 'Sensor not found' };
  
  sensor.is_locked = !sensor.is_locked;
  sensor.updated_at = new Date().toISOString();
  
  await saveStorage(storage);
  
  return { success: true, is_locked: sensor.is_locked };
}

export async function setLock(id, locked) {
  const storage = await getStorage();
  const sensor = storage.sensors.find(s => s.id === id);
  
  if (!sensor) return { success: false, error: 'Sensor not found' };
  
  sensor.is_locked = !!locked;
  sensor.updated_at = new Date().toISOString();
  
  await saveStorage(storage);
  
  return { success: true, is_locked: sensor.is_locked };
}

// ============================================================================
// CLEAR OPERATIONS
// ============================================================================

export async function clearAllSensors() {
  const data = {
    version: VERSION,
    last_updated: new Date().toISOString(),
    sensors: [],
    deleted: []
  };
  await saveStorage(data);
  return { success: true, cleared: true };
}

// ============================================================================
// BATCH OPERATIONS
// Note: Batch management moved to stockStorage.js (v4.0.1)
// This only handles sensor.batch_id field updates
// ============================================================================

export async function assignBatch(sensorId, batchId) {
  const storage = await getStorage();
  const sensor = storage.sensors.find(s => s.id === sensorId);
  
  if (!sensor) return { success: false, error: 'Sensor not found' };
  
  sensor.batch_id = batchId;
  sensor.updated_at = new Date().toISOString();
  
  await saveStorage(storage);
  
  return { success: true };
}

// ============================================================================
// EXPORT/IMPORT
// ============================================================================

export async function exportJSON() {
  const storage = await getStorage();
  return {
    ...storage,
    export_date: new Date().toISOString()
  };
}

export async function importJSON(data) {
  try {
    if (!data.version || !data.sensors) {
      return { success: false, error: 'Invalid data format' };
    }
    
    const storage = await getStorage();
    const existingSensorIds = new Set(storage.sensors.map(s => s.id));
    
    // Count what we're importing
    let sensorsAdded = 0;
    let sensorsSkipped = 0;
    
    // Filter sensors (skip duplicates)
    const newSensors = data.sensors.filter(sensor => {
      if (existingSensorIds.has(sensor.id)) {
        sensorsSkipped++;
        return false;
      }
      sensorsAdded++;
      return true;
    });
    
    // Merge data (append instead of replace)
    const mergedData = {
      ...storage,
      version: data.version,
      sensors: [...storage.sensors, ...newSensors],
      deleted: storage.deleted // Keep existing deleted list
    };
    
    await saveStorage(mergedData);
    
    return { 
      success: true,
      summary: {
        sensorsAdded,
        sensorsSkipped
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Resequence all sensors chronologically
 * Oldest sensor gets sequence #1, newest gets highest number
 */
export async function resequenceSensors() {
  const storage = await getStorage();
  
  // Sort by start_date (oldest first)
  const sorted = [...storage.sensors].sort((a, b) => {
    const dateA = new Date(a.start_date);
    const dateB = new Date(b.start_date);
    return dateA - dateB;
  });
  
  // Reassign sequences starting from 1
  sorted.forEach((sensor, index) => {
    sensor.sequence = index + 1;
    sensor.updated_at = new Date().toISOString();
  });
  
  // Update storage
  storage.sensors = sorted;
  await saveStorage(storage);
  
  return {
    success: true,
    resequenced: sorted.length,
    message: `Resequenced ${sorted.length} sensors chronologically`
  };
}

/**
 * Update hardware versions for all sensors based on start_date
 * Sensors from 2025-07-03 onwards get A2.01, earlier ones get A1.01
 */
export async function updateHardwareVersions() {
  const storage = await getStorage();
  const cutoffDate = new Date('2025-07-03T00:00:00');
  let updated = 0;
  
  storage.sensors.forEach(sensor => {
    if (sensor.start_date) {
      const startDate = new Date(sensor.start_date);
      const newVersion = startDate >= cutoffDate ? 'A2.01' : 'A1.01';
      
      if (sensor.hw_version !== newVersion) {
        sensor.hw_version = newVersion;
        sensor.updated_at = new Date().toISOString();
        updated++;
      }
    }
  });
  
  if (updated > 0) {
    await saveStorage(storage);
  }
  
  return {
    success: true,
    updated,
    message: `Updated ${updated} sensors with correct HW version`
  };
}

export async function getStorageInfo() {
  const storage = await getStorage();
  const stats = await getStatistics();
  
  return {
    version: storage.version,
    last_updated: storage.last_updated,
    ...stats,
    deleted_count: storage.deleted.length
  };
}

export default {
  // Status
  calculateStatus,
  getStatusInfo,
  
  // Read
  getAllSensors,
  getSensorById,
  getStatistics,
  
  // Write
  addSensor,
  updateSensor,
  deleteSensor,
  clearAllSensors,
  
  // Lock
  toggleLock,
  setLock,
  
  // Batch (batch management moved to stockStorage.js)
  assignBatch,
  
  // Export/Import
  exportJSON,
  importJSON,
  
  // Utilities
  getStorageInfo,
  resequenceSensors,
  updateHardwareVersions
};
