/**
 * StockBatchCard.jsx
 * Individual batch display card
 * v3.15.0
 */

import React from 'react';

export default function StockBatchCard({ batch, onEdit, onDelete }) {
  const { stats } = batch;
  const usageColor = stats.usage_percentage > 80 ? 'var(--color-red)' : 'var(--ink)';

  return (
    <div style={{
      border: '3px solid var(--ink)',
      padding: '16px',
      backgroundColor: 'var(--paper)'
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--ink)' }}>
            {batch.lot_number}
          </div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            {batch.source}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onEdit} style={buttonStyle}>E</button>
          <button onClick={onDelete} style={buttonStyle}>×</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--ink)'
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: usageColor }}>
            {stats.assigned_count}
          </div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>GEBRUIKT</div>
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--ink)' }}>
            {stats.remaining_count}
          </div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>RESTEREND</div>
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: usageColor }}>
            {stats.usage_percentage}%
          </div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>GEBRUIK</div>
        </div>
      </div>

      {/* DATES */}
      <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--ink)' }}>
        <div><strong>ONTVANGEN:</strong> {formatDate(batch.received_date, batch.received_date_exact)}</div>
        {batch.expiry_date && (
          <div><strong>VERVALDATUM:</strong> {batch.expiry_date}</div>
        )}
        {batch.box_quantity && (
          <div><strong>DOOS:</strong> {batch.box_quantity} stuks</div>
        )}
        {batch.notes && (
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>{batch.notes}</div>
        )}
      </div>
    </div>
  );
}

function formatDate(monthDate, exactDate) {
  if (exactDate) return exactDate;
  return monthDate; // YYYY-MM format
}

const buttonStyle = {
  width: '32px',
  height: '32px',
  border: '2px solid var(--ink)',
  backgroundColor: 'var(--paper)',
  color: 'var(--ink)',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};
