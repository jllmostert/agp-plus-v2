# HANDOFF - UI Refactor: Navigation & Panels

**Date**: 2025-11-08 02:00  
**From**: Session 14 (Import Phase 1 Complete)  
**To**: Session 15 (UI Refactor Phase)  
**Status**: 🟡 PLANNING - CRITICAL QUESTIONS FIRST

---

## 📋 CONTEXT

Phase 1 (Import/Export Symmetry) is **COMPLETE**:
- ✅ Feature 1: Merge Strategy Selection
- ✅ Feature 2: Import History Tracking
- ✅ Feature 3: Backup Before Import
- ✅ Feature 4: Progress Bar
- ❌ Feature 5: Import Report (SKIPPED - redundant)

**Current State**:
- AGPGenerator.jsx: ~1851 lines (needs reduction)
- Multiple modals competing for screen space
- Debug tools (Insulin, SQLite) mixed with production features
- Stock Management in main navbar (should be nested)

**Next Phase Goal**: Refactor UI to panel-based architecture

---

## 🎯 PROPOSED REFACTOR (FROM USER)

### Main Navigation Bar (4 buttons only)
```
[IMPORT] [DAGPROFIELEN] [SENSOREN] [EXPORT]
```

### Panel Structure
```
src/components/panels/
  ├─ ImportPanel.jsx        // CSV (multi), PDF (multi), JSON (single)
  ├─ ExportPanel.jsx        // AGP+ HTML, Dagprofielen HTML, Database JSON
  ├─ SensorHistoryPanel.jsx // Current view + "Stockbeheer" button
  ├─ StockPanel.jsx         // Opened from SensorHistory
  ├─ DayProfilesPanel.jsx   // Day profiles view
  └─ DevToolsPanel.jsx      // Insulin + SQLite import (dev only)

src/components/devtools/
  ├─ InsulinDebugger.jsx
  └─ SensorSQLiteImport.jsx
```

### Key Changes
1. **AGPGenerator.jsx** → <400 lines (just routing + context)
2. **Multi-file import** → CSV/PDF batching (max 50 files)
3. **Cleanup ALL-IN** → Dry-run + mandatory backup
4. **Debug tools** → DevToolsPanel (hidden in production)
5. **Stock** → Nested under Sensoren (not in main nav)

---

## ❓ CRITICAL QUESTIONS & CONCERNS

### 🔴 HIGH PRIORITY - Architecture Decisions

#### Q1: Panel Display Method - Modal or Routed?
**Current**: Modals everywhere (overlay-based)  
**Option A**: Keep modals, add panel wrappers  
**Option B**: Single-page router (React Router)  
**Option C**: Tabs with panel swap (no router)

**Trade-offs**:
| Method | Pros | Cons |
|--------|------|------|
| Modals | Familiar, no routing | Cluttered, stacking issues |
| Router | Clean URLs, browser back | Overkill for SPA, dependency |
| Tabs | Simple, no deps | No deep linking |

**My Recommendation**: **Option C (Tabs)** - Simplest, no new deps, clean UX
- Main bar: 4 tabs (Import, Dagprofielen, Sensoren, Export)
- Active panel replaces content area
- DevTools: Toggle in footer or keyboard shortcut (Ctrl+Shift+D)

**Question**: Which approach do you prefer? Or hybrid (some modals, some panels)?

---

#### Q2: Multi-File Import - Deduplication Strategy
**Requirement**: "Dedupe via timestamp+source hash"

**Problem**: What constitutes a "duplicate"?
- Same timestamp + same glucose value?
- Same sensor_id + same timestamp?
- Same file content (hash entire file)?

**Current Behavior**: 
- CSV import dedupes per-month via IndexedDB (built-in)
- No cross-file deduplication in batch

**Proposed Approach**:
```javascript
// Per-file hash to skip re-uploads
const fileHash = await sha256(fileContent);
if (processedFiles.includes(fileHash)) {
  console.log('Skipping duplicate file:', filename);
  continue;
}
```

**Question**: Is file-level deduplication sufficient? Or do we need row-level deduplication across files?

---

#### Q3: Cleanup ALL-IN - Scope Definition
**Requirement**: "Verplicht dry-run + backup vooraf"

**Unclear**:
- What does "ALL-IN" delete?
  - All glucose readings?
  - All sensors?
  - All stock data?
  - Patient info?
  - Everything except config?

**Proposed Scopes**:
1. **ALL-IN (Nuclear)**: Delete EVERYTHING (glucose, sensors, events, stock, patient)
2. **Data Only**: Keep sensors/stock, delete glucose readings
3. **Old Data**: Delete data >90 days (keep recent)

**Current Cleanup**: Only clears glucose readings (30/90/custom days)

**Question**: Which entities should ALL-IN delete? Is there a "keep config" option?

---

#### Q4: DevTools Visibility - How to Toggle?
**Requirement**: "Only in dev environment"

**Options**:
| Method | Implementation | Pros | Cons |
|--------|----------------|------|------|
| ENV check | `process.env.NODE_ENV !== 'production'` | Automatic | Can't enable in prod for debugging |
| Constant | `constants.js: ENABLE_DEVTOOLS = true` | Manual control | Need rebuild to toggle |
| Keyboard | `Ctrl+Shift+D` toggles panel | Hidden but accessible | Users might find it accidentally |
| URL param | `?devtools=true` | Easy testing in prod | Security risk if no auth |

**My Recommendation**: Hybrid approach
```javascript
const showDevTools = (
  process.env.NODE_ENV !== 'production' || 
  localStorage.getItem('agp-devtools-enabled') === 'true'
);

// Toggle with: Ctrl+Shift+D (stores in localStorage)
```

**Question**: Is this acceptable? Or strict ENV check only?

---

### 🟡 MEDIUM PRIORITY - Implementation Details

#### Q5: AGPGenerator.jsx Target Size
**Requirement**: "<400 lines"

**Current**: 1851 lines  
**Target**: <400 lines  
**Reduction needed**: 1451 lines (78% reduction!)

**Challenge**: Even minimal routing/state logic could be 200-300 lines

**Proposed Minimal Structure**:
```jsx
// AGPGenerator.jsx (~350 lines)
export default function AGPGenerator() {
  // 1. State (50 lines)
  const [activePanel, setActivePanel] = useState('import');
  const [showDevTools, setShowDevTools] = useState(false);
  // ... master dataset, sensors, etc.

  // 2. Handlers (50 lines)
  const handlePanelChange = (panel) => setActivePanel(panel);
  // ... minimal glue code

  // 3. Render (250 lines)
  return (
    <>
      <HeaderBar active={activePanel} onChange={handlePanelChange} />
      <MainContent panel={activePanel} />
      {showDevTools && <DevToolsPanel />}
    </>
  );
}
```

**Question**: Is 350-400 lines realistic for routing + context? Or should we target 500 lines?

---

#### Q6: Multi-File CSV Import - UI Design
**Requirement**: "Max 50 files, progress + merge"

**UI Mockup**:
```
┌─────────────────────────────────────┐
│ 📄 Upload CSV Files                 │
│                                     │
│ [Drag files here or click to browse]│
│ Max 50 files per batch               │
│                                     │
│ Selected: 12 files                   │
│                                     │
│ ├─ file1.csv ✅ (1,234 records)     │
│ ├─ file2.csv ✅ (987 records)       │
│ ├─ file3.csv ⚠️  (12 duplicates)    │
│ ├─ file4.csv ❌ (Invalid format)    │
│ └─ ... (8 more)                     │
│                                     │
│ [Cancel] [Import All]               │
└─────────────────────────────────────┘
```

**Questions**:
1. Show progress per file or batch total?
2. Stop on first error or continue with valid files?
3. Show "Skip duplicates" checkbox?

---

#### Q7: Export Panel - Three Buttons Layout
**Current**: Dropdown in DataExportPanel  
**Proposed**: Three separate buttons

**Layout Options**:
```
Option A - Horizontal:
[AGP+ Profile] [Dagprofielen] [Database]

Option B - Vertical List:
┌─ AGP+ Profiel (HTML)
├─ Dagprofielen (HTML)
└─ Export Database (JSON)

Option C - Grid (2x2):
┌───────────┬───────────┐
│ AGP+      │ Database  │
│ Profile   │ JSON      │
├───────────┴───────────┤
│ Dagprofielen          │
└───────────────────────┘
```

**Question**: Which layout fits brutalist design best?

---

### 🟢 LOW PRIORITY - Polish & Edge Cases

#### Q8: Stock Panel Access
**Requirement**: "Secondary button in SensorHistoryPanel"

**Question**: Should Stock also be accessible from:
- Main menu (Ctrl+S hotkey)?
- DevTools panel?
- Or **only** via Sensoren panel?

**My Recommendation**: Only via Sensoren (keeps navigation simple)

---

#### Q9: Keyboard Navigation
**Requirement**: "Tab/Enter/Space for accessibility"

**Implementation**:
- `Tab` cycles through main nav buttons
- `Enter`/`Space` activates button
- `Esc` closes active panel (if modal-style)
- `Arrow keys` within panels (optional)

**Question**: Any additional shortcuts needed? (e.g., Ctrl+1/2/3/4 for quick panel switch?)

---

#### Q10: Cleanup Dry-Run Display
**Requirement**: "Toon aantal records dat wijzigt/verwijderd wordt"

**Proposed Format**:
```
┌─────────────────────────────────────┐
│ 🧹 Cleanup Preview (Dry Run)        │
│                                     │
│ Action: Delete ALL data             │
│                                     │
│ Records to be deleted:              │
│ ├─ Glucose readings: 12,345         │
│ ├─ Sensors: 15                      │
│ ├─ Cartridges: 8                    │
│ ├─ Workdays: 42                     │
│ ├─ Stock batches: 3                 │
│ └─ Patient info: 1                  │
│                                     │
│ ☑ Create backup first (recommended) │
│                                     │
│ ⚠️ This action CANNOT be undone!    │
│                                     │
│ [Cancel] [Confirm & Execute]        │
└─────────────────────────────────────┘
```

**Question**: Should dry-run be a separate button or automatic before confirmation?

---

## 🚨 POTENTIAL BREAKING CHANGES

### 1. File Structure
**Impact**: Import paths change across entire codebase  
**Mitigation**: VSCode auto-refactor or search-replace

**Files Affected** (~50 imports to update):
```
Before: import { Something } from '../components/DataExportPanel';
After:  import { Something } from '../components/panels/ExportPanel';
```

---

### 2. State Management
**Impact**: Moving state from AGPGenerator to panels  
**Mitigation**: Lift to context or pass as props

**Risk**: Prop drilling hell if not careful

**Proposed Solution**: Create shared contexts
```jsx
// src/contexts/AppContext.jsx
export const DataContext = createContext();
export const SensorContext = createContext();
export const UIContext = createContext();
```

---

### 3. Existing Modals
**Impact**: DataImportModal, DayProfilesModal, etc. still exist  
**Mitigation**: Keep modals, wrap in panels

**Decision Needed**: Convert modals to panels or keep hybrid?

---

## 📊 SCOPE ESTIMATE

### Implementation Phases

**Phase A: File Structure** (2 hours)
- Create `panels/` and `devtools/` directories
- Move existing components to new structure
- Update all import paths
- Test: App still runs

**Phase B: Main Navigation** (2 hours)
- Build HeaderBar with 4 buttons
- Add active state styling
- Wire up panel switching
- Test: Navigation works

**Phase C: Panel Components** (6 hours)
- ImportPanel.jsx (2h)
- ExportPanel.jsx (1h)
- SensorHistoryPanel.jsx (1h)
- DayProfilesPanel.jsx (1h)
- DevToolsPanel.jsx (1h)

**Phase D: Multi-File Import** (4 hours)
- File hash deduplication
- Batch processing logic
- Progress reporting per file
- Error handling + recovery

**Phase E: Cleanup ALL-IN** (3 hours)
- Dry-run calculation
- Backup enforcement
- Confirmation flow
- Execute cleanup

**Phase F: Polish & Testing** (3 hours)
- Keyboard navigation
- Accessibility (aria-labels)
- Manual testing all flows
- Bug fixes

**Total Estimate**: 20 hours (2.5 days @ 8h/day)

---

## ⚠️ RECOMMENDATIONS

### 1. SPLIT INTO SMALLER PHASES
**Don't do all at once**. Suggested increments:
1. Week 1: File structure + navigation (Phase A+B)
2. Week 2: Panel components (Phase C)
3. Week 3: Advanced features (Phase D+E)
4. Week 4: Polish (Phase F)

### 2. KEEP MODALS FOR NOW
**Don't convert** DataImportModal yet - it works well.  
Just **wrap** in ImportPanel:
```jsx
// ImportPanel.jsx
function ImportPanel() {
  return (
    <div>
      <h2>Import Data</h2>
      <button onClick={() => setShowImportModal(true)}>
        Import Database (JSON)
      </button>
      <DataImportModal isOpen={showImportModal} ... />
    </div>
  );
}
```

### 3. DEFER MULTI-FILE UNTIL NEEDED
**Current single-file import works**. Multi-file is a nice-to-have.  
**Suggestion**: Ship panel refactor first, add multi-file in v3.11

### 4. MAKE DEVTOOLS DISCOVERABLE
**Don't hide completely**. Add small footer hint:
```
"Press Ctrl+Shift+D for developer tools"
```

### 5. TEST AFTER EACH PHASE
**Don't accumulate technical debt**. After each phase:
- Manually test all existing features
- Fix regressions immediately
- Commit working state

---

## 🎯 IMMEDIATE NEXT STEPS

### Before Starting Refactor:
1. **Answer critical questions** (Q1-Q10 above)
2. **Agree on scope** (all at once vs phased?)
3. **Create branch**: `feature/ui-refactor-panels`
4. **Backup current working state** (export JSON)

### Session 15 Goal (if we proceed):
**Phase A + B Only** (4 hours)
- Create new folder structure
- Build HeaderBar component
- Wire up basic panel switching
- Ensure no regressions

---

## 📎 ORIGINAL PROMPT (REFERENCE)

See document upload for full implementation prompt.

**Key Requirements**:
- Main nav: 4 buttons only (Import, Dagprofielen, Sensoren, Export)
- AGPGenerator.jsx < 400 lines
- Multi-file CSV/PDF import (max 50)
- Cleanup ALL-IN with dry-run + backup
- DevTools hidden in production
- Panel-based architecture

---

## 💭 FINAL THOUGHTS

**This is a BIG refactor** (20 hours estimated). Benefits:
- ✅ Cleaner architecture
- ✅ Easier to maintain
- ✅ Better UX (less clutter)
- ✅ Scalable for future features

**But also risky**:
- ⚠️ Many breaking changes
- ⚠️ Regression potential
- ⚠️ Time investment

**My honest opinion**: 
- The **goals are excellent**
- The **scope is too large** for one session
- I recommend **incremental approach** (phased rollout)
- Ship small, working pieces rather than one big bang

**Alternative**: Keep current UI, just add multi-file import as v3.9 feature?

---

**Ready to discuss? Let's align on approach before diving in.**