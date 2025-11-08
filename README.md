# AGP+ - Ambulatory Glucose Profile Analyzer

**Professional diabetes data analysis tool following ADA/ATTD clinical guidelines**

**Current Version:** v4.0.1 (Color System Integration)  
**Status:** ✅ Production-ready with validated MAGE/MODD algorithms  
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
- **Master dataset**: Keep years of data, upload whenever, never lose history
- **Sensor intelligence**: Automatic detection of sensor and cartridge changes from device logs
- **Export everything**: HTML reports that look like they came from a diabetes clinic, not a spreadsheet
- **Backup & restore**: Complete JSON export/import system—backup your entire database, restore on any device
- **100% Client-Side**: All data stays in your browser (localStorage + IndexedDB), nothing sent to servers

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

**See**: `docs/DEPLOYMENT.md` for complete setup instructions

---

## Quick Start

### 1. Start Development Server

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

Or use the startup script:
```bash
./start.sh
```

### 2. Open in Browser

Navigate to: **http://localhost:3001**

### 3. Upload CSV

1. Export data from Medtronic CareLink (CSV format)
2. Click "Upload CSV" button
3. Select your file
4. Choose analysis period

---

## Project Structure

```
agp-plus/
├── src/
│   ├── components/        # React UI components
│   ├── core/             # Calculation engines (pure functions)
│   ├── hooks/            # React hooks (orchestration)
│   └── storage/          # IndexedDB persistence
├── docs/
│   ├── HANDOFF.md        # Start here for development
│   ├── STATUS.md         # Current project status
│   ├── TEST_PLAN.md      # Testing procedures
│   └── V3_ARCHITECTURE.md # System design
├── public/               # Static assets
└── test-data/           # Sample CSV files
```

---

## For Developers

### Getting Started

1. **Read Documentation**
   - Start with `/docs/HANDOFF.md`
   - Review `/docs/V3_ARCHITECTURE.md` for system design
   - Check `/docs/STATUS.md` for current state

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Dev Server**
   ```bash
   npm run dev
   ```

### Key Technologies

- **React 18.3** - UI framework
- **Vite** - Build tool with hot reload
- **IndexedDB** - Client-side storage (via Dexie.js)
- **localStorage** - Event detection cache
- **Tailwind CSS** - Styling (brutalist design system)

### Architecture

**Data Flow:**
```
CSV Upload → Parse → IndexedDB → Event Detection → 
Calculate Metrics → Generate AGP → Render Components
```

**Storage:**
- **IndexedDB**: Glucose readings (persistent, month-bucketed)
- **localStorage**: Event cache (sensor/cartridge changes)
- **React State**: UI state (session only)

### Testing

Run comprehensive tests:
```bash
# See /docs/TEST_PLAN.md for details

# Priority 1: Clinical validation
# Priority 2: Edge cases  
# Priority 3: Performance
# Priority 4: User workflows
```

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
- Glycemic metrics (TIR, TAR, TBR, GMI)
- AGP chart (5th, 25th, 50th, 75th, 95th percentiles)
- Day profiles (24h glucose curves with event markers)
- Comparison views (period/day-night/workday)

---

## Database Backup & Restore

**New in v3.8.0:** Complete symmetric import/export system for your entire database.

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
3. **Confirmation**: Approve import with merge warning
4. **Import**: Data imported in <5 seconds
5. **Refresh**: UI auto-updates with restored data

**Merge behavior:** Import adds to existing data (no deletion)  
**Use case:** Backup before testing, migrate between devices, restore after data loss

---

## Clinical Metrics

### Time in Range (TIR)
- **Target:** 70-180 mg/dL
- **Goal:** >70% of time
- **Reference:** Battelino T et al., *Diabetes Care* 2019;42(8):1593-1603

### Time Above Range (TAR)
- **Level 1:** >180 mg/dL  
- **Level 2:** >250 mg/dL
- **Reference:** ATTD Consensus on CGM Metrics 2019

### Time Below Range (TBR)
- **Level 1:** <70 mg/dL
- **Level 2:** <54 mg/dL
- **Reference:** ATTD Consensus on CGM Metrics 2019

### Glucose Management Indicator (GMI)
- **Formula:** 3.31 + 0.02392 × [mean glucose]
- **Correlates with:** HbA1c
- **Reference:** Beck RW et al., *Diabetes Care* 2019;42(4):659-666

### Coefficient of Variation (CV)
- **Formula:** (SD / Mean) × 100
- **Target:** ≤36%
- **Reference:** Monnier L et al., *Diabetes Care* 2008;31(11):2116-2119

### MAGE (Mean Amplitude of Glycemic Excursions)
- **Measures:** Intra-day glucose variability
- **Target:** <60 mg/dL
- **Reference:** Service FJ et al., *Diabetes* 1970;19(9):644-655

### MODD (Mean Of Daily Differences)
- **Measures:** Day-to-day consistency
- **Target:** <40 mg/dL
- **Reference:** Molnar GD et al., *Diabetologia* 1972;8:342-348

---

## Design Philosophy

**Brutalist Medical Interface:**
- High contrast (black background, white/orange text)
- 3px borders for clarity
- Print-compatible (black & white)
- Monospace typography
- No gradients or shadows
- Clinical functionality over aesthetics

**Rationale:**
Medical professionals need rapid data interpretation. The design prioritizes:
1. Speed of reading
2. Print compatibility
3. Clear data hierarchy
4. No visual distractions

---

## Browser Compatibility

**Tested:**
- Chrome/Edge (Chromium)
- Safari (macOS)
- Firefox

**Requirements:**
- Modern browser with ES6 support
- IndexedDB support
- localStorage enabled

**Mobile:**
- iOS Safari (touch interactions work)
- Android Chrome (basic support)

---

## Database Management

### Export Database
Click "Export Database" to download complete JSON file containing:
- All glucose readings
- Month bucket metadata
- Workday dates (if ProTime PDF uploaded)

### Import Database  
Upload previously exported JSON to restore full dataset.

### Delete Data
Individual month buckets can be deleted with preview of affected date ranges.

---

## Event Detection

### Sensor Changes
**3-Tier Confidence System:**
1. **High:** Sensor database match (future feature)
2. **Medium:** CSV alert detection ("SENSOR CONNECTED", "CHANGE SENSOR")
3. **Low:** Gap analysis (2-10 hour gaps, >100 readings before)

### Cartridge Changes
Detected from CSV "Rewind" events in column 21.

### Visualization
Red dashed vertical lines at sensor/cartridge change times in day profiles.

---

## Comparison Features

### Period-to-Period
Compare current period with previous equivalent period (14/30/90 days back).

### Day vs Night
- **Day:** 06:00-00:00
- **Night:** 00:00-06:00

### Workday vs Rest
Upload ProTime PDF to detect workdays, compare glucose patterns.

---

## Known Limitations

1. **CSV Format:** Only Medtronic CareLink format supported
2. **Units:** mg/dL only (no mmol/L conversion)
3. **Timezone:** Local time only (no timezone conversion)
4. **Device:** MiniMed 780G focus (other devices may work)

---

## Documentation

- **HANDOFF.md** - Developer onboarding guide
- **STATUS.md** - Current project status
- **TEST_PLAN.md** - Testing procedures
- **V3_ARCHITECTURE.md** - System design document
- **V3_IMPLEMENTATION_GUIDE.md** - Phase-by-phase development
- **metric_definitions.md** - Clinical formulas
- **minimed_780g_ref.md** - Device specifications

---

## Contributing

This is a personal project by Jo Mostert. For questions or collaboration:

**Development Process:**
1. Read `/docs/HANDOFF.md`
2. Check `/docs/STATUS.md` for current priorities
3. Follow git workflow in `/docs/GIT_WORKFLOW.md`
4. Use Desktop Commander for file operations
5. Test thoroughly before committing

---

## License

MIT License - See LICENSE file for details

---

## Acknowledgments

- **Clinical Guidelines:** American Diabetes Association (ADA), Advanced Technologies & Treatments for Diabetes (ATTD)
- **Device:** Medtronic MiniMed 780G
- **Inspiration:** AGP reports from clinical diabetes management

---

## Version History

See `CHANGELOG.md` for complete version history.

**Current:** v3.9.1 (November 2025)
- Scientific methodology references in footer
- MAGE/MODD algorithm improvements (validated against GlyCulator)
- Metrics grid layout optimization
- Panel-based navigation system
- Complete import/export symmetry
- Master dataset architecture

---

**Built with care for better diabetes management. 🩺**
