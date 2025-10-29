// Test script for fresh CSV upload (28 okt with katheter change)
// Expected: Rewind event on 28/10 06:08:07 + 2x SENSOR CONNECTED on 25/10

async function testFreshCSVUpload() {
  console.log('🧪 TEST: Fresh CSV Upload (28 okt)');
  console.log('Expected events:');
  console.log('  - Katheter: Rewind on 28/10 06:08');
  console.log('  - Sensor: 2x SENSOR CONNECTED on 25/10');
  console.log('---');

  try {
    // Import function
    const { uploadCSVToV3 } = await import('/src/storage/masterDatasetStorage.js');
    
    // Fetch CSV from public folder
    const csvPath = '/test-fresh-28okt.csv';
    console.log(`📂 Reading: ${csvPath}`);
    
    const response = await fetch(csvPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log(`✅ CSV loaded: ${csvText.length} chars`);
    
    // Clear old events for clean test
    localStorage.removeItem('agp-device-events');
    console.log('🗑️ Cleared old events');
    
    // Upload to V3
    console.log('⬆️ Uploading to V3...');
    await uploadCSVToV3(csvText);
    console.log('✅ Upload complete');
    
    // Check results
    const events = JSON.parse(localStorage.getItem('agp-device-events') || '{}');
    
    console.log('\n📊 RESULTS:');
    console.log(`Sensor events: ${events.sensorChanges?.length || 0}`);
    console.log(`Cartridge events: ${events.cartridgeChanges?.length || 0}`);
    
    if (events.sensorChanges?.length > 0) {
      console.log('\n🔍 Sensor events:');
      events.sensorChanges.forEach((e, i) => {
        console.log(`  ${i+1}. ${e.timestamp} - ${e.confidence} - ${e.source}`);
      });
    }
    
    if (events.cartridgeChanges?.length > 0) {
      console.log('\n💉 Cartridge events:');
      events.cartridgeChanges.forEach((e, i) => {
        console.log(`  ${i+1}. ${e.timestamp} - ${e.confidence}`);
      });
    }
    
    // Verify katheter event
    const katheterEvent = events.cartridgeChanges?.find(e => 
      e.timestamp.includes('2025-10-28')
    );
    
    if (katheterEvent) {
      console.log('\n✅ KATHETER CHANGE DETECTED!');
      console.log(`   Time: ${katheterEvent.timestamp}`);
      console.log(`   Confidence: ${katheterEvent.confidence}`);
    } else {
      console.log('\n❌ KATHETER CHANGE NOT FOUND!');
    }
    
    return { success: true, events };
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    return { success: false, error: error.message };
  }
}

// Run test
testFreshCSVUpload();
