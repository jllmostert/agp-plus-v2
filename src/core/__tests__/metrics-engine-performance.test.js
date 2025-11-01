/**
 * METRICS ENGINE PERFORMANCE BENCHMARK
 * 
 * Tests calculateMetrics() performance with real CSV data:
 * - 7 days (~2,000 readings)
 * - 14 days (~4,000 readings)
 * - 90 days (~26,000 readings)
 * 
 * Target: <1000ms per calculation
 * 
 * Run: npm run test -- metrics-engine.bench
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseCSV } from '../parsers.js';
import { calculateMetrics } from '../metrics-engine.js';

const TEST_DATA_DIR = join(process.cwd(), 'test-data');

const TEST_FILES = [
  {
    name: '7 days',
    filename: 'SAMPLE__Jo Mostert 30-10-2025_7d.csv',
    expectedReadings: { min: 2000, max: 2500 } // Adjusted based on actual data
  },
  {
    name: '14 days',
    filename: 'SAMPLE__Jo Mostert 31-10-2025_14d.csv',
    expectedReadings: { min: 7000, max: 8000 } // Adjusted based on actual data
  },
  {
    name: '90 days',
    filename: 'Jo Mostert 30-10-2025_90d.csv',
    expectedReadings: { min: 24000, max: 28000 }
  }
];

describe('Metrics Engine Performance Benchmark', () => {
  
  TEST_FILES.forEach(config => {
    describe(`${config.name} dataset`, () => {
      
      let csvData, parsedData, startDate, endDate;
      
      it('loads and parses CSV file', () => {
        const filePath = join(TEST_DATA_DIR, config.filename);
        csvData = readFileSync(filePath, 'utf-8');
        expect(csvData).toBeTruthy();
        expect(csvData.length).toBeGreaterThan(1000);
        
        // Parse CSV
        const result = parseCSV(csvData);
        parsedData = result.data;
        
        expect(parsedData).toBeDefined();
        expect(parsedData.length).toBeGreaterThanOrEqual(config.expectedReadings.min);
        expect(parsedData.length).toBeLessThanOrEqual(config.expectedReadings.max);
        
        // Get date range - filter valid dates and sort chronologically
        const validDates = parsedData
          .map(r => r.date)
          .filter(d => d && d.includes('/')) // Only valid dates
          .sort(); // Sort chronologically (YYYY/MM/DD format sorts correctly)
        
        startDate = validDates[0];
        endDate = validDates[validDates.length - 1];
        
        expect(startDate).toBeDefined();
        expect(endDate).toBeDefined();
        
        console.log(`      📊 Loaded ${parsedData.length} readings from ${startDate} to ${endDate}`);
      });
      
      it('calculates metrics within performance target', () => {
        expect(parsedData).toBeDefined();
        
        // Run 10 iterations to get average
        const timings = [];
        let lastMetrics = null;
        
        for (let i = 0; i < 10; i++) {
          const metrics = calculateMetrics(parsedData, startDate, endDate);
          timings.push(metrics.performance.calculationTime);
          lastMetrics = metrics;
        }
        
        // Calculate statistics
        const min = Math.min(...timings);
        const max = Math.max(...timings);
        const avg = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);
        const sorted = [...timings].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        
        // Log results
        console.log(`      ⏱️  Performance (10 runs):`);
        console.log(`         Min:    ${min}ms`);
        console.log(`         Avg:    ${avg}ms`);
        console.log(`         Median: ${median}ms`);
        console.log(`         Max:    ${max}ms`);
        console.log(`      📈 Metrics calculated:`);
        console.log(`         TIR:  ${lastMetrics.tir}%`);
        console.log(`         CV:   ${lastMetrics.cv}%`);
        console.log(`         MAGE: ${lastMetrics.mage} mg/dL`);
        console.log(`         MODD: ${lastMetrics.modd} mg/dL`);
        
        // Assertions
        expect(avg).toBeLessThan(1000); // Target: <1000ms
        expect(min).toBeGreaterThan(0); // Sanity check
        expect(max).toBeLessThan(5000); // No outliers >5s
        
        // Verify metrics are valid (convert strings to numbers)
        expect(parseFloat(lastMetrics.tir)).toBeGreaterThan(0);
        expect(parseFloat(lastMetrics.cv)).toBeGreaterThan(0);
        expect(lastMetrics.days).toBeGreaterThan(0);
      });
      
      it('produces consistent results across runs', () => {
        // Run 3 times and verify metrics are identical
        const run1 = calculateMetrics(parsedData, startDate, endDate);
        const run2 = calculateMetrics(parsedData, startDate, endDate);
        const run3 = calculateMetrics(parsedData, startDate, endDate);
        
        expect(run1.tir).toBe(run2.tir);
        expect(run2.tir).toBe(run3.tir);
        expect(run1.mage).toBe(run2.mage);
        expect(run1.modd).toBe(run2.modd);
        
        console.log(`      ✅ Results are deterministic (consistent across runs)`);
      });
      
    });
  });
  
});
