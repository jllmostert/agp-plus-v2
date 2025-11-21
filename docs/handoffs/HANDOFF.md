# AGP+ Quick Handoff

**v4.3.3** | **Path**: `/Users/jomostert/Documents/Projects/agp-plus` | **Status**: ✅ Production Ready

---

## 🚀 START SERVER (30 SECONDS)

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

Open: http://localhost:3001

---

## 📊 ARCHITECTURE SUMMARY

**Context API: Complete** (0 useState in AGPGenerator)

```
State Management:
├── DataContext      → Data loading, master dataset
├── PeriodContext    → Date range selection
├── MetricsContext   → Calculated metrics, comparisons
├── UIContext        → Patient info, workdays, toasts, dialogs
└── Custom Hooks (6) → Modal, navigation, import/export
```

**Key Files**:
```
src/
├── components/AGPGenerator.jsx    # Main orchestrator (1544 lines, 0 useState)
├── contexts/                      # DataContext, PeriodContext, MetricsContext, UIContext
├── hooks/                         # useModalState, usePanelNavigation, useImportExport, useUI
├── core/
│   ├── parsers.js                 # CSV parsing (dynamic columns)
│   └── metrics-engine.js          # MAGE, MODD, GRI, TIR calculations
├── storage/
│   ├── db.js                      # IndexedDB setup
│   └── sensorStorage.js           # Async sensor CRUD
└── styles/globals.css             # Brutalist color system (use CSS vars!)
```

---

## ✅ WHAT WORKS

- ✅ CSV import (Medtronic CareLink)
- ✅ AGP generation (14-day) with dynamic Y-axis
- ✅ Metrics: TIR, TAR, TBR, CV, GMI, MAGE, MODD, GRI
- ✅ Smart trend indicators (color-coded deltas)
- ✅ Sensor management (dual storage: IndexedDB + SQLite)
- ✅ Stock management (batch tracking)
- ✅ Import/export JSON (backup/restore)
- ✅ ProTime PDF parsing
- ✅ Day profiles (7/14 days toggle)
- ✅ Print-ready reports

---

## 🎯 ROADMAP (Next Steps)

**Most Valuable Next Features**:

1. **Track 4, M1: MiniMed 780G Settings UI** (~12h)
   - Display pump settings from CSV
   - Manual configuration option
   - localStorage persistence
   - See: `docs/project/minimed_780g_ref.md`

2. **Track 3, Q3: Table Virtualization** (~3h)
   - react-window for large sensor lists
   - Performance improvement >50 sensors

3. **Track 3, Q4: WCAG AAA Compliance** (~9h)
   - Full accessibility audit
   - Screen reader improvements

---

## ⚠️ TEST AFTER CHANGES

**Critical Flow** (5 min):
1. Import CSV → Metrics calculate
2. Navigate panels (Ctrl+1/2/3/4)
3. Check trend indicators (↑↓ colors)
4. Import JSON → Export JSON

**If you touched**:
- Storage → Test sensor add/delete/lock
- Contexts → Test state flows across components
- Metrics → Run `npm test` (25 unit tests)
- Charts → Check AGP/day profiles render

---

## 💻 CODE PATTERNS

**Context Usage**:
```js
import { useDataContext } from '../contexts/DataContext';
import { usePeriodContext } from '../contexts/PeriodContext';
import { useMetricsContext } from '../contexts/MetricsContext';
import { useUI } from '../hooks/useUI';

const { masterData, isLoading } = useDataContext();
const { startDate, endDate, setStartDate } = usePeriodContext();
const { metrics, comparison } = useMetricsContext();
const { patientInfo, setPatientInfo } = useUI();
```

**Storage** (ALL ASYNC!):
```js
const sensors = await getAllSensors();
await addSensor(sensor);
await deleteSensor(id);
```

**Styling** (CSS vars ONLY!):
```css
background: var(--paper);    /* Never #FFFEF9 */
color: var(--ink);           /* Never #0A0A0A */
border: 3px solid var(--ink);
```

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

**Metrics not updating**
→ Check MetricsContext recalculation
→ Verify PeriodContext date range

---

## 📚 KEY DOCUMENTATION

| Tier | Document | Purpose |
|------|----------|---------|
| 1 | `PROGRESS.md` | Session log, quick status |
| 1 | `HANDOFF.md` | This file - quick reference |
| 2 | `TIER2_SYNTHESIS.md` | Architecture overview |
| 2 | `DUAL_STORAGE_ANALYSIS.md` | Storage patterns |
| 3 | `metric_definitions.md` | Glucose metrics formulas |
| 3 | `minimed_780g_ref.md` | Pump settings reference |

---

## 🔧 GIT WORKFLOW

```bash
# After changes
git add .
git commit -m "feat(component): what you did"
git push origin main

# Update PROGRESS.md with session summary
```

---

## 💡 WORKING WITH CLAUDE

**Start**: "Check PROGRESS.md, let's work on [task]"  
**End**: "Update PROGRESS.md, create session summary"  
**Stuck**: Ask me to read relevant code/docs  
**Token management**: Work in 30-60 min chunks

---

**Quick Handoff v4.3.3** | **Last Updated**: 2025-11-21

**You got this! 🚀**
