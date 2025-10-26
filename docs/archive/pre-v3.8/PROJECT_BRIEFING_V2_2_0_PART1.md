# AGP+ PROJECT BRIEFING V2.2.0 - PART 1

**Version:** 2.2.0 - Day Profiles Edition  
**Last Updated:** October 24, 2025  
**Status:** Production Ready

---

## EXECUTIVE SUMMARY

AGP+ is a web-based glucose analysis tool that processes Medtronic CareLink CSV exports to generate comprehensive Ambulatory Glucose Profile reports. Version 2.2.0 introduces individual day profile analysis with adaptive visualization.

**Core Capabilities:**
- CSV upload and parsing (Medtronic CareLink format)
- AGP curve generation (5th, 25th, 50th, 75th, 95th percentiles)
- Time In Range metrics (TIR/TAR/TBR, GMI, CV, MAGE, MODD, GRI)
- Event detection (hypoglycemia, hyperglycemia, sensor/cartridge changes)
- Day/Night and Workday/Rest day analysis
- **[NEW v2.2]** Individual day profiles (last 7 days visualization)
- **[NEW v2.2]** Achievement badges (Perfect Day, Zen Master)
- HTML export for printing (A4, B/W optimized)
- Upload storage (IndexedDB persistence)
- Patient metadata management

**Tech Stack:**
- React 18 + Vite
- No backend - pure client-side processing
- IndexedDB for data persistence
- Brutalist design system (3px borders, monospace, grid layouts)

---

## VERSION HISTORY

### v2.2.0 (October 24, 2025) - Day Profiles Edition
**New Features:**
- Individual day profile cards with 24h glucose curves
- Last 7 days visualization in full-screen modal
- Achievement badge system (Perfect Day, Zen Master, You Slay Queen)
- Adaptive Y-axis per day (zooms to relevant range)
- AGP median reference overlay on daily curves
- Sensor and cartridge change markers
- Print-optimized HTML export for day profiles (2 pages max)

**Technical Changes:**
- New `day-profile-engine.js` for day-level analysis
- New `DayProfileCard.jsx` component (single day viz)
- New `DayProfilesModal.jsx` component (7-day overlay)
- New `day-profiles-exporter.js` for HTML generation
- Sensor change detection refined (only mark stop point)
- Cartridge change detection added (Rewind events)
- Legend updates (red dashed = sensor, orange dotted = cartridge)

---

## CRITICAL: ADAPTIVE Y-AXIS ALGORITHM

### The Problem
Fixed Y-axis (40-400 mg/dL) wastes space and loses detail. Different days have different ranges.

### The Solution

**Implemented in:**
- `DayProfileCard.jsx` (lines ~200-230)
- `day-profiles-exporter.js` (lines ~18-37)
- `html-exporter.js` (lines ~18-50)

**Core Algorithm:**

```javascript
function calculateDynamicYRange(glucoseData) {
  // 1. Extract valid glucose readings
  const validGlucose = glucoseData
    .filter(d => d.hasData && d.glucose !== null)
    .map(d => d.glucose);
  
  if (validGlucose.length === 0) {
    // Fallback to clinical range
    return { yMin: 54, yMax: 250 };
  }
  
  // 2. Find actual data range
  const dataMin = Math.min(...validGlucose);
  const dataMax = Math.max(...validGlucose);
  const dataRange = dataMax - dataMin;
  
  // 3. Calculate smart padding
  // More zoom for tight ranges, less for wide ranges
  const padding_buffer = 
    dataRange < 100 ? 30 :   // Tight control → +30 mg/dL padding
    dataRange < 150 ? 20 :   // Moderate → +20 mg/dL
    15;                      // Wide → +15 mg/dL
  
  // 4. Set adaptive range
  // Start with clinical range (54-250), expand if needed
  const yMin = Math.max(40, Math.min(54, dataMin - padding_buffer));
  const yMax = Math.min(400, Math.max(250, dataMax + padding_buffer));
  
  return { yMin, yMax };
}
```

**Key Principles:**

1. **Clinical Range First** (54-250 mg/dL)
   - Default starting point for Y-axis
   - Covers target range (70-180) with buffer

2. **Expand Only If Needed**
   - If data goes below 54 → extend down (min 40)
   - If data goes above 250 → extend up (max 400)

3. **Never Exceed Physiological Limits**
   - Hard floor: 40 mg/dL
   - Hard ceiling: 400 mg/dL

4. **Smart Padding**
   - Tight glycemic control (range <100): +30 padding = more zoom
   - Moderate (range 100-150): +20 padding
   - Wide variability (range >150): +15 padding = less zoom

**Smart Tick Generation:**

```javascript
function calculateYTicks(yMin, yMax) {
  const range = yMax - yMin;
  const idealTickCount = 5;
  const roughStep = range / idealTickCount;
  
  // Round to nice numbers
  let step;
  if (roughStep <= 25) step = 20;
  else if (roughStep <= 40) step = 25;
  else if (roughStep <= 60) step = 40;
  else step = 50;
  
  const ticks = [];
  const startTick = Math.ceil(yMin / step) * step;
  
  // Generate regular ticks
  for (let tick = startTick; tick <= yMax; tick += step) {
    ticks.push(tick);
  }
  
  // ALWAYS include 70 and 180 if in range
  const CRITICAL_TICKS = [70, 180];
  const MIN_SPACING = 15; // Minimum 15 mg/dL between ticks
  
  for (const critical of CRITICAL_TICKS) {
    if (yMin <= critical && yMax >= critical) {
      // Check if any tick is too close to critical value
      const hasConflict = ticks.some(t => 
        t !== critical && Math.abs(t - critical) < MIN_SPACING
      );
      
      if (hasConflict) {
        // Remove conflicting ticks, keep critical ones
        const filtered = ticks.filter(t => 
          Math.abs(t - critical) >= MIN_SPACING
        );
        ticks.length = 0;
        ticks.push(...filtered, critical);
      } else if (!ticks.includes(critical)) {
        ticks.push(critical);
      }
    }
  }
  
  return ticks.sort((a, b) => a - b);
}
```

**Why 70 and 180?**
- 70 mg/dL = lower bound of target range (TIR starts here)
- 180 mg/dL = upper bound of target range (TIR ends here)
- These are ALWAYS critical thresholds in diabetes management

**Examples:**

| Day Type | Data Range | Y-Axis Range | Padding | Result |
|----------|------------|--------------|---------|--------|
| Tight control | 65-130 | 54-160 | +30 | Zoomed in, shows detail |
| Normal | 55-200 | 54-220 | +20 | Balanced view |
| Variable | 45-280 | 40-295 | +15 | Zoomed out, full picture |
| Extreme hypo | 35-180 | 40-200 | +20 | Floor at 40, shows severity |
| Extreme hyper | 70-380 | 54-395 | +15 | Ceiling at 400, shows severity |

**Consistency:**
- Same algorithm used for:
  - On-screen day profiles (`DayProfileCard.jsx`)
  - HTML export day profiles (`day-profiles-exporter.js`)
  - Main AGP chart (`html-exporter.js`)
- Ensures visual consistency across all views

---

## ARCHITECTURE OVERVIEW

### Component Hierarchy

```
AGPGenerator (main container)
├── PatientInfo Modal
├── FileUpload
│   ├── CSVUploadButton
│   ├── ProTimeButton
│   └── ProTimeModal
├── SavedUploadsList
│   └── UploadCard (×N)
├── PeriodSelector
├── MetricsDisplay
│   └── MetricCard (×8)
├── AGPChart
│   ├── GridLines
│   ├── TargetLines
│   ├── AGP Bands (p5-95, p25-75)
│   ├── Median Line
│   └── EventMarkers
├── ComparisonView
├── DayNightSplit
├── WorkdaySplit
└── DayProfilesModal [NEW v2.2]
    └── DayProfileCard (×7) [NEW v2.2]
        ├── GlucoseCurve24h
        ├── TIRBar
        └── MetricBox (×5)
```

### Data Flow

```
1. CSV UPLOAD
   ├─ User selects file
   ├─ FileUpload component
   └─ useCSVData hook

2. PARSING
   ├─ parseCSV() → csvData array
   ├─ parseCSVMetadata() → patient info
   └─ detectDateRange() → min/max dates

3. STORAGE (optional)
   ├─ User clicks "Save Upload"
   ├─ useUploadStorage hook
   └─ IndexedDB persistence

4. PERIOD SELECTION
   ├─ User picks dates or preset
   └─ AGPGenerator state: { startDate, endDate }

5. METRICS CALCULATION
   ├─ useMetrics hook triggered
   ├─ calculateMetrics() → TIR/TAR/TBR/GMI/CV/etc
   ├─ calculateAGP() → percentile bands
   └─ detectEvents() → hypo/hyper events

6. DAY PROFILES [NEW v2.2]
   ├─ getDayProfiles() → last 7 days
   ├─ For each day:
   │   ├─ calculateMetrics()
   │   ├─ generate24HourCurve()
   │   ├─ detectEvents()
   │   ├─ detectSensorChanges()
   │   ├─ detectCartridgeChanges()
   │   └─ detectBadges()
   └─ Return array of 7 profile objects

7. RENDERING
   ├─ AGPGenerator passes props to children
   ├─ Each component renders its piece
   └─ No component calculates data (pure presentation)

8. EXPORT
   ├─ HTML button → generateHTML()
   ├─ Day Profiles Print → downloadDayProfilesHTML()
   └─ Standalone HTML files generated
```

---

## DATA STRUCTURES

### CSV Row (parsed)

```javascript
{
  date: "2025/10/18",           // YYYY/MM/DD
  time: "14:30:15",             // HH:MM:SS
  glucose: 145,                 // mg/dL (column 34)
  bolus: 2.5,                   // units (column 20)
  carbRatio: 9.5,               // g/U (column 22)
  bgReading: 152,               // fingerstick (column 18)
  carbs: 40,                    // grams (column 27)
  rewind: false,                // boolean (cartridge change)
  // ... other fields
}
```

### Day Profile Object

```javascript
{
  date: "2025/10/18",
  dateObj: Date object,
  dayOfWeek: "Vrijdag",
  
  metrics: {
    tir: "78",                  // percentage
    tar: "15",
    tbr: "7",
    mean: "142",                // mg/dL
    sd: "45",
    cv: "32",                   // percentage
    gmi: "6.9"                  // %
  },
  
  curve: [                      // 288 bins (5-min intervals)
    {
      bin: 0,                   // 0-287
      time: "00:00",
      glucose: 125,
      hasData: true
    },
    // ... 287 more
  ],
  
  events: {
    hypoL2: {
      count: 1,
      events: [
        {
          startTime: Date,
          endTime: Date,
          duration: 25,         // minutes
          startGlucose: 48,
          minGlucose: 45,
          minuteOfDay: 720      // for plotting
        }
      ]
    },
    hypoL1: { count: 2, events: [...] },
    hyper: { count: 0, events: [] }
  },
  
  sensorChanges: [
    {
      timestamp: Date,
      date: "2025/10/18",
      minuteOfDay: 1375,        // 22:55
      gapMinutes: 148,
      type: "start"             // or "end"
    }
  ],
  
  cartridgeChanges: [
    {
      timestamp: Date,
      minuteOfDay: 532          // 08:52
    }
  ],
  
  badges: [
    {
      id: "perfect_day",
      emoji: "🏆",
      name: "Perfect Day",
      description: "99.7% TIR"
    }
  ],
  
  readingCount: 275,            // actual readings for this day
  agpCurve: [...]               // AGP median from full period (for overlay)
}
```

---

## EVENT DETECTION ALGORITHMS

### Hypoglycemia Level 2 (< 54 mg/dL)

```javascript
function detectHypoL2(data) {
  const THRESHOLD = 54;
  const MIN_DURATION_MINUTES = 15;  // 3 consecutive 5-min readings
  
  const events = [];
  let inEvent = false;
  let eventStart = null;
  let eventReadings = [];
  
  for (const reading of data) {
    if (reading.glucose < THRESHOLD) {
      if (!inEvent) {
        // Start new event
        inEvent = true;
        eventStart = reading;
        eventReadings = [reading];
      } else {
        // Continue event
        eventReadings.push(reading);
      }
    } else {
      if (inEvent) {
        // Event ended - check duration
        const duration = eventReadings.length * 5;
        if (duration >= MIN_DURATION_MINUTES) {
          events.push({
            startTime: eventStart.timestamp,
            endTime: eventReadings[eventReadings.length - 1].timestamp,
            duration,
            startGlucose: eventStart.glucose,
            minGlucose: Math.min(...eventReadings.map(r => r.glucose)),
            minuteOfDay: getMinuteOfDay(eventStart.timestamp)
          });
        }
        // Reset
        inEvent = false;
        eventStart = null;
        eventReadings = [];
      }
    }
  }
  
  return events;
}
```

### Hypoglycemia Level 1 (54-70 mg/dL)

Same logic as L2, but threshold is 54-70 range and reading must be ≥54.

### Hyperglycemia (> 250 mg/dL)

```javascript
function detectHyper(data) {
  const THRESHOLD = 250;
  const MIN_DURATION_MINUTES = 120;  // 24 consecutive 5-min readings
  
  // Same structure as hypo detection
  // But requires 120 minutes sustained
}
```

### Sensor Change Detection

```javascript
function detectSensorChanges(allData, targetDate) {
  // Sort all data chronologically
  const sorted = [...allData].sort((a, b) => 
    parseDate(a) - parseDate(b)
  );
  
  const gaps = [];
  
  // Find all gaps > 30 minutes
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const gapMinutes = (curr.timestamp - prev.timestamp) / 60000;
    
    if (gapMinutes > 30) {
      gaps.push({
        prev,
        curr,
        prevDate: prev.date,
        currDate: curr.date,
        gapMinutes
      });
    }
  }
  
  // Filter for major gaps (2-10 hours = sensor change)
  // Exclude normal overnight gaps or multi-day absences
  const majorGaps = gaps.filter(g => 
    g.gapMinutes > 120 &&  // > 2 hours
    g.gapMinutes < 600     // < 10 hours
  );
  
  const changes = [];
  
  for (const gap of majorGaps) {
    // Add marker at START of gap (sensor went offline)
    if (gap.prevDate === targetDate) {
      changes.push({
        timestamp: gap.prev.timestamp,
        date: gap.prevDate,
        minuteOfDay: getMinuteOfDay(gap.prev.timestamp),
        gapMinutes: Math.round(gap.gapMinutes),
        type: 'start'
      });
    }
    
    // Add marker at END of gap (sensor came back online)
    if (gap.currDate === targetDate) {
      changes.push({
        timestamp: gap.curr.timestamp,
        date: gap.currDate,
        minuteOfDay: getMinuteOfDay(gap.curr.timestamp),
        gapMinutes: Math.round(gap.gapMinutes),
        type: 'end'
      });
    }
  }
  
  return changes;
}
```

**CRITICAL:** We only DISPLAY the 'start' type (red dashed line when sensor stops). The 'end' is not marked because glucose curve resuming is visually obvious.

### Cartridge Change Detection

```javascript
function detectCartridgeChanges(dayData) {
  const changes = [];
  
  for (const row of dayData) {
    if (row.rewind) {  // Rewind column = cartridge replacement
      const timestamp = parseDate(row.date, row.time);
      changes.push({
        timestamp,
        minuteOfDay: timestamp.getHours() * 60 + timestamp.getMinutes()
      });
    }
  }
  
  return changes;
}
```

---

## ACHIEVEMENT BADGES

### Badge Criteria

**🏆 Perfect Day**
- TIR ≥ 99%
- No data gaps
- Ultra-rare achievement

**🧘 Zen Master**
- TIR ≥ 98%
- CV < 30%
- Zero hypoglycemic events
- Exceptional stability

**👑 You Slay Queen**
- TIR ≥ 95%
- CV < 36%
- Zero hypoglycemic events
- Solid all-around performance

### Badge Detection Logic

```javascript
function detectBadges(metrics, events) {
  const badges = [];
  const tir = parseFloat(metrics.tir);
  const cv = parseFloat(metrics.cv);
  const hypoCount = events.hypoL1.count + events.hypoL2.count;
  
  // Perfect Day: TIR >= 99%
  if (tir >= 99) {
    badges.push({
      id: 'perfect_day',
      emoji: '🏆',
      name: 'Perfect Day',
      description: `${tir.toFixed(1)}% TIR`
    });
  }
  
  // Zen Master: TIR >= 98%, CV < 30%, 0 hypos
  if (tir >= 98 && cv < 30 && hypoCount === 0) {
    badges.push({
      id: 'zen_master',
      emoji: '🧘',
      name: 'Zen Master',
      description: `${tir.toFixed(1)}% TIR, CV ${cv}%, 0 hypo's`
    });
  }
  
  // You Slay Queen: TIR >= 95%, CV < 36%, 0 hypos
  if (tir >= 95 && cv < 36 && hypoCount === 0) {
    badges.push({
      id: 'slay_queen',
      emoji: '👑',
      name: 'You Slay Queen',
      description: `${tir.toFixed(1)}% TIR, CV ${cv}%, 0 hypo's`
    });
  }
  
  return badges;
}
```

**Design Notes:**
- Badges are mutually exclusive (most prestigious shown first)
- Thresholds based on clinical guidelines + Jo's preferences
- Emoji + text for quick recognition
- Hover shows detailed criteria

---

END OF PART 1

See PART 2 for:
- File structure details
- Component responsibilities
- Testing guide
- Known limitations
- Development workflow
