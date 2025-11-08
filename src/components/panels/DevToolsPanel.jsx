/**
 * DevToolsPanel.jsx
 * 
 * Panel for developer tools (sensor debugging, SQLite import, etc.)
 * Hidden by default, accessible via Ctrl+Shift+D
 * 
 * @version 3.9.0
 */

import React, { useState } from 'react';
import DebugPanel from '../devtools/DebugPanel';
import SensorSQLiteImport from '../devtools/SensorSQLiteImport';

export default function DevToolsPanel({ onClose, onSensorRegistrationOpen }) {
  const [activeTool, setActiveTool] = useState('debug');

  return (
    <div className="panel devtools-panel" style={{
      padding: '2rem',
      border: '3px solid var(--border-primary)',
      background: 'var(--bg-primary)',
      minHeight: '100vh'
    }}>
      {/* Header with close button */}
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
          🛠️ Developer Tools
        </h2>
        
        <button
          onClick={onClose}
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '1rem',
            fontWeight: 'bold',
            padding: '0.5rem 1rem',
            border: '2px solid var(--border-primary)',
            background: 'var(--color-red)',
            color: '#fff',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Tool selector tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid var(--border-secondary)',
        paddingBottom: '1rem'
      }}>
        <button
          onClick={() => setActiveTool('sensors')}
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            border: '2px solid var(--border-primary)',
            background: activeTool === 'sensors' ? 'var(--color-green)' : 'var(--bg-secondary)',
            color: activeTool === 'sensors' ? '#000' : 'var(--text-primary)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          🔬 Sensors
        </button>
        
        <button
          onClick={() => setActiveTool('insulin')}
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            border: '2px solid var(--border-primary)',
            background: activeTool === 'insulin' ? 'var(--color-green)' : 'var(--bg-secondary)',
            color: activeTool === 'insulin' ? '#000' : 'var(--text-primary)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          💉 Insulin
        </button>
        
        <button
          onClick={() => setActiveTool('debug')}
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            border: '2px solid var(--border-primary)',
            background: activeTool === 'debug' ? 'var(--color-green)' : 'var(--bg-secondary)',
            color: activeTool === 'debug' ? '#000' : 'var(--text-primary)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          🐛 Sensor Debug
        </button>
        
        <button
          onClick={() => setActiveTool('sqlite')}
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            border: '2px solid var(--border-primary)',
            background: activeTool === 'sqlite' ? 'var(--color-green)' : 'var(--bg-secondary)',
            color: activeTool === 'sqlite' ? '#000' : 'var(--text-primary)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          💾 SQLite Import
        </button>
      </div>

      {/* Warning banner */}
      <div style={{
        padding: '1rem',
        background: '#fffacd',
        border: '2px solid #fa0',
        marginBottom: '2rem',
        fontFamily: 'Courier New, monospace',
        fontSize: '0.875rem'
      }}>
        ⚠️ <strong>Developer Tools</strong>: These tools are for debugging and development only. 
        They are hidden in production builds unless explicitly enabled.
      </div>

      {/* Tool content */}
      <div className="tool-content">
        {activeTool === 'sensors' && (
          <div style={{
            padding: '2rem',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-primary)',
            fontFamily: 'Courier New, monospace'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>🔬 Sensor Registration</h3>
            <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
              Register new sensors from CareLink CSV exports. This tool extracts sensor information
              and adds them to your sensor database.
            </p>
            <button
              onClick={() => {
                onSensorRegistrationOpen();
                onClose(); // Close DevTools after opening sensor modal
              }}
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '1rem',
                fontWeight: 'bold',
                padding: '1rem 2rem',
                border: '3px solid var(--border-primary)',
                background: 'var(--color-green)',
                color: '#000',
                cursor: 'pointer',
                textTransform: 'uppercase',
                width: '100%'
              }}
            >
              Open Sensor Registration
            </button>
          </div>
        )}
        
        {activeTool === 'insulin' && (
          <div style={{
            padding: '2rem',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-primary)',
            fontFamily: 'Courier New, monospace'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>💉 Insulin TDD Debug</h3>
            <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
              Debug tool for Total Daily Dose (TDD) calculations. Opens in a new window
              for detailed insulin delivery analysis.
            </p>
            <button
              onClick={() => {
                window.open('/debug/insulin-tdd.html', '_blank');
              }}
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '1rem',
                fontWeight: 'bold',
                padding: '1rem 2rem',
                border: '3px solid var(--border-primary)',
                background: 'var(--color-green)',
                color: '#000',
                cursor: 'pointer',
                textTransform: 'uppercase',
                width: '100%'
              }}
            >
              Open Insulin Debugger
            </button>
          </div>
        )}
        
        {activeTool === 'debug' && <DebugPanel />}
        {activeTool === 'sqlite' && <SensorSQLiteImport />}
      </div>
    </div>
  );
}
