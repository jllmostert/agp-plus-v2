import { useMemo } from 'react';
import { calculateMetrics, calculateAGP, detectEvents } from '../core/metrics-engine.js';

/**
 * useMetrics - Custom hook for glucose metrics calculation
 * 
 * Wraps core calculation functions with React memoization for performance.
 * Only recalculates when dependencies change.
 * 
 * @param {Array} csvData - Parsed CSV data
 * @param {Date} startDate - Analysis period start
 * @param {Date} endDate - Analysis period end
 * @param {Set|null} workdays - Set of workday date strings (optional)
 * 
 * @returns {Object|null} Calculated metrics and AGP data
 * @returns {Object} metrics - Clinical metrics (TIR, CV, etc.)
 * @returns {Array} agp - AGP percentile data (288 bins)
 * @returns {Object} events - Detected hypo/hyper events
 * @returns {Object|null} dayMetrics - Day period metrics (06:00-00:00)
 * @returns {Object|null} nightMetrics - Night period metrics (00:00-06:00)
 * @returns {Object|null} workdayMetrics - Workday metrics (if workdays provided)
 * @returns {Object|null} restdayMetrics - Rest day metrics (if workdays provided)
 * 
 * @version 2.1.0
 */
export function useMetrics(csvData, startDate, endDate, workdays = null) {
  return useMemo(() => {
    if (!csvData || !startDate || !endDate) {
      return null;
    }

    try {
      // Calculate main metrics
      const metrics = calculateMetrics(csvData, startDate, endDate);
      
      // Calculate AGP percentiles
      const agp = calculateAGP(csvData, startDate, endDate);
      
      // Detect events
      const events = detectEvents(csvData, startDate, endDate);

      // Calculate day/night split metrics
      const dayMetrics = calculateMetrics(csvData, startDate, endDate, { 
        timeFilter: 'day' 
      });
      const nightMetrics = calculateMetrics(csvData, startDate, endDate, { 
        timeFilter: 'night' 
      });

      // Calculate workday/restday split metrics (if workdays provided)
      let workdayMetrics = null;
      let restdayMetrics = null;
      
      if (workdays && workdays.size > 0) {
        workdayMetrics = calculateMetrics(csvData, startDate, endDate, { 
          workdays 
        });
        restdayMetrics = calculateMetrics(csvData, startDate, endDate, { 
          workdays, 
          invert: true 
        });
      }

      return {
        metrics,
        agp,
        events,
        dayMetrics,
        nightMetrics,
        workdayMetrics,
        restdayMetrics,
      };

    } catch (err) {
      console.error('Metrics calculation failed:', err);
      return null;
    }
  }, [csvData, startDate, endDate, workdays]);
}
