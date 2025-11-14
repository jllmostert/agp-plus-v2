/**
 * SENSOR IMPORT - SQLite and JSON Support
 * Import sensor history from external SQLite database or JSON export
 * V4.2.0 - Enhanced with JSON import support
 */

import initSqlJs from 'sql.js';
import { addSensor } from './sensorStorage.js';

/**
 * Import sensors from SQLite database file
 * @param {File} file - SQLite database file from file input
 * @returns {Promise<{success: boolean, count: number, errors: string[], skipped: number}>}
 */
export async function importSensorsFromFile(file) {
  // Detect file type
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.json')) {
    return await importSensorsFromJSON(file);
  } else if (fileName.endsWith('.db') || fileName.endsWith('.sqlite')) {
    return await importSensorsFromSQLite(file);
  } else {
    return {
      success: false,
      count: 0,
      skipped: 0,
      errors: ['Unsupported file type. Please use .json, .db, or .sqlite files.']
    };
  }
}

/**
 * Import sensors from JSON export file
 * @param {File} file - JSON file with sensor data
 * @returns {Promise<{success: boolean, count: number, errors: string[], skipped: number}>}
 */
async function importSensorsFromJSON(file) {
  const errors = [];
  let count = 0;
  let skipped = 0;

  try {
    // Parse JSON
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate structure
    if (!data.sensors || !Array.isArray(data.sensors)) {
      return {
        success: false,
        count: 0,
        skipped: 0,
        errors: ['Invalid JSON format: missing or invalid "sensors" array']
      };
    }

    // Import each sensor
    for (const sensor of data.sensors) {
      try {
        // Convert JSON format to internal format if needed
        const normalizedSensor = normalizeSensorData(sensor);
        
        // Try to add sensor
        const result = await addSensor(normalizedSensor);
        
        if (result.skipped) {
          skipped++;
        } else {
          count++;
        }
      } catch (err) {
        // Check if it's a duplicate error
        if (err.message && err.message.includes('already exists')) {
          skipped++;
        } else {
          errors.push(`Failed to import sensor ${sensor.id || 'unknown'}: ${err.message}`);
        }
      }
    }

    return {
      success: true,
      count,
      skipped,
      errors: errors.length > 0 ? errors : null
    };

  } catch (error) {
    return {
      success: false,
      count,
      skipped,
      errors: [`JSON import failed: ${error.message}`]
    };
  }
}

/**
 * Import sensors from SQLite database file
 * @param {File} file - SQLite database file
 * @returns {Promise<{success: boolean, count: number, errors: string[], skipped: number}>}
 */
async function importSensorsFromSQLite(file) {
  const errors = [];
  let count = 0;
  let skipped = 0;

  try {
    // Initialize sql.js
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(arrayBuffer));

    // Query all sensors
    const results = db.exec(`
      SELECT 
        id,
        start_timestamp,
        end_timestamp,
        duration_hours,
        duration_days,
        reason_stop,
        status,
        confidence,
        lot_number,
        notes
      FROM sensors
      ORDER BY start_timestamp ASC
    `);

    if (!results.length || !results[0].values.length) {
      db.close();
      return { success: false, count: 0, skipped: 0, errors: ['No sensors found in database'] };
    }

    // Convert and store each sensor
    const sensors = results[0].values;
    for (const row of sensors) {
      try {
        const sensor = normalizeSQLiteSensor(row);
        
        const result = await addSensor(sensor);
        
        if (result.skipped) {
          skipped++;
        } else {
          count++;
        }
      } catch (err) {
        if (err.message && err.message.includes('already exists')) {
          skipped++;
        } else {
          errors.push(`Failed to import sensor ${row[0]}: ${err.message}`);
        }
      }
    }

    db.close();

    return {
      success: true,
      count,
      skipped,
      errors: errors.length > 0 ? errors : null
    };

  } catch (error) {
    return {
      success: false,
      count,
      skipped,
      errors: [`SQLite import failed: ${error.message}`]
    };
  }
}

/**
 * Normalize sensor data from JSON export format
 * @param {Object} sensor - Raw sensor data from JSON
 * @returns {Object} Normalized sensor object
 */
function normalizeSensorData(sensor) {
  return {
    id: sensor.id,
    sequence: sensor.sequence,
    start_date: sensor.start_date,
    end_date: sensor.end_date || null,
    duration_hours: sensor.duration_hours,
    duration_days: sensor.duration_days,
    lot_number: sensor.lot_number || null,
    hw_version: sensor.hw_version || null,
    notes: sensor.notes || '',
    is_locked: sensor.is_locked !== undefined ? sensor.is_locked : false,
    batch_id: sensor.batch_id || null
  };
}

/**
 * Normalize sensor data from SQLite row
 * @param {Array} row - SQLite query result row
 * @returns {Object} Normalized sensor object
 */
function normalizeSQLiteSensor(row) {
  return {
    id: row[0],
    start_date: row[1],
    end_date: row[2] || null,
    duration_hours: row[3],
    duration_days: row[4],
    reason_stop: row[5] || null,
    status: row[6] || null,
    confidence: row[7] || null,
    lot_number: row[8] || null,
    notes: row[9] || ''
  };
}

/**
 * Validate sensor import file without importing (dry-run)
 * @param {File} file - File to validate
 * @returns {Promise<{valid: boolean, format: string, sensorCount: number, errors: string[]}>}
 */
export async function validateSensorImportFile(file) {
  const fileName = file.name.toLowerCase();
  const errors = [];
  
  try {
    if (fileName.endsWith('.json')) {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.sensors || !Array.isArray(data.sensors)) {
        errors.push('Missing or invalid "sensors" array');
        return { valid: false, format: 'json', sensorCount: 0, errors };
      }
      
      return {
        valid: true,
        format: 'json',
        sensorCount: data.sensors.length,
        version: data.version || 'unknown',
        exportDate: data.last_updated || data.exportDate || 'unknown',
        errors: null
      };
      
    } else if (fileName.endsWith('.db') || fileName.endsWith('.sqlite')) {
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      
      const arrayBuffer = await file.arrayBuffer();
      const db = new SQL.Database(new Uint8Array(arrayBuffer));
      
      try {
        const results = db.exec('SELECT COUNT(*) FROM sensors');
        const count = results[0]?.values[0]?.[0] || 0;
        
        db.close();
        
        return {
          valid: true,
          format: 'sqlite',
          sensorCount: count,
          errors: null
        };
      } catch (err) {
        db.close();
        errors.push('Invalid SQLite database or missing sensors table');
        return { valid: false, format: 'sqlite', sensorCount: 0, errors };
      }
    } else {
      errors.push('Unsupported file type');
      return { valid: false, format: 'unknown', sensorCount: 0, errors };
    }
  } catch (error) {
    errors.push(error.message);
    return { valid: false, format: 'unknown', sensorCount: 0, errors };
  }
}
