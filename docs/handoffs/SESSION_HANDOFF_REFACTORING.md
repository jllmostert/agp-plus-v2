# Session Handoff: Code Health & Refactoring

**Project**: AGP+ Medical Data Visualization  
**Path**: `/Users/jomostert/Documents/Projects/agp-plus`  
**Prerequisite**: Complete storage cleanup first (see `SESSION_HANDOFF_STORAGE_CLEANUP.md`)

---

## 🎯 CONTEXT

Je bent senior software engineer voor medische apparatuur. AGP+ is een glucose monitoring applicatie.

**Core stack**: React 18 + Vite, Tailwind, Recharts, Context API, IndexedDB

**Kritieke constraints**:
- Medische correctheid van metrics (TIR/TAR/TBR, CV, GMI, MAGE, MODD)
- Offline-first gedrag
- Backwards compatibility voor bestaande users

---

## 🧠 CODING PHILOSOPHY

```
PREFER REWRITING over PATCHING

Wanneer je messy code, legacy branches, of gekoppelde logic tegenkomt:
→ Herschrijf clean in nieuwe file/module
→ NIET incrementeel patchen

TENZIJ:
- Gedrag is medisch kritiek
- Formule moet bit-identiek blijven

Bij twijfel: vraag.
```

---

## ⚠️ WERKWIJZE

```
STOP elke 5-8 tool calls voor user check-in.
Update docs/handoffs/PROGRESS.md na elke fase.
Vraag bevestiging voor ELKE refactor groter dan "extract one file".
Token-zuinig: summaries over dumps, diffs waar mogelijk.
```

**Git discipline**:
- Stage alleen gerelateerde changes
- Commit met chirurgische messages
- Push naar main alleen na verificatie: build, import, sensor view, metrics

---

## 📋 FASE 1: Architectural Scan (1-2 uur)

### Doel
Analyseer de "big three" en documenteer spaghetti-niveau.

### Target Files
```
src/components/AGPGenerator.jsx    (~1600 lijnen)
src/core/metrics-engine.js         (~500 lijnen)  
src/storage/sensorStorage.js       (~500 lijnen)
```

### Per File Evalueren
- Separation of concerns
- God-module patterns
- Duplication, nesting, UI/logic coupling
- Deep conditionals, repeated branching
- Storage logic in UI
- Mixed responsibilities

### Output
Schrijf naar `docs/handoffs/AGP_REFAC_NOTES.md`:

```markdown
# AGP+ Refactoring Analysis

## File: AGPGenerator.jsx
**Spaghetti Index**: X/5
**Lines**: ~1600

### Top Issues
1. ...
2. ...
3. ...

### Quick Wins
- ...

### Large Refactors Needed
- ...

## File: metrics-engine.js
[same structure]

## File: sensorStorage.js
[same structure]

## Summary
| File | Spaghetti | Quick Wins | Major Refactor |
|------|-----------|------------|----------------|
| AGPGenerator.jsx | X/5 | Y items | Z items |
| metrics-engine.js | X/5 | Y items | Z items |
| sensorStorage.js | X/5 | Y items | Z items |
```

---

## 📋 FASE 2: Quick Wins (2-3 uur)

### Scope
Safe improvements zonder behavioral changes:

- Dead code removal
- Helper extraction naar `src/utils/`, `src/hooks/`, `src/core/`
- Naming improvements
- Comments voor non-obvious decisions

### Constraints
- ❌ Geen wijzigingen aan metric formulas
- ❌ Geen interface changes zonder overleg
- ✅ Kleine, incrementele, reversible changes
- ✅ Te tangled? → Rewrite clean in nieuwe module

---

## 📋 FASE 3: AGPGenerator.jsx Refactor (4-6 uur)

### Doel
AGPGenerator wordt thin orchestration shell.

### Identificeer Clusters
```
1. Context provider chaining
2. Panel navigation
3. Modals orchestration
4. Import/export logic
5. Cleanup & backup logic
6. Version/migration UI
```

### Proposed Split
```
src/components/
├── AppShell.jsx              # Main orchestration
├── navigation/
│   ├── PanelRouter.jsx       # Panel switching
│   └── HeaderBar.jsx         # Top navigation
├── modals/
│   └── ModalOrchestrator.jsx # Modal state management
└── import/
    └── ImportController.jsx  # CSV/JSON import logic
```

### Process
1. Extract één cluster per keer
2. Verify identical UI behaviour
3. Convoluted logic? → Rewrite clean structure

### Acceptance Criteria
- [ ] AGPGenerator < 400 lijnen
- [ ] Clear module boundaries
- [ ] No behavioral changes in metrics/storage

---

## 📋 FASE 4: sensorStorage.js Refactor (3-4 uur)

### Doel
Disentangle storage logic into clean modules.

### Identificeer Clusters
```
1. IndexedDB access
2. Merge/deduplication logic
3. Lock state management
4. Sensor detection from CSV
5. Import/export helpers
```

### Proposed Structure
```
src/storage/
├── sensorStorage.js          # Façade API (thin)
├── sensorIndexedDB.js        # Low-level IndexedDB ops
├── sensorMergeEngine.js      # Pure merge functions
└── sensorDetectionEngine.js  # Pure detection functions
```

### Process
1. Extract pure merge logic eerst (geen side effects)
2. Split I/O into isolated files
3. Keep façade API in sensorStorage.js
4. Tangled? → Rewrite clean version

---

## 📋 FASE 5: metrics-engine.js (Optional, 2-3 uur)

### Doel
Split metric families into focused modules.

### Proposed Structure
```
src/core/metrics/
├── index.js           # Final aggregator, public API
├── percentiles.js     # p5, p25, p50, p75, p95
├── variability.js     # CV, SD, MAGE, MODD
├── timeInRange.js     # TIR, TAR, TBR calculations
└── gmi.js             # GMI calculation
```

### Constraints
- ⚠️ MUST remain behaviourally identical
- ⚠️ Cross-check with `metric_definitions.md` in project root
- ⚠️ Test edge cases (empty data, single reading, etc.)

---

## 🔧 HANDIGE COMMANDO'S

```bash
# Line counts
wc -l src/components/AGPGenerator.jsx src/core/metrics-engine.js src/storage/sensorStorage.js

# Find function definitions
grep -n "^export\|^function\|^const.*=.*=>" src/components/AGPGenerator.jsx | head -30

# Find imports
grep -n "^import" src/components/AGPGenerator.jsx

# Build test
npm run build 2>&1 | tail -20

# Start dev server
cd agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001
```

---

## 📚 LEES EERST

Voordat je code aanraakt:
```
docs/ARCHITECTURE_OVERVIEW.md (indien aanwezig)
docs/README.md
metric_definitions.md (project root)
minimed_780g_ref.md (project root)
```

---

## 📝 PROGRESS TEMPLATE

Na elke fase, update `docs/handoffs/PROGRESS.md`:

```markdown
## Session [datum] - Code Health & Refactoring

### Fase 1: Architectural Scan
- [ ] AGPGenerator.jsx geanalyseerd
- [ ] metrics-engine.js geanalyseerd
- [ ] sensorStorage.js geanalyseerd
- [ ] AGP_REFAC_NOTES.md geschreven

### Fase 2: Quick Wins
- [ ] Dead code removed
- [ ] Helpers extracted
- [ ] Build succesvol

### Fase 3: AGPGenerator Refactor
- [ ] Clusters geïdentificeerd
- [ ] [cluster] extracted
- [ ] AGPGenerator < 400 lines
- [ ] UI behaviour identical

### Fase 4: sensorStorage Refactor
- [ ] Pure functions extracted
- [ ] I/O isolated
- [ ] Façade API maintained

### Files Created
[lijst]

### Files Modified
[lijst]

### Files Deleted
[lijst]

### Known Issues
[lijst]
```

---

## ⚠️ NIET DOEN

- Geen metric formula changes zonder expliciete goedkeuring
- Geen nieuwe features toevoegen
- Geen UI/UX changes
- Geen storage schema changes (dat is apart traject)
- Geen refactor van meerdere files tegelijk

---

## 🎯 SUCCESS CRITERIA

Na alle fases:
- [ ] AGPGenerator.jsx: < 400 lijnen, orchestration only
- [ ] sensorStorage.js: clean separation, façade pattern
- [ ] metrics-engine.js: optioneel gesplit in modules
- [ ] Alle metric berekeningen bit-identiek
- [ ] Build succesvol
- [ ] Geen UI regressions
- [ ] Alle imports/exports werken
- [ ] Sensor view werkt
- [ ] Day profiles renderen correct

---

**Start met Fase 1**: Lees de drie target files en schrijf `docs/handoffs/AGP_REFAC_NOTES.md`.
