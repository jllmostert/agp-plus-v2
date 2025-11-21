/**
 * CSV Section Parser Module
 * 
 * Parses MiniMed 780G CareLink CSV exports into three sections:
 * 1. Device Events & Alerts (INDEX 0-456)
 * 2. Aggregated Auto Insulin Data
 * 3. Sensor Glucose Readings (5-min intervals)
 * 
 * CSV Structure:
 * - Lines 1-6: Metadata headers
 * - Section dividers: "-------;MiniMed 780G MMT-1886;..."
 * - Each section has "Index;Date;Time;" header line
 */

import { debug } from '../utils/debug.js';
import { findAllSensorSections, findColumnIndices } from './parsers.js';

/**
 * Detect section boundaries in CSV
 * @param {string} csvText - Raw CSV content
 * @returns {Object} { section1: {start, end}, section2: {start, end}, section3: {start, end} }
 */
export function detectSections(csvText) {
  const lines = csvText.split('\n');
  const sections = { section1: null, section2: null, section3: null };
  
  const dividerPattern = /^-+;MiniMed 780G/;
  const headerPattern = /^Index;Date;Time;/;
  
  let currentSection = 0;
  let lastDividerLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];    
    // Detect section divider
    if (dividerPattern.test(line)) {
      lastDividerLine = i;
      currentSection++;
      debug.log('[CSV Parser] Section divider found', { line: i, section: currentSection });
    }
    
    // Detect header line after divider
    if (headerPattern.test(line) && lastDividerLine > -1) {
      const sectionKey = `section${currentSection}`;
      
      if (!sections[sectionKey]) {
        sections[sectionKey] = { start: i, end: -1 };
        
        // Set end of previous section
        if (currentSection > 1) {
          const prevKey = `section${currentSection - 1}`;
          if (sections[prevKey]) {
            sections[prevKey].end = lastDividerLine - 1;
          }
        }
      }
    }
  }
  
  // Set end of last section
  if (sections.section3) {
    sections.section3.end = lines.length - 1;
  } else if (sections.section2) {
    sections.section2.end = lines.length - 1;
  }
  
  debug.log('[CSV Parser] Sections detected', sections);
  return sections;
}

/**
 * Parse Section 1: Device Events & Alerts
 * @param {string} csvText - Raw CSV content
 * @param {Object} boundaries - Section boundaries from detectSections
 * @returns {Array} Array of { index, timestamp, alert, glucose, ...otherFields }
 */
export function parseSection1(csvText, boundaries) {
  if (!boundaries.section1) {
    debug.log('[CSV Parser] Section 1 not found');
    return [];
  }
  
  const lines = csvText.split('\n');
  const section = lines.slice(boundaries.section1.start, boundaries.section1.end + 1);
  
  const events = [];
  let columnMapping = null;
  
  for (let i = 0; i < section.length; i++) {
    const line = section[i].trim();
    if (!line) continue;
    
    const parts = line.split(';');
    
    // Parse header to get column indices
    if (parts[0] === 'Index' && parts[1] === 'Date' && parts[2] === 'Time') {
      columnMapping = {
        index: 0,
        date: 1,
        time: 2,
        alert: parts.indexOf('Alert'),
        sensorGlucose: parts.indexOf('Sensor Glucose (mg/dL)'),
        bolusVolume: parts.indexOf('Bolus Volume Delivered (U)'),
        basalRate: parts.indexOf('Basal Rate (U/h)')
      };
      continue;
    }
    
    // Parse data rows
    if (columnMapping && parts.length > 2) {
      const date = parts[columnMapping.date]?.trim();
      const time = parts[columnMapping.time]?.trim();
      
      if (!date || !time) continue;
      
      const timestamp = parseCareLinkDateTime(date, time);
      
      const event = {
        index: parts[columnMapping.index],
        timestamp,
        alert: parts[columnMapping.alert]?.trim() || null,
        glucose: parts[columnMapping.sensorGlucose] ? parseFloat(parts[columnMapping.sensorGlucose].replace(',', '.')) : null
      };
      
      // Only include events with meaningful data
      if (event.alert || event.glucose) {
        events.push(event);
      }
    }
  }
  
  debug.log('[CSV Parser] Section 1 parsed', { events: events.length });
  return events;
}

/**
 * Parse Section 3: Sensor Glucose Readings
 * @param {string} csvText - Raw CSV content
 * @param {Object} boundaries - Section boundaries from detectSections
 * @returns {Array} Array of { timestamp, glucose }
 */
export function parseSection3(csvText, boundaries) {
  if (!boundaries.section3) {
    debug.log('[CSV Parser] Section 3 not found');
    return [];
  }
  
  const lines = csvText.split('\n');
  const section = lines.slice(boundaries.section3.start, boundaries.section3.end + 1);
  
  const readings = [];
  let columnMapping = null;
  
  for (let i = 0; i < section.length; i++) {
    const line = section[i].trim();
    if (!line) continue;
    
    const parts = line.split(';');
    
    // Parse header
    if (parts[0] === 'Index' && parts[1] === 'Date' && parts[2] === 'Time') {
      columnMapping = {
        index: 0,
        date: 1,
        time: 2,
        sensorGlucose: parts.indexOf('Sensor Glucose (mg/dL)')
      };
      continue;
    }
    
    // Parse data rows
    if (columnMapping && parts.length > 2) {
      const date = parts[columnMapping.date]?.trim();
      const time = parts[columnMapping.time]?.trim();
      const glucose = parts[columnMapping.sensorGlucose]?.trim();
      
      if (date && time && glucose) {
        const timestamp = parseCareLinkDateTime(date, time);
        const glucoseValue = parseFloat(glucose.replace(',', '.'));
        
        if (!isNaN(glucoseValue)) {
          readings.push({ timestamp, glucose: glucoseValue });
        }
      }
    }
  }
  
  debug.log('[CSV Parser] Section 3 parsed', { readings: readings.length });
  return readings;
}

/**
 * Parse CareLink datetime format
 * @param {string} date - "2025/10/30"
 * @param {string} time - "17:36:29"
 * @returns {Date}
 */
function parseCareLinkDateTime(date, time) {
  const [year, month, day] = date.split('/');
  const [hour, minute, second] = time.split(':');
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Main parser: Extract all sections
 * @param {string} csvText - Raw CSV content
 * @returns {Object} { alerts: [], glucose: [], metadata: {} }
 */
export function parseCareLinkSections(csvText) {
  debug.log('[CSV Parser] Starting full CSV parse');
  
  // Detect section boundaries
  const boundaries = detectSections(csvText);
  
  // Parse sections
  let alerts = parseSection1(csvText, boundaries);
  const glucose = parseSection3(csvText, boundaries);
  
  // === MULTI-PUMP SUPPORT ===
  // TODO: Remove after Jan 2026 when old pump (NG4114235H) data expires from CSV exports
  // See TECH_DEBT.md for cleanup instructions
  // Check for additional pump sections (after pump replacement)
  const pumpSections = findAllSensorSections(csvText, 'Pump');
  const lines = csvText.split('\n');
  
  if (pumpSections.length > 1) {
    debug.log(`[CSV Parser] Multi-pump: ${pumpSections.length} pump sections found`);
    
    // Parse additional pump sections for alerts (skip first, already parsed)
    for (let s = 1; s < pumpSections.length; s++) {
      const section = pumpSections[s];
      const sectionLines = lines.slice(section.startLine, section.endLine + 1);
      
      // Build column mapping for this section
      const headerParts = section.headerRow.split(';');
      const columnMapping = {
        index: 0,
        date: 1,
        time: 2,
        alert: headerParts.indexOf('Alert'),
        sensorGlucose: headerParts.indexOf('Sensor Glucose (mg/dL)')
      };
      
      debug.log(`[CSV Parser] Parsing pump section ${section.serial}, alert col: ${columnMapping.alert}`);
      
      // Parse alerts from this section
      for (let i = 1; i < sectionLines.length; i++) {
        const line = sectionLines[i]?.trim();
        if (!line) continue;
        
        const parts = line.split(';');
        if (parts.length < 3) continue;
        
        const date = parts[columnMapping.date]?.trim();
        const time = parts[columnMapping.time]?.trim();
        const alert = columnMapping.alert >= 0 ? parts[columnMapping.alert]?.trim() : null;
        
        if (date && time && alert) {
          const timestamp = parseCareLinkDateTime(date, time);
          alerts.push({
            index: parts[columnMapping.index],
            timestamp,
            alert,
            glucose: null
          });
        }
      }
    }
    
    debug.log(`[CSV Parser] Total alerts after multi-pump merge: ${alerts.length}`);
  }
  
  // Extract metadata (reuse existing logic from parsers.js)
  // Note: 'lines' already declared above for multi-pump support
  const metadata = {
    name: null,
    device: null,
    deviceSerial: null,
    cgm: null
  };
  
  if (lines.length >= 3) {
    // Line 2: Patient name and serial
    const line2Parts = lines[1].split(';');
    const lastName = line2Parts[0]?.replace(/"/g, '').trim() || '';
    const firstName = line2Parts[1]?.replace(/"/g, '').trim() || '';
    if (lastName || firstName) {
      metadata.name = `${firstName} ${lastName}`.trim();
    }
    
    const serialIndex = line2Parts.findIndex(part => 
      part.replace(/"/g, '').trim() === 'Serial Number'
    );
    if (serialIndex !== -1 && serialIndex + 1 < line2Parts.length) {
      metadata.deviceSerial = line2Parts[serialIndex + 1].replace(/"/g, '').trim();
    }
  }
  
  debug.log('[CSV Parser] Parse complete', { 
    alerts: alerts.length, 
    glucose: glucose.length,
    metadata 
  });
  
  return { alerts, glucose, metadata };
}
