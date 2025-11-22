# AGP+ Session Handoff

**v4.4.0** | **Path**: `/Users/jomostert/Documents/Projects/agp-plus`

---

## 🚀 START SERVER

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

Open: http://localhost:3001

---

## ⚠️ CRITICAL CONSTRAINTS

```
1. UPDATE PROGRESS.md FREQUENTLY (every major step)
2. TOKEN-ZUINIG: grep/head instead of full file reads
3. CRASH PREVENTION: commit + push regularly
4. BACKWARDS COMPATIBILITY: JSON database must always load correctly
5. NEW SENSOR COMPLEXITY: Multi-column parsing active (don't break!)
```

**Multi-pump note**: Since Nov 2025, CSV parsing handles different column structures for old vs new pumps. This code is temporary (Jan 2026 cleanup planned) but CRITICAL - don't touch parsers.js without understanding the context.

---

## 📊 ARCHITECTURE (Clean!)

**State Management** - Context API complete, 0 useState in AGPGenerator:
```
├── DataContext      → Data loading, master dataset
├── PeriodContext    → Date range selection  
├── MetricsContext   → Calculated metrics, comparisons
├── UIContext        → Patient info, workdays, toasts
└── Custom Hooks (6) → Modal, navigation, import/export, data management
```

**Key Files**:
```
src/
├── components/AGPGenerator.jsx    # Orchestrator (632 lines)
├── contexts/                      # All state management
├── hooks/useDataManagement.js     # Handlers (530 lines)
├── core/
│   ├── parsers.js                 # CSV parsing (DON'T TOUCH!)
│   ├── deviceEras.js              # Seasons (IndexedDB-backed)
│   └── metrics-engine.js          # MAGE, MODD, TIR etc
├── storage/
│   ├── db.js                      # IndexedDB (v6)
│   ├── sensorStorage.js           # Clean V4 (IndexedDB only)
│   ├── seasonStorage.js           # Device seasons
│   └── pumpSettingsStorage.js     # Pump + device history
└── styles/globals.css             # Use CSS vars only!
```

---

## ✅ WHAT WORKS

- CSV import (Medtronic CareLink, multi-pump)
- AGP generation (14-day) + metrics (TIR/TAR/TBR, CV, GMI, MAGE, MODD)
- Device seasons (editable, IndexedDB)
- Patient info with lock
- Sensor management (hard delete)
- Stock/batch tracking
- Import/export JSON
- Print-ready reports

---

## 🔧 WORKFLOW

```bash
# After changes
git add . && git commit -m "type(scope): message" && git push origin main

# Build check
npx vite build

# Kill stuck server
lsof -ti:3001 | xargs kill -9
```

**Git convention**: `feat|fix|refactor|docs|chore(component): description`

---

## 📚 REFERENCE DOCS

| Doc | Location | Purpose |
|-----|----------|---------|
| Progress | `docs/handoffs/PROGRESS.md` | Session log - UPDATE THIS! |
| Metrics | `metric_definitions.md` (project root) | Formula reference |
| Pump ref | `minimed_780g_ref.md` (project root) | MiniMed 780G settings |
| Tech debt | `TECH_DEBT.md` | Future cleanup items |

---

## 💻 CODE PATTERNS

**Context Usage**:
```js
import { useDataContext } from '../contexts/DataContext';
import { useUI } from '../hooks/useUI';
const { masterData } = useDataContext();
const { patientInfo } = useUI();
```

**Storage** (ALL ASYNC!):
```js
import { getAllSensors, addSensor } from '../storage/sensorStorage';
const sensors = await getAllSensors();
```

**Styling** (CSS vars ONLY):
```css
background: var(--paper);
color: var(--ink);
border: 3px solid var(--ink);
```

---

## 🎯 REMAINING OPTIONAL WORK

| Task | Effort | Notes |
|------|--------|-------|
| Table virtualization | 3h | >50 sensors performance |
| WCAG AAA compliance | 6h | Accessibility |
| metrics-engine split | 2h | Optional organization |

---

**Last Updated**: 2025-11-22 | **You got this! 🚀**
