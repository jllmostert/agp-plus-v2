---
tier: 2
status: active
last_updated: 2025-11-15
purpose: Strategic project overview - architecture, standards, structure, philosophy
---

# PROJECT BRIEFING — AGP+

**Project**: Ambulatory Glucose Profile Plus (AGP+)  
**Type**: Medical Data Visualization Web Application  
**Owner**: Jo Mostert  
**Document Tier**: 2 (Strategic Overview)  
**Last Updated**: 2025-11-15

---

## 🎯 PROJECT VISION & PURPOSE

### What is AGP+?

AGP+ is a **medical-grade web application** for analyzing continuous glucose monitoring (CGM) data from Medtronic insulin pumps. It transforms raw CSV exports from CareLink into actionable clinical insights through:

- **Ambulatory Glucose Profiles** (AGP) - Standard visualization following ADA/ATTD 2023 consensus
- **Day-by-day profiles** - Detailed analysis of individual days
- **Advanced variability metrics** - MAGE, MODD, CV calculations per scientific literature
- **Sensor lifecycle management** - Hardware tracking, batch management, usage statistics
- **Print-ready reports** - Clinical documentation for healthcare workflows

### Why Does This Exist?

**Problem**: Medtronic CareLink provides raw data exports but limited analysis capabilities. Healthcare providers and patients need:
- Clinical-grade metrics following international consensus
- Print-ready reports for consultations
- Historical sensor tracking for insurance/warranty
- Day-to-day pattern analysis for treatment optimization

**Solution**: AGP+ fills this gap with:
- Browser-based analysis (no server needed, patient privacy)
- Scientifically validated metrics (peer-reviewed formulas)
- Professional brutalist design (print-optimized, accessible)
- Complete data portability (JSON export/import)

### Target Users

**Primary**: Type 1 diabetes patients using Medtronic MiniMed 780G with Guardian Sensor 4  
**Secondary**: Healthcare providers (endocrinologists, diabetes educators)  
**Use Case**: Personal glucose analysis, treatment optimization, clinical consultations

**User Profile** (Jo Mostert):
- Tech-savvy patient managing own diabetes
- Uses MiniMed 780G in SmartGuard Auto Mode
- Tracks sensors, stock batches, ProTime workdays
- Needs medical-grade analysis for self-management

---

## 🏛️ DESIGN CONSTRAINTS & PHILOSOPHY

### Core Design Principles

#### 1. Medical Accuracy First
**Constraint**: All metrics must match peer-reviewed scientific literature  
**Why**: This is medical data - incorrect calculations could harm treatment decisions

**Implementation**:
- MAGE calculation: Service & Nelson (1970) algorithm
- MODD calculation: Molnar et al. (1972) methodology  
- TIR/TAR/TBR: Battelino et al. (2023) consensus ranges
- GMI: Bergenstal et al. (2018) formula
- All formulas documented in `reference/metric_definitions.md`

#### 2. Brutalist Design System
**Constraint**: High contrast, monospace fonts, 3px solid borders, no gradients/shadows  
**Why**: 
- Print optimization (black ink on white paper)
- Accessibility (high contrast for visual impairments)
- Clinical professionalism (medical reports, not consumer apps)
- Information density (maximize data, minimize decoration)

**Implementation**:
- CSS variables for color palette (`--paper`, `--ink`, `--grid-line`)
- Monospace fonts (tabular data alignment)
- 3px borders (clear visual hierarchy)
- No emoji in production UI (DevTools only)

#### 3. Browser-Only Architecture
**Constraint**: No server backend, all processing client-side  
**Why**:
- Patient privacy (data never leaves device)
- Zero deployment complexity (static hosting)
- Offline capability (works without internet)
- No server costs or maintenance

**Implementation**:
- React SPA (Single Page Application)
- IndexedDB for primary storage
- localStorage for recent data
- SQLite (sql.js) for historical sensors
- Vite for bundling and dev server

#### 4. Data Portability
**Constraint**: Users must own their data completely  
**Why**: Medical data lock-in is unethical, patients should control their health information

**Implementation**:
- JSON export with full schema (v3.8.0+)
- Symmetric import/export (no data loss)
- Clear versioning (backward compatibility)
- No proprietary formats

#### 5. Crash-Resistant Development
**Constraint**: Claude sessions can crash, losing context  
**Why**: Development continuity requires recovery mechanisms

**Implementation**:
- Frequent git commits (every 30-60 min)
- PROGRESS.md as minute-by-minute log (source of truth)
- Handoff documents for session transitions
- Tier system separating dynamic vs static docs

---

## 📁 PROJECT STRUCTURE & TIER SYSTEM

### Documentation Tier System

**AGP+ uses a 3-tier documentation system** to separate dynamic session logs from stable reference material.

#### Tier 1: Operational Documents (Daily Updates)
**Purpose**: Real-time development tracking, session continuity  
**Update Frequency**: Multiple times per day during active development  
**Audience**: Active developers (Claude, Jo)

**Documents**:
- `docs/handoffs/PROGRESS.md` - **Source of truth** - Minute-by-minute session log
- `docs/handoffs/HANDOFF_*.md` - Session transition documents
- Working notes, temp files

**Characteristics**:
- Changes constantly
- High detail, low polish
- Chronological order
- First place to check after crashes

**When to Use**: 
- Starting a new session → Read latest PROGRESS.md entries
- Session crashed → Check PROGRESS.md to see what was being done
- Need detailed timeline → Read session-by-session in PROGRESS.md

---

#### Tier 2: Strategic Documents (Weekly/Monthly Updates)
**Purpose**: Project overview, current status, navigation hub  
**Update Frequency**: After major milestones, monthly reviews  
**Audience**: New developers, long-term planning

**Documents**:
- `docs/project/PROJECT_BRIEFING.md` - **This document** - Strategic overview
- `docs/project/STATUS.md` - Current version status, what works/doesn't
- `TODO.md` - Current priorities and future work
- `CHANGELOG.md` - Formal version history

**Characteristics**:
- Stable but not static
- Polished writing
- Strategic focus
- Updated from Tier 1 after sessions complete

**When to Use**:
- New to the project → Start here (PROJECT_BRIEFING)
- What's working? → Check STATUS.md
- What's next? → Check TODO.md
- Version history → Check CHANGELOG.md

---

#### Tier 3: Reference Documents (Rarely Updated)
**Purpose**: Scientific foundation, technical specifications  
**Update Frequency**: Only when scientific consensus changes or major refactoring  
**Audience**: Anyone needing authoritative technical details

**Documents**:
- `reference/metric_definitions.md` - All glucose metrics formulas (MAGE, MODD, TIR, etc)
- `reference/minimed_780g_ref.md` - Medtronic pump specifications and settings
- `docs/reference/DUAL_STORAGE_ANALYSIS.md` - Storage architecture deep dive
- Scientific papers (Service 1970, Molnar 1972, Battelino 2023)

**Characteristics**:
- Static (months/years between updates)
- Highly technical
- Peer-reviewed when possible
- Authoritative source for calculations

**When to Use**:
- How is MAGE calculated? → metric_definitions.md
- What are MiniMed 780G settings? → minimed_780g_ref.md
- Why dual storage? → DUAL_STORAGE_ANALYSIS.md
- Implementing new metric → Check formulas in Tier 3 docs

---

### Directory Structure & Rationale

```
agp-plus/
│
├── src/                          # Application source code
│   ├── components/               # React components
│   │   ├── AGPGenerator.jsx     # Main component
│   │   ├── panels/              # Feature panels (IMPORT, EXPORT, etc)
│   │   └── modals/              # Modal dialogs
│   ├── hooks/                   # Custom React hooks (state management)
│   ├── core/                    # Pure calculation engines (no React)
│   │   ├── metrics-engine.js    # MAGE, MODD, TIR calculations
│   │   └── day-profile-engine.js
│   ├── storage/                 # Data persistence layer
│   │   ├── masterDatasetStorage.js  # IndexedDB
│   │   ├── sensorStorage.js         # Async sensor management
│   │   └── stockStorage.js          # Batch tracking
│   ├── utils/                   # Parsing, validation, helpers
│   └── styles/                  # CSS (brutalist design system)
│
├── docs/                         # All documentation (tier system)
│   ├── project/                 # Tier 2: Strategic docs
│   │   ├── PROJECT_BRIEFING.md # This document
│   │   └── STATUS.md           # Current version status
│   ├── handoffs/                # Tier 1: Session logs
│   │   ├── PROGRESS.md         # Source of truth session log
│   │   └── HANDOFF_*.md        # Session transition docs
│   ├── reference/               # Tier 3: Technical references
│   │   └── DUAL_STORAGE_ANALYSIS.md
│   └── archive/                 # Historical documentation
│
├── reference/                   # Tier 3: Scientific references
│   ├── metric_definitions.md   # Formulas & consensus targets
│   └── minimed_780g_ref.md     # Device specifications
│
├── test-data/                   # Sample CSV/PDF files for testing
│   ├── *.csv                   # CareLink exports
│   └── *.pdf                   # ProTime PDFs
│
├── public/                      # Static assets
├── dist/                        # Build output (git ignored)
│
├── CHANGELOG.md                 # Tier 2: Version history
├── TODO.md                      # Tier 2: Priorities & future work
├── README.md                    # User-facing project description
├── package.json                 # NPM dependencies
└── vite.config.js               # Build configuration
```

**Rationale for Structure**:
- **src/**: Clean separation of concerns (components, hooks, engines, storage)
- **docs/**: Tier system prevents important docs from drowning in session logs
- **reference/**: Scientific foundation separate from code
- **test-data/**: Real-world samples for development/testing

---

## 🏗️ ARCHITECTURE PHILOSOPHY

### High-Level Data Flow

```
User Upload
    ↓
CSV/PDF Parser (utils/)
    ↓
IndexedDB Master Dataset (storage/)
    ↓
Calculation Engines (core/)
    ↓
React Components (components/)
    ↓
Browser Display / HTML Export
```

### Storage Architecture Philosophy

**Hybrid Multi-Layer Storage** (IndexedDB + localStorage + SQLite)

#### Why Not Just One Storage System?

AGP+ uses **three storage layers** because each has different strengths:

**Layer 1: IndexedDB (Primary Master Dataset)**
- **What**: All glucose readings, cartridge changes
- **Why**: Large dataset support (>90 days), async queries, persistence
- **Limitation**: Async API (requires promises, can't use in useMemo)

**Layer 2: localStorage (Recent Data Cache)**
- **What**: Last 30 days sensors, stock batches, patient info, ProTime workdays
- **Why**: Synchronous access (fast reads), simple API, good for <5MB data
- **Limitation**: Size limits (5-10MB), synchronous (blocks main thread if large)

**Layer 3: SQLite (Historical Sensors)**  
- **What**: Sensors >30 days old (read-only)
- **Why**: Preserve historical data, user uploaded sensor database
- **Limitation**: Cannot write to it, deduplication needed

**Hybrid Strategy**:
- Recent sensors: localStorage (editable, fast)
- Old sensors: SQLite (read-only, historical)
- Master dataset: IndexedDB (glucose readings, large scale)
- Deduplication layer merges SQLite + localStorage (prefer localStorage version)

**Critical Design Decision**: Accept complexity of dual storage for sensors to support:
1. User-uploaded sensor databases (SQLite import)
2. Fast recent data access (localStorage)
3. Large glucose datasets (IndexedDB)

**Full Analysis**: `docs/reference/DUAL_STORAGE_ANALYSIS.md`

---

### Component Architecture Philosophy

**Current State** (v4.3.0):
- Main component: `AGPGenerator.jsx` (1667 lines, down from 1803)
- Custom hooks extract state management (Phase 1 refactoring)
- Panel-based UI (IMPORT, DAGPROFIELEN, SENSOREN, EXPORT)

**Design Principles**:
1. **Separation of Concerns**: Pure calculation engines (core/) separate from React (components/)
2. **Custom Hooks**: Extract state management from components (useModalState, usePanelNavigation, useImportExport)
3. **Progressive Enhancement**: Start simple, refactor when pain points emerge
4. **No Premature Optimization**: God components acceptable until they cause real problems

**Future Philosophy** (Optional Phases):
- Phase 2: Context API for cross-cutting concerns (patient info, settings)
- Phase 3: Component composition for better testability
- Only refactor when complexity becomes unmanageable, not for ideological purity

---

## 🛠️ DEVELOPMENT STANDARDS

### Git Workflow

**Branch Strategy**: 
- Primary branch: `main` (active development + production)
- Feature branches: `feature/*` (experimental work, merge to main)
- No `develop` branch (small team, frequent commits)

**Commit Frequency**: 
- Every 30-60 minutes during active development
- Small, focused commits (one logical change per commit)
- **Why**: Claude sessions can crash - frequent commits prevent data loss

**Commit Message Convention**:
```bash
type(scope): description

Examples:
feat(hooks): Add useImportExport hook
fix(sensors): Resolve async cascade in day-profile-engine  
docs(progress): Update Session 32 completion
refactor(storage): Migrate to async IndexedDB
test(metrics): Add MAGE calculation unit tests
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code restructuring (no behavior change)
- `test`: Adding/updating tests
- `style`: Formatting, whitespace
- `chore`: Build, dependencies, tooling

**Scopes**: Component or feature area (hooks, sensors, storage, metrics, ui, etc)

---

### Documentation Standards

**Tier 1 (PROGRESS.md) - During Active Development**:
- Update **minute-by-minute** during sessions
- Record: What you're doing, why, problems encountered, solutions
- Raw notes format acceptable (will be polished for Tier 2 later)
- **Source of truth** for session recovery

**Tier 2 Updates - After Session Completion**:
- Update CHANGELOG.md with session summary
- Update STATUS.md if features changed
- Update TODO.md if priorities shifted
- Polish Tier 1 raw notes into structured entries

**Tier 3 - Only When Necessary**:
- Update metric_definitions.md if formulas change
- Update minimed_780g_ref.md if device specs change
- Update architecture docs if fundamental changes

**Critical Rule**: PROGRESS.md is written **during** work. Other docs updated **after** work complete.

---

### Coding Standards

**React Best Practices**:
- Functional components only (no class components)
- Custom hooks for reusable logic
- Props destructuring for clarity
- Meaningful component/variable names

**State Management**:
- useState for local component state
- Custom hooks for shared logic
- Async storage operations properly handled (try-catch, error messages)

**Styling**:
- CSS variables for colors (`--paper`, `--ink`, etc)
- No hardcoded hex colors in JSX
- Brutalist design: 3px borders, monospace fonts, high contrast
- No emoji in production UI (DevTools only)

**Performance**:
- Async storage operations (don't block UI)
- React.memo only when profiler shows problems
- No premature optimization

**Error Handling**:
- Try-catch on all async operations
- User-friendly error messages (no raw stack traces in UI)
- Console.log for debugging (removable before production)

---

### Session Workflow (Claude + Desktop Commander)

**Starting a Session**:
1. Navigate to project: `cd /Users/jomostert/Documents/Projects/agp-plus`
2. Set PATH: `export PATH="/opt/homebrew/bin:$PATH"`
3. Pull latest: `git pull origin main`
4. Read `docs/handoffs/PROGRESS.md` (last 50-100 lines) to understand current state
5. Check `TODO.md` for priorities
6. Start dev server: `npx vite --port 3001`

**During Session**:
1. Work in small chunks (30-60 min per feature/fix)
2. Update PROGRESS.md **as you work** (minute-by-minute notes)
3. Commit frequently: `git add . && git commit -m "type(scope): what you did"`
4. Test changes in browser (localhost:3001)
5. Push commits: `git push origin main`

**Ending Session**:
1. Final commit with all changes
2. Update session summary in PROGRESS.md
3. Create handoff if needed: `docs/handoffs/HANDOFF_[date]_[topic].md`
4. Update TODO.md if priorities changed
5. Optionally update CHANGELOG.md with session summary

**If Session Crashes**:
1. Restart Claude
2. Navigate to project
3. Read PROGRESS.md last 100 lines to see what was being done
4. Check `git status` to see uncommitted changes
5. Resume from last commit

---

## 🗺️ ROADMAP & EVOLUTION

### Completed Major Work

**Phase 1: State Management Hooks** (v4.3.0) ✅
- Extracted 19 state variables into 3 custom hooks
- Reduced AGPGenerator complexity by 41%
- Zero bugs introduced, all functionality preserved

**Async Storage Migration** (v4.2.1) ✅
- Converted sensorStorage to async IndexedDB
- Fixed iPad localStorage limitations
- All async cascades properly handled

**Complete Import/Export** (v3.8.0) ✅
- Symmetric JSON backup/restore
- 7 data types (glucose, sensors, stock, patient info, etc)
- Versioned schema with validation

**Scientific Metric Improvements** (v3.9.0) ✅
- MAGE: Per-day SD calculation per Service 1970
- MODD: Chronological sorting per Molnar 1972
- Coverage thresholds per ATTD 2023 consensus

---

### Future Vision (Optional Phases)

**Phase 2: Context API** (Not Started)
- Global state for patient info, settings
- Remove prop drilling
- Estimated: 4-6 sessions
- Priority: Low (current hooks work well)

**Phase 3: Component Composition** (Not Started)
- Split remaining large components
- React.memo optimizations
- Table virtualization (react-window)
- Estimated: 3-4 sessions
- Priority: Medium (nice to have, not critical)

**Clinical Analytics** (Wish List)
- MiniMed 780G pump settings analysis (ISF, CR optimization)
- Automated insulin-to-carb ratio effectiveness reports
- Basal rate pattern analysis
- Estimated: 8-12 sessions
- Priority: Low (user feature request, not core functionality)

**Mobile Optimization** (Wish List)
- iPad touch gesture improvements
- Mobile-specific UI tweaks
- PWA (Progressive Web App) setup
- Offline support improvements
- Estimated: 6-8 sessions
- Priority: Low (works on iPad, just not optimal)

**Guiding Principle for Future Work**: 
Add features only when clear user need emerges. Maintain medical accuracy and brutalist design above all else. Refactor for simplicity, not ideology.

---

## 🔧 TROUBLESHOOTING

### Common Issues

**Server won't start**:
```bash
# Always set PATH first (Homebrew Node.js)
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

**Port 3001 already in use**:
```bash
# Kill stuck process
lsof -ti:3001 | xargs kill -9
npx vite --port 3001
```

**Import/Export fails**:
- Check browser console for specific errors
- Verify JSON schema version (v3.8.0+)
- Try export → import same file to verify round-trip
- Check IndexedDB in browser DevTools (F12 → Application)

**Metrics look wrong**:
- Verify against `reference/metric_definitions.md` formulas
- Check input data quality (gaps, invalid values)
- Compare with GlyCulator or CareLink for validation

**Claude session crashed**:
- Read `docs/handoffs/PROGRESS.md` last 100 lines
- Check `git log --oneline -10` for recent commits
- Check `git status` for uncommitted work
- Resume from last known good state

**Lost context / confused about project state**:
- Read this document (PROJECT_BRIEFING.md) for overview
- Read `docs/project/STATUS.md` for current version status
- Read `TODO.md` for current priorities
- Read `docs/handoffs/PROGRESS.md` for recent work

---

## 📖 DOCUMENT NAVIGATION GUIDE

### "I need to understand the project fundamentals"
→ Read this document (`docs/project/PROJECT_BRIEFING.md`)

### "What's currently working and what's broken?"
→ Read `docs/project/STATUS.md`

### "What should I work on next?"
→ Read `TODO.md` (root directory)

### "What just happened in the last session?"
→ Read `docs/handoffs/PROGRESS.md` (last 50-100 lines)

### "How is MAGE/MODD/TIR calculated?"
→ Read `reference/metric_definitions.md`

### "What are the MiniMed 780G settings?"
→ Read `reference/minimed_780g_ref.md`

### "Why dual storage (IndexedDB + localStorage + SQLite)?"
→ Read `docs/reference/DUAL_STORAGE_ANALYSIS.md`

### "What changed in version X?"
→ Read `CHANGELOG.md` (root directory)

### "How do I use the application?"
→ Read `README.md` (user-facing guide)

### "Session crashed, how do I recover?"
→ Read `docs/handoffs/PROGRESS.md` (source of truth)

### "I want to implement a new feature"
1. Read this document (PROJECT_BRIEFING.md) - understand constraints
2. Read `reference/metric_definitions.md` - if adding metrics
3. Update `docs/handoffs/PROGRESS.md` - log your work minute-by-minute
4. Follow commit conventions (see Development Standards above)
5. After completion: Update CHANGELOG.md, STATUS.md, TODO.md

---

## 📚 TIER SYSTEM QUICK REFERENCE

**When to use each tier:**

### Use Tier 1 (PROGRESS.md)
- ✅ Starting a new session (read last entries)
- ✅ Session crashed (recover from here)
- ✅ Logging active work (write here during development)
- ✅ Understanding detailed timeline (session-by-session)

### Use Tier 2 (This document + STATUS/TODO/CHANGELOG)
- ✅ New to project (start with PROJECT_BRIEFING)
- ✅ Monthly review (check STATUS, TODO)
- ✅ Version history (CHANGELOG)
- ✅ Strategic planning (what's next?)

### Use Tier 3 (Reference docs)
- ✅ Implementing calculations (metric_definitions.md)
- ✅ Medical device specs (minimed_780g_ref.md)
- ✅ Architecture deep dives (DUAL_STORAGE_ANALYSIS.md)
- ✅ Never changes unless science or hardware changes

**Key Insight**: 
- **Tier 1** = What's happening NOW (minute-to-minute)
- **Tier 2** = Where are we OVERALL (month-to-month)
- **Tier 3** = What NEVER changes (year-to-year)

---

## 🎯 CORE PRINCIPLES SUMMARY

1. **Medical accuracy above all else** - Lives depend on correct calculations
2. **Brutalist design for clinical use** - Print-ready, accessible, professional
3. **Browser-only for patient privacy** - No data ever leaves the device
4. **Data portability is essential** - Patients own their health data
5. **Crash-resistant development** - Frequent commits, detailed logs

6. **Progressive enhancement** - Start simple, refactor when needed
7. **Tier system prevents chaos** - Dynamic logs separate from stable docs
8. **PROGRESS.md is source of truth** - Updated during work, not after

---

## 📞 PROJECT METADATA

**Project Name**: AGP+ (Ambulatory Glucose Profile Plus)  
**Owner**: Jo Mostert  
**Primary Developer**: Claude (Sonnet 4.5) via Desktop Commander  
**Tech Stack**: React 18.2, Vite 5.x, IndexedDB, localStorage, sql.js  
**Repository**: Local Git + GitHub  
**License**: MIT (presumably)

**Project Path**:
```
/Users/jomostert/Documents/Projects/agp-plus
```

**Critical Commands**:
```bash
# Set PATH (required every session)
export PATH="/opt/homebrew/bin:$PATH"

# Start dev server
npx vite --port 3001

# Open app
open http://localhost:3001
```

**Support**: Questions? Check tier 2 docs (STATUS.md, TODO.md) or tier 3 reference docs (metric_definitions.md, minimed_780g_ref.md)

---

**Document Type**: Strategic Project Overview (Tier 2)  
**Document Version**: 3.0  
**Last Updated**: 2025-11-15  
**Next Review**: When project structure fundamentally changes (not for feature updates)

**Referenced From**: 
- Handoff documents (for project overview)
- New developer onboarding
- Strategic planning sessions
- Architecture decision records
