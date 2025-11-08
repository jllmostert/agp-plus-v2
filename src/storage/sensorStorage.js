/**
 * Sensor Storage Module - V4 Clean Implementation
 * 
 * Single source of truth for sensor data.
 * Pure functions, clear API, no complexity.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'agp-sensors-v4';
const VERSION = '4.0.0';
const SUCCESS_THRESHOLD_DAYS = 6.75;

// ============================================================================
// STORAGE ACCESS
// ============================================================================

function getStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return initStorage();
  return JSON.parse(raw);
}

function saveStorage(data) {
  data.last_updated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initStorage() {
  const data = {
    version: VERSION,
    last_updated: new Date().toISOString(),
    sensors: [],
    batches: [],
    deleted: []
  };
  saveStorage(data);
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
 * @returns {string} - 'active' | 'overdue' | 'success' | 'failed' | 'deleted'
 */
export function calculateStatus(sensor) {
  if (!sensor || !sensor.start_date) return 'unknown';
  
  // Check if deleted
  const storage = getStorage();
  const isDeleted = storage.deleted.some(d => d.sensor_id === sensor.id);
  if (isDeleted) return 'deleted';
  
  const now = new Date();
  const start = new Date(sensor.start_date);
  
  // Running sensor
  if (!sensor.end_date) {
    const hours = (now - start) / (1000 * 60 * 60);
    const days = hours / 24;
    const status = days > 7.5 ? 'overdue' : 'active';
    
    // DEBUG for sensor #222
    if (sensor.id === 'sensor_1762231226000') {
      console.log('[calculateStatus] Sensor #222:', {
        id: sensor.id,
        start_date: sensor.start_date,
        end_date: sensor.end_date,
        days_running: days.toFixed(2),
        status: status
      });
    }
    
    return status;
  }
  
  // Ended sensor
  const end = new Date(sensor.end_date);
  const hours = (end - start) / (1000 * 60 * 60);
  const days = hours / 24;
  
  return days >= SUCCESS_THRESHOLD_DAYS ? 'success' : 'failed';
}

/**
 * Get status with UI metadata
 */
export function getStatusInfo(sensor) {
  const status = calculateStatus(sensor);
  
  const info = {
    active: { emoji: '🔄', label: 'Active', color: '#fbbf24' },
    overdue: { emoji: '⏰', label: 'Overdue', color: '#f59e0b' },
    success: { emoji: '✅', label: 'Success', color: '#10b981' },
    failed: { emoji: '❌', label: 'Failed', color: '#ef4444' },
    deleted: { emoji: '🗑️', label: 'Deleted', color: '#6b7280' },
    unknown: { emoji: '❓', label: 'Unknown', color: '#9ca3af' }
  };
  
  return {
    status,
    ...info[status]
  };
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

export function getAllSensors() {
  const storage = getStorage();
  return storage.sensors.map(sensor => ({
    ...sensor,
    statusInfo: getStatusInfo(sensor)
  }));
}

export function getSensorById(id) {
  const storage = getStorage();
  const sensor = storage.sensors.find(s => s.id === id);
  if (!sensor) return null;
  
  return {
    ...sensor,
    statusInfo: getStatusInfo(sensor)
  };
}

export function getStatistics() {
  const sensors = getAllSensors();
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
// WRITE OPERATIONS
// ============================================================================

export function addSensor(data) {
  const storage = getStorage();
  
  // Generate ID if not provided
  const id = data.id || `sensor_${Date.now()}`;
  
  // Calculate next sequence
  const maxSeq = storage.sensors.reduce((max, s) => Math.max(max, s.sequence || 0), 0);
  
  const sensor = {
    id,
    sequence: maxSeq + 1,
    start_date: data.start_date,
    end_date: data.end_date || null,
    duration_hours: data.duration_hours || null,
    duration_days: data.duration_days || null,
    lot_number: data.lot_number || null,
    hw_version: data.hw_version || null,
    notes: data.notes || '',
    is_locked: data.is_locked || false,
    batch_id: data.batch_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  storage.sensors.push(sensor);
  saveStorage(storage);
  
  return sensor;
}

export function updateSensor(id, updates) {
  const storage = getStorage();
  const index = storage.sensors.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  storage.sensors[index] = {
    ...storage.sensors[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  saveStorage(storage);
  return storage.sensors[index];
}

export function deleteSensor(id) {
  const storage = getStorage();
  
  // Check if already deleted
  if (storage.deleted.some(d => d.sensor_id === id)) {
    return { success: false, error: 'Already deleted' };
  }
  
  // Add to deleted list
  storage.deleted.push({
    sensor_id: id,
    deleted_at: new Date().toISOString()
  });
  
  saveStorage(storage);
  return { success: true };
}

export function restoreSensor(id) {
  const storage = getStorage();
  const index = storage.deleted.findIndex(d => d.sensor_id === id);
  
  if (index === -1) return { success: false, error: 'Not in deleted list' };
  
  storage.deleted.splice(index, 1);
  saveStorage(storage);
  
  return { success: true };
}

// ============================================================================
// LOCK OPERATIONS
// ============================================================================

export function toggleLock(id) {
  const storage = getStorage();
  const sensor = storage.sensors.find(s => s.id === id);
  
  if (!sensor) return { success: false, error: 'Sensor not found' };
  
  sensor.is_locked = !sensor.is_locked;
  sensor.updated_at = new Date().toISOString();
  
  saveStorage(storage);
  
  return { success: true, is_locked: sensor.is_locked };
}

export function setLock(id, locked) {
  const storage = getStorage();
  const sensor = storage.sensors.find(s => s.id === id);
  
  if (!sensor) return { success: false, error: 'Sensor not found' };
  
  sensor.is_locked = !!locked;
  sensor.updated_at = new Date().toISOString();
  
  saveStorage(storage);
  
  return { success: true, is_locked: sensor.is_locked };
}

// ============================================================================
// CLEAR OPERATIONS
// ============================================================================

export function clearAllSensors() {
  const data = {
    version: VERSION,
    last_updated: new Date().toISOString(),
    sensors: [],
    batches: [],
    deleted: []
  };
  saveStorage(data);
  return { success: true, cleared: true };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export function getAllBatches() {
  const storage = getStorage();
  return storage.batches;
}

export function addBatch(data) {
  const storage = getStorage();
  
  const batch = {
    batch_id: data.batch_id || `BATCH-${Date.now()}`,
    lot_number: data.lot_number,
    quantity: data.quantity || 0,
    received_date: data.received_date,
    expiry_date: data.expiry_date,
    source: data.source || 'manual'
  };
  
  storage.batches.push(batch);
  saveStorage(storage);
  
  return batch;
}

export function assignBatch(sensorId, batchId) {
  const storage = getStorage();
  const sensor = storage.sensors.find(s => s.id === sensorId);
  
  if (!sensor) return { success: false, error: 'Sensor not found' };
  
  sensor.batch_id = batchId;
  sensor.updated_at = new Date().toISOString();
  
  saveStorage(storage);
  
  return { success: true };
}

// ============================================================================
// EXPORT/IMPORT
// ============================================================================

export function exportJSON() {
  const storage = getStorage();
  return {
    ...storage,
    export_date: new Date().toISOString()
  };
}

export function importJSON(data) {
  try {
    if (!data.version || !data.sensors) {
      return { success: false, error: 'Invalid data format' };
    }
    
    const storage = getStorage();
    const existingSensorIds = new Set(storage.sensors.map(s => s.id));
    
    // Count what we're importing
    let sensorsAdded = 0;
    let sensorsSkipped = 0;
    
    data.sensors.forEach(sensor => {
      if (existingSensorIds.has(sensor.id)) {
        sensorsSkipped++;
      } else {
        sensorsAdded++;
      }
    });
    
    // Replace entire storage with imported data
    saveStorage(data);
    
    return { 
      success: true,
      summary: {
        sensorsAdded,
        sensorsSkipped,
        batchesImported: data.batches?.length || 0
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

export function getStorageInfo() {
  const storage = getStorage();
  const stats = getStatistics();
  
  return {
    version: storage.version,
    last_updated: storage.last_updated,
    ...stats,
    deleted_count: storage.deleted.length,
    batch_count: storage.batches.length
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
  restoreSensor,
  clearAllSensors,
  
  // Lock
  toggleLock,
  setLock,
  
  // Batch
  getAllBatches,
  addBatch,
  assignBatch,
  
  // Export/Import
  exportJSON,
  importJSON,
  
  // Utilities
  getStorageInfo
};
