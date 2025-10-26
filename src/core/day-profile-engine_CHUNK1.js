/**
 * ARTIFACT-XX: Day Profile Engine
 * Extract individual day profiles with metrics, events, and badges
 * 
 * Exports:
 * - getLastSevenDays: Get last 7 complete days with full analysis
 * - getDayProfile: Get single day profile
 * - detectBadges: Detect achievement badges for a day
 * 
 * V3.6: Integrated with sensor database for accurate sensor change markers
 */

import { CONFIG, utils, calculateMetrics, detectEvents } from './metrics-engine.js';
import { getSensorAtDate } from '../storage/sensorStorage.js';

// Note: This file will be split into chunks for editing
// CHUNK 1 OF 3 - Lines 1-120

/**
 * Get the last 7 days from the dataset
 * @param {Array} data - Full glucose data array
 * @param {string} csvCreatedDate - CSV creation date (YYYY/MM/DD) - optional, for backward compat
 * @returns {Promise<Array>} Array of up to 7 day profile objects (newest first)
 * 
 * V3 Note: Now returns last 7 days regardless of completeness.
 * This allows day profiles to work with filtered datasets (e.g., "Last 14D" filter).
 * V3.6 Note: Now async to support sensor database lookups
 */
export async function getLastSevenDays(data, csvCreatedDate) {
  if (!data || data.length === 0) return [];
  
  // Find all unique days in the dataset
  const allDays = new Set();
  data.forEach(row => {
    if (row.date) {
      allDays.add(row.date);
    }
  });
  
  // Sort dates (newest first) and take last 7
  const sortedDates = Array.from(allDays).sort().reverse().slice(0, 7);
  
  // Generate profile for each day (await because getDayProfile is now async)
  const profiles = [];
  for (const date of sortedDates) {
    const profile = await getDayProfile(data, date);
    if (profile !== null) {
      profiles.push(profile);
    }
  }
  
  return profiles;
}

/**
 * Generate single day profile with full analysis
 * 
 * COMPONENTS:
 * - Metrics: TIR, TAR, TBR, mean, SD, CV, GMI
 * - Curve: 24-hour glucose profile (288 bins, 5-min intervals)
 * - Events: Hypo L1/L2, Hyperglycemia
 * - Sensor changes: Database → Alerts → Gap detection (3-tier system)
 * - Cartridge changes: Rewind events
 * - Badges: Achievement detection
 * 
 * @param {Array} data - Full glucose dataset
 * @param {string} date - Date to analyze (YYYY/MM/DD format)
 * @returns {Promise<Object>} Day profile with metrics, curve, events, badges
 */
export async function getDayProfile(data, date) {
  // Filter data for this day
  const dayData = data.filter(row => row.date === date);
  
  if (dayData.length === 0) return null;
  
  // Calculate metrics
  const metrics = calculateMetrics(data, date, date);
  
  // Detect events
  const events = detectEvents(data, date, date);
  
  // Generate 24-hour glucose curve (288 bins, 5-min intervals)
  const curve = generate24HourCurve(dayData);
  
  // Detect sensor changes (3-tier: database → alerts → gaps)
  const sensorChanges = await detectSensorChanges(data, date);
  
  // Detect cartridge/reservoir changes (Rewind events)
  const cartridgeChanges = detectCartridgeChanges(dayData);
  
  // Detect badges
  const badges = detectBadges(metrics, events);
  
  // Parse date for display
  const dateObj = utils.parseDate(date, '00:00:00');
  
  // Debug logging for events
  console.log('[day-profile-engine] Profile for', date, ':', {
    sensorChanges: sensorChanges?.length || 0,
    cartridgeChanges: cartridgeChanges?.length || 0,
    totalReadings: dayData.length,
    sampleReading: dayData[0]
  });
  
  return {
    date,
    dateObj,
    dayOfWeek: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'][dateObj.getDay()],
    metrics,
    curve,
    events,
    sensorChanges,
    cartridgeChanges,
    badges,
    readingCount: dayData.length
  };
}

/**
 * Generate 24-hour glucose curve binned into 5-minute intervals
 * 
 * @param {Array} dayData - Pre-filtered glucose readings for single day
 * @returns {Array} Array of 288 bin objects with {bin, time, glucose, hasData}
 */
function generate24HourCurve(dayData) {
  const curve = Array(288).fill(null).map((_, i) => ({
    bin: i,
    time: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
    glucose: null,
    hasData: false
  }));
  
  dayData.forEach(row => {
    const dt = utils.parseDate(row.date, row.time);
    const minuteOfDay = dt.getHours() * 60 + dt.getMinutes();
    const binIdx = Math.floor(minuteOfDay / 5);
    
    if (binIdx >= 0 && binIdx < 288) {
      curve[binIdx].glucose = row.glucose;
      curve[binIdx].hasData = true;
    }
  });
  
  return curve;
}
