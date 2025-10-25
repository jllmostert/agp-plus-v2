# Git Workflow Guide for AGP+ v3.0

**Purpose:** Working with two branches (main + v3.0-dev) simultaneously  
**Target:** Jo's first time using long-lived feature branches  
**Date:** October 25, 2025

---

## 🌳 BRANCH STRUCTURE

```
main (v2.2.1 stable)
  └─ v3.0-dev (experimental development)
```

**Mental Model:**
- `main` = Production-ready, users can rely on this
- `v3.0-dev` = Laboratory for breaking changes

---

## ✅ DAILY WORKFLOW

### Starting Your Day

```bash
# Check which branch you're on
git branch
# Output: * v3.0-dev  ← You're here

# Always pull latest changes first
git pull origin v3.0-dev
```

### Working on v3.0 Feature

```bash
# Make sure you're on v3.0-dev
git checkout v3.0-dev

# Edit files...
# Test in browser...

# Commit your work
git add src/storage/masterDatasetStorage.js
git commit -m "feat: implement month-bucketing storage"
git push origin v3.0-dev
```

---

## 🐛 HANDLING v2.x BUGFIXES

**Scenario:** Working on v3.0, user reports v2.2.1 bug

```bash
# STEP 1: Save your v3.0 work
git stash save "WIP: working on incremental storage"

# STEP 2: Switch to stable branch
git checkout main

# STEP 3: Fix the bug
# Edit the file...
git add src/components/DayProfileCard.jsx
git commit -m "fix: day profile modal click handler"

# STEP 4: Push v2.2.2 patch
git push origin main

# STEP 5: Bring bugfix into v3.0-dev
git checkout v3.0-dev
git merge main

# STEP 6: Resume v3.0 work
git stash pop
```

---

## 🔄 KEEPING v3.0-dev IN SYNC

**Run weekly (even if main hasn't changed):**

```bash
git checkout v3.0-dev
git merge main
git push origin v3.0-dev
```

**Why:** Reduces merge conflicts, keeps v3.0 up to date.

---

## 🚨 "OH NO" RECOVERY

### Wrong Branch Commit

```bash
# You committed to main but meant v3.0-dev

# STEP 1: Undo commit (keep changes)
git reset --soft HEAD~1

# STEP 2: Switch to correct branch
git checkout v3.0-dev

# STEP 3: Commit again
git add .
git commit -m "Your commit message"
```

### Need to Switch But Have Changes

```bash
# Option A: Stash it
git stash
git checkout other-branch
# Later: git stash pop

# Option B: Commit WIP
git add .
git commit -m "WIP: incomplete work"
# Later: git reset --soft HEAD~1
```

---

## 🎯 MERGE vs REBASE

**For AGP+ v3.0: ALWAYS use `git merge`**

```bash
# Good (simple, safe)
git checkout v3.0-dev
git merge main

# Avoid (complex, risky)
git rebase main
```

**Why merge wins:**
- Preserves history
- Safer for beginners
- Can't accidentally rewrite pushed commits

---

## 📝 COMMIT MESSAGE STYLE

```bash
# Feature
git commit -m "feat: add month-bucketing storage"

# Bugfix
git commit -m "fix: deduplication logic for overlapping timestamps"

# Documentation
git commit -m "docs: add v3.0 architecture guide"

# Test
git commit -m "test: add unit tests for append algorithm"
```

---

## 🔍 SAFETY CHECKS

**Before committing:**

```bash
# 1. Which branch?
git branch

# 2. What changed?
git status

# 3. See exact changes
git diff
```

---

## 🚀 WHEN v3.0 IS READY

```bash
# STEP 1: Make sure v3.0-dev is clean
git checkout v3.0-dev
git status  # Should be clean

# STEP 2: Merge one last time from main
git merge main

# STEP 3: Switch to main
git checkout main

# STEP 4: Merge v3.0-dev into main
git merge v3.0-dev

# STEP 5: Tag the release
git tag v3.0.0
git push origin main --tags

# STEP 6: Delete v3.0-dev (optional)
git branch -d v3.0-dev
git push origin --delete v3.0-dev
```

---

## 💡 PRO TIPS

### Add Branch to Terminal Prompt

Add to `~/.zshrc`:

```bash
parse_git_branch() {
  git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/'
}
PS1='%F{cyan}%~%f %F{yellow}$(parse_git_branch)%f $ '
```

Now: `~/Projects/agp-plus (v3.0-dev) $`

### Check Log

```bash
# See recent commits
git log --oneline -10

# See branch differences
git log main..v3.0-dev --oneline
```

---

## 📋 QUICK REFERENCE

| Task | Command |
|------|---------|
| Check branch | `git branch` |
| Switch branch | `git checkout <branch>` |
| Stash changes | `git stash` |
| Restore stash | `git stash pop` |
| Merge main → v3.0 | `git merge main` |
| Undo last commit | `git reset --soft HEAD~1` |
| See status | `git status` |

---

**Remember:** When in doubt, `git status` tells you everything!
