// Quick test of detection engine
import { readFileSync } from 'fs';
import { parseCareLinkSections } from './src/core/csvSectionParser.js';
import { detectSensorChanges } from './src/core/sensorDetectionEngine.js';

const csvPath = './test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv';
console.log('Loading CSV:', csvPath);

const csvText = readFileSync(csvPath, 'utf8');
console.log(`✓ CSV loaded: ${csvText.length} chars, ${csvText.split('\n').length} lines\n`);

console.log('Parsing sections...');
const { alerts, glucose } = parseCareLinkSections(csvText);
console.log(`✓ Parsed: ${alerts.length} alerts, ${glucose.length} glucose readings\n`);

console.log('Detecting sensor changes...');
const { candidates, summary } = detectSensorChanges(alerts, glucose);

console.log('\n=== DETECTION RESULTS ===');
console.log(`Found ${candidates.length} candidates:\n`);

candidates.forEach((c, i) => {
  console.log(`${i+1}. ${c.timestamp}`);
  console.log(`   Confidence: ${c.confidence} (${c.score}/100)`);
  console.log(`   Alerts: ${c.alerts.length} - ${c.alerts.slice(0,3).join(', ')}${c.alerts.length > 3 ? '...' : ''}`);
  if (c.gaps && c.gaps.length > 0) {
    console.log(`   Gap: ${c.gaps[0].duration} min @ ${c.gaps[0].start}`);
  }
  console.log('');
});

console.log('Summary:', summary);
