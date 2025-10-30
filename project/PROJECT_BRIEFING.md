---
tier: 2
status: draft
last_updated: 2025-10-30
purpose: Strategic overview and scope definition for v3.1 Sensor Registration phase
---

# PROJECT BRIEFING — AGP+ v3.1 Sensor Registration

**Version:** v3.1.0  
**Phase:** Debug & Implementation  
**Date:** 2025-10-30  
**Status:** 🔨 In Development

---

## 🧭 1. Context & Doelstelling

### Project Overview

**AGP+ (Ambulatory Glucose Profile Plus)** is a React-based web application for analyzing continuous glucose monitoring (CGM) data from Medtronic CareLink CSV exports. Designed for healthcare professionals and people managing diabetes, AGP+ generates clinical reports and glucose pattern analysis following ADA/ATTD guidelines.

**Design philosophy**: Brutalist — high contrast, print-compatible, rapid clinical scanning over aesthetic appeal.

**Technical stack**: React, Vite, IndexedDB, sql.js

### Current Situation

Project resumed after 3-day hiatus. v3.0 is production-ready with master dataset architecture and verified sensor detection from alerts. However, **critical gap identified**: 

- ✅ 219 sensors imported from external SQLite database
- ❌ No mechanism to add new sensors from CareLink CSV files
- ❌ CSV-based sensor registration incomplete

### Phase Objective (v3.1 Sensor Registration Debug Cycle)

**Primary goal**: Enable reliable sensor detection and registration directly from CareLink CSV exports.

**Key deliverables**:
1. CSV section parser (auto-detect 3-section format)
2. Glucose gap analyzer (≥120 min detection)
3. Alert cluster + gap matching engine
4. Registration UI (review/confirm/ignore candidates)
5. Lock-based CRUD (protect historical sensors)

**Transition context**: Moving from analytical testing (v3.0) to structural reliability (v3.1). This phase establishes the foundation for autonomous sensor tracking without external database dependencies.

---

## ⚙️ 2. Scope van deze fase

### In Scope

**Core functionality**:
- [ ] CSV section parser with automatic boundary detection
- [ ] Glucose gap analyzer (transmitter charge + warmup periods)
- [ ] Alert clustering (4-hour window, canonical types)
- [ ] Cluster-gap matcher (±6h correlation window)
- [ ] Confidence scoring (high/medium/low)
- [ ] Registration UI with debug panel
- [ ] Lock-based database protection (cutoff date system)
- [ ] Idempotent sensor insertion (avoid duplicates)

**Testing**:
- [ ] Validate with 7-day CSV (2 expected sensors)
- [ ] Validate with 90-day CSV (multi-sensor detection)
- [ ] Edge case handling (gaps without alerts, clusters without gaps)

**Documentation**:
- [ ] Update STATUS.md with phase progress
- [ ] Update agp-project-status.html
- [ ] Complete PROJECT_BRIEFING.md (this document)

### Out of Scope

**Deferred to future phases**:
- Stock/lot number integration (v3.2)
- Sensor splitting (manual intervention for multi-sensor clusters)
- PDF export of sensor history
- Historical data migration (219 existing sensors remain as-is)
- Multi-language support
- Real-time validation during upload

**Explicitly excluded**:
- Changes to existing metrics calculations (TIR, MAGE, MODD)
- UI redesign or color scheme changes
- Performance optimizations beyond baseline requirements
- Mobile responsiveness improvements

---

## 🧩 3. Actieve bestanden en infrastructuur

### Project Structure

**Root**: `/Users/jomostert/Documents/Projects/agp-plus`

**Key directories**:
```
src/
├── core/              ← Pure calculation engines (Phase 1-3)
├── storage/           ← IndexedDB + SQLite modules (Phase 5)
├── components/        ← React UI (Phase 4)
├── hooks/             ← Orchestration layer
└── utils/             ← Shared utilities

project/               ← Tier 2 docs (STATUS, TEST_PLAN, architecture)
reference/             ← Tier 3 docs (metrics, device ref, git workflow)
test-data/             ← Real CSV exports (read-only)
public/debug/          ← Temporary debug output
```

### Development Environment

**Server**: Vite dev server on port 3001  
**Startup**: Always via Desktop Commander (see HANDOFF.md)  
**Browser**: Chrome with DevTools  
**Control**: Chrome Commander for automation

### Data Sources

**Test data** (read-only, never modify):
- `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv` (2826 lines, 7 days)
- `test-data/Jo Mostert 30-10-2025_90d.csv` (90-day export)
- `test-data/CSVs_permaand/*.csv` (historical monthly exports)

**Sensor database**:
- `public/sensor_database.db` (SQLite, 219 sensors, 2022-2025)
- IndexedDB: `agp-plus-v3` → `sensors` table

**Debug output**:
- `public/debug/` (parser logs, match results, cluster analysis)
- `agp-project-status.html` (live status dashboard)

---

## 🧠 4. Technische focus

### Module Architecture

**Phase 1: CSV Section Parser** (`src/core/csvSectionParser.js`)
- Auto-detect `Index;Date;Time;` header patterns (3 occurrences)
- Split sections: deviceEvents, autoInsulin, sensorGlucose
- Delimiter auto-detection (; vs ,)
- Return structured: `{ alerts: [], glucose: [], insulin: [] }`

**Phase 2: Gap Analyzer** (`src/core/glucoseGapAnalyzer.js`)
- Sort glucose readings by timestamp
- Calculate Δt between consecutive readings (expected: 5 min)
- Flag gaps ≥120 min (transmitter charge ~30 min + warmup ~120 min)
- Return: `[{ startTime, endTime, durationMin }]`

**Phase 3: Cluster-Gap Matcher** (`src/core/sensorDetectionEngine.js`)
- Integrate existing `sensorEventClustering.js` (4h window)
- Match alert clusters to nearby gaps (±6h window)
- Confidence scoring:
  - **High**: SENSOR CONNECTED + nearby gap
  - **Medium**: CHANGE SENSOR only, or gap only
  - **Low**: LOST SIGNAL clusters (ignore)
- Return: `[{ cluster, gap, confidence, timestamp }]`

**Phase 4: Registration UI** (`src/components/SensorRegistration.jsx`)
- CSV upload input
- "Load & Analyse" button → trigger parser + matcher
- Candidates table: timestamp, confidence, alert summary, gap info
- Actions per candidate: ✓ Confirm | ✗ Ignore | ✂ Split
- Debug panel: Show clusters, gaps, match logic
- On confirm: `addSensor()` to IndexedDB

**Phase 5: Lock System** (extend `src/storage/sensorStorage.js`)
- Add `locked` boolean field to sensor schema
- `lockSensorsBeforeDate(cutoff)` → batch update
- Safe delete: `if (sensor.locked) throw Error()`
- Safe update: same logic
- UI indicator: 🔒 icon for locked sensors

### Performance Targets

- CSV parse: < 500ms for 30-day file (~10k rows)
- Gap detection: < 200ms for 2000 glucose readings
- Cluster matching: < 100ms for typical dataset
- UI render: < 1s for candidates table
- Total workflow: < 2s from upload to review screen

### Data Integrity Rules

**Idempotent insertion**:
- Match by `start_timestamp ± 30 min` AND `end_timestamp ± 30 min`
- If match found → skip insertion (log "duplicate")
- Prevents re-upload creating duplicates

**Lock policy**:
- Cutoff date: Start of current month (Oct 1, 2025)
- All 219 existing sensors → `locked = true`
- New sensors from current month CSV → `locked = false`
- UI warning if attempting to modify locked sensor

**Gap detection thresholds**:
- Minimum gap: 120 minutes (2 hours)
- Typical transmitter charge: ~30 min
- Typical warmup: ~120 min (Guardian 4 standard)
- Total expected gap: 120-180 min

**Alert clustering**:
- Window: 4 hours (240 minutes)
- Canonical types: SENSOR CONNECTED, CHANGE SENSOR
- Ignore types: LOST SENSOR SIGNAL, SENSOR UPDATING ALERT
- Multiple alerts within window → single cluster

---

## 🧪 5. Teststrategie

### Test Plan Reference

See `project/TEST_PLAN.md` for complete test scenarios.

### Key Test Cases

**Case A: Single sensor change (high confidence)**
- Input: 7d CSV with SENSOR CONNECTED + gap
- Expected: 1 high-confidence candidate
- Validation: Timestamp matches alert cluster midpoint

**Case B: Ambiguous cluster (medium confidence)**
- Input: CHANGE SENSOR without SENSOR CONNECTED
- Expected: 1 medium-confidence candidate requiring review
- Validation: UI shows "needs confirmation" badge

**Case C: Multiple sensors (90d CSV)**
- Input: 90-day export with 10+ sensor changes
- Expected: 10+ candidates detected
- Validation: No duplicates, chronological order maintained

**Case D: Gap without alerts (edge case)**
- Input: Glucose dropout without sensor events
- Expected: Candidate flagged as "unknown gap"
- Validation: Lower confidence, manual review suggested

**Case E: Re-upload idempotency**
- Input: Upload same CSV twice
- Expected: Second upload detects existing sensors, skips insertion
- Validation: Sensor count unchanged, log shows "duplicate" messages

### Unit Testing

**Per-module validation**:
```javascript
// csvSectionParser.js
- detectSectionBoundaries() → returns 3 line numbers
- parseSection() → returns array of objects

// glucoseGapAnalyzer.js
- detectGaps() → finds expected gaps
- calculateGapDuration() → accurate minute calculation

// sensorDetectionEngine.js
- matchClustersToGaps() → correct pairing
- scoreConfidence() → appropriate high/medium/low assignment

// sensorStorage.js
- addSensor() with existing → returns "duplicate"
- lockSensorsBeforeDate() → updates locked field
- deleteSensor() on locked → throws error
```

### Result Tracking

**Update after each test run**:
1. `project/STATUS.md` → Check/uncheck phase completion boxes
2. `agp-project-status.html` → Update phase status badges
3. `public/debug/test-results.json` → Append test run metadata

**Visual verification**:
- UI shows correct candidate count
- Debug panel displays cluster + gap details
- Confidence badges match expected levels
- Lock icons appear for protected sensors

---

## 🧱 6. Rollen en verantwoordelijkheden

| Role | Responsibility |
|------|----------------|
| **Jo Mostert** | Functional project management, domain expertise (diabetes/CGM), final validation |
| **Claude (Sonnet 4.5)** | Implementation, debugging, documentation updates, test execution |
| **Desktop Commander** | File operations, server management, git commits |

**Decision authority**:
- Technical decisions (architecture, algorithms): Claude with Jo review
- Clinical decisions (thresholds, metric definitions): Jo final authority
- UI/UX decisions: Jo final authority
- Testing scope: Collaborative, documented in TEST_PLAN.md

---

## 🧭 7. Output van deze fase (Deliverables)

### Functional Deliverables

- [ ] Working CSV-based sensor registration flow
- [ ] Idempotent CRUD operations with lock protection
- [ ] UI with review panel (confirm/ignore/split actions)
- [ ] Debug logging system (parser output, match results)

### Test Deliverables

- [ ] 2 confirmed sensor changes in 7d test CSV
- [ ] 10+ confirmed sensors in 90d test CSV
- [ ] All test cases (A-E) passed and documented
- [ ] Edge case handling verified (gaps without alerts, etc.)

### Documentation Deliverables

- [ ] Completed `PROJECT_BRIEFING.md` (this document)
- [ ] Updated `project/STATUS.md` with phase checkboxes
- [ ] Updated `agp-project-status.html` with v3.1 progress
- [ ] Handoff document for next session

### Code Quality

- [ ] All modules follow naming conventions (`reference/GIT_WORKFLOW.md`)
- [ ] Separation of concerns: engines (pure) / hooks (orchestration) / components (UI)
- [ ] Debug statements removed or controlled via feature flag
- [ ] No console errors in production build

### Version Control

- [ ] Commit after each phase completion
- [ ] Descriptive commit messages following conventions
- [ ] Final commit tagged: `v3.1-sensor-registration-complete`

---

## 🧩 8. Wat hoort NIET in deze briefing

**Exclusions** (documented elsewhere):

- **Metrics calculations** → `reference/metric_definitions.md`
- **Architecture details** → `project/V3_ARCHITECTURE.md`
- **Design decisions** → `reference/V3_ARCHITECTURE_DECISIONS.md`
- **Git workflow** → `reference/GIT_WORKFLOW.md`
- **Detailed test cases** → `project/TEST_PLAN.md`
- **UI specifications** → Design docs (if separate)
- **Sensor lifecycle details** → `reference/minimed_780g_ref.md`

**This briefing focuses on**: Why this phase exists, what we're building, how we'll measure success.

---

## ✅ 9. Definition of Done

### Functional Completion

- [ ] CSV parser handles 3-section format reliably
- [ ] Gap analyzer detects 120+ min dropouts accurately
- [ ] Matcher correlates clusters + gaps with ±6h window
- [ ] UI allows review and confirmation of candidates
- [ ] Lock system prevents modification of historical sensors
- [ ] Idempotent re-upload tested and working

### Test Completion

- [ ] Test Case A: ✅ High-confidence detection verified
- [ ] Test Case B: ✅ Medium-confidence review flow works
- [ ] Test Case C: ✅ Multi-sensor detection in 90d CSV
- [ ] Test Case D: ✅ Unknown gaps handled gracefully
- [ ] Test Case E: ✅ Idempotency confirmed

### Documentation Completion

- [ ] `project/STATUS.md` shows all phases checked
- [ ] `agp-project-status.html` displays v3.1 complete
- [ ] `PROJECT_BRIEFING.md` finalized (remove "draft" status)
- [ ] HANDOFF for next phase prepared

### Quality Gates

- [ ] No console errors in DevTools
- [ ] Performance targets met (< 2s total workflow)
- [ ] 219 existing sensors remain locked and unmodified
- [ ] Git history clean with descriptive commits
- [ ] All files follow tier-based doc structure

### Exit Criteria

**Phase complete when**:
1. All checkbox items above are checked
2. Jo validates sensor detection against known history
3. Final commit tagged: `v3.1-sensor-registration-complete`
4. Handoff prepared for v3.2 (stock integration)

---

## 📊 Success Metrics

**Quantitative**:
- Sensor detection accuracy: >95% (compared to manual review)
- False positive rate: <5%
- Re-upload idempotency: 100% (no duplicates created)
- Performance: 95th percentile < 2s for 30d CSV
- Test pass rate: 100% (all cases A-E green)

**Qualitative**:
- UI provides clear feedback on candidate confidence
- Debug logs enable easy troubleshooting
- Lock system prevents accidental data loss
- Workflow feels intuitive for CSV uploads

---

## 🔄 Next Phase Preview (v3.2)

**After v3.1 completion, next priorities**:
1. Stock/lot number integration (link sensors to inventory)
2. Batch import (multiple CSV files at once)
3. Historical migration (safely update 219 existing sensors)
4. Advanced split logic (manually separate multi-sensor clusters)

**Not started until**:
- v3.1 Definition of Done satisfied
- Jo approval for production use
- Git tag created

---

**Document Status**: 🔨 DRAFT (skeleton prepared)  
**Completion**: To be finalized after implementation  
**Next Update**: After Phase 1 (CSV Parser) completion
