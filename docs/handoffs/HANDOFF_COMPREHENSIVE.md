# AGP+ Project Handoff - Comprehensive

**Version**: v4.3.0  
**Last Session**: 32 (2025-11-15)  
**Project Path**: `/Users/jomostert/Documents/Projects/agp-plus`  
**Status**: ✅ Production Ready, Phase 1 Refactoring Complete

---

## 🎯 CURRENT STATE

### What Just Happened (Session 32)
**Phase 1 Refactoring is COMPLETE!** 🎉

We just finished extracting all state management into custom hooks:
- ✅ useModalState (7 state vars)
- ✅ usePanelNavigation (3 state vars)
- ✅ useImportExport (9 state vars)

**Result**: AGPGenerator reduced by 330 lines, complexity down 41%

### Version Info
- **Package.json**: v4.3.0
- **Production**: Fully functional
- **No known bugs**: All tests passing

---
## 📂 PROJECT STRUCTURE

```
/Users/jomostert/Documents/Projects/agp-plus/
├── src/
│   ├── components/        # UI components
│   │   ├── AGPGenerator.jsx      # Main app (1667 lines, was 1999)
│   │   ├── panels/               # Panel components
│   │   ├── charts/               # Chart components
│   │   └── modals/               # Modal dialogs
│   ├── hooks/            # Custom React hooks ⭐ NEW
│   │   ├── useModalState.js      # Modal state management
│   │   ├── usePanelNavigation.js # Panel nav + keyboard
│   │   └── useImportExport.js    # Import/export logic
│   ├── core/             # Calculation engines
│   │   ├── parsers.js            # CSV parsing (dynamic columns)
│   │   ├── metrics-engine.js     # MAGE, MODD, GRI, etc.
│   │   └── day-profile-engine.js # Day profiles
│   ├── storage/          # Data persistence
│   │   ├── db.js                 # IndexedDB setup
│   │   ├── sensorStorage.js      # Async sensor CRUD
│   │   ├── stockStorage.js       # Stock management
│   │   └── masterDatasetStorage.js
│   └── styles/
│       └── globals.css           # Brutalist color system
├── docs/
│   ├── handoffs/         # Session handoffs & plans
│   ├── project/          # Reference docs (medical, specs)
│   ├── analysis/         # Architecture docs
│   ├── reference/        # Git cheatsheets, commands
│   └── archive/          # Historical docs & optionc
├── CHANGELOG.md          # Version history
└── README.md             # Main readme
```

---
## 🚀 HOW TO START SERVER

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

**URL**: http://localhost:3001

---

## ✅ WHAT'S WORKING

### Core Features
- ✅ CSV Import, AGP Generation, Day Profiles (7/14 days)
- ✅ Metrics: TIR, TAR, TBR, CV, GMI, MAGE, MODD, GRI
- ✅ Sensor Management (IndexedDB + SQLite dual storage)
- ✅ Stock Management, ProTime, Import/Export, Print

### Storage Architecture
- **IndexedDB**: Primary storage
- **SQLite**: Historical sensors (>30 days, read-only)
- **localStorage**: Settings, deleted sensors list

---

## 🧪 WHAT SHOULD BE TESTED

### High Priority (Do First)
1. **Basic Flow** ⚠️ CRITICAL
   - [ ] Import CSV → Metrics calculate
   - [ ] Navigate panels, Open/close modals
2. **Import/Export** (Just refactored!)
   - [ ] JSON import/export, Progress tracking, Merge strategies
3. **Sensor Management**
   - [ ] Add/Lock/Delete sensors, Assign to stock

---

## 📚 KEY DOCUMENTATION

**Must-Read**:
1. `docs/handoffs/REFACTOR_MASTER_PLAN.md` - 97h plan to v5.0
2. `docs/handoffs/PROGRESS.md` - Session log
3. `CHANGELOG.md` - Version history

**Medical Reference**:
4. `docs/project/minimed_780g_ref.md` - Pump settings
5. `docs/project/metric_definitions.md` - Glucose metrics
6. `docs/analysis/TIER2_SYNTHESIS.md` - Architecture

---

**Full docs at**: docs/handoffs/HANDOFF_COMPREHENSIVE.md (this file)
**Quick reference**: docs/handoffs/HANDOFF.md
