import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * HypoglycemiaEvents - Warning Panel for Hypo Events
 * 
 * Displays hypoglycemia episodes with severity classification.
 * Each episode is classified AFTER completion based on nadir:
 * - Severe: nadir <54 mg/dL (Level 2)
 * - Low: nadir ≥54 mg/dL (Level 1)
 * 
 * @param {Object} props.events - { hypoEpisodes: {count, severeCount, lowCount, events} }
 * @param {number} props.tbrPercent - Total time below range percentage
 * @param {number} props.gri - Glycemia Risk Index
 * 
 * @version 3.8.0 - Updated for new episode-based hypo detection
 */
export default function HypoglycemiaEvents({ events, tbrPercent, gri }) {
  if (!events?.hypoEpisodes?.count) {
    return null;
  }

  const severeCount = events.hypoEpisodes.severeCount || 0;
  const lowCount = events.hypoEpisodes.lowCount || 0;
  const totalCount = events.hypoEpisodes.count || 0;

  // Use average durations calculated by metrics engine
  const severeAvgDuration = events.hypoEpisodes.avgDurationSevere || 0;
  const lowAvgDuration = events.hypoEpisodes.avgDurationLow || 0;
  const avgDuration = events.hypoEpisodes.avgDuration || 0; // Combined average

  return (
    <div 
      style={{
        backgroundColor: 'var(--color-red)',
        border: '3px solid var(--color-red)',
        borderLeft: '8px solid var(--color-red)',
        padding: '1.5rem',
        marginTop: '1.5rem',
        borderRadius: '4px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <AlertTriangle style={{ width: '24px', height: '24px', color: 'var(--text-inverse)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-inverse)' }}>
          Hypoglycemia Episodes ({totalCount} total)
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        
        {/* Severe Episodes (nadir <54) - RED background with white text */}
        <div style={{ backgroundColor: 'var(--bg-card-dark)', border: '2px solid var(--color-red)', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-inverse)', marginBottom: '0.5rem' }}>
            Severe (nadir &lt;54)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-inverse)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {severeCount}
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-red)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Critical Episodes
          </div>
          {severeAvgDuration > 0 && (
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-inverse)', marginTop: '0.5rem', opacity: 0.8 }}>
              Ø {severeAvgDuration} min
            </div>
          )}
        </div>

        {/* Low Episodes (nadir ≥54) - ORANGE border with dark background */}
        <div style={{ backgroundColor: 'var(--bg-card-dark)', border: '2px solid var(--color-orange)', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-inverse)', marginBottom: '0.5rem' }}>
            Low (nadir ≥54)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-inverse)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {lowCount}
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-orange)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Warning Episodes
          </div>
          {lowAvgDuration > 0 && (
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-inverse)', marginTop: '0.5rem', opacity: 0.8 }}>
              Ø {lowAvgDuration} min
            </div>
          )}
        </div>

        {/* TBR Percentage */}
        <div style={{ backgroundColor: 'var(--bg-card-dark)', border: '2px solid var(--border-secondary)', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-inverse)', marginBottom: '0.5rem' }}>
            Time Below Range
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-inverse)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {tbrPercent != null ? parseFloat(tbrPercent).toFixed(1) : 'N/A'}
            <span style={{ fontSize: '1.25rem', opacity: 0.7 }}>%</span>
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-tertiary)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Target &lt;4%
          </div>
        </div>

        {/* GRI */}
        <div style={{ backgroundColor: 'var(--bg-card-dark)', border: '2px solid var(--border-secondary)', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-inverse)', marginBottom: '0.5rem' }}>
            Risk Index (GRI)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-inverse)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {gri != null ? parseFloat(gri).toFixed(1) : 'N/A'}
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-tertiary)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {gri != null && parseFloat(gri) < 20 ? 'Very Low Risk' :
             gri != null && parseFloat(gri) < 40 ? 'Low Risk' :
             gri != null && parseFloat(gri) < 60 ? 'Moderate Risk' :
             gri != null && parseFloat(gri) < 80 ? 'High Risk' : 
             gri != null ? 'Very High Risk' : 'Target <5'}
          </div>
        </div>
      </div>
    </div>
  );
}
