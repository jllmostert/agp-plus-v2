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
 * Get the last 7 complete days from the dataset
 * @param {Array} data - Full glucose data array
 * @param {string} csvCreatedDate - CSV creation date (YYYY/MM/DD)
 * @returns {Array} Array of 7 day profile objects (newest first)
 */
export function getLastSevenDays(data, csvCreatedDate) {
  if (!data || data.length === 0) return [];
  
  // Get CSV creation date as cutoff (incomplete day)
  const cutoffDate = utils.parseDate(csvCreatedDate, '00:00:00');
  
  // Find all complete days (before cutoff)
  const completeDays = new Set();
  const readingsPerDay = {};
  
  data.forEach(row => {
    const rowDate = utils.parseDate(row.date, '00:00:00');
    if (rowDate >= cutoffDate) return; // Skip incomplete day
    
    if (!readingsPerDay[row.date]) {
      readingsPerDay[row.date] = 0;
    }
    readingsPerDay[row.date]++;
  });
  
  // Filter for days with reasonable coverage (>= 200 readings, ~70% uptime)
  Object.entries(readingsPerDay).forEach(([date, count]) => {
    if (count >= 200) {
      completeDays.add(date);
    }
  });
  
  // Sort dates and take last 7
  const sortedDates = Array.from(completeDays).sort().reverse().slice(0, 7);
  
  // Generate profile for each day
  const profiles = sortedDates.map(date => getDayProfile(data, date));
  
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
 * Generate 24-hour glucose curve with 5-minute bins
 * @param {Array} dayData - Glucose data for one day
 * @returns {Array} Array of 288 objects with {time, glucose, hasData}
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
 * Detect sensor changes (gaps > 30 minutes)
 * @param {Array} dayData - Glucose data for one day
 * @returns {Array} Array of sensor change events with start and end timestamps
 */
/**
 * Detect sensor changes (gaps > 30 minutes)
 * @param {Array} allData - Full glucose dataset
 * @param {string} targetDate - Date to get changes for (YYYY/MM/DD)
 * @returns {Array} Array of sensor change markers for this day
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
 * Detect cartridge/reservoir changes (Rewind events)
 * @param {Array} dayData - Glucose data for one day
 * @returns {Array} Array of cartridge change timestamps
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
 * Detect achievement badges for a day
 * @param {Object} metrics - Calculated metrics
 * @param {Object} events - Detected events
 * @returns {Array} Array of badge objects
 */
export function detectBadges(metrics, events) {
  const badges = [];
  
  if (!metrics) return badges;
  
  const tir = parseFloat(metrics.tir);
  const cv = parseFloat(metrics.cv);
  const hypoCount = events.hypoL1.count + events.hypoL2.count;
  
  // 🏆 Perfect Day: TIR >= 99% (super strict!)
  if (tir >= 99) {
    badges.push({
      id: 'perfect_day',
      emoji: '🏆',
      name: 'Perfect Day',
      description: `${tir.toFixed(1)}% TIR`
    });
  }
  
  // 🧘 Zen Master: TIR >= 95% + CV < 30% + 0 hypo's (stability master)
  if (tir >= 95 && cv < 30 && hypoCount === 0) {
    badges.push({
      id: 'zen_master',
      emoji: '🧘',
      name: 'Zen Master',
      description: `${tir.toFixed(1)}% TIR, CV ${cv}%, 0 hypo's`
    });
  }
  
  // 👑 You Slay Queen: TIR >= 95% + CV < 36% + 0 hypo's (solid all-rounder)
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
