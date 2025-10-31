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
import { 
  getSensorHistory, 
  syncUnlockedSensorsToLocalStorage,
  migrateDeletedSensors,
  cleanupOldDeletedSensors
} from '../storage/sensorStorage.js';

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
        // Add storage source indicators for SQLite sensors
        sensor.storageSource = 'sqlite';
        sensor.isEditable = false;
        return sensor;
      });

      debug.log('[useSensorDatabase] Loaded sensors from SQLite:', {
        count: sensorData.length,
        firstSensor: sensorData[0],
        lastSensor: sensorData[sensorData.length - 1]
      });

      // MERGE: Add localStorage sensors (CSV-detected sensors)
      const localStorageSensors = getSensorHistory();
      debug.log('[useSensorDatabase] localStorage sensors:', {
        count: localStorageSensors.length
      });

      // Helper: Determine status and success for localStorage sensors
      const calculateSensorStatus = (sensor) => {
        const now = new Date();
        const startDate = new Date(sensor.start_date);
        
        // If no end_date, sensor is still running
        if (!sensor.end_date) {
          const daysRunning = (now - startDate) / (1000 * 60 * 60 * 24);
          return {
            status: 'running',
            success: null, // Not determined yet
            duration_days: daysRunning,
            duration_hours: daysRunning * 24
          };
        }
        
        // If end_date exists, calculate duration and determine success
        const endDate = new Date(sensor.end_date);
        const durationMs = endDate - startDate;
        const durationDays = durationMs / (1000 * 60 * 60 * 24);
        const durationHours = durationMs / (1000 * 60 * 60);
        
        // Success if sensor lasted ≥6.75 days (6 days 18 hours)
        const success = durationDays >= 6.75 ? 1 : 0;
        
        return {
          status: success ? 'success' : 'failed',
          success,
          duration_days: durationDays,
          duration_hours: durationHours
        };
      };

      // Convert localStorage format to match SQLite format
      const localSensorsConverted = localStorageSensors.map(s => {
        const statusInfo = calculateSensorStatus(s);
        return {
          sensor_id: s.sensor_id,
          start_date: s.start_date,
          end_date: s.end_date,
          duration_days: statusInfo.duration_days,
          duration_hours: statusInfo.duration_hours,
          lot_number: s.lot_number,
          hw_version: s.hw_version,
          status: statusInfo.status,
          failure_reason: s.reason_stop,
          notes: s.notes,
          success: statusInfo.success,
          storageSource: 'localStorage',
          isEditable: true
        };
      });

      // Merge: localStorage sensors first (newest), then SQLite
      // WITH DEDUPLICATION: Prefer localStorage version (newer data)
      const sensorMap = new Map();
      
      // Add localStorage sensors first (these are most recent/accurate)
      localSensorsConverted.forEach(s => {
        sensorMap.set(s.sensor_id, s);
      });
      
      // Add SQLite sensors only if NOT already in map (avoid duplicates)
      sensorData.forEach(s => {
        if (!sensorMap.has(s.sensor_id)) {
          sensorMap.set(s.sensor_id, s);
        }
      });
      
      const allSensors = Array.from(sensorMap.values());

      debug.log('[useSensorDatabase] Total sensors (merged with deduplication):', {
        count: allSensors.length,
        localStorage: localSensorsConverted.length,
        sqlite: sensorData.length,
        rawTotal: localSensorsConverted.length + sensorData.length,
        duplicatesRemoved: (localSensorsConverted.length + sensorData.length) - allSensors.length,
        runningSensors: allSensors.filter(s => s.status === 'running').length
      });

      // PHASE 2A: RESURRECTION BUG FIX
      // Migrate old deleted sensors to persistent store (one-time migration)
      const migrationResult = migrateDeletedSensors();
      if (migrationResult.migrated > 0) {
        debug.log('[useSensorDatabase] Migrated deleted sensors:', migrationResult);
      }
      
      // Cleanup deleted sensors older than 90 days
      const cleanupResult = cleanupOldDeletedSensors();
      if (cleanupResult.removed > 0) {
        debug.log('[useSensorDatabase] Cleaned up old deleted sensors:', cleanupResult);
      }

      // SYNC UNLOCKED SENSORS TO LOCALSTORAGE
      // This ensures all "workable" sensors (≤30 days old) are in localStorage
      // so DELETE operations work on them. Locked sensors stay in SQLite only.
      await syncUnlockedSensorsToLocalStorage(allSensors);

      setSensors(allSensors);

    } catch (err) {
      debug.error('[useSensorDatabase] Failed to load sensor database:', err);
      debug.log('[useSensorDatabase] Falling back to localStorage sensors only');
      
      // FALLBACK: Load localStorage sensors even if SQLite fails
      try {
        const localStorageSensors = getSensorHistory();
        
        const calculateSensorStatus = (sensor) => {
          const now = new Date();
          const startDate = new Date(sensor.start_date);
          
          if (!sensor.end_date) {
            const daysRunning = (now - startDate) / (1000 * 60 * 60 * 24);
            return {
              status: 'running',
              success: null,
              duration_days: daysRunning,
              duration_hours: daysRunning * 24
            };
          }
          
          const endDate = new Date(sensor.end_date);
          const durationMs = endDate - startDate;
          const durationDays = durationMs / (1000 * 60 * 60 * 24);
          const durationHours = durationMs / (1000 * 60 * 60);
          const success = durationDays >= 6.75 ? 1 : 0;
          
          return {
            status: success ? 'success' : 'failed',
            success,
            duration_days: durationDays,
            duration_hours: durationHours
          };
        };
        
        const localSensorsConverted = localStorageSensors.map(s => {
          const statusInfo = calculateSensorStatus(s);
          return {
            sensor_id: s.sensor_id,
            start_date: s.start_date,
            end_date: s.end_date,
            duration_days: statusInfo.duration_days,
            duration_hours: statusInfo.duration_hours,
            lot_number: s.lot_number,
            hw_version: s.hw_version,
            status: statusInfo.status,
            failure_reason: s.reason_stop,
            notes: s.notes,
            success: statusInfo.success,
            storageSource: 'localStorage',
            isEditable: true
          };
        });
        
        setSensors(localSensorsConverted);
        debug.log('[useSensorDatabase] Loaded localStorage sensors as fallback:', {
          count: localSensorsConverted.length
        });
      } catch (fallbackErr) {
        debug.error('[useSensorDatabase] Failed to load localStorage fallback:', fallbackErr);
      }
      
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
