# AGP+ v3.0 - HANDOFF & OPDRACHTEN (TIER 1)

**Datum:** 27 oktober 2025 (Sessie 2)  
**Van:** Vorige sessie (Oct 27 - Sessie 2)  
**Voor:** Nieuwe AI assistant  
**Status:** 🟡 v3.0.0 BUG FIX IN PROGRESS

---

## 🔋 CONTEXT: Waar Staan We?

### Wat Net Gebeurd Is (Oct 27 - Sessie 2)
- ✅ **Server fix:** Duplicate `const dayData` error opgelost
- ✅ **Phase 4 verification:** CSV alert detection getest
- ⚠️ **Bug gevonden:** Sensor/cartridge events worden NIET opgeslagen
- 🔧 **Fix applied:** `parseCSV` → `parseCSVContent` in masterDatasetStorage.js
- ❌ **Fix not tested yet:** Moet nog geverifieerd worden

### Huidige Status per Phase
- **Phase 1** (Storage Schema): ✅ COMPLETE
- **Phase 2** (Migration & Events): ✅ COMPLETE  
- **Phase 3** (UI Integration): ✅ COMPLETE
- **Phase 4** (Direct CSV Upload): ⚠️ 99% DONE - **Bug fix in progress**

### Data Status
- 28,649 glucose readings in master dataset
- 219 sensors uit SQLite database import
- 4 month buckets actief (Juli-Okt 2025)
- Device events: Bug in sensor alert detection

---

## 🎯 OPDRACHTEN: Wat Moet Je Doen?

### Opdracht 1: Test Bug Fix (PRIORITEIT 1) 🔴
**VOOR je aan code begint:**

1. Lees `PROJECT_BRIEFING_V3_0.md` (TIER 3)
   - Scan voor verouderde info sinds Oct 27
   - Check of Phase 4 status klopt
   - Update indien nodig

2. Lees `V3_MASTER_INDEX.md`
   - Verify file structure matcht huidige codebase
   - Check of alle paths kloppen
   - Update indien gewijzigd

3. Update `START_HERE.md` (dit bestand)
   - Nieuwe context toevoegen
   - Status updaten
   - Datum aanpassen

**Deliverable:** Geüpdatete docs of confirmatie dat alles actueel is

---

### Opdracht 2: Phase 4 Verification (30-60 min) 🔍
**Hoofdopdracht:**

**Doel:** Verifieer dat CSV alert detection werkt voor sensor en cartridge events

**Wat te testen:**

1. **Sensor Alert Detection**
   - Upload CSV met "SENSOR CONNECTED" alerts
   - Verify events worden gedetecteerd uit CSV
   - Check localStorage key: `agp-device-events`
   - Confirm rode lijnen verschijnen in day profiles

2. **Cartridge Change Detection**
   - Upload CSV met "Rewind" alerts
   - Verify cartridge events worden gedetecteerd
   - Check event storage
   - Confirm visualization werkt

3. **3-Tier Detection Verificatie**
   - Database (high confidence) → werkt (219 sensors)
   - CSV alerts (medium confidence) → **VERIFY THIS**
   - Gap analysis (low confidence) → werkt
   - Priority order correct?

**Waar te kijken:**
- `/src/core/parsers.js` - CSV alert parsing
- `/src/core/event-detection-engine.js` - Detection logic
- `/src/hooks/useSensorDatabase.js` - 3-tier integration

**Deliverable:** 
- Test report met bevindingen
- Bugs/issues gedocumenteerd
- Update `V3_PHASE_4_STATUS_CHECK.md` met resultaten

---

### Opdracht 3: Production Checklist (indien Phase 4 OK)
**Als verification succesvol:**

1. Run complete testing checklist (zie PROJECT_BRIEFING_V3_0.md)
2. Fix eventuele bugs
3. Production build test
4. Browser compatibility check
5. Deployment prep (merge v3.0-dev → main)

---

## ⚙️ CONSTRAINTS & TOOLING

### Kritieke Constraints (VERPLICHT)

**1. Server Poort**
```bash
# ALTIJD poort 3001 gebruiken (voor Chrome connector)
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
lsof -ti:3001 | xargs kill -9  # Kill andere processen
npx vite --port 3001

# OF gebruik script:
./start.sh
```

**Browser:** http://localhost:3001

**2. Desktop Commander (VERPLICHT)**
```bash
# ALLE file operations via Desktop Commander
# Standard bash_tool werkt NIET op /Users/jomostert/...

# Files lezen:
DC: read_file path="/Users/jomostert/Documents/Projects/agp-plus/package.json"

# Zoeken:
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus/src" 
                pattern="uploadCSVToV3" searchType="content"

# Editen:
DC: edit_block file_path="..." old_string="..." new_string="..."

# Git (met timeout!):
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && 
                   git push origin v3.0-dev" timeout_ms=10000
```

**3. Project Pad**
```
/Users/jomostert/Documents/Projects/agp-plus/
```
Gebruik ALTIJD absolute paths, nooit relatief.

**4. Git Workflow**
- Branch: `v3.0-dev` (active development)
- Commit messages: Descriptive, met rationale
- Push: ALTIJD met `timeout_ms=10000`

---

## 📁 PROJECT STRUCTURE

```
/Users/jomostert/Documents/Projects/agp-plus/
├── package.json                    # v3.0.0
├── index.html                      # <title>AGP+ v3.0</title>
├── CHANGELOG.md                    # [3.0.0] release
│
├── src/
│   ├── components/
│   │   ├── AGPGenerator.jsx       # Main app, line 442: handleCSVLoad()
│   │   ├── DayProfileCard.jsx     # Sensor change markers
│   │   └── SensorHistoryModal.jsx # 219 sensors display
│   │
│   ├── hooks/
│   │   ├── useMasterDataset.js    # V3 IndexedDB orchestration
│   │   ├── useSensorDatabase.js   # SQLite sensor import
│   │   └── useCSVData.js          # V2 fallback
│   │
│   ├── storage/
│   │   ├── masterDatasetStorage.js # Core V3 storage
│   │   │   - uploadCSVToV3()      # ✅ Direct CSV upload
│   │   │   - appendReadingsToMaster()
│   │   │   - rebuildSortedCache()
│   │   └── export.js              # JSON/HTML exports
│   │
│   ├── core/
│   │   ├── parsers.js             # ⚠️ CSV parsing - CHECK THIS
│   │   ├── event-detection-engine.js # ⚠️ Event detection - CHECK THIS
│   │   └── day-profile-engine.js  # Sensor visualization
│   │
│   └── utils/
│       ├── debug.js               # Conditional logging
│       ├── constants.js           # Clinical thresholds
│       └── formatters.js          # Date/glucose/percent
│
└── docs/
    ├── START_HERE.md              # ← YOU ARE HERE (TIER 1)
    ├── PROJECT_BRIEFING_V3_0.md   # TIER 3: Complete reference
    ├── V3_MASTER_INDEX.md         # Quick file index
    ├── V3_PHASE_4_STATUS_CHECK.md # Current status detail
    └── V3_ARCHITECTURE.md         # System design
```

---

## 🐛 KNOWN ISSUES & BUGS

### Geen Kritieke Bugs
Alle core features werken. Phase 4 features zijn geïmplementeerd maar niet geverifieerd.

### Constraints (Not Bugs)
- **Port 3001 soms blocked** → `lsof -ti:3001 | xargs kill -9`
- **npm not found** → Export PATH first (Homebrew)
- **Git push hangs** → Use timeout_ms=10000
- **Hybrid v2/v3 mode active** → Intentional voor backwards compat
- **Migration banner shows** → Correct behavior bij v2→v3 transition

### Niet Geïmplementeerd (Optional)
- Constants niet overal geïntegreerd in engines
- Formatters niet overal gebruikt
- Enkele console.logs nog aanwezig

---

## 📚 REFERENCE DOCS (Lees Als Nodig)

### TIER 2: Status & Technical
- `V3_PHASE_4_STATUS_CHECK.md` - Detailed Phase 4 status
- `V3_ARCHITECTURE.md` - System design, IndexedDB schema
- `V3_IMPLEMENTATION_GUIDE.md` - Phase-by-phase roadmap
- `GIT_WORKFLOW.md` - Branch strategy

### TIER 3: Complete Reference
- `PROJECT_BRIEFING_V3_0.md` - Full handoff (339 lines)
- `V3_MASTER_INDEX.md` - File structure index
- `metric_definitions.md` - Clinical formulas (ADA/ATTD)
- `minimed_780g_ref.md` - Device specs

---

## ⚡ QUICK COMMANDS

### Server Start/Stop
```bash
# Kill port 3001
lsof -ti:3001 | xargs kill -9

# Start server
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### Desktop Commander Examples
```bash
# Read file
DC: read_file path="/Users/jomostert/Documents/Projects/agp-plus/src/core/parsers.js"

# Search for CSV alert parsing
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus/src" 
                pattern="SENSOR CONNECTED|Rewind" searchType="content"

# Check git status
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && git status"
```

---

## ✅ SUCCESS CRITERIA

**Sessie Succesvol Als:**
- [ ] Documentation audit compleet (docs up-to-date)
- [ ] Phase 4 verification compleet (sensor/cartridge detection working)
- [ ] Test results gedocumenteerd
- [ ] Bugs (if any) gefixed of gedocumenteerd
- [ ] V3_PHASE_4_STATUS_CHECK.md updated
- [ ] THIS file (START_HERE.md) updated met nieuwe context

**Project Production Ready Als:**
- [ ] Phase 4 verification passed
- [ ] Testing checklist passed
- [ ] No critical bugs
- [ ] Merged to main + tagged v3.0.0

---

## 💡 TIPS & REMINDERS

**Voor AI Assistants:**
1. **Start met opdracht 1** (documentation audit) - ALTIJD eerst
2. **Gebruik Desktop Commander** - standard bash_tool werkt niet
3. **Check V3_PHASE_4_STATUS_CHECK.md** voor details
4. **Update THIS file** aan einde sessie met nieuwe context
5. **Port 3001** is VERPLICHT (Chrome connector)
6. **Absolute paths** ALTIJD gebruiken

**Voor Jo:**
- Start nieuwe chat → Geef START_HERE.md
- Chat kan direct aan de slag met duidelijke opdrachten
- Documentatie blijft up-to-date door opdracht 1
- Phase 4 verification is hoofdfocus

---

**Current Status:** 95% Production Ready  
**Branch:** v3.0-dev  
**Last Commit:** 2364a7f  
**Deployment Target:** jenana.eu (pending Phase 4 verification)

**Next Session Update This File With:**
- New context (wat is er gebeurd)
- Updated status (Phase 4 verified?)
- New opdrachten (testing? deployment?)
- Updated datum
