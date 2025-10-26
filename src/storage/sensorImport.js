/**
 * SENSOR IMPORT - SQLite to IndexedDB
 * Import sensor history from external SQLite database
 */

import initSqlJs from 'sql.js';
import { addSensor } from './sensorStorage.js';

/**
 * Import sensors from SQLite database file
 * @param {File} file - SQLite database file from file input
 * @returns {Promise<{success: boolean, count: number, errors: string[]}>}
 */
export async function importSensorsFromFile(file) {
  const errors = [];
  let count = 0;

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
      return { success: false, count: 0, errors: ['No sensors found in database'] };
    }

    // Convert and store each sensor
    const sensors = results[0].values;
    for (const row of sensors) {
      try {
        const sensor = {
          id: row[0],
          startTimestamp: row[1],
          endTimestamp: row[2],
          durationHours: row[3],
          durationDays: row[4],
          reasonStop: row[5],
          status: row[6],
          confidence: row[7],
          lotNumber: row[8],
          notes: row[9]
        };

        await addSensor(sensor);
        count++;
      } catch (err) {
        errors.push(`Failed to import sensor ${row[0]}: ${err.message}`);
      }
    }

    db.close();

    return {
      success: true,
      count,
      errors: errors.length > 0 ? errors : null
    };

  } catch (error) {
    return {
      success: false,
      count,
      errors: [`Import failed: ${error.message}`]
    };
  }
}
