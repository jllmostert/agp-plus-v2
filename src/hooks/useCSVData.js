import { useState, useCallback } from 'react';
import { parseCSV } from '../core/parsers.js';

/**
 * useCSVData - Custom hook for CSV data management
 * 
 * Handles CSV parsing, date range extraction, and data state management.
 * 
 * @returns {Object} CSV data state and handlers
 * @returns {Array|null} csvData - Parsed CSV data array
 * @returns {Object|null} dateRange - { min: Date, max: Date }
 * @returns {Function} loadCSV - Load CSV from text: (text) => void
 * @returns {Function} clearCSV - Clear loaded CSV data
 * @returns {string|null} error - Error message if parsing failed
 * 
 * @version 2.1.0
 */
export function useCSVData() {
  const [csvData, setCsvData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Load and parse CSV text
   */
  const loadCSV = useCallback((text) => {
    setError(null);
    
    try {
      // Parse CSV using core parser
      const data = parseCSV(text);
      
      if (data.length === 0) {
        throw new Error('No valid data found in CSV');
      }

      // Extract date range from data
      const dates = data.map(row => {
        const [year, month, day] = row.date.split('/');
        return new Date(year, month - 1, day);
      });

      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      // Update state
      setCsvData(data);
      setDateRange({ min: minDate, max: maxDate });
      
    } catch (err) {
      setError(err.message);
      setCsvData(null);
      setDateRange(null);
    }
  }, []);

  /**
   * Clear loaded CSV data
   */
  const clearCSV = useCallback(() => {
    setCsvData(null);
    setDateRange(null);
    setError(null);
  }, []);

  return {
    csvData,
    dateRange,
    loadCSV,
    clearCSV,
    error,
  };
}
