/**
 * Stock Import/Export Component
 * 
 * Allows user to:
 * - Export stock batches with sensor assignments
 * - Import stock from JSON files
 * - Validate connections to sensor history
 * 
 * @version 4.2.0 - Stock import/export functionality
 */

import React, { useState } from 'react';
import {
  exportAndDownloadStock,
  importStock,
  validateStockImportFile
} from '../storage/stockImportExport.js';
import { getAllBatches, getAllAssignments } from '../storage/stockStorage.js';

export default function StockImportExport() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationInfo, setValidationInfo] = useState(null);
  
  async function handleExport() {
    setExporting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const batches = getAllBatches();
      const assignments = getAllAssignments();
      
      if (batches.length === 0) {
        alert('⚠️ Geen stock batches om te exporteren.\nVoeg eerst batches toe in het SENSOREN panel.');
        return;
      }
      
      const result = await exportAndDownloadStock();
      
      if (result.success) {
        setSuccess(`✅ Stock geëxporteerd!\n\n📦 ${result.batchCount} batches\n🔗 ${result.assignmentCount} sensor koppelingen\n📄 ${result.filename}`);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      console.error('[StockImportExport] Export error:', err);
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }
  
  async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    setImporting(true);
    setError(null);
    setSuccess(null);
    setValidationInfo(null);
    
    try {
      // Validate file first
      const validation = await validateStockImportFile(file);
      
      if (!validation.valid) {
        throw new Error(validation.errors?.join(', ') || 'Invalid file');
      }
      
      // Show validation info
      setValidationInfo(validation.summary);
      
      // Ask for confirmation
      const message = `Import ${validation.summary.batch_count} batches met ${validation.summary.assignment_count} sensor koppelingen?\n\nDuplicaten worden overgeslagen.`;
      
      if (!confirm(message)) {
        return;
      }
      
      // Import with merge mode and reconnect sensors
      const result = await importStock(file, {
        mergeMode: true,
        validateSensors: true,
        reconnectSensors: true
      });
      
      if (result.success) {
        let message = `✅ Import succesvol!\n\n`;
        message += `📦 ${result.stats.batches_imported} batches geïmporteerd\n`;
        
        if (result.stats.batches_skipped > 0) {
          message += `⏭️ ${result.stats.batches_skipped} batches overgeslagen (duplicaten)\n`;
        }
        
        message += `\n🔗 ${result.stats.assignments_imported} sensor koppelingen gemaakt\n`;
        
        if (result.stats.assignments_reconnected > 0) {
          message += `🔄 ${result.stats.assignments_reconnected} sensoren herverbonden\n`;
        }
        
        if (result.stats.assignments_failed > 0) {
          message += `⚠️ ${result.stats.assignments_failed} koppelingen mislukt\n`;
        }
        
        if (result.warnings && result.warnings.length > 0) {
          message += `\n⚠️ Warnings:\n${result.warnings.slice(0, 3).join('\n')}`;
          if (result.warnings.length > 3) {
            message += `\n... en ${result.warnings.length - 3} meer`;
          }
        }
        
        setSuccess(message);
        
        // Reload page to reflect changes
        setTimeout(() => {
          if (confirm('✅ Import voltooid!\n\nPagina herladen om changes te zien?')) {
            window.location.reload();
          }
        }, 1000);
      } else {
        throw new Error(result.errors?.[0] || 'Unknown error');
      }
    } catch (err) {
      console.error('[StockImportExport] Import error:', err);
      setError(err.message);
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  }
  
  return (
    <div style={{
      border: '3px solid var(--border-primary)',
      padding: '1rem',
      background: 'var(--bg-secondary)',
      marginBottom: '1rem'
    }}>
      <div style={{
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '0.5rem',
        color: 'var(--text-primary)'
      }}>
        📦 STOCK IMPORT/EXPORT
      </div>
      
      <div style={{
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '11px',
        marginBottom: '1rem',
        opacity: 0.7,
        color: 'var(--text-secondary)'
      }}>
        Export en import sensor stock batches met koppelingen naar sensor geschiedenis.
      </div>
      
      {validationInfo && (
        <div style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '11px',
          marginBottom: '0.5rem',
          padding: '0.5rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '2px solid var(--color-blue)',
          color: 'var(--text-primary)'
        }}>
          <div><strong>Bestand gevalideerd:</strong></div>
          <div>📦 {validationInfo.batch_count} batches</div>
          <div>🔗 {validationInfo.assignment_count} sensor koppelingen</div>
          <div>🏷️ Version: {validationInfo.version}</div>
          <div>📅 Export: {new Date(validationInfo.export_date).toLocaleDateString()}</div>
        </div>
      )}
      
      {success && (
        <div style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '11px',
          marginBottom: '0.5rem',
          padding: '0.5rem',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '2px solid var(--color-green)',
          color: 'var(--color-green)',
          whiteSpace: 'pre-wrap'
        }}>
          {success}
        </div>
      )}
      
      {error && (
        <div style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '11px',
          marginBottom: '0.5rem',
          padding: '0.5rem',
          background: 'rgba(220, 38, 38, 0.1)',
          border: '2px solid var(--color-red)',
          color: 'var(--color-red)'
        }}>
          ERROR: {error}
        </div>
      )}
      
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            border: '3px solid var(--border-primary)',
            padding: '0.5rem 1rem',
            background: 'var(--bg-primary)',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: exporting ? 'wait' : 'pointer',
            opacity: exporting ? 0.5 : 1,
            color: 'var(--text-primary)'
          }}
        >
          {exporting ? 'EXPORTEREN...' : '📤 EXPORT STOCK'}
        </button>
        
        {/* Import Button */}
        <label style={{
          display: 'inline-block',
          border: '3px solid var(--border-primary)',
          padding: '0.5rem 1rem',
          background: 'var(--bg-primary)',
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: importing ? 'wait' : 'pointer',
          opacity: importing ? 0.5 : 1,
          color: 'var(--text-primary)'
        }}>
          {importing ? 'IMPORTEREN...' : '📥 IMPORT STOCK'}
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      
      <div style={{
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '10px',
        marginTop: '0.5rem',
        opacity: 0.6,
        color: 'var(--text-secondary)'
      }}>
        Import: .json only | Export: JSON met sensor koppelingen
      </div>
      
      <div style={{
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '10px',
        marginTop: '0.5rem',
        padding: '0.5rem',
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        color: 'var(--text-secondary)'
      }}>
        <div><strong>Features:</strong></div>
        <div>✓ Duplicaat detectie</div>
        <div>✓ Sensor koppeling validatie</div>
        <div>✓ Automatisch herverbinden sensors</div>
        <div>✓ Merge mode (bestaande data behouden)</div>
      </div>
    </div>
  );
}
