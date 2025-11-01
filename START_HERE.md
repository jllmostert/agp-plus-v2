# AGP+ Master START_HERE - v4.0 Development

**Version**: v4.0-develop  
**Base**: v3.6.0-safe (commit 80fb1fd)  
**Branch**: develop  
**Last Updated**: 2025-11-02

---

## 🎯 QUICK START (30 seconds)

1. **Check branch**: `git branch` (should show `* develop`)
2. **Current sprint**: See `CURRENT_SPRINT.md`
3. **Progress**: See `PROGRESS.md` (source of truth)
4. **Switch branches**: See `GIT_CHEATSHEET.md`

---

## ðŸ"Š PROJECT STATUS

**Architecture Score**: 7.5/10 (TIER2 complete)  
**Implementation Plan**: Option C (Full, 67h)  
**Current Sprint**: B1 - Metrics Validation (7h)

**Safe Version**: 
- Branch: main
- Commit: 80fb1fd
- Tag: v3.6.0-safe

**Development Version**:
- Branch: develop
- Status: Active
- Starting: Sprint B1

---

## ðŸ"‚ DOCUMENTATION STRUCTURE

### Root Level (Always Current)
- `PROGRESS.md` - **SOURCE OF TRUTH** (what's done, what's next)
- `CURRENT_SPRINT.md` - Active sprint info
- `GIT_CHEATSHEET.md` - Branch switching guide
- `PLAN_VAN_AANPAK.md` - Complete v4.0 roadmap
- `README.md` - User-facing info
- `CHANGELOG.md` - Version history

### Per-Sprint (Organized by Sprint)
- `docs/sprints/sprint-B1-metrics/` - Sprint B1 handoff + progress
- `docs/sprints/sprint-A1-parser/` - Sprint A1 handoff + progress
- `docs/sprints/sprint-F1-accessibility/` - Sprint F1 handoff + progress
- (etc. for each sprint)

### Reference (Read-Only)
- `docs/analysis/` - TIER2 domain analyses
- `docs/archive/` - Old versions
- `/mnt/project/` - MiniMed reference docs (read-only)

---

## 🚀 SPRINT ROADMAP

### Phase 1: P1 Sprints (15h)
1. ✅ **Sprint B1**: Metrics Validation (7h) ← **START HERE**
2. ⏳ **Sprint A1**: Parser Robustness (8h)

### Phase 2: P0 Sprints (15h)
3. ⏳ **Sprint F1**: Chart Accessibility (5h)
4. ⏳ **Sprint G1**: Backup/Restore Complete (10h)

### Phase 3: P2 Sprints (30h)
5. ⏳ **Sprint C1**: Split God Components (20h)
6. ⏳ **Sprint C2**: Table Virtualization (3h)
7. ⏳ **Sprint F2**: WCAG Full Compliance (9h)

### Phase 4: Polish (Optional)
- Performance optimizations
- Additional tests
- UX improvements

---

## ðŸ"‹ FILE LOCATIONS

**Root** (`/Users/jomostert/Documents/Projects/agp-plus/`):
- PROGRESS.md
- CURRENT_SPRINT.md
- GIT_CHEATSHEET.md
- PLAN_VAN_AANPAK.md

**Sprint Docs** (`docs/sprints/[sprint-name]/`):
- START_HERE.md (sprint-specific)
- HANDOFF.md (sprint-specific)
- PROGRESS.md (copied from root after sprint)

**Reference** (`docs/analysis/`):
- TIER2 domain analyses
- Architecture scores

**Archive** (`docs/archive/`):
- Old handoff versions
- Deprecated docs

---

## âš ï¸ CRITICAL RULES

### Token Efficiency
- **Large files** (>800 lines): Use offset/length
- **Write operations**: Max 25-30 lines per call
- **Progress**: Update PROGRESS.md during work (not at end)
- **Recovery**: Chunk-based reading if crash

### Git Workflow
- **Frequent commits**: Every 1-2 hours
- **Never commit to main**: Always use develop
- **Emergency revert**: `git checkout main` (see GIT_CHEATSHEET.md)

### Documentation
- **PROGRESS.md**: Source of truth, update real-time
- **CURRENT_SPRINT.md**: Update at sprint start/end
- **Per-sprint docs**: Create at sprint start

---

## 🎯 STARTING A NEW SESSION

### Quick Checklist
1. [ ] Verify branch: `git branch` (should be `develop`)
2. [ ] Read `CURRENT_SPRINT.md` (what sprint are we on?)
3. [ ] Read `PROGRESS.md` (what's the latest status?)
4. [ ] Read sprint handoff: `docs/sprints/[sprint-name]/HANDOFF.md`
5. [ ] Start work!

### During Session
- Update PROGRESS.md every 30-60 minutes
- Commit frequently (`git add . && git commit -m "..."`)
- Push to GitHub (`git push origin develop`)

### End of Session
- Update PROGRESS.md with final status
- Update CURRENT_SPRINT.md if sprint complete
- Commit + push
- Create handoff for next session (if needed)

---

## 📞 HELP

**Branch confusion?** → See `GIT_CHEATSHEET.md`  
**Sprint info?** → See `CURRENT_SPRINT.md`  
**Latest status?** → See `PROGRESS.md`  
**Roadmap?** → See `PLAN_VAN_AANPAK.md`  
**Technical details?** → See sprint's `HANDOFF.md`

---

**Version**: 1.0  
**Status**: Ready for Sprint B1  
**Next**: Read `CURRENT_SPRINT.md` and start!
