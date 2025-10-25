# AGP+ PROJECT BRIEFING V2.2.0 - PART 2

## FILE STRUCTURE DEEP DIVE

### `/src/components/` - React Components

**AGPGenerator.jsx** (500+ lines)
- **Role:** Main application container
- **Responsibilities:**
  - Orchestrates all child components
  - Manages global state (csvData, dateRange, metrics, dayProfiles)
  - Handles file uploads
  - Coordinates hooks (useCSVData, useMetrics, useUploadStorage)
- **Does NOT:** Calculate metrics, parse CSV, detect events
- **Passes down:** All data as props to children
- **Key state:**
  ```javascript
  const [csvData, setCsvData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dayProfiles, setDayProfiles] = useState(null); // [NEW v2.2]
  ```

**DayProfileCard.jsx** [NEW v2.2] (~650 lines)
- **Role:** Single day glucose profile visualization
- **Responsibilities:**
  - Renders 24h glucose curve (SVG)
  - Adaptive Y-axis calculation (per day)
  - Event markers (hypo/hyper/sensor/cartridge)
  - TIR vertical bar
  - Achievement badges display
  - Metrics footer
- **Receives props:**
  ```javascript
  { 
    profile: {
      date, dayOfWeek, metrics, curve, events,
      sensorChanges, cartridgeChanges, badges, agpCurve
    }
  }
  ```
- **Sub-components:**
  - `GlucoseCurve24h` - SVG chart with adaptive Y-axis
  - `TIRBar` - Vertical percentage bar
  - `MetricBox` - Individual metric display

**DayProfilesModal.jsx** [NEW v2.2] (~150 lines)
- **Role:** Full-screen overlay for 7 day profiles
- **Responsibilities:**
  - Modal container with scroll
  - Close button
  - Print button (triggers HTML export)
  - Renders 7 × DayProfileCard
- **Styling:**
  - Fixed position overlay
  - Black background (92% opacity)
  - Scrollable content
  - Brutalist close/print buttons

**AGPChart.jsx** (~400 lines)
- **Role:** Main AGP curve with percentile bands
- **Responsibilities:**
  - Render 5th, 25th, 50th, 75th, 95th percentiles
  - Target zone (70-180 mg/dL)
  - Grid lines and axes
  - Event markers
  - Legend
- **Does NOT:** Calculate AGP data (receives from useMetrics)

**MetricsDisplay.jsx** (~200 lines)
- **Role:** TIR/TAR/TBR metrics grid
- **Responsibilities:**
  - 8 metric cards in grid layout
  - Tooltips on hover
  - Color-coded values
- **Metrics shown:** TIR, TAR, TBR, Mean±SD, CV, GMI, MAGE, MODD, GRI

**FileUpload.jsx** (~300 lines)
- **Role:** CSV and ProTime upload interface
- **Responsibilities:**
  - CSV file selection
  - ProTime import modal
  - Workday configuration
- **Triggers:** useCSVData hook on upload

**PatientInfo.jsx** (~150 lines)
- **Role:** Patient metadata modal
- **Responsibilities:**
  - Auto-fill from CSV header
  - Manual entry (DOB, physician, email)
  - Save to IndexedDB
- **Storage:** usePatientInfo hook

**SavedUploadsList.jsx** (~250 lines)
- **Role:** Manage saved uploads
- **Responsibilities:**
  - List all saved uploads
  - Load/Lock/Rename/Delete actions
  - Storage usage indicator
- **Storage:** useUploadStorage hook

---

### `/src/core/` - Business Logic (Pure JavaScript)

**metrics-engine.js** (~800 lines)
- **Role:** Core metrics calculations
- **Key Functions:**
  - `calculateMetrics(data, startDate, endDate)` → metrics object
  - `calculateAGP(data, startDate, endDate)` → percentile bands (288 bins)
  - `detectEvents(data, startDate, endDate)` → hypo/hyper events
  - `calculateCV(data)` → coefficient of variation
  - `calculateMAGE(data)` → mean amplitude of glycemic excursions
  - `calculateMODD(data)` → mean of daily differences
  - `calculateGRI(tir, hypoL2, hypoL1)` → glucose risk indicator
- **Pure functions:** No React, no side effects
- **Used by:** useMetrics hook

**day-profile-engine.js** [NEW v2.2] (~270 lines)
- **Role:** Individual day analysis
- **Key Functions:**
  - `getLastSevenDays(data, csvCreatedDate)` → array of 7 profiles
  - `getDayProfile(data, date)` → single day profile object
  - `generate24HourCurve(dayData)` → 288-bin curve
  - `detectSensorChanges(allData, targetDate)` → sensor changes
  - `detectCartridgeChanges(dayData)` → cartridge changes
  - `detectBadges(metrics, events)` → achievement badges
- **Pure functions:** No React
- **Used by:** AGPGenerator directly

**parsers.js** (~400 lines)
- **Role:** CSV parsing and data extraction
- **Key Functions:**
  - `parseCSV(csvText)` → array of row objects
  - `parseCSVMetadata(csvText)` → patient info from header
  - `detectDateRange(data)` → { minDate, maxDate }
  - `parseProTimeJSON(text)` → workdays array
- **Handles:** Semicolon delimiters, comma decimals, European format
- **Used by:** useCSVData hook

**html-exporter.js** (~950 lines)
- **Role:** Generate main AGP HTML report
- **Key Function:**
  - `generateHTML(options)` → complete HTML string
  - `downloadHTML(html, filename)` → trigger browser download
- **Includes:** Inline CSS, SVG charts, brutalist design, print optimization
- **Used by:** AGPGenerator export button

**day-profiles-exporter.js** [NEW v2.2] (~700 lines)
- **Role:** Generate day profiles HTML report
- **Key Function:**
  - `downloadDayProfilesHTML(dayProfiles, patientInfo)` → HTML + download
  - `generateDayCurveSVG(curve, events, ...)` → SVG for single day
  - `generateTIRBarSVG(metrics)` → vertical TIR bar with patterns
  - `generateDayCard(profile)` → HTML card for one day
- **Includes:** 2-page layout, legend, brutalist design
- **Used by:** DayProfilesModal print button

---

### `/src/hooks/` - State Management

**useCSVData.js** (~150 lines)
- **Role:** CSV file handling
- **Triggers:** On file upload
- **Calls:** parseCSV(), parseCSVMetadata(), detectDateRange()
- **Returns:** { csvData, dateRange, patientInfo, loading, error }
- **Side effects:** Saves patient info to IndexedDB

**useMetrics.js** (~200 lines)
- **Role:** Metrics calculation orchestration
- **Triggers:** When startDate or endDate changes
- **Calls:** calculateMetrics(), calculateAGP(), detectEvents()
- **Returns:** { metrics, agp, events, loading }
- **Memoized:** Expensive calculations cached with useMemo

**useUploadStorage.js** (~300 lines)
- **Role:** IndexedDB persistence for uploads
- **Provides:**
  - `saveUpload(name, csvData, workdays)` → save to DB
  - `loadUpload(id)` → restore data
  - `listUploads()` → get all saved uploads
  - `deleteUpload(id)` → remove from DB
  - `renameUpload(id, newName)` → update name
  - `toggleLock(id)` → lock/unlock
- **Storage:** IndexedDB (`agpUploadsDB`)

**usePatientInfo.js** (~100 lines)
- **Role:** Patient metadata management
- **Provides:**
  - `patientInfo` state
  - `updatePatientInfo(field, value)` → update + save
  - `loadPatientInfo()` → restore from DB
- **Storage:** IndexedDB (`patientInfoDB`)

**useDayProfiles.js** (~94 lines) **[NEW v2.2.1]**
- **Role:** Individual day profile generation
- **Triggers:** When csvData or dateRange changes
- **Calls:** day-profile-engine.js (getLastSevenDays)
- **Returns:** Array of 7 day profile objects, or null
- **Includes:**
  - Per-day metrics (TIR, TAR, TBR, mean, SD, CV, GMI)
  - 24h glucose curves (288 5-minute bins)
  - Event detection (hypo L1/L2, hyper)
  - Sensor/cartridge change markers
  - Achievement badges
  - AGP overlay data for comparison
- **Architecture:** Extracted from AGPGenerator component (v2.2.1)
- **Purpose:** Separates business logic from UI orchestration

---

### `/src/storage/` - IndexedDB Helpers

**uploadStorage.js** (~200 lines)
- Low-level IndexedDB operations for uploads
- CRUD functions (create, read, update, delete)
- Used by useUploadStorage hook

**patientStorage.js** (~150 lines)
- Low-level IndexedDB operations for patient info
- Single record database (one patient profile)
- Used by usePatientInfo hook

---

## COMPONENT RESPONSIBILITIES MATRIX

| Component | Data Processing | State Management | Presentation | User Interaction |
|-----------|----------------|------------------|--------------|------------------|
| AGPGenerator | ❌ No | ✅ Global state | ❌ No | ✅ File upload, period selection |
| DayProfileCard | ❌ No (receives props) | ❌ No | ✅ SVG rendering | ❌ No |
| DayProfilesModal | ❌ No | ✅ Modal open/close | ✅ Layout | ✅ Close, Print |
| AGPChart | ❌ No | ❌ No | ✅ SVG rendering | ❌ No |
| MetricsDisplay | ❌ No | ❌ No | ✅ Metric cards | ✅ Tooltips |
| FileUpload | ❌ No | ❌ No | ✅ Upload UI | ✅ File selection |

| Hook | Triggers | Calls | Returns | Side Effects |
|------|----------|-------|---------|--------------|
| useCSVData | File upload | parsers.js | csvData, dateRange | Save patient info |
| useMetrics | Date change | metrics-engine.js | metrics, agp, events | None |
| useDayProfiles | Data change | day-profile-engine.js | Array of 7 profiles | None |
| useUploadStorage | User action | uploadStorage.js | CRUD functions | IndexedDB writes |
| usePatientInfo | User input | patientStorage.js | patientInfo + update fn | IndexedDB writes |

| Engine | Input | Output | Side Effects |
|--------|-------|--------|--------------|
| metrics-engine.js | csvData + dates | metrics, agp, events | None (pure) |
| day-profile-engine.js | csvData + date | day profile object | None (pure) |
| parsers.js | CSV text | structured data | None (pure) |
| html-exporter.js | metrics + agp | HTML string | None (pure) |
| day-profiles-exporter.js | day profiles | HTML string + download | Browser download |

---

## DATA PROCESSING SEPARATION

### ✅ CORRECT Pattern

```javascript
// AGPGenerator.jsx
function AGPGenerator() {
  const { csvData } = useCSVData();           // Hook handles parsing
  const { metrics, agp, events } = useMetrics(csvData, startDate, endDate);  // Hook calculates
  
  return (
    <div>
      <MetricsDisplay metrics={metrics} />     {/* Just displays */}
      <AGPChart agp={agp} events={events} />   {/* Just displays */}
    </div>
  );
}
```

### ❌ WRONG Pattern

```javascript
// DON'T DO THIS
function AGPGenerator() {
  const [csvData, setCsvData] = useState(null);
  
  // ❌ AGPGenerator should NOT calculate metrics
  const tir = calculateTIR(csvData);
  const agp = calculateAGP(csvData);
  
  return <MetricsDisplay tir={tir} agp={agp} />;
}

// OR THIS
function MetricsDisplay({ csvData }) {
  // ❌ Component should NOT calculate, only display
  const metrics = calculateMetrics(csvData);
  return <div>{metrics.tir}</div>;
}
```

### ✅ Golden Rule

**Components RECEIVE → Engines CALCULATE → Hooks ORCHESTRATE**

```
CSV Upload
    ↓
useCSVData (calls parsers.js)
    ↓
AGPGenerator (stores csvData in state)
    ↓
useMetrics (calls metrics-engine.js)
    ↓
AGPGenerator (stores metrics in state)
    ↓
MetricsDisplay (receives metrics as props, renders UI)
```

---

## TESTING CHECKLIST

### Critical Features to Verify

**1. CSV Upload & Parsing**
- [ ] Valid CareLink CSV uploads successfully
- [ ] Date range detected correctly
- [ ] Patient metadata auto-filled
- [ ] Large files (>5MB) process without lag

**2. Day Profiles [NEW v2.2]**
- [ ] "Bekijk dagprofielen" button appears when ≥7 days
- [ ] Modal shows last 7 complete days
- [ ] Each day card renders correctly
- [ ] Adaptive Y-axis zooms appropriately
- [ ] Event markers appear at correct times
- [ ] Sensor change (red dashed) shows when sensor stops
- [ ] Cartridge change (orange dotted) shows at Rewind
- [ ] Achievement badges display for qualifying days
- [ ] Print button generates HTML
- [ ] HTML export has correct legend

**3. Adaptive Y-Axis**
- [ ] Tight control day (65-130): Y-axis zooms in
- [ ] Variable day (40-300): Y-axis shows full range
- [ ] Always includes 70 & 180 if in range
- [ ] Ticks are nicely spaced (20/25/40/50 steps)
- [ ] No tick conflicts near critical thresholds

**4. Event Detection**
- [ ] Hypo L2 (<54, ≥15min) detected correctly
- [ ] Hypo L1 (54-70, ≥15min) detected correctly
- [ ] Hyper (>250, ≥120min) detected correctly
- [ ] Sensor changes marked (2-10 hour gaps)
- [ ] Cartridge changes marked (Rewind events)

**5. Achievement Badges**
- [ ] Perfect Day: TIR ≥99%
- [ ] Zen Master: TIR ≥98%, CV <30%, 0 hypos
- [ ] You Slay Queen: TIR ≥95%, CV <36%, 0 hypos
- [ ] Badges appear in header
- [ ] Hover shows description

**6. HTML Export (Day Profiles)**
- [ ] 2-page layout (3-4 days per page)
- [ ] Legend on last page
- [ ] Patient info in header
- [ ] All curves render correctly
- [ ] Print preview looks good (B/W)
- [ ] File downloads with correct name

---

## KNOWN LIMITATIONS

### What AGP+ CANNOT Do

**1. Total Daily Dose (TDD)**
- ❌ CSV only has programmed basal pattern
- ❌ SmartGuard auto-basal NOT in CSV (-26% to -1% missing)
- ✅ Solution: Use Medtronic PDF reports for TDD

**2. Basal Insulin Analysis**
- ❌ Auto-basal delivery data unavailable
- ❌ Cannot analyze basal patterns accurately

**3. Bolus Type Distinction**
- ❌ CSV doesn't distinguish normal/square/dual wave
- ✅ Only total volume available

**4. Real-Time Data**
- ❌ Requires manual CSV export from CareLink
- ❌ No API integration with Medtronic

**5. Historical Comparison**
- ❌ No automatic period-over-period analysis
- ✅ Manual comparison available via ComparisonView

### CSV Format Quirks

**Issues:**
- Delimiter is semicolon (`;`) not comma
- Decimals use comma (`,`) not period (European format)
- First 6 rows are metadata, data starts row 8
- Basal Rate column is UNRELIABLE (programmed pattern only)

**Workarounds:**
- Parser handles all format quirks automatically
- Metadata extraction from header rows
- Basal calculations avoided

---

## DEVELOPMENT WORKFLOW

### Making Changes

**1. Identify the right file:**
```
UI change → Component (src/components/)
Logic change → Engine (src/core/)
State change → Hook (src/hooks/)
```

**2. Read relevant code:**
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/DayProfileCard.jsx
```

**3. Make surgical edits:**
```bash
DC: edit_block file_path="..." old_string="..." new_string="..."
```

**4. Test in browser:**
- Dev server auto-reloads (http://localhost:5173)
- Check browser console for errors
- Add debug logging if needed

**5. Clean up:**
- Remove console.log() statements
- Verify print export still works

### Adding a New Feature

**Example: Add "Weekly Summary" card**

1. **Plan architecture:**
   - Engine function: `calculateWeeklySummary(data)` in `metrics-engine.js`
   - Hook: Use existing `useMetrics` or create `useWeeklySummary`
   - Component: New `WeeklySummaryCard.jsx`
   - Integration: Add to `AGPGenerator.jsx`

2. **Implement bottom-up:**
   - Start with engine (pure function, easy to test)
   - Add hook (orchestration)
   - Build component (presentation)
   - Wire into AGPGenerator

3. **Follow patterns:**
   - Use brutalist design (3px borders, monospace)
   - Keep components pure (no calculations)
   - Add tooltips for clinical context

---

## DEBUGGING GUIDE

### Console Logging Strategy

```javascript
// AGPGenerator.jsx
console.log('[AGPGenerator] csvData:', csvData?.length, 'rows');
console.log('[AGPGenerator] dateRange:', startDate, '→', endDate);
console.log('[AGPGenerator] dayProfiles:', dayProfiles?.length, 'days');

// DayProfileCard.jsx
console.log(`[DayProfileCard] ${date}: rendering`, { 
  readingCount, 
  events: events.hypoL2.count + events.hypoL1.count,
  badges: badges.length 
});

// metrics-engine.js
console.log('[calculateMetrics] TIR:', tir, 'TAR:', tar, 'TBR:', tbr);
```

### Common Issues & Solutions

**Problem:** "Day profiles not showing"
```
1. Check console for [getDayProfile] logs
2. Verify csvCreatedDate is correct
3. Check if 7 complete days exist before cutoff
4. Verify readingsPerDay[date] >= 200
```

**Problem:** "Y-axis looks weird"
```
1. Check glucose data range in console
2. Verify calculateDynamicYRange() logic
3. Check for outliers (>400 or <40)
4. Verify yMin/yMax calculations
```

**Problem:** "Events not detected"
```
1. Check threshold values (54, 70, 180, 250)
2. Verify duration calculations (minutes)
3. Check for data gaps during events
4. Add logging to detectEvents()
```

**Problem:** "Sensor changes not marked"
```
1. Check for gaps > 30 minutes
2. Verify gap is 2-10 hours
3. Check type === 'start' filter
4. Verify minuteOfDay calculation
```

### Desktop Commander Debugging

```bash
# Search for function definition
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus" 
                 pattern="calculateTIR" searchType="content"

# Check what's running
DC: list_sessions
DC: list_processes

# Read component with line numbers
DC: read_file path="..." offset=200 length=50
```

---

## FUTURE ROADMAP (v3.0 Ideas)

**Incremental Storage Architecture:**
- Master dataset storage (cumulative)
- Append new uploads to existing data
- Historical trend analysis
- Automatic period comparisons

**Enhanced Analytics:**
- Pattern detection (dawn phenomenon, post-meal spikes)
- Meal response analysis
- Exercise correlation
- Stress impact tracking

**Export Improvements:**
- PDF generation (not just HTML)
- Custom report templates
- Multi-language support
- Sharing via secure links

**Integration:**
- Direct CareLink API (if available)
- Nightscout compatibility
- Dexcom Clarity import

---

## HOUSEKEEPING NOTES (Oct 24, 2025)

**Files to clean up:**
- Old handoff prompts (keep only v2.2.0)
- Deprecated components (check for unused .jsx files)
- Console.log() statements (remove debug logs)

**GitHub sync:**
- Commit all v2.2.0 changes
- Tag release: `v2.2.0-day-profiles`
- Update README with new features
- Add screenshots of day profiles

**Documentation updates:**
- ✅ HANDOFF_PROMPT_V2_2_0.md
- ✅ PROJECT_BRIEFING_V2_2_0 (Part 1 & 2)
- ⏳ MASTER_INDEX_V2_2_0.md
- ⏳ DESIGN_SYSTEM (check if needs version bump)

---

END OF PART 2

**Next:** Read MASTER_INDEX for quick reference guide.
