/**
 * SensorHistoryPanel.jsx - V4 CLEAN REWRITE
 * 
 * Complete rewrite for V4 storage architecture.
 * Uses sensorStorage.js API directly (no compatibility layers).
 * 
 * Date: 2025-11-08
 * Replaces: 1237-line V3 implementation
 */

import React, { useState, useEffect, useMemo } from 'react';
import * as sensorStorage from '../../storage/sensorStorage.js';
import * as stockStorage from '../../storage/stockStorage.js';

export default function SensorHistoryPanel({ isOpen, onClose, onOpenStock }) {
  // State
  const [sensors, setSensors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statsExpanded, setStatsExpanded] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    lotNumber: null,
    statusFilter: 'all' // all, active, success, failed
  });
  
  // Sort
  const [sortColumn, setSortColumn] = useState('sequence');
  const [sortDirection, setSortDirection] = useState('desc');

  // Load data
  useEffect(() => {
    if (isOpen) {
      (async () => {
        const sensorsData = await sensorStorage.getAllSensors();
        setSensors(sensorsData);
        setBatches(stockStorage.getAllBatches()); // stockStorage is still sync
      })();
    }
  }, [isOpen, refreshKey]);

  // Filter sensors
  const filteredSensors = useMemo(() => {
    return sensors.filter(s => {
      // Date range
      if (filters.startDate && new Date(s.start_date) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(s.start_date) > new Date(filters.endDate)) return false;
      
      // Lot number
      if (filters.lotNumber && s.lot_number !== filters.lotNumber) return false;
      
      // Status
      if (filters.statusFilter !== 'all') {
        if (filters.statusFilter !== s.statusInfo.status) return false;
      }
      
      return true;
    });
  }, [sensors, filters]);

  // Sort sensors
  const sortedSensors = useMemo(() => {
    const sorted = [...filteredSensors].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortColumn) {
        case 'sequence':
          aVal = a.sequence;
          bVal = b.sequence;
          break;
        case 'start_date':
          aVal = new Date(a.start_date).getTime();
          bVal = new Date(b.start_date).getTime();
          break;
        case 'lot_number':
          aVal = a.lot_number || '';
          bVal = b.lot_number || '';
          break;
        case 'status':
          aVal = a.statusInfo.status;
          bVal = b.statusInfo.status;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [filteredSensors, sortColumn, sortDirection]);

  // Enhanced Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    
    // Helper function to calculate stats for a sensor list
    const calculateStats = (sensorList) => {
      if (sensorList.length === 0) {
        return {
          count: 0,
          avg_duration: 0,
          pct_6days: 0,
          pct_6_8days: 0
        };
      }
      
      const durations = sensorList.map(s => {
        const start = new Date(s.start_date);
        const end = new Date(s.end_date);
        return (end - start) / (1000 * 60 * 60 * 24); // days
      });
      
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const count6days = durations.filter(d => d >= 6).length;
      const count6_8days = durations.filter(d => d >= 6.8).length;
      
      return {
        count: sensorList.length,
        avg_duration: avg.toFixed(2),
        pct_6days: ((count6days / durations.length) * 100).toFixed(1),
        pct_6_8days: ((count6_8days / durations.length) * 100).toFixed(1)
      };
    };
    
    // Filter only ended sensors
    const endedSensors = sensors.filter(s => s.end_date);
    
    // 1. Last 90 days
    const last90Days = endedSensors.filter(s => {
      const endDate = new Date(s.end_date);
      return endDate >= ninetyDaysAgo;
    });
    
    // 2. By year
    const byYear = {};
    endedSensors.forEach(s => {
      const year = new Date(s.start_date).getFullYear();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(s);
    });
    
    return {
      last90Days: calculateStats(last90Days),
      byYear: Object.entries(byYear)
        .map(([year, sensors]) => ({
          year: parseInt(year),
          ...calculateStats(sensors)
        }))
        .sort((a, b) => b.year - a.year) // Newest year first
    };
  }, [sensors]);

  // Handlers
  const handleToggleLock = async (sensorId) => {
    const result = await sensorStorage.toggleLock(sensorId);
    if (result.success) {
      setRefreshKey(prev => prev + 1);
    } else {
      alert(`❌ ${result.error}`);
    }
  };

  const handleDelete = async (sensorId, sensorSeq) => {
    const sensor = await sensorStorage.getSensorById(sensorId);
    if (!sensor) return;
    
    if (sensor.is_locked) {
      alert('🔒 Sensor is vergrendeld. Ontgrendel eerst.');
      return;
    }
    
    if (confirm(`Sensor #${sensorSeq} verwijderen?\n\n⚠️ Actie kan niet ongedaan worden.`)) {
      const result = await sensorStorage.deleteSensor(sensorId);
      if (result.success) {
        alert('✓ Sensor verwijderd');
        setRefreshKey(prev => prev + 1);
      } else {
        alert(`❌ ${result.error}`);
      }
    }
  };

  const handleBatchAssign = async (sensorId, batchId) => {
    // Update sensor's batch_id field
    const sensorResult = await sensorStorage.assignBatch(sensorId, batchId || null);
    if (!sensorResult.success) {
      alert(`❌ ${sensorResult.error}`);
      return;
    }
    
    // Create/update assignment in stockStorage
    if (batchId) {
      try {
        stockStorage.assignSensorToBatch(sensorId, batchId, 'manual');
      } catch (error) {
        console.error('Failed to create stock assignment:', error);
        // Sensor batch_id is already updated, so this is not critical
      }
    } else {
      // Unassign if batchId is null
      try {
        stockStorage.unassignSensor(sensorId);
      } catch (error) {
        console.error('Failed to remove stock assignment:', error);
      }
    }
    
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = async () => {
    const data = await sensorStorage.exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agp-sensors-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const result = await sensorStorage.importJSON(data);
        
        if (result.success) {
          const msg = [
            '✅ Import succesvol!',
            '',
            `Sensors: ${result.summary.sensorsAdded} toegevoegd, ${result.summary.sensorsSkipped} overgeslagen`,
            result.summary.batchesAdded > 0 || result.summary.batchesSkipped > 0 
              ? `Batches: ${result.summary.batchesAdded} toegevoegd, ${result.summary.batchesSkipped} dubbelen overgeslagen`
              : ''
          ].filter(Boolean).join('\n');
          
          alert(msg);
          setRefreshKey(prev => prev + 1);
        } else {
          alert(`❌ Import mislukt:\n\n${result.error}`);
        }
      } catch (err) {
        alert(`❌ Invalid JSON:\n\n${err.message}`);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleResequence = async () => {
    if (!confirm('Sensors hernummeren?\n\nOudste sensor krijgt #1, nieuwste het hoogste nummer.\n\nDeze actie kan niet ongedaan worden.')) {
      return;
    }
    
    const result = await sensorStorage.resequenceSensors();
    if (result.success) {
      alert(`✓ ${result.message}`);
      setRefreshKey(prev => prev + 1);
    } else {
      alert(`❌ Hernummering mislukt: ${result.error}`);
    }
  };

  const handleUpdateHardwareVersions = async () => {
    if (!confirm('Hardware versies updaten?\n\n• Sensoren vanaf 3 juli 2025 → A2.01\n• Sensoren daarvoor → A1.01\n\nDeze actie kan niet ongedaan worden.')) {
      return;
    }
    
    const result = await sensorStorage.updateHardwareVersions();
    if (result.success) {
      alert(`✓ ${result.message}`);
      setRefreshKey(prev => prev + 1);
    } else {
      alert(`❌ Update mislukt: ${result.error}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--paper)',
        width: '95%',
        height: '95%',
        border: '3px solid var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '3px solid var(--ink)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontFamily: 'monospace', fontSize: '24px', color: 'var(--ink)' }}>
            SENSOR GESCHIEDENIS ({sortedSensors.length})
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onOpenStock} style={{
              padding: '10px 20px',
              border: '2px solid var(--ink)',
              backgroundColor: 'var(--color-green)',
              color: 'var(--paper)',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold'
            }}>
              📦 STOCK
            </button>
            <button onClick={handleExport} style={{
              padding: '10px 20px',
              border: '2px solid var(--ink)',
              backgroundColor: 'var(--paper)',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold'
            }}>
              EXPORT JSON
            </button>
            <label style={{
              padding: '10px 20px',
              border: '2px solid var(--ink)',
              backgroundColor: 'var(--paper)',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold'
            }}>
              IMPORT JSON
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <button onClick={onClose} style={{
              padding: '10px 20px',
              border: '2px solid var(--ink)',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold'
            }}>
              SLUITEN
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '2px solid var(--ink)',
          display: 'flex',
          gap: '15px',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <select
            value={filters.statusFilter}
            onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value }))}
            style={{
              padding: '8px',
              border: '2px solid var(--ink)',
              fontFamily: 'monospace',
              backgroundColor: 'var(--paper)',
              color: 'var(--ink)'
            }}
          >
            <option value="all">Alle statussen</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="success">Success</option>
            <option value="short">Short</option>
            <option value="failed">Failed</option>
          </select>
          
          {filters.statusFilter !== 'all' && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, statusFilter: 'all' }))}
              style={{
                padding: '8px 12px',
                border: '2px solid var(--ink)',
                backgroundColor: 'var(--paper)',
                color: 'var(--ink)',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              ✗ Reset
            </button>
          )}
        </div>

        {/* Enhanced Statistics */}
        <div style={{
          padding: '20px',
          borderBottom: '3px solid var(--ink)',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '14px', color: 'var(--ink)' }}>
              SENSOR STATISTIEKEN (alleen beëindigde sensoren)
            </div>
            {stats.byYear.length > 0 && (
              <button
                onClick={() => setStatsExpanded(!statsExpanded)}
                style={{
                  padding: '6px 12px',
                  border: '2px solid var(--ink)',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '11px'
                }}
              >
                {statsExpanded ? '▼ VERBERG JAARSTATS' : '▶ TOON JAARSTATS'}
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {/* Last 90 days - always visible */}
            <div style={{
              padding: '15px',
              border: '2px solid var(--ink)',
              backgroundColor: 'var(--paper)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--color-green)' }}>
                LAATSTE 90 DAGEN (n={stats.last90Days.count})
              </div>
              <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                <div>Ø duur: <strong>{stats.last90Days.avg_duration} dagen</strong></div>
                <div>≥6 dagen: <strong>{stats.last90Days.pct_6days}%</strong></div>
                <div>≥6.8 dagen: <strong>{stats.last90Days.pct_6_8days}%</strong></div>
              </div>
            </div>

            {/* By Year - collapsible */}
            {statsExpanded && stats.byYear.map(yearData => (
              <div key={yearData.year} style={{
                padding: '15px',
                border: '2px solid var(--ink)',
                backgroundColor: 'var(--paper)'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--ink)' }}>
                  JAAR {yearData.year} (n={yearData.count})
                </div>
                <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                  <div>Ø duur: <strong>{yearData.avg_duration} dagen</strong></div>
                  <div>≥6 dagen: <strong>{yearData.pct_6days}%</strong></div>
                  <div>≥6.8 dagen: <strong>{yearData.pct_6_8days}%</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'monospace'
          }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--ink)', color: 'var(--paper)' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', borderRight: '2px solid var(--paper)' }}
                    onClick={() => handleSort('sequence')}>
                  # {sortColumn === 'sequence' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderRight: '2px solid var(--paper)' }}>
                  LOCK
                </th>
                <th style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', borderRight: '2px solid var(--paper)' }}
                    onClick={() => handleSort('start_date')}>
                  START {sortColumn === 'start_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderRight: '2px solid var(--paper)' }}>
                  END
                </th>
                <th style={{ padding: '12px', textAlign: 'right', borderRight: '2px solid var(--paper)' }}>
                  DUUR
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderRight: '2px solid var(--paper)' }}>
                  HW
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderRight: '2px solid var(--paper)' }}>
                  BATCH
                </th>
                <th style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', borderRight: '2px solid var(--paper)' }}
                    onClick={() => handleSort('status')}>
                  STATUS {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px', textAlign: 'center' }}>
                  DELETE
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSensors.map(sensor => (
                <tr key={sensor.id} style={{ borderBottom: '1px solid var(--grid-line)' }}>
                  {/* Sequence */}
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)' }}>
                    #{sensor.sequence}
                  </td>
                  
                  {/* Lock */}
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: sensor.is_locked ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    borderRight: '1px solid var(--grid-line)'
                  }} onClick={() => handleToggleLock(sensor.id)}>
                    {sensor.is_locked ? '🔒' : '🔓'}
                  </td>
                  
                  {/* Start Date */}
                  <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)' }}>
                    {(() => {
                      const dateStr = sensor.start_date || sensor.startTimestamp;
                      if (!dateStr) return 'Invalid Date';
                      const date = new Date(dateStr);
                      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString('nl-NL');
                    })()}
                  </td>
                  
                  {/* End Date */}
                  <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)' }}>
                    {(() => {
                      const dateStr = sensor.end_date || sensor.endTimestamp || sensor.stoppedAt;
                      if (!dateStr) return '-';
                      const date = new Date(dateStr);
                      return isNaN(date.getTime()) ? '-' : date.toLocaleString('nl-NL');
                    })()}
                  </td>
                  
                  {/* Duration */}
                  <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {(() => {
                      const startStr = sensor.start_date || sensor.startTimestamp;
                      const endStr = sensor.end_date || sensor.endTimestamp || sensor.stoppedAt;
                      if (!startStr) return '-';
                      const start = new Date(startStr);
                      if (isNaN(start.getTime())) return 'NaN';
                      const end = endStr ? new Date(endStr) : new Date();
                      const hours = (end - start) / (1000 * 60 * 60);
                      const days = (hours / 24).toFixed(1);
                      return endStr ? `${days}d` : `${days}d →`;
                    })()}
                  </td>
                  
                  {/* HW Version */}
                  <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)' }}>
                    {sensor.hw_version || '-'}
                  </td>
                  
                  {/* Batch Assignment */}
                  <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)' }}>
                    <select
                      value={sensor.batch_id || ''}
                      onChange={(e) => handleBatchAssign(sensor.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '4px',
                        border: '1px solid var(--ink)',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        backgroundColor: 'var(--paper)',
                        color: 'var(--ink)'
                      }}
                    >
                      <option value="">-</option>
                      {batches.map(b => (
                        <option key={b.batch_id} value={b.batch_id}>
                          {b.lot_number}
                        </option>
                      ))}
                    </select>
                  </td>
                  
                  {/* Status - V4 PROPER WAY */}
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderRight: '1px solid var(--grid-line)' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      backgroundColor: `var(${sensor.statusInfo.colorVar})`,
                      color: 'var(--paper)',
                      border: `2px solid var(${sensor.statusInfo.colorVar})`,
                      fontWeight: 'bold',
                      fontSize: '11px',
                      letterSpacing: '1px'
                    }}>
                      {sensor.statusInfo.label.toUpperCase()}
                    </span>
                  </td>
                  
                  {/* Delete */}
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(sensor.id, sensor.sequence)}
                      disabled={sensor.is_locked}
                      style={{
                        padding: '6px 12px',
                        border: '2px solid var(--color-red)',
                        backgroundColor: sensor.is_locked ? 'var(--bg-tertiary)' : 'var(--paper)',
                        color: sensor.is_locked ? 'var(--text-secondary)' : 'var(--color-red)',
                        cursor: sensor.is_locked ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontFamily: 'monospace'
                      }}
                    >
                      🗑️
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
