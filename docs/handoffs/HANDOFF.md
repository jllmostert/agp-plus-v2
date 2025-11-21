# AGP+ Quick Handoff

**v4.4.0** | **Path**: `/Users/jomostert/Documents/Projects/agp-plus` | **Status**: ✅ Production Ready

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
├── components/
│   ├── AGPGenerator.jsx           # Main orchestrator (1544 lines, 0 useState)
│   └── panels/PumpSettingsPanel.jsx  # MiniMed 780G settings UI
├── contexts/                      # DataContext, PeriodContext, MetricsContext, UIContext
├── hooks/                         # useModalState, usePanelNavigation, useImportExport, useUI
├── core/
│   ├── parsers.js                 # CSV parsing (dynamic columns)
│   ├── pumpSettingsParser.js      # Pump settings extraction from CSV
│   ├── deviceEras.js              # Device seasons/eras (loads from IndexedDB)
│   └── metrics-engine.js          # MAGE, MODD, GRI, TIR calculations
├── storage/
│   ├── db.js                      # IndexedDB setup (v6: includes SEASONS store)
│   ├── sensorStorage.js           # Async sensor CRUD
│   ├── seasonStorage.js           # Device seasons CRUD (IndexedDB)
│   ├── pumpSettingsStorage.js     # Pump settings + device history
│   ├── export.js                  # Full database export
│   └── import.js                  # Full database import
└── styles/globals.css             # Brutalist color system (use CSS vars!)
```

---

## ✅ WHAT WORKS

- ✅ CSV import (Medtronic CareLink)
- ✅ AGP generation (14-day) with dynamic Y-axis
- ✅ Metrics: TIR, TAR, TBR, CV, GMI, MAGE, MODD, GRI
- ✅ Smart trend indicators (color-coded deltas)
- ✅ **MiniMed 780G Settings UI** (auto-detect + manual edit)
- ✅ **Device History** (archive old pumps/transmitters)
- ✅ **Device Seasons** (track pump+transmitter combos, editable via UI)
- ✅ Sensor management (dual storage: IndexedDB + SQLite)
- ✅ **Sensor History** with resizable stats/table splitter
- ✅ Stock management (batch tracking)
- ✅ Import/export JSON (backup/restore incl. pump settings)
- ✅ ProTime PDF parsing
- ✅ Day profiles (7/14 days toggle)
- ✅ Print-ready reports

---

## 🎯 REMAINING WORK (Optional)

| Task | Effort | Priority |
|------|--------|----------|
| Table virtualization (>50 sensors) | ~3h | Low |
| WCAG AAA compliance | ~6h | Low |
| Advanced period comparison | ~4h | Medium |

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
- Pump settings → Test CSV auto-detect + manual edit


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

**Pump Settings**:
```js
import { getPumpSettings, savePumpSettings } from '../storage/pumpSettingsStorage';
import { getDeviceHistory, archiveDevice } from '../storage/pumpSettingsStorage';

const settings = getPumpSettings();  // Synchronous (localStorage)
savePumpSettings(updatedSettings);
archiveDevice(settings.device, null, 'Replaced for warranty');
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

| Document | Purpose |
|----------|---------|
| `PROGRESS.md` | Session log, quick status |
| `HANDOFF.md` | This file - quick reference |
| `HANDOFF_COMPREHENSIVE.md` | Full architecture overview |
| `TECH_DEBT.md` | **⚠️ Future cleanup tasks** - patches to revisit/rewrite |
| `reference/metric_definitions.md` | Glucose metrics formulas |
| `reference/minimed_780g_ref.md` | Pump settings reference |

> **💡 Before patching:** Check `TECH_DEBT.md` first - maybe it's better to fix properly now than add another patch. Review monthly for items ready to clean up.

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

**Quick Handoff v4.4.0** | **Last Updated**: 2025-11-21

**You got this! 🚀**
