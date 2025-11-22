# AGP+ Architecture Analysis - Senior Engineering Review

**Date**: 2025-11-22  
**Version Analyzed**: 4.4.0  
**Analyst**: Senior Software Engineer (Medical Devices Perspective)  
**Codebase Size**: 32,833 lines across 127 files

---

## EXECUTIVE SUMMARY

### Overall Grade: B+

AGP+ is a well-structured medical data visualization application that has evolved through careful iterative development. The architecture demonstrates good separation of concerns with a four-layer Context API system, but carries some technical debt from rapid feature development.

**Strengths**:
- Clean Context API architecture (DataContext, PeriodContext, MetricsContext, UIContext)
- Well-documented codebase with comprehensive changelogs
- Solid core engine separation (metrics, parsers, day profiles)
- Good IndexedDB schema design with migration support

**Critical Concerns** (Medical Device Perspective):
- No error boundaries (crash = complete data loss visibility)
- Dead code present (477 lines)
- Mixed storage paradigms (localStorage vs IndexedDB)
- No test coverage for storage or UI components

---

## 1. STORAGE ARCHITECTURE ANALYSIS

### 1.1 Current State

**IndexedDB Schema (v7)** - 6 Stores:
```
├── uploads         (v2.x compat - metadata only)
├── settings        (catch-all for misc data)
├── readingBuckets  (month-keyed glucose readings)
├── masterDataset   (cache layer)
├── sensorData      (sensor database)
└── seasons         (device era tracking)
```

**Storage Modules** (17 files, 6,422 lines):
| Module | Lines | Backend | Purpose |
|--------|-------|---------|---------|
| masterDatasetStorage.js | 863 | IndexedDB | Core glucose data |
| sensorStorage.js | 462 | IndexedDB | Sensor management |
| indexedDB.js | 477 | ❌ DEAD | Legacy (unused) |
| stockStorage.js | 282 | localStorage | Batch tracking |
| exportHistory.js | 125 | localStorage | Export audit |
| importHistory.js | 101 | localStorage | Import audit |

### 1.2 Problems Identified

#### 🔴 CRITICAL: Dead Code - indexedDB.js (477 lines)
**File**: `src/storage/indexedDB.js`  
**Status**: Not imported anywhere  
**Risk**: Confusion, maintenance overhead  
**Action**: DELETE immediately

#### 🟠 HIGH: Mixed Storage Paradigms
**Problem**: Critical data split between localStorage and IndexedDB
```
IndexedDB: Glucose readings, sensors, seasons
localStorage: Stock batches, export/import history
```

**Risk**: 
- localStorage has 5-10MB limit (batches could exceed)
- No transactional consistency between stores
- Clear localStorage = lose batch assignments

**Recommendation**: Migrate stockStorage to IndexedDB in v4.6

#### 🟡 MEDIUM: Settings Store Overloaded
**Problem**: `STORES.SETTINGS` used as catch-all:
- Patient info
- TDD data
- Cartridge changes
- Workdays (ProTime)
- Active upload ID

**Risk**: Key collisions, unclear schema  
**Recommendation**: Split into dedicated stores or use compound keys

### 1.3 masterDatasetStorage.js Analysis

**Current Size**: 863 lines (was 1024)  
**Responsibilities Still Mixed**:
```
Lines 520-715: uploadCSVToV3() - CSV upload orchestration
Lines 716-829: completeCSVUploadWithAssignments() - Batch flow
Lines 303-495: Sensor detection (internal functions)
Lines 165-300: Core bucket operations (appropriate here)
```

**Recommendation**: Extract CSV Upload Engine

```
Option A (Recommended): Create csvUploadEngine.js (~310 lines)
├── uploadCSVToV3()
├── completeCSVUploadWithAssignments()
├── detectSensors() (internal)
├── findBatchSuggestionsForSensors() (internal)
└── storeSensors() (internal)

Result: masterDatasetStorage.js → ~550 lines (focused on bucket ops)
```

---

## 2. COMPONENT ARCHITECTURE ANALYSIS

### 2.1 Component Size Distribution

**Largest Components** (concern level):
| Component | Lines | useState | Issue |
|-----------|-------|----------|-------|
| PumpSettingsPanel.jsx | 1,292 | ? | Candidate for split |
| SensorHistoryPanel.jsx | 1,163 | 15 | 🔴 TOO MUCH STATE |
| AGPChart.jsx | 927 | ? | Acceptable (complex viz) |
| DataManagementModal.jsx | 809 | ? | Candidate for split |
| DayProfileCard.jsx | 808 | ? | Acceptable (feature-rich) |

### 2.2 Problems Identified

#### 🔴 CRITICAL: SensorHistoryPanel State Explosion
**File**: `src/components/panels/SensorHistoryPanel.jsx`  
**useState calls**: 15  
**Problem**: Component manages:
- Sensor list + batches
- Stats expanded states
- Resizable splitter state
- Season management (CRUD)
- Edit mode state
- Form state for new seasons

**Risk**: 
- Prop drilling nightmare
- Re-render performance issues
- Bug-prone state synchronization

**Recommendation**: Extract to sub-components + custom hook:
```
SensorHistoryPanel/
├── index.jsx (orchestrator, ~200 lines)
├── SensorTable.jsx
├── StatsPanel.jsx
├── SeasonManager.jsx
└── useSensorHistory.js (custom hook for state)
```

#### 🟠 HIGH: No Error Boundaries
**Problem**: Zero error boundaries in entire application  
**Medical Device Risk**: A JavaScript error in any component crashes entire app, losing:
- Unsaved patient data
- Current analysis state
- User context

**Recommendation**: Add error boundaries:
```jsx
// src/components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    // Log to console (medical audit trail)
    console.error('[AGP+ Error]', error, info);
    // Show recovery UI, not blank screen
  }
}

// Wrap critical sections
<ErrorBoundary fallback={<DataRecoveryUI />}>
  <AGPChart />
</ErrorBoundary>
```

### 2.3 Context Architecture (Clean ✅)

```
App
├── UIProvider (patient info, workdays, toasts)
│   └── DataProvider (master dataset, loading states)
│       └── PeriodProvider (date range selection)
│           └── MetricsProvider (calculated metrics)
│               └── AGPGenerator (orchestrator)
```

**Assessment**: Well-designed hierarchy. No circular dependencies detected.

---

## 3. CODE QUALITY ANALYSIS

### 3.1 Test Coverage

**Current State**: 1,019 lines of tests (3% of codebase)

| Area | Coverage | Risk |
|------|----------|------|
| metrics-engine.js | ✅ Good (472 lines) | Low |
| parsers.js | ✅ Partial (361 lines) | Medium |
| Storage modules | ❌ None | HIGH |
| Components | ❌ None | HIGH |
| Hooks | ❌ None | HIGH |

**Medical Device Concern**: No storage tests means data integrity bugs could go undetected.

**Priority Testing Targets**:
1. `sensorStorage.js` - sensor CRUD operations
2. `masterDatasetStorage.js` - bucket merge/dedup logic
3. `import.js` / `export.js` - data round-trip integrity

### 3.2 Code Hygiene Issues

| Issue | Count | Severity |
|-------|-------|----------|
| console.log statements | 116 | Low |
| Inline styles | 563 | Low (acceptable for print) |
| Dead code files | 1 (477 lines) | Medium |
| TODO/FIXME comments | ? | Check |

### 3.3 Error Handling

**Positive**: 54 try/catch blocks in storage layer  
**Negative**: Errors often swallowed with `debug.warn()` only

```javascript
// Current pattern (problematic for medical)
} catch (err) {
  debug.warn('[uploadCSVToV3] TDD calculation failed (non-fatal):', err);
}
// User never knows TDD failed!
```

**Recommendation**: Bubble up non-fatal errors to UI via toast system:
```javascript
} catch (err) {
  debug.warn('[uploadCSVToV3] TDD calculation failed:', err);
  toast.warning('TDD calculation incomplete - insulin metrics may be limited');
}
```

---

## 4. DATA FLOW ANALYSIS

### 4.1 CSV Upload Pipeline

```
FileUpload.jsx
    │
    ▼
uploadCSVToV3() [masterDatasetStorage.js]
    │
    ├── parseCSV() → readings array
    ├── parseCSVMetadata() → patient info
    ├── calculateDailyTDD() → TDD storage
    ├── addBGReadings() → BG storage
    ├── appendReadingsToMaster() → bucket storage
    ├── detectSensors() → sensor detection
    │
    ├─[if batch matches]─► BatchAssignmentDialog
    │                           │
    │                           ▼
    │              completeCSVUploadWithAssignments()
    │
    └─[no matches]─► storeSensors() → sensor storage
```

**Complexity Rating**: 7/10 (acceptable for the feature set)

**Improvement Opportunity**: The `uploadCSVToV3` function is a transaction coordinator disguised as a storage function. Extract to `csvUploadEngine.js` for clarity.

### 4.2 Data Persistence Risk

**Current Backup Strategy**: Manual JSON export only

**Medical Device Concern**: Patient loses years of glucose data if:
- Browser clears IndexedDB (incognito, storage pressure)
- Accidental "Clear All Data" click
- Device failure

**Recommendation**: Add auto-backup warnings:
```javascript
// On data > 30 days, no export in 7 days:
toast.info('Your data hasn\'t been backed up in 7 days. Export recommended.');
```

---

## 5. SPECIFIC RECOMMENDATIONS

### 5.1 Immediate Actions (Week 1)

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| P0 | Delete indexedDB.js (dead code) | 5 min | Cleanup |
| P1 | Add ErrorBoundary wrapper | 2h | Safety |
| P1 | Remove 116 console.log statements | 1h | Cleanup |
| P2 | Extract csvUploadEngine.js | 3h | Maintainability |

### 5.2 Short-term Improvements (Month 1)

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| P1 | Split SensorHistoryPanel | 6h | Performance/Maintainability |
| P2 | Migrate stockStorage to IndexedDB | 4h | Data integrity |
| P2 | Add storage unit tests | 8h | Quality |
| P3 | Split PumpSettingsPanel | 4h | Maintainability |

### 5.3 Long-term Roadmap (Quarter 1 2026)

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| P2 | Table virtualization (>50 sensors) | 3h | Performance |
| P3 | WCAG AAA compliance | 6h | Accessibility |
| P3 | Auto-backup reminders | 2h | Data safety |

---

## 6. masterDatasetStorage.js DECISION

### Context
The module is currently 863 lines after extracting ProTime, TDD, BG, and cleanup functions. The remaining concerns are:

1. **Bucket operations** (appropriate here): ~350 lines
2. **CSV upload orchestration**: ~196 lines  
3. **Batch assignment completion**: ~114 lines
4. **Sensor detection**: ~193 lines (private, used by upload)

### Recommendation: Option 2 - Extract CSV Upload

**Rationale**:
- CSV upload is a distinct workflow, not a storage operation
- Sensor detection is tightly coupled to upload (extract together)
- Leaves masterDatasetStorage focused on its core job: bucket management

**Implementation Plan**:
```
New file: src/core/csvUploadEngine.js (~500 lines)
├── uploadCSV() - public entry point
├── completeWithAssignments() - batch confirmation
├── detectSensors() - private
├── findBatchSuggestions() - private
└── storeSensors() - private

masterDatasetStorage.js: ~360 lines (bucket ops only)
├── appendReadingsToMaster()
├── rebuildSortedCache()
├── loadOrRebuildCache()
├── invalidateCache()
├── getAllMonthBuckets()
└── getMasterDatasetStats()
```

**NOT recommended**: Option 3 (extract sensor detection separately)
- Creates artificial separation
- Sensor detection is only used during CSV upload
- Would require cross-module coupling

---

## 7. RISK MATRIX

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss (no backup) | Medium | Critical | Auto-backup reminders |
| App crash (no error boundary) | Medium | High | Add ErrorBoundary |
| Storage quota exceeded | Low | High | Migrate to IndexedDB |
| Performance (large datasets) | Low | Medium | Table virtualization |
| Dead code confusion | High | Low | Delete indexedDB.js |

---

## 8. MEDICAL DEVICE COMPLIANCE NOTES

### 8.1 Current Alignment with IEC 62304

| Requirement | Status | Notes |
|-------------|--------|-------|
| Software requirements | ⚠️ Partial | PROGRESS.md serves as informal spec |
| Architecture design | ✅ Good | Clear module separation |
| Detailed design | ⚠️ Partial | Some components undocumented |
| Unit testing | ❌ Poor | 3% coverage |
| Integration testing | ❌ None | Manual testing only |
| Traceability | ⚠️ Partial | Git history, but no formal matrix |

### 8.2 Recommendations for Medical Device Path

If AGP+ moves toward formal medical device classification:

1. **Increase test coverage to 80%** (focus on data integrity)
2. **Add input validation schemas** (Zod or Yup)
3. **Implement audit logging** (who changed what, when)
4. **Add data integrity checksums** (detect corruption)
5. **Create formal requirements document** (traceable to tests)

---

## 9. CONCLUSION

AGP+ is a solid B+ application with clear architecture and good maintainability practices. The main technical debt is in:

1. **Storage inconsistency** (localStorage vs IndexedDB)
2. **Component complexity** (SensorHistoryPanel)
3. **Safety gaps** (no error boundaries)
4. **Dead code** (indexedDB.js)

The recommended next steps, in order:

1. **Delete dead code** (5 minutes, zero risk)
2. **Add error boundaries** (2 hours, high safety value)
3. **Extract csvUploadEngine.js** (3 hours, improves clarity)
4. **Plan stockStorage migration** (for v4.6)

The codebase is well-positioned for continued development. The brutalist design philosophy and focus on clinical utility are appropriate for the target audience.

---

**End of Analysis**

*"Good architecture is not about perfection—it's about making the right trade-offs for your context."*
