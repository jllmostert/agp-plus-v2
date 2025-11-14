/**
 * Sensor Storage Migration Utility
 * 
 * Migrates sensor data from localStorage to IndexedDB
 * 
 * SAFETY FIRST:
 * - Never deletes localStorage data (keep as backup)
 * - Checks for existing data before migrating
 * - Validates data integrity after migration
 * - Uses version flags to prevent double-migration
 * 
 * @version 1.0.0
 */

import indexedDB from './indexedDB.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'agp-sensors';
const MIGRATION_KEY = 'agp-migration-version';
const CURRENT_MIGRATION_VERSION = 1;

// ============================================================================
// MIGRATION STATUS
// ============================================================================

/**
 * Check if migration has already been completed
 * 
 * @returns {Object} Migration status
 */
export function getMigrationStatus() {
  try {
    const version = localStorage.getItem(MIGRATION_KEY);
    const parsedVersion = version ? parseInt(version, 10) : 0;
    
    return {
      migrated: parsedVersion >= CURRENT_MIGRATION_VERSION,
      version: parsedVersion,
      current: CURRENT_MIGRATION_VERSION
    };
  } catch (error) {
    console.error('[Migration] Error checking migration status:', error);
    return {
      migrated: false,
      version: 0,
      current: CURRENT_MIGRATION_VERSION,
      error: error.message
    };
  }
}

/**
 * Mark migration as complete
 * 
 * @returns {boolean} Success status
 */
function setMigrationComplete() {
  try {
    localStorage.setItem(MIGRATION_KEY, CURRENT_MIGRATION_VERSION.toString());
    console.log(`[Migration] Marked as complete (version ${CURRENT_MIGRATION_VERSION})`);
    return true;
  } catch (error) {
    console.error('[Migration] Error marking migration complete:', error);
    return false;
  }
}

// ============================================================================
// LOCALSTORAGE DATA ACCESS
// ============================================================================

/**
 * Get sensor data from localStorage
 * 
 * @returns {Object} Sensor database or null
 */
function getLocalStorageData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      console.log('[Migration] No localStorage data found');
      return null;
    }

    const parsed = JSON.parse(data);
    console.log(`[Migration] Found localStorage data:`, {
      sensors: parsed.sensors?.length || 0,
      batches: parsed.batches?.length || 0,
      version: parsed.version
    });

    return parsed;
  } catch (error) {
    console.error('[Migration] Error reading localStorage:', error);
    return null;
  }
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

/**
 * Validate sensor data structure
 * 
 * @param {Array} sensors - Sensor array to validate
 * @returns {Object} Validation result
 */
function validateSensorData(sensors) {
  if (!Array.isArray(sensors)) {
    return {
      valid: false,
      error: 'Sensors is not an array'
    };
  }

  if (sensors.length === 0) {
    return {
      valid: true,
      warning: 'Sensor array is empty'
    };
  }

  // Check required fields
  const requiredFields = ['sensor_id', 'start_date'];
  const invalidSensors = sensors.filter(s => 
    !s || typeof s !== 'object' || 
    requiredFields.some(field => !s[field])
  );

  if (invalidSensors.length > 0) {
    return {
      valid: false,
      error: `${invalidSensors.length} sensors missing required fields`,
      invalidSensors: invalidSensors.slice(0, 3) // Show first 3
    };
  }

  return {
    valid: true,
    count: sensors.length
  };
}

// ============================================================================
// MIGRATION EXECUTION
// ============================================================================

/**
 * Migrate sensors from localStorage to IndexedDB
 * 
 * SAFETY: This function NEVER deletes localStorage data!
 * 
 * @param {Object} options - Migration options
 * @param {boolean} options.force - Force migration even if already done
 * @param {boolean} options.dryRun - Don't actually write, just validate
 * @returns {Promise<Object>} Migration result
 */
export async function migrateSensorsToIndexedDB(options = {}) {
  const { force = false, dryRun = false } = options;
  
  console.log('[Migration] Starting sensor migration...', { force, dryRun });

  // Step 1: Check IndexedDB support
  if (!indexedDB.isSupported()) {
    return {
      success: false,
      error: 'IndexedDB not supported in this browser'
    };
  }

  // Step 2: Check if already migrated
  const status = getMigrationStatus();
  if (status.migrated && !force) {
    console.log('[Migration] Already migrated (version', status.version, ')');
    return {
      success: true,
      alreadyMigrated: true,
      version: status.version
    };
  }

  // Step 3: Get localStorage data
  const localData = getLocalStorageData();
  if (!localData || !localData.sensors) {
    return {
      success: true,
      noData: true,
      message: 'No localStorage data to migrate'
    };
  }

  // Step 4: Validate data
  const validation = validateSensorData(localData.sensors);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      details: validation.invalidSensors
    };
  }

  if (dryRun) {
    console.log('[Migration] Dry run - validation passed');
    return {
      success: true,
      dryRun: true,
      validated: true,
      sensorCount: localData.sensors.length
    };
  }

  // Step 5: Initialize IndexedDB
  try {
    await indexedDB.initDB();
    console.log('[Migration] IndexedDB initialized');
  } catch (error) {
    return {
      success: false,
      error: 'Failed to initialize IndexedDB',
      details: error.message
    };
  }

  // Step 6: Check for existing data in IndexedDB
  let existingSensors = [];
  try {
    existingSensors = await indexedDB.getAllSensors();
    console.log(`[Migration] Found ${existingSensors.length} existing sensors in IndexedDB`);
  } catch (error) {
    console.warn('[Migration] Could not read existing sensors:', error);
    // Continue anyway - might be first time
  }

  // Step 7: Migrate sensors
  try {
    console.log(`[Migration] Migrating ${localData.sensors.length} sensors...`);
    
    // Use saveSensors for bulk operation
    const result = await indexedDB.saveSensors(localData.sensors);
    
    console.log('[Migration] Sensors migrated successfully:', {
      total: localData.sensors.length,
      saved: result.count || localData.sensors.length
    });

    // Step 8: Verify migration
    const verifyResult = await verifySensorsMigration(localData.sensors);
    
    if (!verifyResult.valid) {
      console.error('[Migration] Verification failed:', verifyResult);
      return {
        success: false,
        error: 'Migration verification failed',
        details: verifyResult
      };
    }

    console.log('[Migration] Verification passed');

    // Step 9: Mark as complete (even if verification has warnings)
    setMigrationComplete();

    return {
      success: true,
      migrated: true,
      sensorCount: localData.sensors.length,
      existingCount: existingSensors.length,
      verification: verifyResult,
      message: 'Sensors migrated successfully to IndexedDB'
    };

  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    return {
      success: false,
      error: 'Migration failed during execution',
      details: error.message,
      stack: error.stack
    };
  }
}

/**
 * Verify sensors were migrated correctly
 * 
 * @param {Array} originalSensors - Original sensor array
 * @returns {Promise<Object>} Verification result
 */
async function verifySensors(originalSensors) {
  try {
    const migratedSensors = await indexedDB.getAllSensors();
    
    console.log('[Migration] Verifying sensors:', {
      original: originalSensors.length,
      migrated: migratedSensors.length
    });

    // Check counts
    if (migratedSensors.length < originalSensors.length) {
      return {
        valid: false,
        error: 'Count mismatch',
        original: originalSensors.length,
        migrated: migratedSensors.length,
        missing: originalSensors.length - migratedSensors.length
      };
    }

    // Create lookup map by sensor_id
    const migratedMap = new Map(
      migratedSensors.map(s => [s.sensor_id, s])
    );

    // Check all original sensors exist
    const missing = originalSensors.filter(
      orig => !migratedMap.has(orig.sensor_id)
    );

    if (missing.length > 0) {
      return {
        valid: false,
        error: 'Missing sensors after migration',
        missingSensorIds: missing.slice(0, 5).map(s => s.sensor_id)
      };
    }

    // Optional: Check data integrity (sample check)
    const sample = originalSensors.slice(0, 5);
    const mismatches = [];

    for (const orig of sample) {
      const migrated = migratedMap.get(orig.sensor_id);
      
      // Check critical fields
      if (migrated.start_date !== orig.start_date ||
          migrated.end_date !== orig.end_date ||
          migrated.batch_id !== orig.batch_id) {
        mismatches.push({
          sensor_id: orig.sensor_id,
          field: 'dates/batch',
          original: {
            start_date: orig.start_date,
            end_date: orig.end_date,
            batch_id: orig.batch_id
          },
          migrated: {
            start_date: migrated.start_date,
            end_date: migrated.end_date,
            batch_id: migrated.batch_id
          }
        });
      }
    }

    if (mismatches.length > 0) {
      return {
        valid: false,
        error: 'Data integrity check failed',
        mismatches
      };
    }

    return {
      valid: true,
      count: migratedSensors.length,
      verified: sample.length
    };

  } catch (error) {
    console.error('[Migration] Verification error:', error);
    return {
      valid: false,
      error: 'Verification failed with exception',
      details: error.message
    };
  }
}

// ============================================================================
// ROLLBACK (FUTURE)
// ============================================================================

/**
 * Rollback migration (delete IndexedDB data, restore localStorage as primary)
 * 
 * NOT IMPLEMENTED YET - For emergency use only
 * 
 * @returns {Promise<Object>} Rollback result
 */
export async function rollbackMigration() {
  console.warn('[Migration] Rollback not implemented yet');
  return {
    success: false,
    error: 'Rollback not implemented',
    message: 'localStorage data is still intact - you can continue using the app'
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get migration statistics
 * 
 * @returns {Promise<Object>} Migration stats
 */
export async function getMigrationStats() {
  try {
    const status = getMigrationStatus();
    const localData = getLocalStorageData();
    
    let indexedDBCount = 0;
    let indexedDBSize = 0;

    if (indexedDB.isSupported()) {
      try {
        await indexedDB.initDB();
        const sensors = await indexedDB.getAllSensors();
        indexedDBCount = sensors.length;
        
        // Rough size estimate
        indexedDBSize = JSON.stringify(sensors).length;
      } catch (error) {
        console.warn('[Migration] Could not get IndexedDB stats:', error);
      }
    }

    const localStorageCount = localData?.sensors?.length || 0;
    const localStorageSize = localData ? JSON.stringify(localData).length : 0;

    return {
      migration: status,
      localStorage: {
        count: localStorageCount,
        size: localStorageSize,
        sizeMB: (localStorageSize / (1024 * 1024)).toFixed(2)
      },
      indexedDB: {
        supported: indexedDB.isSupported(),
        count: indexedDBCount,
        size: indexedDBSize,
        sizeMB: (indexedDBSize / (1024 * 1024)).toFixed(2)
      }
    };
  } catch (error) {
    console.error('[Migration] Error getting stats:', error);
    return {
      error: error.message
    };
  }
}

/**
 * Force clear migration flag (for testing)
 * 
 * WARNING: Only use for development/testing!
 * 
 * @returns {boolean} Success status
 */
export function resetMigrationFlag() {
  try {
    localStorage.removeItem(MIGRATION_KEY);
    console.warn('[Migration] Migration flag reset - migration will run again');
    return true;
  } catch (error) {
    console.error('[Migration] Error resetting flag:', error);
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  migrateSensorsToIndexedDB,
  getMigrationStatus,
  getMigrationStats,
  rollbackMigration,
  resetMigrationFlag
};
