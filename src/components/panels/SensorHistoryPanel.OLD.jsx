import React, { useState, useMemo, useEffect } from 'react';
import { debug } from '../../utils/debug.js';
import SensorRow from '../SensorRow.jsx';
import { 
  calculateOverallStats, 
  calculateHWVersionStats,
  calculateLotPerformance,
  filterSensors,
  sortSensors
} from '../../core/sensor-history-engine';

// V4 STORAGE - Clean implementation
import * as sensorStorage from '../../storage/sensorStorage.js';

export default function SensorHistoryPanel({ isOpen, onClose, onOpenStock }) {
  // Simple wrappers for compatibility with existing UI code
  const getAllSensorsV4 = () => {
    const sensors = sensorStorage.getAllSensors().map(s => ({
      ...s,
      status: s.statusInfo.status,
      success: s.end_date && s.statusInfo.status === 'success',
      chronological_index: s.sequence,
      is_manually_locked: s.is_locked
    }));
    
    // DEBUG: Check sensor #222
    const s222 = sensors.find(s => s.id === 'sensor_1762231226000');
    if (s222) {
      console.log('[getAllSensorsV4] Sensor #222 mapped:', {
        id: s222.id,
        end_date: s222.end_date,
        statusInfo: s222.statusInfo,
        status: s222.status,
        success: s222.success
      });
    }
    
    return sensors;
  };

  const toggleLockV4 = (sensorId) => {
    const result = sensorStorage.toggleLock(sensorId);
    return result;
  };

  const deleteSensorV4 = (sensorId) => {
    const sensor = sensorStorage.getSensorById(sensorId);
    if (!sensor) return { success: false, error: 'Sensor not found' };
    if (sensor.is_locked) return { success: false, error: 'Sensor is locked', isLocked: true };
    
    return sensorStorage.deleteSensor(sensorId);
  };

  const exportV4 = () => {
    const data = sensorStorage.exportJSON();
    const filename = `agp-sensors-${new Date().toISOString().split('T')[0]}.json`;
    return { success: true, data, filename };
  };

  const importV4 = (data) => {
    const result = sensorStorage.importJSON(data);
    if (!result.success) return result;
    return {
      success: true,
      imported: data.sensors.length,
      updated: 0,
      skipped: 0
    };
  };

  const getAllBatchesV4 = () => sensorStorage.getAllBatches();

  const getAssignmentV4 = (sensorId) => {
    const sensor = sensorStorage.getSensorById(sensorId);
    if (!sensor || !sensor.batch_id) return null;
    return {
      assignment_id: `ASSIGN-${sensorId}`,
      sensor_id: sensorId,
      batch_id: sensor.batch_id
    };
  };

  const assignBatchV4 = (sensorId, batchId) => {
    return sensorStorage.assignBatch(sensorId, batchId);
  };

  const unassignV4 = (sensorId) => {
    return sensorStorage.assignBatch(sensorId, null);
  };

  // Aliases for compatibility with existing code
  const getAssignmentForSensor = getAssignmentV4;
  const getAllBatches = getAllBatchesV4;
  const toggleSensorLock = toggleLockV4;

  const validateImportData = (data) => {
    if (!data.version) return ['Missing version field'];
    if (!Array.isArray(data.sensors)) return ['sensors must be an array'];
    if (!Array.isArray(data.batches)) return ['batches must be an array'];
    return null; // Valid
  };

  const importSensorsFromJSON = (data, options) => {
    return importV4(data);
  };

  const getSensorDatabase = () => ({
    sensors: getAllSensorsV4(),
    version: '4.0.0'
  });

  // Handle export of sensor database
  const handleExport = async () => {
    try {
      const result = exportV4();
      
      if (!result.success) {
        alert(`❌ Export mislukt: ${result.error}`);
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

      console.log('[SensorHistoryPanel] Export successful:', result.filename);
    } catch (err) {
      console.error('[SensorHistoryPanel] Export failed:', err);
      alert(`❌ Export mislukt: ${err.message}`);
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
        alert(`❌ Invalid JSON:\n\n${errors.join('\n')}`);
        setImportFile(null);
        setImportPreview(null);
        return;
      }

      // Set preview
      setImportFile(file);
      setImportPreview(data);

      console.log('[SensorHistoryPanel] Import file loaded:', {
        filename: file.name,
        sensors: data.sensors.length,
        deleted: data.deletedSensors.length
      });
    } catch (err) {
      console.error('[SensorHistoryPanel] File read error:', err);
      alert(`❌ Kan bestand niet lezen:\n\n${err.message}`);
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
        alert(`❌ Import mislukt:\n\n${result.error}`);
        return;
      }

      // Verify import actually wrote data
      const db = getSensorDatabase();
      if (!db || !db.sensors || db.sensors.length === 0) {
        console.error('[SensorHistoryPanel] Import reported success but no data found!');
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
      console.error('[SensorHistoryPanel] Import failed:', err);
      alert(`❌ Import mislukt:\n\n${err.message}`);
    }
  };

  // Refresh trigger for lock/delete operations (avoids page reload)
  const [refreshKey, setRefreshKey] = useState(0);

  // Load sensors from storage
  const [sensors, setSensors] = useState([]);
  
  useEffect(() => {
    if (isOpen) {
      const loadedSensors = getAllSensorsV4();
      setSensors(loadedSensors);
    }
  }, [isOpen, refreshKey]);

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

  // Stock batches state
  const [batches, setBatches] = useState([]);

  // Load batches on mount
  useEffect(() => {
    if (isOpen) {
      const allBatches = sensorStorage.getAllBatches();
      setBatches(allBatches);
    }
  }, [isOpen, refreshKey]);

  // Sensors already come with chronological_index and is_manually_locked from V4 storage
  const sensorsWithIndex = useMemo(() => {
    if (!sensors || sensors.length === 0) return [];
    
    // Just return sensors - they're already processed by getAllSensorsV4()
    // which adds: chronological_index (sequence), is_manually_locked (is_locked), status, success
    return sensors;
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
    debug.log('[SensorHistoryPanel] Sorted sensors:', sorted.length);
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

  // Handle batch assignment
  const handleBatchAssignment = (sensorId, batchId) => {
    if (!batchId || batchId === '') {
      // Unassign
      unassignSensor(sensorId);
    } else {
      // Assign to batch
      assignSensorToBatch(sensorId, batchId, 'manual');
    }
    // Trigger refresh
    setRefreshKey(prev => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"SF Mono", "Monaco", "Courier New", monospace',
        overflow: 'hidden'
      }}
    >
      {/* HEADER */}
      <div style={{
        padding: '24px',
        borderBottom: '3px solid #000000',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          🔬 SENSOR HISTORIE
        </h1>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {onOpenStock && (
            <button
              onClick={onOpenStock}
              style={{
                padding: '8px 16px',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                border: '3px solid #000000',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              📦 VOORRAAD
            </button>
          )}
          <label
            style={{
              padding: '8px 16px',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: '3px solid #000000',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            ↑ IMPORT
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }} />
          </label>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: '3px solid #000000',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            ↓ EXPORT
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: '3px solid #000000',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            × SLUITEN
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px'
      }}>

        {/* OVERALL STATS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '24px',
          borderBottom: '3px solid #000000'
        }}>
          {/* Total */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#000000' }}>
              {overallStats.total}
            </div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '4px', color: '#000000' }}>
              TOTAAL
            </div>
            <div style={{ fontSize: '10px', marginTop: '4px', color: '#666666' }}>
              {overallStats.totalDays}d totaal
            </div>
          </div>

          {/* Success Rate */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: overallStats.successRate >= 70 ? '#00AA00' : '#FF8800'
            }}>
              {overallStats.successRate}%
            </div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '4px', color: '#000000' }}>
              SUCCESS
            </div>
            <div style={{ fontSize: '10px', marginTop: '4px', color: '#666666' }}>
              {overallStats.successful}/{overallStats.successful + overallStats.failed} voltooid
            </div>
          </div>

          {/* Average Duration */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#000000' }}>
              {overallStats.avgDuration}d
            </div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '4px', color: '#000000' }}>
              GEM. DUUR
            </div>
            <div style={{ fontSize: '10px', marginTop: '4px', color: '#666666' }}>
              Doel: 7.0d
            </div>
          </div>

          {/* Failed/Running */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: overallStats.failed > 0 ? '#CC0000' : '#000000' }}>
              {overallStats.failed}
            </div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '4px', color: '#000000' }}>
              FAILED
            </div>
            {overallStats.running > 0 && (
              <div style={{ fontSize: '10px', marginTop: '4px', color: '#FF8800' }}>
                {overallStats.running} actief 🔄
              </div>
            )}
          </div>
        </div>
          {/* IMPORT PREVIEW */}
          {importPreview && (
            <div style={{
              border: '3px solid #000000',
              padding: '24px',
              marginBottom: '24px',
              backgroundColor: '#F5F5F5'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '16px'
              }}>
                📋 IMPORT PREVIEW
              </div>
              <div style={{
                fontSize: '14px',
                color: '#000000',
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
                borderTop: '2px solid #000000',
                paddingTop: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#000000',
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
                    fontSize: '14px',
                    color: '#000000',
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
                      style={{ marginRight: '8px' }} />
                    Import deleted sensors lijst
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    color: '#000000',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={importOptions.importLocks}
                      onChange={(e) => setImportOptions({
                        ...importOptions,
                        importLocks: e.target.checked
                      })}
                      style={{ marginRight: '8px' }} />
                    Import lock states
                  </label>
                </div>

                {/* Radio buttons for mode */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    color: '#000000',
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
                      style={{ marginRight: '8px' }} />
                    MERGE (voeg nieuwe toe, behoud bestaande)
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    color: '#CC0000',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      checked={importOptions.mode === 'replace'}
                      onChange={() => setImportOptions({
                        ...importOptions,
                        mode: 'replace'
                      })}
                      style={{ marginRight: '8px' }} />
                    REPLACE (wis alles, herstel backup)
                  </label>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleImportConfirm}
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  padding: '12px 24px',
                  border: '3px solid #000000',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  width: '100%'
                }}
              >
                ✓ BEVESTIG IMPORT
              </button>
            </div>
          )}

          {/* HW Version Stats */}
          {hwStats.length > 0 && (
            <div style={{
              border: '3px solid #000000',
              padding: '16px',
              backgroundColor: '#F5F5F5',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#000000',
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
                    border: '2px solid #000000',
                    padding: '12px',
                    backgroundColor: '#FFFFFF'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#000000',
                      marginBottom: '8px'
                    }}>
                      {hw.hwVersion}
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: hw.successRate >= 70 ? '#00AA00' : '#FF8800'
                    }}>
                      {hw.successRate}%
                    </div>
                    <div style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      color: '#666666',
                      marginTop: '4px'
                    }}>
                      {hw.successful}/{hw.successful + hw.failed} • {hw.avgDuration}d gem
                      {hw.running > 0 && ` • ${hw.running} 🔄`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Batch Performance (top 10) */}
          {lotStats.length > 0 && (
            <div style={{
              border: '3px solid #000000',
              padding: '16px',
              backgroundColor: '#F5F5F5',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#000000',
                marginBottom: '16px'
              }}>
                TOP 10 BATCHES
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '8px'
              }}>
                {lotStats.slice(0, 10).map(lot => (
                  <div key={lot.lotNumber} style={{
                    border: '2px solid #000000',
                    padding: '10px',
                    backgroundColor: '#FFFFFF'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#000000',
                      marginBottom: '6px'
                    }}>
                      {lot.lotNumber}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: lot.successRate >= 70 ? '#00AA00' : 
                             lot.successRate >= 50 ? '#FF8800' : '#CC0000'
                    }}>
                      {lot.successRate}%
                    </div>
                    <div style={{
                      fontSize: '9px',
                      textTransform: 'uppercase',
                      color: '#666666',
                      marginTop: '4px'
                    }}>
                      {lot.total > (lot.successful + lot.failed) 
                        ? `${lot.successful}/${lot.successful + lot.failed} • ${lot.running} 🔄`
                        : `${lot.successful}/${lot.total} sensors`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sensors Table */}
          <div style={{
            border: '3px solid #000000',
            backgroundColor: '#F5F5F5',
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead style={{
                backgroundColor: '#000000',
                color: '#FFFFFF'
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
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      borderRight: '1px solid #FFFFFF'
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
                      letterSpacing: '1px',
                      borderRight: '1px solid #FFFFFF',
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
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      borderRight: '1px solid #FFFFFF'
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
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      borderRight: '1px solid #FFFFFF'
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
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      borderRight: '1px solid #FFFFFF'
                    }}
                  >
                    DUUR {sortColumn === 'duration_days' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {/* LOT column hidden - lot_number now shown in BATCH column */}
                  <th 
                    onClick={() => handleSort('hw_version')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      borderRight: '1px solid #FFFFFF'
                    }}
                  >
                    HW {sortColumn === 'hw_version' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      borderRight: '1px solid #FFFFFF'
                    }}
                  >
                    BATCH
                  </th>
                  <th 
                    onClick={() => handleSort('success')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      borderRight: '1px solid #FFFFFF'
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
                      letterSpacing: '1px',
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
                    borderBottom: '1px solid #CCCCCC',
                    backgroundColor: '#FFFFFF'
                  }}>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid #CCCCCC',
                      color: '#000000',
                      fontWeight: 'bold'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>#{sensor.chronological_index}</span>
                        {(() => {
                          const assignment = getAssignmentForSensor(sensor.sensor_id);
                          if (assignment) {
                            const batch = batches.find(b => b.batch_id === assignment.batch_id);
                            return (
                              <span 
                                title={batch ? `Batch: ${batch.lot_number}` : 'Assigned to batch'}
                                style={{
                                  fontSize: '9px',
                                  padding: '2px 6px',
                                  fontWeight: 'bold',
                                  letterSpacing: '0.5px',
                                  backgroundColor: '#000000',
                                  color: '#FFFFFF',
                                  border: '1px solid #000000'
                                }}
                              >
                                BATCH
                              </span>
                            );
                          }
                          return null;
                        })()}
                        <span 
                          style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px',
                            backgroundColor: sensor.storageSource === 'localStorage' ? '#00AA00' : '#666666',
                            color: '#FFFFFF',
                            border: '1px solid ' + (sensor.storageSource === 'localStorage' ? '#00AA00' : '#666666')
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
                      borderRight: '1px solid #CCCCCC',
                      textAlign: 'center',
                      fontSize: '18px',
                      cursor: sensor.isEditable ? 'pointer' : 'not-allowed',
                      backgroundColor: sensor.is_manually_locked 
                        ? '#FFEEEE' 
                        : '#EEFFEE',
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
                          alert(`❌ ${result.message}\n\n${result.detail}`);
                        } else {
                          alert(`❌ Fout: ${result.message}`);
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
                      borderRight: '1px solid #CCCCCC',
                      color: '#000000'
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
                      borderRight: '1px solid #CCCCCC',
                      color: '#000000'
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
                      borderRight: '1px solid #CCCCCC',
                      color: (() => {
                        // Recalculate duration from timestamps (don't trust DB)
                        if (!sensor.start_date || !sensor.end_date) return '#000000';
                        const startMs = new Date(sensor.start_date).getTime();
                        const endMs = new Date(sensor.end_date).getTime();
                        const durationDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
                        
                        return durationDays >= 6.75 ? '#00AA00' :
                               durationDays >= 6 ? '#FF8800' :
                               '#CC0000';
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
                    {/* LOT cell hidden - lot_number now shown in BATCH cell */}
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid #CCCCCC',
                      color: '#000000',
                      fontWeight: 'bold'
                    }}>
                      {sensor.hw_version || '-'}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid #CCCCCC'
                    }}>
                      {/* Show lot_number as main value */}
                      <div style={{
                        fontWeight: 'bold',
                        color: '#000000',
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}>
                        {sensor.lot_number || sensor.batch || '-'}
                      </div>
                      
                      {/* Stock batch assignment dropdown (optional) */}
                      <select
                        value={(() => {
                          const assignment = getAssignmentForSensor(sensor.sensor_id);
                          return assignment ? assignment.batch_id : '';
                        })()}
                        onChange={(e) => handleBatchAssignment(sensor.sensor_id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          border: '1px solid #000000',
                          backgroundColor: '#FFFFFF',
                          color: '#000000',
                          fontSize: '9px',
                          cursor: 'pointer'
                        }}
                        title="Optional: Assign to stock batch"
                      >
                        <option value="">Stock: -</option>
                        {batches.map(batch => (
                          <option key={batch.batch_id} value={batch.batch_id}>
                            Stock: {batch.lot_number}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderRight: '1px solid #CCCCCC',
                      color: '#000000'
                    }}>
                      {(() => {
                        // V4: Use statusInfo from storage (already calculated correctly)
                        const info = sensor.statusInfo || { emoji: '❓', label: 'Unknown', color: '#999' };
                        
                        return (
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            border: `2px solid ${info.color}`,
                            backgroundColor: info.color,
                            color: '#FFFFFF'
                          }}>
                            {info.emoji} {info.label.toUpperCase()}
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
                                alert(`❌ ${result.message}\n\n${result.detail}`);
                              } else {
                                alert(`❌ Fout: ${result.message}`);
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
                          letterSpacing: '1px',
                          border: '2px solid #CC0000',
                          backgroundColor: sensor.is_manually_locked ? '#CCCCCC' : 'transparent',
                          color: sensor.is_manually_locked ? '#666666' : '#CC0000',
                          cursor: sensor.is_manually_locked ? 'not-allowed' : 'pointer'
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
  );
}
