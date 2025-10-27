/**
 * ARTIFACT-02: Data Parsers
 * CSV and ProTime data parsing utilities
 * 
 * Exports:
 * - parseCSV: Parse Medtronic CareLink CSV export
 * - parseCSVMetadata: Extract patient info from CSV headers
 * - parseProTime: Parse ProTime workday data (PDF text or JSON)
 * - exportProTimeJSON: Export workday data to JSON file
 */

import { CONFIG, utils } from './metrics-engine.js';

/**
 * Extract patient metadata from Medtronic CareLink CSV header
 * 
 * CSV Header Structure (first 3 lines):
 * Line 1: Last Name;First Name;...;Device;MiniMed 780G MMT-1886;...
 * Line 2: "Mostert";"Jo";...;"Serial Number";NG4114235H;...
 * Line 3: Patient DOB;;;;;;CGM;Guardian™ 4 Sensor
 * 
 * @param {string} text - Raw CSV text content
 * @returns {Object|null} Patient metadata {name, deviceSerial, device, cgm} or null if not found
 */
export const parseCSVMetadata = (text) => {
  try {
    const lines = text.split('\n');
    
    if (lines.length < 3) {
      console.warn('CSV too short to extract metadata');
      return null;
    }
    
    const metadata = {};
    
    // Parse line 1: Device info
    // Format: Last Name;First Name;...;Device;MiniMed 780G MMT-1886;...
    const line1 = lines[0];
    const line1Parts = line1.split(';');
    
    const deviceIndex = line1Parts.findIndex(part => part.trim() === 'Device');
    if (deviceIndex !== -1 && deviceIndex + 1 < line1Parts.length) {
      metadata.device = line1Parts[deviceIndex + 1].trim();
    }
    
    // Parse line 2: Patient name and serial number
    // Format: "Mostert";"Jo";...;"Serial Number";NG4114235H;...
    const line2 = lines[1];
    const line2Parts = line2.split(';');
    
    // Extract name (combine first and last, remove quotes)
    const lastName = line2Parts[0]?.replace(/"/g, '').trim() || '';
    const firstName = line2Parts[1]?.replace(/"/g, '').trim() || '';
    
    if (lastName || firstName) {
      metadata.name = `${firstName} ${lastName}`.trim();
    }
    
    // Extract serial number
    const serialIndex = line2Parts.findIndex(part => 
      part.replace(/"/g, '').trim() === 'Serial Number'
    );
    if (serialIndex !== -1 && serialIndex + 1 < line2Parts.length) {
      metadata.deviceSerial = line2Parts[serialIndex + 1].replace(/"/g, '').trim();
    }
    
    // Parse line 3: CGM info (optional)
    // Format: Patient DOB;;;;;;CGM;Guardian™ 4 Sensor
    if (lines.length >= 3) {
      const line3 = lines[2];
      const line3Parts = line3.split(';');
      
      const cgmIndex = line3Parts.findIndex(part => part.trim() === 'CGM');
      if (cgmIndex !== -1 && cgmIndex + 1 < line3Parts.length) {
        metadata.cgm = line3Parts[cgmIndex + 1].trim();
      }
    }
    
    // Return null if no metadata found
    return Object.keys(metadata).length > 0 ? metadata : null;
  } catch (err) {
    console.error('Failed to parse CSV metadata:', err);
    return null;
  }
};

/**
 * Parse Medtronic CareLink CSV export
 * @param {string} text - Raw CSV text content
 * @returns {Array} Array of data objects {date, time, glucose, bolus, bg, carbs}
 * @throws {Error} If parsing fails or no valid data found
 */
export const parseCSV = (text) => {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('CSV file is empty');
    }
    
    const lines = text.split('\n');
    
    // Check minimum line count
    if (lines.length < CONFIG.CSV_SKIP_LINES + 10) {
      throw new Error(`CSV file too short. Expected at least ${CONFIG.CSV_SKIP_LINES + 10} lines, got ${lines.length}`);
    }
    
    // Skip header lines (first 6 lines are metadata)
    const dataLines = lines.slice(CONFIG.CSV_SKIP_LINES);
    
    // Validate CSV structure by checking first data line
    const firstDataLine = dataLines.find(line => line.trim());
    if (!firstDataLine) {
      throw new Error('No data rows found in CSV after header');
    }
    
    const sampleParts = firstDataLine.split(';');
    if (sampleParts.length < 35) {
      throw new Error(`Invalid CSV format. Expected at least 35 columns, found ${sampleParts.length}. Is this a CareLink export?`);
    }
    
    // Parse data rows
    let validRows = 0;
    let skippedRows = 0;
    
    const data = dataLines
      .filter(line => line.trim())
      .map((line, index) => {
        const parts = line.split(';');
        
        // Skip column header row (Date;Time;...)
        if (parts[1] === 'Date' && parts[2] === 'Time') {
          skippedRows++;
          return null;
        }
        
        // Validate column count
        if (parts.length < 35) {
          skippedRows++;
          return null;
        }
        
        // Parse glucose value (may be null for event-only rows like Rewind)
        const glucose = utils.parseDecimal(parts[34]);
        const hasGlucose = !isNaN(glucose);
        
        // Parse alert field (column 7) for sensor events
        const alert = parts[7]?.trim() || null;
        const hasSensorAlert = alert && (alert.includes('SENSOR') || alert.includes('Sensor'));
        
        // Skip rows that have neither glucose nor important events
        const hasRewind = parts[21]?.trim() === 'Rewind';
        const hasBolus = !isNaN(utils.parseDecimal(parts[13]));
        
        if (!hasGlucose && !hasRewind && !hasBolus && !hasSensorAlert) {
          skippedRows++;
          return null;
        }
        
        // Validate glucose range if present (40-400 mg/dL is reasonable)
        if (hasGlucose && (glucose < 40 || glucose > 400)) {
          console.warn(`Suspicious glucose value at row ${index + CONFIG.CSV_SKIP_LINES}: ${glucose} mg/dL`);
        }
        
        validRows++;
        
        // Parse optional fields
        return {
          date: parts[1],           // YYYY/MM/DD
          time: parts[2],           // HH:MM:SS
          glucose: hasGlucose ? glucose : null,  // mg/dL (may be null)
          bolus: utils.parseDecimal(parts[13]) || 0,
          bg: utils.parseDecimal(parts[5]) || null,
          carbs: utils.parseDecimal(parts[27]) || 0,
          rewind: hasRewind,
          alert: alert  // Alert field for sensor events
        };
      })
      .filter(row => row !== null);
    
    if (data.length === 0) {
      throw new Error(`No valid glucose data found. Checked ${dataLines.length} rows, all were invalid.`);
    }
    
    // Debug: Count rewind events
    const rewindCount = data.filter(row => row.rewind).length;
    console.log(`[CSV Parser] Found ${rewindCount} rewind events out of ${data.length} total rows`);
    
    // Debug: Count sensor alerts
    const sensorAlerts = data.filter(row => row.alert && row.alert.includes('SENSOR'));
    console.log(`[CSV Parser] Found ${sensorAlerts.length} sensor alerts:`);
    sensorAlerts.forEach(alert => {
      console.log(`  - ${alert.date} ${alert.time}: ${alert.alert}`);
    });
    
    // Calculate coverage
    const coverage = (validRows / (validRows + skippedRows) * 100).toFixed(1);
    console.info(`CSV parsed successfully: ${validRows} valid rows (${coverage}% coverage), ${skippedRows} skipped`);
    
    // Warn if coverage is low
    if (coverage < 70) {
      console.warn(`⚠️ Low data coverage: ${coverage}%. Metrics may be unreliable.`);
    }
    
    return data;
    
  } catch (err) {
    // Provide helpful error messages
    if (err.message.includes('CSV')) {
      throw err; // Already a helpful error
    }
    throw new Error(`CSV parsing failed: ${err.message}. Please ensure this is a valid CareLink export.`);
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