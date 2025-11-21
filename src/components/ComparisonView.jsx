import React from 'react';
import { BarChart2 } from 'lucide-react';
import Tooltip from './Tooltip';
import { getMetricTooltip } from '../utils/metricDefinitions';

/**
 * ComparisonView - Period vs Previous Period Metrics Comparison
 * 
 * Displays side-by-side comparison of glucose metrics between current and previous period.
 * Shows delta/difference between the two periods for quick insights.
 * 
 * Layout: 3-column grid (matching WorkScheduleAnalysis style)
 * - Column 1 (orange): Metric label
 * - Column 2 (dark): Current period metrics + delta
 * - Column 3 (dark): Previous period metrics
 * 
 * @param {Object} currentMetrics - Metrics for current period
 * @param {Object} previousMetrics - Metrics for previous period
 * @param {Date} startDate - Current period start
 * @param {Date} endDate - Current period end
 * @param {Date} prevStart - Previous period start
 * @param {Date} prevEnd - Previous period end
 * 
 * @version 3.0.0
 * @since 2025-11-16 - Sprint S3 grid redesign + GMI row
 */
export default function ComparisonView({ 
  currentMetrics, 
  previousMetrics, 
  startDate, 
  endDate,
  prevStart,
  prevEnd
}) {
  // If either dataset missing, don't render
  if (!currentMetrics || !previousMetrics) {
    return null;
  }

  const safeFormat = (val, decimals = 0) => {
    const num = Number(val);
    if (isNaN(num) || !isFinite(num)) return 'N/A';
    return num.toFixed(decimals);
  };

  // Format dates for display
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  };

  // Calculate days in each period
  const currentDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const previousDays = Math.ceil((prevEnd - prevStart) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate delta (current - previous)
  const calculateDelta = (currentVal, prevVal, decimals = 1) => {
    const curr = Number(currentVal);
    const prev = Number(prevVal);
    
    if (isNaN(curr) || isNaN(prev)) return null;
    
    const delta = curr - prev;
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
    
    // TIR: higher is better
    if (metricKey === 'tir') {
      return delta.isPositive ? 'var(--color-green)' : 'var(--color-red)';
    }
    // Mean, CV, GMI: lower is better
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
    },
    {
      key: 'gmi',
      label: 'GMI',
      unit: '%',
      decimals: 1,
      tooltip: 'gmi',
      subtitle: 'Glucose Management Indicator'
    }
  ];

  return (
    <div
      role="region"
      aria-labelledby="comparison-title"
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
          <BarChart2 
            aria-hidden="true"
            style={{ width: '20px', height: '20px' }} 
          />
          <h3
            id="comparison-title"
            style={{
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase'
            }}
          >
            Period Comparison
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
          {formatDate(startDate)}-{formatDate(endDate)} ({currentDays}d) vs {formatDate(prevStart)}-{formatDate(prevEnd)} ({previousDays}d)
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics.map((metric, index) => {
        const currentVal = currentMetrics[metric.key];
        const prevVal = previousMetrics[metric.key];
        const delta = calculateDelta(currentVal, prevVal, metric.decimals);
        const currentSD = currentMetrics.sd;
        const prevSD = previousMetrics.sd;
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

            {/* Current Period Column */}
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
                Current Period
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
                {safeFormat(currentVal, metric.decimals)}
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
              {metric.key === 'mean' && currentSD && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginTop: '0.5rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  ± {safeFormat(currentSD, 0)} SD
                </div>
              )}

              {/* Delta */}
              {delta && !delta.isNeutral && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    marginTop: '0.75rem',
                    color: getTrendColor(metric.key, delta),
                    letterSpacing: '0.05em'
                  }}
                >
                  {delta.sign}{delta.value} {metric.unit} vs previous
                </div>
              )}
            </div>

            {/* Previous Period Column */}
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
                Previous Period
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
                {safeFormat(prevVal, metric.decimals)}
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
              {metric.key === 'mean' && prevSD && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginTop: '0.5rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  ± {safeFormat(prevSD, 0)} SD
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
                {previousDays} days
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
