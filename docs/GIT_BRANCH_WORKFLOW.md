# Git Branch Workflow Guide - AGP+ v3.0

**For:** Jo Mostert  
**Project:** AGP+ v3.0 Development  
**Last Updated:** October 25, 2025

---

## 🎯 OVERVIEW

This guide teaches you how to work with two git branches simultaneously:
- `main` = Stable production (v2.2.1+)
- `v3.0-dev` = Experimental development (v3.0.0)

**Your goal:** Maintain stable v2.x while building v3.0 in parallel.

---

## 🧠 THE MENTAL MODEL

Think of branches as **parallel universes**:

```
main branch (Universe A)          v3.0-dev branch (Universe B)
├─ v2.2.1 stable                  ├─ v3.0-dev experiments
├─ Bugfixes only                  ├─ Breaking changes OK
├─ Production-ready               ├─ Work in progress
└─ Users rely on this             └─ Only you see this
```

**Golden Rule:** Always know which universe you're in before typing.

---

## 📋 INITIAL SETUP (Do Once)

### Create v3.0-dev Branch

```bash
# 1. Make sure you're on main and up to date
cd /Users/jomostert/Documents/Projects/agp-plus
git checkout main
git pull origin main

# 2. Create new branch FROM current main
git checkout -b v3.0-dev

# 3. Push to GitHub (sets up remote tracking)
git push -u origin v3.0-dev

# 4. Verify you're on v3.0-dev
git branch
# Output: 
#   main
# * v3.0-dev  ← asterisk shows current branch
```

### Add Branch to Terminal Prompt (Optional but Recommended)

```bash
# Edit ~/.zshrc (macOS default shell)
nano ~/.zshrc

# Add these lines at the end:
parse_git_branch() {
  git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/'
}
PS1='%F{cyan}%~%f %F{yellow}$(parse_git_branch)%f $ '

# Save and reload
source ~/.zshrc

# Now your prompt shows: ~/Projects/agp-plus (v3.0-dev) $
```

---

## 🔄 DAILY WORKFLOW PATTERNS

### Pattern 1: Normal v3.0 Development

```bash
# CHECK: Where am I?
git branch
# Should show: * v3.0-dev

# Work on your feature
# ... edit files ...

# Stage and commit
git add .
git commit -m "feat: implement month-bucketing for storage"

# Push to GitHub
git push origin v3.0-dev

# Continue working...
```

### Pattern 2: v2.x Bugfix (User Reports Issue)

**Scenario:** You're working on v3.0-dev, user reports bug in production v2.2.1

```bash
# STEP 1: Save your v3.0 work (DON'T commit half-done code)
git stash save "WIP: implementing incremental storage"

# STEP 2: Switch to main
git checkout main

# STEP 3: Verify you're on main
git branch
# Output: * main

# STEP 4: Pull latest (in case someone else pushed)
git pull origin main

# STEP 5: Fix the bug
# ... edit DayProfilesModal.jsx or whatever ...

# STEP 6: Commit bugfix
git add src/components/DayProfilesModal.jsx
git commit -m "fix: modal click handler regression in v2.2.1"

# STEP 7: Push to main (this becomes v2.2.2)
git push origin main

# STEP 8: Tag the patch version (optional but good practice)
git tag v2.2.2
git push origin v2.2.2

# STEP 9: Switch back to v3.0-dev
git checkout v3.0-dev

# STEP 10: Bring bugfix into v3.0-dev (keep branches in sync)
git merge main

# STEP 11: Restore your v3.0 work
git stash pop

# STEP 12: Push merged v3.0-dev
git push origin v3.0-dev
```

### Pattern 3: Weekly Sync (Keep v3.0-dev Up to Date)

**Do this every week, even if main hasn't changed:**

```bash
# You're on v3.0-dev, working normally

# Merge latest main into v3.0-dev
git checkout v3.0-dev  # Make sure you're here
git merge main         # Brings in any v2.x changes

# If no conflicts:
git push origin v3.0-dev

# If conflicts (rare, but possible):
# Git will mark conflicts in files like:
# <<<<<<< HEAD (v3.0-dev)
# your v3.0 code
# =======
# main branch code
# >>>>>>> main

# Edit files to resolve, then:
git add .
git commit -m "merge: resolve conflicts from main"
git push origin v3.0-dev
```

---

## 🆘 SAFETY CHECKS

### Before Every Commit

```bash
# 1. Which branch am I on?
git branch
# Output shows * next to current branch

# 2. What files changed?
git status
# Shows modified, staged, untracked files

# 3. What exactly changed?
git diff
# Shows line-by-line differences

# 4. What am I about to commit?
git diff --staged
# Shows only staged changes (after git add)
```

### Branch Status Check

```bash
# See all branches (local + remote)
git branch -a

# See last commit on each branch
git branch -v

# See which branch tracks which remote
git branch -vv
```

---

## 😱 "OH NO" RECOVERY SCENARIOS

### Problem: I Committed to the Wrong Branch!

**Example:** You're on `main` but meant to commit to `v3.0-dev`

```bash
# DON'T PANIC - Nothing is lost!

# STEP 1: Check last commit
git log -1

# STEP 2: Undo commit (keep changes as uncommitted)
git reset --soft HEAD~1

# STEP 3: Switch to correct branch
git checkout v3.0-dev

# STEP 4: Commit again (now on right branch)
git add .
git commit -m "Your original message"

# STEP 5: Push to v3.0-dev
git push origin v3.0-dev
```

### Problem: I Have Uncommitted Changes, Need to Switch Branches

**Option A: Stash (Temporary Storage)**

```bash
# Save changes temporarily
git stash save "Quick description of work"

# Switch to other branch
git checkout other-branch

# Do whatever you need...

# Return to original branch
git checkout v3.0-dev

# Restore your changes
git stash pop
```

**Option B: Commit Even If Incomplete**

```bash
# Commit work-in-progress
git add .
git commit -m "WIP: incomplete incremental storage work"

# Switch branches
git checkout main

# Later, when you return:
git checkout v3.0-dev

# Undo WIP commit (keeps changes uncommitted)
git reset --soft HEAD~1
```

### Problem: I Merged the Wrong Direction

**Example:** Accidentally merged `v3.0-dev` → `main` instead of `main` → `v3.0-dev`

**If you HAVEN'T pushed yet:**

```bash
# Undo the merge (go back one commit)
git reset --hard HEAD~1
```

**If you HAVE pushed:**

```bash
# Revert the merge (creates new commit that undoes it)
git revert -m 1 HEAD

# Add clear message
git commit --amend -m "revert: undo accidental merge of v3.0-dev into main"

# Push the revert
git push origin main
```

### Problem: I Accidentally Deleted Branch

```bash
# Find the commit hash where branch was
git reflog

# Look for: "checkout: moving from main to v3.0-dev"
# Note the commit hash (e.g., abc1234)

# Recreate branch at that commit
git checkout -b v3.0-dev abc1234
```

### Problem: Merge Conflicts

**What they look like:**

```javascript
<<<<<<< HEAD (v3.0-dev - your changes)
const newFeature = true;
=======
const oldFeature = false;
>>>>>>> main (incoming changes)
```

**How to resolve:**

```bash
# STEP 1: Open file in editor
# STEP 2: Choose which version to keep (or combine both)
# STEP 3: Remove markers (<<<, ===, >>>)
# STEP 4: Save file

# STEP 5: Mark as resolved
git add path/to/file.js

# STEP 6: Complete merge
git commit -m "merge: resolve conflicts from main"

# STEP 7: Push
git push origin v3.0-dev
```

---

## 📊 GIT COMMAND CHEATSHEET

### Navigation

```bash
git branch              # List local branches (* = current)
git branch -a           # List all branches (local + remote)
git checkout main       # Switch to main
git checkout v3.0-dev   # Switch to v3.0-dev
git status              # Show current state
```

### Viewing Changes

```bash
git diff                # Show uncommitted changes
git diff --staged       # Show staged changes
git log                 # Show commit history
git log --oneline       # Compact history
git log -3              # Last 3 commits
git show <commit>       # Show specific commit
```

### Committing

```bash
git add .               # Stage all changes
git add <file>          # Stage specific file
git commit -m "msg"     # Commit with message
git commit --amend      # Edit last commit message
git push origin <branch>  # Push to GitHub
```

### Syncing

```bash
git pull origin main    # Pull latest main
git merge main          # Merge main into current branch
git stash               # Save changes temporarily
git stash pop           # Restore stashed changes
git stash list          # Show all stashes
```

### Undoing

```bash
git reset --soft HEAD~1 # Undo last commit (keep changes)
git reset --hard HEAD~1 # Undo last commit (delete changes!)
git checkout -- <file>  # Discard changes to file
git clean -fd           # Delete untracked files (careful!)
```

---

## 🎯 BEST PRACTICES

### DO

- ✅ Always check which branch you're on before committing
- ✅ Commit often with clear messages
- ✅ Merge main → v3.0-dev weekly (stay in sync)
- ✅ Use `git stash` when switching branches with uncommitted work
- ✅ Push to GitHub daily (backup + collaboration ready)
- ✅ Test after merging (run dev server, check for errors)

### DON'T

- ❌ Work on main directly (except for v2.x bugfixes)
- ❌ Force push (`git push -f`) unless you know what you're doing
- ❌ Commit secrets (API keys, passwords) to any branch
- ❌ Merge v3.0-dev → main until v3.0 is production-ready
- ❌ Delete main branch (ever!)

---

## 🚀 TYPICAL WEEK IN v3.0 DEVELOPMENT

**Monday:**
```bash
git checkout v3.0-dev
git merge main  # Weekly sync
# ... work on new feature ...
git commit -m "feat: add month-bucketing"
git push origin v3.0-dev
```

**Tuesday-Thursday:**
```bash
# Continue v3.0 work
git commit -m "feat: implement cache rebuilding"
git commit -m "feat: add migration script"
git push origin v3.0-dev
```

**Friday - User reports v2.x bug:**
```bash
git stash
git checkout main
# ... fix bug ...
git commit -m "fix: day profile Y-axis bug v2.2.2"
git push origin main
git tag v2.2.2
git push origin v2.2.2
git checkout v3.0-dev
git merge main
git stash pop
git push origin v3.0-dev
```

---

## 📅 TIMELINE: v3.0-dev → main MERGE

**When to merge v3.0-dev into main:**

1. ✅ All v3.0 features complete
2. ✅ Migration tested with real data
3. ✅ Documentation updated
4. ✅ No console errors
5. ✅ Performance targets met
6. ✅ Beta testing complete

**The big merge:**

```bash
# STEP 1: Final sync (make sure v3.0-dev has latest main)
git checkout v3.0-dev
git merge main
git push origin v3.0-dev

# STEP 2: Merge v3.0-dev into main
git checkout main
git merge v3.0-dev

# STEP 3: Test thoroughly on main
npm run dev
# Test everything!

# STEP 4: Push to main (v3.0.0 release!)
git push origin main

# STEP 5: Tag release
git tag v3.0.0
git push origin v3.0.0

# STEP 6: Delete v3.0-dev (optional, work is done)
git branch -d v3.0-dev
git push origin --delete v3.0-dev

# v3.0 is now live on main! 🎉
```

---

## 🆘 HELP! I'M STUCK

**Common situations:**

1. **"I don't know which branch I'm on"**
   - Run: `git branch` (look for `*`)

2. **"Git won't let me switch branches"**
   - You have uncommitted changes
   - Run: `git stash` first, then switch

3. **"I see merge conflicts and don't know what to do"**
   - Open file, look for `<<<<<<<` markers
   - Edit to keep what you want
   - Remove markers, save file
   - Run: `git add <file>`, then `git commit`

4. **"I accidentally committed to main"**
   - Run: `git reset --soft HEAD~1`
   - Then: `git checkout v3.0-dev`
   - Then: `git commit` again

5. **"Everything is broken, I want to start over"**
   - **NEVER run `git reset --hard` without asking first!**
   - Instead: Ask Claude or check git reflog

---

## 📚 LEARNING RESOURCES

**Interactive tutorials:**
- https://learngitbranching.js.org/
- https://github.com/jlord/git-it-electron

**Visual guides:**
- https://marklodato.github.io/visual-git-guide/index-en.html

**Reference:**
- https://git-scm.com/docs

---

## ✅ CONFIDENCE CHECKLIST

You're ready to work with branches when you can:

- [ ] Check which branch you're on
- [ ] Switch between main and v3.0-dev
- [ ] Commit to v3.0-dev without affecting main
- [ ] Fix a v2.x bug on main while v3.0-dev work is in progress
- [ ] Merge main into v3.0-dev (weekly sync)
- [ ] Use git stash to temporarily save work
- [ ] Recover from "committed to wrong branch"
- [ ] Understand merge conflict markers

---

**Remember:** Git is your safety net, not your enemy. Every action is (almost) reversible. When in doubt, ask before running destructive commands!

**Happy branching! 🌿**

---

*Last updated: October 25, 2025*  
*For AGP+ v3.0 Development*
