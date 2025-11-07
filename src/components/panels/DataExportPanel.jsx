/**
 * DataExportPanel.jsx
 * 
 * Collapsible panel for data export functionality.
 * Extracted from AGPGenerator.jsx (Sprint C1 Phase 4.2)
 * 
 * Handles:
 * - AGP+ Profile HTML export
 * - Day Profiles HTML export
 * - Database JSON export
 * - Sensor database links
 * 
 * @version 1.0.0
 * @created 2025-11-02
 */

import React from 'react';

function DataExportPanel({
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
  return (
    <div className="mb-4" style={{ 
      background: 'var(--bg-secondary)',
      border: '2px solid var(--border-primary)',
      borderRadius: '4px',
      padding: '1rem',
      marginTop: '1rem'
    }}>
      {/* Sub-buttons for export options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
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
            textTransform: 'uppercase'
          }}
          title="Export AGP+ profile as HTML"
        >
          📊 AGP+ Profile (HTML)
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
            opacity: dayProfiles && dayProfiles.length > 0 ? 1 : 0.5
          }}
          title="Export day profiles as HTML"
        >
          📅 Day Profiles (HTML)
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
            textTransform: 'uppercase'
          }}
          title="Export complete IndexedDB dataset as JSON"
        >
          💾 Export Database (JSON)
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
            textTransform: 'uppercase'
          }}
          title="Import complete dataset from JSON backup"
        >
          📥 Import Database (JSON)
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
            textTransform: 'uppercase'
          }}
          title="View sensor history database"
        >
          🔍 View Sensor History →
        </button>
      </div>
    </div>
  );
}

export default DataExportPanel;
