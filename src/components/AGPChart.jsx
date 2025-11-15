import React, { useMemo, useState, useEffect } from 'react';
import { CONFIG } from '../core/metrics-engine.js';

/**
 * Calculate dynamic Y-axis range for AGP chart
 * 
 * Same logic as visualization-utils.js but adapted for AGP percentile data.
 * Finds the highest value across ALL percentiles (p5-p95) to determine range.
 * 
 * @param {Array} agpData - Array[288] of AGP bins with percentiles
 * @returns {Object} { yMin: 0, yMax: 250-400, yTicks: [...] }
 */
function calculateAGPYAxis(agpData) {
  // Extract all percentile values from all bins
  const allValues = agpData.flatMap(bin => [
    bin.p5, bin.p25, bin.p50, bin.p75, bin.p95
  ].filter(v => v != null && !isNaN(v)));
  
  // Fallback to 0-250 if no data
  if (allValues.length === 0) {
    return {
      yMin: 0,
      yMax: 250,
      yTicks: [0, 50, 70, 100, 150, 180, 200, 250]
    };
  }
  
  // Find highest value across all percentiles
  const dataMax = Math.max(...allValues);
  
  // Dynamic Y-axis calculation (same as DayProfileCard):
  // - Always start at 0
  // - Minimum ceiling of 250, maximum ceiling of 400
  // - Round up to nearest 10
  const yMin = 0;
  const yMax = Math.max(250, Math.min(400, Math.ceil(dataMax / 10) * 10));
  
  // Generate smart ticks (always include 0, 70, 180 if in range)
  const yTicks = calculateYTicks(yMin, yMax);
  
  return { yMin, yMax, yTicks };
}

/**
 * Calculate smart Y-axis tick values
 * Same logic as visualization-utils.js
 */
function calculateYTicks(yMin, yMax) {
  const ticks = [0]; // Always start with 0
  
  // Add ticks in steps of 50 up to yMax
  for (let tick = 50; tick <= yMax; tick += 50) {
    ticks.push(tick);
  }
  
  // Ensure clinical boundaries are included if in range
  const CRITICAL_TICKS = [70, 180];
  const MIN_SPACING = 15; // Minimum 15 mg/dL between ticks
  
  for (const critical of CRITICAL_TICKS) {
    if (yMin <= critical && yMax >= critical) {
      // Check if any existing tick is too close
      const hasConflict = ticks.some(t => 
        t !== critical && Math.abs(t - critical) < MIN_SPACING
      );
      
      if (!hasConflict && !ticks.includes(critical)) {
        ticks.push(critical);
      }
    }
  }
  
  return ticks.sort((a, b) => a - b);
}

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
  width = 1200,  // Increased from 900 - "fancy chart" should dominate
  height = 500   // Increased from 400 - better vertical space
}) {
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // ESC key to close fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);
  
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

  // ✨ NEW v3.8.0: Calculate dynamic Y-axis range (0 to 250-400 based on data)
  const { yMin, yMax, yTicks } = useMemo(() => calculateAGPYAxis(agpData), [agpData]);

  // Scale functions with DYNAMIC Y-axis
  const xScale = (minuteOfDay) => margin.left + (minuteOfDay / 1440) * chartWidth;
  const yScale = (glucose) => {
    // Clamp glucose to display range
    const clampedGlucose = Math.max(yMin, Math.min(yMax, glucose));
    // Map to SVG coordinates (inverted: high glucose = low Y)
    return margin.top + chartHeight - ((clampedGlucose - yMin) / (yMax - yMin)) * chartHeight;
  };

  // Generate SVG paths using memo for performance
  const paths = useMemo(() => generatePaths(agpData, xScale, yScale), [agpData]);
  const comparisonPath = useMemo(() => 
    comparison ? generatePath(comparison, 'p50', xScale, yScale) : null,
    [comparison, xScale, yScale]
  );

  // Generate accessible summary for screen readers
  const accessibleSummary = useMemo(() => {
    if (!agpData || agpData.length === 0) return '';
    
    // Calculate median values for key time points
    const midnight = agpData[0];
    const morning = agpData[72]; // 06:00 (72 * 5min = 360min)
    const noon = agpData[144];    // 12:00
    const evening = agpData[216]; // 18:00
    
    // Calculate overall glucose statistics
    const allMedians = agpData.map(d => d.p50).filter(v => v != null);
    const overallMedian = allMedians.length > 0 
      ? (allMedians.reduce((a, b) => a + b, 0) / allMedians.length).toFixed(0)
      : 'N/A';
    
    return `Ambulatory Glucose Profile: Interactive chart showing 24-hour glucose patterns aggregated from multiple days. 
      Overall median glucose: ${overallMedian} mg per deciliter. 
      Key time points - Midnight: ${Number(midnight?.p50)?.toFixed(0) || 'N/A'}, 
      6 AM: ${Number(morning?.p50)?.toFixed(0) || 'N/A'}, 
      Noon: ${Number(noon?.p50)?.toFixed(0) || 'N/A'}, 
      6 PM: ${Number(evening?.p50)?.toFixed(0) || 'N/A'} mg per deciliter. 
      The chart displays three percentile bands: 5th to 95th percentile in light gray showing full variation, 
      25th to 75th percentile in medium gray showing typical range, 
      and median line in black showing most common glucose value. 
      Clinical target range of 70 to 180 mg per deciliter is marked with horizontal lines. 
      ${events.hypoEpisodes?.events?.length || 0} low glucose episodes and 
      ${events.hyper?.events?.length || 0} high glucose episodes are marked on the chart.
      ${comparison ? 'A comparison curve from a previous period is shown as a dashed line.' : ''}
      Keyboard shortcut: Press F to toggle fullscreen view. Press Escape to exit fullscreen.`;
  }, [agpData, events, comparison]);

  // Keyboard shortcut: F for fullscreen
  useEffect(() => {
    const handleKeyPress = (e) => {
      // F key toggles fullscreen (not when typing in input)
      if (e.key === 'f' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <div className="space-y-4" role="region" aria-labelledby="agp-chart-title">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100" id="agp-chart-title">
            Ambulatory Glucose Profile (AGP)
          </h3>
          <div className="text-sm text-gray-400" role="note" aria-label="Keyboard shortcuts and interaction help">
            Click chart for fullscreen • Press F for fullscreen • Press ESC to exit • 24-hour glucose pattern
          </div>
        </div>

        {/* SVG Chart with Legend Overlay - CLICKABLE */}
        <div 
          className="card bg-white border-gray-300 overflow-hidden" 
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => setIsFullscreen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsFullscreen(true);
            }
          }}
          title="Click or press Enter to view fullscreen (or press F)"
          role="button"
          tabIndex={0}
          aria-label="AGP Chart - Interactive glucose profile chart. Click, press Enter, or press F to view in fullscreen mode. Press Escape to exit fullscreen."
        >
          {/* Legend positioned absolute in top-right */}
          <ChartLegend hasComparison={!!comparison} />
          
          {/* Screen reader summary (visually hidden but announced) */}
          <div 
            className="sr-only" 
            aria-live="polite"
            role="status"
            aria-atomic="true"
          >
            {accessibleSummary}
          </div>
          
          <svg 
            width={width} 
            height={height} 
            className="w-full h-auto"
            role="img"
            aria-labelledby="agp-chart-title agp-chart-desc"
          >
            {/* Accessible description */}
            <title id="agp-svg-title">Ambulatory Glucose Profile Chart</title>
            <desc id="agp-chart-desc">
              {accessibleSummary}
            </desc>
          {/* White background */}
          <rect x="0" y="0" width={width} height={height} fill="white" />
          
          {/* Grid lines */}
          <g aria-label="Grid lines for glucose values">
            <GridLines 
              margin={margin}
              chartWidth={chartWidth}
              chartHeight={chartHeight}
              yScale={yScale}
              yTicks={yTicks}
            />
          </g>

          {/* Night end marker - vertical dashed line at 06:00 */}
          <g aria-label="Night period end marker at 6 AM">
            <line
              x1={xScale(6 * 60)}
              y1={margin.top}
              x2={xScale(6 * 60)}
              y2={margin.top + chartHeight}
              stroke="var(--color-gray-mid)"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity="0.6"
            />
          </g>

          {/* Target lines */}
          <g aria-label="Clinical target glucose ranges: 54 mg/dL (critical low), 70-180 mg/dL (target range), 250 mg/dL (critical high)">
            <TargetLines 
              margin={margin}
              chartWidth={chartWidth}
              yScale={yScale}
            />
          </g>

          {/* Percentile bands - BRUTALIST GRAYSCALE */}
          {/* 5-95th percentile band - light gray */}
          <g aria-label="5th to 95th percentile range - shows variation in glucose levels">
            <path
              d={paths.band_5_95}
              fill="var(--color-agp-p5-95)"
              opacity="0.8"
            />
          </g>
          
          {/* 25-75th percentile band - medium gray */}
          <g aria-label="25th to 75th percentile range - interquartile range showing typical glucose values">
            <path
              d={paths.band_25_75}
              fill="var(--color-agp-p25-75)"
              opacity="0.8"
            />
          </g>

          {/* Median line (p50) - BRUTALIST BLACK SOLID */}
          <g aria-label="Median glucose line - typical glucose value at each time of day">
            <path
              d={paths.median}
              fill="none"
              stroke="var(--color-agp-median)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* Comparison overlay (if present) - gray dashed thicker */}
          {comparisonPath && (
            <g aria-label="Previous period comparison - dashed line">
              <path
                d={comparisonPath}
                fill="none"
                stroke="var(--text-tertiary)"
                strokeWidth="2.5"
                strokeDasharray="6,4"
                opacity="0.9"
              />
            </g>
          )}

          {/* Event markers */}
          <g aria-label={`Glucose events: ${events.hypoEpisodes?.events?.length || 0} hypoglycemia episodes, ${events.hyper?.events?.length || 0} hyperglycemia episodes`}>
            <EventMarkers 
              events={events}
              xScale={xScale}
              yScale={yScale}
              chartHeight={chartHeight}
              margin={margin}
            />
          </g>

          {/* Axes */}
          <g aria-label="Time axis - 24 hour format from midnight to midnight">
            <XAxis 
              margin={margin}
              chartWidth={chartWidth}
              chartHeight={chartHeight}
            />
          </g>
          <g aria-label={`Glucose axis - range from ${yMin} to ${yMax} mg/dL with clinical targets at 70 and 180`}>
            <YAxis 
              margin={margin}
              chartHeight={chartHeight}
              yScale={yScale}
              yTicks={yTicks}
            />
          </g>
        </svg>
      </div>
    </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (() => {
        // Recalculate dimensions for fullscreen
        const fsWidth = Math.min(1800, window.innerWidth * 0.92);
        const fsHeight = Math.min(1000, window.innerHeight * 0.85);
        const fsMargin = { top: 30, right: 80, bottom: 60, left: 80 };
        const fsChartWidth = fsWidth - fsMargin.left - fsMargin.right;
        const fsChartHeight = fsHeight - fsMargin.top - fsMargin.bottom;
        
        // Recalculate scales
        const fsXScale = (minuteOfDay) => fsMargin.left + (minuteOfDay / 1440) * fsChartWidth;
        const fsYScale = (glucose) => {
          const clampedGlucose = Math.max(yMin, Math.min(yMax, glucose));
          return fsMargin.top + fsChartHeight - ((clampedGlucose - yMin) / (yMax - yMin)) * fsChartHeight;
        };
        
        // Recalculate paths for fullscreen
        const fsPaths = generatePaths(agpData, fsXScale, fsYScale);
        const fsComparisonPath = comparison ? generatePath(comparison, 'p50', fsXScale, fsYScale) : null;
        
        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'var(--bg-primary)',
                border: '3px solid var(--border-primary)',
                color: 'var(--text-primary)',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 'bold',
                zIndex: 10000,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              ✕ CLOSE (ESC)
            </button>

            {/* Chart Container - fullscreen size */}
            <div 
              style={{ 
                maxWidth: '95vw',
                maxHeight: '90vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card bg-white border-gray-300" style={{ position: 'relative' }}>
                <ChartLegend hasComparison={!!comparison} />
                
                {/* Screen reader announcement for fullscreen */}
                <div className="sr-only" aria-live="polite">
                  Fullscreen mode activated. Press Escape or click Close to exit.
                </div>
                
                <svg 
                  width={fsWidth} 
                  height={fsHeight} 
                  className="w-full h-auto"
                  role="img"
                  aria-label="Ambulatory Glucose Profile - Fullscreen View"
                  aria-describedby="agp-chart-desc-fs"
                >
                  {/* Accessible description for fullscreen */}
                  <desc id="agp-chart-desc-fs">
                    {accessibleSummary}
                  </desc>
                  
                  <rect x="0" y="0" width={fsWidth} height={fsHeight} fill="white" />
                  
                  <g aria-label="Grid lines for glucose values">
                    <GridLines 
                      margin={fsMargin}
                      chartWidth={fsChartWidth}
                      chartHeight={fsChartHeight}
                      yScale={fsYScale}
                      yTicks={yTicks}
                    />
                  </g>

                  <g aria-label="Night period end marker at 6 AM">
                    <line
                      x1={fsXScale(6 * 60)}
                      y1={fsMargin.top}
                      x2={fsXScale(6 * 60)}
                      y2={fsMargin.top + fsChartHeight}
                      stroke="var(--color-gray-mid)"
                      strokeWidth="2"
                      strokeDasharray="8,4"
                      opacity="0.6"
                    />
                  </g>

                  <g aria-label="Clinical target glucose ranges: 54 mg/dL (critical low), 70-180 mg/dL (target range), 250 mg/dL (critical high)">
                    <TargetLines 
                      margin={fsMargin}
                      chartWidth={fsChartWidth}
                      yScale={fsYScale}
                    />
                  </g>

                  <g aria-label="5th to 95th percentile range - shows variation in glucose levels">
                    <path
                      d={fsPaths.band_5_95}
                      fill="var(--color-agp-p5-95)"
                      opacity="0.8"
                    />
                  </g>
                  
                  <g aria-label="25th to 75th percentile range - interquartile range showing typical glucose values">
                    <path
                      d={fsPaths.band_25_75}
                      fill="var(--color-agp-p25-75)"
                      opacity="0.8"
                    />
                  </g>

                  <g aria-label="Median glucose line - typical glucose value at each time of day">
                    <path
                      d={fsPaths.median}
                      fill="none"
                      stroke="var(--color-agp-median)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>

                  {fsComparisonPath && (
                    <g aria-label="Previous period comparison - dashed line">
                      <path
                        d={fsComparisonPath}
                        fill="none"
                        stroke="var(--text-tertiary)"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        opacity="0.9"
                      />
                    </g>
                  )}

                  <g aria-label={`Glucose events: ${events.hypoEpisodes?.events?.length || 0} hypoglycemia episodes, ${events.hyper?.events?.length || 0} hyperglycemia episodes`}>
                    <EventMarkers 
                      events={events}
                      xScale={fsXScale}
                      yScale={fsYScale}
                      chartHeight={fsChartHeight}
                      margin={fsMargin}
                    />
                  </g>

                  <g aria-label="Time axis - 24 hour format from midnight to midnight">
                    <XAxis 
                      margin={fsMargin}
                      chartWidth={fsChartWidth}
                      chartHeight={fsChartHeight}
                    />
                  </g>
                  <g aria-label={`Glucose axis - range from ${yMin} to ${yMax} mg/dL with clinical targets at 70 and 180`}>
                    <YAxis 
                      margin={fsMargin}
                      chartHeight={fsChartHeight}
                      yScale={fsYScale}
                      yTicks={yTicks}
                    />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        );
      })()}
    </>
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
 * ✨ v3.8.0: Now uses dynamic yTicks instead of hardcoded values
 */
function GridLines({ margin, chartWidth, chartHeight, yScale, yTicks }) {
  return (
    <g className="grid">
      {yTicks.map((value) => (
        <line
          key={value}
          x1={margin.left}
          y1={yScale(value)}
          x2={margin.left + chartWidth}
          y2={yScale(value)}
          stroke="var(--color-black)"
          strokeWidth="1"
          opacity="0.2"
        />
      ))}
    </g>
  );
}

/**
 * TargetLines - Clinical targets (BRUTALIST: massive lines, red)
 */
function TargetLines({ margin, chartWidth, yScale }) {
  const targets = [
    { value: 54, color: 'var(--color-red)', width: 2, dash: '8,4' },    // Critical Low
    { value: 70, color: 'var(--color-black)', width: 3, dash: 'none' },   // Low
    { value: 180, color: 'var(--color-black)', width: 3, dash: 'none' },  // High
    { value: 250, color: 'var(--color-red)', width: 2, dash: '8,4' },   // Very High
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
 * EventMarkers - BRUTALIST event indicators
 * 
 * v3.8.1: Updated to use unified hypoEpisodes structure with severity classification
 * - hypoEpisodes.events contains ALL hypoglycemia episodes
 * - severity field determines visual representation: 'severe' (<54) vs 'low' (54-70)
 */
function EventMarkers({ events, xScale, yScale, chartHeight, margin }) {
  if (!events) return null;
  
  // Extract events from new unified structure
  const allHypoEpisodes = events.hypoEpisodes?.events || [];
  const hypoSevere = allHypoEpisodes.filter(e => e.severity === 'severe'); // nadir <54
  const hypoLow = allHypoEpisodes.filter(e => e.severity === 'low');       // nadir 54-70
  const hyperEvents = events.hyper?.events || [];
  
  return (
    <g className="event-markers">
      {/* Severe Hypoglycemia (<54) - RED X */}
      {hypoSevere.map((event, i) => {
        const cx = xScale(event.minuteOfDay);
        const cy = yScale(event.startGlucose);
        return (
          <g key={`hypo-severe-${i}`}>
            <circle cx={cx} cy={cy} r="6" fill="var(--color-hypo-l2)" />
            <line x1={cx - 3} y1={cy - 3} x2={cx + 3} y2={cy + 3} stroke="var(--color-white)" strokeWidth="2" />
            <line x1={cx + 3} y1={cy - 3} x2={cx - 3} y2={cy + 3} stroke="var(--color-white)" strokeWidth="2" />
          </g>
        );
      })}

      {/* Low Hypoglycemia (54-70) - ORANGE Circle */}
      {hypoLow.map((event, i) => {
        const cx = xScale(event.minuteOfDay);
        const cy = yScale(event.startGlucose);
        return (
          <circle
            key={`hypo-low-${i}`}
            cx={cx}
            cy={cy}
            r="5"
            fill="var(--color-hypo-l1)"
            stroke="var(--color-black)"
            strokeWidth="1"
          />
        );
      })}

      {/* Hyperglycemia (>250) - ORANGE Triangle */}
      {hyperEvents.map((event, i) => {
        const cx = xScale(event.minuteOfDay);
        const cy = yScale(event.startGlucose || 280);
        const size = 7;
        return (
          <polygon
            key={`hyper-${i}`}
            points={`${cx},${cy - size} ${cx - size},${cy + size} ${cx + size},${cy + size}`}
            fill="var(--color-hyper)"
            stroke="var(--color-black)"
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
        stroke="var(--text-secondary)"
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
            stroke="var(--text-secondary)"
            strokeWidth="1.5"
          />
          <text
            x={xPosition(hour)}
            y={margin.top + chartHeight + 20}
            textAnchor="middle"
            fill="var(--text-tertiary)"
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
        fill="var(--text-secondary)"
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
 * ✨ v3.8.0: Now uses dynamic yTicks instead of hardcoded values
 */
function YAxis({ margin, chartHeight, yScale, yTicks }) {
  return (
    <g className="y-axis">
      {/* Axis line */}
      <line
        x1={margin.left}
        y1={margin.top}
        x2={margin.left}
        y2={margin.top + chartHeight}
        stroke="var(--text-secondary)"
        strokeWidth="1.5"
      />

      {/* Value labels */}
      {yTicks.map((value) => (
        <g key={value}>
          <line
            x1={margin.left - 5}
            y1={yScale(value)}
            x2={margin.left}
            y2={yScale(value)}
            stroke="var(--text-secondary)"
            strokeWidth="1.5"
          />
          <text
            x={margin.left - 10}
            y={yScale(value)}
            textAnchor="end"
            alignmentBaseline="middle"
            fill="var(--text-tertiary)"
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
        fill="var(--text-secondary)"
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
        backgroundColor: 'var(--bg-primary)',
        border: '2px solid var(--border-secondary)',
        borderRadius: '2px',
        padding: '12px',
        fontSize: '12px',
        lineHeight: '1.8',
        fontFamily: 'monospace',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10
      }}
    >
      <LegendItem color="var(--color-agp-median)" label="Mediaan" thickness={3} />
      <LegendItem color="var(--color-agp-p25-75)" label="25-75%" isShaded opacity={0.8} />
      <LegendItem color="var(--color-agp-p5-95)" label="5-95%" isShaded opacity={0.8} />
      {hasComparison && <LegendItem color="var(--text-tertiary)" label="Vorige periode" thickness={2.5} isDashed />}
      <LegendItem color="var(--color-hypo-l2)" label="L2 Hypo (<54)" isCircle markerType="x" />
      <LegendItem color="var(--color-hypo-l1)" label="L1 Hypo (54-69)" isCircle />
      <LegendItem color="var(--color-hyper)" label="Hyper (>250)" isTriangle />
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
      <span style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}
