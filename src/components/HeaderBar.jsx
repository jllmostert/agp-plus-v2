/**
 * HeaderBar.jsx
 * 
 * Main navigation header with 4 primary panels
 * Follows brutalist design principles with high contrast and bold typography
 * 
 * @version 1.1.0 (Cleaned up: removed keyboard shortcuts modal, moved to footer)
 */

import React from 'react';

export default function HeaderBar({ activePanel, onPanelChange }) {
  const panels = [
    { id: 'import', label: 'IMPORT', shortcut: 'Ctrl+1' },
    { id: 'dagprofielen', label: 'DAGPROFIELEN', shortcut: 'Ctrl+2' },
    { id: 'sensoren', label: 'SENSOREN', shortcut: 'Ctrl+3' },
    { id: 'export', label: 'EXPORT', shortcut: 'Ctrl+4' },
    { id: 'settings', label: 'INSTELLINGEN', shortcut: 'Ctrl+5' }
  ];

  return (
    <header
      style={{
        width: '100%',
        borderBottom: '3px solid var(--border-primary)',
        background: 'var(--bg-primary)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Navigation Buttons Only */}
      <nav
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {panels.map(panel => {
          const isActive = activePanel === panel.id;
          
          return (
            <button
              key={panel.id}
              onClick={() => onPanelChange(panel.id)}
              aria-pressed={isActive}
              aria-label={`${panel.label} panel`}
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                padding: '0.75rem 1.5rem',
                border: '3px solid var(--border-primary)',
                background: isActive ? 'var(--ink)' : 'transparent',
                color: isActive ? 'var(--paper)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.background = 'var(--bg-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              {panel.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
