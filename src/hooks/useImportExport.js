import { useState, useEffect } from 'react';

/**
 * Import/Export orchestration
 * Handles file validation, import progress, backup creation, and data export
 * 
 * This is the most complex hook in Phase 1 refactoring.
 * Extracted from AGPGenerator.jsx to reduce component size.
 * 
 * Part of Phase 1 (Quick Wins) refactoring.
 */
export function useImportExport() {
  // === IMPORT STATE ===
  
  // Validation state
  const [importValidation, setImportValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Import execution state
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState(null);
  const [lastImportInfo, setLastImportInfo] = useState(null);
  
  // Import options
  const [importMergeStrategy, setImportMergeStrategy] = useState('append');
  const [createBackupBeforeImport, setCreateBackupBeforeImport] = useState(true);
  const [lastBackupFile, setLastBackupFile] = useState(null);
  
  // Progress tracking
  const [importProgress, setImportProgress] = useState({
    stage: '',
    current: 0,
    total: 7,
    percentage: 0
  });

  // Load last import info on mount
  useEffect(() => {
    const loadLastImport = async () => {
      try {
        const { getLastImport } = await import('../storage/importHistory');
        const lastImport = getLastImport();
        setLastImportInfo(lastImport);
      } catch (err) {
        console.error('[useImportExport] Failed to load import history:', err);
      }
    };
    loadLastImport();
  }, []);

  // === METHODS ===
  
  /**
   * Validate an import file
   * @param {File} file - File to validate
   * @returns {Promise<Object>} Validation result
   */
  const validateFile = async (file) => {
    setIsValidating(true);
    try {
      console.log('[useImportExport] Validating file:', file.name);
      
      // Import validation utility
      const { validateImportFile } = await import('../storage/import');
      
      // Validate file
      const validation = await validateImportFile(file);
      
      setImportValidation(validation);
      setPendingImportFile(file);
      
      return validation;
    } catch (error) {
      console.error('[useImportExport] Validation error:', error);
      const errorResult = { 
        valid: false, 
        errors: [error.message] 
      };
      setImportValidation(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Execute the import with current settings
   * @param {Function} onSuccess - Callback when import succeeds
   * @returns {Promise<Object>} Import result
   */
  const executeImport = async (onSuccess) => {
    if (!pendingImportFile) {
      throw new Error('No file to import');
    }

    setIsImporting(true);
    try {
      console.log('[useImportExport] Starting import...');
      console.log('[useImportExport] Merge strategy:', importMergeStrategy);
      console.log('[useImportExport] Create backup:', createBackupBeforeImport);
      
      // Create backup before import if enabled
      if (createBackupBeforeImport) {
        console.log('[useImportExport] Creating backup before import...');
        
        try {
          // Export current database
          const { exportMasterDataset } = await import('../storage/export');
          const backupData = await exportMasterDataset();
          
          // Generate backup filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
          const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
          const backupFilename = `backup-before-import-${timestamp}-${time}.json`;
          
          // Download backup automatically
          const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
            type: 'application/json' 
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = backupFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setLastBackupFile({ 
            filename: backupFilename, 
            timestamp: Date.now() 
          });
          
          console.log('[useImportExport] Backup created:', backupFilename);
          
          // Small delay to ensure download starts
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (backupError) {
          console.error('[useImportExport] Backup creation failed:', backupError);
          
          // Ask user if they want to continue without backup
          const continueWithoutBackup = confirm(
            '⚠️ Backup Creation Failed\n\n' +
            `Error: ${backupError.message}\n\n` +
            'Do you want to continue importing without a backup?\n' +
            '(Not recommended)'
          );
          
          if (!continueWithoutBackup) {
            throw new Error('Import cancelled: Backup creation failed');
          }
          
          console.log('[useImportExport] User chose to continue without backup');
        }
      }
      
      // If replace mode, clear existing data first
      if (importMergeStrategy === 'replace') {
        console.log('[useImportExport] Replace mode: Clearing existing data...');
        
        // Clear glucose readings from IndexedDB
        const { cleanupRecords } = await import('../storage/masterDatasetStorage');
        await cleanupRecords({ type: 'all-in' }); // Clears readings, cartridges, ProTime
        console.log('[useImportExport] Cleared glucose readings');
        
        // Clear sensors
        const { clearAllSensors } = await import('../storage/sensorStorage');
        await clearAllSensors();
        console.log('[useImportExport] Cleared sensors');
        
        // Clear events (cartridges and sensor changes)
        localStorage.removeItem('agp-device-events');
        console.log('[useImportExport] Cleared device events');
        
        // Clear workdays
        const { deleteProTimeData } = await import('../storage/masterDatasetStorage');
        await deleteProTimeData();
        console.log('[useImportExport] Cleared workdays');
        
        // Clear patient info
        const { patientStorage } = await import('../utils/patientStorage');
        await patientStorage.clear();
        console.log('[useImportExport] Cleared patient info');
        
        // Clear stock management (batches and assignments)
        localStorage.removeItem('agp-stock-batches');
        localStorage.removeItem('agp-stock-assignments');
        console.log('[useImportExport] Cleared stock data');
        
        console.log('[useImportExport] All existing data cleared');
      }
      
      // Execute import with progress tracking
      console.log('[useImportExport] Calling importMasterDataset...');
      const { importMasterDataset } = await import('../storage/import');
      const result = await importMasterDataset(
        pendingImportFile,
        (progress) => {
          console.log('[useImportExport] Import progress:', progress);
          setImportProgress(progress);
        }
      );
      console.log('[useImportExport] Import result:', result);
      
      // Update state
      setLastImportInfo(result);
      setPendingImportFile(null);
      setImportValidation(null);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      console.error('[useImportExport] Import error:', error);
      throw error;
    } finally {
      setIsImporting(false);
      setImportProgress({
        stage: '',
        current: 0,
        total: 7,
        percentage: 0
      });
    }
  };

  /**
   * Cancel pending import
   */
  const cancelImport = () => {
    console.log('[useImportExport] Import cancelled');
    setPendingImportFile(null);
    setImportValidation(null);
    setImportProgress({
      stage: '',
      current: 0,
      total: 7,
      percentage: 0
    });
  };

  /**
   * Export data to JSON file
   * @returns {Promise<Object>} Export result with success/error status
   */
  const handleExport = async () => {
    try {
      console.log('[useImportExport] Exporting data...');
      
      // Use the exportAndDownload utility
      const { exportAndDownload } = await import('../storage/export');
      const result = await exportAndDownload();
      
      console.log('[useImportExport] Export result:', result);
      return result;
      
    } catch (error) {
      console.error('[useImportExport] Export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  /**
   * Reset all import/export state
   */
  const resetState = () => {
    console.log('[useImportExport] Resetting state');
    setImportValidation(null);
    setIsValidating(false);
    setIsImporting(false);
    setPendingImportFile(null);
    setLastImportInfo(null);
    setImportProgress({
      stage: '',
      current: 0,
      total: 7,
      percentage: 0
    });
  };

  // === RETURN API ===
  
  return {
    // Validation state
    importValidation,
    isValidating,
    
    // Import execution state
    isImporting,
    pendingImportFile,
    lastImportInfo,
    
    // Import options
    importMergeStrategy,
    setImportMergeStrategy,
    createBackupBeforeImport,
    setCreateBackupBeforeImport,
    lastBackupFile,
    
    // Progress tracking
    importProgress,
    setImportProgress,
    
    // Methods
    validateFile,
    executeImport,
    cancelImport,
    handleExport,
    resetState
  };
}
