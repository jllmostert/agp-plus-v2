/**
 * DateRangeFilter - Date range selector for master dataset
 * 
 * Provides quick range buttons and custom date pickers.
 * Integrates with useMasterDataset hook via callback.
 * 
 * Quick ranges:
 * - Last 7 days
 * - Last 14 days
 * - Last 30 days
 * - Last 90 days
 * - All time (no filter)
 * 
 * @param {Function} onRangeChange - Callback(startDate, endDate)
 * @param {Object} currentRange - { min, max } from dataset stats
 */

import React, { useState } from 'react';

export function DateRangeFilter({ onRangeChange, currentRange }) {
  const [customMode, setCustomMode] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calculate quick range dates
  function getQuickRange(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
  }

  function handleQuickRange(days) {
    setCustomMode(false);
    if (days === null) {
      // All time - no filter      onRangeChange(null, null);
    } else {
      const range = getQuickRange(days);
      onRangeChange(range.start, range.end);
    }
  }

  function handleCustomRange() {
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert('Start date must be before end date');
      return;
    }
    
    onRangeChange(start, end);
  }

  function toggleCustomMode() {
    setCustomMode(!customMode);
    if (customMode) {
      // Exiting custom mode - clear filters
      setStartDate('');
      setEndDate('');
      onRangeChange(null, null);
    }
  }

  return (
    <div style={{      background: '#1a1a1a',
      border: '3px solid #333',
      padding: '16px',
      marginBottom: '20px',
      fontFamily: 'monospace'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffffff'
        }}>
          DATE RANGE
        </h3>
        
        <button
          onClick={toggleCustomMode}
          style={{
            background: customMode ? '#2563eb' : 'transparent',
            border: '2px solid #666',
            color: '#ffffff',
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        >
          {customMode ? 'QUICK RANGES' : 'CUSTOM RANGE'}
        </button>
      </div>
      {/* Quick ranges */}
      {!customMode && (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px'
        }}>
          {[
            { label: 'LAST 14D', days: 14 },
            { label: 'LAST 30D', days: 30 },
            { label: 'LAST 90D', days: 90 }
          ].map(({ label, days }) => (
            <button
              key={label}
              onClick={() => handleQuickRange(days)}
              style={{
                background: 'transparent',
                border: '2px solid #666',
                color: '#ffffff',
                padding: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#333';
                e.target.style.borderColor = '#999';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = '#666';
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {/* Custom date pickers */}
      {customMode && (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: '12px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ 
              display: 'block',
              fontSize: '11px',
              color: '#999',
              marginBottom: '4px'
            }}>
              START DATE
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                background: '#000',
                border: '2px solid #666',
                color: '#ffffff',
                padding: '8px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block',
              fontSize: '11px',
              color: '#999',
              marginBottom: '4px'
            }}>
              END DATE
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                background: '#000',
                border: '2px solid #666',
                color: '#ffffff',
                padding: '8px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
          </div>
          <button
            onClick={handleCustomRange}
            disabled={!startDate || !endDate}
            style={{
              background: '#2563eb',
              border: '2px solid #3b82f6',
              color: '#ffffff',
              padding: '8px 16px',
              cursor: startDate && endDate ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              opacity: startDate && endDate ? 1 : 0.5
            }}
          >
            APPLY
          </button>
        </div>
      )}

      {/* Current range info */}
      {currentRange && (
        <div style={{ 
          marginTop: '12px',
          padding: '8px',
          background: '#000',
          border: '2px solid #333',
          fontSize: '11px',
          color: '#999'
        }}>
          <strong style={{ color: '#fff' }}>DATASET RANGE:</strong>{' '}
          {new Date(currentRange.min).toLocaleDateString()} → {new Date(currentRange.max).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}