import { useState, useEffect } from 'react';
import { calculateMetrics, calculateAGP } from '../core/metrics-engine.js';
import { CONFIG } from '../core/metrics-engine.js';

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
 * useComparison - Custom hook for period comparison logic
 * 
 * Automatically triggers comparison calculation when:
 * 1. A preset period is selected (14/30/90 days)
 * 2. Sufficient historical data is available
 * 
 * Calculates metrics for the previous period of equal length.
 * 
 * @param {Array} csvData - Parsed CSV data
 * @param {Date} startDate - Current period start
 * @param {Date} endDate - Current period end
 * @param {Object} dateRange - { min: Date, max: Date } available data range
 * 
 * @returns {Object|null} Comparison data or null if not applicable
 * @returns {Object} comparison - Previous period metrics
 * @returns {Array} comparisonAGP - Previous period AGP data
 * @returns {Date} prevStart - Previous period start date
 * @returns {Date} prevEnd - Previous period end date
 * 
 * @version 2.1.0
 */
export function useComparison(csvData, startDate, endDate, dateRange) {
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    if (!csvData || !startDate || !endDate || !dateRange) {
      // Only log if we previously had comparison data (state change from something to nothing)
      if (comparisonData !== null) {
        console.log('useComparison: Clearing comparison data');
      }
      setComparisonData(null);
      return;
    }

    try {
      // Calculate current period length in days
      const currentPeriodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      console.log('useComparison: Current period days:', currentPeriodDays);

      // Only auto-compare for 14 and 30 day periods (not 90 days - too long)
      const isPresetPeriod = [14, 30].includes(currentPeriodDays);
      console.log('useComparison: Is preset period?', isPresetPeriod);
      
      if (!isPresetPeriod) {
        setComparisonData(null);
        return;
      }

      // Calculate previous period dates
      const prevEnd = new Date(startDate);
      prevEnd.setDate(prevEnd.getDate() - 1); // Day before current start
      
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - currentPeriodDays + 1);

      console.log('useComparison: Previous period:', {
        prevStart: prevStart.toISOString(),
        prevEnd: prevEnd.toISOString(),
        dataRangeMin: dateRange.min.toISOString()
      });

      // Check if previous period has sufficient data
      if (prevStart < dateRange.min) {
        console.log('useComparison: Not enough historical data');
        setComparisonData(null);
        return;
      }

      // Calculate metrics for previous period
      const prevStartStr = formatDateForMetrics(prevStart);
      const prevEndStr = formatDateForMetrics(prevEnd);
      console.log('useComparison: Calculating metrics for', prevStartStr, 'to', prevEndStr);
      
      const comparison = calculateMetrics(csvData, prevStartStr, prevEndStr);
      const comparisonAGP = calculateAGP(csvData, prevStartStr, prevEndStr);

      console.log('useComparison: Comparison result', {
        hasComparison: !!comparison,
        hasAGP: !!comparisonAGP,
        readingCount: comparison?.readingCount
      });

      // Verify we have valid data
      if (!comparison || !comparisonAGP || comparison.readingCount < 100) {
        console.log('useComparison: Insufficient comparison data');
        setComparisonData(null);
        return;
      }

      console.log('useComparison: SUCCESS! Setting comparison data');
      setComparisonData({
        comparison,
        comparisonAGP,
        prevStart,
        prevEnd,
      });

    } catch (err) {
      console.error('Comparison calculation failed:', err);
      setComparisonData(null);
    }
  }, [csvData, startDate, endDate, dateRange]);

  return comparisonData;
}

/**
 * Helper function to check if comparison is available
 * (Can be used for UI logic without triggering calculation)
 */
export function canCompare(startDate, endDate, dateRange) {
  if (!startDate || !endDate || !dateRange) {
    return false;
  }

  const currentPeriodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const isPresetPeriod = [14, 30].includes(currentPeriodDays);
  
  if (!isPresetPeriod) {
    return false;
  }

  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - currentPeriodDays + 1);

  return prevStart >= dateRange.min;
}
