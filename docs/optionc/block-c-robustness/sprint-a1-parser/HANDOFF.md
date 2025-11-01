# SPRINT A1: PARSER ROBUSTNESS

**Block**: C - Robustness  
**Sprint**: A1 - Parser Robustness  
**Effort**: 8 hours  
**Status**: 🔄 READY TO START  
**Last Update**: 2025-11-02

---

## 🎯 DOEL

Future-proof the CSV parser against:
1. **Medtronic format changes** - Column order/additions won't break parser
2. **Invalid sensor readings** - Filter out physically impossible values
3. **Edge cases** - Missing columns, corrupt data, malformed CSVs

**Waarom kritiek**: 
- Medtronic HAS changed CSV format in the past
- Current parser uses hardcoded indices (fragile!)
- Invalid sensor readings (e.g., 0 mg/dL) can corrupt metrics
- For v4.0: Parser must be BULLETPROOF

---

## 📋 TAKEN (8u totaal)

### Taak 1: Dynamic Column Detection (4u)

**Doel**: Replace all hardcoded column indices with dynamic header-based lookup

**Current Problem**:
```javascript
// parsers.js - FRAGILE!
const sensorSerial = row[34];  // What if column moves?
const glucoseValue = row[13];  // What if Medtronic adds columns?
const timestamp = row[18];     // Breaks on format change!
```

**Subtaken**:
- [ ] Create column mapping function (1h)
  - Parse header row
  - Find indices for: Sensor SN, Glucose Value, Timestamp, Pump SN, etc.
  - Validate all required columns exist
  
- [ ] Update detectSensors() (1h)
  - Use dynamic column indices
  - Add column validation
  - Clear error messages if columns missing
  
- [ ] Update extractSensorData() (1h)
  - Use dynamic column indices for all fields
  - Handle missing optional columns gracefully
  
- [ ] Update processReadingsForSensor() (1h)
  - Dynamic glucose value extraction
  - Dynamic timestamp extraction
  - Maintain performance

**Success criteria**:
- No hardcoded indices remain (search for `row[13]`, `row[18]`, etc.)
- Parser works even if columns reorder
- Clear error if required column missing
- Performance unchanged (<100ms for detection)

**Files**: `/src/core/parsers.js` (lines 1-100, 200-300)

---

### Taak 2: Glucose Bounds Validation (2u)

**Doel**: Filter out physically impossible glucose readings

**Current Problem**:
- Sensor errors can produce values like 0, 5, or 800 mg/dL
- These corrupt metrics (mean, SD, MAGE calculations)
- No validation = garbage in, garbage out

**Clinical Context** (from minimed_780g_ref.md):
- **Sensor range**: 40-400 mg/dL (typical)
- **Clinical range**: 20-600 mg/dL (absolute limits)
- **Below 20**: Sensor malfunction (not survivable glucose)
- **Above 600**: Sensor saturation or error

**Subtaken**:
- [ ] Add bounds constants (15 min)
  ```javascript
  const GLUCOSE_MIN = 20;  // mg/dL
  const GLUCOSE_MAX = 600; // mg/dL
  ```
  
- [ ] Implement filtering in processReadingsForSensor() (45 min)
  - Filter readings outside bounds
  - Log filtered count (for debugging)
  - Preserve original count for metadata
  
- [ ] Add validation stats to detection result (30 min)
  - Total readings
  - Filtered count
  - Filter percentage
  - Show in UI if >5% filtered
  
- [ ] Testing with edge cases (30 min)
  - Test with all-invalid data (should fail gracefully)
  - Test with partially invalid data (should filter only bad readings)
  - Test with perfect data (should pass all through)

**Success criteria**:
- All readings <20 mg/dL filtered
- All readings >600 mg/dL filtered
- Filtered count logged to console
- Metrics calculated only on valid data
- Detection still works if all data filtered (empty sensor warning)

**Files**: 
- `/src/core/parsers.js` (processReadingsForSensor function)
- `/src/core/sensorDetectionEngine.js` (detection results)

---

### Taak 3: Parser Unit Tests (2u)

**Doel**: Comprehensive test coverage for all parser edge cases

**Subtaken**:
- [ ] Setup test file structure (15 min)
  - Create `/src/core/__tests__/parsers.test.js`
  - Import parsers functions
  - Setup test data fixtures
  
- [ ] Column detection tests (30 min)
  - [ ] Test: Standard Medtronic format (all columns present)
  - [ ] Test: Reordered columns (different order, same headers)
  - [ ] Test: Missing required column (should error)
  - [ ] Test: Extra columns (should ignore)
  
- [ ] Glucose bounds tests (30 min)
  - [ ] Test: All valid readings (none filtered)
  - [ ] Test: Some invalid readings (partial filter)
  - [ ] Test: All invalid readings (empty sensor warning)
  - [ ] Test: Edge values (20, 600 exactly - should pass)
  
- [ ] Sensor detection tests (30 min)
  - [ ] Test: Single sensor CSV
  - [ ] Test: Multiple sensors CSV
  - [ ] Test: No glucose data (should skip)
  - [ ] Test: Corrupt CSV (should error gracefully)
  
- [ ] Performance validation (15 min)
  - [ ] Test: Large CSV (10,000+ rows) <100ms detection
  - [ ] Test: Multiple sensors (5+ sensors) <500ms total

**Success criteria**:
- All tests pass
- >80% code coverage for parsers.js
- Edge cases documented
- Performance targets validated

**Files**: `/src/core/__tests__/parsers.test.js` (new, ~400 lines)

---

## 📁 FILES

**Te lezen**:
- `/src/core/parsers.js` (538 lines) - Main parser logic
- `/src/core/sensorDetectionEngine.js` (300 lines) - Sensor detection orchestration
- `/test-data/sample-export.csv` - Sample Medtronic CSV

**Te wijzigen**:
- `/src/core/parsers.js` - Dynamic columns + bounds validation
- `/src/core/sensorDetectionEngine.js` - Update detection results

**Te maken**:
- `/src/core/__tests__/parsers.test.js` - Unit tests

**Reference**:
- `/docs/reference/minimed_780g_ref.md` - Sensor specifications
- `/docs/analysis/DOMAIN_A_PARSER_ANALYSIS.md` - Parser architecture

---

## 🚀 WORKFLOW

### Start Sprint
```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Check you're on develop
git status
git pull origin develop

# Go to sprint folder
cd docs/optionc/block-c-robustness/sprint-a1-parser

# Read this HANDOFF
cat HANDOFF.md

# Create PROGRESS.md
touch PROGRESS.md
```

### During Sprint
**Work in small chunks** (max 30 min per subtask)  
**Update PROGRESS.md** after each chunk (real-time!)  
**Commit frequently**:
```bash
git add .
git commit -m "refactor(parser): Add dynamic column detection"
git push origin develop
```

### Testing Strategy
```bash
# Run parser tests
cd /Users/jomostert/Documents/Projects/agp-plus
npm test parsers

# Run full test suite
npm test

# Check coverage
npm test -- --coverage
```

### End Sprint
```bash
# Final commit
git add .
git commit -m "feat(sprint-a1): Complete parser robustness

- Dynamic column detection (no hardcoded indices)
- Glucose bounds validation (20-600 mg/dL)
- Comprehensive unit tests (15+ tests, all passing)
- Coverage: 85%+
- Performance: <100ms detection maintained"

git push origin develop

# Update MASTER_PROGRESS.md
cd ../../..
# Mark Sprint A1 as complete
```

---

## 💡 TIPS

**Dynamic Column Detection**:
```javascript
// Example approach:
function getColumnIndices(headerRow) {
  const headers = headerRow.split(',');
  return {
    sensorSN: headers.indexOf('Sensor SN'),
    glucoseValue: headers.indexOf('Sensor Glucose (mg/dL)'),
    timestamp: headers.indexOf('Timestamp'),
    pumpSN: headers.indexOf('Pump SN'),
    // ... etc
  };
}
```

**Bounds Validation**:
```javascript
// Example approach:
const validReadings = readings.filter(r => {
  const glucose = parseFloat(r.glucose_value);
  return glucose >= GLUCOSE_MIN && glucose <= GLUCOSE_MAX;
});

if (validReadings.length < readings.length) {
  console.log(`Filtered ${readings.length - validReadings.length} invalid readings`);
}
```

**Test Data**:
- Use actual CSV snippets from `/test-data/`
- Create synthetic edge cases (all zeros, all 999s)
- Document expected behavior in test names

**Token Management**:
- Read parsers.js in chunks (view with offset/length)
- Write tests incrementally (one suite at a time)
- Commit after each major change

---

## ✅ DEFINITION OF DONE

- [ ] All hardcoded column indices removed
- [ ] Dynamic column detection implemented
- [ ] Column validation with clear errors
- [ ] Glucose bounds validation (20-600 mg/dL)
- [ ] Filtered reading stats logged
- [ ] 15+ unit tests created
- [ ] All tests passing
- [ ] Code coverage >80% for parsers.js
- [ ] Performance maintained (<100ms detection)
- [ ] PROGRESS.md updated with session notes
- [ ] Git committed + pushed
- [ ] MASTER_PROGRESS.md updated

---

**Version**: 1.0  
**Created**: 2025-11-02  
**Ready**: YES - Start when you want!
