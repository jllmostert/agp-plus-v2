/**
 * Unit tests for parseCSVMetadata function
 * Tests metadata extraction from CSV header
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseCSVMetadata } from '../parsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadFixture = (name) => {
  const path = join(__dirname, 'fixtures', name);
  return readFileSync(path, 'utf-8');
};

describe('parseCSVMetadata', () => {
  test('extracts patient name correctly', () => {
    const csv = loadFixture('valid-6line-header.csv');
    const metadata = parseCSVMetadata(csv);
    
    expect(metadata).not.toBeNull();
    expect(metadata.name).toBeTruthy();
  });
  
  test('handles missing metadata gracefully', () => {
    const csv = loadFixture('malformed.csv');
    const metadata = parseCSVMetadata(csv);
    
    // Should handle gracefully, not crash
    expect(metadata).toBeDefined();
  });
});
