# Git Workflow Cheatsheet - AGP+ v4.0

**Quick Reference**: Voor dagelijks werk op AGP+ develop branch  
**Option C**: Development workflow met safety checkpoints

---

## ⚡ OPTION C WORKFLOW (DEVELOP BRANCH)

### You're Always on Develop Branch
```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Check you're on develop
git branch  # Should show: * develop

# Start work
git pull origin develop
git status
```

### During Sprint Work
```bash
# Commit often (small chunks!)
git add .
git commit -m "test(metrics): Add MAGE calculation tests"
git push origin develop

# Every 30-60 min: commit + push
```

---

## 🛟 SAFETY CHECKPOINTS

### Available Safety Tags
```bash
# View all safety points
git tag -l

# Key tags:
v3.6.0-pre-optionc   # Before Option C start (2025-11-02)
v3.6.0               # Stable v3.6.0 release
v3.5.0               # Previous stable
```

### Go Back to Safe Version
```bash
# Method 1: Look at safe version (read-only)
git checkout v3.6.0-pre-optionc
# Browse code, test app
# Return: git checkout develop

# Method 2: Reset develop to safe version (DESTRUCTIVE!)
git checkout develop
git reset --hard v3.6.0-pre-optionc
git push origin develop --force  # ⚠️ Use with caution!
```

### Create New Safety Checkpoint
```bash
# After completing a sprint/block
git tag -a v3.7.0-sprint-b1 -m "Sprint B1 complete: Metrics validated"
git push origin v3.7.0-sprint-b1
```

---

## 🚀 DAILY WORKFLOW

### Start Session
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git status                        # Check current state
git pull origin develop           # Get latest changes
```

### During Work
```bash
# Check what changed
git status
git diff [filename]

# Stage specific files
git add [filename]

# Stage all changes
git add -A

# Commit with good message
git commit -m "feat(sprint-b1): Add performance benchmarks"

# Push to GitHub
git push origin develop
```

### End Session
```bash
git add -A
git commit -m "chore: End of session, progress saved"
git push origin develop
```

---

## 🚨 EMERGENCY PROCEDURES

### Undo Uncommitted Changes
```bash
# Discard ALL uncommitted changes (NUCLEAR!)
git reset --hard HEAD

# Discard specific file
git checkout -- [filename]
```

### Undo Last Commit (Not Pushed)
```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes AND commit
git reset --hard HEAD~1
```

### Go Back to Last Pushed State
```bash
# Sync with GitHub (lose local changes!)
git reset --hard origin/develop
```

---

## 📝 COMMIT MESSAGE FORMAT

### Good Commit Messages
```bash
# Format: type(scope): description

# Types:
feat      # New feature
fix       # Bug fix
test      # Adding tests
docs      # Documentation only
chore     # Maintenance, no code change
refactor  # Code change, no behavior change

# Examples:
git commit -m "feat(sprint-b1): Add MAGE unit tests"
git commit -m "fix(metrics): Correct GRI hypo component calculation"
git commit -m "test(parser): Add dynamic column detection tests"
git commit -m "docs(optionc): Update MASTER_PROGRESS after sprint B1"
```

---

## 🔍 CHECKING STATUS

### View Changes
```bash
# What's changed?
git status

# Line-by-line changes
git diff

# Changes in specific file
git diff src/engines/metrics-engine.js

# Commit history
git log --oneline -10
```

### View Tags
```bash
# All tags
git tag -l

# Tags with details
git tag -n

# Commits for a tag
git show v3.6.0-pre-optionc
```

---

## ⚙️ USEFUL ALIASES (Optional)

Add to ~/.gitconfig:
```
[alias]
  st = status
  co = checkout
  ci = commit
  br = branch
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = log --oneline --graph --decorate
```

Then use: `git st` instead of `git status`

---

**Version**: 2.0  
**Updated**: 2025-11-02  
**For**: Option C development workflow
