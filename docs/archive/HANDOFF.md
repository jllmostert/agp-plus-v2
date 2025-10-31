---
version: v3.1
phase: Phase 4 - Registration UI Ready
status: active
date: 2025-10-30
time: 13:57 CET
---

# HANDOFF — v3.1 Sensor Registration UI

## 🎯 Mission

Build CSV-based sensor registration UI. Detection engine (Phases 1-3) complete and tested. Now: Create user interface for reviewing and confirming sensor change candidates.

## 📂 Quick Navigation

**Tier 1 (Root)**: `START_HERE.md`, `HANDOFF.md` (this file)  
**Tier 2 (/project/)**: `STATUS.md`, `TEST_PLAN.md`, architecture docs  
**Tier 3 (/reference/)**: `metric_definitions.md`, `minimed_780g_ref.md`

## 🔧 Server Setup

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

**Current PID**: 31953  
**URL**: http://localhost:3001/  
**Status**: ✅ Running, no errors

## 📊 Current State

### ✅ Completed (Phases 1-3)

**Detection Engine** - 100% tested, 2/2 candidates detected:
- `csvSectionParser.js` - Parses 3-section CareLink format
- `glucoseGapAnalyzer.js` - Finds dropout periods ≥120 min
- `sensorDetectionEngine.js` - Unified detection with confidence scoring
- `sensorEventClustering.js` - Groups related alerts in 4h windows

**Test Results** (Oct 30, 13:41):
- Oct 30: HIGH confidence (90/100) ✅
- Oct 25: HIGH confidence (80/100) ✅

**Storage Layer**:
- 219 sensors in IndexedDB (March 2022 - Oct 2025)
- `sensorStorage.js` - CRUD operations ready
- Import from SQLite completed

### 🔨 Just Fixed (Session 2025-10-30)

**Import Errors** - Resolved white screen bug:
1. `parseCareLinksections` → `parseCareLinkSections` (capitalization)
2. `matchClustersToGaps` → `detectSensorChanges` (unified engine)
3. `getAllSensors` → `getSensorHistory` (correct function)

**Commit**: 7aa4399 - "Fix: Correct import names in SensorRegistration component"

**Workflow Simplified**:
```javascript
// OLD: Manual steps (error-prone)
const clusters = clusterSensorAlerts(alerts);
const gaps = detectGlucoseGaps(glucose, 120);
const matches = matchClustersToGaps(clusters, gaps, 6);

// NEW: Unified detection engine
const { candidates, summary } = detectSensorChanges(alerts, glucose);
```

### ⏳ In Progress (Phase 4)

**File**: `src/components/SensorRegistration.jsx` - Created but incomplete

**Current State**:
- ✅ Imports correct
- ✅ File upload handler
- ✅ CSV parsing integration
- ✅ Detection engine call
- ❌ UI rendering (needs implementation)
- ❌ Candidate review table
- ❌ Confirm/ignore/split actions
- ❌ IndexedDB integration

## 🎨 Phase 4: Registration UI Implementation

### Requirements

**Brutalist Design**:
- 3px solid borders (`var(--color-border)`)
- Monospace typography (`var(--font-mono)`)
- High contrast black/white
- Print-compatible
- No gradients, no shadows

**Color Tokens** (from theme):
```css
--color-text-primary: #000
--color-bg-primary: #fff
--color-border: #000
--color-accent: #000
--color-success: #2d5016
--color-warning: #8b4513
--color-danger: #8b0000
```

### UI Components Needed

1. **Modal Container** - Full-screen overlay
2. **File Upload Section** - Drag-drop + button
3. **Analysis Controls** - "Load & Analyse" button
4. **Debug Log Panel** - Expandable console output
5. **Candidates Table** - Sensor change review grid
6. **Action Buttons** - Confirm ✓ / Ignore ✗ / Split ✂

### Candidates Table Schema

```jsx
<table>
  <thead>
    <tr>
      <th>TIMESTAMP</th>
      <th>CONFIDENCE</th>
      <th>ALERTS</th>
      <th>GAP</th>
      <th>ACTIONS</th>
    </tr>
  </thead>
  <tbody>
    {candidates.map(candidate => (
      <tr key={candidate.timestamp}>
        <td>{formatDate(candidate.timestamp)}</td>
        <td>
          <Badge confidence={candidate.confidence}>
            {candidate.confidence} ({candidate.score}/100)
          </Badge>
        </td>
        <td>{candidate.alerts.join(', ')}</td>
        <td>{candidate.gaps[0]?.duration || 'N/A'} min</td>
        <td>
          <button onClick={() => handleConfirm(candidate)}>✓</button>
          <button onClick={() => handleIgnore(candidate)}>✗</button>
          <button onClick={() => handleSplit(candidate)}>✂</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Confidence Badges

```jsx
function ConfidenceBadge({ confidence, score }) {
  const colors = {
    high: 'var(--color-success)',    // Green
    medium: 'var(--color-warning)',  // Brown
    low: 'var(--color-danger)'       // Red
  };
  
  return (
    <span style={{ 
      border: `3px solid ${colors[confidence]}`,
      padding: '4px 8px',
      fontFamily: 'var(--font-mono)'
    }}>
      🟢 {confidence.toUpperCase()} ({score}/100)
    </span>
  );
}
```

### Action Handlers

```javascript
const handleConfirm = async (candidate) => {
  // Add sensor to IndexedDB
  await addSensor({
    start_timestamp: candidate.timestamp,
    end_timestamp: null, // Will be set by next sensor
    duration_days: null,
    outcome: 'active',
    notes: `CSV auto-detected: ${candidate.confidence}`,
    source: 'csv-detection'
  });
  
  // Remove from candidates
  setCandidates(prev => prev.filter(c => c !== candidate));
  
  // Update sensor count
  const sensors = await getSensorHistory();
  addDebugLog(`✅ Sensor confirmed. Total: ${sensors.length}`);
};

const handleIgnore = (candidate) => {
  setCandidates(prev => prev.filter(c => c !== candidate));
  addDebugLog(`❌ Candidate ignored: ${formatDate(candidate.timestamp)}`);
};

const handleSplit = (candidate) => {
  // TODO: Phase 5 - Split cluster into multiple sensors
  addDebugLog(`✂️ Split not implemented yet`);
};
```

### Debug Log Component

```jsx
function DebugLog({ logs, isExpanded, onToggle }) {
  return (
    <div style={{ 
      border: '3px solid var(--color-border)',
      marginTop: '20px'
    }}>
      <button onClick={onToggle}>
        {isExpanded ? '▼' : '▶'} DEBUG LOG ({logs.length})
      </button>
      
      {isExpanded && (
        <pre style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          maxHeight: '300px',
          overflow: 'auto',
          padding: '10px'
        }}>
          {logs.map((log, i) => (
            <div key={i}>
              [{log.timestamp}] {log.message}
              {log.data && (
                <div style={{ marginLeft: '20px', color: '#666' }}>
                  {JSON.stringify(log.data, null, 2)}
                </div>
              )}
            </div>
          ))}
        </pre>
      )}
    </div>
  );
}
```

## 🧪 Testing Workflow

1. **Start server**: Check http://localhost:3001/
2. **Open DevTools**: Monitor console for errors
3. **Navigate**: Click "SENSORS" tab
4. **Upload CSV**: `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv`
5. **Click "Load & Analyse"**
6. **Verify**:
   - Debug log shows parsing steps
   - 2 candidates appear in table
   - Oct 30, 13:41 - HIGH (90/100)
   - Oct 25, 08:11 - HIGH (80/100)
7. **Test actions**:
   - Click ✓ on one candidate → sensor count: 220
   - Click ✗ on another → removed from table
8. **Check IndexedDB**: DevTools → Application → IndexedDB → sensors table

## 📝 Implementation Checklist

### Phase 4A: Basic UI Structure
- [ ] Create modal container with close button
- [ ] File upload section (drag-drop + button)
- [ ] Analysis button with loading state
- [ ] Empty state message

### Phase 4B: Candidates Display
- [ ] Candidates table with schema
- [ ] Confidence badges with colors
- [ ] Format timestamps (dd MMM HH:mm)
- [ ] Show alerts and gaps

### Phase 4C: Actions
- [ ] Confirm button → addSensor()
- [ ] Ignore button → remove from list
- [ ] Split button → placeholder (Phase 5)
- [ ] Update sensor count in UI

### Phase 4D: Debug Log
- [ ] Expandable log panel
- [ ] Format log entries
- [ ] Show parsing progress
- [ ] Display detection summary

### Phase 4E: Error Handling
- [ ] Invalid CSV format
- [ ] No candidates found
- [ ] IndexedDB errors
- [ ] Duplicate sensors

## 🎯 Success Criteria

- [ ] Upload CSV without errors
- [ ] Analysis completes in <2 seconds
- [ ] 2 candidates shown with correct data
- [ ] Confirm action adds sensor to IndexedDB
- [ ] Sensor count updates (219 → 220)
- [ ] Ignore action removes from table
- [ ] Debug log shows all steps
- [ ] No console errors
- [ ] Brutalist theme consistent

## 🚨 Critical Notes

- **Never modify** test-data files (read-only)
- **Always use** Desktop Commander for file operations
- **Test with real data** from test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv
- **Check IndexedDB** after each confirm action
- **Commit often** - small, focused commits

## 📚 Reference Files

**Detection Engine**: `src/core/sensorDetectionEngine.js` (lines 15-80)  
**Storage API**: `src/storage/sensorStorage.js` (functions: addSensor, getSensorHistory)  
**Test Data**: `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv` (2826 lines)  
**Expected Output**: 2 HIGH confidence candidates (Oct 30, Oct 25)

## 🔄 Git Workflow

**Current branch**: main  
**Last commit**: 7aa4399 - Import fixes  

**Next commit pattern**:
```bash
git add src/components/SensorRegistration.jsx
git commit -m "feat: Implement Phase 4A - Registration UI basic structure

- Modal container with close button
- File upload with drag-drop
- Analysis button with loading state
- Brutalist theme applied"
```

## 📞 Integration Points

**Sensors Tab** (`src/components/SensorsTab.jsx`):
```jsx
import SensorRegistration from './SensorRegistration';

function SensorsTab() {
  const [showRegistration, setShowRegistration] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowRegistration(true)}>
        + REGISTER FROM CSV
      </button>
      
      {showRegistration && (
        <SensorRegistration 
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
        />
      )}
    </div>
  );
}
```

## 🎨 CSS Variables Available

```css
/* Typography */
--font-mono: 'Courier New', monospace;
--font-size-base: 14px;
--font-size-small: 12px;

/* Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;

/* Borders */
--border-width: 3px;
--border-radius: 0;

/* Z-index */
--z-modal: 1000;
--z-overlay: 999;
```

---

**Version**: v3.1-phase4  
**Server**: http://localhost:3001/ (PID 31953)  
**Focus**: Registration UI implementation  
**Status**: Ready to build interface
**Next Session**: Start with Phase 4A - Modal container & file upload