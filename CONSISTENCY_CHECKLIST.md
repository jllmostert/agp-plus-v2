# AGP+ Consistency Verification Checklist

**Purpose:** Maintain documentation/code consistency across sessions  
**Usage:** Run before commits, releases, and monthly reviews  
**Version:** 1.0  
**Last Updated:** October 27, 2025

---

## 📋 BEFORE EACH COMMIT

### Code Quality
- [ ] **Zero console.log statements** (except console.error for user-facing errors)
  ```bash
  grep -r "console.log" src/ | grep -v "console.error"
  # Should return nothing
  ```

- [ ] **No commented-out code**
  ```bash
  # Manual review of changed files
  # Delete dead code, don't comment it out
  ```

- [ ] **Architecture layers respected**
  - [ ] Components: Only presentation logic (no calculations)
  - [ ] Hooks: Only orchestration (no business logic)
  - [ ] Engines: Only pure functions (no React imports)
  - [ ] Storage: Only CRUD operations (no transformations)

- [ ] **Brutalist design maintained**
  - [ ] 3px black borders used
  - [ ] Courier New monospace only
  - [ ] No gradients, shadows, or rounded corners
  - [ ] Clinical colors only (#dc2626, #fcd34d, #16a34a)
  - [ ] Print-compatible patterns (not color-dependent)

### Documentation
- [ ] **Version numbers match everywhere**
  ```bash
  grep -r "Version:" *.md
  grep "version" package.json
  # All should show same version (e.g., 3.8.2)
  ```

- [ ] **Status statements consistent**
  ```bash
  grep -r "Status:" START_HERE.md PROJECT_BRIEFING*.md
  # Should all say "Phase X Complete, Phase Y Ready"
  ```

- [ ] **Cross-references valid**
  - [ ] Check links between docs (→ FILE.md references)
  - [ ] Ensure referenced sections exist
  - [ ] No broken "See section X" links

- [ ] **Examples tested**
  - [ ] Code examples actually run
  - [ ] Commands work as documented
  - [ ] No syntax errors in code blocks

---

## 🚀 BEFORE EACH RELEASE

### Documentation Review

- [ ] **All TIER 1-2-3 docs reviewed**
  - [ ] START_HERE.md - Current status accurate
  - [ ] ARCHITECTURE.md - Data schemas match code
  - [ ] DEVELOPMENT.md - Patterns still correct
  - [ ] SENSOR_SYSTEM.md - Process flow accurate
  - [ ] GIT_WORKFLOW.md - Commands still work
  - [ ] PROJECT_BRIEFING - Technical specs aligned

- [ ] **CHANGELOG.md updated**
  - [ ] New version entry added
  - [ ] Date stamp accurate
  - [ ] All changes listed
  - [ ] Breaking changes highlighted

- [ ] **Version consistency across all files**
  ```bash
  # Check these files explicitly:
  cat START_HERE.md | grep "Version:"
  cat ARCHITECTURE.md | grep "v3.8"
  cat DEVELOPMENT.md | grep "v3.8"
  cat SENSOR_SYSTEM.md | grep "v3.8"
  cat PROJECT_BRIEFING_V3_8.md | grep "Version:"
  cat package.json | grep '"version"'
  # All must match
  ```

### Code Review

- [ ] **All tests pass** (manual testing checklist)
  - [ ] Upload CSV → data appears
  - [ ] Change date range → metrics update
  - [ ] Open day profiles → all 7 render
  - [ ] Sensor lines visible (if sensors imported)
  - [ ] Comparison works (if valid date range)
  - [ ] Export downloads successfully
  - [ ] ProTime workdays persist after reload

- [ ] **Browser console clean**
  - [ ] Open Chrome DevTools console
  - [ ] Navigate through app features
  - [ ] No errors (red) or warnings (yellow)
  - [ ] Only intentional console.error messages

- [ ] **Performance acceptable**
  ```bash
  # In browser console, time key operations:
  console.time('Query 14 days');
  // ... run query ...
  console.timeEnd('Query 14 days');  // Target: <50ms
  
  console.time('Calculate metrics');
  // ... calculate ...
  console.timeEnd('Calculate metrics');  // Target: <200ms
  ```

- [ ] **Design philosophy maintained**
  - [ ] Run visual inspection (open every component)
  - [ ] Check print preview (Cmd+P in browser)
  - [ ] Verify patterns work in black & white
  - [ ] No accidental gradients or shadows introduced

### Git Hygiene

- [ ] **Branch clean**
  ```bash
  git status
  # Should show clean working tree
  ```

- [ ] **No backup files in src/**
  ```bash
  find src/ -name "*.backup" -o -name "*_CHUNK*"
  # Should return nothing
  ```

- [ ] **No .gitkeep in populated directories**
  ```bash
  find src/ -name ".gitkeep"
  # Check each - delete if directory has files
  ```

---

## 📅 MONTHLY REVIEW (First Friday of Month)

### Consistency Audit

- [ ] **Documentation still accurate**
  - [ ] Read time claims realistic
  - [ ] Line counts accurate (or removed)
  - [ ] File paths valid
  - [ ] Referenced line numbers correct
  - [ ] Examples match current code

- [ ] **No new inconsistencies**
  ```bash
  # Run these checks:
  
  # 1. Version numbers
  grep -r "3\.[0-9]\.[0-9]" *.md | sort | uniq
  
  # 2. Status statements
  grep -r "Phase [0-9]" *.md | sort | uniq
  
  # 3. Date references
  grep -r "202[0-9]-[0-9][0-9]-[0-9][0-9]" *.md | sort | uniq
  ```

- [ ] **Cross-doc terminology consistent**
  - [ ] "Master dataset" vs "master dataset" (pick one)
  - [ ] "IndexedDB" vs "indexedDB" (correct: IndexedDB)
  - [ ] "localStorage" vs "LocalStorage" (correct: localStorage)
  - [ ] "ProTime" vs "Protime" (correct: ProTime)

### Code Quality Trends

- [ ] **No architectural drift**
  ```bash
  # Check engines for React imports:
  grep -r "useState\|useEffect" src/core/
  # Should return nothing
  
  # Check components for calculations:
  grep -r "filter.*glucose.*70.*180" src/components/
  # Should return nothing (calculations belong in engines)
  ```

- [ ] **Performance acceptable**
  - [ ] Dataset size: _____ readings (track growth)
  - [ ] Average query time: _____ ms (should be <50ms)
  - [ ] Metrics calc time: _____ ms (should be <200ms)
  - [ ] Page load time: _____ ms (should be <2s)

- [ ] **User feedback incorporated**
  - [ ] Review any user complaints
  - [ ] Check for recurring issues
  - [ ] Update docs if questions repeat

### Debt Tracking

- [ ] **Technical debt documented**
  - [ ] List known workarounds
  - [ ] Flag areas needing refactor
  - [ ] Estimate refactor effort

- [ ] **Documentation debt tracked**
  - [ ] List missing sections
  - [ ] Flag outdated explanations
  - [ ] Prioritize updates

---

## 🔧 COMMANDS FOR CONSISTENCY CHECKS

### Quick Version Check
```bash
cd /Users/jomostert/Documents/Projects/agp-plus

echo "=== VERSION AUDIT ==="
echo "START_HERE.md:"
grep "Version:" START_HERE.md

echo "PROJECT_BRIEFING:"
grep "Version:" PROJECT_BRIEFING*.md

echo "package.json:"
grep '"version"' package.json

echo "CHANGELOG.md (latest):"
head -20 CHANGELOG.md | grep "\[3\."
```

### Quick Console.log Check
```bash
echo "=== CONSOLE.LOG AUDIT ==="
echo "Total console.log statements:"
grep -r "console.log" src/ | grep -v "console.error" | wc -l
echo "(Should be 0)"

echo "Files with console.log:"
grep -rl "console.log" src/ | grep -v ".gitkeep"
```

### Quick Architecture Check
```bash
echo "=== ARCHITECTURE AUDIT ==="

echo "React imports in engines (should be 0):"
grep -r "from 'react'" src/core/ | wc -l

echo "Business logic in components (manual review needed):"
grep -r "filter.*glucose.*[0-9][0-9]" src/components/

echo "IndexedDB in hooks (should use storage layer):"
grep -r "indexedDB.open\|openDB" src/hooks/
```

### Quick File Cleanup Check
```bash
echo "=== FILE CLEANUP AUDIT ==="

echo "Backup files:"
find src/ -name "*.backup" -o -name "*_CHUNK*"

echo ".gitkeep in populated directories:"
for dir in src/components src/hooks src/core src/storage; do
  if [ -f "$dir/.gitkeep" ]; then
    count=$(ls -1 "$dir" | wc -l)
    if [ $count -gt 1 ]; then
      echo "$dir has .gitkeep but $count files (should remove .gitkeep)"
    fi
  fi
done
```

---

## 📊 CONSISTENCY SCORECARD

Track monthly scores:

| Category | Oct 2025 | Nov 2025 | Dec 2025 | Target |
|----------|----------|----------|----------|--------|
| Version consistency | 7/10 | __/10 | __/10 | 10/10 |
| Doc accuracy | 9/10 | __/10 | __/10 | 10/10 |
| Code cleanliness | 7/10 | __/10 | __/10 | 10/10 |
| Architecture adherence | 9/10 | __/10 | __/10 | 10/10 |
| Design consistency | 9.5/10 | __/10 | __/10 | 10/10 |
| **Overall** | **8.5/10** | **__/10** | **__/10** | **9.5/10** |

### Scoring Guidelines

**10/10:** Perfect - zero issues found  
**9/10:** Excellent - 1-2 minor issues  
**8/10:** Good - 3-5 minor issues  
**7/10:** Acceptable - several minor issues or 1 medium issue  
**6/10:** Needs work - multiple medium issues  
**<6/10:** Critical - immediate attention required

---

## 🎯 CONSISTENCY BEST PRACTICES

### When Adding Features

1. **Update docs in same commit as code**
   - Code change → Update relevant .md file
   - New module → Document in PROJECT_BRIEFING
   - Breaking change → Update CHANGELOG.md

2. **Follow established patterns**
   - Check existing code for style
   - Use same function names (consistent conventions)
   - Match brutalist design (3px borders, monospace)

3. **Test documentation**
   - Run example commands
   - Verify code samples compile
   - Check cross-references

### When Finding Inconsistencies

1. **Document the issue**
   - File location
   - What's inconsistent
   - Suggested fix

2. **Fix immediately if small**
   - Version numbers → global replace
   - Typos → quick fix
   - Broken links → update

3. **Create ticket if large**
   - Major refactor needed
   - Multiple files affected
   - Breaking changes required

### Maintaining Consistency

- **Single source of truth** for metadata
  - Version: package.json
  - Status: START_HERE.md
  - Dates: ISO 8601 format (2025-10-27)

- **Automated checks** (future)
  - Pre-commit hooks for console.log
  - CI checks for version consistency
  - Link checker for docs

- **Regular audits** (monthly)
  - Full consistency check
  - Update scorecard
  - Prioritize fixes

---

## ✅ PRE-COMMIT COMMAND (ONE-LINER)

```bash
# Run before every git commit:
grep -r "console.log" src/ | grep -v "console.error" && echo "❌ FAIL: Remove console.log" || echo "✅ PASS: No console.log"
```

Add to .git/hooks/pre-commit for automatic checking.

---

**Checklist Version:** 1.0  
**Created:** October 27, 2025  
**Owner:** All developers  
**Review:** Monthly

🎯 **Consistency is the glue that holds quality documentation and code together!**