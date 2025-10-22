import React from 'react';

const safeFormat = (val, decimals = 0) => {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return 'N/A';
  return num.toFixed(decimals);
};

export default function WorkdaySplit({ workdayMetrics, restdayMetrics }) {
  if (!workdayMetrics || !restdayMetrics) return null;

  const workdayCount = workdayMetrics.days || 0;
  const restdayCount = restdayMetrics.days || 0;

  const comparisons = [
    { id: 'tir', label: 'Time in Range', sublabel: '70-180 mg/dL', workday: workdayMetrics.tir, restday: restdayMetrics.tir, unit: '%', format: (v) => safeFormat(v, 1), betterIfHigher: true },
    { id: 'mean', label: 'Mean Glucose', workday: workdayMetrics.mean, restday: restdayMetrics.mean, unit: 'mg/dL', format: (v) => safeFormat(v, 0), workdaySD: workdayMetrics.sd, restdaySD: restdayMetrics.sd },
    { id: 'cv', label: 'Coefficient Variation', workday: workdayMetrics.cv, restday: restdayMetrics.cv, unit: '%', format: (v) => safeFormat(v, 1), betterIfLower: true },
  ];

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Work Schedule Analysis</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{workdayCount} workdays vs {restdayCount} rest days</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
        {comparisons.map((comp) => (<WorkdayRow key={comp.id} {...comp} />))}
      </div>
    </div>
  );
}

function WorkdayRow({ label, sublabel, workday, restday, unit, format, workdaySD, restdaySD, betterIfHigher, betterIfLower }) {
  const delta = workday - restday;
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
      
      {/* Workday Card */}
      <div style={{ backgroundColor: '#111827', color: 'white', padding: '1.25rem', borderRadius: '4px', border: '2px solid #1f2937' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', color: '#9ca3af' }}>
          Workdays
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#f9fafb', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {format(workday)}
          <span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: '#d1d5db' }}>{unit}</span>
        </div>
        {workdaySD != null && (
          <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', color: '#d1d5db' }}>
            ± {safeFormat(workdaySD, 0)} SD
          </div>
        )}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem', color: trendColor }}>{trendIcon}</span>
          <span style={{ fontSize: '0.875rem', color: trendColor, fontWeight: 600 }}>
            {delta > 0 ? '+' : ''}{deltaFormatted} {unit} vs rest
          </span>
        </div>
      </div>
      
      {/* Rest Day Card */}
      <div style={{ backgroundColor: '#111827', color: 'white', padding: '1.25rem', borderRadius: '4px', border: '2px solid #1f2937' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', color: '#9ca3af' }}>
          Rest Days
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#9ca3af', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {format(restday)}
          <span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: '#6b7280' }}>{unit}</span>
        </div>
        {restdaySD != null && (
          <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', color: '#9ca3af' }}>
            ± {safeFormat(restdaySD, 0)} SD
          </div>
        )}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #374151', fontSize: '0.6875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Non-work days
        </div>
      </div>
    </>
  );
}
