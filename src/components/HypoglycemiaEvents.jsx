import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * HypoglycemiaEvents - Warning Panel for Hypo Events
 * 
 * Displays Level 1 and Level 2 hypoglycemia events with urgent visual styling.
 * Positioned under AGP chart as a high-visibility warning section.
 * 
 * @param {Object} props.events - { hypoL1: {count, events}, hypoL2: {count, events} }
 * @param {number} props.tbrPercent - Total time below range percentage
 * @param {number} props.gri - Glycemia Risk Index
 * 
 * @version 2.2.0 - Replaced Total Events with GRI
 */
export default function HypoglycemiaEvents({ events, tbrPercent, gri }) {
  if (!events || (!events.hypoL1?.count && !events.hypoL2?.count)) {
    return null;
  }

  const l1Count = events.hypoL1?.count || 0;
  const l2Count = events.hypoL2?.count || 0;
  const totalEvents = l1Count + l2Count;

  // Use average durations calculated by metrics engine
  const l1AvgDuration = events.hypoL1?.avgDuration || 0;
  const l2AvgDuration = events.hypoL2?.avgDuration || 0;
  const avgDuration = events.avgDuration || 0; // Combined average for all hypos

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
          Hypoglycemia Events
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        
        {/* Level 2 Critical - RED background with white text */}
        <div style={{ backgroundColor: 'var(--bg-card-dark)', border: '2px solid var(--color-red)', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-inverse)', marginBottom: '0.5rem' }}>
            Level 2 (&lt;54)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-inverse)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {l2Count}
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-red)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Critical Events
          </div>
          {l2AvgDuration > 0 && (
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-inverse)', marginTop: '0.5rem', opacity: 0.8 }}>
              Ø {l2AvgDuration} min
            </div>
          )}
        </div>

        {/* Level 1 Warning - ORANGE border with dark background */}
        <div style={{ backgroundColor: 'var(--bg-card-dark)', border: '2px solid var(--color-orange)', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-inverse)', marginBottom: '0.5rem' }}>
            Level 1 (54-70)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-inverse)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {l1Count}
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-orange)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Warning Events
          </div>
          {l1AvgDuration > 0 && (
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-inverse)', marginTop: '0.5rem', opacity: 0.8 }}>
              Ø {l1AvgDuration} min
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
