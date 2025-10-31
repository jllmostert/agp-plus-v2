/**
 * TEST TOMBSTONE STORE - Browser Console Tests
 * 
 * Run these tests in browser console to verify IndexedDB implementation.
 * Copy/paste functions one by one to test.
 * 
 * Usage:
 * 1. Open http://localhost:3001
 * 2. Open browser DevTools console
 * 3. Copy/paste test functions
 * 4. Run: await testTombstoneStore()
 */

// Import tombstone functions (if in module context)
// import { ... } from './src/storage/deletedSensorsDB.js';

/**
 * Test 1: Basic Add/Get
 */
async function testBasicAddGet() {
  console.log('\n=== TEST 1: Basic Add/Get ===');
  
  // Add tombstone
  const testSensorId = 'TEST-' + Date.now();
  console.log('Adding tombstone:', testSensorId);
  
  // Access from window (if functions are globally available)
  // Or import from module
  
  console.log('✅ Test 1: MANUAL - Check in browser console');
  console.log('Run: localStorage.getItem("agp-deleted-sensors")');
}

/**
 * Test 2: IndexedDB Persistence
 */
async function testIndexedDBPersistence() {
  console.log('\n=== TEST 2: IndexedDB Persistence ===');
  
  console.log('1. Delete a sensor via UI');
  console.log('2. Check localStorage:', localStorage.getItem('agp-deleted-sensors'));
  console.log('3. Run: localStorage.clear()');
  console.log('4. Refresh page');
  console.log('5. Sensor should STAY deleted (IndexedDB survives)');
  console.log('');
  console.log('Expected: Deleted sensor does NOT reappear');
}

/**
 * Test 3: Expiry Cleanup
 */
async function testExpiryCleanup() {
  console.log('\n=== TEST 3: Expiry Cleanup (90 days) ===');
  
  console.log('This test requires waiting 90 days OR:');
  console.log('1. Manually add old tombstone to IndexedDB');
  console.log('2. Set deleted_at to 91 days ago');
  console.log('3. Run cleanup function');
  console.log('4. Old tombstone should be removed');
}

/**
 * Test 4: localStorage.clear() Survival Test (THE CRITICAL TEST)
 */
async function testManualClear() {
  console.log('\n=== TEST 4: localStorage.clear() Survival Test ===');
  console.log('This is THE critical test for Issue #1 fix!');
  console.log('');
  console.log('STEPS:');
  console.log('1. Pick a sensor and delete it via UI');
  console.log('2. Verify it disappears');
  console.log('3. Open DevTools console');
  console.log('4. Run: localStorage.clear()');
  console.log('5. Refresh page (Cmd+R)');
  console.log('6. Check: Sensor should STAY deleted!');
  console.log('');
  console.log('✅ PASS: Sensor stays deleted (IndexedDB survived)');
  console.log('❌ FAIL: Sensor reappears (IndexedDB not working)');
}

/**
 * Inspect Current Tombstones
 */
async function inspectTombstones() {
  console.log('\n=== INSPECT TOMBSTONES ===');
  
  console.log('1. localStorage:');
  const localDeleted = JSON.parse(localStorage.getItem('agp-deleted-sensors') || '[]');
  console.log('   Count:', localDeleted.length);
  console.log('   IDs:', localDeleted);
  
  console.log('\n2. IndexedDB:');
  console.log('   Run in async context:');
  console.log('   const db = await openDB();');
  console.log('   const tx = db.transaction("deleted_sensors", "readonly");');
  console.log('   const store = tx.objectStore("deleted_sensors");');
  console.log('   const all = await store.getAll();');
  console.log('   console.log("IndexedDB count:", all.length);');
}

/**
 * Get Tombstone Stats
 */
async function getTombstoneStats() {
  console.log('\n=== TOMBSTONE STATS ===');
  
  const localDeleted = JSON.parse(localStorage.getItem('agp-deleted-sensors') || '[]');
  
  console.log('localStorage:');
  console.log('  Count:', localDeleted.length);
  console.log('  IDs:', localDeleted);
  
  console.log('\nIndexedDB:');
  console.log('  Check in Application tab > IndexedDB > agp-user-actions');
}

/**
 * Main Test Suite
 */
async function testTombstoneStore() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  TOMBSTONE STORE TEST SUITE v3.11.0   ║');
  console.log('╚════════════════════════════════════════╝');
  
  await testBasicAddGet();
  await testIndexedDBPersistence();
  await testExpiryCleanup();
  await testManualClear();
  
  console.log('\n═══════════════════════════════════════');
  console.log('TEST SUITE COMPLETE');
  console.log('═══════════════════════════════════════\n');
  console.log('For detailed inspection, run: await inspectTombstones()');
  console.log('For stats, run: await getTombstoneStats()');
}

// Export for console use
if (typeof window !== 'undefined') {
  window.testTombstoneStore = testTombstoneStore;
  window.testManualClear = testManualClear;
  window.inspectTombstones = inspectTombstones;
  window.getTombstoneStats = getTombstoneStats;
  
  console.log('[test-tombstone-store.js] Test functions loaded');
  console.log('Run: await testTombstoneStore()');
}
