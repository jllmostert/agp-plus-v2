# 🚀 START HERE - AGP+ Quick Start

**Version**: v3.13.0 → v3.14.0 (next)  
**Status**: ✅ Production-ready - Ready for Export/Import  
**Next Phase**: Sensor Database Export/Import (3 hours, 7 chunks)

---

## ⚠️ CRITICAL: WORK IN SMALL CHUNKS!

**New chat? READ THIS FIRST:**

1. 🛑 **NEVER write/edit more than 30 lines at once**
2. 🛑 **STOP after every 1-2 edits** and wait for user input
3. 🛑 **Ask "Continue?" before next step**
4. 🛑 **Use edit_block for small changes** (not full file rewrites)

**Why?** Context window = 190k tokens. Large operations = crash = lost work.

**If you see "go"** → Continue to next small step  
**If you see "test"** → Wait for test results before continuing  
**If you see "stop"** → Immediately stop current operation

---

## ⚡ QUICK START

### 1. Start Server
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### 2. Open Browser
http://localhost:3001

### 3. Upload CSV
Click "Upload CSV" → Select Medtronic CareLink export → Choose period

**That's it!** ✅

---

## 📋 FOR NEW CHATS

**Read in this order:**
1. **This file** (you are here) - Quick orientation
2. `HANDOFF.md` - Export/Import implementation plan
3. `project/PROJECT_BRIEFING.md` - Full system context

**Don't read everything at once!** Use Desktop Commander to fetch files as needed.

**REMEMBER: STOP after 1-2 edits and ask for permission to continue!**

---

## 🎯 CURRENT STATUS (v3.13.0)

### What Works ✅
- Master dataset with multi-upload support
- 220 sensors tracked (no duplicates)
- **Patient info auto-extraction** from CSV  
  - Name, CGM, Device Serial auto-filled
  - Header display: Name | CGM | SN
- **Storage source badges** (RECENT/HISTORICAL)
- **Smart lock toggle** (disabled for read-only)
- **Enhanced error messages** (explains WHY)
- **Dual storage** (SQLite + localStorage) - STABLE
- TDD insulin metrics (27.9E ± 5.4 SD)
- All clinical metrics (TIR, TAR, TBR, GMI, MAGE, MODD)

### What's Next 🔧
**Phase: Sensor Database Export/Import** (v3.14.0)

**Goal**: Backup & restore sensor database with full control

**Features to Implement:**
1. **Export** (JSON format)
   - All localStorage sensors
   - Deleted sensors list + timestamps
   - Lock states per sensor
   - Validation metadata

2. **Import** with flexible options:
   - ☑ Import deleted sensors (optional)
   - ☑ Import lock states (optional)
   - â—‹ MERGE mode (add new, keep existing)
   - â—‹ REPLACE mode (wipe + restore)

**Implementation: 7 Chunks (~3 hours)**

**Phase 1: Export (30 min)**
1. Chunk 1: `exportSensorsToJSON()` function (~25 lines)
2. Chunk 2: Export button in SensorHistoryModal (~15 lines)

**Phase 2: Import Logic (1 hour)**
3. Chunk 3: `validateImportData()` function (~20 lines)
4. Chunk 4: `importSensorsFromJSON()` function (~30 lines)
5. Chunk 5: Merge/replace logic (~20 lines)

**Phase 3: Import UI (1 hour)**
6. Chunk 6: File picker + preview display (~25 lines)
7. Chunk 7: Options UI (checkboxes + radio) (~25 lines)

**Testing: 30 min**
- Export test (download works, JSON valid)
- Import MERGE test (adds new, keeps existing)
- Import REPLACE test (wipes + restores)
- Options test (checkboxes work correctly)

See `HANDOFF.md` for full design specification.

---

## 📂 KEY FILES FOR EXPORT/IMPORT

```
src/storage/sensorStorage.js       - Add export/import functions here
src/components/SensorHistoryModal.jsx  - Add UI buttons here
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

## 🔧 COMMON TASKS

### Start Server
```bash
./start.sh
```

### Kill Server
```bash
kill -9 $(lsof -t -i:3001)
```

### Test with Sample Data
```bash
# Use test CSV:
test-data/SAMPLE__Jo\ Mostert\ 31-10-2025_14d.csv
```

### Commit Changes
```bash
git add .
git commit -m "v3.14.0: [description]"
git push origin main
```

---

## ⚠️ IMPORTANT RULES

### 1. Work in Small Chunks (CRITICAL!)
- 🛑 Read only what you need
- 🛑 Write ≤30 lines per operation
- 🛑 STOP after 1-2 edits
- 🛑 Ask: "Continue to next edit?"
- 🛑 Wait for "go" or "test"
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

## 🛠️ TROUBLESHOOTING

**Server won't start:**
```bash
kill -9 $(lsof -t -i:3001)
npm install
./start.sh
```

**Context overflow:**
- 🛑 STOP writing immediately
- Use smaller chunks (≤30 lines)
- Use edit_block instead of write_file
- Read with line ranges, not full files
- Ask before continuing to next edit

---

## 📊 CURRENT METRICS

**From last analysis (14 days):**
- TIR: 73.0% (target >70%) ✅
- TBR: 1.8% (target <5%) ✅
- TAR: 25.2% (target <30%) ✅
- CV: 34.9% (target ≤36%) ✅
- GMI: 6.8% (target <7.0%) ✅

**System status:**
- 220 sensors tracked
- 94.0% data quality
- All v3.10-v3.13 fixes stable ✅

---

## 🚀 READY TO START?

1. Open `HANDOFF.md` for detailed export/import plan
2. Start server: `./start.sh`
3. Use Desktop Commander for all file ops
4. 🛑 Work in small chunks (≤30 lines)
5. 🛑 STOP after 1-2 edits
6. 🛑 Ask: "Continue?"
7. Test after each chunk
8. Commit logical changes

**Remember: SMALL CHUNKS! STOP AND ASK!**

**Let's ship export/import! 🎉**
