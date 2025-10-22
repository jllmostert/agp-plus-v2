# AGP+ v2.1 - GitHub Migration Plan

**Status:** Monoliet ready voor opsplitsing  
**Datum:** 22 oktober 2025  
**Doel:** Modulaire codebase met proper separation of concerns

---

## 📂 Huidige Situatie

### Bestaande Artifacts (✅ Up-to-date)

```
✅ ARTIFACT-01: metrics-engine.js       (~352 regels)
   ├── CONFIG
   ├── utils
   ├── calculateMetrics()
   ├── calculateAGP()
   └── detectEvents()

✅ ARTIFACT-02: parsers.js               (~183 regels)
   ├── parseCSV()
   ├── parseProTime()
   ├── exportProTimeJSON()
   └── downloadProTimeJSON()

✅ ARTIFACT-03: html-exporter.js         (~690 regels)
   ├── generateHTML()
   ├── downloadHTML()
   └── Helper functions (path generation)
```

### Monoliet Status (agp-clean-ui-v21.tsx)

```
📦 agp-clean-ui-v21.tsx                  (~1305 regels)
   ├── CONFIG + utils (inline)           → AL IN ARTIFACT-01 ✅
   ├── calculateMetrics (inline)         → AL IN ARTIFACT-01 ✅
   ├── calculateAGP (inline)             → AL IN ARTIFACT-01 ✅
   ├── detectEvents (inline)             → AL IN ARTIFACT-01 ✅
   ├── parseCSV (inline)                 → AL IN ARTIFACT-02 ✅
   ├── parseProTime (inline)             → AL IN ARTIFACT-02 ✅
   └── React Component (AGPGenerator)    → MOET NOG GESPLITST
```

**Conclusie:** De artifacts zijn **perfect up-to-date**! 🎉  
Alleen de React UI moet nog opgesplitst worden in modulaire componenten.

---

## 🎯 GitHub Repository Structuur

### Beoogde Tree

```
agp-plus/
├── README.md                    # Project overview, features, setup
├── LICENSE                      # MIT/Apache 2.0
├── package.json                 # Dependencies & scripts
├── vite.config.js              # Build configuration
├── index.html                  # Entry point
│
├── src/
│   ├── main.jsx                # App entry point
│   │
│   ├── core/                   # ✅ CORE LOGIC (pure JS)
│   │   ├── metrics-engine.js   # ARTIFACT-01 (unchanged)
│   │   ├── parsers.js          # ARTIFACT-02 (unchanged)
│   │   └── html-exporter.js    # ARTIFACT-03 (unchanged)
│   │
│   ├── components/             # 🆕 REACT UI (opsplitsing van monoliet)
│   │   ├── AGPGenerator.jsx   # Main container component
│   │   ├── FileUpload.jsx     # CSV & ProTime upload UI
│   │   ├── PeriodSelector.jsx # Date range & preset selector
│   │   ├── MetricsDisplay.jsx # Metrics cards grid
│   │   ├── AGPChart.jsx       # SVG AGP visualization
│   │   ├── ComparisonView.jsx # Period comparison cards
│   │   ├── DayNightSplit.jsx  # Day/Night analysis toggle & display
│   │   └── WorkdaySplit.jsx   # ProTime workday analysis
│   │
│   ├── hooks/                  # 🆕 CUSTOM HOOKS
│   │   ├── useCSVData.js      # CSV parsing & state management
│   │   ├── useMetrics.js      # Metrics calculation wrapper
│   │   └── useComparison.js   # Comparison logic
│   │
│   └── styles/                 # 🆕 STYLING
│       └── globals.css         # Dark theme + base styles
│
├── public/                     # Static assets
│   └── favicon.ico
│
└── docs/                       # Documentation
    ├── USER_GUIDE.md           # End-user instructions
    ├── DEVELOPER_GUIDE.md      # Code structure, API reference
    ├── METRICS_REFERENCE.md    # Clinical definitions (TIR, MAGE, etc)
    └── CHANGELOG.md            # Version history
```

---

## 🔧 Implementatie Plan

### Phase 1: Repository Setup (30 min)

**1.1 Initialiseer GitHub repo**
```bash
git init
git remote add origin https://github.com/username/agp-plus.git
```

**1.2 Setup build tooling**
- [ ] `package.json` met dependencies:
  - React 18.x
  - Vite (build tool)
  - Lucide React (icons)
- [ ] `vite.config.js` voor build configuratie
- [ ] `.gitignore` (node_modules, dist, .env)

**1.3 Kopieer core logic**
- [ ] `/src/core/metrics-engine.js` ← ARTIFACT-01 (verbatim)
- [ ] `/src/core/parsers.js` ← ARTIFACT-02 (verbatim)
- [ ] `/src/core/html-exporter.js` ← ARTIFACT-03 (verbatim)

**Result:** ✅ Werkende core logic zonder UI

---

### Phase 2: Component Opsplitsing (2-3 uur)

**STRATEGIE:** Bottom-up approach - klein naar groot

#### 2.1 Utility Components (30 min)
```jsx
FileUpload.jsx              // CSV upload knop + ProTime modal
  ├── Props: onCSVLoad, onProTimeLoad
  └── State: file input, modal open/closed
  
PeriodSelector.jsx          // Date range picker + presets
  ├── Props: startDate, endDate, onChange, availableDates
  └── Logic: preset buttons (14d/30d/90d), custom range
```

#### 2.2 Display Components (45 min)
```jsx
MetricsDisplay.jsx          // 4-column metrics grid
  ├── Props: metrics (TIR, Mean, CV, etc)
  └── Subcomponents: MetricCard (reusable)

AGPChart.jsx                // SVG AGP curve visualization
  ├── Props: agpData, events, comparison (optional)
  └── Logic: SVG path generation, event markers
```

#### 2.3 Analysis Components (45 min)
```jsx
ComparisonView.jsx          // Period comparison cards
  ├── Props: current metrics, previous metrics
  └── Logic: Delta calculation, color coding

DayNightSplit.jsx           // Toggle + side-by-side cards
  ├── Props: dayMetrics, nightMetrics, enabled
  └── State: toggle enabled/disabled

WorkdaySplit.jsx            // ProTime workday analysis
  ├── Props: workdayMetrics, restdayMetrics
  └── Display: Side-by-side comparison
```

#### 2.4 Main Container (30 min)
```jsx
AGPGenerator.jsx            // Orchestrator component
  ├── State: csvData, startDate, endDate, workdays, etc
  ├── Effects: Metrics calculation, comparison triggers
  └── Composition: All child components wired together
```

**Kritische refactor punten:**
- [ ] State management: Welke state waar? (lift up vs. local)
- [ ] Derived state: useMemo voor calculated values
- [ ] Side effects: useEffect voor auto-comparison trigger
- [ ] Props drilling: Vermijd met composition of context (later)

---

### Phase 3: Custom Hooks (1 uur)

**Waarom?** Business logic uit components halen

```javascript
// useCSVData.js
export function useCSVData() {
  const [csvData, setCsvData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  
  const loadCSV = useCallback((text) => {
    const data = parseCSV(text);
    // Extract date range
    // ...
  }, []);
  
  return { csvData, dateRange, loadCSV };
}

// useMetrics.js
export function useMetrics(csvData, startDate, endDate, options) {
  return useMemo(() => {
    if (!csvData) return null;
    const metrics = calculateMetrics(csvData, startDate, endDate, ...);
    const agp = calculateAGP(csvData, startDate, endDate);
    const events = detectEvents(csvData, startDate, endDate);
    return { metrics, agp, events };
  }, [csvData, startDate, endDate, options]);
}

// useComparison.js (voor auto-trigger logic)
```

---

### Phase 4: Integration & Testing (1 uur)

**4.1 Wire everything together**
- [ ] `main.jsx` imports `AGPGenerator.jsx`
- [ ] Test alle flows:
  - CSV upload → metrics display
  - Period selection → recalculation
  - Comparison toggle → auto-calculation
  - ProTime import → workday split
  - HTML export → correct data passed

**4.2 Import paths checken**
```javascript
// In components:
import { calculateMetrics } from '../core/metrics-engine.js';
import { parseCSV } from '../core/parsers.js';

// In main.jsx:
import AGPGenerator from './components/AGPGenerator.jsx';
```

**4.3 Build test**
```bash
npm run dev    # Development server
npm run build  # Production build
```

---

### Phase 5: Documentation (1 uur)

**README.md** (gebruikers)
- Features lijst
- Screenshots
- Quick start: `npm install && npm run dev`
- Usage instructions

**DEVELOPER_GUIDE.md** (ontwikkelaars)
- Architecture overview
- Component tree diagram
- State flow diagram
- How to add new metrics
- Testing guidelines

**METRICS_REFERENCE.md** (klinisch)
- TIR definition + target
- MAGE calculation method
- MODD implementation notes
- AGP percentile explanation

---

## ⚠️ Kritieke Punten

### 1. State Management Strategie

**Vraag:** Waar hoort state thuis?

**Oplossing:**
```
csvData          → AGPGenerator (top-level, lift up)
startDate/endDate → AGPGenerator (affects multiple children)
dayNightEnabled  → DayNightSplit (local state, toggle only)
comparisonData   → Derived from dates (useMemo, niet state!)
```

**Regel:** State zo laag mogelijk, maar hoog genoeg voor siblings die het delen.

### 2. Calculated Values Optimization

**Problem:** Metrics herberekening bij elke render = duur

**Oplossing:** `useMemo` met juiste dependencies
```javascript
const metrics = useMemo(() => 
  calculateMetrics(csvData, startDate, endDate),
  [csvData, startDate, endDate]  // Only recalculate when these change
);
```

### 3. Component Props Interface

**Design principle:** Loose coupling

❌ **FOUT:**
```jsx
<MetricsDisplay csvData={csvData} startDate={startDate} endDate={endDate} />
// Component moet zelf metrics berekenen → tight coupling
```

✅ **GOED:**
```jsx
<MetricsDisplay metrics={metrics} />
// Component krijgt data, weet niks van berekening → loose coupling
```

### 4. Export Functionaliteit Behouden

**Huidige situatie:** HTML export zit in ARTIFACT-03  
**Nieuwe situatie:** Button in UI moet ARTIFACT-03 aanroepen

```jsx
// In AGPGenerator.jsx
import { downloadHTML } from '../core/html-exporter.js';

const handleExport = () => {
  downloadHTML({
    metrics: currentMetrics,
    startDate,
    endDate,
    dayNightMetrics: dayNightEnabled ? { day, night } : null,
    comparison: comparisonData
  });
};
```

**Let op:** html-exporter heeft `metrics.agp` nodig! Zorg dat je `agp` data meegeeft.

---

## 📋 Checklist voor Go-Live

### Pre-commit
- [ ] Alle imports resolven correct
- [ ] Geen console.errors in browser
- [ ] CSV upload werkt
- [ ] ProTime import werkt (PDF text + JSON)
- [ ] Period comparison auto-triggers op 14d/30d preset
- [ ] Day/Night split toggle werkt
- [ ] HTML export genereert correct bestand
- [ ] Dark theme CSS correct geladen

### Repository
- [ ] README.md met screenshot
- [ ] LICENSE file
- [ ] .gitignore correct
- [ ] package.json dependencies compleet
- [ ] CHANGELOG.md met v2.1 entry

### Code Quality
- [ ] Geen code duplication tussen monoliet en modules
- [ ] Consistent naming (camelCase voor functies, PascalCase voor componenten)
- [ ] JSDoc comments in core modules behouden
- [ ] PropTypes of TypeScript types (optioneel, maar nice-to-have)

---

## 🚀 Deployment Opties

### Optie A: GitHub Pages (Static hosting)
```bash
npm run build
# Upload dist/ folder to gh-pages branch
```

### Optie B: Netlify/Vercel (Auto-deploy)
- Connect GitHub repo
- Build command: `npm run build`
- Publish directory: `dist/`

### Optie C: Standalone HTML (Geen hosting)
- Gebruik current v1.0 HTML export strategie
- Single-file React app met inline bundled JS

**Voorkeur:** Optie B (Netlify) - gratis, CI/CD, preview deploys

---

## 🎯 Tijdsinschatting

| Fase | Tijd | Kritisch? |
|------|------|-----------|
| Repository setup | 30 min | ⭐⭐⭐ |
| Component opsplitsing | 2-3 uur | ⭐⭐⭐ |
| Custom hooks | 1 uur | ⭐⭐ |
| Integration & testing | 1 uur | ⭐⭐⭐ |
| Documentation | 1 uur | ⭐⭐ |
| **TOTAAL** | **5-6 uur** | |

**Tip:** Start met fase 1-2, commit vroeg en vaak. De rest kan incrementeel.

---

## 💡 Volgende Stappen

1. **Repository aanmaken** op GitHub
2. **Kopieer artifacts** naar `/src/core/` (done in 5 min)
3. **Splits AGPGenerator.jsx** in subcomponents (start met FileUpload + MetricsDisplay)
4. **Test iteratief** na elke component split
5. **Documenteer** tijdens implementatie (niet achteraf)

**Let's go! 🚀**

---

## 📝 Opmerkingen

**Waarom deze structuur?**
- ✅ **Separation of concerns:** Core logic = pure JS, UI = React
- ✅ **Testability:** Functies in `/core` zijn unit-testable zonder React
- ✅ **Reusability:** Components herbruikbaar in andere contexts
- ✅ **Maintainability:** Kleine files (<300 regels) zijn overzichtelijk
- ✅ **Scalability:** Nieuwe metrics/features = nieuwe component, niet edit monoliet

**Wat kan beter?**
- TypeScript migratie (type safety, maar adds complexity)
- State management library (Zustand/Redux, maar overkill voor nu)
- Component library (shadcn/ui, maar custom is fine)
- Automated tests (Jest/Vitest, maar time investment)

**Hoe blijven de artifacts in sync met monoliet?**
Ze hoeven niet! De artifacts zijn de **source of truth**. De monoliet wordt vervangen door de modulaire versie. Na migratie: delete monoliet, keep clean modules.

---

**END MIGRATION PLAN v1.0**

*"The best time to refactor was at the start. The second best time is now."*
