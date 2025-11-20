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
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '4px solid var(--color-black)',
      padding: '2rem',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'var(--color-black)',
        border: '3px solid var(--color-orange)'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--color-white)',
          margin: 0
        }}>
          Work Schedule Analysis
        </h3>
        <div style={{
          fontSize: '1rem',
          color: 'var(--color-orange)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          fontFamily: 'monospace'
        }}>
          {workdayCount} workdays vs {restdayCount} rest days
        </div>
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
  let trendIcon = '→', trendColor = 'var(--text-secondary)';
  if (Math.abs(delta) > 0.5) {
    if (betterIfHigher) { trendIcon = delta > 0 ? '↑' : '↓'; trendColor = delta > 0 ? 'var(--color-green)' : 'var(--color-red)'; }
    else if (betterIfLower) { trendIcon = delta > 0 ? '↑' : '↓'; trendColor = delta < 0 ? 'var(--color-green)' : 'var(--color-red)'; }
    else { trendIcon = delta > 0 ? '↑' : '↓'; }
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
      
      {/* Workday Card - DARK BRUTALIST */}
      <div style={{
        backgroundColor: 'var(--bg-card-dark)',
        color: 'var(--color-white)',
        padding: '1.5rem',
        borderRadius: '0',
        border: '3px solid var(--color-blue)',
        transition: 'all 100ms linear'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-blue) inset';
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
          color: 'var(--color-blue)',
          borderBottom: '2px solid var(--color-blue)',
          paddingBottom: '0.5rem'
        }}>
          Workdays
        </div>
        <div style={{ 
          fontSize: '2.5rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--color-white)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1
        }}>
          {format(workday)}
          <span style={{ fontSize: '1.25rem', marginLeft: '0.5rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{unit}</span>
        </div>
        {workdaySD != null && (
          <div style={{ 
            fontSize: '1.15rem',
            fontWeight: 600,
            marginTop: '0.75rem',
            color: 'var(--text-tertiary)'
          }}>
            ± {safeFormat(workdaySD, 0)} SD
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
            {delta > 0 ? '+' : ''}{deltaFormatted} {unit} vs rest
          </span>
        </div>
      </div>
      
      {/* Rest Day Card - DARK BRUTALIST */}
      <div style={{
        backgroundColor: 'var(--bg-card-dark)',
        color: 'var(--color-white)',
        padding: '1.5rem',
        borderRadius: '0',
        border: '3px solid var(--text-tertiary)',
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
          Rest Days
        </div>
        <div style={{ 
          fontSize: '2.5rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--color-white)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1
        }}>
          {format(restday)}
          <span style={{ fontSize: '1.25rem', marginLeft: '0.5rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{unit}</span>
        </div>
        {restdaySD != null && (
          <div style={{ 
            fontSize: '1.15rem',
            fontWeight: 600,
            marginTop: '0.75rem',
            color: 'var(--text-tertiary)'
          }}>
            ± {safeFormat(restdaySD, 0)} SD
          </div>
        )}
        
        {/* Footer Info */}
        <div style={{ 
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '2px solid var(--text-tertiary)',
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 700
        }}>
          Non-work days
        </div>
      </div>
    </>
  );
}
