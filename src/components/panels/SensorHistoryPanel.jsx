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
      setSensors(sensorStorage.getAllSensors());
      setBatches(stockStorage.getAllBatches()); // NEW: Use stockStorage for batches
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

  // HW Version Statistics (last 90 days only)
  const hwStats = useMemo(() => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    
    // Filter: ended sensors from last 90 days
    const recentEnded = sensors.filter(s => {
      if (!s.end_date) return false;
      const endDate = new Date(s.end_date);
      return endDate >= ninetyDaysAgo;
    });

    // Group by HW version
    const byHW = {};
    recentEnded.forEach(s => {
      const hw = s.hw_version || 'Unknown';
      if (!byHW[hw]) {
        byHW[hw] = { total: 0, success: 0, durations: [] };
      }
      byHW[hw].total++;
      
      // Calculate duration
      const start = new Date(s.start_date);
      const end = new Date(s.end_date);
      const days = (end - start) / (1000 * 60 * 60 * 24);
      byHW[hw].durations.push(days);
      
      // Success = >= 7 days
      if (days >= 7) {
        byHW[hw].success++;
      }
    });

    // Calculate percentages and averages
    return Object.entries(byHW).map(([hw, data]) => ({
      hw_version: hw,
      total: data.total,
      success_rate: ((data.success / data.total) * 100).toFixed(1),
      avg_duration: (data.durations.reduce((a, b) => a + b, 0) / data.durations.length).toFixed(1)
    })).sort((a, b) => b.total - a.total); // Sort by count descending
  }, [sensors]);

  // Handlers
  const handleToggleLock = (sensorId) => {
    const result = sensorStorage.toggleLock(sensorId);
    if (result.success) {
      setRefreshKey(prev => prev + 1);
    } else {
      alert(`❌ ${result.error}`);
    }
  };

  const handleDelete = (sensorId, sensorSeq) => {
    const sensor = sensorStorage.getSensorById(sensorId);
    if (!sensor) return;
    
    if (sensor.is_locked) {
      alert('🔒 Sensor is vergrendeld. Ontgrendel eerst.');
      return;
    }
    
    if (confirm(`Sensor #${sensorSeq} verwijderen?\n\n⚠️ Actie kan niet ongedaan worden.`)) {
      const result = sensorStorage.deleteSensor(sensorId);
      if (result.success) {
        alert('✓ Sensor verwijderd');
        setRefreshKey(prev => prev + 1);
      } else {
        alert(`❌ ${result.error}`);
      }
    }
  };

  const handleBatchAssign = (sensorId, batchId) => {
    // Update sensor's batch_id field
    const sensorResult = sensorStorage.assignBatch(sensorId, batchId || null);
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

  const handleExport = () => {
    const data = sensorStorage.exportJSON();
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
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const result = sensorStorage.importJSON(data);
        
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
            <option value="active">🔄 Active</option>
            <option value="overdue">⏰ Overdue</option>
            <option value="success">✅ Success</option>
            <option value="failed">❌ Failed</option>
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

        {/* HW Version Stats (last 90 days) */}
        {hwStats.length > 0 && (
          <div style={{
            padding: '15px 20px',
            borderBottom: '2px solid var(--ink)',
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px', width: '100%', marginBottom: '5px', color: 'var(--ink)' }}>
              📊 HARDWARE STATS (laatste 90 dagen, alleen beëindigde sensoren)
            </div>
            {hwStats.map(stat => (
              <div key={stat.hw_version} style={{
                padding: '10px 15px',
                border: '2px solid var(--ink)',
                backgroundColor: 'var(--paper)',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: 'var(--ink)'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {stat.hw_version} (n={stat.total})
                </div>
                <div>≥7 dagen: {stat.success_rate}%</div>
                <div>Ø duur: {stat.avg_duration} dagen</div>
              </div>
            ))}
          </div>
        )}

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
                  🔒
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
                    {new Date(sensor.start_date).toLocaleString('nl-NL')}
                  </td>
                  
                  {/* End Date */}
                  <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)' }}>
                    {sensor.end_date ? new Date(sensor.end_date).toLocaleString('nl-NL') : '-'}
                  </td>
                  
                  {/* Duration */}
                  <td style={{ padding: '10px 12px', borderRight: '1px solid var(--grid-line)', color: 'var(--ink)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {(() => {
                      const start = new Date(sensor.start_date);
                      const end = sensor.end_date ? new Date(sensor.end_date) : new Date();
                      const hours = (end - start) / (1000 * 60 * 60);
                      const days = (hours / 24).toFixed(1);
                      return sensor.end_date ? `${days}d` : `${days}d →`;
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
                      backgroundColor: sensor.statusInfo.color,
                      color: 'var(--paper)',
                      border: `2px solid ${sensor.statusInfo.color}`,
                      fontWeight: 'bold',
                      fontSize: '11px',
                      letterSpacing: '1px'
                    }}>
                      {sensor.statusInfo.emoji} {sensor.statusInfo.label.toUpperCase()}
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
