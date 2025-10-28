import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Activity, Download, ChevronDown, AlertCircle, Save, User } from 'lucide-react';
import { debug } from '../utils/debug.js';

// Custom hooks
import { useCSVData } from '../hooks/useCSVData';
import { useMetrics } from '../hooks/useMetrics';
import { useComparison } from '../hooks/useComparison';
import { useUploadStorage } from '../hooks/useUploadStorage';
import { useDayProfiles } from '../hooks/useDayProfiles';
import { useMasterDataset } from '../hooks/useMasterDataset';
import { useDataStatus } from '../hooks/useDataStatus';
import { useSensorDatabase } from '../hooks/useSensorDatabase';

// Core utilities
import { parseProTime } from '../core/parsers';
import { downloadHTML } from '../core/html-exporter';
import { downloadDayProfilesHTML } from '../core/day-profiles-exporter';
import { exportAndDownload } from '../storage/export';

// UI Components
import FileUpload from './FileUpload';
import SensorImport from './SensorImport';
import PeriodSelector from './PeriodSelector';
import MetricsDisplay from './MetricsDisplay';
import AGPChart from './AGPChart';
import ComparisonView from './ComparisonView';
import DayNightSplit from './DayNightSplit';
import WorkdaySplit from './WorkdaySplit';
import SavedUploadsList from './SavedUploadsList';
import PatientInfo from './PatientInfo';
import DayProfilesModal from './DayProfilesModal';
import SensorHistoryModal from './SensorHistoryModal';
import DataManagementModal from './DataManagementModal';
import { MigrationBanner } from './MigrationBanner';
import { DateRangeFilter } from './DateRangeFilter';
import DebugPanel from './DebugPanel';

/**
 * AGPGenerator - Main application container
 * 
 * Orchestrates the entire AGP+ application:
 * - CSV data loading and parsing
 * - ProTime workday data import
 * - Period selection and date management
 * - Metrics calculation coordination
 * - Component composition and data flow
 * 
 * @version 2.1.0
 */
export default function AGPGenerator() {
  // ============================================
  // HOOKS: Data Management
  // ============================================
  
  // V3: Master dataset (incremental storage)
  const masterDataset = useMasterDataset();
  
  // Data status monitoring (green/yellow/red light)
  const dataStatus = useDataStatus(masterDataset.allReadings);
  
  // Sensor database (for history modal)
  const { sensors, isLoading: sensorsLoading, error: sensorsError } = useSensorDatabase();
  
  // DEBUG: Log what AGPGenerator receives from hook
  useEffect(() => {
    debug.log('[AGPGenerator] Sensors from hook:', {
      count: sensors?.length || 0,
      isArray: Array.isArray(sensors),
      firstSensor: sensors?.[0],
      lastSensor: sensors?.[sensors?.length - 1]
    });
  }, [sensors]);
  
  // V2: Legacy CSV uploads (fallback during transition)
  const { csvData, dateRange, loadCSV, loadParsedData, error: csvError } = useCSVData();
  
  // V3 Upload error state
  const [v3UploadError, setV3UploadError] = useState(null);
  
  // Upload storage management
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
  } = useUploadStorage();

  // ============================================
  // STATE: Period Selection
  // ============================================
  
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // V3: Selected date range for master dataset filter
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: null,
    end: null
  });

  // ============================================
  // STATE: Optional Features
  // ============================================
  
  const [workdays, setWorkdays] = useState(null); // Set of workday date strings
  const [dayNightEnabled, setDayNightEnabled] = useState(false);
  const [dataImportExpanded, setDataImportExpanded] = useState(false); // Collapsible data import (closed by default)
  const [dataExportExpanded, setDataExportExpanded] = useState(false); // Collapsible data export (closed by default)
  const [patientInfoOpen, setPatientInfoOpen] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null); // Patient metadata from storage
  const [loadToast, setLoadToast] = useState(null); // Toast notification for load success
  const [dayProfilesOpen, setDayProfilesOpen] = useState(false); // Day profiles modal state
  const [sensorHistoryOpen, setSensorHistoryOpen] = useState(false); // Sensor history modal state
  const [dataManagementOpen, setDataManagementOpen] = useState(false); // Data management modal state

  // Load patient info from storage
  useEffect(() => {
    const loadPatientInfo = async () => {
      try {
        const { patientStorage } = await import('../utils/patientStorage');
        const info = await patientStorage.get();
        setPatientInfo(info);
      } catch (err) {
        console.error('Failed to load patient info:', err);
      }
    };
    loadPatientInfo();
    
    // Reload when modal closes (in case data was updated)
    if (!patientInfoOpen) {
      loadPatientInfo();
    }
  }, [patientInfoOpen]);

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
      
      console.log('[AGPGenerator] Auto-selecting last 14 days:', {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        dayCount: Math.round((end - start) / (1000 * 60 * 60 * 24))
      });
      
      setStartDate(start);
      setEndDate(end);
    }
  }, [dataStatus.lightColor, dataStatus.dateRange, startDate, endDate]);

  /**
   * Auto-expand import section if no data loaded but saved uploads exist
   * This ensures user can always access their saved data on app startup
   */
  useEffect(() => {
    if (!csvData && savedUploads.length > 0) {
      setDataImportExpanded(true);
    }
  }, [csvData, savedUploads]);

  // ============================================
  // CALCULATED DATA: Metrics & Comparison
  // ============================================
  
  // V3: Dual-mode data source
  // Use master dataset if available, otherwise fall back to v2 CSV uploads
  const prevReadingsRef = useRef([]);
  const prevV3ModeRef = useRef(false);
  
  // Determine mode: V3 if we have readings OR if we had V3 mode before (sticky during loads)
  // ALWAYS use V3 for new uploads (Phase 4.0)
  const hasV3Data = masterDataset.readings.length > 0;
  const hadV3Mode = prevV3ModeRef.current;
  const useV3Mode = true; // Force V3 mode for all new uploads
  
  // Update ref for next render
  if (hasV3Data) {
    prevV3ModeRef.current = true;
  }
  
  // Keep previous readings during load to prevent crashes
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
  
  // Load ProTime workdays from master dataset on init
  useEffect(() => {
    if (useV3Mode && masterDataset.stats?.workdays) {
      setWorkdays(masterDataset.stats.workdays);
      console.log('[AGPGenerator] ✅ Restored ProTime workdays:', masterDataset.stats.workdays.size);
    }
  }, [useV3Mode, masterDataset.stats?.workdays]);
  
  // Comparison needs FULL dataset (not filtered) to calculate previous periods
  const comparisonReadings = useMemo(() => {
    if (useV3Mode) {
      // V3: Use unfiltered dataset
      const allReadings = masterDataset.allReadings || [];
      console.log('[AGPGenerator] Comparison readings:', {
        count: allReadings.length,
        sample: allReadings[0],
        isLoading: masterDataset.isLoading
      });
      return allReadings;
    }
    // V2: Use current csvData (not filtered in V2)
    return csvData;
  }, [useV3Mode, masterDataset.allReadings, masterDataset.isLoading, csvData]);
  
  const activeDateRange = useV3Mode ? masterDataset.stats?.dateRange : dateRange;
  
  // V3: Show loading indicator during date range changes
  const isFilteringData = masterDataset.isLoading && useV3Mode;
  
  // V3: Get FULL dataset range for comparison availability checks
  // This is needed so useComparison can check historical data availability
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
    // Fallback to V2 CSV dateRange (even if useV3Mode is true but no V3 data yet)
    if (dateRange && dateRange.min && dateRange.max) {
      return dateRange;
    }
    return null;
  }, [useV3Mode, masterDataset.stats, dateRange]);
  
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
  
  // Calculate metrics for current period
  const metricsResult = useMetrics(activeReadings, startDate, endDate, workdays);
  
  // Debug: Check if AGP data exists
  if (metricsResult && activeReadings && activeReadings.length > 0) {
    console.log('[AGPGenerator] AGP data check:', {
      hasAGP: !!metricsResult.agp,
      agpBins: metricsResult.agp?.length,
      sampleBin: metricsResult.agp?.[144], // Noon
      readingsCount: activeReadings.length
    });
  }
  
  // Auto-calculate comparison for preset periods
  // CRITICAL: Use comparisonReadings (full dataset) not activeReadings (filtered)
  // This ensures previous period data is available for comparison calculations
  const comparisonData = useComparison(comparisonReadings, startDate, endDate, fullDatasetRange);
  
  // Generate day profiles using custom hook (replaces manual generation)
  const dayProfiles = useDayProfiles(activeReadings, safeDateRange, metricsResult);
  
  // Debug: Check day profiles
  if (dayProfiles && dayProfiles.length > 0) {
    const profile = dayProfiles[0];
    console.log('[AGPGenerator] Day profile details:', {
      date: profile?.date,
      readingCount: profile?.readingCount,
      sensorChanges: profile?.sensorChanges,
      cartridgeChanges: profile?.cartridgeChanges,
      hasCurve: !!profile?.curve,
      sampleCurveBin: profile?.curve?.[144]
    });
    
    // Also log a sample reading to verify rewind field
    if (activeReadings && activeReadings.length > 0) {
      console.log('[AGPGenerator] Sample reading for events:', activeReadings[0]);
    }
  }

  // ============================================
  // EVENT HANDLERS: Date Range Filter (V3)
  // ============================================
  
  /**
   * Handle date range changes from DateRangeFilter
   */
  const handleDateRangeChange = (start, end) => {
    // DEBUG: Log what we received
    console.log('[AGPGenerator] 🔍 handleDateRangeChange called:', {
      start,
      end,
      startType: typeof start,
      endType: typeof end,
      startIsDate: start instanceof Date,
      endIsDate: end instanceof Date
    });
    
    setSelectedDateRange({ start, end });
    masterDataset.setDateRange(start, end);
    
    // Update period selector dates for consistency
    setStartDate(start);
    setEndDate(end);
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
    if (useV3Mode && masterDataset.stats && !startDate && !endDate && !selectedDateRange.start) {
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
      const loadWorkdays = async () => {
        try {
          const { loadProTimeData } = await import('../storage/masterDatasetStorage');
          const savedWorkdays = await loadProTimeData();
          
          if (savedWorkdays && savedWorkdays.size > 0) {
            setWorkdays(savedWorkdays);
          }
        } catch (err) {
          console.error('[ProTime] Failed to load from V3:', err);
        }
      };
      
      loadWorkdays();
    }
  }, [useV3Mode, workdays]);

  /**
   * Handle CSV file upload
   */
  const handleCSVLoad = async (text) => {
    if (useV3Mode) {
      // V3: Direct upload to IndexedDB (bypasses localStorage)
      try {
        setV3UploadError(null); // Clear previous errors
        const { uploadCSVToV3 } = await import('../storage/masterDatasetStorage');
        const result = await uploadCSVToV3(text);
        
        // Trigger cache reload to update UI
        masterDataset.refresh();
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
   */
  const handleProTimeLoad = async (text) => {
    try {
      const workdayDates = parseProTime(text);
      
      if (!workdayDates || workdayDates.length === 0) {
        console.error('No workdays found in ProTime data');
        return;
      }

      // Convert array to Set for fast lookups
      const workdaySet = new Set(workdayDates);
      setWorkdays(workdaySet);
      
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
      setWorkdays(null);
      
      // V3 mode: Delete from master dataset settings
      if (useV3Mode) {
        try {
          const { deleteProTimeData } = await import('../storage/masterDatasetStorage');
          await deleteProTimeData();
          console.log('[ProTime] ✅ Deleted from V3 master dataset');
        } catch (err) {
          console.error('[ProTime] Failed to delete from V3:', err);
          throw err;
        }
      }
      // V2 mode: Clear from active upload
      else if (activeUploadId) {
        try {
          await updateProTimeData(activeUploadId, null);
          console.log('[ProTime] ✅ Deleted from V2 upload');
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

  // ============================================
  // EVENT HANDLERS: Period Selection
  // ============================================

  /**
   * Handle period selection change
   * Collapse import section when user actively changes period
   */
  const handlePeriodChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // User is actively choosing a period = ready to analyze
    // Collapse import section to maximize space for metrics
    setDataImportExpanded(false);
  };

  /**
   * Handle day/night toggle
   */
  const handleDayNightToggle = () => {
    setDayNightEnabled(!dayNightEnabled);
  };

  /**
   * Handle HTML export
   */
  const handleExportHTML = () => {
    if (!metricsResult || !startDate || !endDate) return;
    
    // Format dates to YYYY/MM/DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };
    
    downloadHTML({
      metrics: metricsResult.metrics,
      agpData: metricsResult.agp,
      events: metricsResult.events,
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
   * Load saved upload (async!)
   */
  const handleLoadSavedUpload = async (id) => {
    try {
      const upload = await loadUpload(id);
      if (!upload) return;

      // Load CSV data (already parsed, skip parsing)
      loadParsedData(upload.csvData, upload.dateRange);

      // Load ProTime data if present
      if (upload.proTimeData) {
        setWorkdays(upload.proTimeData);
      } else {
        setWorkdays(null);
      }

      // Keep data import section OPEN so user can see what's loaded
      setDataImportExpanded(true);

      // Auto-select last 14 days (same logic as useEffect)
      const end = new Date(upload.dateRange.max);
      const start = new Date(end);
      start.setDate(start.getDate() - 13); // 14 days = today - 13 days
      
      // If data range is shorter than 14 days, use full range
      const actualStart = start < upload.dateRange.min ? upload.dateRange.min : start;
      
      setStartDate(actualStart);
      setEndDate(end);

      // Show success toast
      setLoadToast(`✅ Loaded: ${upload.name}`);
      setTimeout(() => setLoadToast(null), 3000); // Auto-hide after 3s
      
    } catch (err) {
      console.error('Failed to load upload:', err);
      alert(`Failed to load upload: ${err.message}`);
    }
  };

  /**
   * Handle day profiles modal open
   * Day profiles are now generated by useDayProfiles hook,
   * so this just validates data and opens the modal
   * 
   * Works with both V2 (csvData) and V3 (masterDataset) modes
   */
  const handleDayProfilesOpen = () => {
    if (!activeReadings || activeReadings.length === 0) {
      alert('Load data first.');
      return;
    }

    if (!dayProfiles || dayProfiles.length === 0) {
      alert('No complete days available for analysis.');
      return;
    }

    setDayProfilesOpen(true);
  };

  /**
   * Handle data management deletion
   * Deletes selected data types within specified date range
   * Refreshes V3 dataset and workdays after deletion
   */
  const handleDataManagementDelete = async (deleteConfig) => {
    const { dateRange, deleteTypes } = deleteConfig;
    
    console.log('[DataManagement] Delete requested:', {
      range: `${dateRange.start.toISOString()} - ${dateRange.end.toISOString()}`,
      types: deleteTypes
    });

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
        setWorkdays(newWorkdays || new Set());
      }
      
      // Delete cartridge events
      if (deleteTypes.cartridge) {
        const { deleteCartridgeChangesInRange } = await import('../storage/eventStorage');
        deletedCounts.cartridge = await deleteCartridgeChangesInRange(dateRange.start, dateRange.end);
      }
      
      // Force reload V3 data to update UI
      masterDataset.refresh();
      
      console.log('[DataManagement] ✅ Deletion complete:', deletedCounts);
      return deletedCounts;
      
    } catch (err) {
      console.error('[DataManagement] ❌ Delete failed:', err);
      throw err;
    }
  };

  // ============================================
  // RENDER: Main UI
  // ============================================

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Debug Panel - Hidden debug tools (top-right bug icon) */}
      <DebugPanel />
      
      <div className="app-container">
        
        {/* Migration Notice (if applicable) */}
        {migrationStatus && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: 'var(--color-green)',
            color: 'var(--color-black)',
            fontWeight: 600,
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            ✅ {migrationStatus} - Now using IndexedDB for unlimited storage!
          </div>
        )}

        {/* Load Success Toast */}
        {loadToast && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: 'var(--color-green)',
            color: 'var(--color-black)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textAlign: 'center',
            border: '3px solid var(--color-black)',
            animation: 'slideDown 200ms ease-out'
          }}>
            {loadToast}
          </div>
        )}
        
        {/* Header - Golden Ratio Sidebar Layout */}
        <header className="section">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.618fr', // Golden ratio
            border: '3px solid var(--ink)',
            overflow: 'hidden'
          }}>
            {/* LEFT: Sidebar - Ink background */}
            <div style={{
              background: 'var(--ink)',
              color: 'var(--paper)',
              padding: '2rem',
              borderRight: '3px solid var(--ink)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              {/* Version + Title */}
              <div>
                <h1 style={{ 
                  letterSpacing: '0.2em', 
                  fontWeight: 700, 
                  fontSize: '1.75rem',
                  marginBottom: '0.25rem',
                  color: 'var(--paper)'
                }}>
                  AGP+
                </h1>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--paper)',
                  fontWeight: 600,
                  opacity: 0.9
                }}>
                  V3.0
                </div>
              </div>

              {/* Patient Button - Compact */}
              <button
                onClick={() => setPatientInfoOpen(true)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'var(--color-green)',
                  border: '2px solid var(--paper)',
                  color: 'var(--paper)',
                  cursor: 'pointer',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--paper)';
                  e.target.style.color = 'var(--color-green)';
                  e.target.style.borderColor = 'var(--color-green)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--color-green)';
                  e.target.style.color = 'var(--paper)';
                  e.target.style.borderColor = 'var(--paper)';
                }}
              >
                <User size={12} />
                PATIËNT
              </button>

              {/* Patient Info Display */}
              {patientInfo && patientInfo.name && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--paper)',
                  opacity: 0.8,
                  lineHeight: 1.6
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    {patientInfo.name}
                  </div>
                  {patientInfo.dob && (
                    <div>DOB: {new Date(patientInfo.dob).toLocaleDateString('nl-NL')}</div>
                  )}
                  {patientInfo.cgm && (
                    <div>CGM: {patientInfo.cgm}</div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Main info area - Paper background */}
            <div style={{
              background: 'var(--paper)',
              color: 'var(--ink)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0' // No gap, divider handles spacing
            }}>
              {/* Top Section: Dataset overview + Cleanup button */}
              <div style={{ 
                paddingBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem'
                  }}>
                    Dataset
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '0.5rem'
                  }}>
                    {/* Status light */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid var(--ink)',
                      background: dataStatus.lightColor === 'green' 
                        ? 'var(--color-green)' 
                        : dataStatus.lightColor === 'yellow' 
                        ? 'var(--color-yellow)' 
                        : 'var(--color-red)',
                      flexShrink: 0
                    }} />
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: '1.125rem',
                      letterSpacing: '0.05em' 
                    }}>
                      {dataStatus.hasData ? (
                        <>{dataStatus.readingCount.toLocaleString()} READINGS</>
                      ) : (
                        <>NO DATA</>
                      )}
                    </div>
                  </div>
                  {dataStatus.hasData && (
                    <div style={{ 
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.05em',
                      paddingLeft: '32px'
                    }}>
                      {dataStatus.dateRangeFormatted}
                    </div>
                  )}
                </div>
                
                {/* CLEANUP button */}
                <button
                  onClick={() => setDataManagementOpen(true)}
                  disabled={!dataStatus.hasData}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '3px solid var(--ink)',
                    background: dataStatus.hasData ? 'var(--color-red)' : 'transparent',
                    color: dataStatus.hasData ? 'var(--color-white)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: dataStatus.hasData ? 'pointer' : 'not-allowed',
                    opacity: dataStatus.hasData ? 1 : 0.4,
                    whiteSpace: 'nowrap'
                  }}
                  title={!dataStatus.hasData ? "Load data first" : "Clean up database"}
                >
                  🗑️ CLEANUP
                </button>
              </div>

              {/* Divider - Double line */}
              <div style={{
                borderTop: '3px solid var(--ink)',
                borderBottom: '3px solid var(--ink)',
                height: '2px',
                margin: '0'
              }} />

              {/* Bottom Section: Analysis period */}
              {startDate && endDate ? (
                <div style={{ paddingTop: '1.5rem' }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem'
                  }}>
                    Analysis
                  </div>
                  <div style={{ 
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                  }}>
                    {startDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    <span style={{ color: 'var(--color-orange)', margin: '0 0.5rem' }}>→</span>
                    {endDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <strong>{Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1}</strong> dagen
                    {activeReadings && <> • <strong>{activeReadings.length.toLocaleString()}</strong> readings</>}
                    {workdays && <> • <strong>{workdays.size}</strong> ProTime workdays</>}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  paddingTop: '1.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic'
                }}>
                  No analysis period selected
                </div>
              )}
            </div>
          </div>

          {/* Data Status Warning (Red/Yellow) - Below header when needed */}
          {dataStatus.actionRequired && (
            <div style={{
              padding: '0.75rem',
              marginTop: '1rem',
              background: dataStatus.lightColor === 'red' 
                ? 'var(--color-red)' 
                : 'var(--color-yellow)',
              border: '3px solid var(--color-black)',
              color: 'var(--color-black)',
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              textAlign: 'center'
            }}>
              ⚠️ {dataStatus.message}
            </div>
          )}
        </header>

        {/* V3 Migration Banner - Auto-detects and triggers migration */}
        <MigrationBanner />

        {/* V3 Date Range Filter - ENABLED in Phase 3.5
            
            Solution implemented: V3 readings are transformed to V2 CSV format in 
            useMasterDataset hook before returning to AGPGenerator. This maintains 
            backwards compatibility with all existing calculation engines.
            
            Transform happens in useMasterDataset.js:
            - V3: { timestamp: Date, glucose: 120 }
            - V2: { Date: "2025/07/01", Time: "00:05:00", "Sensor Glucose (mg/dL)": 120 }
        */}
        {useV3Mode && masterDataset.stats && (
          <section className="section">
            <DateRangeFilter
              datasetRange={masterDataset.stats.dateRange}
              selectedRange={selectedDateRange}
              onRangeChange={handleDateRangeChange}
            />
          </section>
        )}

        {/* Control Buttons: IMPORT - DAGPROFIELEN - SENSOR HISTORY - EXPORT */}
        <section className="section">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            
            {/* 1. IMPORT Button (Collapsible) */}
            <button
              onClick={() => {
                console.log('🔴 IMPORT CLICKED!', dataImportExpanded);
                setDataImportExpanded(!dataImportExpanded);
              }}
              style={{
                background: dataImportExpanded ? 'var(--color-black)' : 'var(--bg-secondary)',
                border: '3px solid var(--border-primary)',
                color: dataImportExpanded ? 'var(--color-white)' : 'var(--text-primary)',
                cursor: 'pointer',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '100px'
              }}
              title="Upload and import data"
            >
              <h2 style={{ 
                fontSize: '0.875rem',
                fontWeight: 700, 
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 0
              }}>
                {dataImportExpanded ? '▼' : '▶'} IMPORT
              </h2>
              <span style={{ 
                fontSize: '0.625rem',
                color: dataImportExpanded ? 'var(--color-white)' : 'var(--text-secondary)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Data Sources
              </span>
              {csvData && (
                <span style={{ 
                  fontSize: '1.25rem',
                  color: 'var(--color-green)',
                  marginTop: '0.25rem'
                }}>
                  ✓
                </span>
              )}
            </button>

            {/* 2. DAGPROFIELEN Button (Direct Action) */}
            <button
              onClick={handleDayProfilesOpen}
              disabled={!activeReadings || activeReadings.length === 0}
              style={{
                background: activeReadings && activeReadings.length > 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                border: '3px solid var(--border-primary)',
                cursor: activeReadings && activeReadings.length > 0 ? 'pointer' : 'not-allowed',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '100px',
                opacity: activeReadings && activeReadings.length > 0 ? 1 : 0.5
              }}
              title={!activeReadings || activeReadings.length === 0 ? "Load data first" : "View last 7 day profiles"}
            >
              <h2 style={{ 
                fontSize: '0.875rem',
                fontWeight: 700, 
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                marginBottom: 0
              }}>
                DAGPROFIELEN
              </h2>
              <span style={{ 
                fontSize: '0.625rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Last 7 Days
              </span>
            </button>

            {/* 3. SENSOR HISTORY Button (Direct Action) */}
            <button
              onClick={() => setSensorHistoryOpen(true)}
              disabled={sensorsLoading || sensorsError || !sensors || sensors.length === 0}
              style={{
                background: sensors && sensors.length > 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                border: '3px solid var(--border-primary)',
                cursor: sensors && sensors.length > 0 ? 'pointer' : 'not-allowed',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '100px',
                opacity: sensors && sensors.length > 0 ? 1 : 0.5
              }}
              title={sensorsLoading ? "Loading sensor database..." : 
                     sensorsError ? "Failed to load sensor database" :
                     !sensors || sensors.length === 0 ? "No sensor data available" : 
                     "View complete sensor usage history"}
            >
              <h2 style={{ 
                fontSize: '0.875rem',
                fontWeight: 700, 
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                marginBottom: 0
              }}>
                SENSOR HISTORY
              </h2>
              <span style={{ 
                fontSize: '0.625rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                {sensorsLoading ? 'Loading...' : 
                 sensors && sensors.length > 0 ? `${sensors.length} Sensors` : 
                 'No Data'}
              </span>
            </button>

            {/* 4. EXPORT Button (Collapsible) */}
            <button
              onClick={() => {
                console.log('🔵 EXPORT CLICKED!', dataExportExpanded);
                setDataExportExpanded(!dataExportExpanded);
              }}
              disabled={!metricsResult || !startDate || !endDate}
              style={{
                background: dataExportExpanded ? 'var(--color-black)' : (metricsResult && startDate && endDate ? 'var(--bg-secondary)' : 'var(--bg-primary)'),
                border: '3px solid var(--border-primary)',
                color: dataExportExpanded ? 'var(--color-white)' : (metricsResult && startDate && endDate ? 'var(--text-primary)' : 'var(--text-secondary)'),
                cursor: metricsResult && startDate && endDate ? 'pointer' : 'not-allowed',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '100px',
                opacity: metricsResult && startDate && endDate ? 1 : 0.5
              }}
              title={!metricsResult ? "Generate metrics first" : "Export options"}
            >
              <h2 style={{ 
                fontSize: '0.875rem',
                fontWeight: 700, 
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 0
              }}>
                {dataExportExpanded ? '▼' : '▶'} EXPORT
              </h2>
              <span style={{ 
                fontSize: '0.625rem',
                color: dataExportExpanded ? 'var(--color-white)' : (metricsResult && startDate && endDate ? 'var(--text-secondary)' : 'var(--text-secondary)'),
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Reports & Data
              </span>
            </button>
            
          </div>

          {/* IMPORT Expanded Content */}
          {dataImportExpanded && (
            <div className="mb-4" style={{ 
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-primary)',
              borderRadius: '4px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              {/* Sub-buttons for import options */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <button
                  onClick={() => document.getElementById('csv-upload-input')?.click()}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '2px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  title="Upload CareLink CSV"
                >
                  📄 Upload CSV
                  {csvData && <span style={{ color: 'var(--color-green)', fontSize: '1rem' }}>✓</span>}
                </button>

                <div>
                  <SensorImport />
                </div>

                <button
                  onClick={() => document.getElementById('protime-upload-input')?.click()}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '2px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  title="Upload ProTime PDF for workday analysis"
                >
                  📋 ProTime PDFs
                  {workdays && <span style={{ color: 'var(--color-green)', fontSize: '1rem' }}>✓</span>}
                </button>
              </div>

              {/* Hidden file inputs for Upload CSV and ProTime */}
              <input
                id="csv-upload-input"
                type="file"
                accept=".csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && file.name.endsWith('.csv')) {
                    const text = await file.text();
                    handleCSVLoad(text);
                  }
                  e.target.value = ''; // Reset for re-upload
                }}
                style={{ display: 'none' }}
              />
              
              <input
                id="protime-upload-input"
                type="file"
                accept=".pdf"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    try {
                      const { extractTextFromPDF, extractTextFromMultiplePDFs } = await import('../utils/pdfParser');
                      const text = files.length === 1 
                        ? await extractTextFromPDF(files[0])
                        : await extractTextFromMultiplePDFs(files);
                      handleProTimeLoad(text);
                    } catch (err) {
                      console.error('PDF processing error:', err);
                    }
                  }
                  e.target.value = ''; // Reset for re-upload
                }}
                style={{ display: 'none' }}
              />

              {/* FileUpload component - hidden, just for backwards compat */}
              <div style={{ display: 'none' }}>
                <FileUpload
                  onCSVLoad={handleCSVLoad}
                  onProTimeLoad={handleProTimeLoad}
                  onProTimeDelete={handleProTimeDelete}
                  csvLoaded={!!csvData}
                  proTimeLoaded={!!workdays}
                />
              </div>
              
              {/* CSV Error Display (V2 or V3) - Only show errors */}
              {(csvError || v3UploadError) && (
                <div className="card mt-4" style={{ 
                  background: 'rgba(220, 38, 38, 0.1)', 
                  color: 'var(--color-red)',
                  border: '2px solid var(--color-red)',
                  padding: '1rem'
                }}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-red)' }} />
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        CSV Import Error
                      </p>
                      <p style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                        {csvError || v3UploadError}
                      </p>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                        Please ensure you're uploading a valid CareLink CSV export.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Uploads List - REMOVED for clean UI */}
              {/* User can access via localStorage if needed */}
            </div>
          )}

          {/* EXPORT Expanded Content */}
          {dataExportExpanded && metricsResult && startDate && endDate && (
            <div className="mb-4" style={{ 
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-primary)',
              borderRadius: '4px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              {/* Sub-buttons for export options */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem'
              }}>
                <button
                  onClick={handleExportHTML}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '2px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }}
                  title="Export AGP+ profile as HTML"
                >
                  📊 AGP+ Profile (HTML)
                </button>

                <button
                  onClick={() => {
                    if (dayProfiles && dayProfiles.length > 0) {
                      downloadDayProfilesHTML(dayProfiles, patientInfo);
                    } else {
                      alert('No day profiles available');
                    }
                  }}
                  disabled={!dayProfiles || dayProfiles.length === 0}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '2px solid var(--border-primary)',
                    color: dayProfiles && dayProfiles.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: dayProfiles && dayProfiles.length > 0 ? 'pointer' : 'not-allowed',
                    padding: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    opacity: dayProfiles && dayProfiles.length > 0 ? 1 : 0.5
                  }}
                  title="Export day profiles as HTML"
                >
                  📅 Day Profiles (HTML)
                </button>

                <button
                  onClick={async () => {
                    const result = await exportAndDownload();
                    if (result.success) {
                      alert(`✅ Exported ${result.recordCount} readings to ${result.filename}`);
                    } else {
                      alert(`❌ Export failed: ${result.error}`);
                    }
                  }}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '2px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }}
                  title="Export complete IndexedDB dataset as JSON"
                >
                  💾 Database (JSON)
                </button>

                <button
                  onClick={() => alert('Sensor database export coming soon')}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '2px solid var(--border-primary)',
                    color: 'var(--text-secondary)',
                    cursor: 'not-allowed',
                    padding: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    opacity: 0.5
                  }}
                  disabled
                  title="Coming soon"
                >
                  💾 Sensor Database (CSV)
                </button>

                <button
                  onClick={() => {
                    window.open('/Users/jomostert/Documents/Projects/Sensoren/sensor_database_brutalist.html', '_blank');
                  }}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '2px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }}
                  title="View sensor history database"
                >
                  🔍 View Sensor History →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Main Content - Show when data loaded (v2 or v3) and period selected */}
        {((csvData && dateRange) || useV3Mode) && startDate && endDate && metricsResult && (
          <>
                {/* 1. AGP CHART - Visual Overview First */}
                <section className="section">
                  <AGPChart
                    agpData={metricsResult.agp}
                    events={metricsResult.events}
                    metrics={metricsResult.metrics}
                    comparison={comparisonData?.comparisonAGP || null}
                  />
                </section>

                {/* 2. HERO METRICS - TIR, Mean, CV, GMI + All Secondary */}
                <section className="section">
                  <MetricsDisplay
                    metrics={metricsResult.metrics}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </section>

                {/* 3. DAY/NIGHT SPLIT */}
                <section className="section">
                  <DayNightSplit
                    dayMetrics={metricsResult.dayMetrics}
                    nightMetrics={metricsResult.nightMetrics}
                    enabled={dayNightEnabled}
                    onToggle={handleDayNightToggle}
                  />
                </section>

                {/* 4. WORKDAY SPLIT - Only show when ProTime loaded */}
                {workdays && metricsResult.workdayMetrics && metricsResult.restdayMetrics && (
                  <section className="section">
                    <WorkdaySplit
                      workdayMetrics={metricsResult.workdayMetrics}
                      restdayMetrics={metricsResult.restdayMetrics}
                      workdays={workdays}
                      startDate={startDate}
                      endDate={endDate}
                    />
                  </section>
                )}

                {/* 5. PERIOD COMPARISON - Last */}
                {comparisonData && (
                  <section className="section">
                    <ComparisonView
                      currentMetrics={metricsResult.metrics}
                      previousMetrics={comparisonData.comparison}
                      startDate={startDate}
                      endDate={endDate}
                      prevStart={comparisonData.prevStart}
                      prevEnd={comparisonData.prevEnd}
                    />
                  </section>
                )}
              </>
        )}

        {/* Patient Info Modal */}
        {patientInfoOpen && (
          ReactDOM.createPortal(
            <PatientInfo 
              isModal={true}
              onClose={() => setPatientInfoOpen(false)} 
            />,
            document.body
          )
        )}

        {/* Day Profiles Modal - Portal */}
        {dayProfilesOpen && ReactDOM.createPortal(
          <DayProfilesModal 
            isOpen={dayProfilesOpen}
            onClose={() => setDayProfilesOpen(false)}
            dayProfiles={dayProfiles}
            patientInfo={patientInfo}
          />,
          document.body
        )}

        {/* Sensor History Modal - Portal */}
        {sensorHistoryOpen && ReactDOM.createPortal(
          <SensorHistoryModal 
            isOpen={sensorHistoryOpen}
            onClose={() => setSensorHistoryOpen(false)}
            sensors={sensors}
          />,
          document.body
        )}

        {/* Data Management Modal - Portal */}
        {dataManagementOpen && ReactDOM.createPortal(
          <DataManagementModal 
            onClose={() => setDataManagementOpen(false)}
            onDelete={handleDataManagementDelete}
            currentDataStats={dataStatus}
          />,
          document.body
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>
            AGP+ v3.0 | Built for Medtronic CareLink CSV exports
          </p>
          <p className="mt-2">
            Following{' '}
            <a 
              href="https://diabetesjournals.org/care/issue/48/Supplement_1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ADA Standards of Care in Diabetes—2025
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

/**
 * EmptyCSVState - Message shown when no CSV is loaded
 */
function EmptyCSVState() {
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Activity className="w-16 h-16 text-gray-600 mx-auto" />
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">
          Welcome to AGP+ v2.1
        </h2>
        
        <p className="text-gray-400 mb-6">
          Get started by uploading your Medtronic CareLink CSV export above.
        </p>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-left">
          <h3 className="font-semibold text-gray-200 mb-3">
            How to export from CareLink:
          </h3>
          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
            <li>Log in to CareLink at carelink.minimed.eu</li>
            <li>Go to "Reports" → "Device Data"</li>
            <li>Select date range (minimum 14 days recommended)</li>
            <li>Click "Export" → "CSV"</li>
            <li>Upload the downloaded file above</li>
          </ol>
        </div>

        <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-left">
          <p className="text-sm text-blue-300">
            <strong>💡 Tip:</strong> For best results, export at least 14 days of data. 
            The tool will automatically compare periods if you export 30 or 90 days.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * EmptyPeriodState - Message shown when CSV loaded but no period selected
 */
function EmptyPeriodState() {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-gray-300 mb-3">
          Select an Analysis Period
        </h3>
        
        <p className="text-gray-400 mb-4">
          Choose a time period above to view your glucose metrics and AGP analysis.
        </p>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-left">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-300">Available options:</strong>
          </p>
          <ul className="text-sm text-gray-400 mt-2 space-y-1 list-disc list-inside">
            <li><strong>14 days:</strong> Minimum recommended period</li>
            <li><strong>30 days:</strong> Standard monthly analysis</li>
            <li><strong>90 days:</strong> Quarterly review</li>
            <li><strong>Custom:</strong> Any date range within your data</li>
          </ul>
        </div>

        <div className="mt-4 bg-blue-900/20 border border-blue-700 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            💡 Selecting 14, 30, or 90 days will automatically enable period comparison 
            if you have enough historical data.
          </p>
        </div>
      </div>
    </div>
  );
}
