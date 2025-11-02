/**
 * HeroMetricsPanel.jsx
 * 
 * Hero metrics display (5 primary cards).
 * Extracted from MetricsDisplay.jsx (Sprint C1 Phase 4.3)
 * 
 * Displays:
 * - TIR (Time in Range)
 * - Mean Glucose ± SD
 * - CV (Coefficient of Variation)
 * - GMI (Glucose Management Indicator)
 * - TDD (Total Daily Dose) - conditional
 * 
 * @version 1.0.0
 * @created 2025-11-02
 */

import React from 'react';
import { Activity, Zap } from 'lucide-react';
import Tooltip from '../Tooltip';
import { getMetricTooltip } from '../../utils/metricDefinitions';

/**
 * PrimaryMetricCard - Internal component for hero cards
 */
function PrimaryMetricCard({ icon: Icon, label, value, unit, subtitle, status = 'neutral', metricId }) {
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
      <Tooltip text={metricId ? getMetricTooltip(metricId) : ''}>
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
      </Tooltip>

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

        {subtitle && (
          <div style={{ 
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--border-tertiary)',
            marginTop: '0.25rem'
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
