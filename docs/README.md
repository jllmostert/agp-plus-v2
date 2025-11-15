# AGP+ Documentation Index

**Version**: v4.3.0  
**Last Updated**: 2025-11-15  
**Project**: Ambulatory Glucose Profile Plus

---

## 📍 START HERE

**New to the project?**  
→ Read `handoffs/HANDOFF.md` (5 min quick start)

**Returning after break?**  
→ Read `handoffs/HANDOFF_COMPREHENSIVE.md` (complete status)

**Planning work?**  
→ Read `project/REFACTOR_MASTER_PLAN.md` (97h roadmap)

---

## 📂 FOLDER STRUCTURE

### `/docs/handoffs/` - Session Handoffs
- **HANDOFF.md** - Quick reference (start server, test, debug)
- **HANDOFF_COMPREHENSIVE.md** - Full project status & testing guide
- **PROGRESS.md** - Session-by-session log (32 sessions)
- **REFACTOR_MASTER_PLAN.md** - Future work roadmap
- **REFACTOR_TRANSITION.md** - Why we consolidated plans

### `/docs/project/` - Project Documentation
- **PROJECT_BRIEFING.md** - High-level project overview
- **STATUS.md** - Current project status
- **TEST_PLAN.md** - Testing strategy
- **minimed_780g_ref.md** - MiniMed 780G pump settings reference
- **metric_definitions.md** - Glucose metric calculations (MAGE, MODD, GMI, etc.)

### `/docs/analysis/` - Architecture Analysis
- **TIER2_SYNTHESIS.md** - Complete architecture overview
- **DUAL_STORAGE_ANALYSIS.md** - IndexedDB + SQLite patterns
- **DOMAIN_*_ANALYSIS.md** - Domain-specific analyses

### `/docs/reference/` - Technical Reference
- **GIT_CHEATSHEET.md** - Common git commands
- **GIT_WORKFLOW.md** - Git branching strategy
- **QUICK_COMMANDS.md** - Quick terminal commands

### `/docs/performance/` - Performance Benchmarks
- **METRICS_BENCHMARK.md** - Metrics calculation performance (7/14/90 days)

### `/docs/archive/` - Historical Documents
- **optionc/** - Old Option C refactoring plan (archived 2025-11-15)
- **V3_***.md** - Version 3 documentation
- **2025-11/** - Monthly archives

---

## 🎯 QUICK LINKS BY TASK

**Starting a session?**  
→ `handoffs/HANDOFF.md` + `handoffs/PROGRESS.md` (last entry)

**Debugging?**  
→ `handoffs/HANDOFF.md` (common issues section)

**Adding a feature?**  
→ `analysis/TIER2_SYNTHESIS.md` (architecture)  
→ `handoffs/REFACTOR_MASTER_PLAN.md` (check if planned)

**Working with medical data?**  
→ `project/minimed_780g_ref.md` (pump settings)  
→ `project/metric_definitions.md` (calculations)

**Refactoring code?**  
→ `project/REFACTOR_MASTER_PLAN.md` (97h plan, 4 tracks)

**Need git help?**  
→ `reference/GIT_CHEATSHEET.md`

---

## 📊 PROJECT STATUS SUMMARY

**Version**: v4.3.0 ✅ Production Ready  
**Last Major Work**: Phase 1 Refactoring (3 hooks, 330 lines removed)  
**Next Up**: Track 1 - Documentation updates (5h)  
**Total Roadmap**: 97h to v5.0

**Recent Wins**:
- ✅ useModalState, usePanelNavigation, useImportExport hooks
- ✅ Parser robustness (dynamic columns)
- ✅ Metrics validation (25 tests, all passing)
- ✅ Performance excellent (9-89ms)
- ✅ Zero known bugs

---

## 🗺️ DOCUMENTATION ROADMAP

**Track 1 tasks** (from REFACTOR_MASTER_PLAN.md):
1. [ ] Update TIER2_SYNTHESIS.md (2h) - Add Phase 1 changes
2. [ ] Update PROJECT_BRIEFING.md (2h) - Feature list, tech stack
3. [ ] Update README.md (1h) - Quick start, features

---

## 💡 TIPS

**Looking for something?**
- Medical reference → `project/`
- Architecture → `analysis/`
- Session history → `handoffs/PROGRESS.md`
- Old docs → `archive/`

**Adding new docs?**
- Handoffs → `handoffs/`
- Project specs → `project/`
- Technical analysis → `analysis/`
- Git/commands → `reference/`

---

**This index is maintained manually. Update after major doc changes.**

**Last maintained**: 2025-11-15 (Folder reorganization + consolidation)
