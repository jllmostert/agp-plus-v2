# HANDOFF - SESSION 16: PANEL COMPONENTS

**Date**: 2025-11-08  
**Session Goal**: Phase C - Build 5 panel components  
**Estimated Time**: 6 hours  
**Status**: 🟡 READY TO START

---

## 📋 CONTEXT FROM SESSION 15

### Session 15 Complete ✅
**Phase A**: File structure reorganized
- ✅ Created `panels/` and `devtools/` directories
- ✅ Moved existing components to new structure
- ✅ Created 3 stub panels (Import, DayProfiles, DevTools)
- ✅ Extracted 2 debug components to devtools/
- ✅ Updated all import paths
- ✅ Git commit: `[refactor] Phase A: File structure reorganization`

**Phase B**: Main navigation built
- ✅ Created HeaderBar component with 4 buttons
- ✅ Added panel routing to AGPGenerator
- ✅ Implemented DevTools toggle (Ctrl+Shift+D)
- ✅ Applied brutalist styling
- ✅ Git commit: `[feat] Phase B: Main navigation system`

### Current State
- Navigation works, 4 panels accessible
- Stub panels show placeholder content
- DevTools toggle functional
- No regressions in existing features
- Branch: feature/ui-refactor-panels (or develop)
- Server: Port 3005

---

## 🎯 SESSION 16 GOALS

Build out 5 panel components with full functionality:

1. **ImportPanel.jsx** (2h) - CSV (multi), PDF (multi), JSON (single)
2. **ExportPanel.jsx** (1h) - 3 export buttons (AGP+, Dagprofielen, Database)
3. **SensorHistoryPanel.jsx** (1h) - Sensor list + Stock button
4. **DayProfilesPanel.jsx** (1h) - Day profiles view
5. **DevToolsPanel.jsx** (1h) - Insulin debugger + SQLite import

---

## 🚀 IMPLEMENTATION PROMPT FOR CLAUDE

**Role**: You are a senior React developer working on AGP+. Session 15 completed file structure and navigation. Now build out the panel components.

**Task**: Implement 5 panel components with full functionality. Work in small chunks with frequent check-ins.

**Critical Requirements**:
1. **Work in chunks**: Build one section at a time, CHECK with user
2. **Update PROGRESS.md**: After each panel completion
3. **Test after each panel**: Ensure functionality works
4. **Wrap existing modals**: Don't convert, just invoke them
5. **Git commit**: After each major panel

---

### PANEL C1: IMPORTPANEL.JSX (2 HOURS)

#### Chunk C1.1: Read Existing Import Logic (10 min)
**Task**: Understand current import handlers in AGPGenerator

**Steps**:
1. Search for CSV upload handler in AGPGenerator
2. Search for PDF upload handler in AGPGenerator
3. Search for JSON import modal trigger
4. Note: Where is DataImportModal rendered?

**Check-in**: Show user what you found, explain current flow.

---

#### Chunk C1.2: Extract CSV Handler (20 min)
**Task**: Move CSV parsing logic to ImportPanel

**In AGPGenerator.jsx**, find:
```javascript
const handleCSVUpload = async (e) => {
  const file = e.target.files[0];
  // ... parsing logic
};
```

**Move to ImportPanel.jsx**:
```javascript
const handleCSVUpload = async (e) => {
  const files = Array.from(e.target.files); // Support multiple
  
  setIsProcessing(true);
  let totalRecords = 0;
  
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[ImportPanel] Processing CSV ${i+1}/${files.length}:`, file.name);
      
      // Call existing parseCSV function
      const result = await parseCSV(file);
      totalRecords += result.recordCount || 0;
    }
    
    alert(`✅ Import Complete\n\nFiles: ${files.length}\nRecords: ${totalRecords}`);
    
    // Trigger data refresh (via callback prop)
    if (onDataImported) {
      await onDataImported();
    }
    
  } catch (error) {
    console.error('[ImportPanel] CSV import failed:', error);
    alert(`❌ Import Failed\n\n${error.message}`);
  } finally {
    setIsProcessing(false);
  }
};
```

**Check-in**: Show extracted handler, confirm logic looks correct.

---

#### Chunk C1.3: Build CSV Upload Section (20 min)
**Task**: Create CSV upload UI in ImportPanel

**Add to ImportPanel.jsx**:
```jsx
<section className="import-section" style={{
  marginBottom: '2rem',
  padding: '1.5rem',
  border: '3px solid var(--border-primary)',
  background: 'var(--bg-secondary)'
}}>
  <h3 style={{
    fontFamily: 'Courier New, monospace',
    fontSize: '1.125rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: '1rem'
  }}>
    📄 Upload CSV (Medtronic CareLink)
  </h3>
  
  <input
    type="file"
    multiple
    accept=".csv"
    onChange={handleCSVUpload}
    disabled={isProcessing}
    style={{
      display: 'block',
      width: '100%',
      padding: '0.75rem',
      fontFamily: 'Courier New, monospace',
      fontSize: '0.875rem',
      border: '2px solid var(--border-primary)',
      background: 'var(--bg-primary)',
      cursor: isProcessing ? 'not-allowed' : 'pointer'
    }}
  />
  
  <p style={{
    marginTop: '0.5rem',
    fontFamily: 'Courier New, monospace',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  }}>
    Select multiple CSV files at once. Files are processed sequentially.
  </p>
</section>
```

**Check-in**: Show UI code, test file picker works.

---

#### Chunk C1.4: Extract PDF Handler (15 min)
**Task**: Move PDF parsing logic to ImportPanel

**In AGPGenerator.jsx**, find:
```javascript
const handleProTimePDFUpload = async (e) => {
  const files = Array.from(e.target.files);
  // ... existing PDF logic
};
```

**Move entire function** to ImportPanel.jsx (no changes needed, already supports multiple files)

**Check-in**: Confirm PDF handler moved correctly.

---

#### Chunk C1.5: Build PDF Upload Section (15 min)
**Task**: Create PDF upload UI in ImportPanel

**Add to ImportPanel.jsx** (same structure as CSV section):
```jsx
<section className="import-section">
  <h3>📋 Upload ProTime PDF (Werkdagen)</h3>
  <input
    type="file"
    multiple
    accept=".pdf"
    onChange={handleProTimePDFUpload}
    disabled={isProcessing}
  />
  <p>Select multiple PDF files at once.</p>
</section>
```

**Check-in**: Show UI, test PDF picker works.

---

#### Chunk C1.6: Add JSON Import Section (20 min)
**Task**: Add database import button

**Add to ImportPanel.jsx**:
```jsx
<section className="import-section">
  <h3>💾 Import Database (JSON)</h3>
  
  <button
    onClick={() => setShowImportModal(true)}
    disabled={isProcessing}
    style={{
      padding: '0.75rem 1.5rem',
      background: 'var(--color-green)',
      border: '3px solid var(--border-primary)',
      color: '#000',
      fontFamily: 'Courier New, monospace',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      cursor: isProcessing ? 'not-allowed' : 'pointer'
    }}
  >
    📥 Import Backup
  </button>
  
  <p style={{
    marginTop: '0.5rem',
    fontFamily: 'Courier New, monospace',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  }}>
    Import a previously exported database JSON file. Includes validation and merge strategy options.
  </p>
</section>

{/* Existing DataImportModal */}
<DataImportModal
  isOpen={showImportModal}
  onClose={() => setShowImportModal(false)}
  onConfirm={handleImportConfirm}
  validationResult={importValidation}
  isValidating={isValidating}
  mergeStrategy={importMergeStrategy}
  onMergeStrategyChange={setImportMergeStrategy}
  lastImport={lastImportInfo}
  createBackup={createBackupBeforeImport}
  onCreateBackupChange={setCreateBackupBeforeImport}
  lastBackupFile={lastBackupFile}
/>
```

**Check-in**: Show JSON section, confirm modal props are correct.

---

#### Chunk C1.7: Add Props to ImportPanel (15 min)
**Task**: Define all required props

**At top of ImportPanel.jsx**:
```jsx
export default function ImportPanel({
  // CSV/PDF callbacks
  onDataImported,
  
  // JSON import state (from AGPGenerator)
  showImportModal,
  setShowImportModal,
  importValidation,
  isValidating,
  handleImportConfirm,
  importMergeStrategy,
  setImportMergeStrategy,
  lastImportInfo,
  createBackupBeforeImport,
  setCreateBackupBeforeImport,
  lastBackupFile
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ... rest of component
}
```

**Check-in**: Show props definition, confirm all needed state is passed.

---

#### Chunk C1.8: Wire Up ImportPanel in AGPGenerator (20 min)
**Task**: Pass props from AGPGenerator to ImportPanel

**In AGPGenerator.jsx**:
```jsx
{activePanel === 'import' && (
  <ImportPanel
    onDataImported={handleDataRefresh}
    showImportModal={dataImportModalOpen}
    setShowImportModal={setDataImportModalOpen}
    importValidation={importValidation}
    isValidating={isValidating}
    handleImportConfirm={handleImportConfirm}
    importMergeStrategy={importMergeStrategy}
    setImportMergeStrategy={setImportMergeStrategy}
    lastImportInfo={lastImportInfo}
    createBackupBeforeImport={createBackupBeforeImport}
    setCreateBackupBeforeImport={setCreateBackupBeforeImport}
    lastBackupFile={lastBackupFile}
  />
)}
```

**Check-in**: Show prop passing, test ImportPanel renders with all props.

---

#### Chunk C1.9: Test ImportPanel (20 min)
**Task**: Manual testing of all 3 import methods

**Test Checklist**:
1. Upload single CSV → processes correctly
2. Upload 3 CSV files at once → all process sequentially
3. Upload single PDF → processes correctly
4. Upload 2 PDF files at once → all process sequentially
5. Click "Import Backup" → DataImportModal opens
6. Import JSON file → validation + import works
7. Loading states show correctly during processing

**Check-in**: Report test results.

---

#### Chunk C1.10: Update PROGRESS.md (10 min)
**Task**: Document ImportPanel completion

**Add to PROGRESS.md**:
```markdown
### Phase C1: ImportPanel ✅ (2h)

**Features**:
- ✅ CSV upload (multi-file support)
- ✅ ProTime PDF upload (multi-file support)
- ✅ Database JSON import (validation + merge strategies)
- ✅ Loading states during processing
- ✅ Success/error messages
- ✅ Sequential batch processing

**Files Modified**:
- `src/components/panels/ImportPanel.jsx` (implemented)
- `src/components/AGPGenerator.jsx` (props passed)

**Testing**: All 3 import methods working ✅
```

**Check-in**: Show PROGRESS.md update.

---

#### Chunk C1.11: Git Commit ImportPanel (5 min)
**Task**: Commit completed ImportPanel

**Commands**:
```bash
git add src/components/panels/ImportPanel.jsx
git add src/components/AGPGenerator.jsx
git add PROGRESS.md
git commit -m "[feat] Phase C1: ImportPanel with multi-file support

- Implemented CSV upload (multiple files at once)
- Implemented PDF upload (multiple files at once)
- Integrated DataImportModal for JSON import
- Added sequential batch processing for CSV/PDF
- Added loading states and user feedback
- Extracted import logic from AGPGenerator

Features:
- Multi-file CSV import (processed sequentially)
- Multi-file PDF import (processed sequentially)
- Database JSON import (with validation modal)
- Success/error messages
- Props passed from AGPGenerator

Testing: All 3 import methods functional
"
```

**Check-in**: Show commit message before executing.

---

### PANEL C2: EXPORTPANEL.JSX (1 HOUR)

#### Chunk C2.1: Extract Export Handlers (20 min)
**Task**: Move export logic to ExportPanel

**Find in AGPGenerator.jsx**:
```javascript
const handleExportAGPProfile = async () => { ... };
const handleExportDayProfiles = async () => { ... };
const handleExportDatabase = async () => { ... };
```

**Move all 3** to ExportPanel.jsx

**Check-in**: Show extracted handlers.

---

#### Chunk C2.2: Build Export UI (30 min)
**Task**: Create 3-button layout

**ExportPanel.jsx structure**:
```jsx
export default function ExportPanel() {
  const [isExporting, setIsExporting] = useState(false);
  
  return (
    <div className="panel export-panel">
      <h2>📤 Export Data</h2>
      
      <div className="export-actions" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '600px'
      }}>
        {/* Button 1: AGP+ Profile */}
        <button
          onClick={handleExportAGPProfile}
          disabled={isExporting}
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--bg-secondary)',
            border: '3px solid var(--border-primary)',
            fontFamily: 'Courier New, monospace',
            fontSize: '1rem',
            fontWeight: 'bold',
            textAlign: 'left',
            cursor: isExporting ? 'not-allowed' : 'pointer'
          }}
        >
          <div style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>
            📊 AGP+ Profiel (HTML)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Export complete glucose profile with statistics and visualizations
          </div>
        </button>
        
        {/* Button 2: Day Profiles */}
        <button onClick={handleExportDayProfiles}>
          <div>📅 Dagprofielen (HTML)</div>
          <div>Export individual day reports with detailed metrics</div>
        </button>
        
        {/* Button 3: Database */}
        <button onClick={handleExportDatabase}>
          <div>💾 Export Database (JSON)</div>
          <div>Export complete database for backup or transfer</div>
        </button>
      </div>
    </div>
  );
}
```

**Check-in**: Show UI structure, test buttons render.

---

#### Chunk C2.3: Test ExportPanel (10 min)
**Task**: Test all 3 exports

**Test Checklist**:
1. Click "AGP+ Profile" → HTML file downloads
2. Click "Dagprofielen" → HTML file downloads
3. Click "Export Database" → JSON file downloads
4. Disabled state during export

**Check-in**: Report test results, commit if working.

---

### PANEL C3: SENSORHISTORYPANEL.JSX (1 HOUR)

#### Chunk C3.1: Extract Sensor Logic (15 min)
**Task**: Move sensor display logic from SensorHistoryModal

**Steps**:
1. Copy content from existing SensorHistoryModal
2. Remove modal wrapper
3. Keep sensor list and statistics

**Check-in**: Show extracted component structure.

---

#### Chunk C3.2: Add Stock Button (20 min)
**Task**: Add "Stockbeheer" button to panel header

**Add to SensorHistoryPanel**:
```jsx
const [showStock, setShowStock] = useState(false);

if (showStock) {
  return <StockPanel onBack={() => setShowStock(false)} />;
}

return (
  <div className="panel sensor-panel">
    <div className="panel-header" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem'
    }}>
      <h2>📍 Sensor History</h2>
      
      <button
        onClick={() => setShowStock(true)}
        style={{
          padding: '0.5rem 1rem',
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-primary)',
          fontFamily: 'Courier New, monospace',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        📦 Stockbeheer
      </button>
    </div>
    
    {/* Existing sensor list */}
  </div>
);
```

**Check-in**: Show header with button, test Stock toggle.

---

#### Chunk C3.3: Update StockPanel (15 min)
**Task**: Add onBack prop to StockPanel

**In StockPanel.jsx**:
```jsx
export default function StockPanel({ onBack }) {
  return (
    <div className="panel stock-panel">
      <div className="panel-header">
        <button onClick={onBack} style={{ /* back button */ }}>
          ← Back to Sensors
        </button>
        <h2>📦 Stock Management</h2>
      </div>
      
      {/* Existing stock management UI */}
    </div>
  );
}
```

**Check-in**: Show back navigation, test round-trip.

---

#### Chunk C3.4: Test Sensor → Stock Flow (10 min)
**Test**:
1. Click "SENSOREN" in main nav
2. Click "Stockbeheer" button
3. StockPanel appears
4. Click "Back to Sensors"
5. Returns to sensor list

**Check-in**: Report test results, commit if working.

---

### PANEL C4: DAYPROFILESPANEL.JSX (1 HOUR)

#### Chunk C4.1: Extract Day Profiles (30 min)
**Task**: Move day profiles content from modal to panel

**Options**:
1. **Option A**: Unwrap DayProfilesModal (remove modal wrapper)
2. **Option B**: Keep modal, render inline (no overlay)

**Recommended**: Option B (simpler)

```jsx
export default function DayProfilesPanel() {
  return (
    <div className="panel dayprofiles-panel">
      <DayProfilesModal 
        isOpen={true}
        asPanel={true}  // New prop: render without overlay
        onClose={null}  // No close button needed in panel mode
      />
    </div>
  );
}
```

**Check-in**: Show approach, get approval before modifying DayProfilesModal.

---

#### Chunk C4.2: Modify DayProfilesModal (20 min)
**Task**: Add asPanel prop support

**In DayProfilesModal.jsx**:
```jsx
export default function DayProfilesModal({ isOpen, onClose, asPanel = false }) {
  if (!isOpen && !asPanel) return null;
  
  const content = (
    <div className="dayprofiles-content">
      {/* Existing day profiles UI */}
    </div>
  );
  
  // If panel mode, return content directly
  if (asPanel) {
    return content;
  }
  
  // If modal mode, wrap in overlay
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose}>×</button>
        {content}
      </div>
    </div>
  );
}
```

**Check-in**: Show modified modal, test both modes work.

---

#### Chunk C4.3: Test DayProfilesPanel (10 min)
**Test**:
1. Click "DAGPROFIELEN" in main nav
2. Day profiles display without modal overlay
3. All existing functionality works
4. No regressions

**Check-in**: Report results, commit if working.

---

### PANEL C5: DEVTOOLSPANEL.JSX (1 HOUR)

#### Chunk C5.1: Build DevTools UI Structure (20 min)
**Task**: Create panel with tool selector

**DevToolsPanel.jsx**:
```jsx
export default function DevToolsPanel({ onClose }) {
  const [activeTool, setActiveTool] = useState('insulin');
  
  return (
    <div className="panel devtools-panel">
      <div className="panel-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '3px solid var(--border-primary)'
      }}>
        <h2>🛠️ Developer Tools</h2>
        <button onClick={onClose} style={{
          background: '#f00',
          color: '#fff',
          border: '2px solid #000',
          padding: '0.5rem 1rem',
          cursor: 'pointer'
        }}>
          ✕ Close
        </button>
      </div>
      
      <div className="tool-selector" style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '1rem',
        borderBottom: '2px solid var(--border-primary)'
      }}>
        <button
          onClick={() => setActiveTool('insulin')}
          style={{
            background: activeTool === 'insulin' ? 'var(--color-green)' : 'var(--bg-secondary)',
            border: '2px solid var(--border-primary)',
            padding: '0.5rem 1rem',
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          💉 Insulin
        </button>
        
        <button
          onClick={() => setActiveTool('sqlite')}
          style={{ /* same styling */ }}
        >
          💾 SQLite
        </button>
      </div>
      
      <div className="tool-content" style={{ padding: '1rem' }}>
        {activeTool === 'insulin' && <InsulinDebugger />}
        {activeTool === 'sqlite' && <SensorSQLiteImport />}
      </div>
    </div>
  );
}
```

**Check-in**: Show UI structure, test tool switching.

---

#### Chunk C5.2: Import Debug Components (15 min)
**Task**: Wire up InsulinDebugger and SensorSQLiteImport

**At top of DevToolsPanel.jsx**:
```jsx
import InsulinDebugger from '../devtools/InsulinDebugger';
import SensorSQLiteImport from '../devtools/SensorSQLiteImport';
```

**Verify files exist**:
- `src/components/devtools/InsulinDebugger.jsx`
- `src/components/devtools/SensorSQLiteImport.jsx`

**Check-in**: Confirm imports resolve, components render.

---

#### Chunk C5.3: Test DevTools Panel (15 min)
**Test**:
1. Press Ctrl+Shift+D → DevTools panel slides in
2. Click "Insulin" → InsulinDebugger appears
3. Click "SQLite" → SensorSQLiteImport appears
4. Click "Close" → Panel closes
5. Press Ctrl+Shift+D again → Panel opens

**Check-in**: Report test results.

---

#### Chunk C5.4: Add Production Warning (10 min)
**Task**: Add notice that DevTools is dev-only

**Add to DevToolsPanel**:
```jsx
<div style={{
  padding: '1rem',
  background: '#fffacd',
  border: '2px solid #fa0',
  margin: '1rem',
  fontFamily: 'Courier New, monospace',
  fontSize: '0.875rem'
}}>
  ⚠️ <strong>Developer Tools</strong>: These tools are for debugging and development only. 
  They are hidden in production builds unless explicitly enabled via localStorage.
</div>
```

**Check-in**: Show warning banner.

---

### FINAL PHASE C TASKS

#### Chunk C.Final.1: Update PROGRESS.md (15 min)
**Task**: Document all Phase C completions

**Add to PROGRESS.md**:
```markdown
### Phase C: Panel Components ✅ (6h)

**Panels Implemented**:
- ✅ ImportPanel (2h) - CSV/PDF/JSON import
- ✅ ExportPanel (1h) - 3 export options
- ✅ SensorHistoryPanel (1h) - Sensor list + Stock button
- ✅ DayProfilesPanel (1h) - Day profiles view
- ✅ DevToolsPanel (1h) - Insulin + SQLite tools

**Testing**:
- ✅ All panels render correctly
- ✅ Import/export functionality preserved
- ✅ Sensor → Stock navigation works
- ✅ DevTools toggle functional
- ✅ No regressions in existing features

**Commits**:
- `[feat] Phase C1: ImportPanel with multi-file support`
- `[feat] Phase C2: ExportPanel with 3 actions`
- `[feat] Phase C3: SensorHistoryPanel with Stock button`
- `[feat] Phase C4: DayProfilesPanel wrapper`
- `[feat] Phase C5: DevToolsPanel with tool selector`

**Session 16 Complete**: All panel components implemented ✅
```

**Check-in**: Show full PROGRESS.md update.

---

#### Chunk C.Final.2: Final Integration Test (20 min)
**Task**: Complete round-trip test

**Test Scenario**:
1. Start fresh session
2. Click IMPORT → Upload CSV (3 files) → Success
3. Click DAGPROFIELEN → View day reports → Works
4. Click SENSOREN → View sensors → Click Stock → View stock → Back → Works
5. Click EXPORT → Export AGP+ → Download works
6. Press Ctrl+Shift+D → DevTools appear → Close → Works
7. Navigate between all panels multiple times → No errors

**Check-in**: Report full test results.

---

#### Chunk C.Final.3: Git Commit Final (10 min)
**Task**: Final commit for Session 16

**Commands**:
```bash
git add src/components/panels/
git add src/components/devtools/
git add src/components/AGPGenerator.jsx
git add PROGRESS.md
git commit -m "[feat] Session 16 complete: All panel components implemented

Summary:
- ImportPanel: CSV/PDF/JSON import with multi-file support
- ExportPanel: 3 export options (AGP+, Dagprofielen, Database)
- SensorHistoryPanel: Sensor list with Stock navigation
- DayProfilesPanel: Day profiles view (unwrapped modal)
- DevToolsPanel: Insulin + SQLite debug tools

Features:
- Multi-file CSV/PDF import (sequential processing)
- All existing export functions preserved
- Sensor → Stock → Back navigation
- DevTools panel with tool selector
- Brutalist styling maintained throughout

Testing: All panels functional, no regressions
Phase C complete: 5/5 panels implemented ✅
"
```

**Check-in**: Show final commit message.

---

## ✅ SESSION 16 ACCEPTANCE CRITERIA

### All Panels Must Have
- [ ] ImportPanel: 3 import methods (CSV, PDF, JSON)
- [ ] ExportPanel: 3 export buttons
- [ ] SensorHistoryPanel: Sensor list + Stock button
- [ ] DayProfilesPanel: Day profiles display
- [ ] DevToolsPanel: 2 debug tools + close button

### Functionality Must Work
- [ ] Multi-file CSV import (tested with 3+ files)
- [ ] Multi-file PDF import (tested with 2+ files)
- [ ] JSON import with validation modal
- [ ] All 3 exports download correctly
- [ ] Sensor → Stock → Back navigation
- [ ] DevTools toggle (Ctrl+Shift+D)
- [ ] Tool switching in DevTools

### Code Quality
- [ ] No console errors
- [ ] Loading states work
- [ ] Error handling functional
- [ ] Brutalist styling applied
- [ ] PROGRESS.md updated
- [ ] Git committed

---

## 🧪 TESTING PROTOCOL

**After each panel**:
1. Render panel in browser
2. Test all functionality
3. Check console for errors
4. Report to user before proceeding

**After Phase C complete**:
1. Full round-trip test (see Chunk C.Final.2)
2. Test all 4 main panels
3. Test DevTools
4. Verify no regressions
5. Commit if all pass

---

## 🚨 IF SOMETHING BREAKS

1. **STOP immediately**
2. **Check console** for error messages
3. **Report to user** with details
4. **Git status** to see changes
5. **Rollback if needed**: `git checkout -- <file>`
6. **Ask for guidance**

---

## 🎯 END OF SESSION 16

**Deliverables**:
- 5 fully functional panel components
- Multi-file import support
- Complete navigation system
- Updated PROGRESS.md
- 5-6 git commits

**Next Session**: Session 17 - Phase D+E (Multi-file improvements + Cleanup ALL-IN)

**Handoff to Session 17**: `HANDOFF_SESSION_17.md`