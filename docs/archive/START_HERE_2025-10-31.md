---
quick_start: true
date: 2025-10-31
status: Phase 5 Ready
---

# START HERE - Phase 5: Sensor Locking

## 🎯 Mission
Implement sensor locking system to protect historical data from accidental edits.

## ⚡ Quick Start

### 1. Kill Port & Start Server
```bash
# Kill port 3001
lsof -ti:3001 | xargs kill -9

# Start server
cd ~/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### 2. Current State
- ✅ Phase 4 complete: Sensor registration working
- 🐛 2 known bugs (debug later, see HANDOFF)
- 📦 2 CSV sensors in localStorage
- 🔄 Ready for Phase 5

### 3. What We're Building
**Lock System**: Protect sensors >30 days old from edits

## 🔒 Phase 5 Implementation

### Step 1: Add Lock Logic to Storage
**File**: `src/storage/sensorStorage.js`

```javascript
/**
 * Check if sensor is locked (>30 days old)
 */
export const isSensorLocked = (sensor) => {
  if (!sensor.start_date) return false;
  
  const sensorDate = new Date(sensor.start_date);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return sensorDate < thirtyDaysAgo;
};

/**
 * Get lock status info for sensor
 */
export const getSensorLockInfo = (sensor) => {
  const locked = isSensorLocked(sensor);
  const daysAgo = Math.floor(
    (new Date() - new Date(sensor.start_date)) / (1000 * 60 * 60 * 24)
  );
  
  return {
    locked,
    daysAgo,
    reason: locked ? `Historical data (${daysAgo} days old)` : null
  };
};
```

### Step 2: Update SensorHistoryModal UI
**File**: `src/components/SensorHistoryModal.jsx`

#### Add Lock Column to Table
```jsx
<th>STATUS</th>
<th>LOCK</th>  {/* NEW */}
<th>ACTIONS</th>
```

#### Add Lock Badge
```jsx
{/* In table row */}
<td>
  {isSensorLocked(sensor) ? (
    <span className="lock-badge">🔒 LOCKED</span>
  ) : (
    <span className="lock-badge unlocked">🔓 EDITABLE</span>
  )}
</td>
```

#### Disable Actions for Locked Sensors
```jsx
<button
  onClick={() => handleEdit(sensor)}
  disabled={isSensorLocked(sensor)}
  className={`btn-edit ${isSensorLocked(sensor) ? 'disabled' : ''}`}
  title={isSensorLocked(sensor) ? 'Cannot edit historical sensor' : 'Edit sensor'}
>
  ✎ EDIT
</button>
```

### Step 3: Add CSS Styles
**File**: `src/components/SensorHistoryModal.css`

```css
/* Lock badges */
.lock-badge {
  display: inline-block;
  padding: 4px 8px;
  border: 2px solid #000;
  background: #ff6b6b;
  color: #000;
  font-weight: bold;
  font-size: 11px;
}

.lock-badge.unlocked {
  background: #51cf66;
}

/* Disabled buttons */
.btn-edit.disabled,
.btn-delete.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

/* Locked rows - gray out */
tr.locked {
  opacity: 0.6;
  background: #f5f5f5;
}
```

### Step 4: Add Confirmation Dialog
```jsx
const handleEdit = (sensor) => {
  const lockInfo = getSensorLockInfo(sensor);
  
  if (lockInfo.locked) {
    alert(`Cannot edit: ${lockInfo.reason}`);
    return;
  }
  
  // Show confirmation for current month edits
  const confirmed = confirm(
    `Edit sensor from ${formatDate(sensor.start_date)}?\n\n` +
    `This will modify your historical data.`
  );
  
  if (!confirmed) return;
  
  // Proceed with edit
  setEditingSensor(sensor);
};
```

## 📋 Implementation Checklist

### Phase 5A: Lock Logic
- [ ] Add `isSensorLocked()` to `sensorStorage.js`
- [ ] Add `getSensorLockInfo()` helper
- [ ] Test with sensors from different dates
- [ ] Verify 30-day threshold works

### Phase 5B: UI Updates
- [ ] Add LOCK column to table
- [ ] Add lock badges (🔒/🔓)
- [ ] Gray out locked rows
- [ ] Disable edit/delete buttons for locked
- [ ] Add tooltips explaining lock status

### Phase 5C: Interactions
- [ ] Show alert when trying to edit locked sensor
- [ ] Add confirmation dialog for editable sensors
- [ ] Test bulk operations (don't affect locked)
- [ ] Add "Locked sensors: X" to stats panel

### Phase 5D: Testing
- [ ] Upload old CSV (March 2022) → Should be locked
- [ ] Upload recent CSV (Oct 2025) → Should be editable
- [ ] Try editing locked sensor → Should block
- [ ] Try editing recent sensor → Should prompt confirmation

## 🐛 Known Issues (Don't Fix Yet)

### Bug 1: Running Sensor Shows "Fail"
**File**: `src/hooks/useSensorDatabase.js`  
**Line**: ~130-155  
**Status**: Logic written, not displaying correctly  
**Debug Later**: After Phase 5

### Bug 2: Day Profiles Fill Gaps Today
**File**: `src/components/DayProfilesModal.jsx`  
**Status**: Partial day handling issue  
**Debug Later**: After Phase 5

## 🧪 Test Data

### Current localStorage
```javascript
// Sensor 1: Oct 25 (6 days old) → Should be EDITABLE
{
  "sensor_id": "sensor_1761372687000",
  "start_date": "2025-10-25T06:11:27.000Z",
  "end_date": "2025-10-30T10:37:34.000Z"
}

// Sensor 2: Oct 30 (1 day old) → Should be EDITABLE
{
  "sensor_id": "sensor_1761828098000",
  "start_date": "2025-10-30T12:41:38.000Z",
  "end_date": null
}
```

### After SQLite Import (219 sensors)
```javascript
// Sensor from March 2022 (945 days old) → Should be LOCKED
// Sensor from Sept 2025 (60 days old) → Should be LOCKED
// Sensor from Oct 2025 (20 days old) → Should be EDITABLE
```

## 💡 Pro Tips

1. **Test incrementally**: Add lock logic first, then UI, then interactions
2. **Use DevTools**: `isSensorLocked(sensors[0])` in console
3. **Check dates**: `new Date(sensor.start_date)` to verify parsing
4. **Visual feedback**: Lock icons should be immediately obvious
5. **Conservative approach**: When in doubt, lock it (safer)

## 🔗 Files to Touch

### Primary
1. `src/storage/sensorStorage.js` - Lock logic functions
2. `src/components/SensorHistoryModal.jsx` - UI updates
3. `src/components/SensorHistoryModal.css` - Lock styling

### Secondary
4. `src/hooks/useSensorDatabase.js` - Add lock status to sensor objects
5. `src/components/SensorRegistration.jsx` - Show lock status for candidates?

## 🚀 Success Metrics

- ✅ Sensors >30 days show 🔒 icon
- ✅ Edit/delete disabled for locked sensors
- ✅ Clear error message when trying to edit locked
- ✅ Confirmation dialog for editable sensors
- ✅ Visual distinction (gray out locked rows)
- ✅ No way to accidentally modify historical data

## 📝 Commit Strategy

```bash
# Step 1: Lock logic
git add src/storage/sensorStorage.js
git commit -m "feat(phase5): Add sensor locking logic (>30 days)"

# Step 2: UI updates
git add src/components/SensorHistoryModal.*
git commit -m "feat(phase5): Add lock UI with badges and disabled states"

# Step 3: Interactions
git add src/components/SensorHistoryModal.jsx
git commit -m "feat(phase5): Add edit confirmation and lock enforcement"

# Step 4: Complete
git push origin main
```

## 🎨 Design Notes

**Brutalist Approach**:
- Lock icon: 🔒 (simple emoji, no custom SVG)
- Colors: Red for locked, green for unlocked
- Bold borders: 2px solid black on badges
- No subtle animations or gradients
- High contrast text
- Monospace numbers

**User Experience**:
- Lock status immediately visible (no hover required)
- Clear error messages (no cryptic codes)
- Confirmation dialogs have context (show date, duration)
- One-click actions where safe, confirmation where risky

---

**Ready to implement Phase 5! Start server and let's lock it down. 🔒**
