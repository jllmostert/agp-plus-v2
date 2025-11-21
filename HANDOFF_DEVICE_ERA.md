# AGP+ Session Handoff - Device Era Tracking Feature

**Date**: 2025-11-21  
**Branch**: `feature/device-era-tracking`  
**Status**: 🚧 In Progress - NOT MERGED TO MAIN

---

## 🚨 CRITICAL: BRANCH INFORMATION

```
MAIN BRANCH     → Production ready, deployed
                   Commit: 0a87c85 (multi-pump CSV support)
                   
FEATURE BRANCH  → feature/device-era-tracking
                   Status: In development
                   DO NOT MERGE until fully tested
```

**To switch branches:**
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git checkout main              # Production
git checkout feature/device-era-tracking  # This feature
```

---

## 🖥️ DESKTOP COMMANDER SETUP

**Project Path**: `/Users/jomostert/Documents/Projects/agp-plus`

**Start Server** (ALWAYS do this first):
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

**Kill Zombie Processes** (if port in use):
```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

Or use Desktop Commander: `list_sessions` → `force_terminate`

---

## 🎯 FEATURE: Device Era Tracking

### Goal
Track pump/transmitter combinations to analyze sensor performance per hardware era.

### Device Timeline (Jo Mostert)

| Era | Period | Pump SN | Pump FW | Transmitter SN |
|-----|--------|---------|---------|----------------|
| 1 | Mar 2022 - Mar 2023 | NG2576004H | 3.13.9 | ? |
| 2 | Mar 2023 - Jul 2025 | NG2576004H | 3.13.9 | GT8917250N |
| 3 | Jul 2025 - Oct 2025 | NG4114235H | 8.13.2 | GT8917250N |
| 4 | Oct 2025 - Nov 2025 | NG4114235H | 8.13.2 | GT9833065M |
| 5 | Nov 2025 - present | NG4231472H | 22.13.3 | GT9833065M |

### Implementation Plan

**Step 1: Era Configuration** (~30 min)
- [ ] Create `src/core/deviceEras.js` with era definitions
- [ ] Export DEVICE_ERAS array with dates + device info

**Step 2: Sensor Schema Extension** (~30 min)
- [ ] Add fields to sensor schema: `pump_serial`, `transmitter_serial`, `era_id`
- [ ] Update `addSensor()` to auto-assign based on start_date

**Step 3: Migration Script** (~45 min)
- [ ] Create migration function to tag existing sensors
- [ ] Add to storage migrations or manual trigger
- [ ] Test with backup first!

**Step 4: Statistics by Era** (~1 hr)
- [ ] Update `SensorHistoryPanel.jsx` stats calculation
- [ ] Group by era/pump/transmitter
- [ ] Display: avg duration, %≥6d, %≥6.8d per era

**Step 5: UI for Era Management** (~1 hr) - Optional
- [ ] View/edit device eras
- [ ] Manual era assignment for edge cases

### Files to Modify

```
src/
├── core/
│   └── deviceEras.js          # NEW: Era definitions
├── storage/
│   ├── sensorStorage.js       # Schema + auto-assign
│   └── migrations/
│       └── addDeviceEras.js   # NEW: Migration script
└── components/panels/
    └── SensorHistoryPanel.jsx # Stats by era
```

---

## 📋 PROGRESS TRACKING

Update `PROGRESS.md` after each work session!

If adding temporary patches → Document in `TECH_DEBT.md`

### Current Progress
- [x] Plan approved
- [x] Branch created
- [ ] Step 1: Era configuration
- [ ] Step 2: Schema extension
- [ ] Step 3: Migration
- [ ] Step 4: Statistics
- [ ] Step 5: UI (optional)
- [ ] Testing complete
- [ ] Merge to main

---

## ⚠️ BEFORE MERGING TO MAIN

1. **Test thoroughly** on feature branch
2. **Export JSON backup** before testing migration
3. **Verify statistics** match expected values
4. **Check existing features** still work (regression)
5. **Update HANDOFF.md** with new feature docs
6. **Squash or clean commits** if needed

**Merge command** (when ready):
```bash
git checkout main
git merge feature/device-era-tracking
git push origin main
```

---

## 🔗 RELATED DOCUMENTATION

| Document | Purpose |
|----------|---------|
| `PROGRESS.md` | Session-by-session updates |
| `TECH_DEBT.md` | Patches to revisit later |
| `docs/handoffs/HANDOFF.md` | Main project handoff |
| `docs/project/PROJECT_BRIEFING.md` | Architecture overview |

---

**Last Updated**: 2025-11-21 20:10
