import React from 'react';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

/**
 * MetricsDisplay - Clinical Dashboard Layout
 * 
 * Hero Grid: 4 primary metrics (TIR 2x wide, Mean±SD, CV, GMI)
 * Secondary Grid: All other metrics with reduced visual weight
 * 
 * @version 2.1.2 CLINICAL HIERARCHY
 */
export default function MetricsDisplay({ metrics }) {
  if (!metrics) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          No metrics available. Upload CSV data.
        </p>
      </div>
    );
  }

  const safeFormat = (val, decimals = 0) => {
    const num = Number(val);
    if (isNaN(num) || !isFinite(num)) return 'N/A';
    return num.toFixed(decimals);
  };

  // Helper to determine if metric is in target range
  const getStatus = (id, value) => {
    const v = Number(value);
    if (isNaN(v)) return 'neutral';
    
    switch(id) {
      case 'tir': return v >= 70 ? 'good' : v >= 50 ? 'warning' : 'danger';
      case 'tar': return v <= 25 ? 'good' : v <= 50 ? 'warning' : 'danger';
      case 'tbr': return v <= 4 ? 'good' : v <= 10 ? 'warning' : 'danger';
      case 'cv': return v <= 36 ? 'good' : v <= 50 ? 'warning' : 'danger';
      case 'gmi': return v < 7.0 ? 'good' : v < 8.0 ? 'warning' : 'danger';
      case 'mean': return (v >= 70 && v <= 180) ? 'good' : 'warning';
      default: return 'neutral';
    }
  };

  return (
    <>
      {/* HERO GRID - Primary Metrics (4 equal cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        
        {/* TIR */}
        <div 
          className="card-hero" 
          style={{ 
            padding: '2rem',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Activity style={{ width: '24px', height: '24px', color: 'var(--text-inverse)' }} />
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: 700, 
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              Time in Range
            </span>
          </div>
          
          <div style={{ 
            fontSize: 'clamp(3rem, 8vw, 4.5rem)', 
            fontWeight: 700, 
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
            lineHeight: 1
          }}>
            {safeFormat(metrics.tir, 1)}%
          </div>
          
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            opacity: 0.8
          }}>
            Target ≥70% • 70-180 mg/dL
          </div>
        </div>

        {/* Mean ± SD */}
        <PrimaryMetricCard
          icon={Activity}
          label="Mean Glucose"
          value={safeFormat(metrics.mean, 0)}
          unit="mg/dL"
          subtitle={`± ${safeFormat(metrics.sd, 0)} SD`}
          status={getStatus('mean', metrics.mean)}
        />

        {/* CV */}
        <PrimaryMetricCard
          icon={Zap}
          label="CV"
          value={safeFormat(metrics.cv, 1)}
          unit="%"
          subtitle="Target ≤36%"
          status={getStatus('cv', metrics.cv)}
        />

        {/* GMI */}
        <PrimaryMetricCard
          icon={Activity}
          label="GMI"
          value={safeFormat(metrics.gmi, 1)}
          unit="%"
          subtitle={`~${safeFormat(metrics.gmi, 1)}% HbA1c`}
          status={getStatus('gmi', metrics.gmi)}
        />
      </div>

      {/* SECONDARY GRID - Detail Metrics (aligned grid layout) */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '200px 1fr 1fr',
        gap: '1rem',
        alignItems: 'stretch'
      }}>
        
        {/* Range Distribution */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.75rem', 
          fontWeight: 700, 
          letterSpacing: '0.15em', 
          textTransform: 'uppercase',
          color: 'var(--text-secondary)'
        }}>
          Range Distribution
        </div>
        <SecondaryMetricCard label="TAR >180" value={safeFormat(metrics.tar, 1)} unit="%" status={getStatus('tar', metrics.tar)} />
        <SecondaryMetricCard label="TBR <70" value={safeFormat(metrics.tbr, 1)} unit="%" status={getStatus('tbr', metrics.tbr)} />

        {/* Variability Metrics */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.75rem', 
          fontWeight: 700, 
          letterSpacing: '0.15em', 
          textTransform: 'uppercase',
          color: 'var(--text-secondary)'
        }}>
          Variability Metrics
        </div>
        <SecondaryMetricCard label="MAGE" value={safeFormat(metrics.mage, 0)} unit="mg/dL" subtitle="Glycemic excursions" />
        <SecondaryMetricCard label="MODD" value={safeFormat(metrics.modd, 0)} unit="mg/dL" subtitle="Day-to-day variability" />

        {/* Glucose Range */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.75rem', 
          fontWeight: 700, 
          letterSpacing: '0.15em', 
          textTransform: 'uppercase',
          color: 'var(--text-secondary)'
        }}>
          Glucose Range
        </div>
        <SecondaryMetricCard label="Minimum" value={safeFormat(metrics.min, 0)} unit="mg/dL" />
        <SecondaryMetricCard label="Maximum" value={safeFormat(metrics.max, 0)} unit="mg/dL" />

        {/* Analysis Period */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.75rem', 
          fontWeight: 700, 
          letterSpacing: '0.15em', 
          textTransform: 'uppercase',
          color: 'var(--text-secondary)'
        }}>
          Analysis Period
        </div>
        <SecondaryMetricCard label="Days Analyzed" value={safeFormat(metrics.days, 0)} unit="days" />
        <SecondaryMetricCard 
          label="CGM Readings" 
          value={metrics.readingCount != null ? metrics.readingCount.toLocaleString() : 'N/A'} 
          unit=""
          subtitle={
            metrics.readingCount != null && metrics.days != null
              ? `${safeFormat((metrics.readingCount / (metrics.days * 288)) * 100, 0)}% coverage`
              : ''
          }
        />
      </div>
    </>
  );
}

/**
 * PrimaryMetricCard - Hero Grid Metrics (Mean, CV, GMI)
 * Large text, high contrast, prominent display
 */
function PrimaryMetricCard({ icon: Icon, label, value, unit, subtitle, status = 'neutral' }) {
  const getStatusColor = () => {
    switch(status) {
      case 'good': return 'var(--text-primary)';
      case 'warning': return 'var(--color-yellow)';
      case 'danger': return 'var(--color-red)';
      default: return 'var(--text-primary)';
    }
  };

  return (
    <div 
      className="card"
      style={{
        padding: '1.5rem',
        minHeight: '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Icon + Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Icon style={{ 
          width: '20px', 
          height: '20px',
          color: status === 'danger' ? 'var(--color-red)' : 
                 status === 'warning' ? 'var(--color-yellow)' : 
                 'var(--text-primary)'
        }} />
        <span style={{ 
          fontSize: '0.875rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)'
        }}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div>
        <div style={{ 
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: getStatusColor(),
          lineHeight: 1,
          marginBottom: '0.5rem',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {value}
          <span style={{ fontSize: '1.5rem', marginLeft: '0.25rem', opacity: 0.7 }}>{unit}</span>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div style={{ 
            fontSize: '1rem',
            fontWeight: 600,
            color: '#d1d5db',
            marginTop: '0.25rem'
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SecondaryMetricCard - Detail Grid Metrics
 * White-on-dark with proper contrast, grouped by category
 */
function SecondaryMetricCard({ label, value, unit, subtitle, status = 'neutral' }) {
  const getStatusColor = () => {
    switch(status) {
      case 'good': return '#10b981'; // green-500
      case 'warning': return '#f59e0b'; // amber-500
      case 'danger': return '#ef4444'; // red-500
      default: return '#f9fafb'; // gray-50 (white for good contrast)
    }
  };

  return (
    <div 
      style={{
        backgroundColor: '#111827', // gray-900
        color: 'white',
        padding: '1.25rem',
        borderRadius: '4px',
        border: '2px solid #1f2937' // gray-800
      }}
    >
      {/* Label */}
      <div style={{ 
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '0.75rem',
        color: '#9ca3af' // gray-400
      }}>
        {label}
      </div>

      {/* Value */}
      <div style={{ 
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: getStatusColor(),
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1
      }}>
        {value}
        {unit && <span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: '#d1d5db' }}>{unit}</span>}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{ 
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          marginTop: '0.5rem',
          color: '#6b7280', // gray-500
          textTransform: 'uppercase'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
