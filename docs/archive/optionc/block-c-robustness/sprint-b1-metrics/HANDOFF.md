# SPRINT B1: METRICS VALIDATION

**Block**: C - Robustness  
**Sprint**: B1 - Metrics Validation  
**Effort**: 7 hours  
**Status**: 🔄 READY TO START  
**Last Update**: 2025-11-02

---

## 🎯 DOEL

Valideer dat de metrics engine:
1. **Snel genoeg is** - Performance <1000ms voor alle dataset groottes
2. **Correct werkt** - Unit tests voor alle calculations
3. **Edge cases handelt** - DST, missing data, single day

**Waarom kritiek**: 
- Je weet dat metrics accuraat zijn (Domain B score: 9.0/10)
- Maar: GEEN performance data, GEEN tests
- Voor v4.0: Je moet BEWIJZEN dat het snel én correct is

---

## 📋 TAKEN (7u totaal)

### Taak 1: Performance Benchmarking (3u)

**Doel**: Meet hoe lang metrics berekeningen duren voor verschillende dataset groottes

**Subtaken**:
- [ ] Setup benchmarking framework (30 min)
- [ ] Test 14 dagen data (~4000 readings) (30 min)
- [ ] Test 90 dagen data (~26000 readings) (30 min)
- [ ] Test 365 dagen data (~100000 readings) (30 min)
- [ ] Document results in METRICS_BENCHMARK.md (1u)

**Success criteria**:
- Alle tests <1000ms
- Benchmark doc met grafieken/tabellen
- Clear recommendations if over budget

---

### Taak 2: Unit Tests (4u)

**Doel**: Test alle metric calculations voor correctness

**Subtaken**:
- [ ] Setup test framework (Jest) (30 min)
- [ ] MAGE calculation tests (1u)
  - [ ] Basic calculation (known input/output)
  - [ ] Edge case: No excursions >1 SD
  - [ ] Edge case: Single data point
- [ ] MODD calculation tests (1u)
  - [ ] Basic calculation
  - [ ] Edge case: Single day data
  - [ ] Edge case: Missing time points
- [ ] GRI calculation tests (1u)
  - [ ] Components (hypo + hyper)
  - [ ] Edge case: All in range (TIR=100%)
- [ ] DST transition handling (30 min)
  - [ ] Spring forward
  - [ ] Fall back

**Success criteria**:
- All tests pass
- Edge cases covered
- >80% code coverage for metrics-engine.js

---

## 📁 FILES

**Te lezen**:
- `/src/engines/metrics-engine.js` (422 lines) - Main metrics calculations
- `/src/hooks/useMetrics.js` (97 lines) - React hook wrapper

**Te maken**:
- `/src/engines/__tests__/metrics-engine.test.js` - Unit tests
- `/docs/performance/METRICS_BENCHMARK.md` - Benchmark results

**Reference**:
- `/docs/reference/metric_definitions.md` - Metric formulas
- `/docs/analysis/DOMAIN_B_METRICS_ANALYSIS.md` - Architecture analysis

---

## 🚀 WORKFLOW

### Start Sprint
```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Check je bent op develop
git status
git pull origin develop

# Ga naar sprint folder
cd docs/optionc/block-c-robustness/sprint-b1-metrics

# Lees deze HANDOFF
cat HANDOFF.md

# Create PROGRESS.md (source of truth)
touch PROGRESS.md
```

### During Sprint
**Werk in kleine chunks** (max 30 min per taak)  
**Update PROGRESS.md** na elke chunk (real-time!)  
**Commit regelmatig**:
```bash
git add .
git commit -m "test(metrics): Add MAGE calculation tests"
git push origin develop
```

### End Sprint
```bash
# Final commit
git add .
git commit -m "feat(sprint-b1): Complete metrics validation

- Performance benchmarks: 3-64ms (excellent)
- Unit tests: MAGE, MODD, GRI (all pass)
- Coverage: 85%
- Docs: METRICS_BENCHMARK.md"

git push origin develop

# Update MASTER_PROGRESS.md
cd ../../..
# Mark Sprint B1 as complete
```

---

## 💡 TIPS

**Performance Benchmarking**:
- Use `console.time()` / `console.timeEnd()`
- Run each test 10x, take average
- Test with actual CSV data from `/test-data/`

**Unit Testing**:
- Use known datasets with verified outputs
- Check metric_definitions.md for formulas
- Test edge cases first (they catch most bugs)

**Token Management**:
- Read files in chunks (offset/length)
- Write tests in small batches
- Commit after each test suite

---

## ✅ DEFINITION OF DONE

- [ ] All performance tests <1000ms
- [ ] METRICS_BENCHMARK.md created with results
- [ ] All unit tests pass (MAGE, MODD, GRI)
- [ ] Edge cases covered (DST, missing data, single day)
- [ ] Code coverage >80%
- [ ] PROGRESS.md updated with session notes
- [ ] Git committed + pushed
- [ ] MASTER_PROGRESS.md updated

---

**Version**: 1.0  
**Created**: 2025-11-02  
**Ready**: YES - Start wanneer je wilt!
