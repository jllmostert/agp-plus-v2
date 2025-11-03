# 🧭 AGP+ - START HERE

**Version**: v3.7.0 → v4.0 (Option C Development)  
**Branch**: develop (active development)  
**Last Update**: 2025-11-03  
**Purpose**: Central navigation hub

---

## 🎯 IMMEDIATE ACTION

**Want to start work right now?**
```bash
# 1. What's the current sprint?
cat PROGRESS.md | grep "Current Sprint"

# 2. Read general workflow
cat HANDOFF.md

# 3. Go to sprint docs
cd docs/optionc/[block]/[sprint]/
cat HANDOFF.md  # Sprint context
cat PROGRESS.md # Current task status

# 4. Start working
npm run dev
```

---

## 📚 CORE DOCUMENTATION (Tier 1)

**Read these for ANY work**:

| File | Purpose | When to Read |
|------|---------|-------------|
| **HANDOFF.md** | General workflow + best practices | Start of every session |
| **PROGRESS.md** | Session log + current sprint pointer | Every session, update constantly |
| **STATUS.md** | Project status (what works/doesn't) | Weekly or when stuck |
| **CHANGELOG.md** | Version history | When releasing |
| **DocumentHygiene.md** | Tier system + doc structure | When organizing docs |

---

## 🗂️ DOCUMENTATION STRUCTURE

### Tier 1: Operational (Root)
- START_HERE.md (this file)
- HANDOFF.md (general workflow)
- PROGRESS.md (session log)
- STATUS.md (project status)
- CHANGELOG.md (version history)
- DocumentHygiene.md (tier system)

### Tier 2: Planning (docs/optionc/)
- Option C master plan
- Block-specific docs
- Sprint-specific HANDOFF.md + PROGRESS.md

### Tier 3: Reference (reference/)
- metric_definitions.md
- minimed_780g_ref.md
- Other stable reference docs

**See**: DocumentHygiene.md for complete tier system

---

## 🏗️ OPTION C DEVELOPMENT

**Master Hub**: `docs/optionc/START_HERE.md`

**Structure**:
```
docs/optionc/
├── START_HERE.md          ← Option C navigation
├── MASTER_PROGRESS.md     ← All blocks tracking
├── block-a-docs/          ← Documentation (5h)
├── block-b-safety/        ← Safety features (15h)
├── block-c-robustness/    ← Parser + metrics (15h)
└── block-d-quality/       ← Code quality (35h)
    └── sprint-c1-components/  ← Example sprint
        ├── HANDOFF.md
        ├── PROGRESS.md
        └── [other docs]
```

**Current Sprint**: See PROGRESS.md

---

## ⚡ QUICK COMMANDS

### Session Start
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git pull origin develop
cat HANDOFF.md              # Read workflow
cat PROGRESS.md             # Check current sprint
npm run dev                 # Start server (localhost:5173)
```

### During Work
```bash
# After EVERY significant change:
# 1. Test in browser
# 2. Update sprint PROGRESS.md
# 3. Commit

git add .
git commit -m "feat(component): [what you did]"
```

### Session End
```bash
git push origin develop
# Update root PROGRESS.md with session summary
```

---

## 🔒 BRANCH STATUS

**Current**:
- `develop` - Active work (v3.7.0 progress, stable)
- `main` - Production (v3.6.0, older but safe)

**Planned** (needs manual action):
- Promote `develop` → `main` when ready
- Rename current `main` → `safety-v3.6.0`

**See**: HANDOFF.md "Branch Situation" section

---

## 🆘 COMMON TASKS

### "I'm starting a new session"
```bash
cat HANDOFF.md  # Read workflow
cat PROGRESS.md # Check what's active
# Go to sprint folder and read sprint HANDOFF.md
```

### "I don't know what to work on"
```bash
cat PROGRESS.md              # Shows current sprint
cat docs/optionc/MASTER_PROGRESS.md  # Shows all sprints
```

### "I need reference info"
```bash
cat reference/metric_definitions.md     # Glucose metrics
cat reference/minimed_780g_ref.md       # Device specs
```

### "Something broke"
```bash
git log --oneline -10       # Recent changes
git diff                    # Uncommitted changes
cat docs/optionc/[sprint]/PROGRESS.md  # What was I doing?
```

---

## 📖 KEY PRINCIPLES

1. **PROGRESS.md is your lifeline** - Update constantly
2. **Small commits, frequent** - Every 30-60 min
3. **One file at a time** - Prevents crashes
4. **Test after every change** - Browser validation
5. **Follow DocumentHygiene** - Right tier, right file
6. **Read before code** - Sprint docs first

**See**: HANDOFF.md for complete best practices

---

## 🎯 SUCCESS METRICS

- [ ] Updated PROGRESS.md today
- [ ] Committed at least once
- [ ] Tested changes in browser
- [ ] Sprint on track (check sprint PROGRESS.md)

---

**Last Update**: 2025-11-03  
**Version**: 3.1 (Updated navigation)  
**Next**: Read HANDOFF.md for workflow, PROGRESS.md for current work
