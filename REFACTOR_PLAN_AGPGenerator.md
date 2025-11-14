# AGPGenerator Refactoring Plan

**Datum**: 2025-11-14  
**Huidige staat**: 1999 regels, 32 state variables, 16 handlers  
**Doel**: Reduceer naar ~600 regels, verbeter maintainability  
**Status**: 📋 GEPARKEERD - Ready to execute

---

## 🎯 EXECUTIVE SUMMARY

**Probleem**: AGPGenerator.jsx is een "God Component" van bijna 2000 regels die alles doet.

**Oplossing**: Systematische refactor in 3 fases:
1. **Quick Wins** (1-2 sessies): Extract state naar hooks → -400 regels
2. **Medium Effort** (3-4 sessies): Context API + containers → -600 regels  
3. **Long Term** (5-8 sessies): Full composition pattern → -400 regels

**Eindresultaat**: Clean, maintainable, testable component architecture (~600 regels main component)

---

## 📊 CURRENT STATE ANALYSIS

### File Stats
```
Totaal:           1999 regels
State variables:  32 useState calls
Event handlers:   16 handle* functions
Hooks:            12 custom hooks
JSX return:       ~800 regels (geschat)
```

### Responsibilities (Te veel!)
- ✅ Data loading (CSV, master dataset)
- ✅ Period selection logic
- ✅ Metrics calculation orchestration
- ✅ Modal state management (6+ modals)
- ✅ Import/export logic
- ✅ Panel navigation
- ✅ Patient info management
- ✅ Sensor management coordination
- ✅ Stock management coordination
- ✅ ProTime workday parsing
- ✅ TDD calculations
- ✅ Comparison logic
- ✅ Day profiles generation
- ✅ Keyboard shortcuts
- ✅ DevTools toggle
- ✅ Toast notifications

**Diagnosis**: Classic "God Object" anti-pattern

---

## 🚀 PHASE 1: QUICK WINS (Priority: HIGH)

**Goal**: Extract state management to custom hooks  
**Time**: 1-2 sessies  
**Impact**: -400 regels  
**Risk**: LOW

### 1.1 Create `useModalState` Hook

**File**: `/src/hooks/useModalState.js`

```javascript
import { useState } from 'react';

/**
 * Centralized modal state management
 * Manages all modal open/close states in one place
 */
export function useModalState() {
  const [patientInfoOpen, setPatientInfoOpen] = useState(false);
  const [dayProfilesOpen, setDayProfilesOpen] = useState(false);
  const [sensorHistoryOpen, setSensorHistoryOpen] = useState(false);
  const [sensorRegistrationOpen, setSensorRegistrationOpen] = useState(false);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [dataImportModalOpen, setDataImportModalOpen] = useState(false);

  // Helper methods
  const openModal = (name) => {
    const setters = {
      patientInfo: setPatientInfoOpen,
      dayProfiles: setDayProfilesOpen,
      sensorHistory: setSensorHistoryOpen,
      sensorRegistration: setSensorRegistrationOpen,
      dataManagement: setDataManagementOpen,
      stock: setShowStockModal,
      dataImport: setDataImportModalOpen
    };
    setters[name]?.(true);
  };

  const closeModal = (name) => {
    const setters = {
      patientInfo: setPatientInfoOpen,
      dayProfiles: setDayProfilesOpen,
      sensorHistory: setSensorHistoryOpen,
      sensorRegistration: setSensorRegistrationOpen,
      dataManagement: setDataManagementOpen,
      stock: setShowStockModal,
      dataImport: setDataImportModalOpen
    };
    setters[name]?.(false);
  };

  const closeAll = () => {
    setPatientInfoOpen(false);
    setDayProfilesOpen(false);
    setSensorHistoryOpen(false);
    setSensorRegistrationOpen(false);
    setDataManagementOpen(false);
    setShowStockModal(false);
    setDataImportModalOpen(false);
  };

  return {
    // Individual states
    patientInfoOpen,
    dayProfilesOpen,
    sensorHistoryOpen,
    sensorRegistrationOpen,
    dataManagementOpen,
    showStockModal,
    dataImportModalOpen,
    
    // Individual setters
    setPatientInfoOpen,
    setDayProfilesOpen,
    setSensorHistoryOpen,
    setSensorRegistrationOpen,
    setDataManagementOpen,
    setShowStockModal,
    setDataImportModalOpen,
    
    // Helper methods
    openModal,
    closeModal,
    closeAll
  };
}
```

**Usage in AGPGenerator**:
```javascript
// Before:
const [patientInfoOpen, setPatientInfoOpen] = useState(false);
const [dayProfilesOpen, setDayProfilesOpen] = useState(false);
// ... 5 more modal states

// After:
const modals = useModalState();
// Access: modals.patientInfoOpen, modals.setPatientInfoOpen, etc.
```

**Impact**: -10 state declarations, -20 regels totaal

---

### 1.2 Create `usePanelNavigation` Hook

**File**: `/src/hooks/usePanelNavigation.js`

```javascript
import { useState, useEffect } from 'react';

/**
 * Panel navigation + keyboard shortcuts
 * Manages active panel and DevTools visibility
 */
export function usePanelNavigation() {
  const [activePanel, setActivePanel] = useState('import');
  const [showDevTools, setShowDevTools] = useState(() => {
    const saved = localStorage.getItem('agp-devtools-enabled');
    return saved === 'true';
  });
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Persist DevTools state
  useEffect(() => {
    localStorage.setItem('agp-devtools-enabled', String(showDevTools));
  }, [showDevTools]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+1/2/3/4: Switch panels
      if (e.ctrlKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const panels = ['import', 'dagprofielen', 'sensoren', 'export'];
        setActivePanel(panels[parseInt(e.key) - 1]);
      }
      
      // Ctrl+Shift+D: Toggle DevTools
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevTools(prev => !prev);
      }
      
      // Escape: Close DevTools
      if (e.key === 'Escape' && showDevTools) {
        setShowDevTools(false);
      }
      
      // Ctrl+K: Show shortcuts
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDevTools]);

  const toggleDevTools = () => setShowDevTools(prev => !prev);

  return {
    activePanel,
    setActivePanel,
    showDevTools,
    setShowDevTools,
    toggleDevTools,
    showShortcuts,
    setShowShortcuts
  };
}
```

**Impact**: -80 regels (state + keyboard logic)

---

### 1.3 Create `useImportExport` Hook

**File**: `/src/hooks/useImportExport.js`

```javascript
import { useState } from 'react';
import { validateImportFile, importMasterDataset } from '../storage/import';
import { exportAndDownload } from '../storage/export';

/**
 * Import/Export orchestration
 * Handles file validation, import progress, backup creation
 */
export function useImportExport(masterDataset) {
  const [importValidation, setImportValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState(null);
  const [importMergeStrategy, setImportMergeStrategy] = useState('append');
  const [lastImportInfo, setLastImportInfo] = useState(null);
  const [createBackupBeforeImport, setCreateBackupBeforeImport] = useState(true);
  const [lastBackupFile, setLastBackupFile] = useState(null);
  const [importProgress, setImportProgress] = useState({
    stage: '',
    current: 0,
    total: 7,
    percentage: 0
  });

  const validateFile = async (file) => {
    setIsValidating(true);
    try {
      const validation = await validateImportFile(file);
      setImportValidation(validation);
      setPendingImportFile(file);
      return validation;
    } catch (error) {
      console.error('Validation error:', error);
      return { valid: false, error: error.message };
    } finally {
      setIsValidating(false);
    }
  };

  const executeImport = async () => {
    if (!pendingImportFile) return;

    setIsImporting(true);
    try {
      // Create backup if requested
      if (createBackupBeforeImport && masterDataset.allReadings.length > 0) {
        const backupFile = await exportAndDownload({ 
          readings: masterDataset.allReadings,
          filename: `backup-${Date.now()}.json`
        });
        setLastBackupFile(backupFile);
      }

      // Import with progress tracking
      const result = await importMasterDataset(
        pendingImportFile,
        importMergeStrategy,
        (progress) => setImportProgress(progress)
      );

      setLastImportInfo(result);
      setPendingImportFile(null);
      setImportValidation(null);
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const cancelImport = () => {
    setPendingImportFile(null);
    setImportValidation(null);
    setImportProgress({ stage: '', current: 0, total: 7, percentage: 0 });
  };

  const handleExport = async () => {
    try {
      await exportAndDownload({
        readings: masterDataset.allReadings,
        filename: `agp-export-${Date.now()}.json`
      });
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  };

  return {
    // State
    importValidation,
    isValidating,
    isImporting,
    pendingImportFile,
    importMergeStrategy,
    lastImportInfo,
    createBackupBeforeImport,
    lastBackupFile,
    importProgress,
    
    // Setters
    setImportMergeStrategy,
    setCreateBackupBeforeImport,
    
    // Methods
    validateFile,
    executeImport,
    cancelImport,
    handleExport
  };
}
```

**Impact**: -200 regels (state + handlers)

---

### 1.4 Testing Strategy for Phase 1

**Pre-refactor checklist**:
- [ ] Take backup of AGPGenerator.jsx
- [ ] Create feature branch: `refactor/phase1-hooks`
- [ ] Document current behavior (manual test checklist)

**Post-refactor testing**:
```
✓ All modals open/close correctly
✓ Panel navigation works (buttons + keyboard)
✓ DevTools toggle works (Ctrl+Shift+D)
✓ Import validation works
✓ Import progress tracking works
✓ Export functionality works
✓ Keyboard shortcuts work (Ctrl+1/2/3/4, Esc, Ctrl+K)
✓ No console errors
```

**Rollback plan**: Git revert if any issues

---

## 🏗️ PHASE 2: CONTEXT API (Priority: MEDIUM)

**Goal**: Eliminate prop drilling with Context providers  
**Time**: 3-4 sessies  
**Impact**: -600 regels + cleaner component tree  
**Risk**: MEDIUM

### 2.1 Create `AGPContext`

**File**: `/src/contexts/AGPContext.jsx`

```javascript
import React, { createContext, useContext } from 'react';
import { useMasterDataset } from '../hooks/useMasterDataset';
import { useDataStatus } from '../hooks/useDataStatus';
import { useUploadStorage } from '../hooks/useUploadStorage';

const AGPContext = createContext();

export function AGPProvider({ children }) {
  // Core data hooks
  const masterDataset = useMasterDataset();
  const dataStatus = useDataStatus(masterDataset.allReadings);
  const uploadStorage = useUploadStorage();

  const value = {
    masterDataset,
    dataStatus,
    uploadStorage
  };

  return <AGPContext.Provider value={value}>{children}</AGPContext.Provider>;
}

export function useAGP() {
  const context = useContext(AGPContext);
  if (!context) {
    throw new Error('useAGP must be used within AGPProvider');
  }
  return context;
}
```

**Usage**:
```javascript
// In App.jsx or index.jsx
<AGPProvider>
  <AGPGenerator />
</AGPProvider>

// In any child component
function SensorHistoryPanel() {
  const { masterDataset, uploadStorage } = useAGP();
  // Direct access, no prop drilling!
}
```

---

### 2.2 Create Feature-Specific Contexts

**Analysis Context** (metrics, comparison, day profiles):

```javascript
// src/contexts/AnalysisContext.jsx
export function AnalysisProvider({ readings, dateRange, children }) {
  const metrics = useMetrics(readings, dateRange.start, dateRange.end);
  const comparison = useComparison(readings, dateRange);
  const dayProfiles = useDayProfiles(readings, dateRange);
  
  return (
    <AnalysisContext.Provider value={{ metrics, comparison, dayProfiles }}>
      {children}
    </AnalysisContext.Provider>
  );
}
```

**Navigation Context** (panels, modals, DevTools):

```javascript
// src/contexts/NavigationContext.jsx
export function NavigationProvider({ children }) {
  const panels = usePanelNavigation();
  const modals = useModalState();
  
  return (
    <NavigationContext.Provider value={{ panels, modals }}>
      {children}
    </NavigationContext.Provider>
  );
}
```

**Impact**: -100 regels (no more prop drilling), cleaner deps

---

### 2.3 Container Components

**Data Management Container**:

```javascript
// src/components/containers/DataManagementContainer.jsx
export function DataManagementContainer({ children }) {
  const { masterDataset } = useAGP();
  const importExport = useImportExport(masterDataset);
  
  return (
    <DataManagementContext.Provider value={{ importExport }}>
      {children}
    </DataManagementContext.Provider>
  );
}
```

**Visualization Container**:

```javascript
// src/components/containers/VisualizationContainer.jsx
export function VisualizationContainer({ children }) {
  const { masterDataset } = useAGP();
  const { metrics, comparison, dayProfiles } = useAnalysis();
  
  // All visualization logic here
  
  return (
    <VisualizationContext.Provider value={{ /* ... */ }}>
      {children}
    </VisualizationContext.Provider>
  );
}
```

**Impact**: -300 regels (logic moved to containers)

---

## 🎨 PHASE 3: COMPOSITION PATTERN (Priority: LOW)

**Goal**: Break monolithic JSX into composable components  
**Time**: 5-8 sessies  
**Impact**: -400 regels  
**Risk**: LOW (mostly JSX restructure)

### 3.1 Component Hierarchy

**Current** (all in AGPGenerator):
```
AGPGenerator (1999 regels)
└─ Massive JSX return (~800 regels)
```

**Target**:
```
AGPGenerator (600 regels)
├─ AGPLayout
│  ├─ AGPHeader (100 regels)
│  │  ├─ Logo
│  │  ├─ NavigationTabs
│  │  └─ UserMenu
│  ├─ AGPSidebar (150 regels)
│  │  ├─ DataStatusIndicator
│  │  ├─ PeriodSelector
│  │  └─ QuickActions
│  ├─ AGPMainContent (300 regels)
│  │  ├─ ActivePanel (dynamic)
│  │  └─ EmptyStates
│  └─ AGPFooter (50 regels)
└─ AGPModals (150 regels)
   ├─ PatientInfoModal
   ├─ DayProfilesModal
   ├─ SensorHistoryModal
   ├─ StockModal
   └─ DataImportModal
```

---

### 3.2 Layout Components

**AGPLayout**:

```javascript
// src/components/layout/AGPLayout.jsx
export function AGPLayout({ children }) {
  return (
    <div className="agp-layout">
      {children}
    </div>
  );
}
```

**AGPHeader**:

```javascript
// src/components/layout/AGPHeader.jsx
export function AGPHeader() {
  const { panels } = useNavigation();
  const { dataStatus } = useAGP();
  
  return (
    <header className="agp-header">
      <Logo />
      <NavigationTabs 
        activePanel={panels.activePanel}
        onPanelChange={panels.setActivePanel}
      />
      <DataStatusLight status={dataStatus.light} />
      <UserMenu />
    </header>
  );
}
```

**AGPSidebar**:

```javascript
// src/components/layout/AGPSidebar.jsx
export function AGPSidebar() {
  const { masterDataset } = useAGP();
  
  return (
    <aside className="agp-sidebar">
      <DataStatusIndicator />
      <PeriodSelector dateRange={masterDataset.stats?.dateRange} />
      <QuickActions />
    </aside>
  );
}
```

---

### 3.3 Modal Aggregator

**AGPModals** (central modal management):

```javascript
// src/components/AGPModals.jsx
export function AGPModals() {
  const { modals } = useNavigation();
  
  return (
    <>
      <PatientInfoModal 
        open={modals.patientInfoOpen}
        onClose={() => modals.closeModal('patientInfo')}
      />
      <DayProfilesModal 
        open={modals.dayProfilesOpen}
        onClose={() => modals.closeModal('dayProfiles')}
      />
      <SensorHistoryModal 
        open={modals.sensorHistoryOpen}
        onClose={() => modals.closeModal('sensorHistory')}
      />
      <StockModal 
        open={modals.showStockModal}
        onClose={() => modals.closeModal('stock')}
      />
      <DataImportModal 
        open={modals.dataImportModalOpen}
        onClose={() => modals.closeModal('dataImport')}
      />
    </>
  );
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Quick Wins
- [ ] Create `/src/hooks/useModalState.js`
- [ ] Create `/src/hooks/usePanelNavigation.js`
- [ ] Create `/src/hooks/useImportExport.js`
- [ ] Update AGPGenerator to use new hooks
- [ ] Test all functionality
- [ ] Commit: "refactor: extract state to custom hooks"

### Phase 2: Context API
- [ ] Create `/src/contexts/AGPContext.jsx`
- [ ] Create `/src/contexts/AnalysisContext.jsx`
- [ ] Create `/src/contexts/NavigationContext.jsx`
- [ ] Create `/src/contexts/DataManagementContext.jsx`
- [ ] Wrap App in providers
- [ ] Update components to use contexts
- [ ] Remove prop drilling
- [ ] Test all functionality
- [ ] Commit: "refactor: add context providers"

### Phase 3: Composition
- [ ] Create `/src/components/layout/AGPLayout.jsx`
- [ ] Create `/src/components/layout/AGPHeader.jsx`
- [ ] Create `/src/components/layout/AGPSidebar.jsx`
- [ ] Create `/src/components/layout/AGPFooter.jsx`
- [ ] Create `/src/components/AGPModals.jsx`
- [ ] Refactor AGPGenerator JSX to use layout components
- [ ] Test all functionality
- [ ] Commit: "refactor: composition pattern"

---

## 🧪 TESTING STRATEGY

### Automated Tests (TODO: Add later)
```javascript
// Example unit test for useModalState
describe('useModalState', () => {
  it('should open and close modals', () => {
    const { result } = renderHook(() => useModalState());
    
    act(() => result.current.openModal('patientInfo'));
    expect(result.current.patientInfoOpen).toBe(true);
    
    act(() => result.current.closeModal('patientInfo'));
    expect(result.current.patientInfoOpen).toBe(false);
  });
});
```

### Manual Testing Checklist

**Before each phase**:
- [ ] Take full app screenshot/recording
- [ ] Document expected behavior
- [ ] Create test branch

**After each phase**:
- [ ] All panels load correctly
- [ ] All modals work
- [ ] Keyboard shortcuts work
- [ ] Import/Export work
- [ ] No console errors
- [ ] Performance is same/better

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Breaking Changes
**Probability**: Medium  
**Impact**: High  
**Mitigation**: 
- Small incremental changes
- Test after each step
- Git commits at each milestone
- Easy rollback if needed

### Risk 2: Performance Regression
**Probability**: Low  
**Impact**: Medium  
**Mitigation**:
- Profile before/after with React DevTools
- Monitor re-render counts
- Memoize contexts if needed

### Risk 3: Time Overrun
**Probability**: Medium  
**Impact**: Low  
**Mitigation**:
- Work in phases
- Each phase is independently valuable
- Can stop after any phase

---

## 📊 PROGRESS TRACKING

### Phase 1: Quick Wins
- [ ] useModalState extracted
- [ ] usePanelNavigation extracted
- [ ] useImportExport extracted
- [ ] AGPGenerator updated
- [ ] Tests passed
- **Status**: NOT STARTED
- **Est. completion**: TBD

### Phase 2: Context API
- [ ] AGPContext created
- [ ] Feature contexts created
- [ ] Providers added
- [ ] Prop drilling removed
- [ ] Tests passed
- **Status**: NOT STARTED
- **Est. completion**: TBD

### Phase 3: Composition
- [ ] Layout components created
- [ ] Modal aggregator created
- [ ] AGPGenerator refactored
- [ ] Tests passed
- **Status**: NOT STARTED
- **Est. completion**: TBD

---

## 📈 SUCCESS METRICS

### Quantitative
- ✅ AGPGenerator: 1999 → ~600 regels (-70%)
- ✅ State variables: 32 → ~8 (-75%)
- ✅ Component files: 1 → 10+ (better organization)
- ✅ Average file size: <200 regels

### Qualitative
- ✅ Easier to understand component responsibilities
- ✅ No more prop drilling
- ✅ Easier to test individual pieces
- ✅ Faster onboarding for new features
- ✅ Better IDE performance (smaller files)

---

## 🎯 DECISION LOG

### 2025-11-14: Plan Created
**Decision**: Refactor AGPGenerator in 3 phases  
**Rationale**: Too large (1999 regels), hard to maintain  
**Status**: Approved, parkeren voor later

### TBD: Phase 1 Start
**Decision**: TBD  
**Rationale**: TBD  
**Status**: Pending

---

## 📚 REFERENCES

### Similar Refactorings
- React docs: Extracting State Logic into a Reducer
- Kent C. Dodds: Application State Management with React
- Dan Abramov: Presentational and Container Components (legacy but principles apply)

### Tools
- React DevTools Profiler
- ESLint react-hooks rules
- VS Code Refactoring tools

---

## 💡 FUTURE CONSIDERATIONS

### After Refactoring
1. Consider TypeScript migration (better type safety)
2. Add Storybook (component documentation)
3. Add unit tests with Vitest
4. Consider React Query for server state (if API added)
5. Add E2E tests with Playwright

### Performance Optimizations
- React.memo for expensive components
- useMemo for heavy calculations
- useCallback for event handlers passed to children
- Code splitting with React.lazy

---

**Plan Status**: 📋 READY TO EXECUTE  
**Next Action**: Review plan → Approve → Start Phase 1  
**Estimated Total Time**: 8-14 sessies  
**Priority**: MEDIUM (Nice to have, not urgent)

**End of Refactoring Plan**
