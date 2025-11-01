/**
 * METRICS ENGINE BENCHMARK (Standalone)
 * 
 * Minimal benchmark that directly parses CSVs without dependencies on Vite environment.
 * Tests performance of calculateMetrics() with different dataset sizes.
 * 
 * Target: <1000ms per calculation
 * 
 * Run: node src/core/__benchmarks__/metrics-benchmark-standalone.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

// Import only metrics-engine (no parsers dependency)
import { calculateMetrics, CONFIG, utils } from '../metrics-engine.js';

/**
 * Minimal CSV parser - extracts just glucose data
 */
function parseCSVMinimal(text) {
  const lines = text.split('\n');
  const data = [];
  
  // Skip header lines and find data section
  let inDataSection = false;
  
  for (const line of lines) {
    // Data section starts after "Index;Date;Time;" header
    if (line.includes('Index;Date;Time;')) {
      inDataSection = true;
      continue;
    }
    
    if (!inDataSection) continue;
    if (line.trim() === '') break; // End of section
    
    const parts = line.split(';');
    if (parts.length < 35) continue;
    
    const date = parts[1]?.trim();
    const time = parts[2]?.trim();
    const sensorGlucose = parts[34]?.trim(); // Column 34 = Sensor Glucose (mg/dL)
    
    if (!date || !time || !sensorGlucose) continue;
    
    const glucose = utils.parseDecimal(sensorGlucose);
    if (isNaN(glucose) || glucose < 20 || glucose > 600) continue;
    
    data.push({ date, time, glucose });
  }
  
  return data;
}

// Test files configuration
const TEST_FILES = [
  {
    name: '7 days',
    path: 'test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv',
    expectedDays: 7
  },
  {
    name: '14 days',
    path: 'test-data/SAMPLE__Jo Mostert 31-10-2025_14d.csv',
    expectedDays: 14
  },
  {
    name: '90 days',
    path: 'test-data/Jo Mostert 30-10-2025_90d.csv',
    expectedDays: 90
  }
];

/**
 * Run benchmark for a single CSV file
 */
async function benchmarkFile(config) {
  const filePath = join(projectRoot, config.path);
  
  console.log(`\n📊 Testing: ${config.name}`);
  console.log(`   File: ${config.path}`);
  
  try {
    // Read and parse CSV
    const csvText = readFileSync(filePath, 'utf-8');
    const data = parseCSVMinimal(csvText);
    console.log(`   ✅ Loaded ${data.length} readings`);
    
    // Get date range
    const dates = data.map(r => r.date);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    // Run 10 iterations
    const runs = [];
    console.log(`   🔄 Running 10 iterations...`);
    
    for (let i = 0; i < 10; i++) {
      const metrics = calculateMetrics(data, startDate, endDate);
      runs.push(metrics.performance.calculationTime);
    }
    
    // Calculate statistics
    const sortedRuns = [...runs].sort((a, b) => a - b);
    const min = sortedRuns[0];
    const max = sortedRuns[sortedRuns.length - 1];
    const avg = Math.round(runs.reduce((a, b) => a + b, 0) / runs.length);
    const median = sortedRuns[Math.floor(sortedRuns.length / 2)];
    
    // Get final metrics for verification
    const finalMetrics = calculateMetrics(data, startDate, endDate);
    
    console.log(`   ⏱️  Performance: min=${min}ms, avg=${avg}ms, max=${max}ms, median=${median}ms`);
    
    return {
      name: config.name,
      readings: data.length,
      days: finalMetrics.days,
      timing: { min, max, avg, median },
      metrics: {
        tir: finalMetrics.tir,
        cv: finalMetrics.cv,
        mage: finalMetrics.mage,
        modd: finalMetrics.modd
      }
    };
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
    return null;
  }
}

/**
 * Main benchmark runner
 */
async function runBenchmarks() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         METRICS ENGINE PERFORMANCE BENCHMARK (v3.6)         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n🎯 Target: <1000ms per calculation (90-day data)');
  console.log('📏 Method: 10 iterations per dataset, averaged\n');
  
  const results = [];
  
  for (const config of TEST_FILES) {
    const result = await benchmarkFile(config);
    if (result) results.push(result);
  }
  
  // Print summary table
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      RESULTS SUMMARY                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌──────────┬──────────┬───────┬────────────────────────────────┐');
  console.log('│ Dataset  │ Readings │ Days  │ Performance (ms)               │');
  console.log('├──────────┼──────────┼───────┼────────────────────────────────┤');
  
  results.forEach(r => {
    const dataset = r.name.padEnd(8);
    const readings = String(r.readings).padStart(8);
    const days = String(r.days).padStart(5);
    const perf = `min=${String(r.timing.min).padStart(2)} avg=${String(r.timing.avg).padStart(2)} max=${String(r.timing.max).padStart(3)}`;
    console.log(`│ ${dataset} │ ${readings} │ ${days} │ ${perf} │`);
  });
  
  console.log('└──────────┴──────────┴───────┴────────────────────────────────┘');
  
  // Print metrics verification
  console.log('\n📊 METRICS CALCULATED:');
  results.forEach(r => {
    console.log(`   ${r.name}: TIR=${r.metrics.tir}% CV=${r.metrics.cv}% MAGE=${r.metrics.mage} MODD=${r.metrics.modd}`);
  });
  
  // Verdict
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                         VERDICT                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const maxAvg = Math.max(...results.map(r => r.timing.avg));
  const target = 1000;
  
  if (maxAvg < target) {
    const percent = Math.round((maxAvg / target) * 100);
    console.log(`✅ PASS: Maximum average (${maxAvg}ms) is ${percent}% of target`);
    console.log(`   All datasets calculate well within acceptable limits.`);
    console.log(`   Excellent performance for production use.`);
  } else {
    const percent = Math.round((maxAvg / target) * 100);
    console.log(`❌ FAIL: Maximum average (${maxAvg}ms) exceeds target (${percent}%)`);
    console.log(`   Optimization required for larger datasets.`);
  }
  
  console.log('\n' + '='.repeat(64) + '\n');
}

// Execute
runBenchmarks().catch(console.error);
