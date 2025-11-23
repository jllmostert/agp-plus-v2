/**
 * StockPanel.jsx
 * Stock batch registration and sensor assignment tracking
 * v3.15.0 - Complete traceability system
 * 
 * Design: Brutalist paper/ink theme matching sensor history modal
 */

import React, { useState, useEffect, useMemo } from 'react';
import { getAllBatchesWithStats, sortBatches, filterBatches, calculateSummaryStats } from '../../core/stock-engine.js';
import { deleteBatch } from '../../storage/stockStorage.js';
import { exportStock, importStock } from '../../storage/stockImportExport.js';
import StockBatchCard from '../StockBatchCard.jsx';
import StockBatchForm from '../StockBatchForm.jsx';

export default function StockPanel({ isOpen, onClose }) {
  const [batches, setBatches] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null); // âœ… NEW: async state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('received_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  // Load batches on mount
  useEffect(() => {
    if (isOpen) {
      loadBatches();
    }
  }, [isOpen]);
  
  // âœ… NEW: Load summary stats async
  useEffect(() => {
    if (isOpen) {
      (async () => {
        const stats = await calculateSummaryStats();
        setSummaryStats(stats);
      })();
    }
  }, [isOpen, batches]); // Re-calculate when batches change

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen || showForm) return;

    const handleKeyDown = (e) => {
      // N = New batch
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleAddNew();
      }
      // Escape = Close modal
      else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showForm, onClose]);

  const loadBatches = async () => {
    const data = await getAllBatchesWithStats();
    setBatches(data || []); // âœ… Defensive: ensure array
  };

  // Filtered and sorted batches
  const displayBatches = useMemo(() => {
    let filtered = filterBatches(batches, searchQuery);
    return sortBatches(filtered, sortBy, sortDirection);
  }, [batches, searchQuery, sortBy, sortDirection]);

  const handleDeleteBatch = (batchId, assignedCount) => {
    if (assignedCount > 0) {
      const confirm = window.confirm(
        `This batch has ${assignedCount} assigned sensor(s). Delete anyway? Assignments will be removed.`
      );
      if (!confirm) return;
    }
    
    deleteBatch(batchId);
    loadBatches();
  };

  const handleAddNew = () => {
    setEditingBatch(null);
    setShowForm(true);
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setShowForm(true);
  };

  const handleExport = async () => {
    try {
      const result = await exportStock();
      
      if (!result.success) {
        alert('❌ Export mislukt: ' + result.error);
        return;
      }
      
      // Download JSON file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate timestamp: 2025-11-16_10-30-15
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      
      a.download = `agp-stock-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert(`✅ Stock geëxporteerd!\n\n📦 ${result.data.statistics.total_batches} batches\n🔗 ${result.data.statistics.total_assignments} toewijzingen`);
    } catch (err) {
      console.error('[StockPanel] Export error:', err);
      alert('❌ Export mislukt: ' + err.message);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Ask user: merge or replace?
      const replaceMode = confirm(
        '📦 IMPORT MODUS\n\n' +
        '✅ OK = VERVANGEN (huidige stock wordt gewist)\n' +
        '❌ ANNULEREN = SAMENVOEGEN (duplicaten worden overgeslagen)'
      );
      
      const result = await importStock(file, {
        mergeMode: !replaceMode, // replace = !merge
        validateSensors: true,
        reconnectSensors: true
      });
      
      if (result.success) {
        let msg = '✅ Import succesvol!\n\n';
        msg += `📦 ${result.stats.batches_imported} batches geïmporteerd\n`;
        if (result.stats.batches_skipped > 0) {
          msg += `⏭️ ${result.stats.batches_skipped} batches overgeslagen\n`;
        }
        msg += `🔗 ${result.stats.assignments_imported} toewijzingen\n`;
        if (result.stats.assignments_reconnected > 0) {
          msg += `🔄 ${result.stats.assignments_reconnected} sensoren herverbonden`;
        }
        
        alert(msg);
        loadBatches(); // Reload data
      } else {
        alert('❌ Import mislukt:\n\n' + (result.errors?.[0] || 'Unknown error'));
      }
    } catch (err) {
      console.error('[StockPanel] Import error:', err);
      alert('❌ Import mislukt: ' + err.message);
    } finally {
      e.target.value = ''; // Reset file input
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'var(--paper)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"SF Mono", "Monaco", "Courier New", monospace'
    }}>
      {/* HEADER */}
      <div style={{
        padding: '24px',
        borderBottom: '3px solid var(--ink)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'var(--ink)'
        }}>
          VOORRAAD BEHEER
        </h1>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            border: '3px solid var(--ink)',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          × SLUITEN
        </button>
      </div>

      {/* SUMMARY STATS */}
      <div style={{
        padding: '24px',
        borderBottom: '3px solid var(--ink)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--ink)' }}>{summaryStats.totalBatches}</div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '4px', color: 'var(--text-secondary)' }}>BATCHES</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--ink)' }}>{summaryStats.totalQuantity}</div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '4px', color: 'var(--text-secondary)' }}>TOTAAL</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--ink)' }}>{summaryStats.assignedCount}</div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '4px', color: 'var(--text-secondary)' }}>TOEGEWEZEN</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--ink)' }}>{summaryStats.remainingCount}</div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '4px', color: 'var(--text-secondary)' }}>RESTEREND</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--ink)' }}>{summaryStats.usagePercentage}%</div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '4px', color: 'var(--text-secondary)' }}>GEBRUIK</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{
        padding: '24px',
        borderBottom: '3px solid var(--ink)',
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="ZOEK LOT NUMMER, BRON..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '12px',
            border: '3px solid var(--ink)',
            fontSize: '14px',
            fontFamily: 'inherit',
            textTransform: 'uppercase',
            backgroundColor: 'var(--paper)',
            color: 'var(--ink)'
          }}
        />
        <button
          onClick={handleExport}
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--paper)',
            color: 'var(--ink)',
            border: '3px solid var(--ink)',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          📤 EXPORT
        </button>
        <label style={{
            padding: '12px 24px',
            backgroundColor: 'var(--paper)',
            color: 'var(--ink)',
            border: '3px solid var(--ink)',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase',
            display: 'inline-block'
          }}>
          📥 IMPORT
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
        <button
          onClick={handleAddNew}
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            border: '3px solid var(--ink)',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          + NIEUWE BATCH
        </button>
      </div>

      {/* BATCH LIST */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px'
      }}>
        {displayBatches.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            fontSize: '14px',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)'
          }}>
            {searchQuery ? 'GEEN BATCHES GEVONDEN' : 'GEEN BATCHES - KLIK "+ NIEUWE BATCH"'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '16px'
          }}>
            {displayBatches.map(batch => (
              <StockBatchCard
                key={batch.batch_id}
                batch={batch}
                onEdit={() => handleEdit(batch)}
                onDelete={() => handleDeleteBatch(batch.batch_id, batch.stats.assigned_count)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FORM OVERLAY */}
      {showForm && (
        <StockBatchForm
          batch={editingBatch}
          onSave={() => {
            setShowForm(false);
            setEditingBatch(null);
            loadBatches();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingBatch(null);
          }}
        />
      )}
    </div>
  );
}
