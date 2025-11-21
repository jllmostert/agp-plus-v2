import React from 'react';
import { Sun, Moon } from 'lucide-react';
import Tooltip from './Tooltip';
import { getMetricTooltip } from '../utils/metricDefinitions';

/**
 * DayNightSplit - Day vs Night Metrics Comparison
 * 
 * Displays side-by-side comparison of glucose metrics between day and night periods.
 * Shows delta/difference between the two periods for quick insights.
 * 
 * Layout: 3-column grid (matching WorkScheduleAnalysis style)
 * - Column 1 (orange): Metric label
 * - Column 2 (dark): Day metrics (06:00-00:00) + delta
 * - Column 3 (dark): Night metrics (00:00-06:00)
 * 
 * @param {Object} dayMetrics - Metrics calculated for day period (06:00-00:00)
 * @param {Object} nightMetrics - Metrics calculated for night period (00:00-06:00)
 * 
 * @version 2.0.0
 * @since 2025-11-16 - Sprint S3 grid redesign
 */
export default function DayNightSplit({ dayMetrics, nightMetrics }) {
  // If either dataset missing, don't render
  if (!dayMetrics || !nightMetrics) {
    return null;
  }

  const safeFormat = (val, decimals = 0) => {
    const num = Number(val);
    if (isNaN(num) || !isFinite(num)) return 'N/A';
    return num.toFixed(decimals);
  };

  // Calculate delta (day - night)
  const calculateDelta = (dayVal, nightVal, decimals = 1) => {
    const day = Number(dayVal);
    const night = Number(nightVal);
    
    if (isNaN(day) || isNaN(night)) return null;
    
    const delta = day - night;
    const sign = delta > 0 ? '↑ +' : delta < 0 ? '↓ ' : '';
    
    return {
      value: Math.abs(delta).toFixed(decimals),
      sign,
      raw: delta,
      isPositive: delta > 0,
      isNegative: delta < 0,
      isNeutral: delta === 0
    };
  };

  // Get trend color based on whether change is good or bad
  const getTrendColor = (metricKey, delta) => {
    if (!delta || delta.isNeutral) return 'var(--text-tertiary)';
    
    // TIR: higher is better (day having higher TIR = green)
    if (metricKey === 'tir') {
      return delta.isPositive ? 'var(--color-green)' : 'var(--color-red)';
    }
    // Mean, CV: lower is better
    return delta.isNegative ? 'var(--color-green)' : 'var(--color-red)';
  };

  const metrics = [
    {
      key: 'tir',
      label: 'Time in Range',
      unit: '%',
      decimals: 1,
      tooltip: 'tir',
      subtitle: '70-180 mg/dL'
    },
    {
      key: 'mean',
      label: 'Mean Glucose',
      unit: 'mg/dL',
      decimals: 0,
      tooltip: 'mean',
      subtitle: null
    },
    {
      key: 'cv',
      label: 'Coefficient Variation',
      unit: '%',
      decimals: 1,
      tooltip: 'cv',
      subtitle: 'Target ≤36%'
    }
  ];

  return (
    <div
      role="region"
      aria-labelledby="day-night-title"
      style={{
        marginTop: '2rem',
        marginBottom: '2rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--color-black)',
          color: 'var(--color-white)',
          padding: '1rem 1.5rem',
          border: '3px solid var(--color-black)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sun 
            aria-hidden="true"
            style={{ width: '20px', height: '20px' }} 
          />
          <h3
            id="day-night-title"
            style={{
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase'
            }}
          >
            Day/Night Analysis
          </h3>
        </div>
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'var(--color-orange)'
          }}
        >
          06:00-00:00 vs 00:00-06:00
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics.map((metric, index) => {
        const dayVal = dayMetrics[metric.key];
        const nightVal = nightMetrics[metric.key];
        const delta = calculateDelta(dayVal, nightVal, metric.decimals);
        const daySD = dayMetrics.sd;
        const nightSD = nightMetrics.sd;
        const isLast = index === metrics.length - 1;

        return (
          <div
            key={metric.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr 1fr',
              gap: '1rem',
              marginBottom: isLast ? '0' : '1rem'
            }}
          >
            {/* Label Column */}
            <div
              style={{
                backgroundColor: 'var(--color-orange)',
                color: 'var(--color-black)',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: '3px solid var(--color-black)'
              }}
            >
              <Tooltip text={metric.tooltip ? getMetricTooltip(metric.tooltip) : ''}>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    lineHeight: 1.3
                  }}
                >
                  {metric.label}
                </div>
              </Tooltip>
              {metric.subtitle && (
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    marginTop: '0.25rem',
                    opacity: 0.7
                  }}
                >
                  {metric.subtitle}
                </div>
              )}
            </div>

            {/* Day Column */}
            <div
              style={{
                backgroundColor: 'var(--bg-card-dark)',
                color: 'var(--color-white)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: '3px solid var(--color-black)'
              }}
            >
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-orange)',
                  marginBottom: '0.5rem'
                }}
              >
                Day (06:00-00:00)
              </div>
              
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {safeFormat(dayVal, metric.decimals)}
                <span
                  style={{
                    fontSize: '1.25rem',
                    marginLeft: '0.5rem',
                    opacity: 0.7
                  }}
                >
                  {metric.unit}
                </span>
              </div>

              {/* SD subtitle for mean */}
              {metric.key === 'mean' && daySD && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginTop: '0.5rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  ± {safeFormat(daySD, 0)} SD
                </div>
              )}

              {/* Delta */}
              {delta && !delta.isNeutral && (
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginTop: '0.75rem',
                    color: getTrendColor(metric.key, delta),
                    letterSpacing: '0.05em'
                  }}
                >
                  {delta.sign}{delta.value} {metric.unit} vs night
                </div>
              )}
            </div>

            {/* Night Column */}
            <div
              style={{
                backgroundColor: 'var(--bg-card-dark)',
                color: 'var(--color-white)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: '3px solid var(--color-black)'
              }}
            >
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  marginBottom: '0.5rem'
                }}
              >
                Night (00:00-06:00)
              </div>
              
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {safeFormat(nightVal, metric.decimals)}
                <span
                  style={{
                    fontSize: '1.25rem',
                    marginLeft: '0.5rem',
                    opacity: 0.7
                  }}
                >
                  {metric.unit}
                </span>
              </div>

              {/* SD subtitle for mean */}
              {metric.key === 'mean' && nightSD && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginTop: '0.5rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  ± {safeFormat(nightSD, 0)} SD
                </div>
              )}

              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  marginTop: '0.75rem',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                6 hours
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
