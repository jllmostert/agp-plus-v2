# ALL-IN Delete Functionaliteit - Complete Implementatie Guide

**Date**: 2025-11-14
**Feature**: Flexible ALL-IN cleanup met checkboxes  
**Status**: 🟡 PATCH READY - Manual implementation needed

---

## 🎯 WHAT THIS ADDS

Je kunt nu in de ALL-IN cleanup ALLES selecteren wat je wilt verwijderen:

✅ Glucose readings  
✅ Cartridge changes  
✅ ProTime werkdagen  
✅ Sensoren (nieuw!)  
✅ Sensor stock (nieuw!)  
✅ Patiënt info (nieuw!)

**UI**:
```
[ ✓ ] Alle glucose readings
[ ✓ ] Alle cartridge changes
[ ✓ ] Alle ProTime werkdagen
────────────────────────────
[ ] Alle sensoren (⚠️ permanent!)
[ ] Alle sensor stock (⚠️ permanent!)
[ ] Patiënt info (⚠️ ALLES WISSEN!)

✓ Automatische backup wordt gemaakt
✓ Je kunt altijd herstellen via JSON import

[⚠️ ALL-IN UITVOEREN]
```

---

## 📝 IMPLEMENTATION STEPS

### Step 1: State Variables Toevoegen

**File**: `src/components/DataManagementModal.jsx`  
**Location**: Regel ~7-20 (na bestaande state variables)

**Add**:
```javascript
  // State for ALL-IN checkboxes
  const [allInGlucose, setAllInGlucose] = useState(true);
  const [allInCartridge, setAllInCartridge] = useState(true);
  const [allInProTime, setAllInProTime] = useState(true);
  const [allInSensors, setAllInSensors] = useState(false);
  const [allInStock, setAllInStock] = useState(false);
  const [allInPatient, setAllInPatient] = useState(false);
```

**Note**: glucose/cartridge/protime starten op `true` (default checked)  
sensoren/stock/patient starten op `false` (safe default)

---

### Step 2: UI Vervangen

**File**: `src/components/DataManagementModal.jsx`  
**Location**: Regel ~217-320 (hele ALL-IN sectie)

**Replace** de hele `<div style={{ background: 'rgba(220, 38, 38, 0.1)' }}>` sectie met de inhoud van:

📄 **`ALLIN_CHECKBOXES_PATCH.jsx`** (complete versie)

Dit bevat:
- Checkboxes voor alle opties
- Aangepaste button logic
- Confirmation dialog met geselecteerde items
- Delete logic voor elk type data

---

### Step 3: Test de Implementatie

**Start dev server**:
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
npm run dev
```

**Test flow**:
1. Open app → Data Management modal
2. Scroll naar ALL-IN sectie
3. ✅ Zie checkboxes voor alle opties
4. ✅ Default: glucose/cartridge/protime checked
5. ✅ Sensoren/stock/patient unchecked (safe)
6. Selecteer wat je wilt
7. Klik "ALL-IN UITVOEREN"
8. ✅ Confirmation toont alleen geselecteerde items
9. ✅ Backup wordt gemaakt
10. ✅ Geselecteerde data wordt verwijderd

---

## 🔧 TECHNICAL DETAILS

### Delete Logic Per Type

**Glucose/Cartridge/ProTime** (existing):
```javascript
const { cleanupRecords } = await import('../storage/masterDatasetStorage');
const result = await cleanupRecords({ type: 'all-in' });
```

**Sensoren** (new):
```javascript
const sensorStorage = await import('../storage/sensorStorage');
const result = sensorStorage.clearAllSensors();
```

**Stock** (new):
```javascript
const { getAllBatches, deleteBatch } = await import('../storage/stockStorage');
const batches = getAllBatches();
batches.forEach(batch => deleteBatch(batch.batch_id));
```

**Patient Info** (new):
```javascript
localStorage.removeItem('agp-patient-info');
```

---

### Button State Management

Button is **disabled** when:
- `isDeleting === true` (deletion in progress)
- No checkboxes selected

```javascript
disabled={isDeleting || !(allInGlucose || allInCartridge || allInProTime || 
                          allInSensors || allInStock || allInPatient)}
```

---

### Confirmation Dialog

Dynamic message based on selection:
```javascript
const toDelete = [];
if (allInGlucose) toDelete.push('Glucose readings');
if (allInCartridge) toDelete.push('Cartridge changes');
// ... etc

confirm(
  'ALL-IN CLEANUP\n\n' +
  'Dit wordt verwijderd:\n' +
  toDelete.map(item => `- ${item}`).join('\n') +
  '\n\nBen je ABSOLUUT ZEKER?'
);
```

---

## 🎨 UI/UX FEATURES

### Visual Hierarchy

**Normal items** (glucose/cartridge/protime):
- Color: `var(--ink)` (black)
- Font weight: normal

**Dangerous items** (sensoren/stock):
- Color: `var(--color-red)`
- Font weight: 600
- Warning icon: ⚠️

**Critical item** (patient):
- Color: `var(--color-red)`
- Font weight: 700 (bold)
- Double warning: ⚠️⚠️

### Separator Line

Visual break tussen safe/dangerous options:
```javascript
<div style={{ height: '1px', background: 'var(--border-primary)', margin: '0.5rem 0' }} />
```

---

## ✅ SAFETY FEATURES

### 1. Automatic Backup
```javascript
const { exportAndDownload } = await import('../storage/export');
const backupResult = await exportAndDownload();

if (!backupResult.success) {
  alert('Backup failed - cleanup cancelled for safety');
  return; // STOP if backup fails
}
```

### 2. Confirmation Dialog
Shows exactly what will be deleted - no surprises

### 3. Safe Defaults
Dangerous options start unchecked:
- Sensoren: `false`
- Stock: `false`
- Patient: `false`

### 4. Minimum Selection
Button disabled if nothing selected:
```javascript
if (!hasSelection) {
  alert('Selecteer minimaal 1 optie om te verwijderen');
  return;
}
```

---

## 📊 COMPARISON: BEFORE vs AFTER

### BEFORE (v4.0.1)
```
ALL-IN:
  [ONE BUTTON]
  Verwijdert: glucose, cartridge, protime
  Behoudt: sensoren, stock, patient
  
No flexibility - all or nothing
```

### AFTER (v4.1.0)
```
ALL-IN:
  [✓] Glucose readings
  [✓] Cartridge changes
  [✓] ProTime werkdagen
  ────────────────────
  [ ] Sensoren ⚠️
  [ ] Stock ⚠️
  [ ] Patient ⚠️⚠️
  
  [BUTTON]
  
Full flexibility - choose what to delete
```

---

## 🧪 TEST SCENARIOS

### Test 1: Default Selection
1. Open modal
2. Don't change anything
3. Click button
4. ✅ Only glucose/cartridge/protime deleted
5. ✅ Sensoren/stock/patient kept

### Test 2: Delete Everything
1. Check all boxes
2. Click button
3. Confirm (scary message!)
4. ✅ Everything deleted
5. ✅ Backup created

### Test 3: Selective Delete
1. Check only "Sensoren"
2. Click button
3. ✅ Only sensoren deleted
4. ✅ Everything else kept

### Test 4: No Selection
1. Uncheck all boxes
2. Click button
3. ✅ Button disabled (can't click)
4. Or: alert("Selecteer minimaal 1 optie")

### Test 5: Backup Failure
1. Mock backup failure
2. Try to delete
3. ✅ Deletion cancelled
4. ✅ Alert shown: "Backup failed"

---

## 📁 FILES TO MODIFY

### Modified
```
src/components/DataManagementModal.jsx
  - Lines 7-20: Add state variables (6 new)
  - Lines 217-320: Replace entire ALL-IN section
```

### Reference
```
ALLIN_CHECKBOXES_PATCH.jsx
  - Complete replacement code
  - Copy-paste ready
```

---

## 🚀 DEPLOYMENT

### Manual Steps
1. Open `src/components/DataManagementModal.jsx`
2. Add state variables at top (after existing)
3. Replace ALL-IN section with patch file content
4. Save file
5. Test locally: `npm run dev`
6. Commit: `git commit -m "feat: flexible ALL-IN cleanup with checkboxes"`

### Automated (if you want)
```bash
# Backup original
cp src/components/DataManagementModal.jsx src/components/DataManagementModal.jsx.backup

# Apply patch manually (no auto-patch script yet)
# Open file, copy paste from ALLIN_CHECKBOXES_PATCH.jsx

# Test
npm run dev

# If good:
git add src/components/DataManagementModal.jsx
git commit -m "feat: flexible ALL-IN cleanup with checkboxes"
git push
```

---

## ⚠️ BREAKING CHANGES

**None!** This is fully backwards compatible.

Old behavior (delete glucose/cartridge/protime) is the **default** when you open the modal.

Users can opt-in to delete more by checking boxes.

---

## 🎓 DESIGN RATIONALE

### Why Checkboxes?

**Before**: "ALL-IN deletes X, keeps Y" - inflexible
**After**: "Choose what to delete" - full control

### Why Safe Defaults?

Dangerous operations (delete sensoren/stock/patient) start **unchecked**.

User must actively choose to delete these - no accidents.

### Why Visual Hierarchy?

Color coding:
- Black = safe (normal data)
- Red = dangerous (sensors, stock)
- Bold red = critical (patient info)

Makes consequences clear at a glance.

---

## 🐛 EDGE CASES HANDLED

### Case 1: No Selection
✅ Button disabled

### Case 2: Backup Fails
✅ Deletion cancelled, user informed

### Case 3: Partial Delete Failure
✅ Each delete wrapped in try/catch
✅ Shows which succeeded/failed

### Case 4: User Cancels Confirmation
✅ Nothing happens, state restored

---

## 💡 FUTURE IMPROVEMENTS

### Phase 2 (Optional)
- [ ] Add "Select All" / "Deselect All" buttons
- [ ] Remember last selection (localStorage)
- [ ] Show data sizes next to each checkbox
- [ ] Preview: "This will delete X readings, Y sensors, etc"

### Phase 3 (Optional)
- [ ] Undo functionality (restore from backup within modal)
- [ ] Export before delete (automatic)
- [ ] Schedule deletion (delete at specific time)

---

## 📝 SUMMARY FOR JO

Hey Jo! 👋

Ik heb de ALL-IN cleanup volledig flexibel gemaakt:

**Wat je nu kunt**:
- ✅ Checkboxes voor alles: glucose, cartridge, protime, sensoren, stock, patient
- ✅ Kies zelf wat je wilt verwijderen
- ✅ Safe defaults: sensoren/stock/patient unchecked (moet je bewust aanvinken)
- ✅ Automatic backup voor alles wat je delete
- ✅ Duidelijke warning voor gevaarlijke opties (rood + ⚠️)

**How to apply**:
1. Open `src/components/DataManagementModal.jsx`
2. Add state variables (zie Step 1)
3. Replace ALL-IN sectie met `ALLIN_CHECKBOXES_PATCH.jsx`
4. Test: `npm run dev`
5. Commit + push

**File to use**: `ALLIN_CHECKBOXES_PATCH.jsx` (complete copy-paste ready code)

Laat me weten als je wilt dat ik dit voor je apply! 🚀

---

**Implementation Status**: 🟡 READY TO APPLY (manual copy-paste needed)
