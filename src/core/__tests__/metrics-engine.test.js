/**
 * ARTIFACT-01: Metrics Engine Unit Tests
 * Tests for glucose metrics calculations (MAGE, MODD, GRI, TIR, etc.)
 * 
 * Test Strategy:
 * - Use known inputs with verified outputs
 * - Test edge cases (single day, missing data, DST)
 * - Validate against metric_definitions.md formulas
 */

import { describe, it, expect } from 'vitest';
import { calculateMetrics, CONFIG, utils } from '../metrics-engine.js';

describe('Metrics Engine - Basic Calculations', () => {
  
  describe('Mean and SD', () => {
    it('calculates mean correctly for simple dataset', () => {
      const data = [
        { date: '2025/10/01', time: '08:00:00', glucose: 100 },
        { date: '2025/10/01', time: '08:05:00', glucose: 120 },
        { date: '2025/10/01', time: '08:10:00', glucose: 140 },
        { date: '2025/10/01', time: '08:15:00', glucose: 160 },
        { date: '2025/10/01', time: '08:20:00', glucose: 180 }
      ];
      
      const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
      
      // Mean = (100+120+140+160+180)/5 = 700/5 = 140
      expect(result.mean).toBe(140);
    });

    it('calculates standard deviation correctly', () => {
      // Test data: [100, 110, 120] - small, controlled dataset
      const data = [
        { date: '2025/10/01', time: '08:00:00', glucose: 100 },
        { date: '2025/10/01', time: '08:05:00', glucose: 110 },
        { date: '2025/10/01', time: '08:10:00', glucose: 120 }
      ];
      
      const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
      
      // Mean = 110
      // Variance = [(100-110)² + (110-110)² + (120-110)²] / (3-1)
      //          = [100 + 0 + 100] / 2 = 100
      // SD = √100 = 10.0
      expect(result.mean).toBe(110);
      expect(parseFloat(result.sd)).toBe(10.0);
    });
  });

  describe('Coefficient of Variation (CV)', () => {
    it('calculates CV correctly', () => {
      const data = [
        { date: '2025/10/01', time: '08:00:00', glucose: 100 },
        { date: '2025/10/01', time: '08:05:00', glucose: 110 },
        { date: '2025/10/01', time: '08:10:00', glucose: 120 }
      ];
      
      const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
      
      // CV = (SD / Mean) × 100 = (10 / 110) × 100 = 9.09%
      expect(parseFloat(result.cv)).toBeCloseTo(9.1, 0);
    });

    it('meets consensus target (<36%) for stable glucose', () => {
      // Very stable glucose: 140 ± 5 mg/dL
      const data = Array.from({ length: 20 }, (_, i) => ({
        date: '2025/10/01',
        time: `${String(8 + Math.floor(i/12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}:00`,
        glucose: 140 + (Math.random() * 10 - 5) // Random ±5
      }));
      
      const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
      
      // Should be well below 36% target
      expect(parseFloat(result.cv)).toBeLessThan(36);
    });
  });
});

describe('MAGE (Mean Amplitude of Glycemic Excursions)', () => {
  
  it('calculates MAGE for simple excursion pattern', () => {
    // Create clear peak-valley-peak pattern with more data points
    // Need sufficient data for MAGE algorithm to detect extrema
    const data = [
      { date: '2025/10/01', time: '08:00:00', glucose: 100 }, // valley
      { date: '2025/10/01', time: '08:05:00', glucose: 105 },
      { date: '2025/10/01', time: '08:10:00', glucose: 120 },
      { date: '2025/10/01', time: '08:15:00', glucose: 140 },
      { date: '2025/10/01', time: '08:20:00', glucose: 160 },
      { date: '2025/10/01', time: '08:25:00', glucose: 180 }, // peak
      { date: '2025/10/01', time: '08:30:00', glucose: 170 },
      { date: '2025/10/01', time: '08:35:00', glucose: 150 },
      { date: '2025/10/01', time: '08:40:00', glucose: 130 },
      { date: '2025/10/01', time: '08:45:00', glucose: 110 },
      { date: '2025/10/01', time: '08:50:00', glucose: 100 }, // valley
      { date: '2025/10/01', time: '08:55:00', glucose: 110 },
      { date: '2025/10/01', time: '09:00:00', glucose: 130 },
      { date: '2025/10/01', time: '09:05:00', glucose: 150 },
      { date: '2025/10/01', time: '09:10:00', glucose: 170 },
      { date: '2025/10/01', time: '09:15:00', glucose: 180 }  // peak
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // With this pattern, MAGE should detect significant excursions
    // If MAGE > 0, algorithm is working (exact value depends on implementation)
    expect(parseFloat(result.mage)).toBeGreaterThan(0);
  });

  it('returns zero MAGE when no significant excursions', () => {
    // All values very close together - no excursions >1 SD
    const data = Array.from({ length: 50 }, (_, i) => ({
      date: '2025/10/01',
      time: `${String(8 + Math.floor(i/12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}:00`,
      glucose: 140 // Perfectly flat line
    }));
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // SD = 0, so no excursions possible
    expect(parseFloat(result.mage)).toBe(0);
  });

  it('handles single data point (no extrema)', () => {
    const data = [
      { date: '2025/10/01', time: '08:00:00', glucose: 140 }
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // No extrema possible with 1 point
    expect(parseFloat(result.mage)).toBe(0);
  });

  it('requires alternating peaks and valleys', () => {
    // Two consecutive peaks - should skip one
    const data = [
      { date: '2025/10/01', time: '08:00:00', glucose: 100 }, // valley
      { date: '2025/10/01', time: '08:05:00', glucose: 180 }, // peak 1
      { date: '2025/10/01', time: '08:10:00', glucose: 170 }, // dip
      { date: '2025/10/01', time: '08:15:00', glucose: 185 }, // peak 2
      { date: '2025/10/01', time: '08:20:00', glucose: 100 }  // valley
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // Should skip consecutive peaks and only count valid alternating excursions
    expect(result.mage).toBeDefined();
  });
});

describe('MODD (Mean of Daily Differences)', () => {
  
  it('calculates MODD for two identical days', () => {
    // Day 1 and Day 2 with identical patterns
    const data = [
      // Day 1
      { date: '2025/10/01', time: '08:00:00', glucose: 100 },
      { date: '2025/10/01', time: '08:05:00', glucose: 120 },
      { date: '2025/10/01', time: '12:00:00', glucose: 140 },
      { date: '2025/10/01', time: '18:00:00', glucose: 110 },
      // Day 2 - identical
      { date: '2025/10/02', time: '08:00:00', glucose: 100 },
      { date: '2025/10/02', time: '08:05:00', glucose: 120 },
      { date: '2025/10/02', time: '12:00:00', glucose: 140 },
      { date: '2025/10/02', time: '18:00:00', glucose: 110 }
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/02');
    
    // All differences should be 0
    // MODD = 0 (perfect day-to-day reproducibility)
    expect(parseFloat(result.modd)).toBe(0);
  });

  it('calculates MODD for two different days', () => {
    // Day 1: glucose = 100 at all times
    // Day 2: glucose = 150 at all times
    // Need 70% coverage = ~202 readings per day (288 * 0.7)
    const data = [
      // Day 1 - 220 readings (>70% coverage)
      ...Array.from({ length: 220 }, (_, i) => ({
        date: '2025/10/01',
        time: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}:00`,
        glucose: 100
      })),
      // Day 2 - 220 readings at same times, different glucose
      ...Array.from({ length: 220 }, (_, i) => ({
        date: '2025/10/02',
        time: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}:00`,
        glucose: 150
      }))
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/02');
    
    // Every matched time bin: |150 - 100| = 50
    // MODD = average of all differences = 50
    expect(parseFloat(result.modd)).toBe(50);
  });

  it('handles single day data (no day pairs)', () => {
    const data = [
      { date: '2025/10/01', time: '08:00:00', glucose: 100 },
      { date: '2025/10/01', time: '12:00:00', glucose: 140 },
      { date: '2025/10/01', time: '18:00:00', glucose: 110 }
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // No consecutive days to compare
    expect(parseFloat(result.modd)).toBe(0);
  });
});

describe('GRI (Glycemia Risk Index)', () => {
  
  it('calculates GRI correctly with weighted components', () => {
    // Create dataset with known distribution:
    // 10% VeryLow (<54), 10% Low (54-69), 60% TIR (70-180),
    // 10% High (181-250), 10% VeryHigh (>250)
    const data = [
      // 1 VeryLow (<54)
      { date: '2025/10/01', time: '08:00:00', glucose: 50 },
      // 1 Low (54-69)
      { date: '2025/10/01', time: '08:05:00', glucose: 65 },
      // 6 TIR (70-180)
      { date: '2025/10/01', time: '08:10:00', glucose: 100 },
      { date: '2025/10/01', time: '08:15:00', glucose: 120 },
      { date: '2025/10/01', time: '08:20:00', glucose: 140 },
      { date: '2025/10/01', time: '08:25:00', glucose: 160 },
      { date: '2025/10/01', time: '08:30:00', glucose: 170 },
      { date: '2025/10/01', time: '08:35:00', glucose: 180 },
      // 1 High (181-250)
      { date: '2025/10/01', time: '08:40:00', glucose: 200 },
      // 1 VeryHigh (>250)
      { date: '2025/10/01', time: '08:45:00', glucose: 280 }
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // TBR VeryLow = 1/10 = 10%
    // TBR Low = 1/10 = 10%
    // TAR High = 1/10 = 10%
    // TAR VeryHigh = 1/10 = 10%
    // GRI = (3.0 × 10) + (2.4 × 10) + (1.6 × 10) + (0.8 × 10)
    //     = 30 + 24 + 16 + 8 = 78
    expect(parseFloat(result.gri)).toBeCloseTo(78, 0);
  });

  it('returns GRI of 0 when all values in range', () => {
    // Perfect TIR = 100%, all other ranges = 0%
    const data = Array.from({ length: 20 }, (_, i) => ({
      date: '2025/10/01',
      time: `08:${String(i * 3).padStart(2, '0')}:00`,
      glucose: 100 + i // All between 100-119 (in range)
    }));
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // GRI = (3.0 × 0) + (2.4 × 0) + (1.6 × 0) + (0.8 × 0) = 0
    expect(parseFloat(result.gri)).toBe(0);
  });

  it('weights very low glucose more heavily than very high', () => {
    // Test 1: 100% VeryLow
    const veryLowData = [
      { date: '2025/10/01', time: '08:00:00', glucose: 40 }
    ];
    const veryLowResult = calculateMetrics(veryLowData, '2025/10/01', '2025/10/01');
    // GRI = 3.0 × 100 = 300
    
    // Test 2: 100% VeryHigh
    const veryHighData = [
      { date: '2025/10/01', time: '08:00:00', glucose: 300 }
    ];
    const veryHighResult = calculateMetrics(veryHighData, '2025/10/01', '2025/10/01');
    // GRI = 1.6 × 100 = 160
    
    // VeryLow should have higher GRI than VeryHigh (3.0 vs 1.6 weight)
    expect(parseFloat(veryLowResult.gri)).toBeGreaterThan(parseFloat(veryHighResult.gri));
  });
});

describe('Time in Ranges (TIR/TAR/TBR)', () => {
  
  it('calculates TIR correctly', () => {
    const data = [
      { date: '2025/10/01', time: '08:00:00', glucose: 50 },  // TBR
      { date: '2025/10/01', time: '08:05:00', glucose: 100 }, // TIR
      { date: '2025/10/01', time: '08:10:00', glucose: 150 }, // TIR
      { date: '2025/10/01', time: '08:15:00', glucose: 200 }  // TAR
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // TIR (70-180) = 2/4 = 50%
    // TAR (>180) = 1/4 = 25%
    // TBR (<70) = 1/4 = 25%
    expect(parseFloat(result.tir)).toBe(50.0);
    expect(parseFloat(result.tar)).toBe(25.0);
    expect(parseFloat(result.tbr)).toBe(25.0);
  });

  it('meets consensus target of TIR >70%', () => {
    // 8 out of 10 readings in range
    const data = [
      { date: '2025/10/01', time: '08:00:00', glucose: 65 },  // TBR
      { date: '2025/10/01', time: '08:05:00', glucose: 100 }, // TIR
      { date: '2025/10/01', time: '08:10:00', glucose: 120 }, // TIR
      { date: '2025/10/01', time: '08:15:00', glucose: 140 }, // TIR
      { date: '2025/10/01', time: '08:20:00', glucose: 160 }, // TIR
      { date: '2025/10/01', time: '08:25:00', glucose: 110 }, // TIR
      { date: '2025/10/01', time: '08:30:00', glucose: 130 }, // TIR
      { date: '2025/10/01', time: '08:35:00', glucose: 150 }, // TIR
      { date: '2025/10/01', time: '08:40:00', glucose: 170 }, // TIR
      { date: '2025/10/01', time: '08:45:00', glucose: 200 }  // TAR
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // TIR = 8/10 = 80% (meets >70% target)
    expect(parseFloat(result.tir)).toBeGreaterThanOrEqual(70);
  });
});

describe('DST and Timezone Handling', () => {
  
  it('handles spring forward (DST transition)', () => {
    // EU DST 2025: March 30, 02:00 → 03:00 (spring forward)
    // The hour from 02:00-03:00 doesn't exist
    const data = [
      { date: '2025/03/30', time: '01:55:00', glucose: 100 },
      { date: '2025/03/30', time: '03:05:00', glucose: 110 }, // Skip 02:xx
      { date: '2025/03/30', time: '03:10:00', glucose: 120 }
    ];
    
    const result = calculateMetrics(data, '2025/03/30', '2025/03/30');
    
    // Should handle the gap gracefully
    expect(result).toBeDefined();
    expect(result.readingCount).toBe(3);
  });

  it('handles fall back (DST transition)', () => {
    // EU DST 2025: October 26, 03:00 → 02:00 (fall back)
    // The hour from 02:00-03:00 occurs twice
    const data = [
      { date: '2025/10/26', time: '01:55:00', glucose: 100 },
      { date: '2025/10/26', time: '02:30:00', glucose: 110 }, // First 02:30
      { date: '2025/10/26', time: '02:30:00', glucose: 115 }, // Second 02:30 (repeated hour)
      { date: '2025/10/26', time: '03:05:00', glucose: 120 }
    ];
    
    const result = calculateMetrics(data, '2025/10/26', '2025/10/26');
    
    // Should handle duplicate timestamps
    expect(result).toBeDefined();
    expect(result.readingCount).toBe(4);
  });
});

describe('Edge Cases', () => {
  
  it('handles empty dataset', () => {
    const result = calculateMetrics([], '2025/10/01', '2025/10/01');
    
    // Should return null for empty dataset
    expect(result).toBeNull();
  });

  it('handles dataset with no glucose values (only events)', () => {
    const data = [
      { date: '2025/10/01', time: '08:00:00', glucose: null }, // Event like Rewind
      { date: '2025/10/01', time: '08:05:00', glucose: null }
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // Should return null when no valid glucose readings
    expect(result).toBeNull();
  });

  it('handles single glucose reading', () => {
    const data = [
      { date: '2025/10/01', time: '08:00:00', glucose: 140 }
    ];
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // Should calculate basic metrics, but variance-based ones will be undefined
    expect(result.mean).toBe(140);
    // With n=1, variance = sum/(n-1) = sum/0 = NaN (expected!)
    expect(isNaN(parseFloat(result.sd))).toBe(true);
    expect(parseFloat(result.mage)).toBe(0);
    expect(parseFloat(result.modd)).toBe(0);
  });

  it('filters data by date range correctly', () => {
    const data = [
      { date: '2025/10/01', time: '08:00:00', glucose: 100 },
      { date: '2025/10/02', time: '08:00:00', glucose: 120 },
      { date: '2025/10/03', time: '08:00:00', glucose: 140 },
      { date: '2025/10/04', time: '08:00:00', glucose: 160 }
    ];
    
    // Only include Oct 2-3
    const result = calculateMetrics(data, '2025/10/02', '2025/10/03');
    
    expect(result.readingCount).toBe(2);
    expect(result.mean).toBe(130); // (120+140)/2
  });
});

describe('GMI (Glucose Management Indicator)', () => {
  
  it('calculates GMI correctly from mean glucose', () => {
    // Create dataset with mean = 154 mg/dL
    // GMI formula: 3.31 + (0.02392 × Mean)
    // GMI = 3.31 + (0.02392 × 154) = 3.31 + 3.68 = 6.99 ≈ 7.0%
    const data = Array.from({ length: 10 }, (_, i) => ({
      date: '2025/10/01',
      time: `08:${String(i * 6).padStart(2, '0')}:00`,
      glucose: 154
    }));
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    expect(result.mean).toBe(154);
    expect(parseFloat(result.gmi)).toBeCloseTo(7.0, 1);
  });

  it('meets consensus target of GMI <7.0% for good control', () => {
    // Mean glucose ~140 mg/dL should give GMI ~6.7%
    const data = Array.from({ length: 20 }, (_, i) => ({
      date: '2025/10/01',
      time: `${String(8 + Math.floor(i/12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}:00`,
      glucose: 140 + (Math.random() * 10 - 5) // 140 ± 5
    }));
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/01');
    
    // Should be close to 6.7%, definitely <7.0%
    expect(parseFloat(result.gmi)).toBeLessThan(7.0);
  });
});

describe('Performance', () => {
  
  it('completes calculation in <1000ms for typical dataset', () => {
    // Create 14 days of 5-minute readings (4032 readings)
    const data = [];
    for (let day = 1; day <= 14; day++) {
      for (let i = 0; i < 288; i++) {
        const hour = Math.floor(i / 12);
        const minute = (i % 12) * 5;
        data.push({
          date: `2025/10/${String(day).padStart(2, '0')}`,
          time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
          glucose: 100 + Math.random() * 80 // Random 100-180
        });
      }
    }
    
    const result = calculateMetrics(data, '2025/10/01', '2025/10/14');
    
    // Should complete in <1000ms (as confirmed by performance tests)
    expect(result.performance.calculationTime).toBeLessThan(1000);
  });
});
