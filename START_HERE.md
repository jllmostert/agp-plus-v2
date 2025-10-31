# 🚀 START HERE - AGP+ Quick Start

**Version**: v3.15.1  
**Status**: ✅ PRODUCTION READY  
**Branch**: main  
**Server**: http://localhost:3001

---

## ✅ CURRENT STATUS

### v3.15.1 Complete - Two-Phase Upload Flow

**Architecture Refactor:** ✅ COMPLETE  
**Status:** Production ready, all features operational

**What Changed:**
- ✅ Two-phase upload flow (detect → suggest → store)
- ✅ Pre-storage batch matching (true pre-processing)
- ✅ Atomic sensor + assignment operations
- ✅ Idempotent (works with or without stock batches)

**Flow:**
```
Upload CSV → Detect Sensors → Find Matches → User Confirms → Store + Assign
```

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

### 3. Test Two-Phase Flow
- Add stock batch with lot number (e.g., "NG4A12345")
- Upload CSV with matching sensors
- Dialog appears BEFORE storage (new!)
- Confirm assignments
- Sensors stored + assigned atomically
- Verify BATCH badges in sensor history

---

## 🎯 FEATURES

### Stock Management (v3.15.0)
- ✅ Add/edit/delete batches
- ✅ Track lot numbers, expiry dates
- ✅ Assign sensors to batches
- ✅ Auto-assignment suggestions
- ✅ Keyboard shortcuts (N/Escape)
- ✅ Export/Import full state

### Two-Phase Upload (v3.15.1)
- ✅ Sensors detected before storage
- ✅ Batch matching happens pre-storage
- ✅ User sees suggestions before commit
- ✅ Atomic operations (no orphans)
- ✅ Fully idempotent

---

## 📊 ARCHITECTURE

### Storage Layer
```
detectSensors()               - Detection without storage
findBatchSuggestionsForSensors()  - Pre-store matching
uploadCSVToV3()               - Two-phase coordinator
completeCSVUploadWithAssignments() - Atomic completion
storeSensors()                - Actual storage
```

### UI Layer
```
handleCSVLoad()               - Handles needsConfirmation
handleBatchAssignmentConfirm() - Completes with assignments
handleBatchAssignmentCancel() - Completes without assignments
```

---

## 📂 KEY FILES

### Stock Management
```
src/storage/stockStorage.js              - 169 lines - CRUD operations
src/core/stock-engine.js                  - 202 lines - Business logic
src/components/StockManagementModal.jsx   - 257 lines - Main modal
src/components/BatchAssignmentDialog.jsx  - 207 lines - Auto-assignment UI
```

### Two-Phase Flow (NEW)
```
src/storage/masterDatasetStorage.js      - detectSensors()
                                          - findBatchSuggestionsForSensors()
                                          - completeCSVUploadWithAssignments()
src/components/AGPGenerator.jsx          - Two-phase handlers
```

---

## 🧪 TESTING CHECKLIST

### Basic Functionality
- [ ] Server starts on port 3001
- [ ] VOORRAAD button visible
- [ ] Can add/edit/delete batches
- [ ] Keyboard shortcuts work (N/Escape)

### Two-Phase Upload Flow
- [ ] Upload CSV without batches → sensors stored immediately
- [ ] Upload CSV with matching lot → dialog appears
- [ ] Cancel → sensors stored without assignments
- [ ] Confirm → sensors stored + assigned atomically
- [ ] No duplicate suggestions
- [ ] BATCH badges display correctly

### Data Integrity
- [ ] Export includes batches/assignments
- [ ] Import restores full state
- [ ] No orphan assignments
- [ ] Cascade deletes work

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
- v3.15.1 production ready ✅

---

## 📚 DOCUMENTATION FILES

**Current:**
- `START_HERE.md` (this file) - Quick start
- `HANDOFF.md` - Detailed technical info
- `CHANGELOG.md` - Version history

**Project:**
- `project/PROJECT_BRIEFING.md` - Complete architecture
- `project/V3_ARCHITECTURE.md` - Technical deep-dive
- `reference/minimed_780g_ref.md` - Device reference
- `reference/metric_definitions.md` - Clinical metrics

**Archive:**
- `docs/archive/DUAL_STORAGE_ANALYSIS_RESOLVED.md` - Historical analysis
- `docs/archive/PHASE_5_COMPLETE.md` - Phase 5 summary

---

## 🚀 READY TO USE

**For Development:** Type **"dev"** to start server  
**For Testing:** Type **"test"** for test scenarios  
**For More Info:** See `HANDOFF.md` or `PROJECT_BRIEFING.md`

**System is production ready! 🎯**
