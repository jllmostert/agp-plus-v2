# 🚨 KRITIEK PROBLEEM: DUPLICATE SENSORS IN MERGE

**Datum**: 2025-10-31  
**Locatie**: `src/hooks/useSensorDatabase.js` line 187-189  
**Severity**: CRITICAL - Dit verklaart ALLE gerapporteerde bugs

---

## ⚠️ PROBLEEM: GEEN DUPLICATE CHECKING

### Code in useSensorDatabase.js (line 187-189):

```javascript
// Merge: localStorage sensors first (newest), then SQLite
const allSensors = [...localSensorsConverted, ...sensorData];

debug.log('[useSensorDatabase] Total sensors (merged):', {
  count: allSensors.length,  // âš ï¸ BEVAT DUPLICATEN!
  localStorage: localSensorsConverted.length,
  sqlite: sensorData.length,
  runningSensors: allSensors.filter(s => s.status === 'running').length
});
```

---

## 🎯 WAT GEBEURT ER?

### Scenario: Recent sensor (≤30 dagen oud)

1. **Sensor wordt gedetecteerd uit CSV**
   - Start: 2025-10-15 08:00
   - Wordt toegevoegd aan localStorage via `addSensor()`
   
2. **Bij volgende reload:**
   - `useSensorDatabase()` laadt SQLite: Sensor zit daar (30 dagen oud)
   - `getSensorHistory()` laadt localStorage: Sensor zit daar ook
   - **MERGE zonder duplicate check**:
     ```javascript
     allSensors = [
       { sensor_id: "2025-10-15T08:00:00Z", ... }, // localStorage
       { sensor_id: "2025-10-15T08:00:00Z", ... }  // SQLite - DUPLICATE!
     ]
     ```

3. **Resultaat:**
   - Sensor verschijnt **2x in de tabel**
   - Delete verwijdert 1 instance → andere blijft zichtbaar
   - Chronological index klopt niet meer
   - Sort geeft vreemde resultaten

---

## 📊 VERIFICATIE IN CODE

### 1. syncUnlockedSensorsToLocalStorage() (sensorStorage.js line 195-210)

```javascript
const unlockedSensors = allSensors.filter(s => {
  const startDate = new Date(s.start_date);
  const isRecent = startDate >= thirtyDaysAgo;
  const isDeleted = deletedSensors.includes(s.sensor_id);
  return isRecent && !isDeleted;
});

// âš ï¸ MAAR: Deze functie krijgt âœ… allSensors met duplicaten binnen!

const existingIds = new Set(db.sensors.map(s => s.sensor_id));

unlockedSensors.forEach(sensor => {
  if (!existingIds.has(sensor.sensor_id)) {
    db.sensors.push(localStorageFormat);
    addedCount++;
  }
});
```

**Probleem:**
- `allSensors` bevat al duplicaten (localStorage + SQLite)
- `unlockedSensors` filtert alleen op leeftijd, niet op duplicaten
- **Wat als sensor 2x in allSensors zit?**
  - Beide instances zitten in `unlockedSensors`
  - Eerste wordt toegevoegd aan localStorage
  - Tweede wordt NIET toegevoegd (existingIds check)
  - **Maar beide blijven in de UI zichtbaar!**

---

### 2. CSV Import Flow - HYPOTHESE

Laten we aannemen dat CSV import werkt via:
```javascript
// Ergens in CSV parser:
const newSensors = parseCSV(file);

newSensors.forEach(sensor => {
  addSensor(sensor); // Voegt toe aan localStorage
});
```

**Als gebruiker klikt op "Ignore":**
- Verwachting: Sensor wordt NIET toegevoegd
- Realiteit: ???

**We moeten CSV import code lezen om te zien:**
1. Hoe wordt "ignore" vs "confirm" geïmplementeerd?
2. Wordt `addSensor()` aangeroepen voor ignored sensors?
3. Is er een preview state die per ongeluk wordt toegevoegd?

---

## 🔍 VERIFICATIE TEST

Om dit te bewijzen, kunnen we:

1. **Check localStorage count:**
   ```javascript
   const lsSensors = JSON.parse(localStorage.getItem('agp-sensor-database')).sensors;
   console.log('localStorage sensors:', lsSensors.length);
   ```

2. **Check SQLite count:**
   - Open `/public/sensor_database.db` in SQLite browser
   - `SELECT COUNT(*) FROM sensors;`

3. **Check merged count:**
   - Open console in browser
   - Look for log: `[useSensorDatabase] Total sensors (merged): { count: X }`
   - **Als count > (localStorage + SQLite)**: GEEN duplicaten
   - **Als count = (localStorage + SQLite)**: MOGELIJK duplicaten!

**Jo's data:**
- Jo zei: "Sensor history heeft er nu 219"
- Na import: "227 sensoren"
- Verschil: 8 sensoren toegevoegd
- Jo klikte "ignore" bij 4 sensoren
- Dus 4 confirmed + 4 ignored = 8 toegevoegd âš ï¸

Dit suggereert:
- **Ignore button doet NIETS**
- Alle sensoren worden toegevoegd
- OF: Ignore button werkt, maar sensors zijn al duplicaten in de merged list

---

## 🛠️ MOGELIJKE OPLOSSINGEN

### Optie 1: Dedupe in useSensorDatabase

```javascript
// VOOR merge:
const allSensors = [...localSensorsConverted, ...sensorData];

// NA merge: Dedupe op sensor_id
const uniqueSensors = Array.from(
  new Map(allSensors.map(s => [s.sensor_id, s])).values()
);

// Prefer localStorage version (newer data)
const dedupedSensors = [];
const seenIds = new Set();

localSensorsConverted.forEach(s => {
  if (!seenIds.has(s.sensor_id)) {
    dedupedSensors.push(s);
    seenIds.add(s.sensor_id);
  }
});

sensorData.forEach(s => {
  if (!seenIds.has(s.sensor_id)) {
    dedupedSensors.push(s);
    seenIds.add(s.sensor_id);
  }
});

setSensors(dedupedSensors);
```

### Optie 2: Fix syncUnlockedSensorsToLocalStorage

Huidige logica synct sensors ≤30 dagen naar localStorage.
**Maar:** Als sensor al in localStorage zit, moet deze NIET nogmaals uit SQLite worden toegevoegd!

```javascript
// In syncUnlockedSensorsToLocalStorage:
const unlockedSensors = allSensors.filter(s => {
  const isRecent = startDate >= thirtyDaysAgo;
  const isDeleted = deletedSensors.includes(s.sensor_id);
  const alreadyInLocalStorage = existingIds.has(s.sensor_id);
  
  return isRecent && !isDeleted && !alreadyInLocalStorage; // âœ… Check duplicate
});
```

### Optie 3: Herstructureer Data Flow

**Fundamenteel probleem:** 3-layer architecture met overlappende data.

**Beter design:**
1. **Sensors ≤30 dagen**: ALLEEN in localStorage (editable)
2. **Sensors >30 dagen**: ALLEEN in SQLite (read-only)
3. **GEEN overlap** tussen databases

**Implementatie:**
```javascript
// useSensorDatabase:
const sqliteSensors = sensorData.filter(s => {
  const age = (new Date() - new Date(s.start_date)) / (1000*60*60*24);
  return age > 30; // Only load old sensors from SQLite
});

const allSensors = [...localSensorsConverted, ...sqliteSensors];
// âœ… No duplicates possible!
```

---

## 🚨 VOLGENDE STAPPEN

### MUST DO:
1. **Test duplicate hypothesis:**
   - Console log counts: localStorage, SQLite, merged
   - Check for duplicate sensor_ids in merged array
   
2. **Read CSV import code:**
   - Find where "ignore" button is handled
   - Trace if ignored sensors are added to localStorage
   
3. **Implement dedupe fix:**
   - Quick fix: Dedupe in useSensorDatabase
   - Long-term: Restructure data flow

### Files to Read:
- CSV upload component (waar is "ignore" button?)
- AGPGenerator.jsx (waar worden sensors toegevoegd?)

---

**CONCLUSIE:**

Dit is **architecturele fragility** - geen "user error".

De merge logic heeft **geen duplicate protection**, wat leidt tot:
- âŒ Duplicate sensors in UI
- âŒ Delete werkt niet (verwijdert 1 instance, ander blijft)
- âŒ Chronological index klopt niet
- âŒ Sort geeft vreemde resultaten
- âŒ CSV import lijkt "ignore" te negeren (maar mogelijk duplicaten)

**FIX PRIORITEIT: CRITICAL**

---

*EINDE DIAGNOSE DEEL 2*
