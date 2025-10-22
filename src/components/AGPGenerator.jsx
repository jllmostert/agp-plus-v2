import React, { useState, useEffect } from 'react';
import { Activity, Download, ChevronDown, AlertCircle, Save } from 'lucide-react';

// Custom hooks
import { useCSVData } from '../hooks/useCSVData';
import { useMetrics } from '../hooks/useMetrics';
import { useComparison } from '../hooks/useComparison';
import { useUploadStorage } from '../hooks/useUploadStorage';

// Core utilities
import { parseProTime } from '../core/parsers';
import { downloadHTML } from '../core/html-exporter';

// UI Components
import FileUpload from './FileUpload';
import PeriodSelector from './PeriodSelector';
import MetricsDisplay from './MetricsDisplay';
import AGPChart from './AGPChart';
import ComparisonView from './ComparisonView';
import DayNightSplit from './DayNightSplit';
import WorkdaySplit from './WorkdaySplit';
import SavedUploadsList from './SavedUploadsList';

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
  
  const { csvData, dateRange, loadCSV, loadParsedData, error: csvError } = useCSVData();
  
  // Upload storage management
  const {
    savedUploads,
    activeUploadId,
    storageInfo,
    saveUpload,
    loadUpload,
    toggleLock,
    deleteUpload,
    renameUpload
  } = useUploadStorage();

  // ============================================
  // STATE: Period Selection
  // ============================================
  
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // ============================================
  // STATE: Optional Features
  // ============================================
  
  const [workdays, setWorkdays] = useState(null); // Set of workday date strings
  const [dayNightEnabled, setDayNightEnabled] = useState(false);
  const [dataImportExpanded, setDataImportExpanded] = useState(true); // Collapsible data import

  // ============================================
  // CALCULATED DATA: Metrics & Comparison
  // ============================================
  
  // Calculate metrics for current period
  const metricsResult = useMetrics(csvData, startDate, endDate, workdays);
  
  // Auto-calculate comparison for preset periods
  const comparisonData = useComparison(csvData, startDate, endDate, dateRange);

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
   * Handle CSV file upload
   */
  const handleCSVLoad = (text) => {
    loadCSV(text);
    
    // Reset period selection when new CSV is loaded
    setStartDate(null);
    setEndDate(null);
  };

  /**
   * Handle ProTime data import (PDF text or JSON)
   */
  const handleProTimeLoad = (text) => {
    try {
      const workdayDates = parseProTime(text);
      
      if (!workdayDates || workdayDates.length === 0) {
        console.error('No workdays found in ProTime data');
        return;
      }

      // Convert array to Set for fast lookups
      const workdaySet = new Set(workdayDates);
      setWorkdays(workdaySet);
      
    } catch (err) {
      console.error('ProTime parsing failed:', err);
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
      } : null
    });
  };

  // ============================================
  // EVENT HANDLERS: Upload Storage
  // ============================================

  /**
   * Save current upload to storage
   */
  const handleSaveUpload = () => {
    if (!csvData || !dateRange) {
      alert('No data to save. Load CSV first.');
      return;
    }

    try {
      saveUpload({
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
   * Load saved upload
   */
  const handleLoadSavedUpload = (id) => {
    try {
      const upload = loadUpload(id);
      if (!upload) return;

      // Load CSV data (already parsed, skip parsing)
      loadParsedData(upload.csvData, upload.dateRange);

      // Load ProTime data if present
      if (upload.proTimeData) {
        setWorkdays(upload.proTimeData);
      } else {
        setWorkdays(null);
      }

      // Reset period selection
      setStartDate(null);
      setEndDate(null);
    } catch (err) {
      alert(`Failed to load upload: ${err.message}`);
    }
  };

  // ============================================
  // RENDER: Main UI
  // ============================================

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="app-container">
        
        {/* Header */}
        <header className="section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Activity className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
              <div>
                <h1 style={{ letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.25rem' }}>
                  AGP+ V2.1
                </h1>
                {/* Active Period Display */}
                {startDate && endDate && (
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--color-green)',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    fontFamily: 'monospace'
                  }}>
                    {startDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' → '}
                    {endDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    <span style={{ 
                      marginLeft: '0.5rem', 
                      color: 'var(--text-secondary)',
                      fontWeight: 400
                    }}>
                      ({Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1} dagen)
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)', 
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Ambulatory Glucose Profile Generator
          </p>
        </header>

        {/* Top Controls Row: Import | Export | Period - All side by side */}
        <section className="section">
          {/* Row 1: 3-column grid - always horizontal */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto auto 1fr',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            
            {/* 1. Data Import Button - Collapsible trigger */}
            <button
              onClick={() => setDataImportExpanded(!dataImportExpanded)}
              className="flex items-center justify-between rounded"
              style={{
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: '0.75rem 1rem',
                minWidth: '140px'
              }}
            >
              <div className="flex items-center gap-3">
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: csvData ? 'var(--color-green)' : 'var(--color-gray)',
                  transition: 'all 0.2s'
                }} />
                <h2 style={{ 
                  fontSize: '0.875rem',
                  fontWeight: 700, 
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  Import
                </h2>
                {csvData && !dataImportExpanded && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.05em'
                  }}>
                    ✓
                  </span>
                )}
              </div>
              <ChevronDown 
                className="w-5 h-5 ml-2"
                style={{
                  transform: dataImportExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                  color: 'var(--text-secondary)'
                }}
              />
            </button>

            {/* 2. Save + Export Buttons - Only when data available */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {csvData && dateRange && (
                <button
                  onClick={handleSaveUpload}
                  className="btn flex items-center gap-2"
                  style={{
                    whiteSpace: 'nowrap',
                    border: '2px solid var(--border-primary)',
                    background: 'var(--bg-secondary)'
                  }}
                  title="Save current upload to storage"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              )}
              
              {metricsResult && startDate && endDate && (
                <button
                  onClick={handleExportHTML}
                  className="btn btn-primary flex items-center gap-2"
                  style={{
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
            </div>

            {/* 3. Period Selector - Takes remaining space */}
            {csvData && dateRange ? (
              <PeriodSelector
                availableDates={dateRange}
                startDate={startDate}
                endDate={endDate}
                onChange={handlePeriodChange}
              />
            ) : <div />}
            
          </div>

          {/* Row 2: Expanded Import Content - full width below */}
          {dataImportExpanded && (
            <div className="mb-4" style={{ 
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-primary)',
              borderRadius: '4px',
              padding: '1rem'
            }}>
              {/* File Upload Section */}
              <FileUpload
                onCSVLoad={handleCSVLoad}
                onProTimeLoad={handleProTimeLoad}
                csvLoaded={!!csvData}
                proTimeLoaded={!!workdays}
              />
              
              {/* CSV Error Display */}
              {csvError && (
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
                        {csvError}
                      </p>
                      <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                        Please ensure you're uploading a valid CareLink CSV export.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Uploads List */}
              {savedUploads.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid var(--border-primary)'
                  }}>
                    Saved Uploads
                  </h3>
                  <SavedUploadsList
                    uploads={savedUploads}
                    activeId={activeUploadId}
                    storageInfo={storageInfo}
                    onLoad={handleLoadSavedUpload}
                    onToggleLock={toggleLock}
                    onDelete={deleteUpload}
                    onRename={renameUpload}
                  />
                </div>
              )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Main Content - Only show when CSV loaded and period selected */}
        {csvData && dateRange && startDate && endDate && metricsResult && (
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

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>
            AGP+ v2.1 | Built for Medtronic CareLink CSV exports
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
