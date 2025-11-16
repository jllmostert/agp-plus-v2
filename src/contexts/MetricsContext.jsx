import React, { createContext, useContext, useMemo } from 'react';
import { useMetrics } from '../hooks/useMetrics';
import { useComparison } from '../hooks/useComparison';
import { useDayProfiles } from '../hooks/useDayProfiles';
import { calculateTDDStatistics } from '../core/insulin-engine.js';
import { useData } from '../hooks/useData';
import { usePeriod } from '../hooks/usePeriod';

const MetricsContext = createContext(null);

/**
 * MetricsProvider - Centralized metrics calculation context
 * 
 * Extracts all metrics calculation logic from AGPGenerator into a dedicated context.
 * Calculates and provides:
 * - metricsResult (from useMetrics hook)
 * - comparisonData (from useComparison hook)
 * - dayProfiles (from useDayProfiles hook)
 * - tddData (period-specific TDD statistics)
 * 
 * This context depends on:
 * - DataContext (for activeReadings, comparisonReadings, fullDatasetRange, tddByDay)
 * - PeriodContext (for startDate, endDate, safeDateRange)
 * 
 * @param {React.ReactNode} children - Child components
 * @param {Set|null} workdays - Optional set of workday date strings (from parent state)
 * @param {number} numDaysProfile - Number of days for day profiles (default: 7)
 * 
 * @version 1.1.0
 * @since 2025-11-15 - Phase 3 of Context API refactoring
 */
export function MetricsProvider({ 
  children,
  workdays = null,
  numDaysProfile = 7 
}) {
  // Get data from contexts
  const { tddByDay, activeReadings, comparisonReadings, fullDatasetRange, dateRange } = useData();
  const { startDate, endDate } = usePeriod();
  
  // Calculate metrics for current period using activeReadings
  const metricsResult = useMetrics(activeReadings, startDate, endDate, workdays);
  
  // Calculate TDD statistics for selected period (not entire dataset)
  const tddData = useMemo(() => {
    if (!tddByDay || !startDate || !endDate) {
      return null;
    }
    
    try {
      // Format dates to YYYY/MM/DD for matching with tddByDay keys
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
      };
      
      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);
      
      // Filter tddByDay to only include dates within selected period
      const periodTddByDay = Object.fromEntries(
        Object.entries(tddByDay).filter(([date, _]) => date >= startStr && date <= endStr)
      );
      
      if (Object.keys(periodTddByDay).length === 0) {
        return null;
      }
      
      // Calculate statistics for the filtered period
      return calculateTDDStatistics(periodTddByDay);
    } catch (err) {
      console.error('[MetricsContext] Failed to calculate period TDD:', err);
      return null;
    }
  }, [tddByDay, startDate, endDate]);
  
  // Auto-calculate comparison for preset periods
  // CRITICAL: Use comparisonReadings (full dataset) not activeReadings (filtered)
  // This ensures previous period data is available for comparison calculations
  const comparisonData = useComparison(comparisonReadings, startDate, endDate, fullDatasetRange);
  
  // Generate day profiles using custom hook
  // Uses activeReadings (filtered to period) for accurate per-day metrics
  // V3: Use fullDatasetRange (contains entire dataset min/max)
  // V2: Use dateRange (legacy CSV range)
  const dayProfiles = useDayProfiles(activeReadings, fullDatasetRange || dateRange, metricsResult, numDaysProfile);
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    metricsResult,
    comparisonData,
    dayProfiles,
    tddData
  }), [metricsResult, comparisonData, dayProfiles, tddData]);
  
  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
}

/**
 * useMetricsContext - Hook to consume metrics context
 * 
 * Provides access to all calculated metrics:
 * - metricsResult: Main glucose metrics (TIR, CV, etc.)
 * - comparisonData: Previous period comparison (if applicable)
 * - dayProfiles: Individual day profiles array
 * - tddData: Total Daily Dose statistics
 * 
 * @returns {Object} Metrics context value
 * @throws {Error} If used outside MetricsProvider
 */
export function useMetricsContext() {
  const context = useContext(MetricsContext);
  
  if (!context) {
    throw new Error('useMetricsContext must be used within a MetricsProvider');
  }
  
  return context;
}

export default MetricsContext;
