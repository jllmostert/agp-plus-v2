/**
 * DevToolsPanel.jsx
 * 
 * Panel for developer tools (insulin debugger, SQLite import, etc.)
 * Hidden by default, accessible via Ctrl+Shift+D
 * 
 * @version 3.9.0
 */

import React from 'react';

export default function DevToolsPanel({ onClose }) {
  return (
    <div className="panel devtools-panel" style={{
      padding: '2rem',
      border: '3px solid var(--border-primary)',
      background: 'var(--bg-primary)',
      height: '100%',
      overflow: 'auto'
    }}>
      {/* Close button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        borderBottom: '3px solid var(--border-primary)',
        paddingBottom: '1rem'
      }}>
        <h2 style={{
          fontFamily: 'Courier New, monospace',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          margin: 0
        }}>
          ⚙️ DevTools
        </h2>
        
        <button
          onClick={onClose}
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '1rem',
            fontWeight: 'bold',
            padding: '0.5rem 1rem',
            border: '2px solid var(--border-primary)',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          ✕ Close
        </button>
      </div>
      
      <p style={{
        fontFamily: 'Courier New, monospace',
        color: 'var(--text-secondary)',
        marginBottom: '1rem'
      }}>
        Developer tools panel - To be implemented
      </p>
      
      <div style={{
        padding: '1rem',
        border: '2px solid var(--border-secondary)',
        background: 'var(--bg-secondary)',
        fontFamily: 'Monaco, monospace',
        fontSize: '0.875rem'
      }}>
        <p>🔧 Insulin Debugger - Coming soon</p>
        <p>📊 SQLite Import - Coming soon</p>
        <p>🐛 Debug Tools - Coming soon</p>
      </div>
    </div>
  );
}
