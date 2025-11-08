/**
 * sensor-history-engine.js
 * Pure calculation functions for sensor database statistics
 * 
 * NO React, NO state, NO side effects - just data in, data out
 * 
 * Functions:
 * - calculateOverallStats: Total sensors, success rate, avg duration
 * - calculateHWVersionStats: Performance per HW version (A1.01, A2.01)
 * - calculateLotPerformance: Success rate per lot number
 * - filterSensors: Apply filters (date range, lot, hw version, success/fail)
 * - sortSensors: Sort by any column (date, duration, lot, etc)
 */

/**
 * Calculate overall statistics
 * @param {Array} sensors - All sensor records
 * @returns {Object} {
 *   total: number,
 *   successful: number,
 *   failed: number,
 *   running: number,
 *   successRate: number (0-100),
 *   avgDuration: number (days),
 *   totalDays: number
 * }
 */
export function calculateOverallStats(sensors) {
  if (!sensors || sensors.length === 0) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      running: 0,
      successRate: 0,
      avgDuration: 0,
      totalDays: 0
    };
  }

  const total = sensors.length;
  const running = sensors.filter(s => s.status === 'running').length;
  const completed = sensors.filter(s => s.status !== 'running');
  const successful = completed.filter(s => s.success === 1).length;
  const failed = completed.length - successful;
  
  // Success rate only includes completed sensors (exclude running)
  const successRate = completed.length > 0 ? (successful / completed.length) * 100 : 0;
  
  const totalDuration = sensors.reduce((sum, s) => sum + (s.duration_days || 0), 0);
  const avgDuration = total > 0 ? totalDuration / total : 0;

  return {
    total,
    successful,
    failed,
    running,
    successRate: Math.round(successRate),
    avgDuration: Math.round(avgDuration * 10) / 10,
    totalDays: Math.round(totalDuration)
  };
}

/**
 * Calculate statistics per hardware version
 * @param {Array} sensors - All sensor records
 * @returns {Array} [{
 *   hwVersion: string,
 *   total: number,
 *   successful: number,
 *   running: number,
 *   successRate: number,
 *   avgDuration: number
 * }]
 */
export function calculateHWVersionStats(sensors) {
  if (!sensors || sensors.length === 0) return [];

  // Group by HW version
  const groups = sensors.reduce((acc, sensor) => {
    const hw = sensor.hw_version || 'Unknown';
    if (!acc[hw]) {
      acc[hw] = [];
    }
    acc[hw].push(sensor);
    return acc;
  }, {});

  // Calculate stats for each group
  return Object.entries(groups).map(([hwVersion, sensorList]) => {
    const total = sensorList.length;
    const running = sensorList.filter(s => s.status === 'running').length;
    const completed = sensorList.filter(s => s.status !== 'running');
    const successful = completed.filter(s => s.success === 1).length;
    
    // Success rate only for completed sensors
    const successRate = completed.length > 0 ? (successful / completed.length) * 100 : 0;
    
    const totalDuration = sensorList.reduce((sum, s) => sum + (s.duration_days || 0), 0);
    const avgDuration = total > 0 ? totalDuration / total : 0;

    return {
      hwVersion,
      total,
      successful,
      running,
      successRate: Math.round(successRate),
      avgDuration: Math.round(avgDuration * 10) / 10
    };
  }).sort((a, b) => b.total - a.total); // Sort by usage (most common first)
}
/**
 * Calculate performance per lot number
 * @param {Array} sensors - All sensor records
 * @returns {Array} [{
 *   lotNumber: string,
 *   total: number,
 *   successful: number,
 *   failed: number,
 *   running: number,
 *   successRate: number,
 *   avgDuration: number
 * }]
 */
export function calculateLotPerformance(sensors) {
  if (!sensors || sensors.length === 0) return [];

  // Group by lot number
  const groups = sensors.reduce((acc, sensor) => {
    const lot = sensor.lot_number || 'Unknown';
    if (!acc[lot]) {
      acc[lot] = [];
    }
    acc[lot].push(sensor);
    return acc;
  }, {});

  // Calculate stats for each lot
  return Object.entries(groups).map(([lotNumber, sensorList]) => {
    const total = sensorList.length;
    const running = sensorList.filter(s => s.status === 'running').length;
    const completed = sensorList.filter(s => s.status !== 'running');
    const successful = completed.filter(s => s.success === 1).length;
    const failed = completed.length - successful;
    
    // Success rate only for completed sensors (exclude running)
    const successRate = completed.length > 0 ? (successful / completed.length) * 100 : 0;
    
    const totalDuration = sensorList.reduce((sum, s) => sum + (s.duration_days || 0), 0);
    const avgDuration = total > 0 ? totalDuration / total : 0;

    return {
      lotNumber,
      total,
      successful,
      failed,
      running,
      successRate: Math.round(successRate),
      avgDuration: Math.round(avgDuration * 10) / 10
    };
  }).sort((a, b) => b.total - a.total); // Sort by usage
}

/**
 * Filter sensors by criteria
 * @param {Array} sensors - All sensor records
 * @param {Object} filters - {
 *   startDate: string | null,
 *   endDate: string | null,
 *   lotNumber: string | null,
 *   hwVersion: string | null,
 *   successOnly: boolean,
 *   failedOnly: boolean
 * }
 * @returns {Array} Filtered sensors
 */
export function filterSensors(sensors, filters) {
  if (!sensors || sensors.length === 0) return [];
  if (!filters) return sensors;

  return sensors.filter(sensor => {
    // Date range filter
    if (filters.startDate && sensor.start_date < filters.startDate) return false;
    if (filters.endDate && sensor.start_date > filters.endDate) return false;

    // Lot number filter
    if (filters.lotNumber && sensor.lot_number !== filters.lotNumber) return false;

    // HW version filter
    if (filters.hwVersion && sensor.hw_version !== filters.hwVersion) return false;

    // Success/failure filter
    if (filters.successOnly && sensor.success !== 1) return false;
    if (filters.failedOnly && sensor.success === 1) return false;

    return true;
  });
}

/**
 * Sort sensors by column
 * @param {Array} sensors - Sensor records
 * @param {string} column - Column name to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted sensors
 */
export function sortSensors(sensors, column, direction = 'desc') {
  if (!sensors || sensors.length === 0) return [];

  const sorted = [...sensors].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];

    // Handle nulls
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // String comparison
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (direction === 'asc') {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    } else {
      return bStr < aStr ? -1 : bStr > aStr ? 1 : 0;
    }
  });

  return sorted;
}
