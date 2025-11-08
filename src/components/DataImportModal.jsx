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
  isValidating,
  mergeStrategy = 'append',
  onMergeStrategyChange,
  lastImport = null,
  createBackup = true,
  onCreateBackupChange,
  lastBackupFile = null
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

        {/* Last Import Info */}
        {lastImport && !isValidating && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border-primary)',
            marginBottom: '1.5rem',
            fontFamily: 'Courier New, monospace',
            fontSize: '0.75rem'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
              color: 'var(--text-secondary)'
            }}>
              📜 Last Import
            </div>
            <div style={{ 
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--text-primary)'
            }}>
              <div>
                📅 {(() => {
                  const now = new Date();
                  const then = new Date(lastImport.timestamp);
                  const diffMs = now - then;
                  const minutes = Math.floor(diffMs / (1000 * 60));
                  const hours = Math.floor(minutes / 60);
                  const days = Math.floor(hours / 24);
                  
                  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
                  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
                  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
                  return 'just now';
                })()}
              </div>
              <div>📊 {lastImport.recordCount} records</div>
              <div>📁 {lastImport.filename}</div>
              <div>
                {lastImport.strategy === 'replace' ? '🔄 Replace' : '➕ Append'}
              </div>
            </div>
          </div>
        )}

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

            {/* Merge Strategy Selection */}
            {canImport && (
              <div style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-primary)',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                  color: 'var(--text-primary)'
                }}>
                  📊 Import Strategy
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {/* Append Option */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    background: mergeStrategy === 'append' ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
                    border: `2px solid ${mergeStrategy === 'append' ? '#0f0' : 'transparent'}`,
                    fontFamily: 'Courier New, monospace',
                    fontSize: '0.875rem'
                  }}>
                    <input
                      type="radio"
                      name="mergeStrategy"
                      value="append"
                      checked={mergeStrategy === 'append'}
                      onChange={(e) => onMergeStrategyChange(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        ➕ Append (Add to existing data)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Keeps your current data and adds imported data
                      </div>
                    </div>
                  </label>

                  {/* Replace Option */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    background: mergeStrategy === 'replace' ? 'rgba(255, 0, 0, 0.1)' : 'transparent',
                    border: `2px solid ${mergeStrategy === 'replace' ? '#f00' : 'transparent'}`,
                    fontFamily: 'Courier New, monospace',
                    fontSize: '0.875rem'
                  }}>
                    <input
                      type="radio"
                      name="mergeStrategy"
                      value="replace"
                      checked={mergeStrategy === 'replace'}
                      onChange={(e) => onMergeStrategyChange(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        🔄 Replace (Clear existing data first)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Deletes all current data before importing
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Backup Before Import */}
            {canImport && (
              <div style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                border: '2px solid var(--border-primary)',
                marginBottom: '1rem'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.875rem'
                }}>
                  <input
                    type="checkbox"
                    checked={createBackup}
                    onChange={(e) => onCreateBackupChange(e.target.checked)}
                    style={{ 
                      cursor: 'pointer',
                      marginTop: '0.25rem'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem'
                    }}>
                      💾 Create backup before importing
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5
                    }}>
                      Recommended for safety. A backup file will be downloaded automatically before importing.
                    </div>
                    
                    {lastBackupFile && (
                      <div style={{ 
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(0, 255, 0, 0.1)',
                        border: '1px solid #0f0',
                        fontSize: '0.75rem',
                        color: '#0f0'
                      }}>
                        ✅ Backup ready: {lastBackupFile.filename}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            )}

            {/* Import Warning */}
            {canImport && (
              <div style={{
                padding: '1rem',
                background: mergeStrategy === 'replace' ? '#fee' : '#fffacd',
                border: `2px solid ${mergeStrategy === 'replace' ? '#f00' : '#fa0'}`,
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  color: mergeStrategy === 'replace' ? '#c00' : '#c60'
                }}>
                  {mergeStrategy === 'append' ? (
                    <>
                      ⚠️ <strong>Append Mode:</strong> Imported data will be added to your existing database. 
                      Duplicate records will be skipped automatically.
                    </>
                  ) : (
                    <>
                      🔥 <strong>Replace Mode:</strong> All existing data will be permanently deleted before importing! 
                      This action cannot be undone. Make sure you have a backup if needed.
                    </>
                  )}
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
