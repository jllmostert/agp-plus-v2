# AGP+ v2.1 - Migration Prompts

**Doel:** Modulaire GitHub repository bouwen vanuit artifacts  
**Strategie:** Lokaal werken → Git commit → GitHub push  
**Token Management:** Verschillende chats voor verschillende fases

---

## 📂 PROJECT FILES SETUP

### Bestanden die IN project files moeten zitten:

```
✅ VERPLICHT (core logic - source of truth):
├── ARTIFACT-01__metrics-engine_js.txt       # Core calculations
├── ARTIFACT-02__parsers_js.txt              # CSV & ProTime parsing
├── ARTIFACT-03__html-exporter_js.txt        # HTML export functionaliteit

✅ REFERENTIE (documentatie & context):
├── AGP__v2_0_-_Project_Brief.md             # Feature specs & requirements
├── AGP__Data_Overzicht_-_Wat_wordt_berekend.md  # Metrics definitions
├── GITHUB_MIGRATION_PLAN.md                 # Dit plan (output van huidige chat)
├── GITHUB_REPO_STRUCTURE.md                 # Repository tree (output van huidige chat)
├── STATUS_CHECK_AND_NEXT_STEPS.md           # Status overview (output van huidige chat)

✅ OPTIONEEL (voor testing & validatie):
├── Jo_Mostert_19102025.pdf                  # Test dataset (AGP reference)
├── agp-clean-ui-v21.tsx                     # Monoliet (voor vergelijking)

⚠️ NIET NODIG in nieuwe chats:
├── minimed_780g_ref.md                      # Device specs (nice to have)
├── metric_definitions.md                    # Duplicate info
├── standards-of-care-2025.pdf               # Clinical guidelines (reference only)
└── Andere oude versies                      # Ignore
```

---

## 💻 LOKALE WORKFLOW

### Stap 1: Lokale directory structuur maken

```bash
# Maak project root
mkdir agp-plus
cd agp-plus

# Initialiseer Git
git init
git branch -M main

# Maak directory structuur
mkdir -p src/core
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/styles
mkdir -p docs
mkdir -p public

# Maak placeholder files (om directories te tracken)
touch src/core/.gitkeep
touch src/components/.gitkeep
touch src/hooks/.gitkeep
touch src/styles/.gitkeep
touch docs/.gitkeep
touch public/.gitkeep
```

### Stap 2: Core files kopiëren

```bash
# Kopieer artifacts naar /src/core/
# (Dit doe je handmatig vanuit Claude outputs)

# Hernoem en verplaats:
ARTIFACT-01__metrics-engine_js.txt → src/core/metrics-engine.js
ARTIFACT-02__parsers_js.txt        → src/core/parsers.js  
ARTIFACT-03__html-exporter_js.txt  → src/core/html-exporter.js

# Verwijder .txt extensie, voeg .js toe
```

### Stap 3: Git setup

```bash
# Maak .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
.DS_Store
.env
*.log
coverage/
.vscode/
.idea/
EOF

# First commit
git add .
git commit -m "chore: initial project structure with core logic"

# Koppel aan GitHub (maak eerst repo op GitHub!)
git remote add origin https://github.com/YOUR_USERNAME/agp-plus.git
git push -u origin main
```

---

## 🎯 GENUMMERDE PROMPTS (voor verschillende chats)

### PROMPT 1: Repository Setup & Config Files

**Context bestanden nodig:**
- GITHUB_REPO_STRUCTURE.md (voor referentie)
- GITHUB_MIGRATION_PLAN.md (fase 1)

**Prompt:**
```
Ik ben bezig met AGP+ v2.1 migratie naar GitHub. Ik heb lokaal al deze structuur:

agp-plus/
├── src/core/                    # Artifacts already here
│   ├── metrics-engine.js
│   ├── parsers.js
│   └── html-exporter.js
└── [empty directories for components, hooks, etc]

Maak de volgende config files voor mij:

1. package.json met:
   - React 18.x
   - Vite als build tool
   - Lucide React voor icons
   - Correcte scripts (dev, build, preview)

2. vite.config.js met:
   - React plugin
   - Build configuratie voor production
   - Dev server settings

3. index.html met:
   - Basic HTML5 template
   - Root div voor React
   - Referentie naar main.jsx

4. README.md met:
   - Project title & beschrijving
   - Features lijst (verwijs naar project brief)
   - Quick start instructies
   - Installation steps
   - Usage voorbeeld

5. src/main.jsx met:
   - React 18 render setup
   - Import van AGPGenerator component (voorlopig placeholder)

Genereer deze bestanden als aparte artifacts die ik direct kan kopiëren naar mijn lokale directory.
```

**Output verwachting:** 5 downloadbare files  
**Commit message:** `chore: add config files and build setup`

---

### PROMPT 2: Simple Display Components (Part 1)

**Context bestanden nodig:**
- ARTIFACT-01__metrics-engine_js.txt (voor imports)
- GITHUB_MIGRATION_PLAN.md (fase 2.2)
- agp-clean-ui-v21.tsx (voor UI referentie)

**Prompt:**
```
Ik ben bezig met AGP+ v2.1 component opsplitsing. 

CONTEXT:
- Core logic zit in: src/core/metrics-engine.js, parsers.js, html-exporter.js
- Monoliet referentie: agp-clean-ui-v21.tsx (lines 329-1305)
- Zie GITHUB_MIGRATION_PLAN.md fase 2.2

OPDRACHT:
Maak de volgende 3 DISPLAY COMPONENTS (pure props, no state):

1. **MetricsDisplay.jsx** (~180 lines)
   - Props: metrics object { tir, tar, tbr, mean, sd, cv, gmi, mage, modd, days, readingCount }
   - Render: 4-column responsive grid met metric cards
   - Style: Dark theme, USSR aesthetic (zie monoliet)
   - Subcomponent: MetricCard (reusable voor elke metric)

2. **PeriodSelector.jsx** (~120 lines)
   - Props: startDate, endDate, availableDates, onChange callback
   - Render: Preset buttons (14d, 30d, 90d) + custom date inputs
   - Logic: Button clicks trigger onChange met nieuwe dates

3. **WorkdaySplit.jsx** (~160 lines)
   - Props: workdayMetrics, restdayMetrics, workdayCount, restdayCount
   - Render: Side-by-side comparison cards (yellow/green theme)
   - Display: TIR, Mean±SD, CV, MAGE per split

REQUIREMENTS:
- Import alleen from '../core/...' voor types/constants
- Gebruik Tailwind utility classes (inline)
- Export default elke component
- Add JSDoc comments

Genereer als aparte downloadbare artifacts.
```

**Output verwachting:** 3 component files  
**Commit message:** `feat: add MetricsDisplay, PeriodSelector, WorkdaySplit components`

---

### PROMPT 3: Simple Display Components (Part 2)

**Context bestanden nodig:**
- ARTIFACT-01__metrics-engine_js.txt
- agp-clean-ui-v21.tsx
- GITHUB_MIGRATION_PLAN.md

**Prompt:**
```
Vervolg van AGP+ component opsplitsing.

CONTEXT: Zie vorige chat voor setup details.

OPDRACHT:
Maak de volgende 2 DISPLAY COMPONENTS:

1. **ComparisonView.jsx** (~200 lines)
   - Props: currentMetrics, previousMetrics, prevStart, prevEnd, startDate, endDate
   - Render: 3×2 grid comparison cards
   - Metrics: TIR, Mean±SD, CV, GMI, MAGE, MODD
   - Delta display: Green (▲ better) / Red (▼ worse)
   - Logic: Calculate deltas, determine color based on metric type
     * TIR: higher = better
     * Mean: lower = better (if in range)
     * CV: lower = better

2. **DayNightSplit.jsx** (~180 lines)
   - Props: dayMetrics, nightMetrics, enabled, onToggle
   - State: Local toggle button enabled/disabled
   - Render: Toggle button + conditional side-by-side cards
   - Cards: Blue (day 06:00-00:00) / Indigo (night 00:00-06:00)
   - Display: TIR, TAR, TBR, Mean±SD, CV, min, max, readingCount

STYLING:
- Consistent met MetricsDisplay uit vorige chat
- Dark theme, high contrast
- Responsive grid

Genereer als aparte artifacts.
```

**Output verwachting:** 2 component files  
**Commit message:** `feat: add ComparisonView and DayNightSplit components`

---

### PROMPT 4: Complex Visualization Component

**Context bestanden nodig:**
- ARTIFACT-01__metrics-engine_js.txt (voor CONFIG)
- ARTIFACT-03__html-exporter_js.txt (voor SVG path logic)
- agp-clean-ui-v21.tsx (lines 700-900, AGP rendering)

**Prompt:**
```
AGP+ component opsplitsing: AGP Chart visualization.

CONTEXT:
- SVG path generation logic: zie ARTIFACT-03 (generateAGPPath, generateAGPBand)
- Monoliet rendering: agp-clean-ui-v21.tsx lines 700-900
- CONFIG: imported from '../core/metrics-engine.js'

OPDRACHT:
Maak **AGPChart.jsx** (~250 lines)

PROPS:
- agpData: Array[288] met { p5, p25, p50, p75, p95, mean }
- events: { hypoL1: [], hypoL2: [], hyper: [] } met minuteOfDay
- comparison: { comparisonAGP } | null (optional)
- width: number (default 900)
- height: number (default 400)

RENDER SVG met:
1. Grid: Y-axis (0-400 mg/dL), X-axis (00:00-24:00)
2. Target lines:
   - 54 mg/dL (red dashed, critical low)
   - 70 mg/dL (black solid, low threshold)
   - 180 mg/dL (black solid, high threshold)
   - 250 mg/dL (yellow dashed, critical high)
3. AGP bands:
   - p5-p95 (light grey fill, 15% opacity)
   - p25-p75 (dark grey fill, 25% opacity)
4. Lines:
   - Median (p50) - thick black line
   - Mean - grey dashed line
   - Comparison median - orange dashed (if provided)
5. Event markers:
   - Hypo L2 (<54) - red vertical lines at minuteOfDay
   - Hypo L1 (54-69) - orange vertical lines
   - Hyper (>250) - yellow vertical lines
6. Dynamic legend:
   - Box in top-right corner
   - Shows: Median, Mean, IQR, p5-p95
   - Adds "Previous" line if comparison active

LOGIC:
- SVG path generation: extract from html-exporter.js
- Event positioning: (minuteOfDay / 1440) * width
- Y-axis scale: (value / 400) * height

STYLING:
- White background (print-optimized)
- High contrast lines
- Clear labels

Genereer als artifact.
```

**Output verwachting:** 1 large component file  
**Commit message:** `feat: add AGPChart SVG visualization component`

---

### PROMPT 5: Interactive Components

**Context bestanden nodig:**
- ARTIFACT-02__parsers_js.txt (voor parseCSV, parseProTime)
- agp-clean-ui-v21.tsx (file upload logic)

**Prompt:**
```
AGP+ component opsplitsing: Interactive components met state.

CONTEXT:
- Parsers: src/core/parsers.js (parseCSV, parseProTime, exportProTimeJSON, downloadProTimeJSON)
- Monoliet: agp-clean-ui-v21.tsx file upload + ProTime modal

OPDRACHT:
Maak **FileUpload.jsx** (~150 lines)

STATE:
- proTimeModalOpen: boolean
- proTimeInput: string
- error: string | null

PROPS:
- onCSVLoad: (data, dateRange) => void
- onProTimeLoad: (workdays) => void

RENDER:
1. CSV Upload Section:
   - Upload button met Lucide Upload icon
   - File input (accept=".csv")
   - Drag-drop zone (optional maar nice)
   - Error display (if parsing fails)

2. ProTime Parser Button:
   - Button "Import ProTime Data"
   - Opens modal when clicked

3. ProTime Modal:
   - Textarea voor PDF text paste
   - OR file input voor JSON upload
   - "Import" button (calls parseProTime)
   - "Download JSON" button (calls exportProTimeJSON)
   - Close button

LOGIC:
- CSV upload → parseCSV → extract date range → onCSVLoad callback
- ProTime import → parseProTime → onProTimeLoad callback
- Error handling met try-catch
- Clear error na succesvolle upload

STYLING:
- Dark theme consistent met andere components
- Modal: overlay + centered card
- Nice file upload animation (optional)

Genereer als artifact.
```

**Output verwachting:** 1 component file  
**Commit message:** `feat: add FileUpload component with ProTime modal`

---

### PROMPT 6: Custom Hooks

**Context bestanden nodig:**
- ARTIFACT-01__metrics-engine_js.txt
- ARTIFACT-02__parsers_js.txt
- GITHUB_MIGRATION_PLAN.md (fase 3)

**Prompt:**
```
AGP+ custom hooks: Extract business logic from components.

CONTEXT:
- Core functions: calculateMetrics, calculateAGP, detectEvents from metrics-engine.js
- See GITHUB_MIGRATION_PLAN.md fase 3 voor rationale

OPDRACHT:
Maak 3 CUSTOM HOOKS:

1. **useCSVData.js** (~80 lines)
   ```
   export function useCSVData() {
     const [csvData, setCsvData] = useState(null);
     const [dateRange, setDateRange] = useState(null);
     const [error, setError] = useState(null);
     
     const loadCSV = useCallback((text) => {
       try {
         const data = parseCSV(text);
         // Extract min/max dates
         const dates = data.map(r => r.date);
         const minDate = Math.min(...dates.map(d => new Date(d)));
         const maxDate = Math.max(...dates.map(d => new Date(d)));
         
         setCsvData(data);
         setDateRange({ min: minDate, max: maxDate });
         setError(null);
       } catch (err) {
         setError(err.message);
       }
     }, []);
     
     return { csvData, dateRange, error, loadCSV };
   }
   ```

2. **useMetrics.js** (~60 lines)
   - useMemo wrapper for calculateMetrics + calculateAGP + detectEvents
   - Dependencies: csvData, startDate, endDate, filterDates, timeFilter
   - Returns: { metrics, agp, events } | null

3. **useComparison.js** (~70 lines)
   - Auto-trigger comparison for 14d/30d presets
   - Calculate previous period dates (14 days lookback)
   - Call calculateMetrics for previous period
   - Returns: { comparisonData, isEnabled, prevStart, prevEnd } | null

REQUIREMENTS:
- Proper React hooks imports (useState, useMemo, useCallback, useEffect)
- Correct dependency arrays
- Null checks voor safety
- JSDoc comments

Genereer als aparte artifacts.
```

**Output verwachting:** 3 hook files  
**Commit message:** `feat: add custom hooks (useCSVData, useMetrics, useComparison)`

---

### PROMPT 7: Main Container Component

**Context bestanden nodig:**
- Alle vorige component files (als referentie)
- ARTIFACT-03__html-exporter_js.txt (voor export button)
- agp-clean-ui-v21.tsx (lines 329-400, state management)

**Prompt:**
```
AGP+ main container: Orchestrator component die alles samenbrengt.

CONTEXT:
- Components al gemaakt: FileUpload, PeriodSelector, MetricsDisplay, AGPChart, ComparisonView, DayNightSplit, WorkdaySplit
- Custom hooks: useCSVData, useMetrics, useComparison
- HTML export: downloadHTML from '../core/html-exporter.js'

OPDRACHT:
Maak **AGPGenerator.jsx** (~300 lines)

STATE (via hooks):
- { csvData, dateRange, loadCSV } = useCSVData()
- [startDate, setStartDate] = useState(null)
- [endDate, setEndDate] = useState(null)
- [workdays, setWorkdays] = useState(null)
- [dayNightEnabled, setDayNightEnabled] = useState(false)

DERIVED STATE (via hooks):
- { metrics, agp, events } = useMetrics(csvData, startDate, endDate)
- { comparisonData } = useComparison(csvData, startDate, endDate)
- dayMetrics = useMetrics(csvData, startDate, endDate, null, {type: 'day_night', value: 'day'})
- nightMetrics = useMetrics(csvData, startDate, endDate, null, {type: 'day_night', value: 'night'})
- workdayMetrics = useMetrics(csvData, startDate, endDate, workdays)
- restdayMetrics = useMetrics(csvData, startDate, endDate, restdays)

EFFECTS:
- useEffect: Set initial dates to last 14 days of CSV data
- useEffect: Auto-enable comparison for 14d/30d presets

HANDLERS:
- handleCSVLoad(data, dateRange)
- handleProTimeLoad(workdays)
- handlePeriodChange(newStart, newEnd)
- handleExportHTML()

RENDER STRUCTURE:
```jsx
<div className="app-container">
  <header>
    <h1>AGP+ Generator v2.1</h1>
    <button onClick={handleExportHTML}>Export HTML</button>
  </header>

  <FileUpload 
    onCSVLoad={handleCSVLoad} 
    onProTimeLoad={handleProTimeLoad} 
  />

  {csvData && (
    <>
      <PeriodSelector 
        startDate={startDate}
        endDate={endDate}
        availableDates={dateRange}
        onChange={handlePeriodChange}
      />

      <MetricsDisplay metrics={metrics} />

      <AGPChart 
        agpData={agp}
        events={events}
        comparison={comparisonData}
      />

      {comparisonData && (
        <ComparisonView 
          currentMetrics={metrics}
          previousMetrics={comparisonData.comparison}
          {...comparisonData}
        />
      )}

      <DayNightSplit 
        dayMetrics={dayMetrics}
        nightMetrics={nightMetrics}
        enabled={dayNightEnabled}
        onToggle={() => setDayNightEnabled(!dayNightEnabled)}
      />

      {workdays && (
        <WorkdaySplit 
          workdayMetrics={workdayMetrics}
          restdayMetrics={restdayMetrics}
          workdayCount={workdays.size}
          restdayCount={totalDays - workdays.size}
        />
      )}
    </>
  )}
</div>
```

STYLING:
- Dark theme (--color-bg: #1a1a1a)
- USSR aesthetic
- Responsive layout

Genereer als artifact + globals.css file.
```

**Output verwachting:** 2 files (AGPGenerator.jsx + globals.css)  
**Commit message:** `feat: add main AGPGenerator container component`

---

### PROMPT 8: Documentation

**Context bestanden nodig:**
- AGP__v2_0_-_Project_Brief.md
- AGP__Data_Overzicht_-_Wat_wordt_berekend.md
- GITHUB_REPO_STRUCTURE.md

**Prompt:**
```
AGP+ documentatie: User & developer guides.

CONTEXT:
- Project brief: AGP__v2_0_-_Project_Brief.md
- Metrics definitions: AGP__Data_Overzicht_-_Wat_wordt_berekend.md
- Architecture: GITHUB_REPO_STRUCTURE.md

OPDRACHT:
Maak 3 DOCUMENTATION FILES:

1. **docs/USER_GUIDE.md** (~150 lines)
   - Wat is AGP+?
   - Features overzicht
   - How to export CareLink CSV
   - How to use ProTime parser
   - How to interpret metrics (TIR, CV, MAGE, etc)
   - Troubleshooting FAQ
   - Screenshots (placeholder references)

2. **docs/DEVELOPER_GUIDE.md** (~120 lines)
   - Architecture overview
   - Project structure (verwijs naar GITHUB_REPO_STRUCTURE.md)
   - Component hierarchy diagram
   - State flow explanation
   - How to add new metrics
   - How to add new components
   - Testing guidelines (placeholder)
   - Build & deploy instructions

3. **docs/METRICS_REFERENCE.md** (~80 lines)
   - Clinical metrics documentation:
     * TIR/TAR/TBR (ranges, targets, interpretation)
     * Mean ± SD (clinical meaning)
     * CV (coefficient of variation, target ≤36%)
     * GMI (formula, interpretation vs HbA1c)
     * MAGE (per-day method, clinical use)
     * MODD (binned implementation, clinical use)
   - AGP curve explanation (percentiles)
   - Event detection thresholds
   - References to clinical guidelines

Gebruik Markdown formatting, code blocks, tables waar relevant.

Genereer als aparte artifacts.
```

**Output verwachting:** 3 documentation files  
**Commit message:** `docs: add user guide, developer guide, and metrics reference`

---

### PROMPT 9: Final Integration & Testing

**Context bestanden nodig:**
- Alle gemaakte component files
- package.json (from PROMPT 1)

**Prompt:**
```
AGP+ final integration: Test & debug checklist.

CONTEXT:
- Alle components gemaakt in vorige prompts
- Lokaal project op: ~/agp-plus/

OPDRACHT:
Genereer een **TESTING_CHECKLIST.md** met:

1. **Pre-flight checks**
   - [ ] Alle imports resolven correct?
   - [ ] npm install succesvol?
   - [ ] npm run dev start zonder errors?

2. **Functionality tests**
   - [ ] CSV upload werkt?
   - [ ] ProTime import werkt (PDF text)?
   - [ ] ProTime import werkt (JSON)?
   - [ ] Period selector updates metrics?
   - [ ] Preset buttons (14d/30d/90d) werken?
   - [ ] AGP curve rendert correct?
   - [ ] Event markers visible op curve?
   - [ ] Comparison auto-triggers?
   - [ ] Day/Night toggle werkt?
   - [ ] Workday split rendert (when ProTime loaded)?
   - [ ] HTML export genereert file?
   - [ ] Exported HTML opens correctly?

3. **Visual checks**
   - [ ] Dark theme applied?
   - [ ] Components aligned correct?
   - [ ] Responsive op verschillende schermgroottes?
   - [ ] No layout shifts?
   - [ ] Icons render (Lucide)?

4. **Debug helpers**
   ```javascript
   // Add to AGPGenerator.jsx temporarily:
   console.log('CSV Data:', csvData?.length, 'rows');
   console.log('Metrics:', metrics);
   console.log('AGP bins:', agp?.length);
   console.log('Events:', events);
   ```

5. **Common fixes**
   - Import errors → Check relative paths
   - Component not rendering → Check conditional logic
   - Metrics NaN → Check date format parsing
   - HTML export empty → Check metrics.agp exists

6. **Production build test**
   ```bash
   npm run build
   # Check dist/ folder
   # Serve locally: npx serve dist
   # Test in browser
   ```

Ook: Genereer een **DEPLOYMENT.md** met Netlify/Vercel instructies.
```

**Output verwachting:** 2 files (TESTING_CHECKLIST.md, DEPLOYMENT.md)  
**Commit message:** `docs: add testing checklist and deployment guide`

---

## 📋 SAMENVATTING WORKFLOW

### Complete Local → GitHub Flow:

```bash
# FASE 1: Setup (PROMPT 1)
cd ~/agp-plus
# Kopieer output van PROMPT 1 naar lokale files
git add package.json vite.config.js index.html README.md src/main.jsx
git commit -m "chore: add config files and build setup"

# FASE 2: Components Part 1 (PROMPT 2)
# Kopieer MetricsDisplay.jsx, PeriodSelector.jsx, WorkdaySplit.jsx
git add src/components/
git commit -m "feat: add simple display components (part 1)"

# FASE 3: Components Part 2 (PROMPT 3)
# Kopieer ComparisonView.jsx, DayNightSplit.jsx
git add src/components/
git commit -m "feat: add simple display components (part 2)"

# FASE 4: Visualization (PROMPT 4)
# Kopieer AGPChart.jsx
git add src/components/AGPChart.jsx
git commit -m "feat: add AGP chart visualization"

# FASE 5: Interactive (PROMPT 5)
# Kopieer FileUpload.jsx
git add src/components/FileUpload.jsx
git commit -m "feat: add file upload component"

# FASE 6: Hooks (PROMPT 6)
# Kopieer useCSVData.js, useMetrics.js, useComparison.js
git add src/hooks/
git commit -m "feat: add custom hooks"

# FASE 7: Container (PROMPT 7)
# Kopieer AGPGenerator.jsx, globals.css
git add src/components/AGPGenerator.jsx src/styles/globals.css
git commit -m "feat: add main container component"

# FASE 8: Documentation (PROMPT 8)
# Kopieer docs/*.md files
git add docs/
git commit -m "docs: add user and developer documentation"

# FASE 9: Testing (PROMPT 9)
npm install
npm run dev
# Test everything
git add docs/TESTING_CHECKLIST.md docs/DEPLOYMENT.md
git commit -m "docs: add testing and deployment guides"

# PUSH TO GITHUB
git push origin main
```

---

## ⚠️ BELANGRIJK

### Voor elke nieuwe chat:

1. **Upload deze bestanden naar project files:**
   - ARTIFACT-01__metrics-engine_js.txt
   - ARTIFACT-02__parsers_js.txt
   - ARTIFACT-03__html-exporter_js.txt
   - GITHUB_MIGRATION_PLAN.md
   - GITHUB_REPO_STRUCTURE.md
   - AGP__v2_0_-_Project_Brief.md (optioneel maar handig)

2. **Begin de chat met:**
   ```
   Ik werk aan AGP+ v2.1 migratie naar GitHub.
   Zie project files voor:
   - Core logic artifacts (metrics-engine, parsers, html-exporter)
   - Migration plan & repository structure
   
   Ik ben nu bij PROMPT [nummer].
   [kopieer de prompt tekst hier]
   ```

3. **Download de output en kopieer lokaal:**
   - Claude genereert artifact → Download
   - Kopieer naar juiste lokale folder
   - Git commit met message uit prompt

### Voordelen van deze aanpak:

✅ **Token efficient:** Elke chat focust op 1-3 files  
✅ **Incremental progress:** Commit na elke fase  
✅ **Easy rollback:** Git history per component  
✅ **Parallel work:** Meerdere prompts per dag mogelijk  
✅ **Clear separation:** Components onafhankelijk testbaar

---

**Klaar om te beginnen? Start met PROMPT 1! 🚀**
