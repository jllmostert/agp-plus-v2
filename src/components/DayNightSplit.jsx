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
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Day/Night Analysis</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>06:00-00:00 vs 00:00-06:00</div>
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
  let trendIcon = '→', trendColor = '#6b7280';
  if (Math.abs(delta) > 0.5) {
    if (betterIfHigher) { trendIcon = delta > 0 ? '↑' : '↓'; trendColor = delta > 0 ? '#10b981' : '#ef4444'; }
    else if (betterIfLower) { trendIcon = delta > 0 ? '↑' : '↓'; trendColor = delta < 0 ? '#10b981' : '#ef4444'; }
    else { trendIcon = delta > 0 ? '↑' : '↓'; }
  }
  
  return (
    <>
      {/* Label */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: '0.625rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sublabel}</div>}
      </div>
      
      {/* Day Card */}
      <div style={{ backgroundColor: '#111827', color: 'white', padding: '1.25rem', borderRadius: '4px', border: '2px solid #1f2937' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', color: '#9ca3af' }}>
          Day (06:00-00:00)
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#f9fafb', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {format(day)}
          <span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: '#d1d5db' }}>{unit}</span>
        </div>
        {daySD != null && (
          <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', color: '#d1d5db' }}>
            ± {safeFormat(daySD, 0)} SD
          </div>
        )}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem', color: trendColor }}>{trendIcon}</span>
          <span style={{ fontSize: '0.875rem', color: trendColor, fontWeight: 600 }}>
            {delta > 0 ? '+' : ''}{deltaFormatted} {unit} vs night
          </span>
        </div>
      </div>
      
      {/* Night Card */}
      <div style={{ backgroundColor: '#111827', color: 'white', padding: '1.25rem', borderRadius: '4px', border: '2px solid #1f2937' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', color: '#9ca3af' }}>
          Night (00:00-06:00)
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#9ca3af', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {format(night)}
          <span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: '#6b7280' }}>{unit}</span>
        </div>
        {nightSD != null && (
          <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', color: '#9ca3af' }}>
            ± {safeFormat(nightSD, 0)} SD
          </div>
        )}
        {showDuration && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #374151', fontSize: '0.6875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            6 hours
          </div>
        )}
      </div>
    </>
  );
}
