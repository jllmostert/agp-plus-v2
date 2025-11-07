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
 * ALGORITHM (Simplified v3.2):
 * 1. Y-axis always starts at 0 mg/dL
 * 2. Maximum is based on highest glucose value
 * 3. Minimum ceiling of 250 mg/dL (always show at least 0-250 range)
 * 4. Maximum ceiling of 400 mg/dL (physiological limit)
 * 5. Round maximum up to nearest 10 for clean appearance
 * 
 * This ensures:
 * - Full clinical range (70-180 TIR boundaries) always visible
 * - Outliers above 250 are accommodated up to 400
 * - Consistent zero baseline for all charts
 * 
 * @param {Array} curve - Array of data points with shape: { glucose, hasData }
 * @returns {Object} Y-axis configuration
 * @returns {number} yMin - Minimum Y value (always 0)
 * @returns {number} yMax - Maximum Y value (250-400 mg/dL)
 * @returns {Array<number>} yTicks - Array of Y-axis tick values
 * @returns {Object|null} outliers - { low: min, high: max } for values outside range
 */
export function calculateAdaptiveYAxis(curve) {
  // Extract valid glucose readings
  const validGlucose = curve
    .filter(d => d.hasData && d.glucose !== null)
    .map(d => d.glucose);
  
  // Fallback to 0-250 range if no valid data
  if (validGlucose.length === 0) {
    return {
      yMin: 0,
      yMax: 250,
      yTicks: [0, 50, 100, 150, 200, 250],
      outliers: null
    };
  }
  
  // Find actual data maximum
  const dataMax = Math.max(...validGlucose);
  
  // Y-axis configuration (v3.2 simplified logic):
  // - Always start at 0
  // - Minimum ceiling of 250, maximum ceiling of 400
  // - Round up to nearest 10 for clean appearance
  const yMin = 0;
  const yMax = Math.max(250, Math.min(400, Math.ceil(dataMax / 10) * 10));
  
  // Detect outliers beyond display range (for warning labels)
  // Note: Since yMin is always 0, low outliers are rare but possible (sensor errors)
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
 * TICK GENERATION STRATEGY (v3.2 - optimized for 0-250/400 range):
 * 1. Aim for ~5-6 ticks with nice round numbers (50 step sizes)
 * 2. ALWAYS include 0, 70, 180 mg/dL if in range (clinical boundaries)
 * 3. Add additional ticks at 50, 100, 150, 200, 250, etc. as needed
 * 
 * WHY 70 and 180?
 * - 70 mg/dL = lower bound of target range (TIR starts here)
 * - 180 mg/dL = upper bound of target range (TIR ends here)
 * - These are ALWAYS critical thresholds in diabetes management
 * 
 * @param {number} yMin - Minimum Y value (always 0)
 * @param {number} yMax - Maximum Y value (250-400)
 * @returns {Array<number>} Sorted array of tick values
 * 
 * @private
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
      // Check if any existing tick is too close to this critical value
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
