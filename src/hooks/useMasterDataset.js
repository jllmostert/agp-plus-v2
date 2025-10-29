/**
 * useMasterDataset - React Hook for Master Dataset
 * 
 * Provides access to the master glucose dataset with filtering capabilities.
 * Handles loading, caching, and date range filtering.
 * 
 * @param {Object} options - Hook options
 * @param {Date} options.startDate - Filter start date (optional)
 * @param {Date} options.endDate - Filter end date (optional)
 * @returns {Object} { readings, stats, isLoading, error, setDateRange, refresh }
 * 
 * @example
 * const { readings, stats, isLoading } = useMasterDataset({
 *   startDate: new Date('2025-07-01'),
 *   endDate: new Date('2025-10-25')
 * });
 */

import { useState, useEffect, useCallback } from 'react';
import { loadOrRebuildCache, getMasterDatasetStats } from '../storage/masterDatasetStorage.js';

/**
 * Format timestamp to YYYY/MM/DD string
 * @param {Date|number} timestamp - Date object or Unix timestamp
 * @returns {string} "YYYY/MM/DD"
 */
function formatDate(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * Format timestamp to HH:MM:SS string
 * @param {Date|number} timestamp - Date object or Unix timestamp
 * @returns {string} "HH:MM:SS"
 */
function formatTime(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function useMasterDataset(options = {}) {
  const [readings, setReadings] = useState([]);
  const [allReadings, setAllReadings] = useState([]); // NEW: Unfiltered dataset for comparison
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: options.startDate || null,
    end: options.endDate || null
  });
  const [loadTrigger, setLoadTrigger] = useState(0); // Force reload trigger

  /**
   * Load and filter master dataset
   * Auto-loads last 14 days on initial mount for instant rendering
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load cached dataset
      const cache = await loadOrRebuildCache();
      
      // Initialize events from master dataset if not already present
      try {
        const { initEventsFromMasterDataset } = await import('../storage/masterDatasetStorage');
        await initEventsFromMasterDataset();
      } catch (err) {
      }
      
      // AUTO-LOAD LAST 14 DAYS: If no date range specified, default to last 14 days
      // This ensures instant data availability on app startup
      if (!dateRange.start && !dateRange.end && cache.allReadings.length > 0) {
        const latest = cache.dateRange.max;
        const cutoff14Days = new Date(latest);
        cutoff14Days.setDate(cutoff14Days.getDate() - 14);
        
        // Set date range to last 14 days (will be used in filtering below)
        const autoDateRange = {
          start: cutoff14Days,
          end: latest
        };
        
        // Update state to reflect auto-loaded range
        setDateRange(autoDateRange);
        
        
        // Continue with this auto-range (will be applied in filtering below)
        dateRange.start = cutoff14Days;
        dateRange.end = latest;
      }
      
      // Get dataset stats
      const datasetStats = await getMasterDatasetStats();
      
      // Load ProTime workdays from settings
      let workdaySet = null;
      try {
        const { loadProTimeData } = await import('../storage/masterDatasetStorage');
        workdaySet = await loadProTimeData();
        if (workdaySet) {
        }
      } catch (err) {
      }
      
      setStats({
        ...datasetStats,
        workdays: workdaySet  // Add workdays to stats
      });

      // Apply date range filter if specified
      let filteredReadings = cache.allReadings;
      
      if (dateRange.start || dateRange.end) {
        // DEBUG: Log date range for custom range debugging
        
        filteredReadings = filteredReadings.filter(reading => {
          const timestamp = reading.timestamp;
          
          // Safety: Check if start/end are Date objects
          if (dateRange.start) {
            const startTime = dateRange.start instanceof Date 
              ? dateRange.start.getTime() 
              : new Date(dateRange.start).getTime();
            
            if (timestamp < startTime) {
              return false;
            }
          }
          
          if (dateRange.end) {
            const endTime = dateRange.end instanceof Date 
              ? dateRange.end.getTime() 
              : new Date(dateRange.end).getTime();
            
            if (timestamp > endTime) {
              return false;
            }
          }
          
          return true;
        });
        
      }

      // Transform V3 format → V2 CSV format for backwards compatibility
      // This allows existing engines (metrics-engine.js, etc.) to work unchanged
      const normalizedReadings = filteredReadings
        .filter(reading => {
          // Safety: Only include readings with valid timestamp and glucose
          if (!reading.timestamp || reading.glucose == null) {
            return false;
          }
          return true;
        })
        .map(reading => ({
          // V2 CSV format (what engines expect) - LOWERCASE properties!
          date: formatDate(reading.timestamp),
          time: formatTime(reading.timestamp),
          sg: reading.glucose,
          glucose: reading.glucose,  // Both sg and glucose for compatibility
          
          // Event detection fields (needed for day profiles)
          bolus: reading.bolus || 0,
          bg: reading.bg || null,
          carbs: reading.carbs || 0,
          rewind: reading.rewind || false,
          
          // Keep V3 original for future use (optional)
          _v3Original: reading
        }));

      setReadings(normalizedReadings);
      
      // Debug: Log sample reading to verify fields
      if (normalizedReadings.length > 0) {
      }
      
      // ALSO store unfiltered readings (for comparison calculations)
      const allNormalizedReadings = cache.allReadings
        .filter(reading => reading.timestamp && reading.glucose != null)
        .map(reading => ({
          date: formatDate(reading.timestamp),
          time: formatTime(reading.timestamp),
          sg: reading.glucose,
          glucose: reading.glucose,
          
          // Event detection fields (needed for day profiles)
          bolus: reading.bolus || 0,
          bg: reading.bg || null,
          carbs: reading.carbs || 0,
          rewind: reading.rewind || false,
          
          _v3Original: reading
        }));
      
      setAllReadings(allNormalizedReadings);
      
    } catch (err) {
      console.error('[useMasterDataset] Load failed:', err);
      setError(err.message);
      setReadings([]);
      setAllReadings([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  /**
   * Update date range filter
   */
  const updateDateRange = useCallback((startDate, endDate) => {
    setDateRange({
      start: startDate,
      end: endDate
    });
  }, []);

  /**
   * Force refresh from storage
   */
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Load data on mount and when date range changes
  useEffect(() => {
    loadData();
  }, [loadData, loadTrigger]);

  return {
    readings,           // Filtered readings (respects date range)
    allReadings,        // Unfiltered readings (full dataset for comparison)
    stats,
    isLoading,
    error,
    setDateRange: updateDateRange,
    refresh
  };
}