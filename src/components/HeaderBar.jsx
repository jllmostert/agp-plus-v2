/**
 * HeaderBar.jsx
 * 
 * Main navigation header with 4 primary panels
 * Follows brutalist design principles with high contrast and bold typography
 * 
 * @version 3.9.0
 */

import React from 'react';

export default function HeaderBar({ activePanel, onPanelChange }) {
  const panels = [
    { id: 'import', label: 'IMPORT' },
    { id: 'dagprofielen', label: 'DAGPROFIELEN' },
    { id: 'sensoren', label: 'SENSOREN' },
    { id: 'export', label: 'EXPORT' }
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
        justifyContent: 'space-between'
      }}
    >
      {/* Left: AGP+ Title */}
      <div style={{
        fontFamily: 'Courier New, monospace',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: 'var(--text-primary)'
      }}>
        AGP+
      </div>

      {/* Center: Navigation Buttons */}
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
                background: isActive ? '#00ff00' : 'transparent',
                color: isActive ? '#000000' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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

      {/* Right: Version Info */}
      <div
        style={{
          fontFamily: 'Courier New, monospace',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}
      >
        v3.9.0
      </div>
    </header>
  );
}
