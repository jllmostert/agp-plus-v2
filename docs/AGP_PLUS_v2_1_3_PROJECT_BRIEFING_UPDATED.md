# AGP+ v2.1.3 - Project Briefing (Complete)

**Version:** 2.1.3  
**Status:** Production Ready - Modular Architecture with Data Persistence  
**Last Updated:** October 24, 2025  
**Device:** Medtronic MiniMed 780G + Guardian Sensor 4  
**Data Source:** CareLink CSV Export  
**Tech Stack:** React 18 + Vite + Tailwind CSS + IndexedDB

---

## EXECUTIVE SUMMARY

AGP+ v2.1.3 is a complete architectural redesign with full component modularity, custom hooks, production-grade code structure, **and persistent data storage**. The tool generates clinical-grade Ambulatory Glucose Profile analysis from Medtronic 780G CGM data following ADA/ATTD 2019 guidelines.

**Mission:** Provide reliable, evidence-based glucose analytics from CareLink CSV exports with honest limitations—only calculating metrics we can trust.

**Key Principle:** *Honesty over features.* We don't calculate Total Daily Dose (TDD) or basal patterns because CareLink CSV exports are fundamentally unreliable for this data.

---

## WHAT'S NEW IN v2.2

### 🆕 Day Profiles Export (NEW!)
- ✅ **Individual Day Analysis** - View last 7 days with full glucose curves, metrics, and events
- ✅ **Printable HTML Export** - Optimized for A4 printing (max 2 pages)
- ✅ **Achievement Badges** - Perfect Day, Zen Master, exceptional performance indicators
- ✅ **Event Detection** - Hypoglycemic (L1/L2), hyperglycemic events, sensor changes
- ✅ **AGP Reference Line** - Dotted overlay of period median for context
- ✅ **Compact Layout** - 4 days per page, brutalist B/W print design

**Components:**
- `DayProfileCard.jsx` - Single day card with curve, TIR bar, metrics
- `DayProfilesModal.jsx` - Full-screen modal with 7-day stack
- `day-profiles-exporter.js` - HTML generation for print (599 lines)

**Print Optimization:**
- Page 1: Header + 4 day cards
- Page 2: Header + 3 day cards + legend
- Fixed height cards (56mm) for consistent pagination
- B/W patterns (dots/stripes) for TIR visualization

**Future Optimization Notes:**
- ⚠️ **Y-axis range needs optimization** - Currently 40-400 mg/dL wastes vertical space
  - Most data is 54-250 mg/dL (clinical action range)
  - ~30% chart height is dead space above 250 and below 54
  - Compresses actual glucose variability (makes patterns harder to scan)
  - **TODO:** Implement adaptive Y-axis (54-250 as primary, with breakpoints for outliers)
- ⚠️ **Horizontal whitespace** - 70% of width is margins/padding vs 30% actual chart
  - SVG already optimized to 650px width with 100% container fill
  - Further gains require reducing left/right padding in cards

---

## WHAT'S NEW IN v2.1.3

### 🆕 Data Persistence (NEW!)
- ✅ **IndexedDB Storage** - Unlimited client-side data storage (no LocalStorage 5MB limit)
- ✅ **Save Uploads** - Save CSV + ProTime data with custom names
- ✅ **Load Saved Data** - One-click reload of saved datasets
- ✅ **Lock/Unlock** - Protect important uploads from deletion
- ✅ **Storage Management** - View storage usage, rename, delete uploads

### 🆕 Patient Information Management (NEW!)
- ✅ **Auto-extraction** - Parses patient metadata from CSV headers
- ✅ **Patient Modal** - One-time entry form for demographics
- ✅ **On-screen Display** - Patient info visible in app header
- ✅ **HTML Export** - Patient info in exported reports
- ✅ **Persistent Storage** - Saved in IndexedDB between sessions

**Auto-extracted from CSV:**
- Name (First + Last from header row 2)
- Device Model (from header row 1)
- Device Serial Number (from header row 2)
- CGM Sensor Type (from header row 3)

**Manual entry fields:**
- Date of Birth
- Physician
- Email

### Architecture Overhaul
- ✅ **Full component modularity** - 10 separate UI components (no monolith)
- ✅ **Custom hooks** - Business logic separated from UI (useCSVData, useMetrics, useComparison, useUploadStorage)
- ✅ **Core modules** - Calculation engine extracted to separate files
- ✅ **Production structure** - src/components/, src/hooks/, src/core/, src/utils/
- ✅ **Build system** - Vite with proper module bundling

### Enhanced Features
- ✅ **Auto-comparison** - Automatically triggers for preset periods (14/30/90 days)
- ✅ **Day/Night toggle** - Enable/disable 06:00-00:00 vs 00:00-06:00 split
- ✅ **Collapsible UI** - Clean, organized sections (was single-page monolith)
- ✅ **ProTime modal** - Dual-tab import (PDF text + JSON file upload)
- ✅ **Empty states** - Helpful onboarding messages
- ✅ **Error handling** - Clear, dismissible error messages
- ✅ **Load Success Toast** - Visual feedback when loading saved data

### Clinical Additions
- ✅ **6-metric comparison** - TIR, Mean±SD, CV, GMI, MAGE, MODD with deltas
- ✅ **Automatic insights** - Day/night split shows actionable recommendations
- ✅ **Event markers** - Visual indicators on AGP curve (hypo L1/L2, hyper)
- ✅ **Overall assessment** - Summary of improvements/deteriorations

---

## ARCHITECTURE

### Module Structure

```
agp-plus/
├── src/
│   ├── components/          # 13 UI components [UPDATED v2.2]
│   │   ├── AGPGenerator.jsx        Main orchestrator (988 lines)
│   │   ├── FileUpload.jsx          CSV/ProTime upload UI (330 lines)
│   │   ├── PeriodSelector.jsx      Date range picker (250 lines)
│   │   ├── MetricsDisplay.jsx      4-column metrics grid (290 lines)
│   │   ├── AGPChart.jsx            SVG visualization (450 lines)
│   │   ├── ComparisonView.jsx      Period comparison (280 lines)
│   │   ├── DayNightSplit.jsx       Day/night analysis (290 lines)
│   │   ├── WorkdaySplit.jsx        Workday comparison (310 lines)
│   │   ├── PatientInfo.jsx         Patient demographics modal (278 lines)
│   │   ├── SavedUploadsList.jsx    Saved data management (318 lines)
│   │   ├── DayProfileCard.jsx      Single day profile card (548 lines) [NEW v2.2]
│   │   ├── DayProfilesModal.jsx    7-day profiles modal (156 lines) [NEW v2.2]
│   │   └── HypoglycemiaEvents.jsx  Event detection component [NEW v2.2]
│   │
│   ├── hooks/               # 4 custom hooks
│   │   ├── useCSVData.js           CSV parsing & state (112 lines)
│   │   ├── useMetrics.js           Memoized calculations (85 lines)
│   │   ├── useComparison.js        Auto-comparison logic (110 lines)
│   │   └── useUploadStorage.js     IndexedDB management (450 lines) [NEW]
│   │
│   ├── core/                # 4 calculation modules [UPDATED v2.2]
│   │   ├── metrics-engine.js       Clinical calculations (600+ lines)
│   │   ├── parsers.js              CSV/ProTime/Metadata parsing (307 lines)
│   │   ├── html-exporter.js        AGP report generation (870 lines)
│   │   └── day-profiles-exporter.js Day profiles HTML export (606 lines) [NEW v2.2]
│   │
│   ├── utils/               # Utility modules
│   │   ├── patientStorage.js       Patient info IndexedDB (150 lines)
│   │   └── uploadStorage.js        Upload data IndexedDB (200 lines)
│   │
│   ├── styles/
│   │   └── globals.css             Dark theme + Tailwind
│   │
│   └── main.jsx                    React entry point
│
├── package.json             # Dependencies (React 18, Vite, lucide-react)
├── vite.config.js           # Build configuration
└── index.html               # Entry HTML

Total: ~6,500+ lines production code [UPDATED v2.2]
```

### Component Hierarchy

```
AGPGenerator (main container)
├── PatientInfo Modal [NEW]
│   ├── FormField (×5: Name, Email, DOB, Physician, CGM)
│   └── SaveButton
├── LoadSuccessToast [NEW]
├── FileUpload
│   ├── CSVUploadButton
│   ├── ProTimeButton
│   └── ProTimeModal
│       ├── PDFTextTab
│       └── JSONFileTab
├── SavedUploadsList [NEW]
│   └── UploadCard (×N)
│       ├── LoadButton
│       ├── LockButton
│       ├── RenameButton
│       └── DeleteButton
├── PeriodSelector
│   ├── PresetButtons
│   └── CustomDateInputs
├── MetricsDisplay
│   └── MetricCard (×8)
├── AGPChart
│   ├── GridLines
│   ├── TargetLines
│   ├── AGP Bands (p5-95, p25-75)
│   ├── Median Line
│   ├── EventMarkers
│   ├── XAxis / YAxis
│   └── ChartLegend
├── ComparisonView
│   ├── ComparisonCard (×6)
│   └── OverallAssessment
├── DayNightSplit
│   ├── DayNightCard (×2)
│   └── DayNightInsights
└── WorkdaySplit
    ├── WorkdayCard (×2)
    └── ExportButton
```

### Data Flow

```
1. User uploads CSV
   ↓
2. useCSVData hook → parseCSV() → csvData + dateRange
   ↓ [NEW]
   parseCSVMetadata() → extract patient info → save to patientStorage
   ↓
3. User clicks "Save Upload" [NEW]
   ↓
   useUploadStorage → save to IndexedDB (CSV data + ProTime + metadata)
   ↓
4. User loads saved upload [NEW]
   ↓
   useUploadStorage.loadUpload() → restore csvData + workdays
   ↓
5. User selects period (startDate, endDate)
   ↓
6. useMetrics hook → calculateMetrics(), calculateAGP(), detectEvents()
   ↓
7. useComparison hook → auto-calculates previous period (if preset)
   ↓
8. AGPGenerator composes all components with calculated data
   ↓
9. UI renders with:
   - PatientInfo in header [NEW]
   - MetricsDisplay (metrics)
   - AGPChart (agp, events, comparison)
   - ComparisonView (current vs previous)
   - DayNightSplit (day vs night)
   - WorkdaySplit (workdays vs restdays)
   ↓
10. User exports HTML with patient info [NEW]
```

---

## INPUT DATA

### Medtronic CareLink CSV

**Export path:** CareLink Personal → Export Data → CSV

**Format quirks:**
- **Delimiter:** Semicolon (`;`) not comma
- **Decimals:** Comma (`,`) not period (European format)
- **Header:** First 6 rows are metadata (skip these for data, parse for patient info)
- **Column names:** Row 7
- **Data:** Row 8 onwards

### CSV Header Structure (NEW!)

**First 3 lines contain patient metadata:**

```
Line 1: Last Name;First Name;...;Device;MiniMed 780G MMT-1886;...;Firmware Version;8.13.2
Line 2: "Mostert";"Jo";...;"Serial Number";NG4114235H;...
Line 3: Patient DOB;;;;;;CGM;Guardian™ 4 Sensor
```

**Auto-extracted metadata:**
- **Name:** Line 2, columns 0-1 (First + Last)
- **Device:** Line 1, column after "Device" label
- **Serial:** Line 2, column after "Serial Number" label  
- **CGM:** Line 3, column after "CGM" label

**Data columns (from row 7 onwards):**

| Column | Index | Type | Reliability | Purpose |
|--------|-------|------|-------------|---------|
| Date | 1 | YYYY/MM/DD | ✅ 100% | Timestamps |
| Time | 2 | HH:MM:SS | ✅ 100% | Timestamps |
| Sensor Glucose (mg/dL) | 34 | Float | ✅ 100% | AGP, TIR/TAR/TBR |
| Bolus Volume Delivered (U) | 20 | Float | ✅ 100% | Insulin metrics |
| BWZ Carb Ratio (g/U) | 22 | Float | ✅ 100% | Carb ratio |
| BG Reading (mg/dL) | 18 | Float | ✅ 100% | Fingersticks |
| BWZ Carb Input | 27 | Float | ✅ 100% | Carb counting |
| **Basal Rate (U/h)** | 7 | Float | ⚠️ **UNRELIABLE** | See limitation |

**THE BASAL RATE TRAP:**

The `Basal Rate` column contains **only the programmed fallback pattern**, NOT the SmartGuard auto-adjustments that actually deliver insulin. The difference can be -26% to -1% from actual delivery.

**This makes TDD calculations from CSV fundamentally unreliable.**

**Solution:** Use Medtronic PDF reports for TDD (Reports → Therapy Management Dashboard contains actual pump memory data).

### ProTime Import (Optional)

For workday vs rest day analysis. Accepts:

1. **ProTime PDF text** (copy-paste)
2. **JSON array**
3. **JSON object with dates**

Parser auto-detects format. Dutch day abbreviations (ma/di/wo/do/vr/za/zo).

---

## DATA PERSISTENCE (NEW!)

### IndexedDB Storage Architecture

**Two separate databases:**

1. **`patientInfoDB`** - Patient demographics
   - Store: `patientInfo`
   - Single record with patient details
   - Updated when CSV loads (auto-fill) or user saves manually
   - Persists across sessions

2. **`uploadStorageDB`** - Saved CSV uploads
   - Store: `uploads`
   - Multiple records (one per saved upload)
   - Each record contains:
     - `id` (UUID)
     - `name` (user-defined)
     - `timestamp` (save date)
     - `csvData` (parsed glucose data array)
     - `dateRange` {min, max}
     - `proTimeData` (workday dates array, optional)
     - `locked` (boolean)

**Storage capacity:**
- LocalStorage: ~5MB limit (OLD, not used)
- IndexedDB: **Unlimited** (browser-dependent, typically 50% of available disk)

**Migration from LocalStorage:**
- Automatic on first load (v2.1.3+)
- Migrates existing uploads to IndexedDB
- Shows success notification
- Old LocalStorage data removed after migration

### Upload Management Features

**Save Upload:**
1. User clicks "Save Current Upload" button
2. Modal prompts for name (default: "Upload - [date]")
3. Saves CSV data + ProTime data + metadata to IndexedDB
4. Appears in "Saved Uploads" list

**Load Upload:**
1. User clicks "LOAD DATA" button on saved upload
2. CSV data restored (no re-parsing needed)
3. ProTime data restored (if present)
4. Period auto-selects to "Last 14 Days"
5. Metrics calculate immediately
6. Green toast confirms: "✅ LOADED: [name]"
7. Upload marked as "✓ ACTIVE"

**Lock/Unlock:**
- Click lock icon (🔓 → 🔒)
- Locked uploads cannot be:
  - Deleted
  - Renamed
- Can still be loaded
- Use for protecting important datasets

**Rename:**
- Click edit icon (✏️)
- Inline text input appears
- Press Enter to save, Escape to cancel
- Only works on unlocked uploads

**Delete:**
- Click delete icon (🗑️)
- Confirmation dialog appears
- Only works on unlocked uploads
- Cannot delete active upload

**Storage Info:**
- Shows total uploads count
- Shows total storage usage (MB)
- Displays in Saved Uploads section header

---

## PATIENT INFORMATION

### Patient Info Modal

**Access:** Click "Patient Info" button in app header

**Fields:**
- **Name** (auto-filled from CSV)
- **Email** (manual entry)
- **Date of Birth** (manual entry - NOT in CSV)
- **Physician** (manual entry)
- **CGM Device** (auto-filled from CSV)

**Auto-fill workflow:**
1. User uploads CSV
2. `parseCSVMetadata()` extracts info from headers
3. Data saved to `patientInfoDB` (only if fields empty)
4. Modal auto-populates on open
5. User can override/edit any field

**Storage:**
- Persists in IndexedDB (`patientInfoDB`)
- Survives page refresh
- Shared across all uploads (single patient profile)

### Patient Info Display

**On-screen header:**
```
AGP+ V2.1.3
PATIENT: JO MOSTERT | DOB: 01/01/1990 | MINIMED 780G (SN: NG4114235H)
22/09/2025 → 23/10/2025 (32 dagen)
```

**HTML export header:**
```
┌─────────────────────────────────────────────┐
│ AGP+ V2.1.3                                 │
│                                             │
│ PATIENT: JO MOSTERT | DOB: 01/01/1990     │
│ PHYSICIAN: DR. EXAMPLE                      │
│ EMAIL: patient@example.com                  │
│ CGM DEVICE: MINIMED 780G (SN: NG4114235H) │
│                                             │
│ AMBULATORY GLUCOSE PROFILE | 22/09 → 23/10│
└─────────────────────────────────────────────┘
```

**Visibility:**
- ✅ On-screen app header (if data exists)
- ✅ HTML export report header (if data exists)
- ✅ Patient Info modal (always accessible)

---

## KEY WORKFLOWS

### First-Time Setup

1. **Upload CSV**
   - Patient metadata auto-extracted
   - Saved to patientStorage
   - Date range detected
   - Last 14 days auto-selected

2. **Configure Patient Info (optional)**
   - Click "Patient Info" button
   - Verify auto-filled fields
   - Add DOB, physician, email if desired
   - Save

3. **Add ProTime Data (optional)**
   - Click "Import ProTime" button
   - Paste PDF text OR upload JSON
   - Workday/restday analysis enabled

4. **Save Upload**
   - Click "Save Current Upload"
   - Name it (e.g., "Jo Mostert - Oct 2025")
   - Locks in CSV + ProTime data

### Daily Workflow

1. **Load Saved Data**
   - Open app
   - Scroll to "Saved Uploads"
   - Click "LOAD DATA" on desired upload
   - Data loads instantly (no re-upload needed)

2. **Analyze Different Periods**
   - Select "Last 14 Days"
   - Review metrics
   - Export HTML report
   - Select "Last 30 Days"
   - Compare results
   - Export again

3. **Switch Between Patients**
   - Load Upload A
   - Analyze, export
   - Load Upload B (different patient)
   - Analyze, export
   - No CSV re-upload needed!

### Comparison Analysis

1. **Upload new 3-month CSV**
2. **Save as "Q4 2025"**
3. **Load "Q3 2025" upload**
4. **Select matching period (e.g., Last 90 Days)**
5. **Export both for comparison**
6. **Manual side-by-side review**

---

## CLINICAL METRICS

*[Rest of clinical metrics documentation remains unchanged]*

---

## DESIGN SYSTEM

*[Rest of design system documentation remains unchanged]*

---

## TESTING GUIDE

### Test: Patient Info Auto-Fill

1. ✅ Upload Medtronic CSV
2. ✅ Wait for load complete
3. ✅ Click "Patient Info" button
4. ✅ Verify fields auto-filled:
   - Name: First Last
   - CGM: Contains device model + serial
5. ✅ DOB empty (expected - not in CSV)
6. ✅ Close modal
7. ✅ Check header shows patient info

### Test: Save/Load Upload

1. ✅ Upload CSV
2. ✅ Add ProTime (optional)
3. ✅ Select period (e.g., Last 30 Days)
4. ✅ Click "Save Current Upload"
5. ✅ Name it "Test Upload"
6. ✅ See it appear in Saved Uploads list
7. ✅ Refresh page (F5)
8. ✅ Scroll to Saved Uploads
9. ✅ Click "LOAD DATA" on "Test Upload"
10. ✅ See green toast: "✅ LOADED: Test Upload"
11. ✅ See upload marked "✓ ACTIVE"
12. ✅ Verify metrics display
13. ✅ Verify ProTime data restored (if added)

### Test: Lock/Unlock/Delete

1. ✅ Save an upload
2. ✅ Click lock icon (🔓 → 🔒)
3. ✅ Try to delete → Should show error
4. ✅ Click unlock icon (🔒 → 🔓)
5. ✅ Click delete → Confirmation appears
6. ✅ Confirm → Upload removed

### Test: HTML Export with Patient Info

1. ✅ Configure patient info (all fields)
2. ✅ Select period
3. ✅ Click export
4. ✅ Open downloaded HTML
5. ✅ Verify header contains:
   - Patient name
   - DOB
   - Physician
   - Email
   - CGM device with serial

---

## TROUBLESHOOTING

### "Cannot load upload"

**Cause:** IndexedDB quota exceeded OR corrupted database

**Solution:**
1. Check browser storage settings
2. Clear IndexedDB (DevTools → Application → IndexedDB)
3. Re-save uploads

### "Patient info not auto-filling"

**Cause:** CSV format different than expected

**Solution:**
1. Check console for parsing errors
2. Verify CSV is from CareLink (not other export)
3. Manually enter patient info

### "Saved uploads disappeared"

**Cause:** Browser cleared storage OR incognito mode

**Solution:**
- Don't use incognito mode (IndexedDB not persisted)
- Check browser isn't auto-clearing storage
- Export important data as HTML backup

---

## VERSION HISTORY

**v2.1.3** (October 24, 2025)
- ✅ Patient info management with auto-extraction
- ✅ IndexedDB storage for unlimited uploads
- ✅ Saved uploads with load/lock/rename/delete
- ✅ Load success toast notifications
- ✅ CSV metadata parsing (name, device, serial, CGM)
- ✅ Patient info in on-screen header and HTML export

**v2.1.2** (October 23, 2025)
- Minor bug fixes
- Improved error handling

**v2.1.0** (October 22, 2025)
- Complete architectural redesign
- Component modularity
- Custom hooks
- Auto-comparison
- Day/night split
- Workday analysis

---

## FUTURE ROADMAP

**Potential v2.2+ Features:**
- 📊 Multi-patient comparison (side-by-side)
- 📱 Progressive Web App (PWA) for offline use
- 📤 Cloud backup/sync (optional)
- 🎨 Customizable report templates
- 📈 Trend analysis over multiple periods
- 🔔 Glucose pattern alerts

---

## SUPPORT & FEEDBACK

**Documentation:** This file + `/mnt/project/` files

**Debugging:**
- Browser Console (F12)
- IndexedDB Inspector (DevTools → Application)
- Network tab for CSV upload issues

**Known Limitations:**
- TDD calculations unreliable (by design)
- Basal patterns unreliable (by design)
- Date of Birth not in CSV (manual entry)
- Browser storage subject to user settings

---

*Last updated: October 24, 2025 - v2.1.3*
