# 🚀 START HERE - AGP+ v3.8.2

**Last Updated:** 27 oktober 2025  
**Status:** Phase 2 Complete ✅ | Phase 3 Ready  
**Read Time:** 2 minuten

---

## ⚡ QUICK START

### Server Commands
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### Current State
- **Version:** 3.8.2
- **Branch:** v3.0-dev (up to date)
- **Data:** 28,528 glucose readings, 219 sensors, 346 workdays
- **Last Work:** Sensor visualization in day profiles (Phase 2B)

---

## 🔧 ESSENTIAL TOOLS

**Desktop Commander** (MANDATORY for all file operations)
- Project is on laptop, NOT in container
- Path: `/Users/jomostert/Documents/Projects/agp-plus/`
- Use absolute paths always

**Chrome Connector**
- App runs on `localhost:3001`
- Use for UI testing and interaction

**Git Workflow**
- Branch: `v3.0-dev` (long-lived feature branch)
- Commit frequently, push after each phase
- Main branch: stable releases only

---

## 📚 DOCUMENTATION TIERS

### TIER 1: You Are Here
`START_HERE.md` - This file (quick orientation)

### TIER 2: Domain Topics (150-250 lines each)
Choose based on your task:

**Need to understand the system?**
→ `ARCHITECTURE.md` (3-layer model, data flow, storage)

**Need to code/debug?**
→ `DEVELOPMENT.md` (patterns, testing, common fixes)

**Working on sensors?**
→ `SENSOR_SYSTEM.md` (Phase 2 work, import, visualization)

**Need git help?**
→ `GIT_WORKFLOW.md` (branching, commits, recovery)

### TIER 3: Deep Reference (unlimited depth)
When you need ALL the details:

**Full technical spec:**
→ `PROJECT_BRIEFING_V3_8.md` (528 lines - complete system)

**Version history:**
→ `CHANGELOG.md` (what changed when)

**Recent work summary:**
→ `PHASE_2_COMPLETE.md` (Phase 2A+2B details)

**Implementation code:**
→ `/src` directory (actual source files)

---

## 🎯 COMMON TASKS → WHERE TO START

| Task | Read First | Then Read |
|------|-----------|-----------|
| Continue from previous session | `PHASE_2_COMPLETE.md` | `SENSOR_SYSTEM.md` |
| Fix a bug | `DEVELOPMENT.md` | `ARCHITECTURE.md` |
| Add new feature | `ARCHITECTURE.md` | Relevant engine file |
| Understand data flow | `ARCHITECTURE.md` | `PROJECT_BRIEFING_V3_8.md` |
| Git confusion | `GIT_WORKFLOW.md` | Git docs |
| What's the current status? | `CHANGELOG.md` (top entries) | This file |
| Deploy/build | `README.md` | `package.json` scripts |

---

## ⚠️ CRITICAL RULES (Never Break These)

### 1. Architecture Layers (SACRED)
```
COMPONENTS (React UI only)
    ↓ call
HOOKS (State management, orchestration)
    ↓ call  
ENGINES (Pure business logic, no React)
    ↓ use
STORAGE (IndexedDB + localStorage)
```
**Rule:** Business logic NEVER goes in components. Period.

### 2. File Operations
- ✅ Use Desktop Commander for ALL file operations
- ❌ NEVER use standard file tools (bash_tool, create_file, etc.)
- ✅ Always use absolute paths: `/Users/jomostert/Documents/Projects/agp-plus/...`
- ❌ Relative paths may fail (not in container)

### 3. Design Philosophy
- **Brutalist design is intentional** (not lazy)
- 3px black borders = clinical clarity
- Monospace only (Courier New)
- Print compatibility required (patterns work in B&W)
- Clinical accuracy > aesthetics ALWAYS

### 4. Data Integrity
- All metrics follow ADA/ATTD guidelines
- Work in mg/dL only (no mmol/L)
- Console logs for debugging only (remove before commit)
- Error logging stays (user-facing errors important)

---

## 🐛 KNOWN ISSUES (Phase 3 TODO)

### High Priority
1. **Comparison date validation** - Breaks when prev period outside dataset
   - File: `src/hooks/useComparison.js`
   - Impact: Comparison feature unusable

2. **ProTime persistence** - Workdays sometimes reset on reload
   - File: `src/hooks/useMasterDataset.js`
   - Impact: User frustration

3. **Cartridge change rendering** - Events detected but not visible
   - File: `src/components/DayProfileCard.jsx`
   - Impact: Missing orange lines in day profiles

### Read More
→ `PROJECT_BRIEFING_V3_8.md` section "Known Issues"

---

## 📊 PROJECT STATUS

### ✅ Completed Phases

**Phase 0: Foundation** (v3.0.0)
- Multi-year storage architecture
- Month-bucketed IndexedDB
- V2 ↔ V3 transformation layer

**Phase 1: Core Storage** (v3.1-3.7)
- Master dataset CRUD
- Event detection
- Database export (JSON)

**Phase 2A: Sensor Import** (v3.8.1)
- SQLite file import (sql.js)
- 219 sensors in localStorage
- UI stats display

**Phase 2B: Sensor Visualization** (v3.8.2) 
- Red dashed lines in day profiles
- Database-driven detection
- Metadata (lot, duration)

### 🎯 Current Phase: Phase 3

**Goals:**
- Fix comparison date validation
- Ensure ProTime persistence  
- Debug cartridge rendering

**Next Up:** Phase 4 (Direct CSV → V3 upload)

---

## 🎓 FOR NEW AI ASSISTANTS

### First 5 Minutes
1. Read this file (you're doing it!)
2. Run server command
3. Open `localhost:3001` in Chrome
4. Check `CHANGELOG.md` top 3 entries
5. You're ready to work!

### When Stuck
- **"I don't understand the architecture"** → Read `ARCHITECTURE.md`
- **"How do I test this?"** → Read `DEVELOPMENT.md`
- **"What does this code do?"** → Read inline comments + `PROJECT_BRIEFING_V3_8.md`
- **"Git is confusing"** → Read `GIT_WORKFLOW.md`

### What NOT To Do
❌ Put business logic in components (use engines)  
❌ Use regular file tools (use Desktop Commander)  
❌ Add color-dependent info (breaks printing)  
❌ Change brutalist design (it's intentional)  
❌ Remove error logging (users need feedback)  

---

## 📞 QUICK REFERENCE

**Repository:** `jllmostert/agp-plus-v2`  
**Branch:** `v3.0-dev`  
**Server:** `localhost:3001`  
**Project Path:** `/Users/jomostert/Documents/Projects/agp-plus/`

**Key Files:**
- `src/storage/masterDatasetStorage.js` - Glucose data
- `src/storage/sensorStorage.js` - Sensor database
- `src/hooks/useMasterDataset.js` - Data loading
- `src/core/day-profile-engine.js` - Daily analysis

**Documentation:**
- TIER 1: `START_HERE.md` (this file)
- TIER 2: `ARCHITECTURE.md`, `DEVELOPMENT.md`, `SENSOR_SYSTEM.md`
- TIER 3: `PROJECT_BRIEFING_V3_8.md`, `CHANGELOG.md`

---

**Ready to work?**  
Pick a task from "Common Tasks" above → Read the domain doc → Start coding! 🚀
