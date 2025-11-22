# AGP+ Session Handoff - Architecture Improvements

**Created**: 2025-11-22  
**Based on**: ARCHITECTURE_ANALYSIS_2025-11-22.md  
**Target Version**: 4.5.0  
**Estimated Total Effort**: 15-18 hours across multiple sessions

---

## 🎯 MISSION

Address the critical and high-priority findings from the architecture analysis:
1. Add error boundaries (safety)
2. Extract csvUploadEngine.js (clarity)
3. Split SensorHistoryPanel (maintainability)
4. Migrate stockStorage to IndexedDB (data integrity)

---

## ⚠️ CONSTRAINTS (Always Apply)

```
1. UPDATE PROGRESS.md FREQUENTLY (every major step)
2. TOKEN-ZUINIG: grep/head instead of full file reads
3. CRASH PREVENTION: commit + push after each fase
4. BACKWARDS COMPATIBILITY: JSON database must always load correctly
5. NO PATCHES: Rewrite code cleanly, or document in TECH_DEBT.md for later
6. ROLLBACK TAGS: Create git tag before each major change
```

**Path**: `/Users/jomostert/Documents/Projects/agp-plus`

**Server**: 
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

---

## 📋 FASE 1: Error Boundaries (P1 - Safety Critical)

**Effort**: 2 hours  
**Risk**: Low  
**Rollback**: `v4.4.0-pre-error-boundary`

### Why This Matters (Medical Device)
A JavaScript error in any component currently crashes the entire app, showing a blank screen. For a medical data application, this is unacceptable - users lose context and may panic about data loss.

### Implementation Plan

#### Step 1.1: Create Rollback Point
```bash
git tag v4.4.0-pre-error-boundary
git push origin v4.4.0-pre-error-boundary
```

#### Step 1.2: Create ErrorBoundary Component
**File**: `src/components/ErrorBoundary.jsx` (~80 lines)

```jsx
/**
 * Error Boundary for AGP+
 * 
 * Catches JavaScript errors in child components and displays
 * a recovery UI instead of crashing the entire application.
 * 
 * Medical Device Note: Error boundaries are critical for maintaining
 * user trust and preventing data loss perception during errors.
 */
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging (medical audit trail)
    console.error('[AGP+ Error Boundary]', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          fontFamily: 'var(--font-mono, monospace)',
          background: 'var(--paper, #fff)',
          border: '3px solid var(--ink, #000)',
          margin: '1rem',
          maxWidth: '600px'
        }}>
          <h2 style={{ 
            textTransform: 'uppercase', 
            borderBottom: '2px solid var(--ink, #000)',
            paddingBottom: '0.5rem'
          }}>
            ⚠️ Display Error
          </h2>
          
          <p style={{ marginTop: '1rem' }}>
            A display error occurred. <strong>Your data is safe</strong> - 
            this is a visualization issue only.
          </p>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button 
              onClick={this.handleReset}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--paper, #fff)',
                border: '2px solid var(--ink, #000)',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={this.handleReload}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--ink, #000)',
                color: 'var(--paper, #fff)',
                border: '2px solid var(--ink, #000)',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Reload App
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>
              <summary style={{ cursor: 'pointer' }}>Technical Details</summary>
              <pre style={{ 
                overflow: 'auto', 
                background: '#f5f5f5', 
                padding: '1rem',
                marginTop: '0.5rem'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

#### Step 1.3: Wrap Critical Components in App.jsx
**File**: `src/App.jsx`

Wrap the main content area:
```jsx
import ErrorBoundary from './components/ErrorBoundary';

// In render:
<ErrorBoundary>
  <AGPGenerator />
</ErrorBoundary>
```

#### Step 1.4: Add Granular Boundaries (Optional)
Consider wrapping individually:
- `<AGPChart />` - complex visualization
- `<DayProfileCard />` - complex calculations
- `<PumpSettingsPanel />` - external data parsing

#### Step 1.5: Build + Test + Commit
```bash
npx vite build
# Manual test: Temporarily throw error in AGPChart to verify boundary works
git add . && git commit -m "feat(safety): add ErrorBoundary for crash recovery" && git push
```

#### Step 1.6: Update PROGRESS.md
Mark Fase 1 complete with results.

---

## 📋 FASE 2: Extract csvUploadEngine.js (P1 - Clarity)

**Effort**: 3 hours  
**Risk**: Medium (touches critical path)  
**Rollback**: `v4.5.0-pre-csv-engine`

### What We're Moving

From `masterDatasetStorage.js` (lines 303-829, ~526 lines):
- `uploadCSVToV3()` - main entry point
- `completeCSVUploadWithAssignments()` - batch confirmation
- `detectSensors()` - private helper
- `findBatchSuggestionsForSensors()` - private helper
- `storeSensors()` - private helper
- `formatDateFromTimestamp()` - utility
- `formatTimeFromTimestamp()` - utility

### Implementation Plan

#### Step 2.1: Create Rollback Point
```bash
git tag v4.5.0-pre-csv-engine
git push origin v4.5.0-pre-csv-engine
```

#### Step 2.2: Create csvUploadEngine.js
**File**: `src/core/csvUploadEngine.js` (~530 lines)

Structure:
```javascript
/**
 * CSV Upload Engine for AGP+
 * 
 * Orchestrates the complete CSV upload workflow:
 * - Parse CSV data
 * - Extract metadata (patient info, TDD, BG readings)
 * - Detect sensors
 * - Handle batch assignment flow
 * - Store processed data
 * 
 * Extracted from masterDatasetStorage.js (v4.5.0)
 */

import { appendReadingsToMaster, rebuildSortedCache, getMasterDatasetStats } from '../storage/masterDatasetStorage.js';
import { addSensor, getAllSensors, updateSensor } from '../storage/sensorStorage.js';
import { getAllBatches, assignSensorToBatch } from '../storage/stockStorage.js';
import { STORES, getRecord, putRecord } from '../storage/db.js';
import { debug } from '../utils/debug.js';

// Private helpers
function formatDateFromTimestamp(timestamp) { ... }
function formatTimeFromTimestamp(timestamp) { ... }
async function detectSensors(readings) { ... }
async function findBatchSuggestionsForSensors(detectedEvents) { ... }
async function storeSensors(detectedEvents) { ... }

// Public API
export async function uploadCSV(csvText) { ... }
export async function completeUploadWithAssignments(detectedEvents, confirmedAssignments) { ... }
export async function getSensorBatchSuggestions() { ... }
```

#### Step 2.3: Update masterDatasetStorage.js
Remove the extracted functions, add re-exports for backwards compatibility:
```javascript
// Re-export from csvUploadEngine (backwards compatibility)
export { 
  uploadCSV as uploadCSVToV3,
  completeUploadWithAssignments as completeCSVUploadWithAssignments,
  getSensorBatchSuggestions
} from '../core/csvUploadEngine.js';
```

#### Step 2.4: Update Consumers
Check these files for direct imports:
- `src/hooks/useDataManagement.js`
- `src/components/FileUpload.jsx`
- `src/contexts/DataContext.jsx`

Most should work via re-exports, but verify.

#### Step 2.5: Build + Test + Commit
```bash
npx vite build
# Test: Upload a CSV file, verify batch detection still works
git add . && git commit -m "refactor(core): extract csvUploadEngine from masterDatasetStorage

- uploadCSV(): Main upload orchestration
- completeUploadWithAssignments(): Batch confirmation flow
- Sensor detection helpers (private)

masterDatasetStorage.js: 863 → ~360 lines (bucket ops only)
Re-exports added for backwards compatibility" && git push
```

#### Step 2.6: Update PROGRESS.md
Mark Fase 2 complete.

---

## 📋 FASE 3: Split SensorHistoryPanel (P2 - Maintainability)

**Effort**: 6 hours  
**Risk**: Medium  
**Rollback**: `v4.5.0-pre-sensor-panel-split`

### The Problem
`SensorHistoryPanel.jsx` has 15 useState calls and 1,163 lines. This is a maintenance nightmare and performance risk.

### Target Architecture
```
src/components/panels/SensorHistoryPanel/
├── index.jsx              (~250 lines) - Orchestrator
├── SensorTable.jsx        (~300 lines) - Table display
├── SensorStatsPanel.jsx   (~150 lines) - Statistics display
├── SeasonManager.jsx      (~300 lines) - Season CRUD
├── useSensorHistory.js    (~150 lines) - Custom hook for state
└── styles.js              (~50 lines)  - Shared inline styles
```

### Implementation Plan

#### Step 3.1: Create Rollback Point
```bash
git tag v4.5.0-pre-sensor-panel-split
```

#### Step 3.2: Create useSensorHistory Hook
Extract all useState and data fetching logic into custom hook:
```javascript
// src/components/panels/SensorHistoryPanel/useSensorHistory.js
export function useSensorHistory() {
  const [sensors, setSensors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  // ... all state
  
  // Load functions
  const loadSensors = useCallback(async () => { ... }, []);
  const loadBatches = useCallback(() => { ... }, []);
  const loadSeasons = useCallback(async () => { ... }, []);
  
  // Actions
  const deleteSensor = useCallback(async (sensorId) => { ... }, []);
  const toggleLock = useCallback(async (sensorId) => { ... }, []);
  
  useEffect(() => { loadSensors(); loadBatches(); loadSeasons(); }, [refreshKey]);
  
  return {
    sensors, batches, seasons,
    deleteSensor, toggleLock,
    refresh: () => setRefreshKey(k => k + 1)
  };
}
```

#### Step 3.3: Extract SensorTable
Pure display component, receives data via props.

#### Step 3.4: Extract SeasonManager
Self-contained CRUD for seasons with local edit state.

#### Step 3.5: Compose in Index
```jsx
// src/components/panels/SensorHistoryPanel/index.jsx
import { useSensorHistory } from './useSensorHistory';
import SensorTable from './SensorTable';
import SensorStatsPanel from './SensorStatsPanel';
import SeasonManager from './SeasonManager';

export default function SensorHistoryPanel({ isOpen, onClose, onOpenStock }) {
  const { sensors, batches, seasons, ... } = useSensorHistory();
  
  if (!isOpen) return null;
  
  return (
    <div className="panel">
      <SensorStatsPanel sensors={sensors} />
      <SeasonManager seasons={seasons} />
      <SensorTable sensors={sensors} batches={batches} />
    </div>
  );
}
```

#### Step 3.6: Build + Test + Commit
Test all sensor panel functionality:
- View sensors
- Delete sensor
- Toggle lock
- View/edit seasons
- Stats display

---

## 📋 FASE 4: Migrate stockStorage to IndexedDB (P2 - Data Integrity)

**Effort**: 4 hours  
**Risk**: Medium (data migration)  
**Rollback**: `v4.6.0-pre-stock-migration`

### The Problem
`stockStorage.js` uses localStorage which:
- Has 5-10MB limit
- No transactional consistency with IndexedDB data
- Lost if user clears browser data

### Implementation Plan

#### Step 4.1: Add STOCK store to db.js
```javascript
export const STORES = {
  // ... existing
  STOCK_BATCHES: 'stockBatches',      // v4.6
  STOCK_ASSIGNMENTS: 'stockAssignments' // v4.6
};
```

Increment DB_VERSION to 8.

#### Step 4.2: Rewrite stockStorage.js
Convert all functions to async IndexedDB operations.

#### Step 4.3: Add Migration
In db.js upgrade handler:
```javascript
if (oldVersion < 8) {
  // Migrate localStorage → IndexedDB
  const batches = JSON.parse(localStorage.getItem('agp-stock-batches') || '[]');
  const assignments = JSON.parse(localStorage.getItem('agp-stock-assignments') || '[]');
  // ... store in new IndexedDB stores
  // ... clear localStorage keys after successful migration
}
```

#### Step 4.4: Update Consumers
All stockStorage consumers need async/await updates.

---

## 📋 TECH DEBT (Document, Don't Fix Now)

Items to add to `TECH_DEBT.md` if encountered:

| Item | Location | Reason to Defer |
|------|----------|-----------------|
| 116 console.log statements | Various | Low impact, bulk cleanup later |
| 563 inline styles | Components | Working, print-optimized |
| Settings store overload | db.js | Works, refactor in v5.0 |
| PumpSettingsPanel size | panels/ | Lower priority than Sensor |

---

## 📊 SUCCESS CRITERIA

### After Fase 1 (Error Boundaries)
- [ ] App shows recovery UI on JS error (not blank screen)
- [ ] Error logged to console with timestamp
- [ ] "Try Again" button works
- [ ] Build passes

### After Fase 2 (csvUploadEngine)
- [ ] masterDatasetStorage.js < 400 lines
- [ ] CSV upload still works (with batch detection)
- [ ] Import/export JSON still works
- [ ] Build passes

### After Fase 3 (SensorHistoryPanel Split)
- [ ] No file > 400 lines in SensorHistoryPanel/
- [ ] All sensor functions work (delete, lock, seasons)
- [ ] Performance feels same or better
- [ ] Build passes

### After Fase 4 (stockStorage Migration)
- [ ] stockStorage.js uses IndexedDB
- [ ] Existing batch data migrated
- [ ] localStorage keys cleaned up
- [ ] Build passes

---

## 🔄 SESSION WORKFLOW

Each session:
1. Read this handoff + PROGRESS.md
2. Create rollback tag before starting fase
3. Work in small commits
4. Update PROGRESS.md after each step
5. Build check before push
6. Push to GitHub (website sync)

**Start command**:
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
git status
# Pick up where you left off based on PROGRESS.md
```

---

## 📁 FILE LOCATIONS

| Document | Path | Purpose |
|----------|------|---------|
| This handoff | `docs/handoffs/SESSION_HANDOFF_ARCHITECTURE.md` | Work plan |
| Progress | `docs/handoffs/PROGRESS.md` | Session log |
| Analysis | `docs/ARCHITECTURE_ANALYSIS_2025-11-22.md` | Full findings |
| Tech debt | `TECH_DEBT.md` | Deferred items |

---

**Ready to start? Begin with Fase 1 (ErrorBoundary) - highest safety value for lowest effort.**
