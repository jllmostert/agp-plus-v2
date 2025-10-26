import React from 'react';

const safeFormat = (val, decimals = 0) => {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return 'N/A';
  return num.toFixed(decimals);
};

export default function DayNightSplit({ dayMetrics, nightMetrics }) {
  if (!dayMetrics || !nightMetrics) return null;

  const comparisons = [
    { id: 'tir', label: 'Time in Range', sublabel: '70-180 mg/dL', day: dayMetrics.tir, night: nightMetrics.tir, unit: '%', format: (v) => safeFormat(v, 1), betterIfHigher: true, showDuration: true },
    { id: 'mean', label: 'Mean Glucose', day: dayMetrics.mean, night: nightMetrics.mean, unit: 'mg/dL', format: (v) => safeFormat(v, 0), daySD: dayMetrics.sd, nightSD: nightMetrics.sd },
    { id: 'cv', label: 'Coefficient Variation', day: dayMetrics.cv, night: nightMetrics.cv, unit: '%', format: (v) => safeFormat(v, 1), betterIfLower: true },
  ];

  return (
    <div style={{
      backgroundColor: 'var(--bg-card-dark)',
      border: '4px solid var(--color-black)',
      padding: '2rem',
      marginBottom: '2rem'
    }}>
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
          color: 'var(--color-white)',
          margin: 0
        }}>
          ☀️🌙 Day/Night Analysis
        </h3>
        <div style={{
          fontSize: '1rem',
          color: 'var(--color-orange)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          fontFamily: 'monospace'
        }}>
          06:00-00:00 vs 00:00-06:00
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
        {comparisons.map((comp) => (<DayNightRow key={comp.id} {...comp} />))}
      </div>
    </div>
  );
}

function DayNightRow({ label, sublabel, day, night, unit, format, daySD, nightSD, betterIfHigher, betterIfLower, showDuration }) {
  const delta = day - night;
  const deltaFormatted = format(Math.abs(delta));
  let trendIcon = '→', trendColor = 'var(--text-secondary)';
  if (Math.abs(delta) > 0.5) {
    if (betterIfHigher) { trendIcon = delta > 0 ? '↑' : '↓'; trendColor = delta > 0 ? 'var(--color-green)' : 'var(--color-red)'; }
    else if (betterIfLower) { trendIcon = delta > 0 ? '↑' : '↓'; trendColor = delta < 0 ? 'var(--color-green)' : 'var(--color-red)'; }
    else { trendIcon = delta > 0 ? '↑' : '↓'; }
  }
  
  return (
    <>
      {/* Label */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sublabel}</div>}
      </div>
      
      {/* Day Card - DARK BRUTALIST */}
      <div style={{ backgroundColor: 'var(--bg-card-dark)', color: 'var(--text-inverse)', padding: '1.25rem', borderRadius: '4px', border: '2px solid var(--border-primary)' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-inverse)' }}>
          Day (06:00-00:00)
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-inverse)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {format(day)}
          <span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: 'var(--text-tertiary)' }}>{unit}</span>
        </div>
        {daySD != null && (
          <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', color: 'var(--text-tertiary)' }}>
            ± {safeFormat(daySD, 0)} SD
          </div>
        )}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem', color: trendColor }}>{trendIcon}</span>
          <span style={{ fontSize: '0.875rem', color: trendColor, fontWeight: 600 }}>
            {delta > 0 ? '+' : ''}{deltaFormatted} {unit} vs night
          </span>
        </div>
      </div>
      
      {/* Night Card - DARK BRUTALIST */}
      <div style={{ backgroundColor: 'var(--bg-card-dark)', color: 'var(--text-inverse)', padding: '1.25rem', borderRadius: '4px', border: '2px solid var(--border-primary)' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-inverse)' }}>
          Night (00:00-06:00)
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-inverse)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {format(night)}
          <span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: 'var(--text-tertiary)' }}>{unit}</span>
        </div>
        {nightSD != null && (
          <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', color: 'var(--text-tertiary)' }}>
            ± {safeFormat(nightSD, 0)} SD
          </div>
        )}
        {showDuration && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-secondary)', fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            6 hours
          </div>
        )}
      </div>
    </>
  );
}
