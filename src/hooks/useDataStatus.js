/**
 * useDataStatus - Data Status Monitoring Hook
 * 
 * Monitors master dataset health and provides actionable status indicators.
 * 
 * Status Levels:
 * - RED: No data loaded (action: upload CSV)
 * - YELLOW: Partial data < 2000 readings in last 14 days (action: upload more)
 * - GREEN: Full dataset ready (action: none, ready to analyze)
 * 
 * @returns {Object} Status object with health indicators
 * 
 * @example
 * const status = useDataStatus();
 * // {
 * //   hasData: true,
 * //   readingCount: 29184,
 * //   dateRange: { earliest: Date, latest: Date },
 * //   last14DaysCount: 4032,
 * //   lightColor: 'green',
 * //   message: 'Ready to analyze'
 * // }
 */

import { useMemo } from 'react';

/**
 * Subtract days from a date
 * @param {Date} date 
 * @param {number} days 
 * @returns {Date}
 */
function subDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Determine status light color based on data health
 * @param {number} readingCount - Total readings
 * @param {number} last14DaysCount - Readings in last 14 days
 * @returns {string} 'red' | 'yellow' | 'green'
 */
function getStatusColor(readingCount, last14DaysCount) {
  if (readingCount === 0) {
    return 'red';
  }
  
  // Ideal: 288 readings/day * 14 days = 4032 readings
  // Acceptable: ~2000 readings (70% coverage)
  if (last14DaysCount < 2000) {
    return 'yellow';
  }
  
  return 'green';
}

/**
 * Get actionable status message
 * @param {string} color - Status color
 * @param {number} readingCount - Total readings
 * @returns {string} User-facing message
 */
function getStatusMessage(color, readingCount) {
  switch (color) {
    case 'red':
      return 'No data loaded. Upload a CSV file to begin.';
    case 'yellow':
      return 'Limited recent data. Upload more CSVs for better analysis.';
    case 'green':
      return 'Ready to analyze';
    default:
      return '';
  }
}

/**
 * Format date range for display
 * @param {Date} earliest 
 * @param {Date} latest 
 * @returns {string} "MMM D - MMM D, YYYY"
 */
function formatDateRange(earliest, latest) {
  if (!earliest || !latest) return '';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const e = earliest;
  const l = latest;
  
  return `${months[e.getMonth()]} ${e.getDate()} - ${months[l.getMonth()]} ${l.getDate()}, ${l.getFullYear()}`;
}

export function useDataStatus(allReadings = []) {
  const status = useMemo(() => {
    // RED: No data
    if (!allReadings || allReadings.length === 0) {
      return {
        hasData: false,
        readingCount: 0,
        dateRange: null,
        last14DaysCount: 0,
        lightColor: 'red',
        message: getStatusMessage('red', 0),
        actionRequired: true
      };
    }

    // Helper: Convert reading to timestamp (support both V2 and V3 formats)
    const getTimestamp = (reading) => {
      // V3 format: has timestamp property
      if (reading.timestamp) {
        return reading.timestamp instanceof Date 
          ? reading.timestamp 
          : new Date(reading.timestamp);
      }
      
      // V2 format: has date/time strings
      if (reading.date && reading.time) {
        const dateStr = reading.date.replace(/\//g, '-'); // "2025/10/26" → "2025-10-26"
        return new Date(`${dateStr}T${reading.time}`);
      }
      
      return null;
    };

    // Calculate date range
    const timestamps = allReadings
      .map(r => getTimestamp(r))
      .filter(t => t && !isNaN(t.getTime()))
      .map(t => t.getTime());
    
    if (timestamps.length === 0) {
      return {
        hasData: false,
        readingCount: allReadings.length,
        dateRange: null,
        last14DaysCount: 0,
        lightColor: 'red',
        message: 'Data format error',
        actionRequired: true
      };
    }
    
    const earliest = new Date(Math.min(...timestamps));
    const latest = new Date(Math.max(...timestamps));
    
    // Calculate last 14 days count
    const cutoff14Days = subDays(latest, 14);
    const last14DaysCount = allReadings.filter(r => {
      const ts = getTimestamp(r);
      return ts && ts >= cutoff14Days;
    }).length;

    // Determine status color
    const lightColor = getStatusColor(allReadings.length, last14DaysCount);

    return {
      hasData: true,
      readingCount: allReadings.length,
      dateRange: { earliest, latest },
      dateRangeFormatted: formatDateRange(earliest, latest),
      last14DaysCount,
      lightColor,
      message: getStatusMessage(lightColor, allReadings.length),
      actionRequired: lightColor === 'red' || lightColor === 'yellow'
    };
  }, [allReadings]);

  return status;
}
