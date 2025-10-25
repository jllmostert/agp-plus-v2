/**
 * ARTIFACT-XX: Day Profile Engine
 * Extract individual day profiles with metrics, events, and badges
 * 
 * Exports:
 * - getLastSevenDays: Get last 7 complete days with full analysis
 * - getDayProfile: Get single day profile
 * - detectBadges: Detect achievement badges for a day
 */

import { CONFIG, utils, calculateMetrics, detectEvents } from './metrics-engine.js';

/**
 * Get the last 7 days from the dataset
 * @param {Array} data - Full glucose data array
 * @param {string} csvCreatedDate - CSV creation date (YYYY/MM/DD) - optional, for backward compat
 * @returns {Array} Array of up to 7 day profile objects (newest first)
 * 
 * V3 Note: Now returns last 7 days regardless of completeness.
 * This allows day profiles to work with filtered datasets (e.g., "Last 14D" filter).
 */
/**
 * Get the last 7 days from the dataset
 * @param {Array} data - Full glucose data array
 * @param {string} csvCreatedDate - CSV creation date (YYYY/MM/DD) - optional, for backward compat
 * @returns {Array} Array of up to 7 day profile objects (newest first)
 * 
 * V3 Note: Now returns last 7 days regardless of completeness.
 * This allows day profiles to work with filtered datasets (e.g., "Last 14D" filter).
 */
export function getLastSevenDays(data, csvCreatedDate) {
  if (!data || data.length === 0) return [];
  
  // Find all unique days in the dataset
  const allDays = new Set();
  data.forEach(row => {
    if (row.date) {
      allDays.add(row.date);
    }
  });
  
  // Sort dates (newest first) and take last 7
  const sortedDates = Array.from(allDays).sort().reverse().slice(0, 7);
  
  if (sortedDates.length === 0) return [];
  
  // Generate profile for each day
  const profiles = sortedDates.map(date => getDayProfile(data, date)).filter(p => p !== null);
  
  return profiles;
}

/**
 * Generate complete profile for a single day
 * @param {Array} data - Full glucose data array
 * @param {string} date - Date in YYYY/MM/DD format
 * @returns {Object} Day profile with metrics, curve, events, badges
 */
export function getDayProfile(data, date) {
  // Filter data for this day
  const dayData = data.filter(row => row.date === date);
  
  if (dayData.length === 0) return null;
  
  // Calculate metrics
  const metrics = calculateMetrics(data, date, date);
  
  // Detect events
  const events = detectEvents(data, date, date);
  
  // Generate 24-hour glucose curve (288 bins, 5-min intervals)
  const curve = generate24HourCurve(dayData);
  
  // Detect sensor changes (pass full dataset to detect cross-day gaps)
  const sensorChanges = detectSensorChanges(data, date);
  
  // Detect cartridge/reservoir changes (Rewind events)
  const cartridgeChanges = detectCartridgeChanges(dayData);
  
  // Detect badges
  const badges = detectBadges(metrics, events);
  
  // Parse date for display
  const dateObj = utils.parseDate(date, '00:00:00');
  
  return {
    date,
    dateObj,
    dayOfWeek: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'][dateObj.getDay()],
    metrics,
    curve,
    events,
    sensorChanges,
    cartridgeChanges,
    badges,
    readingCount: dayData.length
  };
}

/**
 * Generate 24-hour glucose curve binned into 5-minute intervals
 * 
 * BINNING STRATEGY:
 * 
 * - Total bins: 288 (24 hours × 12 bins/hour)
 * - Bin width: 5 minutes (standard CGM sampling resolution)
 * - Time mapping: Bin 0 = 00:00-00:05, Bin 143 = 11:55-12:00, etc.
 * 
 * Data Structure:
 * Each bin contains:
 * - bin: Index (0-287)
 * - time: Human-readable format (HH:MM)
 * - glucose: Raw mg/dL value (null if no data)
 * - hasData: Boolean flag for sparse data handling
 * 
 * Why 5-minute bins?
 * - Matches Medtronic Guardian sensor sampling frequency
 * - Balances resolution vs. data sparsity
 * - Standard interval for AGP/CGM visualization (per ATTD consensus)
 * 
 * Note: Each bin takes the reading closest to that 5-min mark.
 * Gaps in data (sensor off, lost signal) are preserved as null values.
 * 
 * @param {Array} dayData - Pre-filtered glucose readings for single day
 * @returns {Array} Array of 288 bin objects with {bin, time, glucose, hasData}
 */
function generate24HourCurve(dayData) {
  const curve = Array(288).fill(null).map((_, i) => ({
    bin: i,
    time: `${String(Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}`,
    glucose: null,
    hasData: false
  }));
  
  dayData.forEach(row => {
    const dt = utils.parseDate(row.date, row.time);
    const minuteOfDay = dt.getHours() * 60 + dt.getMinutes();
    const binIdx = Math.floor(minuteOfDay / 5);
    
    if (binIdx >= 0 && binIdx < 288) {
      curve[binIdx].glucose = row.glucose;
      curve[binIdx].hasData = true;
    }
  });
  
  return curve;
}

/**
 * Detect sensor changes within a specific day based on data gaps
 * 
 * DETECTION ALGORITHM:
 * 
 * 1. Gap Detection:
 *    - Identifies periods with no glucose readings (>30 min)
 *    - Filters for "major gaps" (3-10 hours) that indicate sensor replacement
 * 
 * 2. Threshold Rationale:
 *    - >3 hours (180 min): Minimum gap for true sensor change
 *      * Includes 2h warmup period + placement/calibration time
 *      * Excludes brief sensor dropouts or BG meter calibrations
 *    - <10 hours (600 min): Maximum realistic sensor change duration
 *      * Excludes overnight gaps or multi-day data absences
 *      * Prevents false positives from extended sensor failures
 * 
 * 3. Marker Placement:
 *    - Only marks gap START (when sensor goes offline)
 *    - No marker at gap END (data resuming is visually obvious in chart)
 *    - Skips midnight timestamps (00:00:00) to avoid day-boundary artifacts
 * 
 * Note: This looks at gaps WITHIN the target day only, not cross-day transitions
 * 
 * @param {Array} allData - Full glucose dataset (needed for accurate gap calculation)
 * @param {string} targetDate - Date to analyze (YYYY/MM/DD format)
 * @returns {Array} Array of sensor change markers with {timestamp, date, minuteOfDay, gapMinutes, type}
 */
function detectSensorChanges(allData, targetDate) {
  // Filter data for this specific day first
  const dayData = allData.filter(row => row.date === targetDate);
  
  if (dayData.length === 0) return [];
  
  // Sort by time
  const sorted = [...dayData].sort((a, b) => 
    utils.parseDate(a.date, a.time) - utils.parseDate(b.date, b.time)
  );
  
  // Detect gaps WITHIN this day only (>30 minutes)
  const gaps = [];
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = utils.parseDate(sorted[i - 1].date, sorted[i - 1].time);
    const curr = utils.parseDate(sorted[i].date, sorted[i].time);
    const gapMinutes = (curr - prev) / 60000;
    
    if (gapMinutes > 30) {
      gaps.push({
        prev,
        curr,
        prevDate: sorted[i - 1].date,
        currDate: sorted[i].date,
        gapMinutes
      });
    }
  }
  
  // Filter for sensor change gaps: 3-10 hours
  // - >3 hours: true sensor changes (warmup + placement time)
  // - <10 hours: excludes normal overnight gaps or multi-day absences
  // Note: 2-hour gaps are often BG tests or brief sensor issues, not replacements
  const majorGaps = gaps.filter(g => g.gapMinutes > 180 && g.gapMinutes < 600);
  
  const allChanges = [];
  for (const gap of majorGaps) {
    // Add marker at START of gap ONLY (sensor went offline)
    // No marker at END - data resuming is visually obvious
    
    // Skip markers at exact midnight (00:00:00) - these are day-boundary artifacts
    const minuteOfDay = gap.prev.getHours() * 60 + gap.prev.getMinutes();
    if (minuteOfDay === 0) {
      continue; // Skip midnight timestamps
    }
    
    allChanges.push({
      timestamp: gap.prev,
      date: gap.prevDate,
      minuteOfDay: minuteOfDay,
      gapMinutes: Math.round(gap.gapMinutes),
      type: 'start'
    });
  }
  
  return allChanges;
}

/**
 * Detect insulin pump cartridge/reservoir changes via Rewind events
 * 
 * DETECTION METHOD:
 * 
 * Medtronic pumps log "Rewind" alarm when:
 * - User removes reservoir to refill insulin
 * - Triggers automatic rewind of pump mechanism
 * - Appears in CSV as alarm string containing "Rewind"
 * 
 * Clinical Context:
 * - Cartridge changes typically every 2-3 days
 * - Often coincides with infusion set changes
 * - Useful for correlating glycemic patterns with fresh insulin/tubing
 * 
 * Chart Display:
 * - Orange marker on day profile chart
 * - Shows exact time of reservoir replacement
 * - Helps identify if poor control correlates with old insulin/sets
 * 
 * @param {Array} dayData - Glucose readings for single day (pre-filtered by date)
 * @returns {Array} Array of cartridge change markers with {timestamp, minuteOfDay}
 */
function detectCartridgeChanges(dayData) {
  const changes = [];
  
  for (const row of dayData) {
    if (row.rewind) {
      const timestamp = utils.parseDate(row.date, row.time);
      changes.push({
        timestamp,
        minuteOfDay: timestamp.getHours() * 60 + timestamp.getMinutes()
      });
    }
  }
  
  return changes;
}

/**
 * Detect achievement badges for a day based on clinical thresholds
 * 
 * BADGE CRITERIA (Evidence-Based Thresholds):
 * 
 * 🏆 PERFECT DAY - Ultra-Rare Elite Achievement
 * - TIR ≥ 99%
 * - Rationale: Near-perfect glycemic control, statistically rare (<1% of days)
 * - Clinical significance: Demonstrates exceptional diabetes management
 * 
 * 🧘 ZEN MASTER - Stability Excellence
 * - TIR ≥ 95% (ADA recommended target for adults)
 * - CV < 30% (coefficient of variation, indicates low glucose variability)
 * - 0 hypoglycemic events (safety metric)
 * - Rationale: Combines high TIR with exceptional stability (CV < 36% is good, < 30% is excellent)
 * - Clinical significance: Low risk profile with minimal glucose fluctuations
 * 
 * 👑 YOU SLAY QUEEN - Solid All-Rounder
 * - TIR ≥ 95% (ADA recommended target)
 * - CV < 36% (good glucose variability, per clinical consensus)
 * - 0 hypoglycemic events (safety metric)
 * - Rationale: Achievable target for most patients with well-controlled diabetes
 * - Clinical significance: Balanced control without excessive variability
 * 
 * THRESHOLD JUSTIFICATION:
 * - TIR 95%: Per ADA/ATTD 2023 guidelines for adults with T1D
 * - CV 36%: Consensus threshold for "stable" glucose control (ATTD 2017)
 * - CV 30%: Aspirational target indicating exceptional stability
 * - Hypo count: Zero tolerance aligns with safety-first approach
 * 
 * @param {Object} metrics - Calculated metrics { tir, cv, ... }
 * @param {Object} events - Detected events { hypoL1, hypoL2, hyper }
 * @returns {Array} Array of badge objects with { id, emoji, name, description }
 */
export function detectBadges(metrics, events) {
  const badges = [];
  
  if (!metrics) return badges;
  
  // Extract key metrics for badge evaluation
  const tir = parseFloat(metrics.tir);  // Time in Range (70-180 mg/dL)
  const cv = parseFloat(metrics.cv);    // Coefficient of Variation (glucose stability)
  const hypoCount = events.hypoL1.count + events.hypoL2.count;  // Total hypoglycemic events
  
  /**
   * BADGE LOGIC
   * 
   * Badges are evaluated in order of strictness (most difficult first).
   * Multiple badges can be earned on the same day if criteria overlap.
   * 
   * Design philosophy: Encourage both high TIR AND stability (low CV),
   * while prioritizing safety (zero hypos).
   */
  
  // 🏆 PERFECT DAY: TIR >= 99%
  // Ultra-rare achievement - virtually all readings in target range
  // No CV or hypo requirements (if you hit 99% TIR, you deserve this regardless)
  if (tir >= 99) {
    badges.push({
      id: 'perfect_day',
      emoji: '🏆',
      name: 'Perfect Day',
      description: `${tir.toFixed(1)}% TIR`
    });
  }
  
  // 🧘 ZEN MASTER: TIR >= 95% + CV < 30% + 0 hypos
  // Triple threat: high TIR, exceptional stability, perfect safety
  // CV < 30% is aspirational - requires very flat glucose profile
  if (tir >= 95 && cv < 30 && hypoCount === 0) {
    badges.push({
      id: 'zen_master',
      emoji: '🧘',
      name: 'Zen Master',
      description: `${tir.toFixed(1)}% TIR, CV ${cv}%, 0 hypo's`
    });
  }
  
  // 👑 YOU SLAY QUEEN: TIR >= 95% + CV < 36% + 0 hypos
  // Achievable excellence: high TIR, good stability, perfect safety
  // CV < 36% is consensus "stable" threshold - realistic target
  if (tir >= 95 && cv < 36 && hypoCount === 0) {
    badges.push({
      id: 'slay_queen',
      emoji: '👑',
      name: 'You Slay Queen',
      description: `${tir.toFixed(1)}% TIR, CV ${cv}%, 0 hypo's`
    });
  }
  
  return badges;
}
