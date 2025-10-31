# 🔬 DIAGNOSE SESSIE - Phase 5 Bugs

**Datum**: 2025-10-31 12:00 CET  
**Server**: http://localhost:3012  
**Status**: DIAGNOSE FASE - Vaststellingen documenteren

---

## 📋 DIAGNOSE PROTOCOL

We gaan nu systematisch elke bug diagnosticeren VOOR we gaan coderen.

### Volgorde:
1. **Bug #3** - Sensors komen terug (CRITICAL)
2. **Bug #2** - Force reload (HIGH)
3. **Bug #1** - Default locks (MEDIUM)

---

## 🔬 BUG #3 DIAGNOSE: Sensors Komen Terug

### Test Setup
- Server: http://localhost:3012
- Browser: Chrome (cache gewist)
- Test sensor: [TBD - we kiezen er één]

### Test Stappen

**STAP 1: Identificeer test sensor**
```
[ ] Open app in Chrome
[ ] Open DevTools (Cmd+Opt+I)
[ ] Ga naar Console tab
[ ] Open Sensor History modal
[ ] Kies een recente sensor (<30 dagen) voor test
[ ] Noteer sensor_id: _______________
[ ] Noteer start_date: _______________
```

**STAP 2: Controleer localStorage VOOR delete**
```javascript
// In Console uitvoeren:
const db = JSON.parse(localStorage.getItem('agp-sensor-database'));
console.log('Sensors in localStorage:', db.sensors.length);
console.log('Test sensor aanwezig?', db.sensors.some(s => s.sensor_id === 'TEST_SENSOR_ID'));
```

**Resultaat VOOR delete:**
```
Aantal sensors in localStorage: _______
Test sensor aanwezig: _______
```

**STAP 3: Delete de sensor**
```
[ ] Unlock sensor (als locked)
[ ] Klik DELETE button
[ ] Bevestig
[ ] Page reload happens (Bug #2, verwacht)
```

**STAP 4: Controleer localStorage NA delete**
```javascript
// In Console uitvoeren (na page reload):
const db = JSON.parse(localStorage.getItem('agp-sensor-database'));
console.log('Sensors in localStorage:', db.sensors.length);
console.log('Test sensor nog aanwezig?', db.sensors.some(s => s.sensor_id === 'TEST_SENSOR_ID'));
```

**Resultaat NA delete:**
```
Aantal sensors in localStorage: _______
Test sensor nog aanwezig: _______
```

**STAP 5: Hard refresh en check weer**
```
[ ] Cmd+Shift+R (hard refresh)
[ ] Wacht tot app geladen
[ ] Check console voor sync messages
```

**Console output tijdens reload:**
```
[Plak hier sync messages]
```

**STAP 6: Check localStorage NA hard refresh**
```javascript
const db = JSON.parse(localStorage.getItem('agp-sensor-database'));
console.log('Sensors in localStorage:', db.sensors.length);
console.log('Test sensor terug?', db.sensors.some(s => s.sensor_id === 'TEST_SENSOR_ID'));
```

**Resultaat NA hard refresh:**
```
Aantal sensors in localStorage: _______
Test sensor terug?: _______  ⬅️ DIT IS DE BUG!
```

### DIAGNOSE BEVINDINGEN

**Root Cause Hypothese:**
```
[Wordt ingevuld na test]

Mogelijke oorzaken:
[ ] deleteSensor() verwijdert alleen uit localStorage, niet uit SQLite
[ ] syncUnlockedSensorsToLocalStorage() voegt sensor weer toe
[ ] Geen "deleted sensors" lijst die sync respecteert
[ ] CSV detection vindt sensor opnieuw
```

**Bewijs:**
```
[Wordt ingevuld na test]
```

**Bevestigde Root Cause:**
```
[Wordt ingevuld na analyse]
```

---

## 🔬 BUG #2 DIAGNOSE: Force Reload

### Test Setup
Zelfde server/browser als Bug #3

### Test Stappen

**STAP 1: Test lock toggle**
```
[ ] Open Sensor History modal
[ ] Klik op een lock icon (🔒 of 🔓)
[ ] Observeer: Happens er een page reload?
[ ] Observeer: Blijf je op de modal of terug naar home?
```

**Bevindingen:**
```
Page reload?: _______
Modal blijft open?: _______
```

**STAP 2: Check de code**
```javascript
// In DevTools → Sources → SensorHistoryModal.jsx
// Zoek naar: handleLockToggle

// Verwachte code:
const handleLockToggle = (sensorId) => {
  toggleSensorLock(sensorId);
  window.location.reload();  // ⬅️ DIT IS HET PROBLEEM
};
```

**Gevonden in code:**
```
Line number: _______
Gebruikt location.reload()?: _______
```

**STAP 3: Test delete action**
```
[ ] Unlock een sensor
[ ] Klik DELETE
[ ] Bevestig
[ ] Observeer: Page reload?
```

**Bevindingen:**
```
Page reload na delete?: _______
```

### DIAGNOSE BEVINDINGEN

**Root Cause Bevestigd:**
```
[JA/NEE] Code gebruikt window.location.reload()
[JA/NEE] Dit forceert hele page reload
[JA/NEE] Modal context gaat verloren
```

**Exacte locaties:**
```
File: SensorHistoryModal.jsx
- handleLockToggle: Line _______
- handleDelete: Line _______
```

---

## 🔬 BUG #1 DIAGNOSE: Default Lock State

### Test Setup
**BELANGRIJK**: Deze test vereist FRESH START

### Test Stappen

**STAP 1: Clear localStorage (fresh start)**
```javascript
// In Console:
localStorage.clear();
console.log('localStorage cleared');
location.reload();
```

**STAP 2: Check sync messages**
```
[ ] Watch console tijdens reload
[ ] Zoek naar: [syncUnlockedSensors] messages
[ ] Zoek naar: [initializeManualLocks] messages
```

**Console output:**
```
[Plak hier alle relevante console output]
```

**STAP 3: Open Sensor History modal**
```
[ ] Klik op "Sensor History" of equivalent
[ ] Modal opent
[ ] Check console voor initialization messages
```

**STAP 4: Inspecteer lock states**
```javascript
// In Console:
const locks = JSON.parse(localStorage.getItem('agp-sensor-locks') || '{}');
console.log('Total locks:', Object.keys(locks).length);

// Count locked vs unlocked
let lockedCount = 0;
let unlockedCount = 0;
Object.values(locks).forEach(isLocked => {
  if (isLocked) lockedCount++;
  else unlockedCount++;
});
console.log('Locked:', lockedCount);
console.log('Unlocked:', unlockedCount);
```

**Resultaat:**
```
Total locks: _______
Locked (should be ~200): _______
Unlocked (should be ~20): _______
```

**STAP 5: Visual check in modal**
```
[ ] Scroll door sensor list
[ ] Check: Hebben oude sensors (>30d) een 🔒?
[ ] Check: Hebben recente sensors (≤30d) een 🔓?
```

**Visual check resultaat:**
```
Oude sensors hebben 🔒?: _______
Recente sensors hebben 🔓?: _______
```

**STAP 6: Check een specifieke oude sensor**
```javascript
// Pick een sensor >30 dagen oud
const testOldSensorId = 'SNS_2025XXXX_XXX';  // Vul in

// Check lock status
const locks = JSON.parse(localStorage.getItem('agp-sensor-locks') || '{}');
console.log('Old sensor locked?', locks[testOldSensorId]);

// Check age
const db = JSON.parse(localStorage.getItem('agp-sensor-database'));
const sensor = db.sensors.find(s => s.sensor_id === testOldSensorId);
const startDate = new Date(sensor.start_date);
const now = new Date();
const daysOld = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
console.log('Sensor age (days):', daysOld);
```

**Resultaat specifieke sensor:**
```
Sensor ID: _______
Age: _______ days
Expected locked: _______ (YES if >30d)
Actually locked: _______
```

### DIAGNOSE BEVINDINGEN

**Root Cause Hypothese:**
```
[Wordt ingevuld na test]

Mogelijke oorzaken:
[ ] initializeManualLocks() runs niet
[ ] Runs wel maar age calculation fout
[ ] Timing issue (runs voor data geladen is)
[ ] Lock states worden overschreven
```

**Bewijs:**
```
[Wordt ingevuld na test]
```

**Bevestigde Root Cause:**
```
[Wordt ingevuld na analyse]
```

---

## 📊 DIAGNOSE SAMENVATTING

**Na alle tests ingevuld:**

### Bug #3: Sensors Komen Terug
- **Root Cause**: _______
- **Bewijs**: _______
- **Fix Complexity**: _______ (LOW/MEDIUM/HIGH)

### Bug #2: Force Reload
- **Root Cause**: _______
- **Bewijs**: _______
- **Fix Complexity**: _______ (LOW/MEDIUM/HIGH)

### Bug #1: Default Lock State
- **Root Cause**: _______
- **Bewijs**: _______
- **Fix Complexity**: _______ (LOW/MEDIUM/HIGH)

---

## 🎯 VOLGENDE STAP

Na diagnose compleet:
1. Review bevindingen met Jo
2. Bevestig root causes
3. Plan fixes in chunks
4. Begin implementatie

---

**KLAAR VOOR DIAGNOSE TESTS**

Server: http://localhost:3012
Chrome: Open en klaar
Console: Open DevTools

**Begin met Bug #3 diagnose (CRITICAL)** ⬇️
