/**
 * Storage Compatibility Layer
 * 
 * Provides backward-compatible API for existing UI components
 * while using V4 storage under the hood.
 * 
 * This allows us to:
 * 1. Run migration immediately
 * 2. Fix sensor #222 bug
 * 3. Refactor UI components later
 */

import sensorStorageV4 from './sensorStorageV4.js';

// ============================================================================
// SENSOR OPERATIONS (Compatible with old API)
// ============================================================================

/**
 * Get sensor database (compatible with old format)
 */
export function getSensorDatabase() {
  try {
    const sensors = sensorStorageV4.getAllSensors();
    
    // Flatten statusInfo and add compatibility fields
    const compatibleSensors = sensors.map(sensor => ({
      ...sensor,
      // Flatten statusInfo
      status: sensor.statusInfo.status,
      // Remove old dual-storage fields (all sensors are now equal)
      storageSource: 'v4',
      isEditable: true,
      // Map is_success to success for backward compat
      success: sensor.is_success,
      // Add chronological_index (same as sequence)
      chronological_index: sensor.sequence
    }));
    
    return {
      sensors: compatibleSensors,
      version: '4.0.0'
    };
  } catch (error) {
    console.error('[Compat] Error getting database:', error);
    return { sensors: [], version: '4.0.0' };
  }
}

/**
 * Check if sensor is locked
 */
export function isSensorLocked(sensorId) {
  const sensor = sensorStorageV4.getSensorById(sensorId);
  return sensor ? sensor.is_locked : false;
}

/**
 * Get sensor lock status
 */
export function getSensorLockStatus(sensorId, startDate = null) {
  const sensor = sensorStorageV4.getSensorById(sensorId);
  if (!sensor) {
    return {
      isLocked: true,
      autoCalculated: true,
      reason: 'sensor-not-found'
    };
  }
  
  return {
    isLocked: sensor.is_locked,
    autoCalculated: false,
    reason: 'manual'
  };
}

/**
 * Get manual lock status
 */
export function getManualLockStatus(sensorId, startDate = null) {
  return getSensorLockStatus(sensorId, startDate);
}

/**
 * Toggle sensor lock
 */
export function toggleSensorLock(sensorId) {
  const newState = sensorStorageV4.toggleSensorLock(sensorId);
  return {
    success: true,
    isLocked: newState
  };
}

/**
 * Initialize manual locks (no-op in V4)
 */
export function initializeManualLocks() {
  return {
    initialized: 0,
    total: 0
  };
}

/**
 * Delete sensor with lock check
 */
export function deleteSensorWithLockCheck(sensorId) {
  const sensor = sensorStorageV4.getSensorById(sensorId);
  
  if (!sensor) {
    return {
      success: false,
      error: 'Sensor not found'
    };
  }
  
  if (sensor.is_locked) {
    return {
      success: false,
      error: 'Sensor is locked. Unlock it first to delete.',
      isLocked: true
    };
  }
  
  const success = sensorStorageV4.deleteSensor(sensorId);
  return {
    success,
    error: success ? null : 'Delete failed'
  };
}

// ============================================================================
// EXPORT/IMPORT (Compatible with old API)
// ============================================================================

/**
 * Export sensors to JSON
 */
export function exportSensorsToJSON() {
  try {
    const data = sensorStorageV4.exportData();
    const filename = `agp-sensors-${new Date().toISOString().split('T')[0]}.json`;
    
    return {
      success: true,
      data: data,
      filename: filename
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate import data
 */
export function validateImportData(data) {
  const errors = [];
  
  if (!data.version) {
    errors.push('Missing version field');
  }
  
  if (!Array.isArray(data.sensors)) {
    errors.push('sensors must be an array');
  }
  
  if (!Array.isArray(data.batches)) {
    errors.push('batches must be an array');
  }
  
  return errors.length > 0 ? errors : null;
}

/**
 * Import sensors from JSON
 */
export function importSensorsFromJSON(data, options = {}) {
  try {
    // V4 importData handles both replace and merge modes
    // For now, we'll just do replace (user confirms this)
    const success = sensorStorageV4.importData(data);
    
    if (!success) {
      return {
        success: false,
        error: 'Import failed'
      };
    }
    
    return {
      success: true,
      imported: data.sensors.length,
      updated: 0,
      skipped: 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// BATCH OPERATIONS (Pass-through to V4)
// ============================================================================

export function getAllBatches() {
  return sensorStorageV4.getAllBatches();
}

export function getAssignmentForSensor(sensorId) {
  const sensor = sensorStorageV4.getSensorById(sensorId);
  if (!sensor || !sensor.batch_id) {
    return null;
  }
  
  return {
    assignment_id: `ASSIGN-${sensorId}`,
    sensor_id: sensorId,
    batch_id: sensor.batch_id,
    assigned_at: sensor.updated_at,
    assigned_by: 'manual'
  };
}

export function assignSensorToBatch(sensorId, batchId) {
  return sensorStorageV4.assignBatchToSensor(sensorId, batchId);
}

export function unassignSensor(sensorId) {
  return sensorStorageV4.assignBatchToSensor(sensorId, null);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getSensorDatabase,
  isSensorLocked,
  getSensorLockStatus,
  getManualLockStatus,
  toggleSensorLock,
  initializeManualLocks,
  deleteSensorWithLockCheck,
  exportSensorsToJSON,
  validateImportData,
  importSensorsFromJSON,
  getAllBatches,
  getAssignmentForSensor,
  assignSensorToBatch,
  unassignSensor
};
