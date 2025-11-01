# AGP+ Git Branch Cheatsheet

**Last Updated**: 2025-11-02  
**Safe Version**: v3.6.0 (commit 80fb1fd)  
**Development Branch**: develop

---

## ðŸŽ¯ QUICK REFERENCE

### Current Branch
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git branch  # Shows current branch with *
```

### Switch to Safe Version (main)
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git checkout main
git pull origin main

# Verify you're on safe version
git log --oneline -1  # Should show: 80fb1fd
```

### Switch to Development (develop)
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git checkout develop
git pull origin develop
```

---

## ðŸš¨ EMERGENCY: Revert to Safe Version

Als develop branch kapot is, terug naar v3.6.0-safe:

```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Save current work (optional)
git stash save "Emergency stash before revert"

# Go to safe version
git checkout main
git pull origin main

# Verify
git log --oneline -1  # Should show: 80fb1fd

# Delete broken develop (optional)
git branch -D develop
git push origin --delete develop

# Start fresh develop from main
git checkout -b develop
git push -u origin develop
```

---

## ðŸ"„ WORKFLOW: Daily Development

### Start van de dag
```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Ensure you're on develop
git checkout develop

# Get latest changes
git pull origin develop

# Check status
git status
```

### Tijdens werk (frequent commits)
```bash
# After completing a task
git add .
git commit -m "feat(sprint-B1): Add performance benchmarks"
git push origin develop
```

### Einde van de dag
```bash
# Commit all work
git add .
git commit -m "wip: End of day checkpoint - [description]"
git push origin develop
```

---

## ✅ RELEASE: Merge develop → main

**Wanneer**: Na een complete sprint (bijv. Sprint B1 done)

```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Ensure develop is up to date
git checkout develop
git pull origin develop

# Switch to main
git checkout main
git pull origin main

# Merge develop into main
git merge develop --no-ff -m "release: v4.0-sprint-B1 complete"

# Push to GitHub
git push origin main

# Tag release (optional but recommended)
git tag v4.0.0-sprint-B1
git push --tags

# Go back to develop
git checkout develop
```

---

## 🔍 STATUS CHECKS

### View commit history
```bash
git log --oneline -10  # Last 10 commits
git log --graph --oneline --all  # Visual tree
```

### View changes
```bash
git status  # Current changes
git diff  # Detailed diff
```

### View branches
```bash
git branch -a  # All branches (local + remote)
```

---

## ðŸ'¾ BACKUP STRATEGY

### Local backup (before risky changes)
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git checkout develop

# Create backup branch
git branch backup-before-[sprint-name]
git push origin backup-before-[sprint-name]

# Now work on develop safely
```

### Remote backup (GitHub)
Every push to develop = automatic backup on GitHub.

---

## 🎯 BRANCH PURPOSES

### main
- **Status**: Always stable, production-ready
- **Safe version**: v3.6.0-safe (80fb1fd)
- **Updates**: Only via merge from develop after sprint complete
- **Never**: Direct commits to main

### develop
- **Status**: Active development
- **Start**: v3.6.0-safe (80fb1fd)
- **Updates**: Frequent commits during sprints
- **Purpose**: Sprint B1 → C1 → F1 → G1 → etc.

---

## ðŸ"Š SPRINT WORKFLOW

### Sprint Start
```bash
git checkout develop
git pull origin develop

# Optional: Create sprint branch
git checkout -b sprint-B1
```

### Sprint Work
```bash
# Work on files
# Commit frequently (every 1-2 hours)
git add .
git commit -m "feat(sprint-B1): [what you did]"
git push origin develop  # or sprint-B1
```

### Sprint Complete
```bash
# Merge sprint branch to develop (if using sprint branches)
git checkout develop
git merge sprint-B1 --no-ff

# Push to GitHub
git push origin develop

# Optional: Merge to main for release
git checkout main
git merge develop --no-ff
git push origin main
git tag v4.0.0-sprint-B1-complete
git push --tags
```

---

## âš ï¸ TROUBLESHOOTING

### "Your branch is behind origin/develop"
```bash
git pull origin develop
# Resolve conflicts if any
git push origin develop
```

### "Merge conflict"
```bash
# Edit conflicted files
# Look for <<<<<<< HEAD markers
# Choose which code to keep
# Remove markers

git add .
git commit -m "fix: Resolve merge conflict"
git push
```

### "I committed to wrong branch"
```bash
# If you committed to main instead of develop
git checkout main
git reset --soft HEAD~1  # Undo last commit, keep changes
git stash  # Save changes

git checkout develop
git stash pop  # Apply changes
git add .
git commit -m "[your message]"
git push origin develop
```

---

## 🎯 CHEATSHEET SUMMARY

| Action | Command |
|--------|---------|
| Check current branch | `git branch` |
| Switch to safe | `git checkout main` |
| Switch to dev | `git checkout develop` |
| Save work | `git add . && git commit -m "msg"` |
| Push to GitHub | `git push` |
| Emergency revert | `git checkout main` |
| View history | `git log --oneline -10` |

---

**Version**: 1.0  
**Safe Commit**: 80fb1fd (main)  
**Development**: develop branch
