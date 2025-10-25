# 🚀 AGP+ v3.0 FUSION - Quick Reference Card

**Date:** October 25, 2025  
**Branch:** v3.0-dev (8 commits ahead)  
**Status:** Phase 2 ~95% (1 bug to fix)

---

## 📊 CURRENT STATE

**What Works:**
✅ Storage foundation (Phase 1)  
✅ Migration engine (Phase 2)  
✅ 28,387 readings migrated in 0.39s  
✅ Deduplication (72K → 28K)  
✅ Month bucketing (4 buckets)  
✅ v2.x compatibility maintained  

**What's Broken:**
❌ Event detection (timestamp bug)

---

## 🎯 NEXT SESSION START HERE

1. **Read:** `HANDOFF_SESSION_2025-10-25.md` (full context)
2. **Fix:** Event detection bug (15 min)
3. **Test:** `testMigration()` to verify
4. **Then:** Phase 3 (React integration)

---

## 🐛 THE BUG

**Location:** `src/storage/migrations/migrateToV3.js` lines ~260-320

**Problem:**
```javascript
// CSV timestamps are strings
const timestamp = "2025-10-25T14:30:00";
timestamp.toISOString(); // ERROR: not a function
```

**Fix:**
```javascript
// Convert to Date first
const timestamp = new Date("2025-10-25T14:30:00");
timestamp.toISOString(); // Works!
```

**Where to add:**
- `detectSensorChanges()` function
- `detectCartridgeChanges()` function
- Before calling `storeSensorChange()` or `storeCartridgeChange()`

---

## 🧪 TESTING

**Quick Test:**
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
npm run dev
```

**Browser Console:**
```javascript
(async () => {
  await (await import('./src/storage/migrations/testMigration.js')).testMigration();
})();
```

**Expected After Fix:**
```
✅ Migration succeeded
✅ Readings imported: 28,387
✅ Events detected: X sensors, Y cartridges
```

---

## 📂 KEY FILES

**Storage:**
- `src/storage/db.js` - Schema (v3)
- `src/storage/masterDatasetStorage.js` - Month bucketing
- `src/storage/eventStorage.js` - Device events

**Migration:**
- `src/storage/migrations/migrateToV3.js` - Main logic ⚠️ FIX HERE
- `src/storage/migrations/testMigration.js` - Testing

**Docs:**
- `HANDOFF_SESSION_2025-10-25.md` - Full session notes
- `FUSION_CHECKLIST.md` - Phase tracking
- `V3_PROGRESS.md` - Status updates

---

## 🎸 GIT STATUS

```bash
git branch              # v3.0-dev
git status              # Clean
git log --oneline -5    # See recent commits
```

**Recent Commits:**
- f0a7678 - docs: update V3_PROGRESS
- c1e578a - docs: update handoff and progress
- 69f8bb9 - fix: v2.x storage compatibility
- 2e8d1cf - fix: migration record keyPath
- c098bc5 - fix: openDB import + csvData handling

---

## 💡 QUICK WINS

**After bug fix, you can:**
1. ✅ Mark Phase 2 complete
2. ✅ Start Phase 3 (React hooks)
3. ✅ See migration working in UI
4. ✅ Celebrate 🎉

**Total remaining Phase 2 work:** ~15 minutes

---

## 🚨 CRITICAL RULES

1. **Stay on v3.0-dev** - Don't merge to main yet
2. **Test after every change** - Use `testMigration()`
3. **Commit often** - Small focused commits
4. **v2.x must work** - Upload/save still functional

---

## 📞 HELP

**Stuck? Check these:**
- Safari console acting weird? → Use Chrome
- Migration failing? → `resetMigration()` and retry
- Version conflicts? → All files use `src/storage/db.js`
- Lost? → Read `HANDOFF_SESSION_2025-10-25.md`

---

**You got this!** 15 minutes to Phase 2 complete. 🚀