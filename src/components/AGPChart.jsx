import React, { useMemo } from 'react';
import { CONFIG } from '../core/metrics-engine.js';
import TIRBar from './TIRBar.jsx';
import HypoglycemiaEvents from './HypoglycemiaEvents.jsx';

/**
 * AGPChart - Ambulatory Glucose Profile SVG Visualization
 * 
 * Renders AGP curve with percentile bands (5th, 25th, 50th, 75th, 95th),
 * target lines, event markers, and optional comparison overlay.
 * 
 * @param {Array} props.agpData - Array[288] of AGP bins with percentiles
 * @param {Object} props.events - { hypoL1: [], hypoL2: [], hyper: [] } with minuteOfDay
 * @param {Object} props.comparison - Optional comparison AGP data
 * @param {number} props.width - SVG width (default: 900)
 * @param {number} props.height - SVG height (default: 400)
 * 
 * AGP Data Structure:
 * agpData[i] = {
 *   p5: number,   // 5th percentile
 *   p25: number,  // 25th percentile
 *   p50: number,  // 50th percentile (median) - PRIMARY CURVE
 *   p75: number,  // 75th percentile
 *   p95: number   // 95th percentile
 * }
 * 
 * @version 2.2.0 - Simplified to median-only (removed mean curve)
 */
export default function AGPChart({ 
  agpData, 
  events = { hypoL1: [], hypoL2: [], hyper: [] },
  comparison = null,
  metrics = null,
  width = 900, 
  height = 400 
}) {
  if (!agpData || agpData.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">No AGP data available</p>
      </div>
    );
  }

  // Calculate chart dimensions
  const margin = { top: 20, right: 60, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Scale functions
  const xScale = (minuteOfDay) => margin.left + (minuteOfDay / 1440) * chartWidth;
  const yScale = (glucose) => margin.top + chartHeight - ((glucose / CONFIG.GLUCOSE.MAX) * chartHeight);

  // Generate SVG paths using memo for performance
  const paths = useMemo(() => generatePaths(agpData, xScale, yScale), [agpData]);
  const comparisonPath = useMemo(() => 
    comparison ? generatePath(comparison, 'p50', xScale, yScale) : null,
    [comparison, xScale, yScale]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">
          Ambulatory Glucose Profile (AGP)
        </h3>
        <div className="text-sm text-gray-400">
          24-hour glucose pattern
        </div>
      </div>

      {/* TIR Bar - only if metrics provided */}
      {metrics && <TIRBar metrics={metrics} />}

      {/* SVG Chart with Legend Overlay */}
      <div className="card bg-white border-gray-300 overflow-hidden" style={{ position: 'relative' }}>
        {/* Legend positioned absolute in top-right */}
        <ChartLegend hasComparison={!!comparison} />
        
        <svg width={width} height={height} className="w-full h-auto">
          {/* White background */}
          <rect x="0" y="0" width={width} height={height} fill="white" />
          
          {/* Grid lines */}
          <GridLines 
            margin={margin}
            chartWidth={chartWidth}
            chartHeight={chartHeight}
            yScale={yScale}
          />

          {/* Night end marker - vertical dashed line at 06:00 */}
          <line
            x1={xScale(6 * 60)}
            y1={margin.top}
            x2={xScale(6 * 60)}
            y2={margin.top + chartHeight}
            stroke="#666"
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity="0.6"
          />

          {/* Target lines */}
          <TargetLines 
            margin={margin}
            chartWidth={chartWidth}
            yScale={yScale}
          />

          {/* Percentile bands (shaded areas) */}
          {/* 5-95th percentile band - light blue with 30% opacity */}
          <path
            d={paths.band_5_95}
            fill="#93c5fd"
            opacity="0.5"
          />
          
          {/* 25-75th percentile band - darker blue with 50% opacity */}
          <path
            d={paths.band_25_75}
            fill="#3b82f6"
            opacity="0.5"
          />

          {/* Median line (p50) - black SOLID */}
          <path
            d={paths.median}
            fill="none"
            stroke="#000000"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Comparison overlay (if present) - gray dashed thicker */}
          {comparisonPath && (
            <path
              d={comparisonPath}
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2.5"
              strokeDasharray="6,4"
              opacity="0.9"
            />
          )}

          {/* Event markers */}
          <EventMarkers 
            events={events}
            xScale={xScale}
            yScale={yScale}
            chartHeight={chartHeight}
            margin={margin}
          />

          {/* Axes */}
          <XAxis 
            margin={margin}
            chartWidth={chartWidth}
            chartHeight={chartHeight}
          />
          <YAxis 
            margin={margin}
            chartHeight={chartHeight}
            yScale={yScale}
          />
        </svg>
      </div>

      {/* Hypoglycemia Events Warning Panel */}
      <HypoglycemiaEvents 
        events={events} 
        tbrPercent={metrics?.tbr}
        gri={metrics?.gri}
      />
    </div>
  );
}

/**
 * Generate all AGP paths (memoized for performance)
 */
function generatePaths(agpData, xScale, yScale) {
  return {
    median: generatePath(agpData, 'p50', xScale, yScale),
    band_5_95: generateBand(agpData, 'p95', 'p5', xScale, yScale),
    band_25_75: generateBand(agpData, 'p75', 'p25', xScale, yScale),
  };
}

/**
 * Generate SVG path for a percentile line
 */
function generatePath(agpData, percentile, xScale, yScale) {
  return agpData.map((d, i) => {
    const minuteOfDay = (i / CONFIG.AGP_BINS) * 1440;
    const x = xScale(minuteOfDay);
    const y = yScale(d[percentile]);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
}

/**
 * Generate SVG path for filled band between two percentiles
 */
function generateBand(agpData, topPercentile, bottomPercentile, xScale, yScale) {
  // Top path (left to right)
  const topPath = agpData.map((d, i) => {
    const minuteOfDay = (i / CONFIG.AGP_BINS) * 1440;
    const x = xScale(minuteOfDay);
    const y = yScale(d[topPercentile]);
    return `${x},${y}`;
  }).join(' L ');
  
  // Bottom path (right to left)
  const bottomPath = agpData.slice().reverse().map((d, i) => {
    const reverseIdx = CONFIG.AGP_BINS - 1 - i;
    const minuteOfDay = (reverseIdx / CONFIG.AGP_BINS) * 1440;
    const x = xScale(minuteOfDay);
    const y = yScale(d[bottomPercentile]);
    return `${x},${y}`;
  }).join(' L ');
  
  return `M ${topPath} L ${bottomPath} Z`;
}

/**
 * GridLines - Horizontal grid (BRUTALIST: black 1px)
 */
function GridLines({ margin, chartWidth, chartHeight, yScale }) {
  const gridValues = [0, 54, 70, 100, 140, 180, 250, 300, 400];
  
  return (
    <g className="grid">
      {gridValues.map((value) => (
        <line
          key={value}
          x1={margin.left}
          y1={yScale(value)}
          x2={margin.left + chartWidth}
          y2={yScale(value)}
          stroke="#000000"
          strokeWidth="1"
          opacity="0.2"
        />
      ))}
    </g>
  );
}

/**
 * TargetLines - Clinical targets (BRUTALIST: massive lines, red/yellow)
 */
function TargetLines({ margin, chartWidth, yScale }) {
  const targets = [
    { value: 54, color: '#c70000', width: 2, dash: '8,4' },    // Critical Low - Soviet red
    { value: 70, color: '#000000', width: 3, dash: 'none' },   // Low - Black
    { value: 180, color: '#000000', width: 3, dash: 'none' },  // High - Black
    { value: 250, color: '#c70000', width: 2, dash: '8,4' },   // Very High - Soviet red
  ];

  return (
    <g className="target-lines">
      {targets.map((target) => (
        <line
          key={target.value}
          x1={margin.left}
          y1={yScale(target.value)}
          x2={margin.left + chartWidth}
          y2={yScale(target.value)}
          stroke={target.color}
          strokeWidth={target.width}
          strokeDasharray={target.dash}
        />
      ))}
    </g>
  );
}

/**
 * EventMarkers - BRUTALIST event indicators (Soviet red/yellow)
 */
function EventMarkers({ events, xScale, yScale, chartHeight, margin }) {
  if (!events) return null;
  
  const hypoL2 = Array.isArray(events.hypoL2?.events) ? events.hypoL2.events : (Array.isArray(events.hypoL2) ? events.hypoL2 : []);
  const hypoL1 = Array.isArray(events.hypoL1?.events) ? events.hypoL1.events : (Array.isArray(events.hypoL1) ? events.hypoL1 : []);
  const hyper = Array.isArray(events.hyper?.events) ? events.hyper.events : (Array.isArray(events.hyper) ? events.hyper : []);
  
  return (
    <g className="event-markers">
      {/* Hypo L2 (critical <54) - Soviet Red X */}
      {hypoL2.map((event, i) => {
        const cx = xScale(event.minuteOfDay);
        const cy = yScale(event.startGlucose || 50);
        return (
          <g key={`hypoL2-${i}`}>
            <circle cx={cx} cy={cy} r="6" fill="#c70000" />
            <line x1={cx - 3} y1={cy - 3} x2={cx + 3} y2={cy + 3} stroke="#ffffff" strokeWidth="2" />
            <line x1={cx + 3} y1={cy - 3} x2={cx - 3} y2={cy + 3} stroke="#ffffff" strokeWidth="2" />
          </g>
        );
      })}

      {/* Hypo L1 (54-69) - Yellow Circle */}
      {hypoL1.map((event, i) => {
        const cx = xScale(event.minuteOfDay);
        const cy = yScale(event.startGlucose || 62);
        return (
          <circle
            key={`hypoL1-${i}`}
            cx={cx}
            cy={cy}
            r="5"
            fill="#f4e300"
            stroke="#000000"
            strokeWidth="1"
          />
        );
      })}

      {/* Hyperglycemia (>250) - Soviet Red Triangle */}
      {hyper.map((event, i) => {
        const cx = xScale(event.minuteOfDay);
        const cy = yScale(event.startGlucose || 280);
        const size = 7;
        return (
          <polygon
            key={`hyper-${i}`}
            points={`${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}`}
            fill="#c70000"
            stroke="#000000"
            strokeWidth="1"
          />
        );
      })}
    </g>
  );
}

/**
 * XAxis - Time axis (00:00 - 24:00)
 */
function XAxis({ margin, chartWidth, chartHeight }) {
  const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24];
  const xPosition = (hour) => margin.left + (hour / 24) * chartWidth;

  return (
    <g className="x-axis">
      {/* Axis line */}
      <line
        x1={margin.left}
        y1={margin.top + chartHeight}
        x2={margin.left + chartWidth}
        y2={margin.top + chartHeight}
        stroke="#6b7280"
        strokeWidth="1.5"
      />

      {/* Hour labels */}
      {hours.map((hour) => (
        <g key={hour}>
          <line
            x1={xPosition(hour)}
            y1={margin.top + chartHeight}
            x2={xPosition(hour)}
            y2={margin.top + chartHeight + 5}
            stroke="#6b7280"
            strokeWidth="1.5"
          />
          <text
            x={xPosition(hour)}
            y={margin.top + chartHeight + 20}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="12"
          >
            {String(hour).padStart(2, '0')}:00
          </text>
        </g>
      ))}

      {/* Axis label */}
      <text
        x={margin.left + chartWidth / 2}
        y={margin.top + chartHeight + 35}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="13"
        fontWeight="500"
      >
        Time of Day
      </text>
    </g>
  );
}

/**
 * YAxis - Glucose axis (mg/dL)
 */
function YAxis({ margin, chartHeight, yScale }) {
  const values = [0, 70, 140, 180, 250, 400];

  return (
    <g className="y-axis">
      {/* Axis line */}
      <line
        x1={margin.left}
        y1={margin.top}
        x2={margin.left}
        y2={margin.top + chartHeight}
        stroke="#6b7280"
        strokeWidth="1.5"
      />

      {/* Value labels */}
      {values.map((value) => (
        <g key={value}>
          <line
            x1={margin.left - 5}
            y1={yScale(value)}
            x2={margin.left}
            y2={yScale(value)}
            stroke="#6b7280"
            strokeWidth="1.5"
          />
          <text
            x={margin.left - 10}
            y={yScale(value)}
            textAnchor="end"
            alignmentBaseline="middle"
            fill="#9ca3af"
            fontSize="12"
          >
            {value}
          </text>
        </g>
      ))}

      {/* Axis label */}
      <text
        x={margin.left - 45}
        y={margin.top + chartHeight / 2}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="13"
        fontWeight="500"
        transform={`rotate(-90, ${margin.left - 45}, ${margin.top + chartHeight / 2})`}
      >
        Glucose (mg/dL)
      </text>
    </g>
  );
}

/**
 * ChartLegend - Explanation of AGP elements (positioned overlay style)
 */
function ChartLegend({ hasComparison }) {
  return (
    <div 
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        padding: '12px',
        fontSize: '12px',
        lineHeight: '1.8',
        fontFamily: 'monospace',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10
      }}
    >
      <LegendItem color="#000000" label="Mediaan" thickness={2.5} />
      <LegendItem color="#3b82f6" label="25-75%" isShaded opacity={0.5} />
      <LegendItem color="#93c5fd" label="5-95%" isShaded opacity={0.5} />
      {hasComparison && <LegendItem color="#9ca3af" label="Vorige periode" thickness={2.5} isDashed />}
      <LegendItem color="#dc2626" label="L2 Hypo (<54)" isCircle markerType="x" />
      <LegendItem color="#f97316" label="L1 Hypo (54-69)" isCircle />
      <LegendItem color="#dc2626" label="Hyper (>250)" isTriangle />
    </div>
  );
}

/**
 * LegendItem - Individual legend entry with visual sample
 */
function LegendItem({ color, label, isDashed, isCircle, isTriangle, markerType, thickness, isShaded, opacity }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
      {isCircle ? (
        // Circle marker for hypo events
        <div style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {markerType === 'x' && (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="2" y1="2" x2="8" y2="8" stroke="white" strokeWidth="1.5" />
              <line x1="8" y1="2" x2="2" y2="8" stroke="white" strokeWidth="1.5" />
            </svg>
          )}
        </div>
      ) : isTriangle ? (
        // Triangle marker for hyper events
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
          <polygon points="7,3 3,11 11,11" fill={color} stroke="white" strokeWidth="1" />
        </svg>
      ) : isShaded ? (
        // Shaded rectangle for percentile bands
        <div style={{
          width: '30px',
          height: '12px',
          backgroundColor: color,
          opacity: opacity || 0.5,
          flexShrink: 0
        }} />
      ) : (
        // Line for median/mean
        <div style={{
          width: '30px',
          height: `${thickness}px`,
          backgroundColor: isDashed ? 'transparent' : color,
          backgroundImage: isDashed 
            ? `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 7px)`
            : 'none',
          flexShrink: 0
        }} />
      )}
      <span style={{ color: '#374151', fontSize: '12px', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}
