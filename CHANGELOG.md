# Changelog - AGP+ (Ambulatory Glucose Profile Plus)

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [v3.7.1 - Documentation Overhaul] - 2025-11-03 - Development Workflow

### 📚 Documentation Restructure
**Goal**: Improve development workflow, prevent context overflow, clarify document roles

### ✅ Changes

#### Core Documentation Rewrite
- **HANDOFF.md**: Completely rewritten
  - Now general development workflow guide (was sprint-specific)
  - Added comprehensive context overflow prevention guide
  - Added healthy development practices
  - Clarified Progress/Status/Changelog roles
  - Added recovery procedures
  
- **DocumentHygiene.md**: Activated
  - Moved from `docs/archive/` to root directory
  - Now actively enforced tier system
  - Updated metadata (tier 1, active status)
  
- **START_HERE.md**: Updated navigation
  - Better routing to current work
  - Clearer documentation structure
  - Added quick commands for common tasks
  
- **PROGRESS.md**: Clarified purpose
  - Now explicitly session log only
  - Added role definitions (vs STATUS, CHANGELOG)
  - Updated current sprint status (C1, paused)
  - Added Session 4 entry (this documentation work)

#### Documentation Philosophy
- Established clear separation:
  - **PROGRESS.md**: Session log, what you did
  - **Sprint PROGRESS.md**: Real-time task tracking
  - **STATUS.md**: High-level project status
  - **CHANGELOG.md**: Formal version history
  - **HANDOFF.md**: General workflow guide
  
- Tier system enforced (DocumentHygiene):
  - Tier 1: Operational (daily updates)
  - Tier 2: Planning (weekly updates)
  - Tier 3: Reference (rarely updated)

#### Context Overflow Prevention
Added comprehensive guide to prevent Claude crashes:
1. One file at a time (non-negotiable)
2. Use references, not full text
3. Strip comments + test data
4. Hard budget in prompts
5. Request minimal outputs
6. Rolling context governor
7. Never include binary/large JSON
8. Work in 30-60 min chunks
9. Use edit_block, not append
10. Automate hygiene with scripts

#### Branch Status Clarification
- Documented current state: `develop` is stable, should become `main`
- Documented planned promotion: `develop` → `main`, `main` → `safety-v3.6.0`
- Added manual action instructions in HANDOFF.md

### 🎯 Impact
- **Clearer workflow**: Easy to start/resume work
- **Better recovery**: PROGRESS.md as anchor after crashes
- **Reduced crashes**: Context overflow prevention tactics
- **Active hygiene**: DocumentHygiene now enforced
- **Role clarity**: Each doc file has clear purpose

### 📝 Next Steps
- Continue Sprint C1 (Component Splitting, 55% complete)
- Follow new workflow guidelines
- Use context management tactics to prevent crashes

---

## [v3.7.0 - Sprint C1 Progress] - 2025-11-02 - Component Refactoring

### 🔄 Sprint C1: Split God Components (55% Complete)
- **Status**: PAUSED after 11/20 hours
- **Target**: AGPGenerator.jsx (1962 lines) → smaller components

### ✅ Completed Tasks
- **Taak 1**: Strategy Planning (2h)
  - Created SPLIT_STRATEGY.md with component hierarchy
  - Identified 3 containers + 5 feature panels
  
- **Taak 2**: Extract Containers (6h)
  - ✅ ModalManager.jsx created (169 lines) - All 7 modals via React portals
  - ✅ DataLoadingContainer.jsx created (250 lines) - All 5 buttons in one row
  - ✅ VisualizationContainer.jsx created (115 lines) - 6 viz sections
  
- **Taak 3**: Extract Features (6h)
  - ⏭️ SKIPPED - Components already exist or don't exist
  - DataImportPanel.jsx ✅ (178 lines) - Already integrated
  - DataExportPanel.jsx ✅ (144 lines) - Already integrated
  - HeroMetricsPanel.jsx ⚠️ (96 lines) - Orphaned, not integrated

### 📊 Impact
- **AGPGenerator.jsx**: 1962 → 1430 lines (-532 lines, -27%)
- **New components**: 3 containers + 2 panels
- **Performance**: Ready for memoization + virtualization

### 🔧 Technical Changes
- Installed `react-window` for table virtualization (ready to use)
- Fixed localStorage + SQLite dual storage issues
- Improved modal rendering via React portals

### ⏸️ Paused Tasks
- **Taak 4**: Table Virtualization (0/3h) - Not started
  - react-window installed and ready
  - Quick wins identified: SensorRow memo + VisualizationContainer memo
  
- **Taak 5**: Testing (0/3h) - Not started

### 📝 Next Session
See `HANDOFF_PAUSE.md` for detailed pickup instructions

---

## [v3.6.0 + Option C] - 2025-11-02 - Development Restructure

### 🏗️ Option C Implementation Started
- **Documentation structure created**: `docs/optionc/`
  - 4 Blocks: A (Docs), B (Safety), C (Robustness), D (Quality)
  - 9 Sprints total, 67 hours implementation
  - Master tracking: `MASTER_PROGRESS.md`
  - Block/sprint specific HANDOFF + PROGRESS files

### 📚 Documentation Overhaul
- **Root docs updated**
  - `START_HERE.md` - Points to `docs/optionc/` hub
  - `HANDOFF.md` - Sprint B1 quick reference
  - `PROGRESS.md` - Session log + tracking
  - `STATUS.md` - What works, known limitations (NEW)
  - `PLAN_VAN_AANPAK.md` - Complete Option C plan (NEW)
  - `GIT_CHEATSHEET.md` - Safety checkpoint workflow

- **Archived old docs**
  - `docs/archive/2025-11/pre-optionc/` - Pre-Option-C backups

### 🔒 Safety Checkpoints
- **Tag created**: `v3.6.0-pre-optionc`
  - Safe fallback point before Option C work
  - Use: `git checkout v3.6.0-pre-optionc`
- **Branch**: `develop` (main work branch)

### 🎯 Current Sprint
- **Sprint B1**: Metrics Validation (7h)
  - Performance benchmarking (3h)
  - Unit tests (4h)
  - Location: `docs/optionc/block-c-robustness/sprint-b1-metrics/`

### 🔍 TIER2 Analysis (Complete)
- **Overall score**: 7.5/10 (solid, actionable issues)
- **6/6 domains analyzed**: A, B, C, D, E, F, G
- **Critical findings**:
  - Domain F: No accessibility (P0 fix needed)
  - Domain G: No JSON import (P0 fix needed)
  - Domain C: God components (P2 refactor)
  - Domain B: No performance tests (P1 validation)

### 📦 Git Commits
- `84aba00` - Pre-Option-C safety checkpoint
- `1f8d211` - Option C structure created
- `7ee57e4` - GIT_CHEATSHEET updated
- `b82f288` - Root docs updated

---

