# AGP+ Improvement Roadmap - Q4 2025

**Purpose:** Actionable plan to elevate AGP+ from 8.5/10 to 9.5/10  
**Based on:** Comprehensive audit conducted October 27, 2025  
**Timeline:** 4 weeks (November 2025)  
**Owner:** Development team + AI assistants

---

## WEEK 1: P1 Critical Improvements (Effort: ~7 hours)

### P1-1: Console.log Cleanup Sweep
**Effort:** 2 hours  
**Impact:** High - Aligns code with documentation  
**Owner:** Any developer

**Tasks:**
- [ ] Run grep: `grep -r "console.log" src/ | grep -v "console.error"`
- [ ] Remove all console.log statements (keep console.error for user-facing errors)
- [ ] Systematic file-by-file review:
  - [ ] AGPGenerator.jsx
  - [ ] useMasterDataset.js
  - [ ] day-profile-engine.js
  - [ ] All other hooks
  - [ ] All other components
- [ ] Verify clean: `grep -r "console.log" src/ | wc -l` should be 0
- [ ] Test application (no regressions)
- [ ] Commit: "chore: remove debug console.log statements"

**Success Criteria:**
✅ Zero console.log statements in src/  
✅ Only console.error for user-facing errors  
✅ Clean browser console during normal operation

---

### P1-2: Version Number Consistency Audit
**Effort:** 30 minutes  
**Impact:** High - Eliminates confusion  
**Owner:** Any developer

**Tasks:**
- [ ] Search all docs for version references:
  - [ ] START_HERE.md → Update to 3.8.2 ✓ (already correct)
  - [ ] ARCHITECTURE.md → Update to 3.8.2 ✓ (already correct)
  - [ ] DEVELOPMENT.md → Update to 3.8.2
  - [ ] SENSOR_SYSTEM.md → Update to 3.8.2 ✓ (already correct)
  - [ ] GIT_WORKFLOW.md → Update to 3.8.2 ✓ (already correct)
  - [ ] PROJECT_BRIEFING_V3_8.md → Audit references, ensure 3.8.2 throughout
  - [ ] CHANGELOG.md → Verify latest is 3.8.2 ✓ (already correct)
  - [ ] package.json → Update version to 3.8.2
- [ ] Global search: `grep -r "3\.8\.[01]" *.md`
- [ ] Fix any 3.8.0 or 3.8.1 references
- [ ] Commit: "docs: version consistency audit - all docs now 3.8.2"

**Success Criteria:**
✅ All documentation references 3.8.2  
✅ package.json shows 3.8.2  
✅ No stray 3.8.0 or 3.8.1 references

---

### P1-3: PROJECT_BRIEFING Enhancement
**Effort:** 4 hours  
**Impact:** High - Flagship doc becomes "geweldig goed"  
**Owner:** Senior developer or technical writer

**Tasks:**
- [ ] Replace with PROJECT_BRIEFING_V3_8_IMPROVED.md from audit
- [ ] Add compelling mission statement (see improved version)
- [ ] Add troubleshooting section with decision trees
- [ ] Add success criteria to roadmap items
- [ ] Add "Why This Approach" boxes throughout
- [ ] Add implementation walkthrough example
- [ ] Reduce Executive Summary from 22 lines → 7 lines
- [ ] Add glossary (TIR, AGP, GMI, CV definitions)
- [ ] Review: Does this inspire confidence? (Ask another developer)
- [ ] Commit: "docs: enhance PROJECT_BRIEFING to exceptional quality"

**Success Criteria:**
✅ Mission statement is compelling (not just functional)  
✅ Troubleshooting section added with flowcharts  
✅ Roadmap has success criteria for each item  
✅ New developers say "This documentation is amazing!"  
✅ Score improves from 7.5/10 → 9+/10

---

## WEEK 2: P2 Bug Fixes + Documentation (Effort: ~11 hours)

### P2-1: Fix Comparison Date Validation
**Effort:** 2 hours  
**Impact:** Medium - Feature becomes reliable  
**Owner:** Developer familiar with React hooks  
**File:** `src/hooks/useComparison.js`

**Tasks:**
- [ ] Read current implementation (lines 45-60)
- [ ] Add date range validation before query:
  ```javascript
  if (prevStart < datasetDateRange.min) {
    return {
      error: 'Previous period outside available data',
      suggestedStart: datasetDateRange.min,
      message: `Dataset starts ${datasetDateRange.min.toLocaleDateString()}`
    };
  }
  ```
- [ ] Update UI to show helpful error instead of "No data"
- [ ] Test edge cases:
  - [ ] Previous period fully outside dataset
  - [ ] Previous period partially outside
  - [ ] Both periods fully inside
- [ ] Document fix in CHANGELOG.md
- [ ] Commit: "fix: add comparison date validation (Phase 3, Issue 1)"

**Success Criteria:**
✅ Comparison never silently fails  
✅ User sees helpful error with suggested dates  
✅ All edge cases handled gracefully

---

### P2-2: Fix ProTime Workday Persistence
**Effort:** 2 hours  
**Impact:** Medium - Eliminates user frustration  
**Owner:** Developer familiar with IndexedDB  
**File:** `src/hooks/useMasterDataset.js`

**Tasks:**
- [ ] Identify handleProTimeImport function (around line 180-200)
- [ ] Ensure updateMetadata() is awaited:
  ```javascript
  await updateMetadata(metadata);  // Must await!
  ```
- [ ] Add console.log temporarily to debug persistence
- [ ] Test: Import workdays → reload page → verify still present
- [ ] Remove debug logging
- [ ] Document fix in CHANGELOG.md
- [ ] Commit: "fix: ensure ProTime workdays persist across reloads (Phase 3, Issue 2)"

**Success Criteria:**
✅ Workdays survive page reload every time  
✅ No race conditions in metadata updates  
✅ Users can confidently import workdays once

---

### P2-3: Debug Cartridge Change Rendering
**Effort:** 2 hours  
**Impact:** Medium - Completes feature  
**Owner:** Developer familiar with SVG rendering  
**File:** `src/components/DayProfileCard.jsx`

**Tasks:**
- [ ] Add console.log to see cartridgeChanges prop
- [ ] Check filter condition: `cartridgeChanges.filter(c => c.type === 'start')`
- [ ] Verify SVG coordinates (x1, y1, x2, y2)
- [ ] Check stroke color (#ff8c00 orange)
- [ ] Check strokeDasharray ("2,2" pattern)
- [ ] Test with known cartridge change date
- [ ] Document fix in CHANGELOG.md
- [ ] Commit: "fix: cartridge change orange lines now render (Phase 3, Issue 3)"

**Success Criteria:**
✅ Orange dashed lines visible at cartridge changes  
✅ Pattern distinct from sensor lines (2,2 vs 4,4)  
✅ Label "WISSELCASSETTE" displays correctly

---

### P2-4: Clean Up Backup Files
**Effort:** 15 minutes  
**Impact:** Medium - Cleaner repo  
**Owner:** Any developer

**Tasks:**
- [ ] Move `src/core/day-profile-engine.js.backup` to `/archive` or delete
- [ ] Move `src/core/day-profile-engine_CHUNK1.js` to `/archive` or delete
- [ ] Check git history to ensure originals are committed
- [ ] Commit: "chore: remove backup files from src/"

**Success Criteria:**
✅ No .backup or _CHUNK files in src/  
✅ Core directory contains only active code

---

### P2-5: Remove .gitkeep Files
**Effort:** 10 minutes  
**Impact:** Low-Medium - Minor cleanup  
**Owner:** Any developer

**Tasks:**
- [ ] Delete src/components/.gitkeep
- [ ] Delete src/hooks/.gitkeep
- [ ] Delete src/core/.gitkeep
- [ ] Commit: "chore: remove unnecessary .gitkeep files"

**Success Criteria:**
✅ Directories tracked without .gitkeep  
✅ Cleaner file listings

---

### P2-6: Add Performance Benchmarks Documentation
**Effort:** 3 hours  
**Impact:** Medium - Verify claims  
**Owner:** Developer + documentation

**Tasks:**
- [ ] Create test dataset (14 days, 2,000 readings)
- [ ] Benchmark query times:
  - [ ] getMasterDataset(start, end) - Target: <50ms
  - [ ] calculateMetrics() - Target: <200ms
  - [ ] getDayProfile() - Target: <100ms
- [ ] Document methodology in DEVELOPMENT.md
- [ ] Add "Performance Testing" section
- [ ] Update claims to match actual measurements
- [ ] Commit: "docs: add performance benchmarks with methodology"

**Success Criteria:**
✅ All claims verified or corrected  
✅ Reproducible benchmark procedure documented  
✅ Performance targets realistic

---

### P2-7: Update Documentation Read Times
**Effort:** 1 hour  
**Impact:** Medium - Accurate expectations  
**Owner:** Any developer

**Tasks:**
- [ ] Actually time reading each document (scanning vs deep reading)
- [ ] Update claimed read times:
  - [ ] START_HERE.md: 2 min → 3 min
  - [ ] ARCHITECTURE.md: 8 min → verify
  - [ ] DEVELOPMENT.md: 10 min → verify
  - [ ] SENSOR_SYSTEM.md: 8 min → verify
  - [ ] GIT_WORKFLOW.md: 7 min → verify
- [ ] Commit: "docs: update read time estimates to realistic values"

**Success Criteria:**
✅ Read times achievable for thorough reading  
✅ No user complaints about inaccurate times

---

### P2-8: Clarify Console.log Policy
**Effort:** 30 minutes  
**Impact:** Medium - Eliminates contradiction  
**Owner:** Technical writer

**Tasks:**
- [ ] Update DEVELOPMENT.md section on debugging
- [ ] Clarify: "Temporary console.log OK during development"
- [ ] Emphasize: "MUST remove before commit (use grep to verify)"
- [ ] Update SENSOR_SYSTEM.md to align
- [ ] Add to pre-commit checklist
- [ ] Commit: "docs: clarify temporary vs permanent logging policy"

**Success Criteria:**
✅ No contradictions between docs  
✅ Clear guidance on when console.log is acceptable  
✅ Pre-commit checklist includes log removal

---

## WEEK 3: Phase 3 Completion (Effort: ~8 hours)

### All P1-P2 Items Complete
**Review Week:**
- [ ] Verify all Week 1-2 items completed
- [ ] Run full test suite (manual testing)
- [ ] Check browser console (should be clean)
- [ ] Verify all three Phase 3 bugs fixed
- [ ] Update CHANGELOG.md with Phase 3 completion
- [ ] Create PHASE_3_COMPLETE.md handoff document

**Success Criteria:**
✅ All P1 items complete  
✅ All critical P2 items complete  
✅ Phase 3 declared complete  
✅ Ready for Phase 4 planning

---

## WEEK 4: Documentation Polish + Planning (Effort: ~6 hours)

### Polish Tasks

**P3-1: Add Glossary to PROJECT_BRIEFING (1 hour)**
- [ ] Define TIR, TAR, TBR, GMI, CV, AGP
- [ ] Add at end or as sidebar
- [ ] Commit: "docs: add clinical metrics glossary"

**P3-2: Update Line Counts (10 min)**
- [ ] Fix minor line count discrepancies (off by 1-2)
- [ ] Or remove specific line counts
- [ ] Commit: "docs: update line count accuracy"

**P3-3: Standardize Date Formats (15 min)**
- [ ] Choose ISO 8601: 2025-10-27
- [ ] Or choose long form: October 27, 2025
- [ ] Apply consistently across all docs
- [ ] Commit: "docs: standardize date format"

**P3-4: Add Pre-commit Hook Examples (2 hours)**
- [ ] Create .githooks/ directory
- [ ] Add pre-commit script to check console.log
- [ ] Document in GIT_WORKFLOW.md
- [ ] Test hook
- [ ] Commit: "chore: add pre-commit hooks for console.log detection"

**P3-5: Sensor Success Rate Analysis (2 hours)**
- [ ] Calculate success/failure rates from 219 sensors
- [ ] Analyze by lot number
- [ ] Add to SENSOR_SYSTEM.md
- [ ] Create visualization (optional)
- [ ] Commit: "docs: add sensor success rate analysis"

---

## PHASE 4 PLANNING (Week 4)

### Kickoff: Direct CSV → V3 Upload

**Preparation Tasks:**
- [ ] Review current v2parser.js + migrateToV3.js flow
- [ ] Design direct upload (skip v2 layer)
- [ ] Estimate effort: ~2-3 weeks
- [ ] Create PHASE_4_PLAN.md
- [ ] Set success criteria
- [ ] Identify risks

**Goals:**
- Faster upload processing (<200ms)
- Simpler architecture (one transform, not two)
- Maintain backward compatibility
- No data loss during transition

---

## METRICS & SUCCESS TRACKING

### Weekly Review Schedule

**Every Monday:**
- Review progress on current week
- Update checklist
- Identify blockers
- Adjust timeline if needed

**Every Friday:**
- Complete week summary
- Update CHANGELOG.md
- Prepare handoff doc if needed
- Push all commits

### Monthly Review (End of November)

**Success Metrics:**
- [ ] All P1 items complete
- [ ] All high-value P2 items complete
- [ ] Phase 3 officially complete
- [ ] PROJECT_BRIEFING score: 9+/10
- [ ] Zero console.log in production code
- [ ] Documentation consistency: 9+/10
- [ ] Overall project score: 9.5/10 (up from 8.5)

---

## RISK MITIGATION

### Risk 1: Time Overruns
**Mitigation:** Each task has buffer (2h tasks can take 3h)  
**Fallback:** Defer P3 items to December if needed

### Risk 2: Breaking Changes
**Mitigation:** Test thoroughly after each change  
**Fallback:** Git revert if regression found

### Risk 3: Documentation Drift
**Mitigation:** Update docs in same commit as code  
**Fallback:** Dedicated doc sync day each Friday

---

## POST-Q4 ROADMAP

### Q1 2026: Phase 4 + Advanced Features
- Direct CSV → V3 upload
- Sensor dashboard (Phase 2C)
- Multi-period comparison (3+ periods)

### Q2 2026: Performance + Scale
- Test with 100k+ readings
- Optimize sorted array rebuilds
- Add service worker caching

### Q3 2026: Integration + Export
- PDF export (not just HTML)
- API for external integrations
- Advanced analytics

---

**Roadmap Version:** 1.0  
**Last Updated:** October 27, 2025  
**Status:** Ready to execute  
**Owner:** Development team

🚀 **Let's elevate AGP+ to exceptional quality!**