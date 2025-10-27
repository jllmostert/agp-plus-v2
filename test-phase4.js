// Phase 4 Verification Test Script
// Tests CSV alert detection for sensor and cartridge events

import { parseCSVContent } from './src/core/parsers.js';
import { detectSensorChanges, detectCartridgeChanges } from './src/core/day-profile-engine.js';
import fs from 'fs/promises';

async function testPhase4() {
  console.log('=== PHASE 4 VERIFICATION TEST ===\n');
  
  try {
    // Load test CSV with alerts
    console.log('1. Loading test CSV with alerts...');
    const csvContent = await fs.readFile('./test-data/test_with_alerts.csv', 'utf-8');
    
    // Parse CSV
    console.log('2. Parsing CSV data...');
    const data = parseCSVContent(csvContent);
    console.log(`   - Parsed ${data.length} valid rows`);
    
    // Check for alert parsing
    console.log('\n3. Checking alert parsing:');
    const alertRows = data.filter(row => row.alert);
    console.log(`   - Found ${alertRows.length} rows with alerts`);
    alertRows.forEach(row => {
      console.log(`     • ${row.date} ${row.time}: "${row.alert}"`);
    });
    
    // Check for rewind parsing
    console.log('\n4. Checking rewind (cartridge) parsing:');
    const rewindRows = data.filter(row => row.rewind);
    console.log(`   - Found ${rewindRows.length} rows with rewind events`);
    rewindRows.forEach(row => {
      console.log(`     • ${row.date} ${row.time}: Rewind detected`);
    });
    
    // Test sensor detection for specific dates
    console.log('\n5. Testing sensor detection (3-tier system):');
    const testDates = ['2025/10/21', '2025/10/22', '2025/10/23'];
    
    for (const date of testDates) {
      console.log(`\n   Testing ${date}:`);
      const sensorChanges = await detectSensorChanges(data, date);
      if (sensorChanges.length > 0) {
        console.log(`   ✅ Found ${sensorChanges.length} sensor change(s)`);
        sensorChanges.forEach(change => {
          console.log(`      - ${change.minuteOfDay} min (${change.source}, ${change.confidence} confidence)`);
          if (change.metadata?.alert) {
            console.log(`        Alert: "${change.metadata.alert}"`);
          }
        });
      } else {
        console.log(`   ⚠️  No sensor changes detected`);
      }
    }
    
    // Test cartridge detection
    console.log('\n6. Testing cartridge detection:');
    for (const date of testDates) {
      const dayData = data.filter(row => row.date === date);
      const cartridgeChanges = detectCartridgeChanges(dayData);
      if (cartridgeChanges.length > 0) {
        console.log(`   ✅ ${date}: Found ${cartridgeChanges.length} cartridge change(s)`);
        cartridgeChanges.forEach(change => {
          console.log(`      - At ${change.minuteOfDay} minutes into day`);
        });
      }
    }
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testPhase4();
