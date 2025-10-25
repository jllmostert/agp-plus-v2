/**
 * Visualization Utilities
 * 
 * Pure functions for common visualization calculations used across
 * AGP charts, day profiles, and HTML exports.
 * 
 * @version 2.2.1
 * @since 2024-10-25 - Extracted from DayProfileCard component
 */

/**
 * Calculate adaptive Y-axis range for glucose visualization
 * 
 * ALGORITHM:
 * 1. Start with clinical baseline: 54-250 mg/dL (target range with buffer)
 * 2. If data exceeds range, expand in steps to accommodate
 * 3. Never go below 40 mg/dL or above 400 mg/dL (physiological limits)
 * 4. Apply smart padding based on data variability
 * 
 * PADDING STRATEGY:
 * - Tight glycemic control (range <100 mg/dL): +30 mg/dL padding = more zoom
 * - Moderate variability (range 100-150): +20 mg/dL padding
 * - Wide variability (range >150): +15 mg/dL padding = less zoom
 * 
 * This maximizes chart space usage while maintaining clinical context.
 * 
 * @param {Array} curve - Array of data points with shape: { glucose, hasData }
 * @returns {Object} Y-axis configuration
 * @returns {number} yMin - Minimum Y value (mg/dL)
 * @returns {number} yMax - Maximum Y value (mg/dL)
 * @returns {Array<number>} yTicks - Array of Y-axis tick values
 * @returns {Object|null} outliers - { low: min, high: max } for values outside range
 */
export function calculateAdaptiveYAxis(curve) {
  // Extract valid glucose readings
  const validGlucose = curve
    .filter(d => d.hasData && d.glucose !== null)
    .map(d => d.glucose);
  
  // Fallback to clinical range if no valid data
  if (validGlucose.length === 0) {
    return {
      yMin: 54,
      yMax: 250,
      yTicks: [54, 100, 150, 200, 250],
      outliers: null
    };
  }
  
  // Find actual data range
  const dataMin = Math.min(...validGlucose);
  const dataMax = Math.max(...validGlucose);
  const dataRange = dataMax - dataMin;
  
  // Calculate smart padding based on variability
  // Tight glycemic control (range <100): +30 padding = more zoom
  // Moderate (range 100-150): +20 padding
  // Wide variability (range >150): +15 padding = less zoom
  const padding_buffer = 
    dataRange < 100 ? 30 : 
    dataRange < 150 ? 20 : 
    15;
  
  // Set adaptive range: start with clinical range (54-250), expand if needed
  // Floor at 40 mg/dL, ceiling at 400 mg/dL (physiological limits)
  const yMin = Math.max(40, Math.min(54, dataMin - padding_buffer));
  const yMax = Math.min(400, Math.max(250, dataMax + padding_buffer));
  
  // Detect outliers beyond display range (for warning labels)
  const outlierLow = validGlucose.filter(g => g < yMin);
  const outlierHigh = validGlucose.filter(g => g > yMax);
  const outliers = (outlierLow.length > 0 || outlierHigh.length > 0) ? {
    low: outlierLow.length > 0 ? Math.min(...outlierLow) : null,
    high: outlierHigh.length > 0 ? Math.max(...outlierHigh) : null
  } : null;
  
  // Generate smart Y-axis ticks
  const yTicks = calculateYTicks(yMin, yMax);
  
  return { yMin, yMax, yTicks, outliers };
}

/**
 * Calculate smart Y-axis tick values
 * 
 * TICK GENERATION STRATEGY:
 * 1. Aim for ~5 ticks with nice round numbers (20, 25, 40, 50 step sizes)
 * 2. ALWAYS include 70 and 180 mg/dL if in range (clinical boundaries)
 * 3. Resolve conflicts: keep critical ticks, remove nearby regular ticks
 * 
 * WHY 70 and 180?
 * - 70 mg/dL = lower bound of target range (TIR starts here)
 * - 180 mg/dL = upper bound of target range (TIR ends here)
 * - These are ALWAYS critical thresholds in diabetes management
 * 
 * @param {number} yMin - Minimum Y value
 * @param {number} yMax - Maximum Y value
 * @returns {Array<number>} Sorted array of tick values
 * 
 * @private
 */
function calculateYTicks(yMin, yMax) {
  const range = yMax - yMin;
  const idealTickCount = 5;
  const roughStep = range / idealTickCount;
  
  // Round to nice numbers (20, 25, 40, 50)
  let step;
  if (roughStep <= 25) step = 20;
  else if (roughStep <= 40) step = 25;
  else if (roughStep <= 60) step = 40;
  else step = 50;
  
  const ticks = [];
  const startTick = Math.ceil(yMin / step) * step;
  
  // Generate regular ticks
  for (let tick = startTick; tick <= yMax; tick += step) {
    ticks.push(tick);
  }
  
  // ALWAYS include clinical boundaries 70 and 180 if in range
  const CRITICAL_TICKS = [70, 180];
  const MIN_SPACING = 15; // Minimum 15 mg/dL between ticks to avoid crowding
  
  for (const critical of CRITICAL_TICKS) {
    if (yMin <= critical && yMax >= critical) {
      // Check if any existing tick is too close to this critical value
      const hasConflict = ticks.some(t => 
        t !== critical && Math.abs(t - critical) < MIN_SPACING
      );
      
      if (hasConflict) {
        // Remove conflicting ticks, keep critical ones
        // Critical thresholds take priority over regular ticks
        const filtered = ticks.filter(t => 
          Math.abs(t - critical) >= MIN_SPACING
        );
        ticks.length = 0;
        ticks.push(...filtered, critical);
      } else if (!ticks.includes(critical)) {
        ticks.push(critical);
      }
    }
  }
  
  return ticks.sort((a, b) => a - b);
}

/**
 * Create Y-axis scale function for SVG rendering
 * 
 * Converts glucose value (mg/dL) to SVG Y coordinate.
 * Clamps values to display range to prevent rendering outside chart bounds.
 * 
 * @param {number} yMin - Minimum Y value
 * @param {number} yMax - Maximum Y value
 * @param {number} chartHeight - Height of chart area in pixels
 * @returns {Function} Scale function: (glucose: number) => yCoordinate: number
 */
export function createYScale(yMin, yMax, chartHeight) {
  return (glucose) => {
    // Clamp glucose to display range
    const clampedGlucose = Math.max(yMin, Math.min(yMax, glucose));
    // Invert Y (SVG coordinate system: 0 at top)
    return chartHeight - ((clampedGlucose - yMin) / (yMax - yMin)) * chartHeight;
  };
}

/**
 * Create X-axis scale function for time-based charts
 * 
 * Converts time bin (0-287 for 24h in 5-min intervals) to SVG X coordinate.
 * 
 * @param {number} totalBins - Total number of time bins (typically 288 for 24h)
 * @param {number} chartWidth - Width of chart area in pixels
 * @returns {Function} Scale function: (bin: number) => xCoordinate: number
 */
export function createXScale(totalBins, chartWidth) {
  return (bin) => (bin / totalBins) * chartWidth;
}
