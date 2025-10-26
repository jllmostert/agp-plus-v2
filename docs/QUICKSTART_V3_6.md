# 🚀 QUICK START REFERENCE - V3.6

**For Next Session** | October 26, 2025

---

## 📖 READ THESE FIRST

1. **Main Handoff**: `docs/handoffs/HANDOFF_V3_6_EVENTS_OCT26.md` (634 lines)
   - Complete implementation plan
   - Testing checklist
   - Code examples

2. **Status Summary**: `docs/STATUS_V3_6.md` (182 lines)
   - What works / what doesn't
   - Priority list
   - Quick troubleshooting

3. **Architecture**: `docs/V3_ARCHITECTURE.md` (scroll to "Event Detection" section)
   - Flow diagram
   - localStorage rationale

---

## 🔧 DEV SERVER

```bash
# Start (from project root)
npm run dev

# Or with Desktop Commander
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && npm run dev" timeout_ms=5000

# Access
http://localhost:5173

# Kill if stuck
DC: start_process "lsof -ti:5173 | xargs kill -9" timeout_ms=3000
```

---

## 🧪 TEST DATABASE IMPORT (5 MIN)

```bash
1. Open http://localhost:5173
2. Upload any CSV first (e.g., Jo_Mostert_24-10-2025_SAMPLE.csv)
3. Scroll to "IMPORTEER DATABASE" button
4. Select: /Users/jomostert/Documents/Projects/Sensoren/master_sensors.db
5. Verify: "✅ Import succesvol! 219 sensors geïmporteerd"
6. Open DevTools → Application → Local Storage
7. Find key: agp-sensor-database
8. Refresh page - database persists ✅
```

---

## 📋 IMPLEMENTATION PRIORITIES

### Priority 1: Event Detection Engine (30 min)
**Create**: `src/core/event-detection-engine.js`

**Main Function**:
```javascript
export async function detectAllEvents(csvData) {
  // 1. Database lookup (if imported)
  // 2. Alert parsing ("SENSOR CONNECTED")
  // 3. Gap detection (3-10 hours, fallback)
  // 4. Cartridge changes ("Rewind")
  // 5. Deduplication (keep highest confidence)
  // 6. Return { sensorChanges: [], cartridgeChanges: [] }
}
```

### Priority 2: Trigger Points (15 min)
**Update**: `src/components/AGPGenerator.jsx`

```javascript
// After CSV parse success:
const events = await detectAllEvents(csvData);
storeEvents(events);
```

**Update**: `src/components/SensorImport.jsx`

```javascript
// After database import success:
if (csvData?.length > 0) {
  const events = await detectAllEvents(csvData);
  storeEvents(events);
}
```

### Priority 3: JSON Export/Import (15 min)
**Update**: `src/storage/eventStorage.js`

Add:
- `exportEventsJSON()` - Download .agp-events.json
- `importEventsJSON(file)` - Load .json file

### Priority 4: EventManager UI (20 min)
**Create**: `src/components/EventManager.jsx`

Buttons:
- 🔄 Rescan Events
- 💾 Export Events
- 📁 Import Events

### Priority 5: Day Profile Integration (10 min)
**Update**: `src/hooks/useDayProfiles.js`

Replace detection with:
```javascript
const events = getEventsForDate(profile.date);
```

---

## 📂 PROJECT PATHS

```
Project Root:
/Users/jomostert/Documents/Projects/agp-plus/

Related Projects:
/Users/jomostert/Documents/Projects/Sensoren/
  └── master_sensors.db (219 sensors, Oct 2025)

Sample CSV:
/mnt/project/Jo_Mostert_24-10-2025_SAMPLE.csv
```

---

## 🛠️ DESKTOP COMMANDER PATTERNS

```bash
# Read file
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/core/metrics-engine.js

# Create file (use chunks for >30 lines!)
DC: write_file path="..." content="..." mode="rewrite"

# Edit file (exact string matching!)
DC: edit_block file_path="..." old_string="..." new_string="..."

# Search code
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus/src" 
                  pattern="detectSensor" searchType="content"

# Get more results
DC: get_more_search_results sessionId="search_XX_XXXXX" offset=0 length=100
```

---

## 🎯 SUCCESS CRITERIA

**You're done when**:
1. ✅ Database import tested and works
2. ✅ `detectAllEvents()` implemented and tested
3. ✅ Events stored in localStorage after CSV upload
4. ✅ Events stored after database import
5. ✅ EventManager UI works (rescan/export/import)
6. ✅ Day profiles render markers from cached events
7. ✅ No console errors
8. ✅ Print export still works

---

## 🚨 CRITICAL RULES

1. **Always use Desktop Commander** for file ops (not bash/view)
2. **Use full absolute paths** - no relative paths
3. **Chunk files >30 lines** when writing
4. **Test incrementally** - don't build everything at once
5. **localStorage is sync** - perfect for events
6. **Scan once, cache results** - no detection during render

---

## 📞 DEBUGGING

**Import fails?**
- Check: Browser console for sql.js errors
- Check: Network tab for sql-wasm.wasm load
- Check: DB Browser can open .db file

**Detection not working?**
- Add: `console.log('[detectAllEvents]', events)`
- Check: localStorage in DevTools
- Test: Each tier separately (database → alerts → gaps)

**Day profiles broke?**
- Check: Events in localStorage
- Check: `getEventsForDate()` returns correct format
- Check: DayProfileCard receives events prop

---

## 💾 BACKUP BEFORE CHANGES

```bash
# Create backup
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && 
                   cp src/core/day-profile-engine.js src/core/day-profile-engine.js.backup" 
                   timeout_ms=3000

# Restore if needed
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && 
                   cp src/core/day-profile-engine.js.backup src/core/day-profile-engine.js" 
                   timeout_ms=3000
```

---

## 📊 CURRENT GIT STATE

```
Branch: v3.0-dev
Latest Commit: 4870f20
Commits ahead: 7 (need to push? No - already pushed!)
Status: Clean ✅

Recent Commits:
- 4870f20: docs(v3.6): Add changelog entry and status summary
- 2797d6d: docs(v3.6): Update architecture & add event detection handoff
- 8c0b553: refactor(v3.6): Switch sensor storage to localStorage
```

---

## 🎓 REFERENCE CODE

### Event Format Example
```javascript
{
  sensorChanges: [
    {
      date: "2025/10/19",
      timestamp: "2025-10-19T01:01:13Z",
      minuteOfDay: 61,
      source: "database",  // or "alert" or "gap"
      confidence: "high",  // or "medium" or "low"
      lotNumber: "MMT-7030A1.01-2024W37"
    }
  ],
  cartridgeChanges: [
    {
      date: "2025/10/22",
      timestamp: "2025-10-22T17:59:00Z",
      minuteOfDay: 1079
    }
  ],
  version: "1.0",
  lastUpdated: "2025-10-26T15:30:00Z"
}
```

### Detection Priority
```
1. Database (HIGH)   → getSensorsInRange(startDate, endDate)
2. Alerts (MEDIUM)   → CSV rows with alert "SENSOR CONNECTED"
3. Gaps (LOW)        → Data gaps 3-10 hours
```

### Deduplication Logic
```javascript
// If multiple sources detect same date, keep highest confidence
const scores = { high: 3, medium: 2, low: 1 };
if (existingEvent.date === newEvent.date) {
  if (scores[newEvent.confidence] > scores[existingEvent.confidence]) {
    replace existingEvent with newEvent
  }
}
```

---

**Everything committed and pushed** ✅  
**Ready to build!** 🚀

*Last updated: October 26, 2025, 15:50 CET*
