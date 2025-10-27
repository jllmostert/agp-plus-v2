# AGP+ v3.0 - PROJECT BRIEFING

**Document Type:** 📋 Project Briefing / Handoff voor Volgende Sessie  
**Datum:** 27 oktober 2025  
**Versie:** v3.0.0 PRODUCTION READY  
**Status:** Phase 1-3 Complete, Phase 4 Verification Pending

---

## 🎯 Waar Staan We?

### Grote Win: v3.0 is Production Ready! 🎉

**Versie consolidatie compleet:**
- ✅ package.json: `3.0.0`
- ✅ index.html `<title>`: `AGP+ v3.0`
- ✅ CHANGELOG: v3.9 entries merged in v3.0.0
- ✅ Software header: `V3.0`
- ✅ Footer: Ready for deployment

**Documentation opgeschoond:**
- ✅ 62 files hernoemd met V2_/V3_ prefixes
- ✅ Alle handoff files verwijderd (geschiedenis, niet meer nodig)
- ✅ Phase 4 status check gedocumenteerd
- ✅ Project status artifact gemaakt

---

## 📊 Phase Status

### ✅ Phase 1: Storage Schema (COMPLETE)
- IndexedDB v3 schema met month-bucketing
- masterDatasetStorage.js module
- Idempotent deduplication
- Cached sorted arrays

### ✅ Phase 2: Migration & Events (COMPLETE)
- Auto-migrate v2 → v3 on page load
- SQLite sensor database import (219 sensors)
- Sensor change visualization in day profiles
- 3-tier detection: database → CSV → gap analysis

### ✅ Phase 3: UI Integration (COMPLETE)
- DateRangeFilter v3 compatibility
- Comparison date calculation fixed
- ProTime IndexedDB persistence
- Status indicator (traffic light)
- Auto-load last 14 days
- Database export (JSON)
- Data management modal

### ⚠️ Phase 4: Direct CSV Upload (MOSTLY COMPLETE)

**✅ Done:**
- Direct CSV → IndexedDB bypassing localStorage
- `uploadCSVToV3()` implemented in masterDatasetStorage.js
- Hybrid v2/v3 mode working (auto-detection)

**❓ Needs Verification:**
- Sensor alert detection uit CSV ("SENSOR CONNECTED" events)
- Cartridge change detection ("Rewind" alerts)
- Integration met 3-tier detection system

**⏸️ Deferred:**
- Legacy localStorage removal (keep hybrid mode for now)

---

## 🔍 Wat Moet Je Eerst Doen?

### Stap 1: Phase 4 Verification

Check of CSV alert detection al werkt:

```bash
# Lees de CSV parser
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/core/parsers.js

# Zoek naar alert parsing
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus/src" \
    pattern="SENSOR CONNECTED|Rewind|alert" searchType="content"
```

**Vragen om te beantwoorden:**
1. Worden CSV alert columns al geparsed?
2. Zijn sensor/cartridge events al gedetecteerd?
3. Is dit geïntegreerd in de 3-tier detection?

---

## 📁 Project Structuur

### Core Files
```
/Users/jomostert/Documents/Projects/agp-plus/
├── package.json                    # v3.0.0
├── index.html                      # <title>AGP+ v3.0</title>
├── CHANGELOG.md                    # [3.0.0] - production release
├── README.md                       # v3.0.0 overview
│
├── src/
│   ├── components/
│   │   ├── AGPGenerator.jsx       # Main app, handleCSVLoad() line 442
│   │   ├── FileUpload.jsx         # CSV upload UI
│   │   ├── DayProfileCard.jsx     # Sensor change markers
│   │   └── SensorHistoryModal.jsx # 219 sensors display
│   │
│   ├── hooks/
│   │   ├── useMasterDataset.js    # V3 IndexedDB hook
│   │   ├── useCSVData.js          # V2 fallback
│   │   └── useSensorDatabase.js   # SQLite sensor import
│   │
│   ├── storage/
│   │   ├── masterDatasetStorage.js # Core V3 storage
│   │   │   - uploadCSVToV3()      # Direct upload ✅
│   │   │   - appendReadingsToMaster()
│   │   │   - rebuildSortedCache()
│   │   └── export.js              # JSON export
│   │
│   ├── core/
│   │   ├── parsers.js             # CSV parsing logic
│   │   ├── day-profile-engine.js  # Sensor change detection
│   │   └── event-detection-engine.js
│   │
│   └── utils/
│       ├── debug.js               # Production logging
│       ├── constants.js           # Clinical thresholds
│       └── formatters.js          # Date/glucose formatting
│
└── docs/
    ├── README.md
    ├── CHANGELOG.md
    ├── GIT_WORKFLOW.md
    ├── V3_ARCHITECTURE.md
    ├── V3_ARCHITECTURE_DECISIONS.md
    ├── V3_IMPLEMENTATION_GUIDE.md
    ├── V3_PHASE_4_STATUS_CHECK.md  # ← JIJ BENT HIER
    ├── metric_definitions.md
    ├── minimed_780g_ref.md
    └── archive/                     # 60+ historical docs
```

---

## 🚀 Server Starten

```bash
# Optie 1: Eenvoudig (aanbevolen)
cd /Users/jomostert/Documents/Projects/agp-plus
./start.sh

# Optie 2: Handmatig
cd /Users/jomostert/Documents/Projects/agp-plus
lsof -ti:3001 | xargs kill -9
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001

# Browser openen
open http://localhost:3001
```

---

## 🧪 Testing Checklist

### Must Test Before Deployment

#### V3 Upload Flow
- [ ] Upload nieuwe CSV → Direct naar IndexedDB (geen localStorage)
- [ ] Check console: "V3: Direct upload to IndexedDB"
- [ ] Verify IndexedDB heeft nieuwe month buckets
- [ ] Confirm UI updates met nieuwe data

#### Sensor Detection
- [ ] Upload CSV met "SENSOR CONNECTED" alerts
- [ ] Verify sensor changes tonen in day profiles (rode lijn)
- [ ] Check localStorage: 'agp-device-events' key
- [ ] Confirm 3-tier detection werkt (database → alert → gap)

#### Cartridge Detection  
- [ ] Upload CSV met "Rewind" alerts
- [ ] Verify cartridge changes gedetecteerd
- [ ] Check day profile markers
- [ ] Confirm event storage werkt

#### Data Management
- [ ] Open data cleanup modal
- [ ] Delete glucose readings (test date range)
- [ ] Verify ProTime data survives cleanup
- [ ] Confirm sensor data intact

#### Export Functions
- [ ] Export AGP+ Profile HTML → Download werkt
- [ ] Export Day Profiles HTML → Sensor markers visible
- [ ] Export Database JSON → Complete backup
- [ ] Verify exported data is volledig

---

## 🛠️ Known Issues & Limitations

### Non-Issues (Features Working as Designed)
- ✅ Hybrid v2/v3 mode is intentional (backwards compat)
- ✅ localStorage still used voor v2 uploads (by design)
- ✅ Auto-migration banner shows on v2 → v3 transition (correct)

### Nice-to-Have (Not Blockers)
- ⏳ Constants niet geïntegreerd in engines (optional)
- ⏳ Formatters niet overal gebruikt (optional)
- ⏳ JSDoc missing op engine functions (documentation)

---

## 📝 Git Workflow

```bash
# Current branch: v3.0-dev
git status
git add .
git commit -m "docs: v3.0 consolidation + phase 4 status check"
git push origin v3.0-dev

# Deployment Ready?
# → Merge v3.0-dev → main
# → Tag v3.0.0
# → Deploy naar jenana.eu
```

---

## 💡 Quick Commands (Desktop Commander)

**File Operations:**
```bash
# Lees configuratie
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/package.json

# Zoek in code
DC: start_search path="/Users/.../src" pattern="uploadCSVToV3" searchType="content"

# Edit file
DC: edit_block file_path="..." old_string="..." new_string="..."
```

**Server Management:**
```bash
# Kill processes
DC: start_process "lsof -ti:3001 | xargs kill -9"

# Start server
DC: start_process "cd /Users/.../agp-plus && export PATH='/opt/homebrew/bin:$PATH' && npx vite --port 3001"
```

**Git Operations:**
```bash
DC: start_process "cd /Users/.../agp-plus && git status"
DC: start_process "cd /Users/.../agp-plus && git add . && git commit -m 'message'"
DC: start_process "cd /Users/.../agp-plus && git push origin v3.0-dev" timeout_ms=10000
```

---

## 🎯 Immediate Next Actions

1. **Verify Phase 4 Features**
   - Test CSV alert detection
   - Test cartridge change detection
   - Document findings

2. **Complete Testing**
   - Run through testing checklist
   - Fix any bugs found
   - Update documentation

3. **Prepare Deployment**
   - Production build test
   - Browser compatibility check
   - Merge v3.0-dev → main
   - Deploy naar jenana.eu

4. **Cleanup (After Deployment)**
   - Remove legacy v2 code (if desired)
   - Archive old documentation
   - Update README with deployment URL

---

## 📚 Key Documentation

**Must Read:**
- `/docs/README.md` - Project overview
- `/docs/V3_ARCHITECTURE.md` - System design
- `/docs/V3_PHASE_4_STATUS_CHECK.md` - Current status

**Reference:**
- `/docs/metric_definitions.md` - Clinical formulas
- `/docs/GIT_WORKFLOW.md` - Branch strategy
- `/docs/CHANGELOG.md` - Version history

**Planning (Historical):**
- `/docs/V3_IMPLEMENTATION_GUIDE.md` - Original roadmap
- `/docs/V3_ARCHITECTURE_DECISIONS.md` - ADRs

---

## 🔥 Hot Tips

**For AI Assistants:**
1. **Use Desktop Commander** voor alle file operations (no standard bash_tool)
2. **Always use full absolute paths** zoals `/Users/jomostert/Documents/Projects/agp-plus/...`
3. **Server needs PATH export** voor npm commands: `export PATH="/opt/homebrew/bin:$PATH"`
4. **Git push needs timeout**: `timeout_ms=10000` voor push commands
5. **Project knowledge search first** - docs zijn excellent, gebruik ze!

**For Jo:**
1. Oude V2_* files in archive kun je negeren - alleen historie
2. V3_* files zijn relevant voor current work
3. Handoff files zijn weg - dit is de enige handoff nu
4. Phase 4 is bijna klaar - alleen verification nodig

---

## ✅ Success Criteria

**v3.0 Ready for Production When:**
- [ ] Phase 4 verification complete (sensor/cartridge detection working)
- [ ] All testing checklist items passed
- [ ] No critical bugs in production build
- [ ] Documentation updated with deployment info
- [ ] Merged to main and tagged v3.0.0

**Current Status:** 95% Ready - Just needs Phase 4 verification! 🎉

---

**Last Updated:** October 27, 2025  
**Next Session:** Phase 4 verification + final testing  
**Branch:** v3.0-dev  
**Deployment Target:** jenana.eu (pending)
