# 🚀 START HERE - AGP+ Quick Start

**Version**: v3.12.0  
**Status**: âœ… Production-ready  
**Next Phase**: Optional Maintenance (P3) or Feature Development

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
2. `HANDOFF.md` - Current phase details
3. `DUAL_STORAGE_ANALYSIS.md` - Full context (Issues #1-4)

**Don't read everything at once!** Use Desktop Commander to fetch files as needed.

---

## ðŸŽ¯ CURRENT STATUS

### What Works âœ…
- Master dataset (multi-upload support)
- 220 sensors tracked (no duplicates)
- **Storage source badges** (RECENT/HISTORICAL) âœ…
- **Smart lock toggle** (disabled for read-only) âœ…
- **Enhanced error messages** (explains WHY actions fail) ðŸ†•
- **Debug logging** (full context for troubleshooting) ðŸ†•
- TDD insulin metrics (27.9E Â± 5.4 SD)
- Lock system (30-day protection)
- All clinical metrics (TIR, TAR, TBR, GMI, etc)

### Recent Completion ðŸŽ‰
**v3.12.0: Lock System Enhancement (P2)** (Issue #4 - COMPLETE)
- Enhanced error messages with detail field
- getManualLockStatus returns full context (isEditable, storageSource)
- Context-aware messages for lock/delete operations
- Debug logging for all lock operations
- Clear explanations of WHY actions fail

### What's Next ðŸ"§
**Phase: Optional Maintenance (P3)**
- Add manual "Clear Old Deleted Sensors" button (optional)
- Shows count of deleted sensors
- Clears entries >90 days old
- **Note**: IndexedDB already has 90-day auto-expiry (v3.10.0)

**OR: Ready for New Features**
- Dual storage issues mostly resolved (2/4 complete, 2/4 optional)
- System stable and well-documented
- Ready for user-driven feature development

See `HANDOFF.md` for options.

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
- v3.11.0: Disabled UI (cursor: not-allowed, opacity 0.5)
- v3.12.0: Enhanced error messages explain WHY âœ…

**Lock/delete errors unclear:**
- Fixed in v3.12.0 âœ…
- Error messages now include detail field
- Explains WHY action failed and what to do next
- Console logs show full context

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
- Storage source badges working âœ…
- Lock system with enhanced error messages âœ…
- Debug logging for troubleshooting âœ…
- No duplicate sensors âœ…

---

## ðŸŽ¯ PROGRESS ON DUAL_STORAGE_ANALYSIS ISSUES

**Note**: Issue numbering reflects chronological implementation order, not DUAL_STORAGE_ANALYSIS.md order. See analysis doc for original numbering (Issues #1-4 map differently).

**Issue Status:**
1. âœ… **localStorage clear edge case** - SOLVED v3.10.0 (IndexedDB tombstone)
   - *Analysis Issue #1: Sync race condition*
2. âœ… **Data source confusion** - SOLVED v3.11.0 (badges + disabled toggles)
   - *Analysis Issue #4: Data source confusion*
3. âœ… **Lock inconsistency** - SOLVED v3.12.0 (enhanced error messages) ðŸ†•
   - *Analysis Issue #2: Lock state inconsistency*
4. âš ï¸ **Deleted list growth** - Mostly solved (90-day expiry), P3 optional
   - *Analysis Issue #3: Deleted sensors list growth*

**Overall Risk**: VERY LOW (3/4 complete, 1/4 optional)

**Dual storage architecture is stable!** ðŸŽ‰

---

## 🚀 READY TO START?

1. Open `HANDOFF.md` for phase details
2. Start server: `./start.sh`
3. Use Desktop Commander for all file ops
4. Work in small chunks (≤30 lines)
5. Test frequently
6. Commit logical changes

**Let's ship it! 🎉**
