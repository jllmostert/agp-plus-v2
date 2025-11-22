/**
 * ProTime Workdays Storage
 * 
 * Stores workday dates from ProTime PDF imports.
 * Used for work/rest day glucose analysis.
 * 
 * Extracted from masterDatasetStorage.js (v4.4.1)
 */

import { STORES, getRecord, putRecord, deleteRecord } from './db.js';

/**
 * Save ProTime workdays to IndexedDB
 * @param {Set} workdaySet - Set of date strings (YYYY/MM/DD format)
 */
export async function saveProTimeData(workdaySet) {
  if (!workdaySet || workdaySet.size === 0) {
    return;
  }

  const workdayArray = Array.from(workdaySet);
  
  await putRecord(STORES.SETTINGS, {
    key: 'protime_workdays',
    workdays: workdayArray,
    lastUpdated: Date.now()
  });
}

/**
 * Load ProTime workdays from IndexedDB
 * @returns {Set|null} Set of date strings or null if not found
 */
export async function loadProTimeData() {
  const record = await getRecord(STORES.SETTINGS, 'protime_workdays');
  
  if (!record || !record.workdays) {
    return null;
  }
  
  return new Set(record.workdays);
}

/**
 * Delete all ProTime workdays
 */
export async function deleteProTimeData() {
  await deleteRecord(STORES.SETTINGS, 'protime_workdays');
}

/**
 * Delete ProTime data within a date range
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {Object} { deleted: number }
 */
export async function deleteProTimeDataInRange(startDate, endDate) {
  const workdays = await loadProTimeData();
  
  if (!workdays || workdays.size === 0) {
    return { deleted: 0 };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  let deleted = 0;

  // Filter out dates in range
  const filtered = new Set();
  for (const dateStr of workdays) {
    // Parse YYYY/MM/DD format
    const [year, month, day] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (date >= start && date <= end) {
      deleted++;
    } else {
      filtered.add(dateStr);
    }
  }

  // Save filtered set (or delete if empty)
  if (filtered.size > 0) {
    await saveProTimeData(filtered);
  } else {
    await deleteProTimeData();
  }

  return { deleted };
}

export default {
  saveProTimeData,
  loadProTimeData,
  deleteProTimeData,
  deleteProTimeDataInRange
};
