import React, { useEffect, useMemo, useRef } from 'react';
import { Activity, Download, ChevronDown, Save } from 'lucide-react';
import { debug } from '../utils/debug.js';

// Custom hooks
import { useModalState } from '../hooks/useModalState';
import { usePanelNavigation } from '../hooks/usePanelNavigation';
import { useImportExport } from '../hooks/useImportExport';
import { useData } from '../hooks/useData';
import { PeriodProvider, usePeriod } from '../contexts/PeriodContext.jsx';
import { MetricsProvider, useMetricsContext } from '../contexts/MetricsContext.jsx';
import useUI from '../hooks/useUI';

// Core utilities
import { parseProTime } from '../core/parsers';
import { downloadHTML } from '../core/html-exporter';
import { downloadDayProfilesHTML } from '../core/day-profiles-exporter';
import { parsePumpSettings, mergePumpSettings } from '../core/pumpSettingsParser';
import { getPumpSettings, savePumpSettings } from '../storage/pumpSettingsStorage';

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

// Panel Components
import ImportPanel from './panels/ImportPanel';
import ExportPanel from './panels/ExportPanel';
import SensorHistoryPanel from './panels/SensorHistoryPanel';
import StockPanel from './panels/StockPanel';
import DayProfilesPanel from './panels/DayProfilesPanel';

import PumpSettingsPanel from './panels/PumpSettingsPanel';

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
  // Note: Now provided by MetricsContext
  // ============================================
  
  // Get all metrics from context (calculated in MetricsProvider)
  const { metricsResult, comparisonData, dayProfiles, tddData } = useMetricsContext();
  
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
  // ============================================
  
  /**
   * Handle date range changes from DateRangeFilter
   */
  const handleDateRangeChange = (start, end) => {
    // Update master dataset filter
    masterDataset.setDateRange(start, end);
    
    // Update period context (single source of truth)
    setStartDate(start);
    setEndDate(end);
  };
  
  /**
   * Handle panel navigation changes (Phase B)
   */
  const handlePanelChange = (panelId) => {
    navigation.setActivePanel(panelId);
  };

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

  /**
   * Handle CSV file upload
   */
  const handleCSVLoad = async (text) => {
    if (useV3Mode) {
      // V3: Direct upload to IndexedDB with two-phase batch assignment
      try {
        setV3UploadError(null); // Clear previous errors
        const { uploadCSVToV3 } = await import('../storage/masterDatasetStorage');
        const result = await uploadCSVToV3(text);
        
        // Parse and save pump settings from CSV (always, regardless of batch confirmation)
        try {
          const parsedSettings = parsePumpSettings(text);
          const existingSettings = getPumpSettings();
          const mergedSettings = mergePumpSettings(existingSettings, parsedSettings);
          savePumpSettings(mergedSettings);
          debug.log('[CSV Upload] Pump settings updated from CSV');
        } catch (settingsErr) {
          console.warn('[CSV Upload] Failed to parse pump settings:', settingsErr);
        }
        
        // Check if upload needs user confirmation for batch assignments
        if (result.needsConfirmation) {
          debug.log('[CSV Upload] Found batch matches, awaiting user confirmation');
          // Store for completion after user confirms
          setPendingUpload({
            detectedEvents: result.detectedEvents,
            suggestions: result.suggestions
          });
          setBatchAssignmentDialog({ open: true, suggestions: result.suggestions });
          return; // Don't refresh yet - wait for user confirmation
        }
        
        // No confirmation needed - refresh normally
        debug.log('[CSV Upload] No batch matches, sensors stored immediately');
        masterDataset.refresh();
        
        // Show success toast
        showToast(`✅ CSV geüpload!`, 3000);
        
      } catch (err) {
        console.error('[CSV Upload] V3 upload failed:', err);
        setV3UploadError(err.message);
      }
    } else {
      // V2: Original flow (localStorage)
      loadCSV(text);
    }
    
    // Reset period selection when new CSV is loaded
    setStartDate(null);
    setEndDate(null);
  };

  /**
   * Handle ProTime data import (PDF text or JSON) - async!
   * Supports multiple imports - merges workdays instead of replacing
   */
  const handleProTimeLoad = async (text) => {
    try {
      const newWorkdayDates = parseProTime(text);
      
      if (!newWorkdayDates || newWorkdayDates.size === 0) {
        console.error('No workdays found in ProTime data');
        return;
      }

      // ✅ MERGE with existing workdays instead of replacing!
      const workdaySet = new Set([
        ...(workdays || []),    // Existing workdays (if any)
        ...newWorkdayDates      // New workdays from this import
      ]);
      
      debug.log(`[ProTime] Imported ${newWorkdayDates.size} new workdays, total now: ${workdaySet.size}`);
      
      loadWorkdays(workdaySet);
      
      // V3 mode: Save to master dataset settings
      if (useV3Mode) {
        try {
          const { saveProTimeData } = await import('../storage/masterDatasetStorage');
          await saveProTimeData(workdaySet);
        } catch (err) {
          console.error('[ProTime] Failed to save to V3:', err);
        }
      }
      // V2 mode: Save to active upload
      else if (activeUploadId) {
        try {
          await updateProTimeData(activeUploadId, workdaySet);
        } catch (err) {
          console.error('[ProTime] Failed to save to V2 upload:', err);
        }
      }
      
    } catch (err) {
      console.error('ProTime parsing failed:', err);
    }
  };

  /**
   * Handle ProTime data deletion - async!
   */
  const handleProTimeDelete = async () => {
    try {
      // Clear workdays from state
      clearWorkdays();
      
      // V3 mode: Delete from master dataset settings
      if (useV3Mode) {
        try {
          const { deleteProTimeData } = await import('../storage/masterDatasetStorage');
          await deleteProTimeData();
        } catch (err) {
          console.error('[ProTime] Failed to delete from V3:', err);
          throw err;
        }
      }
      // V2 mode: Clear from active upload
      else if (activeUploadId) {
        try {
          await updateProTimeData(activeUploadId, null);
        } catch (err) {
          console.error('[ProTime] Failed to delete from V2 upload:', err);
          throw err;
        }
      }
      
    } catch (err) {
      console.error('ProTime deletion failed:', err);
      throw err; // Re-throw so modal can show error
    }
  };

  /**
   * Handle batch assignment confirmation
   */
  const handleBatchAssignmentConfirm = async (assignments) => {
    try {
      // NEW: Check if this is part of a two-phase upload
      if (pendingUpload) {
        debug.log('[Batch Assignment] Completing two-phase upload with assignments');
        const { completeCSVUploadWithAssignments } = await import('../storage/masterDatasetStorage');
        
        await completeCSVUploadWithAssignments(
          pendingUpload.detectedEvents,
          assignments
        );
        
        setPendingUpload(null); // Clear pending state
        masterDataset.refresh(); // Refresh UI with new sensors
        
        debug.log(`[Batch Assignment] Upload complete: ${assignments.length} sensors assigned`);
        
        // Show success toast
        showToast(`✅ CSV geüpload! ${assignments.length} sensors toegewezen`, 3000);
      } else {
        // OLD: Legacy path for manual assignments (post-upload)
        const { assignSensorToBatch } = await import('../storage/stockStorage');
        
        for (const { sensorId, batchId } of assignments) {
          await assignSensorToBatch(sensorId, batchId, 'auto');
        }
        
        debug.log(`[Batch Assignment] Assigned ${assignments.length} sensors`);
      }
      
      setBatchAssignmentDialog({ open: false, suggestions: [] });
      
    } catch (err) {
      console.error('[Batch Assignment] Failed:', err);
      alert(`Fout bij toewijzen: ${err.message}`);
    }
  };

  /**
   * Handle batch assignment cancellation
   */
  const handleBatchAssignmentCancel = () => {
    // If canceling during two-phase upload, still need to complete storage
    if (pendingUpload) {
      debug.log('[Batch Assignment] User canceled, storing sensors without assignments');
      
      // Complete upload without assignments (async but don't await - fire and forget)
      (async () => {
        try {
          const { completeCSVUploadWithAssignments } = await import('../storage/masterDatasetStorage');
          await completeCSVUploadWithAssignments(pendingUpload.detectedEvents, []); // Empty assignments
          setPendingUpload(null);
          masterDataset.refresh();
        } catch (err) {
          console.error('[Batch Assignment] Failed to complete upload after cancel:', err);
        }
      })();
    }
    
    setBatchAssignmentDialog({ open: false, suggestions: [] });
  };

  // ============================================
  // EVENT HANDLERS: Period Selection
  // ============================================

  /**
   * Handle period selection change
   */
  const handlePeriodChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  /**
   * Handle day/night toggle
   */
  const handleDayNightToggle = () => {
    setDayNightEnabled(!dayNightEnabled);
  };

  /**
   * Handle HTML export (async to track export history)
   */
  const handleExportHTML = async () => {
    if (!metricsResult || !startDate || !endDate) return;
    
    // Format dates to YYYY/MM/DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };
    
    try {
      const result = await downloadHTML({
        metrics: metricsResult.metrics,
        agpData: metricsResult.agp,
        events: metricsResult.events,
        tddData: tddData, // Add TDD statistics
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        // ALWAYS include day/night metrics in export (independent of UI toggle)
        dayNightMetrics: {
          day: metricsResult.dayMetrics,
          night: metricsResult.nightMetrics
        },
        workdaySplit: workdays && metricsResult.workdayMetrics && metricsResult.restdayMetrics ? {
          workday: metricsResult.workdayMetrics,
          restday: metricsResult.restdayMetrics,
          workdayCount: metricsResult.workdayMetrics.days,
          restdayCount: metricsResult.restdayMetrics.days
        } : null,
        comparison: comparisonData ? {
          current: metricsResult.metrics,
          previous: comparisonData.comparison,
          comparisonAGP: comparisonData.comparisonAGP,
          prevStart: formatDate(new Date(comparisonData.prevStart)),
          prevEnd: formatDate(new Date(comparisonData.prevEnd))
        } : null,
        patientInfo: patientInfo // Add patient info to export
      });
      
      if (result.success) {
        debug.log(`[AGPGenerator] AGP HTML exported: ${result.filename} (${(result.fileSize / 1024).toFixed(1)} KB)`);
      }
    } catch (error) {
      console.error('[AGPGenerator] Error exporting AGP HTML:', error);
      alert('Export failed. Check console for details.');
    }
  };

  // ============================================
  // EVENT HANDLERS: Upload Storage
  // ============================================

  /**
   * Save current upload to storage (async!)
   */
  const handleSaveUpload = async () => {
    if (!csvData || !dateRange) {
      alert('No data to save. Load CSV first.');
      return;
    }

    try {
      await saveUpload({
        csvData,
        dateRange,
        proTimeData: workdays
      });
      alert('✅ Upload saved successfully!');
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  /**
   * Handle data management deletion
   * Deletes selected data types within specified date range
   * Refreshes V3 dataset and workdays after deletion
   */
  const handleDataManagementDelete = async (deleteConfig) => {
    debug.log('[AGPGenerator] 🗑️ DELETE FUNCTION CALLED!', deleteConfig);
    
    const { dateRange, deleteTypes } = deleteConfig;
    

    try {
      let deletedCounts = {
        glucose: 0,
        proTime: 0,
        cartridge: 0
      };
      
      // Delete glucose readings
      if (deleteTypes.glucose) {
        const { deleteGlucoseDataInRange } = await import('../storage/masterDatasetStorage');
        deletedCounts.glucose = await deleteGlucoseDataInRange(dateRange.start, dateRange.end);
      }
      
      // Delete ProTime workdays
      if (deleteTypes.proTime) {
        const { deleteProTimeDataInRange } = await import('../storage/masterDatasetStorage');
        deletedCounts.proTime = await deleteProTimeDataInRange(dateRange.start, dateRange.end);
        
        // Reload workdays state from storage
        const { loadProTimeData } = await import('../storage/masterDatasetStorage');
        const newWorkdays = await loadProTimeData();
        loadWorkdays(newWorkdays || new Set());
      }
      
      // Delete cartridge events
      if (deleteTypes.cartridge) {
        const { deleteCartridgeChangesInRange } = await import('../storage/cartridgeStorage');
        deletedCounts.cartridge = await deleteCartridgeChangesInRange(dateRange.start, dateRange.end);
      }
      
      // Force reload V3 data to update UI
      masterDataset.refresh();
      
      return deletedCounts;
      
    } catch (err) {
      debug.error('[DataManagement] ❌ Delete failed:', err);
      throw err;
    }
  };

  /**
   * Handle database import from JSON file
   * Opens file picker, validates file, shows confirmation modal
   * Now uses useImportExport hook
   */
  const handleDatabaseImport = async () => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        // Open modal and start validation
        modals.setDataImportModalOpen(true);
        
        // Validate file using hook
        await importExport.validateFile(file);
        
      } catch (err) {
        console.error('Validation failed:', err);
      }
    };
    
    input.click();
  };

  /**
   * Confirm and execute import after validation
   * Now uses useImportExport hook
   */
  const handleImportConfirm = async () => {
    if (!importExport.pendingImportFile) return;
    
    try {
      // Close modal
      modals.setDataImportModalOpen(false);
      
      // Execute import using hook
      const result = await importExport.executeImport();
      
      if (result.success) {
        // Show success toast
        const stats = result.stats;
        const totalRecords = stats.readingsImported + stats.sensorsImported + 
                            stats.cartridgesImported + stats.workdaysImported +
                            stats.stockBatchesImported + stats.stockAssignmentsImported;
        showToast(`✅ Import geslaagd! ${totalRecords} records toegevoegd`, 4000);
        
        // Show detailed stats in console
        const strategyText = importExport.importMergeStrategy === 'replace' 
          ? '🔄 Strategy: Replace (cleared existing data)' 
          : '➕ Strategy: Append (added to existing data)';
        const backupText = importExport.lastBackupFile 
          ? `\n💾 Backup: ${importExport.lastBackupFile.filename}` 
          : '';
        debug.log(
          `✅ Import Complete!\n\n` +
          `${strategyText}${backupText}\n\n` +
          `📊 Months: ${stats.monthsImported}\n` +
          `📈 Readings: ${stats.readingsImported}\n` +
          `📍 Sensors: ${stats.sensorsImported}\n` +
          `💉 Cartridges: ${stats.cartridgesImported}\n` +
          (stats.workdaysImported > 0 ? `📅 Workdays: ${stats.workdaysImported}\n` : '') +
          (stats.patientInfoImported ? `👤 Patient Info: Yes\n` : '') +
          (stats.stockBatchesImported > 0 ? `📦 Batches: ${stats.stockBatchesImported}\n` : '') +
          (stats.stockAssignmentsImported > 0 ? `🔗 Assignments: ${stats.stockAssignmentsImported}\n` : '') +
          `\n⏱️ Duration: ${(result.duration / 1000).toFixed(1)}s`
        );
        
        // Track import in history
        const { addImportEvent } = await import('../storage/importHistory');
        
        addImportEvent({
          filename: importExport.pendingImportFile?.name || 'unknown',
          recordCount: totalRecords,
          duration: result.duration,
          strategy: importExport.importMergeStrategy,
          stats: stats
        });
        debug.log('[AGPGenerator] Import event tracked in history');
        
        // Refresh data
        masterDataset.refresh();
        
        // Reload workdays if imported
        if (stats.workdaysImported > 0) {
          const { loadProTimeData } = await import('../storage/masterDatasetStorage');
          const newWorkdays = await loadProTimeData();
          loadWorkdays(newWorkdays || new Set());
        }
        
        // Reload patient info if imported
        if (stats.patientInfoImported) {
          const { patientStorage } = await import('../utils/patientStorage');
          const info = await patientStorage.get();
          setPatientInfo(info);
        }
        
      } else {
        // Show error
        const errorMsg = result.errors?.join('\n') || 'Unknown error';
        alert(`❌ Import Failed:\n\n${errorMsg}`);
      }
      
    } catch (err) {
      console.error('Import failed:', err);
      
      // If we created a backup, offer to restore it
      if (importExport.lastBackupFile) {
        const errorMessage = 
          `❌ Import Failed\n\n` +
          `Error: ${err.message}\n\n` +
          `🔄 A backup was created before import:\n` +
          `${importExport.lastBackupFile.filename}\n\n` +
          `The backup file should be in your Downloads folder.\n` +
          `You can restore it by:\n` +
          `1. Close this message\n` +
          `2. Click EXPORT → Import Database\n` +
          `3. Select the backup file`;
        
        alert(errorMessage);
      } else {
        alert(`❌ Import Failed:\n\n${err.message}`);
      }
    }
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
        
        {/* Phase B: Panel Routing */}
        <div className="main-content" style={{ 
          padding: '1rem 2rem'
        }}>
          
          {navigation.activePanel === 'import' && (
            <ImportPanel
              onCSVLoad={handleCSVLoad}
              onProTimeLoad={handleProTimeLoad}
              onProTimeDelete={handleProTimeDelete}
              onImportDatabase={handleDatabaseImport}
              onSensorRegistrationOpen={() => modals.setSensorRegistrationOpen(true)}
            />
          )}
          
          {navigation.activePanel === 'dagprofielen' && (
            <DayProfilesPanel
              isOpen={true}
              onClose={() => navigation.setActivePanel('import')}
              dayProfiles={dayProfiles}
              patientInfo={patientInfo}
              numDays={numDaysProfile}
              onNumDaysChange={setNumDaysProfile}
            />
          )}
          
          {navigation.activePanel === 'sensoren' && (
            <SensorHistoryPanel 
              isOpen={true}
              onClose={() => navigation.setActivePanel('import')}
              onOpenStock={() => modals.setShowStockModal(true)}
            />
          )}
          
          {navigation.activePanel === 'export' && (
            <ExportPanel
              onExportHTML={handleExportHTML}
              onExportDayProfiles={async () => {
                if (dayProfiles && dayProfiles.length > 0) {
                  try {
                    const result = await downloadDayProfilesHTML(dayProfiles, patientInfo);
                    if (result.success) {
                      debug.log(`[AGPGenerator] Day Profiles exported: ${result.filename} (${(result.fileSize / 1024).toFixed(1)} KB)`);
                    }
                  } catch (error) {
                    console.error('[AGPGenerator] Error exporting day profiles:', error);
                    alert('Export failed. Check console for details.');
                  }
                } else {
                  alert('No day profiles available');
                }
              }}
              onExportDatabase={async () => {
                const result = await importExport.handleExport();
                if (result.success) {
                  alert(`✅ Exported ${result.recordCount} readings to ${result.filename}`);
                } else {
                  alert(`❌ Export failed: ${result.error}`);
                }
              }}
              onImportDatabase={handleDatabaseImport}
              dayProfiles={dayProfiles}
              patientInfo={patientInfo}
            />
          )}
          
          {navigation.activePanel === 'settings' && (
            <PumpSettingsPanel />
          )}
        </div>
        
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
