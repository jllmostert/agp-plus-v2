# AGP+ Development Handoff - Import/Export Session

**Date**: 2025-11-07 21:00  
**Version**: v3.8.0 (dev iterations)  
**Branch**: develop  
**Server**: ✅ RUNNING on http://localhost:3003  
**Owner**: Jo Mostert  

---

## 🎯 SESSION GOAL: Enhanced Export (Task 1.1)

**Objective**: Complete JSON export with ALL data types  
**Time**: ~45 minutes  
**Phase**: Foundation Backend (Option A)

### What We're Building
Add missing data types to `src/storage/export.js`:
- ProTime workday data (localStorage)
- Patient info (localStorage)  
- Stock batches (localStorage)
- Update schema version

**Result**: Export contains EVERYTHING (no data loss)

---

## 📋 TASK 1.1 BREAKDOWN

### Subtasks (15-20 min each)
- [ ] **1.1.1** - Add ProTime workday data (15min)
- [ ] **1.1.2** - Add patient info (10min)
- [ ] **1.1.3** - Add stock batches (10min)
- [ ] **1.1.4** - Update schema version (5min)
- [ ] **1.1.5** - Test complete export (5min)

**Total**: ~45 minutes

---

## 🛠️ CRITICAL WORK INSTRUCTIONS

### Desktop Commander Usage (MANDATORY)
```
✅ Use: Desktop Commander for ALL file operations
✅ read_file with length/offset for large files
✅ edit_block for surgical edits
✅ write_file in 25-30 line chunks

❌ NEVER: Use bash_tool for file edits
❌ NEVER: Large file rewrites (>100 lines)
```

### Token Management (CRITICAL)
- Small edits only (5-10 lines per operation)
- Read files in chunks (length=50, offset=X)
- User interaction every 15-20 minutes
- **CHECK-IN AFTER EACH SUBTASK**

### Crash Prevention Protocol
1. Complete ONE subtask (15-20 min)
2. Test the change works
3. Commit to git
4. Update PROGRESS.md
5. Ask user: "Continue to next subtask?"
6. **WAIT FOR USER RESPONSE**

---

## 📂 KEY FILES

### Target File
```
src/storage/export.js
- Function: exportMasterDataset()
- Lines: ~100 (read in chunks!)
- Current version: "3.0"
- Target version: "3.8.0"
```

### Reference Files
```
src/storage/sensorStorage.js - getStockBatches()
localStorage keys:
- 'workday-dates' (ProTime data)
- 'patient-info' (patient metadata)
```

---

## 🎬 STARTING PROCEDURE

### Step 1: Verify Server (1 min)
```bash
# Server ALREADY RUNNING
# URL: http://localhost:3003
# Just verify it responds
```

### Step 2: Read Current Export Function (2 min)
```javascript
// Desktop Commander:
read_file src/storage/export.js
// Look for exportMasterDataset() function
// Find where cartridges are added
```

### Step 3: Start with Subtask 1.1.1 (15 min)
```javascript
// ADD after cartridges line:

// ProTime workday data
const workdaysRaw = localStorage.getItem('workday-dates');
const workdays = workdaysRaw ? JSON.parse(workdaysRaw) : [];

// Update exportData object:
const exportData = {
  version: "3.8.0",  // UPDATE THIS
  exportDate: new Date().toISOString(),
  generator: "AGP+ v3.8.0",
  totalReadings,
  totalMonths: months.length,
  totalSensors: sensors.length,
  totalCartridges: cartridges.length,
  totalWorkdays: workdays.length,  // NEW
  months,
  sensors,
  cartridges,
  workdays  // NEW
};
```

### Step 4: Test (3 min)
1. Open app: http://localhost:3003
2. Upload test CSV
3. Export data (look for button)
4. Open JSON in text editor
5. Verify `workdays` array exists

### Step 5: Commit (2 min)
```bash
git add src/storage/export.js
git commit -m "feat(export): Add ProTime workday data to JSON export"
```

### Step 6: Update Progress (1 min)
```
PROGRESS.md:
- [x] 1.1.1 - ProTime workday data ✅
```

### Step 7: ASK USER
**"Subtask 1.1.1 complete! Continue to 1.1.2 (patient info)?"**

**⏸️ WAIT FOR RESPONSE**

---

## 📊 CURRENT STATE

### What Works ✅
- Export: glucose, sensors, cartridges
- Import: SQLite sensors (read-only)
- HTML exports: AGP + Day Profiles

### What's Missing ❌
- Export: ProTime, patient info, stock batches
- Import: JSON master dataset
- Validation: dry-run, schema checking
- UI: centralized data management

### Git Status
```
Branch: develop
Last Commit: de1ba51 (v3.9.0 MAGE/MODD)
Working Tree: clean
Remote: up-to-date
```

---

## 🎯 SUCCESS CRITERIA (Task 1.1)

After 45 minutes:
- ✅ Export JSON contains `workdays` array
- ✅ Export JSON contains `patient` object
- ✅ Export JSON contains `stockBatches` array
- ✅ Schema version = "3.8.0"
- ✅ File size reasonable (test with 90-day CSV)
- ✅ All changes committed to git

---

## 📖 REFERENCE DOCS

**Read these if stuck**:
- `/mnt/user-data/uploads/JSON_HANDOFF.md` - Full task breakdown
- `/mnt/user-data/uploads/IMPORT_EXPORT_ANALYSIS.md` - Architecture

**Related Files**:
- `src/storage/sensorStorage.js` - Stock batch functions
- `src/components/DataExportModal.jsx` - Export UI (not connected yet)

---

## ⚠️ CRITICAL REMINDERS

### DO:
✅ Use Desktop Commander for file ops
✅ Small edits (5-10 lines)
✅ User check-in every 15-20 min
✅ Update PROGRESS.md after each subtask
✅ Commit after each subtask
✅ Test immediately after changes

### DON'T:
❌ Large file rewrites
❌ Work >20 min without user interaction
❌ Skip testing
❌ Forget to commit
❌ Use bash_tool for edits

---

## 🚀 QUICK START COMMAND

```javascript
// Assistant's first action:
read_file(/Users/jomostert/Documents/Projects/agp-plus/src/storage/export.js, 
  {length: 50, offset: 0})

// Then locate exportMasterDataset() function
// Then start Subtask 1.1.1
```

---

## 📈 NEXT STEPS (After Task 1.1)

**Session continues with**:
- Task 1.2: JSON Import Function (~90 min)
- Task 1.3: Validation (~60 min)

**Total Phase 1**: ~3 hours for complete round-trip

---

**Status**: 📋 READY TO START Task 1.1  
**Server**: ✅ Running on port 3003  
**Focus**: Enhanced Export (45 min)  

**REMEMBER**: Small chunks + User interaction + Desktop Commander

---

**End of Handoff**
