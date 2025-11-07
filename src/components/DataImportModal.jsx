/**
 * DataImportModal.jsx
 * 
 * Modal for importing database from JSON backup file.
 * Shows validation results before confirming import.
 * 
 * @version 3.8.0
 * @created 2025-11-07
 */

import React from 'react';

export default function DataImportModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  validationResult,
  isValidating 
}) {
  if (!isOpen) return null;

  const hasErrors = validationResult?.errors && validationResult.errors.length > 0;
  const hasWarnings = validationResult?.warnings && validationResult.warnings.length > 0;
  const canImport = validationResult?.valid && !hasErrors;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--bg-primary)',
          border: '3px solid var(--border-primary)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '2rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem'
          }}>
            📥 Import Database (JSON)
          </h2>
          <p style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            {isValidating ? 'Validating file...' : 'Review import before confirming'}
          </p>
        </div>

        {/* Validation State */}
        {isValidating && (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'Courier New, monospace',
            color: 'var(--text-secondary)'
          }}>
            ⏳ Validating import file...
          </div>
        )}

        {/* Validation Results */}
        {!isValidating && validationResult && (
          <>
            {/* Summary */}
            <div style={{
              padding: '1rem',
              background: canImport ? 'var(--bg-secondary)' : '#fee',
              border: '2px solid',
              borderColor: canImport ? 'var(--border-primary)' : '#c00',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
                color: canImport ? 'var(--text-primary)' : '#c00'
              }}>
                {canImport ? '✅ Ready to Import' : '❌ Validation Failed'}
              </div>
              
              {validationResult.summary && (
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}>
                  <div>📊 Months: {validationResult.summary.months}</div>
                  <div>📈 Readings: {validationResult.summary.readings}</div>
                  <div>📍 Sensors: {validationResult.summary.sensors}</div>
                  <div>💉 Cartridges: {validationResult.summary.cartridges}</div>
                  {validationResult.summary.workdays > 0 && (
                    <div>📅 Workdays: {validationResult.summary.workdays}</div>
                  )}
                  {validationResult.summary.hasPatientInfo && (
                    <div>👤 Patient Info: Yes</div>
                  )}
                  {validationResult.summary.stockBatches > 0 && (
                    <div>📦 Stock Batches: {validationResult.summary.stockBatches}</div>
                  )}
                  {validationResult.summary.stockAssignments > 0 && (
                    <div>🔗 Stock Assignments: {validationResult.summary.stockAssignments}</div>
                  )}
                </div>
              )}
            </div>

            {/* Errors */}
            {hasErrors && (
              <div style={{
                padding: '1rem',
                background: '#fee',
                border: '2px solid #c00',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  color: '#c00'
                }}>
                  ❌ Errors
                </div>
                {validationResult.errors.map((error, i) => (
                  <div key={i} style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: '#900'
                  }}>
                    • {error}
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {hasWarnings && (
              <div style={{
                padding: '1rem',
                background: '#fffacd',
                border: '2px solid #fa0',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  color: '#c60'
                }}>
                  ⚠️ Warnings
                </div>
                {validationResult.warnings.map((warning, i) => (
                  <div key={i} style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: '#c60'
                  }}>
                    • {warning}
                  </div>
                ))}
              </div>
            )}

            {/* Import Warning */}
            {canImport && (
              <div style={{
                padding: '1rem',
                background: '#fffacd',
                border: '2px solid #fa0',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  color: '#c60'
                }}>
                  ⚠️ <strong>Warning:</strong> This will add data to your existing database. 
                  If you want to replace all data, clear your database first using the Data Management panel.
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        {!isValidating && validationResult && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-primary)',
                color: 'var(--text-primary)',
                fontFamily: 'Courier New, monospace',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!canImport}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                background: canImport ? 'var(--color-black)' : 'var(--bg-secondary)',
                border: '2px solid var(--border-primary)',
                color: canImport ? 'var(--color-white)' : 'var(--text-secondary)',
                fontFamily: 'Courier New, monospace',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: canImport ? 'pointer' : 'not-allowed',
                opacity: canImport ? 1 : 0.5
              }}
            >
              📥 Import Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
