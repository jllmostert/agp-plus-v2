// ============================================================================
// PHASE 5: LOCK SYSTEM ADDITIONS
// Add these functions to src/storage/sensorStorage.js
// ============================================================================

/**
 * Calculate if a sensor is locked (>30 days old from start_date)
 * Locked sensors are protected from accidental deletion/modification
 * 
 * @param {string} startDate - Sensor start_date (ISO format)
 * @returns {boolean} - True if sensor is locked (>30 days old)
 */
export function isSensorLocked(startDate) {
  if (!startDate) return false;
  
  const sensorStart = new Date(startDate);
  const now = new Date();
  const daysDiff = (now - sensorStart) / (1000 * 60 * 60 * 24);
  
  return daysDiff > 30;
}

/**
 * Get detailed lock status with timing information
 * Useful for UI display and decision making
 * 
 * @param {string} startDate - Sensor start_date (ISO format)
 * @returns {Object} Lock status details
 * @returns {boolean} .isLocked - Whether sensor is currently locked
 * @returns {number|null} .daysSinceStart - Days since sensor started
 * @returns {number|null} .daysUntilUnlock - Days until lock expires (null if locked)
 */
export function getSensorLockStatus(startDate) {
  if (!startDate) {
    return {
      isLocked: false,
      daysSinceStart: null,
      daysUntilUnlock: null
    };
  }
  
  const sensorStart = new Date(startDate);
  const now = new Date();
  const daysSinceStart = Math.floor((now - sensorStart) / (1000 * 60 * 60 * 24));
  const isLocked = daysSinceStart > 30;
  const daysUntilUnlock = isLocked ? null : Math.max(0, 30 - daysSinceStart);
  
  return {
    isLocked,
    daysSinceStart,
    daysUntilUnlock
  };
}

/**
 * Delete sensor with automatic lock protection
 * Prevents accidental deletion of historical sensors (>30 days old)
 * 
 * @param {string} sensorId - Sensor ID to delete
 * @param {boolean} forceOverride - Force delete even if locked (requires explicit user confirmation)
 * @returns {Object} Result object
 * @returns {boolean} .success - Whether deletion succeeded
 * @returns {string} .message - User-friendly message
 * @returns {boolean} .wasLocked - Whether sensor was locked
 */
export function deleteSensorWithLockCheck(sensorId, forceOverride = false) {
  const sensors = getAllSensors();
  const sensor = sensors.find(s => s.sensor_id === sensorId);
  
  if (!sensor) {
    return {
      success: false,
      message: 'Sensor niet gevonden',
      wasLocked: false
    };
  }
  
  const locked = isSensorLocked(sensor.start_date);
  
  if (locked && !forceOverride) {
    return {
      success: false,
      message: 'Sensor is vergrendeld (>30 dagen oud). Gebruik force override om te verwijderen.',
      wasLocked: true
    };
  }
  
  // Proceed with deletion
  const updatedSensors = sensors.filter(s => s.sensor_id !== sensorId);
  saveSensors(updatedSensors);
  
  return {
    success: true,
    message: locked ? '🔒 Vergrendelde sensor verwijderd met override' : '✅ Sensor verwijderd',
    wasLocked: locked
  };
}

/**
 * Get lock statistics for all sensors
 * Useful for dashboard/summary displays
 * 
 * @returns {Object} Lock statistics
 */
export function getLockStatistics() {
  const sensors = getAllSensors();
  const locked = sensors.filter(s => isSensorLocked(s.start_date));
  const unlocked = sensors.filter(s => !isSensorLocked(s.start_date));
  
  return {
    total: sensors.length,
    locked: locked.length,
    unlocked: unlocked.length,
    lockedPercentage: sensors.length > 0 ? (locked.length / sensors.length * 100).toFixed(1) : 0
  };
}
