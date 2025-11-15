# AGP+ - Ambulatory Glucose Profile Analyzer

**Professional diabetes data analysis tool following ADA/ATTD clinical guidelines**

**Current Version:** v4.3.0 (Phase 1 Refactoring Complete)  
**Status:** ✅ Production-ready with complete import/export, validated metrics, and improved architecture  
**Live URL:** 🌐 https://agp.jenana.eu (GitHub Pages deployment)

---

## What is AGP+?

Your endocrinologist takes three months to schedule an appointment, then spends five minutes glancing at your glucose data before declaring "looks fine." AGP+ gives you the clinical analysis they don't have time for—in three seconds, with metrics your diabetes educator would high-five you over.

Built by a type 1 diabetic who got tired of waiting for healthcare software to catch up with hardware, AGP+ transforms Medtronic CareLink exports into publication-ready Ambulatory Glucose Profiles following ADA/ATTD 2025 guidelines. Think of it as the endocrinologist's desktop toolset, minus the white coat and three-month wait time.

**What you get:**
- **Clinical-grade analytics**: TIR, TAR, TBR, GMI, CV, MAGE, MODD—the metrics that actually matter
- **Period comparison**: See if your last 14 days beat your last 90 (spoiler: they usually do)
- **Day/night analysis**: Because 3 AM glucose hits different than 3 PM
- **Workday tracking**: Import ProTime PDFs to see if Monday ruins your control (it does)
- **Individual day profiles**: Every 24-hour period as a separate story, complete with event markers
- **7-day and 14-day views**: Toggle between weekly and bi-weekly day profile analysis
- **Master dataset**: Keep years of data, upload whenever, never lose history
- **Sensor intelligence**: Automatic detection of sensor and cartridge changes from device logs
- **Stock management**: Track sensor batches, usage, and assignments with full import/export
- **Advanced import/export**: JSON and SQLite sensor imports, stock batch export with reconnection
- **Export everything**: HTML reports that look like they came from a diabetes clinic, not a spreadsheet
- **Backup & restore**: Complete JSON export/import system—backup your entire database, restore on any device
- **100% Client-Side**: All data stays in your browser (IndexedDB + localStorage), nothing sent to servers
- **Large dataset support**: IndexedDB storage handles 90-day imports without crashes (even on iPad)
- **Fullscreen charts**: Dynamic Y-axis scaling with fullscreen mode for detailed analysis

**Clinical standards baked in:**
- ADA/ATTD 2025 consensus guidelines (we read the boring PDFs so you don't have to)
- Industry-standard ranges (70-180 mg/dL, because that's what the research says)
- GMI calculation using the latest formula (it's basically HbA1c, but faster)
- MAGE and MODD variability metrics (for when CV alone doesn't tell the whole story)

No cloud uploads, no subscriptions, no "premium features." Just your data, your browser, and metrics that would make a diabetes researcher nerd out.

---

## 🌐 Production Deployment

**Live URL**: https://agp.jenana.eu

**Automatic Deployment**:
- Every push to `main` branch triggers GitHub Actions
- Builds and deploys to GitHub Pages automatically
- Live within 3-5 minutes after push

---

## Quick Start

### For Users

1. **Visit**: https://agp.jenana.eu
2. **Upload**: Export CSV from Medtronic CareLink
3. **Analyze**: View your AGP report instantly
4. **Export**: Download HTML report for your doctor

### For Developers

```bash
# Navigate to project
cd /Users/jomostert/Documents/Projects/agp-plus

# Set PATH (required for Homebrew Node.js)
export PATH="/opt/homebrew/bin:$PATH"

# Start dev server
npx vite --port 3001

# Open browser
open http://localhost:3001
```

Or use the startup script:
```bash
./start.sh
```

---

## Project Structure

```
agp-plus/
├── src/
│   ├── components/        # React UI components
│   │   ├── AGPGenerator.jsx      # Main application component
│   │   ├── panels/               # Feature panels (IMPORT, EXPORT, etc)
│   │   └── modals/               # Modal dialogs
│   ├── hooks/            # Custom React hooks (state management)
│   │   ├── useModalState.js      # Modal state management
│   │   ├── usePanelNavigation.js # Panel routing + keyboard shortcuts
│   │   └── useImportExport.js    # Import/export with progress tracking
│   ├── core/             # Calculation engines (pure functions)
│   │   ├── metrics-engine.js     # MAGE, MODD, TIR calculations
│   │   └── day-profile-engine.js # Day-by-day analysis
│   ├── storage/          # Data persistence layer
│   │   ├── masterDatasetStorage.js  # IndexedDB (primary)
│   │   ├── sensorStorage.js         # Async sensor management
│   │   └── stockStorage.js          # Batch tracking
│   └── styles/           # CSS (brutalist design system)
├── docs/
│   ├── project/          # Strategic documentation (Tier 2)
│   │   ├── PROJECT_BRIEFING.md # Project overview & standards
│   │   └── STATUS.md           # Current version status
│   ├── handoffs/         # Session logs (Tier 1)
│   │   └── PROGRESS.md         # Minute-by-minute session log
│   └── reference/        # Technical references (Tier 3)
├── reference/            # Scientific references
│   ├── metric_definitions.md    # Clinical formulas
│   └── minimed_780g_ref.md      # Device specifications
├── test-data/           # Sample CSV files
└── public/              # Static assets
```

---

## For Developers

### Getting Started

1. **Read Documentation**
   - Start with `docs/project/PROJECT_BRIEFING.md` (strategic overview)
   - Check `docs/project/STATUS.md` (current state)
   - Review `TODO.md` (priorities)
   - Session logs in `docs/handoffs/PROGRESS.md`

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Dev Server**
   ```bash
   export PATH="/opt/homebrew/bin:$PATH"
   npx vite --port 3001
   ```

### Key Technologies

- **React 18.2** - UI framework with functional components
- **Vite 5.x** - Build tool with hot module replacement
- **IndexedDB** - Primary storage for glucose data
- **localStorage** - Recent data cache (sensors, stock, patient info)
- **sql.js** - SQLite for historical sensor imports
- **Pure CSS** - Brutalist design system with CSS variables
- **No UI frameworks** - Custom components, no Tailwind/Material-UI

### Architecture Highlights

**Data Flow:**
```
CSV Upload → Parse → IndexedDB (master dataset) → 
Calculate Metrics (core engines) → 
React Components → Browser Display / HTML Export
```

**Storage Strategy:**
- **IndexedDB**: Glucose readings (async, large datasets)
- **localStorage**: Recent sensors, stock batches, patient info (sync, <5MB)
- **SQLite**: Historical sensors from imports (read-only)
- **Deduplication**: Merge SQLite + localStorage (prefer localStorage)

**State Management:**
- Custom hooks for state extraction (useModalState, usePanelNavigation, useImportExport)
- React useState for local component state
- No Redux/MobX/Context (current hooks architecture works well)

**Recent Improvements (v4.3.0)**:
- Phase 1 refactoring: 330 lines removed from main component
- Custom hooks: Extracted 19 state variables into 3 hooks
- Async storage: All sensor operations use async IndexedDB
- Import/export: Complete symmetric backup/restore system

---

## Data Format

**Input:** Medtronic CareLink CSV export  
**Columns Used:**
- Index 0: Date
- Index 1: Time  
- Index 4: Sensor Glucose (mg/dL)
- Index 7: Alerts (sensor/rewind events)
- Index 21: Marker events

**Output:** HTML report with:
- Glycemic metrics (TIR, TAR, TBR, GMI, CV, MAGE, MODD)
- AGP chart (5th, 25th, 50th, 75th, 95th percentiles with dynamic Y-axis)
- Day profiles (24h glucose curves with event markers, 7-day and 14-day views)
- Comparison views (period-to-period, day/night, workday/rest)

---

## Database Backup & Restore

**Complete symmetric import/export system** for your entire database.

### Export Your Database

Click **EXPORT** → **💾 Export Database (JSON)** to download a complete backup including:
- All glucose readings (month-bucketed)
- Sensor history and lock states
- Cartridge changes and events
- Workday definitions
- Patient information
- Stock batches and sensor assignments

**File format:** JSON (schema version 3.8.0)  
**Size:** ~1-2MB per 90 days of data  
**Compatible:** Works across devices/browsers

### Import Database

Click **EXPORT** → **📥 Import Database (JSON)** to restore a backup:

1. **Validation**: File is validated before import (schema, structure, data types)
2. **Preview**: Review data counts (months, readings, sensors, etc.)
3. **Merge Strategy**: Choose append (add to existing) or replace mode
4. **Progress Tracking**: 7-stage import progress with percentage
5. **Auto-backup**: Optional automatic backup before import
6. **Refresh**: UI auto-updates with restored data

**Import modes:**
- **Append** (default): Add to existing data (no deletion)
- **Replace**: Clear existing, import fresh (requires confirmation)

**Use cases:** 
- Backup before testing
- Migrate between devices
- Restore after data loss
- Share datasets (research/analysis)

---

## Clinical Metrics

All metrics calculated according to peer-reviewed scientific literature and international consensus guidelines.

### Time in Range (TIR)
- **Range:** 70-180 mg/dL
- **Goal:** >70% of time
- **Reference:** Battelino T et al., *Diabetes Care* 2023;46(8):1593-1603

### Time Above Range (TAR)
- **Level 1:** 181-250 mg/dL (target <25%)
- **Level 2:** >250 mg/dL (target <5%)
- **Reference:** ATTD Consensus on CGM Metrics 2023

### Time Below Range (TBR)
- **Level 1:** 54-69 mg/dL (target <4%)
- **Level 2:** <54 mg/dL (target <1%)
- **Reference:** ATTD Consensus on CGM Metrics 2023

### Glucose Management Indicator (GMI)
- **Formula:** 3.31 + 0.02392 × [mean glucose mg/dL]
- **Correlates with:** HbA1c (laboratory)
- **Target:** <7.0% for most adults with T1DM
- **Reference:** Bergenstal RM et al., *Diabetes Care* 2018;41(11):2275-2280

### Coefficient of Variation (CV)
- **Formula:** (SD / Mean) × 100
- **Target:** ≤36% (international consensus)
- **Interpretation:** Lower = more stable glucose control
- **Reference:** Monnier L et al., *Diabetes Care* 2008;31(11):2116-2119

### MAGE (Mean Amplitude of Glycemic Excursions)
- **Measures:** Intra-day glucose variability (large swings within a day)
- **Target:** <60 mg/dL (excellent), 60-100 mg/dL (acceptable)
- **Algorithm:** Per-day SD calculation with mean-crossing requirement
- **Reference:** Service FJ et al., *Diabetes* 1970;19(9):644-655

### MODD (Mean Of Daily Differences)
- **Measures:** Day-to-day consistency (reproducibility)
- **Target:** <40 mg/dL (excellent), 40-60 mg/dL (good)
- **Algorithm:** Same-time comparison across consecutive days
- **Reference:** Molnar GD et al., *Diabetologia* 1972;8:342-348

All formulas and calculations documented in `reference/metric_definitions.md` with scientific citations.

---

## Design Philosophy

**Brutalist Medical Interface:**
- High contrast (black background, white/orange/green text)
- 3px solid borders for clarity
- Print-compatible (black ink on white paper)
- Monospace typography for data alignment
- No gradients, shadows, or animations
- Clinical functionality over aesthetics

**Why Brutalist?**
1. **Print Optimization**: Medical reports print cleanly in black & white
2. **Accessibility**: High contrast for visual impairments
3. **Speed of Reading**: No visual distractions, rapid data interpretation
4. **Professional**: Clinical documentation aesthetic
5. **Information Density**: Maximize data, minimize decoration

**Design Implementation**:
- CSS variables for color palette (`--paper`, `--ink`, `--grid-line`, etc.)
- Consistent 3px borders throughout
- Tabular-nums for numerical alignment
- No emoji in production UI (clinical professionalism)

---

## Browser Compatibility

**Tested & Supported:**
- ✅ Chrome/Edge (Chromium) - Recommended
- ✅ Safari (macOS/iOS) - Full support
- ✅ Firefox - Full support

**Requirements:**
- Modern browser with ES6+ support
- IndexedDB support (all modern browsers)
- localStorage enabled
- JavaScript enabled

**Mobile/Tablet:**
- ✅ iOS Safari (touch interactions, async storage for large imports)
- ✅ Android Chrome (basic support)
- ⚠️ iPad: Full functionality with async IndexedDB (no localStorage limits)

---

## Event Detection

### Sensor Changes
**3-Tier Detection System:**
1. **Exact Alert** (best): "SENSOR CONNECTED" alert timestamp from CSV
2. **First Reading** (good): First glucose reading after connect alert
3. **Estimated** (acceptable): Cluster analysis from glucose gaps

**Detection Method Indicators** (in UI):
- 🎯 Exact Alert
- 📊 First Reading  
- ⏱️ Estimated

### Cartridge Changes
Detected from CSV "Rewind" events in marker column.

### Sensor End-of-Life
**Automatic detection** via glucose gap analysis:
- First gap ≥2 hours after last valid reading
- Determines exact sensor stop time
- Sets lifecycle status: 'ended', 'active', or 'unknown'

### Visualization
Red dashed vertical lines at sensor/cartridge change times in day profiles and AGP charts.

---

## Comparison Features

### Period-to-Period
Compare current period (7/14/30/90 days) with previous equivalent period:
- Side-by-side metrics comparison
- Trend arrows (improving/declining)
- Statistical significance indicators

### Day vs Night Analysis
- **Day:** 06:00-00:00 (18 hours)
- **Night:** 00:00-06:00 (6 hours)
- Separate TIR/TAR/TBR for each period

### Workday vs Rest Analysis
- Upload ProTime PDF to detect workdays
- Compare glucose patterns: workdays vs rest days
- Identify work-related glucose impacts

---

## Known Limitations

1. **CSV Format:** Only Medtronic CareLink format supported (not Dexcom/Abbott)
2. **Units:** mg/dL only (no mmol/L conversion)
3. **Timezone:** Local time only (no timezone conversion)
4. **Device Focus:** Optimized for MiniMed 780G (other Medtronic models may work)
5. **Component Size:** Main component still large (1667 lines) but improved from 1803

**Future improvements** tracked in `TODO.md`.

---

## Documentation

### For Users
- **README.md** (this file) - User guide and quick start

### For Developers (Strategic)
- **docs/project/PROJECT_BRIEFING.md** - Project overview, architecture, standards
- **docs/project/STATUS.md** - Current version status and known issues
- **TODO.md** - Current priorities and future work
- **CHANGELOG.md** - Complete version history

### For Developers (Session Logs)
- **docs/handoffs/PROGRESS.md** - Minute-by-minute session log (source of truth)
- **docs/handoffs/HANDOFF_*.md** - Session transition documents

### Scientific References
- **reference/metric_definitions.md** - All formulas with peer-reviewed citations
- **reference/minimed_780g_ref.md** - Device specifications and SmartGuard settings
- **docs/reference/DUAL_STORAGE_ANALYSIS.md** - Storage architecture rationale

---

## Contributing

This is a personal project by **Jo Mostert** for diabetes self-management.

**For collaboration or questions:**

1. Read `docs/project/PROJECT_BRIEFING.md` (strategic overview)
2. Check `docs/project/STATUS.md` (current state)
3. Review `docs/handoffs/PROGRESS.md` (recent work)
4. Follow commit conventions in PROJECT_BRIEFING.md

**Development Philosophy:**
- Medical accuracy first (lives depend on correct calculations)
- Brutalist design for clinical use (print-ready, accessible)
- Crash-resistant development (frequent commits, detailed logs)
- Progressive enhancement (refactor when pain emerges, not ideologically)

---

## License

MIT License - See LICENSE file for details.

**Medical Disclaimer**: This software is for informational purposes only. Not a substitute for professional medical advice. Always consult your healthcare provider for diabetes management decisions.

---

## Acknowledgments

- **Clinical Guidelines:** American Diabetes Association (ADA), Advanced Technologies & Treatments for Diabetes (ATTD)
- **Scientific Foundation:** Service FJ (MAGE), Molnar GD (MODD), Battelino T (TIR consensus), Bergenstal RM (GMI)
- **Device:** Medtronic MiniMed 780G with Guardian Sensor 4
- **Inspiration:** Professional AGP reports from clinical diabetes management

---

## Version History

See `CHANGELOG.md` for complete version history with detailed session logs.

### Recent Versions

**v4.3.0** (November 2025) - Phase 1 Refactoring Complete
- Custom hooks: useModalState, usePanelNavigation, useImportExport
- 330 lines removed from main component
- 41% complexity reduction
- Zero bugs introduced, all functionality preserved

**v4.2.2** (November 2025) - Stock Import/Export + IndexedDB Fix
- Stock batch import/export with sensor reconnection
- Fixed IndexedDB schema (sensor import error)
- Centralized version management system

**v4.2.1** (November 2025) - Async Storage Complete
- Complete async refactor: sensorStorage → IndexedDB
- Fixed iPad localStorage limitations
- All async cascades properly handled

**v3.9.0** (November 2025) - Scientific Improvements
- MAGE: Per-day SD calculation (Service 1970)
- MODD: Chronological sorting (Molnar 1972)
- Coverage thresholds (ATTD 2023 consensus)

**v3.8.0** (November 2025) - Complete Import/Export
- Symmetric JSON backup/restore
- 7 data types (glucose, sensors, stock, patient, etc.)
- Versioned schema with validation

**v3.7.0** (November 2025) - Panel Architecture
- Panel-based UI (IMPORT, DAGPROFIELEN, SENSOREN, EXPORT)
- Keyboard shortcuts (Ctrl+1/2/3/4)
- Full ARIA labels and accessibility

---

**Built with care for better diabetes management. 🩺**

**For technical questions**: See `docs/project/PROJECT_BRIEFING.md`  
**For current status**: See `docs/project/STATUS.md`  
**For priorities**: See `TODO.md`
