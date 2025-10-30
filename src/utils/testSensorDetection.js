/**
 * Test CSV Parser and Detection Engine
 * 
 * Run this in the browser console to test the sensor detection system
 */

import { parseCareLinkSections } from './csvSectionParser.js';
import { detectSensorChanges } from './sensorDetectionEngine.js';

export async function testSensorDetection() {
  console.log('🧪 Testing Sensor Detection System...\n');
  
  // Load test CSV
  const response = await fetch('/test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv');
  const csvText = await response.text();
  
  console.log('📄 CSV loaded, parsing sections...');
  
  // Parse CSV
  const { alerts, glucose, metadata } = parseCareLinkSections(csvText);
  
  console.log('✅ Parsed:', {
    alerts: alerts.length,
    glucose: glucose.length,
    patient: metadata.name
  });
  
  // Filter sensor alerts
  const sensorAlerts = alerts.filter(a => 
    a.alert && (
      a.alert.includes('SENSOR CONNECTED') ||
      a.alert.includes('CHANGE SENSOR')
    )
  );
  
  console.log(`\n🔍 Found ${sensorAlerts.length} sensor alerts:`);
  sensorAlerts.forEach(a => {
    console.log(`  - ${a.timestamp.toLocaleString('nl-NL')}: ${a.alert}`);
  });
  
  // Run detection
  console.log('\n🎯 Running detection engine...');
  const result = detectSensorChanges(alerts, glucose);
  
  console.log(`\n📊 Detection Results:`);
  console.log(`  Total candidates: ${result.summary.totalCandidates}`);
  console.log(`  High confidence: ${result.summary.highConfidence}`);
  console.log(`  Medium confidence: ${result.summary.mediumConfidence}`);
  console.log(`  Low confidence: ${result.summary.lowConfidence}`);
  
  console.log('\n📋 Candidates:');
  result.candidates.forEach((c, i) => {
    const badge = c.confidence === 'high' ? '🟢' : c.confidence === 'medium' ? '🟡' : '🔴';
    console.log(`\n${i + 1}. ${badge} ${c.confidence.toUpperCase()} (score: ${c.score}/100)`);
    console.log(`   Time: ${c.timestamp.toLocaleString('nl-NL')}`);
    console.log(`   Alerts: ${c.alerts.join(', ') || 'none'}`);
    console.log(`   Gaps: ${c.gaps.map(g => `${g.duration}min`).join(', ') || 'none'}`);
    console.log(`   Reason: ${c.reason}`);
  });
  
  console.log('\n✅ Test complete!');
  return result;
}
