/**
 * StockBatchCard.jsx
 * Individual batch display card
 * v3.15.0
 */

import React from 'react';

export default function StockBatchCard({ batch, onEdit, onDelete }) {
  const { stats } = batch;
  const usageColor = stats.usage_percentage > 80 ? '#FF0000' : '#000000';

  return (
    <div style={{
      border: '3px solid #000000',
      padding: '16px',
      backgroundColor: '#FFFFFF'
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
            {batch.lot_number}
          </div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666666' }}>
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
        backgroundColor: '#F5F5F5',
        border: '1px solid #000000'
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: usageColor }}>
            {stats.assigned_count}
          </div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>GEBRUIKT</div>
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {stats.remaining_count}
          </div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>RESTEREND</div>
        </div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: usageColor }}>
            {stats.usage_percentage}%
          </div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>GEBRUIK</div>
        </div>
      </div>

      {/* DATES */}
      <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
        <div><strong>ONTVANGEN:</strong> {formatDate(batch.received_date, batch.received_date_exact)}</div>
        {batch.expiry_date && (
          <div><strong>VERVALDATUM:</strong> {batch.expiry_date}</div>
        )}
        {batch.box_quantity && (
          <div><strong>DOOS:</strong> {batch.box_quantity} stuks</div>
        )}
        {batch.notes && (
          <div style={{ marginTop: '8px', color: '#666666' }}>{batch.notes}</div>
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
  border: '2px solid #000000',
  backgroundColor: '#FFFFFF',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};
