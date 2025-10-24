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

export default function DayProfileCard({ profile }) {
  if (!profile) return null;

  const { date, dayOfWeek, metrics, curve, events, sensorChanges, badges, readingCount } = profile;

  return (
    <div
      className="day-profile-card"
      style={{
        border: '3px solid #000',
        backgroundColor: '#fff',
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
          borderBottom: '3px solid #000',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#000',
          color: '#fff'
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
                border: '2px solid #fff',
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
          borderRight: '3px solid #000'
        }}
      >
        <GlucoseCurve24h 
          curve={curve} 
          events={events} 
          sensorChanges={sensorChanges}
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
          borderTop: '3px solid #000',
          padding: '16px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          backgroundColor: '#f5f5f5'
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
function GlucoseCurve24h({ curve, events, sensorChanges, agpCurve }) {
  const svgWidth = 1000;
  const svgHeight = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Calculate adaptive Y-axis range
  const validGlucose = curve
    .filter((d) => d.hasData && d.glucose !== null)
    .map((d) => d.glucose);
  
  const dataMin = validGlucose.length > 0 ? Math.min(...validGlucose) : 70;
  const dataMax = validGlucose.length > 0 ? Math.max(...validGlucose) : 180;

  // Adaptive range: start with clinical range (54-250), expand if needed
  const yMin = Math.max(40, Math.min(54, dataMin - 20));
  const yMax = Math.min(400, Math.max(250, dataMax + 20));

  // Detect outliers beyond display range
  const outlierLow = validGlucose.filter(g => g < yMin);
  const outlierHigh = validGlucose.filter(g => g > yMax);

  const yScale = (glucose) => {
    // Clamp glucose to display range
    const clampedGlucose = Math.max(yMin, Math.min(yMax, glucose));
    return chartHeight - ((clampedGlucose - yMin) / (yMax - yMin)) * chartHeight;
  };

  // X-axis scale (288 bins = 24 hours)
  const xScale = (bin) => (bin / 288) * chartWidth;

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

      {/* Grid lines - only show clinical thresholds that are within range */}
      {[70, 180, 250].filter(v => v >= yMin && v <= yMax).map((value) => (
        <line
          key={value}
          x1={padding.left}
          y1={padding.top + yScale(value)}
          x2={padding.left + chartWidth}
          y2={padding.top + yScale(value)}
          stroke="#ccc"
          strokeWidth={1}
          strokeDasharray="4"
        />
      ))}

      {/* Y-axis labels - adaptive based on range */}
      <text
        x={padding.left - 10}
        y={padding.top + yScale(yMax) + 5}
        textAnchor="end"
        fontSize="12"
        fontFamily="Courier New, monospace"
        fill="#666"
      >
        {Math.round(yMax)}
      </text>
      {yMax > 180 && (
        <text
          x={padding.left - 10}
          y={padding.top + yScale(180) + 5}
          textAnchor="end"
          fontSize="12"
          fontFamily="Courier New, monospace"
          fill="#666"
        >
          180
        </text>
      )}
      <text
        x={padding.left - 10}
        y={padding.top + yScale(70) + 5}
        textAnchor="end"
        fontSize="12"
        fontFamily="Courier New, monospace"
        fill="#666"
      >
        70
      </text>
      <text
        x={padding.left - 10}
        y={padding.top + yScale(yMin) + 5}
        textAnchor="end"
        fontSize="12"
        fontFamily="Courier New, monospace"
        fill="#666"
      >
        {Math.round(yMin)}
      </text>

      {/* Outlier indicators */}
      {outlierLow.length > 0 && (
        <g>
          <polygon
            points={`${padding.left + chartWidth/2 - 8},${padding.top + chartHeight + 5} ${padding.left + chartWidth/2},${padding.top + chartHeight + 12} ${padding.left + chartWidth/2 + 8},${padding.top + chartHeight + 5}`}
            fill="#DC2626"
          />
          <text
            x={padding.left + chartWidth/2 + 15}
            y={padding.top + chartHeight + 12}
            fontSize="11"
            fontFamily="Courier New, monospace"
            fill="#DC2626"
            fontWeight="bold"
          >
            {outlierLow.length} LOW
          </text>
        </g>
      )}
      {outlierHigh.length > 0 && (
        <g>
          <polygon
            points={`${padding.left + chartWidth/2 - 8},${padding.top - 5} ${padding.left + chartWidth/2},${padding.top - 12} ${padding.left + chartWidth/2 + 8},${padding.top - 5}`}
            fill="#DC2626"
          />
          <text
            x={padding.left + chartWidth/2 + 15}
            y={padding.top - 5}
            fontSize="11"
            fontFamily="Courier New, monospace"
            fill="#DC2626"
            fontWeight="bold"
          >
            {outlierHigh.length} HIGH
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
          <path d={curvePath} fill="none" stroke="#000" strokeWidth={2} />
        )}

        {/* Event markers */}
        {events.hypoL2.events.map((event, i) => (
          <circle
            key={`hypoL2-${i}`}
            cx={xScale((event.minuteOfDay || 0) / 5)}
            cy={yScale(event.startGlucose || 50)}
            r={6}
            fill="#DC2626"
            stroke="#000"
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
            stroke="#000"
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
            stroke="#000"
            strokeWidth={2}
          />
        ))}

        {/* Sensor change markers */}
        {sensorChanges.map((change, i) => (
          <line
            key={`sensor-${i}`}
            x1={xScale(change.minuteOfDay / 5)}
            y1={0}
            x2={xScale(change.minuteOfDay / 5)}
            y2={chartHeight}
            stroke="#999"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        ))}
      </g>

      {/* Legend */}
      <g transform={`translate(${padding.left + chartWidth - 150}, ${padding.top + 10})`}>
        <circle cx={0} cy={0} r={4} fill="#DC2626" stroke="#000" strokeWidth={1} />
        <text x={10} y={4} fontSize="10" fontFamily="Courier New, monospace" fill="#000">
          HYPO L2
        </text>

        <circle cx={0} cy={15} r={4} fill="#F59E0B" stroke="#000" strokeWidth={1} />
        <text x={10} y={19} fontSize="10" fontFamily="Courier New, monospace" fill="#000">
          HYPO L1
        </text>

        <circle cx={0} cy={30} r={4} fill="#EF4444" stroke="#000" strokeWidth={1} />
        <text x={10} y={34} fontSize="10" fontFamily="Courier New, monospace" fill="#000">
          HYPER
        </text>

        <line x1={0} y1={45} x2={20} y2={45} stroke="#999" strokeWidth={2} strokeDasharray="5,5" />
        <text x={25} y={49} fontSize="10" fontFamily="Courier New, monospace" fill="#000">
          SENSOR
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
          border: '3px solid #000',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: '#fff'
        }}
      >
        {/* TAR (top, red) */}
        <div
          style={{
            height: `${(tar / 100) * barHeight}px`,
            backgroundColor: '#EF4444',
            borderBottom: tar > 0 ? '2px solid #000' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#000'
          }}
        >
          {tar > 5 ? `${metrics.tar}%` : ''}
        </div>

        {/* TIR (middle, green) */}
        <div
          style={{
            height: `${(tir / 100) * barHeight}px`,
            backgroundColor: '#22C55E',
            borderBottom: tir > 0 ? '2px solid #000' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#000'
          }}
        >
          {tir > 5 ? `${metrics.tir}%` : ''}
        </div>

        {/* TBR (bottom, yellow) */}
        <div
          style={{
            height: `${(tbr / 100) * barHeight}px`,
            backgroundColor: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Courier New, monospace',
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#000'
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
          color: '#000'
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
