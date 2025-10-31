/**
 * SensorHistoryModal.jsx
 * Full-screen modal showing Guardian 4 sensor usage history
 * 
 * Features:
 * - Overall statistics (total, success rate, avg duration)
 * - HW version breakdown
 * - Lot number performance grid
 * - Filterable + sortable table
 * - Export to HTML/CSV
 * 
 * Design: Brutalist paper/ink theme matching day profiles modal
 */

import React, { useState, useMemo, useEffect } from 'react';
import { debug } from '../utils/debug.js';
import { 
  calculateOverallStats, 
  calculateHWVersionStats,
  calculateLotPerformance,
  filterSensors,
  sortSensors
} from '../core/sensor-history-engine';
import { 
  isSensorLocked, 
  getSensorLockStatus,
  deleteSensorWithLockCheck,
  toggleSensorLock,
  getManualLockStatus,
  initializeManualLocks,
  exportSensorsToJSON,
  validateImportData,
  importSensorsFromJSON,
  getSensorDatabase
} from '../storage/sensorStorage.js';
import { 
  countDeletedSensors, 
  cleanupOldDeletedSensorsDB 
} from '../storage/deletedSensorsDB.js';

export default function SensorHistoryModal({ isOpen, onClose, sensors }) {
  // Initialize manual locks on first render
  useEffect(() => {
    if (isOpen) {
      const result = initializeManualLocks();
      debug.log('[SensorHistoryModal] Manual locks initialized:', result);
    }
  }, [isOpen]);

  // Load deleted sensors count when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDeletedCount();
    }
  }, [isOpen]);

  // Load deleted sensors count
  const loadDeletedCount = async () => {
    try {
      const counts = await countDeletedSensors();
      setDeletedCount(counts);
      debug.log('[SensorHistoryModal] Deleted sensors count:', counts);
    } catch (err) {
      console.error('[SensorHistoryModal] Error loading deleted count:', err);
      setDeletedCount({ totalCount: 0, oldCount: 0, recentCount: 0 });
    }
  };

  // Handle cleanup of old deleted sensors
  const handleCleanupDeleted = async () => {
    if (!deletedCount || deletedCount.oldCount === 0) {
      alert('Geen oude verwijderde sensors om op te ruimen.\n\nAlle sensors zijn jonger dan 90 dagen.');
      return;
    }

    if (confirm(
      `Oude verwijderde sensors opruimen?\n\n` +
      `Dit verwijdert ${deletedCount.oldCount} sensor(s) ouder dan 90 dagen.\n` +
      `${deletedCount.recentCount} recente sensor(s) blijven behouden.\n\n` +
      `⚠️ Deze actie kan niet ongedaan worden gemaakt.`
    )) {
      try {
        const result = await cleanupOldDeletedSensorsDB();
        alert(
          `✓ Opruimen voltooid!\n\n` +
          `${result.removed} oude sensor(s) verwijderd\n` +
          `${result.remaining} sensor(s) behouden`
        );
        // Reload count
        await loadDeletedCount();
      } catch (err) {
        console.error('[SensorHistoryModal] Error during cleanup:', err);
        alert(`âŒ Fout tijdens opruimen: ${err.message}`);
      }
    }
  };

  // Handle export of sensor database
  const handleExport = async () => {
    try {
      const result = await exportSensorsToJSON();
      
      if (!result.success) {
        alert(`âŒ Export mislukt: ${result.error}`);
        return;
      }

      // Create blob and trigger download
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('[SensorHistoryModal] Export successful:', result.filename);
    } catch (err) {
      console.error('[SensorHistoryModal] Export failed:', err);
      alert(`âŒ Export mislukt: ${err.message}`);
    }
  };

  // Handle import file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Read file
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate
      const errors = validateImportData(data);
      if (errors) {
        alert(`âŒ Invalid JSON:\n\n${errors.join('\n')}`);
        setImportFile(null);
        setImportPreview(null);
        return;
      }

      // Set preview
      setImportFile(file);
      setImportPreview(data);

      console.log('[SensorHistoryModal] Import file loaded:', {
        filename: file.name,
        sensors: data.sensors.length,
        deleted: data.deletedSensors.length
      });
    } catch (err) {
      console.error('[SensorHistoryModal] File read error:', err);
      alert(`âŒ Kan bestand niet lezen:\n\n${err.message}`);
      setImportFile(null);
      setImportPreview(null);
    }
  };

  // Handle import confirmation
  const handleImportConfirm = async () => {
    if (!importPreview) return;

    // Confirm REPLACE mode
    if (importOptions.mode === 'replace') {
      // Get actual database count (not filtered list)
      const db = getSensorDatabase();
      const actualCount = db?.sensors?.length || 0;
      
      if (!confirm(
        `⚠️ REPLACE MODE\n\n` +
        `Dit wist alle huidige sensors en vervangt ze met de import.\n\n` +
        `Huidige sensors: ${actualCount}\n` +
        `Import sensors: ${importPreview.sensors.length}\n\n` +
        `Weet je het zeker? Deze actie kan niet ongedaan worden gemaakt.`
      )) {
        return;
      }
    }

    try {
      const result = await importSensorsFromJSON(importPreview, importOptions);

      if (!result.success) {
        alert(`âŒ Import mislukt:\n\n${result.error}`);
        return;
      }

      // Verify import actually wrote data
      const db = getSensorDatabase();
      if (!db || !db.sensors || db.sensors.length === 0) {
        console.error('[SensorHistoryModal] Import reported success but no data found!');
        alert(
          `⚠️ Import anomalie!\n\n` +
          `Import gerapporteerd als succesvol, maar geen data gevonden in database.\n\n` +
          `Dit zou niet moeten gebeuren. Probeer opnieuw of neem contact op.`
        );
        return;
      }

      // Show success
      alert(
        `✅ Import succesvol!\n\n` +
        `Mode: ${result.summary.mode}\n` +
        `Sensors toegevoegd: ${result.summary.sensorsAdded}\n` +
        `Sensors overgeslagen: ${result.summary.sensorsSkipped}\n` +
        `Deleted sensors: ${result.summary.deletedAdded}\n\n` +
        `Pagina wordt ververst...`
      );

      // Reload page to show new data
      window.location.reload();
    } catch (err) {
      console.error('[SensorHistoryModal] Import failed:', err);
      alert(`âŒ Import mislukt:\n\n${err.message}`);
    }
  };

  // Debug: Check what we receive
  debug.log('[SensorHistoryModal] Received sensors:', {
    count: sensors?.length || 0,
    firstSensor: sensors?.[0],
    lastSensor: sensors?.[sensors?.length - 1]
  });

  // Filters state
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    lotNumber: null,
    hwVersion: null,
    successOnly: false,
    failedOnly: false
  });

  // Sort state
  const [sortColumn, setSortColumn] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Refresh trigger for lock/delete operations (avoids page reload)
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Deleted sensors count (for cleanup button)
  const [deletedCount, setDeletedCount] = useState(null);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importOptions, setImportOptions] = useState({
    importDeleted: true,
    importLocks: true,
    mode: 'merge'
  });

  // Add chronological index (1 = oldest = March 2022, 219 = newest)
  // Also merge lock states into sensor objects for consistent rendering
  const sensorsWithIndex = useMemo(() => {
    if (!sensors || sensors.length === 0) return [];
    
    // Sort by start_date ascending (oldest first)
    const sorted = [...sensors].sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateA - dateB; // Ascending: oldest to newest
    });
    
    // Assign index 1, 2, 3, ... chronologically
    // AND merge lock status from localStorage
    const withIndex = sorted.map((sensor, idx) => {
      const lockStatus = getManualLockStatus(sensor.sensor_id, sensor.start_date);
      return {
        ...sensor,
        chronological_index: idx + 1, // 1-based index
        is_manually_locked: lockStatus.isLocked, // Merge lock state
        lock_reason: lockStatus.reason // Include reason for debugging
      };
    });
    
    debug.log('[SensorHistoryModal] Chronological indexing + lock merge:', {
      total: withIndex.length,
      locked: withIndex.filter(s => s.is_manually_locked).length,
      unlocked: withIndex.filter(s => !s.is_manually_locked).length,
      first: { id: withIndex[0]?.chronological_index, date: withIndex[0]?.start_date },
      last: { id: withIndex[withIndex.length - 1]?.chronological_index, date: withIndex[withIndex.length - 1]?.start_date }
    });
    
    return withIndex;
  }, [sensors, refreshKey]); // Re-calculate when sensors or refreshKey changes

  // Calculate stats (memoized for performance)
  const overallStats = useMemo(() => calculateOverallStats(sensorsWithIndex), [sensorsWithIndex]);
  const hwStats = useMemo(() => calculateHWVersionStats(sensorsWithIndex), [sensorsWithIndex]);
  const lotStats = useMemo(() => calculateLotPerformance(sensorsWithIndex), [sensorsWithIndex]);

  // Filtered sensors
  const filteredSensors = useMemo(() => {
    return filterSensors(sensorsWithIndex, filters);
  }, [sensorsWithIndex, filters]);

  // Sorted sensors
  const sortedSensors = useMemo(() => {
    const sorted = sortSensors(filteredSensors, sortColumn, sortDirection);
    debug.log('[SensorHistoryModal] Sorted sensors:', sorted.length);
    return sorted;
  }, [filteredSensors, sortColumn, sortDirection]);

  // Handle sort click
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      lotNumber: null,
      hwVersion: null,
      successOnly: false,
      failedOnly: false
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.97)',
        overflow: 'hidden'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Control buttons - sticky top */}
        <div className="sticky top-0 z-10 flex justify-end gap-4 p-6 bg-black bg-opacity-90">
          <label
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '12px 24px',
              border: '3px solid var(--color-blue)',
              backgroundColor: 'var(--ink)',
              color: 'var(--color-blue)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            ↑ IMPORT
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={handleExport}
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '12px 24px',
              border: '3px solid var(--color-green)',
              backgroundColor: 'var(--ink)',
              color: 'var(--color-green)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            ↓ EXPORT
          </button>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '12px 24px',
              border: '3px solid var(--paper)',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            ← SLUITEN
          </button>
        </div>

        {/* Content container */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px 48px'
        }}>
          {/* Title */}
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'var(--paper)',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: '24px',
            borderBottom: '3px solid var(--paper)',
            paddingBottom: '16px'
          }}>
            GUARDIAN 4 SENSOR HISTORY
          </div>

          {/* Import Preview - shown when file selected */}
          {importPreview && (
            <div style={{
              border: '3px solid var(--color-blue)',
              padding: '24px',
              marginBottom: '24px',
              backgroundColor: 'rgba(0, 123, 255, 0.1)'
            }}>
              <div style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--color-blue)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '16px'
              }}>
                📋 IMPORT PREVIEW
              </div>
              <div style={{
                fontFamily: 'Monaco, monospace',
                fontSize: '14px',
                color: 'var(--paper)',
                lineHeight: '1.8',
                marginBottom: '24px'
              }}>
                <div><strong>File:</strong> {importFile?.name}</div>
                <div><strong>Sensors:</strong> {importPreview.sensors.length}</div>
                <div><strong>Deleted:</strong> {importPreview.deletedSensors.length}</div>
                <div><strong>Export Date:</strong> {new Date(importPreview.exportDate).toLocaleString('nl-NL')}</div>
              </div>

              {/* Import Options */}
              <div style={{
                borderTop: '2px solid var(--color-blue)',
                paddingTop: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'var(--color-blue)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px'
                }}>
                  OPTIES
                </div>

                {/* Checkboxes */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: 'Monaco, monospace',
                    fontSize: '14px',
                    color: 'var(--paper)',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}>
                    <input
                      type="checkbox"
                      checked={importOptions.importDeleted}
                      onChange={(e) => setImportOptions({
                        ...importOptions,
                        importDeleted: e.target.checked
                      })}
                      style={{ marginRight: '8px' }}
                    />
                    Import deleted sensors lijst
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: 'Monaco, monospace',
                    fontSize: '14px',
                    color: 'var(--paper)',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={importOptions.importLocks}
                      onChange={(e) => setImportOptions({
                        ...importOptions,
                        importLocks: e.target.checked
                      })}
                      style={{ marginRight: '8px' }}
                    />
                    Import lock states
                  </label>
                </div>

                {/* Radio buttons for mode */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: 'Monaco, monospace',
                    fontSize: '14px',
                    color: 'var(--paper)',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}>
                    <input
                      type="radio"
                      checked={importOptions.mode === 'merge'}
                      onChange={() => setImportOptions({
                        ...importOptions,
                        mode: 'merge'
                      })}
                      style={{ marginRight: '8px' }}
                    />
                    MERGE (voeg nieuwe toe, behoud bestaande)
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: 'Monaco, monospace',
                    fontSize: '14px',
                    color: 'var(--color-red)',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      checked={importOptions.mode === 'replace'}
                      onChange={() => setImportOptions({
                        ...importOptions,
                        mode: 'replace'
                      })}
                      style={{ marginRight: '8px' }}
                    />
                    REPLACE (wis alles, herstel backup)
                  </label>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleImportConfirm}
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  padding: '12px 24px',
                  border: '3px solid var(--color-blue)',
                  backgroundColor: 'var(--color-blue)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  width: '100%'
                }}
              >
                âœ" BEVESTIG IMPORT
              </button>
            </div>
          )}

          {/* Overall Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Total Sensors */}
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '8px'
              }}>
                TOTAAL SENSORS
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'var(--paper)',
                lineHeight: 1
              }}>
                {overallStats.total}
              </div>
              <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--paper)',
                opacity: 0.7,
                marginTop: '8px'
              }}>
                {overallStats.totalDays} dagen totaal
              </div>
            </div>

            {/* Success Rate */}
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '8px'
              }}>
                SUCCESS RATE
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: overallStats.successRate >= 70 ? 'var(--color-green)' : 'var(--color-orange)',
                lineHeight: 1
              }}>
                {overallStats.successRate}%
              </div>
              <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--paper)',
                opacity: 0.7,
                marginTop: '8px'
              }}>
                {overallStats.successful}/{overallStats.total} sensors
              </div>
            </div>

            {/* Avg Duration */}
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '8px'
              }}>
                GEM. DUUR
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'var(--paper)',
                lineHeight: 1
              }}>
                {overallStats.avgDuration}d
              </div>
              <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--paper)',
                opacity: 0.7,
                marginTop: '8px'
              }}>
                Streefwaarde: 7.0d
              </div>
            </div>

            {/* Failed */}
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '8px'
              }}>
                FAILURES
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: overallStats.failed > 0 ? 'var(--color-red)' : 'var(--paper)',
                lineHeight: 1
              }}>
                {overallStats.failed}
              </div>
              <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--paper)',
                opacity: 0.7,
                marginTop: '8px'
              }}>
                &lt;6 dagen = fail
              </div>
            </div>
          </div>

          {/* HW Version Stats */}
          {hwStats.length > 0 && (
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '16px'
              }}>
                HARDWARE VERSIE PERFORMANCE
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {hwStats.map(hw => (
                  <div key={hw.hwVersion} style={{
                    border: '2px solid var(--paper)',
                    padding: '12px',
                    backgroundColor: 'rgba(227, 224, 220, 0.03)'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--paper)',
                      marginBottom: '8px'
                    }}>
                      {hw.hwVersion}
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: hw.successRate >= 70 ? 'var(--color-green)' : 'var(--color-orange)'
                    }}>
                      {hw.successRate}%
                    </div>
                    <div style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--paper)',
                      opacity: 0.7,
                      marginTop: '4px'
                    }}>
                      {hw.successful}/{hw.total} • {hw.avgDuration}d gem
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lot Number Performance (top 10) */}
          {lotStats.length > 0 && (
            <div style={{
              border: '3px solid var(--paper)',
              padding: '16px',
              backgroundColor: 'rgba(227, 224, 220, 0.05)',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--paper)',
                marginBottom: '16px'
              }}>
                TOP 10 LOTNUMMERS
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '8px'
              }}>
                {lotStats.slice(0, 10).map(lot => (
                  <div key={lot.lotNumber} style={{
                    border: '2px solid var(--paper)',
                    padding: '10px',
                    backgroundColor: 'rgba(227, 224, 220, 0.03)'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--paper)',
                      marginBottom: '6px',
                      fontFamily: 'Monaco, monospace'
                    }}>
                      {lot.lotNumber}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: lot.successRate >= 70 ? 'var(--color-green)' : 
                             lot.successRate >= 50 ? 'var(--color-orange)' : 'var(--color-red)'
                    }}>
                      {lot.successRate}%
                    </div>
                    <div style={{
                      fontSize: '9px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--paper)',
                      opacity: 0.7,
                      marginTop: '4px'
                    }}>
                      {lot.successful}/{lot.total} sensors
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sensors Table */}
          <div style={{
            border: '3px solid var(--paper)',
            backgroundColor: 'rgba(227, 224, 220, 0.05)',
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'Courier New, monospace',
              fontSize: '12px'
            }}>
              <thead style={{
                backgroundColor: 'var(--ink)',
                color: 'var(--paper)'
              }}>
                <tr>
                  <th 
                    onClick={() => handleSort('chronological_index')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    #ID {sortColumn === 'chronological_index' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      borderRight: '1px solid var(--paper)',
                      width: '80px'
                    }}
                  >
                    LOCK
                  </th>
                  <th 
                    onClick={() => handleSort('start_date')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    START {sortColumn === 'start_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('end_date')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    EINDE {sortColumn === 'end_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>

                  <th 
                    onClick={() => handleSort('duration_days')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    DUUR {sortColumn === 'duration_days' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('lot_number')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    LOT {sortColumn === 'lot_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('hw_version')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    HW {sortColumn === 'hw_version' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('success')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--paper)'
                    }}
                  >
                    STATUS {sortColumn === 'success' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      width: '80px'
                    }}
                  >
                    DELETE
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedSensors.map(sensor => (
                  <tr key={sensor.sensor_id} style={{
                    borderBottom: '1px solid var(--grid-line)'
                  }}>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: 'var(--paper)',
                      fontWeight: 'bold'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>#{sensor.chronological_index}</span>
                        <span 
                          className={`
                            px-2 py-1 text-xs uppercase font-mono
                            ${sensor.storageSource === 'localStorage'
                              ? 'bg-green-900 text-green-100 border border-green-500'
                              : 'bg-gray-800 text-gray-400 border border-gray-600'}
                          `}
                          style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '2px',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em'
                          }}
                          title={sensor.storageSource === 'localStorage' 
                            ? 'Recent sensor - can be edited/deleted' 
                            : 'Historical sensor - read-only from database'}
                        >
                          {sensor.storageSource === 'localStorage' ? 'RECENT' : 'HISTORICAL'}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      textAlign: 'center',
                      fontSize: '18px',
                      cursor: sensor.isEditable ? 'pointer' : 'not-allowed',
                      backgroundColor: sensor.is_manually_locked 
                        ? 'rgba(255, 0, 0, 0.1)' 
                        : 'rgba(0, 255, 0, 0.05)',
                      opacity: sensor.isEditable ? 1 : 0.5
                    }}
                    onClick={sensor.isEditable ? () => {
                      const result = toggleSensorLock(sensor.sensor_id);
                      if (result.success) {
                        // Trigger re-render without page reload
                        setRefreshKey(prev => prev + 1);
                      } else {
                        // Show enhanced error message with detail if available
                        if (result.detail) {
                          alert(`âŒ ${result.message}\n\n${result.detail}`);
                        } else {
                          alert(`âŒ Fout: ${result.message}`);
                        }
                      }
                    } : undefined}
                    title={
                      !sensor.isEditable 
                        ? 'Read-only sensor (historical data from database)'
                        : sensor.is_manually_locked
                          ? 'Locked - Click to unlock (allows deletion)'
                          : 'Unlocked - Click to lock (prevents deletion)'
                    }
                    >
                      {sensor.is_manually_locked ? '🔒' : '🔓'}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: 'var(--paper)'
                    }}>
                      {sensor.start_date ? new Date(sensor.start_date).toLocaleString('nl-NL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: 'var(--paper)'
                    }}>
                      {sensor.end_date ? new Date(sensor.end_date).toLocaleString('nl-NL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: (() => {
                        // Recalculate duration from timestamps (don't trust DB)
                        if (!sensor.start_date || !sensor.end_date) return 'var(--paper)';
                        const startMs = new Date(sensor.start_date).getTime();
                        const endMs = new Date(sensor.end_date).getTime();
                        const durationDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
                        
                        return durationDays >= 6.75 ? 'var(--color-green)' :
                               durationDays >= 6 ? 'var(--color-orange)' :
                               'var(--color-red)';
                      })(),
                      fontWeight: 'bold'
                    }}>
                      {(() => {
                        // Recalculate duration from timestamps (don't trust DB)
                        if (!sensor.start_date || !sensor.end_date) return '0.0d';
                        const startMs = new Date(sensor.start_date).getTime();
                        const endMs = new Date(sensor.end_date).getTime();
                        const durationDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
                        return durationDays.toFixed(1) + 'd';
                      })()}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: 'var(--paper)',
                      fontFamily: 'Monaco, monospace',
                      fontWeight: 'bold'
                    }}>
                      {sensor.lot_number || '-'}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid var(--grid-line)',
                      color: 'var(--paper)',
                      fontWeight: 'bold'
                    }}>
                      {sensor.hw_version || '-'}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      color: 'var(--paper)'
                    }}>
                      {(() => {
                        // Recalculate duration from timestamps (don't trust DB)
                        let days = 0;
                        if (sensor.start_date && sensor.end_date) {
                          const startMs = new Date(sensor.start_date).getTime();
                          const endMs = new Date(sensor.end_date).getTime();
                          days = (endMs - startMs) / (1000 * 60 * 60 * 24);
                        }
                        
                        let statusColor, statusBg, statusText;
                        
                        if (days >= 6.75) {
                          statusColor = 'var(--color-green)';
                          statusBg = 'var(--color-green)';
                          statusText = '✓ OK';
                        } else if (days >= 6.0) {
                          statusColor = 'var(--color-orange)';
                          statusBg = 'var(--color-orange)';
                          statusText = '⚠ SHORT';
                        } else {
                          statusColor = 'var(--color-red)';
                          statusBg = 'var(--color-red)';
                          statusText = '✗ FAIL';
                        }
                        
                        return (
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            border: `2px solid ${statusColor}`,
                            backgroundColor: statusBg,
                            color: 'var(--paper)'
                          }}>
                            {statusText}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      textAlign: 'center'
                    }}>
                      <button
                        onClick={async () => {
                          // Debug logging
                          debug.log('[DELETE] Sensor data:', {
                            sensor_id: sensor.sensor_id,
                            chronological_index: sensor.chronological_index,
                            start_date: sensor.start_date,
                            is_manually_locked: sensor.is_manually_locked
                          });
                          
                          if (sensor.is_manually_locked) {
                            // Locked - cannot delete
                            alert(
                              `🔒 SENSOR VERGRENDELD\n\n` +
                              `Deze sensor kan niet verwijderd worden.\n\n` +
                              `Klik eerst op het slotje (🔒) om te ontgrendelen,\n` +
                              `daarna kun je verwijderen.`
                            );
                            return;
                          }
                          
                          // Unlocked - allow delete
                          if (confirm(
                            `Sensor #${sensor.chronological_index} verwijderen?\n\n` +
                            `Start: ${new Date(sensor.start_date).toLocaleDateString('nl-NL')}\n\n` +
                            `⚠️ Deze actie kan niet ongedaan worden gemaakt.`
                          )) {
                            debug.log('[DELETE] Calling deleteSensorWithLockCheck with ID:', sensor.sensor_id);
                            const result = await deleteSensorWithLockCheck(sensor.sensor_id);
                            debug.log('[DELETE] Result:', result);
                            
                            if (result.success) {
                              alert(`✓ Sensor verwijderd!`);
                              // Trigger re-render without page reload
                              setRefreshKey(prev => prev + 1);
                            } else {
                              // Show enhanced error message with detail if available
                              if (result.detail) {
                                alert(`âŒ ${result.message}\n\n${result.detail}`);
                              } else {
                                alert(`âŒ Fout: ${result.message}`);
                              }
                            }
                          }
                        }}
                        disabled={sensor.is_manually_locked}
                        style={{
                          padding: '6px 12px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          border: '2px solid var(--color-red)',
                          backgroundColor: sensor.is_manually_locked ? 'rgba(150, 150, 150, 0.3)' : 'transparent',
                          color: sensor.is_manually_locked ? 'rgba(227, 224, 220, 0.5)' : 'var(--color-red)',
                          cursor: sensor.is_manually_locked ? 'not-allowed' : 'pointer',
                          fontFamily: 'Monaco, monospace'
                        }}
                      >
                        {sensor.is_manually_locked ? '🔒 DEL' : '✗ DEL'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
