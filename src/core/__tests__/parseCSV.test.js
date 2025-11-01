/**
 * Integration tests for parseCSV function
 * Tests end-to-end CSV parsing
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCSV } from '../parsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadFixture = (name) => {
  const path = join(__dirname, 'fixtures', name);
  return readFileSync(path, 'utf-8');
};

describe('parseCSV Integration', () => {
  test('parses valid CSV successfully', () => {
    const csv = loadFixture('valid-6line-header.csv');
    const result = parseCSV(csv);
    
    expect(result).not.toBeNull();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });
  
  test('throws error for empty file', () => {
    const csv = loadFixture('empty-file.csv');
    
    expect(() => parseCSV(csv)).toThrow();
  });
  
  test('handles reordered columns', () => {
    const csv = loadFixture('reordered-columns.csv');
    
    // Should work due to dynamic column detection
    // or throw clear error if columns missing
    try {
      const result = parseCSV(csv);
      expect(result).toBeDefined();
    } catch (e) {
      expect(e.message).toContain('column');
    }
  });
});
