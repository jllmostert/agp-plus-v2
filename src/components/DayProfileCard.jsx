/**
 * DayProfileCard.jsx
 * Single day glucose profile with 24h curve, metrics, events, and badges
 * 
 * Brutalist design:
 * - 3px borders, grid layout
 * - Monospace typography
 * - High contrast
 * - Soviet-inspired red/yellow accents
 */

import React from 'react';
import { calculateAdaptiveYAxis, createYScale, createXScale } from '../core/visualization-utils';

export default function DayProfileCard({ profile }) {
  if (!profile) return null;

  const { date, dayOfWeek, metrics, curve, events, sensorChanges, cartridgeChanges, badges, readingCount } = profile;

  return (
    <div
      className="day-profile-card"
      style={{
        border: '3px solid var(--color-black)',
        backgroundColor: 'var(--color-white)',
        padding: 0,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gridTemplateRows: 'auto 1fr auto',
        gap: 0,
        minHeight: '400px'
      }}
    >
      {/* Header - Date + Badges (spans full width) */}
      <div
        style={{
          gridColumn: '1 / -1',
          borderBottom: '3px solid var(--color-black)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-black)',
          color: 'var(--color-white)'
        }}
      >
        {/* Date */}
        <div>
          <div
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '24px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
          >
            {dayOfWeek}
          </div>
          <div
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '14px',
              color: '#ccc',
              marginTop: '4px'
            }}
          >
            {profile.dateObj.toLocaleDateString('nl-NL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {badges.map((badge) => (
            <div
              key={badge.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: '2px solid var(--color-white)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }}
              title={badge.description}
            >
              <span style={{ fontSize: '24px' }}>{badge.emoji}</span>
              <span
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {badge.name}
              </span>
            </div>
          ))}
          {badges.length === 0 && (
            <span
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '12px',
                color: '#666',
                letterSpacing: '1px'
              }}
            >
              NO BADGES
            </span>
          )}
        </div>
      </div>

      {/* Main Content: 24h Curve */}
      <div
        style={{
          gridColumn: '1',
          gridRow: '2',
          padding: '24px',
          borderRight: '3px solid var(--color-black)'
        }}
      >
        <GlucoseCurve24h 
          curve={curve} 
          events={events} 
          sensorChanges={sensorChanges}
          cartridgeChanges={cartridgeChanges}
          agpCurve={profile.agpCurve}
        />
      </div>

      {/* Right Sidebar: TIR Bar */}
      <div
        style={{
          gridColumn: '2',
          gridRow: '2',
          width: '120px',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <TIRBar metrics={metrics} />
      </div>

      {/* Footer: Metrics Panel (spans full width) */}
      <div
        style={{
          gridColumn: '1 / -1',
          borderTop: '3px solid var(--color-black)',
          padding: '16px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <MetricBox label="TIR" value={`${metrics.tir}%`} target="≥70%" />
        <MetricBox label="TAR" value={`${metrics.tar}%`} target="≤25%" />
        <MetricBox label="TBR" value={`${metrics.tbr}%`} target="<4%" />
        <MetricBox label="Mean±SD" value={`${metrics.mean}±${metrics.sd}`} unit="mg/dL" />
        <MetricBox label="CV" value={`${metrics.cv}%`} target="≤36%" />
      </div>
    </div>
  );
}

/**
 * 24-hour glucose curve SVG with adaptive Y-axis
 * Automatically adjusts range to focus on clinical data while preserving outliers
 * Range: Adaptive (min: 54-250 mg/dL clinical range, expands for outliers)
 * 288 bins (5-min intervals)
 */
function GlucoseCurve24h({ curve, events, sensorChanges, cartridgeChanges, agpCurve }) {
  const svgWidth = 1000;
  const svgHeight = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  /**
   * ADAPTIVE Y-AXIS ALGORITHM
   * 
   * Goal: Maximize visual space for clinically relevant glucose data (54-250 mg/dL range)
   * while maintaining readability and avoiding excessive whitespace.
   * 
   * The algorithm dynamically adjusts Y-axis bounds based on actual glucose distribution:
   * 
   * 1. Calculate percentiles (10th/90th) from valid glucose readings
   * 2. Add padding above/below for visual breathing room
   * 3. Clamp to clinical minimum (40 mg/dL floor) and maximum (400 mg/dL ceiling)
   * 4. Ensure critical thresholds (54, 70, 180, 250 mg/dL) are visible when relevant
   * 
   * Outliers (values outside calculated bounds) are:
   * - Tracked separately for display counts
   * - Shown as indicators at chart edges
   * - Not hidden, just compressed to maintain scale integrity
   * 
   * This approach typically uses 60-70% of available vertical space vs. 30% with fixed 40-400 range.
   */
  const { yMin, yMax, yTicks, outliers } = calculateAdaptiveYAxis(curve);
  
  // Extract scalar outlier boundary values for reference
  const outlierLowMin = outliers?.low;   // Minimum glucose among low outliers
  const outlierHighMax = outliers?.high;  // Maximum glucose among high outliers
  
  /**
   * OUTLIER ARRAY RECALCULATION
   * 
   * Why needed: calculateAdaptiveYAxis returns outlier *counts* as scalars,
   * but the component needs arrays for:
   * - .length checks (conditional rendering)
   * - Displaying individual outlier counts in UI
   * 
   * We recalculate arrays locally from curve data using yMin/yMax boundaries.
   */
  const validGlucose = curve.filter(d => d.hasData && d.glucose !== null).map(d => d.glucose);
  const outlierLow = validGlucose.filter(g => g < yMin);   // Below Y-axis range
  const outlierHigh = validGlucose.filter(g => g > yMax);  // Above Y-axis range

  // Create scale functions for coordinate mapping
  const yScale = createYScale(yMin, yMax, chartHeight);
  const xScale = createXScale(288, chartWidth); // 288 bins = 24 hours in 5-min intervals

  // Target zone (70-180 mg/dL) - only if both boundaries are in range
  const showTargetZone = yMin <= 70 && yMax >= 180;
  const targetLow = showTargetZone ? yScale(180) : 0;
  const targetHigh = showTargetZone ? yScale(70) : 0;
  const targetHeight = targetHigh - targetLow;

  // Generate path for glucose curve
  const curvePoints = curve
    .filter((d) => d.hasData && d.glucose !== null)
    .map((d) => `${xScale(d.bin)},${yScale(d.glucose)}`)
    .join(' L ');

  const curvePath = curvePoints ? `M ${curvePoints}` : '';

  return (
    <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
      {/* Target zone (brutalist grey band) - only if fully visible */}
      {showTargetZone && (
        <rect
          x={padding.left}
          y={padding.top + targetLow}
          width={chartWidth}
          height={targetHeight}
          fill="#E0E0E0"
          opacity={1}
        />
      )}

      {/* Grid lines - smart ticks with emphasis on clinical boundaries */}
      {yTicks.map((value) => (
        <line
          key={value}
          x1={padding.left}
          y1={padding.top + yScale(value)}
          x2={padding.left + chartWidth}
          y2={padding.top + yScale(value)}
          stroke={value === 70 || value === 180 ? "#999" : "#ddd"}
          strokeWidth={value === 70 || value === 180 ? 1.5 : 1}
          strokeDasharray={value === 70 || value === 180 ? "6,3" : "4,4"}
        />
      ))}

      {/* Y-axis labels - smart ticks */}
      {yTicks.map((value) => (
        <text
          key={value}
          x={padding.left - 10}
          y={padding.top + yScale(value) + 5}
          textAnchor="end"
          fontSize="12"
          fontFamily="Courier New, monospace"
          fill={value === 70 || value === 180 ? "#333" : "#666"}
          fontWeight={value === 70 || value === 180 ? "bold" : "normal"}
        >
          {Math.round(value)}
        </text>
      ))}

      {/* Outlier indicators - improved with min/max values */}
      {outlierLow.length > 0 && (
        <g>
          {/* Arrow pointing down */}
          <polygon
            points={`${padding.left + 20},${padding.top + chartHeight + 5} ${padding.left + 15},${padding.top + chartHeight + 12} ${padding.left + 25},${padding.top + chartHeight + 12}`}
            fill="#DC2626"
          />
          {/* Text label */}
          <text
            x={padding.left + 35}
            y={padding.top + chartHeight + 12}
            fontSize="11"
            fontFamily="Courier New, monospace"
            fill="#DC2626"
            fontWeight="bold"
          >
            {outlierLow.length} LOW (min: {Math.round(outlierLowMin)})
          </text>
        </g>
      )}
      {outlierHigh.length > 0 && (
        <g>
          {/* Arrow pointing up */}
          <polygon
            points={`${padding.left + 20},${padding.top - 5} ${padding.left + 15},${padding.top - 12} ${padding.left + 25},${padding.top - 12}`}
            fill="#DC2626"
          />
          {/* Text label */}
          <text
            x={padding.left + 35}
            y={padding.top - 5}
            fontSize="11"
            fontFamily="Courier New, monospace"
            fill="#DC2626"
            fontWeight="bold"
          >
            {outlierHigh.length} HIGH (max: {Math.round(outlierHighMax)})
          </text>
        </g>
      )}

      {/* X-axis labels (time) */}
      {[0, 6, 12, 18, 24].map((hour) => (
        <text
          key={hour}
          x={padding.left + xScale((hour * 60) / 5)}
          y={svgHeight - padding.bottom + 25}
          textAnchor="middle"
          fontSize="12"
          fontFamily="Courier New, monospace"
          fill="#666"
        >
          {String(hour).padStart(2, '0')}:00
        </text>
      ))}

      {/* Glucose curve */}
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {/* AGP median curve (dotted - reference from overall period) */}
        {agpCurve && agpCurve.length === 288 && (
          <path
            d={`M ${agpCurve.map((d, i) => `${xScale(i)},${yScale(d.p50)}`).join(' L ')}`}
            fill="none"
            stroke="#666"
            strokeWidth={2}
            strokeDasharray="8,4"
            opacity={0.6}
          />
        )}

        {/* Daily glucose curve (solid black) */}
        {curvePath && (
          <path d={curvePath} fill="none" stroke="var(--color-black)" strokeWidth={2} />
        )}

        {/* Event markers */}
        {events.hypoL2.events.map((event, i) => (
          <circle
            key={`hypoL2-${i}`}
            cx={xScale((event.minuteOfDay || 0) / 5)}
            cy={yScale(event.startGlucose || 50)}
            r={6}
            fill="#DC2626"
            stroke="var(--color-black)"
            strokeWidth={2}
          />
        ))}

        {events.hypoL1.events.map((event, i) => (
          <circle
            key={`hypoL1-${i}`}
            cx={xScale((event.minuteOfDay || 0) / 5)}
            cy={yScale(event.startGlucose || 65)}
            r={6}
            fill="#F59E0B"
            stroke="var(--color-black)"
            strokeWidth={2}
          />
        ))}

        {events.hyper.events.map((event, i) => (
          <circle
            key={`hyper-${i}`}
            cx={xScale((event.minuteOfDay || 0) / 5)}
            cy={yScale(event.startGlucose || 260)}
            r={6}
            fill="#EF4444"
            stroke="var(--color-black)"
            strokeWidth={2}
          />
        ))}

        {/* Sensor change marker - ONE red dashed line when sensor stops */}
        {sensorChanges && sensorChanges.filter(c => c.type === 'start').map((change, i) => (
          <g key={`sensor-start-${i}`}>
            <line
              x1={xScale(change.minuteOfDay / 5)}
              y1={0}
              x2={xScale(change.minuteOfDay / 5)}
              y2={chartHeight}
              stroke="var(--color-red)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <text
              x={xScale(change.minuteOfDay / 5) + 5}
              y={15}
              fontSize="10"
              fontFamily="Courier New, monospace"
              fill="var(--color-red)"
              fontWeight="bold"
            >
              SENSOR VERVANGEN
            </text>
          </g>
        ))}
        
        {/* Cartridge change markers */}
        {cartridgeChanges?.map((change, i) => (
          <line
            key={`cartridge-${i}`}
            x1={xScale(change.minuteOfDay / 5)}
            y1={0}
            x2={xScale(change.minuteOfDay / 5)}
            y2={chartHeight}
            stroke="#FF8C00"
            strokeWidth={2}
            strokeDasharray="2,2"
          />
        ))}
      </g>

      {/* Legend */}
      <g transform={`translate(${padding.left + chartWidth - 180}, ${padding.top + 10})`}>
        <circle cx={0} cy={0} r={4} fill="#DC2626" stroke="var(--color-black)" strokeWidth={1} />
        <text x={10} y={4} fontSize="10" fontFamily="Courier New, monospace" fill="var(--color-black)">
          HYPO L2
        </text>

        <circle cx={0} cy={15} r={4} fill="#F59E0B" stroke="var(--color-black)" strokeWidth={1} />
        <text x={10} y={19} fontSize="10" fontFamily="Courier New, monospace" fill="var(--color-black)">
          HYPO L1
        </text>

        <circle cx={0} cy={30} r={4} fill="#EF4444" stroke="var(--color-black)" strokeWidth={1} />
        <text x={10} y={34} fontSize="10" fontFamily="Courier New, monospace" fill="var(--color-black)">
          HYPER
        </text>

        <line x1={0} y1={45} x2={20} y2={45} stroke="var(--color-red)" strokeWidth={2} strokeDasharray="4,4" />
        <text x={25} y={49} fontSize="10" fontFamily="Courier New, monospace" fill="var(--color-black)">
          SENSOR
        </text>

        <line x1={0} y1={60} x2={20} y2={60} stroke="#FF8C00" strokeWidth={2} strokeDasharray="2,2" />
        <text x={25} y={64} fontSize="10" fontFamily="Courier New, monospace" fill="var(--color-black)">
          CARTRIDGE
        </text>
      </g>
    </svg>
  );
}

/**
 * Vertical TIR bar (like Medtronic PDF)
 */
function TIRBar({ metrics }) {
  const tir = parseFloat(metrics.tir);
  const tar = parseFloat(metrics.tar);
  const tbr = parseFloat(metrics.tbr);

  const barHeight = 200;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          marginBottom: '8px',
          textAlign: 'center'
        }}
      >
        TIME IN RANGE
      </div>

      {/* Vertical bar with percentages inside */}
      <div
        style={{
          width: '60px',
          height: `${barHeight}px`,
          border: '3px solid var(--color-black)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: 'var(--color-white)'
        }}
      >
        {/* TAR (top, red) */}
        <div
          style={{
            height: `${(tar / 100) * barHeight}px`,
            backgroundColor: 'var(--color-tar)',
            borderBottom: tar > 0 ? '2px solid var(--color-black)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'var(--color-black)'
          }}
        >
          {tar > 5 ? `${metrics.tar}%` : ''}
        </div>

        {/* TIR (middle, green) */}
        <div
          style={{
            height: `${(tir / 100) * barHeight}px`,
            backgroundColor: 'var(--color-tir)',
            borderBottom: tir > 0 ? '2px solid var(--color-black)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'var(--color-black)'
          }}
        >
          {tir > 5 ? `${metrics.tir}%` : ''}
        </div>

        {/* TBR (bottom, yellow) */}
        <div
          style={{
            height: `${(tbr / 100) * barHeight}px`,
            backgroundColor: 'var(--color-tbr)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'var(--color-black)'
          }}
        >
          {tbr > 5 ? `${metrics.tbr}%` : ''}
        </div>
      </div>

      {/* Labels below (keep for context) */}
      <div style={{ textAlign: 'center', fontFamily: 'Courier New, monospace', fontSize: '9px', color: '#666' }}>
        <div>TAR • TIR • TBR</div>
      </div>
    </div>
  );
}

/**
 * Single metric box
 */
function MetricBox({ label, value, unit, target }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      <div
        style={{
          fontFamily: 'Courier New, monospace',
          fontSize: '10px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          color: '#666',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Courier New, monospace',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'var(--color-black)'
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: '12px', color: '#666', marginLeft: '4px' }}>{unit}</span>
        )}
      </div>
      {target && (
        <div
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '9px',
            color: '#999'
          }}
        >
          Target: {target}
        </div>
      )}
    </div>
  );
}
