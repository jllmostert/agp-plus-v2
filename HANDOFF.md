# 📋 HANDOFF - AGP+ v3.13.0 → v3.14.0

**Date**: 2025-10-31  
**Current**: v3.13.0 (Patient Info Auto-Extraction Complete)  
**Next**: v3.14.0 (Sensor Database Export/Import)  
**Branch**: main  
**Server**: http://localhost:3001

---

## ⚠️ CRITICAL: WORK IN SMALL CHUNKS!

**Before you start coding:**
1. 🛑 **STOP after every 1-2 edits** and wait for user input
2. 🛑 **NEVER write more than 30 lines** in one write_file call
3. 🛑 **Use edit_block for surgical changes** instead of rewriting files
4. 🛑 **Ask before continuing** to next step

**Why?** Context window limits (190k tokens). Large operations cause crashes and lost work.

**Pattern:**
```
1. Read file (view with line ranges)
2. Make 1-2 small edits (write_file or edit_block)
3. 🛑 STOP - Ask: "Continue to next edit?"
4. Wait for user "go" or "test" command
5. Repeat
```

---

## 🎯 CURRENT STATE (v3.13.0)

### What Works ✅
- **Master dataset** with multi-upload support
- **Dual storage** (SQLite + localStorage) - STABLE
- **220 sensors tracked** (no duplicates)
- **Patient info auto-extraction** from CSV
- **Storage source badges** - "RECENT" vs "HISTORICAL"
- **Lock system** with enhanced error messages
- **TDD metrics** working correctly (27.9E ± 5.4 SD)
- **All clinical metrics** (TIR, TAR, TBR, GMI, MAGE, MODD)

---

## 🚀 NEXT PHASE: SENSOR DATABASE EXPORT/IMPORT (v3.14.0)

### Goal
Allow users to **backup and restore** their sensor database with full control.

### Features to Implement

**1. Export (JSON Download)**
- All localStorage sensors
- Deleted sensors list + timestamps
- Lock states per sensor
- Validation metadata

**2. Import with Options**
- ☑ Import deleted sensors (checkbox)
- ☑ Import lock states (checkbox)
- â—‹ MERGE mode (add new, keep existing)
- â—‹ REPLACE mode (wipe + restore)

---

## 📐 EXPORT FORMAT (JSON)

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

## 🛠️ IMPLEMENTATION PLAN (7 Chunks, ~3 hours)

### Phase 1: Export (30 min, 2 chunks)

**Chunk 1: Export Function (~25 lines)**
- File: `src/storage/sensorStorage.js`
- Function: `exportSensorsToJSON()`
- Returns: {success, data, filename}

**Chunk 2: Export Button (~15 lines)**
- File: `src/components/SensorHistoryModal.jsx`
- Button in modal footer
- Triggers JSON download

🛑 STOP → Test export works

---

### Phase 2: Import Logic (1 hour, 3 chunks)

**Chunk 3: Validation (~20 lines)**
- File: `src/storage/sensorStorage.js`
- Function: `validateImportData(data)`
- Returns: errors array or null

**Chunk 4: Import Function (~30 lines)**
- File: `src/storage/sensorStorage.js`
- Function: `importSensorsFromJSON(data, options)`
- Options: {importDeleted, importLocks, mode}
- Returns: {success, summary}

**Chunk 5: Safety (~20 lines)**
- Add localStorage backup before REPLACE
- Rollback on error

🛑 STOP → Test merge vs replace

---

### Phase 3: Import UI (1 hour, 2 chunks)

**Chunk 6: File Picker + Preview (~25 lines)**
- File: `src/components/SensorHistoryModal.jsx`
- File input (accept .json)
- Parse + validate on select
- Show preview (sensor count, etc)

**Chunk 7: Options UI (~25 lines)**
- File: `src/components/SensorHistoryModal.jsx`
- Checkboxes: importDeleted, importLocks
- Radio: merge/replace mode
- Confirm button

🛑 STOP → Test all options

---

## âœ… TESTING CHECKLIST

### Export
- [ ] Export button works
- [ ] JSON valid
- [ ] Filename includes date
- [ ] Contains sensors + deleted + metadata

### Import - Validation
- [ ] Invalid JSON rejected
- [ ] Missing version rejected
- [ ] Malformed sensors rejected

### Import - MERGE
- [ ] New sensors added
- [ ] Existing NOT overwritten
- [ ] Options respected

### Import - REPLACE
- [ ] Confirm dialog shown
- [ ] localStorage wiped first
- [ ] All sensors restored
- [ ] Options respected

---

## 📁 FILES TO EDIT

```
src/storage/sensorStorage.js          (3 new functions)
src/components/SensorHistoryModal.jsx (export + import UI)
CHANGELOG.md                          (v3.14.0 entry)
```

---

## 🚨 EDGE CASES

**1. Import older sensors (>30 days)**
- Add to localStorage anyway (user explicitly imported)

**2. Duplicate sensor IDs**
- MERGE: Skip, keep existing
- REPLACE: Import overwrites

**3. Malformed JSON**
- Show error, reject import

**4. Deleted sensors in SQLite**
- Add to tombstone (prevent sync re-adding)

---

## ðŸ›' READY TO START?

1. Read `START_HERE_v3.14.md` for overview
2. Start server: `./start.sh`
3. Begin with Chunk 1 (export function)
4. 🛑 STOP after each chunk
5. Test after each phase
6. Commit after completion

**Remember: SMALL CHUNKS! STOP AND ASK!**

**Let's ship export/import! 🎉**
