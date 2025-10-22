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

### File Structure

**Filename pattern**: `CareLink-Export-[PatientID]-[Date].csv`

### Key Columns

1. **Index** - Sequential reading number
2. **Date** - YYYY-MM-DD format
3. **Time** - HH:MM:SS format
4. **Timestamp** - ISO 8601 combined datetime
5. **New Device Time** - Pump clock time
6. **BG Reading (mg/dL)** - CGM glucose value
7. **Linked BG Meter Value (mg/dL)** - Fingerstick calibrations
8. **Temp Basal Amount (U/h)** - Temporary basal rate
9. **Temp Basal Type** - Manual or SmartGuard
10. **Temp Basal Duration (hh:mm:ss)** - How long temp basal runs
11. **Bolus Type** - Normal, Square, Dual
12. **Bolus Volume Selected (U)** - User-requested bolus
13. **Bolus Volume Delivered (U)** - Actually delivered
14. **Programmed Basal Rate (U/h)** - Base basal pattern
15. **Active Insulin (U)** - IOB calculated by pump
16. **Sensor Glucose (mg/dL)** - Same as BG Reading
17. **ISIG Value** - Raw sensor current

### Sample Row
```csv
Index,Date,Time,Timestamp,New Device Time,BG Reading (mg/dL),...
1,2024-10-15,00:00:00,2024-10-15T00:00:00,2024-10-15T00:00:00,142,...
```

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

**Solution**: AGP+ parsers handle these edge cases:
- Deduplicates readings
- Validates timestamps
- Flags low coverage periods
- Warns about gaps >2 hours

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
1. Handle multiple CSV formats (Medtronic changes format occasionally)
2. Validate glucose values (40-400 mg/dL reasonable range)
3. Check for timezone consistency
4. Deduplicate readings (same timestamp)
5. Flag sensor gaps >30 minutes

### SmartGuard Implications
- Cannot calculate accurate basal delivery from CSV
- Focus on glucose-derived metrics (TIR, CV, etc.)
- Event detection works fine (glucose-based)
- AGP calculations unaffected (glucose-based)

### Best Practices
- Require minimum 7 days of data
- Warn if <70% CGM coverage
- Handle daylight saving time carefully
- Provide clear error messages for malformed CSVs

---

*Last updated: October 2025*
*MiniMed 780G firmware version: 3.0+*
