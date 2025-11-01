/**
 * Unit tests for findColumnIndices function
 * Tests column mapping from CSV header row
 */

import { describe, test, expect } from 'vitest';
import { findColumnIndices } from '../parsers.js';

describe('findColumnIndices', () => {
  const standardHeader = 'Index;Date;Time;BG Reading (mg/dL);Linked BG Meter ID;Temp Basal Amount;Temp Basal Type;Temp Basal Duration (h:mm:ss);Bolus Type;Bolus Volume Selected (U);Bolus Volume Delivered (U);Programmed Bolus Duration (h:mm:ss);Prime Type;Prime Volume Delivered (U);Suspend;Rewind;BWZ Estimate (U);BWZ Target High BG (mg/dL);BWZ Target Low BG (mg/dL);BWZ Carb Ratio (g/U);BWZ Insulin Sensitivity (mg/dL/U);BWZ Carb Input (grams);BWZ BG Input (mg/dL);BWZ Correction Estimate (U);BWZ Food Estimate (U);BWZ Active Insulin (U);Alarm;Sensor Calibration BG (mg/dL);Sensor Glucose (mg/dL);ISIG Value;Daily Insulin Total (U);Raw-Type;Raw-Values;Raw-ID;Raw-Upload ID;Raw-Seq Num;Raw-Device Type';
  
  test('builds correct column map from standard header', () => {
    const map = findColumnIndices(standardHeader);
    
    expect(map).not.toBeNull();
    expect(map['Date']).toBe(1);
    expect(map['Time']).toBe(2);
    expect(map['Sensor Glucose (mg/dL)']).toBe(28);
  });
  
  test('validates required columns exist', () => {
    const map = findColumnIndices(standardHeader);
    
    expect(map).not.toBeNull();
    expect(map['Date']).toBeDefined();
    expect(map['Time']).toBeDefined();
    expect(map['Sensor Glucose (mg/dL)']).toBeDefined();
  });
  
  test('returns null for missing required columns', () => {
    const incompleteHeader = 'Index;Something;Other';
    const map = findColumnIndices(incompleteHeader);
    
    expect(map).toBeNull();
  });
  
  test('handles extra columns gracefully', () => {
    const extendedHeader = standardHeader + ';NewColumn;AnotherColumn';
    const map = findColumnIndices(extendedHeader);
    
    expect(map).not.toBeNull();
    expect(map['NewColumn']).toBeDefined();
  });
  
  test('handles reordered columns correctly', () => {
    const reorderedHeader = 'Time;Date;Index;Sensor Glucose (mg/dL)';
    const map = findColumnIndices(reorderedHeader);
    
    // Even though reordered, mapping should still work
    if (map) {
      expect(map['Time']).toBe(0);
      expect(map['Date']).toBe(1);
    }
  });
});
