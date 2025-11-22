/**
 * SeasonManager.jsx - Season CRUD interface
 * 
 * Manages device hardware seasons (pump/transmitter combinations over time).
 * Part of SensorHistoryPanel split (Fase 3, v4.5.0).
 * 
 * Created: 2025-11-22
 */

import React from 'react';

export default function SeasonManager({
  seasons,
  seasonManageExpanded,
  setSeasonManageExpanded,
  editingSeason,
  setEditingSeason,
  newSeason,
  setNewSeason,
  onAddSeason,
  onUpdateSeason,
  onDeleteSeason
}) {
  return (
    <div style={{ marginTop: '15px' }}>
      {/* Expand/Collapse Button */}
      <button
        onClick={() => setSeasonManageExpanded(!seasonManageExpanded)}
        style={{
          width: '100%',
          padding: '10px 15px',
          border: '2px solid var(--color-green)',
          backgroundColor: seasonManageExpanded ? 'var(--color-green)' : 'var(--paper)',
          color: seasonManageExpanded ? 'var(--paper)' : 'var(--color-green)',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'left'
        }}
      >
        {seasonManageExpanded ? '▼' : '▶'} SEIZOENEN BEHEREN ({seasons.length})
      </button>
      
      {seasonManageExpanded && (
        <div style={{ 
          padding: '15px', 
          border: '2px solid var(--color-green)', 
          borderTop: 'none', 
          backgroundColor: 'var(--bg-secondary)' 
        }}>
          {/* Existing Seasons List */}
          <ExistingSeasonsList
            seasons={seasons}
            editingSeason={editingSeason}
            setEditingSeason={setEditingSeason}
            onUpdateSeason={onUpdateSeason}
            onDeleteSeason={onDeleteSeason}
          />
          
          {/* Add New Season Form */}
          <AddSeasonForm
            newSeason={newSeason}
            setNewSeason={setNewSeason}
            onAddSeason={onAddSeason}
          />
        </div>
      )}
    </div>
  );
}

// ====== SUB-COMPONENTS ======

/**
 * ExistingSeasonsList - Display and edit existing seasons
 */
function ExistingSeasonsList({ 
  seasons, 
  editingSeason, 
  setEditingSeason, 
  onUpdateSeason, 
  onDeleteSeason 
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '10px', 
        fontSize: '11px', 
        color: 'var(--text-secondary)' 
      }}>
        BESTAANDE SEIZOENEN
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {seasons.map(season => (
          <div 
            key={season.id} 
            style={{ 
              padding: '10px', 
              border: '2px solid var(--ink)', 
              backgroundColor: editingSeason?.id === season.id ? 'var(--bg-tertiary)' : 'var(--paper)',
              display: 'grid',
              gridTemplateColumns: editingSeason?.id === season.id ? '1fr' : '1fr auto',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            {editingSeason?.id === season.id ? (
              <SeasonEditMode
                editingSeason={editingSeason}
                setEditingSeason={setEditingSeason}
                onUpdate={() => onUpdateSeason(season.id)}
                onCancel={() => setEditingSeason(null)}
              />
            ) : (
              <SeasonViewMode
                season={season}
                onEdit={() => setEditingSeason({...season})}
                onDelete={() => onDeleteSeason(season.id, season.name)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SeasonEditMode - Edit form for a season
 */
function SeasonEditMode({ editingSeason, setEditingSeason, onUpdate, onCancel }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
      <input
        type="text"
        value={editingSeason.name}
        onChange={(e) => setEditingSeason({...editingSeason, name: e.target.value})}
        placeholder="Naam"
        style={{ 
          padding: '6px', 
          border: '1px solid var(--ink)', 
          fontFamily: 'monospace', 
          fontSize: '11px' 
        }}
      />
      <input
        type="datetime-local"
        value={editingSeason.start?.slice(0, 16) || ''}
        onChange={(e) => setEditingSeason({
          ...editingSeason, 
          start: e.target.value ? new Date(e.target.value).toISOString() : ''
        })}
        style={{ 
          padding: '6px', 
          border: '1px solid var(--ink)', 
          fontFamily: 'monospace', 
          fontSize: '11px' 
        }}
      />
      <input
        type="datetime-local"
        value={editingSeason.end?.slice(0, 16) || ''}
        onChange={(e) => setEditingSeason({
          ...editingSeason, 
          end: e.target.value ? new Date(e.target.value).toISOString() : null
        })}
        style={{ 
          padding: '6px', 
          border: '1px solid var(--ink)', 
          fontFamily: 'monospace', 
          fontSize: '11px' 
        }}
      />
      <input
        type="text"
        value={editingSeason.pump?.serial || ''}
        onChange={(e) => setEditingSeason({
          ...editingSeason, 
          pump: {...editingSeason.pump, serial: e.target.value}
        })}
        placeholder="Pomp S/N"
        style={{ 
          padding: '6px', 
          border: '1px solid var(--ink)', 
          fontFamily: 'monospace', 
          fontSize: '11px' 
        }}
      />
      <input
        type="text"
        value={editingSeason.pump?.fw_version || ''}
        onChange={(e) => setEditingSeason({
          ...editingSeason, 
          pump: {...editingSeason.pump, fw_version: e.target.value}
        })}
        placeholder="Pomp FW"
        style={{ 
          padding: '6px', 
          border: '1px solid var(--ink)', 
          fontFamily: 'monospace', 
          fontSize: '11px' 
        }}
      />
      <input
        type="text"
        value={editingSeason.transmitter?.serial || ''}
        onChange={(e) => setEditingSeason({
          ...editingSeason, 
          transmitter: {...editingSeason.transmitter, serial: e.target.value}
        })}
        placeholder="TX S/N"
        style={{ 
          padding: '6px', 
          border: '1px solid var(--ink)', 
          fontFamily: 'monospace', 
          fontSize: '11px' 
        }}
      />
      <div style={{ gridColumn: 'span 3', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button 
          onClick={onUpdate} 
          style={{ 
            padding: '6px 12px', 
            border: '2px solid var(--color-green)', 
            backgroundColor: 'var(--color-green)', 
            color: 'var(--paper)', 
            fontFamily: 'monospace', 
            fontWeight: 'bold', 
            cursor: 'pointer' 
          }}
        >
          OPSLAAN
        </button>
        <button 
          onClick={onCancel} 
          style={{ 
            padding: '6px 12px', 
            border: '2px solid var(--ink)', 
            backgroundColor: 'var(--paper)', 
            color: 'var(--ink)', 
            fontFamily: 'monospace', 
            cursor: 'pointer' 
          }}
        >
          ANNULEER
        </button>
      </div>
    </div>
  );
}

/**
 * SeasonViewMode - Display season info with edit/delete buttons
 */
function SeasonViewMode({ season, onEdit, onDelete }) {
  return (
    <>
      <div style={{ fontSize: '11px' }}>
        <strong>#{season.season} {season.name}</strong>
        <span style={{ color: 'var(--text-secondary)', marginLeft: '10px' }}>
          {new Date(season.start).toLocaleDateString('nl-NL')} – {season.end ? new Date(season.end).toLocaleDateString('nl-NL') : 'heden'}
        </span>
        <span style={{ color: 'var(--text-secondary)', marginLeft: '10px' }}>
          Pomp: {season.pump?.serial || '?'} · TX: {season.transmitter?.serial || '?'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button 
          onClick={onEdit} 
          style={{ 
            padding: '4px 8px', 
            border: '1px solid var(--ink)', 
            backgroundColor: 'var(--paper)', 
            fontSize: '10px', 
            cursor: 'pointer', 
            fontFamily: 'monospace' 
          }}
        >
          EDIT
        </button>
        <button 
          onClick={onDelete} 
          style={{ 
            padding: '4px 8px', 
            border: '1px solid var(--color-red)', 
            color: 'var(--color-red)', 
            backgroundColor: 'var(--paper)', 
            fontSize: '10px', 
            cursor: 'pointer', 
            fontFamily: 'monospace' 
          }}
        >
          DEL
        </button>
      </div>
    </>
  );
}

/**
 * AddSeasonForm - Form to add a new season
 */
function AddSeasonForm({ newSeason, setNewSeason, onAddSeason }) {
  return (
    <div>
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '10px', 
        fontSize: '11px', 
        color: 'var(--text-secondary)' 
      }}>
        NIEUW SEIZOEN TOEVOEGEN
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '8px', 
        padding: '10px', 
        border: '2px dashed var(--ink)', 
        backgroundColor: 'var(--paper)' 
      }}>
        <input
          type="text"
          value={newSeason.name}
          onChange={(e) => setNewSeason({...newSeason, name: e.target.value})}
          placeholder="Naam (bijv. Tulp)"
          style={{ 
            padding: '6px', 
            border: '1px solid var(--ink)', 
            fontFamily: 'monospace', 
            fontSize: '11px' 
          }}
        />
        <input
          type="datetime-local"
          value={newSeason.start}
          onChange={(e) => setNewSeason({...newSeason, start: e.target.value})}
          style={{ 
            padding: '6px', 
            border: '1px solid var(--ink)', 
            fontFamily: 'monospace', 
            fontSize: '11px' 
          }}
        />
        <input
          type="datetime-local"
          value={newSeason.end}
          onChange={(e) => setNewSeason({...newSeason, end: e.target.value})}
          placeholder="Eind (leeg = actief)"
          style={{ 
            padding: '6px', 
            border: '1px solid var(--ink)', 
            fontFamily: 'monospace', 
            fontSize: '11px' 
          }}
        />
        <input
          type="text"
          value={newSeason.pump.serial}
          onChange={(e) => setNewSeason({
            ...newSeason, 
            pump: {...newSeason.pump, serial: e.target.value}
          })}
          placeholder="Pomp S/N"
          style={{ 
            padding: '6px', 
            border: '1px solid var(--ink)', 
            fontFamily: 'monospace', 
            fontSize: '11px' 
          }}
        />
        <input
          type="text"
          value={newSeason.pump.fw_version}
          onChange={(e) => setNewSeason({
            ...newSeason, 
            pump: {...newSeason.pump, fw_version: e.target.value}
          })}
          placeholder="Pomp FW"
          style={{ 
            padding: '6px', 
            border: '1px solid var(--ink)', 
            fontFamily: 'monospace', 
            fontSize: '11px' 
          }}
        />
        <input
          type="text"
          value={newSeason.transmitter.serial}
          onChange={(e) => setNewSeason({
            ...newSeason, 
            transmitter: {...newSeason.transmitter, serial: e.target.value}
          })}
          placeholder="TX S/N"
          style={{ 
            padding: '6px', 
            border: '1px solid var(--ink)', 
            fontFamily: 'monospace', 
            fontSize: '11px' 
          }}
        />
        <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onAddSeason} 
            style={{ 
              padding: '8px 16px', 
              border: '2px solid var(--color-green)', 
              backgroundColor: 'var(--color-green)', 
              color: 'var(--paper)', 
              fontFamily: 'monospace', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            + TOEVOEGEN
          </button>
        </div>
      </div>
    </div>
  );
}
