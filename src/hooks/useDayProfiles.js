import { useMemo, useEffect, useState } from 'react';
import { getLastSevenDays } from '../core/day-profile-engine.js';

/**
 * useDayProfiles - Custom hook for individual day profile generation
 * 
 * Generates the last 7 complete days of glucose data with metrics, events,
 * and achievement badges. Includes AGP curve overlay for comparison.
 * 
 * ðŸ†• v3.1: Now includes TDD (Total Daily Dose) data per day
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
 * - tdd: TDD data {tdd, autoInsulin, mealBolus, autoPercent, mealPercent} âœ¨ NEW in v3.1
 * 
 * @version 3.1.0
 * @since 2024-10-25 - Extracted from AGPGenerator component
 * @since 2025-10-28 - Added TDD data integration (v3.1 Phase 0)
 */
export function useDayProfiles(csvData, dateRange, currentMetrics) {
  // State for TDD data (loaded async from IndexedDB)
  const [tddData, setTddData] = useState(null);
  
  // Load TDD data on mount and when dependencies change
  useEffect(() => {
    async function loadTDD() {
      try {
        const { loadTDDData } = await import('../storage/masterDatasetStorage.js');
        const data = await loadTDDData();
        
        if (data && data.tddByDay) {
          setTddData(data.tddByDay);
        } else {
          setTddData(null);
        }
      } catch (err) {
        console.warn('[useDayProfiles] Failed to load TDD data:', err);
        setTddData(null);
      }
    }
    
    loadTDD();
  }, [csvData, dateRange]); // Reload when data changes
  
  return useMemo(() => {
    // Guard: require all dependencies with proper structure
    if (!csvData || csvData.length === 0) {
      return null;
    }

    if (!dateRange || !dateRange.max) {
      return null;
    }

    try {
      // Format CSV creation date (last available date = cutoff for "complete" days)
      // V3: dateRange.max is already a Date object
      // V2: dateRange.max might be a string
      const maxDate = dateRange.max instanceof Date ? dateRange.max : new Date(dateRange.max);
      
      // Additional guard: validate maxDate is valid
      if (isNaN(maxDate.getTime())) {
        return null;
      }
      
      const csvCreatedDate = formatDateString(maxDate);
      
      // Generate last 7 day profiles (NO completeness requirement in V3)
      const profiles = getLastSevenDays(csvData, csvCreatedDate);
      
      if (!profiles || profiles.length === 0) {
        return null;
      }
      
      // Enrich profiles with current analysis period data for comparison
      const overallMean = currentMetrics?.metrics?.mean || null;
      const agpCurve = currentMetrics?.agp || null;
      
      // Add AGP overlay data AND TDD data to each profile
      const enrichedProfiles = profiles.map(profile => {
        // Get TDD for this specific day
        const dayTDD = tddData && tddData[profile.date] ? tddData[profile.date] : null;
        
        return {
          ...profile,
          overallMean,
          agpCurve,
          tdd: dayTDD // âœ¨ NEW: Per-day TDD data
        };
      });
      
      return enrichedProfiles;
      
    } catch (err) {
      console.error('[useDayProfiles] Failed to generate day profiles:', err);
      return null;
    }
  }, [csvData, dateRange, currentMetrics, tddData]); // Added tddData dependency
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
