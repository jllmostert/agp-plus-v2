---
tier: 2
status: active
last_updated: 2025-11-02
purpose: AGP+ v3.6.0 project briefing - Option C implementation in progress
---

# PROJECT BRIEFING — AGP+ v3.6.0 + Option C

**Version**: v3.6.0 → v4.0  
**Phase**: Option C Implementation  
**Date**: 2025-11-02  
**Status**: 🔄 Development - Sprint B1 (Metrics Validation)

---

## 🎯 EXECUTIVE SUMMARY

**AGP+ (Ambulatory Glucose Profile Plus)** is a React-based medical web application for analyzing continuous glucose monitoring (CGM) data from Medtronic CareLink CSV exports. Designed for healthcare professionals following ADA/ATTD 2023 guidelines.

**Current Status**: v3.6.0 is stable and functional. TIER2 architecture analysis complete (6/6 domains, average 7.5/10). Now implementing Option C (67 hours, 9 sprints) to reach production-grade v4.0.

**Active Work**: Sprint B1 - Metrics Validation (7h) - Performance benchmarks + unit tests

---

## 📍 QUICK NAVIGATION

**For Development**: → `docs/optionc/START_HERE.md`  
**For Current Sprint**: → `docs/optionc/block-c-robustness/sprint-b1-metrics/HANDOFF.md`  
**For Progress**: → `docs/optionc/MASTER_PROGRESS.md`  
**For Git**: → `GIT_CHEATSHEET.md`

**This document**: High-level overview + maintained documents index

---

## 📊 CURRENT STATUS (v3.6.0)

### What Works ✅

**Core Features**:
- CSV upload & parsing (Medtronic CareLink format)
- Metrics calculation (TIR, MAGE, MODD, GRI, CV, GMI)
- AGP visualization (percentile charts, daily patterns)
- Sensor management (dual storage: SQLite + localStorage)
- Stock management (batch tracking, auto-assignment)
- HTML report export (brutalist, print-optimized)
- JSON data export (versioned)
**Clinical Accuracy**:
- All metrics verified against published literature
- MAGE: Service & Nelson (1970) ✅
- MODD: Molnar et al. (1972) ✅
- GRI: Klonoff et al. (2018) ✅

### Known Limitations ⚠️

**Critical** (P0 - Must fix for v4.0):
- No accessibility (charts lack ARIA labels, screen reader support)
- No JSON import (export-only = incomplete backup)

**Important** (P1 - Should fix):
- Parser uses hardcoded column indices (breaks if Medtronic changes format)
- No performance benchmarking (metrics speed unvalidated)
- No unit tests (calculation correctness unverified)

**Nice-to-have** (P2/P3):
- God components (AGPGenerator: 1962 lines, hard to maintain)
- No table virtualization (slow with >1000 sensors)
- Incomplete WCAG compliance (color contrast untested)

**Full details**: → `STATUS.md`

---

## 🏗️ ARCHITECTURE (v3.6.0)

### Tech Stack

**Frontend**: React 18.2.0, Vite 4.x, Pure CSS  
**Storage**: localStorage (recent), IndexedDB (tombstones), SQLite (historical)  
**Libraries**: sql.js 1.8.0, minimal dependencies  
**Testing**: ⚠️ None (Sprint B1 will add Jest)

### Data Flow

```
CSV Upload → Parse → IndexedDB (master) → localStorage (cache) →
Calculate Metrics → Render Charts → Export (HTML/JSON)
```

### File Structure

```
src/
├── components/      # React UI components
├── engines/         # Pure calculation functions
│   ├── metrics-engine.js  (422 lines)
│   └── stock-engine.js    (201 lines)
├── hooks/           # React hooks
├── utils/           # Parsing, storage, validation
└── styles/          # CSS (brutalist theme)

docs/
├── optionc/         # Option C implementation docs ← ACTIVE
├── analysis/        # TIER2 architecture analysis
├── archive/         # Historical documentation
└── reference/       # Clinical & technical references

test-data/           # Sample CSV files
```

---

## 🔍 TIER2 ARCHITECTURE ANALYSIS

**Status**: Complete (6/6 domains analyzed)  
**Date**: 2025-11-01  
**Overall Score**: 7.5/10 (solid, actionable issues)

### Domain Scores

| Domain | Score | Status | Priority Fix |
|--------|-------|--------|--------------|
| A: Parsing | 8.5/10 | Good | Dynamic columns (P1) |
| B: Metrics | 9.0/10 | Excellent | Tests needed (P1) |
| C: UI Components | 6.5/10 | Functional | Refactor gods (P2) |
| D: Storage | 7.0/10 | Working | Complexity noted |
| E: Stock | 8.0/10 | Good | N/A |
| F: Visualization | 6.5/10 | Good | Accessibility (P0) |
| G: Export/Import | 7.0/10 | Incomplete | JSON import (P0) |

**Analysis Files**:
- `docs/analysis/TIER2_SYNTHESIS.md` - Executive summary
- `docs/analysis/DOMAIN_*_ANALYSIS.md` - Detailed per-domain
- `docs/analysis/TIER2_ANALYSIS_SUMMARY.md` - Quick overview

---

## 🎯 OPTION C ROADMAP (v4.0)

**Total Effort**: 67 hours over 4 weeks  
**Structure**: 4 blocks, 9 sprints  
**Start Date**: 2025-11-02

### Block A: Documentation (5h)
**Status**: ⏸️ TODO

**Sprints**:
- Update TIER2_SYNTHESIS.md (2h)
- Update PROJECT_BRIEFING.md (2h) ← This file
- Update README.md (1h)

### Block B: Safety (15h)
**Status**: ⏸️ TODO

**Sprints**:
- F1: Accessibility (5h) - ARIA labels, screen readers
- G1: Backup/Restore (10h) - JSON import, validation

**Why P0**: Medical apps MUST be accessible + have reliable backup

### Block C: Robustness (15h)
**Status**: 🔄 ACTIVE ← **YOU ARE HERE**

**Sprints**:
- B1: Metrics Validation (7h) - Performance + tests ← **CURRENT**
- A1: Parser Robustness (8h) - Dynamic columns, bounds validation

**Why P1**: Future-proof parser, validated metrics

### Block D: Quality (35h)
**Status**: ⏸️ TODO

**Sprints**:
- C1: Split God Components (20h) - AGPGenerator refactor
- C2: Virtualization (3h) - Table performance
- F2: WCAG Compliance (9h) - Color contrast, keyboard nav

**Why P2/P3**: Code quality, not critical for function

**Full Roadmap**: → `PLAN_VAN_AANPAK.md`  
**Progress Tracking**: → `docs/optionc/MASTER_PROGRESS.md`

---

## 📚 MAINTAINED DOCUMENTS

### Active Documentation (Read These)

**Root Level**:
- `START_HERE.md` - Points to docs/optionc/ hub
- `HANDOFF.md` - Current sprint quick reference
- `PROGRESS.md` - Session log
- `STATUS.md` - What works, known issues
- `PLAN_VAN_AANPAK.md` - Complete Option C plan
- `GIT_CHEATSHEET.md` - Git workflow
- `CHANGELOG.md` - Version history

**Option C Hub** (`docs/optionc/`):
- `START_HERE.md` - Main navigation
- `MASTER_PROGRESS.md` - All sprints tracking
- `block-*/sprint-*/HANDOFF.md` - Sprint details
- `block-*/sprint-*/PROGRESS.md` - Real-time tracking (source of truth)

**Analysis** (`docs/analysis/`):
- `TIER2_SYNTHESIS.md` - Architecture executive summary
- `TIER2_ANALYSIS_SUMMARY.md` - Quick scores overview
- `DOMAIN_*_ANALYSIS.md` - Detailed domain analyses

**Reference** (`docs/reference/`, `reference/`):
- `metric_definitions.md` - All glucose metrics formulas
- `minimed_780g_ref.md` - Device specifications
- Clinical papers (MAGE, MODD, GRI)

### Archived Documentation

**Location**: `docs/archive/2025-11/pre-optionc/`

**Contents**:
- Pre-Option-C HANDOFF, START_HERE, PROGRESS
- Old CURRENT_SPRINT.md
- Backup copies of root docs

**Access**: Only for historical reference

---

## 🔒 GIT & SAFETY

### Branches

**main**: (not used) - Reserved for stable releases  
**develop**: (active) - All development happens here  
**feature/***: (optional) - Experimental branches

**Current Branch**: `develop`

### Safety Checkpoints

**Available Tags**:
- `v3.6.0-pre-optionc` - Before Option C start (2025-11-02)
- `v3.6.0` - Stable v3.6.0 release
- More tags created per block completion

**Rollback**: `git checkout v3.6.0-pre-optionc`  
**Return**: `git checkout develop`

### Git Workflow

**Start**:
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git pull origin develop
```

**During**:
```bash
git add .
git commit -m "test(metrics): Add MAGE tests"
git push origin develop
```

**Full Guide**: → `GIT_CHEATSHEET.md`

---

## 🚀 QUICK START (Development)

### First Time Setup

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"

# Install dependencies (if needed)
npm install

# Start dev server
npx vite --port 3001
```

**Open**: http://localhost:3001

### Daily Workflow

```bash
# Pull latest
git pull origin develop

# Start server
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001

# Test with sample data
# Upload CSV from test-data/ folder

# Commit work
git add .
git commit -m "feat(sprint-b1): [what you did]"
git push origin develop
```

---

## 🐛 TROUBLESHOOTING

### Common Issues

**Server won't start**:
```bash
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

**Git conflicts**:
```bash
git status
git pull origin develop --rebase
# Fix conflicts, then:
git add .
git rebase --continue
```

**Lost work**:
```bash
# Check recent commits
git log --oneline -10

# Check safety tags
git tag -l

# Rollback if needed
git checkout v3.6.0-pre-optionc
```

**Performance issues**:
- Clear browser cache
- Restart Vite server
- Check console for errors

---

## 📞 CONTACTS & RESOURCES

**Project Owner**: Jo Mostert  
**Development**: Claude (Sonnet 4.5) via Desktop Commander  
**Repository**: Local Git + GitHub (jllmostert/agp-plus-v2)

**Key Commands**:
```bash
# All paths use Desktop Commander
/Users/jomostert/Documents/Projects/agp-plus

# Dev server must use PATH export
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

---

## 📖 READING ORDER

**New Developer (1 hour)**:
1. This document (PROJECT_BRIEFING.md)
2. `STATUS.md` - What works
3. `docs/optionc/START_HERE.md` - Current work
4. `GIT_CHEATSHEET.md` - Git workflow

**Deep Dive (3 hours)**:
5. `PLAN_VAN_AANPAK.md` - Complete roadmap
6. `docs/analysis/TIER2_SYNTHESIS.md` - Architecture analysis
7. `reference/metric_definitions.md` - Clinical formulas
8. Sprint-specific HANDOFF.md files

**Contributing**:
9. Read current sprint HANDOFF
10. Update sprint PROGRESS.md (real-time!)
11. Commit often (small chunks)
12. Update MASTER_PROGRESS.md after sprint

---

## 🎯 SUCCESS CRITERIA (v4.0)

**Must Have** (P0):
- [ ] Charts accessible (ARIA labels, screen readers)
- [ ] JSON import works (complete backup/restore)
- [ ] All unit tests pass
- [ ] Performance <1000ms validated

**Should Have** (P1):
- [ ] Parser uses dynamic columns
- [ ] Glucose bounds validation (20-600 mg/dL)
- [ ] WCAG color contrast validated

**Nice to Have** (P2/P3):
- [ ] God components split
- [ ] Table virtualization
- [ ] Full keyboard navigation

**Definition of Done**: All P0 + P1 complete, v4.0 tagged

---

**Document Version**: 2.0  
**Last Update**: 2025-11-02  
**For Questions**: See docs/optionc/ or ask Claude
