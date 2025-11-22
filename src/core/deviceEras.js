/**
 * Device Era / Season Definitions
 * 
 * Tracks pump and transmitter combinations over time to analyze
 * sensor performance per hardware configuration.
 * 
 * V2: Now loads from IndexedDB via seasonStorage.js
 * Fallback to hardcoded defaults if storage unavailable.
 * 
 * Created: 2025-11-21
 * Updated: 2025-11-21 - IndexedDB integration
 */

import * as seasonStorage from '../storage/seasonStorage.js';

// =============================================================================
// FALLBACK DEFAULTS (used before storage is initialized)
// =============================================================================

const FALLBACK_SEASONS = [
  {
    id: 'season_1', season: 1, name: 'Tulp',
    start: '2022-03-01T00:00:00', end: '2023-03-20T00:00:00',
    pump: { serial: 'NG2576004H', name: 'Tulp', number: 1, hw_version: 'A1.01', fw_version: '3.13.9' },
    transmitter: { serial: null, number: 1 }
  },
  {
    id: 'season_2', season: 2, name: 'Tulp',
    start: '2023-03-20T00:00:00', end: '2025-07-10T00:00:00',
    pump: { serial: 'NG2576004H', name: 'Tulp', number: 1, hw_version: 'A1.01', fw_version: '3.13.9' },
    transmitter: { serial: 'GT8917250N', number: 2 }
  },
  {
    id: 'season_3', season: 3, name: 'Lavendel',
    start: '2025-07-10T00:00:00', end: '2025-10-09T00:00:00',
    pump: { serial: 'NG4114235H', name: 'Lavendel', number: 2, hw_version: 'A2.01', fw_version: '8.13.2' },
    transmitter: { serial: 'GT8917250N', number: 2 }
  },
  {
    id: 'season_4', season: 4, name: 'Lavendel',
    start: '2025-10-09T00:00:00', end: '2025-11-21T00:00:00',
    pump: { serial: 'NG4114235H', name: 'Lavendel', number: 2, hw_version: 'A2.01', fw_version: '8.13.2' },
    transmitter: { serial: 'GT9833065M', number: 3 }
  },
  {
    id: 'season_5', season: 5, name: 'Zonnebloem',
    start: '2025-11-21T00:00:00', end: null,
    pump: { serial: 'NG4231472H', name: 'Zonnebloem', number: 3, hw_version: 'A2.01', fw_version: '22.13.3' },
    transmitter: { serial: 'GT9833065M', number: 3 }
  }
];

// =============================================================================
// RUNTIME CACHE (populated from storage)
// =============================================================================

let seasonsCache = null;
let initialized = false;

/**
 * Initialize seasons from storage
 * Call this early in app startup
 */
export async function initDeviceEras() {
  if (initialized) return seasonsCache;
  
  try {
    seasonsCache = await seasonStorage.initSeasons();
    initialized = true;

  } catch (error) {
    console.error('[deviceEras] Failed to load from storage, using fallback:', error);
    seasonsCache = FALLBACK_SEASONS;
  }
  
  return seasonsCache;
}

// =============================================================================
// SYNC ACCESSORS (use cache, fallback to defaults)
// =============================================================================

/**
 * Get all seasons (sync - uses cache)
 * @deprecated Use async getAllSeasonsAsync() for guaranteed fresh data
 */
export function getDeviceEras() {
  return seasonsCache || FALLBACK_SEASONS;
}

// Legacy export for backward compatibility
export const DEVICE_ERAS = FALLBACK_SEASONS;

/**
 * Find season for a given date (sync)
 */
export function getEraForDate(date) {
  const seasons = getDeviceEras();
  const checkDate = new Date(date);
  
  for (const season of seasons) {
    const start = new Date(season.start);
    const end = season.end ? new Date(season.end) : new Date('2099-12-31');
    
    if (checkDate >= start && checkDate < end) {
      return season;
    }
  }
  
  return null;
}

/**
 * Get season by ID (sync)
 */
export function getEraById(eraId) {
  const seasons = getDeviceEras();
  return seasons.find(s => s.id === eraId) || null;
}

/**
 * Get current active season (sync)
 */
export function getCurrentEra() {
  const seasons = getDeviceEras();
  return seasons.find(s => s.end === null) || null;
}

// =============================================================================
// GROUPING HELPERS (for statistics)
// =============================================================================

/**
 * Group sensors by season
 */
export function groupSensorsByEra(sensors) {
  const seasons = getDeviceEras();
  const grouped = {};
  
  // Initialize all seasons
  seasons.forEach(s => {
    grouped[s.id] = [];
  });
  grouped['unknown'] = [];
  
  // Group sensors
  sensors.forEach(sensor => {
    const season = getEraForDate(sensor.start_date);
    const key = season ? season.id : 'unknown';
    grouped[key].push(sensor);
  });
  
  return grouped;
}

/**
 * Group sensors by pump serial
 */
export function groupSensorsByPump(sensors) {
  const seasons = getDeviceEras();
  const grouped = {};
  
  sensors.forEach(sensor => {
    const season = getEraForDate(sensor.start_date);
    const pumpSerial = season?.pump.serial || 'unknown';
    
    if (!grouped[pumpSerial]) {
      grouped[pumpSerial] = [];
    }
    grouped[pumpSerial].push(sensor);
  });
  
  return grouped;
}

/**
 * Group sensors by transmitter serial
 */
export function groupSensorsByTransmitter(sensors) {
  const seasons = getDeviceEras();
  const grouped = {};
  
  sensors.forEach(sensor => {
    const season = getEraForDate(sensor.start_date);
    const txSerial = season?.transmitter.serial || 'unknown';
    
    if (!grouped[txSerial]) {
      grouped[txSerial] = [];
    }
    grouped[txSerial].push(sensor);
  });
  
  return grouped;
}

// =============================================================================
// ASYNC CRUD (delegates to seasonStorage)
// =============================================================================

export async function getAllSeasonsAsync() {
  return await seasonStorage.getAllSeasons();
}

export async function addSeason(seasonData) {
  const result = await seasonStorage.addSeason(seasonData);
  seasonsCache = await seasonStorage.getAllSeasons();
  return result;
}

export async function updateSeason(id, updates) {
  const result = await seasonStorage.updateSeason(id, updates);
  seasonsCache = await seasonStorage.getAllSeasons();
  return result;
}

export async function deleteSeason(id) {
  const result = await seasonStorage.deleteSeason(id);
  seasonsCache = await seasonStorage.getAllSeasons();
  return result;
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  DEVICE_ERAS: FALLBACK_SEASONS,
  initDeviceEras,
  getDeviceEras,
  getEraForDate,
  getEraById,
  getCurrentEra,
  groupSensorsByEra,
  groupSensorsByPump,
  groupSensorsByTransmitter,
  getAllSeasonsAsync,
  addSeason,
  updateSeason,
  deleteSeason
};
