import { useMemo } from 'react';
import { getLastSevenDays } from '../core/day-profile-engine.js';

/**
 * useDayProfiles - Custom hook for individual day profile generation
 * 
 * Generates the last 7 complete days of glucose data with metrics, events,
 * and achievement badges. Includes AGP curve overlay for comparison.
 * 
 * This hook extracts business logic that was previously in AGPGenerator's
 * handleDayProfilesOpen function, maintaining proper separation of concerns.
 * 
 * @param {Array} csvData - Parsed CSV glucose data
 * @param {Object} dateRange - { min: Date, max: Date } from CSV
 * @param {Object} currentMetrics - Current period metrics from useMetrics
 * 
 * @returns {Array|null} Array of 7 day profile objects, or null if no data
 * 
 * Each profile object contains:
 * - date: "YYYY/MM/DD"
 * - dayOfWeek: "Monday", "Tuesday", etc.
 * - metrics: { tir, tar, tbr, mean, sd, cv, gmi }
 * - curve: Array of 288 5-minute bins with glucose values
 * - events: { hypoL1, hypoL2, hyper } with counts and details
 * - sensorChanges: Array of sensor change markers
 * - cartridgeChanges: Array of cartridge change markers
 * - badges: Array of achievement badges earned
 * - overallMean: Mean glucose from current analysis period (for reference line)
 * - agpCurve: AGP percentile data (for overlay comparison)
 * 
 * @version 2.2.1
 * @since 2024-10-25 - Extracted from AGPGenerator component
 */
export function useDayProfiles(csvData, dateRange, currentMetrics) {
  return useMemo(() => {
    // Guard: require all dependencies
    if (!csvData || !dateRange) {
      return null;
    }

    try {
      // Format CSV creation date (last available date = cutoff for "complete" days)
      const maxDate = new Date(dateRange.max);
      const csvCreatedDate = formatDateString(maxDate);
      
      // Generate last 7 complete day profiles
      // This calls the engine which does all the heavy lifting:
      // - Filters to last 7 days before CSV creation
      // - Generates 24h curves (288 bins)
      // - Calculates per-day metrics
      // - Detects events (hypo/hyper)
      // - Marks sensor/cartridge changes
      // - Awards achievement badges
      const profiles = getLastSevenDays(csvData, csvCreatedDate);
      
      if (!profiles || profiles.length === 0) {
        return null;
      }
      
      // Enrich profiles with current analysis period data for comparison
      const overallMean = currentMetrics?.metrics?.mean || null;
      const agpCurve = currentMetrics?.agp || null;
      
      // Add AGP overlay data to each profile
      // This allows day profiles to show:
      // 1. Individual day glucose curve
      // 2. Overall AGP median (for comparison)
      // 3. Overall mean glucose line
      const enrichedProfiles = profiles.map(profile => ({
        ...profile,
        overallMean,
        agpCurve
      }));
      
      return enrichedProfiles;
      
    } catch (err) {
      console.error('[useDayProfiles] Failed to generate day profiles:', err);
      return null;
    }
  }, [csvData, dateRange, currentMetrics]);
}

/**
 * Format Date object to YYYY/MM/DD string
 * @private
 */
function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
