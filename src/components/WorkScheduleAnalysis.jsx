import React from 'react';
import { Briefcase } from 'lucide-react';
import Tooltip from './Tooltip';
import { getMetricTooltip } from '../utils/metricDefinitions';

/**
 * WorkScheduleAnalysis - Workday vs Rest Day Metrics Comparison
 * 
 * Displays side-by-side comparison of glucose metrics between workdays and rest days.
 * Shows delta/difference between the two groups for quick insights.
 * 
 * Layout: 3-column grid
 * - Column 1 (orange): Metric label
 * - Column 2 (dark): Workday metrics + delta
 * - Column 3 (dark): Rest day metrics
 * 
 * @param {Object} workdayMetrics - Metrics calculated for workdays only
 * @param {Object} restdayMetrics - Metrics calculated for rest days only
 * 
 * @version 1.0.0
 * @since 2025-11-16 - Sprint S3 (Track 2: Safety & Accessibility)
 */
export default function WorkScheduleAnalysis({ workdayMetrics, restdayMetrics }) {
  // If either dataset missing, don't render
  if (!workdayMetrics || !restdayMetrics) {
    return null;
  }

  const safeFormat = (val, decimals = 0) => {
    const num = Number(val);
    if (isNaN(num) || !isFinite(num)) return 'N/A';
    return num.toFixed(decimals);
  };

  // Calculate delta (workday - restday)
  const calculateDelta = (workVal, restVal, decimals = 1) => {
    const work = Number(workVal);
    const rest = Number(restVal);
    
    if (isNaN(work) || isNaN(rest)) return null;
    
    const delta = work - rest;
    const sign = delta > 0 ? '↑ +' : delta < 0 ? '↓ ' : '';
    
    return {
      value: Math.abs(delta).toFixed(decimals),
      sign,
      isPositive: delta > 0,
      isNegative: delta < 0,
      isNeutral: delta === 0
    };
  };

  // Get comparison label
  const getComparisonLabel = (metricKey) => {
    // For TIR: higher is better, so positive delta is good
    // For Mean/CV: depends on context
    return 'vs rest';
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
      aria-labelledby="work-schedule-title"
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
          <Briefcase 
            aria-hidden="true"
            style={{ width: '20px', height: '20px' }} 
          />
          <h3
            id="work-schedule-title"
            style={{
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase'
            }}
          >
            Work Schedule Analysis
          </h3>
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'var(--color-orange)'
          }}
        >
          {workdayMetrics.days} workdays vs {restdayMetrics.days} rest days
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics.map((metric, index) => {
        const workVal = workdayMetrics[metric.key];
        const restVal = restdayMetrics[metric.key];
        const delta = calculateDelta(workVal, restVal, metric.decimals);
        const workSD = workdayMetrics.sd;
        const restSD = restdayMetrics.sd;
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
                    fontSize: '0.75rem',
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
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    marginTop: '0.25rem',
                    opacity: 0.7
                  }}
                >
                  {metric.subtitle}
                </div>
              )}
            </div>

            {/* Workdays Column */}
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
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-orange)',
                  marginBottom: '0.5rem'
                }}
              >
                Workdays
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
                {safeFormat(workVal, metric.decimals)}
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
              {metric.key === 'mean' && workSD && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginTop: '0.5rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  ± {safeFormat(workSD, 0)} SD
                </div>
              )}

              {/* Delta */}
              {delta && !delta.isNeutral && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginTop: '0.75rem',
                    color: 'var(--color-orange)',
                    letterSpacing: '0.05em'
                  }}
                >
                  {delta.sign}{delta.value} {metric.unit} {getComparisonLabel(metric.key)}
                </div>
              )}
            </div>

            {/* Rest Days Column */}
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
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  marginBottom: '0.5rem'
                }}
              >
                Rest Days
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
                {safeFormat(restVal, metric.decimals)}
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
              {metric.key === 'mean' && restSD && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginTop: '0.5rem',
                    color: 'var(--text-tertiary)'
                  }}
                >
                  ± {safeFormat(restSD, 0)} SD
                </div>
              )}

              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  marginTop: '0.75rem',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                Non-work days
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
