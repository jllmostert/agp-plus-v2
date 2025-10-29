// Debug script for testing CSV upload with alerts
// Run this in browser console after the app loads

async function testCSVUpload() {
  console.log('=== Starting CSV Upload Test ===');
  
  // Fetch test CSV with alerts
  const csvResponse = await fetch('/test-data/test_with_alerts.csv');
  const csvText = await csvResponse.text();
  console.log('Fetched CSV, length:', csvText.length);
  
  // Check current event storage
  const existingEvents = localStorage.getItem('agp-device-events');
  console.log('Existing events before upload:', existingEvents);
  
  try {
    // Import and call uploadCSVToV3
    const { uploadCSVToV3 } = await import('/src/storage/masterDatasetStorage.js');
    const result = await uploadCSVToV3(csvText);
    console.log('Upload result:', result);
    
    // Check events after upload
    const newEvents = localStorage.getItem('agp-device-events');
    console.log('Events after upload:', newEvents);
    
    if (newEvents) {
      const parsed = JSON.parse(newEvents);
      console.log('Sensor events:', parsed.sensorChanges);
      console.log('Cartridge events:', parsed.cartridgeChanges);
    }
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

// Run the test
testCSVUpload();
