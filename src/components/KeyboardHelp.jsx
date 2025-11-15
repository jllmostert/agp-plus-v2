/**
 * KeyboardHelp.jsx
 * Simple keyboard shortcuts reference for accessibility
 * 
 * AZERTY-compatible (no number keys, minimal shortcuts)
 */

import React, { useState } from 'react';

export default function KeyboardHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help trigger button - question mark */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Show keyboard shortcuts"
        aria-expanded={isOpen}
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--ink)',
          backgroundColor: 'var(--paper)',
          color: 'var(--ink)',
          cursor: 'pointer',
          fontSize: '18px',
          fontWeight: 'bold',
          fontFamily: 'Courier New, monospace',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Keyboard shortcuts (press ? to toggle)"
      >
        ?
      </button>

      {/* Help panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="keyboard-help-title"
          style={{
            position: 'fixed',
            bottom: '5rem',
            right: '1rem',
            width: '300px',
            backgroundColor: 'var(--paper)',
            border: '3px solid var(--ink)',
            padding: '1rem',
            zIndex: 1001,
            fontFamily: 'Courier New, monospace',
            fontSize: '12px'
          }}
        >
          <h3 
            id="keyboard-help-title"
            style={{ 
              margin: '0 0 1rem 0',
              fontSize: '14px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Toetsenbord
          </h3>

          <div style={{ lineHeight: '1.8' }}>
            <div><strong>F</strong> - Volledig scherm (AGP)</div>
            <div><strong>ESC</strong> - Sluiten / Terug</div>
            <div><strong>?</strong> - Deze hulp</div>
            <div style={{ marginTop: '0.5rem', fontSize: '11px', color: 'var(--text-secondary)' }}>
              Enter/Spatie - Activeren knoppen
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.5rem',
              border: '2px solid var(--ink)',
              backgroundColor: 'var(--paper)',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontFamily: 'Courier New, monospace',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            SLUITEN
          </button>
        </div>
      )}
    </>
  );
}
