# Phase 4 Testing Checklist

## Pre-Test Setup

- [ ] Server running on port 3001
- [ ] Chrome DevTools console open
- [ ] Test CSV ready: `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv`
- [ ] IndexedDB viewer open (Chrome → Application → IndexedDB → agp-plus-v3)

## Component Integration Tests

### Test 1: Modal Trigger
- [ ] Click **SENSORS** button
- [ ] Modal opens with black overlay
- [ ] Header shows "SENSOR REGISTRATION"
- [ ] Close button (✕) works

### Test 2: File Upload
- [ ] Click "SELECT CSV FILE" button
- [ ] File dialog opens
- [ ] Select test CSV file
- [ ] Button text changes to "📄 SAMPLE__Jo Mostert..."
- [ ] Debug log shows: "File selected: ... KB"

### Test 3: Analysis Process
- [ ] Click "LOAD & ANALYSE" button
- [ ] Button changes to "⚙️ ANALYZING..."
- [ ] Debug log updates in real-time:
  - [ ] "Reading CSV file..."
  - [ ] "CSV loaded: ... lines"
  - [ ] "Parsing CSV sections..."
  - [ ] "Parsed: ... alerts, ... glucose readings"
  - [ ] "Clustering sensor events..."
  - [ ] "Found ... event clusters"
  - [ ] "Detecting glucose gaps..."
  - [ ] "Found ... gaps ≥120 min"
  - [ ] "Matching clusters to gaps..."
  - [ ] "Identified ... sensor change candidates"
  - [ ] "✅ Analysis complete: 2 candidates found"

### Test 4: Candidates Display
- [ ] Section 2 appears: "REVIEW DETECTED SENSORS (2)"
- [ ] Table shows 2 rows
- [ ] **Row 1 - Oct 30, 13:41**:
  - [ ] Timestamp correct
  - [ ] Badge: 🟢 HIGH
  - [ ] Score: 90/100
  - [ ] 3 action buttons visible
- [ ] **Row 2 - Oct 25, 08:11**:
  - [ ] Timestamp correct
  - [ ] Badge: 🟢 HIGH
  - [ ] Score: 80/100
  - [ ] 3 action buttons visible

### Test 5: Confirm Action
- [ ] Note sensor count in IndexedDB (should be 219)
- [ ] Click "✓ CONFIRM" on first candidate
- [ ] Debug log: "✅ Sensor added to database: ID ..."
- [ ] Candidate disappears from table
- [ ] IndexedDB count increases to 220
- [ ] New sensor visible in sensors table with:
  - [ ] Correct insertDate
  - [ ] Notes: "Auto-detected from CSV (confidence: HIGH)"
  - [ ] source: "csv_detection"

### Test 6: Ignore Action
- [ ] Click "✗ IGNORE" on remaining candidate
- [ ] Debug log: "Ignoring candidate: ..."
- [ ] Candidate disappears from table
- [ ] No new sensor added to IndexedDB

### Test 7: Split Action (Placeholder)
- [ ] Click "✂ SPLIT" on any candidate
- [ ] Alert appears: "Split functionality coming in Phase 5"
- [ ] Debug log: "Split requested for: ..."

### Test 8: Re-upload Behavior
- [ ] Upload same CSV again
- [ ] Click "LOAD & ANALYSE"
- [ ] Same 2 candidates appear
- [ ] Confirm one candidate
- [ ] Check IndexedDB for duplicate (should exist - duplicate detection not in Phase 4)

### Test 9: Error Handling
- [ ] Try uploading non-CSV file
- [ ] Error message: "Please select a CSV file"
- [ ] Click "LOAD & ANALYSE" with no file
- [ ] Error message: "No file selected"

### Test 10: Modal Persistence
- [ ] Have candidates displayed
- [ ] Close modal (X button)
- [ ] Reopen modal
- [ ] Previous state cleared (no candidates, no debug log)

## Console Checks

### No Errors Expected
- [ ] No red errors in console
- [ ] No warnings about missing modules
- [ ] All imports resolve correctly

### Expected Console Output
```javascript
[csvSectionParser] Found 3 sections: ...
[glucoseGapAnalyzer] Detected 2 gaps ≥120 min
[sensorDetectionEngine] Matched 2 candidates
[sensorStorage] Added sensor: ...
```

## IndexedDB Verification

### Sensor Object Structure
```javascript
{
  id: 220,
  insertDate: "2025-10-30T13:41:00.000Z",
  endDate: null,
  notes: "Auto-detected from CSV (confidence: HIGH)",
  source: "csv_detection",
  locked: false
}
```

## Known Issues (Expected)

âœ… **These are NOT bugs** (Phase 5 features):
- Duplicate sensors can be added (no duplicate detection yet)
- SPLIT button shows alert (not implemented)
- No lock system (all sensors editable)

## Success Criteria

âœ… **Phase 4 Complete** if:
- [x] Modal opens/closes correctly
- [x] CSV upload works
- [x] Analysis detects 2 candidates
- [x] Both candidates show HIGH confidence
- [x] Confirm adds to IndexedDB
- [x] Ignore removes from list
- [x] Debug log shows all steps
- [x] No console errors

## Performance Expectations

- File load: <1 second (for 7-day CSV)
- Analysis: <2 seconds
- Confirm action: <500ms
- Modal open/close: Instant

## If Tests Fail

### Modal doesn't open
→ Check App.jsx state management for `sensorModalOpen`

### "Module not found" errors
→ Verify Phases 1-3 engines exist in `src/core/`

### No candidates detected
→ Check test CSV path and format
→ Open test harness: http://localhost:3001/test-sensor-detection.html

### IndexedDB not updating
→ Check `sensorStorage.js` addSensor() function
→ Verify IndexedDB schema has sensors table

### Styling issues
→ Verify `SensorRegistration.css` is imported
→ Check for CSS conflicts with existing styles

---

**Phase**: v3.1 Sensor Registration - Phase 4 UI
**Status**: Ready for testing
**Expected Result**: 2/2 sensors detected and confirmable
