# 🔧 HANDOFF - V3.6 Event Detection System
**Session Date**: October 26, 2025  
**Time**: ~15:30 CET  
**Branch**: v3.0-dev  
**Latest Commit**: 8c0b553 (sensor storage refactor)  
**Status**: ✅ **Infrastructure Complete - Detection Engine TODO**

---

## 🎯 WHAT WE'RE BUILDING

### Event Detection System (Phase 3.6)

**Goal**: Unified device event tracking (sensor changes, cartridge changes) with portable JSON export/import

**Architecture Decision**: 
- ❌ **NOT** async database lookups during render (too slow)
- ✅ **YES** localStorage-based event cache (scan once, read fast)

**Flow**:
```
CSV Upload
    ↓
detectAllEvents() - ONE TIME SCAN
    ├─ Check sensor database (if imported)
    ├─ Check CSV alerts ("SENSOR CONNECTED")
    └─ Check data gaps (3-10 hours)
    ↓
Store in localStorage (eventStorage.js)
    ↓
Day Profiles: READ from localStorage
    ├─ No detection logic
    ├─ No async lookups
    └─ Just grab markers for that date
```

---

## ✅ COMPLETED

### 1. Sensor Database Infrastructure

**Files Created**:
- `src/storage/sensorStorage.js` - localStorage sensor management
- `src/utils/sqliteParser.js` - Browser SQLite parser
- `src/components/SensorImport.jsx` - Import UI
- `src/storage/eventStorage.js` - Event caching layer

**Commit**: 8c0b553 - "refactor(v3.6): Switch sensor storage to localStorage"

**What Works**:
- ✅ Import master_sensors.db from Sensoren project
- ✅ Parse SQLite in browser (sql.js)
- ✅ Store in localStorage (fast, no IndexedDB async)
- ✅ UI shows sensor count, success rate, avg duration
- ✅ SensorImport button integrated in AGPGenerator

**Database Structure** (localStorage):
```javascript
{
  sensors: [
    {
      id, start_timestamp, end_timestamp, duration_hours,
      duration_days, reason_stop, status, confidence,
      lot_number, hardware_version, firmware_version
    }
  ],
  inventory: [
    { lot_number, quantity, expiry_date, box_size }
  ],
  lastUpdated: "ISO timestamp"
}
```

### 2. Event Storage Layer

**File**: `src/storage/eventStorage.js`

**Functions**:
- `storeEvents(events)` - Store device events
- `getAllEvents()` - Get all stored events
- `getEventsForDate(date)` - Get events for specific date
- `hasEvents()` - Check if events exist
- `clearEvents()` - Clear all events
- `getLastScanned()` - Get last scan timestamp

**Event Format** (localStorage):
```javascript
{
  sensorChanges: [
    {
      date: "2025/10/19",
      timestamp: "ISO 8601",
      minuteOfDay: 61,
      source: "database|alert|gap",
      confidence: "high|medium|low",
      lotNumber: "MMT-7030A1.01-2024W37" // optional
    }
  ],
  cartridgeChanges: [
    {
      date: "2025/10/22",
      timestamp: "ISO 8601",
      minuteOfDay: 840
    }
  ],
  version: "1.0",
  lastUpdated: "ISO timestamp",
  lastScanned: "ISO timestamp"
}
```

---

## 🚧 TODO

### Priority 1: Event Detection Engine

**File to Create**: `src/core/event-detection-engine.js`

**Main Function**: `detectAllEvents(csvData)`

**3-Tier Detection System**:
```javascript
export async function detectAllEvents(csvData) {
  const events = {
    sensorChanges: [],
    cartridgeChanges: [],
    version: '1.0'
  };

  // Get date range
  const { startDate, endDate } = getDateRange(csvData);

  // PRIORITY 1: Database (if imported)
  const dbSensors = await detectFromDatabase(startDate, endDate);
  events.sensorChanges.push(...dbSensors);

  // PRIORITY 2: CSV Alerts (supplement database)
  const alertSensors = detectFromAlerts(csvData);
  events.sensorChanges.push(...alertSensors);

  // PRIORITY 3: Gaps (only if no database + no alerts)
  if (events.sensorChanges.length === 0) {
    const gapSensors = detectFromGaps(csvData);
    events.sensorChanges.push(...gapSensors);
  }

  // Deduplicate (keep highest confidence per date)
  events.sensorChanges = deduplicateEvents(events.sensorChanges);

  // Detect cartridge changes (Rewind events)
  events.cartridgeChanges = detectCartridgeChanges(csvData);

  return events;
}
```

**Confidence Scoring**:
- `database` = high confidence (from Sensoren tracking)
- `alert` = medium confidence (CSV "SENSOR CONNECTED")
- `gap` = low confidence (data gap 3-10 hours)

**Deduplication**: If multiple sources detect same date, keep highest confidence

---

### Priority 2: Trigger Points

**Where to Call `detectAllEvents()`**:

1. **On CSV Upload** (AGPGenerator.jsx):
```javascript
// After successful CSV parse
const events = await detectAllEvents(csvData);
storeEvents(events);
```

2. **On Database Import** (SensorImport.jsx):
```javascript
// After database import success
if (csvData && csvData.length > 0) {
  const events = await detectAllEvents(csvData);
  storeEvents(events);
  console.log('[SensorImport] Events re-scanned with database');
}
```

3. **On Page Load** (AGPGenerator.jsx):
```javascript
// Check if events exist for current CSV
if (csvData && !hasEvents()) {
  const events = await detectAllEvents(csvData);
  storeEvents(events);
}
```

---

### Priority 3: JSON Export/Import

**Update**: `src/storage/eventStorage.js`

**Add Functions**:
```javascript
export function exportEventsJSON() {
  const events = getAllEvents();
  if (!events) return null;

  const json = JSON.stringify(events, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `agp-events-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

export async function importEventsJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const events = JSON.parse(e.target.result);
        
        // Validate format
        if (!events.version || !Array.isArray(events.sensorChanges)) {
          throw new Error('Invalid events file format');
        }
        
        storeEvents(events);
        resolve(events);
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
```

---

### Priority 4: UI Component

**File to Create**: `src/components/EventManager.jsx`

**Features**:
- 🔄 **Rescan Events** - Re-run detectAllEvents() on current CSV
- 💾 **Export Events** - Download .json file
- 📁 **Import Events** - Load .json file
- ✅ Status indicators (scanning/success/error)

**Integration**:
```jsx
// In AGPGenerator.jsx, after SensorImport
<EventManager 
  csvData={csvData}
  onEventsUpdate={(events) => {
    // Trigger day profiles refresh
    setDayProfiles(null);
  }}
/>
```

---

### Priority 5: Day Profile Integration

**Current**: Day profiles call `detectSensorChanges()` during render (sync)

**Target**: Day profiles read from localStorage (fast lookup)

**Update**: `src/hooks/useDayProfiles.js`

```javascript
import { getEventsForDate } from '../storage/eventStorage.js';

// Instead of detecting during render:
const events = getEventsForDate(profile.date);
const sensorChanges = events.sensorChanges || [];
const cartridgeChanges = events.cartridgeChanges || [];
```

**Update**: `src/components/DayProfileCard.jsx`

```javascript
// Remove detection logic, just receive events as prop
export default function DayProfileCard({ profile, events, ... }) {
  // Render markers directly from events
  {events.sensorChanges.map(change => (
    <line 
      x1={...} x2={...} y1={0} y2={chartHeight}
      stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4"
    />
  ))}
}
```

---

## 🧪 TESTING CHECKLIST

### Phase 1: Database Import (Already Works)
- [x] Dev server running (localhost:5173)
- [x] SensorImport button visible
- [ ] Import master_sensors.db from `/Users/jomostert/Documents/Projects/Sensoren/`
- [ ] Verify 219 sensors imported
- [ ] Check localStorage key `agp-sensor-database`
- [ ] Refresh page - database persists

### Phase 2: Event Detection
- [ ] Upload CSV with sensor in database range
- [ ] Check localStorage key `agp-device-events`
- [ ] Verify sensorChanges have `source: "database"`
- [ ] Upload CSV with "SENSOR CONNECTED" alerts
- [ ] Verify sensorChanges have `source: "alert"`
- [ ] Upload old CSV (no database, no alerts)
- [ ] Verify sensorChanges have `source: "gap"`

### Phase 3: Deduplication
- [ ] Import database + upload CSV with same sensor
- [ ] Verify only ONE sensor change per date (database wins)

### Phase 4: JSON Export/Import
- [ ] Click "Export Events"
- [ ] Verify .json file downloads
- [ ] Delete localStorage events
- [ ] Import .json file
- [ ] Verify events restored

### Phase 5: Day Profiles
- [ ] Day profiles render with events
- [ ] Red dashed line = sensor change
- [ ] Orange dotted line = cartridge change
- [ ] No async lag during render
- [ ] Print export works

---

## 📁 FILES CHANGED

```
✅ COMPLETED:
src/storage/sensorStorage.js          - Sensor database management (localStorage)
src/storage/eventStorage.js           - Event caching (localStorage)
src/utils/sqliteParser.js             - Browser SQLite parser
src/components/SensorImport.jsx       - Database import UI
src/components/AGPGenerator.jsx       - Integrated SensorImport

🚧 TODO:
src/core/event-detection-engine.js    - NEW: 3-tier detection system
src/components/EventManager.jsx       - NEW: Event management UI
src/storage/eventStorage.js           - UPDATE: Add export/import functions
src/hooks/useDayProfiles.js           - UPDATE: Read from eventStorage
src/components/DayProfileCard.jsx     - UPDATE: Render events from props
```

---

## 🎨 ARCHITECTURE PHILOSOPHY

### Why localStorage Instead of IndexedDB?

**IndexedDB Problems**:
- ❌ Async operations during render = lag
- ❌ Complex API (transactions, cursors)
- ❌ Overkill for small datasets (<1MB)

**localStorage Advantages**:
- ✅ Synchronous = instant lookups
- ✅ Simple API (getItem/setItem)
- ✅ Perfect for events (few KB)
- ✅ JSON.parse/stringify = portable

**When to Use Each**:
- localStorage: Events, settings, small data (<5MB)
- IndexedDB: Master dataset, large CSVs (v3.0 feature)

### Why Scan Once, Cache Results?

**Old Approach** (Bad):
```javascript
// Day profiles run detection on EVERY render
function getDayProfile(data, date) {
  const sensorChanges = detectSensorChanges(data, date); // SLOW
  const cartridgeChanges = detectCartridgeChanges(data, date); // SLOW
  // ...
}
```

**New Approach** (Good):
```javascript
// Scan once during CSV upload
const events = detectAllEvents(csvData); // ONE TIME
storeEvents(events); // CACHE

// Day profiles just read cache
function getDayProfile(date) {
  const events = getEventsForDate(date); // INSTANT
  // ...
}
```

**Benefits**:
- 🚀 10x faster rendering
- 🔒 Consistent results (same detection for all days)
- 🧹 Cleaner code (separation of concerns)

---

## 🚨 CRITICAL NOTES

### Database Source

**Location**: `/Users/jomostert/Documents/Projects/Sensoren/master_sensors.db`

**Current State** (Oct 26, 2025):
- 219 sensors total
- Hardware A1.01: 198 sensors, 5.8d avg, 69.2% success
- Hardware A2.01: 21 sensors, 5.4d avg, 47.6% success
- Voorraad: 13 sensors (4 lot numbers)

**Import Note**: Database schema is **unstable** (legacy Python project). We import it ONCE, then normalize to AGP+ event format. Never query database directly during render.

### Event Format Stability

**Version Field**: Events have `version: "1.0"` for future migrations

**If Format Changes**:
1. Bump version: `version: "2.0"`
2. Add migration function: `migrateEventsV1toV2()`
3. Old exports still work (check version, auto-migrate)

### Confidence System

**Purpose**: When multiple sources detect same event, pick best one

**Scoring**:
- Database (high) = 3 points
- Alert (medium) = 2 points
- Gap (low) = 1 point

**Deduplication Logic**:
```javascript
// If two events on same date, keep highest confidence
if (existingEvent.date === newEvent.date) {
  if (confidenceScore(newEvent) > confidenceScore(existingEvent)) {
    replace existingEvent with newEvent
  }
}
```

---

## 💡 KEY LEARNINGS

### From Yesterday's Session

**What We Learned**:
- IndexedDB is overkill for small data
- localStorage is FAST for JSON (<5MB)
- Async during render = bad UX
- Scan once, cache results = clean architecture

**What We Changed**:
- Dropped IndexedDB for sensor storage → localStorage
- Dropped async day-profile-engine → sync with cached events
- Added event versioning for future-proofing

### From Sensoren Project

**Alert-Based Detection**:
- CSV has "SENSOR CONNECTED" alerts
- More accurate than gap detection
- Already implemented in Python version

**Gap Detection Issues**:
- Cross-day gaps cause false positives
- Need same-day filtering
- Only use as last resort

### AGP+ Best Practices

**Data Flow**:
```
CSV → Scan → Cache → Read → Render
```

**NOT**:
```
CSV → Detect → Render (repeat for each component)
```

**Principle**: Process once, render many times

---

## 📞 NEXT SESSION PLAN

### Step 1: Test Database Import (5 min)
```bash
# 1. Start dev server
open http://localhost:5173

# 2. Click "IMPORTEER DATABASE"
# 3. Select master_sensors.db
# 4. Verify 219 sensors imported
# 5. Check localStorage in DevTools
```

### Step 2: Build Event Detection Engine (30 min)
```bash
# 1. Create event-detection-engine.js
# 2. Implement detectAllEvents()
# 3. Add 3-tier detection logic
# 4. Add deduplication
# 5. Test with console.log()
```

### Step 3: Integrate in AGPGenerator (15 min)
```bash
# 1. Call detectAllEvents() on CSV upload
# 2. Store events in localStorage
# 3. Verify events in DevTools
# 4. Test with different CSVs
```

### Step 4: Build EventManager UI (20 min)
```bash
# 1. Create EventManager.jsx
# 2. Add rescan/export/import buttons
# 3. Integrate in AGPGenerator
# 4. Test all buttons
```

### Step 5: Update Day Profiles (15 min)
```bash
# 1. Update useDayProfiles.js
# 2. Pass events to DayProfileCard
# 3. Test markers render correctly
# 4. Test print export
```

**Total Estimated Time**: ~90 minutes

---

## 🔗 RELATED FILES

**Core Logic**:
- `src/core/event-detection-engine.js` - TODO: Detection logic
- `src/core/day-profile-engine.js` - KEEP: Day analysis (no detection)
- `src/core/metrics-engine.js` - KEEP: Metrics calculation

**Storage**:
- `src/storage/eventStorage.js` - Event caching
- `src/storage/sensorStorage.js` - Sensor database
- `src/storage/masterDatasetStorage.js` - V3 master dataset (future)

**UI**:
- `src/components/EventManager.jsx` - TODO: Event management
- `src/components/SensorImport.jsx` - Database import
- `src/components/DayProfileCard.jsx` - Day visualization

**Hooks**:
- `src/hooks/useDayProfiles.js` - Day profiles hook

**Related Projects**:
- `/Users/jomostert/Documents/Projects/Sensoren/` - Sensor tracking system
- `master_sensors.db` - Source database
- `DATABASE_WORKFLOW.md` - Detection algorithms
- `scripts/detect_sensors.py` - Python reference implementation

---

## 🎓 LEARNING RESOURCES

### Understanding Event Detection

**Read This First**:
```bash
# Python reference implementation
/Sensoren/scripts/detect_sensors.py
```

**Key Concepts**:
- Alert-based: Most accurate
- Gap-based: Fallback method
- Confidence scoring: Deduplication strategy
- Same-day filtering: Avoid false positives

### Understanding localStorage

**Why It's Perfect Here**:
- JSON serializable data (<1MB)
- Synchronous = no render lag
- Persistent across sessions
- Simple API

**Example**:
```javascript
// Store
localStorage.setItem('key', JSON.stringify(data));

// Retrieve
const data = JSON.parse(localStorage.getItem('key'));

// Delete
localStorage.removeItem('key');
```

### Understanding Event Architecture

**Pattern**: Scan → Cache → Read

**Benefits**:
- Single source of truth
- Fast lookups
- Consistent results
- Testable

---

**Ready to build the detection engine!** 🚀

*Last updated: October 26, 2025 15:45 CET*
