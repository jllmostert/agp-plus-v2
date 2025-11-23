/**
 * useSensorHistory.js - Custom hook for SensorHistoryPanel
 * 
 * Extracts all state management and business logic from SensorHistoryPanel.
 * Part of Fase 3 refactor (v4.5.0).
 * 
 * Created: 2025-11-22
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as sensorStorage from '../../../storage/sensorStorage.js';
import * as stockStorage from '../../../storage/stockStorage.js';
import { 
  getEraForDate, 
  groupSensorsByEra, 
  groupSensorsByPump, 
  groupSensorsByTransmitter,
  getAllSeasonsAsync,
  addSeason,
  updateSeason,
  deleteSeason
} from '../../../core/deviceEras.js';

// ====== CONSTANTS ======
export const MIN_STATS_HEIGHT = 100;
export const MIN_TABLE_HEIGHT = 200;
const DEFAULT_STATS_HEIGHT = 250;

/**
 * Main hook for sensor history state management
 */
export function useSensorHistory(isOpen) {
  // ====== CORE DATA STATE ======
  const [sensors, setSensors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // ====== UI STATE ======
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [eraStatsExpanded, setEraStatsExpanded] = useState(false);
  const [seasonManageExpanded, setSeasonManageExpanded] = useState(false);
  
  // ====== RESIZABLE SPLITTER STATE ======
  const [statsPanelHeight, setStatsPanelHeight] = useState(DEFAULT_STATS_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  
  // ====== SEASON EDITING STATE ======
  const [editingSeason, setEditingSeason] = useState(null);
  const [newSeason, setNewSeason] = useState({
    name: '',
    start: '',
    end: '',
    pump: { serial: '', name: '', hw_version: '', fw_version: '' },
    transmitter: { serial: '', number: '' }
  });
  
  // ====== FILTER & SORT STATE ======
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    lotNumber: null,
    statusFilter: 'all'
  });
  const [sortColumn, setSortColumn] = useState('sequence');
  const [sortDirection, setSortDirection] = useState('desc');

  // ====== DATA LOADING ======
  useEffect(() => {
    if (isOpen) {
      (async () => {
        const sensorsData = await sensorStorage.getAllSensors();
        setSensors(sensorsData || []); // âœ… Defensive: ensure array
        const batchesData = await stockStorage.getAllBatches();
        setBatches(batchesData || []); // âœ… Defensive: ensure array
        const seasonsData = await getAllSeasonsAsync();
        setSeasons(seasonsData || []); // âœ… Defensive: ensure array
      })();
    }
  }, [isOpen, refreshKey]);

  const refresh = useCallback(() => setRefreshKey(prev => prev + 1), []);

  // ====== FILTERED SENSORS ======
  const filteredSensors = useMemo(() => {
    return sensors.filter(s => {
      if (filters.startDate && new Date(s.start_date) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(s.start_date) > new Date(filters.endDate)) return false;
      if (filters.lotNumber && s.lot_number !== filters.lotNumber) return false;
      if (filters.statusFilter !== 'all') {
        if (filters.statusFilter !== s.statusInfo.status) return false;
      }
      return true;
    });
  }, [sensors, filters]);

  // ====== SORTED SENSORS ======
  const sortedSensors = useMemo(() => {
    const sorted = [...filteredSensors].sort((a, b) => {
      let aVal, bVal;
      switch (sortColumn) {
        case 'sequence':
          aVal = a.sequence; bVal = b.sequence; break;
        case 'start_date':
          aVal = new Date(a.start_date).getTime();
          bVal = new Date(b.start_date).getTime(); break;
        case 'lot_number':
          aVal = a.lot_number || ''; bVal = b.lot_number || ''; break;
        case 'status':
          aVal = a.statusInfo.status; bVal = b.statusInfo.status; break;
        default: return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredSensors, sortColumn, sortDirection]);

  // ====== STATISTICS CALCULATION ======
  const stats = useMemo(() => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    
    const calculateStats = (sensorList) => {
      if (sensorList.length === 0) {
        return { count: 0, avg_duration: 0, pct_6days: 0, pct_6_8days: 0 };
      }
      const durations = sensorList.map(s => {
        const start = new Date(s.start_date);
        const end = new Date(s.end_date);
        return (end - start) / (1000 * 60 * 60 * 24);
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
    
    const endedSensors = sensors.filter(s => s.end_date);
    const last90Days = endedSensors.filter(s => new Date(s.end_date) >= ninetyDaysAgo);
    
    // By year
    const byYear = {};
    endedSensors.forEach(s => {
      const year = new Date(s.start_date).getFullYear();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(s);
    });
    
    return {
      last90Days: calculateStats(last90Days),
      byYear: Object.entries(byYear)
        .map(([year, sensors]) => ({ year: parseInt(year), ...calculateStats(sensors) }))
        .sort((a, b) => b.year - a.year),
      byEra: seasons.map(era => {
        const eraSensors = groupSensorsByEra(endedSensors)[era.id] || [];
        return {
          id: era.id, season: era.season, name: era.name,
          pump: era.pump.serial, transmitter: era.transmitter.serial || '?',
          start: era.start, end: era.end, ...calculateStats(eraSensors)
        };
      }).filter(e => e.count > 0),
      byPump: Object.entries(groupSensorsByPump(endedSensors))
        .map(([serial, sensors]) => {
          const era = seasons.find(e => e.pump.serial === serial);
          return {
            serial, number: era?.pump.number || '?',
            name: era?.pump.name || `Pomp #${era?.pump.number || '?'}`,
            fw: era?.pump.fw_version || '?', ...calculateStats(sensors)
          };
        }).filter(p => p.serial !== 'unknown').sort((a, b) => (a.number || 0) - (b.number || 0)),
      byTransmitter: Object.entries(groupSensorsByTransmitter(endedSensors))
        .map(([serial, sensors]) => {
          const era = seasons.find(e => e.transmitter.serial === serial);
          return {
            serial, number: era?.transmitter.number || '?', ...calculateStats(sensors)
          };
        }).filter(t => t.serial !== 'unknown').sort((a, b) => (a.number || 0) - (b.number || 0))
    };
  }, [sensors, seasons]);

  // ====== SENSOR HANDLERS ======
  const handleToggleLock = useCallback(async (sensorId) => {
    const result = await sensorStorage.toggleLock(sensorId);
    if (result.success) { refresh(); } 
    else { alert(`❌ ${result.error}`); }
  }, [refresh]);

  const handleDelete = useCallback(async (sensorId, sensorSeq) => {
    const sensor = await sensorStorage.getSensorById(sensorId);
    if (!sensor) return;
    if (sensor.is_locked) {
      alert('🔒 Sensor is vergrendeld. Ontgrendel eerst.');
      return;
    }
    if (confirm(`Sensor #${sensorSeq} verwijderen?\n\n⚠️ Actie kan niet ongedaan worden.`)) {
      const result = await sensorStorage.deleteSensor(sensorId);
      if (result.success) { alert('✓ Sensor verwijderd'); refresh(); }
      else { alert(`❌ ${result.error}`); }
    }
  }, [refresh]);

  const handleBatchAssign = useCallback(async (sensorId, batchId) => {
    const sensorResult = await sensorStorage.assignBatch(sensorId, batchId || null);
    if (!sensorResult.success) { alert(`❌ ${sensorResult.error}`); return; }
    if (batchId) {
      try { await stockStorage.assignSensorToBatch(sensorId, batchId, 'manual'); }
      catch (error) { console.error('Failed to create stock assignment:', error); }
    } else {
      try { await stockStorage.unassignSensor(sensorId); }
      catch (error) { console.error('Failed to remove stock assignment:', error); }
    }
    refresh();
  }, [refresh]);

  // ====== EXPORT/IMPORT HANDLERS ======
  const handleExport = useCallback(async () => {
    const data = await sensorStorage.exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    a.download = `agp-sensors-${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const result = await sensorStorage.importJSON(data);
        if (result.success) {
          const msg = [
            '✅ Import succesvol!', '',
            `Sensors: ${result.summary.sensorsAdded} toegevoegd, ${result.summary.sensorsSkipped} overgeslagen`,
            result.summary.batchesAdded > 0 || result.summary.batchesSkipped > 0 
              ? `Batches: ${result.summary.batchesAdded} toegevoegd, ${result.summary.batchesSkipped} dubbelen overgeslagen` : ''
          ].filter(Boolean).join('\n');
          alert(msg); refresh();
        } else { alert(`❌ Import mislukt:\n\n${result.error}`); }
      } catch (err) { alert(`❌ Invalid JSON:\n\n${err.message}`); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [refresh]);

  // ====== SORT HANDLER ======
  const handleSort = useCallback((column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  // ====== UTILITY HANDLERS ======
  const handleResequence = useCallback(async () => {
    if (!confirm('Sensors hernummeren?\n\nOudste sensor krijgt #1, nieuwste het hoogste nummer.\n\nDeze actie kan niet ongedaan worden.')) return;
    const result = await sensorStorage.resequenceSensors();
    if (result.success) { alert(`✓ ${result.message}`); refresh(); }
    else { alert(`❌ Hernummering mislukt: ${result.error}`); }
  }, [refresh]);

  const handleUpdateHardwareVersions = useCallback(async () => {
    if (!confirm('Hardware versies updaten?\n\n• Sensoren vanaf 3 juli 2025 → A2.01\n• Sensoren daarvoor → A1.01\n\nDeze actie kan niet ongedaan worden.')) return;
    const result = await sensorStorage.updateHardwareVersions();
    if (result.success) { alert(`✓ ${result.message}`); refresh(); }
    else { alert(`❌ Update mislukt: ${result.error}`); }
  }, [refresh]);

  // ====== SEASON MANAGEMENT HANDLERS ======
  const handleAddSeason = useCallback(async () => {
    if (!newSeason.name || !newSeason.start) {
      alert('Naam en startdatum zijn verplicht'); return;
    }
    try {
      await addSeason({
        name: newSeason.name,
        start: new Date(newSeason.start).toISOString(),
        end: newSeason.end ? new Date(newSeason.end).toISOString() : null,
        pump: {
          serial: newSeason.pump.serial,
          name: newSeason.pump.name || newSeason.name,
          hw_version: newSeason.pump.hw_version || 'A2.01',
          fw_version: newSeason.pump.fw_version || ''
        },
        transmitter: {
          serial: newSeason.transmitter.serial || null,
          number: parseInt(newSeason.transmitter.number) || null
        }
      });
      setNewSeason({
        name: '', start: '', end: '',
        pump: { serial: '', name: '', hw_version: '', fw_version: '' },
        transmitter: { serial: '', number: '' }
      });
      refresh();
    } catch (err) { alert(`❌ Fout bij toevoegen: ${err.message}`); }
  }, [newSeason, refresh]);

  const handleUpdateSeason = useCallback(async (id) => {
    if (!editingSeason) return;
    try {
      await updateSeason(id, {
        name: editingSeason.name,
        start: editingSeason.start,
        end: editingSeason.end,
        pump: editingSeason.pump,
        transmitter: editingSeason.transmitter
      });
      setEditingSeason(null);
      refresh();
    } catch (err) { alert(`❌ Fout bij updaten: ${err.message}`); }
  }, [editingSeason, refresh]);

  const handleDeleteSeason = useCallback(async (id, name) => {
    if (!confirm(`Seizoen "${name}" verwijderen?\n\nDit kan niet ongedaan worden.`)) return;
    try { await deleteSeason(id); refresh(); }
    catch (err) { alert(`❌ Fout bij verwijderen: ${err.message}`); }
  }, [refresh]);

  // ====== RESIZABLE SPLITTER HANDLERS ======
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const headerHeight = 80;
    const newHeight = e.clientY - containerRect.top - headerHeight;
    const maxHeight = containerRect.height - headerHeight - MIN_TABLE_HEIGHT;
    setStatsPanelHeight(Math.max(MIN_STATS_HEIGHT, Math.min(newHeight, maxHeight)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ====== RETURN ALL STATE AND HANDLERS ======
  return {
    // Data
    sensors, batches, seasons, sortedSensors, stats,
    
    // UI State
    statsExpanded, setStatsExpanded,
    eraStatsExpanded, setEraStatsExpanded,
    seasonManageExpanded, setSeasonManageExpanded,
    statsPanelHeight, isDragging,
    containerRef,
    
    // Filter & Sort
    filters, setFilters,
    sortColumn, sortDirection,
    
    // Season Editing
    editingSeason, setEditingSeason,
    newSeason, setNewSeason,
    
    // Handlers
    handleToggleLock, handleDelete, handleBatchAssign,
    handleExport, handleImport,
    handleSort, handleResequence, handleUpdateHardwareVersions,
    handleAddSeason, handleUpdateSeason, handleDeleteSeason,
    handleMouseDown,
    refresh,
    
    // Utilities
    getEraForDate
  };
}
