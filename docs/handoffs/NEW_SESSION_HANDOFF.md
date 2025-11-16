# 🤖 NEW SESSION HANDOFF - Technical Instructions for AI

**Purpose**: Complete context for starting a new AGP+ development session  
**Date**: 2025-11-16  
**Current State**: Phase 3 Complete, v4.4.0 in development  
**Branch**: feature/context-api-phase1

---

## 🎯 CRITICAL RULES - READ FIRST

### 1. Desktop Commander Usage (MANDATORY)

**ALL file operations MUST use Desktop Commander tools**:
```bash
# ❌ NEVER use bash cat, vim, nano, or any text editors
# ✅ ALWAYS use Desktop Commander tools

# Read files:
DC: read_file /path/to/file.js

# Edit files:
DC: edit_block file_path="/path" old_string="..." new_string="..."

# Create files:
DC: write_file path="/path" content="..." mode="rewrite"

# Search:
DC: start_search path="/path" pattern="..." searchType="content"

# List directory:
DC: list_directory path="/path" depth=2
```

**Why?**: Desktop Commander prevents corruption, creates backups, handles large files correctly.

### 2. Progress Tracking (MANDATORY)

**Update PROGRESS.md FREQUENTLY** (every 30-60 minutes or after each major task):
```bash
# Read last session first:
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md offset=-100

# Update with current work:
DC: edit_block file_path="/Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md" ...
```

**Why?**: PROGRESS.md is the source of truth. Prevents context loss during crashes.

### 3. Git Workflow (MANDATORY)

**Always work on feature branch, commit frequently**:
```bash
# Check current branch:
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && git status" timeout_ms=5000

# Current branch: feature/context-api-phase1

# Commit after each completed task:
git add -A
git commit -m "feat: descriptive message"
git push origin feature/context-api-phase1

# NEVER commit to main directly
```

**Why?**: Jo needs stable main branch, feature branches allow experimentation.

### 4. Server Management

**Starting the dev server**:
```bash
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && export PATH=\"/opt/homebrew/bin:\$PATH\" && npx vite --port 3001" timeout_ms=15000

# Note: Port 3001 is default, but may use 3002-3004 if occupied
# Always include PATH export for Homebrew on macOS
```

---

## 📚 TIER 2 DOCUMENTATION HIERARCHY

When Jo asks questions, refer to these documents IN ORDER:

### 1. Operational Docs (Check FIRST)
**Location**: `docs/handoffs/`

- **PROGRESS.md** - Session history, current work (READ THIS FIRST!)
- **SESSION_35_HANDOFF_MENSENTAAL.md** - Plain language summary for Jo
- **REFACTORING_STATUS_OVERZICHT.md** - Complete track status

### 2. Strategic Docs (For planning)
**Location**: `docs/project/`

- **PROJECT_BRIEFING.md** - Overall project vision, architecture
- **REFACTOR_MASTER_PLAN.md** - Complete refactoring roadmap
- **STATUS.md** - Current version features/limitations

### 3. Reference Docs (For implementation)
**Location**: `docs/project/` and `/mnt/project/`

- **metric_definitions.md** - All glucose metric calculations
- **minimed_780g_ref.md** - MiniMed 780G pump specifications
- **DUAL_STORAGE_ANALYSIS.md** - V2/V3 storage architecture

### 4. Track-Specific Docs
**Location**: `docs/handoffs/track3-q1/`

- **PHASE3_QUICK_START.md** - Phase 3 quick reference
- **PHASE3_CHECKLIST.md** - Phase 3 task list
- **SESSION_35_HANDOFF.md** - Technical Phase 3 handoff

---

## 🗺️ CURRENT REFACTORING STATUS

### Track 3: Code Quality - Context API Refactoring

**Overall Progress**: 75% complete (3 of 4 phases done)

#### ✅ Phase 1: DataContext (COMPLETE)
- **Status**: 100% working
- **Files**: `src/contexts/DataContext.jsx`, `src/hooks/useData.js`
- **Provides**: csvData, activeReadings, fullDatasetRange, tddByDay, dataStatus

#### ✅ Phase 2: PeriodContext (COMPLETE)
- **Status**: 100% working
- **Files**: `src/contexts/PeriodContext.jsx`, `src/hooks/usePeriod.js`
- **Provides**: startDate, endDate, period selection handlers

#### ✅ Phase 3: MetricsContext (COMPLETE - Session 35)
- **Status**: 100% working
- **Files**: `src/contexts/MetricsContext.jsx`, `src/hooks/useMetricsContext.js`
- **Provides**: metricsResult, comparisonData, dayProfiles, tddData
- **Session**: 35 (Nov 16, 2025)
- **Bugs Fixed**: 5 refactoring issues
- **Commits**: 20f192d, 1fb4121

#### ⬜ Phase 4: Optional Further Refactoring
- **Status**: Not started (may skip)
- **Decision**: App works well, further refactoring optional

### Other Tracks

**Track 1: Documentation** - Not started (0%)  
**Track 2: Safety & Accessibility** - Not started (0%)  
**Track 4: Medical Accuracy** - Not started (0%)

---

## 🏗️ CURRENT ARCHITECTURE

### Component Hierarchy
```
DataProvider (data: csvData, activeReadings, fullDatasetRange, dateRange, tddByDay)
  └─ AGPGenerator (orchestration)
      └─ PeriodProvider (period: startDate, endDate, handlers)
          └─ MetricsProvider (metrics: metricsResult, comparisonData, dayProfiles, tddData)
              └─ AGPGeneratorContent (rendering)
```

### Storage Architecture
- **V3 Mode** (current): IndexedDB for glucose data, sensors, events
- **V2 Mode** (legacy): localStorage (backwards compatible)
- **Dual Storage**: Supports both, prefers V3

### Key Files
```
src/
  contexts/
    DataContext.jsx      - Data management (V2/V3)
    PeriodContext.jsx    - Period selection
    MetricsContext.jsx   - Metrics calculation
  hooks/
    useData.js           - Data context consumer
    usePeriod.js         - Period context consumer
    useMetricsContext.js - Metrics context consumer
    useMetrics.js        - Glucose metrics calculation
    useComparison.js     - Comparison period logic
    useDayProfiles.js    - Day profiles generation
  components/
    AGPGenerator.jsx     - Main orchestrator (1692 lines, down from 2200)
```

---

## 🔧 COMMON TASKS

### Task 1: Reading Session History
```bash
# Always start here:
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md offset=-100

# Read specific session:
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md offset=0 length=150
```

### Task 2: Checking Current State
```bash
# Check which files changed:
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && git status" timeout_ms=5000

# Check current branch:
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && git branch" timeout_ms=5000

# Check recent commits:
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && git log --oneline -5" timeout_ms=5000
```

### Task 3: Finding Code
```bash
# Search for function:
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus/src" pattern="functionName" searchType="content"

# Search for file:
DC: start_search path="/Users/jomostert/Documents/Projects/agp-plus/src" pattern="*.jsx" searchType="files"

# List directory structure:
DC: list_directory path="/Users/jomostert/Documents/Projects/agp-plus/src" depth=2
```

### Task 4: Making Changes
```bash
# 1. Read file first:
DC: read_file /path/to/file.jsx length=50

# 2. Edit specific section:
DC: edit_block file_path="/path/to/file.jsx" old_string="exact text" new_string="new text"

# 3. Verify change:
DC: read_file /path/to/file.jsx offset=<line_number> length=20

# 4. Test in browser (start server if needed)

# 5. Update PROGRESS.md with what you did

# 6. Commit:
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && git add -A && git commit -m 'feat: description' && git push origin feature/context-api-phase1" timeout_ms=10000
```

### Task 5: Debugging
```bash
# Add console.log:
DC: edit_block file_path="/path/to/file.jsx" 
  old_string="function myFunction() {"
  new_string="function myFunction() {\n  console.log('[DEBUG] myFunction called');"

# Check browser console output (Jo will provide)

# Remove debug logs when done:
DC: edit_block file_path="/path/to/file.jsx"
  old_string="console.log('[DEBUG] myFunction called');\n"
  new_string=""
```

---

## ⚠️ CRITICAL ISSUES TO AVOID

### 1. V2/V3 Storage Compatibility
**Problem**: Code must work with both localStorage (V2) and IndexedDB (V3)

**Solution**: Always check both sources:
```javascript
// ❌ Bad:
const dateRange = data.dateRange;

// ✅ Good:
const dateRange = data.fullDatasetRange || data.dateRange;
```

**Reference**: See `DUAL_STORAGE_ANALYSIS.md`

### 2. Missing State Setters
**Problem**: Context may export state but not setter

**Solution**: Always export both:
```javascript
// In context:
const value = {
  myState,
  setMyState, // ← Don't forget this!
};
```

**Recent Example**: `setV3UploadError` missing (fixed in Session 35)

### 3. Duplicate Imports
**Problem**: Refactoring can leave duplicate imports

**Solution**: Check imports carefully:
```javascript
// ❌ Bad:
import { useState } from 'react';
import { useState, useEffect } from 'react';

// ✅ Good:
import { useState, useEffect } from 'react';
```

**Recent Example**: Fixed 2 files in Session 35

### 4. Wrong dateRange Source
**Problem**: useDayProfiles needs full CSV range, not selected period

**Solution**: Use fullDatasetRange for day profiles:
```javascript
// ❌ Bad:
useDayProfiles(data, safeDateRange, ...)

// ✅ Good:
useDayProfiles(data, fullDatasetRange || dateRange, ...)
```

**Recent Example**: Fixed in Session 35

---

## 📊 WHAT WORKS NOW (All Features Verified)

### ✅ Data Management
- CSV import (Medtronic CareLink exports)
- IndexedDB storage (V3 mode)
- localStorage storage (V2 mode)
- Sensor tracking
- Stock management
- Event detection

### ✅ Metrics Calculations
- TIR/TAR/TBR (Time in Ranges)
- GMI (Glucose Management Indicator)
- CV (Coefficient of Variation)
- MAGE (Mean Amplitude of Glycemic Excursions)
- MODD (Mean of Daily Differences)
- TDD (Total Daily Dose) statistics

### ✅ Visualizations
- Ambulatory Glucose Profile (AGP)
- Day profiles (7 or 14 days)
- TIR bar charts
- Fullscreen mode
- Comparison periods

### ✅ Export
- JSON database export
- HTML AGP profile export
- HTML day profiles export
- Sensor export

---

## 🎯 RECOMMENDED NEXT STEPS

### Option A: Track 4 - MiniMed 780G Settings UI (Recommended)
**Why**: Most practical for Jo's use case  
**What**: UI to configure pump settings (ISF, CR, AIT, Target)  
**Time**: ~12 hours  
**Reference**: `minimed_780g_ref.md`  
**Start**: Read `docs/handoffs/REFACTORING_STATUS_OVERZICHT.md`

### Option B: Track 2 - Backup & Restore
**Why**: Data safety  
**What**: Automatic backups, restore functionality  
**Time**: ~10 hours

### Option C: Track 2 - Accessibility
**Why**: ARIA labels, screen reader support  
**What**: Chart accessibility improvements  
**Time**: ~5 hours

### Option D: Continue Using App
**Why**: Everything works perfectly as-is  
**What**: No development needed

---

## 🚨 SESSION START CHECKLIST

Before doing ANY work, complete this checklist:

- [ ] Read PROGRESS.md last 100 lines
- [ ] Check git status and current branch
- [ ] Verify on `feature/context-api-phase1` branch
- [ ] Read relevant track documentation
- [ ] Start dev server (port 3001)
- [ ] Ask Jo what he wants to work on
- [ ] Create plan BEFORE coding
- [ ] Get Jo's approval on plan
- [ ] Make small changes, test frequently
- [ ] Update PROGRESS.md every 30-60 minutes
- [ ] Commit every completed task
- [ ] Push to GitHub at end of session

---

## 💬 COMMUNICATION WITH JO

### When Jo Asks "Continue from last session"
```markdown
I'll start by reading the last session to understand where we left off.

[Read PROGRESS.md last 100 lines]
[Read relevant session handoff if exists]
[Summarize current state]
[Ask what Jo wants to work on next]
```

### When Jo Reports a Bug
```markdown
I'll help debug this. Let me:
1. Reproduce the issue (ask for console output)
2. Check recent changes in PROGRESS.md
3. Search for related code
4. Identify root cause
5. Propose fix
6. Implement after approval
7. Test thoroughly
8. Document fix in PROGRESS.md
```

### When Jo Wants New Feature
```markdown
Let me check if this is already planned:
1. Read REFACTOR_MASTER_PLAN.md
2. Read REFACTORING_STATUS_OVERZICHT.md
3. Check if feature fits existing track
4. Propose implementation approach
5. Get approval before starting
6. Break into small tasks
7. Implement incrementally
8. Test each step
9. Document in PROGRESS.md
```

---

## 📝 DOCUMENTATION DISCIPLINE

### PROGRESS.md Updates
**Frequency**: Every 30-60 minutes OR after each major task

**Format**:
```markdown
## 🚧 SESSION XX - [Task Name] (YYYY-MM-DD)

**Status**: 🚧 IN PROGRESS / ✅ COMPLETE
**Duration**: ~XX minutes
**Sprint**: Track X, Sprint XX

### Summary
[What are you doing]

### Issues Found
[Problems encountered]

### Issues Fixed
[Solutions applied]

### Status
- [x] Completed task 1
- [ ] Todo task 2
```

### Commit Messages
**Format**:
```
<type>: <short description>

<detailed description>

<impact/notes>
```

**Types**: feat, fix, docs, refactor, test, chore

**Example**:
```
feat: Add MiniMed 780G ISF configuration UI

- Create Settings panel in UI
- Add ISF configuration per time block
- Save to localStorage
- Display current ISF in chart overlay

Closes #123
```

---

## 🎓 LESSONS FROM SESSION 35

1. **Always check V2/V3 compatibility** when working with storage
2. **Export state AND setters** from contexts
3. **Check for duplicate imports** after refactoring
4. **Use fullDatasetRange for day profiles**, not safeDateRange
5. **Test thoroughly** after each change
6. **Update PROGRESS.md frequently** to prevent context loss
7. **Commit often** (every completed task)
8. **Debug logging is your friend** - add, fix, remove

---

## 🔗 QUICK LINKS

**Project Root**: `/Users/jomostert/Documents/Projects/agp-plus`

**Key Directories**:
- `/src` - Source code
- `/docs/handoffs` - Session handoffs, PROGRESS.md
- `/docs/project` - Strategic docs
- `/docs/handoffs/track3-q1` - Track 3 specific docs

**Branch**: `feature/context-api-phase1`  
**Remote**: `github.com:jllmostert/agp-plus-v2.git`

**Dev Server**: Port 3001 (or 3002-3004 if occupied)  
**Test Data**: `/test-data/Jo Mostert 16-11-2025_14d.csv`

---

## ✅ SESSION END CHECKLIST

Before ending session:

- [ ] Update PROGRESS.md with complete session summary
- [ ] Mark session as COMPLETE in PROGRESS.md
- [ ] Commit all changes
- [ ] Push to GitHub
- [ ] Create handoff doc if session was complex
- [ ] Verify all features still work
- [ ] No uncommitted changes left

---

**Version**: 1.0  
**Last Updated**: 2025-11-16  
**Session**: 35  
**Status**: Phase 3 Complete, Ready for Track 4 or Track 2

**Remember**: PROGRESS.md is the source of truth. Read it first, update it often! 📖
