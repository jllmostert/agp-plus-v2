import React, { useEffect, useMemo, useRef } from 'react';
import { Activity, Download, ChevronDown, Save } from 'lucide-react';
import { debug } from '../utils/debug.js';

// Custom hooks
import { useModalState } from '../hooks/useModalState';
import { usePanelNavigation } from '../hooks/usePanelNavigation';
import { useImportExport } from '../hooks/useImportExport';
import { useData } from '../hooks/useData';
import { useDataManagement } from '../hooks/useDataManagement';
import { PeriodProvider, usePeriod } from '../contexts/PeriodContext.jsx';
import { MetricsProvider, useMetricsContext } from '../contexts/MetricsContext.jsx';
import useUI from '../hooks/useUI';

// Note: Core utilities (parsers, exporters, pump settings) moved to useDataManagement hook

// UI Components
import { MigrationBanner } from './MigrationBanner';
import DataImportModal from './DataImportModal';
import HeaderBar from './HeaderBar';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import KeyboardHelp from './KeyboardHelp';

// Container Components
import ModalManager from './containers/ModalManager';
import VisualizationContainer from './containers/VisualizationContainer';
import { DateRangeFilter } from './DateRangeFilter';

// Panel Router (handles panel switching)
import PanelRouter from './PanelRouter';

/**
 * AGPGenerator - Main application container
 * 
 * Orchestrates the entire AGP+ application:
 * - CSV data loading and parsing
 * - ProTime workday data import
 * - Period selection and date management
 * - Metrics calculation coordination
 * - Component composition and data flow
 */
function AGPGeneratorContent() {
  // ============================================
  // CONTEXT: UI State Management (from UIContext)
  // ============================================
  
  const ui = useUI();
  
  // Destructure UI state and methods for convenience
  const {
    dayNightEnabled,
    setDayNightEnabled,
    patientInfo,
    setPatientInfo,
    clearPatientInfo,
    loadToast,
    setLoadToast,
    showToast,
    batchAssignmentDialog,
    setBatchAssignmentDialog,
    openBatchDialog,
    closeBatchDialog,
    pendingUpload,
    setPendingUpload,
    clearPending,
    workdays,
    loadWorkdays,
    clearWorkdays,
    numDaysProfile,
    setNumDaysProfile
  } = ui;
  
  // ============================================
  // CONTEXT: Data Management (from DataContext)
  // ============================================
  
  const data = useData();
  // Destructure commonly used values for convenience
  const {
    masterDataset,
    dataStatus,
    csvData,
    dateRange,
    activeReadings,
    activeDateRange,
    comparisonReadings,
    fullDatasetRange,
    uploadStorage,
    tddByDay,
    csvError,
    v3UploadError,
    setV3UploadError,
    isFilteringData,
    useV3Mode,
    loadCSV,
    loadParsedData,
    clearError,
    refreshData
  } = data;
  
  // Note: Sensors are managed by SensorHistoryPanel directly via useSensors hook
  
  // Destructure uploadStorage for direct access (backward compat)
  const {
    savedUploads,
    activeUploadId,
    storageInfo,
    isLoading: storageLoading,
    migrationStatus,
    saveUpload,
    loadUpload,
    toggleLock,
    deleteUpload,
    renameUpload,
    updateProTimeData
  } = uploadStorage;

  // ============================================
  // STATE: Period Selection (from PeriodContext)
  // ============================================
  
  const { startDate, endDate, safeDateRange: periodSafeDateRange, setStartDate, setEndDate } = usePeriod();
  
  // V3: Date range now managed by PeriodContext (startDate/endDate)
  // Removed: selectedDateRange useState - was duplicate of PeriodContext state

  // ============================================
  // STATE: Optional Features
  // Note: workdays and numDaysProfile are now managed by UIContext
  // ============================================
  
  // Legacy collapsible sections removed - now using panel architecture
  
  // Modal state management (extracted to custom hook)
  const modals = useModalState();
  
  // Panel navigation + keyboard shortcuts (extracted to custom hook)
  const navigation = usePanelNavigation();
  
  // Import/Export orchestration (extracted to custom hook)
  const importExport = useImportExport();
  
  // Get metrics from context (for data management handlers)
  const { metricsResult, comparisonData, dayProfiles, tddData } = useMetricsContext();
  
  // Data Management handlers (extracted to custom hook)
  const dataManagement = useDataManagement({
    // From DataContext
    masterDataset,
    useV3Mode,
    loadCSV,
    setV3UploadError,
    csvData,
    dateRange,
    // From UIContext
    showToast,
    setPendingUpload,
    pendingUpload,
    setBatchAssignmentDialog,
    loadWorkdays,
    clearWorkdays,
    workdays,
    setPatientInfo,
    patientInfo,
    // From PeriodContext
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    // From uploadStorage
    activeUploadId,
    updateProTimeData,
    saveUpload,
    // From other hooks
    modals,
    importExport,
    // From MetricsContext
    metricsResult,
    comparisonData,
    tddData,
    dayProfiles,
  });
  
  // Note: All UI state (dayNightEnabled, patientInfo, loadToast, dialogs, etc.) now comes from UIContext
  // Note: tddByDay now comes from DataContext

  // Note: TDD loading moved to DataContext
  // Note: Import history loading moved to useImportExport hook
  
  /**
   * Auto-select last 14 days when data becomes ready (green light)
   * This provides instant visualization on app startup
   */
  useEffect(() => {
    // Only auto-select if:
    // 1. Status is green (data ready)
    // 2. No period currently selected (user hasn't chosen yet)
    // 3. We have a valid date range
    if (
      dataStatus.lightColor === 'green' && 
      !startDate && 
      !endDate && 
      dataStatus.dateRange
    ) {
      const latest = dataStatus.dateRange.latest;
      
      // CRITICAL: Set to EXACTLY 14 days to trigger comparison
      // Use midnight timestamps to ensure clean day boundaries
      const end = new Date(latest);
      end.setHours(23, 59, 59, 999); // End of day
      
      const start = new Date(end);
      start.setDate(start.getDate() - 13); // 14 days total (today + 13 previous)
      start.setHours(0, 0, 0, 0); // Start of day
      
      
      setStartDate(start);
      setEndDate(end);
    }
  }, [dataStatus.lightColor, dataStatus.dateRange, startDate, endDate]);

  // Load ProTime workdays from master dataset on init
  useEffect(() => {
    if (useV3Mode && masterDataset.stats?.workdays) {
      loadWorkdays(masterDataset.stats.workdays);
    }
  }, [useV3Mode, masterDataset.stats?.workdays, loadWorkdays]);

  // ============================================
  // CALCULATED DATA: Metrics & Comparison
  // Note: metricsResult, comparisonData, dayProfiles, tddData 
  //       now destructured above for useDataManagement hook
  // ============================================
  
  // V3: Convert active filtered range for day profiles
  // This is the FILTERED range (e.g., "last 14 days"), not full dataset
  const safeDateRange = useMemo(() => {
    if (useV3Mode && activeDateRange) {
      // V3: activeDateRange has { start, end } or { min, max } which are Unix timestamps (numbers)
      const startValue = activeDateRange.start || activeDateRange.min;
      const endValue = activeDateRange.end || activeDateRange.max;
      
      if (!startValue || !endValue) {
        return fullDatasetRange;
      }
      
      const startDate = new Date(startValue);
      const endDate = new Date(endValue);
      
      // Validate dates
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        return {
          min: startDate,
          max: endDate
        };
      }
      
      return fullDatasetRange;
    }
    return fullDatasetRange; // Fallback to full range
  }, [useV3Mode, activeDateRange, fullDatasetRange]);

  // ============================================
  // EVENT HANDLERS: Date Range Filter (V3)
  // Note: handleDateRangeChange moved to useDataManagement hook
  // Note: handlePanelChange defined below with other local handlers
  // ============================================

  // ============================================
  // EVENT HANDLERS: File Upload
  // ============================================

  /**
   * Auto-select last 14 days (or full range) when CSV is loaded
   * Keep import section OPEN so user can add ProTime
   */
  useEffect(() => {
    if (csvData && dateRange && !startDate && !endDate) {
      const end = new Date(dateRange.max);
      const start = new Date(end);
      start.setDate(start.getDate() - 13); // 14 days = today - 13 days
      
      // If data range is shorter than 14 days, use full range
      const actualStart = start < dateRange.min ? dateRange.min : start;
      
      setStartDate(actualStart);
      setEndDate(end);
      // NOTE: Import stays OPEN - no auto-collapse here
    }
  }, [csvData, dateRange, startDate, endDate]);

  /**
   * V3: Auto-select last 14 days when master dataset loads
   */
  useEffect(() => {
    if (useV3Mode && masterDataset.stats && !startDate && !endDate) {
      const stats = masterDataset.stats;
      if (stats.dateRange?.end) {
        const end = new Date(stats.dateRange.end);
        const start = new Date(end);
        start.setDate(start.getDate() - 13); // 14 days = today - 13 days
        
        // If data range is shorter than 14 days, use full range
        const actualStart = stats.dateRange.start && start < new Date(stats.dateRange.start) 
          ? new Date(stats.dateRange.start) 
          : start;
        
        handleDateRangeChange(actualStart, end);
      }
    }
  }, [useV3Mode, masterDataset.stats]);

  /**
   * V3: Load ProTime workdays from storage on mount
   */
  useEffect(() => {
    if (useV3Mode && !workdays) {
      const loadWorkdaysFromStorage = async () => {
        try {
          const { loadProTimeData } = await import('../storage/masterDatasetStorage');
          const savedWorkdays = await loadProTimeData();
          
          if (savedWorkdays && savedWorkdays.size > 0) {
            loadWorkdays(savedWorkdays);
          }
        } catch (err) {
          console.error('[ProTime] Failed to load from V3:', err);
        }
      };
      
      loadWorkdaysFromStorage();
    }
  }, [useV3Mode, workdays]);

  // ============================================
  // EVENT HANDLERS: From useDataManagement hook
  // ============================================
  
  const {
    handleCSVLoad,
    handleProTimeLoad,
    handleProTimeDelete,
    handleBatchAssignmentConfirm,
    handleBatchAssignmentCancel,
    handleDataManagementDelete,
    handleExportHTML,
    handleExportDayProfiles,
    handleExportDatabase,
    handleDatabaseImport,
    handleImportConfirm,
    handleSaveUpload,
    handleDateRangeChange,
  } = dataManagement;

  // ============================================
  // EVENT HANDLERS: Local utilities (not in hook)
  // ============================================

  /**
   * Handle panel navigation changes
   */
  const handlePanelChange = (panelId) => {
    navigation.setActivePanel(panelId);
  };

  /**
   * Handle day/night toggle
   */
  const handleDayNightToggle = () => {
    setDayNightEnabled(!dayNightEnabled);
  };


  // ============================================
  // RENDER: Main UI
  // Note: MetricsProvider is now in AGPGenerator wrapper
  // ============================================

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      <div className="app-container">
        
        {/* App Header - Extracted component */}
        <AppHeader
          migrationStatus={migrationStatus}
          loadToast={loadToast}
          patientInfo={patientInfo}
          onPatientInfoOpen={() => modals.setPatientInfoOpen(true)}
          onDataManagementOpen={() => modals.setDataManagementOpen(true)}
          dataStatus={dataStatus}
          startDate={startDate}
          endDate={endDate}
          activeReadings={activeReadings}
          workdays={workdays}
        />
        
        {/* Phase B: Main Navigation - After old header */}
        <HeaderBar 
          activePanel={navigation.activePanel}
          onPanelChange={handlePanelChange}
        />
        
        {/* Phase B: Panel Routing - Extracted to PanelRouter component */}
        <PanelRouter
          activePanel={navigation.activePanel}
          onNavigateToImport={() => navigation.setActivePanel('import')}
          onOpenStockModal={() => modals.setShowStockModal(true)}
          onOpenSensorRegistration={() => modals.setSensorRegistrationOpen(true)}
          // Import Panel
          onCSVLoad={handleCSVLoad}
          onProTimeLoad={handleProTimeLoad}
          onProTimeDelete={handleProTimeDelete}
          onImportDatabase={handleDatabaseImport}
          // Day Profiles Panel
          dayProfiles={dayProfiles}
          patientInfo={patientInfo}
          numDays={numDaysProfile}
          onNumDaysChange={setNumDaysProfile}
          // Export Panel
          onExportHTML={handleExportHTML}
          onExportDayProfiles={handleExportDayProfiles}
          onExportDatabase={handleExportDatabase}
        />
        
        {/* V3 Migration Banner - Auto-detects and triggers migration */}
        <MigrationBanner />

        {/* V3 Date Range Filter - Show on import panel */}
        {navigation.activePanel === 'import' && useV3Mode && masterDataset.stats && (
          <section className="section">
            <DateRangeFilter
              datasetRange={masterDataset.stats.dateRange}
              selectedRange={{ start: startDate, end: endDate }}
              onRangeChange={handleDateRangeChange}
            />
          </section>
        )}

        {/* Main Content - Show when on import panel */}
        {navigation.activePanel === 'import' && ((csvData && dateRange) || useV3Mode) && startDate && endDate && metricsResult && (
          <VisualizationContainer
            metricsResult={metricsResult}
            comparisonData={comparisonData}
            tddData={tddData}
            dayNightEnabled={dayNightEnabled}
            onDayNightToggle={handleDayNightToggle}
          />
        )}


        {/* Modal Manager - All modals rendered via portals */}
        <ModalManager
          // Data props
          patientInfo={patientInfo}
          dayProfiles={dayProfiles}
          dataStatus={dataStatus}
          
          // Patient Info Modal
          patientInfoOpen={modals.patientInfoOpen}
          onClosePatientInfo={() => modals.setPatientInfoOpen(false)}
          
          // Sensor History Modal
          sensorHistoryOpen={modals.sensorHistoryOpen}
          onCloseSensorHistory={() => modals.setSensorHistoryOpen(false)}
          onOpenStockFromHistory={() => {
            modals.setSensorHistoryOpen(false);
            modals.setShowStockModal(true);
          }}
          
          // Sensor Registration Modal
          sensorRegistrationOpen={modals.sensorRegistrationOpen}
          onCloseSensorRegistration={() => modals.setSensorRegistrationOpen(false)}
          
          // Data Management Modal
          dataManagementOpen={modals.dataManagementOpen}
          onCloseDataManagement={() => modals.setDataManagementOpen(false)}
          onDataManagementDelete={handleDataManagementDelete}
          
          // Stock Management Modal
          showStockModal={modals.showStockModal}
          onCloseStockModal={() => modals.setShowStockModal(false)}
          
          // Batch Assignment Dialog
          batchAssignmentDialog={batchAssignmentDialog}
          onBatchAssignmentConfirm={handleBatchAssignmentConfirm}
          onBatchAssignmentCancel={handleBatchAssignmentCancel}
        />

        {/* Data Import Modal */}
        <DataImportModal
          isOpen={modals.dataImportModalOpen}
          onClose={() => {
            modals.setDataImportModalOpen(false);
            importExport.resetState(); // Reset import state using hook
          }}
          onConfirm={handleImportConfirm}
          validationResult={importExport.importValidation}
          isValidating={importExport.isValidating}
          mergeStrategy={importExport.importMergeStrategy}
          onMergeStrategyChange={importExport.setImportMergeStrategy}
          lastImport={importExport.lastImportInfo}
          createBackup={importExport.createBackupBeforeImport}
          onCreateBackupChange={importExport.setCreateBackupBeforeImport}
          lastBackupFile={importExport.lastBackupFile}
        />

        {/* Import Progress Overlay */}
        {importExport.isImporting && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              border: '3px solid var(--border-primary)',
              padding: '3rem',
              textAlign: 'center',
              maxWidth: '500px',
              width: '90%'
            }}>
              <div style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '2rem'
              }}>
                📥 Importing Database
              </div>
              
              {/* Progress Percentage */}
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                fontFamily: 'Courier New, monospace',
                color: 'var(--color-green)',
                marginBottom: '1.5rem'
              }}>
                {importExport.importProgress.percentage}%
              </div>
              
              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '24px',
                background: 'var(--bg-secondary)',
                border: '3px solid var(--border-primary)',
                overflow: 'hidden',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  height: '100%',
                  background: 'var(--color-green)',
                  width: `${importExport.importProgress.percentage}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              {/* Current Stage */}
              <div style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                {importExport.importProgress.stage ? (
                  <>
                    Importing {importExport.importProgress.stage}...
                    <br />
                    ({importExport.importProgress.current} of {importExport.importProgress.total})
                  </>
                ) : (
                  'Preparing import...'
                )}
              </div>
            </div>
          </div>
        )}


        {/* Footer */}
        <AppFooter />
        
        {/* Keyboard Shortcuts Legend (Phase F1.2) */}
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '1rem',
          zIndex: 1000
        }}>
          <button
            onClick={() => navigation.setShowShortcuts(!navigation.showShortcuts)}
            style={{
              padding: '0.5rem',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '2px solid var(--border-primary)',
              fontFamily: 'Courier New, monospace',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            aria-label="Toggle keyboard shortcuts legend"
          >
            ⌨️ Shortcuts
          </button>
          
          {navigation.showShortcuts && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-primary)',
              fontFamily: 'Courier New, monospace',
              fontSize: '0.75rem',
              color: 'var(--text-primary)',
              minWidth: '200px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>⌨️ Toetsenbord</div>
              <div style={{ marginBottom: '0.25rem' }}>F: Volledig scherm (AGP)</div>
              <div style={{ marginBottom: '0.25rem' }}>ESC: Sluiten / Terug</div>
              <div style={{ marginBottom: '0.25rem' }}>Tab: Navigeren</div>
              <div>Enter/Spatie: Activeren</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AGPGenerator - Wrapper component that provides context providers
 * 
 * Gets masterDataset from DataContext and wraps AGPGeneratorContent
 * with PeriodProvider and MetricsProvider to manage state.
 * 
 * Note: workdays and numDaysProfile come from UIContext but must be passed
 * to MetricsProvider as it needs them for calculations.
 */
export default function AGPGenerator() {
  const { masterDataset } = useData();
  const { workdays, numDaysProfile } = useUI();
  
  return (
    <PeriodProvider masterDataset={masterDataset}>
      <MetricsProvider workdays={workdays} numDaysProfile={numDaysProfile}>
        <AGPGeneratorContent />
      </MetricsProvider>
    </PeriodProvider>
  );
}
