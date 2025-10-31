# 🚀 START HERE - AGP+ Quick Start

**Version**: v3.13.0  
**Status**: ✅ Production-ready - Patient info auto-extraction working!  
**Next Phase**: Sensor Export/Import or Optional Maintenance

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

**Patient info now auto-populates!** 🎉
- Name, CGM, Device Serial extracted from CSV
- Shown under "PATIËNT" button in header
- Edit manually via "PATIËNT" button (DOB, physician, email)

---

## 📋 FOR NEW CHATS

**Read in this order:**
1. **This file** (you are here) - Quick orientation
2. `HANDOFF.md` - Current phase details + SMALL CHUNKS WARNING
3. `DUAL_STORAGE_ANALYSIS.md` - Full context (if needed)

**Don't read everything at once!** Use Desktop Commander to fetch files as needed.

**REMEMBER: STOP after 1-2 edits and ask for permission to continue!**

---

## 🎯 CURRENT STATUS

### What Works ✅
- Master dataset (multi-upload support)
- 220 sensors tracked (no duplicates)
- **Patient info auto-extraction** from CSV (NEW! 🎉)
  - Name, CGM, Device Serial auto-filled
  - DOB, physician, email manually editable
  - Header display shows: Name, CGM, SN
- **Storage source badges** (RECENT/HISTORICAL) ✅
- **Smart lock toggle** (disabled for read-only) ✅
- **Enhanced error messages** (explains WHY actions fail) ✅
- **Debug logging** (full context for troubleshooting) ✅
- TDD insulin metrics (27.9E ± 5.4 SD)
- Lock system (30-day protection)
- All clinical metrics (TIR, TAR, TBR, GMI, etc)

### Recent Completion 🎉
**v3.13.0: Patient Info Auto-Extraction** (COMPLETE)
- parseCSVMetadata() called in uploadCSVToV3
- Auto-extracts: Name, CGM Device, Device Serial, Pump Device
- Saved to patientStorage (IndexedDB)
- Displayed in header under "PATIËNT" button
- PatientInfo modal shows all fields (editable)
- DOB preserved (not overwritten by CSV)

**What You See:**
```
Header:
Jo Mostert
CGM: Guardian™ 4 Sensor
SN: NG4114235H  ← Auto-extracted!
```

### What's Next 🔧
**Phase: Choose Your Adventure**
1. **Sensor Export/Import** (4-6 hours, small chunks)
2. **P3 Maintenance** (Clear deleted sensors button, 1 hour)
3. **Polish & Refine** (UI/UX improvements)

See `HANDOFF.md` for details.

---

## 📂 PROJECT LAYOUT

```
agp-plus/
├── HANDOFF.md              ⭐ Start here for development
├── START_HERE.md           ⭐ You are here
├── DUAL_STORAGE_ANALYSIS.md ⭐ Issue context
├── CHANGELOG.md            📜 Version history (v3.13.0 just added)
├── README.md               📖 User documentation
│
├── src/
│   ├── components/         React UI components
│   ├── core/              Pure calculation engines (parsers.js ⭐)
│   ├── hooks/             React hooks (orchestration)
│   └── storage/           IndexedDB + localStorage (masterDatasetStorage.js ⭐)
│
├── project/               Core documentation
│   ├── V3_ARCHITECTURE.md
│   ├── STATUS.md
│   └── TEST_PLAN.md
│
├── reference/             Clinical specs
│   ├── metric_definitions.md
│   └── minimed_780g_ref.md
│
├── docs/
│   ├── archive/          Old analysis docs
│   └── handoffs/         Previous handoffs
│
└── test-data/            Sample CSV files
```

---

## 🔧 COMMON TASKS

### Start Server
```bash
./start.sh
# Or manually:
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
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
git commit -m "v3.13.0: [description]"
git push origin main
```

---

## 🛠️ USE DESKTOP COMMANDER

**For ALL file operations:**
- ✅ `read_file` - Read code (with line ranges)
- ✅ `write_file` - Write in chunks (≤30 lines)
- ✅ `edit_block` - Surgical edits
- ✅ `list_directory` - Navigate
- ✅ `start_process` - Run commands

**Why?** 
- Prevents context overflow
- Enables progress tracking
- Better error handling

**Never manually edit files in this chat!**

---

## 🎯 FILES YOU'LL TOUCH (v3.13.0+)

**Patient Info (v3.13.0):**
```
src/core/parsers.js                   - parseCSVMetadata() extracts from CSV
src/storage/masterDatasetStorage.js   - uploadCSVToV3() calls parser
src/utils/patientStorage.js           - IndexedDB storage layer
src/components/PatientInfo.jsx        - Edit modal
src/components/AGPGenerator.jsx       - Header display
```

**For Export/Import (next):**
```
src/storage/sensorStorage.js          - Export logic here
src/components/SensorHistoryModal.jsx - Add export/import buttons
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

### 4. Design System
- Black background (#000000)
- High contrast (white/orange/green/red)
- 3px solid borders
- Monospace typography
- NO gradients, shadows, rounded corners

---

## 🛠️ TROUBLESHOOTING

**Server won't start:**
```bash
kill -9 $(lsof -t -i:3001)
npm install
./start.sh
```

**Patient info not showing:**
- Re-upload CSV to trigger parseCSVMetadata
- Check console: "Patient metadata saved" log
- Open "PATIËNT" button → modal should show data
- Check DevTools > IndexedDB > agp-database > settings

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
- Patient info auto-extraction working ✅
- Storage source badges working ✅
- Lock system with enhanced errors ✅
- Debug logging for troubleshooting ✅
- No duplicate sensors ✅

---

## 🎯 PROGRESS TRACKER

**Dual Storage Issues (from DUAL_STORAGE_ANALYSIS.md):**
1. ✅ localStorage clear edge case - SOLVED v3.10.0
2. ✅ Data source confusion - SOLVED v3.11.0
3. ✅ Lock inconsistency - SOLVED v3.12.0
4. ✅ Patient info extraction - SOLVED v3.13.0

**All major issues resolved! 🎉**

---

## 🚀 READY TO START?

1. Open `HANDOFF.md` for phase details
2. Start server: `./start.sh`
3. Use Desktop Commander for all file ops
4. 🛑 Work in small chunks (≤30 lines)
5. 🛑 STOP after 1-2 edits
6. 🛑 Ask: "Continue?"
7. Test frequently
8. Commit logical changes

**Remember: SMALL CHUNKS! STOP AND ASK!**

**Let's ship it! 🎉**
