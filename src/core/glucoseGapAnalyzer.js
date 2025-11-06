/**
 * Glucose Gap Analyzer Module
 * 
 * Detects glucose reading gaps that may indicate sensor changes.
 * A gap ≥120 minutes (2 hours) is considered significant as it exceeds:
 * - Normal transmitter charge: ~30 min
 * - Sensor warmup period: ~120 min
 * 
 * Used to enhance sensor change detection when alert data is ambiguous.
 */

import { debug } from '../utils/debug.js';

const DEFAULT_MIN_GAP_MINUTES = 120;
const READING_INTERVAL_MINUTES = 5; // Expected CGM reading interval

/**
 * Detect glucose reading gaps
 * @param {Array} glucoseReadings - Array of { timestamp, glucose }
 * @param {number} minGapMinutes - Minimum gap duration to report (default: 120)
 * @returns {Array} Array of { startTime, endTime, durationMinutes, reason }
 */
export function detectGlucoseGaps(glucoseReadings, minGapMinutes = DEFAULT_MIN_GAP_MINUTES) {
  if (!glucoseReadings || glucoseReadings.length < 2) {
    return [];
  }
  
  // Sort by timestamp
  const sorted = [...glucoseReadings].sort((a, b) => a.timestamp - b.timestamp);
  
  const gaps = [];
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    const timeDiffMs = curr.timestamp - prev.timestamp;
    const timeDiffMin = timeDiffMs / 1000 / 60;
    
    // Report gaps exceeding threshold
    if (timeDiffMin >= minGapMinutes) {
      const gap = {
        startTime: prev.timestamp,
        endTime: curr.timestamp,
        durationMinutes: Math.round(timeDiffMin),
        reason: classifyGap(timeDiffMin)
      };
      
      gaps.push(gap);
    }
  }
  
  debug.log('[Gap Analyzer] Gaps detected', {
 count: gaps.length,
    totalDuration: gaps.reduce((sum, g) => sum + g.durationMinutes, 0)
  });
  
  return gaps;
}

/**
 * Classify gap by duration
 * @param {number} durationMinutes - Gap duration
 * @returns {string} Gap classification
 */
function classifyGap(durationMinutes) {
  if (durationMinutes >= 480) {
    return 'Very long gap (8+ hours) - likely sensor removal';
  } else if (durationMinutes >= 240) {
    return 'Long gap (4-8 hours) - possible sensor change';
  } else if (durationMinutes >= 120) {
    return 'Moderate gap (2-4 hours) - sensor warmup or signal loss';
  }
  return 'Short gap';
}

/**
 * Find End-of-Life gap start for a sensor
 * 
 * Determines when a sensor stopped working by finding the first significant gap
 * (≥2 hours) after the last valid glucose reading within the sensor's lifetime.
 * 
 * @param {Array} glucoseReadings - All glucose readings (sorted by timestamp)
 * @param {Object} sensorWindow - { start: Date, end: Date|null }
 * @param {number} minGapMinutes - Minimum gap to consider EoL (default: 120)
 * @returns {Date|null} Timestamp when sensor stopped (gap start), or null if still active
 */
export function findEndOfLifeGapStart(glucoseReadings, sensorWindow, minGapMinutes = 120) {
  if (!glucoseReadings || glucoseReadings.length === 0 || !sensorWindow.start) {
    return null;
  }
  
  const startTime = sensorWindow.start;
  const endTime = sensorWindow.end || new Date(); // If no end, use now
  
  // Filter readings within sensor window
  const sensorReadings = glucoseReadings.filter(r => 
    r.timestamp >= startTime && r.timestamp <= endTime
  );
  
  if (sensorReadings.length === 0) {
    return null;
  }
  
  // Sort by timestamp (just in case)
  const sorted = [...sensorReadings].sort((a, b) => a.timestamp - b.timestamp);
  
  // Find first EoL gap (≥2 hours after last valid reading)
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    const timeDiffMs = curr.timestamp - prev.timestamp;
    const timeDiffMin = timeDiffMs / 1000 / 60;
    
    if (timeDiffMin >= minGapMinutes) {
      // Found EoL gap - return start time (after last valid reading)
      debug.log('[Gap Analyzer] EoL gap detected', {
        sensorStart: startTime,
        lastReading: prev.timestamp,
        gapStart: prev.timestamp,
        gapDuration: Math.round(timeDiffMin) + 'min'
      });
      
      return prev.timestamp; // Gap starts after last reading
    }
  }
  
  // No significant gap found - sensor still active
  return null;
}

/**
 * Find gaps near a specific timestamp
 * @param {Array} gaps - Array of gap objects
 * @param {Date} targetTime - Timestamp to search near
 * @param {number} windowHours - Search window in hours (default: 6)
 * @returns {Array} Gaps within time window
 */
export function findGapsNearTime(gaps, targetTime, windowHours = 6) {
  const windowMs = windowHours * 60 * 60 * 1000;
  
  return gaps.filter(gap => {
    const gapTime = gap.startTime;
    const timeDiff = Math.abs(gapTime - targetTime);
    return timeDiff <= windowMs;
  });
}

/**
 * Calculate continuity score
 * @param {Array} glucoseReadings - Sorted glucose readings
 * @param {Date} startTime - Period start
 * @param {Date} endTime - Period end
 * @returns {Object} { coveragePercent, missingReadings, totalExpected }
 */
export function calculateContinuity(glucoseReadings, startTime, endTime) {
  const periodMinutes = (endTime - startTime) / 1000 / 60;
  const expectedReadings = Math.floor(periodMinutes / READING_INTERVAL_MINUTES);
  
  const actualReadings = glucoseReadings.filter(r => r.timestamp >= startTime && r.timestamp <= endTime)
    .length;
  
  const coveragePercent = (actualReadings / expectedReadings) * 100;
  const missingReadings = expectedReadings - actualReadings;
  
  return {
    coveragePercent: Math.round(coveragePercent * 10) / 10,
    missingReadings,
    totalExpected: expectedReadings,
    actual: actualReadings
  };
}
