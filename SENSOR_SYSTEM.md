# 🔬 SENSOR SYSTEM - AGP+ v3.8.2

**Purpose:** Understanding sensor tracking and visualization (Phase 2 work)  
**Read Time:** 8 minutes  
**Prerequisites:** Read `ARCHITECTURE.md` first

---

## 🎯 WHAT IS THE SENSOR SYSTEM?

AGP+ tracks **Guardian 4 sensors** from an external SQLite database:
- 219 sensors spanning 2022-2025
- Import via SQLite file upload
- Visualization as red dashed lines in day profiles
- Metadata: lot numbers, duration, failure reasons

**Why it matters:**
- Correlate glucose patterns with sensor changes
- Identify failing sensors or lots
- Track sensor longevity
- Clinical decision support

---

## 🗄️ SENSOR DATABASE SCHEMA

### localStorage Structure

```javascript
Key: "agp-sensor-database"

Value: {
  sensors: [
    {
      id: 1,                              // Sequential ID
      start_timestamp: "2025-10-19 01:01:07",  // When inserted
      end_timestamp: "2025-10-26 05:30:00",     // When removed
      duration_hours: 172.5,              // 7.2 days
      duration_days: 7.2,                 // Calculated
      reason_stop: "expired",             // Why removed
      status: "success",                  // Overall result
      confidence: "high",                 // Data quality
      lot_number: "B0425",                // Manufacturing batch
      hardware_version: "Guardian 4",     // Sensor model
      notes: "Normal wear"                // Free text
    },
    // ... 219 total
  ],
  inventory: [],                          // Unused sensors
  dateRange: {
    min: "2022-03-15",                   // Earliest sensor
    max: "2025-10-19"                    // Most recent
  },
  lastUpdated: "2025-10-27T08:45:00Z"
}
```

### Field Definitions

**Timestamps:**
- `start_timestamp`: ISO-ish format "YYYY-MM-DD HH:MM:SS"
- Timezone: Implicitly local (no Z suffix)
- Used for day profile detection

**Duration:**
- `duration_hours`: Exact hours from start to end
- `duration_days`: `duration_hours / 24` (decimal)
- Typical: 6-7 days for Guardian 4

**reason_stop:**
- `"expired"`: Normal 7-day lifecycle
- `"failed"`: Premature failure (sensor error)
- `"pulled_early"`: User removed before expiry

**status:**
- `"success"`: Completed full lifecycle
- `"failure"`: Did not complete lifecycle
- `"unknown"`: Insufficient data

**confidence:**
- `"high"`: From master database (ground truth)
- `"medium"`: From CSV alerts (indirect evidence)
- `"low"`: From gap detection (inference)

---

## 🔄 DATA FLOW: IMPORT → VISUALIZATION

### Phase 2A: SQLite Import

```
User uploads master_sensors.db
    ↓
┌──────────────────────────────────────┐
│ SensorImport.jsx                     │
│ - File picker (<input type="file">) │
│ - handleFileSelect(event)            │
└─────────────┬────────────────────────┘
              │ calls
              ▼
┌──────────────────────────────────────┐
│ sensorImport.js                      │
│ - importSensorsFromFile(file)       │
│   1. Read file as ArrayBuffer       │
│   2. Initialize sql.js WebAssembly  │
│   3. Open SQLite database           │
│   4. Query: SELECT * FROM sensors   │
│   5. Parse rows to objects          │
│   6. Transform snake_case → camelCase│
└─────────────┬────────────────────────┘
              │ returns
              ▼
        Array of sensor objects
        [{ id, start_timestamp, ... }]
              │
              ▼
┌──────────────────────────────────────┐
│ sensorStorage.js                     │
│ - importSensorDatabase(data)        │
│   1. Wrap in { sensors, inventory } │
│   2. Add dateRange metadata         │
│   3. Add lastUpdated timestamp      │
│   4. localStorage.setItem()         │
└─────────────┬────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│ localStorage                         │
│ key: "agp-sensor-database"          │
│ ~20KB for 219 sensors               │
└──────────────────────────────────────┘
```

**Key Implementation:**

```javascript
// sensorImport.js
export async function importSensorsFromFile(file) {
  const SQL = await initSqlJs({ /* CDN config */ });
  const buffer = await file.arrayBuffer();
  const db = new SQL.Database(new Uint8Array(buffer));
  
  const result = db.exec('SELECT * FROM sensors');
  const sensors = result[0].values.map(row => ({
    id: row[0],
    start_timestamp: row[1],
    end_timestamp: row[2],
    // ... map all columns
  }));
  
  db.close();
  return sensors;
}

// sensorStorage.js
export function importSensorDatabase(sensors) {
  const database = {
    sensors,
    inventory: [],
    dateRange: calculateDateRange(sensors),
    lastUpdated: new Date().toISOString()
  };
  
  localStorage.setItem('agp-sensor-database', JSON.stringify(database));
}
```

### Phase 2B: Visualization

```
Day profiles requested
    ↓
┌──────────────────────────────────────┐
│ useDayProfiles (Hook)                │
│ - getLastSevenDays(csvData, date)   │
└─────────────┬────────────────────────┘
              │ calls
              ▼
┌──────────────────────────────────────┐
│ day-profile-engine.js                │
│ - getDayProfile(data, date)          │
│   For each date:                     │
│   1. Calculate metrics               │
│   2. Detect events                   │
│   3. Generate curve                  │
│   4. Detect sensor changes ← HERE!   │
└─────────────┬────────────────────────┘
              │ calls
              ▼
┌──────────────────────────────────────┐
│ detectSensorChanges(allData, date)  │
│                                      │
│ PRIORITY 1: Database Detection       │
│ ├─ getSensorDatabase()              │
│ ├─ Filter by target date            │
│ └─ Return exact timestamps          │
│       ↓ (if found)                  │
│    Return high-confidence changes    │
│                                      │
│ FALLBACK: Gap Detection              │
│ ├─ Find 3-10 hour data gaps         │
│ └─ Return medium-confidence changes  │
└─────────────┬────────────────────────┘
              │ returns
              ▼
    sensorChanges: [
      {
        timestamp: Date,
        minuteOfDay: 61,      // 01:01 = 61 minutes
        type: 'start',
        confidence: 'high',
        source: 'database',
        metadata: { 
          lotNumber: 'B0425',
          duration: 7.2
        }
      }
    ]
              │
              ▼
┌──────────────────────────────────────┐
│ DayProfileCard.jsx (Component)       │
│ - Receives profile.sensorChanges     │
│ - Maps to SVG <line> elements        │
│   {sensorChanges                     │
│     .filter(c => c.type === 'start') │
│     .map((change, i) => (            │
│       <line                          │
│         x1={x} y1={0}                │
│         x2={x} y2={height}           │
│         stroke="#dc2626"             │
│         strokeWidth="2"              │
│         strokeDasharray="4,4"        │
│       />                             │
│     ))                               │
│   }                                  │
└──────────────────────────────────────┘
              │
              ▼
    Visual result: Red dashed line at sensor change time
```

---

## 🔍 DETECTION LOGIC

### Two-Tier Detection System

**Tier 1: Database (High Confidence)**
```javascript
function detectSensorChanges(allData, targetDate) {
  const allChanges = [];
  
  try {
    // Get sensor database from localStorage
    const { getSensorDatabase } = require('../storage/sensorStorage.js');
    const sensorDb = getSensorDatabase();
    
    if (sensorDb && sensorDb.sensors) {
      // Parse target date boundaries
      const targetDateObj = parseDate(targetDate, '00:00:00');
      const nextDayObj = new Date(targetDateObj);
      nextDayObj.setDate(nextDayObj.getDate() + 1);
      
      // Find sensors that started on target date
      for (const sensor of sensorDb.sensors) {
        const sensorStart = new Date(sensor.start_timestamp);
        
        // Check if within this day
        if (sensorStart >= targetDateObj && sensorStart < nextDayObj) {
          const minuteOfDay = sensorStart.getHours() * 60 + sensorStart.getMinutes();
          
          // Skip midnight (day boundary artifact)
          if (minuteOfDay === 0) continue;
          
          allChanges.push({
            timestamp: sensorStart,
            date: targetDate,
            minuteOfDay,
            type: 'start',
            confidence: 'high',        // ← Database = high confidence
            source: 'database',
            metadata: {
              lotNumber: sensor.lot_number,
              duration: sensor.duration_days
            }
          });
        }
      }
      
      // If found database matches, return them
      if (allChanges.length > 0) {
        return allChanges;
      }
    }
  } catch (err) {
    // Database not available, fall through
  }
  
  // FALLBACK: Gap detection continues below...
}
```

**Why this order?**
- Database timestamps are **exact** (±0 minutes)
- Gap detection is **approximate** (±30 minutes)
- Database includes metadata (lot number, duration)
- Prioritize accuracy over inference

**Tier 2: Gap Detection (Medium Confidence)**
```javascript
  // Fallback if no database match
  const dayData = allData.filter(row => row.date === targetDate);
  const sorted = [...dayData].sort((a, b) => 
    parseDate(a.date, a.time) - parseDate(b.date, b.time)
  );
  
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseDate(sorted[i - 1].date, sorted[i - 1].time);
    const curr = parseDate(sorted[i].date, sorted[i].time);
    const gapMinutes = (curr - prev) / 60000;
    
    if (gapMinutes > 30) {
      gaps.push({ prev, curr, gapMinutes });
    }
  }
  
  // Filter for sensor change gaps: 3-10 hours
  const majorGaps = gaps.filter(g => g.gapMinutes > 180 && g.gapMinutes < 600);
  
  for (const gap of majorGaps) {
    const minuteOfDay = gap.prev.getHours() * 60 + gap.prev.getMinutes();
    if (minuteOfDay === 0) continue;  // Skip midnight
    
    allChanges.push({
      timestamp: gap.prev,
      date: targetDate,
      minuteOfDay,
      gapMinutes: Math.round(gap.gapMinutes),
      type: 'start',
      confidence: 'medium',      // ← Gap = medium confidence
      source: 'gap'
    });
  }
  
  return allChanges;
```

**Gap detection thresholds:**
- `> 180 min` (3 hours): Minimum for sensor change
  - Includes 2h warmup + placement time
  - Excludes brief dropouts or calibrations
- `< 600 min` (10 hours): Maximum realistic duration
  - Excludes overnight gaps or multi-day absences
  - Prevents false positives from sensor failures

---

## 🎨 VISUALIZATION SPECS

### Visual Design (Brutalist)

**Sensor Change Line:**
```
Color: #dc2626 (clinical red)
Width: 2px
Pattern: dashed (4px dash, 4px gap)
Height: Full chart height (0 to chartHeight)
Opacity: 1.0 (full visibility)
Position: Exact sensor start time
```

**Label:**
```
Text: "SENSOR VERVANGEN"
Font: Courier New, monospace
Size: 10px
Color: #dc2626 (matches line)
Position: Above line, +5px offset
Weight: Bold
```

**SVG Implementation:**
```jsx
{sensorChanges
  .filter(c => c.type === 'start')  // Only show start markers
  .map((change, i) => (
    <g key={`sensor-start-${i}`}>
      {/* Vertical line */}
      <line
        x1={xScale(change.minuteOfDay / 5)}  // Convert to 5-min bins
        y1={0}
        x2={xScale(change.minuteOfDay / 5)}
        y2={chartHeight}
        stroke="#dc2626"
        strokeWidth={2}
        strokeDasharray="4,4"
      />
      
      {/* Label */}
      <text
        x={xScale(change.minuteOfDay / 5) + 5}
        y={15}
        fontSize="10"
        fontFamily="Courier New, monospace"
        fill="#dc2626"
        fontWeight="bold"
      >
        SENSOR VERVANGEN
      </text>
    </g>
  ))
}
```

### Why Only 'start' Type?

**Design Decision:** Mark sensor **start** only, not end.

**Rationale:**
- Gap in glucose curve already shows sensor offline
- End marker would be redundant visual noise
- Start = actionable information (new sensor inserted)
- Keeps chart clean and scannable

**Exception:** Could add 'end' markers if user requests or clinical need identified.

---

## 📊 SENSOR STATISTICS

### Current Dataset (as of v3.8.2)

**Total Sensors:** 219  
**Date Range:** 2022-03-15 → 2025-10-19  
**Average Duration:** ~7 days (Guardian 4 spec)  
**Storage Size:** ~20KB in localStorage

**Breakdown by status:**
```javascript
// In browser console:
const db = JSON.parse(localStorage.getItem('agp-sensor-database'));
const byStatus = db.sensors.reduce((acc, s) => {
  acc[s.status] = (acc[s.status] || 0) + 1;
  return acc;
}, {});
console.log(byStatus);

// Example output:
// { success: 195, failure: 18, unknown: 6 }
```

**Breakdown by reason:**
```javascript
const byReason = db.sensors.reduce((acc, s) => {
  acc[s.reason_stop] = (acc[s.reason_stop] || 0) + 1;
  return acc;
}, {});
console.log(byReason);

// Example output:
// { expired: 195, failed: 18, pulled_early: 6 }
```

### Querying Sensor Data

**Get active sensor for date:**
```javascript
import { getSensorAtDate } from './storage/sensorStorage';

const sensor = getSensorAtDate('2025-10-20');
if (sensor) {
  console.log('Active sensor:', sensor.lot_number);
  console.log('Inserted:', sensor.start_timestamp);
  console.log('Days worn:', sensor.duration_days);
}
```

**Get sensors in range:**
```javascript
import { getSensorsInRange } from './storage/sensorStorage';

const sensors = getSensorsInRange('2025-10-01', '2025-10-31');
console.log('October sensors:', sensors.length);
sensors.forEach(s => {
  console.log(`${s.start_timestamp} - Lot ${s.lot_number}`);
});
```

---

## 🧪 TESTING SENSOR SYSTEM

### Manual Testing Checklist

**Phase 2A (Import):**
- [ ] Upload master_sensors.db file
- [ ] Success alert appears
- [ ] Stats show "219 sensors"
- [ ] Date range: "2022-03-15 → 2025-10-19"
- [ ] localStorage has sensor data
- [ ] Can re-import (updates database)

**Phase 2B (Visualization):**
- [ ] Open day profiles
- [ ] Red dashed line appears on Oct 19
- [ ] Label "SENSOR VERVANGEN" visible
- [ ] Line spans full chart height
- [ ] Other days have no lines (correct)
- [ ] Print preview shows line (B&W compatible)

### Console Debugging

**Check import:**
```javascript
// After import, in browser console:
const db = JSON.parse(localStorage.getItem('agp-sensor-database'));
console.log('Sensors:', db.sensors.length);
console.log('Date range:', db.dateRange);
console.log('Sample sensor:', db.sensors[0]);
```

**Check detection:**
```javascript
// In day-profile-engine.js detectSensorChanges(), add temporarily:
console.log('[detectSensorChanges] Date:', targetDate);
console.log('[detectSensorChanges] Changes found:', allChanges.length);
console.log('[detectSensorChanges] Sample:', allChanges[0]);
```

**Check rendering:**
```javascript
// In DayProfileCard.jsx, add temporarily:
console.log('[DayProfileCard] Rendering day:', date);
console.log('[DayProfileCard] Sensor changes:', sensorChanges);
```

### Browser Storage Inspection

**Chrome DevTools:**
1. F12 → Application tab
2. localStorage → agp-sensor-database
3. Should show JSON with 219 sensors
4. IndexedDB → agp-plus-db
5. Should show months, events, metadata stores

---

## 🔮 FUTURE ENHANCEMENTS (Phase 2C)

### Sensor Overview Dashboard

**Planned Features:**
- Statistics table (all 219 sensors)
- Success rate by hardware version
- Average duration metrics
- Failure reason analysis
- Lot number tracking
- Sensor longevity trends

**Why Deferred:**
- Phase 2A+2B provide core functionality
- Overview is nice-to-have analysis tool
- Not blocking other development

**Implementation Notes:**
```jsx
// Future component structure
function SensorDashboard() {
  const sensors = useSensorDatabase();
  const stats = calculateSensorStats(sensors);
  
  return (
    <div className="sensor-dashboard">
      <SensorStatsTable stats={stats} />
      <SensorTimeline sensors={sensors} />
      <FailureAnalysis sensors={sensors} />
    </div>
  );
}
```

### Enhanced Detection

**Potential Improvements:**
1. **CSV Alert Parsing:**
   - Parse "Sensor Changed" alerts from CSV
   - Medium confidence tier between database and gaps
   - Extract from Alert column if available

2. **Cross-Day Gap Detection:**
   - Currently only detects gaps within single day
   - Could detect sensor changes at day boundaries
   - Requires multi-day scan (slower but more accurate)

3. **Confidence Scoring:**
   - Combine multiple signals (database + CSV + gap)
   - Weighted confidence score (0-100%)
   - Display confidence level in UI

---

## 🔗 RELATED FILES

**Storage:**
- `src/storage/sensorStorage.js` - localStorage operations
- `src/storage/sensorImport.js` - SQLite parsing

**Detection:**
- `src/core/day-profile-engine.js` - detectSensorChanges()

**UI:**
- `src/components/SensorImport.jsx` - Upload component
- `src/components/DayProfileCard.jsx` - Visualization

**Documentation:**
- `PHASE_2_COMPLETE.md` - Phase 2 summary
- `HANDOFF_PHASE2B_VISUALIZATION.md` - Implementation details

---

## 📚 DEEP DIVE REFERENCES

**For complete Phase 2 details:**
→ `PHASE_2_COMPLETE.md`

**For visualization implementation:**
→ `HANDOFF_PHASE2B_VISUALIZATION.md`

**For architecture context:**
→ `ARCHITECTURE.md` (storage systems)

**For development patterns:**
→ `DEVELOPMENT.md` (testing, debugging)

---

**Ready to work on sensors?**  
Import → Detection → Visualization pipeline is complete and tested! ✅
