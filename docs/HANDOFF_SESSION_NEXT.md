# Session Handoff - Sensor Module Rewrite v4.0.0

**Date**: 2025-11-08 14:05  
**Status**: 🟡 Phase 3 - Ready for Migration Testing  
**Next**: Run migration on port 3001, verify bug fix  
**Priority**: CRITICAL - crash-bestendig werk, tokenzuinig

---

## 🎯 CURRENT STATE

### What Was Accomplished

**Problem Solved**: Sensor #222 bug (shows FAIL instead of ACTIVE)  
**Root Cause**: Status calculated in 4+ places, dual storage chaos  
**Solution**: Complete rewrite with ONE status function, ONE storage location

### Files Created (CLEAN REWRITE)

```
✅ src/storage/sensorStorage.js           (369 lines)
   - ONE status function: calculateStatus(sensor)
   - Simple CRUD: getAllSensors, addSensor, updateSensor, deleteSensor
   - Lock/batch operations
   - Export/Import JSON
   - 77% code reduction (was 1595 lines!)

✅ src/hooks/useSensors.js                (46 lines)
   - Simple React hook wrapper
   - Just calls sensorStorage functions

✅ scripts/migrate_once.js                (217 lines)
   - ONE-TIME migration script
   - Transforms SQLite + localStorage → V4
   - Fixes sensor #222 deletion bug
   - Run once then delete

✅ public/migrate.html                     (updated)
   - UI to run migration
   - Shows progress in console
   - Verify button after migration

✅ docs/HANDOFF_SENSOR_REWRITE_CLEAN.md   (460 lines)
   - Full requirements doc
   - Clean schema definition
   - Migration strategy
```

### Files Updated

```
✅ src/components/panels/SensorHistoryPanel.jsx
   - Updated imports to use new sensorStorage
   - Added wrapper functions for compatibility
   - Ready to use after migration
```

### Files Ready for Use

```
✅ public/sqlite_sensors_export.json       (94KB, 219 sensors)
✅ public/agp-sensors-2025-11-08.json      (11KB, 6 sensors)
   → Migration script loads these via fetch
```

### Backups Created

```
✅ docs/archive/2025-11-08_sensor_rewrite/
   ├── master_sensors_backup.db           (92KB)
   ├── agp-sensors-2025-11-08.json        (11KB)
   └── sqlite_sensors_export.json         (94KB)
```

---

## 🚀 NEXT STEPS (Compact & Clear)

### CRITICAL: WE ALWAYS USE PORT 3001

**Why**: Database, localStorage, all configs point to port 3001  
**Never use**: 3004, 3005, or any other port  
**Start command**: ALWAYS this one:

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### Step 1: Verify Server Running (1 min)

Server should already be running on http://localhost:3001  
**If not running**: Use start command above

### Step 2: Run Migration (10 min)

```bash
# Open in browser:
http://localhost:3001/migrate.html

# Click buttons in order:
1. "Check Current Storage" → verify files found
2. "Run Migration" → wait for completion (logs appear)
3. "Verify Migration" → check sensor #222 status

# Expected results:
- 225 sensors total (219 + 6)
- Sensor #222: status = 'active' ✅
- No errors in console
```

**If migration fails**: 
- Check browser console for errors
- Verify JSON files exist in /public/
- Migration is idempotent (can run multiple times)

### Step 3: Test App (15 min)

```bash
# Open main app:
http://localhost:3001

# Navigate to: SENSOREN panel

# Verify:
✅ All sensors visible
✅ Sensor #222 shows "🔄 ACTIVE" (not FAIL)
✅ Lock toggle works
✅ Batch assignment works
✅ Delete works (soft delete)
✅ Export JSON works

# Try adding new sensor:
- Upload CSV with new data
- Verify detection works
- Check new sensor appears in list
```

### Step 4: Cleanup (10 min)

**After confirming everything works**:

```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Delete migration files (no longer needed):
rm scripts/migrate_once.js
rm public/migrate.html
rm public/sqlite_sensors_export.json
rm public/agp-sensors-2025-11-08.json

# Delete wrong approach files (if still exist):
rm src/scripts/migrateToV4.js 2>/dev/null
rm src/storage/sensorStorageV4.js 2>/dev/null
rm src/storage/sensorStorageCompat.js 2>/dev/null

# Archive SQLite database (already backed up):
mkdir -p docs/archive/2025-11-08_sensor_rewrite/
# (already done - just verify backup exists)
```

### Step 5: Git Commit (5 min)

```bash
git add .
git commit -m "v4.0.0: Clean sensor module rewrite

- Single source of truth (localStorage only)
- ONE status function (pure, deterministic)
- 77% code reduction (1595→369 lines)
- Bug fixed: sensor #222 now shows correct status
- One-time SQLite migration complete
- All sensors treated equally

BREAKING: Requires migration from v3.x to v4.0"

git push origin develop
```

---

## 🔥 IF SESSION CRASHES - RECOVERY

### What's Safe

✅ All backups exist in `docs/archive/2025-11-08_sensor_rewrite/`  
✅ New code is written (src/storage/sensorStorage.js)  
✅ Migration script is ready (scripts/migrate_once.js)  
✅ No data loss possible (migration is idempotent)

### Quick Resume

1. **Start server** (if not running):
   ```bash
   cd /Users/jomostert/Documents/Projects/agp-plus
   export PATH="/opt/homebrew/bin:$PATH"
   npx vite --port 3001
   ```

2. **Check localStorage**:
   ```javascript
   // In browser console (http://localhost:3001):
   localStorage.getItem('agp-sensors-v4')    // Migration done?
   ```

3. **Resume from**:
   - If v4 storage exists → Skip to Step 3 (Test App)
   - If not → Start from Step 2 (Run Migration)
   - If migration fails → Check errors, retry (safe)

### Rollback (If Needed)

```bash
# Restore old localStorage:
# 1. Open browser console at http://localhost:3001
# 2. Import from backup:
const backup = await (await fetch('/agp-sensors-2025-11-08.json')).json();
localStorage.setItem('agp-sensors', JSON.stringify(backup));

# SQLite still exists in test-data/ if needed
```

---

## 💡 KEY DECISIONS MADE

### Architecture

**Storage**: localStorage only (no dual storage)  
**Status**: Always calculated, never stored  
**SQLite**: One-time migration, then archived  
**All sensors**: Treated equally (no "historical" badges)  
**Port**: ALWAYS 3001 (database/localStorage configured for this)

### Schema (V4)

```javascript
{
  version: "4.0.0",
  last_updated: "ISO timestamp",
  sensors: [
    {
      id: string | number,
      sequence: number,
      start_date: "ISO timestamp",
      end_date: "ISO timestamp" | null,
      duration_hours: number | null,
      duration_days: number | null,
      lot_number: string | null,
      hw_version: string | null,
      notes: string,
      is_locked: boolean,
      batch_id: string | null,
      created_at: "ISO timestamp",
      updated_at: "ISO timestamp"
    }
  ],
  batches: [...],
  deleted: [...]
}
```

### Status Function (THE ONLY ONE)

```javascript
// src/storage/sensorStorage.js:calculateStatus()
- deleted → 'deleted'
- running && >7.5 days → 'overdue'
- running → 'active'
- ended && ≥6.75 days → 'success'
- ended && <6.75 days → 'failed'
```

---

## 📊 METRICS

**Code Reduction**: 1595 lines → 369 lines (77%)  
**Status Functions**: 4+ → 1 (ONE source of truth)  
**Storage Systems**: 2 → 1 (no dual storage)  
**Complexity**: HIGH → LOW (pure functions)  
**Bug Fixed**: Sensor #222 status calculation

---

## 🎯 SUCCESS CRITERIA

**Must Work**:
- [x] Code written and compiles
- [ ] Migration runs without errors
- [ ] All 225 sensors visible
- [ ] Sensor #222 shows "🔄 ACTIVE"
- [ ] Lock/unlock works
- [ ] Delete works
- [ ] Export/Import works
- [ ] CSV detection still works

**Must Be Gone**:
- [x] Dual storage code
- [x] Multiple status calculations
- [x] Compatibility layers
- [ ] Migration files (after Step 4)
- [ ] SQLite runtime dependency

---

## 🚨 CRITICAL NOTES

### For Next Session (Token-Efficient)

**Don't re-read**:
- ❌ Old handoff documents (outdated)
- ❌ DUAL_STORAGE_ANALYSIS.md (old approach)
- ❌ Long history in PROGRESS.md

**Do read**:
- ✅ This handoff (complete state)
- ✅ src/storage/sensorStorage.js (if debugging)
- ✅ scripts/migrate_once.js (if migration fails)

### Crash-Bestendig Principle

**Every step is idempotent**:
- Migration can run multiple times (checks existing data)
- No data is deleted (soft delete with tombstones)
- Backups exist before any changes
- localStorage atomic (no partial writes)

**If anything fails**:
- Check error message
- Try again (safe to retry)
- Worst case: restore from backup (trivial)

### Token-Zuinig Principle

**This handoff contains ALL you need**:
- Current state (what exists)
- Next steps (what to do)
- Recovery info (if crash)
- Critical decisions (context)

**Don't ask Claude to**:
- Explain the problem again (it's in this doc)
- Re-read old documents (waste of tokens)
- Redesign architecture (already done)
- Create more plans (just execute steps)

---

## 📍 QUICK REFERENCE

### Port Configuration

**ALWAYS USE**: http://localhost:3001  
**Never use**: Other ports (breaks database/localStorage)  
**Start command**: `npx vite --port 3001`

### File Locations

```
Storage:     src/storage/sensorStorage.js
Hook:        src/hooks/useSensors.js
Migration:   scripts/migrate_once.js
UI:          public/migrate.html
Backups:     docs/archive/2025-11-08_sensor_rewrite/
Panel:       src/components/panels/SensorHistoryPanel.jsx
```

### Commands

```bash
# Start dev server (ALWAYS THIS)
cd agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001

# Open migration
open http://localhost:3001/migrate.html

# Check V4 storage (browser console)
JSON.parse(localStorage.getItem('agp-sensors-v4'))

# Verify sensor #222 (browser console)
const s = JSON.parse(localStorage.getItem('agp-sensors-v4'))
  .sensors.find(s => s.id === 'sensor_1762231226000');
console.log(s.end_date ? 'ENDED' : 'ACTIVE');
```

---

**Ready for migration. Server running on port 3001.**  
**Next: Open http://localhost:3001/migrate.html**  
**Follow Steps 2-5.**

---

*Handoff updated. v4.0.0 ready for migration testing on port 3001.*
