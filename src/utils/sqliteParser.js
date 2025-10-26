/**
 * SQLite Parser Utility
 * 
 * Parses master_sensors.db (SQLite) in browser using sql.js.
 * Converts SQLite binary to JSON for IndexedDB storage.
 * 
 * @module sqliteParser
 * @version 3.6.0
 */

import initSqlJs from 'sql.js';

/**
 * Parse SQLite database file to JSON
 * 
 * @param {File} file - SQLite database file (.db)
 * @returns {Promise<Object>} Parsed database with sensors and inventory
 */
export async function parseSQLiteDatabase(file) {
  // Read file as ArrayBuffer
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  
  // Initialize sql.js
  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });
  
  // Load database
  const db = new SQL.Database(data);
  
  // Query sensors table
  const sensorQuery = `
    SELECT 
      id, start_timestamp, end_timestamp, duration_hours, duration_days,
      reason_stop, status, confidence, lot_number, hardware_version,
      firmware_version, notes, csv_source, sequence
    FROM sensors
    ORDER BY start_timestamp
  `;
  
  const sensorResult = db.exec(sensorQuery);
  const sensors = [];
  
  if (sensorResult.length > 0) {
    const columns = sensorResult[0].columns;
    const values = sensorResult[0].values;
    
    values.forEach(row => {
      const sensor = {};
      columns.forEach((col, i) => {
        sensor[col] = row[i];
      });
      sensors.push(sensor);
    });
  }
  
  // Query inventory table
  const inventoryQuery = `
    SELECT 
      lot_number, quantity, expiry_date, box_size, notes
    FROM inventory
    ORDER BY expiry_date
  `;
  
  const inventoryResult = db.exec(inventoryQuery);
  const inventory = [];
  
  if (inventoryResult.length > 0) {
    const columns = inventoryResult[0].columns;
    const values = inventoryResult[0].values;
    
    values.forEach(row => {
      const item = {};
      columns.forEach((col, i) => {
        item[col] = row[i];
      });
      inventory.push(item);
    });
  }
  
  // Close database
  db.close();
  
  return {
    sensors,
    inventory,
    metadata: {
      filename: file.name,
      importedAt: new Date().toISOString(),
      sensorCount: sensors.length,
      inventoryCount: inventory.length
    }
  };
}
