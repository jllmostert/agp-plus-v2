# QUICK COMMANDS - AGP+

**Version**: v3.6.0  
**Last Update**: 2025-11-02

---

## 🚀 START APP

**Anywhere in terminal**:
```bash
3001
```

**What it does**:
- Goes to `/Users/jomostert/Documents/Projects/agp-plus`
- Kills port 3001 processes
- Starts Vite dev server
- Opens Chrome on `http://localhost:3001`

**Stop**: `Ctrl+C`

---

## 📂 NAVIGATE

**Go to project**:
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
```

**Go to current sprint**:
```bash
cd /Users/jomostert/Documents/Projects/agp-plus/docs/optionc/block-c-robustness/sprint-b1-metrics
```

---

## 📚 READ DOCS

**Main docs**:
```bash
cat docs/optionc/START_HERE.md           # Option C overview
cat docs/optionc/MASTER_PROGRESS.md      # All sprints tracking
cat STATUS.md                             # What works
cat PLAN_VAN_AANPAK.md                    # Complete roadmap
cat GIT_CHEATSHEET.md                     # Git workflow
```

**Current sprint**:
```bash
cat docs/optionc/block-c-robustness/sprint-b1-metrics/HANDOFF.md
cat docs/optionc/block-c-robustness/sprint-b1-metrics/PROGRESS.md
```

---

## 🔧 GIT

**Pull latest**:
```bash
git pull origin develop
```

**Check status**:
```bash
git status
git log --oneline -5
```

**Commit work**:
```bash
git add .
git commit -m "test(metrics): What you did"
git push origin develop
```

**Safety checkpoint**:
```bash
git checkout v3.6.0-pre-optionc    # View safe version
git checkout develop                # Back to work
```

---

## 🏃 ALIASES

**Defined in `~/.zshrc`**:

- `3001` - Start AGP+ (go to folder + run start.sh + open Chrome)

**Add more aliases** (optional):
```bash
# Go to project
alias agp='cd /Users/jomostert/Documents/Projects/agp-plus'

# Go to current sprint
alias sprint='cd /Users/jomostert/Documents/Projects/agp-plus/docs/optionc/block-c-robustness/sprint-b1-metrics'

# View docs
alias docs='cd /Users/jomostert/Documents/Projects/agp-plus && cat docs/optionc/START_HERE.md'
```

Add to `~/.zshrc` and run `source ~/.zshrc`

---

**Pro Tip**: Keep this file open in a separate terminal for quick reference!
