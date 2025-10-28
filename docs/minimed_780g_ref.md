# Medtronic MiniMed 780G Reference

## Device Overview

The **MiniMed 780G** is Medtronic's advanced hybrid closed-loop insulin pump system with SmartGuard™ technology.

---

## System Components

### 1. Insulin Pump
- **Model**: MiniMed 780G
- **Reservoir**: 300 units
- **Basal rates**: 0.025 - 35.0 U/h
- **Bolus**: 0.025 - 25.0 U increments

### 2. CGM Sensor
- **Guardian™ 4 Sensor**
- Calibration-free (in SmartGuard mode)
- 7-day wear time
- 5-minute reading intervals (288 readings/day)

### 3. SmartGuard™ Algorithm
- **Auto Correction**: Adjusts basal every 5 minutes
- **Auto Bolus**: Optional auto-correction boluses
- **Target Range**: 100-120 mg/dL (adjustable)
- **Active Insulin Time**: User-configurable (2-8 hours)

---

## CareLink CSV Export Format

### File Structure Overview

**Filename pattern**: `Jo Mostert DD-MM-YYYY.csv` (date-stamped exports)

CareLink CSV exports have a **multi-section architecture** with three distinct data sections, each separated by a `-------` divider line. Each section has its own column headers and data structure.

### CSV Architecture: Three-Section Format

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (Lines 1-5)                                      │
│ - Patient demographics                                  │
│ - Device info (MiniMed 780G serial, firmware)          │
│ - Date range                                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ SECTION 1: Device Events & Pump Data (~Line 6+)        │
│ Divider: -------; MiniMed 780G MMT-1886; Pump; ...     │
│                                                         │
│ Contains:                                               │
│ - Basal rates (programmed pattern)                     │
│ - Bolus data (wizard, manual, closed-loop)             │
│ - Alerts & notifications                                │
│ - Sensor events (SENSOR CONNECTED, CHANGE SENSOR)      │
│ - Cartridge events (Rewind, Fill)                      │
│ - Suspend states (USER_SUSPEND, ALARM_SUSPEND)         │
│ - SmartGuard alerts (BG REQUIRED, HIGH/LOW)            │
│                                                         │
│ Key for AGP+: Event detection, sensor changes          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ SECTION 2: Aggregated Daily Insulin (~Line 458+)       │
│ Divider: -------                                        │
│                                                         │
│ Contains:                                               │
│ - Daily insulin delivery totals                         │
│ - One row per day                                       │
│ - Closed-loop auto-delivery statistics                 │
│                                                         │
│ Note: AGP+ does not use this section (see TDD warning) │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ SECTION 3: Sensor Glucose Readings (~Line 470+)        │
│ Divider: -------                                        │
│                                                         │
│ Contains:                                               │
│ - 5-minute CGM readings (288/day when complete)        │
│ - Sensor Glucose (mg/dL) values                        │
│ - ISIG values (raw sensor current)                     │
│ - Day start/end markers                                 │
│                                                         │
│ Key for AGP+: Core glucose data for all calculations   │
└─────────────────────────────────────────────────────────┘
```

### Section 1: Device Events & Pump Data

**Header format** (line 6):
```
-------;MiniMed 780G MMT-1886;Pump;NG4114235H;-------
Index;Date;Time;New Device Time;BG Source;BG Reading (mg/dL);...
```

**Key Columns** (52+ columns total):
1. **Index** - Sequential event number (e.g., `0,00000`)
2. **Date** - Format: `YYYY/MM/DD` (e.g., `2025/10/28`)
3. **Time** - Format: `HH:MM:SS` (e.g., `06:24:38`)
4. **Basal Rate (U/h)** - Programmed basal pattern
5. **Temp Basal Amount** - SmartGuard or manual temp basal
6. **Bolus Type** - Normal, Dual, Square
7. **Bolus Volume Delivered (U)** - Actual insulin delivered
8. **Prime Type** - Cannula Fill, Tubing Fill
9. **Prime Volume Delivered (U)** - Priming insulin amounts
10. **Alert** - System alerts (see Alert Types below)
11. **Suspend** - Pump suspend states
12. **Rewind** - Cartridge change indicator (boolean)
13. **BWZ fields** - Bolus Wizard calculations
14. **Sensor Calibration BG (mg/dL)** - Fingerstick calibrations
15. **Sensor Exception** - Sensor error states
16. **Sensor State** - Current sensor status

**Alert Types (Column: Alert)**:
- `SENSOR CONNECTED` - New sensor paired
- `CHANGE SENSOR` - Prompt to replace sensor
- `LOST SENSOR SIGNAL` - Communication lost
- `SENSOR UPDATING ALERT` - Sensor warming up
- `ALERT ON HIGH` - Glucose above threshold
- `ALERT ON LOW` - Glucose below threshold
- `SMARTGUARD BG REQUIRED` - Calibration needed
- `SMARTGUARD MAXIMUM DELIVERY TIMEOUT` - Safety limit
- `SET CHANGE REMINDER` - Infusion set due
- `INSERT BATTERY ALARM, DELIVERY STOPPED` - Battery dead

**Suspend States (Column: Suspend)**:
- `USER_SUSPEND` - Manually suspended
- `ALARM_SUSPEND` - System safety suspend
- `NOTSEATED_SUSPEND` - Reservoir not properly seated
- `NORMAL_PUMPING` - Active insulin delivery

**Sensor Event Detection Pattern** (Critical for AGP+):

A single sensor change generates **multiple timestamp entries** clustered in time:

```csv
170;2025/10/25;07:31:42;;;;;;;;;;;;;CHANGE SENSOR;;...
171;2025/10/25;07:31:19;;;;;;;;;;;;CHANGE SENSOR: tone and vibration;;;...
167;2025/10/25;08:05:22;;;;;;;;;;;;;LOST SENSOR SIGNAL;;...
168;2025/10/25;08:05:00;;;;;;;;;;;;LOST SENSOR SIGNAL: tone and vibration;;;...
165;2025/10/25;08:11:32;;;;;;;;;;;;;SENSOR CONNECTED;;...
166;2025/10/25;08:11:27;;;;;;;;;;;;SENSOR CONNECTED: tone and vibration;;;...
```

**This represents ONE sensor change**, not six. Timestamps span ~40 minutes during sensor replacement and warm-up.

**Cartridge Change Detection Pattern**:

A single cartridge change also generates multiple entries:

```csv
6;2025/10/28;06:08:07;;;;;0;;;;;;;;;;Rewind;;;;...
5;2025/10/28;06:22:00;;;;;;;;;;;;;Tubing Fill;10,3597;260,65;;;;...
4;2025/10/28;06:22:14;;;;;;;;;;;;;Cannula Fill;0,3;260,35;;;;...
8;2025/10/28;06:07:48;;;;;0;;;;;;;;;NOTSEATED_SUSPEND;;;;;...
3;2025/10/28;06:22:14;;;;;;;;;;;;;;NORMAL_PUMPING;;;;;...
```

**Detection logic**: `Rewind=true` indicates cartridge change start. Subsequent Fill events and pump state changes are part of the same event.

### Section 2: Aggregated Auto Insulin Data

**Header format** (~line 458):
```
-------;MiniMed 780G MMT-1886;Pump;NG4114235H;Aggregated Auto Insulin Data
Index;Date;Time;...;Bolus Type;Bolus Volume Delivered (U);...;Bolus Source;...
```

**Contains**: Daily auto insulin totals, one row per date.

**IMPORTANT:** ✅ **ACCURATE FOR TDD CALCULATION** (verified October 28, 2025)

**Key Columns:**
- **Column 1:** Date (YYYY/MM/DD format)
- **Column 13:** Bolus Volume Delivered (U) - Daily auto insulin total
- **Column 44:** Bolus Source - "CLOSED_LOOP_AUTO_INSULIN"

**What This Represents:**
`CLOSED_LOOP_AUTO_INSULIN` contains the combined total of:
1. **Autobasaal** - SmartGuard's basal adjustments made every 5 minutes
2. **Micro-bolussen** - Automatic correction boluses without user interaction
3. **NOT** the programmed basal pattern (that's in Section 1 "Basal Rate" column)

**Example Row:**
```csv
450,00000;2025/10/27;00:00:00;;;;;;;;;Normal;11,548;11,548;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;CLOSED_LOOP_AUTO_INSULIN;;;;;;;;
```
This shows 11.548E of auto insulin delivered on October 27, 2025.

**Verification Against CareLink PDF:**
Testing with real-world data (October 27, 2025):
- **CareLink PDF:** TDD 29.4E | Basaal 37% (11.0E) | Bolus 63% (18.4E)
- **CSV Section 2:** Auto Insulin 11.548E
- **CSV Section 1:** Meal Bolus 17.475E  
- **CSV TDD:** 29.023E (**98.7% match** ✅)

**AGP+ Usage v3.1+:** ✅ **ACTIVELY USED** for Total Daily Dose (TDD) calculations
- Combined with Section 1 meal boluses
- Provides accurate daily insulin metrics
- Enables auto/meal ratio analysis
- Clinical decision support

**Previous Misconception:** Earlier documentation incorrectly stated Section 2 was unreliable due to the "Basal Rate Trap" (programmed vs delivered basal). This has been corrected - Section 2 provides **actual delivered auto insulin**, not programmed rates.

### Section 3: Sensor Glucose Readings

**Header format** (~line 470):
```
-------
Index;Date;Time;New Device Time;BG Source;BG Reading (mg/dL);...;Sensor Glucose (mg/dL);ISIG Value;...
```

**Key Columns**:
1. **Index** - Sequential reading number
2. **Date** - `YYYY/MM/DD` format
3. **Time** - `HH:MM:SS` format  
4. **Sensor Glucose (mg/dL)** - CGM glucose value (40-400 range)
5. **ISIG Value** - Raw sensor current (diagnostic)
6. **Event Marker** - Special markers (day start/end)

**Data Characteristics**:
- 5-minute reading intervals (288 readings/day at 100% coverage)
- Gaps indicate sensor warm-up, signal loss, or sensor changes
- Day markers: `Start of the day` / `End of the day` entries

**Sample Rows**:
```csv
458;2025/10/28;06:27:34;;;;;;;;;;;;;;;;;;;;;;;;113;19,01;;...
828;2025/10/27;00:00:00;;;;;;;;;;;;;;;;;;;;;;;;;;End of the day;...
829;2025/10/27;00:00:00;;;;;;;;;;;;;;;;;;;;;;;;;;Start of the day;...
```

**AGP+ Usage**: This is the **primary data source** for all glucose-based metrics:
- Time in Range (TIR)
- Coefficient of Variation (CV)
- Glucose Management Indicator (GMI)
- Day profiles
- Period comparisons

### Sample File Structure (Actual Line Numbers)

**Example from 7-day export** (2,891 total lines):

```
Lines 1-5:    CSV header (patient info, date range)
Line 6:       Section 1 divider + header
Lines 7-457:  Section 1 data (device events)
Line 458:     Section 2 divider + header  
Lines 459-469: Section 2 data (daily insulin)
Line 470:     Section 3 divider + header
Lines 471-2891: Section 3 data (glucose readings)
```

### Parsing Considerations for AGP+

**Critical Rules**:

1. **Multi-section awareness**: Parser must handle three distinct data structures
2. **Section detection**: Use `-------` as section delimiter
3. **Header skipping**: Each section has its own header row after divider
4. **Event clustering**: Multiple timestamps can represent single events
5. **Data validation**: Section 3 glucose values must be 40-400 mg/dL
6. **Gap detection**: Missing readings indicate sensor events
7. **Day markers**: Use Event Marker column for day boundaries

**Current AGP+ Implementation**:
- Focuses primarily on Section 3 (glucose readings)
- Extracts sensor change events from Section 1 (Alert column)
- Extracts cartridge changes from Section 1 (Rewind column)
- Ignores Section 2 (daily insulin totals) per design decision

---

## Important Data Limitations

### ⚠️ CRITICAL: Basal Rate Trap

**Problem**: CareLink CSV exports contain ONLY the programmed basal pattern, NOT SmartGuard auto-adjustments.

**Details**:
- SmartGuard makes basal adjustments every 5 minutes
- These adjustments are stored in pump memory
- CSV exports show only the baseline programmed pattern
- Temp basals are partially captured but incomplete

**Impact**:
- Total Daily Dose (TDD) calculations from CSV are **unreliable**
- Error range: -26% to -1% vs actual delivery
- SmartGuard increases basal 70-80% of the time
- Auto-corrections are NOT in the CSV

**Solution**:
- Use Medtronic **PDF reports** for accurate TDD
- Specifically: "Therapy Management Dashboard" report
- This report pulls from pump memory, includes SmartGuard adjustments

**Design Decision**: AGP+ does NOT calculate TDD from CSV data. We don't calculate metrics we can't trust.

---

## CGM Data Quality

### Data Completeness
- **Target**: ≥70% CGM coverage for reliable metrics
- **Sensor gaps**: Common during sensor changes (2-3 hours)
- **Signal loss**: Brief interruptions due to interference

### Reading Frequency
- **Normal**: 288 readings per day (5-minute intervals)
- **Minimum**: 201 readings/day (70% coverage) for analysis

### Data Points
```
Per day:    288 readings (100% coverage)
Per week:   2,016 readings
Per 14d:    4,032 readings
Per 30d:    8,640 readings
Per 90d:    25,920 readings
```

---

## SmartGuard™ Modes

### Auto Mode (Closed Loop)
- **Target**: 100 or 120 mg/dL (user selectable)
- **Basal adjustments**: Every 5 minutes
- **Auto-correction**: Enabled
- **Manual Override**: User can suspend or exit

### Manual Mode (Open Loop)
- **Basal**: Fixed programmed pattern
- **Boluses**: User-initiated only
- **No auto-correction**
- **Use case**: Exercise, sick days, pump learning period

### Exercise Mode
- **Target**: 150 mg/dL (temporarily raised)
- **Duration**: User-selectable (1-12 hours)
- **Auto-correction**: Reduced aggressiveness

---

## Alerts & Notifications

### Glucose Alerts
- **Urgent Low**: <55 mg/dL (customizable)
- **Low**: <70 mg/dL (customizable)
- **High**: >250 mg/dL (customizable)
- **Rapid Rise/Fall**: Rate of change alerts

### System Alerts
- **Suspend on Low**: Auto-suspend at 50-90 mg/dL
- **Suspend Before Low**: Predictive low suspend
- **Reservoir Low**: <20 units remaining
- **Battery Low**: Replace soon
- **Sensor Expired**: Replace sensor

---

## Therapy Settings

### Typical Configuration (Type 1 Diabetes)

**Insulin Settings**:
- Active Insulin Time: 2-4 hours (typical)
- Carb Ratio: 1:8 to 1:15 (highly individual)
- Insulin Sensitivity Factor: 30-70 mg/dL per unit
- Max Basal Rate: 2-3x highest programmed rate
- Max Bolus: 10-25 units

**Target Glucose**:
- SmartGuard Target: 100 or 120 mg/dL
- Manual Mode Target: 90-130 mg/dL (typical)
- Correction Above: Target + 20-40 mg/dL

---

## CareLink Upload Process

### Data Sync
1. **Automatic**: Via smartphone app (MiniMed Mobile)
2. **Manual**: Via USB CareLink uploader
3. **Frequency**: Real-time (mobile) or manual uploads

### Export Process
1. Log into CareLink portal
2. Navigate to Reports
3. Select "Export Data"
4. Choose date range
5. Download CSV file

### Data Retention
- **CareLink**: Stores data indefinitely
- **Pump Memory**: ~90 days of detailed data
- **Sensor**: No onboard storage (transmits to pump)

---

## Troubleshooting

### Common CSV Issues

**Missing Data**:
- Sensor warm-up periods (2 hours)
- Signal loss / interference
- Sensor changes
- Pump disconnections

**Incorrect Timestamps**:
- Pump clock drift
- Timezone changes
- Daylight saving time transitions
- Manual time adjustments

**Duplicate Entries**:
- Multiple uploads of same period
- Data re-sync from pump

**Event Clustering** (⚠️ Critical for Sensor/Cartridge Detection):

**Problem**: A single real-world event generates multiple CSV entries with different timestamps.

**Example - Sensor Change**:
```
One actual sensor replacement creates 6+ CSV rows:
- 07:31:42 CHANGE SENSOR (alert triggered)
- 07:31:19 CHANGE SENSOR: tone and vibration (user acknowledged)
- 08:05:00 LOST SENSOR SIGNAL: tone and vibration
- 08:05:22 LOST SENSOR SIGNAL
- 08:11:27 SENSOR CONNECTED: tone and vibration
- 08:11:32 SENSOR CONNECTED (new sensor paired)

Time span: ~40 minutes
Glucose gap: 06:26 → 10:05 (~3.5 hours including warm-up)
```

**Example - Cartridge Change**:
```
One reservoir/infusion set change creates 5+ CSV rows:
- 06:08:07 Rewind (cartridge removal)
- 06:07:48 NOTSEATED_SUSPEND (reservoir removed)
- 06:22:00 Tubing Fill (10.36 units)
- 06:22:14 Cannula Fill (0.3 units)
- 06:22:14 NORMAL_PUMPING (resumed delivery)

Time span: ~14 minutes
```

**Detection Strategies**:

1. **Time-based clustering**: Group events within 60 minutes as single event
2. **User confirmation**: Prompt user when detecting multiple same-day events
3. **Gap analysis**: Use glucose reading gaps to validate sensor changes
4. **Keyword patterns**: Look for alert pairs (alert + "tone and vibration")

**AGP+ Approach**:
- **User confirmation preferred**: When multiple sensor changes detected on same day
- **Show context**: Display date + time so user can recall event
- **Fallback**: Auto-cluster if user doesn't remember ("too long ago")
- **Validation**: Cross-reference with glucose gaps for confidence

**Solution**: AGP+ parsers handle these edge cases:
- Deduplicates readings
- Validates timestamps
- Clusters related events
- Flags low coverage periods
- Warns about gaps >2 hours
- Prompts user for ambiguous event clusters

---

## Data Privacy & Security

### CareLink Account
- HIPAA-compliant storage
- Two-factor authentication available
- Clinic sharing features
- Patient-controlled access

### CSV Files
- **Contains**: PHI (Protected Health Information)
- **Includes**: Patient ID, dates, glucose readings
- **Security**: Should be encrypted at rest
- **Sharing**: Follow local privacy laws (GDPR, HIPAA)

---

## References

- **User Guide**: [MiniMed 780G System User Guide](https://www.medtronicdiabetes.com/)
- **CareLink**: [carelink.minimed.com](https://carelink.minimed.com)
- **Technical Support**: 1-800-646-4633 (US)

---

## Notes for Developers

### CSV Parsing Considerations

**Multi-Section Architecture** (Critical):
1. Detect section boundaries with `-------` divider pattern
2. Each section has independent column headers
3. Skip header rows after each divider
4. Parse sections independently based on column structure
5. Section 1: Device events (event detection, alerts)
6. Section 2: Daily insulin (not used by AGP+)
7. Section 3: Glucose readings (primary data source)

**Data Validation**:
1. Validate glucose values (40-400 mg/dL reasonable range)
2. Check for timezone consistency across sections
3. Deduplicate readings (same timestamp + same value)
4. Flag sensor gaps >30 minutes
5. Validate date format consistency (`YYYY/MM/DD` in data, `DD/MM/YYYY` in filenames)

**Event Detection** (Sensor & Cartridge Changes):
1. **Parse Section 1 for events** (not Section 3)
2. **Cluster related timestamps**: Events within 60 minutes likely same event
3. **User confirmation**: Prompt when multiple same-day events detected
4. **Cross-validate**: Use glucose gaps to confirm sensor changes
5. **Alert patterns**: Look for pairs (alert + "tone and vibration")
6. **Rewind column**: Boolean indicator for cartridge changes
7. **Confidence levels**: Database > CSV alerts > Gap analysis

**Event Clustering Algorithm**:
```javascript
// Pseudocode for sensor change detection
function detectSensorChanges(section1Rows) {
  const sensorEvents = section1Rows.filter(row => 
    row.alert.includes('SENSOR CONNECTED') ||
    row.alert.includes('CHANGE SENSOR')
  );
  
  // Group by date
  const byDate = groupByDate(sensorEvents);
  
  // For each date with events
  for (const [date, events] of byDate) {
    if (events.length === 1) {
      // Single event, straightforward
      storeSensorChange(events[0]);
    } else {
      // Multiple events same day
      const timeSpan = getTimeSpan(events);
      
      if (timeSpan <= 60 minutes) {
        // Clustered events - likely one sensor change
        // Use earliest timestamp
        storeSensorChange(events[0]);
      } else {
        // Events >60min apart - ask user
        promptUser(date, events);
      }
    }
  }
}
```

**Glucose Gap Detection**:
```javascript
// Validate sensor change with glucose gap
function validateSensorChange(timestamp, section3Readings) {
  const gapWindow = 6 hours; // Sensor change + warm-up
  const beforeGap = lastReadingBefore(timestamp);
  const afterGap = firstReadingAfter(timestamp);
  
  if (afterGap.timestamp - beforeGap.timestamp > 2 hours) {
    // Gap confirms sensor change
    return { confidence: 'high', gap: calculateGap(...) };
  }
  
  return { confidence: 'medium' };
}
```

### SmartGuard Implications
- Cannot calculate accurate basal delivery from CSV
- Focus on glucose-derived metrics (TIR, CV, GMI, etc.)
- Event detection works fine (glucose-based + Section 1 alerts)
- AGP calculations unaffected (glucose-based)

### Best Practices
- **Require minimum 7 days of data** for reliable analysis
- **Warn if <70% CGM coverage** per ADA/ATTD guidelines
- **Handle daylight saving time carefully** (check timezone consistency)
- **Provide clear error messages** for malformed CSVs
- **Section-aware parsing**: Don't assume single data structure
- **User prompts**: Ask for clarification on ambiguous events
- **Cross-validation**: Use multiple detection methods (database, alerts, gaps)
- **Confidence levels**: Report detection confidence to user

---

*Last updated: October 28, 2025*  
*MiniMed 780G firmware version: 8.13.2*  
*Document version: 2.0 - Added CSV multi-section architecture*
