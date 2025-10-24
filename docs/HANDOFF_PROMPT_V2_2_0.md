# AGP+ V2.2.0 - HANDOFF PROMPT

**Last updated:** October 24, 2025  
**Version:** 2.2.0 - Day Profiles Edition  
**Project:** AGP+ (Ambulatory Glucose Profile Plus)

---

## 🚨 CRITICAL: HOW TO WORK WITH THIS PROJECT

### **YOU MUST USE DESKTOP COMMANDER**

This project lives on Jo's laptop. You access it **ONLY** via Desktop Commander tools:

```bash
# ❌ WRONG - These will NOT work:
view /path/to/file
bash cat /path/to/file

# ✅ CORRECT - Use Desktop Commander:
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/AGPGenerator.jsx
DC: list_directory /Users/jomostert/Documents/Projects/agp-plus/src
DC: edit_block file_path="/Users/jomostert/..." old_string="..." new_string="..."
```

**Why?** The project is NOT in your container. It's on the laptop filesystem. Desktop Commander is your bridge.

---

## 📂 PROJECT STRUCTURE

**Root path:** `/Users/jomostert/Documents/Projects/agp-plus/`

```
agp-plus/
├── src/
│   ├── components/          # React components
│   │   ├── AGPGenerator.jsx          # Main app container
│   │   ├── DayProfileCard.jsx        # Single day visualization [NEW v2.2]
│   │   ├── DayProfilesModal.jsx      # 7-day modal overlay [NEW v2.2]
│   │   ├── AGPChart.jsx              # AGP curve visualization
│   │   ├── MetricsDisplay.jsx        # TIR/TAR/TBR metrics
│   │   ├── FileUpload.jsx            # CSV upload
│   │   ├── PatientInfo.jsx           # Patient metadata [v2.1]
│   │   └── ...
│   │
│   ├── core/                # Business logic & data processing
│   │   ├── metrics-engine.js         # Core calculations (TIR, AGP, events)
│   │   ├── day-profile-engine.js     # Day profiles logic [NEW v2.2]
│   │   ├── day-profiles-exporter.js  # HTML export for days [NEW v2.2]
│   │   ├── html-exporter.js          # Main HTML export
│   │   ├── parsers.js                # CSV parsing
│   │   └── ...
│   │
│   ├── hooks/               # React hooks for state management
│   │   ├── useCSVData.js             # CSV file handling
│   │   ├── useMetrics.js             # Metrics calculation
│   │   ├── useUploadStorage.js       # IndexedDB persistence
│   │   └── usePatientInfo.js         # Patient metadata
│   │
│   ├── storage/             # IndexedDB helpers
│   │   ├── patientStorage.js
│   │   └── uploadStorage.js
│   │
│   └── main.jsx             # React entry point
│
├── package.json             # Dependencies (React 18, Vite)
└── vite.config.js           # Build config
```

---

## 🚀 RUNNING THE APP

The app runs on **Vite dev server**. Here's how to interact with it:

### Start/Restart the dev server

```bash
# Navigate to project
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && npm run dev" timeout_ms=5000

# The server runs on http://localhost:5173
# It auto-reloads when you edit files
```

### Check if server is running

```bash
DC: list_sessions
# Look for process with "npm run dev" or "vite"
```

### Stop the server (if needed)

```bash
DC: force_terminate <pid>
```

### Common issues

**Port already in use?**
```bash
# Kill process on port 5173
DC: start_process "lsof -ti:5173 | xargs kill -9" timeout_ms=3000
```

**Changes not showing?**
- Vite has hot reload, but sometimes you need hard refresh (Cmd+Shift+R)
- Check browser console for errors
- Check terminal output for build errors

---

## 📖 DOCUMENTATION HIERARCHY

When working on this project, **read docs in this order:**

### 1. **THIS FILE FIRST** 
You're reading it. Basics of Desktop Commander and project structure.

### 2. **PROJECT_BRIEFING_V2_2_0.md** (MOST IMPORTANT)
Complete technical specification:
- Architecture overview
- Data flow diagrams
- Component responsibilities
- Y-axis calculation logic (CRITICAL for charts)
- Event detection algorithms
- File formats and CSV quirks

**Location:** `/mnt/project/PROJECT_BRIEFING_V2_2_0.md`

### 3. **DESIGN_SYSTEM_V2_1_3.md**
UI/UX guidelines:
- Brutalist design principles
- Component styling patterns
- Print optimization
- Tailwind usage

**Location:** `/mnt/project/DESIGN_SYSTEM_V2_1_3.md`

### 4. **MASTER_INDEX_V2_2_0.md**
Quick reference guide:
- Common tasks
- Testing checklist
- Known limitations

**Location:** `/mnt/project/MASTER_INDEX_V2_2_0.md`

### 5. **METRIC_DEFINITIONS.md**
Clinical reference:
- TIR/TAR/TBR thresholds
- GMI calculation
- Event detection rules

**Location:** `/mnt/project/metric_definitions.md`

---

## 🎯 QUICK START CHECKLIST

Before starting ANY task:

- [ ] Read this handoff prompt completely
- [ ] Read relevant section in PROJECT_BRIEFING
- [ ] Use Desktop Commander for ALL file operations
- [ ] Check if dev server is running
- [ ] Understand which component/file needs changes

---

## 🏗️ ARCHITECTURE OVERVIEW

### Data Flow (Simplified)

```
1. User uploads CSV
   ↓
2. parseCSV() → csvData array + dateRange
   ↓
3. User selects period (startDate, endDate)
   ↓
4. useMetrics hook → calculateMetrics(), calculateAGP(), detectEvents()
   ↓
5. getDayProfiles() → last 7 days with full analysis [NEW v2.2]
   ↓
6. AGPGenerator renders:
   - MetricsDisplay (TIR/TAR/TBR)
   - AGPChart (curve + events)
   - DayProfilesModal (7 day cards) [NEW v2.2]
```

### Component Responsibilities

**AGPGenerator** (main container)
- Orchestrates all other components
- Manages global state (csvData, dateRange, metrics)
- Handles routing between views
- **DOES NOT** calculate data (delegates to hooks/engines)

**Hooks** (state management)
- `useCSVData` - File parsing, data extraction
- `useMetrics` - Calculation orchestration
- `useUploadStorage` - Persistence
- Return processed data to AGPGenerator

**Core Engines** (pure functions)
- `metrics-engine.js` - TIR, AGP, CV, MAGE calculations
- `day-profile-engine.js` - Individual day analysis [NEW v2.2]
- `parsers.js` - CSV → structured data
- **NO React dependencies** - pure JavaScript

**Components** (presentation)
- Receive props from AGPGenerator
- Handle rendering and user interaction
- Can have local UI state (modals, tooltips)
- **NO data processing** - just display

---

## 🎨 Y-AXIS LOGIC (CRITICAL FOR CHARTS)

### The Problem
Different days have different glucose ranges (e.g., 60-140 vs 50-300). A fixed Y-axis (40-400) wastes space and loses detail.

### The Solution: Adaptive Y-Axis

**Implemented in:**
- `DayProfileCard.jsx` (line ~200-230)
- `day-profiles-exporter.js` (line ~18-37)
- `html-exporter.js` (line ~18-50)

**Algorithm:**

```javascript
// 1. Find actual data range
const dataMin = Math.min(...validGlucose);
const dataMax = Math.max(...validGlucose);
const dataRange = dataMax - dataMin;

// 2. Calculate smart padding (more zoom for tight ranges)
const padding = dataRange < 100 ? 30 : dataRange < 150 ? 20 : 15;

// 3. Set adaptive range (start with clinical 54-250, expand if needed)
const yMin = Math.max(40, Math.min(54, dataMin - padding));
const yMax = Math.min(400, Math.max(250, dataMax + padding));

// 4. Generate smart ticks (20/25/40/50 steps, always include 70 & 180)
const ticks = calculateYTicks(yMin, yMax);
```

**Key principles:**
- **Clinical range first** (54-250 mg/dL) - default starting point
- **Expand only if needed** - if data goes outside, extend range
- **Never go below 40 or above 400** - physiological limits
- **Always show 70 & 180** - critical thresholds (if in range)
- **Smart tick spacing** - avoid clutter, maintain readability

**Why this matters:**
- Tight glycemic control day (65-130): zoomed in, shows detail
- Variable day (40-350): zoomed out, shows full picture
- Consistent UX: same algorithm everywhere (screen + print)

---

## 📊 EVENT DETECTION RULES

### Hypoglycemia

**Level 2 (L2):** < 54 mg/dL for ≥15 minutes
**Level 1 (L1):** 54-70 mg/dL for ≥15 minutes

```javascript
// Detection: consecutive readings below threshold
// Must persist for 3+ readings (15 min = 3 × 5min intervals)
```

### Hyperglycemia

**Threshold:** > 250 mg/dL for ≥120 minutes

```javascript
// Detection: sustained high glucose
// Must persist for 24+ readings (120 min = 24 × 5min intervals)
```

### Sensor Change

**Detection:** Data gap > 30 minutes

```javascript
// Major gaps (2-10 hours) = sensor change
// Marked at LAST reading before gap (red dashed line)
// No marker when data resumes (visually obvious)
```

### Cartridge Change

**Detection:** "Rewind" event in CSV

```javascript
// Orange dotted line at exact timestamp
// Indicates reservoir/cartridge replacement
```

---

## 🐛 DEBUGGING TIPS

### Browser Console

```javascript
// Check what data AGPGenerator has
console.log('[AGPGenerator] csvData:', csvData?.length);
console.log('[AGPGenerator] metrics:', metrics);
console.log('[AGPGenerator] dayProfiles:', dayProfiles?.length);
```

### Desktop Commander Debugging

```bash
# Read a component to check logic
DC: read_file /path/to/Component.jsx

# Search for a function
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus" 
                  pattern="calculateTIR" searchType="content"

# Check what's running
DC: list_sessions
DC: list_processes
```

### Common Issues

**"No day profiles showing"**
- Check console for `[getDayProfile]` logs
- Verify CSV has 7 complete days before creation date
- Check if `csvCreatedDate` is correctly parsed

**"Charts look wrong"**
- Check Y-axis calculation (see algorithm above)
- Verify glucose data is in mg/dL (not mmol/L)
- Check for outliers (values > 400 or < 40)

**"Events not detected"**
- Check `[detectEvents]` logs in console
- Verify thresholds (54, 70, 180, 250)
- Check duration requirements (15min, 120min)

---

## 📝 COMMON TASKS

### Task 1: Add a new metric

```bash
# 1. Read metrics engine
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/core/metrics-engine.js

# 2. Add calculation function
DC: edit_block file_path="..." old_string="..." new_string="..."

# 3. Add to MetricsDisplay component
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/MetricsDisplay.jsx

# 4. Test in browser
# Restart dev server if needed
```

### Task 2: Fix a bug in day profiles

```bash
# 1. Read day profile engine
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/core/day-profile-engine.js

# 2. Check DayProfileCard component
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/DayProfileCard.jsx

# 3. Add debug logging
console.log('[DayProfileCard]', { date, metrics, events });

# 4. Check browser console for logs
```

### Task 3: Update HTML export

```bash
# For main AGP report:
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/core/html-exporter.js

# For day profiles HTML:
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/core/day-profiles-exporter.js

# Changes must match on-screen rendering for consistency
```

---

## 🚨 CRITICAL LIMITATIONS

### What AGP+ CANNOT Do

**1. Total Daily Dose (TDD)**
- CSV only has programmed basal pattern
- SmartGuard auto-basal NOT in CSV (-26% to -1% missing)
- Solution: Use Medtronic PDF reports for TDD

**2. Basal Insulin Analysis**
- Auto-basal delivery data unavailable
- Cannot analyze basal patterns accurately

**3. Bolus Type Distinction**
- CSV doesn't distinguish normal/square/dual wave
- Only total volume available

**Why important:** Don't add features that calculate unreliable metrics. Honesty > features.

---

## 📦 WHAT'S NEW IN V2.2.0

### Day Profiles Feature

**User flow:**
1. Upload CSV with ≥7 complete days
2. Click "Bekijk dagprofielen" button
3. Full-screen modal shows last 7 days
4. Each day card has:
   - 24h glucose curve with adaptive Y-axis
   - Event markers (hypo/hyper/sensor/cartridge)
   - TIR vertical bar
   - Metrics footer
   - Achievement badges (Perfect Day, Zen Master, etc.)
5. Click "Print" to export standalone HTML

**Key files:**
- `src/components/DayProfileCard.jsx` - Single day visualization
- `src/components/DayProfilesModal.jsx` - Modal container
- `src/core/day-profile-engine.js` - Business logic
- `src/core/day-profiles-exporter.js` - HTML generation

**Technical highlights:**
- Full 5-minute resolution preserved (288 bins/day)
- Adaptive Y-axis per day (see algorithm above)
- AGP median reference curve overlay
- Smart event detection (cross-day sensor changes handled)
- Print-optimized (2 pages max, B/W patterns)

---

## 🎓 LEARNING THE CODEBASE

### Start here:

1. **Read AGPGenerator.jsx** (main orchestrator)
   - See how components connect
   - Understand state management
   - Follow data flow

2. **Read metrics-engine.js** (core calculations)
   - Understand TIR/TAR/TBR logic
   - See AGP percentile calculation
   - Learn event detection

3. **Read one hook: useMetrics.js** (hook pattern)
   - How hooks call engines
   - How they manage state
   - How they pass data up

4. **Read DayProfileCard.jsx** (complete feature)
   - Component structure
   - SVG rendering
   - Event visualization
   - Y-axis implementation

### Then expand to:

- Other components (AGPChart, MetricsDisplay)
- Other engines (parsers, exporters)
- Storage layer (IndexedDB)

---

## ✅ BEFORE YOU START CODING

**Checklist:**

- [ ] I read this entire handoff prompt
- [ ] I read the relevant section in PROJECT_BRIEFING
- [ ] I understand which component/file to change
- [ ] I know the Desktop Commander commands to use
- [ ] I checked if the dev server is running
- [ ] I have the full context of what I'm changing

**When unsure:**

1. **Read PROJECT_BRIEFING** - your primary reference
2. **Search the codebase** - use DC: start_search
3. **Check console logs** - add debug logging if needed
4. **Ask Jo** - if fundamentally unclear

---

## 🎯 SUCCESS METRICS

You're doing well if:

✅ You always use Desktop Commander (never view/bash)  
✅ You read docs before coding  
✅ You understand the Y-axis algorithm  
✅ You can explain data flow (CSV → hooks → engines → components)  
✅ You test changes in the browser  
✅ Your changes match the brutalist design system  
✅ You add console.log() for debugging, remove after  

---

## 📚 NEXT STEPS

After reading this:

1. **Read PROJECT_BRIEFING_V2_2_0.md** (complete technical spec)
2. **Verify dev server is running** (`DC: list_sessions`)
3. **Understand the current task** (what needs to be done?)
4. **Plan your approach** (which files to change?)
5. **Start coding** (Desktop Commander only!)

---

**Remember:** Desktop Commander is your ONLY way to access files. Use it. Love it. It's your friend.

Good luck! 🚀
