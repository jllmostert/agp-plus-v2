import React, { useState } from 'react';
import { CheckSquare, Square, AlertCircle } from 'lucide-react';

/**
 * BatchAssignmentDialog - Confirmation dialog for auto-assignment suggestions
 * 
 * Shows sensors with matching batches and allows user to confirm assignments.
 * 
 * @param {Array} suggestions - Array of {sensorId, matches: [{batch, confidence}]}
 * @param {Function} onConfirm - Callback with selected assignments: [{sensorId, batchId}]
 * @param {Function} onCancel - Callback when user cancels
 * 
 * @version 1.0.0
 */
export default function BatchAssignmentDialog({ suggestions, onConfirm, onCancel }) {
  // Track which suggestions are selected (default: select all exact matches)
  const [selected, setSelected] = useState(() => {
    const initial = {};
    suggestions.forEach(s => {
      // Auto-select if first match is exact
      initial[s.sensorId] = s.matches[0]?.confidence === 'exact';
    });
    return initial;
  });

  const toggleSelection = (sensorId) => {
    setSelected(prev => ({ ...prev, [sensorId]: !prev[sensorId] }));
  };

  const handleConfirm = () => {
    const assignments = suggestions
      .filter(s => selected[s.sensorId])
      .map(s => ({
        sensorId: s.sensorId,
        batchId: s.matches[0].batch.batch_id
      }));
    
    onConfirm(assignments);
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '3px solid var(--color-black)',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '3px solid var(--color-black)',
          backgroundColor: 'var(--color-green)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: 0,
            color: 'var(--color-black)'
          }}>
            🎯 Batch Toewijzing Voorstellen
          </h2>
          <p style={{
            fontSize: '0.875rem',
            margin: '0.5rem 0 0 0',
            color: 'var(--color-black)'
          }}>
            {suggestions.length} sensor{suggestions.length !== 1 ? 's' : ''} gevonden met matching batches
          </p>
        </div>

        {/* List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {suggestions.map(suggestion => {
            const firstMatch = suggestion.matches[0];
            const isSelected = selected[suggestion.sensorId];
            
            return (
              <div
                key={suggestion.sensorId}
                onClick={() => toggleSelection(suggestion.sensorId)}
                style={{
                  border: '3px solid var(--color-black)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--color-green)' : 'var(--bg-card-dark)',
                  transition: 'background-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isSelected ? (
                    <CheckSquare style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                  ) : (
                    <Square style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      marginBottom: '0.25rem'
                    }}>
                      {suggestion.sensorId}
                    </div>
                    
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-text-secondary)'
                    }}>
                      → Batch: <strong>{firstMatch.batch.lot_number}</strong>
                      {firstMatch.confidence === 'exact' && (
                        <span style={{
                          marginLeft: '0.5rem',
                          padding: '0.125rem 0.5rem',
                          backgroundColor: 'var(--color-green)',
                          color: 'var(--color-black)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          Exact
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '3px solid var(--color-black)',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {selectedCount} van {suggestions.length} geselecteerd
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '0.75rem 1.5rem',
                border: '3px solid var(--color-black)',
                backgroundColor: 'var(--bg-card-dark)',
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              Annuleer
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              style={{
                padding: '0.75rem 1.5rem',
                border: '3px solid var(--color-black)',
                backgroundColor: selectedCount > 0 ? 'var(--color-green)' : 'var(--color-gray)',
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                opacity: selectedCount > 0 ? 1 : 0.5
              }}
            >
              Bevestig ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
