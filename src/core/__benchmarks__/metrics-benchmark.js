/**
 * METRICS ENGINE BENCHMARK
 * 
 * Tests performance of calculateMetrics() with different dataset sizes:
 * - 7 days (~2,000 readings)
 * - 14 days (~4,000 readings)
 * - 90 days (~26,000 readings)
 * 
 * Target: <1000ms per calculation
 * 
 * Run: node src/core/__benchmarks__/metrics-benchmark.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCSV } from '../parsers.js';
import { calculateMetrics } from '../metrics-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

// Test files configuration
const TEST_FILES = [
  {
    name: '7 days',
    path: 'test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv',
    expectedDays: 7,
    expectedReadings: 2000 // ~2k readings
  },
  {
    name: '14 days',
    path: 'test-data/SAMPLE__Jo Mostert 31-10-2025_14d.csv',
    expectedDays: 14,
    expectedReadings: 4000 // ~4k readings
  }
  ,
  {
    name: '90 days',
    path: 'test-data/Jo Mostert 30-10-2025_90d.csv',
    expectedDays: 90,
    expectedReadings: 26000 // ~26k readings
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
    // Read CSV
    const csvText = readFileSync(filePath, 'utf-8');
    console.log(`   ✅ File loaded (${(csvText.length / 1024).toFixed(1)} KB)`);
    
    // Parse CSV
    const parseStart = performance.now();
    const parsed = parseCSV(csvText);
    const parseTime = Math.round(performance.now() - parseStart);
    console.log(`   ✅ Parsed in ${parseTime}ms (${parsed.data.length} readings)`);
    
    // Get date range for metrics
    const dates = parsed.data.map(r => r.date);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    // Run metrics calculation 10 times to get average
    const runs = [];
    console.log(`   🔄 Running 10 iterations...`);
    
    for (let i = 0; i < 10; i++) {
      const metrics = calculateMetrics(parsed.data, startDate, endDate);
      runs.push(metrics.performance.calculationTime);
    }
    
    // Calculate statistics
    const min = Math.min(...runs);
    const max = Math.max(...runs);
    const avg = Math.round(runs.reduce((a, b) => a + b, 0) / runs.length);
    const median = runs.sort((a, b) => a - b)[Math.floor(runs.length / 2)];
    
    // Verify metrics calculation
    const finalMetrics = calculateMetrics(parsed.data, startDate, endDate);
    
    return {
      name: config.name,
      readings: parsed.data.length,
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
  console.log('║           METRICS ENGINE PERFORMANCE BENCHMARK              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n🎯 Target: <1000ms per calculation (90-day data)');
  console.log('📏 Method: 10 iterations per dataset, averaged\n');
  
  const results = [];
  
  for (const config of TEST_FILES) {
    const result = await benchmarkFile(config);
    if (result) {
      results.push(result);
    }
  }
  
  // Print summary table
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      RESULTS SUMMARY                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌─────────────┬──────────┬───────┬─────────────────────────────┐');
  console.log('│ Dataset     │ Readings │ Days  │ Performance (ms)            │');
  console.log('├─────────────┼──────────┼───────┼─────────────────────────────┤');
  
  results.forEach(r => {
    const dataset = r.name.padEnd(11);
    const readings = String(r.readings).padStart(8);
    const days = String(r.days).padStart(5);
    const perf = `Min: ${String(r.timing.min).padStart(3)} | Avg: ${String(r.timing.avg).padStart(3)} | Max: ${String(r.timing.max).padStart(3)}`;
    console.log(`│ ${dataset} │ ${readings} │ ${days} │ ${perf} │`);
  });
  
  console.log('└─────────────┴──────────┴───────┴─────────────────────────────┘');
  
  // Verdict
  console.log('\n📊 METRICS CALCULATED:');
  results.forEach(r => {
    console.log(`\n   ${r.name}:`);
    console.log(`      TIR: ${r.metrics.tir}%`);
    console.log(`      CV: ${r.metrics.cv}%`);
    console.log(`      MAGE: ${r.metrics.mage} mg/dL`);
    console.log(`      MODD: ${r.metrics.modd} mg/dL`);
  });
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                         VERDICT                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const maxAvg = Math.max(...results.map(r => r.timing.avg));
  const target = 1000;
  
  if (maxAvg < target) {
    const percent = Math.round((maxAvg / target) * 100);
    console.log(`✅ PASS: Maximum average (${maxAvg}ms) is ${percent}% of target (<${target}ms)`);
    console.log(`   All datasets perform well within acceptable limits.`);
  } else {
    const percent = Math.round((maxAvg / target) * 100);
    console.log(`❌ FAIL: Maximum average (${maxAvg}ms) exceeds target (${percent}% of ${target}ms)`);
    console.log(`   Optimization needed for larger datasets.`);
  }
  
  console.log('\n' + '='.repeat(64) + '\n');
}

// Execute
runBenchmarks().catch(console.error);
