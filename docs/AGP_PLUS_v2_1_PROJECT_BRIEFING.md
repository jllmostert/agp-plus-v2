# AGP+ v2.1 - Project Briefing (Complete)

**Version:** 2.1.0  
**Status:** Production Ready - Modular Architecture  
**Last Updated:** October 22, 2025  
**Device:** Medtronic MiniMed 780G + Guardian Sensor 4  
**Data Source:** CareLink CSV Export  
**Tech Stack:** React 18 + Vite + Tailwind CSS

---

## EXECUTIVE SUMMARY

AGP+ v2.1 is a complete architectural redesign with full component modularity, custom hooks, and production-grade code structure. The tool generates clinical-grade Ambulatory Glucose Profile analysis from Medtronic 780G CGM data following ADA/ATTD 2019 guidelines.

**Mission:** Provide reliable, evidence-based glucose analytics from CareLink CSV exports with honest limitationsâ€”only calculating metrics we can trust.

**Key Principle:** *Honesty over features.* We don't calculate Total Daily Dose (TDD) or basal patterns because CareLink CSV exports are fundamentally unreliable for this data. See [Critical Limitations](#critical-limitations) for details.

---

## WHAT'S NEW IN v2.1

### Architecture Overhaul
- âœ… **Full component modularity** - 8 separate UI components (no monolith)
- âœ… **Custom hooks** - Business logic separated from UI (useCSVData, useMetrics, useComparison)
- âœ… **Core modules** - Calculation engine extracted to separate files
- âœ… **Production structure** - src/components/, src/hooks/, src/core/
- âœ… **Build system** - Vite with proper module bundling

### Enhanced Features
- âœ… **Auto-comparison** - Automatically triggers for preset periods (14/30/90 days)
- âœ… **Day/Night toggle** - Enable/disable 06:00-00:00 vs 00:00-06:00 split
- âœ… **Collapsible UI** - Clean, organized sections (was single-page monolith)
- âœ… **ProTime modal** - Dual-tab import (PDF text + JSON file upload)
- âœ… **Empty states** - Helpful onboarding messages
- âœ… **Error handling** - Clear, dismissible error messages

### Clinical Additions
- âœ… **6-metric comparison** - TIR, MeanÂ±SD, CV, GMI, MAGE, MODD with deltas
- âœ… **Automatic insights** - Day/night split shows actionable recommendations
- âœ… **Event markers** - Visual indicators on AGP curve (hypo L1/L2, hyper)
- âœ… **Overall assessment** - Summary of improvements/deteriorations

---

## ARCHITECTURE

### Module Structure

```
agp-plus/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/          # 8 UI components
â”‚   â”‚   â”œâ”€â”€ AGPGenerator.jsx        Main orchestrator (420 lines)
â”‚   â”‚   â”œâ”€â”€ FileUpload.jsx          CSV/ProTime upload UI (330 lines)
â”‚   â”‚   â”œâ”€â”€ PeriodSelector.jsx      Date range picker (250 lines)
â”‚   â”‚   â”œâ”€â”€ MetricsDisplay.jsx      4-column metrics grid (290 lines)
â”‚   â”‚   â”œâ”€â”€ AGPChart.jsx            SVG visualization (450 lines)
â”‚   â”‚   â”œâ”€â”€ ComparisonView.jsx      Period comparison (280 lines)
â”‚   â”‚   â”œâ”€â”€ DayNightSplit.jsx       Day/night analysis (290 lines)
â”‚   â”‚   â””â”€â”€ WorkdaySplit.jsx        Workday comparison (310 lines)
â”‚   â”‚
â”‚   â”œâ”€â”€ hooks/               # 3 custom hooks
â”‚   â”‚   â”œâ”€â”€ useCSVData.js           CSV parsing & state (70 lines)
â”‚   â”‚   â”œâ”€â”€ useMetrics.js           Memoized calculations (85 lines)
â”‚   â”‚   â””â”€â”€ useComparison.js        Auto-comparison logic (110 lines)
â”‚   â”‚
â”‚   â”œâ”€â”€ core/                # 3 calculation modules
â”‚   â”‚   â”œâ”€â”€ metrics-engine.js       Clinical calculations (600+ lines)
â”‚   â”‚   â”œâ”€â”€ parsers.js              CSV/ProTime parsing (200 lines)
â”‚   â”‚   â””â”€â”€ html-exporter.js        Report generation (700 lines)
â”‚   â”‚
â”‚   â”œâ”€â”€ styles/
â”‚   â”‚   â””â”€â”€ globals.css             Dark theme + Tailwind
â”‚   â”‚
â”‚   â””â”€â”€ main.jsx                    React entry point
â”‚
â”œâ”€â”€ package.json             # Dependencies (React 18, Vite, lucide-react)
â”œâ”€â”€ vite.config.js           # Build configuration
â””â”€â”€ index.html               # Entry HTML

Total: ~3,500 lines production code
```

### Component Hierarchy

```
AGPGenerator (main container)
â”œâ”€â”€ FileUpload
â”‚   â”œâ”€â”€ CSVUploadButton
â”‚   â”œâ”€â”€ ProTimeButton
â”‚   â””â”€â”€ ProTimeModal
â”‚       â”œâ”€â”€ PDFTextTab
â”‚       â””â”€â”€ JSONFileTab
â”œâ”€â”€ PeriodSelector
â”‚   â”œâ”€â”€ PresetButtons
â”‚   â””â”€â”€ CustomDateInputs
â”œâ”€â”€ MetricsDisplay
â”‚   â””â”€â”€ MetricCard (Ã—8)
â”œâ”€â”€ AGPChart
â”‚   â”œâ”€â”€ GridLines
â”‚   â”œâ”€â”€ TargetLines
â”‚   â”œâ”€â”€ AGP Bands (p5-95, p25-75)
â”‚   â”œâ”€â”€ Median Line
â”‚   â”œâ”€â”€ EventMarkers
â”‚   â”œâ”€â”€ XAxis / YAxis
â”‚   â””â”€â”€ ChartLegend
â”œâ”€â”€ ComparisonView
â”‚   â”œâ”€â”€ ComparisonCard (Ã—6)
â”‚   â””â”€â”€ OverallAssessment
â”œâ”€â”€ DayNightSplit
â”‚   â”œâ”€â”€ DayNightCard (Ã—2)
â”‚   â””â”€â”€ DayNightInsights
â””â”€â”€ WorkdaySplit
    â”œâ”€â”€ WorkdayCard (Ã—2)
    â””â”€â”€ ExportButton
```

### Data Flow

```
1. User uploads CSV
   â†“
2. useCSVData hook â†’ parseCSV() â†’ csvData + dateRange
   â†“
3. User selects period (startDate, endDate)
   â†“
4. useMetrics hook â†’ calculateMetrics(), calculateAGP(), detectEvents()
   â†“
5. useComparison hook â†’ auto-calculates previous period (if preset)
   â†“
6. AGPGenerator composes all components with calculated data
   â†“
7. UI renders with:
   - MetricsDisplay (metrics)
   - AGPChart (agp, events, comparison)
   - ComparisonView (current vs previous)
   - DayNightSplit (day vs night)
   - WorkdaySplit (workdays vs restdays)
```

---

## INPUT DATA

### Medtronic CareLink CSV

**Export path:** CareLink Personal â†’ Export Data â†’ CSV

**Format quirks:**
- **Delimiter:** Semicolon (`;`) not comma
- **Decimals:** Comma (`,`) not period (European format)
- **Header:** First 6 rows are metadata (skip these)
- **Column names:** Row 7
- **Data:** Row 8 onwards

**Column usage:**

| Column | Index | Type | Reliability | Purpose |
|--------|-------|------|-------------|---------|
| Date | 1 | YYYY/MM/DD | âœ… 100% | Timestamps |
| Time | 2 | HH:MM:SS | âœ… 100% | Timestamps |
| Sensor Glucose (mg/dL) | 34 | Float | âœ… 100% | AGP, TIR/TAR/TBR |
| Bolus Volume Delivered (U) | 20 | Float | âœ… 100% | Insulin metrics |
| BWZ Carb Ratio (g/U) | 22 | Float | âœ… 100% | Carb ratio |
| BG Reading (mg/dL) | 18 | Float | âœ… 100% | Fingersticks |
| BWZ Carb Input | 27 | Float | âœ… 100% | Carb counting |
| **Basal Rate (U/h)** | 7 | Float | âš ï¸ **UNRELIABLE** | See limitation |

**THE BASAL RATE TRAP:**

The `Basal Rate` column contains **only the programmed fallback pattern**, NOT the SmartGuard auto-adjustments that actually deliver insulin. The difference can be -26% to -1% from actual delivery.

**This makes TDD calculations from CSV fundamentally unreliable.**

**Solution:** Use Medtronic PDF reports for TDD (Reports â†’ Therapy Management Dashboard contains actual pump memory data).

### ProTime Import (Optional)

For workday vs rest day analysis. Accepts:

1. **ProTime PDF text** (copy-paste):
```
Week 40 2024
ma 30/09  7:33  14:46
di 01/10  7:30  14:50
wo 02/10  7:28  14:52
```

2. **JSON array**: 
```json
["2024-10-01", "2024-10-02", "2024-10-03"]
```

3. **JSON object**: 
```json
{
  "2024-10-01": true,
  "2024-10-02": true
}
```

Parser auto-detects format. Dutch day abbreviations (ma/di/wo/do/vr/za/zo).

---

## METRICS CALCULATED

### Core Metrics (ADA/ATTD 2019)

**Time in Ranges:**
- **TIR (70-180 mg/dL):** Target â‰¥70%
- **TAR (>180 mg/dL):** Target â‰¤25%
  - Level 1: 180-250 mg/dL
  - Level 2: >250 mg/dL
- **TBR (<70 mg/dL):** Target <4%
  - Level 1: 54-70 mg/dL
  - Level 2: <54 mg/dL (critical)

**Variability:**
- **Mean Â± SD:** Average glucose with standard deviation
- **CV (%):** Coefficient of variation, target â‰¤36%
  - Formula: `(SD / Mean) Ã— 100`
  - Normalized measure independent of mean level

**Estimated A1c:**
- **GMI (%):** Glucose Management Indicator
  - Formula: `3.31 + (0.02392 Ã— Mean)`
  - Correlation with lab A1c: r=0.92
  - Target: <7.0%

### Advanced Metrics

**MAGE (Mean Amplitude of Glycemic Excursions):**
- Measures large within-day glucose swings (>1 SD from mean)
- Method: Service & Nelson (1970) - per-day calculation
- Target: <60 mg/dL (excellent), <100 mg/dL (acceptable)
- High MAGE â†’ check meal timing, ISF, carb counting

**MODD (Mean of Daily Differences):**
- Measures day-to-day reproducibility at same time-of-day
- Method: Molnar et al. (1972) - binned calculation with TypedArrays
- Target: <40 mg/dL (excellent), <60 mg/dL (acceptable)
- High MODD â†’ lifestyle inconsistency (meals, sleep, activity)

### Additional Metrics

- **Readings Count:** Total CGM data points
- **Min/Max:** Lowest/highest glucose values
- **Median:** 50th percentile (more robust than mean)
- **Q1/Q3:** 25th and 75th percentiles
- **IQR:** Interquartile range (Q3 - Q1)

---

## FEATURES

### 1. Period Selection

**Presets:**
- **14 days** - Minimum recommended, enables auto-comparison
- **30 days** - Standard monthly analysis, enables auto-comparison
- **90 days** - Quarterly review, enables auto-comparison
- **Custom** - Manual date entry (any range within CSV data)

**Behavior:**
- Presets auto-set end date to latest data
- Custom allows any start/end within available range
- Minimum 7 days recommended for reliable AGP percentiles

### 2. Automatic Comparison

**Triggers when:**
- User selects 14, 30, or 90-day preset
- Sufficient historical data exists (previous period of equal length)

**Compares:**
- 6 core metrics: TIR, MeanÂ±SD, CV, GMI, MAGE, MODD
- Shows deltas with color coding:
  - ðŸŸ¢ Green: Improvement (TIR up, CV down, etc.)
  - ðŸ”´ Red: Deterioration (TIR down, CV up, etc.)
  - âšª Grey: No significant change (<0.5 difference)

**Calculation:**
- Current period: User-selected dates
- Previous period: Equal-length period immediately before current
- Example: Select Oct 1-30 â†’ Compares to Sep 1-30

**Overall Assessment:**
- "Overall improvement: 4 metrics improved, 2 declined"
- "Mixed results: 3 improved, 3 declined"
- "Stable control: 2 improved, 2 declined, 2 unchanged"

### 3. Day/Night Split

**Time ranges:**
- **Day:** 06:00 - 00:00 (18 hours)
- **Night:** 00:00 - 06:00 (6 hours)

**Toggle control:**
- Default: Disabled (collapsed)
- User clicks "Disabled" â†’ Enables analysis
- Saves screen space when not needed

**Displays:**
- Side-by-side cards (Day: blue theme, Night: indigo theme)
- Metrics: TIR, TAR, TBR, MeanÂ±SD, CV, Min, Max, Readings
- Delta between day and night (color-coded)

**Automatic Insights:**
- TIR difference >5% â†’ Suggests timing adjustments
- Night TBR >4% â†’ Warns about nocturnal hypoglycemia
- Night TAR >25% â†’ Suggests basal review
- CV difference >5% â†’ Identifies variability patterns

Example insights:
- "Time in Range is 5.3% higher during nighttime â†’ Consider adjusting daytime insulin"
- "Nighttime TBR is 6.2% (target: <4%) â†’ Consider reducing nighttime basal rates"

### 4. Workday Split

**Requires:** ProTime import (PDF text or JSON)

**Displays:**
- Workday metrics (blue card)
- Rest day metrics (green card)
- Delta between types
- Workday dates included in analysis

**Metrics shown:**
- TIR, TAR, TBR, MeanÂ±SD, CV for each type
- Delta (workday - restday) with color coding

**Export capability:**
- Download workdays as JSON for reuse
- Filename: `protime_workdays_YYYYMMDD_HHMMSS.json`

### 5. AGP Visualization

**Chart elements:**
- **Percentile bands:**
  - 5th-95th percentile (light blue, 20% opacity)
  - 25th-75th percentile (darker blue, 30% opacity)
- **Median line:** 50th percentile (solid blue, 2.5px)
- **Comparison overlay:** Previous period median (dashed grey, optional)
- **Target lines:**
  - 70 mg/dL (yellow, solid) - Low threshold
  - 180 mg/dL (yellow, solid) - High threshold
  - 54 mg/dL (red, dashed) - Critical low
  - 250 mg/dL (red, dashed) - Critical high

**Event markers:**
- **Hypo L2** (<54 mg/dL): Red circles at bottom
- **Hypo L1** (54-70 mg/dL): Orange circles at bottom
- **Hyperglycemia** (>250 mg/dL): Red circles at top

**Axes:**
- X-axis: Time (00:00 - 24:00), 3-hour intervals
- Y-axis: Glucose (0-400 mg/dL), labeled at key thresholds

**Legend:**
- Explains percentile bands, median, comparison, events
- Dynamically adjusts based on data available

### 6. HTML Export (Future)

**Format:**
- A4 portrait, print-optimized black/white
- Inline SVG (no external dependencies)
- Single file portability

**Filename:** `AGP_YYYY-MM-DD_tot_YYYY-MM-DD_timestamp.html`

**Workflow:** Download â†’ Open in browser â†’ Print to PDF

---

## CRITICAL LIMITATIONS

### What This Tool CANNOT Do

**1. Total Daily Dose (TDD):**
- âŒ CareLink CSV exports only programmed basal pattern
- âŒ SmartGuard auto-basal adjustments NOT included in CSV
- âŒ Difference: -26% to -1% from actual delivery
- âœ… **Solution:** Use Medtronic PDF reports (Therapy Management Dashboard)

**2. Basal Insulin Analysis:**
- âŒ Auto-basal delivery data unavailable in CSV
- âŒ Cannot analyze basal patterns or trends
- âŒ Cannot calculate insulin-on-board (IOB)
- âœ… **Solution:** Use pump screen or Medtronic reports

**3. Bolus Type Distinction:**
- âŒ Normal/square/dual wave indistinguishable in CSV
- âŒ Only total delivered volume available
- âŒ Extended bolus timing not recorded

**4. Real-time Sensor Data:**
- âŒ CSV is historical data only (export after the fact)
- âŒ No alerts, no live glucose monitoring
- âœ… **Solution:** Use CareLink Connect app for real-time

**Why we're upfront:** Trust in data quality matters more than feature bloat. If the CSV doesn't have reliable data, we don't calculate it.

---

## DATA QUALITY REQUIREMENTS

**Minimum for reliable metrics:**
- **7 days** of data (14 days recommended)
- **70% sensor coverage** (~200 readings/day @ 5-min intervals)
- **For comparison:** 28+ days total (current + previous period)

**Coverage calculation:**
```javascript
const maxReadings = days Ã— 288;  // 288 = 5-min bins per day
const coverage = (actualReadings / maxReadings) Ã— 100;
```

**Warnings displayed:**
- <7 days: "Warning: Less than 7 days of data - AGP percentiles may be unreliable"
- <70% coverage: "Warning: Low sensor coverage (X%) - metrics may not be representative"
- No comparison data: "Previous period has insufficient data - comparison unavailable"

---

## ALGORITHM DETAILS

### AGP Curve Construction

**Method:**
1. Create 288 bins (5-minute resolution: 1440 min Ã· 5 = 288)
2. For each glucose reading, assign to bin based on time-of-day
3. For each bin, calculate percentiles across all days: p5, p25, p50, p75, p95
4. Generate SVG paths from percentile arrays

**Binning formula:**
```javascript
const minuteOfDay = hour Ã— 60 + minute;
const bin = Math.floor(minuteOfDay / 5);  // 0-287
```

**Percentile calculation:**
```javascript
// Sort all values for this time-of-day across all days
values.sort((a, b) => a - b);

// Calculate percentile indices
const p5 = values[Math.floor(values.length Ã— 0.05)];
const p25 = values[Math.floor(values.length Ã— 0.25)];
const p50 = values[Math.floor(values.length Ã— 0.50)];  // Median
const p75 = values[Math.floor(values.length Ã— 0.75)];
const p95 = values[Math.floor(values.length Ã— 0.95)];
```

### MAGE Calculation (Service & Nelson, 1970)

**Per-day method:**
1. For each day:
   a. Identify local extrema (peaks and valleys)
   b. Filter significant extrema: `|extremum - dayMean| > 1 SD`
   c. Calculate amplitudes between consecutive significant extrema
   d. Average amplitudes for the day
2. MAGE = mean of all daily MAGE values

**Why per-day:** More accurate than global method, handles multi-day periods better

### MODD Calculation (Molnar et al., 1972)

**Binned method with TypedArrays (optimized):**
1. Create Float32Array for each 5-minute bin (288 bins)
2. For each day, store glucose values in corresponding bin arrays
3. For each bin, calculate absolute differences between consecutive days
4. MODD = mean of all day-to-day differences across all bins

**Optimization:** TypedArrays reduce memory usage and speed up calculations for large datasets

### Event Detection

**Hypoglycemia Level 2 (Critical):**
- Threshold: <54 mg/dL
- Duration: â‰¥15 minutes consecutive

**Hypoglycemia Level 1 (Warning):**
- Threshold: <70 mg/dL
- Duration: â‰¥15 minutes consecutive
- Exclude if already in Level 2

**Hyperglycemia:**
- Threshold: >180 mg/dL
- Duration: â‰¥120 minutes consecutive (2 hours)

**Event properties:**
```javascript
{
  startTime: Date,
  endTime: Date,
  duration: number,     // minutes
  minGlucose: number,   // mg/dL (for hypo)
  maxGlucose: number,   // mg/dL (for hyper)
  minuteOfDay: number   // for AGP chart markers
}
```

---

## CSV PARSING DETAILS

### File Structure

**Typical file:**
- 3 months data: ~11,000-13,000 rows
- 1 month data: ~3,600-4,300 rows
- File size: 2-4 MB

**Header structure:**
```
Row 1: Export metadata
Row 2: Device info
Row 3: Serial number
Row 4: Software version
Row 5: Date range
Row 6: Settings
Row 7: Column names (actual data starts here)
Row 8+: Data rows
```

### Column Mapping (0-indexed)

| Column | Index | Format | Example |
|--------|-------|--------|---------|
| Date | 1 | YYYY/MM/DD | 2025/10/05 |
| Time | 2 | HH:MM:SS | 14:30:00 |
| Basal Rate | 7 | Float | 0,85 |
| BG Reading | 18 | Float | 142,0 |
| Bolus Delivered | 20 | Float | 4,2 |
| BWZ Carb Ratio | 22 | Float | 12,0 |
| BWZ Carb Input | 27 | Float | 50,0 |
| Sensor Glucose | 34 | Float | 138,0 |

### Parsing Logic

```javascript
// Skip metadata (first 6 lines)
const lines = csvText.split('\n').slice(6);

lines.forEach(line => {
  const parts = line.split(';');
  
  // Handle European decimal format
  const glucose = parseFloat(parts[34].replace(',', '.'));
  
  if (!isNaN(glucose)) {
    data.push({
      date: parts[1],           // YYYY/MM/DD
      time: parts[2],           // HH:MM:SS
      glucose: glucose,         // mg/dL
      bolus: parseFloat(parts[20]?.replace(',', '.') || 0),
      bg: parseFloat(parts[18]?.replace(',', '.') || null),
      carbs: parseFloat(parts[27]?.replace(',', '.') || 0)
    });
  }
});
```

---

## TECHNICAL STACK

### Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.2.1"
  }
}
```

**Why minimal dependencies:**
- React 18: Modern hooks, concurrent features
- lucide-react: Lightweight icons (only needed icons bundled)
- Vite: Fast dev server, optimized production builds
- No chart libraries: Custom SVG for full control
- No state management: React hooks sufficient
- No UI frameworks: Tailwind utility classes only

---

## DESIGN SYSTEM

### Design Philosophy

**"USSR Aesthetic with Professional Medical UI"**

**Core principles:**
1. **Dark base** - Neutral grays with accent colors
2. **Bold typography** - Clear hierarchy, readable metrics
3. **Functional color** - Colors have meaning (green=good, red=warning)
4. **Print-first HTML** - Black/white, minimal ink usage
5. **Monospace where it matters** - Courier for exported reports

### Color Palette

**Base Colors (React UI):**
```css
Background: bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900
Cards: bg-neutral-800 with border-neutral-700
Headers: bg-gradient-to-r from-red-900 to-red-800
Text: text-white (primary), text-neutral-400 (secondary)
Borders: border-neutral-700 (standard), border-neutral-600 (prominent)
```

**Accent Colors (Functional):**
```css
/* Status Indicators */
Success/Good: bg-green-700, text-green-300
Warning: bg-yellow-700, text-yellow-300
Error/Critical: bg-red-700, text-red-300
Info: bg-blue-700, text-blue-300

/* Metric Cards (Gradients) */
TIR: from-green-900 to-green-800
Mean: from-blue-900 to-blue-800
CV: from-purple-900 to-purple-800
GMI: from-orange-900 to-orange-800

/* Time-in-Range Bar */
TBR (low): bg-red-600
TIR (target): bg-green-600
TAR (high): bg-yellow-600
```

**Toggle States:**
```css
Active: bg-red-600 or bg-blue-600
Inactive: bg-neutral-600
Toggle handle: bg-white
```

**Print Colors (HTML Export):**
```css
Background: #fff (white)
Text: #000 (black)
Borders: 2px solid #000
Grays: #ccc, #ddd, #aaa (for AGP bands)
TIR Bar: Black (#000), Gray (#ddd), Striped pattern for TBR
```

### Typography

**React UI (Tailwind):**
```css
Headings:
- h1: text-3xl font-bold (AGP+ Generator v2.1)
- h2: text-xl font-bold (Section headers)
- h3: text-lg font-bold (Subsections)

Body text:
- Default: text-sm (14px)
- Labels: text-xs (12px)
- Metrics values: text-3xl font-bold (48px)
- Metric subtitles: text-xs

Font family: System default (Tailwind sans-serif stack)
```

**HTML Export (Print):**
```css
Font family: "Courier New", "Courier", monospace
Body: 10pt
h1: 18pt font-bold
h2: 13pt font-bold
Metrics values: 20pt font-bold
Labels: 8pt font-bold
Details: 9pt
Footer: 7pt
```

### Spacing & Layout

**Grid System:**
```css
/* 4-column metrics grid */
.metrics-grid: grid-cols-4 gap-4

/* 2-column details */
.details-grid: grid-cols-2 gap-4

/* 2-column splits (day/night, workday/rest) */
.split-grid: grid-cols-2 gap-4

/* 3-column comparison */
.comparison-grid: grid-cols-3 gap-3
```

**Padding/Spacing:**
```css
/* React UI */
Container: p-6 (24px)
Cards: p-4 or p-6 (16-24px)
Sections: space-y-6 (24px between sections)
Card gap: gap-4 (16px)

/* HTML Export */
Body: padding: 8mm
Sections: margin-bottom: 5mm
Card padding: 2mm
Grid gap: 3mm
```

**Responsive:**
- Mobile-first approach
- Grid collapses to single column on mobile
- Full width up to max-w-7xl (1280px)

### Component Patterns

**Card Structure:**
```jsx
<div className="bg-neutral-800 rounded-xl p-6 shadow-xl border border-neutral-700">
  <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
  {children}
</div>
```

**Metric Card:**
```jsx
<div className="bg-gradient-to-br from-{color}-900 to-{color}-800 rounded-lg p-4">
  <div className="text-{color}-300 text-sm mb-1">{label}</div>
  <div className="text-3xl font-bold text-white">{value}</div>
  <div className="text-{color}-200 text-xs">{subtitle}</div>
</div>
```

**Detail Row:**
```jsx
<div className="flex justify-between text-sm">
  <span className="text-neutral-400">{label}</span>
  <span className="text-white font-semibold">{value}</span>
</div>
```

**Toggle Switch:**
```jsx
<button className={`relative inline-flex h-6 w-11 items-center rounded-full ${
  enabled ? 'bg-red-600' : 'bg-neutral-600'
}`}>
  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
    enabled ? 'translate-x-6' : 'translate-x-1'
  }`} />
</button>
```

**Collapsible Section:**
```jsx
<button onClick={toggle} className="w-full flex items-center justify-between p-4 bg-neutral-750 hover:bg-neutral-700">
  <div className="flex items-center gap-2">
    <Icon className="w-5 h-5 text-neutral-400" />
    <span className="text-white font-semibold">{title}</span>
  </div>
  <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${
    open ? 'rotate-180' : ''
  }`} />
</button>
```

### SVG Styling (AGP Chart)

**Chart Dimensions:**
```jsx
viewBox="0 0 900 450"
width="100%"
Chart area: x: 60-840, y: 50-350
```

**AGP Elements:**
```jsx
/* Target lines */
54 mg/dL: stroke="#000" stroke-width="2" stroke-dasharray="8,4" (dashed)
70 mg/dL: stroke="#000" stroke-width="3" (solid, bold)
180 mg/dL: stroke="#000" stroke-width="3" (solid, bold)
250 mg/dL: stroke="#000" stroke-width="2" stroke-dasharray="8,4" (dashed)

/* Percentile bands */
5-95th: fill="rgba(96, 165, 250, 0.2)" (blue, 20% opacity)
25-75th: fill="rgba(96, 165, 250, 0.3)" (blue, 30% opacity)

/* Lines */
Median (p50): stroke="#3b82f6" stroke-width="2.5" (solid blue)
Comparison: stroke="#9ca3af" stroke-width="2" stroke-dasharray="4,4" (dashed gray)

/* Event markers */
Hypo L2: fill="#ef4444" (red circles)
Hypo L1: fill="#f97316" (orange circles)
Hyper: fill="#ef4444" (red circles)

/* Grid */
Background: fill="#ffffff" (white for print)
Grid lines: stroke="#e5e7eb" stroke-width="1"
Axis labels: font-size="11" fill="#000"
```

**React UI vs HTML Export:**
```jsx
// React: Dark background, colored lines
<svg className="bg-gray-900 rounded-lg border-2 border-gray-700">
  
// HTML Export: White background, black lines for print
<svg style="border: 2px solid #000; background: #fff">
```

### HTML Export Structure

**Page Layout:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    /* Print-optimized CSS */
    @media print {
      @page { size: A4; margin: 5mm; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="header">...</div>
  <div class="section">...</div>  <!-- Metrics -->
  <div class="section">...</div>  <!-- AGP Chart -->
  <div class="section page-break">...</div>  <!-- Comparison (new page) -->
  <div class="section">...</div>  <!-- Day/Night Split -->
  <div class="footer">...</div>
</body>
</html>
```

**Print Optimization:**
- A4 portrait format
- Black/white only (no color)
- Bold borders (2-3px) for clarity
- Courier New monospace for professional look
- Minimal padding (5-8mm) to save space
- Page breaks before comparison section
- Inline SVG (no external dependencies)

### Interactive Elements

**File Upload:**
```jsx
<label className="block">
  <input type="file" className="hidden" />
  <div className="border-2 border-dashed border-neutral-600 rounded-lg p-8 cursor-pointer hover:border-red-500">
    <Upload className="w-12 h-12 mx-auto text-neutral-400" />
    <p className="text-white font-semibold">Upload CSV</p>
  </div>
</label>
```

**Hover States:**
```css
Cards: hover:opacity-80 (when collapsed)
Buttons: hover:bg-[color]-600 (darker shade)
Upload area: hover:border-red-500 (accent highlight)
Collapsible headers: hover:bg-neutral-700
```

**Active States:**
```css
Selected preset: bg-red-700 text-white
Unselected: bg-neutral-700 text-neutral-300
Active toggle: bg-red-600 or bg-blue-600
```

### Icons (lucide-react)

**Used Icons:**
```jsx
import { 
  Upload,      // File upload
  Calendar,    // Date selection
  Settings,    // ProTime settings
  ChevronDown, // Collapsible indicators
  AlertCircle, // Warnings/errors
  FileDown,    // Export button
  Activity     // Main header icon
} from 'lucide-react';
```

**Icon Sizing:**
```jsx
Small: w-4 h-4 (16px) - inline with text
Medium: w-5 h-5 (20px) - section headers
Large: w-8 h-8 or w-12 h-12 (32-48px) - upload areas
```

**Icon Colors:**
```jsx
Default: text-neutral-400
Active: text-white or colored (red/blue/green)
```

### Transitions & Animations

**Standard transitions:**
```css
Collapsible chevron: transition-transform duration-300
Card opacity: transition-all duration-300
Button hover: transition-colors
Toggle switch: transition-transform (handle sliding)
```

**No complex animations:**
- Keep it simple and professional
- Focus on usability over flashiness
- Smooth, subtle transitions only

### Accessibility

**Color Contrast:**
- Dark UI: White text on dark gray (WCAG AA compliant)
- Print: Black on white (maximum contrast)
- Functional colors distinct enough (red/green/yellow)

**Typography:**
- Minimum 12px (text-xs) for body text
- Bold for important values
- Clear hierarchy (h1 > h2 > body)

**Interactive Elements:**
- Clickable areas have cursor-pointer
- Buttons have clear hover states
- Toggle switches have visible state changes
- File inputs hidden but accessible via label

### Responsive Breakpoints

```css
Mobile: < 640px (sm)
- Grid collapses to 1 column
- Reduced padding (p-4)
- Smaller text sizes

Tablet: 640-1024px (md-lg)
- Grid stays 2-4 columns
- Standard padding (p-6)

Desktop: > 1024px (xl)
- Full grid layouts
- Max width: 1280px (max-w-7xl)
```

### Error & Empty States

**Error Messages:**
```jsx
<div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
  <p className="text-sm text-red-300">
    <strong>Error:</strong> {errorMessage}
  </p>
</div>
```

**Empty States:**
```jsx
<div className="text-center py-16">
  <Icon className="w-16 h-16 text-gray-600 mx-auto mb-6" />
  <h2 className="text-2xl font-semibold text-gray-300 mb-4">{title}</h2>
  <p className="text-gray-400">{message}</p>
</div>
```

**Loading States:**
- Disabled buttons during processing
- Opacity changes on collapsed sections
- Clear status indicators (checkmarks, counts)

### Do's and Don'ts

**DO:**
- âœ… Use Tailwind utility classes (from core set)
- âœ… Maintain dark theme throughout React UI
- âœ… Use gradients for metric cards (visual interest)
- âœ… Keep print output black/white
- âœ… Use monospace for exported reports
- âœ… Provide clear visual hierarchy
- âœ… Use functional colors (green=good, red=warning)
- âœ… Keep borders visible (2-3px)

**DON'T:**
- âŒ Use custom Tailwind classes (no JIT compiler)
- âŒ Add color to print output (ink cost)
- âŒ Use sans-serif for exported reports
- âŒ Make tiny text (<10px / text-xs)
- âŒ Use overly complex animations
- âŒ Break A4 page layout in exports
- âŒ Use external dependencies in HTML exports
- âŒ Mix color schemes (keep dark or print)

### Example Components

**Full Card Example:**
```jsx
<div className="bg-neutral-800 rounded-xl p-6 shadow-xl border border-neutral-700">
  <h2 className="text-xl font-bold text-white mb-4">Glucose Metrics</h2>
  
  <div className="grid grid-cols-4 gap-4 mb-6">
    <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-4">
      <div className="text-green-300 text-sm mb-1">TIR</div>
      <div className="text-3xl font-bold text-white">72%</div>
      <div className="text-green-200 text-xs">Target &gt;70%</div>
    </div>
    {/* More metric cards... */}
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-neutral-900 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-neutral-400">MAGE</span>
        <span className="text-white font-semibold">45 mg/dL</span>
      </div>
      {/* More detail rows... */}
    </div>
  </div>
</div>
```

---

## CONFIGURATION CONSTANTS

```javascript
export const CONFIG = {
  // Glucose thresholds (mg/dL)
  GLUCOSE: {
    LOW: 70,            // Hypoglycemia threshold
    HIGH: 180,          // Hyperglycemia threshold
    CRITICAL_LOW: 54,   // Level 2 hypoglycemia
    CRITICAL_HIGH: 250, // Severe hyperglycemia
    MAX: 400           // Y-axis maximum
  },
  
  // AGP calculation
  AGP_BINS: 288,        // 5-minute bins (1440 min Ã· 5)
  
  // CSV parsing
  CSV_SKIP_LINES: 6,    // Metadata rows to skip
  
  // Comparison
  COMPARISON_DAYS: 14,  // Not used in v2.1 (auto-calculates)
  
  // Time split
  TIME_SPLIT: {
    NIGHT_START: 0,     // 00:00
    NIGHT_END: 6,       // 06:00
    DAY_START: 6,       // 06:00
    DAY_END: 24         // 00:00 (midnight)
  }
};
```

### State Management

**AGPGenerator component:**
```javascript
// Data state (from hooks)
const { csvData, dateRange, loadCSV } = useCSVData();
const metricsResult = useMetrics(csvData, startDate, endDate, workdays);
const comparisonData = useComparison(csvData, startDate, endDate, dateRange);

// UI state (local)
const [startDate, setStartDate] = useState(null);
const [endDate, setEndDate] = useState(null);
const [workdays, setWorkdays] = useState(null);
const [dayNightEnabled, setDayNightEnabled] = useState(false);
```

**No global state management needed:**
- All state flows through props
- Custom hooks encapsulate business logic
- React's built-in Context not required (simple app)

### Performance Optimizations

**useMemo in useMetrics:**
```javascript
const metricsResult = useMemo(() => {
  // Expensive calculations only run when deps change
  return {
    metrics: calculateMetrics(csvData, startDate, endDate),
    agp: calculateAGP(csvData, startDate, endDate),
    events: detectEvents(csvData, startDate, endDate)
  };
}, [csvData, startDate, endDate, workdays]);
```

**TypedArrays in MODD:**
```javascript
// Float32Array is ~4x faster than regular arrays for large datasets
const bins = Array.from({ length: 288 }, () => new Float32Array(maxDays));
```

**SVG path generation:**
```javascript
// Generate once, memoize result
const paths = useMemo(() => ({
  median: generatePath(agpData, 'p50'),
  band_5_95: generateBand(agpData, 'p95', 'p5'),
  band_25_75: generateBand(agpData, 'p75', 'p25')
}), [agpData]);
```

---

## DIABETES METRICS - TARGET SUMMARY

For Type 1 Diabetes adults (ADA/ATTD 2019 International Consensus):

| Metric | Target | Excellent | Action Needed |
|--------|--------|-----------|---------------|
| **GMI** | <7.0% | <6.5% | >7.5% |
| **TIR** | â‰¥70% | â‰¥80% | <60% |
| **TAR** | â‰¤25% | â‰¤20% | >40% |
| **TBR** | <4% | <3% | >7% |
| **CV** | â‰¤36% | <30% | >40% |
| **MAGE** | - | <60 mg/dL | >100 mg/dL |
| **MODD** | - | <40 mg/dL | >60 mg/dL |

**Priority hierarchy:**
1. **TBR <4%** - Safety first (prevent hypoglycemia)
2. **TIR â‰¥70%** - Effectiveness (time in target)
3. **CV â‰¤36%** - Stability (reduce variability)
4. **TAR â‰¤25%** - Long-term complications prevention
5. **MAGE, MODD** - Fine-tuning and consistency

**Special populations:**
- Pregnant: TIR >70%, TBR <4%, TAR <25% (tighter control)
- Elderly: TIR >50%, TBR <1%, TAR <50% (safety priority)
- Pediatric: TIR >70%, TBR <4%, TAR <25% (same as adults)

---

## USER WORKFLOWS

### Basic Usage

1. **Upload CSV:**
   - Click "Upload CSV" button
   - Select Medtronic CareLink CSV file
   - Button turns green "CSV Loaded âœ“"
   - Date range auto-detected

2. **Select Period:**
   - Click preset button (14d/30d/90d) OR
   - Enter custom dates manually
   - Metrics calculate automatically

3. **Review Metrics:**
   - Metrics grid appears (8 clinical metrics)
   - AGP chart renders with percentile bands
   - Comparison appears (if preset period + sufficient history)

4. **(Optional) Enable Day/Night:**
   - Scroll to "Day/Night Analysis"
   - Click "Disabled" toggle â†’ Enables
   - Day/night cards appear with insights

5. **(Optional) Import ProTime:**
   - Click "Import ProTime" button
   - Choose tab: "PDF Text" or "JSON File"
   - Paste/upload data â†’ Click import
   - Workday split section appears

### ProTime Import (PDF Text)

1. Open ProTime PDF in viewer
2. Select All (Cmd+A / Ctrl+A)
3. Copy (Cmd+C / Ctrl+C)
4. Click "Import ProTime" in AGP+ tool
5. Switch to "PDF Text" tab
6. Paste in textarea (Cmd+V / Ctrl+V)
7. Click "Import PDF Text"
8. Modal closes, workday analysis appears

### ProTime Import (JSON File)

1. Click "Import ProTime" button
2. Switch to "JSON File" tab
3. Click "Select JSON File"
4. Choose previously exported JSON
5. Data loads automatically
6. Workday analysis appears

### Comparison Workflow

**Automatic (recommended):**
1. Upload CSV with 30+ days of data
2. Click "Last 30 days" preset
3. Comparison appears automatically (compares to previous 30 days)

**Manual (for reference):**
- Comparison only triggers for preset periods (14/30/90 days)
- Requires sufficient historical data
- If no comparison appears â†’ not enough history OR custom period selected

---

## KNOWN ISSUES & EDGE CASES

### CSV Parsing

**European decimal format:**
- CSV uses comma (`,`) for decimals
- Must convert to period (`.`) for parseFloat
- Example: `"138,5"` â†’ `138.5`

**Empty cells:**
- Optional columns (BG, bolus, carbs) may be empty
- Parser handles with `|| 0` or `|| null`
- Empty glucose values filtered out before calculations

**Date format mismatch:**
- CSV: YYYY/MM/DD (e.g., 2025/10/05)
- Display: DD-MM-YYYY (e.g., 05-10-2025)
- Conversion handled in PeriodSelector component

### Comparison Mode

**Requirements:**
- Preset period (14/30/90 days) selected
- Previous period fully within available data
- Example: To compare Oct 1-30, need data from Sep 1-30

**Edge case:**
- User selects "Last 30 days" on Oct 15
- CSV only has data from Sep 20 onwards
- Comparison unavailable (only 25 days history)

**Warning shown:**
- "Previous period has insufficient data - comparison unavailable"
- Debug: Check `dateRange.min` vs `prevStart` in console

### AGP Curve

**Minimum data:**
- 7 days recommended for reliable percentiles
- <7 days: Percentile bands may be unstable
- <3 days: AGP not meaningful (too few data points per bin)

**Empty bins:**
- Some 5-minute bins may have no readings (sensor gaps)
- Empty bins: All percentiles = 0 or NaN
- Visual impact: Curve dips to zero (rare with good coverage)

**Y-axis range:**
- Fixed: 0-400 mg/dL
- Outliers >400 mg/dL clipped (extremely rare)
- Could adjust if needed, but 400 covers 99.9% of readings

### ProTime Parser

**Depends on:**
- "Week XX YYYY" headers for year detection
- Dutch day abbreviations (ma/di/wo/do/vr/za/zo)
- Format: `ma 30/09  7:33  14:46`

**Fails gracefully:**
- If parsing fails â†’ returns empty array
- No workdays â†’ Workday split section doesn't appear
- User can retry with JSON format

---

## TESTING GUIDE

### Manual Testing Checklist

**File Upload:**
- [ ] CSV upload works (button turns green)
- [ ] Invalid file shows error
- [ ] ProTime modal opens/closes
- [ ] ProTime PDF text imports successfully
- [ ] ProTime JSON file imports successfully

**Period Selection:**
- [ ] "14 days" preset sets dates correctly
- [ ] "30 days" preset sets dates correctly
- [ ] "90 days" preset sets dates correctly
- [ ] Custom dates accept manual entry
- [ ] Invalid dates show error

**Metrics Display:**
- [ ] All 8 metrics calculated correctly
- [ ] Values match expected ranges
- [ ] Mean always shows Â±SD
- [ ] GMI close to expected A1c

**AGP Chart:**
- [ ] Percentile bands render correctly
- [ ] Median line visible
- [ ] Event markers appear (if events present)
- [ ] Axes labeled properly
- [ ] Legend shows correct elements

**Comparison View:**
- [ ] Appears for 30-day preset (if history available)
- [ ] 6 metrics compared
- [ ] Deltas color-coded correctly (green/red/grey)
- [ ] Overall assessment makes sense

**Day/Night Split:**
- [ ] Toggle works (disabled â†’ enabled)
- [ ] Day card shows (blue theme)
- [ ] Night card shows (indigo theme)
- [ ] Insights appear
- [ ] Metrics differ appropriately

**Workday Split:**
- [ ] Only appears after ProTime import
- [ ] Workday card shows (blue)
- [ ] Rest day card shows (green)
- [ ] Deltas calculated correctly
- [ ] Date list accurate

**Edge Cases:**
- [ ] Upload <7 days CSV â†’ warning shown
- [ ] Low coverage â†’ warning shown
- [ ] No comparison history â†’ no comparison section
- [ ] Empty ProTime data â†’ no error

### Automated Testing (Future)

**Unit tests:**
- calculateMetrics() - verify all metrics
- calculateAGP() - check bin counts, percentiles
- detectEvents() - test event detection logic
- parseCSV() - handle various CSV formats
- parseProTime() - parse PDF text correctly

**Integration tests:**
- Full workflow: upload â†’ select â†’ calculate â†’ render
- Comparison triggering logic
- Hook interactions (useMetrics + useComparison)

**Visual regression tests:**
- AGP chart rendering consistency
- Component layout on different screen sizes

---

## DEPLOYMENT

### Build Production Version

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output: dist/ folder
# Contains: index.html + assets/
```

### Deployment Options

**Option 1: Netlify (Recommended)**
```bash
# Option A: Manual upload
# 1. Build: npm run build
# 2. Drag dist/ folder to Netlify dashboard

# Option B: GitHub integration
# 1. Push to GitHub
# 2. Connect repo in Netlify
# 3. Auto-deploy on push
```

**Option 2: Vercel**
```bash
# Install CLI
npm i -g vercel

# Deploy
cd agp-plus
vercel

# Follow prompts
```

**Option 3: GitHub Pages**
```bash
# 1. Update vite.config.js:
export default defineConfig({
  base: '/agp-plus/',  // Your repo name
  // ...
});

# 2. Build and deploy
npm run build
npx gh-pages -d dist
```

**Option 4: Self-hosted**
```bash
# Build
npm run build

# Copy dist/ to web server
scp -r dist/* user@server:/var/www/agp-plus/

# Configure nginx/apache to serve index.html
```

---

## FUTURE ENHANCEMENTS

### Quick Wins (v2.2)
- [ ] Dark/light theme toggle
- [ ] Export to PDF button (use html-exporter.js)
- [ ] Print-friendly styles (media query)
- [ ] Save/load analysis sessions (localStorage)
- [ ] Keyboard shortcuts

### Medium Complexity (v2.3)
- [ ] Multiple CSV comparison (track progress over months)
- [ ] A1C correlation analysis (compare GMI vs lab A1c)
- [ ] Insulin dose visualization (bolus timeline)
- [ ] Custom target ranges (personalized thresholds)
- [ ] Annotations (add notes to specific dates)

### Advanced (v3.0)
- [ ] Backend API integration (user accounts, cloud sync)
- [ ] Mobile app (React Native version)
- [ ] Real-time CGM integration (websocket)
- [ ] Machine learning patterns (predict hypo events)
- [ ] Multi-user clinic dashboard

### Explicitly NOT Planned

**TDD calculations:**
- Unreliable from CareLink CSV (missing auto-basal data)
- Recommend using Medtronic PDF reports instead

**Basal pattern analysis:**
- Requires actual delivery data (not in CSV)
- Would give false impression of accuracy

**Bolus type distinction:**
- CSV doesn't include normal/square/dual wave types
- Only total volume available

---

## DESIGN PHILOSOPHY

### Honesty Over Features

**Principle:** Only calculate metrics we can trust from available data.

**Application:**
- âœ… Calculate: TIR, TAR, TBR, CV, GMI, MAGE, MODD (reliable from glucose data)
- âŒ Don't calculate: TDD, basal patterns, IOB (unreliable from CSV)
- ðŸ” Be transparent: Document limitations prominently

**Why this matters:**
- Users make therapy decisions based on these metrics
- False accuracy is worse than acknowledged limitation
- Trust > feature count

### Clinical Focus

**Evidence-based metrics only:**
- ADA/ATTD 2019 International Consensus guidelines
- Validated algorithms (MAGE: Service & Nelson 1970, MODD: Molnar 1972)
- Clinically actionable thresholds

**Actionable insights:**
- Not just numbers â†’ what they mean
- Example: "Night TBR 6.2% â†’ Consider reducing basal" (actionable)
- Not just: "Night TBR: 6.2%" (data point only)

### User Experience

**Progressive disclosure:**
- Start simple: Upload â†’ Select period â†’ See metrics
- Advanced features optional: Day/night split, workday comparison
- Don't overwhelm with all features at once

**Helpful empty states:**
- Clear next steps when no data loaded
- Explain what each section needs to appear
- Guide user through workflow

**Error messages:**
- Specific: "This does not appear to be a Medtronic CareLink CSV file"
- Not generic: "Error loading file"
- Actionable: Tell user what to do next

---

## SUPPORT & TROUBLESHOOTING

### Common Issues

**"No valid data found in CSV"**
- Cause: Not a Medtronic CareLink CSV OR wrong export type
- Solution: Export from CareLink â†’ Reports â†’ Export Data â†’ CSV

**"Warning: Low sensor coverage"**
- Cause: Many sensor gaps (disconnects, warm-ups)
- Impact: Metrics may not be representative
- Solution: Use longer period OR check sensor issues

**Comparison not appearing:**
- Check: Is it a preset period (14/30/90 days)?
- Check: Is there enough historical data?
- Debug: Console.log dateRange.min and prevStart date

**AGP chart rendering blank:**
- Check: Browser console for errors
- Check: Are there >100 glucose readings in period?
- Solution: Select longer period OR check CSV quality

**ProTime import fails:**
- Check: Is it the full PDF text (not partial)?
- Check: Does it have "Week XX YYYY" headers?
- Solution: Try JSON format instead

### Debug Mode

Open browser console (F12) to see:
- Parsed CSV data: `csvData`
- Date range: `dateRange`
- Calculated metrics: `metricsResult`
- Comparison data: `comparisonData`
- Errors: Red console messages

### Getting Help

**Before asking:**
1. Check browser console for errors (F12)
2. Verify CSV file is from CareLink
3. Try with different CSV file (test data quality)
4. Check installation guides (PROMPT_X files)

**When reporting issue:**
- Browser version (Chrome/Firefox/Safari)
- Error message (exact text)
- Steps to reproduce
- CSV file size and date range

---

## CHANGELOG

### v2.1.0 (October 22, 2025)

**Architecture:**
- Complete modular redesign (8 components, 3 hooks, 3 core modules)
- Custom hooks for business logic separation
- Production-ready folder structure (src/components/, src/hooks/, src/core/)
- Vite build system with optimized bundling

**Features:**
- Auto-comparison for preset periods (14/30/90 days)
- Day/night toggle (06:00-00:00 vs 00:00-06:00)
- Enhanced comparison (6 metrics with color-coded deltas)
- ProTime modal (dual-tab: PDF text + JSON upload)
- Automatic insights (day/night split recommendations)
- Overall assessment (improvement/deterioration summary)
- Event markers on AGP chart (hypo L1/L2, hyper)
- Empty states with helpful onboarding

**UI/UX:**
- Collapsible sections (cleaner layout)
- Dismissible error messages
- Loading state indicators
- Responsive design (mobile/tablet support)
- Dark theme with blue/indigo accents

**Performance:**
- Memoized calculations (useMemo in hooks)
- TypedArrays for MODD (4x faster)
- Optimized SVG path generation

### v2.0.0 (October 20, 2025)

**Initial modular version:**
- Separated metrics engine (metrics-engine.js)
- Extracted parsers (parsers.js)
- Day/night split analysis
- AGP comparison overlay
- Enhanced period comparison
- ProTime JSON support

### v1.0 (Original)

**Monolithic version:**
- Single-file React component
- Basic AGP visualization
- Core metrics (TIR, TAR, TBR, CV, GMI)
- Period comparison (14 days)
- HTML export

---

## CREDITS & REFERENCES

### Clinical Guidelines

**Primary:**
- Battelino T, et al. "Clinical Targets for Continuous Glucose Monitoring Data Interpretation: Recommendations From the International Consensus on Time in Range." *Diabetes Care* 2019; 42(8):1593-1603. doi:10.2337/dci19-0028

**Supporting:**
- Service FJ, Nelson RL. "Characteristics of glycemic stability." *Diabetes Care* 1970; 3(1):58-65. (MAGE method)
- Molnar GD, et al. "Day-to-day variation of continuously monitored glycaemia." *Diabetologia* 1972; 8:342-348. (MODD method)

### Technical References

**AGP methodology:**
- FDA. "The Ambulatory Glucose Profile - Guidance for Industry and Food and Drug Administration Staff." 2016.

**Device documentation:**
- Medtronic MiniMed 780G System User Guide
- CareLink Personal User Guide

### Tools & Libraries

- React 18: https://react.dev/
- Vite: https://vitejs.dev/
- Tailwind CSS: https://tailwindcss.com/
- lucide-react: https://lucide.dev/

---

## PROJECT STRUCTURE

### Local Development Setup

```
~/Documents/Projects/agp-plus/
â”œâ”€â”€ node_modules/          # Dependencies (npm install)
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/        # 8 React components
â”‚   â”‚   â”œâ”€â”€ AGPGenerator.jsx        (420 lines)
â”‚   â”‚   â”œâ”€â”€ FileUpload.jsx          (330 lines)
â”‚   â”‚   â”œâ”€â”€ PeriodSelector.jsx      (250 lines)
â”‚   â”‚   â”œâ”€â”€ MetricsDisplay.jsx      (290 lines)
â”‚   â”‚   â”œâ”€â”€ AGPChart.jsx            (450 lines)
â”‚   â”‚   â”œâ”€â”€ ComparisonView.jsx      (280 lines)
â”‚   â”‚   â”œâ”€â”€ DayNightSplit.jsx       (290 lines)
â”‚   â”‚   â””â”€â”€ WorkdaySplit.jsx        (310 lines)
â”‚   â”‚
â”‚   â”œâ”€â”€ hooks/            # 3 custom hooks
â”‚   â”‚   â”œâ”€â”€ useCSVData.js           (70 lines)
â”‚   â”‚   â”œâ”€â”€ useMetrics.js           (85 lines)
â”‚   â”‚   â””â”€â”€ useComparison.js        (110 lines)
â”‚   â”‚
â”‚   â”œâ”€â”€ core/             # 3 calculation modules
â”‚   â”‚   â”œâ”€â”€ metrics-engine.js       (600+ lines)
â”‚   â”‚   â”œâ”€â”€ parsers.js              (200 lines)
â”‚   â”‚   â””â”€â”€ html-exporter.js        (700 lines)
â”‚   â”‚
â”‚   â”œâ”€â”€ styles/
â”‚   â”‚   â””â”€â”€ globals.css             (Tailwind + dark theme)
â”‚   â”‚
â”‚   â””â”€â”€ main.jsx          # React entry point
â”‚
â”œâ”€â”€ public/               # Static assets
â”œâ”€â”€ package.json          # Dependencies
â”œâ”€â”€ vite.config.js        # Build config
â”œâ”€â”€ index.html            # HTML template
â””â”€â”€ README.md             # Project documentation
```

### GitHub Repository

**Location:** `~/Documents/Projects/agp-plus/`

**Git configuration:**
```bash
# Check current remote
git remote -v

# Should show:
# origin  https://github.com/[username]/agp-plus.git (fetch)
# origin  https://github.com/[username]/agp-plus.git (push)
```

**Branch structure:**
- `main` - Production-ready code
- `develop` - Active development (if using)
- Feature branches: `feature/[name]`
- Bug fixes: `fix/[issue]`

### Claude Project Files

**Available in project context:**
- Core modules (ARTIFACT-01, 02, 03) - Reference implementations
- Previous versions (AGP__Generator__Clean_v1_0_.tsx, agp-generator-v4.tsx)
- Documentation (metric_definitions.md, minimed_780g_ref.md)
- Clinical references (standards-of-care-2025.pdf)
- Sample data (Jo_Mostert_19102025.pdf)
- **Handoff prompts** (HANDOFF_PROMPT_NEW_CHAT.md, HANDOFF_PROMPT_QUICK_START.md)
- **Master index** (MASTER_INDEX.md)

**Access via:**
```bash
# In Claude chats with project access
view /mnt/project/[filename]
```

**For new chat sessions:**
- Full handoff: `view /mnt/project/HANDOFF_PROMPT_NEW_CHAT.md`
- Quick start: `view /mnt/project/HANDOFF_PROMPT_QUICK_START.md`
- Master index: `view /mnt/project/MASTER_INDEX.md`

---

## CONTACT & FEEDBACK

**Developer:** Jo Mostert  
**Version:** 2.1.0  
**Last Updated:** October 22, 2025  
**Repository:** ~/Documents/Projects/agp-plus/

**For issues or suggestions:**
- GitHub: Push to remote repository
- Local: Update files in ~/Documents/Projects/agp-plus/

---

## END PROJECT BRIEFING

**Remember:** This tool analyzes what's *reliably* in the CareLink CSV export. For Total Daily Dose (TDD) and detailed basal insulin patterns, always use Medtronic PDF reportsâ€”that's where the actual pump memory data lives, including SmartGuard auto-basal adjustments that aren't available in CSV exports.

**The bottom line:** We calculate what we can trust. No more, no less.
