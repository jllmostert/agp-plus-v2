# AGP+ v3.7 - DEBUG TOOLS REORGANIZATION & UI IMPROVEMENTS

**Datum:** 29 oktober 2025  
**Status:** 🚧 IN PROGRESS  
**Branch:** v3.0-dev  
**Last Session:** Debug page reorganization + button improvements

---

## 📊 SESSION OVERVIEW

Focus shift naar UI/UX improvements en debug tool accessibility. De core functionaliteit is stabiel, nu focus op developer experience en usability.

### Session Goals
1. ✅ **Debug Tools Reorganization** - Buttons toegankelijk maken vanuit main app
2. 🚧 **ProTime Workday Persistence** - Data survival across page refreshes  
3. ⏳ **HTML Export Hypo Icons** - Replace vertical lines with visual icons
4. ⏳ **TDD Card Integration** - New metric card on-screen + HTML export

---

## ✅ COMPLETED: Debug Tools Buttons (Priority 1)

### Problem
- Debug tools (`sensor-detection.html`, `insulin-tdd.html`) in `/public/debug/`
- Single 🔧 icon button linked to non-existent `/debug/index.html`
- Button opened page for 0.1 second then closed (404 redirect)

### Solution Implemented
**Replaced single icon with TWO text-labeled buttons:**

```javascript
// OLD: Single icon button
<button onClick={() => window.open('/debug/index.html', '_blank')}>
  🔧
</button>

// NEW: Two separate buttons
<div style={{ display: 'flex', gap: '0.5rem' }}>
  <button onClick={() => window.open('/debug/sensor-detection.html', '_blank')}>
    SENSORS
  </button>
  <button onClick={() => window.open('/debug/insulin-tdd.html', '_blank')}>
    INSULIN
  </button>
</div>
```

### Button Styling
- Brutalist design: 2px borders, uppercase text, 0.625rem font
- Hover effects: inverted colors (transparent → paper background)
- Tooltips: "Sensor Detection Debug Tool" / "Insulin TDD Debug Tool"
- `whiteSpace: nowrap` prevents text wrapping
- Flex container with `gap: 0.5rem` for spacing

### Files Modified
- `/src/components/AGPGenerator.jsx` (lines ~790-830)

### Verification Steps
- [x] Start dev server: `cd agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001`
- [x] Click "SENSORS" button → Opens `sensor-detection.html` correctly
- [x] Click "INSULIN" button → Opens `insulin-tdd.html` correctly
- [x] Both buttons styled consistently with app theme

---

## 🚧 IN PROGRESS: ProTime Workday Persistence (Priority 2)

### Problem Statement
**ProTime workday data does NOT survive page refreshes.**

When user:
1. Uploads CSV with ProTime/workday detection
2. Refreshes browser
3. ProTime data is GONE (needs re-upload)

### Root Cause Analysis
ProTime data is stored in **memory only**, not persisted to IndexedDB.

**Storage functions exist but NOT being called:**
```javascript
// In /src/storage/masterDatasetStorage.js
export async function saveProTimeData(workdaySet) { /* ... */ }
export async function loadProTimeData() { /* ... */ }
export async function deleteProTimeData() { /* ... */ }
```

### Investigation Needed
1. **Find ProTime hook/component** that manages workday state
2. **Check if `saveProTimeData()` is called** after CSV upload
3. **Check if `loadProTimeData()` is called** on app mount
4. **Verify data structure** matches what's stored (Set vs Array conversion)

### Expected Files to Check
```
/src/hooks/useProTime.js           (if exists)
/src/components/ProTimePanel.jsx   (if exists)
/src/components/AGPGenerator.jsx   (main component)
```

### Next Steps
1. Search for ProTime usage in hooks/components
2. Add `saveProTimeData()` call after workday calculation
3. Add `loadProTimeData()` call in useEffect on mount
4. Test: Upload CSV → Refresh → Verify data persists

---

## ⏳ PENDING: HTML Export Hypo Icons (Priority 3)

### Current State
HTML export shows **vertical red lines** for hypo events:
- L1 Hypo: Thin orange line
- L2 Hypo: Thick red line

### Desired State
Match **main app visual style** with SVG icons:

**L1 Hypo (< 70 mg/dL):**
```svg
<circle cx="${x}" cy="${yScale(glucose)}" 
        r="4" fill="#ea580c" stroke="#000" stroke-width="2"/>
```

**L2 Hypo (< 54 mg/dL):**
```svg
<circle cx="${x}" cy="${yScale(glucose)}" 
        r="5" fill="#dc2626" stroke="#000" stroke-width="2"/>
<text x="${x}" y="${yScale(glucose)+1.5}" 
      text-anchor="middle" fill="#fff" 
      font-size="8" font-weight="bold">×</text>
```

### Implementation Notes
- File: `/src/storage/export.js`
- Function: `generateDayProfileHTML()`
- Find hypo rendering code
- Replace vertical lines with circle + optional cross marker
- Test: Export HTML → Verify icons print correctly (black/white)

---

## ⏳ PENDING: TDD Card Integration (Priority 4)

### Part A: On-Screen Display

**Current:** 4 hero cards in 2×2 grid (GMI, TIR, CV, Glucose Stats)  
**Target:** 5 cards with TDD as new metric

**TDD Card Content:**
```
┌──────────────────────┐
│ TDD                  │
├──────────────────────┤
│   42.3 ± 5.1 E       │  ← Mean ± SD
│   Range: 35-52 E     │  ← Optional
└──────────────────────┘
```

**Layout Options:**
- Asymmetric 5-card grid
- Wrapped flex layout
- Responsive breakpoints for mobile

### Part B: HTML Export

**Current Export (Column 2):**
```
┌─────────────┐
│ MINIMUM     │
│ 50 mg/dL    │
├─────────────┤
│ MAXIMUM     │
│ 353 mg/dL   │
└─────────────┘
```

**Target Export:**
```
┌─────────────────┐
│ TDD             │  ← NEW
│ 42.3 ± 5.1 E    │
├─────────────────┤
│ BEREIK          │  ← Min/Max combined
│ 50 - 353 mg/dL  │
└─────────────────┘
```

### Implementation Notes
- TDD data already calculated and stored in IndexedDB
- Need to add card component to hero grid
- Update `/src/storage/export.js` for HTML export
- Combine min/max into single "BEREIK" card
- Add TDD card above it

---

## 📋 COMPLETE TASK CHECKLIST

### ✅ Task 1: Debug Tools Buttons
- [x] Replace single icon with two text buttons
- [x] "SENSORS" → `/debug/sensor-detection.html`
- [x] "INSULIN" → `/debug/insulin-tdd.html`
- [x] Apply brutalist styling (borders, uppercase, hover)
- [x] Test both buttons open correctly
- [x] Verify styling consistency

### 🚧 Task 2: ProTime Persistence
- [ ] Search for ProTime hook/component usage
- [ ] Locate workday state management
- [ ] Add `saveProTimeData()` call after CSV upload
- [ ] Add `loadProTimeData()` call on app mount
- [ ] Test: Upload CSV → Refresh → Verify persistence
- [ ] Verify Set ↔ Array conversion works correctly

### ⏳ Task 3: HTML Export Hypo Icons
- [ ] Open `/src/storage/export.js`
- [ ] Find `generateDayProfileHTML()` function
- [ ] Locate hypo vertical line rendering code
- [ ] Replace with SVG circle icons
- [ ] Add L2 cross marker (×) for severe hypos
- [ ] Test export → Verify icons appear
- [ ] Test print compatibility (black/white)

### ⏳ Task 4A: On-Screen TDD Card
- [ ] Locate hero cards component
- [ ] Design 5-card grid layout (CSS)
- [ ] Create TDD card component
- [ ] Calculate TDD stats from `tddByDay`
- [ ] Format: `{mean} ± {sd} E`
- [ ] Test responsive layout
- [ ] Mobile breakpoint check

### ⏳ Task 4B: HTML Export TDD
- [ ] Open `/src/storage/export.js`
- [ ] Find min/max card generation
- [ ] Combine into single "BEREIK" card
- [ ] Add TDD card above it
- [ ] Source TDD from IndexedDB
- [ ] Test export → Verify TDD appears
- [ ] Test print layout

---

## 🗂️ FILES TO EDIT

### Completed
```
✅ /src/components/AGPGenerator.jsx     (Debug buttons)
```

### Pending Investigation
```
🔍 /src/hooks/useProTime.js            (if exists)
🔍 /src/components/ProTimePanel.jsx    (if exists)
```

### Pending Implementation
```
⏳ /src/storage/masterDatasetStorage.js  (ProTime save/load calls)
⏳ /src/storage/export.js                (Hypo icons + TDD card)
⏳ /src/components/AGPGenerator.jsx      (On-screen TDD card)
```

---

## 🐛 KNOWN ISSUES

### None Currently
All Priority 1 issues resolved. No blocking bugs.

---

## 🎯 NEXT SESSION PRIORITIES

1. **ProTime Persistence** - Critical for user experience
2. **HTML Export Improvements** - Hypo icons + TDD card
3. **On-Screen TDD Card** - Complete metrics dashboard

---

## 📝 NOTES & DECISIONS

### Design Philosophy
- **No emoji in production code** - Text labels only
- **Brutalist styling** - High contrast, borders, uppercase
- **Direct access** - Two separate buttons > dropdown menu
- **Print compatibility** - All visualizations work in black/white

### Technical Decisions
- Debug tools remain in `/public/debug/` (not moved to `/dist/`)
- No index.html landing page (direct links to tools)
- Text labels preferred over icon-only buttons
- Flex layout for button container (gap-based spacing)

---

## 🔧 SERVER COMMANDS

```bash
# Start dev server
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001

# Kill port if needed
lsof -ti:3001 | xargs kill -9

# Git operations (sequential, not chained)
git add .
git commit -m "message"
git push origin v3.0-dev
```

---

**END OF HANDOFF**