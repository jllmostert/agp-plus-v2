/**
 * HeaderBar.jsx
 * 
 * Main navigation header with 4 primary panels + keyboard shortcuts help
 * Follows brutalist design principles with high contrast and bold typography
 * 
 * @version 3.9.0 (Session 18: Added keyboard shortcuts legend)
 */

import React, { useState } from 'react';

export default function HeaderBar({ activePanel, onPanelChange }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const panels = [
    { id: 'import', label: 'IMPORT', shortcut: 'Ctrl+1' },
    { id: 'dagprofielen', label: 'DAGPROFIELEN', shortcut: 'Ctrl+2' },
    { id: 'sensoren', label: 'SENSOREN', shortcut: 'Ctrl+3' },
    { id: 'export', label: 'EXPORT', shortcut: 'Ctrl+4' }
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
        
        {/* Keyboard Shortcuts Help Button */}
        <button
          onClick={() => setShowShortcuts(prev => !prev)}
          aria-label="Show keyboard shortcuts"
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '1rem',
            fontWeight: 'bold',
            padding: '0.75rem',
            border: '3px solid var(--border-primary)',
            background: showShortcuts ? '#00ff00' : 'transparent',
            color: showShortcuts ? '#000000' : 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Keyboard Shortcuts"
        >
          ⌨️
        </button>
      </nav>
      
      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '3px solid var(--border-primary)',
              padding: '2rem',
              minWidth: '400px',
              fontFamily: 'Courier New, monospace'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.5rem',
              fontWeight: 'bold',
              borderBottom: '3px solid var(--border-primary)',
              paddingBottom: '0.5rem'
            }}>
              ⌨️ KEYBOARD SHORTCUTS
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Ctrl+1</span>
                <span>Switch to IMPORT panel</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Ctrl+2</span>
                <span>Switch to DAGPROFIELEN panel</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Ctrl+3</span>
                <span>Switch to SENSOREN panel</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Ctrl+4</span>
                <span>Switch to EXPORT panel</span>
              </div>
              <div style={{ 
                borderTop: '3px solid var(--border-primary)',
                paddingTop: '1rem',
                marginTop: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 'bold' }}>Ctrl+Shift+D</span>
                  <span>Toggle DevTools</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 'bold' }}>Esc</span>
                  <span>Close DevTools</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>Tab</span>
                  <span>Navigate elements</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowShortcuts(false)}
              style={{
                marginTop: '1.5rem',
                width: '100%',
                fontFamily: 'Courier New, monospace',
                fontSize: '1rem',
                fontWeight: 'bold',
                padding: '0.75rem',
                border: '3px solid var(--border-primary)',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              CLOSE [Esc]
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
