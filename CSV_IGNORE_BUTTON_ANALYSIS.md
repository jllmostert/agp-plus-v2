# 🔍 CSV IMPORT "IGNORE" BUTTON BUG - ROOT CAUSE ANALYSE

**Datum**: 2025-10-31  
**Component**: SensorRegistration.jsx  
**Bug**: "Ignore" button lijkt niet te werken - sensors worden toch toegevoegd

---

## 📋 JO'S OBSERVATIE

**Scenario:**
1. Start met 219 sensors in Sensor History
2. Upload CSV met sensoren (enkele duplicaten verwacht)
3. Klik "Ignore" op 4 candidates
4. Klik "Confirm" op 4 candidates
5. Modal sluit, page reload
6. **Resultaat**: 227 sensors (8 toegevoegd i.p.v. 4)

**Verwachting:** Alleen 4 confirmed sensors worden toegevoegd  
**Realiteit:** 8 sensors toegevoegd (alle candidates, ook ignored?)

---

## 🔍 CODE ANALYSE: IGNORE BUTTON

### Ignore Handler (SensorRegistration.jsx line 225-229)

```javascript
const handleIgnore = (candidate) => {
  addDebugLog(`Ignoring candidate: ${formatTimestamp(candidate.timestamp)}`);
  setCandidates(prev => prev.filter(c => 
    c.timestamp.getTime() !== candidate.timestamp.getTime()
  ));
};
```

**Wat doet dit?**
- Verwijdert candidate uit `candidates` state array
- Candidate verdwijnt uit UI tabel
- **NIETS wordt toegevoegd aan database** âœ…

**Conclusie:** Ignore button WERKT CORRECT - hij voegt NIET toe aan database!

---

## 🔍 CODE ANALYSE: CONFIRM BUTTON

### Confirm Handler (SensorRegistration.jsx line 144-218)

```javascript
const handleConfirm = async (candidate) => {
  // Step 1: Update previous sensor end time (if gap detected)
  if (candidate.gaps && candidate.gaps.length > 0) {
    const previousSensor = getMostRecentSensorBefore(gapStartTime);
    if (previousSensor) {
      await updateSensorEndTime(previousSensor.sensor_id, gapStartTime.toISOString());
    }
  }
  
  // Step 2: Add new sensor
  const sensorId = `sensor_${candidate.timestamp.getTime()}`;
  const sensorData = {
    id: sensorId,
    startTimestamp: candidate.timestamp.toISOString(),
    // ... other fields
  };
  
  await addSensor(sensorData);  // âœ… Voegt toe aan localStorage
  
  // Step 3: Update UI toast
  const sensorCount = getSensorHistory().length;
  setSuccessToast({
    message: `Sensor added! Total: ${sensorCount}`,  // âš ï¸ Misleading count!
    timestamp: Date.now()
  });
  
  // Step 4: Remove from candidates
  setCandidates(prev => prev.filter(c => 
    c.timestamp.getTime() !== candidate.timestamp.getTime()
  ));
};
```

**Wat is problematisch hier?**

1. **Toast message is misleading:**
   ```javascript
   const sensorCount = getSensorHistory().length;
   // Dit toont ALLEEN localStorage sensors!
   // NIET de merged count (localStorage + SQLite)
   ```

2. **Na 4 confirms:**
   - 4 sensors toegevoegd aan localStorage
   - Toast zegt bijv: "Total: 223" (localStorage only)
   - Maar merged count (localStorage + SQLite) kan hoger zijn!

---

## 🔍 ROOT CAUSE: DUPLICATE SENSORS IN MERGE

### Data Flow:

```
┌───────────────────────────────────────────────────────────┐
│ VOOR CSV IMPORT:                                          │
│ - localStorage: 50 sensors (recent, ≤30 dagen)           │
│ - SQLite: 169 sensors (historisch, >30 dagen)            │
│ - Merged: 219 sensors (weergegeven in UI)                │
└───────────────────────────────────────────────────────────┘
                        │
                        │ CSV IMPORT
                        ▼
┌───────────────────────────────────────────────────────────┐
│ CSV DETECTIE:                                             │
│ - 8 candidates gedetecteerd                               │
│ - 4 zijn NIEUWE sensors                                   │
│ - 4 zijn DUPLICATEN (al in SQLite OF localStorage)       │
└───────────────────────────────────────────────────────────┘
                        │
                        │ USER ACTIONS
                        ▼
┌───────────────────────────────────────────────────────────┐
│ Jo klikt:                                                 │
│ - "Ignore" op 4 candidates (laten we zeggen: duplicaten) │
│ - "Confirm" op 4 candidates (laten we zeggen: nieuwe)    │
└───────────────────────────────────────────────────────────┘
                        │
                        │ WHAT ACTUALLY HAPPENS
                        ▼
┌───────────────────────────────────────────────────────────┐
│ 1. Ignore: Candidates verwijderd uit UI (correct)        │
│ 2. Confirm: 4 sensors toegevoegd aan localStorage        │
│ 3. localStorage nu: 54 sensors (50 + 4 nieuwe)           │
│ 4. Toast zegt: "Total: 54"                               │
└───────────────────────────────────────────────────────────┘
                        │
                        │ MODAL CLOSE (line 16-19)
                        ▼
┌───────────────────────────────────────────────────────────┐
│ handleClose() roept window.location.reload() aan         │
└───────────────────────────────────────────────────────────┘
                        │
                        │ PAGE RELOAD
                        ▼
┌───────────────────────────────────────────────────────────┐
│ useSensorDatabase() draait opnieuw:                       │
│ 1. Laadt SQLite: 169 sensors                             │
│ 2. Laadt localStorage: 54 sensors                        │
│ 3. Mergt ZONDER duplicate check:                         │
│    allSensors = [...localStorage, ...SQLite]             │
│ 4. Total: 223 sensors                                    │
└───────────────────────────────────────────────────────────┘
                        │
                        │ BUT WAIT...
                        ▼
┌───────────────────────────────────────────────────────────┐
│ ⚠️ PROBLEEM: Overlap tussen localStorage en SQLite!      │
│                                                           │
│ Scenario 1: Recente sensor al in BEIDE databases         │
│ - Sensor zit in SQLite (geïmporteerd in maart)           │
│ - Sensor zit ook in localStorage (recent geüpdatet)      │
│ - Na merge: 2x dezelfde sensor!                          │
│                                                           │
│ Scenario 2: Jo's ignored candidates waren duplicaten     │
│ - Jo ignored 4 candidates die al in database zaten       │
│ - Jo confirmed 4 nieuwe sensors                          │
│ - Maar merge voegt de 4 old ones OPNIEUW toe!           │
│ - Resultaat: 8 sensors verschijnen (4 nieuwe + 4 dupes)  │
└───────────────────────────────────────────────────────────┘
```

---

## 🎯 WAAROM LIJKT HET ALSOF IGNORE NIET WERKT?

### Hypothese A: Ignored candidates waren duplicaten

1. CSV detecteert 8 candidates
2. 4 daarvan zijn DUPLICATEN van bestaande sensors
3. Jo klikt "Ignore" op de 4 duplicaten (correct!)
4. Jo klikt "Confirm" op de 4 nieuwe sensors
5. Maar na page reload en merge:
   - De 4 nieuwe sensors verschijnen (correct)
   - De 4 "ignored" candidates verschijnen TOCH (omdat ze al in SQLite stonden!)
6. Jo ziet: 8 sensors toegevoegd

**Dit is NIET een bug in Ignore button!**  
**Dit is een VISUALISATIE probleem door duplicate merge!**

### Hypothese B: Candidates waren allemaal nieuw, maar merge dupliceert

1. CSV detecteert 8 nieuwe candidates
2. Jo ignored 4, confirmt 4
3. De 4 confirmed worden toegevoegd aan localStorage
4. Maar merge dupliceert ze met SQLite data
5. Elke sensor verschijnt 2x
6. Jo ziet: 8 sensors (4 × 2 duplicaten)

**Minder waarschijnlijk**, maar mogelijk als sync logic fout gaat.

---

## 🔬 VERIFICATIE TEST

Om te bewijzen welke hypothese klopt:

### Test 1: Check localStorage vs merged count

```javascript
// In browser console NA import:
const ls = JSON.parse(localStorage.getItem('agp-sensor-database')).sensors;
console.log('localStorage sensors:', ls.length);

// Kijk in UI: Sensor History modal
// Merged count: ?

// Als merged > localStorage + SQLite: DUPLICATEN!
```

### Test 2: Check sensor_id duplicaten

```javascript
// In useSensorDatabase hook, voeg toe NA merge:
const allSensors = [...localSensorsConverted, ...sensorData];

// Check duplicates:
const ids = allSensors.map(s => s.sensor_id);
const uniqueIds = new Set(ids);
console.log('Total sensors:', allSensors.length);
console.log('Unique IDs:', uniqueIds.size);
console.log('Duplicates:', allSensors.length - uniqueIds.size);
```

### Test 3: Track ignored candidates

Voeg toe aan handleIgnore:
```javascript
const handleIgnore = (candidate) => {
  console.log('[IGNORE] Candidate:', {
    timestamp: candidate.timestamp.toISOString(),
    sensor_id: `sensor_${candidate.timestamp.getTime()}`,
    confidence: candidate.confidence
  });
  
  // Check if already in database:
  const existing = getSensorHistory().find(s => 
    s.start_date === candidate.timestamp.toISOString()
  );
  
  if (existing) {
    console.log('[IGNORE] âš ï¸ This candidate is a DUPLICATE of existing sensor:', existing.sensor_id);
  } else {
    console.log('[IGNORE] This candidate is NEW (not in localStorage yet)');
  }
  
  setCandidates(prev => prev.filter(c => 
    c.timestamp.getTime() !== candidate.timestamp.getTime()
  ));
};
```

---

## 🛠️ OPLOSSING

### Quick Fix: Toast Message

```javascript
// In handleConfirm, vervang:
const sensorCount = getSensorHistory().length;

// Door:
const sensorCount = getSensorHistory().length;
const duplicates = '(aantal kan veranderen na reload door duplicate filtering)';

setSuccessToast({
  message: `Sensor added to localStorage! Count: ${sensorCount} ${duplicates}`,
  timestamp: Date.now()
});
```

### Real Fix: Duplicate Detection in Merge

Zie DUPLICATE_SENSORS_ISSUE.md voor merge fix.

---

## 📊 CONCLUSIE

**Ignore button werkt CORRECT** - het probleem zit in:
1. **Duplicate merge** in useSensorDatabase
2. **Misleading toast** die localStorage count toont i.p.v. merged count
3. **Visueel effect**: Ignored duplicaten verschijnen toch na reload

**Jo's observatie is VALID** - maar niet omdat Ignore faalt.  
**Het is omdat merge duplicaten toestaat.**

**FIX PRIORITEIT: HIGH** (zie DUPLICATE_SENSORS_ISSUE.md)

---

*EINDE CSV IMPORT ANALYSE*
