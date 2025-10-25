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
        backgroundColor: '#7f1d1d',
        border: '3px solid #dc2626',
        borderLeft: '8px solid #dc2626',
        padding: '1.5rem',
        marginTop: '1.5rem',
        borderRadius: '4px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <AlertTriangle style={{ width: '24px', height: '24px', color: '#fca5a5' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fecaca' }}>
          Hypoglycemia Events
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        
        <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.3)', border: '2px solid #dc2626', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fca5a5', marginBottom: '0.5rem' }}>
            Level 2 (&lt;54)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fee2e2', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {l2Count}
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#fca5a5', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Critical Events
          </div>
          {l2AvgDuration > 0 && (
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fed7aa', marginTop: '0.5rem' }}>
              Ø {l2AvgDuration} min
            </div>
          )}
        </div>

        <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.3)', border: '2px solid #f97316', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fed7aa', marginBottom: '0.5rem' }}>
            Level 1 (54-70)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ffedd5', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {l1Count}
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#fed7aa', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Warning Events
          </div>
          {l1AvgDuration > 0 && (
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fde68a', marginTop: '0.5rem' }}>
              Ø {l1AvgDuration} min
            </div>
          )}
        </div>

        <div style={{ backgroundColor: 'rgba(75, 85, 99, 0.4)', border: '2px solid #6b7280', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d1d5db', marginBottom: '0.5rem' }}>
            Time Below Range
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f3f4f6', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {tbrPercent != null ? parseFloat(tbrPercent).toFixed(1) : 'N/A'}
            <span style={{ fontSize: '1.25rem', opacity: 0.7 }}>%</span>
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#d1d5db', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Target &lt;4%
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(55, 65, 81, 0.6)', border: '2px solid #4b5563', padding: '1rem', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e5e7eb', marginBottom: '0.5rem' }}>
            Risk Index (GRI)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f9fafb', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {gri != null ? parseFloat(gri).toFixed(1) : 'N/A'}
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#e5e7eb', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
