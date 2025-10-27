/**
 * Constants for AGP+ Application
 * 
 * Centralized configuration values and thresholds.
 * Single source of truth for all magic numbers used throughout the app.
 * 
 * @version 3.9.0
 */

// ============================================
// GLUCOSE THRESHOLDS (mg/dL)
// ============================================

/**
 * Clinical glucose thresholds based on ADA/ATTD 2019 guidelines
 */
export const GLUCOSE = {
  // Hypoglycemia levels
  HYPO_L2: 54,      // Level 2: Clinically significant low (<54 mg/dL)
  HYPO_L1: 70,      // Level 1: Alert value (54-70 mg/dL)
  
  // Target range (Type 1 Diabetes)
  TARGET_LOW: 70,   // Lower bound of target range
  TARGET_HIGH: 180, // Upper bound of target range
  
  // Hyperglycemia
  HYPER: 250,       // Threshold for sustained hyperglycemia (>250 mg/dL)
  
  // Chart visualization limits
  CHART_MIN: 40,    // Minimum Y-axis value (physiological floor)
  CHART_MAX: 400,   // Maximum Y-axis value (physiological ceiling)
  
  // AGP recommended range
  AGP_DEFAULT_MIN: 54,  // AGP default lower bound
  AGP_DEFAULT_MAX: 250  // AGP default upper bound
};

// ============================================
// SENSOR LIFECYCLE THRESHOLDS (days)
// ============================================

/**
 * Medtronic Guardian 4 sensor performance thresholds
 * Note: Approved lifecycle is 7 days, but real-world success accounts for warmup
 */
export const SENSOR = {
  OPTIMAL: 6.75,     // Green status: Full lifecycle (≥6d 18h)
  ACCEPTABLE: 6.0,   // Orange status: Suboptimal but working (6.0-6.75d)
  MIN_VALID: 6.0,    // Red status: Below this = premature failure
  APPROVED: 7.0      // Manufacturer's rated lifetime
};

// ============================================
// TIME WINDOWS (milliseconds)
// ============================================

export const TIME = {
  FIVE_MIN: 5 * 60 * 1000,           // 5 minutes in ms
  FIFTEEN_MIN: 15 * 60 * 1000,       // 15 minutes in ms
  THIRTY_MIN: 30 * 60 * 1000,        // 30 minutes in ms
  ONE_HOUR: 60 * 60 * 1000,          // 1 hour in ms
  TWO_HOURS: 2 * 60 * 60 * 1000,     // 2 hours in ms
  ONE_DAY: 24 * 60 * 60 * 1000       // 1 day in ms
};

// ============================================
// EVENT DETECTION DURATIONS (minutes)
// ============================================

export const EVENT_DURATION = {
  HYPO_MIN: 15,        // Minimum duration for hypoglycemia event (15 min)
  HYPER_MIN: 120,      // Minimum duration for hyperglycemia event (120 min)
  SENSOR_GAP_MIN: 30,  // Minimum gap to consider sensor change (30 min)
  SENSOR_GAP_MAX: 600  // Maximum gap for sensor change detection (10 hours)
};

// ============================================
// DATA QUALITY THRESHOLDS
// ============================================

export const DATA_QUALITY = {
  MIN_READINGS_PER_DAY: 200,  // Minimum readings for a "complete" day (70% of 288)
  MIN_CGM_COVERAGE: 0.70,     // Minimum 70% CGM uptime for reliable metrics
  MIN_DAYS_FOR_AGP: 7,        // Minimum days required for AGP generation
  READINGS_PER_DAY: 288       // Expected readings per day (5-min intervals)
};

// ============================================
// UI/UX CONSTANTS
// ============================================

export const UI = {
  CHART_HEIGHT: 400,           // Default chart height (px)
  CHART_WIDTH: 800,            // Default chart width (px)
  BORDER_WIDTH: 3,             // Brutalist border width (px)
  BORDER_WIDTH_THICK: 4,       // Thick border for emphasis (px)
  GRID_GAP: '1rem',            // Standard grid gap
  ANIMATION_DURATION: 200      // Standard animation duration (ms)
};

// ============================================
// VERSION INFO
// ============================================

export const VERSION = {
  CURRENT: '3.9.0',
  DATA_FORMAT: '3.0',          // Master dataset format version
  CHANGELOG_URL: 'https://github.com/jllmostert/agp-plus-v2/blob/main/CHANGELOG.md'
};

// ============================================
// EXPORT FORMATS
// ============================================

export const EXPORT = {
  HTML_MAX_PAGES: 2,           // Maximum pages for day profiles export
  DAYS_PER_PAGE_1: 4,          // Days on first page
  DAYS_PER_PAGE_2: 3,          // Days on second page
  JSON_INDENT: 2               // JSON formatting indent
};
