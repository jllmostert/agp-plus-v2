# 🎨 PHASE 2B HANDOFF - Sensor Visualization

**Datum**: 27 oktober 2025, 16:45  
**Status**: READY - Add sensor lines to day profiles

---

## ✅ PHASE 2A DONE
- SQLite import ✅ (commit 6c755ff)
- 219 sensors in localStorage ✅
- UI shows stats ✅
- Pushed to v3.0-dev ✅

---

## 🎯 PHASE 2B: DAY PROFILE VISUALIZATION

### Goal
Show red vertical lines in day profiles when a sensor change occurred.

### Design Pattern
```
SENSOR CHANGE = RED DASHED LINE

Visual:
│ glucose curve │ ┊ new sensor │ glucose curve │
  └─ sensor 1 ──┘   └─ sensor 2 ────────────┘

Line style:
- Color: var(--color-red)
- Style: dashed (2px dash, 4px gap)
- Width: 2px
- Label: "SENSOR"
```

---

## 📋 IMPLEMENTATION PLAN

### Step 1: Add sensor detection to event system
**File**: `src/storage/eventDetection.js`

**Function to add**:
```javascript
export function detectSensorChanges(readings, sensorDatabase) {
  const changes = [];
  const sensors = sensorDatabase.sensors || [];
  
  // For each sensor start timestamp
  sensors.forEach(sensor => {
    const sensorStart = new Date(sensor.start_timestamp);
    
    // Find reading closest to sensor start (±1 hour tolerance)
    const matchingReading = readings.find(r => {
      const readingTime = new Date(`${r.date} ${r.time}`);
      const diffMs = Math.abs(readingTime - sensorStart);
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours <= 1;
    });
    
    if (matchingReading) {
      changes.push({
        timestamp: `${matchingReading.date} ${matchingReading.time}`,
        type: 'sensor',
        confidence: sensor.confidence || 'medium',
        metadata: {
          lotNumber: sensor.lot_number,
          duration: sensor.duration_days,
          reason: sensor.reason_stop
        }
      });
    }
  });
  
  return changes;
}
```

### Step 2: Integrate into DayProfile
**File**: `src/components/DayProfile.jsx`

**Add to props**:
- `sensorChanges` array from event detection

**Rendering logic**:
```javascript
// After glucose curve, before cartridge lines
{sensorChanges.map((change, idx) => {
  const changeTime = new Date(`2000-01-01 ${change.timestamp.split(' ')[1]}`);
  const minutesSinceMidnight = changeTime.getHours() * 60 + changeTime.getMinutes();
  const x = (minutesSinceMidnight / 1440) * width;
  
  return (
    <g key={`sensor-${idx}`}>
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="var(--color-red)"
        strokeWidth="2"
        strokeDasharray="2,4"
        opacity="0.7"
      />
      <text
        x={x}
        y={-5}
        fontSize="8"
        fill="var(--color-red)"
        textAnchor="middle"
      >
        SENSOR
      </text>
    </g>
  );
})}
```

### Step 3: Wire up data flow
**File**: `src/hooks/useDayProfiles.js`

**Add**:
```javascript
import { detectSensorChanges } from '../storage/eventDetection';
import { getSensorDatabase } from '../storage/sensorStorage';

// In profile generation
const sensorDb = getSensorDatabase();
const sensorChanges = sensorDb ? detectSensorChanges(readings, sensorDb) : [];

profiles.push({
  date,
  readings: dayReadings,
  sensorChanges, // Add this
  // ... rest
});
```

---

## 🔍 TESTING CHECKLIST

### Visual Tests
- [ ] Red dashed lines appear at sensor change times
- [ ] "SENSOR" label visible above line
- [ ] Line spans full height of day profile
- [ ] Opacity allows seeing glucose curve behind it
- [ ] Print-friendly (patterns work in B&W)

### Data Tests
- [ ] Sensor changes detected correctly (±1 hour tolerance)
- [ ] Only shows sensors within day profile date
- [ ] High confidence sensors prioritized
- [ ] Multiple sensors per day handled correctly

### Edge Cases
- [ ] Day with no sensor change (no line)
- [ ] Sensor change at midnight (correct positioning)
- [ ] Sensor change during gap (line still visible)

---

## 📊 EXPECTED RESULTS

**For Oct 12-26 period**:
- Should see 0-1 sensor changes in day profiles
- Based on your 219 sensors, avg duration ~7 days
- Most recent sensor started Oct 19, 2025

**Console output to add**:
```javascript
console.log('[DayProfile] Sensor changes detected:', {
  date,
  count: sensorChanges.length,
  timestamps: sensorChanges.map(c => c.timestamp)
});
```

---

## 🎯 SUCCESS CRITERIA

✅ Sensor changes visible as red dashed lines  
✅ Labels clear and positioned correctly  
✅ Works across all day profiles  
✅ Console logging for debugging  
✅ Ready for Phase 2C (sensor overview page)

---

## 💡 NOTES

**Why localStorage instead of IndexedDB?**
- Sensor data is small (~20KB for 219 sensors)
- No need for async complexity
- Matches existing sensorStorage.js pattern
- Can migrate to IndexedDB later if needed

**Why ±1 hour tolerance?**
- CSV timestamps may not match exact sensor start
- User might start sensor before/after midnight
- Medtronic pump clock drift
- Better to show approximate line than miss it

---

**TOKEN COUNT**: ~72k/190k used (62% remaining)  
**NEXT**: Implement sensor line visualization
