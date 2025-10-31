# 🐛 PHASE 5 BUGS - Quick Reference

**Status**: WACHT OP GO - Niet fixen tot expliciet toegestaan!

---

## 🔴 BUG #1: Default Lock State
**Probleem**: Bij fresh reload staan sensors >30d niet automatisch op slot  
**Impact**: MEDIUM - Safety issue  
**Locatie**: `sensorStorage.js` - `initializeManualLocks()`

---

## 🔴 BUG #2: Force Reload
**Probleem**: Toggle/delete forceert page reload → frustrerende workflow  
**Impact**: HIGH - UX issue  
**Locatie**: `SensorHistoryModal.jsx` - `location.reload()` calls

---

## 🔴 BUG #3: Sensors Komen Terug
**Probleem**: Delete werkt niet permanent, sensors reappear na refresh  
**Impact**: CRITICAL - Data integrity  
**Locatie**: `sensorStorage.js` - `deleteSensor()` + sync logic

---

## 🚦 FIX ORDER
1. **Bug #3** eerst (CRITICAL - data integrity)
2. **Bug #2** daarna (HIGH - UX)
3. **Bug #1** laatste (MEDIUM - enhancement)

---

## 💡 FIX STRATEGIE
- Werk in chunks ≤30 regels
- Test tussen chunks
- Commit per bug
- Document alles

---

**Lees**: `DEBUG_PHASE5_BUGS.md` voor complete details

**Wacht op GO!** ⏸️
