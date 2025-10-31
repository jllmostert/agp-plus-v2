# 🚀 START HERE - AGP+ Quick Start

**Version**: v3.11.0  
**Status**: ✅ Production-ready  
**Next Phase**: Lock System Enhancement (P2)

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
2. `HANDOFF.md` - Current phase details
3. `DUAL_STORAGE_ANALYSIS.md` - Full context (Issues #1-4)

**Don't read everything at once!** Use Desktop Commander to fetch files as needed.

---

## 🎯 CURRENT STATUS

### What Works ✅
- Master dataset (multi-upload support)
- 220 sensors tracked (no duplicates)
- **Storage source badges** (RECENT/HISTORICAL) 🆕
- **Smart lock toggle** (disabled for read-only) 🆕
- TDD insulin metrics (27.9E ± 5.4 SD)
- Lock system (30-day protection)
- All clinical metrics (TIR, TAR, TBR, GMI, etc)

### Recent Completion 🎉
**v3.11.0: Storage Source Indicators** (Issue #2 - COMPLETE)
- Color-coded badges: RECENT (green) vs HISTORICAL (gray)
- Lock toggle disabled for SQLite sensors
- Enhanced tooltips for all lock states
- Clear visual hierarchy, no confusion

### What's Next 🔧
**Phase: Lock System Enhancement** (3 hours, P2)
- Better error messages for lock operations
- Return full context from getManualLockStatus
- Debug logging for troubleshooting
- Explain WHY actions fail (not just "failed")

See `HANDOFF.md` for implementation details.

---

## 📂 PROJECT LAYOUT

```
agp-plus/
├── HANDOFF.md              ⭐ Start here for development
├── START_HERE.md           ⭐ You are here
├── DUAL_STORAGE_ANALYSIS.md ⭐ Issue context
├── CHANGELOG.md            📜 Version history (v3.11.0 just added)
├── README.md               📖 User documentation
│
├── src/
│   ├── components/         React UI components
│   ├── core/              Pure calculation engines
│   ├── hooks/             React hooks (orchestration)
│   └── storage/           IndexedDB + localStorage
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
git commit -m "v3.12.0: [description]"
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

## 🎯 NEXT PHASE FILES

**You'll need to modify:**
```
src/storage/sensorStorage.js         - Enhance lock API (main work)
```

**You'll reference:**
```
src/components/SensorHistoryModal.jsx - Error display context
src/utils/debug.js                    - Debug patterns
DUAL_STORAGE_ANALYSIS.md             - Why we're doing this
```

See `HANDOFF.md` for step-by-step implementation.

---

## ⚠️ IMPORTANT RULES

### 1. Work in Small Chunks
- Read only what you need
- Write ≤30 lines per operation
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

## 🛠 TROUBLESHOOTING

**Server won't start:**
```bash
kill -9 $(lsof -t -i:3001)
npm install
./start.sh
```

**Sensor badges not showing:**
- Should be fixed in v3.11.0
- Check console for: "duplicatesRemoved: X"
- Verify storageSource field in sensor objects

**Lock toggle not working:**
- Expected for SQLite sensors (>30 days old)
- v3.11.0: Should show cursor: not-allowed
- v3.11.0: Should have 0.5 opacity
- Next phase: Better error messages

**Context overflow:**
- Use Desktop Commander
- Read files with line ranges
- Write in small chunks
- Don't load entire codebase at once

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
- Storage source badges working ✅
- Lock system with visual feedback ✅
- No duplicate sensors ✅

---

## 🎯 PROGRESS ON DUAL_STORAGE_ANALYSIS ISSUES

**Issue Status:**
1. ✅ **localStorage clear edge case** - SOLVED v3.10.0 (IndexedDB tombstone)
2. ✅ **Data source confusion** - SOLVED v3.11.0 (badges + disabled toggles)
3. ⚠️ **Deleted list growth** - Mostly solved (90-day expiry), P3 optional
4. 🔄 **Lock inconsistency** - NEXT PHASE (P2) - Better errors

**Overall Risk**: LOW (2/4 complete, 2/4 low priority)

---

## 🚀 READY TO START?

1. Open `HANDOFF.md` for phase details
2. Start server: `./start.sh`
3. Use Desktop Commander for all file ops
4. Work in small chunks (≤30 lines)
5. Test frequently
6. Commit logical changes

**Let's ship it! 🎉**
