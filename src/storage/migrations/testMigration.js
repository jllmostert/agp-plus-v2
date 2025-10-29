/**
 * Migration Test Script
 * 
 * Quick manual test to verify migration logic.
 * Open browser console and run:
 * 
 *   import { testMigration } from './storage/migrations/testMigration.js';
 *   await testMigration();
 * 
 * Or add a temporary button in the UI that calls testMigration().
 */

import { migrateToV3, resetMigration } from './migrateToV3.js';
import { getMasterDatasetStats } from '../masterDatasetStorage.js';
import { getEventStats } from '../eventStorage.js';
import { getRecord, STORES } from '../db.js';

/**
 * Run migration test
 * @param {boolean} forceReset - Reset before testing (default: false)
 */
export async function testMigration(forceReset = false) {
  
  try {
    // Optional: Reset for clean test
    if (forceReset) {
      await resetMigration();
    }
    
    // Run migration
    const result = await migrateToV3();
    
    // Display results
    
    if (result.alreadyMigrated) {
      return result;
    }
    
    if (result.freshInstall) {
      return result;
    }
    
    
    if (result.errors.length > 0) {
      result.errors.forEach((err, i) => {
      });
    }
    
    // Verify master dataset
    
    const masterStats = await getMasterDatasetStats();
    
    const eventStats = await getEventStats();
    
    // Check if cache exists
    const cache = await getRecord(STORES.MASTER_DATASET, 'cache');
    const cacheExists = cache && cache.allReadings && cache.allReadings.length > 0;
    
    // Success checks
    const checks = {
      'Migration succeeded': result.success,
      'Readings imported': masterStats.totalReadings > 0,
      'Cache exists': cacheExists,
      'Events detected': eventStats.totalSensors > 0 || eventStats.totalCartridges > 0
    };
    
    Object.entries(checks).forEach(([name, passed]) => {
    });
    
    
    return result;
    
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    throw err;
  }
}

/**
 * Quick idempotency test
 * Runs migration twice and verifies same result
 */
export async function testIdempotency() {
  
  // First run
  const result1 = await migrateToV3();
  
  // Second run (should detect already migrated)
  const result2 = await migrateToV3();
  
  if (result2.alreadyMigrated) {
    return true;
  } else {
    console.error('❌ Idempotency test FAILED - migration ran twice!');
    return false;
  }
}
