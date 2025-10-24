# AGP+ MASTER INDEX V2.2.0

**Quick Reference Guide**  
**Version:** 2.2.0 - Day Profiles Edition  
**Last Updated:** October 24, 2025

---

## 🚀 QUICK START

### First Time Setup

```bash
# 1. Start dev server
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && npm run dev" timeout_ms=5000

# 2. Open browser to http://localhost:5173

# 3. Upload CSV and start analyzing!
```

### Starting a New Chat

**Always do this first:**

1. Read `/mnt/project/HANDOFF_PROMPT_V2_2_0.md` (how to work with project)
2. Read `/mnt/project/PROJECT_BRIEFING_V2_2_0_PART1.md` (architecture & algorithms)
3. Read `/mnt/project/PROJECT_BRIEFING_V2_2_0_PART2.md` (files & responsibilities)
4. Read this file (quick reference)

**Template:**
```
I'm working on AGP+ v2.2.0.

Read handoff prompt:
view /mnt/project/HANDOFF_PROMPT_V2_2_0.md

Then read briefing parts 1 & 2:
view /mnt/project/PROJECT_BRIEFING_V2_2_0_PART1.md
view /mnt/project/PROJECT_BRIEFING_V2_2_0_PART2.md

Project: /Users/jomostert/Documents/Projects/agp-plus/

I want to [describe task]
```

---

## 📂 FILE STRUCTURE QUICK MAP

```
/Users/jomostert/Documents/Projects/agp-plus/
├── src/
│   ├── components/              # React UI
│   │   ├── AGPGenerator.jsx             (main app)
│   │   ├── DayProfileCard.jsx           [NEW v2.2] (single day)
│   │   ├── DayProfilesModal.jsx         [NEW v2.2] (7-day modal)
│   │   ├── AGPChart.jsx                 (AGP curve)
│   │   ├── MetricsDisplay.jsx           (TIR/TAR/TBR)
│   │   └── ...
│   │
│   ├── core/                    # Business logic
│   │   ├── metrics-engine.js            (TIR, AGP, events)
│   │   ├── day-profile-engine.js        [NEW v2.2] (day analysis)
│   │   ├── parsers.js                   (CSV parsing)
│   │   ├── html-exporter.js             (main report)
│   │   ├── day-profiles-exporter.js     [NEW v2.2] (day HTML)
│   │   └── ...
│   │
│   ├── hooks/                   # State management
│   │   ├── useCSVData.js
│   │   ├── useMetrics.js
│   │   ├── useUploadStorage.js
│   │   └── usePatientInfo.js
│   │
│   └── storage/                 # IndexedDB
│       ├── uploadStorage.js
│       └── patientStorage.js
│
└── package.json
```

---

## 🎯 COMMON TASKS

### Fix a UI Bug

```bash
# 1. Identify component
# If it's about day profiles → DayProfileCard.jsx
# If it's about main AGP → AGPChart.jsx
# If it's about metrics → MetricsDisplay.jsx

# 2. Read component
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/[Component].jsx

# 3. Make surgical edit
DC: edit_block file_path="..." old_string="..." new_string="..."

# 4. Test in browser (auto-reload)
# Check http://localhost:5173
```

### Fix a Logic Bug

```bash
# 1. Identify engine
# If it's about TIR/metrics → metrics-engine.js
# If it's about day profiles → day-profile-engine.js
# If it's about CSV parsing → parsers.js

# 2. Read engine
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/core/[engine].js

# 3. Add debug logging
console.log('[FunctionName]', { variable1, variable2 });

# 4. Edit and test
DC: edit_block ...
# Check browser console
```

### Add a New Feature

```bash
# 1. Plan architecture
# - Which engine needs new function?
# - Which component will display it?
# - Does it need a new hook?

# 2. Implement bottom-up
# - Start with engine (pure function)
# - Add hook if needed (orchestration)
# - Build component (presentation)
# - Wire into AGPGenerator

# 3. Follow design system
# - 3px borders
# - Monospace fonts
# - Grid layouts
# - Read DESIGN_SYSTEM_V2_1_3.md
```

### Update HTML Export

```bash
# For main AGP report:
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/core/html-exporter.js

# For day profiles:
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/core/day-profiles-exporter.js

# CRITICAL: Changes must match on-screen rendering
# Test both screen and print!
```

---

## 🐛 DEBUGGING CHEATSHEET

### Browser Console

```javascript
// In AGPGenerator
console.log('[AGPGenerator] csvData:', csvData?.length);
console.log('[AGPGenerator] metrics:', metrics);
console.log('[AGPGenerator] dayProfiles:', dayProfiles?.length);

// In DayProfileCard
console.log(`[DayProfileCard] ${date}:`, { readingCount, events, badges });

// In metrics-engine
console.log('[calculateMetrics]', { tir, tar, tbr });
```

### Desktop Commander

```bash
# Search codebase
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus" 
                 pattern="functionName" searchType="content"

# Check running processes
DC: list_sessions
DC: list_processes

# Read file with specific lines
DC: read_file path="..." offset=200 length=50
```

### Common Issues

| Problem | Check | Solution |
|---------|-------|----------|
| No day profiles | Console logs | Verify ≥7 complete days exist |
| Y-axis wrong | glucose data range | Check adaptive algorithm |
| Events missing | Thresholds (54,70,180,250) | Verify duration requirements |
| Sensor change not showing | Gap detection | Check 2-10 hour range |
| Dev server not responding | Port 5173 | Kill and restart |

---

## 🎨 DESIGN SYSTEM QUICK RULES

From `DESIGN_SYSTEM_V2_1_3.md`:

**Borders:**
- Always 3px solid
- Color: #000 (black) or #333 (dark grey)

**Typography:**
- Font: `'Courier New', monospace`
- Sizes: 12px body, 14px labels, 18-24px headers
- Weight: 700 (bold) for emphasis
- Transform: `uppercase` for labels
- Spacing: `letter-spacing: 0.1em` for labels

**Layout:**
- Use CSS Grid (not Flexbox)
- Gap: 1rem standard
- Min-width: 100px for buttons

**Colors:**
- Background: #fff (white) or #000 (black)
- Text: #000 (black) or #fff (white)
- Accents: #DC2626 (red), #F59E0B (amber), #22C55E (green)

**Print:**
- Black & white only
- Use patterns (stripes, dots) for distinction
- Test in print preview

---

## 📊 KEY ALGORITHMS

### Adaptive Y-Axis

**Location:** DayProfileCard.jsx, day-profiles-exporter.js, html-exporter.js

```javascript
const dataMin = Math.min(...validGlucose);
const dataMax = Math.max(...validGlucose);
const dataRange = dataMax - dataMin;

const padding = dataRange < 100 ? 30 : dataRange < 150 ? 20 : 15;

const yMin = Math.max(40, Math.min(54, dataMin - padding));
const yMax = Math.min(400, Math.max(250, dataMax + padding));
```

**Principles:**
- Start with clinical range (54-250)
- Expand if data goes outside
- Never below 40 or above 400
- Always show 70 & 180 if in range

### Event Detection

**Hypo L2:** <54 mg/dL for ≥15 minutes (3 consecutive readings)  
**Hypo L1:** 54-70 mg/dL for ≥15 minutes  
**Hyper:** >250 mg/dL for ≥120 minutes (24 consecutive readings)  
**Sensor Change:** Gap 2-10 hours (mark start only)  
**Cartridge Change:** Rewind event in CSV  

### Achievement Badges

**Perfect Day:** TIR ≥99%  
**Zen Master:** TIR ≥98%, CV <30%, 0 hypos  
**You Slay Queen:** TIR ≥95%, CV <36%, 0 hypos  

---

## ✅ TESTING CHECKLIST

### Before Committing Changes

- [ ] Browser: No console errors
- [ ] Day profiles render correctly
- [ ] Adaptive Y-axis works (test tight & wide days)
- [ ] Events marked at correct times
- [ ] Sensor change = red dashed (stop point only)
- [ ] Cartridge change = orange dotted
- [ ] HTML export works (click Print in modal)
- [ ] Print preview looks good (B/W)
- [ ] No debug console.log() left in code

### Regression Testing (Major Changes)

- [ ] CSV upload works
- [ ] Period selection works
- [ ] Metrics calculate correctly
- [ ] AGP chart renders
- [ ] Day/Night split works
- [ ] Workday split works
- [ ] Upload storage works (save/load/delete)
- [ ] Patient info saves
- [ ] Main HTML export works
- [ ] Day profiles HTML export works

---

## 🚨 CRITICAL LIMITATIONS

**AGP+ CANNOT calculate:**
- Total Daily Dose (TDD) - CSV has programmed basal only
- Auto-basal patterns - SmartGuard data not in CSV
- Bolus types - CSV doesn't distinguish normal/square/dual

**Solution:** Use Medtronic PDF reports for TDD

**CSV Quirks:**
- Delimiter: semicolon (`;`)
- Decimals: comma (`,`)
- Header: 6 rows metadata, data starts row 8
- Basal Rate: UNRELIABLE (programmed pattern, not actual)

---

## 📚 DOCUMENTATION HIERARCHY

**When unsure, read in this order:**

1. **HANDOFF_PROMPT_V2_2_0.md** - How to work with project
2. **PROJECT_BRIEFING_V2_2_0_PART1.md** - Architecture & algorithms
3. **PROJECT_BRIEFING_V2_2_0_PART2.md** - Files & responsibilities
4. **MASTER_INDEX_V2_2_0.md** (this file) - Quick reference
5. **DESIGN_SYSTEM_V2_1_3.md** - UI/UX guidelines
6. **metric_definitions.md** - Clinical thresholds

**All docs in:** `/mnt/project/`

---

## 🔧 DEV SERVER COMMANDS

```bash
# Start server
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && npm run dev" timeout_ms=5000

# Check if running
DC: list_sessions

# Stop server
DC: force_terminate <pid>

# Kill port if stuck
DC: start_process "lsof -ti:5173 | xargs kill -9" timeout_ms=3000

# Access app
# Open http://localhost:5173 in browser
```

---

## 📦 WHAT'S NEW IN V2.2.0

**Major Features:**
- ✨ Individual day profile cards
- ✨ Last 7 days visualization modal
- ✨ Achievement badges (Perfect Day, Zen Master, etc.)
- ✨ Adaptive Y-axis per day
- ✨ AGP median reference overlay
- ✨ Sensor & cartridge change markers
- ✨ Print-optimized HTML for days (2 pages max)

**Technical:**
- New `day-profile-engine.js` (day analysis)
- New `DayProfileCard.jsx` (single day viz)
- New `DayProfilesModal.jsx` (modal container)
- New `day-profiles-exporter.js` (HTML generation)
- Refined sensor change detection (stop point only)
- Added cartridge change detection (Rewind events)

---

## 🎓 LEARNING PATH

**New to the codebase?**

1. Read `AGPGenerator.jsx` (see how everything connects)
2. Read `metrics-engine.js` (understand core calculations)
3. Read `useMetrics.js` (see hook pattern)
4. Read `DayProfileCard.jsx` (see complete feature)
5. Pick a small task and try it!

**Key concepts to understand:**
- Components receive, engines calculate, hooks orchestrate
- Adaptive Y-axis algorithm (critical!)
- Event detection thresholds
- IndexedDB persistence
- CSV parsing quirks

---

## ⚠️ CRITICAL REMINDERS

**Always:**
- ✅ Use Desktop Commander (DC:) for file operations
- ✅ Read PROJECT_BRIEFING before coding
- ✅ Test in browser after changes
- ✅ Check both screen and print
- ✅ Follow brutalist design system
- ✅ Add debug logs, then remove them

**Never:**
- ❌ Use view/bash for files (use DC:)
- ❌ Put calculations in components
- ❌ Guess file structure (check docs)
- ❌ Commit with console.log()
- ❌ Break print preview

---

## 🚀 SUCCESS METRICS

**You're doing well if:**

✅ You always use Desktop Commander  
✅ You read docs before coding  
✅ You understand data flow (CSV → hooks → engines → components)  
✅ You can explain adaptive Y-axis algorithm  
✅ Your changes work on screen AND in print  
✅ You test both day profiles and main AGP  
✅ You follow brutalist design system  

---

## 📞 WHEN STUCK

**1. Check browser console** - errors? warnings?  
**2. Add debug logging** - console.log() everything  
**3. Read relevant docs** - PROJECT_BRIEFING has answers  
**4. Search codebase** - DC: start_search is your friend  
**5. Ask Jo** - if fundamentally unclear  

---

**Remember:** Desktop Commander is your ONLY way to access files on Jo's laptop. Master it! 🚀

**Happy coding!** 🎉
