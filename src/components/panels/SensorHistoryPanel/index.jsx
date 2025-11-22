/**
 * SensorHistoryPanel - Main orchestrator (index.jsx)
 * 
 * Refactored from 1163-line monolith into modular architecture.
 * Part of Fase 3 (v4.5.0).
 * 
 * Architecture:
 * - useSensorHistory.js: State management hook
 * - SensorStatsPanel.jsx: Statistics display
 * - SeasonManager.jsx: Season CRUD UI
 * - SensorTable.jsx: Sensor data table
 * 
 * Created: 2025-11-22
 */

import React from 'react';
import { useSensorHistory, MIN_STATS_HEIGHT, MIN_TABLE_HEIGHT } from './useSensorHistory.js';
import SensorStatsPanel from './SensorStatsPanel.jsx';
import SeasonManager from './SeasonManager.jsx';
import SensorTable from './SensorTable.jsx';

export default function SensorHistoryPanel({ isOpen, onClose, onOpenStock }) {
  const {
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
  } = useSensorHistory(isOpen);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div
        ref={containerRef}
        style={{
          width: '90vw',
          height: '90vh',
          backgroundColor: 'var(--bg-primary)',
          border: '3px solid var(--ink)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '3px solid var(--ink)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontFamily: 'monospace',
              fontSize: '20px',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              SENSOR GESCHIEDENIS
            </h2>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginTop: '5px',
              fontFamily: 'monospace'
            }}>
              {sensors.length} sensoren totaal
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onOpenStock}
              style={{
                padding: '8px 16px',
                border: '2px solid var(--color-blue)',
                backgroundColor: 'var(--paper)',
                color: 'var(--color-blue)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
            >
              📦 VOORRAAD
            </button>
            <button
              onClick={handleResequence}
              style={{
                padding: '8px 16px',
                border: '2px solid var(--color-green)',
                backgroundColor: 'var(--paper)',
                color: 'var(--color-green)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
            >
              🔢 HERNUMMER
            </button>
            <button
              onClick={handleUpdateHardwareVersions}
              style={{
                padding: '8px 16px',
                border: '2px solid var(--color-yellow)',
                backgroundColor: 'var(--paper)',
                color: 'var(--color-yellow)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
            >
              🔄 UPDATE HW
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '2px solid var(--ink)',
                backgroundColor: 'var(--ink)',
                color: 'var(--paper)',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
            >
              ✕ SLUITEN
            </button>
          </div>
        </div>

        {/* Stats Panel (resizable) */}
        <div style={{ 
          height: `${statsPanelHeight}px`, 
          minHeight: `${MIN_STATS_HEIGHT}px`,
          overflow: 'auto', 
          padding: '15px',
          borderBottom: '3px solid var(--ink)',
          flexShrink: 0,
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <SensorStatsPanel
            stats={stats}
            statsExpanded={statsExpanded}
            setStatsExpanded={setStatsExpanded}
            eraStatsExpanded={eraStatsExpanded}
            setEraStatsExpanded={setEraStatsExpanded}
          />
          
          <SeasonManager
            seasons={seasons}
            seasonManageExpanded={seasonManageExpanded}
            setSeasonManageExpanded={setSeasonManageExpanded}
            editingSeason={editingSeason}
            setEditingSeason={setEditingSeason}
            newSeason={newSeason}
            setNewSeason={setNewSeason}
            onAddSeason={handleAddSeason}
            onUpdateSeason={handleUpdateSeason}
            onDeleteSeason={handleDeleteSeason}
          />
        </div>

        {/* Resizable Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            height: '8px',
            backgroundColor: isDragging ? 'var(--color-green)' : 'var(--ink)',
            cursor: 'ns-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background-color 0.15s ease'
          }}
        >
          <div style={{
            width: '60px',
            height: '4px',
            backgroundColor: 'var(--paper)',
            borderRadius: '2px',
            opacity: 0.6
          }} />
        </div>

        {/* Table Area */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          minHeight: `${MIN_TABLE_HEIGHT}px` 
        }}>
          <SensorTable
            sortedSensors={sortedSensors}
            batches={batches}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            onToggleLock={handleToggleLock}
            onDelete={handleDelete}
            onBatchAssign={handleBatchAssign}
            getEraForDate={getEraForDate}
          />
        </div>
      </div>
    </div>
  );
}
