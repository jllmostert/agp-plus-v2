# AGP+ Documentation Index

**Version**: v4.3.6  
**Last Updated**: 2025-11-21  
**Project**: Ambulatory Glucose Profile Plus

---

## 📍 START HERE

**New to the project?**  
→ Read `handoffs/HANDOFF.md` (5 min quick start)

**Returning after break?**  
→ Read `handoffs/HANDOFF_COMPREHENSIVE.md` (complete status)

**Check progress?**  
→ Read `handoffs/PROGRESS.md` (session log)

---

## 📂 FOLDER STRUCTURE

### `/docs/handoffs/` - Session Handoffs
- **HANDOFF.md** - Quick reference (start server, test, debug)
- **HANDOFF_COMPREHENSIVE.md** - Full project status & architecture
- **PROGRESS.md** - Session-by-session log (45+ sessions)

### `/docs/project/` - Project Documentation
- **PROJECT_BRIEFING.md** - High-level project overview & philosophy
- **ROADMAP_2025-11.md** - Current roadmap & remaining work
- **TEST_PLAN.md** - Testing strategy

### `/docs/reference/` - Technical Reference
- **GIT_CHEATSHEET.md** - Common git commands
- **GIT_WORKFLOW.md** - Git branching strategy
- **QUICK_COMMANDS.md** - Quick terminal commands
- **metric_definitions.md** - Glucose metric calculations (MAGE, MODD, GMI, etc.)
- **minimed_780g_ref.md** - MiniMed 780G pump settings reference

### `/docs/performance/` - Performance Benchmarks
- **METRICS_BENCHMARK.md** - Metrics calculation performance (7/14/90 days)

### `/docs/archive/` - Historical Documents
- **track3-q1/** - Context API refactoring (completed Session 43)
- **2025-11/** - Monthly archives
- **session-handoffs-2025-11/** - Old session handoffs

---

## 🎯 QUICK LINKS BY TASK

| Task | Document |
|------|----------|
| Starting a session | `handoffs/HANDOFF.md` |
| Check what's done | `handoffs/PROGRESS.md` |
| Debugging | `handoffs/HANDOFF.md` (common issues) |
| Adding a feature | `handoffs/HANDOFF_COMPREHENSIVE.md` (architecture) |
| Medical reference | `reference/metric_definitions.md`, `reference/minimed_780g_ref.md` |
| Git help | `reference/GIT_CHEATSHEET.md` |

---

## 📊 PROJECT STATUS

**Version**: v4.3.6 ✅ Production Ready  
**Architecture**: Context API complete (0 useState in AGPGenerator)  
**Recent Features**: MiniMed 780G Settings UI, Device History Management

**What Works**:
- ✅ CSV import (Medtronic CareLink)
- ✅ AGP generation (14-day) with dynamic Y-axis
- ✅ All metrics: TIR, TAR, TBR, CV, GMI, MAGE, MODD, GRI
- ✅ Pump settings (auto-detect from CSV + manual edit)
- ✅ Device history (archive old pumps/transmitters)
- ✅ Sensor management (dual storage)
- ✅ Stock management (batch tracking)
- ✅ Import/export JSON (full backup/restore)
- ✅ ProTime PDF parsing
- ✅ Print-ready reports

**Remaining Work** (optional):
- Track 3 Q3: Table virtualization (~3h)
- Track 3 Q4: WCAG AAA compliance (~6h)
- Track 2 S4: Advanced comparison (~4h)

---

**Last maintained**: 2025-11-21
