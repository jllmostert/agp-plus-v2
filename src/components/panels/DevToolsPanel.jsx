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
import SensorImport from '../SensorImport';
import StockImportExport from '../StockImportExport';
import * as sensorStorage from '../../storage/sensorStorage';

export default function DevToolsPanel({ onClose, onSensorRegistrationOpen }) {
  const [activeTool, setActiveTool] = useState('debug');

  const handleResequence = async () => {
    if (!confirm('Sensors hernummeren?\n\nOudste sensor krijgt #1, nieuwste het hoogste nummer.\n\nDeze actie kan niet ongedaan worden.')) {
      return;
    }
    
    const result = await sensorStorage.resequenceSensors();
    if (result.success) {
      alert(`✓ ${result.message}`);
    } else {
      alert(`❌ Hernummering mislukt: ${result.error}`);
    }
  };

  const handleUpdateHardwareVersions = async () => {
    if (!confirm('Hardware versies updaten?\n\n• Sensoren vanaf 3 juli 2025 → A2.01\n• Sensoren daarvoor → A1.01\n\nDeze actie kan niet ongedaan worden.')) {
      return;
    }
    
    const result = await sensorStorage.updateHardwareVersions();
    if (result.success) {
      alert(`✓ ${result.message}`);
    } else {
      alert(`❌ Update mislukt: ${result.error}`);
    }
  };

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
          Developer Tools
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
          CLOSE
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
          onClick={() => setActiveTool('admin')}
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            border: '2px solid var(--border-primary)',
            background: activeTool === 'admin' ? 'var(--color-green)' : 'var(--bg-secondary)',
            color: activeTool === 'admin' ? '#000' : 'var(--text-primary)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Admin
        </button>
        
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
          Sensors
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
          Insulin
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
          Debug
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
          SQLite
        </button>
        
        <button
          onClick={() => setActiveTool('import-export')}
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            border: '2px solid var(--border-primary)',
            background: activeTool === 'import-export' ? 'var(--color-green)' : 'var(--bg-secondary)',
            color: activeTool === 'import-export' ? '#000' : 'var(--text-primary)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Import/Export
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
        <strong>Developer Tools</strong>: These tools are for debugging and development only. 
        They are hidden in production builds unless explicitly enabled.
      </div>

      {/* Tool content */}
      <div className="tool-content">
        {activeTool === 'admin' && (
          <div style={{
            padding: '2rem',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-primary)',
            fontFamily: 'Courier New, monospace'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Sensor Admin Functions</h3>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Administrative functions for bulk sensor operations. These actions cannot be undone.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={handleResequence}
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  padding: '1rem 2rem',
                  border: '3px solid var(--border-primary)',
                  background: 'var(--color-blue)',
                  color: '#fff',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  width: '100%'
                }}
              >
                HERNUMMER SENSOREN
              </button>
              <p style={{ fontSize: '0.875rem', marginTop: '-0.5rem', color: 'var(--text-secondary)' }}>
                Oudste sensor krijgt #1, nieuwste het hoogste nummer (chronologisch gesorteerd op start datum)
              </p>
              
              <button
                onClick={handleUpdateHardwareVersions}
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  padding: '1rem 2rem',
                  border: '3px solid var(--border-primary)',
                  background: 'var(--color-blue)',
                  color: '#fff',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  width: '100%'
                }}
              >
                UPDATE HARDWARE VERSIES
              </button>
              <p style={{ fontSize: '0.875rem', marginTop: '-0.5rem', color: 'var(--text-secondary)' }}>
                Sensoren vanaf 3 juli 2025 → A2.01, daarvoor → A1.01 (automatische toewijzing)
              </p>
            </div>
          </div>
        )}
        
        {activeTool === 'sensors' && (
          <div style={{
            padding: '2rem',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-primary)',
            fontFamily: 'Courier New, monospace'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Sensor Registration</h3>
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
        
        {activeTool === 'import-export' && (
          <div>
            <div style={{
              fontFamily: 'Courier New, monospace',
              marginBottom: '1rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-primary)'
            }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>📦 Import/Export Tools</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6, opacity: 0.8 }}>
                Import sensors from JSON or SQLite databases, and export/import stock batches 
                with sensor connections.
              </p>
            </div>
            
            <SensorImport />
            <StockImportExport />
            
            <div style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '0.75rem',
              marginTop: '2rem',
              padding: '1rem',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'var(--text-secondary)'
            }}>
              <strong>Features:</strong><br />
              • Sensor import: JSON and SQLite support<br />
              • Stock import: Automatic sensor reconnection<br />
              • Duplicate detection: Skip existing records<br />
              • Validation: Pre-check files before import<br />
              • Merge mode: Preserve existing data
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
