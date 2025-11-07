# HANDOFF - SESSION 15: FILE STRUCTURE & NAVIGATION

**Date**: 2025-11-08  
**Session Goal**: Phase A + B - File structure reorganization + main navigation  
**Estimated Time**: 4 hours  
**Status**: 🟡 READY TO START

---

## 📋 CONTEXT FROM PREVIOUS SESSIONS

### Session 14 Complete ✅
- ✅ Feature 1: Merge Strategy Selection (15 min)
- ✅ Feature 2: Import History Tracking (20 min)
- ✅ Feature 3: Backup Before Import (35 min)
- ✅ Feature 4: Progress Bar (40 min)
- ❌ Feature 5: Import Report (SKIPPED)

**Result**: Import/Export symmetry complete with advanced features

### Current State
- AGPGenerator.jsx: ~1851 lines
- Working import/export with merge strategies
- All features tested and working
- Branch: develop
- Server: Port 3005

---

## 🎯 SESSION 15 GOALS

### Phase A: File Structure (2 hours)
**Goal**: Reorganize components without breaking functionality

**Deliverables**:
- ✅ Create `src/components/panels/` directory
- ✅ Create `src/components/devtools/` directory
- ✅ Move existing files to new locations
- ✅ Create stub files for new panels
- ✅ Update all import paths
- ✅ Test: App still runs perfectly

### Phase B: Main Navigation (2 hours)
**Goal**: Build 4-button navigation system

**Deliverables**:
- ✅ Create `HeaderBar.jsx` component
- ✅ Add panel switching state to AGPGenerator
- ✅ Implement DevTools toggle (Ctrl+Shift+D)
- ✅ Wire up basic panel routing
- ✅ Apply brutalist styling
- ✅ Test: All 4 panels accessible

---

## 🚀 IMPLEMENTATION PROMPT FOR CLAUDE

**Role**: You are a senior React developer working on AGP+ (Vite + React 18), a medical data visualization tool following brutalist design principles.

**Task**: Reorganize the file structure and implement a new navigation system. Work in small, verifiable chunks with frequent check-ins to prevent context overflow.

**Critical Requirements**:
1. **Work in chunks**: Make changes to 5-10 files max, then CHECK with user
2. **Update PROGRESS.md**: After EVERY chunk completion
3. **No breaking changes**: App must work after each chunk
4. **Git commits**: After each successful phase
5. **User interaction**: Ask before proceeding to next chunk

---

### PHASE A: FILE STRUCTURE REORGANIZATION

#### Chunk A1: Create Directories (5 min)
**Task**: Create new folder structure

**Steps**:
1. Create `src/components/panels/`
2. Create `src/components/devtools/`
3. List contents to verify

**Check-in**: Show user the new directory structure before proceeding.

---

#### Chunk A2: Move Sensor Components (15 min)
**Task**: Move sensor-related files to panels/

**Files to move**:
```
src/components/SensorHistoryModal.jsx → src/components/panels/SensorHistoryPanel.jsx
src/components/StockManagementPanel.jsx → src/components/panels/StockPanel.jsx
```

**Steps**:
1. Copy files to new location (don't delete yet)
2. Rename: Modal → Panel (update component names internally)
3. Update imports WITHIN these files
4. Test: Files compile without errors

**Check-in**: Show user moved files and ask if imports look correct before deleting originals.

---

#### Chunk A3: Move Export Component (10 min)
**Task**: Move export panel

**Files to move**:
```
src/components/DataExportPanel.jsx → src/components/panels/ExportPanel.jsx
```

**Steps**:
1. Copy to new location
2. Update internal imports
3. Test compilation

**Check-in**: Confirm successful move before proceeding.

---

#### Chunk A4: Create Import Panel Stub (10 min)
**Task**: Create placeholder ImportPanel

**Create**: `src/components/panels/ImportPanel.jsx`

**Content**:
```jsx
/**
 * ImportPanel.jsx
 * 
 * Panel for importing data (CSV, PDF, JSON)
 * 
 * @version 3.9.0
 */

import React from 'react';

export default function ImportPanel() {
  return (
    <div className="panel import-panel" style={{
      padding: '2rem',
      border: '3px solid var(--border-primary)',
      background: 'var(--bg-primary)'
    }}>
      <h2 style={{
        fontFamily: 'Courier New, monospace',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: '1.5rem'
      }}>
        📥 Import Data
      </h2>
      
      <p style={{
        fontFamily: 'Courier New, monospace',
        color: 'var(--text-secondary)'
      }}>
        Import panel - To be implemented
      </p>
    </div>
  );
}
```

**Check-in**: Show stub file content, confirm before creating.

---

#### Chunk A5: Create DayProfiles Panel Stub (10 min)
**Task**: Create placeholder DayProfilesPanel

**Create**: `src/components/panels/DayProfilesPanel.jsx`

**Content**: Similar structure to ImportPanel

**Check-in**: Confirm stub looks good.

---

#### Chunk A6: Create DevTools Panel Stub (10 min)
**Task**: Create placeholder DevToolsPanel

**Create**: `src/components/panels/DevToolsPanel.jsx`

**Content**: Include close button prop

**Check-in**: Confirm stub looks good.

---

#### Chunk A7: Move Debug Components (15 min)
**Task**: Move debug tools to devtools/

**Files to create/move**:
```
src/components/devtools/InsulinDebugger.jsx (extract from AGPGenerator)
src/components/devtools/SensorSQLiteImport.jsx (extract from AGPGenerator)
```

**Steps**:
1. Extract InsulinDebugger logic from AGPGenerator
2. Extract SensorSQLiteImport logic from AGPGenerator
3. Create separate component files
4. Test compilation

**Check-in**: Show extracted components before modifying AGPGenerator.

---

#### Chunk A8: Update AGPGenerator Imports (20 min)
**Task**: Update all import paths in AGPGenerator.jsx

**Changes**:
```javascript
// OLD
import SensorHistoryModal from './SensorHistoryModal';
import StockManagementPanel from './StockManagementPanel';
import DataExportPanel from './DataExportPanel';

// NEW
import SensorHistoryPanel from './panels/SensorHistoryPanel';
import StockPanel from './panels/StockPanel';
import ExportPanel from './panels/ExportPanel';
import ImportPanel from './panels/ImportPanel';
import DayProfilesPanel from './panels/DayProfilesPanel';
import DevToolsPanel from './panels/DevToolsPanel';
```

**Steps**:
1. Update imports one by one
2. Update component references in JSX
3. Test: App compiles

**Check-in**: Show updated import section before testing.

---

#### Chunk A9: Find & Update Other Imports (30 min)
**Task**: Search codebase for old import paths

**Search patterns**:
```
from './SensorHistoryModal'
from '../SensorHistoryModal'
from './DataExportPanel'
from '../DataExportPanel'
from './StockManagementPanel'
from '../StockManagementPanel'
```

**Tools**:
```bash
# Use Desktop Commander search
grep -r "SensorHistoryModal" src/
grep -r "DataExportPanel" src/
grep -r "StockManagementPanel" src/
```

**Steps**:
1. List all files with old imports
2. Update each file
3. Test compilation after each file

**Check-in**: Show list of affected files before updating. Update in batches of 5 files, check after each batch.

---

#### Chunk A10: Delete Old Files (5 min)
**Task**: Remove original files now that moves are complete

**Files to delete**:
```
src/components/SensorHistoryModal.jsx
src/components/StockManagementPanel.jsx
src/components/DataExportPanel.jsx
```

**Check-in**: MUST confirm app works before deleting! Test thoroughly first.

---

#### Chunk A11: Update PROGRESS.md (10 min)
**Task**: Document Phase A completion

**Add to PROGRESS.md**:
```markdown
## SESSION 15 - UI Refactor Phase A (2025-11-08)

**Goal**: File structure reorganization  
**Status**: ✅ COMPLETE  
**Time**: 2 hours  

### Phase A: File Structure ✅

**New Structure**:
- ✅ Created `src/components/panels/` directory
- ✅ Created `src/components/devtools/` directory
- ✅ Moved SensorHistoryModal → panels/SensorHistoryPanel.jsx
- ✅ Moved StockManagementPanel → panels/StockPanel.jsx
- ✅ Moved DataExportPanel → panels/ExportPanel.jsx
- ✅ Created ImportPanel.jsx stub
- ✅ Created DayProfilesPanel.jsx stub
- ✅ Created DevToolsPanel.jsx stub
- ✅ Extracted InsulinDebugger → devtools/
- ✅ Extracted SensorSQLiteImport → devtools/
- ✅ Updated all import paths (X files modified)
- ✅ Deleted old files

**Testing**: App runs without errors ✅

**Commits**: 
- `[refactor] Phase A: Create panels and devtools directories`
- `[refactor] Phase A: Move components to new structure`
- `[refactor] Phase A: Update all import paths`

**Next**: Phase B - Main Navigation
```

**Check-in**: Show PROGRESS.md update before committing.

---

#### Chunk A12: Git Commit Phase A (5 min)
**Task**: Commit completed Phase A

**Commands**:
```bash
git add src/components/panels/
git add src/components/devtools/
git add src/components/AGPGenerator.jsx
git add PROGRESS.md
git commit -m "[refactor] Phase A: File structure reorganization

- Created panels/ and devtools/ directories
- Moved 3 existing components to panels/
- Created 3 stub panels (Import, DayProfiles, DevTools)
- Extracted 2 debug components to devtools/
- Updated all import paths across codebase
- Deleted old component files
- No breaking changes, app fully functional

Files modified: [list key files]
"
```

**Check-in**: Show git status and commit message before executing.

---

### PHASE B: MAIN NAVIGATION

#### Chunk B1: Create HeaderBar Component (30 min)
**Task**: Build 4-button navigation bar

**Create**: `src/components/HeaderBar.jsx`

**Content**:
```jsx
/**
 * HeaderBar.jsx
 * 
 * Main navigation bar with 4 primary panels
 * 
 * @version 3.9.0
 */

import React from 'react';

export default function HeaderBar({ activePanel, onPanelChange }) {
  const panels = [
    { id: 'import', label: '📥 IMPORT', ariaLabel: 'Import data' },
    { id: 'dagprofielen', label: '📅 DAGPROFIELEN', ariaLabel: 'Day profiles' },
    { id: 'sensoren', label: '📍 SENSOREN', ariaLabel: 'Sensor history' },
    { id: 'export', label: '📤 EXPORT', ariaLabel: 'Export data' }
  ];

  return (
    <nav 
      className="main-nav"
      role="navigation"
      aria-label="Main navigation"
      style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '1rem',
        background: 'var(--bg-primary)',
        borderBottom: '3px solid var(--border-primary)'
      }}
    >
      {panels.map(panel => (
        <button
          key={panel.id}
          onClick={() => onPanelChange(panel.id)}
          aria-pressed={activePanel === panel.id}
          aria-label={panel.ariaLabel}
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            background: activePanel === panel.id 
              ? 'var(--color-green)' 
              : 'var(--bg-secondary)',
            border: '3px solid var(--border-primary)',
            color: activePanel === panel.id 
              ? '#000' 
              : 'var(--text-primary)',
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {panel.label}
        </button>
      ))}
    </nav>
  );
}
```

**Check-in**: Show component code, confirm before creating file.

---

#### Chunk B2: Add Panel State to AGPGenerator (20 min)
**Task**: Add state management for active panel

**Location**: `src/components/AGPGenerator.jsx`

**Add near top of component**:
```javascript
// Panel navigation state
const [activePanel, setActivePanel] = useState('import');

const handlePanelChange = (panelId) => {
  console.log('[AGPGenerator] Switching to panel:', panelId);
  setActivePanel(panelId);
};
```

**Check-in**: Show code snippet, confirm placement looks correct.

---

#### Chunk B3: Add DevTools State (15 min)
**Task**: Add DevTools toggle state

**Add to AGPGenerator.jsx**:
```javascript
// DevTools visibility
const [showDevTools, setShowDevTools] = useState(() => {
  // Check if enabled in localStorage or dev environment
  return (
    process.env.NODE_ENV !== 'production' || 
    localStorage.getItem('agp-devtools-enabled') === 'true'
  );
});

// Keyboard shortcut: Ctrl+Shift+D
useEffect(() => {
  const handleKeyboard = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      setShowDevTools(prev => {
        const newValue = !prev;
        localStorage.setItem('agp-devtools-enabled', newValue.toString());
        console.log('[AGPGenerator] DevTools:', newValue ? 'enabled' : 'disabled');
        return newValue;
      });
    }
  };
  
  window.addEventListener('keydown', handleKeyboard);
  return () => window.removeEventListener('keydown', handleKeyboard);
}, []);
```

**Check-in**: Show code, test keyboard shortcut before proceeding.

---

#### Chunk B4: Render HeaderBar (10 min)
**Task**: Add HeaderBar to AGPGenerator render

**Location**: Top of AGPGenerator return statement

**Add**:
```jsx
return (
  <div className="app-container">
    <HeaderBar 
      activePanel={activePanel}
      onPanelChange={handlePanelChange}
    />
    
    {/* Existing content below */}
    <div className="main-content">
      {/* ... */}
    </div>
  </div>
);
```

**Check-in**: Show render structure, confirm before testing.

---

#### Chunk B5: Implement Panel Routing (30 min)
**Task**: Render active panel based on state

**Add to AGPGenerator render**:
```jsx
{/* Main Content - Panel Routing */}
<div className="main-content" style={{ padding: '2rem' }}>
  {activePanel === 'import' && <ImportPanel />}
  {activePanel === 'dagprofielen' && <DayProfilesPanel />}
  {activePanel === 'sensoren' && <SensorHistoryPanel />}
  {activePanel === 'export' && <ExportPanel />}
</div>

{/* DevTools Overlay (if enabled) */}
{showDevTools && (
  <div style={{
    position: 'fixed',
    top: 0,
    right: 0,
    width: '400px',
    height: '100vh',
    background: 'var(--bg-primary)',
    border: '3px solid var(--border-primary)',
    borderRight: 'none',
    zIndex: 99999,
    overflow: 'auto'
  }}>
    <DevToolsPanel onClose={() => setShowDevTools(false)} />
  </div>
)}
```

**Check-in**: Show routing logic, test panel switching works.

---

#### Chunk B6: Hide Old Navigation (15 min)
**Task**: Comment out or remove old navigation elements

**In AGPGenerator.jsx**, find and comment out:
- Old button bar at top
- Any duplicate navigation
- Old panel toggles

**Steps**:
1. Find old navigation JSX
2. Comment out (don't delete yet)
3. Test: New navigation works
4. After confirmation: delete commented code

**Check-in**: Show what will be removed, get approval before deletion.

---

#### Chunk B7: Test All Panels (20 min)
**Task**: Manual testing of navigation

**Test Checklist**:
1. Click "IMPORT" → ImportPanel stub appears
2. Click "DAGPROFIELEN" → DayProfilesPanel stub appears
3. Click "SENSOREN" → SensorHistoryPanel appears
4. Click "EXPORT" → ExportPanel appears
5. Press Ctrl+Shift+D → DevTools panel slides in from right
6. Press Ctrl+Shift+D again → DevTools closes
7. Active button has green background
8. Navigation persists across actions

**Check-in**: Report test results before proceeding.

---

#### Chunk B8: Add Footer Hint (10 min)
**Task**: Add DevTools discovery hint in footer

**Add at bottom of AGPGenerator**:
```jsx
<footer style={{
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '0.5rem 1rem',
  background: 'var(--bg-secondary)',
  borderTop: '2px solid var(--border-primary)',
  fontFamily: 'Courier New, monospace',
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  textAlign: 'center'
}}>
  {process.env.NODE_ENV !== 'production' && (
    <span>💡 Developer Tools: Press Ctrl+Shift+D</span>
  )}
</footer>
```

**Check-in**: Show footer, confirm placement looks good.

---

#### Chunk B9: Update PROGRESS.md (10 min)
**Task**: Document Phase B completion

**Add to PROGRESS.md**:
```markdown
### Phase B: Main Navigation ✅

**Components Created**:
- ✅ HeaderBar.jsx (4-button navigation)

**AGPGenerator.jsx Changes**:
- ✅ Added activePanel state
- ✅ Added showDevTools state
- ✅ Added Ctrl+Shift+D keyboard shortcut
- ✅ Added panel routing logic
- ✅ Removed old navigation elements
- ✅ Added DevTools hint in footer

**Testing**: 
- ✅ All 4 panels accessible
- ✅ Active state highlights correctly
- ✅ DevTools toggle works
- ✅ Keyboard shortcut functions
- ✅ No regressions in existing features

**Commits**: 
- `[feat] Phase B: Main navigation with 4 panels`

**Session 15 Complete**: File structure + navigation ready ✅
```

**Check-in**: Show PROGRESS.md update before committing.

---

#### Chunk B10: Git Commit Phase B (5 min)
**Task**: Commit completed Phase B

**Commands**:
```bash
git add src/components/HeaderBar.jsx
git add src/components/AGPGenerator.jsx
git add PROGRESS.md
git commit -m "[feat] Phase B: Main navigation system

- Created HeaderBar component with 4 buttons
- Added panel routing state to AGPGenerator
- Implemented DevTools toggle (Ctrl+Shift+D)
- Added active panel rendering logic
- Removed old navigation elements
- Added brutalist styling (3px borders, high contrast)
- Added accessibility (aria-pressed, aria-labels)

Features:
- Tab-based navigation (Import, Dagprofielen, Sensoren, Export)
- DevTools panel (hidden by default, Ctrl+Shift+D to toggle)
- Active state highlighting (green background)
- Keyboard accessible

Testing: All panels accessible, no regressions
"
```

**Check-in**: Show git status and commit message before executing.

---

## ✅ SESSION 15 ACCEPTANCE CRITERIA

### Phase A Must-Haves
- [ ] `panels/` directory created with 6 files
- [ ] `devtools/` directory created with 2 files
- [ ] All import paths updated (no broken imports)
- [ ] App compiles without errors
- [ ] All existing features still work
- [ ] Git committed

### Phase B Must-Haves
- [ ] HeaderBar component created
- [ ] 4 navigation buttons working
- [ ] Active panel state management
- [ ] DevTools toggle (Ctrl+Shift+D)
- [ ] Panel routing functional
- [ ] Old navigation removed
- [ ] Brutalist styling applied
- [ ] PROGRESS.md updated
- [ ] Git committed

### Overall
- [ ] No regressions in existing features
- [ ] App runs on port 3005
- [ ] Console has no errors
- [ ] User can navigate all 4 panels
- [ ] DevTools accessible via keyboard

---

## 🧪 TESTING PROTOCOL

After **each chunk**, test:
1. Run `npx vite --port 3005`
2. Check browser console for errors
3. Click around - does everything still work?
4. Report status to user

After **Phase A complete**:
1. Test: Import CSV still works
2. Test: Generate AGP report still works
3. Test: Export database still works
4. Commit if all tests pass

After **Phase B complete**:
1. Test: Click all 4 navigation buttons
2. Test: Ctrl+Shift+D toggles DevTools
3. Test: Active state highlights correctly
4. Test: All existing features still accessible
5. Commit if all tests pass

---

## 📊 TIME TRACKING

**Phase A** (expected 2h):
- [ ] Chunk A1: 5min
- [ ] Chunk A2: 15min
- [ ] Chunk A3: 10min
- [ ] Chunk A4: 10min
- [ ] Chunk A5: 10min
- [ ] Chunk A6: 10min
- [ ] Chunk A7: 15min
- [ ] Chunk A8: 20min
- [ ] Chunk A9: 30min
- [ ] Chunk A10: 5min
- [ ] Chunk A11: 10min
- [ ] Chunk A12: 5min

**Phase B** (expected 2h):
- [ ] Chunk B1: 30min
- [ ] Chunk B2: 20min
- [ ] Chunk B3: 15min
- [ ] Chunk B4: 10min
- [ ] Chunk B5: 30min
- [ ] Chunk B6: 15min
- [ ] Chunk B7: 20min
- [ ] Chunk B8: 10min
- [ ] Chunk B9: 10min
- [ ] Chunk B10: 5min

**Total**: ~4h

---

## 🚨 IF SOMETHING BREAKS

1. **STOP immediately**
2. **Don't try to fix** without user approval
3. **Report error** with console output
4. **Git status** to see what changed
5. **Rollback** if needed: `git checkout -- <file>`
6. **Ask user** for guidance

---

## 🎯 END OF SESSION 15

**Deliverables**:
- New file structure with panels/ and devtools/
- HeaderBar component with 4-button navigation
- Panel routing system
- DevTools toggle functionality
- Updated PROGRESS.md
- 2 git commits

**Next Session**: Session 16 - Phase C (Panel Components)

**Handoff to Session 16**: `HANDOFF_SESSION_16.md`