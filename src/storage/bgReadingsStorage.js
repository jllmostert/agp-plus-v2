/**
 * BG Readings Storage (Fingerprick/Meter)
 * 
 * Stores manual blood glucose readings from:
 * - Fingerprick measurements
 * - External glucose meters
 * - Manual input to pump
 * 
 * These are separate from CGM sensor readings and provide
 * calibration/verification data points.
 * 
 * Created: v4.4.1
 */

import { STORES, getRecord, putRecord, deleteRecord } from './db.js';

const STORAGE_KEY = 'bg_readings';

/**
 * BG Reading structure:
 * {
 *   timestamp: Date,     // When the reading was taken
 *   value: number,       // BG value in mg/dL
 *   source: string,      // 'fingerprick' | 'meter' | 'manual'
 *   sourceFile: string   // CSV filename that contained this reading
 * }
 */

/**
 * Get all stored BG readings
 * @returns {Array} Array of BG reading objects
 */
export async function getAllBGReadings() {
  const record = await getRecord(STORES.SETTINGS, STORAGE_KEY);
  return record?.readings || [];
}

/**
 * Add BG readings from CSV import
 * Deduplicates by timestamp
 * @param {Array} newReadings - Array of { timestamp, value, source, sourceFile }
 * @returns {Object} { added: number, duplicates: number }
 */
export async function addBGReadings(newReadings) {
  if (!newReadings || newReadings.length === 0) {
    return { added: 0, duplicates: 0 };
  }

  const existing = await getAllBGReadings();
  const existingTimestamps = new Set(
    existing.map(r => new Date(r.timestamp).getTime())
  );

  let added = 0;
  let duplicates = 0;

  const toAdd = newReadings.filter(reading => {
    const ts = new Date(reading.timestamp).getTime();
    if (existingTimestamps.has(ts)) {
      duplicates++;
      return false;
    }
    existingTimestamps.add(ts);
    added++;
    return true;
  });

  if (toAdd.length > 0) {
    const merged = [...existing, ...toAdd].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    await putRecord(STORES.SETTINGS, {
      key: STORAGE_KEY,
      readings: merged,
      lastUpdated: Date.now()
    });
  }

  return { added, duplicates };
}

/**
 * Get BG readings for a specific date range
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {Array} Filtered BG readings
 */
export async function getBGReadingsInRange(startDate, endDate) {
  const readings = await getAllBGReadings();
  const start = new Date(startDate);
  const end = new Date(endDate);

  return readings.filter(r => {
    const ts = new Date(r.timestamp);
    return ts >= start && ts <= end;
  });
}

/**
 * Get BG readings for a specific date (for day profiles)
 * @param {Date} date - The date to get readings for
 * @returns {Array} BG readings for that day
 */
export async function getBGReadingsForDate(date) {
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
  
  return getBGReadingsInRange(startOfDay, endOfDay);
}

/**
 * Delete BG readings in a date range
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {Object} { deleted: number }
 */
export async function deleteBGReadingsInRange(startDate, endDate) {
  const readings = await getAllBGReadings();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const filtered = readings.filter(r => {
    const ts = new Date(r.timestamp);
    return ts < start || ts > end;
  });

  const deleted = readings.length - filtered.length;

  if (deleted > 0) {
    if (filtered.length > 0) {
      await putRecord(STORES.SETTINGS, {
        key: STORAGE_KEY,
        readings: filtered,
        lastUpdated: Date.now()
      });
    } else {
      await deleteRecord(STORES.SETTINGS, STORAGE_KEY);
    }
  }

  return { deleted };
}

/**
 * Delete all BG readings
 */
export async function deleteAllBGReadings() {
  await deleteRecord(STORES.SETTINGS, STORAGE_KEY);
}

/**
 * Get statistics about stored BG readings
 * @returns {Object} { total, dateRange, avgPerDay }
 */
export async function getBGReadingsStats() {
  const readings = await getAllBGReadings();
  
  if (readings.length === 0) {
    return { total: 0, dateRange: null, avgPerDay: 0 };
  }

  const timestamps = readings.map(r => new Date(r.timestamp));
  const earliest = new Date(Math.min(...timestamps));
  const latest = new Date(Math.max(...timestamps));
  const days = Math.max(1, Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24)));

  return {
    total: readings.length,
    dateRange: { start: earliest, end: latest },
    avgPerDay: (readings.length / days).toFixed(1)
  };
}

export default {
  getAllBGReadings,
  addBGReadings,
  getBGReadingsInRange,
  getBGReadingsForDate,
  deleteBGReadingsInRange,
  deleteAllBGReadings,
  getBGReadingsStats
};
