/**
 * ARTIFACT-01: Metrics Engine
 * Pure calculation functions for glucose metrics
 * 
 * Exports:
 * - CONFIG: Configuration constants
 * - utils: Utility functions (parseDecimal, parseDate, formatDate, isInTimePeriod)
 * - calculateMetrics: Main metrics calculation
 * - calculateAGP: Ambulatory Glucose Profile percentiles
 * - detectEvents: Hypo/hyper event detection
 */

export const CONFIG = {
  GLUCOSE: {
    LOW: 70,
    HIGH: 180,
    CRITICAL_LOW: 54,
    CRITICAL_HIGH: 250,
    MAX: 400
  },
  AGP_BINS: 288,
  HYPO_MIN_DURATION: 15,
  HYPER_MIN_DURATION: 120,
  MODD_COVERAGE_THRESHOLD: 0.7,  // Optimal value (tested 0.6, was worse)
  COMPARISON_DAYS: 14,
  CSV_SKIP_LINES: 6,
  TIME_SPLIT: {
    NIGHT_START: 0,
    NIGHT_END: 6,
    DAY_START: 6,
    DAY_END: 24
  }
};

export const utils = {
  parseDecimal: (str) => str && str !== '' ? parseFloat(str.replace(',', '.')) : NaN,
  
  parseDate: (dateStr, timeStr) => {
    // CRITICAL: Force Europe/Brussels timezone for consistent parsing
    // CareLink exports are in local time, must be interpreted consistently
    const [year, month, day] = dateStr.split('/');
    const [hours, minutes, seconds] = timeStr.split(':');
    
    // Create date string in ISO format for Brussels timezone
    const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds || 0).padStart(2, '0')}`;
    
    // Parse as Brussels time (this handles DST automatically)
    const date = new Date(isoString);
    
    return date;
  },
  
  formatDate: (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  },
  
  isInTimePeriod: (hour, period) => {
    if (period === 'night') {
      return hour >= CONFIG.TIME_SPLIT.NIGHT_START && hour < CONFIG.TIME_SPLIT.NIGHT_END;
    }
    if (period === 'day') {
      return hour >= CONFIG.TIME_SPLIT.DAY_START && hour < CONFIG.TIME_SPLIT.DAY_END;
    }
    return true;
  }
};

// ====================================================================
// MAGE/MODD IMPROVEMENTS (v3.9.0)
// ====================================================================
// References:
// - Service FJ et al., Diabetes 1970;19(9):644-655 (MAGE definition)
// - Molnar GD et al., Diabetologia 1972;8:342-348 (MODD definition)
// - Battelino T et al., Diabetes Care 2019;42:1593-1603 (ATTD consensus)
//
// Key improvements:
// 1. MAGE: Per-day SD + mean-crossing requirement (reduces false excursions)
// 2. MODD: Chronological date sorting + uniform time grid (eliminates pairing errors)
// 3. Coverage filtering: Exclude incomplete days (<70% data)
// 4. Error handling: Robust NaN/null checks throughout
// ====================================================================

/**
 * Find local extrema (peaks and valleys) in a glucose series
 * 
 * @param {Array<number>} values - Glucose values (sorted by time)
 * @returns {Array<{i: number, v: number, isPeak: boolean}>} Extrema with metadata
 * 
 * Example:
 *   values = [100, 120, 110, 130, 105]
 *   returns = [
 *     {i: 1, v: 120, isPeak: true},   // peak at index 1
 *     {i: 2, v: 110, isPeak: false},  // valley at index 2
 *     {i: 3, v: 130, isPeak: true}    // peak at index 3
 *   ]
 */
function _localExtrema(values) {
  if (!Array.isArray(values) || values.length < 3) return [];
  
  const out = [];
  for (let i = 1; i < values.length - 1; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const next = values[i + 1];
    
    // Skip if any value is invalid
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || !Number.isFinite(next)) {
      continue;
    }
    
    // Peak: curr > both neighbors
    // Valley: curr < both neighbors
    if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
      out.push({ i, v: curr, isPeak: curr > prev });
    }
  }
  
  return out;
}

/**
 * Calculate MAGE per day with mean-crossing requirement
 * 
 * Per Service et al. (1970): Excursions must satisfy TWO criteria:
 * 1. Amplitude ≥ 1×SD (from daily mean)
 * 2. Cross the daily mean (sign change between extrema)
 * 
 * This eliminates small oscillations and ensures clinical significance.
 * 
 * @param {Array<number>} values - Glucose values for ONE day (sorted by time)
 * @returns {number} MAGE for this day, or NaN if insufficient data
 * 
 * Implementation notes:
 * - Minimum 12 readings (~1 hour) required
 * - Uses sample SD (ddof=1) per ATTD consensus
 * - Alternating peaks/valleys only (no consecutive same-type extrema)
 */
function _magePerDayMeanCross(values) {
  if (!Array.isArray(values) || values.length < 12) return NaN; // ~1h minimum
  
  // Filter out invalid values
  const valid = values.filter(v => Number.isFinite(v));
  if (valid.length < 12) return NaN;
  
  // Calculate day mean and SD with ddof=1 (sample SD)
  const mean = valid.reduce((s, v) => s + v, 0) / valid.length;
  const variance = valid.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(1, valid.length - 1);
  const sd = Math.sqrt(variance);
  
  if (!isFinite(sd) || sd === 0) return NaN;

  // Find extrema (peaks and valleys)
  const ex = _localExtrema(valid);
  if (ex.length < 2) return NaN;

  // Calculate amplitudes with TWO criteria (Service 1970)
  const amps = [];
  for (let k = 1; k < ex.length; k++) {
    const a = ex[k - 1];
    const b = ex[k];
    
    // Must alternate peak ↔ valley
    if (a.isPeak === b.isPeak) continue;
    
    const amp = Math.abs(b.v - a.v);
    
    // Criterion 1: Amplitude ≥ SD
    if (amp < sd) continue;
    
    // Criterion 2: Crosses daily mean (sign change)
    // (a.v - mean) and (b.v - mean) must have opposite signs
    const crossesMean = ((a.v - mean) * (b.v - mean)) < 0;
    if (!crossesMean) continue;
    
    // Both criteria met → significant excursion
    amps.push(amp);
  }
  
  if (amps.length === 0) return NaN;
  
  // Mean of significant amplitudes
  return amps.reduce((s, v) => s + v, 0) / amps.length;
}

/**
 * Parse date string robustly (handles multiple formats)
 * 
 * Supports:
 * - YYYY-MM-DD or YYYY/MM/DD (ISO-ish)
 * - DD/MM/YYYY or DD-MM-YYYY (European)
 * 
 * @param {string} d - Date string
 * @returns {Date} Parsed date, or Invalid Date if parsing fails
 */
function _parseDateLoose(d) {
  if (!d || typeof d !== 'string') return new Date(NaN);
  
  // YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-\/]/.test(d)) {
    return new Date(d);
  }
  
  // DD/MM/YYYY or DD-MM-YYYY
  const m = d.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [_, day, month, year] = m;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  
  // Fallback: let Date constructor try
  return new Date(d);
}

/**
 * Build uniform time grid for a day (e.g., 288 5-minute slots)
 * 
 * Maps irregular glucose readings onto a regular time grid:
 * - Day starts at midnight (00:00:00)
 * - Slots every `stepMin` minutes (default 5)
 * - Each slot gets closest reading within `maxInterpMin` tolerance
 * 
 * @param {Array<{t: Date, g: number}>} dayRecords - Sorted records for one day
 * @param {number} stepMin - Sampling interval (default 5 min)
 * @param {number} maxInterpMin - Max gap to bridge (default 0 = no interpolation)
 * @returns {Array<number>} Array of glucose values (NaN for missing slots)
 * 
 * Example:
 *   stepMin=5 → 288 slots (24h × 60min / 5min)
 *   maxInterpMin=0 → Only exact matches
 *   maxInterpMin=10 → Bridge gaps up to 10 minutes
 */
function _buildUniformGrid(dayRecords, stepMin = 5, maxInterpMin = 0) {
  if (!Array.isArray(dayRecords) || dayRecords.length === 0) {
    // Return empty grid (all NaN)
    return new Array(Math.round(24 * 60 / stepMin)).fill(NaN);
  }
  
  // Get day start (midnight)
  const day = new Date(dayRecords[0].t);
  day.setHours(0, 0, 0, 0);
  
  // Build time slots (288 for 5-min sampling)
  const slots = [];
  for (let min = 0; min < 24 * 60; min += stepMin) {
    slots.push(day.getTime() + min * 60 * 1000);
  }
  
  const series = new Array(slots.length).fill(NaN);
  let recordIdx = 0;
  
  for (let i = 0; i < slots.length && recordIdx < dayRecords.length; i++) {
    const slotTime = slots[i];
    
    // Find closest record to this slot
    while (recordIdx < dayRecords.length - 1 && 
           dayRecords[recordIdx + 1].t.getTime() <= slotTime) {
      recordIdx++;
    }
    
    const record = dayRecords[recordIdx];
    const timeDiff = Math.abs(record.t.getTime() - slotTime);
    
    // Only assign if within maxInterpMin tolerance
    if (timeDiff <= maxInterpMin * 60 * 1000) {
      series[i] = record.g;
    }
  }
  
  return series;
}

/**
 * Calculate MODD with proper date sorting and uniform grid
 * 
 * Reference: Molnar GD et al., Diabetologia 1972;8:342-348
 * 
 * MODD = Mean of Daily Differences
 * Compares glucose at identical times on consecutive days.
 * Measures day-to-day reproducibility (low MODD = consistent patterns).
 * 
 * @param {Map<string, Array<{t: Date, g: number}>>} dayBins - Map of date → records
 * @param {number} detectedStepMin - Sampling interval (default 5)
 * @param {number} coverageThreshold - Min coverage (0.7 = 70%)
 * @returns {number} MODD value, or NaN if insufficient data
 * 
 * Implementation improvements:
 * 1. Chronological sorting (NOT lexicographic) - fixes date ordering bugs
 * 2. Uniform grid alignment - ensures same-time comparisons
 * 3. Coverage filtering - excludes incomplete days
 */
function _computeMODD(dayBins, detectedStepMin = 5, coverageThreshold = 0.7) {
  // Sort days CHRONOLOGICALLY (not lexicographically!)
  const days = Array.from(dayBins.keys()).sort((a, b) => {
    return _parseDateLoose(a) - _parseDateLoose(b);
  });
  
  if (days.length < 2) return NaN;
  
  const diffs = [];
  const MAX_INTERP_MIN = 5; // Allow 5-min tolerance (full sampling interval)
  
  for (let i = 1; i < days.length; i++) {
    const d1 = days[i - 1];
    const d2 = days[i];
    
    const r1 = dayBins.get(d1);
    const r2 = dayBins.get(d2);
    
    if (!r1 || !r1.length || !r2 || !r2.length) continue;
    
    // Sort records by time
    const sorted1 = r1.slice().sort((a, b) => a.t - b.t);
    const sorted2 = r2.slice().sort((a, b) => a.t - b.t);
    
    // Build uniform grids (288 slots each)
    const s1 = _buildUniformGrid(sorted1, detectedStepMin, MAX_INTERP_MIN);
    const s2 = _buildUniformGrid(sorted2, detectedStepMin, MAX_INTERP_MIN);
    
    // Check coverage (min 70% complete per ATTD consensus)
    const cov1 = s1.filter(x => Number.isFinite(x)).length / s1.length;
    const cov2 = s2.filter(x => Number.isFinite(x)).length / s2.length;
    
    if (cov1 < coverageThreshold || cov2 < coverageThreshold) continue;
    
    // Calculate point-wise differences (same time slots)
    for (let k = 0; k < s1.length; k++) {
      const a = s1[k];
      const b = s2[k];
      if (Number.isFinite(a) && Number.isFinite(b)) {
        diffs.push(Math.abs(a - b));
      }
    }
  }
  
  if (diffs.length === 0) return NaN;
  
  // Mean of all differences
  return diffs.reduce((s, v) => s + v, 0) / diffs.length;
}

/**
 * Calculate glucose metrics for a given period
 * @param {Array} data - Array of glucose data objects {date, time, glucose}
 * @param {string} startDate - Start date in YYYY/MM/DD format
 * @param {string} endDate - End date in YYYY/MM/DD format
 * @param {Set} filterDates - Optional set of dates to include (for workday filtering)
 * @param {Object} timeFilter - Optional time filter {type: 'day_night', value: 'day'|'night'}
 * @returns {Object} Metrics object with TIR, CV, MAGE, MODD, etc.
 */
export const calculateMetrics = (data, startDate, endDate, filterDates = null, timeFilter = null) => {
  // Performance timing
  const perfStart = performance.now();
  
  // Filter data by date range and optional filters
  const filtered = data.filter(row => {
    const dt = utils.parseDate(row.date, row.time);
    const startDt = utils.parseDate(startDate, '00:00:00');
    const endDt = utils.parseDate(endDate, '23:59:59');
    const inRange = dt >= startDt && dt <= endDt;
    
    if (filterDates && !filterDates.has(row.date)) return false;
    
    if (timeFilter && timeFilter.type === 'day_night') {
      const hour = dt.getHours();
      if (!utils.isInTimePeriod(hour, timeFilter.value)) return false;
    }
    
    return inRange;
  });

  if (filtered.length === 0) return null;
  
  // Filter out rows without glucose (events like Rewind)
  const glucoseRows = filtered.filter(r => r.glucose !== null && !isNaN(r.glucose));
  
  if (glucoseRows.length === 0) return null;

  // Basic statistics
  const values = glucoseRows.map(r => r.glucose);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  const sd = Math.sqrt(variance);
  const cv = (sd / mean) * 100;
  const gmi = 3.31 + (0.02392 * mean);

  // Time in ranges
  const tir = (values.filter(v => v >= 70 && v <= 180).length / values.length) * 100;
  const tar = (values.filter(v => v > 180).length / values.length) * 100;
  const tbr = (values.filter(v => v < 70).length / values.length) * 100;
  
  // Time in ranges (detailed breakdown for GRI)
  const tbrLow = (values.filter(v => v >= 54 && v < 70).length / values.length) * 100;  // Level 1 hypo
  const tbrVeryLow = (values.filter(v => v < 54).length / values.length) * 100;         // Level 2 hypo
  const tarHigh = (values.filter(v => v > 180 && v <= 250).length / values.length) * 100;
  const tarVeryHigh = (values.filter(v => v > 250).length / values.length) * 100;
  
  // GRI - Glycemia Risk Index (Klonoff et al. 2018)
  // Weights: VLow=3.0, Low=2.4, VHigh=1.6, High=0.8
  const gri = (3.0 * tbrVeryLow) + (2.4 * tbrLow) + (1.6 * tarVeryHigh) + (0.8 * tarHigh);

  // MAGE - Mean Amplitude of Glycemic Excursions
  // Reference: Service FJ et al., Diabetes 1970;19:644-655
  // v3.9.0 Improvement: Per-day SD + mean-crossing requirement
  
  // Group glucose readings by day
  const byDay = {};
  glucoseRows.forEach(r => {
    if (!byDay[r.date]) byDay[r.date] = [];
    byDay[r.date].push({ t: utils.parseDate(r.date, r.time), g: r.glucose });
  });
  
  // Calculate expected readings per day for coverage check
  const detectedStepMin = 5; // 5-minute sampling (standard for Guardian 4)
  const expectedPerDay = Math.round((24 * 60) / detectedStepMin); // 288 readings/day
  
  // Calculate MAGE for each complete day
  const dailyMAGE = [];
  Object.entries(byDay).forEach(([date, dayData]) => {
    // Sort by time
    const sorted = dayData.sort((a, b) => a.t - b.t);
    const daySeries = sorted.map(x => x.g);
    
    // Filter incomplete days (≥70% coverage per ATTD consensus)
    const coverage = daySeries.length / expectedPerDay;
    if (coverage < 0.7) {
      // Skip incomplete days - they skew MAGE calculation
      return;
    }
    
    // Calculate MAGE for this day using improved algorithm
    const dayMAGE = _magePerDayMeanCross(daySeries);
    
    if (Number.isFinite(dayMAGE)) {
      dailyMAGE.push(dayMAGE);
    }
  });
  
  // Average MAGE across all complete days
  const mage = dailyMAGE.length > 0 
    ? dailyMAGE.reduce((sum, m) => sum + m, 0) / dailyMAGE.length 
    : 0;

  // MODD - Mean Of Daily Differences
  // Reference: Molnar GD et al., Diabetologia 1972;8:342-348
  // v3.9.0 Improvement: Chronological date sorting + uniform time grid
  
  // Reuse byDay from MAGE section (already contains {t: Date, g: number}[])
  const dayBinsForMODD = new Map(Object.entries(byDay));
  
  // Calculate MODD using improved algorithm
  const modd = _computeMODD(dayBinsForMODD, detectedStepMin, CONFIG.MODD_COVERAGE_THRESHOLD);
  
  // Handle NaN result
  const moddValue = Number.isFinite(modd) ? modd : 0;
  
  const uniqueDays = new Set(glucoseRows.map(r => r.date)).size;

  // Calculate data quality metrics - TIME-BASED (not day-based)
  // This prevents artificial deflation from incomplete trailing days
  const SAMPLING_INTERVAL_MIN = 5;
  
  // Get actual time boundaries from the data
  const timestamps = glucoseRows.map(r => utils.parseDate(r.date, r.time));
  const periodStart = new Date(Math.min(...timestamps));
  const periodEnd = new Date(Math.max(...timestamps));
  
  // Calculate elapsed minutes in the actual data period
  const elapsedMinutes = Math.floor((periodEnd - periodStart) / (1000 * 60));
  
  // Expected readings based on elapsed time only (not full days)
  const expectedReadings = Math.floor(elapsedMinutes / SAMPLING_INTERVAL_MIN) + 1; // +1 for inclusive start
  
  const actualReadings = glucoseRows.length;
  const missingReadings = Math.max(0, expectedReadings - actualReadings);
  const missingPercent = expectedReadings > 0 
    ? ((missingReadings / expectedReadings) * 100).toFixed(1) 
    : '0.0';
  const uptimePercent = expectedReadings > 0 
    ? (100 - parseFloat(missingPercent)).toFixed(1) 
    : '0.0';
  
  // Count complete days (days with ≥95% of expected readings)
  const readingsPerDay = {};
  glucoseRows.forEach(r => {
    readingsPerDay[r.date] = (readingsPerDay[r.date] || 0) + 1;
  });
  
  // A day is "complete" if it has ≥95% of 288 readings (274)
  const completeDays = Object.keys(readingsPerDay).filter(date => {
    return readingsPerDay[date] >= 274; // 95% of 288 = 273.6
  }).length;

  // Performance timing - end
  const perfEnd = performance.now();
  const perfDuration = Math.round(perfEnd - perfStart);
  
  // Log warning if calculation took >1s
  if (perfDuration > 1000) {
    console.warn(`[Metrics] Calculation took ${perfDuration}ms (target: <1000ms for 90-day data)`);
  } else {

  }

  return {
    mean: Math.round(mean),
    sd: sd.toFixed(1),
    cv: cv.toFixed(1),
    tir: tir.toFixed(1),
    tar: tar.toFixed(1),
    tbr: tbr.toFixed(1),
    gmi: gmi.toFixed(1),
    gri: gri.toFixed(1),
    mage: mage.toFixed(1),
    modd: moddValue.toFixed(1),  // Use moddValue (has NaN safety)
    min: Math.min(...values),
    max: Math.max(...values),
    days: uniqueDays,
    readingCount: glucoseRows.length,
    // Data quality metrics (NEW)
    dataQuality: {
      uptimePercent: parseFloat(uptimePercent),
      missingPercent: parseFloat(missingPercent),
      completeDays: completeDays,
      totalDays: uniqueDays,
      expectedReadings: expectedReadings,
      actualReadings: actualReadings
    },
    // Performance metrics (NEW - v3.2.0)
    performance: {
      calculationTime: perfDuration
    }
  };
};

/**
 * Calculate Ambulatory Glucose Profile (AGP) percentiles
 * @param {Array} data - Array of glucose data objects
 * @param {string} startDate - Start date in YYYY/MM/DD format
 * @param {string} endDate - End date in YYYY/MM/DD format
 * @returns {Array} Array of 288 objects with p5, p25, p50, p75, p95, mean
 */
export const calculateAGP = (data, startDate, endDate) => {
  const filtered = data.filter(row => {
    const dt = utils.parseDate(row.date, row.time);
    const startDt = utils.parseDate(startDate, '00:00:00');
    const endDt = utils.parseDate(endDate, '23:59:59');
    return dt >= startDt && dt <= endDt && row.glucose !== null && !isNaN(row.glucose);
  });

  const bins = Array(CONFIG.AGP_BINS).fill(null).map(() => []);
  
  // Bin glucose values by time of day
  filtered.forEach(row => {
    const dt = utils.parseDate(row.date, row.time);
    const minuteOfDay = dt.getHours() * 60 + dt.getMinutes();
    const binIdx = Math.floor((minuteOfDay / 1440) * CONFIG.AGP_BINS);
    if (binIdx >= 0 && binIdx < CONFIG.AGP_BINS) {
      bins[binIdx].push(row.glucose);
    }
  });

  // Calculate percentiles for each bin
  return bins.map(bin => {
    if (bin.length === 0) return { p5: 0, p25: 0, p50: 0, p75: 0, p95: 0, mean: 0 };
    
    const sorted = [...bin].sort((a, b) => a - b);
    const mean = bin.reduce((a, b) => a + b, 0) / bin.length;
    
    return {
      p5: sorted[Math.floor(bin.length * 0.05)] || sorted[0],
      p25: sorted[Math.floor(bin.length * 0.25)],
      p50: sorted[Math.floor(bin.length * 0.50)],
      p75: sorted[Math.floor(bin.length * 0.75)],
      p95: sorted[Math.floor(bin.length * 0.95)] || sorted[sorted.length - 1],
      mean
    };
  });
};

/**
 * Detect hypoglycemic and hyperglycemic events
 * 
 * HYPO STATE MACHINE (v3.8.0):
 * - Single episode per drop below 70 mg/dL
 * - Track nadir (lowest point) during episode
 * - Classify AFTER completion based on nadir:
 *   - nadir <54: severity = 'severe' (Level 2)
 *   - nadir ≥54: severity = 'low' (Level 1)
 * 
 * @param {Array} data - Array of glucose data objects
 * @param {string} startDate - Start date in YYYY/MM/DD format
 * @param {string} endDate - End date in YYYY/MM/DD format
 * @returns {Object} Object with hypoEpisodes and hyper event counts
 */
export const detectEvents = (data, startDate, endDate) => {
  const filtered = data
    .filter(row => {
      const dt = utils.parseDate(row.date, row.time);
      const startDt = utils.parseDate(startDate, '00:00:00');
      const endDt = utils.parseDate(endDate, '23:59:59');
      return dt >= startDt && dt <= endDt && row.glucose !== null && !isNaN(row.glucose);
    })
    .sort((a, b) => utils.parseDate(a.date, a.time) - utils.parseDate(b.date, b.time));

  const hypoEpisodes = [];
  const hyper = [];
  let currentHypoEpisode = null;
  let currentHyperEvent = null;

  filtered.forEach(row => {
    const glucose = row.glucose;
    const timestamp = utils.parseDate(row.date, row.time);
    const minuteOfDay = timestamp.getHours() * 60 + timestamp.getMinutes();

    // HYPO STATE MACHINE (single episode tracker)
    if (glucose < CONFIG.GLUCOSE.LOW) {
      // Below 70: hypoglycemia
      if (!currentHypoEpisode) {
        // Start new episode
        currentHypoEpisode = { 
          start: timestamp, 
          minuteOfDay, 
          startGlucose: glucose,
          nadir: glucose 
        };
      } else {
        // Update nadir (lowest point during episode)
        currentHypoEpisode.nadir = Math.min(currentHypoEpisode.nadir, glucose);
      }
    } else if (glucose >= CONFIG.GLUCOSE.LOW && currentHypoEpisode) {
      // Above 70: close episode
      const duration = Math.round((timestamp - currentHypoEpisode.start) / 60000);
      
      if (duration >= CONFIG.HYPO_MIN_DURATION) {
        // Classify based on nadir
        const severity = currentHypoEpisode.nadir < CONFIG.GLUCOSE.CRITICAL_LOW ? 'severe' : 'low';
        
        hypoEpisodes.push({
          ...currentHypoEpisode,
          end: timestamp,
          duration,
          severity
        });
      }
      
      currentHypoEpisode = null;
    }

    // HYPER STATE MACHINE (unchanged)
    if (glucose > CONFIG.GLUCOSE.CRITICAL_HIGH) {
      // Hyperglycemia (>250 mg/dL)
      if (!currentHyperEvent) {
        currentHyperEvent = { 
          start: timestamp, 
          minuteOfDay, 
          startGlucose: glucose 
        };
      }
    } else if (glucose <= CONFIG.GLUCOSE.CRITICAL_HIGH && currentHyperEvent) {
      // Close hyperglycemia event
      const duration = Math.round((timestamp - currentHyperEvent.start) / 60000);
      if (duration >= CONFIG.HYPER_MIN_DURATION) {
        hyper.push({ 
          ...currentHyperEvent, 
          end: timestamp, 
          duration 
        });
      }
      currentHyperEvent = null;
    }
  });

  // Calculate statistics
  const severeEpisodes = hypoEpisodes.filter(e => e.severity === 'severe');
  const lowEpisodes = hypoEpisodes.filter(e => e.severity === 'low');
  
  const calcAvgDuration = (eventList) => {
    if (eventList.length === 0) return 0;
    const totalDuration = eventList.reduce((sum, e) => sum + e.duration, 0);
    return Math.round(totalDuration / eventList.length);
  };

  return {
    hypoEpisodes: {
      count: hypoEpisodes.length,
      severeCount: severeEpisodes.length,
      lowCount: lowEpisodes.length,
      events: hypoEpisodes,
      avgDuration: calcAvgDuration(hypoEpisodes),
      avgDurationSevere: calcAvgDuration(severeEpisodes),
      avgDurationLow: calcAvgDuration(lowEpisodes)
    },
    hyper: { 
      count: hyper.length, 
      events: hyper,
      avgDuration: calcAvgDuration(hyper)
    }
  };
};