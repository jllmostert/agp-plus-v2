# UI REFACTOR - REVISED IMPLEMENTATION PLAN

**Date**: 2025-11-08 02:15  
**Status**: 🟢 APPROVED - Ready to implement  
**Scope**: Simplified (15 hours total)

---

## ✅ DECISIONS MADE

### Q1: Panel Display Method
**Answer**: **Tabs (no router)** ✓
- Simple tab-based navigation
- Active state in main bar
- No React Router dependency
- DevTools: `Ctrl+Shift+D` toggle

### Q2: Multi-File Deduplication
**Answer**: **File-level, like ProTime PDFs** ✓
- Add `multiple` attribute to CSV input
- Process files sequentially (same as current PDF flow)
- No row-level dedup needed
- No complex file hash system needed
- **Priority: 1-2/10** → Minimal implementation

### Q3: Cleanup ALL-IN Scope
**Answer**: **Option 2 - Data Reset** ✓
- Delete: Glucose readings + device events (cartridges)
- Keep: Sensors, stock batches/assignments, patient info
- Mandatory backup before execution
- Dry-run shows affected records

### Q4: DevTools Visibility
**Answer**: **Hybrid approach** ✓
```javascript
const showDevTools = (
  process.env.NODE_ENV !== 'production' || 
  localStorage.getItem('agp-devtools-enabled') === 'true'
);
```

### Q5: Component Migration Strategy
**Answer**: **Wrap, don't convert** ✓
- Keep existing modals (DataImportModal, etc.)
- Create panel wrappers that invoke modals
- Incremental migration over time

---

## 🎯 SIMPLIFIED SCOPE

### What We're NOT Doing (Priority 1-2/10)
- ❌ Complex multi-file progress UI with per-file status
- ❌ File hash deduplication system
- ❌ Batch processing with cancellation
- ❌ Fancy upload queue management

### What We're Doing Instead
**Multi-file CSV = Same as ProTime PDF (already works!)**
```jsx
// Current ProTime PDF approach (works great)
<input 
  type="file" 
  multiple          // ← Just add this to CSV input
  accept=".csv"
  onChange={handleMultipleCSV}  // Process sequentially
/>

// handleMultipleCSV
for (const file of files) {
  await parseCSV(file);  // Existing code, just loop it
}
```

**Result**: 4 hours saved, same UX as ProTime

---

## 📊 REVISED TIME ESTIMATE

**Original**: 20 hours  
**Simplified**: 15 hours

| Phase | Task | Original | New | Savings |
|-------|------|----------|-----|---------|
| A | File Structure | 2h | 2h | - |
| B | Main Navigation | 2h | 2h | - |
| C | Panel Components | 6h | 6h | - |
| D | Multi-File Import | 4h | **1h** | **-3h** |
| E | Cleanup ALL-IN | 3h | **2h** | **-1h** |
| F | Polish & Testing | 3h | 2h | -1h |
| **Total** | | **20h** | **15h** | **-5h** |

---

## 🚀 IMPLEMENTATION PHASES

### PHASE A: File Structure (2 hours)
**Goal**: Reorganize without breaking anything

**Steps**:
1. Create new directories:
   ```
   src/components/
     panels/
     devtools/
   ```

2. Move existing files (no changes yet):
   ```
   SensorHistoryModal.jsx → panels/SensorHistoryPanel.jsx
   StockManagementPanel.jsx → panels/StockPanel.jsx
   DataExportPanel.jsx → panels/ExportPanel.jsx
   ```

3. Create new stub files:
   ```
   panels/ImportPanel.jsx (empty shell)
   panels/DayProfilesPanel.jsx (empty shell)
   panels/DevToolsPanel.jsx (empty shell)
   devtools/InsulinDebugger.jsx (moved)
   devtools/SensorSQLiteImport.jsx (moved)
   ```

4. Update all import paths (search-replace)

5. Test: App still runs, no regressions

**Commit**: `[refactor] Phase A: File structure reorganization`

---

### PHASE B: Main Navigation (2 hours)
**Goal**: Replace top bar with 4-button navigation

**Steps**:
1. Create `HeaderBar.jsx`:
   ```jsx
   <nav className="main-nav">
     <button 
       className={active === 'import' ? 'active' : ''}
       onClick={() => onChange('import')}
     >
       📥 IMPORT
     </button>
     {/* ... 3 more buttons */}
   </nav>
   ```

2. Add state to AGPGenerator.jsx:
   ```jsx
   const [activePanel, setActivePanel] = useState('import');
   ```

3. Render active panel:
   ```jsx
   {activePanel === 'import' && <ImportPanel />}
   {activePanel === 'dagprofielen' && <DayProfilesPanel />}
   {activePanel === 'sensoren' && <SensorHistoryPanel />}
   {activePanel === 'export' && <ExportPanel />}
   ```

4. Add DevTools toggle (Ctrl+Shift+D)

5. Style with brutalist borders (3px solid black)

**Commit**: `[feat] Phase B: Main navigation with 4 panels`

**Test**: All 4 panels accessible, DevTools toggle works

---

### PHASE C: Panel Components (6 hours)

#### C1: ImportPanel.jsx (2 hours)
**Structure**:
```jsx
export default function ImportPanel() {
  const [showImportModal, setShowImportModal] = useState(false);
  
  return (
    <div className="panel import-panel">
      <h2>📥 Import Data</h2>
      
      {/* Section 1: CSV Upload */}
      <section>
        <h3>Upload CSV (Medtronic CareLink)</h3>
        <input 
          type="file" 
          multiple              // ← NEW: Allow multiple files
          accept=".csv"
          onChange={handleCSVUpload}
        />
      </section>
      
      {/* Section 2: ProTime PDF */}
      <section>
        <h3>Upload ProTime PDF</h3>
        <input 
          type="file" 
          multiple
          accept=".pdf"
          onChange={handlePDFUpload}  // Already exists
        />
      </section>
      
      {/* Section 3: Database JSON */}
      <section>
        <h3>Import Database (JSON)</h3>
        <button onClick={() => setShowImportModal(true)}>
          Import Backup
        </button>
        <DataImportModal 
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          // ... existing props
        />
      </section>
    </div>
  );
}
```

**Changes to CSV handler**:
```javascript
// OLD (single file)
const handleCSVUpload = (e) => {
  const file = e.target.files[0];
  await parseCSV(file);
};

// NEW (multiple files)
const handleCSVUpload = async (e) => {
  const files = Array.from(e.target.files);
  
  for (const file of files) {
    console.log(`Processing ${file.name}...`);
    await parseCSV(file);  // Existing function
  }
  
  // Refresh UI after all files processed
  await refreshData();
};
```

**That's it!** No complex queue, no progress bars, just sequential processing.

---

#### C2: ExportPanel.jsx (1 hour)
**Structure**:
```jsx
export default function ExportPanel() {
  return (
    <div className="panel export-panel">
      <h2>📤 Export Data</h2>
      
      <div className="export-actions">
        <button onClick={handleExportAGPProfile}>
          📊 AGP+ Profiel (HTML)
        </button>
        
        <button onClick={handleExportDayProfiles}>
          📅 Dagprofielen (HTML)
        </button>
        
        <button onClick={handleExportDatabase}>
          💾 Export Database (JSON)
        </button>
      </div>
    </div>
  );
}
```

**Move existing export logic** from DataExportPanel → ExportPanel

---

#### C3: SensorHistoryPanel.jsx (1 hour)
**Changes**:
```jsx
export default function SensorHistoryPanel() {
  const [showStock, setShowStock] = useState(false);
  
  if (showStock) {
    return <StockPanel onClose={() => setShowStock(false)} />;
  }
  
  return (
    <div className="panel sensor-panel">
      <div className="panel-header">
        <h2>📍 Sensor History</h2>
        <button onClick={() => setShowStock(true)}>
          📦 Stockbeheer
        </button>
      </div>
      
      {/* Existing sensor history content */}
    </div>
  );
}
```

---

#### C4: DayProfilesPanel.jsx (1 hour)
**Wrap existing DayProfilesModal**:
```jsx
export default function DayProfilesPanel() {
  // Move day profiles logic here
  // Or just render DayProfilesModal without modal wrapper
  return (
    <div className="panel dayprofiles-panel">
      <h2>📅 Dagprofielen</h2>
      {/* Existing day profiles UI */}
    </div>
  );
}
```

---

#### C5: DevToolsPanel.jsx (1 hour)
**Structure**:
```jsx
export default function DevToolsPanel({ onClose }) {
  const [activeDebugTool, setActiveDebugTool] = useState('insulin');
  
  return (
    <div className="panel devtools-panel">
      <div className="panel-header">
        <h2>🛠️ Developer Tools</h2>
        <button onClick={onClose}>✕</button>
      </div>
      
      <div className="debug-tools">
        <button onClick={() => setActiveDebugTool('insulin')}>
          💉 Insulin Debugger
        </button>
        <button onClick={() => setActiveDebugTool('sqlite')}>
          💾 SQLite Import
        </button>
      </div>
      
      {activeDebugTool === 'insulin' && <InsulinDebugger />}
      {activeDebugTool === 'sqlite' && <SensorSQLiteImport />}
    </div>
  );
}
```

**Commits**:
- `[feat] Phase C1: ImportPanel with multi-file CSV`
- `[feat] Phase C2: ExportPanel with 3 actions`
- `[feat] Phase C3: SensorHistoryPanel with Stock button`
- `[feat] Phase C4: DayProfilesPanel wrapper`
- `[feat] Phase C5: DevToolsPanel with toggle`

---

### PHASE D: Multi-File CSV Import (1 hour)
**Goal**: Make CSV input accept multiple files (already done in Phase C1!)

**Additional Polish**:
1. Show count: "Processing file 3 of 12..."
2. Loading indicator during batch
3. Success message: "Imported 12 files (X records)"

**That's it.** No complex dedup, no per-file UI, no queue management.

**Commit**: `[feat] Phase D: Multi-file CSV batch processing`

---

### PHASE E: Cleanup ALL-IN (2 hours)
**Goal**: Add "ALL-IN" option with dry-run + mandatory backup

**Implementation**:

1. **Add ALL-IN button** to cleanup UI:
   ```jsx
   <select value={cleanupScope} onChange={setCleanupScope}>
     <option value="30d">Last 30 days</option>
     <option value="90d">Last 90 days</option>
     <option value="custom">Custom range</option>
     <option value="all-in">🔥 ALL-IN (Full Reset)</option>
   </select>
   ```

2. **Dry-run calculation**:
   ```javascript
   async function calculateCleanupStats(scope) {
     if (scope === 'all-in') {
       return {
         glucoseReadings: await masterDataset.getTotalCount(),
         cartridges: getCartridgeEvents().length,
         // Sensors, stock, patient NOT included
       };
     }
     // ... existing 30d/90d logic
   }
   ```

3. **Confirmation modal**:
   ```jsx
   <ConfirmModal>
     <h3>⚠️ Cleanup Preview</h3>
     <p>Records to be deleted:</p>
     <ul>
       <li>Glucose readings: {stats.glucoseReadings}</li>
       <li>Cartridge events: {stats.cartridges}</li>
     </ul>
     <p><strong>Not deleted:</strong> Sensors, stock, patient info</p>
     
     <label>
       <input type="checkbox" checked disabled />
       Backup created: {backupFilename}
     </label>
     
     <button onClick={executeCleanup}>Confirm & Execute</button>
   </ConfirmModal>
   ```

4. **Execute cleanup**:
   ```javascript
   async function executeAllInCleanup() {
     // 1. Create backup (mandatory)
     const backup = await exportMasterDataset();
     downloadBackup(backup, 'cleanup-backup-[timestamp].json');
     
     // 2. Clear glucose readings
     await masterDataset.clearAllData();
     
     // 3. Clear cartridge events
     localStorage.removeItem('agp-device-events');
     
     // 4. Refresh UI
     await refreshData();
     
     alert('✅ Cleanup complete. Backup saved.');
   }
   ```

**Commit**: `[feat] Phase E: Cleanup ALL-IN with dry-run`

**Test**: 
- Dry-run shows correct counts
- Backup downloads
- Cleanup executes
- Sensors/stock/patient preserved

---

### PHASE F: Polish & Testing (2 hours)

**Tasks**:
1. **Keyboard navigation**:
   - Tab cycles through main nav
   - Ctrl+1/2/3/4 quick switch panels
   - Ctrl+Shift+D toggles DevTools

2. **Accessibility**:
   - Add aria-labels to all buttons
   - aria-pressed for active nav buttons
   - Screen reader announcements

3. **Brutalist styling**:
   - 3px solid black borders everywhere
   - High contrast (black/white/green/red)
   - Monospace fonts (Courier New)

4. **Manual testing checklist**:
   - [ ] Navigate all 4 panels
   - [ ] Import CSV (single + multiple files)
   - [ ] Import PDF (multiple files)
   - [ ] Import JSON (validation + import)
   - [ ] Export all 3 formats
   - [ ] Sensor History → Stock toggle
   - [ ] DevTools toggle (Ctrl+Shift+D)
   - [ ] Cleanup ALL-IN (dry-run + execute)
   - [ ] Keyboard navigation
   - [ ] No regressions in metrics/AGP

**Commit**: `[polish] Phase F: Accessibility and final touches`

---

## 📏 AGPGenerator.jsx SIZE TARGET

**Current**: 1851 lines  
**Realistic Target**: **450-500 lines**

**Why not 400?**
- Routing logic: ~100 lines
- State management: ~100 lines
- Effect hooks: ~50 lines
- DevTools toggle: ~50 lines
- Render: ~150 lines
- Minimum glue code: ~50 lines

**If we push hard**: 400 lines possible, but 500 is comfortable

---

## 🧪 TESTING STRATEGY

### After Each Phase
1. Run dev server: `npx vite --port 3005`
2. Click through all panels
3. Test existing features (no regressions)
4. Git commit working state

### Final Integration Test
**Scenario**: Full round-trip
1. Import CSV (3 files at once)
2. Import PDF (2 files at once)
3. Generate AGP report
4. Export database (JSON)
5. Cleanup ALL-IN
6. Import backup (restore)
7. Verify: All data restored correctly

---

## ⚠️ RISK MITIGATION

### Risk 1: Import Path Hell
**Problem**: 50+ files need import path updates  
**Solution**: VSCode search-replace
```
Find:    from '../components/DataExportPanel'
Replace: from '../components/panels/ExportPanel'
```

### Risk 2: State Management Confusion
**Problem**: Moving state from AGPGenerator to panels  
**Solution**: Keep shared state in AGPGenerator, pass as props
- masterDataset → via context or props
- sensors → via context or props
- Don't over-optimize, prop drilling is OK for now

### Risk 3: Breaking Existing Modals
**Problem**: DataImportModal, DayProfilesModal tightly coupled  
**Solution**: **Wrap, don't convert**
- Keep modals as-is
- Panels just invoke them
- Refactor later if needed

---

## 📅 REALISTIC TIMELINE

**Option 1: All at once** (2 full days)
- Day 1: Phases A, B, C (10 hours)
- Day 2: Phases D, E, F (5 hours)

**Option 2: Incremental** (4 sessions)
- Session 1: Phase A + B (4h)
- Session 2: Phase C (6h)
- Session 3: Phase D + E (3h)
- Session 4: Phase F (2h)

**Recommended**: Option 2 (lower risk, shippable after each session)

---

## ✅ ACCEPTANCE CRITERIA

### Must Have
- [ ] Main nav: exactly 4 buttons (Import, Dagprofielen, Sensoren, Export)
- [ ] Stock accessible only via Sensoren → Stockbeheer button
- [ ] DevTools hidden by default, toggle with Ctrl+Shift+D
- [ ] CSV import accepts multiple files (like ProTime PDF)
- [ ] Cleanup ALL-IN: dry-run + mandatory backup
- [ ] AGPGenerator.jsx < 500 lines
- [ ] No regressions in existing features

### Nice to Have
- [ ] AGPGenerator.jsx < 450 lines
- [ ] Keyboard shortcuts (Ctrl+1/2/3/4)
- [ ] Smooth panel transitions
- [ ] Loading indicators for batch imports

---

## 🎯 READY TO START?

**Phase A** is the safest starting point:
- Low risk (just moving files)
- No logic changes
- Easy to test
- Can commit immediately

**Command to start**:
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git checkout -b feature/ui-refactor-panels
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3005
```

**First task**: Create `panels/` and `devtools/` directories

**Want to proceed with Phase A now?**