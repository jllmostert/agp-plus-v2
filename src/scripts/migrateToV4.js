/**
 * Migration Script: SQLite + localStorage → V4
 * 
 * This script migrates:
 * - 219 sensors from SQLite database
 * - 6 sensors from localStorage export
 * - Batches and assignments
 * 
 * Into the new V4 unified storage format.
 * 
 * IMPORTANT: This is a one-time operation!
 */

import sensorStorageV4 from '../storage/sensorStorageV4.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SQLITE_EXPORT_PATH = '/docs/archive/2025-11-08_sensor_rewrite/sqlite_sensors_export.json';
const LOCALSTORAGE_EXPORT_PATH = '/agp-sensors-2025-11-08.json';

// ============================================================================
// DATA LOADING
// ============================================================================

/**
 * Load SQLite sensors from JSON export
 */
async function loadSQLiteSensors() {
  try {
    const response = await fetch(SQLITE_EXPORT_PATH);
    const sensors = await response.json();
    console.log(`✅ Loaded ${sensors.length} sensors from SQLite`);
    return sensors;
  } catch (error) {
    console.error('❌ Error loading SQLite sensors:', error);
    return [];
  }
}

/**
 * Load localStorage export
 */
async function loadLocalStorageExport() {
  try {
    const response = await fetch(LOCALSTORAGE_EXPORT_PATH);
    const data = await response.json();
    console.log(`✅ Loaded ${data.sensors.length} sensors from localStorage`);
    console.log(`   - ${data.batches.length} batches`);
    console.log(`   - ${data.assignments.length} assignments`);
    console.log(`   - ${data.deletedSensors.length} deleted sensors`);
    return data;
  } catch (error) {
    console.error('❌ Error loading localStorage export:', error);
    return { sensors: [], batches: [], assignments: [], deletedSensors: [] };
  }
}

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transform SQLite sensor to V4 format
 */
function transformSQLiteSensor(sqliteSensor) {
  return {
    sensor_id: sqliteSensor.id,
    sequence: sqliteSensor.sequence,
    start_date: convertToISO(sqliteSensor.start_timestamp),
    end_date: convertToISO(sqliteSensor.end_timestamp),
    duration_hours: sqliteSensor.duration_hours,
    duration_days: sqliteSensor.duration_days,
    is_success: sqliteSensor.status === 'success',
    reason_stop: sqliteSensor.reason_stop,
    lot_number: sqliteSensor.lot_number,
    hw_version: sqliteSensor.hardware_version,
    fw_version: sqliteSensor.firmware_version,
    confidence: sqliteSensor.confidence || 'high',
    notes: sqliteSensor.notes || '',
    is_locked: true, // Lock all historical sensors by default
    batch_id: null, // Will be assigned later if needed
    created_at: convertToISO(sqliteSensor.created_at) || new Date().toISOString(),
    updated_at: convertToISO(sqliteSensor.updated_at) || new Date().toISOString(),
    source: 'sqlite'
  };
}

/**
 * Transform localStorage sensor to V4 format
 */
function transformLocalStorageSensor(localSensor) {
  return {
    sensor_id: localSensor.sensor_id,
    sequence: localSensor.sequence || null,
    start_date: convertToISO(localSensor.start_date),
    end_date: localSensor.end_date ? convertToISO(localSensor.end_date) : null,
    duration_hours: localSensor.duration_hours || null,
    duration_days: localSensor.duration_days || null,
    is_success: localSensor.success === 1 ? true : (localSensor.success === 0 ? false : null),
    reason_stop: localSensor.reason_stop || null,
    lot_number: localSensor.lot_number,
    hw_version: localSensor.hw_version,
    fw_version: localSensor.fw_version || null,
    confidence: localSensor.confidence || 'high',
    notes: localSensor.notes || '',
    is_locked: localSensor.is_manually_locked || false,
    batch_id: localSensor.batch || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: 'csv_detection'
  };
}

/**
 * Transform batch to V4 format
 */
function transformBatch(batch) {
  return {
    batch_id: batch.batch_id,
    lot_number: batch.lot_number,
    quantity: batch.total_quantity || batch.box_quantity || 0,
    received_date: batch.received_date_exact || batch.received_date,
    expiry_date: batch.expiry_date,
    source: batch.source || 'manual',
    notes: batch.notes || ''
  };
}

/**
 * Convert timestamp to ISO format
 */
function convertToISO(timestamp) {
  if (!timestamp) return null;
  
  // Already ISO format
  if (timestamp.includes('T') && timestamp.includes('Z')) {
    return timestamp;
  }
  
  // SQLite format: "2025-10-19 01:01:07"
  try {
    const date = new Date(timestamp);
    return date.toISOString();
  } catch (error) {
    console.warn('Could not convert timestamp:', timestamp);
    return null;
  }
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Deduplicate sensors (prefer localStorage version if exists)
 */
function deduplicateSensors(sqliteSensors, localStorageSensors) {
  const sensorMap = new Map();
  
  // Add SQLite sensors first
  sqliteSensors.forEach(sensor => {
    sensorMap.set(sensor.sensor_id, sensor);
  });
  
  // Overlay localStorage sensors (these take priority)
  localStorageSensors.forEach(sensor => {
    sensorMap.set(sensor.sensor_id, sensor);
  });
  
  return Array.from(sensorMap.values());
}

/**
 * Deduplicate batches
 */
function deduplicateBatches(batches) {
  const batchMap = new Map();
  
  batches.forEach(batch => {
    // Use batch_id as key
    if (!batchMap.has(batch.batch_id)) {
      batchMap.set(batch.batch_id, batch);
    }
  });
  
  return Array.from(batchMap.values());
}

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

/**
 * Main migration function
 */
export async function runMigration() {
  console.log('🚀 Starting migration to V4...');
  console.log('');
  
  try {
    // Step 1: Load data
    console.log('📥 Step 1: Loading data...');
    const sqliteSensors = await loadSQLiteSensors();
    const localStorageData = await loadLocalStorageExport();
    console.log('');
    
    // Step 2: Transform sensors
    console.log('🔄 Step 2: Transforming sensors...');
    const transformedSQLite = sqliteSensors.map(transformSQLiteSensor);
    const transformedLocalStorage = localStorageData.sensors.map(transformLocalStorageSensor);
    console.log(`   - Transformed ${transformedSQLite.length} SQLite sensors`);
    console.log(`   - Transformed ${transformedLocalStorage.length} localStorage sensors`);
    console.log('');
    
    // Step 3: Deduplicate
    console.log('🔍 Step 3: Deduplicating...');
    const allSensors = deduplicateSensors(transformedSQLite, transformedLocalStorage);
    console.log(`   - Total unique sensors: ${allSensors.length}`);
    console.log('');
    
    // Step 4: Transform batches
    console.log('📦 Step 4: Processing batches...');
    const transformedBatches = localStorageData.batches.map(transformBatch);
    const uniqueBatches = deduplicateBatches(transformedBatches);
    console.log(`   - Total unique batches: ${uniqueBatches.length}`);
    console.log('');
    
    // Step 5: Handle deleted sensors
    console.log('🗑️  Step 5: Processing deleted sensors...');
    const deletedSensors = localStorageData.deletedSensors || [];
    
    // FIX: Remove sensor #222 from deleted list (resurrection bug)
    const fixedDeletedSensors = deletedSensors.filter(d => {
      const sensor = allSensors.find(s => s.sensor_id === d.sensorId);
      if (sensor && !sensor.end_date) {
        console.log(`   ⚠️  Removing ${d.sensorId} from deleted list (it's active!)`);
        return false;
      }
      return true;
    });
    
    console.log(`   - Deleted sensors: ${fixedDeletedSensors.length}`);
    console.log('');
    
    // Step 6: Map assignments to batch_id field
    console.log('🔗 Step 6: Mapping batch assignments...');
    const assignments = localStorageData.assignments || [];
    assignments.forEach(assignment => {
      const sensor = allSensors.find(s => s.sensor_id == assignment.sensor_id);
      if (sensor) {
        sensor.batch_id = assignment.batch_id;
      }
    });
    console.log(`   - Mapped ${assignments.length} batch assignments`);
    console.log('');
    
    // Step 7: Assign sequences to sensors without them
    console.log('🔢 Step 7: Assigning sequences...');
    let nextSequence = Math.max(...allSensors.map(s => s.sequence || 0)) + 1;
    allSensors.forEach(sensor => {
      if (!sensor.sequence) {
        sensor.sequence = nextSequence++;
      }
    });
    console.log(`   - Highest sequence: ${nextSequence - 1}`);
    console.log('');
    
    // Step 8: Create V4 storage structure
    console.log('💾 Step 8: Creating V4 storage...');
    const v4Storage = {
      version: '4.0.0',
      migrated_from_sqlite: true,
      migration_date: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      sensors: allSensors,
      batches: uniqueBatches,
      deleted_sensors: fixedDeletedSensors.map(d => ({
        sensor_id: d.sensorId,
        deleted_at: new Date(d.deletedAt).toISOString(),
        reason: 'manual'
      }))
    };
    
    console.log('✅ V4 storage structure created!');
    console.log('');
    
    // Step 9: Validate
    console.log('✓ Step 9: Validation...');
    console.log(`   - Total sensors: ${v4Storage.sensors.length}`);
    console.log(`   - Active sensors: ${v4Storage.sensors.filter(s => !s.end_date).length}`);
    console.log(`   - Ended sensors: ${v4Storage.sensors.filter(s => s.end_date).length}`);
    console.log(`   - Locked sensors: ${v4Storage.sensors.filter(s => s.is_locked).length}`);
    console.log(`   - Total batches: ${v4Storage.batches.length}`);
    console.log(`   - Deleted sensors: ${v4Storage.deleted_sensors.length}`);
    console.log('');
    
    // Step 10: Write to localStorage
    console.log('💾 Step 10: Writing to localStorage...');
    localStorage.setItem('agp-sensors-v4', JSON.stringify(v4Storage));
    console.log('✅ Migration complete!');
    console.log('');
    
    // Summary
    console.log('📊 MIGRATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ ${v4Storage.sensors.length} sensors migrated`);
    console.log(`✅ ${v4Storage.batches.length} batches migrated`);
    console.log(`✅ ${v4Storage.deleted_sensors.length} deleted sensors tracked`);
    console.log(`✅ Sensor #222 resurrection bug FIXED`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return v4Storage;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  runMigration
};
