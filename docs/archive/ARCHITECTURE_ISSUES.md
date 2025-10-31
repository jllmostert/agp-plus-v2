# ARCHITECTUUR ANALYSE - Sensor Storage Issues

**Datum**: 2025-10-31  
**Status**: DIAGNOSE IN UITVOER  
**Focus**: Data flow problemen en inconsistenties

---

## 🎯 GERAPPORTEERDE PROBLEMEN

1. **CSV Import "Ignore" werkt niet** - sensoren worden toch toegevoegd (8 i.p.v. 4)
2. **Sommige sensoren niet verwijderbaar** - bijv. #217
3. **Sort functionaliteit werkt niet** - vreemde volgorde
4. **#ID's veranderen** - chronological_index niet stabiel

---

## 🔍 DATA FLOW ANALYSE

### Huidige Architectuur: 3-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                          │
├─────────────────────────────────────────────────────────────┤
│  1. SQLite DB          2. localStorage        3. React State│
│     (read-only)           (persistent)           (volatile)  │
│     - Guardian.db         - STORAGE_KEY          - sensors[] │
│     - sensors table       - sensor records       - in memory │
│     - >30 days old        - ≤30 days recent     - UI state  │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ MERGE
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    useSensorDatabase()                       │
│  Location: src/hooks/useSensorDatabase.js                   │
│  - Fetches SQLite sensors                                   │
│  - Fetches localStorage sensors                             │
│  - Merges arrays (POTENTIAL DUPLICATION ISSUE)              │
│  - Returns combined array to React                          │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  SensorHistoryModal.jsx                      │
│  - Receives merged sensors[]                                │
│  - Calculates chronological_index (RECALCULATES EVERY TIME) │
│  - Merges lock status from localStorage                     │
│  - Renders table                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ KRITIEKE PROBLEMEN GEÏDENTIFICEERD

### Probleem 1: Chronological Index is NIET PERSISTENT

**Code in SensorHistoryModal.jsx (lines 70-88):**
```javascript
const sensorsWithIndex = useMemo(() => {
  // Sort by start_date ascending
  const sorted = [...sensors].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return dateA - dateB; // Ascending
  });
  
  // Assign index 1, 2, 3...
  const withIndex = sorted.map((sensor, idx) => ({
    ...sensor,
    chronological_index: idx + 1, // ⚠️ HERBEREKEND ELKE KEER
  }));
  
  return withIndex;
}, [sensors, refreshKey]);
```

**Waarom dit problematisch is:**
1. Index wordt BEREKEND, niet opgeslagen
2. Als de `sensors` array verandert (delete, add), veranderen ALLE indexen
3. Sensor #217 wordt na delete van sensor #5 ineens sensor #216
4. **NIET STABIEL** - kan niet als unieke identifier gebruikt worden

**Verwacht gedrag volgens documentatie:**
- Sensor #1 blijft altijd #1 (oudste sensor, maart 2022)
- Sensor #219 blijft altijd #219 (nieuwste sensor)
- Index zou persistent moeten zijn (opgeslagen in database)

**Huidige realiteit:**
- Index is volatiel (afhankelijk van huidige array lengte)
- Verandert bij elke wijziging van de array
- Dit verklaart Jo's observatie: "#ID's veranderen"

---

### Probleem 2: Onduidelijke Sensor Identificatie

**Welk veld is de ECHTE unieke ID?**

Bestanden gebruiken verschillende velden:

```javascript
// sensorStorage.js gebruikt:
sensor.sensor_id        // ✅ Primaire sleutel

// Maar wat is sensor_id?
// - Is het een UUID? (bijv. "a7f3c2...")
// - Is het een timestamp? (bijv. "2025-09-15T08:30:00Z")
// - Is het een sequence number?

// NIET DUIDELIJK uit de code!
```

**Inconsistenties:**
- `sensor_id` wordt gebruikt voor lookups
- `chronological_index` wordt gebruikt voor display
- `start_date` wordt gebruikt voor sorting
- **GEEN enkele plek wordt duidelijk gedocumenteerd WAT sensor_id IS**

---

### Probleem 3: CSV Import Flow NIET GEANALYSEERD

Jo's probleem: "Ignore button werkt niet - 8 sensoren toegevoegd i.p.v. 4"

**Waar gebeurt CSV import?**
- ❌ Niet in `sensorStorage.js` (alleen database operations)
- ❌ Niet in `SensorHistoryModal.jsx` (alleen display)
- ❓ Waarschijnlijk in `AGPGenerator.jsx` of een CSV parser component

**Zonder die code te zien kunnen we NIET diagnosen:**
- Waar wordt "ignore" vs "confirm" besloten?
- Hoe worden sensors toegevoegd aan localStorage?
- Gebeurt er duplicate checking?

**ACTIE VEREIST:**
Need to read CSV import flow code

---

### Probleem 4: Lock State Merge Inconsistentie

**Code merge lock status (SensorHistoryModal.jsx, line 74-80):**
```javascript
const withIndex = sorted.map((sensor, idx) => {
  const lockStatus = getManualLockStatus(sensor.sensor_id);
  return {
    ...sensor,
    chronological_index: idx + 1,
    is_manually_locked: lockStatus.isLocked, // ✅ Merge from localStorage
    lock_reason: lockStatus.reason
  };
});
```

**Dit is GOED - maar:**

1. **Wanneer worden sensors naar localStorage gesynchroniseerd?**
   - `syncUnlockedSensorsToLocalStorage()` wordt ergens aangeroepen
   - Maar wanneer? Bij startup? Bij CSV import? Bij delete?

2. **Format conversie gebeurt in sync function:**
```javascript
const localStorageFormat = {
  sensor_id: sensor.sensor_id,
  start_date: sensor.start_date,
  end_date: sensor.end_date || null,
  lot_number: sensor.lot_number || null,
  hw_version: sensor.hw_version || null,
  notes: sensor.notes || '',
  reason_stop: sensor.failure_reason || null  // ⚠️ NAAMGEVING: failure_reason vs reason_stop
};
```

**Naamgeving probleem:**
- SQLite gebruikt: `failure_reason`
- localStorage gebruikt: `reason_stop`
- Wat als code per ongeluk verkeerde veld gebruikt?

---

### Probleem 5: Delete Sensor - Tombstone Pattern Correct?

**Code in sensorStorage.js (lines 547-569):**
```javascript
export function deleteSensorWithLockCheck(sensorId) {
  const db = getSensorDatabase();
  
  // 1. Check if sensor exists in localStorage
  const sensor = db.sensors.find(s => s.sensor_id === sensorId);
  
  if (!sensor) {
    // ⚠️ Sensor not in localStorage - maar WEL in SQLite?
    return { success: true, message: '✓ Sensor verwijderd (alleen uit geheugen)' };
  }
  
  // 2. Check lock
  if (sensor.is_manually_locked) {
    return { success: false, message: '🔒 Sensor vergrendeld' };
  }
  
  // 3. Delete from localStorage
  db.sensors = db.sensors.filter(s => s.sensor_id !== sensorId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  
  // 4. Add to tombstone list
  addDeletedSensor(sensorId);
  
  return { success: true };
}
```

**Vraag:** Wat als sensor:
1. Alleen in SQLite staat (>30 dagen oud)?
2. Alleen in React state staat (uit CSV, nog niet gepersisteerd)?
3. In beide databases staat maar met verschillende data?

**Antwoord uit code:**
- Sensor alleen in SQLite: Delete "succeeds" maar doet eigenlijk niets (sensor komt terug na refresh)
- Sensor alleen in React: Delete "succeeds" maar alleen uit volatile state
- Sensor in beide: Delete werkt correct

**Maar Jo's probleem:**
> "Sommige sensoren kan ik niet verwijderen (#217)"

Dit suggereert:
- Sensor is ⚠️ WEL unlocked (anders zou error message verschijnen)
- Sensor is ⚠️ WEL in localStorage (anders zou "success" message komen)
- Sensor wordt ⚠️ TOCH niet verwijderd

**HYPOTHESE:**
- Delete werkt, maar sensor komt terug bij volgende render
- Mogelijk omdat sync logic sensors opnieuw toevoegt
- Of omdat `sensors` prop niet update in SensorHistoryModal

---

## 🚨 VOLGENDE STAPPEN

### Must Read:
1. `src/hooks/useSensorDatabase.js` - merge logic
2. CSV import component - ignore button handling
3. AGPGenerator.jsx - waar wordt sync aangeroepen?

### Must Test:
1. Delete sensor → Check localStorage → Check SQLite → Hard refresh
2. Delete sensor → Check deleted-sensors list → Check sync logic
3. Import CSV with ignore → Track through console logs

---

**ARCHITECTUUR CONCLUSIE:**

De data flow is **te complex** met 3 lagen die niet goed syncen.
Er zijn **naming inconsistencies** en **volatile state calculations**.

Jo's observaties zijn **valide** - dit is niet "user error", dit is **architectural fragility**.

---

*EINDE EERSTE ANALYSE - Zie volgende documenten voor specifieke bug diagnoses*
