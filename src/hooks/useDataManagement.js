import { useCallback } from 'react';
import { debug } from '../utils/debug.js';

/**
 * Data Management Hook
 * 
 * Handles all data manipulation operations:
 * - CSV upload and parsing
 * - ProTime workday management
 * - Batch assignment workflow
 * - Data deletion
 * - HTML export
 * 
 * Extracted from AGPGenerator.jsx to reduce component size.
 * Part of Phase 2 (Code Health) refactoring.
 * 
 * @param {Object} deps - Dependencies from contexts and other hooks
 */
export function useDataManagement(deps) {
  const {
    // From DataContext
    masterDataset,
    useV3Mode,
    loadCSV,
    setV3UploadError,
    // From UIContext
    showToast,
    setPendingUpload,
    pendingUpload,
    setBatchAssignmentDialog,
    loadWorkdays,
    clearWorkdays,
    workdays,
    setPatientInfo,
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
    patientInfo,
    // From local state
    csvData,
    dateRange,
  } = deps;

  // ============================================
  // CSV UPLOAD
  // ============================================

  /**
   * Handle CSV file upload
   * V3: Direct upload to IndexedDB with two-phase batch assignment
   * V2: Original localStorage flow
   */
  const handleCSVLoad = useCallback(async (text) => {
    if (useV3Mode) {
      try {
        setV3UploadError?.(null);
        const { uploadCSVToV3 } = await import('../storage/masterDatasetStorage');
        const { parsePumpSettings, mergePumpSettings } = await import('../core/pumpSettingsParser');
        const { getPumpSettings, savePumpSettings } = await import('../storage/pumpSettingsStorage');
        
        const result = await uploadCSVToV3(text);
        
        // Parse and save pump settings
        try {
          const parsedSettings = parsePumpSettings(text);
          const existingSettings = getPumpSettings();
          const mergedSettings = mergePumpSettings(existingSettings, parsedSettings);
          savePumpSettings(mergedSettings);
          debug.log('[CSV Upload] Pump settings updated');
        } catch (settingsErr) {
          console.warn('[CSV Upload] Pump settings parse failed:', settingsErr);
        }
        
        // Check if upload needs batch confirmation
        if (result.needsConfirmation) {
          debug.log('[CSV Upload] Batch matches found, awaiting confirmation');
          setPendingUpload({
            detectedEvents: result.detectedEvents,
            suggestions: result.suggestions
          });
          setBatchAssignmentDialog({ open: true, suggestions: result.suggestions });
          return;
        }
        
        debug.log('[CSV Upload] No batch matches, sensors stored');
        masterDataset.refresh();
        showToast('✅ CSV geüpload!', 3000);
        
      } catch (err) {
        console.error('[CSV Upload] V3 upload failed:', err);
        setV3UploadError?.(err.message);
      }
    } else {
      // V2: Original flow
      loadCSV(text);
    }
    
    // Reset period selection
    setStartDate(null);
    setEndDate(null);
  }, [useV3Mode, masterDataset, loadCSV, setV3UploadError, setPendingUpload, 
      setBatchAssignmentDialog, showToast, setStartDate, setEndDate]);

  // ============================================
  // PROTIME WORKDAYS
  // ============================================

  /**
   * Handle ProTime data import (PDF text or JSON)
   * Supports multiple imports - merges workdays
   */
  const handleProTimeLoad = useCallback(async (text) => {
    try {
      const { parseProTime } = await import('../core/parsers');
      const newWorkdayDates = parseProTime(text);
      
      if (!newWorkdayDates || newWorkdayDates.size === 0) {
        console.error('No workdays found in ProTime data');
        return;
      }

      // Merge with existing workdays
      const workdaySet = new Set([
        ...(workdays || []),
        ...newWorkdayDates
      ]);
      
      debug.log(`[ProTime] Imported ${newWorkdayDates.size} new, total: ${workdaySet.size}`);
      loadWorkdays(workdaySet);
      
      // Save to storage
      if (useV3Mode) {
        const { saveProTimeData } = await import('../storage/masterDatasetStorage');
        await saveProTimeData(workdaySet);
      } else if (activeUploadId) {
        await updateProTimeData(activeUploadId, workdaySet);
      }
    } catch (err) {
      console.error('ProTime parsing failed:', err);
    }
  }, [workdays, loadWorkdays, useV3Mode, activeUploadId, updateProTimeData]);

  /**
   * Handle ProTime data deletion
   */
  const handleProTimeDelete = useCallback(async () => {
    try {
      clearWorkdays();
      
      if (useV3Mode) {
        const { deleteProTimeData } = await import('../storage/masterDatasetStorage');
        await deleteProTimeData();
      } else if (activeUploadId) {
        await updateProTimeData(activeUploadId, null);
      }
    } catch (err) {
      console.error('ProTime deletion failed:', err);
      throw err;
    }
  }, [clearWorkdays, useV3Mode, activeUploadId, updateProTimeData]);

  // ============================================
  // BATCH ASSIGNMENT
  // ============================================

  /**
   * Handle batch assignment confirmation
   */
  const handleBatchAssignmentConfirm = useCallback(async (assignments) => {
    try {
      if (pendingUpload) {
        debug.log('[Batch] Completing two-phase upload');
        const { completeCSVUploadWithAssignments } = await import('../storage/masterDatasetStorage');
        
        await completeCSVUploadWithAssignments(
          pendingUpload.detectedEvents,
          assignments
        );
        
        setPendingUpload(null);
        masterDataset.refresh();
        
        debug.log(`[Batch] Complete: ${assignments.length} sensors assigned`);
        showToast(`✅ CSV geüpload! ${assignments.length} sensors toegewezen`, 3000);
      } else {
        // Legacy path for manual assignments
        const { assignSensorToBatch } = await import('../storage/stockStorage');
        
        for (const { sensorId, batchId } of assignments) {
          await assignSensorToBatch(sensorId, batchId, 'auto');
        }
        
        debug.log(`[Batch] Manual: ${assignments.length} assigned`);
      }
      
      setBatchAssignmentDialog({ open: false, suggestions: [] });
    } catch (err) {
      console.error('[Batch] Failed:', err);
      alert(`Fout bij toewijzen: ${err.message}`);
    }
  }, [pendingUpload, setPendingUpload, masterDataset, showToast, setBatchAssignmentDialog]);

  /**
   * Handle batch assignment cancellation
   */
  const handleBatchAssignmentCancel = useCallback(() => {
    if (pendingUpload) {
      debug.log('[Batch] Canceled, storing without assignments');
      
      (async () => {
        try {
          const { completeCSVUploadWithAssignments } = await import('../storage/masterDatasetStorage');
          await completeCSVUploadWithAssignments(pendingUpload.detectedEvents, []);
          setPendingUpload(null);
          masterDataset.refresh();
        } catch (err) {
          console.error('[Batch] Cancel complete failed:', err);
        }
      })();
    }
    
    setBatchAssignmentDialog({ open: false, suggestions: [] });
  }, [pendingUpload, setPendingUpload, masterDataset, setBatchAssignmentDialog]);

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  /**
   * Handle data management deletion
   * Deletes selected data types within specified date range
   */
  const handleDataManagementDelete = useCallback(async (deleteConfig) => {
    debug.log('[DataMgmt] DELETE called:', deleteConfig);
    
    const { dateRange: delRange, deleteTypes } = deleteConfig;

    try {
      let deletedCounts = { glucose: 0, proTime: 0, cartridge: 0 };
      
      if (deleteTypes.glucose) {
        const { deleteGlucoseDataInRange } = await import('../storage/masterDatasetStorage');
        deletedCounts.glucose = await deleteGlucoseDataInRange(delRange.start, delRange.end);
      }
      
      if (deleteTypes.proTime) {
        const { deleteProTimeDataInRange, loadProTimeData } = await import('../storage/masterDatasetStorage');
        deletedCounts.proTime = await deleteProTimeDataInRange(delRange.start, delRange.end);
        
        const newWorkdays = await loadProTimeData();
        loadWorkdays(newWorkdays || new Set());
      }
      
      if (deleteTypes.cartridge) {
        const { deleteCartridgeChangesInRange } = await import('../storage/cartridgeStorage');
        deletedCounts.cartridge = await deleteCartridgeChangesInRange(delRange.start, delRange.end);
      }
      
      masterDataset.refresh();
      return deletedCounts;
      
    } catch (err) {
      debug.error('[DataMgmt] Delete failed:', err);
      throw err;
    }
  }, [masterDataset, loadWorkdays]);

  // ============================================
  // EXPORT
  // ============================================

  /**
   * Handle HTML export
   */
  const handleExportHTML = useCallback(async () => {
    if (!metricsResult || !startDate || !endDate) return;
    
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}/${m}/${d}`;
    };
    
    try {
      const { downloadHTML } = await import('../core/html-exporter');
      
      const result = await downloadHTML({
        metrics: metricsResult.metrics,
        agpData: metricsResult.agp,
        events: metricsResult.events,
        tddData: tddData,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
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
        patientInfo: patientInfo
      });
      
      if (result.success) {
        debug.log(`[Export] HTML: ${result.filename} (${(result.fileSize / 1024).toFixed(1)} KB)`);
      }
    } catch (error) {
      console.error('[Export] HTML failed:', error);
      alert('Export failed. Check console for details.');
    }
  }, [metricsResult, startDate, endDate, tddData, workdays, comparisonData, patientInfo]);

  /**
   * Handle Day Profiles export
   */
  const handleExportDayProfiles = useCallback(async () => {
    if (!dayProfiles || dayProfiles.length === 0) {
      alert('No day profiles available');
      return;
    }
    
    try {
      const { downloadDayProfilesHTML } = await import('../core/day-profiles-exporter');
      const result = await downloadDayProfilesHTML(dayProfiles, patientInfo);
      if (result.success) {
        debug.log(`[Export] Day Profiles: ${result.filename} (${(result.fileSize / 1024).toFixed(1)} KB)`);
      }
    } catch (error) {
      console.error('[Export] Day profiles failed:', error);
      alert('Export failed. Check console for details.');
    }
  }, [dayProfiles, patientInfo]);

  /**
   * Handle database export
   */
  const handleExportDatabase = useCallback(async () => {
    const result = await importExport.handleExport();
    if (result.success) {
      alert(`✅ Exported ${result.recordCount} readings to ${result.filename}`);
    } else {
      alert(`❌ Export failed: ${result.error}`);
    }
  }, [importExport]);

  /**
   * Handle database import (opens file picker)
   */
  const handleDatabaseImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        modals.setDataImportModalOpen(true);
        await importExport.validateFile(file);
      } catch (err) {
        console.error('Validation failed:', err);
      }
    };
    
    input.click();
  }, [modals, importExport]);

  /**
   * Confirm and execute import after validation
   */
  const handleImportConfirm = useCallback(async () => {
    if (!importExport.pendingImportFile) return;
    
    try {
      modals.setDataImportModalOpen(false);
      const result = await importExport.executeImport();
      
      if (result.success) {
        const stats = result.stats;
        const totalRecords = stats.readingsImported + stats.sensorsImported + 
                            stats.cartridgesImported + stats.workdaysImported +
                            stats.stockBatchesImported + stats.stockAssignmentsImported;
        showToast(`✅ Import geslaagd! ${totalRecords} records toegevoegd`, 4000);
        
        // Track import
        const { addImportEvent } = await import('../storage/importHistory');
        addImportEvent({
          filename: importExport.pendingImportFile?.name || 'unknown',
          recordCount: totalRecords,
          duration: result.duration,
          strategy: importExport.importMergeStrategy,
          stats: stats
        });
        
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
        const errorMsg = result.errors?.join('\n') || 'Unknown error';
        alert(`❌ Import Failed:\n\n${errorMsg}`);
      }
    } catch (err) {
      console.error('Import failed:', err);
      
      if (importExport.lastBackupFile) {
        alert(
          `❌ Import Failed\n\n` +
          `Error: ${err.message}\n\n` +
          `Backup: ${importExport.lastBackupFile.filename}\n` +
          `Restore via: EXPORT → Import Database`
        );
      } else {
        alert(`❌ Import Failed:\n\n${err.message}`);
      }
    }
  }, [importExport, modals, masterDataset, showToast, loadWorkdays, setPatientInfo]);

  /**
   * Save current upload to storage (V2 legacy)
   */
  const handleSaveUpload = useCallback(async () => {
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
  }, [csvData, dateRange, workdays, saveUpload]);

  /**
   * Handle date range changes from DateRangeFilter
   */
  const handleDateRangeChange = useCallback((start, end) => {
    masterDataset.setDateRange(start, end);
    setStartDate(start);
    setEndDate(end);
  }, [masterDataset, setStartDate, setEndDate]);

  // ============================================
  // RETURN ALL HANDLERS
  // ============================================

  return {
    // CSV Upload
    handleCSVLoad,
    
    // ProTime
    handleProTimeLoad,
    handleProTimeDelete,
    
    // Batch Assignment
    handleBatchAssignmentConfirm,
    handleBatchAssignmentCancel,
    
    // Data Management
    handleDataManagementDelete,
    
    // Export
    handleExportHTML,
    handleExportDayProfiles,
    handleExportDatabase,
    
    // Import
    handleDatabaseImport,
    handleImportConfirm,
    
    // Storage (V2)
    handleSaveUpload,
    
    // Date Range
    handleDateRangeChange,
  };
}

export default useDataManagement;
