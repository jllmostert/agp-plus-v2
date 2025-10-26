# 🚀 PHASE 2 HANDOFF - Sensor Integration

**Datum**: 27 oktober 2025, 14:15  
**Status**: STARTING - SQLite to IndexedDB import

---

## ✅ PHASE 1 DONE
- Database export (JSON) ✅
- Commits: 7fca995, 263f75a
- Pushed to v3.0-dev

---

## 🎯 PHASE 2: SENSOR INTEGRATION

### Design Filosofie
```
DATA → INFORMATION → VISUALIZATION → PRESENTATION

DATA LAYER:
- SQLite: /Users/jomostert/Documents/Projects/Sensoren/master_sensors.db
- 219 sensors (2022-03 → 2025-10)
- Schema: start/end timestamps, duration, reason, lot_number, etc

INFORMATION LAYER:
- IndexedDB store: sensors
- Event detection: sensor changes
- Metrics: avg duration, failure rate, etc

VISUALIZATION LAYER:
- Day profiles: rode lijnen bij sensor change
- Overview table: zoals brutalist HTML
- Dashboard metrics: key stats

PRESENTATION LAYER:
- Interactive (web UI)
- Printable (reports)
```

---

## 📋 ROADMAP

### A. SQLite → IndexedDB Import (NOW)
**Files to create**:
- `src/storage/sensorImport.js` - Import functie
- Update `src/storage/sensorStorage.js` - Add import methods

**Schema in IndexedDB**:
```javascript
{
  id: number,
  startTimestamp: string,
  endTimestamp: string,
  durationHours: number,
  durationDays: number,
  reasonStop: string,
  status: string,
  confidence: string,
  lotNumber: string,
  notes: string
}
```

**Function**:
```javascript
async function importSensorsFromSQLite(dbPath)
  → Read SQLite
  → Convert to IndexedDB format
  → Store in 'sensors' store
  → Return count imported
```

### B. Day Profiles - Sensor Lines (NEXT)
**File**: `src/components/DayProfile.jsx`
**What**: Rode verticale lijn bij sensor change moment
**Logic**: Check if reading timestamp matches sensor start_timestamp (±1 hour tolerance)

### C. Sensor Overview Page (THEN)
**Component**: `src/components/SensorOverview.jsx`
**Metrics**:
- Total sensors
- Avg duration (days)
- Failure rate (%)
- By reason (expired, failed, pulled early, etc)

**Table**: All sensors met kolommen zoals HTML

---

## 🔧 CURRENT TASK

**Goal**: Import 219 sensors from SQLite to IndexedDB

**Step 1**: Read SQLite database
**Step 2**: Convert schema
**Step 3**: Store in IndexedDB
**Step 4**: Test import

---

## 📊 DATABASE INFO

**SQLite Path**: `/Users/jomostert/Documents/Projects/Sensoren/master_sensors.db`

**Schema**:
```sql
CREATE TABLE sensors (
    id INTEGER PRIMARY KEY,
    start_timestamp TEXT NOT NULL,
    end_timestamp TEXT,
    duration_hours INTEGER,
    duration_days REAL,
    reason_stop TEXT,
    status TEXT,
    confidence TEXT NOT NULL,
    lot_number TEXT,
    notes TEXT,
    sequence INTEGER
)
```

**Stats**:
- Total: 219 sensors
- Range: 2022-03-15 → 2025-10-19
- Active sensors: TBD (end_timestamp IS NULL)

---

## 💬 IF STUCK

**Problem**: Can't read SQLite in browser
**Solution**: Use sql.js (WebAssembly SQLite)

**Problem**: Too many sensors to load at once
**Solution**: Paginate or only import recent (last 2 years)

**Problem**: Timestamps don't match glucose data
**Solution**: Tolerance window (±1 hour) for matching

---

## 🎯 SUCCESS CRITERIA

✅ All 219 sensors imported to IndexedDB  
✅ Data accessible via `getSensorHistory()`  
✅ Export includes sensor data (already works)  
✅ Ready for visualization in day profiles

---

**TOKEN COUNT**: ~98k/190k used (48% remaining)
**NEXT**: Start implementing sensorImport.js
