/**
 * Test script to analyze sensor event clustering in CSV
 * Run with: node test_sensor_clustering.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CSV manually (simplified version)
function parseCSVForEvents(csvText) {
  const lines = csvText.split('\n');
  const events = {
    sensorAlerts: [],
    rewindEvents: []
  };
  
  // Skip header lines (first 6)
  const dataLines = lines.slice(6);
  
  dataLines.forEach((line, index) => {
    const parts = line.split(';');
    
    // Skip header row
    if (parts[1] === 'Date' && parts[2] === 'Time') {
      return;
    }
    
    if (parts.length < 35) {
      return;
    }
    
    const date = parts[1];
    const time = parts[2];
    const alert = parts[18]?.trim() || '';
    const rewind = parts[21]?.trim() === 'Rewind';
    
    // Sensor alerts
    if (alert && (alert.includes('SENSOR') || alert.includes('CHANGE SENSOR'))) {
      events.sensorAlerts.push({
        date,
        time,
        alert,
        lineNumber: index + 7 // Adjust for header skip
      });
    }
    
    // Rewind events
    if (rewind) {
      events.rewindEvents.push({
        date,
        time,
        lineNumber: index + 7
      });
    }
  });
  
  return events;
}

// Group events by date
function groupEventsByDate(events) {
  const byDate = {};
  
  events.forEach(event => {
    if (!byDate[event.date]) {
      byDate[event.date] = [];
    }
    byDate[event.date].push(event);
  });
  
  return byDate;
}

// Calculate time span in minutes
function getTimeSpanMinutes(events) {
  if (events.length <= 1) return 0;
  
  const times = events.map(e => {
    const [hours, minutes, seconds] = e.time.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
  });
  
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return max - min;
}

// Main analysis
async function analyzeSensorClustering() {
  const csvPath = '/Users/jomostert/Documents/Diabetes Care/28okt/Jo Mostert 28-10-2025.csv';
  
  console.log('📊 Sensor Event Clustering Analysis');
  console.log('=====================================\n');
  
  // Read CSV
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  console.log(`✅ Read CSV: ${csvPath}\n`);
  
  // Parse events
  const events = parseCSVForEvents(csvText);
  
  console.log(`🔍 Total Events Found:`);
  console.log(`   - Sensor alerts: ${events.sensorAlerts.length}`);
  console.log(`   - Rewind events: ${events.rewindEvents.length}\n`);
  
  // Analyze sensor alerts
  console.log('📍 Sensor Alert Details:');
  console.log('========================');
  events.sensorAlerts.forEach((event, i) => {
    console.log(`${i + 1}. ${event.date} ${event.time}`);
    console.log(`   Alert: ${event.alert}`);
    console.log(`   Line: ${event.lineNumber}`);
  });
  console.log();
  
  // Group by date
  const byDate = groupEventsByDate(events.sensorAlerts);
  
  console.log('📅 Grouped by Date:');
  console.log('===================');
  Object.entries(byDate).forEach(([date, dateEvents]) => {
    console.log(`\n${date}: ${dateEvents.length} events`);
    
    const timeSpan = getTimeSpanMinutes(dateEvents);
    console.log(`   Time span: ${timeSpan.toFixed(1)} minutes`);
    
    dateEvents.forEach((event, i) => {
      console.log(`   ${i + 1}. ${event.time} - ${event.alert}`);
    });
    
    // Recommendation
    if (dateEvents.length > 1) {
      if (timeSpan <= 60) {
        console.log(`   ⚠️  LIKELY ONE EVENT (clustered within 60 min)`);
      } else {
        console.log(`   ❓ AMBIGUOUS (>60 min apart - need user confirmation)`);
      }
    }
  });
  
  console.log('\n\n📍 Rewind Event Details:');
  console.log('========================');
  events.rewindEvents.forEach((event, i) => {
    console.log(`${i + 1}. ${event.date} ${event.time} (line ${event.lineNumber})`);
  });
  
  // Group rewind by date
  const rewindByDate = groupEventsByDate(events.rewindEvents);
  
  console.log('\n📅 Rewind Grouped by Date:');
  console.log('==========================');
  Object.entries(rewindByDate).forEach(([date, dateEvents]) => {
    console.log(`\n${date}: ${dateEvents.length} events`);
    
    if (dateEvents.length > 1) {
      const timeSpan = getTimeSpanMinutes(dateEvents);
      console.log(`   Time span: ${timeSpan.toFixed(1)} minutes`);
      console.log(`   ⚠️  Multiple rewind events same day (unusual)`);
    }
  });
  
  console.log('\n\n✅ Analysis Complete\n');
}

// Run
analyzeSensorClustering().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
