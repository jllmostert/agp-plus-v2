import React from 'react';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import Tooltip from './Tooltip';
import { getMetricTooltip } from '../utils/metricDefinitions';
import TIRBar from './TIRBar';

/**
 * MetricsDisplay - Clinical Dashboard Layout
 * 
 * Hero Grid: Golden Ratio layout (1:1.61)
 * - Left zone (dark): TIR + Mean±SD stacked
 * - Right zone (white): CV + GMI + TDD in row
 * 
 * Secondary Grid: All other metrics with reduced visual weight
 * 
 * @version 3.8.0 - Golden ratio hero layout (Task 6.1)
 * @version 2.2.0 - Reorganized Overview section (Analysis Period + Data Quality)
 *                   Moved GRI to HypoglycemiaEvents component
 */
export default function MetricsDisplay({ metrics, tddData }) {
  if (!metrics) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          No metrics available. Upload CSV data.
        </p>
      </div>
    );
  }

  const safeFormat = (val, decimals = 0) => {
    const num = Number(val);
    if (isNaN(num) || !isFinite(num)) return 'N/A';
    return num.toFixed(decimals);
  };

  // Helper to determine if metric is in target range
  const getStatus = (id, value) => {
    const v = Number(value);
    if (isNaN(v)) return 'neutral';
    
    switch(id) {
      case 'tir': return v >= 70 ? 'good' : v >= 50 ? 'warning' : 'danger';
      case 'tar': return v <= 25 ? 'good' : v <= 50 ? 'warning' : 'danger';
      case 'tbr': return v <= 4 ? 'good' : v <= 10 ? 'warning' : 'danger';
      case 'cv': return v <= 36 ? 'good' : v <= 50 ? 'warning' : 'danger';
      case 'gmi': return v < 7.0 ? 'good' : v < 8.0 ? 'warning' : 'danger';
      case 'gri': return v < 5 ? 'good' : v < 20 ? 'neutral' : 'warning';
      case 'mean': return (v >= 70 && v <= 180) ? 'good' : 'warning';
      default: return 'neutral';
    }
  };

  return (
    <>
      {/* HERO GRID - Golden Ratio Layout (1:1.61) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.61fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        
        {/* LEFT ZONE - TIR + Mean (stacked) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* TIR - Large card */}
          <div 
            className="card-hero" 
            style={{ 
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1
            }}
          >
            <Tooltip text={getMetricTooltip('tir')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Activity style={{ width: '24px', height: '24px', color: 'var(--text-inverse)' }} />
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 700, 
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  Time in Range
                </span>
              </div>
            </Tooltip>
            
            <div style={{ 
              fontSize: 'clamp(3rem, 8vw, 4.5rem)', 
              fontWeight: 700, 
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
              lineHeight: 1
            }}>
              {safeFormat(metrics.tir, 1)}%
            </div>
            
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              opacity: 0.8
            }}>
              Target ≥70% • 70-180 mg/dL
            </div>
          </div>

          {/* Mean ± SD */}
          <PrimaryMetricCard
            icon={Activity}
            label="Mean Glucose"
            value={safeFormat(metrics.mean, 0)}
            unit="mg/dL"
            subtitle={`± ${safeFormat(metrics.sd, 0)} SD`}
            status={getStatus('mean', metrics.mean)}
            metricId="mean"
            compact={true}
          />
        </div>

        {/* RIGHT ZONE - CV/GMI/TDD + TIR Bar (stacked) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Top row: CV, GMI, TDD */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            {/* CV */}
            <PrimaryMetricCard
              icon={Zap}
              label="CV"
              value={safeFormat(metrics.cv, 1)}
              unit="%"
              subtitle="Target ≤36%"
              status={getStatus('cv', metrics.cv)}
              metricId="cv"
              compact={true}
            />

            {/* GMI */}
            <PrimaryMetricCard
              icon={Activity}
              label="GMI"
              value={safeFormat(metrics.gmi, 1)}
              unit="%"
              subtitle={`~${safeFormat(metrics.gmi, 1)}% HbA1c`}
              status={getStatus('gmi', metrics.gmi)}
              metricId="gmi"
              compact={true}
            />

            {/* TDD - Total Daily Dose */}
            {tddData ? (
              <PrimaryMetricCard
                icon={Activity}
                label="TDD"
                value={safeFormat(tddData.meanTDD, 1)}
                unit="E"
                subtitle={`± ${safeFormat(tddData.sdTDD, 1)} SD`}
                status="neutral"
                metricId="tdd"
                compact={true}
              />
            ) : (
              <div 
                className="card" 
                style={{ 
                  padding: '1rem',
                  minHeight: '90px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: 0.5
                }}
              >
                <Tooltip text={getMetricTooltip('tdd')}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)'
                  }}>
                    TDD
                  </span>
                </Tooltip>
                <div style={{ fontSize: '0.65rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                  No insulin data
                </div>
              </div>
            )}
          </div>

          {/* Bottom row: TIR Bar */}
          <TIRBar metrics={metrics} />
        </div>
      </div>

      {/* SECONDARY GRID - Detail Metrics (aligned grid layout) */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '200px 1fr 1fr',
        gap: '1rem',
        alignItems: 'stretch'
      }}>
        
        {/* Variability Metrics */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.875rem', 
          fontWeight: 700, 
          letterSpacing: '0.2em', 
          textTransform: 'uppercase',
          color: 'var(--color-black)',
          backgroundColor: 'var(--color-orange)',
          padding: '1rem',
          border: '3px solid var(--color-black)'
        }}>
          Variability Metrics
        </div>
        <SecondaryMetricCard label="MAGE" value={safeFormat(metrics.mage, 0)} unit="mg/dL" subtitle="Glycemic excursions" metricId="mage" />
        <SecondaryMetricCard label="MODD" value={safeFormat(metrics.modd, 0)} unit="mg/dL" subtitle="Day-to-day variability" metricId="modd" />

        {/* Glucose Range */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.875rem', 
          fontWeight: 700, 
          letterSpacing: '0.2em', 
          textTransform: 'uppercase',
          color: 'var(--color-black)',
          backgroundColor: 'var(--color-orange)',
          padding: '1rem',
          border: '3px solid var(--color-black)'
        }}>
          Glucose Range
        </div>
        <SecondaryMetricCard label="Minimum" value={safeFormat(metrics.min, 0)} unit="mg/dL" />
        <SecondaryMetricCard label="Maximum" value={safeFormat(metrics.max, 0)} unit="mg/dL" />

        {/* Overview */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.875rem', 
          fontWeight: 700, 
          letterSpacing: '0.2em', 
          textTransform: 'uppercase',
          color: 'var(--color-black)',
          backgroundColor: 'var(--color-orange)',
          padding: '1rem',
          border: '3px solid var(--color-black)'
        }}>
          Overview
        </div>
        <SecondaryMetricCard 
          label="Analysis Period" 
          value={safeFormat(metrics.days, 0)} 
          unit="days"
          subtitle={
            metrics.dataQuality?.completeDays != null && metrics.dataQuality?.totalDays != null
              ? `${metrics.dataQuality.completeDays} complete / ${metrics.dataQuality.totalDays - metrics.dataQuality.completeDays} partial`
              : ''
          }
        />
        <SecondaryMetricCard 
          label="Data Quality" 
          value={metrics.dataQuality?.uptimePercent != null ? safeFormat(metrics.dataQuality.uptimePercent, 1) : 'N/A'} 
          unit="%"
          subtitle={
            metrics.readingCount != null
              ? `${metrics.readingCount.toLocaleString()} readings`
              : ''
          }
          status={
            metrics.dataQuality?.uptimePercent >= 95 ? 'good' :
            metrics.dataQuality?.uptimePercent >= 85 ? 'warning' :
            metrics.dataQuality?.uptimePercent != null ? 'danger' :
            'neutral'
          }
        />
      </div>
    </>
  );
}

/**
 * PrimaryMetricCard - Hero Grid Metrics (Mean, CV, GMI)
 * Large text, high contrast, prominent display
 * @param {boolean} compact - If true, reduces height and font sizes for tighter layout
 */
function PrimaryMetricCard({ icon: Icon, label, value, unit, subtitle, status = 'neutral', metricId, compact = false }) {
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
        padding: compact ? '1rem' : '1.5rem',
        minHeight: compact ? '90px' : '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Icon + Label */}
      <Tooltip text={metricId ? getMetricTooltip(metricId) : ''}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: compact ? '0.5rem' : '1rem' }}>
          <Icon style={{ 
            width: compact ? '16px' : '20px', 
            height: compact ? '16px' : '20px',
            color: status === 'danger' ? 'var(--color-red)' : 
                   status === 'warning' ? 'var(--color-yellow)' : 
                   'var(--text-primary)'
          }} />
          <span style={{ 
            fontSize: compact ? '0.75rem' : '0.875rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)'
          }}>
            {label}
          </span>
        </div>
      </Tooltip>

      {/* Value */}
      <div>
        <div style={{ 
          fontSize: compact ? 'clamp(1.75rem, 4vw, 2.25rem)' : 'clamp(2.5rem, 5vw, 3.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: getStatusColor(),
          lineHeight: 1,
          marginBottom: '0.5rem',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {value}
          <span style={{ fontSize: compact ? '1rem' : '1.5rem', marginLeft: '0.25rem', opacity: 0.7 }}>{unit}</span>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div style={{ 
            fontSize: compact ? '0.65rem' : '1rem',
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

/**
 * SecondaryMetricCard - Detail Grid Metrics
 * BRUTALIST: Dark background, white text, thick borders, high contrast
 */
function SecondaryMetricCard({ label, value, unit, subtitle, status = 'neutral', metricId }) {
  const getStatusColor = () => {
    switch(status) {
      case 'good': return 'var(--color-green)';
      case 'warning': return 'var(--color-orange)';
      case 'danger': return 'var(--color-red)';
      default: return 'var(--color-white)';
    }
  };

  return (
    <div 
      style={{
        backgroundColor: 'var(--bg-card-dark)', // #1a1a1a - brutalist dark
        color: 'var(--color-white)',
        padding: '1.5rem',
        borderRadius: '0', // NO ROUNDED CORNERS
        border: '3px solid var(--color-black)', // THICK BLACK BORDER
        transition: 'transform 100ms linear, box-shadow 100ms linear'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-black) inset';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Label - ORANGE accent for headers */}
      <Tooltip text={metricId ? getMetricTooltip(metricId) : ''}>
        <div style={{ 
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
          color: 'var(--color-orange)', // BRUTALIST ACCENT
          borderBottom: '2px solid var(--color-orange)',
          paddingBottom: '0.5rem'
        }}>
          {label}
        </div>
      </Tooltip>

      {/* Value - HUGE and STATUS COLORED */}
      <div style={{ 
        fontSize: '2.5rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: getStatusColor(),
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        marginBottom: '0.5rem'
      }}>
        {value}
        {unit && (
          <span style={{ 
            fontSize: '1.25rem', 
            marginLeft: '0.5rem', 
            color: 'var(--text-tertiary)',
            fontWeight: 600
          }}>
            {unit}
          </span>
        )}
      </div>

      {/* Subtitle - dimmed but readable */}
      {subtitle && (
        <div style={{ 
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          marginTop: '0.75rem',
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          borderTop: '1px solid var(--text-tertiary)',
          paddingTop: '0.5rem'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
