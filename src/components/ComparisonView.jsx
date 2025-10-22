import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Safe number formatter - handles NaN, null, undefined, strings
 */
const safeFormat = (val, decimals = 0) => {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return 'N/A';
  return num.toFixed(decimals);
};

/**
 * ComparisonView - Period-over-period comparison component
 * 
 * Grid-based layout: [Label] [Current] [Previous]
 * Inline styles for consistency with MetricsDisplay
 * 
 * @version 2.1.2 CLINICAL GRID
 */
export default function ComparisonView({ 
  currentMetrics, 
  previousMetrics, 
  startDate, 
  endDate,
  prevStart,
  prevEnd
}) {
  if (!currentMetrics || !previousMetrics) {
    return null;
  }

  // Format dates for display
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  };

  // Calculate days in each period
  const currentDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const previousDays = Math.ceil((prevEnd - prevStart) / (1000 * 60 * 60 * 24)) + 1;

  // Metrics to compare
  const comparisons = [
    {
      id: 'tir',
      label: 'Time in Range',
      sublabel: '70-180 mg/dL',
      current: currentMetrics.tir,
      previous: previousMetrics.tir,
      unit: '%',
      format: (v) => safeFormat(v, 1),
      betterIfHigher: true,
      target: 'Target ≥70%',
    },
    {
      id: 'mean',
      label: 'Mean Glucose',
      current: currentMetrics.mean,
      previous: previousMetrics.mean,
      unit: 'mg/dL',
      format: (v) => safeFormat(v, 0),
      currentSD: currentMetrics.sd,
      previousSD: previousMetrics.sd,
      target: 'Target 70-180',
    },
    {
      id: 'cv',
      label: 'Coefficient Variation',
      current: currentMetrics.cv,
      previous: previousMetrics.cv,
      unit: '%',
      format: (v) => safeFormat(v, 1),
      betterIfLower: true,
      target: 'Target ≤36%',
    },
    {
      id: 'gmi',
      label: 'GMI (est. HbA1c)',
      current: currentMetrics.gmi,
      previous: previousMetrics.gmi,
      unit: '%',
      format: (v) => safeFormat(v, 1),
      betterIfLower: true,
      target: 'Target <7.0%',
    },
  ];

  return (
    <div className="card" style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: 600, 
          color: 'var(--text-primary)'
        }}>
          Period Comparison
        </h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {formatDate(startDate)} → {formatDate(endDate)} vs {formatDate(prevStart)} → {formatDate(prevEnd)}
        </div>
      </div>

      {/* Comparison Grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '200px 1fr 1fr',
        gap: '1rem',
        alignItems: 'stretch'
      }}>
        {comparisons.map((comp) => (
          <ComparisonRow key={comp.id} {...comp} />
        ))}
      </div>
    </div>
  );
}

/**
 * ComparisonRow - Single row in comparison grid
 * [Label] [Current Card] [Previous Card]
 */
function ComparisonRow({ 
  label, 
  sublabel,
  current, 
  previous, 
  unit, 
  format, 
  currentSD,
  previousSD,
  betterIfHigher, 
  betterIfLower,
  target 
}) {
  // Calculate delta and trend
  const delta = current - previous;
  const deltaFormatted = format(Math.abs(delta));
  
  let trendIcon = '→';
  let trendColor = '#6b7280'; // gray-500
  
  if (Math.abs(delta) > 0.5) {
    if (betterIfHigher) {
      trendIcon = delta > 0 ? '↑' : '↓';
      trendColor = delta > 0 ? '#10b981' : '#ef4444'; // green-500 : red-500
    } else if (betterIfLower) {
      trendIcon = delta > 0 ? '↑' : '↓';
      trendColor = delta < 0 ? '#10b981' : '#ef4444'; // green-500 : red-500
    } else {
      trendIcon = delta > 0 ? '↑' : '↓';
    }
  }

  return (
    <>
      {/* Label */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.25rem'
      }}>
        <div style={{ 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          letterSpacing: '0.1em', 
          textTransform: 'uppercase',
          color: 'var(--text-secondary)'
        }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ 
            fontSize: '0.625rem', 
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {sublabel}
          </div>
        )}
      </div>

      {/* Current Period Card */}
      <div style={{
        backgroundColor: '#111827',
        color: 'white',
        padding: '1.25rem',
        borderRadius: '4px',
        border: '2px solid #1f2937'
      }}>
        <div style={{ 
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
          color: '#9ca3af'
        }}>
          Current Period
        </div>
        <div style={{ 
          fontSize: '2rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: '#f9fafb',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1
        }}>
          {format(current)}
          <span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: '#d1d5db' }}>{unit}</span>
        </div>
        {currentSD != null && (
          <div style={{ 
            fontSize: '1rem',
            fontWeight: 600,
            marginTop: '0.5rem',
            color: '#d1d5db'
          }}>
            ± {safeFormat(currentSD, 0)} SD
          </div>
        )}
        
        {/* Trend Indicator */}
        <div style={{ 
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #374151',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.25rem', color: trendColor }}>{trendIcon}</span>
          <span style={{ fontSize: '0.875rem', color: trendColor, fontWeight: 600 }}>
            {delta > 0 ? '+' : ''}{deltaFormatted} {unit}
          </span>
        </div>
      </div>

      {/* Previous Period Card */}
      <div style={{
        backgroundColor: '#111827',
        color: 'white',
        padding: '1.25rem',
        borderRadius: '4px',
        border: '2px solid #1f2937'
      }}>
        <div style={{ 
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
          color: '#9ca3af'
        }}>
          Previous Period
        </div>
        <div style={{ 
          fontSize: '2rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: '#9ca3af',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1
        }}>
          {format(previous)}
          <span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: '#6b7280' }}>{unit}</span>
        </div>
        {previousSD != null && (
          <div style={{ 
            fontSize: '1rem',
            fontWeight: 600,
            marginTop: '0.5rem',
            color: '#9ca3af'
          }}>
            ± {safeFormat(previousSD, 0)} SD
          </div>
        )}
        
        {/* Target Info */}
        {target && (
          <div style={{ 
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #374151',
            fontSize: '0.6875rem',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {target}
          </div>
        )}
      </div>
    </>
  );
}
