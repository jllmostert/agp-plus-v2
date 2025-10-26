/**
 * DATA CLEANUP MODAL
 * 
 * Brutalist UI for selectively deleting glucose data and cartridge events.
 * 
 * Features:
 * - Period selector (14d / 30d / custom)
 * - Preview statistics before deletion
 * - Checkbox for cartridge inclusion
 * - Destructive action with confirmation
 * - Success/error feedback
 * 
 * @component DataCleanupModal
 * @version 3.8.5
 */

import React from 'react';
import { CLEANUP_PERIODS } from '../hooks/useDataCleanup.js';
import '../styles/DataCleanupModal.css';

export default function DataCleanupModal({
  isOpen,
  period,
  customStartDate,
  customEndDate,
  includeCartridges,
  preview,
  isLoadingPreview,
  isExecuting,
  summary,
  error,
  onClose,
  onPeriodChange,
  onCustomDatesChange,
  onCartridgeToggle,
  onCleanup,
  onRefreshDataset
}) {

  if (!isOpen) return null;

  // Show success summary
  if (summary && summary.success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content cleanup-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>CLEANUP VOLTOOID</h2>
          </div>
          
          <div className="modal-body">
            <div className="success-summary">
              <p className="mono">✅ Data succesvol verwijderd</p>
              
              <div className="summary-stats">
                <p><strong>{summary.readingsDeleted.toLocaleString()}</strong> glucose readings</p>
                {includeCartridges && (
                  <p><strong>{summary.cartridgesDeleted}</strong> cartridge events</p>
                )}
              </div>
              
              <p className="info-text">
                Cache wordt automatisch opnieuw opgebouwd bij volgende gebruik.
              </p>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="btn-primary"
              onClick={() => {
                onClose();
                onRefreshDataset();
              }}
            >
              SLUITEN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main modal UI
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cleanup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>DATA OPRUIMEN</h2>
        </div>
        
        <div className="modal-body">
          {/* Warning */}
          <div className="warning-box">
            <p className="mono">⚠️ WAARSCHUWING</p>
            <p>
              Deze actie verwijdert glucose data maar behoudt sensor informatie.
              Cartridge events kunnen optioneel worden verwijderd.
            </p>
          </div>
          
          {/* Period Selector */}
          <div className="form-group">
            <label className="mono">PERIODE:</label>
            <select 
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="period-select"
              disabled={isExecuting}
            >
              {Object.values(CLEANUP_PERIODS).map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range (if selected) */}
          {period === 'custom' && (
            <div className="custom-dates">
              <div className="form-group">
                <label className="mono">START DATUM:</label>
                <input
                  type="date"
                  value={customStartDate ? customStartDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    onCustomDatesChange(date, customEndDate);
                  }}
                  disabled={isExecuting}
                />
              </div>
              
              <div className="form-group">
                <label className="mono">EIND DATUM:</label>
                <input
                  type="date"
                  value={customEndDate ? customEndDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    onCustomDatesChange(customStartDate, date);
                  }}
                  disabled={isExecuting}
                />
              </div>
            </div>
          )}
          
          {/* Preview Stats */}
          {isLoadingPreview && (
            <div className="preview-loading">
              <p className="mono">Berekenen...</p>
            </div>
          )}
          
          {preview && !isLoadingPreview && (
            <div className="preview-stats">
              <p className="mono">TE VERWIJDEREN:</p>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{preview.readingCount.toLocaleString()}</span>
                  <span className="stat-label">glucose readings</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{preview.cartridgeCount}</span>
                  <span className="stat-label">cartridge events</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{preview.affectedMonths}</span>
                  <span className="stat-label">maanden geraakt</span>
                </div>
              </div>
            </div>
          )}

          {/* Cartridge Checkbox */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeCartridges}
                onChange={(e) => onCartridgeToggle(e.target.checked)}
                disabled={isExecuting}
              />
              <span>Inclusief cartridge changes</span>
            </label>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="error-box">
              <p className="mono">❌ FOUT</p>
              <p>{error}</p>
            </div>
          )}
        </div>
        
        {/* Footer Buttons */}
        <div className="modal-footer">
          <button 
            className="btn-secondary"
            onClick={onClose}
            disabled={isExecuting}
          >
            ANNULEREN
          </button>
          
          <button 
            className="btn-danger"
            onClick={onCleanup}
            disabled={isExecuting || !preview || preview.readingCount === 0}
          >
            {isExecuting ? 'BEZIG...' : 'OPRUIMEN'}
          </button>
        </div>
      </div>
    </div>
  );
}
