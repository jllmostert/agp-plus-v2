# AGP+ - Ambulatory Glucose Profile Analyzer

**Professional diabetes data analysis tool following ADA/ATTD clinical guidelines**

---

## What is AGP+?

AGP+ is a React-based web application for analyzing continuous glucose monitoring (CGM) data from Medtronic CareLink CSV exports. It provides comprehensive glycemic metrics, AGP visualization, period comparisons, day profiles, and device event tracking.

**Key Features:**
- Master dataset with multi-upload support
- Period-to-period comparison (14/30/90 days)
- Day/Night glucose analysis
- Workday vs Rest day metrics (ProTime PDF integration)
- Individual 24h day profiles with event markers
- Sensor and cartridge change detection
- Complete database export/import

**Clinical Standards:**
- ADA/ATTD 2025 guidelines
- TIR/TAR/TBR thresholds (70-180 mg/dL)
- GMI calculation (HbA1c estimate)
- mg/dL units only

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

## Clinical Metrics

### Time in Range (TIR)
- **Target:** 70-180 mg/dL
- **Goal:** >70% of time

### Time Above Range (TAR)
- **Level 1:** >180 mg/dL  
- **Level 2:** >250 mg/dL

### Time Below Range (TBR)
- **Level 1:** <70 mg/dL
- **Level 2:** <54 mg/dL

### Glucose Management Indicator (GMI)
- **Formula:** 3.31 + 0.02392 × [mean glucose]
- **Correlates with:** HbA1c

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

**Current:** v3.0.0 (October 2025)
- Master dataset architecture
- Multi-upload support
- Event detection system
- Comparison features
- Day profiles with device events

---

**Built with care for better diabetes management. 🩺**
