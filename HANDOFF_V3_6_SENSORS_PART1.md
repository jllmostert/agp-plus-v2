# 🔧 HANDOFF - V3.6 Sensor Database Integration
**Session Date**: October 26, 2025  
**Time**: ~14:30 CET  
**Branch**: v3.0-dev  
**Latest Commit**: 50a40fd  
**Status**: ⚠️ **Phase 3.6 Step 1 Complete - Needs Testing**

---

## 🎯 WHAT WE BUILT

### Sensor Database Integration (Phase 3.6)

**Goal**: Import sensor tracking database (master_sensors.db) into AGP+ for accurate sensor change markers

**Implementation**: 3-tier detection system
1. **Database** → Most accurate (imported from Sensoren project)
2. **Alerts** → "SENSOR CONNECTED" from CSV (current data)
3. **Gaps** → 3-10 hour gaps (fallback for old CSVs)

---

## ✅ COMPLETED (Step 1: Infrastructure)

### 1. Storage Layer
```
src/storage/sensorStorage.js
```
**Functions**:
- `initSensorStorage()` - Create IndexedDB store
- `importSensorDatabase(data)` - Import parsed SQLite
- `getSensorDatabase()` - Retrieve full database
- `getSensorAtDate(date)` - Find active sensor on date
- `getSensorsInRange(start, end)` - Range query
- `getInventory()` - Get voorraad
- `getSensorStats()` - Calculate statistics
- `hasSensorDatabase()` - Check if imported

**IndexedDB Structure**:
```javascript
sensorData: {
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
  lastUpdated: "ISO timestamp",
  stats: { totalSensors, dateRange }
}
```

### 2. SQLite Parser
```
src/utils/sqliteParser.js
```
**Function**: `parseSQLiteDatabase(file)`
- Uses sql.js library (browser SQLite)
- Reads .db file as ArrayBuffer
- Queries sensors + inventory tables
- Returns JSON for IndexedDB

**Dependencies**: `npm install sql.js` ✅

### 3. UI Component
```
src/components/SensorImport.jsx
```
**Features**:
- File input (.db files)
- Import status indicator
- Sensor count display
- Success rate + avg duration
- Error handling with alerts
- Brutalist styling (matches AGP+)

**States**:
- No database: "IMPORTEER DATABASE"
- Has database: Shows stats + "UPDATE DATABASE"
- Importing: "IMPORTEREN..." (disabled)

### 4. Integration
```
src/components/AGPGenerator.jsx
```
- Added `import SensorImport from './SensorImport'`
- Placed after FileUpload component
- Appears before CSV error display

---

## ⏭️ TODO (Step 2: Detection Integration)

### Make Detection Async

**Problem**: detectSensorChanges currently sync, needs async for database lookups

**Solution**: Update getDayProfile + getLastSevenDays to async

```javascript
// Current (sync):
export function getDayProfile(data, date) {
  const sensorChanges = detectSensorChanges(data, date);
  // ...
}

// Target (async):
export async function getDayProfile(data, date) {
  const sensorChanges = await detectSensorChanges(data, date);
  // ...
}
```

**Files to Update**:
1. `src/core/day-profile-engine.js`:
   - Make `detectSensorChanges` async
   - Make `getDayProfile` async
   - Make `getLastSevenDays` async
   - Add 3-tier detection logic (database → alerts → gaps)

2. `src/hooks/useDayProfiles.js`:
   - Handle async getLastSevenDays
   - Update useEffect dependencies

3. `src/components/DayProfilesModal.jsx`:
   - No changes needed (dayProfiles passed as prop)

### 3-Tier Detection Logic

```javascript
async function detectSensorChanges(allData, targetDate) {
  // PRIORITY 1: Check sensor database
  try {
    const dbSensor = await getSensorAtDate(targetDate);
    if (dbSensor && sensorStartedOnThisDay) {
      return [{
        timestamp: dbSensor.start_timestamp,
        minuteOfDay: calculateMinute(dbSensor.start_timestamp),
        type: 'sensor_start',
        source: 'database',
        lot: dbSensor.lot_number
      }];
    }
  } catch (err) {
    console.warn('Database lookup failed, falling back');
  }
  
  // PRIORITY 2: Alert-based
  const alertChanges = detectFromAlerts(dayData);
  if (alertChanges.length > 0) {
    return alertChanges.map(c => ({ ...c, source: 'alert' }));
  }
  
  // PRIORITY 3: Gap-based (current method)
  return detectFromGaps(allData, targetDate).map(c => ({ ...c, source: 'gap' }));
}
```

---

## 🧪 TESTING CHECKLIST

### Before Continuing
- [ ] Dev server running (localhost:5173)
- [ ] Check browser console for errors
- [ ] Sensor Import button visible in UI
- [ ] Click "IMPORTEER DATABASE"
- [ ] Select /Sensoren/master_sensors.db
- [ ] Verify import success (219 sensors)
- [ ] Check stats display (success rate, avg duration)
- [ ] Refresh page - database persists (IndexedDB)
- [ ] Try "UPDATE DATABASE" - reimport works

### After Async Integration
- [ ] Day profiles still load
- [ ] Sensor markers appear on correct dates
- [ ] Red dashed lines at sensor starts
- [ ] Orange dotted lines at cartridge changes (Rewind)
- [ ] No console errors
- [ ] Check marker sources (database > alerts > gaps)

---

## 📁 FILES CHANGED

```
src/storage/sensorStorage.js          ← NEW: IndexedDB sensor management
src/utils/sqliteParser.js             ← NEW: Browser SQLite parser
src/components/SensorImport.jsx       ← NEW: Import UI component
src/components/AGPGenerator.jsx       ← MODIFIED: Added SensorImport
package.json                          ← MODIFIED: Added sql.js dependency

src/core/day-profile-engine.js        ← TODO: Make async, add 3-tier detection
src/hooks/useDayProfiles.js           ← TODO: Handle async
```

---

## 🎨 UI/UX PHILOSOPHY

**Sensor Markers** (as agreed):
- ✅ RED dashed line: Sensor change (vertical, no label needed)
- ✅ ORANGE dotted line: Cartridge change (Rewind events)
- ❌ NO text labels (clutters chart)
- ❌ NO grey blocks (too heavy)
- ❌ NO triangles (unnecessary)

**Visual Priority**: Minimal, subtle, brutalist. Let the glucose curve be the star.

---

## 🚨 CRITICAL NOTES

### Backup File Created
```
src/core/day-profile-engine.js.backup
```
Original file backed up before async conversion. **Keep this until async version is tested.**

### Temp Files to Clean
```
src/core/day-profile-engine_CHUNK1.js  ← Delete after done
```

### sql.js CDN
Uses: `https://sql.js.org/dist/sql-wasm.wasm`
**Note**: Requires internet for first load. If offline support needed, copy wasm to `/public/`.

### Database Source
**Master database location**:
```
/Users/jomostert/Documents/Projects/Sensoren/master_sensors.db
```

**Current state** (as of Oct 25, 2025):
- 219 sensors total
- A1.01: 198 sensors, 5.8d avg, 69.2% success
- A2.01: 21 sensors, 5.4d avg, 47.6% success
- Voorraad: 13 sensors (4 lotnummers)

---

## 🔄 NEXT SESSION PLAN

### Immediate Priority
1. **Test Import Feature**:
   - Try importing master_sensors.db
   - Verify stats display
   - Check IndexedDB (DevTools → Application → IndexedDB)

2. **If Import Works**:
   - Proceed to async conversion
   - Update day-profile-engine.js
   - Test 3-tier detection

3. **If Import Fails**:
   - Debug sqliteParser.js
   - Check sql.js loading
   - Verify database format

### Future Steps (Phase 3.6 Complete)
- Sensor Overview page (like brutalist HTML)
- Export sensor report button
- Filter sensors by hardware/lot
- Visual polish on day profile markers

---

## 💡 KEY LEARNINGS

### Pragmatic Over Perfect
Started trying to rewrite entire day-profile-engine.js with edit_block. **Wrong approach.**

Better: Small, testable increments:
1. ✅ Storage layer
2. ✅ Parser utility  
3. ✅ UI component
4. ⏭️ Async integration (next)

### Browser SQLite is Cool
`sql.js` compiles SQLite to WebAssembly. Zero backend needed. Parses `.db` files entirely client-side.

### IndexedDB for Everything
V3 architecture shines here:
- Master dataset → IndexedDB
- Sensor database → IndexedDB
- Eventually: everything in IndexedDB, zero localStorage

---

## 🔗 RELATED PROJECTS

**Sensor Tracking System**:
```
/Users/jomostert/Documents/Projects/Sensoren/
├── master_sensors.db          ← Source of truth
├── sensor_database_brutalist.html  ← HTML report (inspiration for AGP+)
├── DATABASE_WORKFLOW.md       ← How sensor tracking works
└── scripts/detect_sensors.py  ← Alert-based detection logic
```

**Key Insight**: AGP+ importing this database = **one source of truth** for both systems. No duplication, no sync issues.

---

## 📞 WHEN STUCK

**Import not working?**
1. Check browser console for sql.js errors
2. Verify .db file is valid SQLite (try opening in DB Browser)
3. Check network tab for sql-wasm.wasm load

**Async conversion confusing?**
1. Read day-profile-engine.js.backup first
2. Make ONE function async at a time
3. Test after each change

**Need sensor detection reference?**
Look at `/Sensoren/scripts/detect_sensors.py` - same logic, Python version

---

**Ready for testing!** 🚀

*Last updated: October 26, 2025 14:45 CET*
