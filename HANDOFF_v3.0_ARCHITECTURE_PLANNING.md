# AGP+ v3.0 - Architecture Planning Session

**Project:** AGP+ (Ambulatory Glucose Profile Plus)  
**Current Version:** 2.2.1 (stable, production-ready)  
**Target Version:** 3.0.0 (major architectural changes)  
**Date:** October 25, 2025  
**GitHub:** https://github.com/jllmostert/agp-plus-v2

---

## 🎯 SESSION GOAL

Plan v3.0 architecture and branching strategy for **incremental master dataset** feature.

**Context:** v2.x processes one CSV upload at a time. v3.0 will merge multiple uploads into cumulative master dataset.

**Your mission:** Help Jo make informed architectural decisions about:
1. **Git branching strategy** for parallel v2.x maintenance + v3.0 development
2. **Sensor/cartridge event storage** (persistent database for equipment changes)
3. **Incremental storage architecture** (how to handle multi-year cumulative data)
4. **Migration path** from v2.x per-upload model to v3.0 incremental model

---

## 📚 ESSENTIAL READING ORDER

**Start here (in this exact order):**

1. **This document** (HANDOFF_v3.0_ARCHITECTURE_PLANNING.md) - You're reading it
2. **ROADMAP_v3.0.md** (project root) - Jo's v3.0 vision and requirements
3. **MASTER_INDEX_V2_2_0.md** (docs/) - Quick reference for current architecture
4. **PROJECT_BRIEFING_V2_2_0_PART1.md** (docs/) - Current architecture deep dive (IF needed)

**DO NOT read all docs upfront!** Only dive into PROJECT_BRIEFING if you need specific implementation details.

---

## 🗂️ PROJECT STATUS

### Current State (v2.2.1)
- ✅ **Production-ready** - Day profiles feature complete
- ✅ **Well-architected** - Three-layer separation (Components → Hooks → Engines)
- ✅ **Fully documented** - Comprehensive inline comments and PROJECT_BRIEFING
- ✅ **Tagged and pushed** - v2.2.1 released on GitHub

### v2.x Data Model (Current)
```javascript
// Each CSV upload is independent
Upload {
  id: "abc123",
  filename: "carelink-2025-10.csv",
  uploadDate: Date,
  csvData: Array<Reading>,
  dateRange: { min: Date, max: Date },
  patientInfo: { ... },
  workdays: Set<"YYYY-MM-DD">  // ProTime linked to THIS upload
}

// User selects ONE upload, analyzes that period only
```

### v3.0 Data Model (Target)
```javascript
// Master dataset: ALL uploads merged by timestamp
MasterDataset {
  allReadings: Array<Reading>,  // Sorted by timestamp, multi-year
  dateRange: { min: Date, max: Date },  // Spans all uploads
  uploads: Array<Upload>,  // History of source files
  globalWorkdays: Map<"YYYY-MM-DD", boolean>,  // ProTime date-based, not upload-based
  sensorEvents: Array<SensorChange>,  // Persistent sensor change database
  cartridgeEvents: Array<CartridgeChange>  // Persistent cartridge database
}

// User sees MERGED view automatically, filters by date range
```

---

## ❓ KEY ARCHITECTURAL QUESTIONS

### QUESTION 1: Git Branching Strategy

**Problem:** Jo needs to maintain stable v2.x while developing v3.0 in parallel.

**Options:**

**A) Long-lived `v3.0-dev` branch**
```
main (v2.2.1 stable)
  └─ v3.0-dev (breaking changes)
       └─ feature/incremental-storage
       └─ feature/global-protime
       └─ feature/sensor-database

Merge v3.0-dev → main when ready
```
- ✅ Pros: Clear separation, easy to maintain v2.x, safe experimentation
- ❌ Cons: Merge conflicts if main updates, harder to do incremental releases

**B) Feature branches from main**
```
main (v2.2.1 → v2.3.0 → v3.0.0)
  └─ feature/incremental-storage (PR → main)
  └─ feature/global-protime (PR → main)
  └─ feature/sensor-database (PR → main)

Small PRs merged incrementally
```
- ✅ Pros: Incremental delivery, fewer merge conflicts, easier code review
- ❌ Cons: Breaking changes hit main immediately, harder to maintain stable v2.x

**C) Separate v3 repository**
```
agp-plus-v2 (stays on v2.x)
agp-plus-v3 (fresh start)

Complete rewrite in new repo
```
- ✅ Pros: Clean slate, no legacy code constraints
- ❌ Cons: Overkill for v3.0, loses git history, duplicate maintenance

**Jo needs:**
- Your recommendation with pros/cons analysis
- How to handle v2.x bugfixes while v3.0 is in development?
- When to deprecate v2.x support?

---

### QUESTION 2: Sensor/Cartridge Event Storage

**Problem:** Currently sensor/cartridge changes detected from CSV alarm strings. Want persistent database that survives CSV re-imports.

**Requirements:**
- Store sensor changes (gaps >3h, <10h)
- Store cartridge changes (Rewind events)
- Associate with specific dates/times
- Survive CSV re-uploads (don't duplicate)
- Query by date range efficiently

**Storage Options:**

**A) IndexedDB (browser-native)**
```javascript
// sensors object store
{
  id: "sensor_20251015_1430",
  timestamp: Date,
  type: "sensor_change",
  gapMinutes: 240,
  source: "carelink-2025-10.csv"
}

// Indexes: timestamp, type
// Queries: getByDateRange(start, end)
```
- ✅ Pros: Already using IndexedDB for uploads, no new dependencies
- ❌ Cons: Complex API, requires careful schema design

**B) SQLite via WASM (sql.js)**
```sql
CREATE TABLE sensor_events (
  id TEXT PRIMARY KEY,
  timestamp INTEGER,
  type TEXT,
  gap_minutes INTEGER,
  source_file TEXT
);

CREATE INDEX idx_timestamp ON sensor_events(timestamp);
```
- ✅ Pros: Familiar SQL, powerful queries, better for complex analytics
- ❌ Cons: Large bundle size (~1MB), more complex setup

**C) Plain JSON in localStorage**
```javascript
// Just serialize to JSON
localStorage.setItem('sensorEvents', JSON.stringify(events));
```
- ✅ Pros: Simple, no schema complexity
- ❌ Cons: No indexing, slow queries, localStorage limits (5-10MB)

**Jo needs:**
- Schema design for your recommended approach
- How to handle CSV re-imports? (merge? overwrite? detect duplicates?)
- Example queries: "Get all sensor changes in October 2025"
- Migration path from v2.x (no event storage) to v3.0

---

### QUESTION 3: Incremental Storage Architecture

**Problem:** v2.x loads full CSV each time. v3.0 should append new data to master dataset without reprocessing everything.

**Requirements:**
- Append new readings to master dataset
- Deduplicate overlapping timestamps
- Recalculate metrics only when needed (not every append)
- Handle out-of-order uploads (e.g., upload Oct 2024 AFTER Nov 2024)
- Maintain performance with 3+ years of data (~500k readings)

**Data Structure Options:**

**A) Giant sorted array**
```javascript
masterDataset.allReadings = [
  { timestamp: Date, glucose: number, ... },
  // ... 500k readings sorted by timestamp
];

// Append: concat + sort + dedupe
// Query: binary search for date range
```
- ✅ Pros: Simple, works with existing engines (expect sorted array)
- ❌ Cons: Slow append (O(n log n) sort), memory hungry, deduplication tricky

**B) Time-indexed map (month buckets)**
```javascript
masterDataset.byMonth = new Map([
  ["2023-01", Array<Reading>],
  ["2023-02", Array<Reading>],
  // ...
  ["2025-10", Array<Reading>]
]);

// Append: Add to correct bucket, sort bucket only
// Query: Fetch relevant buckets, flatten
```
- ✅ Pros: Fast append (sort small buckets), efficient date queries
- ❌ Cons: More complex, need to rebuild sorted array for engines

**C) IndexedDB compound index**
```javascript
// readings object store with compound index [timestamp, id]
// Let IndexedDB handle sorting and deduplication
readings.openCursor(IDBKeyRange.bound(start, end));
```
- ✅ Pros: Database handles sorting/dedup, scales well, lazy loading
- ❌ Cons: Async queries, need to convert to array for engines, more complex

**Deduplication Strategy:**
```javascript
// How to handle duplicate timestamps from overlapping uploads?

// Option 1: Keep first (earliest upload wins)
if (!existingReadings.has(timestamp)) {
  add(reading);
}

// Option 2: Keep last (latest upload overwrites)
existingReadings.set(timestamp, reading);

// Option 3: Compare values, keep if different
if (reading.glucose !== existing.glucose) {
  // Sensor malfunction? Keep both? Average?
}
```

**Jo needs:**
- High-level architecture diagram or detailed written plan
- Deduplication strategy: keep first? last? detect conflicts?
- When to recalculate metrics? (on each append? on demand? cached with invalidation?)
- Performance targets: What's acceptable for 3 years of data?

---

### QUESTION 4: Backwards Compatibility & Migration

**Problem:** Users have saved uploads in v2.x format. Need migration path that doesn't lose data.

**v2.x Storage Schema:**
```javascript
// uploads object store (IndexedDB)
{
  id: "uuid",
  filename: string,
  uploadDate: Date,
  csvData: Array<Reading>,
  // ... other fields
}
```

**v3.0 Storage Schema (proposed):**
```javascript
// master_dataset object store
{
  id: "master",  // Single record
  allReadings: Array<Reading>,  // Or reference to readings store
  dateRange: { min, max },
  globalWorkdays: Map<string, boolean>,
  version: "3.0.0"
}

// uploads object store (metadata only)
{
  id: "uuid",
  filename: string,
  uploadDate: Date,
  dateRange: { min, max },
  locked: boolean,
  mergedInto: "master"
}

// sensor_events object store (new)
// cartridge_events object store (new)
```

**Migration Scenarios:**

1. **Fresh v3.0 user** - No migration needed, start clean
2. **v2.x user with saved uploads** - Migrate on first v3.0 launch?
3. **v2.x → v3.0 → back to v2.x** - Can they downgrade safely?

**Jo needs:**
- One-time migration script on v3.0 first launch?
- Run both v2.x and v3.0 storage side-by-side temporarily?
- When to delete v2.x data? (immediately? keep for rollback?)
- How to communicate breaking changes to users?

---

## 🛠️ DEVELOPMENT WORKFLOW

**Project Location:** `/Users/jomostert/Documents/Projects/agp-plus/`

**ALWAYS use Desktop Commander:**
```bash
# File operations
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/[path]
DC: edit_block file_path="..." old_string="..." new_string="..."
DC: write_file path="..." content="..." mode="rewrite"

# Search
DC: start_search path="/Users/.../agp-plus/src" pattern="..." searchType="content"

# Git
DC: start_process "cd /Users/.../agp-plus && git status" timeout_ms=5000
DC: start_process "cd /Users/.../agp-plus && git checkout -b v3.0-dev" timeout_ms=5000
```

**CRITICAL:** Always use full absolute paths - no `~` or relative paths

---

## 📋 DELIVERABLES FOR THIS SESSION

By end of session, Jo needs:

### 1. Branching Strategy Decision
- [ ] Chosen approach (A, B, or C) with justification
- [ ] Git commands to set up branches
- [ ] Strategy for v2.x bugfixes during v3.0 development
- [ ] Deprecation timeline for v2.x

### 2. Sensor Event Storage Design
- [ ] Technology choice (IndexedDB / SQLite / JSON)
- [ ] Complete schema with field types
- [ ] Deduplication strategy for CSV re-imports
- [ ] Example queries with pseudocode
- [ ] Migration plan from v2.x (no storage) to v3.0

### 3. Incremental Storage Architecture
- [ ] Data structure design (array / map / IndexedDB)
- [ ] Append algorithm with deduplication logic
- [ ] Metric recalculation strategy (when? how often?)
- [ ] Performance estimates for 3+ years data
- [ ] Diagram or detailed written plan

### 4. Migration Strategy
- [ ] Migration script outline (pseudocode)
- [ ] v2.x → v3.0 data transformation steps
- [ ] Rollback safety plan
- [ ] User communication approach

---

## 🎯 SUCCESS CRITERIA

**This session is complete when:**
- [ ] All 4 architectural questions have clear, documented answers
- [ ] Jo understands trade-offs and can make informed decisions
- [ ] Concrete implementation plan exists for each component
- [ ] Git branching strategy is decided and documented
- [ ] No blockers remain for starting v3.0 development

**Next session:**
- Create `v3.0-dev` branch (or chosen strategy)
- Start implementing Phase 1 from ROADMAP_v3.0.md
- Build incrementally with tests

---

## 💡 ARCHITECTURAL PRINCIPLES TO MAINTAIN

From v2.2.1 (do NOT compromise these in v3.0):

### Three-Layer Architecture
```
Components (UI only)
    ↓ call
Hooks (React state + orchestration)
    ↓ call
Engines (Pure business logic, no React)
```

### Separation of Concerns
- âŒ Components NEVER call engines directly
- âœ… Components call hooks, hooks call engines
- âœ… Engines are pure functions (no side effects, no React)

### Data Flow
```
CSV Upload
    ↓
useCSVData (parsing)
    ↓
AGPGenerator (state)
    ↓
useMetrics (calculations)
    ↓
AGPGenerator (state)
    ↓
Display Components (pure presentation)
```

**For v3.0:** Add storage layer UNDER engines, maintain architecture above.

---

## 🚀 READY TO START?

**Your approach:**

1. **Read ROADMAP_v3.0.md thoroughly** - Understand Jo's vision
2. **Analyze each architectural question** - Consider trade-offs
3. **Provide concrete recommendations** - Not just theory, give specific designs
4. **Think about implementation** - How would you actually build this?
5. **Ask clarifying questions** - If requirements are ambiguous

**Jo's style:** Systematic, engineering-minded, values practical precision over complexity. Give evidence-based recommendations with clear trade-offs.

---

## 📌 IMPORTANT NOTES

### Git Branch Working Model Tutorial Needed

**Jo needs to learn:** How to work with two branches simultaneously for the first time.

**Cover these topics:**
1. **Creating and switching branches**
   ```bash
   git checkout -b v3.0-dev  # Create new branch
   git checkout main         # Switch to main
   git checkout v3.0-dev     # Switch to v3.0-dev
   ```

2. **Making commits on different branches**
   - How to commit to v3.0-dev without affecting main?
   - How to fix bugs on main while v3.0-dev is in progress?

3. **Keeping branches in sync**
   - How to pull v2.x bugfixes into v3.0-dev?
   - `git merge main` vs `git rebase main` - which one?

4. **Safety checks**
   - How to always know which branch I'm on?
   - What happens if I commit to wrong branch?
   - How to move a commit from one branch to another?

5. **Practical workflow example**
   ```
   Scenario: I'm on v3.0-dev, user reports v2.2.1 bug
   1. git stash (save v3.0-dev work)
   2. git checkout main
   3. fix bug, commit, push
   4. git checkout v3.0-dev
   5. git merge main (or rebase?)
   6. git stash pop (restore v3.0-dev work)
   ```

**Include this in your response:** Step-by-step guide with concrete examples.

### Current Tooling
- **Dev server:** Vite (port 3000)
- **Storage:** IndexedDB via Dexie.js wrapper
- **State:** React hooks (useState, useMemo, useCallback)
- **No external state management** (Redux, Zustand, etc.)

### Constraints
- **Browser-only** - No server, no backend
- **Offline-first** - All data stored locally
- **Privacy** - No data leaves device
- **Performance** - Must handle 500k+ readings smoothly

---

*Last updated: October 25, 2025 - 21:30 CET*  
*v2.2.1 stable, ready to plan v3.0*  
*All Phase 1-2 work complete, moving to architecture planning*
