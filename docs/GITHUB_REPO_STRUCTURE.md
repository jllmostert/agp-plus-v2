# AGP+ GitHub Repository Structure

```
agp-plus/
│
├── 📄 README.md                         # Project overview, features, quick start
├── 📄 LICENSE                           # MIT or Apache 2.0
├── 📄 package.json                      # npm dependencies & scripts
├── 📄 vite.config.js                    # Vite build configuration
├── 📄 index.html                        # HTML entry point
├── 📄 .gitignore                        # Git ignore rules
│
├── 📁 src/                              # SOURCE CODE
│   │
│   ├── 📄 main.jsx                      # React app entry point
│   │                                    # Renders <AGPGenerator /> into DOM
│   │
│   ├── 📁 core/                         # ✅ PURE LOGIC (no React dependencies)
│   │   │                                # These files are STABLE and COMPLETE
│   │   │
│   │   ├── 📄 metrics-engine.js         # ✅ ARTIFACT-01 (~352 lines)
│   │   │                                # Exports:
│   │   │                                #   - CONFIG (glucose thresholds, bin counts)
│   │   │                                #   - utils (date parsing, time filters)
│   │   │                                #   - calculateMetrics(data, dates, filters)
│   │   │                                #   - calculateAGP(data, dates)
│   │   │                                #   - detectEvents(data, dates)
│   │   │
│   │   ├── 📄 parsers.js                # ✅ ARTIFACT-02 (~183 lines)
│   │   │                                # Exports:
│   │   │                                #   - parseCSV(text) → glucose data array
│   │   │                                #   - parseProTime(input) → workdays Set
│   │   │                                #   - exportProTimeJSON(workdays) → JSON
│   │   │                                #   - downloadProTimeJSON(workdays)
│   │   │
│   │   └── 📄 html-exporter.js          # ✅ ARTIFACT-03 (~690 lines)
│   │                                    # Exports:
│   │                                    #   - generateHTML(options) → HTML string
│   │                                    #   - downloadHTML(options)
│   │                                    # Generates print-optimized A4 reports
│   │
│   ├── 📁 components/                   # 🆕 REACT UI (split from monolith)
│   │   │                                # Each component <300 lines
│   │   │
│   │   ├── 📄 AGPGenerator.jsx          # 🔷 MAIN CONTAINER (~300 lines)
│   │   │                                # State:
│   │   │                                #   - csvData, startDate, endDate
│   │   │                                #   - workdays, dayNightEnabled
│   │   │                                # Orchestrates all child components
│   │   │                                # Handles state lifting & data flow
│   │   │
│   │   ├── 📄 FileUpload.jsx            # 🔷 FILE INPUT (~150 lines)
│   │   │                                # CSV upload button + drag-drop
│   │   │                                # ProTime parser modal
│   │   │                                # Props: onCSVLoad, onProTimeLoad
│   │   │
│   │   ├── 📄 PeriodSelector.jsx        # 🔷 DATE PICKER (~120 lines)
│   │   │                                # Preset buttons: 14d, 30d, 90d
│   │   │                                # Custom date range picker
│   │   │                                # Props: dates, onChange
│   │   │
│   │   ├── 📄 MetricsDisplay.jsx        # 🔷 METRICS GRID (~180 lines)
│   │   │                                # 4-column responsive grid
│   │   │                                # TIR, TAR, TBR cards
│   │   │                                # Mean±SD, CV, GMI, MAGE, MODD
│   │   │                                # Props: metrics object
│   │   │                                # Subcomponent: MetricCard (reusable)
│   │   │
│   │   ├── 📄 AGPChart.jsx              # 🔷 SVG VISUALIZATION (~250 lines)
│   │   │                                # SVG AGP curve with percentiles
│   │   │                                # Event markers (hypo L1/L2, hyper)
│   │   │                                # Target zone lines (54, 70, 180, 250)
│   │   │                                # Props: agpData, events, comparison
│   │   │                                # Dynamic legend (adjusts for comparison)
│   │   │
│   │   ├── 📄 ComparisonView.jsx        # 🔷 PERIOD COMPARISON (~200 lines)
│   │   │                                # 3x2 metrics comparison grid
│   │   │                                # Color-coded deltas (green/red)
│   │   │                                # Shows: TIR, Mean±SD, CV, GMI, MAGE, MODD
│   │   │                                # Props: currentMetrics, previousMetrics
│   │   │
│   │   ├── 📄 DayNightSplit.jsx         # 🔷 TIME SPLIT ANALYSIS (~180 lines)
│   │   │                                # Toggle button (enable/disable)
│   │   │                                # Side-by-side cards: Day vs Night
│   │   │                                # Night: 00:00-06:00 (6h)
│   │   │                                # Day: 06:00-00:00 (18h)
│   │   │                                # Props: dayMetrics, nightMetrics, enabled
│   │   │
│   │   └── 📄 WorkdaySplit.jsx          # 🔷 PROTIME ANALYSIS (~160 lines)
│   │                                    # Side-by-side cards: Workday vs Rest
│   │                                    # Shows: TIR, Mean±SD, CV, MAGE
│   │                                    # Props: workdayMetrics, restdayMetrics
│   │                                    # Only rendered when ProTime data loaded
│   │
│   ├── 📁 hooks/                        # 🆕 CUSTOM REACT HOOKS
│   │   │                                # Business logic extracted from components
│   │   │
│   │   ├── 📄 useCSVData.js             # (~80 lines)
│   │   │                                # Manages CSV parsing & date range extraction
│   │   │                                # Returns: { csvData, dateRange, loadCSV }
│   │   │
│   │   ├── 📄 useMetrics.js             # (~60 lines)
│   │   │                                # Wraps calculateMetrics + calculateAGP
│   │   │                                # Memoizes results to prevent recalculation
│   │   │                                # Returns: { metrics, agp, events }
│   │   │
│   │   └── 📄 useComparison.js          # (~70 lines)
│   │                                    # Auto-triggers comparison for 14d/30d presets
│   │                                    # Calculates previous period metrics
│   │                                    # Returns: { comparisonData, isEnabled }
│   │
│   └── 📁 styles/                       # 🆕 GLOBAL STYLES
│       │
│       └── 📄 globals.css               # (~200 lines)
│                                        # Dark theme variables (--color-bg, etc)
│                                        # USSR aesthetic (grey/red palette)
│                                        # Base component styles
│                                        # Print media queries
│
├── 📁 public/                           # STATIC ASSETS
│   │
│   ├── 📄 favicon.ico                   # Site icon
│   └── 📄 preview.png                   # Screenshot for README
│
├── 📁 docs/                             # 📚 DOCUMENTATION
│   │
│   ├── 📄 USER_GUIDE.md                 # End-user instructions
│   │                                    # - How to export CareLink CSV
│   │                                    # - How to use ProTime parser
│   │                                    # - How to interpret metrics
│   │                                    # - Troubleshooting FAQ
│   │
│   ├── 📄 DEVELOPER_GUIDE.md            # Developer reference
│   │                                    # - Architecture overview
│   │                                    # - Component hierarchy diagram
│   │                                    # - State flow explanation
│   │                                    # - How to add new features
│   │                                    # - Testing guidelines
│   │
│   ├── 📄 METRICS_REFERENCE.md          # Clinical metrics documentation
│   │                                    # - TIR/TAR/TBR definitions
│   │                                    # - MAGE calculation method
│   │                                    # - MODD implementation details
│   │                                    # - AGP percentile explanation
│   │                                    # - GMI formula & interpretation
│   │
│   └── 📄 CHANGELOG.md                  # Version history
│                                        # v2.1: Day/Night split, comparison
│                                        # v2.0: Modular refactor
│                                        # v1.0: Initial release
│
├── 📁 dist/                             # 🏗️ BUILD OUTPUT (gitignored)
│   │                                    # Generated by: npm run build
│   │                                    # Contains: index.html + bundled JS/CSS
│   │
│   ├── index.html
│   ├── assets/
│   │   ├── main-[hash].js
│   │   └── main-[hash].css
│   └── favicon.ico
│
└── 📁 node_modules/                     # 📦 DEPENDENCIES (gitignored)
                                         # Installed by: npm install
                                         # Contains: React, Vite, Lucide, etc


═══════════════════════════════════════════════════════════════════════

DEPENDENCY GRAPH

┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (index.html)                        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
                         ┌─────────────┐
                         │  main.jsx   │
                         └──────┬──────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   AGPGenerator.jsx     │  ◀── Main Container
                    │   (State + Logic)      │
                    └─┬────────────────────┬─┘
                      │                    │
         ┌────────────┴──────┐    ┌───────┴─────────┐
         │                   │    │                 │
         ▼                   ▼    ▼                 ▼
   ┌──────────┐      ┌──────────────┐      ┌──────────────┐
   │FileUpload│      │PeriodSelector│      │MetricsDisplay│
   └────┬─────┘      └──────┬───────┘      └──────┬───────┘
        │                   │                      │
        │                   │                      │
        ▼                   ▼                      ▼
   ┌─────────┐         ┌─────────┐          ┌─────────┐
   │ parsers │         │ metrics │          │ metrics │
   │   .js   │         │ -engine │          │ -engine │
   └─────────┘         │   .js   │          │   .js   │
                       └─────────┘          └─────────┘
                            ▲                     ▲
                            │                     │
                            └─────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
            ┌──────────────┐                ┌────────────────┐
            │  AGPChart    │                │ComparisonView  │
            └──────┬───────┘                └────────┬───────┘
                   │                                 │
                   └─────────────┬───────────────────┘
                                 │
                                 ▼
                         ┌──────────────┐
                         │ html-exporter│
                         │     .js      │
                         └──────────────┘

LEGEND:
────  Direct import
····  Indirect dependency
◀──   Data flow direction

═══════════════════════════════════════════════════════════════════════

IMPORT STRUCTURE EXAMPLES

// main.jsx
import AGPGenerator from './components/AGPGenerator.jsx';
ReactDOM.render(<AGPGenerator />, document.getElementById('root'));

// AGPGenerator.jsx (main container)
import { parseCSV } from '../core/parsers.js';
import { calculateMetrics, calculateAGP } from '../core/metrics-engine.js';
import FileUpload from './FileUpload.jsx';
import MetricsDisplay from './MetricsDisplay.jsx';
import AGPChart from './AGPChart.jsx';

// FileUpload.jsx (child component)
import { parseCSV, parseProTime } from '../core/parsers.js';

// AGPChart.jsx (visualization)
import { CONFIG } from '../core/metrics-engine.js';

// Custom hooks
import { useMetrics } from '../hooks/useMetrics.js';
import { useComparison } from '../hooks/useComparison.js';

═══════════════════════════════════════════════════════════════════════

FILE SIZE BREAKDOWN

TOTAL PROJECT SIZE: ~3500 lines (excluding node_modules)

📁 src/core/                  1225 lines (35%)  ✅ STABLE
   ├── metrics-engine.js       352
   ├── parsers.js              183
   └── html-exporter.js        690

📁 src/components/           1440 lines (41%)  🆕 TO BE CREATED
   ├── AGPGenerator.jsx        300
   ├── FileUpload.jsx          150
   ├── PeriodSelector.jsx      120
   ├── MetricsDisplay.jsx      180
   ├── AGPChart.jsx            250
   ├── ComparisonView.jsx      200
   ├── DayNightSplit.jsx       180
   └── WorkdaySplit.jsx        160

📁 src/hooks/                 210 lines (6%)   🆕 TO BE CREATED
   ├── useCSVData.js            80
   ├── useMetrics.js            60
   └── useComparison.js         70

📁 src/styles/                200 lines (6%)   🆕 TO BE CREATED
   └── globals.css             200

📁 docs/                      400 lines (11%)  📚 TO BE WRITTEN
   ├── USER_GUIDE.md           150
   ├── DEVELOPER_GUIDE.md      120
   ├── METRICS_REFERENCE.md     80
   └── CHANGELOG.md             50

🔧 Config files                ~50 lines
   ├── package.json             20
   ├── vite.config.js           15
   ├── index.html               10
   └── README.md                ~5 (template)

═══════════════════════════════════════════════════════════════════════

COMPONENT RESPONSIBILITY MATRIX

┌────────────────────┬───────────────┬───────────────┬─────────────┐
│ Component          │ State Owner?  │ Renders Data? │ Calls Core? │
├────────────────────┼───────────────┼───────────────┼─────────────┤
│ AGPGenerator       │ YES (top)     │ Orchestrates  │ YES         │
│ FileUpload         │ Local only    │ Buttons       │ YES (parse) │
│ PeriodSelector     │ NO            │ Date inputs   │ NO          │
│ MetricsDisplay     │ NO            │ Metrics cards │ NO          │
│ AGPChart           │ NO            │ SVG           │ NO          │
│ ComparisonView     │ NO            │ Comparison    │ NO          │
│ DayNightSplit      │ Local toggle  │ Split cards   │ NO          │
│ WorkdaySplit       │ NO            │ Split cards   │ NO          │
└────────────────────┴───────────────┴───────────────┴─────────────┘

PRINCIPLE: "Smart container, dumb children"
- AGPGenerator owns state & calls core logic
- Child components receive props & render UI
- Only FileUpload calls parsers (because it owns file input)

═══════════════════════════════════════════════════════════════════════
```

**END REPOSITORY STRUCTURE**
