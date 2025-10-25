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
  console.log('='.repeat(60));
  console.log('🧪 MIGRATION TEST');
  console.log('='.repeat(60));
  
  try {
    // Optional: Reset for clean test
    if (forceReset) {
      console.log('\n⚠️ Resetting migration...');
      await resetMigration();
      console.log('✅ Reset complete\n');
    }
    
    // Run migration
    console.log('🔮 Starting migration...\n');
    const result = await migrateToV3();
    
    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION RESULTS');
    console.log('='.repeat(60));
    console.log('Success:', result.success);
    console.log('Total time:', result.totalTime + 's');
    
    if (result.alreadyMigrated) {
      console.log('Already migrated (idempotency test passed ✅)');
      return result;
    }
    
    if (result.freshInstall) {
      console.log('Fresh install (no v2.x data)');
      return result;
    }
    
    console.log('Uploads processed:', result.uploadsProcessed);
    console.log('Uploads failed:', result.uploadsFailed);
    console.log('Total readings:', result.totalReadings);
    console.log('Sensors detected:', result.eventsBackfilled.sensors);
    console.log('Cartridges detected:', result.eventsBackfilled.cartridges);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ ERRORS:');
      result.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. Upload ${err.uploadId}:`, err.errors);
      });
    }
    
    // Verify master dataset
    console.log('\n' + '='.repeat(60));
    console.log('🔍 VERIFICATION');
    console.log('='.repeat(60));
    
    const masterStats = await getMasterDatasetStats();
    console.log('Master dataset:', masterStats);
    
    const eventStats = await getEventStats();
    console.log('Event stats:', eventStats);
    
    // Check if cache exists
    const cache = await getRecord(STORES.MASTER_DATASET, 'cache');
    const cacheExists = cache && cache.readings && cache.readings.length > 0;
    
    // Success checks
    const checks = {
      'Migration succeeded': result.success,
      'Readings imported': masterStats.totalReadings > 0,
      'Cache exists': cacheExists,
      'Events detected': eventStats.totalSensors > 0 || eventStats.totalCartridges > 0
    };
    
    console.log('\n✅ Checks:');
    Object.entries(checks).forEach(([name, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${name}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
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
  console.log('🔁 Testing idempotency (running migration twice)...\n');
  
  // First run
  const result1 = await migrateToV3();
  console.log('First run:', result1.success ? '✅' : '❌');
  
  // Second run (should detect already migrated)
  const result2 = await migrateToV3();
  console.log('Second run:', result2.alreadyMigrated ? '✅ (already migrated)' : '❌ (unexpected)');
  
  if (result2.alreadyMigrated) {
    console.log('✅ Idempotency test PASSED');
    return true;
  } else {
    console.error('❌ Idempotency test FAILED - migration ran twice!');
    return false;
  }
}
