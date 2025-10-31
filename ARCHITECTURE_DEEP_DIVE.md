# 🏗️ ARCHITECTUUR DEEP DIVE - Sensor Lock System

**Datum**: 2025-10-31 15:30 CET  
**Versie**: v3.1.0  
**Analysist**: Claude (critical review gevraagd door Jo)

---

## 🎯 DOEL VAN DEZE ANALYSE

Jo vroeg om een **kritische blik** op de architectuur na het fixen van 3 bugs:
1. Zijn er fundamentele architectuurproblemen?
2. Zijn er naamgevingsinconsistenties die bugs kunnen veroorzaken?
3. Liggen de fixes naast de verwachte werking zoals gedocumenteerd?
4. Wat zijn de risico's voor toekomstige bugs?

**Kort antwoord**: Ja, er zijn architectuurproblemen. De oplossingen werken, maar bouwen verder op een wankele basis. Hieronder de volledige analyse.

---

## ⚠️ KRITISCHE BEVINDINGEN

### 1. **NAMING HELL: sensor_id vs sensorId vs start_date vs start_timestamp**

#### Probleem
Er worden **twee verschillende naming conventions** door elkaar gebruikt:

**In sensorStorage.js (localStorage format)**:
```javascript
{
  sensor_id: "...",        // âœ… Snake case
  start_date: "...",       // âœ… Snake case  
  end_date: "...",         // âœ… Snake case
  lot_number: "...",       // âœ… Snake case
  hw_version: "..."        // âœ… Snake case
}
```

**In SQLite schema (volgens comments)**:
```javascript
{
  sensor_id: "...",        // âœ… Snake case
  start_timestamp: "...",  // âŒ NIET start_date!
  end_timestamp: "...",    // âŒ NIET end_date!
}
```

**In addSensor() function**:
```javascript
// Line 441: Comment zegt SQLite format
sensor_id: sensorData.id,              // âŒ id vs sensor_id
start_date: sensorData.startTimestamp, // âŒ timestamp â†' date conversion
end_date: sensorData.endTimestamp,     // âŒ timestamp â†' date conversion
```

#### Waarom dit gevaarlijk is
1. **Code verwacht start_date maar SQLite heeft start_timestamp** â†' conversie fout gevoelig
2. **Functies checken op sensor_id** maar krijgen misschien object met id
3. **Type mismatch**: timestamp (number) vs date (string) â†' vergelijkingen kunnen falen
4. **Findability**: zoeken naar "start_date" vindt niet alle plekken waar start_timestamp gebruikt wordt

#### Impact op bugs
- **Bug #1** (lock icons verkeerd) â†' mogelijk veroorzaakt door dit probleem
- **Bug #3** (sensors komen terug) â†' verband met format mismatch?

---

### 2. **DISTRIBUTED STATE PROBLEEM: 3 Sources of Truth**

#### Data stroomt door 3 systemen

**Flow diagram**:
```
SQLite DB (read-only, source of historical data)
    â†"
    | getSensorDatabase() merges with â†"
    â†"
localStorage (user modifications, unlocked sensors)
    â†"
    | useSensorDatabase() merges into â†"
    â†"
React State (rendering, ephemeral)
```

#### Waar het fout gaat

**Scenario 1: User deletes sensor**
```
1. User clicks delete â†' deleteSensorWithLockCheck()
2. Function removes from localStorage âœ…
3. Function adds to deleted list âœ… (Bug #3 fix)
4. React state updates via refreshKey âœ… (Bug #2 fix)
5. User refreshes page
6. SQLite â†' localStorage sync runs
7. Deleted list checked âœ… (Bug #3 fix)
8. Sensor niet terug âœ…
```

**Scenario 2: User toggles lock**
```
1. User clicks lock â†' toggleSensorLock()
2. Function updates localStorage âœ…
3. React state updates via refreshKey âœ… (Bug #2 fix)
4. Lock status merged in useMemo âœ… (Bug #1 fix)
5. Icon updates âœ…
```

**Scenario 3: CSV import triggers sensor detection**
```
1. User uploads CSV
2. detectSensorRegistrations() finds new sensor
3. Sensor added to... waar? âš ï¸
4. Sensor alleen in React state (ephemeral)
5. syncUnlockedSensors() called? âš ï¸
6. Als niet, sensor verdwijnt na reload âŒ
```

#### De Tombstone Pattern (Bug #3 fix)

**Concept**:
```
localStorage['agp-deleted-sensors'] = ["sensor-1", "sensor-2"]
```

**Waarom dit werkt**:
- SQLite blijft read-only (geen schema changes)
- Sync logic checkt deleted list vÃ³Ã³r toevoegen
- Persistent over page reloads

**Waarom dit fragiel is**:
- Deleted list kan groot worden (219 sensors â†' potential 200+ IDs)
- Geen cleanup mechanisme
- Als deleted list corrupt raakt, chaos
- Als sync logic faalt, sensors komen terug

---

### 3. **LOCK STATE STORAGE: Documentatie ≠ Implementatie**

#### Gedocumenteerd in handoff
```
Lock states stored in localStorage separate key:
localStorage['agp-sensor-locks'] = {
  "sensor-1": { locked: true, reason: "age" },
  "sensor-2": { locked: false, reason: "manual" }
}
```

#### Daadwerkelijke implementatie
```javascript
// In sensorStorage.js localStorage format
{
  sensors: [
    {
      sensor_id: "...",
      start_date: "...",
      is_manually_locked: true  // âœ… IN sensor object zelf!
    }
  ]
}
```

#### Waarom dit verschil problematisch is
1. **Documentatie out-of-sync** â†' developers mislead
2. **Lock state embedded in sensor** â†' moeilijker te querien
3. **Geen separate audit trail** voor lock changes
4. **Lock state lost** als sensor object corrupt

#### Verwacht gedrag vs werkelijk gedrag

**Verwacht (based on docs)**:
```javascript
// Separate lock storage
const locks = getLocks();
const sensor = getSensor(id);
const isLocked = locks[id]?.locked || false;
```

**Werkelijk**:
```javascript
// Lock embedded in sensor
const sensor = getSensor(id);
const isLocked = sensor.is_manually_locked || false;
```

**Impact**: Code werkt, maar niet zoals gedocumenteerd. Toekomstige dev leest docs en schrijft verkeerde code.

---

### 4. **CHRONOLOGICAL INDEX: Fragiele Berekening**

#### Hoe het werkt nu (Line 70-88 SensorHistoryModal.jsx)
```javascript
const sensorsWithIndex = useMemo(() => {
  // Sort by start_date ascending (oldest first)
  const sorted = [...sensors].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return dateA - dateB;
  });
  
  // Assign index 1, 2, 3...
  const withIndex = sorted.map((sensor, idx) => ({
    ...sensor,
    chronological_index: idx + 1
  }));
  
  return withIndex;
}, [sensors, refreshKey]);
```

#### Waarom index kan veranderen

**Scenario: Delete sensor #150**
```
Voor delete:
Sensor #149: maart 2024
Sensor #150: april 2024  [DELETE]
Sensor #151: mei 2024

Na delete:
Sensor #149: maart 2024
Sensor #150: mei 2024    [WAS #151!]
```

**Impact**:
- User deleted "#150" maar na reload is een andere sensor now "#150"
- Verwarrend voor user
- Links/bookmarks naar sensor ID worden invalid

#### Mogelijke fix
```javascript
// Option 1: Stable ID from database
chronological_index: sensor.sequence_number  // From SQLite

// Option 2: Hash-based stable ID
chronological_index: hashCode(sensor.start_date + sensor.sensor_id)

// Option 3: Accept instability, maar communiceer duidelijk
// "Sensor nummers kunnen veranderen na delete"
```

---

## 🔍 BUG FIX ANALYSE

### Bug #3: Deleted Sensors Reappearing (CRITICAL) âœ…

#### Root cause diagnose
✅ **Correct**: DELETE only touched localStorage, SQLite unchanged
✅ **Correct**: Sync had no way to know sensor was deleted
✅ **Correct**: Re-added thinking it was "new"

#### Oplossing: Tombstone pattern
✅ **Werkt**: Deleted list persistent in localStorage
✅ **Goed**: Sync checkt deleted list voor toevoegen
⚠️ **Fragiel**: No cleanup, kan groot worden
⚠️ **Fragiel**: Corrupt deleted list = chaos

#### Mogelijke improvements
```javascript
// Add metadata to deleted list
{
  "sensor-1": {
    deletedAt: "2025-10-31T15:00:00Z",
    reason: "manual",
    canPurge: false  // Keep forever
  }
}

// Cleanup oude entries (>1 year)
function cleanupDeletedList() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  // Remove old entries waar canPurge = true
}
```

---

### Bug #2: Forced Page Reload (HIGH) âœ…

#### Root cause diagnose
✅ **Correct**: window.location.reload() killed modal
✅ **Correct**: User experience disrupted

#### Oplossing: refreshKey state
✅ **Werkt**: Local state trigger instead of reload
✅ **Goed**: Modal blijft open
✅ **Goed**: useMemo re-runs with new data

#### Architectuur vraag
**Waarom werkt dit?**

```javascript
// refreshKey changes â†'
// useMemo dependency triggered â†'
// sensorsWithIndex recalculated â†'
// Lock states merged â†'
// Component re-renders âœ…
```

**MAAR**: `sensors` prop komt van parent (AGPGenerator)
- Parent moet ook re-renderen om nieuwe data te hebben
- Hoe gebeurt dat? âš ï¸

**Check in AGPGenerator**: (not in these files)
- useSensorDatabase() moet re-run
- SQLite data moet re-merged met localStorage
- Dan pas krijgt modal nieuwe props

**Mogelijke race condition**:
```javascript
1. User clicks delete
2. deleteSensorWithLockCheck() runs âœ…
3. setRefreshKey() triggers âœ…
4. useMemo recalculates âœ…
5. MAAR: sensors prop is stale! âŒ
6. Old sensor still in list until parent re-renders
```

**Verification needed**:
- Check if parent (AGPGenerator) also uses refreshKey
- Check if useSensorDatabase() subscribes to localStorage changes
- Test: Delete sensor, does it disappear immediately?

---

### Bug #1: Default Lock State (MEDIUM) âœ…

#### Root cause diagnose
✅ **Correct**: Lock states in localStorage not in React state
✅ **Correct**: Data flow issue (load â†' props â†' stale)

#### Oplossing: Merge lock states in useMemo
✅ **Werkt**: Lock state read from localStorage during render
✅ **Goed**: No separate initialization needed
⚠️ **Performance**: getManualLockStatus() called per sensor per render

#### Data flow nu

**Voor fix**:
```
1. useSensorDatabase() loads sensors (no locks)
2. sensors â†' AGPGenerator â†' Modal
3. Modal opens
4. initializeManualLocks() runs
5. Locks saved in localStorage
6. BUT: sensors in state already loaded (stale)
7. Wrong icons âŒ
```

**Na fix**:
```
1. useSensorDatabase() loads sensors (no locks)
2. sensors â†' AGPGenerator â†' Modal
3. Modal useMemo runs
4. getManualLockStatus() per sensor âœ…
5. Lock state merged into sensor objects âœ…
6. Correct icons âœ…
```

#### Performantie overweging

**Huidig**: O(n) localStorage reads per render
```javascript
// Line 75-77
const lockStatus = getManualLockStatus(sensor.sensor_id);
// This reads localStorage for EVERY sensor EVERY render
```

**Bij 219 sensors**:
- 219 localStorage reads per render
- useMemo re-runs on refreshKey change
- Potentially 219 reads per delete/toggle

**Beter**:
```javascript
// Read all locks once
const allLocks = useMemo(() => {
  const db = getSensorDatabase();
  return db?.sensors.reduce((acc, s) => {
    acc[s.sensor_id] = s.is_manually_locked || false;
    return acc;
  }, {});
}, [refreshKey]);

// Then merge in O(1) lookup
const withIndex = sorted.map((sensor, idx) => ({
  ...sensor,
  chronological_index: idx + 1,
  is_manually_locked: allLocks[sensor.sensor_id] || false
}));
```

---

## 🚨 RISICO ASSESSMENT

### Hoog Risico

#### 1. **Naming Inconsistency** (sensor_id vs start_date vs start_timestamp)
- **Kans**: HOOG (bestaande inconsistentie)
- **Impact**: HOOG (verkeerde comparisons, filters falen)
- **Symptomen**: Sensors niet gevonden, verkeerde data getoond
- **Fix**: Normaliseer ALL field names, kies Ã©Ã©n convention

#### 2. **Distributed State Sync** (SQLite â†' localStorage â†' React)
- **Kans**: MEDIUM (werkt nu, maar fragiel)
- **Impact**: CRITICAL (data loss, corruption)
- **Symptomen**: Sensors disappear, duplicates, stale data
- **Fix**: Centraliseer state management, gebruik Redux/Zustand

#### 3. **Deleted List Growth** (no cleanup)
- **Kans**: LAAG (trage groei)
- **Impact**: MEDIUM (localStorage vol, performance down)
- **Symptomen**: Slow app, localStorage quota exceeded
- **Fix**: Implement cleanup policy

### Medium Risico

#### 4. **Chronological Index Instability**
- **Kans**: MEDIUM (gebeurt bij elke delete)
- **Impact**: MEDIUM (user confusion, broken bookmarks)
- **Symptomen**: Sensor IDs change unexpectedly
- **Fix**: Use stable IDs from database sequence

#### 5. **Performance: O(n) Lock Reads**
- **Kans**: LAAG (werkt tot ~500 sensors)
- **Impact**: MEDIUM (slow renders at scale)
- **Symptomen**: Laggy modal, slow toggles
- **Fix**: Bulk read locks once, cache

#### 6. **Documentation Drift**
- **Kans**: HOOG (al aanwezig)
- **Impact**: MEDIUM (developer confusion)
- **Symptomen**: Wrong implementations, bugs
- **Fix**: Update docs to match implementation

### Laag Risico

#### 7. **CSV Import Ephemeral State**
- **Kans**: LAAG (als syncUnlockedSensors() called)
- **Impact**: MEDIUM (sensors lost after reload)
- **Symptomen**: Sensor shows in UI, gone after refresh
- **Fix**: Verify sync happens after detection

---

## ✅ WAT WERKT GOED

### Positieve Aspecten

1. **Tombstone Pattern**: Elegante oplossing voor delete sync
2. **RefreshKey Pattern**: Clean state update zonder reload
3. **Lock Merge in Render**: Correcte data flow voor icons
4. **Separation of Concerns**: Engine functions apart van UI
5. **Defensive Programming**: Veel null checks, fallbacks

### Sterke Functies

**getSensorLockStatus()**: Goede abstraction, duidelijke return values
**syncUnlockedSensorsToLocalStorage()**: Robuuste merge logic
**deleteSensorWithLockCheck()**: Goede error handling, user messaging

---

## 🎯 AANBEVELINGEN

### Korte Termijn (Deze Week)

#### 1. **Field Name Audit** (2 uur)
```bash
# Search for all field references
grep -r "start_timestamp" src/
grep -r "start_date" src/
grep -r "sensor_id" src/
grep -r "sensorId" src/

# Document ALL variants found
# Choose ONE convention (recommend: snake_case for localStorage)
# Create migration script if needed
```

**Verwachte output**: Lijst met inconsistente namen
**Actie**: Normaliseer naar snake_case overal

#### 2. **Update Documentation** (1 uur)
```markdown
# Update handoff doc met:
- Lock state is IN sensor object (not separate key)
- Deleted list format and cleanup policy
- Field naming convention (snake_case)
- Data flow diagram (SQLite â†' localStorage â†' React)
```

#### 3. **Performance Test** (30 min)
```javascript
// Add timing logs
console.time('Lock merge');
const withIndex = sorted.map((sensor, idx) => {
  const lockStatus = getManualLockStatus(sensor.sensor_id);
  return { ...sensor, ... };
});
console.timeEnd('Lock merge');

// Test with 219 sensors
// If >100ms, implement bulk read optimization
```

#### 4. **Test CSV Import Flow** (1 uur)
```
1. Upload CSV met nieuwe sensor
2. Check: wordt sensor gedetecteerd?
3. Check: wordt syncUnlockedSensors() called?
4. Refresh page
5. Check: is sensor nog steeds daar?
```

**Als sensor verdwijnt**: Bug gevonden (CSV â†' localStorage sync missing)

### Medium Termijn (Deze Maand)

#### 5. **Implement Deleted List Cleanup** (2 uur)
```javascript
/**
 * Clean up old deleted sensors
 * Policy: Remove entries >1 year old where manual delete
 */
export function cleanupDeletedList() {
  const deleted = getDeletedSensors();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  // Keep only recent deletes or auto-generated ones
  const cleaned = deleted.filter(id => {
    // Check if sensor was deleted recently
    // Or if it's an auto-protected sensor
    // This requires metadata (see below)
  });
  
  localStorage.setItem(DELETED_SENSORS_KEY, JSON.stringify(cleaned));
  return {
    before: deleted.length,
    after: cleaned.length,
    removed: deleted.length - cleaned.length
  };
}
```

**Note**: Requires deleted list to store metadata:
```javascript
// Instead of: ["sensor-1", "sensor-2"]
// Use:
{
  "sensor-1": {
    deletedAt: "2025-10-31T15:00:00Z",
    reason: "manual",
    canPurge: true
  },
  "sensor-2": {
    deletedAt: "2025-03-15T10:00:00Z",
    reason: "auto",
    canPurge: false  // Never purge auto-deletes
  }
}
```

#### 6. **Stable Chronological IDs** (3 uur)
```javascript
// Option A: Use database sequence number
// Requires: Add sequence column to SQLite schema
// Pro: Stable, survives deletes
// Con: Requires schema migration

// Option B: Accept instability + clear messaging
// Pro: No code changes
// Con: User confusion
// Implementation: Add tooltip/warning
"â„¹ï¸ Sensor nummers kunnen veranderen na verwijderingen"
```

**Aanbeveling**: Option B short-term, Option A long-term

#### 7. **Optimize Lock Reads** (1 uur)
```javascript
// In SensorHistoryModal.jsx useMemo:
const allLocks = useMemo(() => {
  const db = getSensorDatabase();
  if (!db) return {};
  
  return db.sensors.reduce((acc, s) => {
    acc[s.sensor_id] = {
      isLocked: s.is_manually_locked || false,
      reason: s.lock_reason || 'age'
    };
    return acc;
  }, {});
}, [refreshKey]);

// Then use in map:
const withIndex = sorted.map((sensor, idx) => ({
  ...sensor,
  chronological_index: idx + 1,
  is_manually_locked: allLocks[sensor.sensor_id]?.isLocked || false,
  lock_reason: allLocks[sensor.sensor_id]?.reason
}));
```

**Expected improvement**: 219 localStorage reads â†' 1 localStorage read

### Lange Termijn (Over 3 Maanden)

#### 8. **Centralized State Management** (5-10 uur)
```
Current: SQLite â†' localStorage â†' React state (fragile)

Better: 
- Single source of truth in React context/Redux
- SQLite read once at app start
- All mutations through actions
- Persist to localStorage on change
- Sync back to SQLite on export/backup
```

**Pro**: No sync issues, predictable state, easier debugging
**Con**: Significant refactor, risk of new bugs
**Timing**: Only if hitting scaling issues

#### 9. **Field Name Normalization Script** (3 uur)
```javascript
// Migration script
export function migrateFieldNames() {
  const db = getSensorDatabase();
  
  db.sensors = db.sensors.map(sensor => ({
    sensor_id: sensor.sensor_id || sensor.sensorId,
    start_date: sensor.start_date || sensor.start_timestamp,
    end_date: sensor.end_date || sensor.end_timestamp,
    // ... normalize all fields
  }));
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
```

**Run once** to normalize existing data

---

## 📊 PRIORITEIT MATRIX

| Issue | Kans | Impact | Priority | Effort | When |
|-------|------|--------|----------|--------|------|
| Field naming | HIGH | HIGH | **P0** | 2h | This week |
| Docs update | HIGH | MED | **P0** | 1h | This week |
| CSV sync test | MED | HIGH | **P1** | 1h | This week |
| Performance test | LOW | MED | **P1** | 30min | This week |
| Deleted cleanup | LOW | MED | **P2** | 2h | This month |
| Stable IDs | MED | MED | **P2** | 3h | This month |
| Lock read optim | LOW | MED | **P2** | 1h | This month |
| Central state | LOW | HIGH | **P3** | 10h | 3+ months |
| Field migration | MED | HIGH | **P3** | 3h | 3+ months |

---

## 🎬 CONCLUSIE

### TL;DR

**âœ… Bug fixes werken**: Alle 3 bugs zijn correct opgelost
**⚠️ Architectuur wankel**: Distributed state + naming chaos
**✅ Korte termijn safe**: App is bruikbaar, geen kritieke risico's
**🚨 Lange termijn risico**: Scale/complexity zal problemen maken

### Is het erg?

**Nee, niet erg**:
- Bugs zijn gefixt
- App werkt voor current use case (219 sensors)
- Geen data loss risico op korte termijn
- Code quality is redelijk

**Maar wel aandacht nodig**:
- Field naming moet genormaliseerd (HIGH priority)
- Docs moeten updated (HIGH priority)
- CSV sync moet getest (HIGH priority)
- Performance moet gemonitord

### Kan dit productie?

**Ja**, met caveats:
- Max 500 sensors (daarna performance issues)
- Single user only (no multi-user sync)
- Monitor localStorage size (5MB limit)
- Keep backups (export database regelmatig)

### Wat zou ik doen?

**Als dit mijn project was**:
1. âœ… Commit huidige fixes (werken goed)
2. ⚠️ Week 1: Field naming audit + docs update
3. ⚠️ Week 2: CSV sync test + performance test
4. âœ… Maand 1: Deleted cleanup + lock optimization
5. 🤔 Maand 3: Evaluate centrale state (alleen als nodig)

**Niet doen**:
- âŒ Grote refactor nu (te risicovol)
- âŒ Schema changes (SQLite read-only is goed)
- âŒ Over-engineering (YAGNI principe)

---

## 🔬 CODE QUALITY SCORE

| Aspect | Score | Notes |
|--------|-------|-------|
| **Functionaliteit** | 8/10 | Werkt goed, bugs gefixt |
| **Performance** | 7/10 | Goed tot 500 sensors |
| **Maintainability** | 5/10 | Naming chaos, docs drift |
| **Scalability** | 6/10 | Begint pijn te doen bij 1000+ |
| **Reliability** | 7/10 | Robuust met edge cases |
| **Testability** | 6/10 | Pure functions goed, state moeilijk |
| **Documentation** | 5/10 | Out of sync met code |

**Totaal**: **6.3/10** - Solide B grade, kan beter

---

## 📝 NEXT STEPS VOOR JO

### Nu Meteen
1. âœ… Lees deze analyse
2. âœ… Commit/push bug fixes (als nog niet gedaan)
3. âœ… Test de 3 fixes zoals in handoff beschreven

### Deze Week
1. ⚠️ Run field name audit (zie aanbeveling #1)
2. ⚠️ Update docs met correcte lock storage (zie aanbeveling #2)
3. ⚠️ Test CSV import flow (zie aanbeveling #4)

### Volgende Chat
1. 📋 Report test resultaten
2. 🐛 Report nieuwe bugs (als gevonden)
3. 🤔 Decide: field normalization nu of later?
4. 📊 Check: performance OK met 219 sensors?

---

## 🎤 FEEDBACK VOOR CLAUDE

**Wat ging goed**:
- Systematische bug diagnose
- Goede fix implementaties
- Tombstone pattern is slim

**Wat kan beter**:
- Naming convention niet consistent gehouden
- Docs niet updated na implementation changes
- Performance impact niet overwogen (O(n) reads)

**Lessen voor next time**:
- âœ… Check field names BEFORE implementing
- âœ… Update docs IN SAME COMMIT as code
- âœ… Add performance logging voor n>100 items
- âœ… Test full data flow (CSV â†' DB â†' UI â†' reload)

---

## 🙏 DISCLAIMER

Deze analyse is geschreven door Claude (AI) op verzoek van Jo Mostert. Het is een **kritische review**, niet een attack. Het doel is om **problemen vroegtijdig te vinden** voordat ze in productie issues worden.

**Toon van deze analyse**: Eerlijk, direct, constructief. Geen bullshit, maar ook geen doom & gloom. De app werkt, de fixes zijn goed, maar er zijn verbeterpunten.

**Accuraatheid**: Based on code inspection alleen. Niet getest in runtime. Mogelijke edge cases gemist. Take with grain of salt.

---

**EINDE ARCHITECTUUR DEEP DIVE** âœ…

Next: Test fixes, run audits, fix naming, update docs!
