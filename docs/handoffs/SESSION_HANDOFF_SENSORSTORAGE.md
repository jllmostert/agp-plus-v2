# Session Handoff: sensorStorage.js Cleanup

**Project**: AGP+ Medical Data Visualization  
**Path**: `/Users/jomostert/Documents/Projects/agp-plus`  
**Priority**: Low (optional cleanup)
**Estimated Time**: 30-45 minuten

---

## 🎯 CONTEXT

Dit is een **minor cleanup** sessie. Het bestand is al goed georganiseerd (Spaghetti Index: 2/5).

**Target File**: `src/storage/sensorStorage.js` (~494 lijnen)

---

## 📋 QUICK WINS (Scope)

### 1. Remove Dead `batches` References
**Status**: Mogelijk al gedaan in eerdere cleanup  
**Check eerst**: `grep -n "batches" src/storage/sensorStorage.js`

Als nog aanwezig:
- `importJSON` referenties naar `storage.batches` verwijderen
- Batches zijn verplaatst naar `stockStorage.js`

### 2. Fix Hardcoded Date in updateHardwareVersions
**Locatie**: Zoek naar `2025-07-03` of `updateHardwareVersions`

**Probleem**: Hardcoded cutoff date voor hardware versie detectie
**Oplossing**: Gebruik `deviceEras.js` voor consistentie

```javascript
// VOOR (hardcoded)
const cutoffDate = new Date('2025-07-03');

// NA (gebruik deviceEras)
import { DEVICE_ERAS } from '../core/deviceEras.js';
const cutoffDate = new Date(DEVICE_ERAS.GUARDIAN_4.startDate);
```

### 3. Simplify importJSON Merge Logic (Optional)
**Alleen als tijd over**: De merge logic (~60 lijnen) kan cleaner
**Risico**: Medium - import/export is kritiek

---

## ⚠️ NIET DOEN

- ❌ Geen grote refactors (file is al clean)
- ❌ Geen extractie naar aparte modules (minimal benefit)
- ❌ Geen wijzigingen aan status berekening logic
- ❌ Geen schema changes

---

## 🔧 VERIFICATIE

Na elke wijziging:
```bash
# Build check
cd /Users/jomostert/Documents/Projects/agp-plus && npx vite build

# Functionality check (manual)
# 1. Start dev server
# 2. Open Sensoren panel
# 3. Verify sensor list loads
# 4. Test import/export if changed
```

---

## 📝 EXPECTED OUTCOME

| Metric | Voor | Na |
|--------|------|-----|
| sensorStorage.js | ~494 lijnen | ~450-480 lijnen |
| Dead code | Mogelijk batches refs | Removed |
| Hardcoded dates | 1 | 0 |

---

## 🏁 DONE CRITERIA

- [ ] `grep "batches" src/storage/sensorStorage.js` returns nothing
- [ ] `updateHardwareVersions` uses deviceEras.js (of was al correct)
- [ ] Build passing
- [ ] Sensor panel werkt nog correct

---

**Note**: Dit is een low-priority cleanup. Als de batches refs al weg zijn en de hardcoded date niet bestaat, is dit bestand **done** en hoeft niets te gebeuren.
