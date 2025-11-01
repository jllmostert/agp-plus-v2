# Block B.8: Parser Unit Tests - Implementation Plan

**Created**: 2025-11-01 21:25  
**Status**: Planning Phase  
**Estimated Time**: 3 hours  
**Priority**: HIGH (completes Block B parser robustness)

---

## 🎯 OBJECTIVE

Add comprehensive unit tests for CSV parser to ensure:
1. **Format detection** works correctly
2. **Column mapping** handles all cases
3. **Metadata extraction** is reliable
4. **Edge cases** don't break parser
5. **Regression prevention** for future changes

---

## 📦 PHASE 1: Test Infrastructure Setup (30 min)

### 1.1 Install Test Framework (10 min)
```bash
npm install --save-dev vitest @vitest/ui
```

**Why Vitest?**
- ✅ Native ESM support (AGP+ uses ES modules)
- ✅ Vite integration (we already use Vite)
- ✅ Fast and modern
- ✅ Jest-compatible API

### 1.2 Update package.json (5 min)
Add test script:
```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

### 1.3 Create Test Fixtures Directory (5 min)
```bash
mkdir -p src/core/__tests__/fixtures
```

### 1.4 Create Sample Test Files (10 min)
**Fixtures needed**:
- `valid-6line-header.csv` - Standard MiniMed format
- `valid-8line-header.csv` - Future format with more header lines
- `reordered-columns.csv` - Columns in different order
- `missing-columns.csv` - Missing required columns
- `empty-file.csv` - Empty CSV
- `malformed.csv` - Broken structure

---

## 📋 PHASE 2: Core Parser Tests (90 min)

### 2.1 detectCSVFormat() Tests (30 min)

**File**: `src/core/__tests__/detectCSVFormat.test.js`

**Test Cases**:
```javascript
describe('detectCSVFormat', () => {
  test('detects standard 6-line header format', () => {
    // Format v1.0, 6 header lines, high confidence
  });
  
  test('detects 8-line header format (future)', () => {
    // Adapts to longer header
  });
  
  test('extracts device model correctly', () => {
    // Returns "MiniMed 780G MMT-1886"
  });
  
  test('extracts serial number correctly', () => {
    // Returns "NG4114235H"
  });
  
  test('returns null for empty file', () => {
    // Graceful failure
  });
  
  test('returns null for malformed header', () => {
    // Graceful failure
  });
  
  test('returns low confidence for unusual format', () => {
    // confidence: 'low'
  });
  
  test('handles files with extra blank lines', () => {
    // Still finds header
  });
});
```

**Estimated**: 30 minutes (8 tests)

---

### 2.2 findColumnIndices() Tests (20 min)

**File**: `src/core/__tests__/findColumnIndices.test.js`

**Test Cases**:
```javascript
describe('findColumnIndices', () => {
  test('builds correct column map from standard header', () => {
    // Returns { 'Date': 1, 'Time': 2, ... }
  });
  
  test('validates required columns exist', () => {
    // Date, Time, Sensor Glucose must be present
  });
  
  test('returns null for missing required columns', () => {
    // Graceful failure
  });
  
  test('handles extra columns gracefully', () => {
    // Ignores unknown columns
  });
  
  test('handles reordered columns correctly', () => {
    // Order doesn't matter, mapping is correct
  });
});
```

**Estimated**: 20 minutes (5 tests)

---

### 2.3 parseCSVMetadata() Tests (20 min)

**File**: `src/core/__tests__/parseCSVMetadata.test.js`

**Test Cases**:
```javascript
describe('parseCSVMetadata', () => {
  test('extracts patient name correctly', () => {
    // Returns "Jo Mostert"
  });
  
  test('extracts device model', () => {
    // Returns "MiniMed 780G MMT-1886"
  });
  
  test('extracts serial number', () => {
    // Returns "NG4114235H"
  });
  
  test('extracts CGM type', () => {
    // Returns "Guardian™ 4 Sensor"
  });
  
  test('handles missing metadata gracefully', () => {
    // Returns null or partial data
  });
  
  test('handles quoted values correctly', () => {
    // Strips quotes from "Mostert"
  });
});
```

**Estimated**: 20 minutes (6 tests)

---

### 2.4 parseCSV() Integration Tests (20 min)

**File**: `src/core/__tests__/parseCSV.test.js`

**Test Cases**:
```javascript
describe('parseCSV', () => {
  test('parses valid CSV with 6-line header', () => {
    // Returns {data: Array, section2: Array}
  });
  
  test('parses CSV with reordered columns', () => {
    // Dynamic column detection works
  });
  
  test('throws error for empty file', () => {
    // Clear error message
  });
  
  test('throws error for missing required columns', () => {
    // Clear error message
  });
  
  test('filters out-of-bounds glucose readings', () => {
    // <20 or >600 excluded
  });
  
  test('parses insulin data correctly', () => {
    // section2 array populated
  });
  
  test('handles EU decimal format (comma)', () => {
    // "123,4" → 123.4
  });
  
  test('adapts to 8-line header format', () => {
    // Future-proofing test
  });
});
```

**Estimated**: 20 minutes (8 tests)

---

## 📋 PHASE 3: Edge Case Tests (30 min)

### 3.1 Edge Case Coverage

**File**: `src/core/__tests__/parser.edge-cases.test.js`

**Test Cases**:
```javascript
describe('Parser Edge Cases', () => {
  test('handles very large CSV (100k+ rows)', () => {
    // Performance check
  });
  
  test('handles CSV with special characters in data', () => {
    // Quotes, semicolons, newlines
  });
  
  test('handles incomplete last row', () => {
    // Truncated file
  });
  
  test('handles mixed line endings (CRLF/LF)', () => {
    // Windows vs Mac/Linux
  });
  
  test('handles UTF-8 BOM correctly', () => {
    // ﻿ at start of file
  });
  
  test('handles timezone data correctly', () => {
    // Brussels timezone parsing
  });
});
```

**Estimated**: 30 minutes (6 tests)

---

## 📋 PHASE 4: Documentation & Cleanup (30 min)

### 4.1 Add Test Documentation (15 min)
- Update README.md with testing instructions
- Add `docs/TESTING.md` guide
- Document test fixtures

### 4.2 Run Full Test Suite (10 min)
```bash
npm test
npm run test:coverage
```

**Coverage Goals**:
- `parsers.js`: >80% coverage
- `detectCSVFormat()`: 100% coverage
- `findColumnIndices()`: 100% coverage

### 4.3 Git Commit (5 min)
```bash
git add src/core/__tests__
git commit -m "test(parser): Add comprehensive unit tests (Block B.8)"
git push origin main
```

---

## 📊 TIME BREAKDOWN

| Phase | Task | Time | Cumulative |
|-------|------|------|------------|
| **1** | Test infrastructure | 30m | 30m |
| **2.1** | detectCSVFormat tests | 30m | 60m |
| **2.2** | findColumnIndices tests | 20m | 80m |
| **2.3** | parseCSVMetadata tests | 20m | 100m |
| **2.4** | parseCSV integration | 20m | 120m |
| **3** | Edge cases | 30m | 150m |
| **4** | Documentation | 30m | **180m** |

**Total**: 3 hours (180 minutes)

---

## âœ… SUCCESS CRITERIA

**Code**:
- [ ] 33 unit tests written and passing
- [ ] Test coverage >80% for parsers.js
- [ ] All edge cases covered
- [ ] Tests run in <5 seconds

**Quality**:
- [ ] Clear test descriptions
- [ ] Good fixtures (realistic data)
- [ ] Tests are deterministic (no flaky tests)
- [ ] Tests document expected behavior

**Documentation**:
- [ ] README.md updated with test commands
- [ ] TESTING.md guide created
- [ ] Test fixtures documented

---

## 🚀 NEXT STEPS (After B.8)

**Block C: Performance & Monitoring**
- Add performance benchmarking tests
- Profile metrics engine
- Optimize slow operations

**Block D: Architecture Improvements**
- Migrate stock to IndexedDB
- Unified storage backend
- Atomic transactions

---

## 📝 NOTES

**Why B.8 is Important**:
- Prevents regressions from future changes
- Documents expected behavior
- Catches bugs before production
- Enables confident refactoring

**Test-First Development**:
- Write failing test → Implement feature → Test passes
- Red → Green → Refactor cycle
- Higher code quality

**Maintenance**:
- Run tests before every commit
- Update tests when adding features
- Keep fixtures realistic and up-to-date

---

**Plan Version**: 1.0  
**Last Updated**: 2025-11-01 21:25  
**Status**: Ready for Implementation
