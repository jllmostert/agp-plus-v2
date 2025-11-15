import React from 'react';

/**
 * TIRBar - Time in Range Distribution (BRUTALIST)
 * 
 * Displays a horizontal bar chart with Soviet-inspired color palette:
 * - TBR: Red (#c70000) - Warning, critical
 * - TIR: Gray/White - Target achievement
 * - TAR: Yellow (#f4e300) - Caution
 * 
 * Design: Massive borders, no gradients, printed feel
 * 
 * @param {Object} props.metrics - Calculated metrics
 * @version 2.2.0 BRUTALIST - Compact version for metrics grid
 */
export default function TIRBar({ metrics }) {
  const tbr = parseFloat(metrics.tbr) || 0;
  const tir = parseFloat(metrics.tir) || 0;
  const tar = parseFloat(metrics.tar) || 0;
  
  // Screen reader summary
  const accessibleSummary = `Time in Range distribution: ${tbr.toFixed(1)}% below range (under 70 mg/dL), ${tir.toFixed(1)}% in target range (70-180 mg/dL), ${tar.toFixed(1)}% above range (over 180 mg/dL). Target is at least 70% in range.`;
  
  return (
    <div 
      className="card" 
      role="region"
      aria-labelledby="tir-bar-title"
      style={{ 
        padding: '1rem',
        marginBottom: '0'
      }}
    >
      <h4 
        id="tir-bar-title"
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
          color: 'var(--text-primary)'
        }}
      >
        Time in Range Distribution
      </h4>
      
      {/* Screen reader summary */}
      <div className="sr-only" role="status" aria-live="polite">
        {accessibleSummary}
      </div>
      
      {/* Single-line bar - GUARANTEED */}
      <div 
        role="img"
        aria-label="Time in Range bar chart"
        style={{
          display: 'flex',
          height: '36px',
          width: '100%',
          border: '3px solid var(--border-primary)',
          borderRadius: '0',
          overflow: 'hidden',
          background: 'var(--bg-primary)'
        }}
      >
        {/* TBR - Soviet Red */}
        {tbr > 0 && (
          <div
            role="img"
            aria-label={`Time below range: ${tbr.toFixed(1)}% (below 70 mg/dL)`}
            style={{
              width: `${tbr}%`,
              background: 'var(--color-tbr)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.05em',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              flexShrink: 0,
              minWidth: '2px'
            }}
          >
            {tbr > 4 ? `${tbr.toFixed(1)}%` : ''}
          </div>
        )}
        
        {/* TIR - Gray/White */}
        <div
          role="img"
          aria-label={`Time in range: ${tir.toFixed(1)}% (70-180 mg/dL, target is 70% or more)`}
          style={{
            width: `${tir}%`,
            background: 'var(--color-tir)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 900,
            letterSpacing: '0.05em',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            flexShrink: 0,
            minWidth: '2px'
          }}
        >
          {tir.toFixed(1)}%
        </div>
        
        {/* TAR - Yellow */}
        {tar > 0 && (
          <div
            role="img"
            aria-label={`Time above range: ${tar.toFixed(1)}% (above 180 mg/dL)`}
            style={{
              width: `${tar}%`,
              background: 'var(--color-tar)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.05em',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              flexShrink: 0,
              minWidth: '2px'
            }}
          >
            {tar > 4 ? `${tar.toFixed(1)}%` : ''}
          </div>
        )}
      </div>
      
      {/* Legend - Monospace, uppercase */}
      <div 
        role="note"
        aria-label="Legend: TBR is time below 70 mg/dL, TIR is time in range 70-180 mg/dL with target of 70% or more, TAR is time above 180 mg/dL"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.75rem',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)'
        }}
      >
        <span>TBR &lt;70</span>
        <span>TIR 70-180 (Target ≥70%)</span>
        <span>TAR &gt;180</span>
      </div>
    </div>
  );
}
