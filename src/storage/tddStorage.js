/**
 * TDD (Total Daily Dose) Storage
 * 
 * Stores daily insulin totals calculated from CSV imports.
 * Used for 500/1800 rule calculations and TDD trends.
 * 
 * Extracted from masterDatasetStorage.js (v4.4.1)
 */

import { STORES, getRecord, putRecord, deleteRecord } from './db.js';

/**
 * Save TDD data to IndexedDB
 * @param {Object} data - { tddByDay, tddStats, validation }
 */
export async function saveTDDData(data) {
  if (!data || !data.tddByDay) {
    return;
  }

  await putRecord(STORES.SETTINGS, {
    key: 'tdd_data',
    tddByDay: data.tddByDay,
    tddStats: data.tddStats || null,
    validation: data.validation || null,
    lastUpdated: Date.now()
  });
}

/**
 * Load TDD data from IndexedDB
 * @returns {Object|null} { tddByDay, tddStats, validation } or null
 */
export async function loadTDDData() {
  const record = await getRecord(STORES.SETTINGS, 'tdd_data');
  
  if (!record || !record.tddByDay) {
    return null;
  }
  
  return {
    tddByDay: record.tddByDay,
    tddStats: record.tddStats,
    validation: record.validation,
    lastUpdated: record.lastUpdated
  };
}

/**
 * Delete all TDD data
 */
export async function deleteTDDData() {
  await deleteRecord(STORES.SETTINGS, 'tdd_data');
}

export default {
  saveTDDData,
  loadTDDData,
  deleteTDDData
};
