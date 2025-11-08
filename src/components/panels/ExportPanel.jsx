/**
 * ExportPanel.jsx
 * 
 * Panel for data export functionality.
 * Extracted from AGPGenerator.jsx (Sprint C1 Phase 4.2)
 * 
 * Handles:
 * - AGP+ Profile HTML export
 * - Day Profiles HTML export
 * - Database JSON export
 * - Sensor database links
 * 
 * @version 1.1.0
 * @updated 2025-11-08 - Added collapsible, removed emoji's, 3-col grid
 */

import React, { useState } from 'react';

function ExportPanel({
  // Export handlers
  onExportHTML,
  onExportDayProfiles,
  onExportDatabase,
  
  // Import handler
  onImportDatabase,
  
  // Data availability
  dayProfiles,
  patientInfo
}) {
  // Collapsible state
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="mb-4" style={{ 
      background: 'var(--bg-secondary)',
      border: '2px solid var(--border-primary)',
      borderRadius: '4px',
      padding: isCollapsed ? '0.5rem 1rem' : '1rem',
      marginTop: '0'
    }}>
      {/* Collapse Toggle Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          padding: isCollapsed ? '0' : '0 0 0.75rem 0',
          marginBottom: isCollapsed ? '0' : '0.75rem',
          borderBottom: isCollapsed ? 'none' : '2px solid var(--border-primary)',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontFamily: 'Courier New, monospace',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}
      >
        <span>Export Options</span>
        <span style={{ fontSize: '1rem' }}>{isCollapsed ? '▼' : '▲'}</span>
      </button>
      
      {!isCollapsed && (
        <>
          {/* Sub-buttons for export options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem'
          }}>
            <button
              onClick={onExportHTML}
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--border-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              title="Export AGP+ profile as HTML"
            >
              AGP+ Profile (HTML)
            </button>

            <button
              onClick={onExportDayProfiles}
              disabled={!dayProfiles || dayProfiles.length === 0}
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--border-primary)',
                color: dayProfiles && dayProfiles.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: dayProfiles && dayProfiles.length > 0 ? 'pointer' : 'not-allowed',
                padding: '1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: dayProfiles && dayProfiles.length > 0 ? 1 : 0.5
              }}
              title="Export day profiles as HTML"
            >
              Day Profiles (HTML)
            </button>

            <button
              onClick={onExportDatabase}
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--border-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              title="Export complete IndexedDB dataset as JSON"
            >
              Export Database (JSON)
            </button>

            <button
              onClick={onImportDatabase}
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--border-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              title="Import complete dataset from JSON backup"
            >
              Import Database (JSON)
            </button>

            <button
              onClick={() => {
                window.open('/Users/jomostert/Documents/Projects/Sensoren/sensor_database_brutalist.html', '_blank');
              }}
              style={{
                background: 'var(--bg-primary)',
                border: '2px solid var(--border-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              title="View sensor history database"
            >
              View Sensor History
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ExportPanel;
