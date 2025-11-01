/**
 * DataLoadingContainer.jsx
 * 
 * Container for data import and export functionality.
 * Extracted from AGPGenerator.jsx (Sprint C1 Phase 2)
 * 
 * @version 1.0.0
 * @created 2025-11-02
 */

import React, { useState } from 'react';

function DataLoadingContainer({
  // Upload props
  csvData,
  workdays,
  
  // Export props  
  metricsResult,
  startDate,
  endDate
}) {
  // Local state
  const [dataImportExpanded, setDataImportExpanded] = useState(false);
  const [dataExportExpanded, setDataExportExpanded] = useState(false);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '1rem',
      marginBottom: '1rem'
    }}>
      
      {/* 1. IMPORT Button (Collapsible) */}
      <button
        onClick={() => setDataImportExpanded(!dataImportExpanded)}
        style={{
          background: dataImportExpanded ? 'var(--color-black)' : 'var(--bg-secondary)',
          border: '3px solid var(--border-primary)',
          color: dataImportExpanded ? 'var(--color-white)' : 'var(--text-primary)',
          cursor: 'pointer',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          minHeight: '100px'
        }}
        title="Upload and import data"
      >
        <h2 style={{ 
          fontSize: '0.875rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 0
        }}>
          {dataImportExpanded ? '▼' : '▶'} IMPORT
        </h2>
        <span style={{ 
          fontSize: '0.625rem',
          color: dataImportExpanded ? 'var(--color-white)' : 'var(--text-secondary)',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          Data Sources
        </span>
        {csvData && (
          <span style={{ 
            fontSize: '1.25rem',
            color: 'var(--color-green)',
            marginTop: '0.25rem'
          }}>
            ✓
          </span>
        )}
      </button>
      
      {/* Placeholder for other buttons (will stay in AGPGenerator) */}
      <div />
      <div />
      <div />
      
      {/* 5. EXPORT Button (Collapsible) */}
      <button
        onClick={() => setDataExportExpanded(!dataExportExpanded)}
        disabled={!metricsResult || !startDate || !endDate}
        style={{
          background: dataExportExpanded ? 'var(--color-black)' : (metricsResult && startDate && endDate ? 'var(--bg-secondary)' : 'var(--bg-primary)'),
          border: '3px solid var(--border-primary)',
          color: dataExportExpanded ? 'var(--color-white)' : (metricsResult && startDate && endDate ? 'var(--text-primary)' : 'var(--text-secondary)'),
          cursor: metricsResult && startDate && endDate ? 'pointer' : 'not-allowed',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          minHeight: '100px',
          opacity: metricsResult && startDate && endDate ? 1 : 0.5
        }}
        title={!metricsResult ? "Generate metrics first" : "Export options"}
      >
        <h2 style={{ 
          fontSize: '0.875rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 0
        }}>
          {dataExportExpanded ? '▼' : '▶'} EXPORT
        </h2>
        <span style={{ 
          fontSize: '0.625rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          Reports & Data
        </span>
      </button>
      
    </div>
  );
}

export default DataLoadingContainer;
