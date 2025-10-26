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
    // Use end-of-today for consistent 24-hour periods
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    // Calculate start date (inclusive)
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    
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
    
    // Create Date objects and set to local timezone boundaries
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);  // Start of day (midnight)
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);  // End of day (just before midnight)
    
    // DEBUG: Log what we're sending
    console.log('[DateRangeFilter] 🔍 Custom range selected:', {
      startDateInput: startDate,
      endDateInput: endDate,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      startValid: !isNaN(start.getTime()),
      endValid: !isNaN(end.getTime())
    });
    
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
    <div style={{
      background: 'var(--bg-card-dark)', // Dark brutalist
      border: '4px solid var(--color-black)', // THICK border
      padding: '1rem',
      marginBottom: '1.5rem',
      fontFamily: 'monospace'
    }}>
      {/* Header - COMPACT */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
        paddingBottom: '0.75rem',
        borderBottom: '3px solid var(--color-orange)' // Orange accent
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '0.875rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'var(--color-white)',
          textTransform: 'uppercase'
        }}>
          DATE RANGE
        </h3>
      </div>

      {/* 4-button grid: 14d, 30d, 90d, Custom */}
      {!customMode && (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem'
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
                background: 'var(--color-black)',
                border: '3px solid var(--color-white)',
                color: 'var(--color-white)',
                padding: '0.875rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                transition: 'all 100ms linear'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--color-white)';
                e.target.style.color = 'var(--color-black)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--color-black)';
                e.target.style.color = 'var(--color-white)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {label}
            </button>
          ))}
          
          {/* Custom Range Button */}
          <button
            onClick={toggleCustomMode}
            style={{
              background: 'var(--color-black)',
              border: '3px solid var(--color-orange)',
              color: 'var(--color-orange)',
              padding: '0.875rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              transition: 'all 100ms linear'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--color-orange)';
              e.target.style.color = 'var(--color-black)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--color-black)';
              e.target.style.color = 'var(--color-orange)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            CUSTOM RANGE
          </button>
        </div>
      )}
      {/* Custom date pickers - COMPACT */}
      {customMode && (
        <>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: '0.75rem',
            alignItems: 'end',
            marginTop: '0.75rem'
          }}>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: '0.625rem',
                color: 'var(--color-orange)',
                marginBottom: '0.375rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase'
              }}>
                START DATE
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--color-black)',
                  border: '3px solid var(--color-white)',
                  color: 'var(--color-white)',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  fontWeight: 600
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block',
                fontSize: '0.625rem',
                color: 'var(--color-orange)',
                marginBottom: '0.375rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase'
              }}>
                END DATE
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--color-black)',
                  border: '3px solid var(--color-white)',
                  color: 'var(--color-white)',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  fontWeight: 600
                }}
              />
            </div>
            
            <button
              onClick={handleCustomRange}
              disabled={!startDate || !endDate}
              style={{
                background: startDate && endDate ? 'var(--color-green)' : 'var(--color-black)',
                border: '3px solid var(--color-green)',
                color: 'var(--color-white)',
                padding: '0.875rem 1.5rem',
                cursor: startDate && endDate ? 'pointer' : 'not-allowed',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: startDate && endDate ? 1 : 0.5,
                transition: 'all 100ms linear'
              }}
              onMouseEnter={(e) => {
                if (startDate && endDate) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              APPLY
            </button>
          </div>
          
          {/* Back button */}
          <button
            onClick={toggleCustomMode}
            style={{
              background: 'var(--color-black)',
              border: '3px solid var(--color-white)',
              color: 'var(--color-white)',
              padding: '0.75rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              transition: 'all 100ms linear',
              marginTop: '0.75rem',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--color-white)';
              e.target.style.color = 'var(--color-black)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--color-black)';
              e.target.style.color = 'var(--color-white)';
            }}
          >
            ← BACK TO QUICK RANGES
          </button>
        </>
      )}

      {/* Current range info - COMPACT */}
      {currentRange && (
        <div style={{ 
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: 'var(--color-black)',
          border: '3px solid var(--color-orange)',
          fontSize: '0.75rem',
          color: 'var(--color-white)',
          fontWeight: 600,
          letterSpacing: '0.05em'
        }}>
          <span style={{ color: 'var(--color-orange)', fontWeight: 700 }}>DATASET RANGE:</span>{' '}
          {new Date(currentRange.min).toLocaleDateString()} → {new Date(currentRange.max).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}