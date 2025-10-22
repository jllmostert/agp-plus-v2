import React, { useMemo } from 'react';
import { CONFIG } from '../core/metrics-engine.js';

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
 *   p50: number,  // 50th percentile (median)
 *   p75: number,  // 75th percentile
 *   p95: number,  // 95th percentile
 *   mean: number  // Mean glucose
 * }
 * 
 * @version 2.1.0
 */
export default function AGPChart({ 
  agpData, 
  events = { hypoL1: [], hypoL2: [], hyper: [] },
  comparison = null,
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
    comparison ? generatePath(comparison.agpData, 'p50', xScale, yScale) : null,
    [comparison]
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

      {/* SVG Chart */}
      <div className="card bg-gray-900 border-gray-700 overflow-hidden">
        <svg width={width} height={height} className="w-full h-auto">
          {/* Grid lines */}
          <GridLines 
            margin={margin}
            chartWidth={chartWidth}
            chartHeight={chartHeight}
            yScale={yScale}
          />

          {/* Target lines */}
          <TargetLines 
            margin={margin}
            chartWidth={chartWidth}
            yScale={yScale}
          />

          {/* AGP Bands */}
          <g opacity="0.3">
            {/* 5th-95th percentile band (light blue) */}
            <path
              d={paths.band_5_95}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="none"
            />
            
            {/* 25th-75th percentile band (darker blue) */}
            <path
              d={paths.band_25_75}
              fill="rgba(59, 130, 246, 0.3)"
              stroke="none"
            />
          </g>

          {/* Median line (p50) */}
          <path
            d={paths.median}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Comparison overlay (if present) */}
          {comparisonPath && (
            <path
              d={comparisonPath}
              fill="none"
              stroke="#6b7280"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.6"
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

      {/* Legend */}
      <ChartLegend hasComparison={!!comparison} />
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
 * GridLines - Horizontal background grid
 */
function GridLines({ margin, chartWidth, chartHeight, yScale }) {
  const gridValues = [0, 54, 70, 100, 140, 180, 250, 300, 400];
  
  return (
    <g className="grid" opacity="0.1">
      {gridValues.map((value) => (
        <line
          key={value}
          x1={margin.left}
          y1={yScale(value)}
          x2={margin.left + chartWidth}
          y2={yScale(value)}
          stroke="#fff"
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

/**
 * TargetLines - Clinical target reference lines
 */
function TargetLines({ margin, chartWidth, yScale }) {
  const targets = [
    { value: 54, color: '#dc2626', label: 'Critical Low', dash: '5,5' },
    { value: 70, color: '#fbbf24', label: 'Low', dash: 'none' },
    { value: 180, color: '#fbbf24', label: 'High', dash: 'none' },
    { value: 250, color: '#dc2626', label: 'Very High', dash: '5,5' },
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
          strokeWidth="1.5"
          strokeDasharray={target.dash}
          opacity="0.6"
        />
      ))}
    </g>
  );
}

/**
 * EventMarkers - Visual indicators for hypo/hyper events
 */
function EventMarkers({ events, xScale, yScale, chartHeight, margin }) {
  const markerHeight = 8;
  
  return (
    <g className="event-markers">
      {/* Hypo L2 (critical) - Red markers at bottom */}
      {events.hypoL2?.map((event, i) => (
        <circle
          key={`hypoL2-${i}`}
          cx={xScale(event.minuteOfDay)}
          cy={margin.top + chartHeight + 15}
          r={3}
          fill="#dc2626"
        />
      ))}

      {/* Hypo L1 (warning) - Orange markers at bottom */}
      {events.hypoL1?.map((event, i) => (
        <circle
          key={`hypoL1-${i}`}
          cx={xScale(event.minuteOfDay)}
          cy={margin.top + chartHeight + 10}
          r={2.5}
          fill="#f59e0b"
        />
      ))}

      {/* Hyperglycemia - Red markers at top */}
      {events.hyper?.map((event, i) => (
        <circle
          key={`hyper-${i}`}
          cx={xScale(event.minuteOfDay)}
          cy={margin.top - 10}
          r={2.5}
          fill="#dc2626"
        />
      ))}
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
 * ChartLegend - Explanation of AGP elements
 */
function ChartLegend({ hasComparison }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-400">
      <LegendItem color="bg-blue-500" label="Median (50th percentile)" />
      <LegendItem color="bg-blue-500/30" label="25th-75th percentile" />
      <LegendItem color="bg-blue-500/20" label="5th-95th percentile" />
      {hasComparison && <LegendItem color="bg-gray-500" label="Comparison (dashed)" isDashed />}
      <LegendItem color="bg-red-600" label="Hypo/Hyper events" isCircle />
    </div>
  );
}

/**
 * LegendItem - Individual legend entry
 */
function LegendItem({ color, label, isDashed, isCircle }) {
  return (
    <div className="flex items-center gap-2">
      {isCircle ? (
        <div className={`w-3 h-3 rounded-full ${color}`} />
      ) : (
        <div className={`w-8 h-3 ${color} ${isDashed ? 'opacity-60' : ''}`} 
             style={isDashed ? { backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 3px, transparent 3px, transparent 6px)' } : {}}
        />
      )}
      <span>{label}</span>
    </div>
  );
}
