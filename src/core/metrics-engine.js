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
  MODD_COVERAGE_THRESHOLD: 0.7,
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
  const byDay = {};
  glucoseRows.forEach(r => {
    if (!byDay[r.date]) byDay[r.date] = [];
    byDay[r.date].push({ t: utils.parseDate(r.date, r.time), g: r.glucose });
  });
  
  const dailyMAGE = [];
  Object.values(byDay).forEach(dayData => {
    const daySeries = dayData.sort((a, b) => a.t - b.t).map(x => x.g);
    if (daySeries.length < 3) return;
    
    // Find extrema (local minima and maxima)
    const dayExtrema = [];
    for (let i = 1; i < daySeries.length - 1; i++) {
      const prev = daySeries[i - 1];
      const curr = daySeries[i];
      const next = daySeries[i + 1];
      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        dayExtrema.push({ value: curr, isPeak: curr > prev });
      }
    }
    
    // Calculate excursions between alternating peaks/troughs
    const dayExcursions = [];
    for (let k = 1; k < dayExtrema.length; k++) {
      const e1 = dayExtrema[k - 1];
      const e2 = dayExtrema[k];
      if (e1.isPeak === e2.isPeak) continue; // Skip same-type extrema
      const amp = Math.abs(e2.value - e1.value);
      if (amp >= sd - 1e-9) { // Only count excursions >= 1 SD
        dayExcursions.push(amp);
      }
    }
    
    if (dayExcursions.length > 0) {
      const dayMAGE = dayExcursions.reduce((sum, e) => sum + e, 0) / dayExcursions.length;
      dailyMAGE.push(dayMAGE);
    }
  });
  
  const mage = dailyMAGE.length > 0 
    ? dailyMAGE.reduce((sum, m) => sum + m, 0) / dailyMAGE.length 
    : 0;

  // MODD - Mean Of Daily Differences
  const MODD_BINS = CONFIG.AGP_BINS;
  const dayBins = new Map();
  
  const ensureDay = (date) => {
    if (!dayBins.has(date)) {
      dayBins.set(date, {
        sum: new Float64Array(MODD_BINS),
        count: new Uint16Array(MODD_BINS),
        filled: Array(MODD_BINS).fill(false)
      });
    }
    return dayBins.get(date);
  };
  
  // Bin glucose values by time of day
  glucoseRows.forEach(row => {
    const dt = utils.parseDate(row.date, row.time);
    const minuteOfDay = dt.getHours() * 60 + dt.getMinutes();
    const binIdx = Math.floor(minuteOfDay / 5);
    if (binIdx < 0 || binIdx >= MODD_BINS) return;
    
    const dayData = ensureDay(row.date);
    dayData.sum[binIdx] += row.glucose;
    dayData.count[binIdx] += 1;
    dayData.filled[binIdx] = true;
  });
  
  // Check if a day has sufficient coverage
  const dayHasCoverage = (date) => {
    const dayData = dayBins.get(date);
    if (!dayData) return false;
    const filledCount = dayData.filled.reduce((sum, filled) => sum + (filled ? 1 : 0), 0);
    return filledCount >= Math.round(CONFIG.MODD_COVERAGE_THRESHOLD * MODD_BINS);
  };
  
  // Calculate MODD between consecutive days
  const sortedDates = Array.from(dayBins.keys()).sort();
  let moddSum = 0;
  let moddCount = 0;
  
  for (let d = 0; d < sortedDates.length - 1; d++) {
    const date1 = sortedDates[d];
    const date2 = sortedDates[d + 1];
    
    if (!dayHasCoverage(date1) || !dayHasCoverage(date2)) continue;
    
    const day1 = dayBins.get(date1);
    const day2 = dayBins.get(date2);
    
    for (let bin = 0; bin < MODD_BINS; bin++) {
      if (day1.count[bin] > 0 && day2.count[bin] > 0) {
        const val1 = day1.sum[bin] / day1.count[bin];
        const val2 = day2.sum[bin] / day2.count[bin];
        moddSum += Math.abs(val2 - val1);
        moddCount++;
      }
    }
  }
  
  const modd = moddCount > 0 ? moddSum / moddCount : 0;
  const uniqueDays = new Set(glucoseRows.map(r => r.date)).size;

  // Calculate data quality metrics
  const expectedReadings = uniqueDays * 288; // 288 readings per day (5-min intervals)
  const actualReadings = glucoseRows.length;
  const missingReadings = expectedReadings - actualReadings;
  const missingPercent = ((missingReadings / expectedReadings) * 100).toFixed(1);
  const uptimePercent = (100 - parseFloat(missingPercent)).toFixed(1);
  
  // Count complete days (days with 288 readings)
  const readingsPerDay = {};
  glucoseRows.forEach(r => {
    readingsPerDay[r.date] = (readingsPerDay[r.date] || 0) + 1;
  });
  const completeDays = Object.values(readingsPerDay).filter(count => count === 288).length;

  // Performance timing - end
  const perfEnd = performance.now();
  const perfDuration = Math.round(perfEnd - perfStart);
  
  // Log warning if calculation took >1s
  if (perfDuration > 1000) {
    console.warn(`[Metrics] Calculation took ${perfDuration}ms (target: <1000ms for 90-day data)`);
  } else {
    console.log(`[Metrics] Calculation completed in ${perfDuration}ms`);
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
    modd: modd.toFixed(1),
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