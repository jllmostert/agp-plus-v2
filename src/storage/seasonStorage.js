/**
 * Season Storage Module
 * 
 * Manages device seasons (pump + transmitter combinations) in IndexedDB.
 * Replaces hardcoded DEVICE_ERAS with editable storage.
 * 
 * Created: 2025-11-21
 */

import { openDB, STORES, getAllRecords, getRecord, putRecord, deleteRecord } from './db.js';

// Default seasons - seeded on first load
const DEFAULT_SEASONS = [
  {
    id: 'season_1',
    season: 1,
    name: 'Tulp',
    start: '2022-03-01T00:00:00',
    end: '2023-03-20T00:00:00',
    pump: {
      serial: 'NG2576004H',
      name: 'Tulp',
      hw_version: 'A1.01',
      fw_version: '3.13.9'
    },
    transmitter: {
      serial: null,
      number: 1
    }
  },
  {
    id: 'season_2',
    season: 2,
    name: 'Tulp',
    start: '2023-03-20T00:00:00',
    end: '2025-07-10T00:00:00',
    pump: {
      serial: 'NG2576004H',
      name: 'Tulp',
      hw_version: 'A1.01',
      fw_version: '3.13.9'
    },
    transmitter: {
      serial: 'GT8917250N',
      number: 2
    }
  },
  {
    id: 'season_3',
    season: 3,
    name: 'Lavendel',
    start: '2025-07-10T00:00:00',
    end: '2025-10-09T00:00:00',
    pump: {
      serial: 'NG4114235H',
      name: 'Lavendel',
      hw_version: 'A2.01',
      fw_version: '8.13.2'
    },
    transmitter: {
      serial: 'GT8917250N',
      number: 2
    }
  },
  {
    id: 'season_4',
    season: 4,
    name: 'Lavendel',
    start: '2025-10-09T00:00:00',
    end: '2025-11-21T00:00:00',
    pump: {
      serial: 'NG4114235H',
      name: 'Lavendel',
      hw_version: 'A2.01',
      fw_version: '8.13.2'
    },
    transmitter: {
      serial: 'GT9833065M',
      number: 3
    }
  },
  {
    id: 'season_5',
    season: 5,
    name: 'Zonnebloem',
    start: '2025-11-21T00:00:00',
    end: null,
    pump: {
      serial: 'NG4231472H',
      name: 'Zonnebloem',
      hw_version: 'A2.01',
      fw_version: '22.13.3'
    },
    transmitter: {
      serial: 'GT9833065M',
      number: 3
    }
  }
];

// ============================================================================
// INITIALIZATION
// ============================================================================

let seasonsCache = null;

/**
 * Initialize seasons - seed if empty
 */
export async function initSeasons() {
  const existing = await getAllRecords(STORES.SEASONS);
  
  if (!existing || existing.length === 0) {

    for (const season of DEFAULT_SEASONS) {
      await putRecord(STORES.SEASONS, season);
    }
    seasonsCache = [...DEFAULT_SEASONS];

  } else {
    seasonsCache = existing.sort((a, b) => a.season - b.season);

  }
  
  return seasonsCache;
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get all seasons (sorted by season number)
 */
export async function getAllSeasons() {
  if (!seasonsCache) {
    await initSeasons();
  }
  return seasonsCache;
}

/**
 * Get season by ID
 */
export async function getSeasonById(id) {
  const seasons = await getAllSeasons();
  return seasons.find(s => s.id === id) || null;
}

/**
 * Get season for a specific date
 */
export async function getSeasonForDate(date) {
  const seasons = await getAllSeasons();
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
 * Get current active season
 */
export async function getCurrentSeason() {
  const seasons = await getAllSeasons();
  return seasons.find(s => s.end === null) || null;
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Add new season
 */
export async function addSeason(seasonData) {
  const seasons = await getAllSeasons();
  const maxSeason = Math.max(...seasons.map(s => s.season), 0);
  
  const newSeason = {
    id: `season_${maxSeason + 1}`,
    season: maxSeason + 1,
    name: seasonData.name,
    start: seasonData.start,
    end: seasonData.end || null,
    pump: seasonData.pump,
    transmitter: seasonData.transmitter,
    created_at: new Date().toISOString()
  };
  
  await putRecord(STORES.SEASONS, newSeason);
  seasonsCache = [...seasonsCache, newSeason].sort((a, b) => a.season - b.season);
  
  return newSeason;
}

/**
 * Update existing season
 */
export async function updateSeason(id, updates) {
  const season = await getSeasonById(id);
  if (!season) return null;
  
  const updated = {
    ...season,
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  await putRecord(STORES.SEASONS, updated);
  seasonsCache = seasonsCache.map(s => s.id === id ? updated : s);
  
  return updated;
}

/**
 * Delete season (only if no sensors linked)
 */
export async function deleteSeason(id) {
  // TODO: Check if any sensors are linked to this season
  await deleteRecord(STORES.SEASONS, id);
  seasonsCache = seasonsCache.filter(s => s.id !== id);
  return { success: true };
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Clear cache (force reload from DB)
 */
export function clearCache() {
  seasonsCache = null;
}

/**
 * Get seasons grouped by pump
 */
export async function getSeasonsByPump() {
  const seasons = await getAllSeasons();
  const grouped = {};
  
  seasons.forEach(s => {
    const pumpSerial = s.pump.serial;
    if (!grouped[pumpSerial]) {
      grouped[pumpSerial] = {
        pump: s.pump,
        seasons: []
      };
    }
    grouped[pumpSerial].seasons.push(s);
  });
  
  return grouped;
}
