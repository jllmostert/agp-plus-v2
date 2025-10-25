# AGP+ v3.0 FUSION - Quick Handoff

**Codenaam:** 🔮 FUSION (Full Unified Storage Integration)  
**Branch:** v3.0-dev  
**Status:** Phase 1 ✅ | Phase 2 Starting

---

## 🎯 CONTEXT (30 seconden)

v3.0 transformeert AGP+ van per-upload naar incremental master dataset:
- Month-bucketed storage (36 buckets voor 3 jaar)
- Persistent device events (sensor/cartridge changes)
- Lazy-evaluated cache (rebuild alleen als dirty)
- v2.x rollback safety (uploads store blijft intact)

**CRITICAL:** Main branch mag NIET kapot. v3.0 begint desnoods leeg.

---

## 📂 ESSENTIËLE DOCUMENTEN

**Start hier:**
1. `FUSION_CHECKLIST.md` - Fase-per-fase taken met ✅
2. `docs/PROJECT_BRIEFING_V3_0_FUSION.md` - Volledige technische briefing
3. `V3_PROGRESS.md` - Huidige status tracker

**Bij problemen:**
- `docs/V3_ARCHITECTURE.md` - Ontwerpbeslissingen
- `docs/GIT_WORKFLOW_V3.md` - Git branch tutorial

---

## ✅ KLAAR (Phase 1 & 2)

**Phase 1 - Storage Foundation (3 files, ~700 lines):**
- `src/storage/db.js` - IndexedDB v3 schema (6 stores)
- `src/storage/masterDatasetStorage.js` - Month-bucketing engine
- `src/storage/eventStorage.js` - Device event persistence

**Phase 2 - Migration Script (~95% complete):**
- `src/storage/migrations/migrateToV3.js` - Full migration logic
- `src/storage/migrations/testMigration.js` - Testing harness
- ✅ Fresh install test passed
- ✅ Real data test passed (28,387 readings, 0.39s)
- ✅ Deduplication working (72,707 → 28,387)
- ⚠️ Event detection bug (timestamp conversion needed)

**Git:**
- v3.0-dev branch active
- 6 commits ahead of main
- All v2.x compatibility maintained

---

## 🚀 VOLGENDE STAP (Fix Event Bug → Phase 3)

**Create:** Fix event detection bug in `migrateToV3.js`

**Issue:** `timestamp.toISOString is not a function`
- CSV timestamps are strings, not Date objects
- Need conversion before calling event storage

**Fix Location:** Lines ~260-320 in `migrateToV3.js`
- `detectSensorChanges()` function
- `detectCartridgeChanges()` function
- Add: `timestamp = new Date(timestamp)` before storing events

**Then:** Complete Phase 2 testing, proceed to Phase 3 (React Integration)

---

## 🛠️ PROJECT SETUP

**Location:** `/Users/jomostert/Documents/Projects/agp-plus/`

**Branch check:**
```bash
git branch  # Should show * v3.0-dev
```

**Always use Desktop Commander:**
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/[path]
DC: edit_block file_path="..." old_string="..." new_string="..."
```

---

## 🎨 ARCHITECTUUR (Snel)

```
CSV Upload
    ↓
appendReadingsToMaster()
    ↓
Group by month → Append to buckets → Deduplicate
    ↓
invalidateCache()
    ↓
User opent AGP
    ↓
loadOrRebuildCache() (lazy eval)
    ↓
Existing engines (metrics-engine.js)
    ↓
Render UI
```

**Deduplicatie:** Keep first by timestamp, log conflicts >1 mg/dL

---

## 📊 PROGRESS

```
Phase 1: Storage Foundation     ████████████████████ 100% ✅
Phase 2: Migration Script        ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 3: React Integration       ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: Device Events           ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: Testing & Polish        ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: Documentation           ░░░░░░░░░░░░░░░░░░░░   0%

Overall: 16.7%
```

---

## 🚨 KRITIEKE REGELS

1. **Don't break main** - v2.x blijft stable
2. **Keep v2.x stores** - uploads/settings NOOIT deleten
3. **Test incrementeel** - Na elke fase testen
4. **Components → Hooks → Engines** - Architectuur behouden

---

## 💡 QUICK START NIEUWE CHAT

```bash
# 1. Check branch
git checkout v3.0-dev
git pull origin v3.0-dev

# 2. Lees checklist
DC: read_file /Users/.../agp-plus/FUSION_CHECKLIST.md

# 3. Lees briefing (alleen als nodig)
DC: read_file /Users/.../agp-plus/docs/PROJECT_BRIEFING_V3_0_FUSION.md

# 4. Start coding
```

---

**Klaar om te beginnen!** Check FUSION_CHECKLIST.md voor volgende taken.
