/**
 * ARTIFACT-02: Data Parsers
 * CSV and ProTime data parsing utilities
 * 
 * Exports:
 * - parseCSV: Parse Medtronic CareLink CSV export
 * - parseProTime: Parse ProTime workday data (PDF text or JSON)
 * - exportProTimeJSON: Export workday data to JSON file
 */

import { CONFIG, utils } from './metrics-engine.js';

/**
 * Parse Medtronic CareLink CSV export
 * @param {string} text - Raw CSV text content
 * @returns {Array} Array of data objects {date, time, glucose, bolus, bg, carbs}
 * @throws {Error} If parsing fails or no valid data found
 */
export const parseCSV = (text) => {
  try {
    // Skip header lines (first 6 lines are metadata)
    const lines = text.split('\n').slice(CONFIG.CSV_SKIP_LINES);
    
    const data = lines
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split(';');
        
        // Validate column count
        if (parts.length < 35) return null;
        
        // Parse glucose value (required)
        const glucose = utils.parseDecimal(parts[34]);
        if (isNaN(glucose)) return null;
        
        // Parse optional fields
        return {
          date: parts[1],           // YYYY/MM/DD
          time: parts[2],           // HH:MM:SS
          glucose,                  // mg/dL
          bolus: utils.parseDecimal(parts[20]) || 0,
          bg: utils.parseDecimal(parts[18]) || null,
          carbs: utils.parseDecimal(parts[27]) || 0
        };
      })
      .filter(row => row !== null);
    
    if (data.length === 0) {
      throw new Error('No valid glucose data found in CSV');
    }
    
    return data;
    
  } catch (err) {
    throw new Error(`CSV parsing failed: ${err.message}`);
  }
};

/**
 * Parse ProTime workday data from multiple formats
 * Supports:
 * 1. PDF text (copy-pasted from ProTime PDF)
 *    - Automatically extracts year from PDF header (e.g., "Gegenereerd op 22/10/2025")
 *    - Falls back to "Week XX YYYY" headers if present
 *    - Uses current year as final fallback
 *    - Supports Dutch day abbreviations (ma, di, wo, do, vr, za, zo)
 *    - Filters out free days ("-" in time columns) and absent days
 * 2. JSON array: ["2024/10/01", "2024/10/02"]
 * 3. JSON object with workdays array: {workdays: ["2024/10/01"]}
 * 4. JSON object with date:boolean pairs: {"2024/10/01": true}
 * 
 * @param {string} input - Raw input text (PDF text or JSON string)
 * @returns {Set<string>} Set of workday dates in YYYY/MM/DD format
 * @throws {Error} If parsing fails or no workdays found
 */
export const parseProTime = (input) => {
  // Try JSON parsing first
  try {
    const data = JSON.parse(input);
    const workdays = new Set();
    
    // Format 1: {workdays: [{date, is_workday}, ...]} - Rich format with metadata
    if (data.workdays && Array.isArray(data.workdays) && data.workdays.length > 0 && typeof data.workdays[0] === 'object') {
      data.workdays.forEach(entry => {
        // Check if is_workday is truthy (could be boolean true, or a time string like "22:00")
        if (entry.date && entry.is_workday) {
          // Normalize date format to YYYY/MM/DD
          const normalizedDate = entry.date.replace(/-/g, '/');
          workdays.add(normalizedDate);
        }
      });
    }
    // Format 2: {workdays: ["date1", "date2"]} - Simple array
    else if (data.workdays && Array.isArray(data.workdays)) {
      data.workdays.forEach(d => {
        workdays.add(d.replace(/-/g, '/'));
      });
    }
    // Format 3: ["date1", "date2"] - Direct array
    else if (Array.isArray(data)) {
      data.forEach(d => {
        workdays.add(d.replace(/-/g, '/'));
      });
    }
    // Format 4: {date: bool, ...} - Object with date keys
    else if (typeof data === 'object') {
      Object.entries(data)
        .filter(([_, val]) => val === true)
        .forEach(([date, _]) => {
          workdays.add(date.replace(/-/g, '/'));
        });
    }
    
    if (workdays.size > 0) return workdays;
    
  } catch (e) {
    // Not JSON, try PDF text parsing
  }
  
  // PDF text parsing
  const workdays = new Set();
  let currentYear = new Date().getFullYear();
  
  const lines = input.split('\n');
  
  // Try to extract year from PDF header first (ProTime exports)
  // Format: "Gegenereerd op 22/10/2025" or similar date in header
  const headerYearMatch = input.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (headerYearMatch) {
    currentYear = parseInt(headerYearMatch[3]);
  }
  
  lines.forEach((line) => {
    // Extract year from "Week XX YYYY" headers (if present)
    const yearMatch = line.match(/Week\s+\d+\s+(20\d{2})/);
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1]);
      return;
    }
    
    // Match lines with date format: day DD/MM
    // Use \s+ to match multiple spaces (common in PDF extraction)
    // Example: "wo 01/10   8:52   17:03" or "ma 06/10   11:34   19:46"
    const dateMatch = line.match(/(ma|di|wo|do|vr|za|zo)\s+(\d{1,2})\/(\d{1,2})/);
    
    if (dateMatch) {
      const [_, dayAbbr, dayNum, month] = dateMatch;
      
      // Check if this is a work day by looking for time values (HH:MM format)
      // And exclude lines with "Vrije Dag", "Vakantie", or "OA Var" (vacation code)
      const hasTimeFormat = /\d{1,2}:\d{2}/.test(line);
      const isVacation = line.includes('Vakantie') || line.includes('OA Var');
      const isFreeDay = line.includes('OZ Vrije Dag') || line.includes('Vrije Dag');
      
      // Only count as workday if:
      // 1. Has actual time entries (HH:MM format)
      // 2. Not a vacation day (no "Vakantie" or "OA Var")
      // 3. Not a free day (no "Vrije Dag")
      if (hasTimeFormat && !isVacation && !isFreeDay) {
        const paddedMonth = month.padStart(2, '0');
        const paddedDay = dayNum.padStart(2, '0');
        const dateStr = `${currentYear}/${paddedMonth}/${paddedDay}`;
        workdays.add(dateStr);
      }
    }
  });
  
  if (workdays.size > 0) return workdays;
  
  throw new Error('Could not parse ProTime data. Expected PDF text or JSON format.');
};

/**
 * Export workday data to JSON file
 * @param {Set<string>} workdays - Set of workday dates in YYYY/MM/DD format
 * @returns {string} JSON string ready for download
 */
export const exportProTimeJSON = (workdays) => {
  const data = {
    source: 'ProTime',
    exported: new Date().toISOString(),
    format: 'YYYY/MM/DD',
    count: workdays.size,
    workdays: Array.from(workdays).sort()
  };
  
  return JSON.stringify(data, null, 2);
};

/**
 * Trigger browser download of JSON file
 * @param {Set<string>} workdays - Set of workday dates
 */
export const downloadProTimeJSON = (workdays) => {
  const json = exportProTimeJSON(workdays);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workdays_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};