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
    <div style={{ 
      backgroundColor: 'var(--bg-card-dark)',
      border: '4px solid var(--color-black)',
      padding: '2rem',
      marginBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '3px solid var(--color-orange)'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--color-white)'
        }}>
          🔄 Period Comparison
        </h3>
        <div style={{ 
          fontSize: '1rem',
          color: 'var(--color-orange)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          fontFamily: 'monospace'
        }}>
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
  let trendColor = 'var(--text-secondary)'; // gray-500
  
  if (Math.abs(delta) > 0.5) {
    if (betterIfHigher) {
      trendIcon = delta > 0 ? '↑' : '↓';
      trendColor = delta > 0 ? 'var(--color-green)' : 'var(--color-red)'; // green-500 : red-500
    } else if (betterIfLower) {
      trendIcon = delta > 0 ? '↑' : '↓';
      trendColor = delta < 0 ? 'var(--color-green)' : 'var(--color-red)'; // green-500 : red-500
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
        gap: '0.5rem',
        backgroundColor: 'var(--color-orange)',
        padding: '1rem',
        border: '3px solid var(--color-black)'
      }}>
        <div style={{ 
          fontSize: '0.875rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-black)'
        }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ 
            fontSize: '0.75rem',
            color: 'var(--color-black)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
            opacity: 0.8
          }}>
            {sublabel}
          </div>
        )}
      </div>

      {/* Current Period Card */}
      <div style={{
        backgroundColor: 'var(--bg-card-dark)',
        color: 'var(--color-white)',
        padding: '1.5rem',
        borderRadius: '0',
        border: '3px solid var(--color-green)', // Green = current/active
        transition: 'all 100ms linear'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-green) inset';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      >
        <div style={{ 
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
          color: 'var(--color-green)',
          borderBottom: '2px solid var(--color-green)',
          paddingBottom: '0.5rem'
        }}>
          📍 Current Period
        </div>
        <div style={{ 
          fontSize: '2.5rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--color-white)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1
        }}>
          {format(current)}
          <span style={{ fontSize: '1.25rem', marginLeft: '0.5rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{unit}</span>
        </div>
        {currentSD != null && (
          <div style={{ 
            fontSize: '1rem',
            fontWeight: 600,
            marginTop: '0.75rem',
            color: 'var(--text-tertiary)'
          }}>
            ± {safeFormat(currentSD, 0)} SD
          </div>
        )}
        
        {/* Trend Indicator */}
        <div style={{ 
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '2px solid var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem', color: trendColor }}>{trendIcon}</span>
          <span style={{ fontSize: '1rem', color: trendColor, fontWeight: 700, letterSpacing: '0.05em' }}>
            {delta > 0 ? '+' : ''}{deltaFormatted} {unit}
          </span>
        </div>
      </div>

      {/* Previous Period Card */}
      <div style={{
        backgroundColor: 'var(--bg-card-dark)',
        color: 'var(--color-white)',
        padding: '1.5rem',
        borderRadius: '0',
        border: '3px solid var(--text-tertiary)', // Gray = previous/historical
        transition: 'all 100ms linear'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 0 0 3px var(--text-tertiary) inset';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      >
        <div style={{ 
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
          color: 'var(--text-tertiary)',
          borderBottom: '2px solid var(--text-tertiary)',
          paddingBottom: '0.5rem'
        }}>
          ⏮️ Previous Period
        </div>
        <div style={{ 
          fontSize: '2.5rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--color-white)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1
        }}>
          {format(previous)}
          <span style={{ fontSize: '1.25rem', marginLeft: '0.5rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{unit}</span>
        </div>
        {previousSD != null && (
          <div style={{ 
            fontSize: '1rem',
            fontWeight: 600,
            marginTop: '0.75rem',
            color: 'var(--text-tertiary)'
          }}>
            ± {safeFormat(previousSD, 0)} SD
          </div>
        )}
        
        {/* Target Info */}
        {target && (
          <div style={{ 
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '2px solid var(--text-tertiary)',
            fontSize: '0.75rem',
            color: 'var(--color-orange)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 700
          }}>
            🎯 {target}
          </div>
        )}
      </div>
    </>
  );
}
