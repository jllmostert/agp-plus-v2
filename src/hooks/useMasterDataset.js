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

export function useMasterDataset(options = {}) {
  const [readings, setReadings] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: options.startDate || null,
    end: options.endDate || null
  });

  /**
   * Load and filter master dataset
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load cached dataset
      const cache = await loadOrRebuildCache();
      
      // Get dataset stats
      const datasetStats = await getMasterDatasetStats();
      setStats(datasetStats);

      // Apply date range filter if specified
      let filteredReadings = cache.allReadings;
      
      if (dateRange.start || dateRange.end) {
        filteredReadings = filteredReadings.filter(reading => {
          const timestamp = reading.timestamp;
          
          if (dateRange.start && timestamp < dateRange.start.getTime()) {
            return false;
          }
          
          if (dateRange.end && timestamp > dateRange.end.getTime()) {
            return false;
          }
          
          return true;
        });
      }

      setReadings(filteredReadings);
      
    } catch (err) {
      console.error('[useMasterDataset] Load failed:', err);
      setError(err.message);
      setReadings([]);
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
  }, [loadData]);

  return {
    readings,
    stats,
    isLoading,
    error,
    setDateRange: updateDateRange,
    refresh
  };
}