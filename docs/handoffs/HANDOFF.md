# AGP+ Quick Handoff

**v4.3.0** | **Path**: `/Users/jomostert/Documents/Projects/agp-plus` | **Status**: ✅ Production Ready

---

## 🚀 START SERVER (30 SECONDS)

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

Open: http://localhost:3001

---

## 📂 CRITICAL FILES

```
src/
├── components/AGPGenerator.jsx    # Main app (1667 lines)
├── hooks/                         # ⭐ NEW: useModalState, usePanelNavigation, useImportExport
├── core/
│   ├── parsers.js                 # CSV parsing (dynamic columns!)
│   └── metrics-engine.js          # MAGE, MODD, GRI, TIR, etc.
├── storage/
│   ├── db.js                      # IndexedDB setup
│   └── sensorStorage.js           # Async sensor CRUD
└── styles/globals.css             # Brutalist colors (use CSS vars!)

docs/project/
├── minimed_780g_ref.md           # Pump settings reference
└── metric_definitions.md         # Metric formulas

docs/handoffs/
├── REFACTOR_MASTER_PLAN.md       # 97h plan to v5.0
└── PROGRESS.md                    # Session log
```

---

## ✅ WHAT WORKS

- ✅ CSV import (Medtronic CareLink)
- ✅ AGP generation (14-day)
- ✅ Metrics: TIR, TAR, TBR, CV, GMI, MAGE, MODD, GRI
- ✅ Sensor management (dual storage: IndexedDB + SQLite)
- ✅ Stock management (batch tracking)
- ✅ Import/export JSON (backup/restore)
- ✅ ProTime PDF parsing
- ✅ Day profiles (7/14 days toggle)
- ✅ Print-ready reports

---

## ⚠️ TEST AFTER CHANGES

**Critical Flow** (5 min):
1. Import CSV → Metrics calculate
2. Navigate panels (Ctrl+1/2/3/4)
3. Open modals → Close modals
4. Import JSON → Export JSON

**If you touched**:
- Storage → Test sensor add/delete/lock
- Hooks → Test modal/panel state
- Parser → Test CSV import with real data
- Charts → Check AGP/day profiles render

---

## 🐛 COMMON ISSUES

**Server won't start**
```bash
lsof -ti:3001 | xargs kill -9
npx vite --port 3002
```

**Import fails**
→ Check console for `[useImportExport]` logs  
→ Validate JSON structure

**Sensor duplicates**
→ Check localStorage: `agp-deleted-sensors`  
→ Should not happen (deduplication works)

**Performance lag**
→ Open React DevTools Profiler  
→ AGPGenerator still large (1667 lines)  
→ Solution: Context API (Track 3, Q1)

---

## 💻 CODE PATTERNS

**Custom Hooks** (NEW!)
```js
const modals = useModalState();
const panels = usePanelNavigation();
const importExport = useImportExport();

// State
modals.patientInfoOpen
importExport.isImporting

// Methods
modals.openModal('patientInfo')
await importExport.executeImport()
```

**Storage** (ALL ASYNC!)
```js
const sensors = await getAllSensors();
await addSensor(sensor);
await deleteSensor(id);
```

**Styling** (CSS vars ONLY!)
```css
background: var(--paper);  /* Never #FFFEF9 */
color: var(--ink);         /* Never #0A0A0A */
border: 3px solid var(--ink);
```

**Parser** (Dynamic columns!)
```js
// ✅ GOOD
const glucose = getColumn(headers, row, 'Sensor Glucose (mg/dL)');

// ❌ BAD (old hardcoded way)
const glucose = row[5]; // NEVER DO THIS!
```

---

## 🎯 QUICK TASKS

**Add modal**: useModalState → ModalManager.jsx → Button  
**Add panel**: New component → AGPGenerator switch → Nav button  
**Add metric**: metrics-engine.js → Add test → Display in AGPPanel  
**Fix bug**: Console logs → React DevTools → Surgical edit

---

## 📋 NEXT STEPS (Pick One)

**A. Continue Refactoring** (Recommended)
→ Track 3, Sprint Q1: Context API (20h)  
→ See `docs/handoffs/REFACTOR_MASTER_PLAN.md`

**B. Quick Feature**
→ Check feature request → Implement → Test → Update PROGRESS.md

**C. Debug Issue**
→ Reproduce → Console logs → Fix → Test → Commit

---

## 🚨 RED FLAGS

**STOP if you see**:
- AGPGenerator.jsx growing (should shrink!)
- Hardcoded colors (use CSS vars)
- Hardcoded CSV indices (use getColumn)
- Synchronous sensor calls (all async now!)
- Duplicate sensors (check deduplication)

---

## 📚 DOCS (When You Need Them)

**Architecture**: `docs/analysis/TIER2_SYNTHESIS.md`  
**Medical**: `docs/project/minimed_780g_ref.md`, `metric_definitions.md`  
**Storage**: `docs/analysis/DUAL_STORAGE_ANALYSIS.md`  
**Refactoring**: `docs/handoffs/REFACTOR_MASTER_PLAN.md` (97h to v5.0)

---

## ✨ RECENT WINS

- ✅ Phase 1 refactoring complete (3 hooks extracted)
- ✅ 330 lines removed from AGPGenerator
- ✅ All tests passing (25/25)
- ✅ Performance excellent (9-89ms)
- ✅ Zero known bugs

---

## 🔧 COMMIT PATTERN

```bash
# After changes
git add .
git commit -m "feat(sprint-x): what you did"
git push origin develop

# Update PROGRESS.md with session summary
```

---

## 💡 WORKING WITH CLAUDE

**Start**: "Check PROGRESS.md, let's work on [task]"  
**End**: "Update PROGRESS.md, create session summary"  
**Stuck**: Ask me to read relevant code/docs

**Token management**: Work in 30-60 min chunks, ask me to summarize if needed

---

**Quick Handoff v1.0** | **Last Updated**: 2025-11-15

**You got this! 🚀**
