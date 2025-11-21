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
import { debug } from '../utils/debug.js';

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
 * Parse Section 1: Event Data (for meal boluses)
 * 
 * Section 1 contains individual bolus events with detailed columns.
 * We need this to calculate daily meal bolus totals.
 * 
 * Format:
 * Index;Date;Time;...;Bolus Volume Delivered (U);...;Bolus Source;...
 * 
 * @param {string} text - Raw CSV text content
 * @returns {Array} Array of {date, bolusVolumeDelivered, bolusSource}
 */
export const parseSection1Boluses = (text) => {
  const section1Data = [];
  
  try {
    const lines = text.split('\n');
    let inSection1 = true; // Section 1 starts immediately after headers
    let section1ColumnIndices = null;
    
    // Skip metadata header lines (first 6 lines)
    const dataLines = lines.slice(CONFIG.CSV_SKIP_LINES);
    
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      
      // Stop at Section 2 divider
      if (line.includes('Aggregated Auto Insulin Data')) {
        break;
      }
      
      // Skip empty lines
      if (!line.trim()) {
        continue;
      }
      
      const parts = line.split(';');
      
      // Parse header row to find column indices
      if (parts[1] === 'Date' && parts[2] === 'Time') {
        section1ColumnIndices = {
          dateIndex: 1,
          bolusVolumeIndex: parts.findIndex(p => p.trim().includes('Bolus Volume Delivered')),
          bolusSourceIndex: parts.findIndex(p => p.trim().includes('Bolus Source'))
        };
        continue;
      }
      
      // Parse data rows (meal boluses + manual boluses)
      if (section1ColumnIndices && parts.length > Math.max(
        section1ColumnIndices.dateIndex,
        section1ColumnIndices.bolusVolumeIndex,
        section1ColumnIndices.bolusSourceIndex
      )) {
        const date = parts[section1ColumnIndices.dateIndex]?.trim();
        const bolusVolume = parts[section1ColumnIndices.bolusVolumeIndex]?.trim();
        const bolusSource = parts[section1ColumnIndices.bolusSourceIndex]?.trim();
        
        // Include both automated food boluses AND manual boluses (BOLUS_WIZARD)
        // - CLOSED_LOOP_BG_CORRECTION_AND_FOOD_BOLUS: Auto mode meal boluses
        // - BOLUS_WIZARD: Manual boluses (corrections, meals, or both)
        const isMealBolus = bolusSource === 'CLOSED_LOOP_BG_CORRECTION_AND_FOOD_BOLUS';
        const isManualBolus = bolusSource === 'BOLUS_WIZARD';
        
        if (date && bolusVolume && (isMealBolus || isManualBolus)) {
          // Convert European decimal format (comma) to JS format (dot)
          const volumeNum = bolusVolume.replace(',', '.');
          const volumeValue = parseFloat(volumeNum);
          
          // Only include delivered boluses (skip cancelled/failed boluses)
          if (volumeValue > 0) {
            section1Data.push({
              date,
              bolusVolumeDelivered: volumeValue,
              bolusSource
            });
          }
        }
      }
    }
    
    return section1Data;
    
  } catch (err) {
    console.error('[Section 1 Parser] Error:', err);
    return []; // Return empty array on error
  }
};

/**
 * Parse Section 2: Aggregated Auto Insulin Data
 * 
 * Location: Around line 458 in CareLink CSV
 * Divider: "-------;MiniMed 780G MMT-1886;Pump;NG4114235H;Aggregated Auto Insulin Data"
 * 
 * Format:
 * Index;Date;Time;...;Bolus Volume Delivered (U);...;Bolus Source;...
 * 449,00000;2025/10/28;00:00:00;...;4,927;...;CLOSED_LOOP_AUTO_INSULIN;...
 * 
 * @param {string} text - Raw CSV text content
 * @returns {Array} Array of {date, bolusVolumeDelivered, bolusSource}
 */
export const parseSection2 = (text) => {
  const section2Data = [];
  
  try {
    const lines = text.split('\n');
    let inSection2 = false;
    let section2ColumnIndices = null;
    
    // Find Section 2 divider and parse data
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect Section 2 divider
      if (line.includes('Aggregated Auto Insulin Data')) {
        inSection2 = true;
        continue;
      }
      
      // Stop at next section divider (starts with dashes)
      if (inSection2 && line.trim().startsWith('-----')) {
        break;
      }
      
      if (inSection2) {
        const parts = line.split(';');
        
        // Parse header row to find column indices
        if (parts[1] === 'Date' && parts[2] === 'Time') {
          section2ColumnIndices = {
            dateIndex: 1,
            bolusVolumeIndex: parts.findIndex(p => p.trim().includes('Bolus Volume Delivered')),
            bolusSourceIndex: parts.findIndex(p => p.trim().includes('Bolus Source'))
          };
          continue;
        }
        
        // Parse data rows
        if (section2ColumnIndices && parts.length > Math.max(
          section2ColumnIndices.dateIndex,
          section2ColumnIndices.bolusVolumeIndex,
          section2ColumnIndices.bolusSourceIndex
        )) {
          const date = parts[section2ColumnIndices.dateIndex]?.trim();
          const bolusVolume = parts[section2ColumnIndices.bolusVolumeIndex]?.trim();
          const bolusSource = parts[section2ColumnIndices.bolusSourceIndex]?.trim();
          
          // Only include auto insulin entries (CLOSED_LOOP_AUTO_INSULIN)
          if (date && bolusVolume && bolusSource === 'CLOSED_LOOP_AUTO_INSULIN') {
            // Convert European decimal format (comma) to JS format (dot)
            const volumeNum = bolusVolume.replace(',', '.');
            
            section2Data.push({
              date,
              bolusVolumeDelivered: volumeNum,
              bolusSource
            });
          }
        }
      }
    }
    
    return section2Data;
    
  } catch (err) {
    console.error('[Section 2 Parser] Error:', err);
    return []; // Return empty array on error, don't block glucose parsing
  }
};

/**
 * Find all sensor data sections in a multi-pump CSV export
 * 
 * CareLink exports can contain multiple pumps, each with their own sensor section.
 * Each section has its own header row with potentially different column positions.
 * 
 * Section dividers look like: "-------;MiniMed 780G MMT-1886;Sensor;NG4114235H;-------"
 * 
 * @param {string} text - Raw CSV text content
 * @returns {Array} Array of {startLine, endLine, serial, headerRow} for each sensor section
 */
export const findAllSensorSections = (text, sectionType = 'Sensor') => {
  const lines = text.split('\n');
  const sections = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for section dividers: "-------;...;Sensor;SERIAL;-------" or "-------;...;Pump;SERIAL;-------"
    // sectionType can be 'Sensor' or 'Pump'
    if (line.includes(sectionType) && line.startsWith('-----') && !line.includes('Aggregated')) {
      const parts = line.split(';');
      // Extract serial number (usually 4th part)
      const serial = parts[3]?.trim() || 'Unknown';
      
      // Header row is the next line
      const headerLine = i + 1;
      if (headerLine >= lines.length) continue;
      
      const headerRow = lines[headerLine];
      if (!headerRow.includes('Date') || !headerRow.includes('Time')) continue;
      
      // Find end of section (next divider or EOF)
      let endLine = lines.length - 1;
      for (let j = headerLine + 1; j < lines.length; j++) {
        if (lines[j].startsWith('-----')) {
          endLine = j - 1;
          break;
        }
      }
      
      sections.push({
        startLine: headerLine,
        endLine,
        serial,
        headerRow
      });
      
      console.log(`[Parser] Found ${sectionType} section: ${serial} (lines ${headerLine}-${endLine})`);
    }
  }
  
  return sections;
};

/**
 * Detect CSV format version and structure
 * Dynamically identifies header lines, device type, and format version
 * 
 * @param {string} text - Raw CSV text content
 * @returns {Object|null} Format info {version, device, headerLineCount, headerRowIndex, confidence}
 * 
 * Returns null if detection fails or invalid CSV format
 * 
 * Example return:
 * {
 *   version: '1.0',          // Format version (1.0 = current MiniMed format)
 *   device: 'MiniMed 780G',  // Device model from header
 *   serial: 'NG4114235H',    // Device serial number
 *   headerLineCount: 6,      // Number of lines to skip before header row
 *   headerRowIndex: 6,       // Index of column header row
 *   confidence: 'high'       // Detection confidence: high|medium|low
 * }
 */
export const detectCSVFormat = (text) => {
  if (!text || text.trim().length === 0) {
    return null;
  }
  
  const lines = text.split('\n');
  
  if (lines.length < 7) {
    console.warn('[CSV Format] File too short for detection');
    return null;
  }
  
  // Find header row (contains "Index;Date;Time")
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i];
    if (line.includes('Index') && line.includes('Date') && line.includes('Time')) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    console.error('[CSV Format] Could not find header row');
    return null;
  }
  
  // Extract device info from Line 0
  const line0 = lines[0] || '';
  let device = null;
  if (line0.includes('MiniMed')) {
    const parts = line0.split(';');
    const devicePart = parts.find(p => p.includes('MiniMed'));
    device = devicePart ? devicePart.trim() : 'Unknown MiniMed';
  }
  
  // Extract serial number from Line 1
  const line1 = lines[1] || '';
  let serial = null;
  if (line1.includes('Serial Number')) {
    const parts = line1.split(';');
    const serialIndex = parts.findIndex(p => p.replace(/"/g, '').trim() === 'Serial Number');
    if (serialIndex !== -1 && serialIndex + 1 < parts.length) {
      serial = parts[serialIndex + 1].replace(/"/g, '').trim();
    }
  }
  
  // Determine confidence based on what we found
  let confidence = 'high';
  if (!device) confidence = 'medium';
  if (!device && !serial) confidence = 'low';
  
  // Determine version (currently only 1.0 is known)
  const version = '1.0'; // MiniMed CareLink export format v1.0
  
  return {
    version,
    device: device || 'Unknown Device',
    serial: serial || 'Unknown Serial',
    headerLineCount: headerRowIndex,  // Lines to skip
    headerRowIndex,                   // Index of header row
    confidence
  };
};

/**
 * Find column indices from CSV header row
 * Builds a map of column name → index for dynamic column access
 * 
 * @param {string} headerRow - CSV header row (semicolon-separated)
 * @returns {Object} Column name → index map, or null if invalid
 * 
 * Example return:
 * {
 *   'Date': 1,
 *   'Time': 2,
 *   'Sensor Glucose (mg/dL)': 34,
 *   ...
 * }
 */
export const findColumnIndices = (headerRow) => {
  if (!headerRow || typeof headerRow !== 'string') {
    return null;
  }
  
  const columns = headerRow.split(';');
  const columnMap = {};
  
  columns.forEach((col, index) => {
    const trimmed = col.trim();
    if (trimmed) {
      columnMap[trimmed] = index;
    }
  });
  
  // B.6.4: Comprehensive validation for required and optional columns
  
  // Critical columns (parser will fail without these)
  const requiredColumns = [
    'Date',
    'Time', 
    'Sensor Glucose (mg/dL)'
  ];
  
  // Important columns (needed for full functionality)
  const importantColumns = [
    'BWZ Carb Input (grams)',
    'Bolus Volume Delivered (U)',
    'Basal Rate (U/h)',
    'Alert'  // Changed from 'Alarm' - CareLink uses 'Alert' column name
  ];
  
  // Optional columns (nice to have, but not critical)
  const optionalColumns = [
    'BWZ Estimate (U)',
    'BWZ Active Insulin (U)',
    'BWZ Carb Ratio (g/U)',
    'BWZ Insulin Sensitivity (mg/dL/U)',
    'Rewind',
    'BG Reading (mg/dL)'
  ];
  
  // Check required columns
  const missingRequired = requiredColumns.filter(col => !(col in columnMap));
  if (missingRequired.length > 0) {
    console.error(
      `[Parser] CRITICAL: Missing required columns: ${missingRequired.join(', ')}\n` +
      `This CSV cannot be parsed. Please ensure this is a valid Medtronic CareLink export.`
    );
    return null;
  }
  
  // Check important columns (warn but continue)
  const missingImportant = importantColumns.filter(col => !(col in columnMap));
  if (missingImportant.length > 0) {
    console.warn(
      `[Parser] WARNING: Missing important columns: ${missingImportant.join(', ')}\n` +
      `Some features may be limited (insulin data, carb tracking, or alerts).`
    );
  }
  
  // Check optional columns (info only, no warning)
  const missingOptional = optionalColumns.filter(col => !(col in columnMap));
  if (missingOptional.length > 0) {
    console.info(
      `[Parser] INFO: Missing optional columns: ${missingOptional.join(', ')}\n` +
      `These are not critical - parsing will continue normally.`
    );
  }
  
  // Log successful validation
  const totalColumns = Object.keys(columnMap).length;
  const missingTotal = missingRequired.length + missingImportant.length + missingOptional.length;
  console.log(
    `[Parser] Column validation complete: ${totalColumns} columns found, ` +
    `${missingTotal} optional/important columns missing`
  );
  
  return columnMap;
};

/**
 * Parse Medtronic CareLink CSV export
 * @param {string} text - Raw CSV text content
 * @returns {Object} {data: Array, section2: Array} - Main glucose data + Section 2 insulin data
 * @throws {Error} If parsing fails or no valid data found
 */
export const parseCSV = (text) => {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('CSV file is empty');
    }
    
    const lines = text.split('\n');
    
    // Detect CSV format version and structure
    const format = detectCSVFormat(text);
    if (!format) {
      throw new Error('Unable to detect CSV format. Is this a valid CareLink export?');
    }
    
    // Log format detection results
    console.log(`[CSV Format] Detected: ${format.device} (${format.serial})`);
    console.log(`[CSV Format] Version: ${format.version}, Header at line: ${format.headerRowIndex}`);
    
    if (format.confidence === 'low') {
      console.warn('[CSV Format] Low confidence detection - file may not parse correctly');
    }
    
    // Check minimum line count (using detected header position)
    if (lines.length < format.headerLineCount + 10) {
      throw new Error(`CSV file too short. Expected at least ${format.headerLineCount + 10} lines, got ${lines.length}`);
    }
    
    // Skip header lines (dynamically detected, not hardcoded!)
    const dataLines = lines.slice(format.headerLineCount);
    
    // Get header row (should be first line after skipping header metadata)
    const headerRow = dataLines[0];
    if (!headerRow) {
      throw new Error('Could not find CSV header row. Is this a valid CareLink export?');
    }
    
    const columnMap = findColumnIndices(headerRow);
    if (!columnMap) {
      throw new Error(
        'CSV header validation failed. Missing required columns (Date, Time, or Sensor Glucose).\n\n' +
        'This file may not be a valid Medtronic CareLink export.\n' +
        'Please ensure you exported the CSV from CareLink Personal with all columns included.\n\n' +
        'Check the browser console for detailed column information.'
      );
    }
    
    // Helper function to get column value (dynamic only - no hardcoded fallbacks)
    const getColumn = (parts, columnName) => {
      const index = columnMap[columnName];
      if (index !== undefined) {
        return parts[index];
      }
      // If column not found, this is a critical error (column map validation should have caught this)
      throw new Error(
        `[Parser] CRITICAL: Column "${columnName}" not found in column map.\n` +
        `This should never happen - column validation should have caught this earlier.\n` +
        `Available columns: ${Object.keys(columnMap).join(', ')}`
      );
    };
    
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
    let outOfBoundsCount = 0; // Track out-of-bounds glucose readings specifically
    
    const data = dataLines
      .filter(line => line.trim())
      .map((line, index) => {
        const parts = line.split(';');
        
        // Skip the header row itself (already processed above)
        if (line === headerRow) {
          skippedRows++;
          return null;
        }
        
        // Validate column count (flexible with column map)
        if (parts.length < 10) {
          skippedRows++;
          return null;
        }
        
        // Parse glucose value (may be null for event-only rows like Rewind)
        const glucose = utils.parseDecimal(getColumn(parts, 'Sensor Glucose (mg/dL)'));
        const hasGlucose = !isNaN(glucose);
        
        // Parse alert field for sensor events
        // Support both 'Alert' (current) and 'Alarm' (legacy) column names
        // Check columnMap directly to avoid getColumn throwing error
        const alertIndex = columnMap['Alert'] ?? columnMap['Alarm'];
        const alert = alertIndex !== undefined ? parts[alertIndex]?.trim() : null;
        const hasSensorAlert = alert && (alert.includes('SENSOR') || alert.includes('Sensor'));
        
        // Skip rows that have neither glucose nor important events
        const hasRewind = getColumn(parts, 'Rewind')?.trim() === 'Rewind';
        const hasBolus = !isNaN(utils.parseDecimal(getColumn(parts, 'Bolus Volume Delivered (U)')));
        
        if (!hasGlucose && !hasRewind && !hasBolus && !hasSensorAlert) {
          skippedRows++;
          return null;
        }
        
        // Validate glucose range if present (skip out-of-bounds readings)
        // Spec: <20 or >600 mg/dL are invalid sensor readings
        if (hasGlucose && (glucose < 20 || glucose > 600)) {
          outOfBoundsCount++;
          skippedRows++;
          return null; // Skip this row
        }
        
        validRows++;
        
        // Parse optional fields
        return {
          date: getColumn(parts, 'Date'),
          time: getColumn(parts, 'Time'),
          glucose: hasGlucose ? glucose : null,  // mg/dL (may be null)
          bolus: utils.parseDecimal(getColumn(parts, 'Bolus Volume Delivered (U)')) || 0,
          bg: utils.parseDecimal(getColumn(parts, 'BG Reading (mg/dL)')) || null,
          // Support both 'BWZ Carb Input (grams)' and legacy 'BWZ Carb Input (g)'
          carbs: (() => {
            const carbIndex = columnMap['BWZ Carb Input (grams)'] ?? columnMap['BWZ Carb Input (g)'];
            return carbIndex !== undefined ? (utils.parseDecimal(parts[carbIndex]) || 0) : 0;
          })(),
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
    
    // Debug: Count sensor alerts
    const sensorAlerts = data.filter(row => row.alert && row.alert.includes('SENSOR'));
    sensorAlerts.forEach(alert => {
    });
    
    // Calculate coverage
    const coverage = (validRows / (validRows + skippedRows) * 100).toFixed(1);
    debug.info(`CSV parsed successfully: ${validRows} valid rows (${coverage}% coverage), ${skippedRows} skipped`);
    
    // Warn about out-of-bounds glucose readings
    if (outOfBoundsCount > 0) {
      console.warn(`[Parser] Skipped ${outOfBoundsCount} out-of-bounds glucose readings (<20 or >600 mg/dL)`);
    }
    
    // Warn if coverage is low
    if (coverage < 70) {
    }
    
    // Parse Section 1 (meal boluses for TDD calculation)
    const section1 = parseSection1Boluses(text);
    
    // Parse Section 2 (auto insulin data)
    const section2 = parseSection2(text);
    
    // === MULTI-PUMP SUPPORT ===
    // TODO: Remove after Jan 2026 when old pump (NG4114235H) data expires from CSV exports
    // See TECH_DEBT.md for cleanup instructions
    // Check if there are multiple sensor sections (e.g., after pump replacement)
    // Each section may have different column indices due to firmware changes
    const sensorSections = findAllSensorSections(text);
    
    if (sensorSections.length > 1) {
      console.log(`[Parser] Multi-pump CSV detected: ${sensorSections.length} sensor sections`);
      
      // Parse additional sections (skip first, already parsed above)
      for (let s = 1; s < sensorSections.length; s++) {
        const section = sensorSections[s];
        const sectionColumnMap = findColumnIndices(section.headerRow);
        
        if (!sectionColumnMap) {
          console.warn(`[Parser] Skipping section ${section.serial}: invalid header`);
          continue;
        }
        
        console.log(`[Parser] Parsing additional section: ${section.serial}`);
        
        // Parse this section's data
        for (let i = section.startLine + 1; i <= section.endLine; i++) {
          const line = lines[i];
          if (!line || !line.trim()) continue;
          
          const parts = line.split(';');
          if (parts.length < 10) continue;
          
          // Get glucose using THIS section's column map
          const glucoseIdx = sectionColumnMap['Sensor Glucose (mg/dL)'];
          const glucose = glucoseIdx !== undefined ? utils.parseDecimal(parts[glucoseIdx]) : NaN;
          
          if (isNaN(glucose) || glucose < 20 || glucose > 600) continue;
          
          const dateIdx = sectionColumnMap['Date'];
          const timeIdx = sectionColumnMap['Time'];
          
          data.push({
            date: parts[dateIdx]?.trim(),
            time: parts[timeIdx]?.trim(),
            glucose,
            bolus: 0,
            bg: null,
            carbs: 0,
            rewind: false,
            alert: null
          });
          validRows++;
        }
      }
      
      console.log(`[Parser] Multi-pump sensor merge complete: ${data.length} total readings`);
    }
    
    // === MULTI-PUMP SUPPORT: PUMP SECTIONS (rewind, alerts, boluses) ===
    // TODO: Remove after Jan 2026 when old pump data expires. See TECH_DEBT.md
    const pumpSections = findAllSensorSections(text, 'Pump');
    
    if (pumpSections.length > 1) {
      console.log(`[Parser] Multi-pump CSV: ${pumpSections.length} pump sections found`);
      
      // Parse additional pump sections (skip first, already parsed above)
      for (let s = 1; s < pumpSections.length; s++) {
        const section = pumpSections[s];
        const sectionColumnMap = findColumnIndices(section.headerRow);
        
        if (!sectionColumnMap) {
          console.warn(`[Parser] Skipping pump section ${section.serial}: invalid header`);
          continue;
        }
        
        console.log(`[Parser] Parsing pump section: ${section.serial}`);
        let pumpEvents = 0;
        
        // Parse this section's events (rewind, alerts, boluses)
        for (let i = section.startLine + 1; i <= section.endLine; i++) {
          const line = lines[i];
          if (!line || !line.trim()) continue;
          
          const parts = line.split(';');
          if (parts.length < 10) continue;
          
          const dateIdx = sectionColumnMap['Date'];
          const timeIdx = sectionColumnMap['Time'];
          const rewindIdx = sectionColumnMap['Rewind'];
          const alertIdx = sectionColumnMap['Alert'] ?? sectionColumnMap['Alarm'];
          const bolusIdx = sectionColumnMap['Bolus Volume Delivered (U)'];
          
          const hasRewind = rewindIdx !== undefined && parts[rewindIdx]?.trim() === 'Rewind';
          const alert = alertIdx !== undefined ? parts[alertIdx]?.trim() : null;
          const hasSensorAlert = alert && (alert.includes('SENSOR') || alert.includes('Sensor'));
          const bolus = bolusIdx !== undefined ? utils.parseDecimal(parts[bolusIdx]) : 0;
          
          // Only add events (not glucose - that comes from sensor section)
          if (hasRewind || hasSensorAlert || bolus > 0) {
            data.push({
              date: parts[dateIdx]?.trim(),
              time: parts[timeIdx]?.trim(),
              glucose: null,
              bolus: bolus || 0,
              bg: null,
              carbs: 0,
              rewind: hasRewind,
              alert: alert
            });
            pumpEvents++;
          }
        }
        
        console.log(`[Parser] Pump section ${section.serial}: ${pumpEvents} events added`);
      }
    }

    return {
      data,       // Main glucose/event data (Section 3)
      section1,   // Meal boluses for TDD (NEW in v3.1)
      section2    // Auto insulin for TDD (NEW in v3.1)
    };
    
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