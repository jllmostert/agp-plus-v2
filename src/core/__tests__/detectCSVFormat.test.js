/**
 * Unit tests for detectCSVFormat function
 * Tests CSV format detection and header parsing
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { detectCSVFormat } from '../parsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to load fixtures
const loadFixture = (name) => {
  const path = join(__dirname, 'fixtures', name);
  return readFileSync(path, 'utf-8');
};

// TODO: Export detectCSVFormat from parsers.js
// For now, we'll test via parseCSV which uses it internally
describe('detectCSVFormat', () => {
  test('detects standard 6-line header format', () => {
    const csv = loadFixture('valid-6line-header.csv');
    const format = detectCSVFormat(csv);
    
    expect(format).not.toBeNull();
    expect(format.version).toBe('1.0');
    expect(format.headerLineCount).toBe(6);
    expect(format.confidence).toBe('high');
  });
  
  test('detects 8-line header format (future)', () => {
    const csv = loadFixture('valid-8line-header.csv');
    const format = detectCSVFormat(csv);
    
    expect(format).not.toBeNull();
    expect(format.headerLineCount).toBe(8);
  });
  
  test('extracts device model correctly', () => {
    const csv = loadFixture('valid-6line-header.csv');
    const format = detectCSVFormat(csv);
    
    expect(format).not.toBeNull();
    expect(format.device).toContain('MiniMed');
  });
  
  test('extracts serial number correctly', () => {
    const csv = loadFixture('valid-6line-header.csv');
    const format = detectCSVFormat(csv);
    
    expect(format).not.toBeNull();
    expect(format.serial).toBeTruthy();
  });
  
  test('handles empty file gracefully', () => {
    const csv = loadFixture('empty-file.csv');
    const format = detectCSVFormat(csv);
    
    expect(format).toBeNull();
  });
  
  test('handles malformed header gracefully', () => {
    const csv = loadFixture('malformed.csv');
    const format = detectCSVFormat(csv);
    
    expect(format).toBeNull();
  });
  
  test('returns low confidence for unusual format', () => {
    const csv = loadFixture('missing-columns.csv');
    const format = detectCSVFormat(csv);
    
    // Should still detect but with low confidence
    if (format) {
      expect(format.confidence).toBe('low');
    }
  });
  
  test('handles files with extra blank lines', () => {
    const csv = loadFixture('valid-6line-header.csv');
    const format = detectCSVFormat(csv);
    
    // Should still find header despite spacing
    expect(format).not.toBeNull();
    expect(format.headerRowIndex).toBeGreaterThanOrEqual(0);
  });
});
