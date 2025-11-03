# AGP+ DEVELOPMENT HANDOFF

**Version**: v3.7.0 (developing towards v4.0)  
**Branch**: develop (active development)  
**Last Update**: 2025-11-03  
**Purpose**: General development workflow, health practices, and context management

---

## 🎯 QUICK START

```bash
# 1. Navigate + sync
cd /Users/jomostert/Documents/Projects/agp-plus
git pull origin develop

# 2. Check what you're working on
cat START_HERE.md  # Navigation hub
cat PROGRESS.md    # Recent work + current sprint

# 3. Start server (ALWAYS use port 3001)
export PATH="/opt/homebrew/bin:$PATH"
npm run dev  # Automatically uses port 3001
# Opens: http://localhost:3001

# Or use explicit port:
npx vite --port 3001

# Or use alias (if configured):
3001

# 4. Work safely
# - Read sprint-specific HANDOFF.md in docs/optionc/[block]/[sprint]/
# - Update PROGRESS.md after EVERY significant change
# - Commit frequently (every 30-60 min)
# - Test in browser after EVERY file change
```

---

## 🔌 PORT MANAGEMENT (CRITICAL)

**ALWAYS use port 3001** - Never use other ports (like 5173)

### Quick Start with Port 3001
```bash
# Standard start command
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### Alias "3001" (Recommended Setup)
You can create an alias that always kills port 3001 and restarts the server:

```bash
# Add to ~/.zshrc or ~/.bashrc:
alias 3001='lsof -ti:3001 | xargs kill -9 2>/dev/null; cd /Users/jomostert/Documents/Projects/agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001'
```

**Then just use**:
```bash
3001  # Kills any process on 3001 and starts server
```

### Manual Port Management
```bash
# Check what's on port 3001
lsof -i:3001

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill all node processes (nuclear option)
pkill -9 node

# Then start server
npx vite --port 3001
```

### Why Port 3001?
- **Consistency**: Always the same URL across sessions
- **Alias support**: Easy `3001` command to restart
- **No conflicts**: Avoids Vite's default 5173
- **Memory aid**: Easy to remember

---

## 📚 DOCUMENTATION STRUCTURE

### Core Root Files (Read These)

| File | Purpose | Update Frequency |
|------|---------|------------------|
| **START_HERE.md** | Navigation hub - find anything | Weekly |
| **HANDOFF.md** (this file) | Development workflow + best practices | As needed |
| **PROGRESS.md** | Session log, tracks what you did | **EVERY SESSION** |
| **STATUS.md** | High-level project status, what works | Weekly |
| **CHANGELOG.md** | Formal version history, releases | Per version |

### Documentation Tiers (DocumentHygiene.md)

- **Tier 1**: Operational (START_HERE, HANDOFF, PROGRESS) - Update daily
- **Tier 2**: Planning (STATUS, sprint docs) - Update weekly  
- **Tier 3**: Reference (metric_definitions, device specs) - Rarely update

**See**: `DocumentHygiene.md` for complete tier system

### Sprint-Specific Docs

Each sprint has its own folder in `docs/optionc/[block]/[sprint]/`:
- **HANDOFF.md** - Sprint context, goals, files
- **PROGRESS.md** - Real-time task tracking (**UPDATE THIS CONSTANTLY**)
- Supporting docs (strategies, analyses)

**Golden Rule**: Sprint PROGRESS.md = source of truth for that sprint

---

## 🏗️ CURRENT PROJECT STATE

### Branch Situation (IMPORTANT)

**Current Reality**:
- `main` branch: Production-ready but older (v3.6.0)
- `develop` branch: Active work, stable, working well (v3.7.0 progress)

**Planned Change** (needs manual action):
```bash
# When ready to promote develop → main:
git checkout main
git merge develop
git push origin main

# Then rename current main → safety:
git branch -m main safety-v3.6.0
git push origin safety-v3.6.0
git push origin :main  # Delete old main remotely
```

**Why**: develop is now more stable than main. Main should reflect best working version.

### Active Sprint

**See**: `PROGRESS.md` for current sprint details

**Quick Check**:
```bash
# Find current sprint
cat PROGRESS.md | grep "Current Sprint"

# Go to sprint folder
cd docs/optionc/[block]/[sprint]/

# Read sprint HANDOFF
cat HANDOFF.md
```

---

## ⚠️ CONTEXT OVERFLOW PREVENTION

### The Problem
Claude (and all LLMs) have a token limit. If you feed too much context (large files, chat history, multiple files at once), you get crashes or unpredictable truncation.

### The Solution: Token Budget Discipline

#### 1. One File At A Time (NON-NEGOTIABLE)
```bash
# ❌ WRONG: Paste 5 files and ask "refactor everything"
# ✅ RIGHT: Work on ONE file per turn

# Example workflow:
# Turn 1: "Extract ModalManager from AGPGenerator (lines 100-300 only)"
# Turn 2: "Now extract DataLoadingContainer (lines 301-500 only)"
# Turn 3: "Test and integrate both containers"
```

**Why**: Small, focused changes = reviewable, testable, safe.

#### 2. Use References, Not Full Text
```bash
# ❌ WRONG: Paste entire 1000-line file
# ✅ RIGHT: "In AGPGenerator.jsx, extract the modal section (lines 100-300)"

# ❌ WRONG: Paste metric_definitions.md repeatedly
# ✅ RIGHT: "See metric_definitions.md section 2.1 (MAGE) for formula"
```

**Strategy**: After first paste, refer to docs by name + section.

#### 3. Strip Comments + Test Data
```bash
# Before pasting code, remove:
# - Comments (unless critical)
# - Console.log statements  
# - Test fixtures
# - Repeated helper functions

# Replace with: "Assume helper functions x(), y(), z() are in scope"
```

#### 4. Hard Budget in Prompts
```bash
# Add this to requests:
"You have 2,000 tokens max for reasoning + output. 
If task exceeds budget, stop and ask me to narrow scope."
```

Claude doesn't count tokens perfectly, but respects the instruction to stop.

#### 5. Request Minimal Outputs
```bash
# ❌ WRONG: "Refactor this and explain everything"
# ✅ RIGHT: "Return only a unified diff. No explanations."

# OR: "Return only the new code block. Nothing else."
```

Choose one output format, not narrative + code.

#### 6. Rolling Context Governor
Before each turn, paste a tiny recap YOU wrote:

```
Context Governor:
- Repo: agp-plus
- Task: Extract ModalManager from AGPGenerator
- Constraints: Keep public API, no visual changes
- Files: AGPGenerator.jsx lines 100-300 only
- Deliverable: ModalManager.jsx + import diff
```

This replaces thousands of tokens of chat history with 5 lines.

#### 7. Never Include Binary/Large JSON
```bash
# ❌ WRONG: Paste 10,000-line sensor data JSON
# ✅ RIGHT: "Sensor data shape: { sensor_id, start_date, readings: Array<{glucose, timestamp}> }"
```

Summarize data structures, don't paste them.

#### 8. Work in 30-60 Minute Chunks
```bash
# Workflow:
# 1. Pick ONE small task (e.g., "extract one modal")
# 2. Do it (30 min max)
# 3. Test in browser
# 4. Update PROGRESS.md
# 5. Commit
# 6. Break or pick next small task
```

Small chunks = manageable, safe, less likely to overflow.

#### 9. Use edit_block, Not Append
```bash
# ❌ WRONG: mode='append' (can corrupt files)
# ✅ RIGHT: edit_block (surgical changes)

# edit_block example:
# old_string: "const handleClick = () => { ... }"
# new_string: "const handleClick = useCallback(() => { ... }, [deps])"
```

#### 10. Automate Hygiene (Scripts)
```bash
# Create helper scripts:
# clip:component - Strips file, copies to clipboard
# clip:diff - Shows git diff for one file

# Usage:
./clip:component AGPGenerator.jsx
# Then paste the stripped output
```

---

## 🔄 HEALTHY DEVELOPMENT WORKFLOW

### Session Start Checklist
```bash
# [ ] Pull latest
git pull origin develop

# [ ] Read current sprint HANDOFF
cat docs/optionc/[block]/[sprint]/HANDOFF.md

# [ ] Check PROGRESS
cat docs/optionc/[block]/[sprint]/PROGRESS.md

# [ ] Start dev server
npm run dev  # Uses port 3001

# [ ] Open browser
open http://localhost:3001
```

### During Work (CRITICAL)
```bash
# Every 30-60 minutes:

# [ ] Test change in browser
# [ ] Update sprint PROGRESS.md (real-time tracking)
# [ ] Commit to git
git add .
git commit -m "feat(component): [what you did]"

# Why? 
# - Prevents data loss on crash
# - Creates recovery points
# - Progress is documented even if you forget details later
```

### Session End Checklist
```bash
# [ ] Final commit
git add .
git commit -m "chore: end session [sprint] - [status]"

# [ ] Push to remote
git push origin develop

# [ ] Update root PROGRESS.md with session summary
# Add entry: "Session N: Date (Time spent)"

# [ ] Archive old handoffs if needed
mv HANDOFF_old.md docs/handoffs/YYYY-MM-DD.md
```

---

## 📝 HOW TO USE PROGRESS/STATUS/CHANGELOG

### PROGRESS.md (Root)
**Purpose**: Session log - what did you do, when, and what's next

**Update**: EVERY work session (add entry at top or bottom)

**Format**:
```markdown
### Session N: 2025-MM-DD (Duration)
**Done**:
- ✅ Completed task X
- ✅ Fixed bug Y
- ✅ Tested feature Z

**Git**: Commit hashes
**Next**: What to do next session
```

**Also Contains**: Pointer to current sprint (`Current Sprint: B1`) and link to sprint PROGRESS.md

---

### STATUS.md (Root)
**Purpose**: High-level project status - what works, what doesn't, architecture health

**Update**: Weekly or when features change status

**Contains**:
- ✅ What Works (production-ready features)
- ⚠️ Known Limitations (with fix priorities)
- 📊 Architecture Scores (health metrics)
- 🎯 Current Phase (Option C progress)

**Not For**: Day-to-day task tracking (use PROGRESS.md for that)

---

### CHANGELOG.md (Root)
**Purpose**: Formal version history for releases

**Update**: When you tag a version (e.g., v3.7.0, v4.0.0)

**Format**: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standard
```markdown
## [v3.7.0] - 2025-11-03
### Added
- Feature X
### Changed  
- Component Y refactored
### Fixed
- Bug Z resolved
```

**Not For**: Work-in-progress updates (use PROGRESS.md for WIP)

---

### Sprint PROGRESS.md (In docs/optionc/[block]/[sprint]/)
**Purpose**: Real-time tracking of sprint tasks

**Update**: **CONSTANTLY** - after every significant change

**Contains**:
- [ ] Task checkboxes (update as you complete)
- Time spent per task
- Current status
- Blockers/issues
- Next steps

**This is your recovery anchor**: If Claude crashes, this file tells you exactly where you were.

---

## 🎯 WORKING WITH SPRINTS

### Finding Your Current Sprint
```bash
# Quick check
cat PROGRESS.md | head -20

# Go to sprint folder
cd docs/optionc/$(cat PROGRESS.md | grep "Current Sprint" | cut -d: -f2 | xargs)
# (Manually navigate for now, or check PROGRESS.md for exact path)
```

### Sprint Workflow
```bash
# 1. Read sprint HANDOFF.md
cat HANDOFF.md

# 2. Check sprint PROGRESS.md  
cat PROGRESS.md

# 3. Pick ONE task

# 4. Work on it (30-60 min)

# 5. Update PROGRESS.md IMMEDIATELY
# Mark task progress, time spent, issues

# 6. Test in browser

# 7. Commit
git add .
git commit -m "feat(sprint): [task] - [what you did]"

# 8. Repeat or end session
```

---

## 🚨 RECOVERY FROM CRASH

### If Claude Crashes Mid-Work

**Don't panic**. Your progress is saved if you followed the workflow.

```bash
# 1. Check what was committed
git log --oneline -10

# 2. Check what wasn't committed
git status

# 3. Read sprint PROGRESS.md
cat docs/optionc/[block]/[sprint]/PROGRESS.md

# 4. Resume from last completed task
# Sprint PROGRESS.md shows exactly what was done and what's next

# 5. If work was lost (not committed):
git diff  # See what changed
# Decide: keep, discard, or redo
```

**Prevention**: Commit every 30-60 min. Update PROGRESS.md constantly.

---

## 🛠️ DEVELOPMENT TOOLS

### Desktop Commander (Primary)
- File operations: read_file, write_file, edit_block
- Search: start_search, get_more_search_results
- Process management: start_process, interact_with_process
- **Use liberally** for file operations

### Chrome Control (Test if stable)
```bash
# Test before using extensively:
# - Open browser tab
# - Execute simple JavaScript
# - If stable: use for testing/validation
# If unstable: stick to manual browser testing
```

### Control Your Mac (Test if stable)
```bash
# Test AppleScript capabilities:
# - Open applications
# - Navigate UI
# If stable: use for automation
# If unstable: do manually
```

---

## 📂 FILE LOCATIONS QUICK REFERENCE

```
agp-plus/
├── START_HERE.md          ← Navigation hub
├── HANDOFF.md            ← This file (general workflow)
├── PROGRESS.md           ← Session log
├── STATUS.md             ← Project status
├── CHANGELOG.md          ← Version history
├── DocumentHygiene.md    ← Tier system (ACTIVE, not archived)
│
├── docs/
│   ├── optionc/          ← Option C implementation
│   │   ├── START_HERE.md
│   │   ├── MASTER_PROGRESS.md
│   │   ├── block-a-docs/
│   │   ├── block-b-safety/
│   │   ├── block-c-robustness/
│   │   └── block-d-quality/
│   │       └── sprint-c1-components/  ← Example sprint
│   │           ├── HANDOFF.md
│   │           ├── PROGRESS.md
│   │           └── [other docs]
│   │
│   ├── archive/          ← Old docs
│   └── handoffs/         ← Old session handoffs
│
├── src/                  ← Application code
├── reference/            ← Stable reference docs (Tier 3)
└── project/              ← Project planning (Tier 2)
```

---

## 🔍 COMMON TASKS

### Starting New Sprint
```bash
# 1. Check which sprint is next
cat docs/optionc/MASTER_PROGRESS.md

# 2. Navigate to sprint folder
cd docs/optionc/[block]/[sprint]/

# 3. Read HANDOFF.md
cat HANDOFF.md

# 4. Update root PROGRESS.md
# Change "Current Sprint: X" to new sprint

# 5. Begin work
# Follow sprint HANDOFF.md instructions
```

### Debugging Something
```bash
# 1. Read relevant reference docs
cat reference/[relevant-doc].md

# 2. Check recent changes
git log --oneline --all --graph -20

# 3. Look at sprint PROGRESS.md for context
cat docs/optionc/[block]/[sprint]/PROGRESS.md

# 4. Use DC tools to investigate
# start_search, read_file, etc.

# 5. Document findings
# Update sprint PROGRESS.md with issue + resolution
```

### Adding New Feature
```bash
# 1. Check if sprint already exists
ls docs/optionc/

# 2. If new sprint needed, create structure:
docs/optionc/[block]/[sprint]/
├── HANDOFF.md
├── PROGRESS.md
└── [other docs]

# 3. Update MASTER_PROGRESS.md
# 4. Update root PROGRESS.md (current sprint pointer)
# 5. Begin work (follow sprint workflow)
```

---

## 🎓 LESSONS LEARNED

### What Works ✅
- **Small, focused extractions** (one component at a time)
- **Testing after every change** (catches issues early)
- **Frequent commits** (safety net, easy rollback)
- **Real-time PROGRESS.md updates** (recovery anchor)
- **edit_block for code** (surgical, safe changes)
- **React portals for modals** (clean separation)

### What Doesn't Work ❌
- **File append operations** (corrupts files)
- **Large refactors in one go** (context overflow, crash risk)
- **Ambitious line count targets** (unrealistic, demotivating)
- **Pasting multiple large files** (token overflow)
- **Working for hours without committing** (data loss risk)
- **Ignoring PROGRESS.md** (lose context on crash)

### Best Practices
1. **Work in 30-60 min chunks**
2. **One file at a time** (context management)
3. **Test in browser after EVERY change**
4. **Update PROGRESS.md in real-time**
5. **Commit every 30-60 min**
6. **Use edit_block, not append**
7. **Read sprint docs before starting**
8. **Follow DocumentHygiene tier system**

---

## 🆘 WHEN THINGS GO WRONG

### "I don't know what I was working on"
```bash
# Check commits
git log --oneline -10

# Read sprint PROGRESS.md
cat docs/optionc/[current-sprint]/PROGRESS.md

# Read root PROGRESS.md
cat PROGRESS.md

# Last resort: search for TODOs
grep -r "TODO" src/
```

### "File got corrupted"
```bash
# Check what changed
git diff [filename]

# Restore from last commit
git checkout HEAD -- [filename]

# Or restore from specific commit
git checkout [commit-hash] -- [filename]
```

### "I broke something and don't know what"
```bash
# See recent changes
git log --oneline --all --graph -20

# Roll back to last working commit
git reset --hard [commit-hash]

# Or roll back one commit
git reset --hard HEAD~1

# Check safety checkpoint
git checkout v3.6.0-pre-optionc
# (Test if this works)
# Then return: git checkout develop
```

### "Claude keeps crashing"
**You're probably exceeding token limits.**

1. **Stop pasting large files** (use references instead)
2. **Work on smaller chunks** (one function, not whole file)
3. **Strip comments/tests** before pasting code
4. **Use rolling context governor** (recap in 5 lines)
5. **Request minimal output** (diff or code, not both)

See "Context Overflow Prevention" section above.

---

## 🎯 SUCCESS METRICS

### Daily
- [ ] Committed at least once
- [ ] Updated sprint PROGRESS.md
- [ ] Tested changes in browser
- [ ] No data loss

### Weekly
- [ ] Updated root PROGRESS.md with session summaries
- [ ] Updated STATUS.md if features changed
- [ ] Sprint on track (check MASTER_PROGRESS.md)
- [ ] Archived old handoffs

### Per Sprint
- [ ] All tasks completed (checked in sprint PROGRESS.md)
- [ ] Tests pass (manual + automated)
- [ ] Documentation updated
- [ ] Git tagged (version bump)
- [ ] CHANGELOG.md updated

---

## 📌 REMINDERS

1. **PROGRESS.md is your lifeline** - Update it constantly
2. **Small commits, frequent** - Every 30-60 min
3. **One file at a time** - Prevents context overflow
4. **Test after every change** - Catches bugs early
5. **Read before you code** - Sprint HANDOFF.md + PROGRESS.md
6. **DocumentHygiene is active** - Follow tier system
7. **develop branch is truth** - Not main (yet)
8. **Recovery is easy** - If you committed + updated PROGRESS.md

---

## 🚀 GETTING STARTED RIGHT NOW

**If you're reading this and want to start work:**

```bash
# 1. What am I working on?
cat PROGRESS.md | grep "Current Sprint"

# 2. Go to sprint folder
cd docs/optionc/[block from step 1]/[sprint from step 1]/

# 3. Read context
cat HANDOFF.md
cat PROGRESS.md

# 4. Start server
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npm run dev  # Uses port 3001

# 5. Open browser
open http://localhost:3001

# 6. Pick ONE small task from PROGRESS.md

# 7. Do it (30-60 min)

# 8. Test, update PROGRESS.md, commit

# 9. Repeat or end session
```

---

**Philosophy**: "Small changes, tested often, documented always, committed frequently."

**Remember**: Progress over perfection. Safety over speed. Context management over everything.

---

**Last Update**: 2025-11-03  
**Version**: 2.0 (General Development Workflow)  
**Status**: ACTIVE
