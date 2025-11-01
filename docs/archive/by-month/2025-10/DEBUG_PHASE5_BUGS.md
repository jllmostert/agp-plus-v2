# 🐛 DEBUG OVERZICHT - Phase 5 Issues

**Datum**: 2025-10-31 11:45 CET  
**Status**: Commit geslaagd (1575efc) - Bugs geïdentificeerd - WACHT OP GO  
**Versie**: v3.1.0

---

## ⚠️ KRITISCH: LES EERST DIT

**STOP! NIET METEEN FIXEN!**

Dit document beschrijft de bugs die gevonden zijn na testing.
Wacht met oplossen tot Jo expliciet de GO geeft.
Bij GO: werk in kleine chunks (max 30 regels code per keer) om context overflow te voorkomen.

---

## 🔴 BUG #1: Default Lock State bij Fresh Reload

### Symptoom
Bij fresh reload (cache gewist) staan niet alle sensors >30 dagen automatisch op slot.

### Expected Behavior
```
Fresh reload → initializeManualLocks() runs
→ Alle sensors >30 dagen krijgen 🔒 (locked)
→ Alle sensors ≤30 dagen krijgen 🔓 (unlocked)
→ Lock states opgeslagen in localStorage
```

### Actual Behavior
```
[ONBEKEND - MOET GETEST WORDEN]
Mogelijk: Locks worden niet correct geïnitialiseerd
Of: Initialization happens maar wordt overschreven
```

### Locatie
**File**: `src/storage/sensorStorage.js`  
**Function**: `initializeManualLocks()` (Lines ~440-490)  
**Called from**: `SensorHistoryModal.jsx` Line 33 (useEffect on mount)

### Mogelijke Oorzaken
1. **Timing issue**: initializeManualLocks() runs voor sensor data geladen is
2. **Async problem**: Sensor data load is async, init is sync
3. **Overwrite**: Iets overschrijft de locks na initialisatie
4. **Calculation error**: Age calculation fout (timezone? date parsing?)

### Debug Checklist (voor diagnose)
```javascript
// In SensorHistoryModal.jsx useEffect
console.log('[DEBUG] Initializing locks...');
const result = initializeManualLocks();
console.log('[DEBUG] Init result:', result);
console.log('[DEBUG] Lock states:', JSON.parse(localStorage.getItem('agp-sensor-locks')));

// In initializeManualLocks()
console.log('[DEBUG] Processing sensor:', sensor.sensor_id, 'age:', daysOld, 'locked:', shouldLock);
```

### Fix Strategy (ALLEEN NA GO)
**Stap 1**: Add debug logging (chunk 1)
**Stap 2**: Identify timing/async issue (analyze logs)
**Stap 3**: Fix initialization order (chunk 2)
**Stap 4**: Verify locks persist (test)
**Stap 5**: Clean up debug logs (chunk 3)

### Test Scenario
```
1. localStorage.clear()
2. Reload app (fresh)
3. Open Sensor History modal
4. Check console logs
5. Inspect lock states
6. Expected: All >30d sensors have 🔒
```

---

## 🔴 BUG #2: Force Reload op Lock Toggle / Delete

### Symptoom
Elke keer wanneer je op een slotje klikt (toggle) of een sensor verwijdert (delete), wordt de pagina geforceerd naar de hoofdpagina.

### Expected Behavior
```
User op Sensor History modal
→ Klikt 🔒 (toggle)
→ Icon verandert naar 🔓
→ BLIJFT OP SENSOR HISTORY MODAL
→ Kan meerdere acties achter elkaar doen
→ Klikt X (sluit modal)
→ Dan pas refresh hoofd pagina
```

### Actual Behavior
```
User op Sensor History modal
→ Klikt 🔒 (toggle)
→ HELE APP RELOAD (location.reload())
→ Modal verdwijnt
→ Terug naar hoofd pagina
→ Moet modal weer openen voor volgende actie
```

### Locatie
**File**: `src/components/SensorHistoryModal.jsx`

**Probleem Code**:
```javascript
// Line ~655: handleLockToggle
const handleLockToggle = (sensorId) => {
  toggleSensorLock(sensorId);
  window.location.reload();  // ❌ PROBLEEM!
};

// Line ~795: handleDelete
const handleDelete = (sensorId) => {
  if (confirm('Sensor definitief verwijderen?')) {
    deleteSensor(sensorId);
    window.location.reload();  // ❌ PROBLEEM!
  }
};
```

### Root Cause
Gebruik van `window.location.reload()` forceert volledige page reload.
Dit is te agressief - modal context gaat verloren.

### Fix Strategy (ALLEEN NA GO)
**Stap 1**: Replace location.reload() met state update (chunk 1)
```javascript
// Instead of location.reload():
setSensorList(prevList => prevList.filter(s => s.sensor_id !== sensorId));
// Of: trigger re-render van sensor list
```

**Stap 2**: Add local state refresh in modal (chunk 2)
```javascript
const [refreshTrigger, setRefreshTrigger] = useState(0);

const handleLockToggle = (sensorId) => {
  toggleSensorLock(sensorId);
  setRefreshTrigger(prev => prev + 1);  // ✅ Local refresh
};
```

**Stap 3**: Only reload parent on modal close (chunk 3)
```javascript
// In modal close handler
const handleClose = () => {
  onClose();
  // Optionally refresh parent:
  if (changesMade) {
    // Parent component refreshes
  }
};
```

### Affected UX
- ❌ Kan geen bulk operations doen
- ❌ Slow (telkens wachten op reload)
- ❌ Modal state lost (scroll position, filters)
- ❌ Frustrerende workflow

### Test Scenario
```
1. Open Sensor History modal
2. Klik 5x op verschillende lock icons
3. Expected: 5 toggles, modal blijft open
4. Actual (now): 5 page reloads, zeer traag
```

---

## 🔴 BUG #3: Sensors Komen Terug na Delete

### Symptoom
Soms lukt het om sensors te deleten, maar bij refresh worden ze terug uit geheugen gehaald en opnieuw geplaatst.

### Expected Behavior
```
User deletes sensor X
→ Verwijderd uit localStorage
→ Verwijderd uit SQLite (indien aanwezig)
→ Verwijderd uit memory array
→ Na refresh: Sensor X is weg (permanent)
```

### Actual Behavior
```
User deletes sensor X
→ Lijkt verwijderd
→ Refresh page
→ Sensor X is terug! 😱
```

### Locatie
**File**: `src/storage/sensorStorage.js`  
**Function**: `deleteSensor()` (Lines ~350-400?)  
**Also**: `useSensorDatabase.js` (sensor loading logic)

### Mogelijke Oorzaken

#### Oorzaak 1: Incomplete Delete
```javascript
// deleteSensor() deletes from localStorage only
// BUT sensor still in SQLite database
// On reload: SQLite sensors re-synced → sensor komt terug
```

#### Oorzaak 2: Sync Overwrite
```javascript
// Delete happens VOOR sync
// Sync runs: "Oh, sensor in SQLite but not in localStorage?"
// Sync adds it back → sensor reappears
```

#### Oorzaak 3: Multiple Data Sources
```javascript
// Sensor exists in 3 places:
// 1. localStorage (deleted ✓)
// 2. SQLite database (NOT deleted ✗)
// 3. CSV detection (re-detected on import ✗)
```

### Debug Checklist (voor diagnose)
```javascript
// In deleteSensor()
console.log('[DELETE] Attempting delete:', sensorId);
console.log('[DELETE] Before - localStorage:', db.sensors.length);
console.log('[DELETE] Before - SQLite:', /* count */);

// After delete
console.log('[DELETE] After - localStorage:', db.sensors.length);
console.log('[DELETE] After - SQLite:', /* count */);

// On reload
console.log('[SYNC] Sensors being synced from SQLite:', sensors.length);
console.log('[SYNC] Sensor IDs:', sensors.map(s => s.sensor_id));
```

### Fix Strategy (ALLEEN NA GO)

**Stap 1**: Audit deleteSensor() function (chunk 1)
- Check waar het delete gebeurt
- Verify localStorage delete werkt
- Check of SQLite ook gedelete wordt

**Stap 2**: Fix SQLite deletion (chunk 2)
```javascript
// Ensure deletion from ALL sources
function deleteSensor(sensorId) {
  // 1. Remove from localStorage
  const db = loadDatabase();
  db.sensors = db.sensors.filter(s => s.sensor_id !== sensorId);
  saveDatabase(db);
  
  // 2. Remove from SQLite (if exists)
  // TODO: Add SQLite deletion
  
  // 3. Mark as deleted (prevent re-sync)
  const deleted = JSON.parse(localStorage.getItem('deleted-sensors') || '[]');
  deleted.push(sensorId);
  localStorage.setItem('deleted-sensors', JSON.stringify(deleted));
}
```

**Stap 3**: Prevent re-sync of deleted sensors (chunk 3)
```javascript
// In syncUnlockedSensorsToLocalStorage()
const deletedSensors = JSON.parse(localStorage.getItem('deleted-sensors') || '[]');
const sensorsToSync = sensors.filter(s => !deletedSensors.includes(s.sensor_id));
```

**Stap 4**: Test thoroughly (chunk 4)
- Delete sensor
- Check localStorage
- Check SQLite
- Reload
- Verify sensor gone

### Critical Questions
1. Heeft deleteSensor() toegang tot SQLite database?
2. Wordt SQLite database read-only behandeld?
3. Moet deleted sensors lijst bijgehouden worden?
4. Hoe detecteren we "tombstones" (deleted maar re-synced)?

### Test Scenario
```
1. Find sensor X (note ID)
2. Unlock if locked
3. Delete sensor X
4. Verify gone from modal
5. Check localStorage: sensor X absent?
6. Reload browser (hard refresh)
7. Check localStorage: sensor X still absent?
8. Open modal: sensor X absent?
9. EXPECTED: Sensor X permanent gone
```

---

## 📊 IMPACT ANALYSIS

### Bug Severity Ranking
```
BUG #3 (Sensors komen terug):    🔴 CRITICAL
BUG #2 (Force reload):            🟡 HIGH  
BUG #1 (Default lock state):      🟡 MEDIUM
```

### User Impact
**Bug #3**: Data integrity issue - users lose trust in delete functionality
**Bug #2**: UX frustration - workflow significantly slowed down
**Bug #1**: Safety issue - old data not protected by default

### Fix Order Recommendation
```
1. BUG #3 eerst - Data integrity critical
2. BUG #2 daarna - UX improvement
3. BUG #1 laatste - Enhancement (workaround: manual lock)
```

---

## 🧪 TEST PROTOCOL (Na Fixes)

### Pre-Fix Testing (EERST DOEN)
```
[ ] Test Bug #1: Check default lock states fresh reload
[ ] Test Bug #2: Count page reloads during workflow
[ ] Test Bug #3: Try delete, verify persistence
[ ] Document exact behavior (screenshots/logs)
```

### Post-Fix Testing (NA ELKE FIX)
```
Bug #1 Fix:
[ ] Fresh reload → All >30d sensors locked
[ ] Lock states persist
[ ] No console errors

Bug #2 Fix:
[ ] Toggle 5 locks → No page reload
[ ] Delete sensor → No page reload
[ ] Close modal → Then reload (optional)
[ ] Workflow smooth

Bug #3 Fix:
[ ] Delete sensor from localStorage
[ ] Verify removed from SQLite
[ ] Hard refresh (Cmd+Shift+R)
[ ] Sensor stays deleted
[ ] No phantom sensors
```

### Integration Testing
```
[ ] Delete locked sensor workflow:
    - Toggle unlock → stays on modal
    - Delete → stays on modal
    - Close modal → refresh
    - Sensor gone permanently
    
[ ] Bulk operations workflow:
    - Unlock 3 sensors → no reload
    - Delete 3 sensors → no reload  
    - Close modal → verify all gone
```

---

## 📁 FILES TO MODIFY (Bij Fixes)

### Bug #1 (Default Lock State)
```
src/storage/sensorStorage.js
  - initializeManualLocks() function
  - Age calculation logic
  
src/components/SensorHistoryModal.jsx
  - useEffect initialization timing
```

### Bug #2 (Force Reload)
```
src/components/SensorHistoryModal.jsx
  - handleLockToggle() function (remove location.reload)
  - handleDelete() function (remove location.reload)
  - Add state management for local refresh
  - Modal close handler
```

### Bug #3 (Sensors Komen Terug)
```
src/storage/sensorStorage.js
  - deleteSensor() function (add SQLite deletion)
  - syncUnlockedSensorsToLocalStorage() (prevent re-sync deleted)
  - New: deleted sensors tracking
  
src/hooks/useSensorDatabase.js
  - Sensor loading logic (respect deleted list)
```

---

## 🚦 FIX WORKFLOW (Wanneer GO Gegeven)

### Stap-voor-Stap Aanpak

1. **Pre-Fix Testing** (5-10 min)
   - Document exact behavior each bug
   - Collect console logs
   - Screenshots indien relevant

2. **Fix Bug #3** (CRITICAL - eerste prioriteit)
   - Chunk 1: Add debug logging
   - Chunk 2: Fix deleteSensor() voor beide sources
   - Chunk 3: Add deleted sensors tracking
   - Chunk 4: Update sync to respect deleted list
   - Test: Verify persistence

3. **Fix Bug #2** (HIGH - tweede prioriteit)
   - Chunk 1: Replace location.reload with state
   - Chunk 2: Test toggle without reload
   - Chunk 3: Test delete without reload
   - Test: Verify smooth workflow

4. **Fix Bug #1** (MEDIUM - derde prioriteit)
   - Chunk 1: Add debug to init function
   - Chunk 2: Fix timing/async issue
   - Chunk 3: Verify default lock states
   - Test: Fresh reload test

5. **Integration Testing** (10-15 min)
   - All bugs fixed
   - Complete workflow test
   - Performance check
   - Edge cases

6. **Git Commit** (per bug of combined)
   ```bash
   git commit -m "Fix: Bug #X - [description]"
   ```

---

## 💡 DESIGN PRINCIPES (Bij Fixes)

### Keep It Simple
- Minimale code changes
- Geen breaking changes
- Backwards compatible

### Test Driven
- Test VOOR fix (document behavior)
- Test NA fix (verify solved)
- Test integration (no regressions)

### Chunk Strategisch
- Max 30 regels per chunk
- Één functie per keer
- Test tussen chunks

### Defensive Programming
- Null checks
- Error handling
- Console logging (voor debug)

---

## 📝 COMMIT TEMPLATES (Voor Later)

### Bug #1 Fix
```
Fix: Default lock state initialization

- Fixed timing issue in initializeManualLocks()
- Sensors >30 days now properly locked on fresh reload
- Added age calculation validation
- Verified lock state persistence

Tested: Fresh reload with 220 sensors, all locks correct
```

### Bug #2 Fix
```
Fix: Remove forced page reload on lock toggle/delete

- Replaced location.reload() with local state updates
- Lock toggle now instant, no page reload
- Delete operation stays on modal
- Added refresh on modal close
- Improved UX: bulk operations now possible

Tested: 10 consecutive operations without reload
```

### Bug #3 Fix
```
Fix: Prevent deleted sensors from reappearing

- Enhanced deleteSensor() to remove from all sources
- Added deleted sensors tracking list
- Sync now respects deleted sensors
- Fixed SQLite deletion
- Permanent deletion verified

Tested: Delete + hard refresh, sensor stays deleted
```

---

## ✅ SUCCESS CRITERIA

Phase 5 bugs zijn opgelost wanneer:

- [ ] Bug #1: Fresh reload locks all >30d sensors correctly
- [ ] Bug #2: No page reload on toggle/delete (smooth workflow)
- [ ] Bug #3: Deleted sensors stay deleted (permanent)
- [ ] No console errors during operations
- [ ] Performance acceptable (<100ms operations)
- [ ] Integration test passes
- [ ] All fixes committed to git

---

**STATUS: WACHT OP GO VAN JO**

Zodra Jo de GO geeft:
1. Pre-fix testing uitvoeren
2. Bugs fixen in chunks (één bug per keer)
3. Tussen-door testen
4. Git commits per fix
5. Final integration test

**LET OP**: Werk ALTIJD in chunks ≤30 regels om context overflow te voorkomen!

---

**Document klaar voor gebruik** ✅
