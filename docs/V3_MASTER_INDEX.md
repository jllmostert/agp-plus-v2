# AGP+ MASTER INDEX V3.0

**Quick Reference Guide**  
**Version:** 3.0.0 - FUSION (Full Unified Storage Integration)  
**Last Updated:** October 27, 2025

---

## 🚀 QUICK START

### First Time Setup

```bash
# Navigate to project
cd /Users/jomostert/Documents/Projects/agp-plus

# Set PATH for Homebrew
export PATH="/opt/homebrew/bin:$PATH"

# Start dev server
npx vite --port 3001

# Open browser
http://localhost:3001
```

### Starting a New Development Session

**Always do this first:**

1. Read latest handoff from `/docs/handoffs/` (most recent first)
2. Read `/docs/PROJECT_BRIEFING_V3_0.md` (complete architecture)
3. Read `/docs/V3_ARCHITECTURE.md` (technical details)
4. Read this file (quick reference)

**Important:** Use **Desktop Commander** for ALL file operations. Standard bash won't work - project is on local macOS, not in container.

---

## 📂 PROJECT STRUCTURE

```
/Users/jomostert/Documents/Projects/agp-plus/
├── README.md                    # Project overview
├── CHANGELOG.md                 # Version history
├── package.json                 # v3.8.0
├── vite.config.js              # Build config
│
├── src/
│   ├── components/              # React UI
│   │   ├── AGPGenerator.jsx             # Main orchestrator
│   │   ├── DayProfileCard.jsx           # Single day visualization
│   │   ├── DayProfilesModal.jsx         # 7-day modal view
│   │   ├── SensorHistoryModal.jsx       # Sensor database viewer
│   │   ├── AGPChart.jsx                 # AGP percentile curves
│   │   ├── MetricsDisplay.jsx           # TIR/TAR/TBR cards
│   │   └── ComparisonView.jsx           # Period comparisons
│   │
│   ├── hooks/                   # React state/orchestration
│   │   ├── useSensorDatabase.js         # SQLite sensor data
│   │   ├── useV3Storage.js              # IndexedDB glucose data
│   │   ├── useWorkdayData.js            # ProTime integration
│   │   └── useComparisonData.js         # Period analysis
│   │
│   ├── core/                    # Pure calculation engines
│   │   ├── agp-engine.js                # AGP metrics (TIR/TAR/TBR)
│   │   ├── comparison-engine.js         # Period-over-period
│   │   ├── day-profile-engine.js        # Individual day analysis
│   │   └── sensor-detection.js          # Event detection
│   │
│   ├── storage/                 # Data persistence
│   │   ├── indexeddb.js                 # V3 glucose storage
│   │   ├── sensorStorage.js             # Sensor database
│   │   ├── workdayStorage.js            # ProTime data
│   │   └── export.js                    # Database export
│   │
│   └── utils/                   # Helpers
│       ├── csvParser.js                 # CareLink CSV parsing
│       ├── dateUtils.js                 # Date calculations
│       └── validation.js                # Data validation
│
├── public/
│   └── sensor_database.db      # SQLite sensor history (219 sensors)
│
└── docs/
    ├── MASTER_INDEX_V3_8.md            # This file
    ├── PROJECT_BRIEFING_V3_8.md        # Complete architecture
    ├── V3_ARCHITECTURE.md              # Technical design
    ├── GIT_WORKFLOW.md                 # Branch strategy
    ├── metric_definitions.md           # Clinical formulas
    ├── minimed_780g_ref.md            # Device specs
    │
    ├── handoffs/                # Active session handoffs
    │   ├── HANDOFF_V3_8_3_SENSOR_STATUS_COLORS_OCT26.md
    │   ├── HANDOFF_V3_8_0_NEXT_PHASE_OCT26.md
    │   └── [other recent handoffs]
    │
    └── archive/                 # Historical documents
        └── pre-v3.8/            # Obsolete v2.x and early v3.x docs
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### Three-Layer Model (Strict Separation)

```
┌─────────────────────────────────────────────┐
│  COMPONENTS (React UI)                       │
│  - Presentation only                         │
│  - No business logic                         │
└─────────────────┬───────────────────────────┘
                  │ calls hooks
┌─────────────────▼───────────────────────────┐
│  HOOKS (React Orchestration)                 │
│  - State management                          │
│  - Data fetching                             │
│  - Hook composition                          │
└─────────────────┬───────────────────────────┘
                  │ calls engines
┌─────────────────▼───────────────────────────┐
│  ENGINES (Pure Functions)                    │
│  - Calculation logic                         │
│  - No React dependencies                     │
│  - Testable, reusable                        │
└──────────────────────────────────────────────┘
```

**Golden Rule:** Business logic stays in engines. Hooks orchestrate. Components present.

---

## 🎨 DESIGN SYSTEM - Paper/Ink Theme (Brutalist)

### Core Palette
- **Paper**: `#e3e0dc` - Warm off-white background
- **Ink**: `#1a1816` - Near-black text
- **Grid**: `#c5c0b8` - Subtle warm gray for borders

### Clinical Accents (3-Tier System)
- **Green**: `#2d5016` - Success/TIR (Time in Range)
- **Orange**: `#a0522d` - Warning/TAR (Time Above Range) / SHORT sensors
- **Red**: `#8b1a1a` - Critical/TBR (Time Below Range) / FAIL sensors

### Typography
- **Headers**: `'Courier New', monospace` (bold, uppercase)
- **Body**: `'Courier New', monospace` (regular)
- **Data**: Monospace for alignment
### Design Philosophy
- **Maximum contrast** - Medical professionals need rapid scanning
- **Print-compatible** - Black/white reproduction using patterns, not color
- **3px borders** - Brutalist thickness for visual hierarchy
- **No gradients** - Flat colors, sharp edges
- **Semantic spacing** - 8px grid system

---

## 📊 CORE FEATURES

### Data Import & Storage (v3.0 FUSION)
- ✅ **Multi-year glucose storage**: IndexedDB month-bucketed system
- ✅ **Incremental CSV uploads**: Merge automatically, no overwrites
- ✅ **ProTime integration**: PDF/JSON workday data (346 workdays tracked)
- ✅ **Sensor database**: SQLite import (219 sensors, 2022-2025)
- ✅ **Patient info**: Auto-extraction from CSV + manual entry
- ✅ **Database export**: Complete JSON export of master dataset

### Clinical Analysis (ADA/ATTD 2019)
- ✅ **8 Core Metrics**: TIR, TAR, TBR, CV, GMI, Mean, MAGE, MODD
- ✅ **AGP Visualization**: Percentile bands (10/25/50/75/90)
- ✅ **Event Detection**: Hypo L1/L2, hyper alerts
- ✅ **Period Comparison**: Auto-compare 14/30/90-day periods
- ✅ **Day/Night Split**: 06:00-22:00 vs 22:00-06:00
- ✅ **Workday Analysis**: Compare workdays vs rest days

### Day Profiles (Individual Analysis)
- ✅ **Last 7 Days View**: Individual cards per day
- ✅ **24h Glucose Curves**: 5-minute resolution
- ✅ **Achievement Badges**: Perfect Day, Zen Master, etc.
- ✅ **Sensor Change Markers**: Database-driven detection
- ✅ **Event Annotations**: Hypo/hyper events marked

### Sensor History
- ✅ **SQLite Database**: 219 sensors tracked
- ✅ **3-Tier Status Colors**:
  - ✓ OK (Green): 6.75+ days
  - ⚠ SHORT (Orange): 6.0-6.75 days
  - ✗ FAIL (Red): <6.0 days
- ✅ **Metadata**: Lot numbers, hardware versions, duration
- ✅ **Sortable table**: All columns interactive

---

## 🔧 DEVELOPMENT WORKFLOW

### Server Management

```bash
# Check what's running
lsof -i :3001

# Kill all vite servers
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
lsof -ti:3003 | xargs kill -9

# Start server (ALWAYS use this format)
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### Git Workflow

**Branch:** `v3.0-dev` (NOT merged to main yet)

```bash
# Status check
git status

# Commit
git add .
git commit -m "feat: descriptive message"

# Push (use Desktop Commander)
# NEVER chain git commands - run sequentially
```

### File Operations

**CRITICAL:** Always use **Desktop Commander** for file operations.

```bash
# ❌ DON'T USE:
bash_tool with cd/cat/grep

# ✅ USE INSTEAD:
Desktop Commander:read_file
Desktop Commander:write_file
Desktop Commander:edit_block
Desktop Commander:list_directory
Desktop Commander:start_search
```

**Paths:** Always use full absolute paths:
```
/Users/jomostert/Documents/Projects/agp-plus/[file]
```

---

## 🧪 TESTING CHECKLIST

### After Making Changes:

1. **Start server**: `localhost:3001`
2. **Upload test CSV**: Use sample CareLink export
3. **Check console**: No errors in browser DevTools
4. **Test features**:
   - Import section (CSV + ProTime)
   - Day profiles modal
   - Sensor history modal
   - Comparison view
   - Database export
5. **Visual check**: Paper/ink theme consistent
6. **Print test**: If layout changes, test print view

### Browser Console Warnings

- Look for "Invalid Date" errors
- Check for missing data warnings
- Verify storage operations complete

---

## 📖 KEY DOCUMENTS

### Must-Read (Tier 1)
1. **This file** - Quick reference
2. **PROJECT_BRIEFING_V3_8.md** - Complete architecture
3. **V3_ARCHITECTURE.md** - Technical design decisions

### Reference (Tier 2)
- **metric_definitions.md** - Clinical formula specifications
- **minimed_780g_ref.md** - Device specifications
- **GIT_WORKFLOW.md** - Branch strategy and commit conventions

### Handoffs (Tier 3)
- Check `/docs/handoffs/` for recent session notes
- Most recent handoff = current state
- Older handoffs = historical context

---

## 🐛 COMMON ISSUES & FIXES

### "Port already in use"
```bash
lsof -ti:3001 | xargs kill -9
```

### "Invalid Date" in console
- Check CSV header rows are filtered
- Verify timestamp parsing in csvParser.js
- Look for cross-day boundary issues

### IndexedDB not persisting
- Check browser storage settings (not in incognito)
- Verify async/await chains complete
- Look for early return statements

### Sensor changes not showing
- Verify sensor database imported
- Check console for detection confidence levels
- Fall back to gap detection if no database

### Git push fails
- Never chain commands (`&&`)
- Run sequentially with proper timeouts
- Check network connectivity

---

## 💡 DEVELOPMENT BEST PRACTICES

### Code Style
- **Engines**: Pure functions, no side effects
- **Hooks**: React-specific, orchestration only
- **Components**: Presentation, minimal logic
- **Comments**: Explain WHY, not WHAT
- **Console logs**: Strategic placement, not everywhere

### Clinical Accuracy
- All glucose values in **mg/dL** (never mmol/L)- **Thresholds**: Follow ADA/ATTD 2019 guidelines
  - TIR: 70-180 mg/dL
  - TAR: >180 mg/dL (L1: 180-250, L2: >250)
  - TBR: <70 mg/dL (L1: 54-69, L2: <54)
- **Sensor success**: 6.75+ days (accounts for warmup)
- **Data gaps**: >3 hours = sensor change candidate

### Performance
- **Chunk large files**: ≤30 lines per write_file call
- **IndexedDB**: Month-bucketed for fast queries
- **React**: Memoize expensive calculations
- **Search**: Use Desktop Commander's start_search for large codebases

### Documentation
- **Update CHANGELOG.md** after every feature
- **Create handoff docs** at session end
- **Keep MASTER_INDEX current** (this file)
- **Archive old docs** to `/docs/archive/`

---

## 🎯 CURRENT STATE (v3.8.3)

### ✅ Completed
- Multi-year glucose storage (v3.0 FUSION)
- Sensor database integration
- 3-tier sensor status colors
- Day profiles with sensor markers
- Database export system
- ProTime workday integration
- Comparison analysis
- AGP metrics with ADA/ATTD compliance

### 🚧 In Progress
- Debug logging cleanup (console.log statements)
- Documentation consolidation (this session)

### 📋 Next Phase (To Be Determined)
- Sensor history timeline visualization
- Header layout improvements
- Y-axis adaptive scaling (reduce whitespace)
- Direct CSV to V3 upload (Phase 4)

---

## 🔗 EXTERNAL REFERENCES

### Clinical Guidelines
- ADA/ATTD 2019 Consensus (AGP standardization)
- Guardian 4 sensor specifications (7-day rating)
- Medtronic 780G device documentation

### Technical Stack
- **React 18.3.1** - UI framework
- **Vite 7.1.12** - Build tool
- **IndexedDB** - Browser storage
- **sql.js 1.13.0** - SQLite in browser
- **Lucide React** - Icon library

### Development Tools
- **Desktop Commander** - File operations (CRITICAL)
- **Safari DevTools** - Better Promise debugging than Chrome
- **Git** - Version control (v3.0-dev branch)

---

## 📞 SUPPORT & TROUBLESHOOTING

### If Stuck:
1. Check browser console for errors
2. Review most recent handoff in `/docs/handoffs/`
3. Read PROJECT_BRIEFING_V3_8.md for architecture context
4. Search codebase with Desktop Commander's start_search
5. Check CHANGELOG.md for recent breaking changes

### Debug Patterns:
```javascript
// Good: Strategic logging
console.log('🔍 Sensor detection:', { source, confidence, count });

// Bad: Spam logging
console.log('entering function');
console.log(data);
console.log('exiting function');
```

### File Reading Strategy:
```bash
# 1. List directory first
DC: list_directory /path/to/dir

# 2. Check file size with get_file_info
DC: get_file_info /path/to/file.js

# 3. Read strategically (offset + length)
DC: read_file path=/path/to/file.js offset=0 length=50

# 4. Use start_search for large files
DC: start_search path=/project pattern="function name"
```

---

## 📈 VERSION HISTORY

### v3.8.x Series (October 2025)
- **v3.8.3** - Sensor status 3-tier colors
- **v3.8.2** - Sensor visualization in day profiles
- **v3.8.1** - SQLite sensor database import
- **v3.8.0** - Database export system

### v3.0-3.7 Series (FUSION Development)
- v3.0: Multi-year IndexedDB storage
- v3.1: ProTime integration
- v3.2: Comparison analysis
- v3.3: Event detection
- v3.4: Day profiles
- v3.5: UI polish
- v3.6: Bug fixes
- v3.7: Persistence improvements

### v2.x Series (Legacy - Pre-FUSION)
- Archived in `/docs/archive/pre-v3.8/`
- Single-CSV analysis only
- localStorage-based
- No sensor tracking

---

## 🚀 GETTING STARTED - NEW DEVELOPER

**Day 1 Checklist:**
- [ ] Clone repository
- [ ] Read this MASTER_INDEX
- [ ] Read PROJECT_BRIEFING_V3_8.md
- [ ] Start server, upload test CSV
- [ ] Explore UI: Import → Day Profiles → Sensor History → Export
- [ ] Review file structure in `/src`
- [ ] Check browser console for data flow
- [ ] Make a small test change, verify hot reload works

**Week 1 Goals:**
- Understand 3-layer architecture (Components → Hooks → Engines)
- Learn IndexedDB storage patterns
- Read metric calculation formulas
- Understand sensor detection logic
- Practice using Desktop Commander for file ops

**Month 1 Targets:**
- Implement small feature end-to-end
- Write tests for an engine
- Optimize a performance bottleneck
- Improve documentation
- Review and refactor legacy code

---

## ✨ PROJECT PHILOSOPHY

### Medical Software Principles
1. **Accuracy over aesthetics** - Clinical correctness is non-negotiable
2. **Transparency** - Show data sources and confidence levels
3. **Conservative design** - Brutalist for rapid scanning by professionals
4. **Print-first** - Must work in black & white
5. **Offline-capable** - IndexedDB enables full local operation

### Code Quality
1. **Separation of concerns** - Components/Hooks/Engines never mix
2. **Pure functions preferred** - Testable, predictable, reusable
3. **Explicit over clever** - Readable beats concise
4. **Document decisions** - WHY something works this way
5. **KISS principle** - Simplest solution that works

### User Experience
1. **Progressive disclosure** - Show what's needed, hide complexity
2. **Fast feedback** - Loading states, success confirmations
3. **Error recovery** - Graceful degradation, helpful messages
4. **Keyboard accessible** - Power users love shortcuts
5. **Consistent patterns** - Learn once, apply everywhere

---

**Last Updated:** October 27, 2025  
**Maintainer:** Jo Mostert  
**Version:** 3.8.3  
**Status:** Production-ready (minus debug logs)