# 📂 AGP+ MAPPENSTRUCTUUR OVERZICHT v4.2.1

**Laatst bijgewerkt**: 2025-11-14  
**Versie**: v4.2.1 (Async Refactor Complete)  
**Status**: ✅ Production stable met IndexedDB storage

---

## 🌳 OVERZICHT MAPPENSTRUCTUUR

```
agp-plus/
├── 📄 Root Config Files          # Project configuratie
├── 📚 docs/                      # Documentatie & archives
├── 🎯 src/                       # Source code (hoofdlogica)
├── 🌐 public/                    # Statische assets
├── 🧪 test-data/                 # Test CSV/PDF bestanden
├── 📦 node_modules/              # Dependencies (gegenereerd)
├── 🔧 scripts/                   # Utility scripts
├── 📖 project/                   # Project briefings & specs
└── 📚 reference/                 # Referentie documenten (TRUTH SOURCES)
```

---

## 🧠 ARCHITECTUUR FILOSOFIE

**Domain-Driven Design** met strikte laagscheiding:

1. **Core Business Logic** (`src/core/`) - Pure functions, zero React
2. **UI Components** (`src/components/`) - React componenten
3. **Data Layer** (`src/storage/`) - **IndexedDB + localStorage** (v4.2+)
4. **Integration Layer** (`src/hooks/`) - React hooks (core ↔ storage)
5. **Utilities** (`src/utils/`) - Helpers, formatters, constants

**Waarom deze structuur?**
- ✅ **Testbaarheid**: Core functies geïsoleerd van React
- ✅ **Herbruikbaarheid**: Metrics engine kan standalone draaien
- ✅ **Maintainability**: UI wijzigingen raken core logic niet
- ✅ **Performance**: Heavy computations in core, React alleen rendering

---

## 📁 ROOT LEVEL (Project Configuratie)

| Bestand | Doel | Status |
|---------|------|--------|
| `package.json` | NPM dependencies & scripts | v4.2.1 |
| `vite.config.js` | Vite bundler configuratie | Active |
| `index.html` | HTML entry point | Active |
| `.gitignore` | Git exclusion rules | Active |
| `start.sh` | Launch script (sets PATH) | Active |
| **`CHANGELOG.md`** | **Version history** | ✅ Up-to-date |
| **`README.md`** | **Project overview** | ✅ Up-to-date |
| **`PROGRESS.md`** | **Session log** | ✅ Current |
| **`TODO.md`** | **Task backlog** | ✅ NEW (v4.2.1) |

**🚨 KRITIEK**: `package.json` versie MOET synchroon met app blijven!

---

## 📚 docs/ - Documentatie Hub

**NIEUW in v4.2.1: Georganiseerde archive structuur!**

```
docs/
├── analysis/                        # Domein analyses (actief)
│   ├── UI_ARCHITECTURE_ANALYSIS.md
│   ├── VISUALIZATION_DEEP_DIVE.md
│   └── EXPORT_SYSTEM_DESIGN.md
│
├── archive/                         # Historische docs (NEVER DELETE)
│   ├── completed-features/          # ✨ NEW: Afgeronde features
│   │   ├── ASYNC_REFACTOR_ANALYSIS.md
│   │   ├── IMPORT_EXPORT_TEST_REPORT.md
│   │   ├── BUG_FIXES_2025_11_14.md
│   │   └── ...
│   │
│   ├── session-handoffs-2025-11/    # ✨ NEW: Session handoffs
│   │   ├── HANDOFF_SESSION_24.md
│   │   ├── HANDOFF_SESSION_26.md
│   │   └── SESSION_SUMMARY_2025_11_14.md
│   │
│   ├── test-files/                  # ✨ NEW: Archived tests
│   │   ├── test-protime-parse.js
│   │   ├── test-stock-integration.js
│   │   └── ...
│   │
│   ├── patches/                     # ✨ NEW: Code patches
│   │   ├── ALLIN_CHECKBOXES_PATCH.jsx
│   │   └── apply-allin-patch.sh
│   │
│   ├── 2025-11-08_sensor_rewrite/   # Sensor V4 rewrite
│   ├── 2025-11-08_old_storage/      # Pre-v4 storage code
│   ├── misc/                        # Misc archives
│   ├── plans/                       # Old planning docs
│   └── audits/                      # Audit reports
│
├── optionc/                         # Sprint documentation
│   ├── block-a-documentation/
│   ├── block-b-safety/
│   ├── block-c-robustness/
│   └── block-d-quality/
│
├── performance/                     # Benchmark resultaten
│
├── DEPLOYMENT.md                    # GitHub Pages deployment
├── HANDOFF_VANILLA.md               # Onboarding doc
└── HANDOFF_SESSION_21_UI_POLISH.md  # Latest active handoff
```

**Logica**:
- `analysis/` = Levende documenten (active development)
- `archive/` = **Georganiseerd per categorie** (v4.2.1 cleanup!)
- `optionc/` = Gestructureerde sprint work
- `performance/` = Metrics benchmarking

---

## 🎯 src/ - DE KERN VAN DE APPLICATIE

### 📊 src/core/ - Business Logic (GEEN REACT!)

| Bestand | Functie | Input | Output |
|---------|---------|-------|--------|
| **`metrics-engine.js`** | **KERN: TIR/TAR/TBR/CV/GMI/MAGE/MODD** | Glucose array | Metrics object |
| **`day-profile-engine.js`** | **Dagprofielen** (✨ v4.2.1: SYNC + sensors param) | CGM data + sensors | Day profiles |
| `day-profiles-exporter.js` | Export dagprofielen → HTML | Day profiles | HTML string |
| `html-exporter.js` | Hoofd AGP rapport generator | Full dataset | HTML report |
| `insulin-engine.js` | TDD berekeningen, bolus/basaal | Insulin data | TDD metrics |
| `csvSectionParser.js` | Parse CareLink CSV in secties | CSV string | Parsed sections |
| `parsers.js` | Legacy parser (oude CSV formaten) | CSV | Parsed data |
| `sensorDetectionEngine.js` | Detecteer sensoren in uploads | CSV data | Sensor metadata |
| `sensor-history-engine.js` | Sensor lifecycle tracking | Event data | Sensor timeline |
| `cleanup-engine.js` | Data cleanup & validatie | Raw data | Cleaned data |
| `glucoseGapAnalyzer.js` | Detecteer CGM gaps (>20 min) | Glucose data | Gap analysis |
| `visualization-utils.js` | AGP curve percentielen | Time-bucketed | p5/p25/p50/p75/p95 |
| `stock-engine.js` | Sensor voorraad management | Stock batches | Inventory data |

**🚨 KRITIEKE WIJZIGING (v4.2.1)**:
- `day-profile-engine.js` is nu **SYNC** (was async in v4.2.0)
- Sensors worden als **parameter** doorgegeven (niet meer intern geladen)
- Werkt perfect met React `useMemo` patterns

---

### 🎨 src/components/ - React UI Componenten

**Hoofd Monster**: `AGPGenerator.jsx` (~3000+ lines, refactor pending)

#### Core Components (alfabetisch):

| Component | Rol | Extensie |
|-----------|-----|----------|
| `AGPChart.jsx` | AGP curve visualisatie (SVG) | .jsx |
| `BatchAssignmentDialog.jsx` | Assign sensor → stock batch | .jsx |
| `ComparisonView.jsx` | Vergelijk 2 periodes | .jsx |
| `DataCleanupModal.jsx` | UI voor data cleanup | .jsx + .css |
| `DataManagementModal.jsx` | Sensor/stock management hub | .jsx |
| `DateRangeFilter.jsx` | Datum selector (14d/30d/custom) | .jsx |
| `DayNightSplit.jsx` | Visualisatie dag/nacht split | .jsx |
| `DayProfileCard.jsx` | Kaart voor één dagprofiel | .jsx |
| `DayProfilesModal.jsx` | Modal met alle dagprofielen | .jsx |
| `DebugPanel.jsx` | Dev tools (data inspection) | .jsx |
| `FileUpload.jsx` | CSV/PDF upload component | .jsx |
| `HypoglycemiaEvents.jsx` | Hypo event lijst | .jsx |
| `MetricsDisplay.jsx` | Metrics tabel (TIR/TAR/TBR etc) | .jsx |
| `MetricTooltip.jsx` | Tooltip met metric definitie | .jsx |
| `PatientInfo.jsx` | Patient name/target selector | .jsx |
| `PeriodSelector.jsx` | 14d vs 90d selector | .jsx |
| `SavedUploadsList.jsx` | Historie van uploads | .jsx |
| `SensorHistoryModal.jsx` | Sensor lifecycle modal | .jsx |
| **`SensorImport.jsx`** | **Import JSON/SQLite** (✨ v4.2.0) | .jsx |
| `SensorRegistration.jsx` | Manual sensor registratie | .jsx + .css |
| `SensorRow.jsx` | Rij in sensor tabel | .jsx |
| **`StockBatchCard.jsx`** | **Stock batch kaart** | .jsx |
| **`StockBatchForm.jsx`** | **Add/edit batch** | .jsx |
| **`StockImportExport.jsx`** | **Stock import/export** (✨ v4.2.0 NEW!) | .jsx |
| **`StockManagementModal.jsx`** | **Voorraad management UI** | .jsx |
| `TIRBar.jsx` | Horizontale TIR balk (kleuren) | .jsx |
| `Tooltip.jsx` | Generic tooltip component | .jsx |
| `WorkdaySplit.jsx` | Workday vs free day split | .jsx |

#### Subfolders:

```
src/components/
├── containers/          # Higher-order components
└── panels/             # Panel layouts
    ├── DevToolsPanel.jsx        # Developer tools (✨ v4.2.0: Import/Export tab)
    ├── SensorHistoryPanel.jsx   # Sensor history (✨ v4.2.1: All async)
    ├── StockPanel.jsx           # Stock management
    ├── ImportPanel.jsx          # CSV import
    └── ExportPanel.jsx          # Data export
```

---

### 🔌 src/hooks/ - React Hooks (Integration Layer)

**🚨 BELANGRIJKE WIJZIGING (v4.2.1): Alle storage hooks zijn nu ASYNC!**

| Hook | Functie | Retourneert | Status |
|------|---------|-------------|--------|
| `useCSVData.js` | Parse & manage CSV uploads | `{ data, parseCSV, resetData }` | Active |
| `useComparison.js` | Comparison logic (2 periods) | `{ compareData, ... }` | Active |
| `useDataCleanup.js` | Cleanup workflow state | `{ cleanupState, runCleanup }` | Active |
| `useDataStatus.js` | Data completeness checks | `{ isDataValid, warnings }` | Active |
| **`useDayProfiles.js`** | **Day profile generation** (✨ v4.2.1) | `{ profiles, ... }` | **ASYNC** |
| `useMasterDataset.js` | Master dataset management | `{ masterData, addToMaster }` | Active |
| `useMetrics.js` | Metrics calculation | `{ metrics, calculateMetrics }` | Active |
| **`useSensors.js`** | **Sensor operations** (✨ v4.2.1) | `{ sensors, ... }` | **ASYNC** |
| **`useSensorDatabase.js`** | **DEPRECATED** | — | **Replaced by useSensors** |
| `useUploadStorage.js` | Upload history persistence | `{ uploads, saveUpload }` | Active |

**Design Pattern**: Hooks verbinden core logic met React state via **async/await** (v4.2.1)

---

### 💾 src/storage/ - Data Persistence Layer

**🚨 GROTE WIJZIGING (v4.2.1): IndexedDB is nu primaire storage!**

| Bestand | Storage Type | Functie | Status |
|---------|--------------|---------|--------|
| **`db.js`** | **IndexedDB** | **Main database wrapper** | **PRIMARY** |
| **`sensorStorage.js`** | **IndexedDB** | **Sensor CRUD** (✨ v4.2.1: ASYNC!) | **PRIMARY** |
| `deletedSensorsDB.js` | IndexedDB | Deleted sensors tombstone | Active |
| `eventStorage.js` | localStorage | Sensor event geschiedenis | Active |
| `masterDatasetStorage.js` | localStorage + IndexedDB | Master dataset | Hybrid |
| **`stockStorage.js`** | **localStorage** | **Stock batches** | Active |
| **`sensorImport.js`** | — | **JSON/SQLite import** (✨ v4.2.0) | Active |
| **`stockImportExport.js`** | — | **Stock export/import** (✨ v4.2.0 NEW!) | Active |
| `export.js` | — | Data export (JSON/CSV) | Active |

#### 🏗️ Storage Architectuur (v4.2.1)

**OUDE ARCHITECTUUR** (pre-v4.2.0):
```
localStorage (primary) + SQLite (readonly historical)
├─ Dual storage complexity
├─ 5MB size limit (iPad crashes)
└─ Sync operations only
```

**NIEUWE ARCHITECTUUR** (v4.2.1):
```
IndexedDB (primary, async)
├─ No size limits (90-day imports OK)
├─ All operations async (Promise-based)
├─ Clean error handling
└─ SQLite = read-only historical archive
```

**Subfolders**:
- `migrations/` - Database schema migrations

---

### 🎨 src/styles/ - CSS Bestanden

| Bestand | Scope |
|---------|-------|
| **`globals.css`** | **BRUTALIST DESIGN SYSTEM**: 3px borders, monospace, zwart-wit |
| `DataCleanupModal.css` | Component-specific styling |

**Design Filosofie**:
- ✅ Max contrast (black on white)
- ✅ 3px solid borders everywhere
- ✅ Monospace typography (clinical readability)
- ✅ Print-optimized (A4 layout compatibility)
- ✅ CSS variables (no hardcoded colors)

---

### 🛠️ src/utils/ - Utilities

| Bestand | Functie |
|---------|---------|
| **`constants.js`** | **SINGLE SOURCE OF TRUTH**: Glucose ranges, targets, version |
| `formatters.js` | Date/number formatting helpers |
| `metricDefinitions.js` | Metric tooltips & definitions |
| `debug.js` | Logging utilities |
| `pdfParser.js` | PDF → text extraction (pdfjs-dist) |
| `sqliteParser.js` | SQLite DB parser |
| `patientStorage.js` | Patient info persistence |
| `uploadStorage.js` | Legacy upload storage |

**🚨 KRITIEK**: `constants.js` is heilig — wijzigingen propageren door hele app!

---

## 🌐 public/ - Statische Assets

```
public/
└── sensor_database.db    # SQLite database (readonly, historical sensors)
```

**BELANGRIJK**: Deze DB is **readonly archive** - generated from CSV imports, not manual!

---

## 🧪 test-data/ - Test Bestanden

```
test-data/
├── Jo Mostert 14-11-2025.csv       # Latest CSV export
├── Jo Mostert 14-11-2025.pdf       # Latest AGP rapport
├── SAMPLE_*.csv                    # Test samples
├── agp-master-*.json               # Master dataset exports
├── agp-sensors-*.json              # Sensor metadata exports
└── archive/
    ├── ProTime Cards/              # ProTime work schedule PDFs
    │   └── export_Timecard_*.pdf   # Monthly timecards
    └── monthly-csvs/               # Historical CSV backups
```

**Gebruik**: Manual testing, regression checks, onboarding nieuwe chats

---

## 📖 project/ + reference/ - Meta Documentation

### project/ - Actieve Project Docs

- `PROJECT_BRIEFING.md` - Hoofd project spec
- `V3_ARCHITECTURE.md` - v3.x architectuur
- `V3_IMPLEMENTATION_GUIDE.md` - Implementation details
- `STATUS.md` - Current sprint status
- `TEST_PLAN.md` - QA checklist

### reference/ - Referentie Materiaal (TRUTH SOURCES!)

| Document | Status | Rol |
|----------|--------|-----|
| **`metric_definitions.md`** | **AUTORITAIR** | **Metric formules & definitions** |
| **`minimed_780g_ref.md`** | **AUTORITAIR** | **MiniMed 780G pump settings** |
| `DUAL_STORAGE_ANALYSIS.md` | Historical | Dual storage issues (v4.1 fixed) |
| `GIT_WORKFLOW.md` | Active | Git best practices |
| `V3_ARCHITECTURE_DECISIONS.md` | Historical | ADRs (Architecture Decision Records) |

**🚨 NOOIT AANPASSEN ZONDER OVERLEG**:
- `metric_definitions.md` (medical formulas!)
- `minimed_780g_ref.md` (clinical settings!)

---

## ⚙️ DATA FLOW PIPELINE

### 1. USER UPLOADS CSV
```
FileUpload.jsx
  └─> useCSVData hook
      └─> csvSectionParser.js (parse CSV)
          └─> sensorDetectionEngine.js (detect sensors)
```

### 2. SENSOR DETECTION (✨ v4.2.1: IndexedDB)
```
sensorStorage.js (ASYNC!)
  ├─> Query IndexedDB (recent sensors)
  ├─> Query SQLite (historical archive)
  └─> Deduplicate & return
```

### 3. DATA PROCESSING
```
Master dataset creation
  └─> metrics-engine.js
      ├─> calculateTIR/TAR/TBR
      ├─> calculateCV/MAGE/MODD
      └─> calculateGMI
```

### 4. VISUALIZATION
```
AGPGenerator.jsx
  ├─> AGPChart.jsx (SVG curve)
  ├─> MetricsDisplay.jsx (table)
  └─> DayProfilesModal.jsx (day details)
```

### 5. EXPORT
```
html-exporter.js
  └─> Generates HTML report
      └─> User downloads as HTML
```

---

## 🔬 KEY ALGORITHMS

### MAGE (Mean Amplitude of Glycemic Excursions)

**Locatie**: `metrics-engine.js > calculateMAGE()`

**Algoritme**:
1. Vind lokale extrema (pieken & dalen)
2. Filter: behoud alleen extrema >1 SD van mean
3. Bereken amplitudes tussen opeenvolgende extrema
4. Return gemiddelde amplitude

**Waarom belangrijk?**: Meet grote glucose schommelingen (postprandiale spikes, hypo's)

---

### MODD (Mean of Daily Differences)

**Locatie**: `metrics-engine.js > calculateMODD()`

**Algoritme**:
1. Groepeer data per dag
2. Voor elk tijdstip T: `|glucose_dag1(T) - glucose_dag2(T)|`
3. Return gemiddelde van alle verschillen

**Waarom belangrijk?**: Meet dag-tot-dag consistentie (lifestyle variabiliteit)

---

### Sensor Detection

**Locatie**: `sensorDetectionEngine.js`

**Logica**:
1. Parse "Sensor" kolom in CSV
2. Detecteer "CHANGE_SENSOR_xx" events
3. Cluster events (max 4h tussen events = zelfde sensor)
4. Bepaal sensor start/end timestamps
5. Generate sensor_id (hash van start_date + device_serial)

**Edge cases**:
- Multiple sensor changes op 1 dag (zeldzaam)
- Sensor zonder end date (huidige sensor)
- CSV zonder sensor events (gebruik whole period)

---

## 🔥 KRITIEKE BESTANDEN (NIET BREKEN!)

### 🚨 Tier 1: ABSOLUUT KRITIEK

1. **`src/utils/constants.js`** - Wijzigingen = ripple effect door hele app!
2. **`src/core/metrics-engine.js`** - Medische algoritmes (MAGE/MODD/TIR)
3. **`src/storage/sensorStorage.js`** - IndexedDB async operations (v4.2.1)
4. **`reference/metric_definitions.md`** - Autoritaire metric definitie
5. **`reference/minimed_780g_ref.md`** - MiniMed 780G settings reference

### ⚠️ Tier 2: Belangrijk

6. `src/core/day-profile-engine.js` - Day profiles (SYNC sinds v4.2.1)
7. `src/hooks/useSensors.js` - Main sensor hook (async)
8. `src/storage/db.js` - IndexedDB wrapper
9. `public/sensor_database.db` - Historical archive (regenerate from CSV only!)

---

## 🐛 BEKENDE ISSUES & STATUS

### ✅ Issue #1: Dual Storage Complexity (FIXED v4.2.1)
**Status**: ✅ **OPGELOST**  
**Fix**: Migratie naar IndexedDB als primary storage  
**Docs**: `docs/archive/completed-features/ASYNC_REFACTOR_ANALYSIS.md`

### ✅ Issue #2: TDD Calculation Bug (FIXED v3.1.0)
**Status**: ✅ **OPGELOST**  
**Fix**: Merge insulin data across uploads  
**Docs**: `CHANGELOG.md` entry v3.1.0

### 🔄 Issue #3: AGPGenerator.jsx Monolith (IN PROGRESS)
**Status**: 🔄 **Ongoing refactor**  
**Oorzaak**: 3000+ lijnen component (incremental feature additions)  
**Fix**: Extract components to `containers/` and `panels/`  
**Docs**: `docs/archive/plans/PLAN_VAN_AANPAK.md`

---

## 🎯 DEVELOPMENT WORKFLOW

### Start Server
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### Git Workflow
```bash
# Atomic commits (small changes)
git add <specific-file>
git commit -m "[component] descriptive message"
git push

# NEVER commit:
# - node_modules/
# - .DS_Store
# - test-data/*.csv (except SAMPLE_*)
```

### Testing Strategy
1. **Manual browser testing** (primary method)
2. **Console logs** (debug.js logging)
3. **Performance benchmarking** (metrics-engine.benchmarks)
4. **Regression checks** (compare with saved exports)

**No automated tests yet** (vitest configured but not implemented)

---

## 📊 VERSION HISTORY

| Versie | Datum | Grote Wijzigingen |
|--------|-------|-------------------|
| **v4.2.1** | 2025-11-14 | ✅ **Async refactor compleet**, syntax fixes |
| **v4.2.0** | 2025-11-14 | 📦 **Stock import/export**, sensor JSON import |
| v4.0.1 | 2025-11-08 | 🎨 Color system integration |
| v3.9.1 | 2025-11-08 | UI polish, collapsible panels |
| v3.8.0 | 2025-11-06 | ProTime integration, sensor rewrite |
| v3.1.0 | 2025-10-28 | TDD per day, dual storage fixes |
| v3.0.0 | 2025-10-25 | Complete V3 rewrite |

---

## 📝 BESTANDSEXTENSIES UITLEG

| Extensie | Betekenis | Gebruik in Project |
|----------|-----------|-------------------|
| `.jsx` | JavaScript XML | React componenten (JSX syntax) |
| `.js` | JavaScript | Pure JavaScript (core logic, utils) |
| `.json` | JSON data | Config, package definitions, exports |
| `.css` | Cascading Style Sheets | Component styling |
| `.md` | Markdown | Documentatie |
| `.csv` | Comma-Separated Values | Medtronic CareLink exports |
| `.pdf` | Portable Document Format | AGP rapporten, ProTime cards |
| `.db` | SQLite Database | Sensor historie (readonly archive) |
| `.sh` | Shell Script | Launch scripts (bash) |
| `.html` | HTML | Entry point, export reports |

---

## 🆕 NIEUWE FEATURES (v4.2.0 - v4.2.1)

### ⚡ Async Refactor (v4.2.1)
- ✅ IndexedDB als primary storage
- ✅ All sensor operations async
- ✅ Day profile engine optimized (parameter passing)
- ✅ No localStorage size limits (90-day imports OK on iPad!)

### 📦 Stock Management (v4.2.0)
- ✅ Stock batch tracking
- ✅ Import/export with sensor reconnection
- ✅ Usage statistics
- ✅ Automatic sensor assignment

### 🔄 Enhanced Import (v4.2.0)
- ✅ JSON sensor import
- ✅ SQLite sensor import
- ✅ Duplicate detection
- ✅ Developer Tools integration

---

## 📋 QUICK REFERENCE

**Live URL**: https://agp.jenana.eu  
**Deployment**: Automatic via GitHub Actions (push to `main`)  
**Current Version**: v4.2.1  
**Storage**: IndexedDB (primary) + localStorage (legacy) + SQLite (archive)  
**Key Metrics**: TIR, TAR, TBR, GMI, CV, MAGE, MODD  
**Architecture**: Domain-Driven Design with async storage  

---

**Document versie**: 2.0  
**Laatst bijgewerkt**: 2025-11-14  
**Status**: ✅ Current & accurate

