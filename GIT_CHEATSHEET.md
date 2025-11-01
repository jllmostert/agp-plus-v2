# Git Workflow Cheatsheet - AGP+ v4.0

**Quick Reference**: Voor dagelijks werk op AGP+ develop branch

---

## ðŸš€ DAILY WORKFLOW

### Start Session
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git checkout develop              # Switch to work branch
git pull origin develop           # Get latest changes
git status                        # Check current state
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

## 🔒 SAFETY COMMITS

### Before Risky Changes
```bash
# Create safety point
git add -A
git commit -m "safety: Before refactoring AGPGenerator"
git push origin develop

# Now you can experiment safely!
```

### Create Milestone Tag
```bash
# For major checkpoints
git tag -a v3.6.1 -m "TIER2 complete, v4.0 prep"
git push origin v3.6.1
```

---

## ðŸš¨ EMERGENCY PROCEDURES

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

## 🔄 BRANCH OPERATIONS

### Switch Branches
```bash
# Go to stable production
git checkout main
git pull origin main

# Return to work
git checkout develop
git pull origin develop
```

### Create New Branch
```bash
# For experimental features
git checkout -b feature/new-thing
git push -u origin feature/new-thing
```

### Delete Branch
```bash
# Local only
git branch -d feature/old-thing

# Remote also
git push origin --delete feature/old-thing
```

---

## 📊 INSPECTION COMMANDS

### View History
```bash
# Last 10 commits
git log --oneline -10

# Detailed last 3
git log -3

# See branch graph
git log --graph --oneline --all -10
```

### Check Changes
```bash
# Uncommitted changes
git status
git diff

# Changes in specific commit
git show [commit-hash]

# File history
git log --follow -- [filename]
```

### Compare Branches
```bash
# See what's in develop but not main
git log main..develop

# See differences
git diff main..develop
```

---

## 🔍 FINDING THINGS

### Search Commits
```bash
# Find commit by message
git log --grep="metrics"

# Find commits that changed specific file
git log -- [filename]

# Find when text was added/removed
git log -S "function calculateMAGE"
```

### Check Remote Status
```bash
# See all remotes
git remote -v

# Check if local is behind/ahead
git fetch origin
git status
```

---

## ðŸ› ï¸ MAINTENANCE

### Clean Up
```bash
# Remove deleted files from tracking
git add -A

# Clean untracked files (dry run first!)
git clean -n
git clean -f

# Remove old branches
git fetch --prune
```

### Sync with Remote
```bash
# Update all branches
git fetch origin

# See what changed
git log origin/develop..develop

# Fast-forward merge
git merge origin/develop
```

---

## ðŸ'¡ BEST PRACTICES

### Commit Messages
```bash
# Good format: <type>(<scope>): <description>

feat(sprint-b1): Add MAGE unit tests
fix(metrics): Correct DST handling in MODD
docs(readme): Update installation instructions
chore: Update dependencies
safety: Before major refactor
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `chore`: Maintenance
- `test`: Adding tests
- `refactor`: Code restructure
- `safety`: Safety checkpoint

### Commit Frequency
- âœ… Commit after each small task (every 15-30 min)
- âœ… Push at end of session
- âœ… Safety commit before risky changes
- âŒ Don't wait until "everything works"

---

## ðŸš© RED FLAGS

**DON'T DO THIS**:
```bash
# âŒ Never force push to shared branches
git push -f origin develop  # BAD!

# âŒ Never commit secrets/passwords
git commit -m "Add API key"  # BAD!

# âŒ Never work directly on main
git checkout main
# make changes  # BAD!
```

**DO THIS INSTEAD**:
```bash
# âœ… Always work on develop
git checkout develop

# âœ… Remove secrets before committing
# Check .gitignore includes .env, etc.

# âœ… Use --force-with-lease if you must force
git push --force-with-lease origin feature/thing
```

---

## ðŸ†˜ COMMON PROBLEMS

### "Your branch is behind"
```bash
git pull origin develop
# or
git fetch origin
git merge origin/develop
```

### "Merge conflict"
```bash
# Open conflicted files, resolve manually
# Look for <<<<<<< ======= >>>>>>>
git add [resolved-files]
git commit -m "fix: Resolve merge conflicts"
```

### "Detached HEAD"
```bash
# Create branch from current state
git checkout -b recovery-branch

# Or go back to develop
git checkout develop
```

### "Accidentally committed to main"
```bash
# On main branch with unwanted commit
git reset --hard origin/main

# Or move commit to develop
git branch -f develop HEAD
git checkout develop
git checkout main
git reset --hard origin/main
```

---

## 📚 QUICK REFERENCE

| Command | What It Does |
|---------|--------------|
| `git status` | Show current state |
| `git add -A` | Stage all changes |
| `git commit -m "msg"` | Commit with message |
| `git push` | Upload to GitHub |
| `git pull` | Download from GitHub |
| `git checkout [branch]` | Switch branch |
| `git reset --hard HEAD` | Undo all changes |
| `git log --oneline -10` | Show last 10 commits |

---

**Cheatsheet Version**: 2.0  
**Last Updated**: 2025-11-02  
**For**: AGP+ v4.0 development
