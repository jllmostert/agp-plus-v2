# Session Handoff: Fase 3 - localStorage Cleanup

**Project**: AGP+ Medical Data Visualization  
**Path**: `/Users/jomostert/Documents/Projects/agp-plus`  
**Start server**: `cd agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001`

---

## 🎯 DOEL

Consolideer localStorage duplicaties zodat alle data één authoritative source heeft.

**Probleem**:
1. `patient-info` in localStorage ↔ `patientInfo` in IndexedDB SETTINGS (patientStorage.js)
2. `workday-dates` in localStorage ↔ `protime_workdays` in IndexedDB SETTINGS

**Oplossing**: Verwijder localStorage duplicaten, gebruik alleen IndexedDB.

---

## ⚠️ WERKWIJZE

```
1. EERST: git tag v4.5.0-pre-localstorage-cleanup (rollback punt)
2. Update PROGRESS.md na ELKE substap
3. Test build na elke file change
4. HERSCHRIJF code waar mogelijk (niet patchen)
5. Commit & push na completion
```

---

## 📊 ANALYSE: Huidige Situatie

### Patient Info Duplicatie

| Locatie | Type | Key | Gelezen door | Geschreven door |
|---------|------|-----|--------------|-----------------|
| localStorage | Legacy | `patient-info` | export.js:41 | import.js:176 |
| IndexedDB SETTINGS | Authoritative | `patientInfo` | patientStorage.js, UIContext | patientStorage.js |

**Probleem**: import.js schrijft naar localStorage, export.js leest van localStorage, maar de app zelf gebruikt patientStorage.js (IndexedDB).

### Workdays Duplicatie

| Locatie | Type | Key | Gelezen door | Geschreven door |
|---------|------|-----|--------------|-----------------|
| localStorage | Legacy | `workday-dates` | export.js:36 (fallback) | import.js:164 |
| IndexedDB SETTINGS | Authoritative | `protime_workdays` | masterDatasetStorage.js | masterDatasetStorage.js, import.js:158 |

**Probleem**: import.js schrijft naar BEIDE, export.js probeert eerst IndexedDB, dan localStorage fallback.

---

## 📋 STAPPEN

### Stap 0: Rollback Punt (2 min)
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git tag v4.5.0-pre-localstorage-cleanup
git push origin v4.5.0-pre-localstorage-cleanup
```
→ Update PROGRESS.md: "Stap 0: Rollback tag created"

---

### Stap 1: Fix import.js - Patient Info (5 min)

**Huidige code** (regel ~172-176):
```javascript
// Step 8: Import patient info to localStorage
if (data.patientInfo) {
  try {
    localStorage.setItem('patient-info', JSON.stringify(data.patientInfo));
```

**Nieuwe code**:
```javascript
// Step 8: Import patient info to IndexedDB (via patientStorage)
if (data.patientInfo) {
  try {
    const { patientStorage } = await import('../utils/patientStorage.js');
    await patientStorage.save(data.patientInfo);
```

→ Update PROGRESS.md: "Stap 1: import.js patient info → IndexedDB"

---

### Stap 2: Fix export.js - Patient Info (5 min)

**Huidige code** (regel ~40-42):
```javascript
// Fetch patient info from localStorage
const patientInfoRaw = localStorage.getItem('patient-info');
const patientInfo = patientInfoRaw ? JSON.parse(patientInfoRaw) : null;
```

**Nieuwe code**:
```javascript
// Fetch patient info from IndexedDB (via patientStorage)
const { patientStorage } = await import('../utils/patientStorage.js');
const patientInfo = await patientStorage.get();
```

→ Update PROGRESS.md: "Stap 2: export.js patient info → IndexedDB"

---

### Stap 3: Fix import.js - Workdays (5 min)

**Huidige code** (regel ~158-165):
```javascript
// Step 6: Import workdays/ProTime data
if (data.workdays && data.workdays.length > 0) {
  try {
    const workdaySet = new Set(data.workdays);
    await saveProTimeData(workdaySet);
    // Also save to localStorage for V2 compatibility
    localStorage.setItem('workday-dates', JSON.stringify(data.workdays));
```

**Nieuwe code** - verwijder localStorage regel:
```javascript
// Step 6: Import workdays/ProTime data to IndexedDB
if (data.workdays && data.workdays.length > 0) {
  try {
    const workdaySet = new Set(data.workdays);
    await saveProTimeData(workdaySet);
    // V2 localStorage compatibility removed in v4.5.0
```

→ Update PROGRESS.md: "Stap 3: import.js workdays localStorage removed"

---

### Stap 4: Fix export.js - Workdays (5 min)

**Huidige code** (regel ~27-39):
```javascript
// Fetch ProTime workday data from V3 storage (IndexedDB)
let workdays = [];
try {
  const workdaySet = await loadProTimeData();
  workdays = workdaySet ? Array.from(workdaySet) : [];
} catch (err) {
  console.warn('[export] Failed to load ProTime from IndexedDB, trying localStorage fallback:', err);
  // Fallback to localStorage for V2 compatibility
  const workdaysRaw = localStorage.getItem('workday-dates');
  workdays = workdaysRaw ? JSON.parse(workdaysRaw) : [];
}
```

**Nieuwe code** - verwijder localStorage fallback:
```javascript
// Fetch ProTime workday data from IndexedDB
let workdays = [];
try {
  const workdaySet = await loadProTimeData();
  workdays = workdaySet ? Array.from(workdaySet) : [];
} catch (err) {
  console.warn('[export] Failed to load ProTime data:', err);
}
```

→ Update PROGRESS.md: "Stap 4: export.js workdays localStorage fallback removed"

---

### Stap 5: Add migration helper (10 min)

Maak een migration functie om bestaande localStorage data te migreren naar IndexedDB.
In `src/contexts/DataContext.jsx` (bij andere migrations):

```javascript
// One-time migration: patient info from localStorage to IndexedDB (v4.5.0)
// TODO: Remove after v4.6 when all users have migrated
useEffect(() => {
  const migratePatientInfo = async () => {
    try {
      const oldData = localStorage.getItem('patient-info');
      if (!oldData) return;
      
      const { patientStorage } = await import('../utils/patientStorage.js');
      const existing = await patientStorage.get();
      
      // Only migrate if IndexedDB is empty
      if (!existing || !existing.name) {
        const parsed = JSON.parse(oldData);
        await patientStorage.save(parsed);
        console.log('[DataContext] Migrated patient info from localStorage to IndexedDB');
      }
      
      localStorage.removeItem('patient-info');
    } catch (err) {
      console.error('[DataContext] Patient info migration failed:', err);
    }
  };
  migratePatientInfo();
}, []);

// One-time migration: workdays from localStorage to IndexedDB (v4.5.0)
// TODO: Remove after v4.6 when all users have migrated
useEffect(() => {
  const migrateWorkdays = async () => {
    try {
      const oldData = localStorage.getItem('workday-dates');
      if (!oldData) return;
      
      const { loadProTimeData, saveProTimeData } = await import('../storage/masterDatasetStorage.js');
      const existing = await loadProTimeData();
      
      // Only migrate if IndexedDB is empty
      if (!existing || existing.size === 0) {
        const parsed = JSON.parse(oldData);
        await saveProTimeData(new Set(parsed));
        console.log('[DataContext] Migrated workdays from localStorage to IndexedDB');
      }
      
      localStorage.removeItem('workday-dates');
    } catch (err) {
      console.error('[DataContext] Workdays migration failed:', err);
    }
  };
  migrateWorkdays();
}, []);
```

→ Update PROGRESS.md: "Stap 5: Migration helpers added"

---

### Stap 6: Test build (2 min)

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite build 2>&1 | tail -20
```

→ Update PROGRESS.md: "Stap 6: Build passing"

---

### Stap 7: Verify no remaining references (2 min)

```bash
# Should return NO results for these keys:
grep -rn "patient-info" src/ --include="*.js" --include="*.jsx" | grep -v migration
grep -rn "workday-dates" src/ --include="*.js" --include="*.jsx" | grep -v migration
```

→ Update PROGRESS.md: "Stap 7: No remaining localStorage references"

---

### Stap 8: Commit & Push (2 min)

```bash
git add -A
git commit -m "refactor(storage): consolidate patient/workday storage to IndexedDB (v4.5.0)

- Remove patient-info from localStorage, use patientStorage.js (IndexedDB)
- Remove workday-dates from localStorage, use protime_workdays (IndexedDB)  
- Add one-time migration for existing localStorage data
- Remove V2 compatibility fallbacks

Files changed:
- src/storage/import.js
- src/storage/export.js
- src/contexts/DataContext.jsx (migration hooks)"

git push origin main
```

→ Update PROGRESS.md: "Stap 8: Committed & pushed"

---

## 🔧 HANDIGE COMMANDO'S

```bash
# Build test
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite build 2>&1 | tail -20

# Find localStorage usage
grep -rn "localStorage\." src/ --include="*.js" --include="*.jsx" | grep -v migration

# Rollback if needed
git checkout v4.5.0-pre-localstorage-cleanup
```

---

## ⚠️ GOTCHAS

1. **patientStorage field mapping**: patientStorage.js heeft iets andere field names dan de export format. Check of mapping correct is.
2. **Async in export**: exportDataToJSON is async, dus await patientStorage.get() werkt prima.
3. **Migration order**: Patient info migration moet VOOR export.js probeert te lezen.
4. **Edge case**: Als user ZOWEL localStorage als IndexedDB data heeft, prefereer IndexedDB (nieuwer).

---

## 📝 PROGRESS.MD TEMPLATE

Na elke stap, update `/Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md`:

```markdown
### Fase 3: localStorage Cleanup

**Handoff:** `docs/handoffs/SESSION_HANDOFF_LOCALSTORAGE_CLEANUP.md`

**Stappen:**
- [ ] Stap 0: Rollback tag created (v4.5.0-pre-localstorage-cleanup)
- [ ] Stap 1: import.js patient info → IndexedDB
- [ ] Stap 2: export.js patient info → IndexedDB
- [ ] Stap 3: import.js workdays localStorage removed
- [ ] Stap 4: export.js workdays localStorage fallback removed
- [ ] Stap 5: Migration helpers added
- [ ] Stap 6: Build passing
- [ ] Stap 7: No remaining localStorage references
- [ ] Stap 8: Committed & pushed

**Issues:**
(noteer hier)
```

---

## 📊 VERWACHT RESULTAAT

**localStorage keys verwijderd:**
- `patient-info` → nu alleen IndexedDB `patientInfo`
- `workday-dates` → nu alleen IndexedDB `protime_workdays`

**Files gewijzigd:**
- src/storage/import.js (-2 localStorage writes)
- src/storage/export.js (-2 localStorage reads)
- src/contexts/DataContext.jsx (+2 migration hooks)

**Geschatte tijd**: 30-40 minuten

---

**Start met Stap 0**: Maak rollback tag.
