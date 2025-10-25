# AGP+ v2.2.1 - Continuation Prompt

**Date:** October 25, 2025  
**Current Status:** Phase 1 Complete, Moving to Phase 2/3  
**Latest Commit:** `b29467b` - fix: resolve hook initialization order and outlier array calculation

---

## ⚡ QUICK START

**What just happened:**
- ✅ Created `useDayProfiles` hook to extract business logic from component
- ✅ Fixed "uninitialized variable" bug (hook order issue)
- ✅ Fixed "outlierLow not defined" bug (array recalculation)
- ✅ Day profiles modal fully functional and tested

**What's next:**
Phase 2 (Documentation) OR Phase 3 (v3.0 Planning) - Jo will decide

---

## 📁 ESSENTIAL FILES TO READ

**Read these IN ORDER before starting:**

1. **This document** (you're reading it) - Context of where we are
2. `/mnt/project/MASTER_INDEX_V2_2_0.md` - Quick reference
3. `/mnt/project/PROJECT_BRIEFING_V2_2_0_PART1.md` - Architecture (if needed for context)
4. `/mnt/project/ROADMAP_v3.0.md` - **ONLY for Phase 3**

**DO NOT read all docs unless specifically needed for your task!** This is lightweight handoff.

---

## 🎯 CURRENT TASKS

### PHASE 2: Documentation Improvements (Optional)
**Status:** Not started  
**Priority:** Medium (can defer to later)

Tasks:
- [ ] Add inline comments to Y-axis algorithm in `DayProfileCard.jsx` (lines 188-215)
- [ ] Document badge threshold logic in code (achievement system)
- [ ] Update PROJECT_BRIEFING with `useDayProfiles` hook info
- [ ] Commit documentation updates

**Why:** Code is working but complex algorithms need explanatory comments

---

### PHASE 3: v3.0 Planning (Recommended Next)
**Status:** Not started  
**Priority:** HIGH (affects future architecture)

**Questions to answer:**
1. **Branching strategy:** Should we use `main` + `v3.0-dev` branch, or just feature branches?
2. **Sensor database integration:** How do we store sensor/cartridge change events?
3. **Incremental storage:** What's the data structure for cumulative master dataset?
4. **Backwards compatibility:** How does v2.x per-upload model transition to v3.0 incremental?

**Action items:**
- [ ] Read ROADMAP_v3.0.md thoroughly
- [ ] Propose branching strategy with pros/cons
- [ ] Design sensor event storage schema (SQLite? IndexedDB? JSON?)
- [ ] Create v3.0 development plan document
- [ ] Discuss with Jo and get architecture decisions

**Why:** These decisions affect how we build v3.0 - need clarity before coding

---

### PHASE 4: v2.2.1 Release (After Phase 2 OR 3)
**Status:** Not started  
**Priority:** Low (v2.2.0 is production-ready)

Tasks:
- [ ] Update CHANGELOG.md with architectural improvements
- [ ] Version bump to 2.2.1 in package.json
- [ ] Tag release: `git tag v2.2.1 && git push --tags`
- [ ] Update PROJECT_BRIEFING references from 2.2.0 → 2.2.1

**Why:** Document what we improved architecturally

---

## 🔧 KEY TECHNICAL DETAILS

### What We Fixed in Phase 1

**Bug #1: Hook Initialization Order**
```javascript
// ❌ BEFORE (broken):
const dayProfiles = useDayProfiles(csvData, dateRange, metricsResult);
// ... later ...
const metricsResult = useMetrics(csvData, startDate, endDate, workdays);

// ✅ AFTER (fixed):
const metricsResult = useMetrics(csvData, startDate, endDate, workdays);
const dayProfiles = useDayProfiles(csvData, dateRange, metricsResult);
```

**Bug #2: Outlier Array Missing**
- `calculateAdaptiveYAxis()` returns `{ outliers: { low: number, high: number } }`
- But DayProfileCard needs `outlierLow` and `outlierHigh` as arrays for `.length` checks
- Solution: Recalculate arrays locally in component from curve data

### Files Modified
```
src/hooks/useDayProfiles.js (CREATED - 94 lines)
src/components/AGPGenerator.jsx (MODIFIED)
src/components/DayProfileCard.jsx (MODIFIED)
```

---

## 🛠️ DEVELOPMENT ENVIRONMENT

**Project location:** `/Users/jomostert/Documents/Projects/agp-plus/`  
**Dev server:** Running on port 3000 (was 3001, now back to 3000)  
**GitHub:** https://github.com/jllmostert/agp-plus-v2

**ALWAYS use Desktop Commander:**
```bash
# File operations
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/[path]
DC: edit_block file_path="..." old_string="..." new_string="..."

# Search
DC: start_search path="/Users/.../agp-plus/src" pattern="..." searchType="content"

# Git
DC: start_process "cd /Users/.../agp-plus && git status" timeout_ms=5000

# Dev server check
DC: list_sessions
DC: list_processes  # if sessions doesn't show it
```

**CRITICAL:** Always use full absolute paths - no `~` or relative paths

---

## 💡 ARCHITECTURAL REMINDERS

### The Three-Layer Architecture
1. **Engines** (`/src/core/*.js`) - Pure business logic, no React
2. **Hooks** (`/src/hooks/*.js`) - React hooks that call engines
3. **Components** (`/src/components/*.jsx`) - Pure visualization, no calculations

**Rule:** Components call hooks, hooks call engines. Never skip layers!

### Recent Architectural Win
- ✅ `useDayProfiles` hook now handles day profile generation
- ✅ AGPGenerator component is now pure UI orchestration
- ✅ All business logic properly isolated in engine + hook

---

## 🎯 PHASE 3 SPECIFIC: What Jo Needs Answers On

If doing Phase 3 (v3.0 Planning), Jo needs architectural guidance on:

### 1. Git Branching Strategy
**Context:** v2.x is production stable. v3.0 will be major refactor (incremental storage).

**Options:**
- **A) Long-lived v3.0-dev branch** - Merge to main when ready
- **B) Feature branches only** - Small incremental PRs to main
- **C) Separate v3 repo** - Clean slate (overkill?)

**Jo wants:** Your recommendation with pros/cons

### 2. Sensor Event Storage
**Context:** Currently sensor/cartridge changes detected from alarm strings in CSV. Want persistent database.

**Questions:**
- What storage tech? (IndexedDB? SQLite via WASM? Plain JSON?)
- Schema design? (events table with timestamp + type + metadata?)
- How to handle CSV re-imports? (merge? overwrite?)

**Jo wants:** Concrete schema proposal with example queries

### 3. Incremental Storage Architecture
**Context:** v2.x processes full CSV each time. v3.0 should append new data to master dataset.

**Questions:**
- Data structure for master dataset? (giant array? time-indexed map?)
- How to handle overlapping imports? (deduplication strategy?)
- When to recalculate metrics? (on each append? on demand?)

**Jo wants:** High-level architecture diagram or detailed written plan

### 4. Backwards Compatibility
**Context:** Users have saved uploads in v2.x format (per-upload processing).

**Questions:**
- Can v3.0 read v2.x saved uploads?
- Migration path? (one-time import? run both systems?)
- When to deprecate v2.x storage format?

**Jo wants:** Migration strategy that doesn't lose user data

---

## ✅ SUCCESS CRITERIA

### Phase 2 Complete When:
- [ ] Complex algorithms have inline comments
- [ ] PROJECT_BRIEFING updated with new hook
- [ ] Code is more maintainable for future developers

### Phase 3 Complete When:
- [ ] Branching strategy decided and documented
- [ ] Sensor event storage schema designed
- [ ] Incremental storage architecture planned
- [ ] Jo has clear roadmap for v3.0 development

### Phase 4 Complete When:
- [ ] v2.2.1 tagged and released
- [ ] CHANGELOG updated
- [ ] Documentation references updated

---

## 🚀 READY TO START?

**Jo will tell you which phase to tackle.** If Phase 3, start by reading ROADMAP_v3.0.md.

**Your mission:** Provide architectural guidance and help Jo make informed decisions about v3.0 direction.

---

*Last updated: October 25, 2025 - 18:45 CET*  
*Commit: b29467b*  
*Context: Refactoring complete, planning next steps*
