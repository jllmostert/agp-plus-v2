import { useMemo, useEffect, useState } from 'react';
import { getLastSevenDays } from '../core/day-profile-engine.js';

/**
 * useDayProfiles - Custom hook for individual day profile generation
 * 
 * Generates the last N complete days of glucose data with metrics, events,
 * and achievement badges. Includes AGP curve overlay for comparison.
 * 
 * ðŸ†• v3.1: Now includes TDD (Total Daily Dose) data per day
 * ðŸ†• v4.2.2: Configurable number of days (7 or 14)
 * 
 * This hook extracts business logic that was previously in AGPGenerator's
 * handleDayProfilesOpen function, maintaining proper separation of concerns.
 * 
 * @param {Array} csvData - Parsed CSV glucose data
 * @param {Object} dateRange - { min: Date, max: Date } from CSV
 * @param {Object} currentMetrics - Current period metrics from useMetrics
 * @param {number} numDays - Number of days to show (default: 7)
 * 
 * @returns {Array|null} Array of N day profile objects, or null if no data
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
 * @version 4.2.2
 * @since 2024-10-25 - Extracted from AGPGenerator component
 * @since 2025-10-28 - Added TDD data integration (v3.1 Phase 0)
 * @since 2025-11-14 - Added configurable number of days (v4.2.2)
 */
export function useDayProfiles(csvData, dateRange, currentMetrics, numDays = 7) {
  // State for TDD data (loaded async from IndexedDB)
  const [tddData, setTddData] = useState(null);
  
  // State for workday data (loaded async from IndexedDB)
  const [workdaySet, setWorkdaySet] = useState(null);
  
  // State for sensors (loaded async from IndexedDB)
  const [sensors, setSensors] = useState([]);
  
  // State for day profiles (computed async)
  const [dayProfiles, setDayProfiles] = useState(null);
  
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
        setTddData(null);
      }
    }
    
    loadTDD();
  }, [csvData, dateRange]); // Reload when data changes
  
  // Load sensors on mount
  useEffect(() => {
    async function loadSensors() {
      try {
        const { getAllSensors } = await import('../storage/sensorStorage');
        const loadedSensors = await getAllSensors();
        setSensors(loadedSensors || []);
      } catch (err) {
        console.error('[useDayProfiles] Failed to load sensors:', err);
        setSensors([]);
      }
    }
    
    loadSensors();
  }, []);
  
  // Load ProTime workday data on mount and when dependencies change
  useEffect(() => {
    async function loadWorkdays() {
      try {
        const { loadProTimeData } = await import('../storage/masterDatasetStorage.js');
        const workdays = await loadProTimeData();
        setWorkdaySet(workdays); // Can be null or Set
      } catch (err) {
        setWorkdaySet(null);
      }
    }
    
    loadWorkdays();
  }, [csvData, dateRange]); // Reload when data changes
  
  // Generate day profiles (async operation)
  useEffect(() => {
    async function generateProfiles() {
      // Guard: require all dependencies with proper structure
      if (!csvData || csvData.length === 0) {
        setDayProfiles(null);
        return;
      }

      if (!dateRange || !dateRange.max) {
        setDayProfiles(null);
        return;
      }
      
      // Wait for sensors to load before generating profiles
      if (!sensors) {
        setDayProfiles(null);
        return;
      }

      try {
        // Format CSV creation date (last available date = cutoff for "complete" days)
        // V3: dateRange.max is already a Date object
        // V2: dateRange.max might be a string
        const maxDate = dateRange.max instanceof Date ? dateRange.max : new Date(dateRange.max);
        
        // Additional guard: validate maxDate is valid
        if (isNaN(maxDate.getTime())) {
          setDayProfiles(null);
          return;
        }
        
        const csvCreatedDate = formatDateString(maxDate);
        
        // âœ¨ ASYNC CALL - now properly awaited
        const profiles = await getLastSevenDays(csvData, csvCreatedDate, sensors, numDays);
        
        if (!profiles || profiles.length === 0) {
          setDayProfiles(null);
          return;
        }
        
        // Enrich profiles with current analysis period data for comparison
        const overallMean = currentMetrics?.metrics?.mean || null;
        const agpCurve = currentMetrics?.agp || null;
        
        // Add AGP overlay data, TDD data, AND workday info to each profile
        const enrichedProfiles = profiles.map(profile => {
          // Get TDD for this specific day
          const dayTDD = tddData && tddData[profile.date] ? tddData[profile.date] : null;
          
          // Check if this day is a workday (ProTime data)
          // workdaySet is a Set of "YYYY/MM/DD" strings
          const isWorkday = workdaySet ? workdaySet.has(profile.date) : null;
          
          return {
            ...profile,
            overallMean,
            agpCurve,
            tdd: dayTDD, // âœ¨ Per-day TDD data
            isWorkday // âœ¨ NEW: Workday indicator (null if no ProTime data)
          };
        });
        
        setDayProfiles(enrichedProfiles);
        
      } catch (err) {
        console.error('[useDayProfiles] Failed to generate day profiles:', err);
        setDayProfiles(null);
      }
    }
    
    generateProfiles();
  }, [csvData, dateRange, currentMetrics, tddData, workdaySet, sensors, numDays]); // Re-run when any dependency changes
  
  return dayProfiles;
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
