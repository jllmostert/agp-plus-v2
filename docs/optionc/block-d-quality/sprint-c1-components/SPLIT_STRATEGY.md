# AGP GENERATOR SPLIT STRATEGY

**Date**: 2025-11-02  
**Current**: AGPGenerator.jsx (1962 lines)  
**Target**: <300 lines (orchestrator only)

---

## 📊 CURRENT STRUCTURE ANALYSIS

### State Management (Lines ~55-230)
- **Data hooks**: useCSVData, useMasterDataset, useSensorDatabase, useMetrics, useComparison, useDayProfiles
- **Storage**: useUploadStorage, patient info, TDD data
- **Period selection**: startDate, endDate, selectedDateRange
- **Feature toggles**: dayNightEnabled, workdays, various "Expanded" states
- **Modal states**: 7 modals (patientInfo, dayProfiles, sensorHistory, sensorRegistration, dataManagement, stockManagement, batchAssignment)

### Main Sections
1. **Data Import** (~lines 1500-1600): FileUpload, SensorImport, SavedUploadsList
2. **Period Selection** (~lines 1600-1650): PeriodSelector, DateRangeFilter  
3. **Main Content** (~lines 1700-1800): AGPChart, MetricsDisplay, HypoglycemiaEvents, splits, comparison
4. **Data Export** (~lines 1650-1700): Export buttons
5. **Modals** (~lines 1800-1900): 7 portal-rendered modals

---

## 🎯 PROPOSED COMPONENT HIERARCHY

```
AGPGenerator.jsx (~200 lines) - Orchestrator only
├── state: activeUploadId, startDate, endDate
├── hooks: useMasterDataset, useMetrics
└── renders 3 containers:

    ├── DataLoadingContainer.jsx (~250 lines)
    │   ├── Props: { onDataLoad, savedUploads, activeUploadId }
    │   ├── State: expanded states, upload errors
    │   └── Renders:
    │       ├── FileUpload
    │       ├── SensorImport  
    │       ├── SavedUploadsList
    │       └── MigrationBanner
    │
    ├── VisualizationContainer.jsx (~300 lines)
    │   ├── Props: { metrics, startDate, endDate, workdays, dayNightEnabled }
    │   ├── State: feature toggles (day/night, workday split)
    │   └── Renders:
    │       ├── PeriodSelector
    │       ├── DateRangeFilter
    │       ├── AGPChart
    │       ├── MetricsDisplay
    │       ├── HypoglycemiaEvents
    │       ├── DayNightSplit
    │       ├── WorkdaySplit
    │       └── ComparisonView
    │
    └── ModalManager.jsx (~250 lines)
        ├── Props: { sensors, patientInfo, dayProfiles }
        ├── State: 7 modal open/close states
        └── Renders: 7 modals via ReactDOM.createPortal
            ├── PatientInfo
            ├── DayProfilesModal
            ├── SensorHistoryModal
            ├── SensorRegistration
            ├── DataManagementModal
            ├── StockManagementModal
            └── BatchAssignmentDialog
```

---

## 📋 DETAILED BREAKDOWN

### AGPGenerator.jsx (Orchestrator) - Target: ~200 lines

**Responsibilities**:
- Global state: activeUploadId, startDate, endDate
- Data hooks: useMasterDataset, useMetrics, useComparison
- Auto-select logic (14 days on startup)
- Pass props to 3 containers

**What it renders**:
```jsx
<div className="container">
  <DataLoadingContainer 
    onDataLoad={handleDataLoad}
    savedUploads={savedUploads}
    activeUploadId={activeUploadId}
  />
  
  {metricsResult && (
    <VisualizationContainer 
      metrics={metricsResult}
      startDate={startDate}
      endDate={endDate}
      onPeriodChange={handlePeriodChange}
    />
  )}
  
  <ModalManager 
    sensors={sensors}
    patientInfo={patientInfo}
    dayProfiles={dayProfiles}
  />
</div>
```

---

### DataLoadingContainer.jsx - Target: ~250 lines

**Props**:
```typescript
{
  onDataLoad: (data) => void,
  savedUploads: Upload[],
  activeUploadId: string | null,
  onUploadSelect: (id: string) => void
}
```

**State**:
- dataImportExpanded
- dataExportExpanded
- v3UploadError
- pendingUpload

**Renders**:
- MigrationBanner (if needed)
- Collapsible data import section
  - FileUpload
  - SensorImport
  - SavedUploadsList
- Collapsible data export section
  - Export buttons

**React.memo**: ✅ Yes (only re-renders when savedUploads change)

---

### VisualizationContainer.jsx - Target: ~300 lines

**Props**:
```typescript
{
  metrics: MetricsResult,
  startDate: Date,
  endDate: Date,
  workdays: Set<string> | null,
  dayNightEnabled: boolean,
  onPeriodChange: (start: Date, end: Date) => void,
  onDayNightToggle: (enabled: boolean) => void
}
```

**State**:
- dayNightEnabled (local toggle)
- None (mostly presentational)

**Renders**:
- PeriodSelector
- DateRangeFilter
- AGPChart
- MetricsDisplay
- HypoglycemiaEvents
- DayNightSplit
- WorkdaySplit (conditional)
- ComparisonView (conditional)

**React.memo**: ✅ Yes (expensive charts, memo prevents re-render)

---

### ModalManager.jsx - Target: ~250 lines

**Props**:
```typescript
{
  sensors: Sensor[],
  patientInfo: PatientInfo | null,
  dayProfiles: DayProfile[],
  onSensorDelete: (id: string) => void,
  onDataManagementDelete: () => void
}
```

**State**:
- patientInfoOpen
- dayProfilesOpen
- sensorHistoryOpen
- sensorRegistrationOpen
- dataManagementOpen
- showStockModal
- batchAssignmentDialog

**Renders**:
All 7 modals via ReactDOM.createPortal (only when open)

**React.memo**: ❌ No (frequent state changes, memo not helpful)

---

## 🔧 EXTRACTION ORDER

### Phase 1: ModalManager (Easiest) - 2h
**Why first**: Isolated, clear boundary, no complex data flow

1. Create `/src/components/containers/ModalManager.jsx`
2. Move all modal state (7 states)
3. Move all modal render logic (ReactDOM.createPortal blocks)
4. Export ModalManager component
5. Import in AGPGenerator, pass props
6. Test: All modals open/close correctly

---

### Phase 2: DataLoadingContainer - 2h
**Why second**: Clear boundary, manages own state

1. Create `/src/components/containers/DataLoadingContainer.jsx`
2. Move data import section
3. Move upload storage hooks
4. Move collapse states
5. Export component
6. Test: File upload, saved uploads work

---

### Phase 3: VisualizationContainer - 2h
**Why last**: Most complex, many props

1. Create `/src/components/containers/VisualizationContainer.jsx`
2. Move main content section
3. Move period selection
4. Move all chart components
5. Export component with React.memo
6. Test: Charts render, period selection works

---

## ✅ SUCCESS CRITERIA

After split:
- [ ] AGPGenerator.jsx: <300 lines
- [ ] 3 new container components created
- [ ] All components use React.memo (except ModalManager)
- [ ] No duplicate state
- [ ] All features work (manual test)
- [ ] No console errors
- [ ] Performance improved (measured)

---

## 🎯 EXPECTED OUTCOME

**Before**:
- AGPGenerator: 1962 lines
- Every state change re-renders entire component

**After**:
- AGPGenerator: ~200 lines (orchestrator)
- DataLoadingContainer: ~250 lines (data section)
- VisualizationContainer: ~300 lines (charts, memoized)
- ModalManager: ~250 lines (modals)
- **Total**: 1000 lines (saved 962 lines through elimination of duplication and better organization)
- **Performance**: 50% fewer re-renders (React.memo on containers)

---

**Version**: 1.0  
**Created**: 2025-11-02  
**Status**: READY FOR IMPLEMENTATION
