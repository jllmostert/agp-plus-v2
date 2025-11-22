import { useState, useCallback } from 'react';
import { parseCSV, parseCSVMetadata } from '../core/parsers.js';
import { patientStorage } from '../utils/patientStorage.js';

/**
 * useCSVData - Custom hook for CSV data management
 * 
 * Handles CSV parsing, date range extraction, and data state management.
 * Automatically extracts and saves patient metadata from CSV headers.
 * 
 * @returns {Object} CSV data state and handlers
 * @returns {Array|null} csvData - Parsed CSV data array
 * @returns {Object|null} dateRange - { min: Date, max: Date }
 * @returns {Function} loadCSV - Load CSV from text: (text) => void
 * @returns {Function} clearCSV - Clear loaded CSV data
 * @returns {string|null} error - Error message if parsing failed
 * 
 * @version 2.1.2
 */
export function useCSVData() {
  const [csvData, setCsvData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Load and parse CSV text
   */
  const loadCSV = useCallback(async (text) => {
    setError(null);
    
    try {
      // Parse CSV using core parser
      // Returns: {data: Array, section2: Array}
      const parsed = parseCSV(text);
      const data = parsed.data || parsed; // Backwards compatibility with old format
      const section2 = parsed.section2 || []; // Auto insulin data (new in v3.1)
      
      if (data.length === 0) {
        throw new Error('No valid data found in CSV');
      }

      // Extract and save patient metadata if found
      try {
        const metadata = parseCSVMetadata(text);
        if (metadata) {
          const existingInfo = await patientStorage.get();
          
          // Don't update if patient info is locked
          if (existingInfo?.isLocked) {

          } else {
            // Only update if fields are empty
            const updates = {};
            if (metadata.name && !existingInfo?.name) {
              updates.name = metadata.name;
            }
            if (metadata.deviceSerial && !existingInfo?.cgm) {
              // Save device serial as CGM info
              updates.cgm = `MiniMed 780G (SN: ${metadata.deviceSerial})`;
            }
            
            if (Object.keys(updates).length > 0) {
              await patientStorage.update(updates);
            }
          }
        }
      } catch (metadataErr) {
        // Don't fail CSV load if metadata extraction fails
      }

      // Extract date range from data
      const dates = data
        .filter(row => row.date && row.date !== 'Date') // Skip header rows
        .map(row => {
          const [year, month, day] = row.date.split('/');
          const dateObj = new Date(year, month - 1, day);
          return dateObj;
        })
        .filter(d => d && !isNaN(d.getTime())); // Filter out invalid dates

      if (dates.length === 0) {
        throw new Error('No valid dates found in CSV data');
      }

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
   * Load already-parsed CSV data (for storage restore)
   */
  const loadParsedData = useCallback((data, dateRange) => {
    setError(null);
    setCsvData(data);
    setDateRange(dateRange);
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
    loadParsedData,
    clearCSV,
    error,
  };
}
