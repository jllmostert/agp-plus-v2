/**
 * useSensorDatabase.js
 * Hook for loading and querying Guardian 4 sensor SQLite database
 * 
 * Database schema:
 * - id: INTEGER PRIMARY KEY
 * - start_timestamp: TEXT (ISO format)
 * - end_timestamp: TEXT (ISO format) 
 * - duration_hours: INTEGER
 * - duration_days: REAL
 * - reason_stop: TEXT (failure reason if any)
 * - status: TEXT (e.g., "success", "failed")
 * - confidence: TEXT
 * - lot_number: TEXT
 * - hardware_version: TEXT (A1.01, A2.01, etc)
 * - firmware_version: TEXT
 * - notes: TEXT
 * - csv_source: TEXT
 * - sequence: INTEGER
 * 
 * @returns {Object} {
 *   sensors: Array of all sensor records,
 *   isLoading: boolean,
 *   error: string | null,
 *   reload: function to force refresh
 * }
 */

import { useState, useEffect } from 'react';
import initSqlJs from 'sql.js';
import { debug } from '../utils/debug.js';

// Database will be served from /public/sensor_database.db
// (we need to copy it there first)
const DB_PATH = '/sensor_database.db';

export function useSensorDatabase() {
  const [sensors, setSensors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [db, setDb] = useState(null);

  // Load database on mount
  useEffect(() => {
    loadDatabase();
  }, []);

  const loadDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize sql.js (WASM binary from CDN)
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // Fetch database from public directory
      const response = await fetch(DB_PATH);
      
      if (!response.ok) {
        throw new Error(`Failed to load database: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      
      const database = new SQL.Database(new Uint8Array(buffer));
      setDb(database);

      // Query all sensors
      // Success criteria: sensor lasted ≥6.75 days (6 days 18 hours)
      const result = database.exec(`
        SELECT 
          id as sensor_id,
          start_timestamp as start_date,
          end_timestamp as end_date,
          duration_days,
          duration_hours,
          lot_number,
          hardware_version as hw_version,
          status,
          reason_stop as failure_reason,
          notes,
          CASE 
            WHEN duration_days >= 6.75 THEN 1
            ELSE 0
          END as success
        FROM sensors
        ORDER BY start_timestamp DESC
      `);

      if (result.length === 0) {
        setSensors([]);
        return;
      }

      // Convert to array of objects
      const columns = result[0].columns;
      const rows = result[0].values;
      
      const sensorData = rows.map(row => {
        const sensor = {};
        columns.forEach((col, index) => {
          sensor[col] = row[index];
        });
        return sensor;
      });

      debug.log('[useSensorDatabase] Loaded sensors from SQLite:', {
        count: sensorData.length,
        firstSensor: sensorData[0],
        lastSensor: sensorData[sensorData.length - 1]
      });

      setSensors(sensorData);

    } catch (err) {
      debug.error('[useSensorDatabase] Failed to load sensor database:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload database
  const reload = () => {
    loadDatabase();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (db) {
        db.close();
      }
    };
  }, [db]);

  return {
    sensors,
    isLoading,
    error,
    reload
  };
}
