# ðŸš€ START HERE - AGP+ Quick Start

**Version**: v3.14.0 (Export/Import Complete!)  
**Status**: âœ… Production-ready - Full backup & restore  
**Next Phase**: Testing → v3.15.0 (TBD based on feedback)

---

## âš ï¸ CRITICAL: WORK IN SMALL CHUNKS!

**New chat? READ THIS FIRST:**

1. ðŸ›' **NEVER write/edit more than 30 lines at once**
2. ðŸ›' **STOP after every 1-2 edits** and wait for user input
3. ðŸ›' **Ask "Continue?" before next step**
4. ðŸ›' **Use edit_block for small changes** (not full file rewrites)

**Why?** Context window = 190k tokens. Large operations = crash = lost work.

**If you see "go"** â†' Continue to next small step  
**If you see "test"** â†' Wait for test results before continuing  
**If you see "stop"** â†' Immediately stop current operation

---

## âš¡ QUICK START

### 1. Start Server
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### 2. Open Browser
http://localhost:3001

### 3. Upload CSV
Click "Upload CSV" â†' Select Medtronic CareLink export â†' Choose period

**That's it!** âœ…

---

## ðŸ"‹ FOR NEW CHATS

**Read in this order:**
1. **This file** (you are here) - Quick orientation
2. `HANDOFF.md` - Current status + next steps
3. `project/PROJECT_BRIEFING.md` - Full system context (if needed)

**Don't read everything at once!** Use Desktop Commander to fetch files as needed.

**REMEMBER: STOP after 1-2 edits and ask for permission to continue!**

---

## ðŸŽ¯ CURRENT STATUS (v3.14.0)

### What Works âœ…
- **Master dataset** with multi-upload support
- **220 sensors tracked** (no duplicates)
- **Patient info auto-extraction** from CSV  
  - Name, CGM, Device Serial auto-filled
  - Header display: Name | CGM | SN
- **Storage source badges** (RECENT/HISTORICAL)
- **Smart lock toggle** (disabled for read-only)
- **Enhanced error messages** (explains WHY)
- **Dual storage** (SQLite + localStorage) - STABLE
- **TDD insulin metrics** (27.9E Â± 5.4 SD)
- **All clinical metrics** (TIR, TAR, TBR, GMI, MAGE, MODD)
- **âœ… EXPORT/IMPORT** (v3.14.0)
  - Export to JSON (sensors + deleted + metadata)
  - Import with MERGE/REPLACE modes
  - Optional: deleted sensors, lock states
  - Backup & rollback for REPLACE
  - Full validation

### What's Next ðŸ"§
**Phase: Testing & Refinement** (v3.15.0)

**Goal**: Validate export/import, fix any bugs, optimize UX

**Focus Areas:**
1. **Export testing** - Verify JSON format, all data included
2. **Import MERGE** - Test adding new sensors, skip existing
3. **Import REPLACE** - Test wipe + restore, verify rollback
4. **Edge cases** - Invalid JSON, large files, duplicate IDs
5. **UX polish** - Better feedback, progress indicators

**After testing**: 
- Bug fixes based on findings
- Performance optimizations if needed
- Consider next feature (TBD)

---

## ðŸ"‚ KEY FILES

**Core Storage:**
```
src/storage/sensorStorage.js          - Main storage logic + export/import
src/storage/deletedSensorsDB.js       - Persistent deleted sensors (IndexedDB)
```

**UI Components:**
```
src/components/SensorHistoryModal.jsx - Export/import UI
src/components/DayProfilesModal.jsx   - AGP visualization
```

**Export Format** (JSON):
```json
{
  "version": "1.0",
  "exportDate": "2025-10-31T15:30:00Z",
  "sensors": [
    {
      "sensor_id": "NG4A12345",
      "start_date": "2025-10-01T10:00:00Z",
      "end_date": "2025-10-11T08:30:00Z",
      "is_manually_locked": false
    }
  ],
  "deletedSensors": [
    {"sensorId": "NG4A99999", "deletedAt": 1730380800000}
  ],
  "metadata": {
    "totalSensors": 12,
    "deletedCount": 5
  }
}
```

---

## ðŸ"§ COMMON TASKS

### Start Server
```bash
./start.sh
```

### Kill Server
```bash
kill -9 $(lsof -t -i:3001)
```

### Test Export/Import
1. Open Sensor History modal
2. Click "↓ EXPORT" â†' Download JSON
3. Click "↑ IMPORT" â†' Select JSON
4. Choose options (MERGE/REPLACE)
5. Click "âœ" BEVESTIG IMPORT"

### Test with Sample Data
```bash
# Use test CSV:
test-data/SAMPLE__Jo\ Mostert\ 31-10-2025_14d.csv
```

### Commit Changes
```bash
git add .
git commit -m "v3.14.0: Export/Import complete"
git push origin main
```

---

## âš ï¸ IMPORTANT RULES

### 1. Work in Small Chunks (CRITICAL!)
- ðŸ›' Read only what you need
- ðŸ›' Write â‰¤30 lines per operation
- ðŸ›' STOP after 1-2 edits
- ðŸ›' Ask: "Continue to next edit?"
- ðŸ›' Wait for "go" or "test"
- Test after each chunk
- Commit logical changes

### 2. Server on Port 3001
- Always use 3001
- Kill other ports if needed
- Use start.sh for safety

### 3. Document Management
- Keep root folder tidy
- Archive old docs to docs/archive/
- Update CHANGELOG.md on version bump

---

## ðŸ› ï¸ TROUBLESHOOTING

**Server won't start:**
```bash
kill -9 $(lsof -t -i:3001)
npm install
./start.sh
```

**Context overflow:**
- ðŸ›' STOP writing immediately
- Use smaller chunks (â‰¤30 lines)
- Use edit_block instead of write_file
- Read with line ranges, not full files
- Ask before continuing to next edit

**Import fails:**
- Check JSON format (use validator)
- Check version field = "1.0"
- Check sensors array structure
- Check browser console for errors

---

## ðŸ"Š CURRENT METRICS

**From last analysis (14 days):**
- TIR: 73.0% (target >70%) âœ…
- TBR: 1.8% (target <5%) âœ…
- TAR: 25.2% (target <30%) âœ…
- CV: 34.9% (target â‰¤36%) âœ…
- GMI: 6.8% (target <7.0%) âœ…

**System status:**
- 220 sensors tracked
- 94.0% data quality
- All v3.10-v3.14 features stable âœ…
- Export/import working âœ…

---

## ðŸš€ READY TO START?

### For Testing (v3.14.0):
1. Start server: `./start.sh`
2. Open http://localhost:3001
3. Test export/import workflow
4. Report any bugs/issues

### For Development (v3.15.0+):
1. Open `HANDOFF.md` for next steps
2. Start server: `./start.sh`
3. Use Desktop Commander for all file ops
4. ðŸ›' Work in small chunks (â‰¤30 lines)
5. ðŸ›' STOP after 1-2 edits
6. ðŸ›' Ask: "Continue?"
7. Test after each chunk
8. Commit logical changes

**Remember: SMALL CHUNKS! STOP AND ASK!**

**Let's test export/import! ðŸŽ‰**
