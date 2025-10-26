# 🌳 GIT WORKFLOW - AGP+ v3.8.2

**Purpose:** Git commands, branching strategy, and disaster recovery  
**Read Time:** 7 minutes  
**Prerequisites:** Basic git knowledge

---

## 🎯 BRANCHING STRATEGY

### Branch Structure

```
main (stable releases only)
  └── v3.0-dev (active development)
       └── feature/* (short-lived, if needed)
```

**Branches:**
- `main`: Production-ready releases only (v2.x, v3.x milestones)
- `v3.0-dev`: Long-lived feature branch for v3.0 FUSION development
- `feature/*`: Short-lived branches for experimental work (rare)

**Current State:**
- Working on: `v3.0-dev`
- Last merge to main: v2.2.0 (October 2024)
- Next merge to main: v3.0.0 (when FUSION complete)

---

## 📋 DAILY WORKFLOW

### Starting Work

```bash
# 1. Navigate to project
cd /Users/jomostert/Documents/Projects/agp-plus

# 2. Ensure on v3.0-dev
git branch  # Should show * v3.0-dev

# 3. Pull latest changes
git pull origin v3.0-dev

# 4. Check status
git status  # Should be clean

# 5. Start server
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### During Work

**Check status frequently:**
```bash
git status

# Shows:
# - Modified files (red)
# - Staged files (green)
# - Untracked files
```

**Stage files as you go:**
```bash
# Stage specific file
git add src/components/MyComponent.jsx

# Stage multiple files
git add src/components/ src/hooks/

# Stage everything (use carefully)
git add .
```

**Check what changed:**
```bash
# See unstaged changes
git diff

# See staged changes
git diff --staged

# See changes in specific file
git diff src/components/MyComponent.jsx
```

### Committing Work

**Commit frequently:**
```bash
# Good commit (descriptive message)
git commit -m "feat: add weekly summary calculation

- Add calculateWeeklySummary engine function
- Create useWeeklySummary hook
- Add WeeklySummary component
- Tested with 28k readings"

# Quick commit (for small changes)
git commit -m "fix: typo in day profile label"
```

**Commit message format:**
```
<type>: <short description>

<optional longer description>
<optional bullet points>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `chore:` Maintenance
- `refactor:` Code restructure
- `test:` Tests
- `perf:` Performance

### Pushing Work

**Push to remote:**
```bash
# Push to v3.0-dev
git push origin v3.0-dev

# If rejected (remote has new commits)
git pull origin v3.0-dev
# Resolve any conflicts
git push origin v3.0-dev
```

**Check push succeeded:**
```bash
# Verify last commit
git log -1

# Check remote status
git remote show origin
```

### End of Session

```bash
# 1. Commit any work
git status
git add .
git commit -m "wip: end of session state"

# 2. Push to remote
git push origin v3.0-dev

# 3. Update documentation
# - Update START_HERE.md if needed
# - Update CHANGELOG.md
# - Create handoff doc if major work

# 4. Final push of docs
git add START_HERE.md CHANGELOG.md
git commit -m "docs: update for session end"
git push origin v3.0-dev
```

---

## 🔀 COMMON SCENARIOS

### Scenario 1: "I want to experiment without breaking things"

**Option A: Create feature branch**
```bash
# Create and switch to new branch
git checkout -b feature/my-experiment

# Do your work
# ... code code code ...

# Commit on feature branch
git add .
git commit -m "feat: experimental feature"

# If it works, merge to v3.0-dev
git checkout v3.0-dev
git merge feature/my-experiment

# If it doesn't work, just delete branch
git checkout v3.0-dev
git branch -D feature/my-experiment
```

**Option B: Use stash**
```bash
# Save current work temporarily
git stash save "Experimental work"

# Do your experiment directly
# ... code code code ...

# If it works, commit it
git add .
git commit -m "feat: successful experiment"

# If it doesn't work, restore stashed work
git reset --hard HEAD  # Discard experiment
git stash pop         # Restore saved work
```

### Scenario 2: "I made a mistake in my last commit"

**Amend last commit (before push):**
```bash
# Fix the file
vim src/components/MyComponent.jsx

# Stage the fix
git add src/components/MyComponent.jsx

# Amend (replaces last commit)
git commit --amend

# Force push (only if you already pushed)
git push origin v3.0-dev --force
```

**⚠️ WARNING:** Only amend/force-push if no one else is working on the branch!

### Scenario 3: "I want to undo my last commit"

**Undo but keep changes:**
```bash
# Move HEAD back one commit, keep files modified
git reset HEAD~1

# Files still modified, can re-commit differently
git add src/components/MyComponent.jsx
git commit -m "Better commit message"
```

**Undo and discard changes:**
```bash
# Move HEAD back and discard changes (DANGEROUS!)
git reset --hard HEAD~1

# Can't undo this! Changes are lost forever!
```

### Scenario 4: "I have uncommitted changes but need to pull"

**Option A: Commit first**
```bash
git add .
git commit -m "wip: work in progress"
git pull origin v3.0-dev
```

**Option B: Stash, pull, pop**
```bash
git stash save "WIP"
git pull origin v3.0-dev
git stash pop  # Reapply your changes
```

### Scenario 5: "I have merge conflicts"

**Resolve conflicts:**
```bash
# After pull with conflicts
git status  # Shows conflicted files

# Open conflicted file
vim src/components/MyComponent.jsx

# Look for conflict markers:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> branch-name

# Edit file to resolve, remove markers

# Stage resolved file
git add src/components/MyComponent.jsx

# Complete merge
git commit -m "fix: resolve merge conflicts"
```

### Scenario 6: "I want to see what changed between commits"

**Compare commits:**
```bash
# See last 5 commits
git log -5 --oneline

# Compare two commits
git diff abc123 def456

# Compare current to previous
git diff HEAD HEAD~1

# See what files changed
git diff --name-only HEAD HEAD~1
```

### Scenario 7: "I want to undo a pushed commit"

**Create revert commit:**
```bash
# Find commit hash
git log --oneline

# Revert that commit (creates new commit)
git revert abc123

# Push revert
git push origin v3.0-dev
```

**Why revert instead of reset?**
- Preserves history
- Safe for shared branches
- Can be undone if needed

---

## 🚨 DISASTER RECOVERY

### "Oh No" Scenarios

#### OH NO 1: "I deleted important files!"

**Before commit:**
```bash
# Restore file from last commit
git checkout HEAD -- src/components/MyComponent.jsx

# Restore all deleted files
git checkout HEAD -- .
```

**After commit:**
```bash
# Find commit with file
git log --all --full-history -- src/components/MyComponent.jsx

# Restore from specific commit
git checkout abc123 -- src/components/MyComponent.jsx
```

#### OH NO 2: "I committed to wrong branch!"

**Move commit to correct branch:**
```bash
# On wrong branch, note commit hash
git log -1  # Copy the hash (abc123)

# Switch to correct branch
git checkout v3.0-dev

# Apply that commit here
git cherry-pick abc123

# Switch back and remove from wrong branch
git checkout wrong-branch
git reset --hard HEAD~1
```

#### OH NO 3: "I force-pushed and broke everything!"

**Recover from reflog:**
```bash
# See all recent actions
git reflog

# Find the state before force-push
# Look for something like:
# abc123 HEAD@{1}: commit: Good state

# Reset to that state
git reset --hard abc123

# Force push to restore remote
git push origin v3.0-dev --force
```

#### OH NO 4: "My working directory is a mess!"

**Nuclear option - start fresh:**
```bash
# Discard ALL local changes (DANGEROUS!)
git reset --hard HEAD
git clean -fd  # Remove untracked files

# Pull latest
git pull origin v3.0-dev

# Restart server
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

#### OH NO 5: "I can't push - rejected!"

**Troubleshooting:**
```bash
# See what's different
git fetch origin
git log HEAD..origin/v3.0-dev

# If remote has new commits
git pull origin v3.0-dev
# Resolve conflicts if any
git push origin v3.0-dev

# If your local is correct and remote is wrong
# (use VERY carefully!)
git push origin v3.0-dev --force
```

---

## 📊 USEFUL GIT COMMANDS

### Status & Information

```bash
# Current status
git status

# Commit history
git log
git log --oneline              # Compact
git log --graph --oneline      # Visual tree
git log -5                     # Last 5 commits
git log --author="Jo"          # Filter by author

# Branch information
git branch                     # Local branches
git branch -r                  # Remote branches
git branch -a                  # All branches

# Remote information
git remote -v                  # Show remote URLs
git remote show origin         # Detailed remote info

# See what changed
git diff                       # Unstaged changes
git diff --staged              # Staged changes
git diff HEAD~1                # Last commit
```

### Staging & Committing

```bash
# Stage files
git add file.js                # Single file
git add src/                   # Directory
git add .                      # Everything
git add -p                     # Interactive (choose chunks)

# Unstage files
git reset file.js              # Unstage specific file
git reset                      # Unstage all

# Commit
git commit -m "message"        # With message
git commit                     # Opens editor
git commit --amend             # Modify last commit
git commit --no-verify         # Skip pre-commit hooks
```

### Branching & Merging

```bash
# Create branch
git branch feature-name        # Create
git checkout feature-name      # Switch
git checkout -b feature-name   # Create and switch

# Delete branch
git branch -d feature-name     # Safe delete
git branch -D feature-name     # Force delete

# Merge
git merge feature-name         # Merge into current
git merge --no-ff feature-name # Keep merge commit
git merge --abort              # Cancel merge
```

### Stashing

```bash
# Save work temporarily
git stash                      # Quick stash
git stash save "description"   # Named stash

# View stashes
git stash list

# Apply stash
git stash pop                  # Apply and remove
git stash apply                # Apply and keep
git stash apply stash@{1}      # Apply specific stash

# Remove stash
git stash drop                 # Remove last
git stash drop stash@{1}       # Remove specific
git stash clear                # Remove all
```

### History & Undo

```bash
# View history
git reflog                     # All actions
git log --follow file.js       # File history

# Undo changes
git checkout -- file.js        # Discard changes
git reset HEAD file.js         # Unstage
git reset HEAD~1               # Undo commit (keep changes)
git reset --hard HEAD~1        # Undo commit (discard changes)
git revert abc123              # Undo with new commit
```

---

## 🎓 BEST PRACTICES

### Commit Practices

**✅ DO:**
- Commit frequently (logical chunks)
- Write descriptive messages
- Test before committing
- Review diff before committing (`git diff --staged`)
- Keep commits focused (one thing per commit)

**❌ DON'T:**
- Commit broken code (unless marked WIP)
- Commit console.log statements
- Commit commented-out code
- Mix multiple unrelated changes
- Write vague messages ("fix stuff", "updates")

### Branch Practices

**✅ DO:**
- Work on `v3.0-dev` for all v3.x work
- Pull before starting work
- Push at end of session
- Create feature branches for experiments

**❌ DON'T:**
- Work directly on `main`
- Create branches without reason
- Leave branches unmerged for weeks
- Force-push to shared branches

### Push Practices

**✅ DO:**
- Push after completing logical unit of work
- Push before long breaks
- Check push succeeded
- Pull before pushing

**❌ DON'T:**
- Push broken code
- Force-push without coordination
- Push sensitive data (passwords, keys)
- Forget to push before ending session

---

## 🔗 RELATED DOCUMENTATION

**For development workflow:**
→ `DEVELOPMENT.md` (testing, debugging patterns)

**For project structure:**
→ `ARCHITECTURE.md` (understand what you're changing)

**For commit message examples:**
→ `CHANGELOG.md` (see historical patterns)

**For emergency help:**
→ This file (disaster recovery section above)

---

**Git Cheat Sheet Summary:**

```bash
# Start work
git pull origin v3.0-dev

# During work
git status
git add file.js
git commit -m "feat: description"

# End work
git push origin v3.0-dev

# Oh no!
git stash              # Save work
git reset --hard HEAD  # Nuclear reset
git reflog            # Find lost commits
```

**Remember:** Git is forgiving - almost nothing is truly lost! 🎉
