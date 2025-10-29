/**
 * Test script to verify CSV upload with sensor/cartridge detection
 * Run in browser console after navigating to http://localhost:3001
 */

async function testUpload() {
  console.log('=== AGP+ v3 Upload Test ===\n');
  
  // 1. Import uploadCSVToV3 function
  console.log('1. Importing uploadCSVToV3...');
  const { uploadCSVToV3 } = await import('/src/storage/masterDatasetStorage.js');
  console.log('✓ Import successful\n');
  
  // 2. Fetch test CSV
  console.log('2. Fetching test CSV...');
  const response = await fetch('/test-data/test_with_alerts.csv');
  const csvText = await response.text();
  console.log(`✓ Fetched ${csvText.length} characters\n`);
  
  // 3. Clear existing data (optional)
  console.log('3. Checking existing data...');
  const existingEvents = localStorage.getItem('agp-device-events');
  if (existingEvents) {
    console.log('Found existing events:', JSON.parse(existingEvents));
    console.log('Clearing for clean test...');
    localStorage.removeItem('agp-device-events');
  }
  console.log('✓ Ready for upload\n');
  
  // 4. Upload CSV
  console.log('4. Uploading CSV...');
  try {
    const result = await uploadCSVToV3(csvText);
    console.log('✓ Upload successful!');
    console.log('Result:', result);
  } catch (err) {
    console.error('✗ Upload failed:', err);
    throw err;
  }
  
  // 5. Check stored events
  console.log('\n5. Checking stored events...');
  const events = localStorage.getItem('agp-device-events');
  
  if (!events) {
    console.error('✗ No events found in localStorage!');
    return false;
  }
  
  const parsedEvents = JSON.parse(events);
  console.log('✓ Events stored:', parsedEvents);
  
  // 6. Verify event counts
  console.log('\n6. Verifying event counts...');
  const sensorEvents = parsedEvents.sensors || [];
  const cartridgeEvents = parsedEvents.cartridges || [];
  
  console.log(`Sensor events: ${sensorEvents.length} (expected: 4)`);
  console.log(`Cartridge events: ${cartridgeEvents.length} (expected: 3)`);
  
  // Show details
  if (sensorEvents.length > 0) {
    console.log('\nSensor events:');
    sensorEvents.forEach(e => {
      const date = new Date(e.timestamp);
      console.log(`  - ${date.toISOString()}: ${e.alert} (${e.source})`);
    });
  }
  
  if (cartridgeEvents.length > 0) {
    console.log('\nCartridge events:');
    cartridgeEvents.forEach(e => {
      const date = new Date(e.timestamp);
      console.log(`  - ${date.toISOString()} (${e.source})`);
    });
  }
  
  // 7. Final verdict
  console.log('\n=== TEST RESULT ===');
  const sensorOK = sensorEvents.length === 4;
  const cartridgeOK = cartridgeEvents.length === 3;
  
  if (sensorOK && cartridgeOK) {
    console.log('✓ TEST PASSED - All events detected correctly!');
    return true;
  } else {
    console.error('✗ TEST FAILED');
    if (!sensorOK) console.error(`  - Expected 4 sensor events, got ${sensorEvents.length}`);
    if (!cartridgeOK) console.error(`  - Expected 3 cartridge events, got ${cartridgeEvents.length}`);
    return false;
  }
}

// Run test
console.log('To run test: await testUpload()');
