# Session Handoff: Fase 2 - Cartridge Storage IndexedDB Migration

**Project**: AGP+ Medical Data Visualization  
**Path**: `/Users/jomostert/Documents/Projects/agp-plus`  
**Start server**: `cd agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001`

---

## 🎯 DOEL

Migreer `eventStorage.js` volledig naar IndexedDB en hernoem naar `cartridgeStorage.js`.

**Waarom IndexedDB?**
- localStorage heeft 5-10MB limiet
- Consistent met rest van storage layer
- Betere async patterns
- Geen sync issues met andere IndexedDB data

**Strategie**: Gebruik bestaande `STORES.SETTINGS` met key `cartridge_changes` (geen schema change nodig).

---

## ⚠️ WERKWIJZE

```
1. EERST: git tag v4.4.0-pre-cartridge-migration (rollback punt)
2. Update PROGRESS.md na ELKE substap
3. Test build na elke file change
4. HERSCHRIJF code waar mogelijk (niet patchen)
5. Gebruik // comments voor clarity
6. Commit & push na elke fase
```

---

## 📊 ANALYSE: Huidige Situatie

### eventStorage.js (191 lines, localStorage)
```
Key: 'agp-device-events'
Format: { cartridgeChanges: [...], lastScanned: ISO }
```

### Functies en Consumers

| Functie | Consumers | Nieuwe Naam |
|---------|-----------|-------------|
| `storeEvents(events)` | cleanup-engine.js | `saveAllCartridgeChanges(changes)` |
| `getAllEvents()` | cleanup-engine.js | `getAllCartridgeChanges()` |
| `getEventsForDate(date)` | day-profile-engine.js | `getCartridgeChangesForDate(date)` |
| `hasEvents()` | masterDatasetStorage.js | `hasCartridgeChanges()` |
| `clearEvents()` | masterDatasetStorage.js | `clearCartridgeChanges()` |
| `storeCartridgeChange(ts, alarm, src)` | masterDatasetStorage.js, import.js | `addCartridgeChange(ts, alarm, src)` |
| `getCartridgeHistory()` | export.js, DataManagementModal.jsx | `getCartridgeHistory()` (unchanged) |
| `deleteCartridgeChangesInRange(start, end)` | AGPGenerator.jsx | `deleteCartridgeChangesInRange(start, end)` (unchanged) |
| `getEventStats()` | (unused) | REMOVE |
| `getLastScanned()` | (unused) | REMOVE |

### Consumer Files (7 total)
1. `src/core/cleanup-engine.js` - lines 27, 111, 205, 222
2. `src/core/day-profile-engine.js` - lines 14, 75
3. `src/storage/export.js` - lines 10, 25
4. `src/storage/import.js` - lines 10, 135
5. `src/storage/masterDatasetStorage.js` - lines 476, 481, 505, 508, 990, 991
6. `src/components/AGPGenerator.jsx` - lines 656, 657
7. `src/components/DataManagementModal.jsx` - lines 86, 87

---

## 📋 STAPPEN

### Stap 0: Rollback Punt (2 min)
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git tag v4.4.0-pre-cartridge-migration
git push origin v4.4.0-pre-cartridge-migration
```
→ Update PROGRESS.md: "Stap 0: Rollback tag created"

---

### Stap 1: Schrijf nieuwe cartridgeStorage.js (15 min)

**HERSCHRIJF volledig** - niet patchen. Maak nieuw bestand:
`src/storage/cartridgeStorage.js`

```javascript
/**
 * CARTRIDGE STORAGE MODULE
 * 
 * Manages cartridge change events in IndexedDB (SETTINGS store).
 * Cartridge changes are detected during CSV processing and stored
 * for day profile generation and export.
 * 
 * Storage: IndexedDB → SETTINGS store → key 'cartridge_changes'
 * Format: { changes: [...], lastScanned: ISO }
 * 
 * @module cartridgeStorage
 * @version 4.5.0
 */

import { openDB, STORES } from './db.js';

const STORAGE_KEY = 'cartridge_changes';

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Get raw data from IndexedDB
 * @returns {Promise<Object|null>}
 */
async function getRawData() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SETTINGS, 'readonly');
    const store = tx.objectStore(STORES.SETTINGS);
    const record = await store.get(STORAGE_KEY);
    return record?.value || null;
  } catch (err) {
    console.error('[cartridgeStorage] Error reading:', err);
    return null;
  }
}

/**
 * Save raw data to IndexedDB
 * @param {Object} data - { changes: [], lastScanned: ISO }
 */
async function saveRawData(data) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = tx.objectStore(STORES.SETTINGS);
    await store.put({ key: STORAGE_KEY, value: data });
    await tx.done;
  } catch (err) {
    console.error('[cartridgeStorage] Error saving:', err);
    throw err;
  }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Get all cartridge changes
 * @returns {Promise<Array>} Array of cartridge change objects
 */
export async function getAllCartridgeChanges() {
  const data = await getRawData();
  return data?.changes || [];
}

/**
 * Get cartridge changes for a specific date
 * @param {string} date - Date in YYYY/MM/DD format
 * @returns {Promise<Array>} Filtered changes for that date
 */
export async function getCartridgeChangesForDate(date) {
  const changes = await getAllCartridgeChanges();
  return changes.filter(c => c.date === date);
}

/**
 * Check if any cartridge changes exist
 * @returns {Promise<boolean>}
 */
export async function hasCartridgeChanges() {
  const changes = await getAllCartridgeChanges();
  return changes.length > 0;
}

/**
 * Save all cartridge changes (replaces existing)
 * @param {Array} changes - Array of cartridge change objects
 */
export async function saveAllCartridgeChanges(changes) {
  await saveRawData({
    changes,
    lastScanned: new Date().toISOString()
  });
}

/**
 * Add a single cartridge change
 * @param {Date} timestamp - When the change occurred
 * @param {string} alarmText - Alarm text (usually "Rewind")
 * @param {string} sourceFile - Source filename
 * @throws {Error} If duplicate change exists
 */
export async function addCartridgeChange(timestamp, alarmText, sourceFile) {
  const changes = await getAllCartridgeChanges();
  
  // Format date and time
  const date = timestamp.toISOString().split('T')[0].replace(/-/g, '/');
  const time = timestamp.toTimeString().split(' ')[0];
  
  // Check for duplicates
  const exists = changes.some(c => c.date === date && c.time === time);
  if (exists) {
    throw new Error('Duplicate cartridge change event');
  }
  
  // Add new change
  changes.push({
    date,
    time,
    timestamp: timestamp.toISOString(),
    alarmText: alarmText || 'Rewind',
    sourceFile
  });
  
  await saveAllCartridgeChanges(changes);
}

/**
 * Get cartridge history for export
 * @returns {Promise<Array>}
 */
export async function getCartridgeHistory() {
  return getAllCartridgeChanges();
}

/**
 * Delete cartridge changes within date range
 * @param {Date} startDate - Start of range (inclusive)
 * @param {Date} endDate - End of range (inclusive)
 * @returns {Promise<number>} Count of deleted changes
 */
export async function deleteCartridgeChangesInRange(startDate, endDate) {
  const changes = await getAllCartridgeChanges();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const filtered = changes.filter(c => {
    const ts = new Date(c.timestamp).getTime();
    return ts < startTime || ts > endTime;
  });
  
  const deleted = changes.length - filtered.length;
  await saveAllCartridgeChanges(filtered);
  
  return deleted;
}

/**
 * Clear all cartridge changes
 */
export async function clearCartridgeChanges() {
  await saveRawData({ changes: [], lastScanned: null });
}

// ============================================================
// MIGRATION HELPER (remove after v4.6)
// ============================================================

/**
 * Migrate data from localStorage to IndexedDB (one-time)
 * Call this on app startup during transition period
 */
export async function migrateFromLocalStorage() {
  const OLD_KEY = 'agp-device-events';
  
  try {
    const oldData = localStorage.getItem(OLD_KEY);
    if (!oldData) return { migrated: false, reason: 'no-data' };
    
    const parsed = JSON.parse(oldData);
    const changes = parsed.cartridgeChanges || [];
    
    if (changes.length === 0) {
      localStorage.removeItem(OLD_KEY);
      return { migrated: false, reason: 'empty' };
    }
    
    // Check if IndexedDB already has data
    const existing = await getAllCartridgeChanges();
    if (existing.length > 0) {
      localStorage.removeItem(OLD_KEY);
      return { migrated: false, reason: 'already-migrated' };
    }
    
    // Migrate
    await saveAllCartridgeChanges(changes);
    localStorage.removeItem(OLD_KEY);
    
    console.log(`[cartridgeStorage] Migrated ${changes.length} changes from localStorage`);
    return { migrated: true, count: changes.length };
  } catch (err) {
    console.error('[cartridgeStorage] Migration error:', err);
    return { migrated: false, reason: 'error', error: err.message };
  }
}
```

→ Update PROGRESS.md: "Stap 1: cartridgeStorage.js created (170 lines)"

---

### Stap 2: Update cleanup-engine.js (5 min)

```bash
grep -n "eventStorage" src/core/cleanup-engine.js
```

**Changes needed:**
- Line 27: Update import
- Line 111, 205: `getAllEvents()` → `await getAllCartridgeChanges()`
- Line 222: `storeEvents(events)` → `await saveAllCartridgeChanges(events.cartridgeChanges)`

**Note**: Functions become async - check if caller functions need async/await.

→ Update PROGRESS.md: "Stap 2: cleanup-engine.js updated"

---

### Stap 3: Update day-profile-engine.js (5 min)

```bash
grep -n "eventStorage" src/core/day-profile-engine.js
```

**Changes needed:**
- Line 14: Update import
- Line 75: `getEventsForDate(date)` → `await getCartridgeChangesForDate(date)`
- Return format changes: was `{ cartridgeChanges: [] }`, now returns array directly

→ Update PROGRESS.md: "Stap 3: day-profile-engine.js updated"

---

### Stap 4: Update storage files (10 min)

**export.js:**
- Line 10: Update import
- Line 25: Already async, just change function name

**import.js:**
- Line 10: Update import  
- Line 135: `storeCartridgeChange` → `addCartridgeChange`

**masterDatasetStorage.js:**
- Line 476: Update import path
- Line 481: `storeCartridgeChange` → `addCartridgeChange`
- Line 505: Update import path
- Line 508: `hasEvents()` → `await hasCartridgeChanges()`
- Line 990-991: `clearEvents()` → `await clearCartridgeChanges()`

→ Update PROGRESS.md: "Stap 4: Storage files updated (export.js, import.js, masterDatasetStorage.js)"

---

### Stap 5: Update components (5 min)

**AGPGenerator.jsx:**
- Line 656: Update import path to cartridgeStorage
- Line 657: Function name unchanged

**DataManagementModal.jsx:**
- Line 86: Update import path
- Line 87: Function name unchanged

→ Update PROGRESS.md: "Stap 5: Components updated"

---

### Stap 6: Add migration call to app startup (5 min)

In `src/contexts/DataContext.jsx` or `AGPGenerator.jsx` init:

```javascript
// One-time migration from localStorage (remove in v4.6)
import { migrateFromLocalStorage } from '../storage/cartridgeStorage';

useEffect(() => {
  migrateFromLocalStorage().then(result => {
    if (result.migrated) {
      console.log(`[App] Migrated ${result.count} cartridge changes to IndexedDB`);
    }
  });
}, []);
```

→ Update PROGRESS.md: "Stap 6: Migration hook added"

---

### Stap 7: Delete old file & test (5 min)

```bash
rm src/storage/eventStorage.js
npm run build
```

→ Update PROGRESS.md: "Stap 7: eventStorage.js deleted, build passing"

---

### Stap 8: Commit & Push (2 min)

```bash
git add -A
git commit -m "refactor(storage): migrate cartridge storage to IndexedDB (v4.5.0)

- Create new cartridgeStorage.js with IndexedDB backend
- Use SETTINGS store with key 'cartridge_changes'
- Update all 7 consumer files
- Add one-time migration from localStorage
- Delete old eventStorage.js

Breaking change: All cartridge functions are now async"

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

# Find all eventStorage references
grep -rn "eventStorage" src/ --include="*.js" --include="*.jsx"

# Rollback if needed
git checkout v4.4.0-pre-cartridge-migration
```

---

## ⚠️ GOTCHAS

1. **Async conversion**: Alle functies worden async - check dat callers `await` gebruiken
2. **Return format change**: `getEventsForDate` returned `{ cartridgeChanges: [] }`, nieuwe versie returns array direct
3. **IndexedDB transactions**: Zorg dat `tx.done` awaited wordt
4. **Migration timing**: Moet VOOR eerste cartridge read/write gebeuren

---

## 📝 PROGRESS.MD TEMPLATE

Na elke stap, update `/Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md`:

```markdown
## Fase 2: Cartridge Storage Migration

### Stappen
- [x] Stap 0: Rollback tag created
- [x] Stap 1: cartridgeStorage.js created
- [ ] Stap 2: cleanup-engine.js updated
- [ ] Stap 3: day-profile-engine.js updated
- [ ] Stap 4: Storage files updated
- [ ] Stap 5: Components updated
- [ ] Stap 6: Migration hook added
- [ ] Stap 7: eventStorage.js deleted, build passing
- [ ] Stap 8: Committed & pushed

### Issues
(noteer hier)
```

---

**Start met Stap 0**: Maak rollback tag.
