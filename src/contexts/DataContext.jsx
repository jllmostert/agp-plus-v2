import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useMasterDataset } from '../hooks/useMasterDataset';
import { useDataStatus } from '../hooks/useDataStatus';
import { useUploadStorage } from '../hooks/useUploadStorage';
import { useCSVData } from '../hooks/useCSVData';

/**
 * DataContext - Central data management for AGP+
 * 
 * Provides:
 * - Master dataset (V3 incremental storage)
 * - Data status monitoring (green/yellow/red light)
 * - Upload storage management
 * - CSV data (V2 legacy, during migration)
 * - TDD statistics
 * - Error handling
 * 
 * @example
 * const { masterDataset, dataStatus, uploadStorage } = useData();
 */
const DataContext = createContext(null);

/**
 * DataProvider - Wraps app with data management context
 */
export function DataProvider({ children }) {
  // ============================================
  // STATE: Data Management
  // ============================================
  
  // V3: Master dataset (incremental storage)
  const masterDataset = useMasterDataset();
  
  // Data status monitoring (green/yellow/red light)
  const dataStatus = useDataStatus(masterDataset.allReadings);
  
  // V2: Legacy CSV uploads (fallback during transition)
  const { csvData, dateRange, loadCSV, loadParsedData, error: csvError } = useCSVData();
  
  // V3 Upload error state
  const [v3UploadError, setV3UploadError] = useState(null);
  
  // Upload storage management
  const uploadStorage = useUploadStorage();
  
  // TDD data by day (all days) from storage
  const [tddByDay, setTddByDay] = useState(null);
  
  // ============================================
  // EFFECTS: Data Loading
  // ============================================
  
  // Load TDD data from storage
  useEffect(() => {
    const loadTDD = async () => {
      try {
        const { loadTDDData } = await import('../storage/masterDatasetStorage');
        const tdd = await loadTDDData();
        if (tdd && tdd.tddByDay) {
          setTddByDay(tdd.tddByDay);
        }
      } catch (err) {
        console.error('[DataContext] Failed to load TDD data:', err);
      }
    };
    loadTDD();
  }, [uploadStorage.activeUploadId]);
  
  // One-time migration: cartridge events from localStorage to IndexedDB (v4.5.0)
  // TODO: Remove after v4.6 when all users have migrated
  useEffect(() => {
    const runMigration = async () => {
      try {
        const { migrateFromLocalStorage } = await import('../storage/cartridgeStorage');
        const result = await migrateFromLocalStorage();
        if (result.migrated) {
          console.log(`[DataContext] Migrated ${result.count} cartridge changes to IndexedDB`);
        }
      } catch (err) {
        console.error('[DataContext] Cartridge migration failed:', err);
      }
    };
    runMigration();
  }, []); // Run once on mount
  
  // One-time migration: patient info from localStorage to IndexedDB (v4.5.0)
  // TODO: Remove after v4.6 when all users have migrated
  useEffect(() => {
    const migratePatientInfo = async () => {
      try {
        const oldData = localStorage.getItem('patient-info');
        if (!oldData) return;
        
        const { patientStorage } = await import('../utils/patientStorage.js');
        const existing = await patientStorage.get();
        
        // Only migrate if IndexedDB is empty
        if (!existing || !existing.name) {
          const parsed = JSON.parse(oldData);
          await patientStorage.save(parsed);
          console.log('[DataContext] Migrated patient info from localStorage to IndexedDB');
        }
        
        localStorage.removeItem('patient-info');
      } catch (err) {
        console.error('[DataContext] Patient info migration failed:', err);
      }
    };
    migratePatientInfo();
  }, []); // Run once on mount
  
  // One-time migration: workdays from localStorage to IndexedDB (v4.5.0)
  // TODO: Remove after v4.6 when all users have migrated
  useEffect(() => {
    const migrateWorkdays = async () => {
      try {
        const oldData = localStorage.getItem('workday-dates');
        if (!oldData) return;
        
        const { loadProTimeData, saveProTimeData } = await import('../storage/masterDatasetStorage.js');
        const existing = await loadProTimeData();
        
        // Only migrate if IndexedDB is empty
        if (!existing || existing.size === 0) {
          const parsed = JSON.parse(oldData);
          await saveProTimeData(new Set(parsed));
          console.log('[DataContext] Migrated workdays from localStorage to IndexedDB');
        }
        
        localStorage.removeItem('workday-dates');
      } catch (err) {
        console.error('[DataContext] Workdays migration failed:', err);
      }
    };
    migrateWorkdays();
  }, []); // Run once on mount
  
  // ============================================
  // COMPUTED: Active Data Source
  // ============================================
  
  // Always use V3 for new uploads (Phase 4.0)
  const useV3Mode = true;
  
  // Keep previous readings during load to prevent crashes
  const prevReadingsRef = useRef([]);
  const prevV3ModeRef = useRef(false);
  
  // Determine mode: V3 if we have readings OR if we had V3 mode before (sticky during loads)
  const hasV3Data = masterDataset.readings.length > 0;
  const hadV3Mode = prevV3ModeRef.current;
  
  // Update ref for next render
  if (hasV3Data) {
    prevV3ModeRef.current = true;
  }
  
  // Active readings with fallback logic
  const activeReadings = useMemo(() => {
    // If we have new V3 data, use it
    if (hasV3Data) {
      prevReadingsRef.current = masterDataset.readings;
      return masterDataset.readings;
    }
    
    // If loading and we had V3 data before, keep showing old V3 data
    if (masterDataset.isLoading && hadV3Mode && prevReadingsRef.current.length > 0) {
      return prevReadingsRef.current;
    }
    
    // Otherwise fall back to V2
    const readings = csvData;
    if (readings && readings.length > 0) {
      prevReadingsRef.current = readings;
    }
    return readings;
  }, [hasV3Data, masterDataset.readings, masterDataset.isLoading, hadV3Mode, csvData]);
  
  // Active date range
  const activeDateRange = useMemo(() => {
    return useV3Mode ? masterDataset.stats?.dateRange : dateRange;
  }, [useV3Mode, masterDataset.stats?.dateRange, dateRange]);
  
  // V3: Show loading indicator during date range changes
  const isFilteringData = masterDataset.isLoading && useV3Mode;
  
  // Comparison needs FULL dataset (not filtered) to calculate previous periods
  const comparisonReadings = useMemo(() => {
    if (useV3Mode) {
      // V3: Use unfiltered dataset
      return masterDataset.allReadings || [];
    }
    // V2: Use current csvData (not filtered in V2)
    return csvData;
  }, [useV3Mode, masterDataset.allReadings, csvData]);
  
  // V3: Get FULL dataset range for comparison availability checks
  const fullDatasetRange = useMemo(() => {
    // Try V3 first
    if (useV3Mode && masterDataset.stats?.dateRange) {
      const { min, max } = masterDataset.stats.dateRange;
      if (min && max) {
        return {
          min: new Date(min),
          max: new Date(max)
        };
      }
    }
    // Fallback to V2 CSV dateRange
    if (dateRange && dateRange.min && dateRange.max) {
      return dateRange;
    }
    return null;
  }, [useV3Mode, masterDataset.stats?.dateRange, dateRange]);
  
  // ============================================
  // METHODS: Data Operations
  // ============================================
  
  /**
   * Clear V3 upload error
   */
  const clearError = () => {
    setV3UploadError(null);
  };
  
  /**
   * Force refresh of master dataset
   */
  const refreshData = async () => {
    if (masterDataset.refresh) {
      await masterDataset.refresh();
    }
  };
  
  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value = {
    // Data sources
    masterDataset,
    csvData,
    activeReadings,
    activeDateRange,
    comparisonReadings,
    fullDatasetRange,
    
    // Status
    dataStatus,
    isFilteringData,
    v3UploadError,
    setV3UploadError, // Export setter for error handling
    
    // Upload management
    uploadStorage,
    
    // Statistics
    tddByDay,
    
    // Legacy V2
    dateRange,
    csvError,
    
    // Methods
    loadCSV,
    loadParsedData,
    clearError,
    refreshData,
    
    // Mode
    useV3Mode,
  };
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

/**
 * Hook to consume DataContext
 * @returns {object} Data context value
 * @throws {Error} If used outside DataProvider
 */
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
