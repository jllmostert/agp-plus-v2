# CLEANUP PLAN - AGP+ v3.0

**Date:** October 29, 2025  
**Goal:** Clean project structure, één handoff, merge to main

---

## 📋 CURRENT STATE ANALYSIS

### Root Directory
- ✅ CHANGELOG.md (keep - updated)
- ✅ README.md (keep - needs update)
- ✅ agp-project-status.html (keep - new dashboard)
- ❌ PROJECT_BRIEFING_V3_8.md (archive - outdated, we have V3_0 in docs)
- ❌ backup-before-console-cleanup/ (delete - temporary backup)
- ❌ cleanup-console-logs.cjs (delete - one-time script)
- ❌ test-*.html, test-*.js files (archive - debug tools)

### /docs/ Directory
**HANDOFFS - Multiple versions exist:**
- HANDOFF_2025_10_28_VERIFIED.md
- HANDOFF_V3_0_FINAL.md ⭐ (KEEP THIS ONE)
- HANDOFF_V3_1_PHASE_0_TDD_READY.md
- handoffs/HANDOFF_2025_10_29_DEBUG_REORGANIZATION.md

**STATUS - Multiple versions:**
- V3_0_PRODUCTION_STATUS.md ⭐ (KEEP)
- V3_PHASE_4_STATUS_CHECK.md (archive - superseded)

**ARCHITECTURE:**
- V3_ARCHITECTURE.md ⭐ (KEEP)
- V3_ARCHITECTURE_DECISIONS.md ⭐ (KEEP)
- V3_IMPLEMENTATION_GUIDE.md ⭐ (KEEP)

**PROJECT BRIEFINGS:**
- PROJECT_BRIEFING_V3_0.md (in docs)
- PROJECT_BRIEFING_V2_2_0 (in Claude project files)
- Need to consolidate

**INDEX FILES:**
- START_HERE.md
- DOCUMENTATION_INDEX.md
- V3_MASTER_INDEX.md
- MASTER_INDEX_V2_2_0.md (in Claude)
- Need to consolidate

### Claude Project Files
- agp-project-status.html (OLD version)
- HANDOFF_PROMPT_V2_2_0.md (outdated)
- PROJECT_BRIEFING_V2_2_0_PART1.md (outdated)
- PROJECT_BRIEFING_V2_2_0_PART2.md (outdated)
- MASTER_INDEX_V2_2_0.md (outdated)

---

## 🎯 CLEANUP ACTIONS

### 1. Root Directory Cleanup

**Archive to `/docs/archive/debug-tools/`:**
- test-phase4.html
- test-phase4.js
- test_csv_upload.js
- test_events.html
- test_fresh_csv_upload.js
- test_sensor_clustering.js
- test_upload_verification.js
- manipulate_test_csv.py

**Delete (temporary files):**
- backup-before-console-cleanup/
- cleanup-console-logs.cjs

**Archive to `/docs/archive/old-briefings/`:**
- PROJECT_BRIEFING_V3_8.md

---

### 2. Docs Directory Consolidation

**Create ONE master handoff: `HANDOFF.md`**
Based on HANDOFF_V3_0_FINAL.md but renamed to remove version

**Archive old handoffs to `/docs/archive/handoffs-oct2025/`:**
- HANDOFF_2025_10_28_VERIFIED.md
- HANDOFF_V3_1_PHASE_0_TDD_READY.md
- handoffs/HANDOFF_2025_10_29_DEBUG_REORGANIZATION.md

**Keep in /docs/ root:**
- HANDOFF.md (renamed from HANDOFF_V3_0_FINAL.md)
- TEST_PLAN.md (renamed from TEST_PLAN_V3_0.md)
- STATUS.md (renamed from V3_0_PRODUCTION_STATUS.md)
- V3_ARCHITECTURE.md (keep as-is)
- V3_ARCHITECTURE_DECISIONS.md (keep as-is)
- V3_IMPLEMENTATION_GUIDE.md (keep as-is)
- GIT_WORKFLOW.md (keep as-is)
- metric_definitions.md (keep as-is)
- minimed_780g_ref.md (keep as-is)

**Archive to `/docs/archive/old-index-files/`:**
- START_HERE.md
- DOCUMENTATION_INDEX.md
- DOCUMENTATION_RENAMING_SUMMARY.md
- V3_MASTER_INDEX.md
- V3_PHASE_4_STATUS_CHECK.md
- V3_1_PHASE_0_TDD_METRICS.md
- PROJECT_BRIEFING_V3_0.md

---

### 3. Claude Project Files Update

**Replace with current versions:**
- agp-project-status.html (use laptop version)
- Remove all V2_2_0 files (outdated)

**New Claude project structure:**
- HANDOFF.md (simplified, no version number)
- STATUS.md (current state)
- TEST_PLAN.md (testing guide)
- V3_ARCHITECTURE.md (system design)
- metric_definitions.md (clinical reference)
- minimed_780g_ref.md (device reference)
- agp-project-status.html (visual dashboard)
- Sample CSV (Jo_Mostert_24-10-2025_SAMPLE.csv)

---

### 4. README.md Update

**Current README.md needs:**
- Remove "v2.2" references
- Update to v3.0 features
- Simplify getting started
- Remove outdated screenshots references

---

### 5. Git Branch Consolidation

**Current branches:**
- main (old state)
- v3.0-dev (development)
- v3.1-insulin (current work)

**Actions:**
1. Merge v3.1-insulin → v3.0-dev (squash if needed)
2. Merge v3.0-dev → main
3. Tag v3.0.0 on main
4. Delete v3.1-insulin branch (work complete)
5. Keep v3.0-dev for future work

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1: Root Directory
- [ ] Create /docs/archive/debug-tools/
- [ ] Move test files to archive
- [ ] Delete backup-before-console-cleanup/
- [ ] Delete cleanup-console-logs.cjs
- [ ] Create /docs/archive/old-briefings/
- [ ] Move PROJECT_BRIEFING_V3_8.md to archive

### Phase 2: Docs Consolidation  
- [ ] Create /docs/archive/handoffs-oct2025/
- [ ] Move old handoffs to archive
- [ ] Rename HANDOFF_V3_0_FINAL.md → HANDOFF.md
- [ ] Rename TEST_PLAN_V3_0.md → TEST_PLAN.md
- [ ] Rename V3_0_PRODUCTION_STATUS.md → STATUS.md
- [ ] Create /docs/archive/old-index-files/
- [ ] Move old index files to archive

### Phase 3: README Update
- [ ] Update README.md to v3.0
- [ ] Remove version-specific language
- [ ] Add simple getting started guide
- [ ] Update feature list

### Phase 4: Claude Project Files
- [ ] Update agp-project-status.html
- [ ] Add HANDOFF.md
- [ ] Add STATUS.md
- [ ] Add TEST_PLAN.md
- [ ] Keep V3_ARCHITECTURE.md
- [ ] Keep metric/device definitions
- [ ] Remove all V2_2_0 files

### Phase 5: Git Merge
- [ ] Review all changes
- [ ] Commit cleanup to v3.1-insulin
- [ ] Merge v3.1-insulin → v3.0-dev
- [ ] Merge v3.0-dev → main
- [ ] Tag v3.0.0
- [ ] Push all branches and tags
- [ ] Delete v3.1-insulin branch

---

## 🎯 FINAL STRUCTURE

### Root
```
/
├── CHANGELOG.md
├── README.md (updated)
├── agp-project-status.html
├── package.json
├── index.html
├── vite.config.js
├── /docs/
├── /src/
├── /public/
└── /test-data/
```

### /docs/
```
/docs/
├── HANDOFF.md ⭐ (start here for new AI)
├── STATUS.md (current state)
├── TEST_PLAN.md (testing procedures)
├── V3_ARCHITECTURE.md (system design)
├── V3_ARCHITECTURE_DECISIONS.md (ADRs)
├── V3_IMPLEMENTATION_GUIDE.md (phase roadmap)
├── GIT_WORKFLOW.md (git conventions)
├── metric_definitions.md (clinical formulas)
├── minimed_780g_ref.md (device specs)
└── /archive/ (historical docs)
```

### Claude Project
```
/mnt/project/
├── HANDOFF.md
├── STATUS.md
├── TEST_PLAN.md
├── V3_ARCHITECTURE.md
├── metric_definitions.md
├── minimed_780g_ref.md
├── agp-project-status.html
└── Jo_Mostert_24-10-2025_SAMPLE.csv
```

---

## ⚠️ IMPORTANT NOTES

1. **No "production-ready" language** - Just say "v3.0 complete" or "ready for testing"
2. **Remove version numbers from filenames** - HANDOFF.md not HANDOFF_V3_0.md
3. **Keep it simple** - One handoff, one status, one test plan
4. **Archive everything else** - Don't delete, just move to archive

---

END OF CLEANUP PLAN
