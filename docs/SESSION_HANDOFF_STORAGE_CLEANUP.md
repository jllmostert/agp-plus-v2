# Session Handoff: Storage Layer Cleanup

**Project**: AGP+ Medical Data Visualization  
**Path**: `/Users/jomostert/Documents/Projects/agp-plus`  
**Start server**: `cd agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001`

---

## 🎯 DOEL

Opschonen van de storage layer. Analyse is afgerond (zie `docs/STORAGE_ARCHITECTURE_ANALYSIS.md`).

**TL;DR van het probleem**:
- `eventStorage.js` slaat `sensorChanges` op in localStorage → **NOOIT GELEZEN** (dead code)
- `cartridgeChanges` in localStorage → **ACTIEF**, moet naar IndexedDB
- IndexedDB stores `sensorEvents` en `cartridgeEvents` → **AANGEMAAKT MAAR NOOIT GEBRUIKT**
- SQLite en DebugPanel → **DEPRECATED**, kan weg

---

## ⚠️ WERKWIJZE (KRITISCH!)

```
STOP elke 5-8 tool calls voor user check-in.
Update PROGRESS.md na elke fase.
Geen grote refactors zonder eerst te vragen.
Bij twijfel: vraag.
```

**Token-zuinig werken**:
- Gebruik `grep` voor zoeken, niet hele files lezen
- Lees alleen relevante delen van files (offset/length)
- Batch gerelateerde wijzigingen

---

## 📋 FASE 1: Dead Code Verwijderen (30 min)

### 1.1 Verwijder `storeSensorChange` calls
```bash
# Locaties:
grep -n "storeSensorChange" src/storage/masterDatasetStorage.js
# Lijn ~481: await storeSensorChange(event.timestamp, event.alert, 'CSV Alert');
# → Verwijder deze call + error handling

grep -n "storeSensorChange" src/storage/eventStorage.js  
# → Verwijder hele functie (lijnen ~101-125)
```

### 1.2 Verwijder sensorChanges uit eventStorage.js
```bash
# In eventStorage.js, verwijder:
# - sensorChanges uit alle functies
# - getEventsForDate → return alleen cartridgeChanges
# - hasEvents → check alleen cartridgeChanges
# - getEventStats → verwijder sensorCount
```

### 1.3 Verwijder ongebruikte IndexedDB stores
```bash
# In src/storage/db.js:
# - Verwijder STORES.SENSOR_EVENTS definitie
# - Verwijder STORES.CARTRIDGE_EVENTS definitie  
# - Verwijder createObjectStore calls (lijnen ~67-82)
# - Bump DB_VERSION naar 7
# - Voeg deleteObjectStore toe in upgrade handler
```

### 1.4 Verwijder SQLite files
```bash
rm src/utils/sqliteParser.js
rm src/storage/sensorImport.js
rm src/components/SensorImport.jsx
rm src/components/devtools/SensorSQLiteImport.jsx
# Check imports en verwijder referenties
```

### 1.5 Verwijder DebugPanel files
```bash
rm src/components/DebugPanel.jsx
rm src/components/devtools/DebugPanel.jsx
rm src/components/panels/DevToolsPanel.jsx
# Update AGPGenerator.jsx: verwijder DevToolsPanel import + usage
```

**Na Fase 1**: `npm run build` moet slagen. Update PROGRESS.md.

---

## 📋 FASE 2: eventStorage → cartridgeStorage (1 uur)

### 2.1 Rename en simplificeer
```bash
mv src/storage/eventStorage.js src/storage/cartridgeStorage.js

# Hernoem functies:
# - getAllEvents → getAllCartridgeChanges
# - getEventsForDate → getCartridgeChangesForDate
# - hasEvents → hasCartridgeChanges
# - storeEvents → storeCartridgeChanges
# - clearEvents → clearCartridgeChanges
```

### 2.2 Migreer naar IndexedDB
```javascript
// In cartridgeStorage.js:
// - Vervang localStorage door IndexedDB SETTINGS store
// - Key: 'cartridge_changes'
// - Gebruik bestaande putRecord/getRecord uit db.js
```

### 2.3 Update alle consumers
```bash
grep -rn "eventStorage" src/ --include="*.js" --include="*.jsx"
# Update imports in:
# - src/core/day-profile-engine.js
# - src/core/cleanup-engine.js
# - src/storage/export.js
# - src/storage/import.js
# - src/storage/masterDatasetStorage.js
# - src/components/AGPGenerator.jsx
# - src/components/DataManagementModal.jsx
```

**Na Fase 2**: Test cartridge changes in day profiles. Update PROGRESS.md.

---

## 📋 FASE 3: localStorage Cleanup (2 uur)

### 3.1 Fix patient info duplicatie
```bash
# In src/storage/import.js en export.js:
# - Vervang localStorage 'patient-info' door patientStorage.js API
# - patientStorage.js gebruikt al IndexedDB
```

### 3.2 Fix workdays duplicatie  
```bash
# In src/storage/import.js en export.js:
# - Vervang localStorage 'workday-dates' door IndexedDB
# - Gebruik STORES.SETTINGS met key 'protime_workdays' (bestaat al!)
```

### 3.3 Verwijder dead localStorage keys
```bash
# In DataManagementModal.jsx:
# - Verwijder 'agp-patient-info' reference (nooit geschreven)
# - Verwijder 'agp-v3-cache' en 'agp-v3-settings' references
```

**Na Fase 3**: Full test. Update PROGRESS.md en TECH_DEBT.md.

---

## 🔧 HANDIGE COMMANDO'S

```bash
# Zoek localStorage usage
grep -rn "localStorage\." src/ --include="*.js" --include="*.jsx" | grep -v node_modules

# Zoek specifieke functie
grep -rn "functionName" src/ --include="*.js" --include="*.jsx"

# Build test
npm run build 2>&1 | tail -20

# Commit
git add -A && git commit -m "chore: [beschrijving]" && git push origin main
```

---

## 📝 PROGRESS.MD TEMPLATE

```markdown
## Session [datum] - Storage Layer Cleanup

### Status
- [ ] Fase 1: Dead Code Verwijderen
- [ ] Fase 2: eventStorage → cartridgeStorage  
- [ ] Fase 3: localStorage Cleanup

### Fase 1 Progress
- [ ] storeSensorChange calls verwijderd
- [ ] sensorChanges uit eventStorage verwijderd
- [ ] Ongebruikte IndexedDB stores verwijderd
- [ ] SQLite files verwijderd
- [ ] DebugPanel files verwijderd
- [ ] Build succesvol

### Fase 2 Progress
- [ ] eventStorage.js renamed naar cartridgeStorage.js
- [ ] Functies hernoemd
- [ ] Gemigreerd naar IndexedDB
- [ ] Consumers updated
- [ ] Day profiles werken nog

### Fase 3 Progress
- [ ] Patient info duplicatie gefixt
- [ ] Workdays duplicatie gefixt
- [ ] Dead localStorage keys verwijderd

### Files Deleted
[lijst hier]

### Files Modified
[lijst hier]

### Issues Encountered
[noteer hier]
```

---

## ⚠️ NIET DOEN

- Geen refactor van sensorStorage.js (werkt prima)
- Geen refactor van masterDatasetStorage.js (complex, werkt)
- Geen nieuwe features toevoegen
- Geen styling changes

---

## 📚 REFERENTIE DOCS

- `docs/STORAGE_ARCHITECTURE_ANALYSIS.md` - Volledige analyse
- `TECH_DEBT.md` - Bestaande tech debt items
- `docs/archive/DUAL_STORAGE_ANALYSIS.md` - Historische context

---

**Start met Fase 1.1**: Verwijder `storeSensorChange` call uit masterDatasetStorage.js.
