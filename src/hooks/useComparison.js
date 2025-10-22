import { useState, useEffect } from 'react';
import { calculateMetrics, calculateAGP } from '../core/metrics-engine.js';
import { CONFIG } from '../core/metrics-engine.js';

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
      setComparisonData(null);
      return;
    }

    try {
      // Calculate current period length in days
      const currentPeriodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      // Only auto-compare for preset periods (14, 30, 90 days)
      const isPresetPeriod = [14, 30, 90].includes(currentPeriodDays);
      
      if (!isPresetPeriod) {
        setComparisonData(null);
        return;
      }

      // Calculate previous period dates
      const prevEnd = new Date(startDate);
      prevEnd.setDate(prevEnd.getDate() - 1); // Day before current start
      
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - currentPeriodDays + 1);

      // Check if previous period has sufficient data
      if (prevStart < dateRange.min) {
        // Not enough historical data
        setComparisonData(null);
        return;
      }

      // Calculate metrics for previous period
      const comparison = calculateMetrics(csvData, prevStart, prevEnd);
      const comparisonAGP = calculateAGP(csvData, prevStart, prevEnd);

      // Verify we have valid data
      if (!comparison || !comparisonAGP || comparison.readingCount < 100) {
        setComparisonData(null);
        return;
      }

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
  const isPresetPeriod = [14, 30, 90].includes(currentPeriodDays);
  
  if (!isPresetPeriod) {
    return false;
  }

  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - currentPeriodDays + 1);

  return prevStart >= dateRange.min;
}
