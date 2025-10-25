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
    // Early exit if any required data is missing
    if (!csvData || csvData.length === 0 || !startDate || !endDate || !dateRange) {
      console.log('[useComparison] NULL because:', {
        csvData: csvData ? `${csvData.length} readings` : 'null',
        startDate: startDate ? startDate.toISOString() : 'null',
        endDate: endDate ? endDate.toISOString() : 'null',
        dateRange: dateRange ? `${dateRange.min?.toISOString?.()}-${dateRange.max?.toISOString?.()}` : 'null'
      });
      setComparisonData(null);
      return;
    }

    try {
      // Calculate current period length in CALENDAR DAYS (timezone-safe)
      // Use date-only comparison to avoid DST issues
      const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const currentPeriodDays = Math.round((endDay - startDay) / (1000 * 60 * 60 * 24)) + 1;

      console.log('[useComparison] Current period:', {
        days: currentPeriodDays,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        startDay: startDay.toDateString(),
        endDay: endDay.toDateString()
      });

      // Only auto-compare for 14 and 30 day periods (not 90 days - too long)
      const isPresetPeriod = [14, 30].includes(currentPeriodDays);
      
      if (!isPresetPeriod) {
        console.log('[useComparison] Not preset period:', currentPeriodDays);
        setComparisonData(null);
        return;
      }

      // Calculate previous period dates
      const prevEnd = new Date(startDate);
      prevEnd.setDate(prevEnd.getDate() - 1); // Day before current start
      
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - currentPeriodDays + 1);

      console.log('[useComparison] Previous period:', {
        start: prevStart.toISOString(),
        end: prevEnd.toISOString(),
        dateRangeMin: dateRange.min?.toISOString?.() || dateRange.min
      });

      // Ensure dateRange.min is a Date object (might be string from V3)
      const datasetMinDate = dateRange.min instanceof Date 
        ? dateRange.min 
        : new Date(dateRange.min);

      // Check if previous period has sufficient data
      if (prevStart < datasetMinDate) {
        console.log('[useComparison] Insufficient history:', {
          prevStart: prevStart.toISOString(),
          datasetMin: datasetMinDate.toISOString()
        });
        setComparisonData(null);
        return;
      }

      // Calculate metrics for previous period
      const prevStartStr = formatDateForMetrics(prevStart);
      const prevEndStr = formatDateForMetrics(prevEnd);
      
      console.log('[useComparison] Calculating metrics for:', {
        prevStartStr,
        prevEndStr,
        dataLength: csvData.length
      });
      
      const comparison = calculateMetrics(csvData, prevStartStr, prevEndStr);
      const comparisonAGP = calculateAGP(csvData, prevStartStr, prevEndStr);

      console.log('[useComparison] Calculation results:', {
        comparison: comparison ? `readingCount=${comparison.readingCount}` : 'NULL',
        comparisonAGP: comparisonAGP ? `${comparisonAGP.length} points` : 'NULL'
      });

      // Verify we have valid data
      if (!comparison || !comparisonAGP || comparison.readingCount < 100) {
        console.log('[useComparison] Insufficient data for comparison:', {
          hasComparison: !!comparison,
          hasAGP: !!comparisonAGP,
          readingCount: comparison?.readingCount || 0,
          minRequired: 100
        });
        setComparisonData(null);
        return;
      }

      console.log('[useComparison] ✅ Comparison data generated successfully:', {
        readingCount: comparison.readingCount,
        tir: comparison.tir,
        agpPoints: comparisonAGP.length
      });

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
  }, [
    csvData, 
    csvData?.length, 
    startDate, 
    endDate, 
    dateRange,
    dateRange?.min,
    dateRange?.max
  ]);

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

  // Ensure dateRange.min is a Date object
  const datasetMinDate = dateRange.min instanceof Date 
    ? dateRange.min 
    : new Date(dateRange.min);

  return prevStart >= datasetMinDate;
}
