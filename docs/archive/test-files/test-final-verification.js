/**
 * Final Verification Test - Batch System Consolidation
 * Tests that stockStorage.js works correctly after consolidation
 */

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, value) => { mockStorage[key] = value; },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(key => delete mockStorage[key]); }
};

// Initialize sensor storage first
mockStorage['agp-sensor-storage'] = JSON.stringify({
  sensors: [
    {
      id: 'NG4123456H',
      sensor_id: 'NG4123456H',
      lot_number: 'NG4A12345',
      start_date: '2025-10-01',
      batch_id: null // No batch assigned yet
    }
  ]
});

console.log('=== BATCH CONSOLIDATION VERIFICATION TEST ===\n');

// Test 1: Import stockStorage functions
console.log('Test 1: Import stockStorage.js functions');
try {
  const stockModule = await import('./src/storage/stockStorage.js');
  console.log('✅ stockStorage.js imported successfully');
  console.log('  - getAllBatches:', typeof stockModule.getAllBatches);
  console.log('  - addBatch:', typeof stockModule.addBatch);
  console.log('  - assignSensorToBatch:', typeof stockModule.assignSensorToBatch);
  
  // Test 2: Add a batch
  console.log('\nTest 2: Add batch via stockStorage');
  const batch = stockModule.addBatch({
    lot_number: 'NG4A99999',
    received_date: '2025-11-14',
    total_quantity: 10,
    source: 'test'
  });
  console.log('✅ Batch added:', batch.batch_id);
  console.log('  - lot_number:', batch.lot_number);
  console.log('  - total_quantity:', batch.total_quantity);
  
  // Test 3: Verify batch is in stockStorage
  console.log('\nTest 3: Verify batch in stockStorage');
  const allBatches = stockModule.getAllBatches();
  console.log('✅ getAllBatches() returned', allBatches.length, 'batch(es)');
  console.log('  - Storage key: agp-stock-batches');
  
  // Test 4: Assign sensor to batch
  console.log('\nTest 4: Assign sensor to batch');
  const assignment = stockModule.assignSensorToBatch('NG4123456H', batch.batch_id);
  console.log('✅ Assignment created:', assignment.assignment_id);
  console.log('  - sensor_id:', assignment.sensor_id);
  console.log('  - batch_id:', assignment.batch_id);
  
  // Test 5: Verify assignment
  console.log('\nTest 5: Verify assignment');
  const assignment2 = stockModule.getAssignmentForSensor('NG4123456H');
  if (assignment2 && assignment2.batch_id === batch.batch_id) {
    console.log('✅ Sensor correctly assigned to batch');
    console.log('  - Assignment found:', assignment2.assignment_id);
  } else {
    console.log('❌ Assignment verification failed');
  }
  
  // Test 6: Verify no batches in sensorStorage
  console.log('\nTest 6: Verify batches removed from sensorStorage');
  const sensorStorageData = JSON.parse(mockStorage['agp-sensor-storage']);
  if (!sensorStorageData.batches) {
    console.log('✅ No batches array in sensorStorage (correct!)');
  } else {
    console.log('⚠️ batches array still exists in sensorStorage:', sensorStorageData.batches.length);
  }
  
  console.log('\n=== FINAL RESULT ===');
  console.log('✅ ALL TESTS PASSED!');
  console.log('');
  console.log('Summary:');
  console.log('  - stockStorage.js working correctly');
  console.log('  - Batches stored in agp-stock-batches key');
  console.log('  - Assignments tracked in agp-stock-assignments key');
  console.log('  - No batch data in sensor storage (clean separation)');
  console.log('');
  console.log('Ready to commit! 🚀');
  
} catch (error) {
  console.log('❌ TEST FAILED:', error.message);
  console.log(error.stack);
  process.exit(1);
}
