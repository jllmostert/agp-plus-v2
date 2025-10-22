import { useMemo } from 'react';
import { calculateMetrics, calculateAGP, detectEvents } from '../core/metrics-engine.js';

/**
 * Convert Date object to YYYY/MM/DD string format
 */
const formatDateForMetrics = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

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
      // Convert Date objects to string format expected by metrics engine
      const startStr = formatDateForMetrics(startDate);
      const endStr = formatDateForMetrics(endDate);

      // Calculate main metrics
      const metrics = calculateMetrics(csvData, startStr, endStr);
      
      // Calculate AGP percentiles
      const agp = calculateAGP(csvData, startStr, endStr);
      
      // Detect events
      const events = detectEvents(csvData, startStr, endStr);

      // Calculate day/night split metrics
      const dayMetrics = calculateMetrics(csvData, startStr, endStr, null, { 
        type: 'day_night',
        value: 'day' 
      });
      const nightMetrics = calculateMetrics(csvData, startStr, endStr, null, { 
        type: 'day_night',
        value: 'night' 
      });

      // Calculate workday/restday split metrics (if workdays provided)
      let workdayMetrics = null;
      let restdayMetrics = null;
      
      if (workdays && workdays.size > 0) {
        workdayMetrics = calculateMetrics(csvData, startStr, endStr, workdays, null);
        
        // For restdays, we need to filter OUT the workdays
        // Create inverted set
        const allDates = new Set(csvData.map(row => row.date));
        const restdays = new Set([...allDates].filter(date => !workdays.has(date)));
        restdayMetrics = calculateMetrics(csvData, startStr, endStr, restdays, null);
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
