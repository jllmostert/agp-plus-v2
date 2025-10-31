# ðŸ"‹ HANDOFF - AGP+ v3.14.0 â†' v3.15.0

**Date**: 2025-10-31  
**Current**: v3.14.0 (Export/Import Complete)  
**Next**: v3.15.0 (Testing & Refinement)  
**Branch**: main  
**Server**: http://localhost:3001

---

## âš ï¸ CRITICAL: WORK IN SMALL CHUNKS!

**Before you start coding:**
1. ðŸ›' **STOP after every 1-2 edits** and wait for user input
2. ðŸ›' **NEVER write more than 30 lines** in one write_file call
3. ðŸ›' **Use edit_block for surgical changes** instead of rewriting files
4. ðŸ›' **Ask before continuing** to next step

**Why?** Context window limits (190k tokens). Large operations cause crashes and lost work.

**Pattern:**
```
1. Read file (view with line ranges)
2. Make 1-2 small edits (write_file or edit_block)
3. ðŸ›' STOP - Ask: "Continue to next edit?"
4. Wait for user "go" or "test" command
5. Repeat
```

---

## ðŸŽ¯ CURRENT STATE (v3.14.0)

### What Works âœ…
- **Master dataset** with multi-upload support
- **Dual storage** (SQLite + localStorage) - STABLE
- **220 sensors tracked** (no duplicates)
- **Patient info auto-extraction** from CSV
- **Storage source badges** - "RECENT" vs "HISTORICAL"
- **Lock system** with enhanced error messages
- **TDD metrics** working correctly (27.9E Â± 5.4 SD)
- **All clinical metrics** (TIR, TAR, TBR, GMI, MAGE, MODD)
- **âœ… Export/Import System** (NEW!)
  - Export sensors to JSON
  - Import with MERGE/REPLACE modes
  - Validation of import data
  - Backup & rollback for REPLACE
  - Optional: deleted sensors, lock states

---

## ðŸš€ CURRENT PHASE: TESTING v3.14.0

### Goal
Thoroughly test export/import functionality before moving to v3.15.0.

### Test Scenarios

**1. Export Testing**
- [ ] Export with 0 sensors (should fail gracefully)
- [ ] Export with 10+ sensors (check JSON format)
- [ ] Export with deleted sensors (check timestamps)
- [ ] Export with mixed lock states
- [ ] Verify filename format: `agp-sensors-YYYY-MM-DD.json`
- [ ] Verify all fields present in JSON

**2. Import MERGE Testing**
- [ ] Import new sensors (should add, not skip)
- [ ] Import duplicate sensors (should skip)
- [ ] Import with deleted sensors enabled
- [ ] Import with deleted sensors disabled
- [ ] Import with lock states enabled
- [ ] Import with lock states disabled
- [ ] Verify summary counts correct

**3. Import REPLACE Testing**
- [ ] Confirm dialog shows correct counts
- [ ] Replace wipes existing sensors
- [ ] Replace restores from backup
- [ ] Rollback works on error
- [ ] Deleted sensors imported correctly
- [ ] Page reload shows new data

**4. Validation Testing**
- [ ] Invalid JSON rejected
- [ ] Missing version rejected
- [ ] Wrong version rejected (not "1.0")
- [ ] Missing sensors array rejected
- [ ] Missing deletedSensors array rejected
- [ ] Malformed sensor objects rejected
- [ ] Error messages are clear

**5. Edge Cases**
- [ ] Large file (100+ sensors)
- [ ] Empty sensors array
- [ ] Sensors with missing fields
- [ ] Duplicate sensor IDs in import
- [ ] Import older sensors (>30 days)
- [ ] Import during active CSV upload

**6. UX Testing**
- [ ] File picker works
- [ ] Preview displays correctly
- [ ] Options checkboxes toggle
- [ ] Mode radio buttons toggle
- [ ] Confirm button shows success/error
- [ ] Page reload preserves data

---

## ðŸ› BUG TRACKING

**Found during testing:**

| Bug ID | Description | Severity | Status | Fix Version |
|--------|-------------|----------|--------|-------------|
| - | - | - | - | - |

*(Fill in as bugs are discovered)*

---

## ðŸ"„ NEXT PHASE: v3.15.0 (TBD)

### Potential Features
Based on testing feedback, v3.15.0 might include:

**Option A: UX Improvements**
- Progress indicators for import/export
- Drag & drop file upload
- Better error messages with recovery suggestions
- Toast notifications instead of alerts

**Option B: Advanced Import**
- Selective sensor import (choose which sensors)
- Conflict resolution UI (keep existing vs import)
- Import from multiple files
- Auto-merge duplicates

**Option C: Export Enhancements**
- Export filtered subset (date range, lot number)
- Export to CSV format
- Export with statistics report
- Scheduled auto-exports

**Option D: New Analytics**
- Sensor trend analysis over time
- Lot number quality tracking
- Failure pattern detection
- Success rate predictions

**Decision**: Wait for testing feedback before committing to v3.15.0 scope.

---

## ðŸ"‚ FILES CHANGED IN v3.14.0

```
src/storage/deletedSensorsDB.js       - Added getDeletedSensorsWithTimestamps()
src/storage/sensorStorage.js          - Added export/import/validation/backup functions
src/components/SensorHistoryModal.jsx - Added export/import UI
```

**New Functions Added:**
- `getDeletedSensorsWithTimestamps()` - Helper for export
- `exportSensorsToJSON()` - Export main function
- `validateImportData()` - JSON validation
- `importSensorsFromJSON()` - Import main function
- `createDatabaseBackup()` - Pre-import backup
- `restoreDatabaseBackup()` - Rollback on error
- `clearDatabaseBackup()` - Cleanup after success

**UI Changes:**
- Import button (blue, "↑ IMPORT")
- Export button (green, "↓ EXPORT")
- Import preview panel (shows file info)
- Options UI (checkboxes + radio buttons)
- Confirm button (full width, blue)

---

## ðŸ§ª TESTING WORKFLOW

### 1. Start Testing Session
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
./start.sh
```

### 2. Open Browser
http://localhost:3001

### 3. Test Export
1. Upload test CSV
2. Open Sensor History modal
3. Click "↓ EXPORT"
4. Download JSON
5. Open JSON in editor
6. Verify format matches spec

### 4. Test Import MERGE
1. Modify JSON (change 1 sensor ID)
2. Click "↑ IMPORT"
3. Select modified JSON
4. Choose MERGE mode
5. Enable all options
6. Click "âœ" BEVESTIG IMPORT"
7. Verify summary shows 1 added, rest skipped

### 5. Test Import REPLACE
1. Click "↑ IMPORT"
2. Select original JSON
3. Choose REPLACE mode
4. Confirm warning
5. Click "âœ" BEVESTIG IMPORT"
6. Verify all sensors restored

### 6. Document Findings
- Screenshot any errors
- Note console warnings
- Record unexpected behavior
- Suggest improvements

---

## ðŸ"Š PERFORMANCE NOTES

**File Size Limits:**
- localStorage: ~5-10MB (browser dependent)
- 220 sensors ≈ 200KB JSON
- Safe up to ~10,000 sensors before localStorage concerns

**Import Speed:**
- 10 sensors: <100ms
- 100 sensors: <500ms
- 1000 sensors: <2s

**Export Speed:**
- Always <100ms (synchronous localStorage read)

---

## ðŸ'¡ IMPLEMENTATION NOTES

### Why JSON Format?
- Human-readable
- Easy to validate
- Standard tooling support
- Portable across platforms
- Future-proof for API integration

### Why MERGE vs REPLACE?
- MERGE: Safe, non-destructive (default)
- REPLACE: Dangerous, needs confirmation
- Both needed for different use cases:
  - MERGE: Add new sensors from colleague
  - REPLACE: Restore from backup

### Why Backup & Rollback?
- REPLACE is destructive
- User might click by accident
- localStorage can't do transactions
- Backup = insurance policy

---

## ðŸ" FOR NEW DEVELOPERS

**Understanding the Architecture:**

**Dual Storage:**
- SQLite (read-only): Historical sensors >30 days
- localStorage (editable): Recent sensors ≤30 days
- Export only exports localStorage (editable data)
- Import adds to localStorage (becomes editable)

**Deleted Sensors:**
- IndexedDB = source of truth (survives localStorage.clear)
- localStorage = fast cache (rebuilt from IndexedDB)
- Export includes deleted list with timestamps
- Import adds to IndexedDB (optional)

**Lock States:**
- Auto-calculated: Based on age (>30 days = locked)
- Manual: User can override (localStorage only)
- Import can preserve or recalculate (optional)

---

## âš¡ QUICK REFERENCE

### Testing Commands
```bash
# Start server
./start.sh

# Kill server
kill -9 $(lsof -t -i:3001)

# Check logs
# (Browser console, not terminal)
```

### Test Data Location
```
test-data/SAMPLE__Jo Mostert 31-10-2025_14d.csv
```

### Expected JSON Structure
```json
{
  "version": "1.0",
  "exportDate": "ISO timestamp",
  "sensors": [...],
  "deletedSensors": [...],
  "metadata": {...}
}
```

---

## ðŸš€ READY TO TEST?

1. Read `START_HERE.md` for quick start
2. Start server: `./start.sh`
3. Follow testing workflow above
4. Document findings
5. Report bugs
6. Suggest v3.15.0 features

**Remember: TESTING FIRST! Then v3.15.0 planning.**

**Let's ship a stable export/import! ðŸŽ‰**
