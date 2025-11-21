/**
 * Pump Settings Storage
 * 
 * Manages MiniMed 780G pump settings storage and retrieval.
 * Settings can be auto-detected from CSV or manually configured.
 * Supports device history for tracking pump/transmitter changes.
 * 
 * @module storage/pumpSettingsStorage
 */

const STORAGE_KEY = 'agp-pump-settings';
const DEVICE_HISTORY_KEY = 'agp-device-history';

/**
 * Default pump settings structure
 */
const DEFAULT_SETTINGS = {
  // Device info (auto-detected from CSV)
  device: {
    model: 'MiniMed 780G',
    serial: '',
    hardwareVersion: '',
    firmwareVersion: '',
    softwareVersion: '',     // Software versie (handmatig, niet in CSV)
    transmitter: '',           // Guardian Sensor type (e.g., "Guardian™ 4 Sensor")
    transmitterSerial: '',     // Transmitter serial number (manual entry)
    transmitterStartDate: null, // When this transmitter was first used
    startDate: null,           // When this pump was first used
  },
  
  // Carb Ratios by time block (g/U)
  // How many grams of carbs 1 unit of insulin covers
  carbRatios: [
    { startTime: '00:00', ratio: 10.0 },
    { startTime: '06:00', ratio: 9.0 },
    { startTime: '17:00', ratio: 8.5 },
  ],
  
  // Insulin Sensitivity Factor by time block (mg/dL/U)
  // How much 1 unit of insulin drops glucose
  insulinSensitivity: [
    { startTime: '00:00', factor: 50 },
  ],
  
  // SmartGuard Auto Mode target (100/110/120 mg/dL)
  // This is NOT in CSV - must be set manually!
  smartGuardTarget: 100,  // User's actual Auto Mode target
  
  // SmartGuard settings
  autocorrection: true,   // Autocorrectie Aan/Uit
  
  // Safety limits
  maxBasalRate: 2.0,      // Max basaal (E/H)
  maxBolus: 10.0,         // Max bolus (E)
  
  // BWZ Target glucose range (mg/dL) - from CSV
  // This is for Manual Mode corrections, NOT SmartGuard
  targetGlucose: {
    low: 90,
    high: 120,
  },
  
  // Active Insulin Time (hours)
  // How long insulin remains active after bolus
  activeInsulinTime: 2.0,
  
  // Basal profile (U/h) - SmartGuard backup
  basalProfile: [
    { startTime: '00:00', rate: 0.55 },
    { startTime: '06:00', rate: 0.60 },
    { startTime: '08:00', rate: 0.70 },
    { startTime: '10:00', rate: 0.90 },
    { startTime: '18:00', rate: 0.85 },
    { startTime: '22:00', rate: 0.80 },
  ],
  
  // Calculated/derived values
  calculated: {
    tdd: null,           // Total Daily Dose (from data)
    tddBasal: null,      // Basal portion
    tddBolus: null,      // Bolus portion
    recommended: {
      cr: null,          // 500/TDD rule
      isf: null,         // 1800/TDD rule
    },
  },
  
  // Metadata
  meta: {
    lastUpdated: null,
    source: 'default',   // 'default', 'csv', 'manual'
    csvDate: null,
    isLocked: false,     // When true, CSV import won't overwrite settings
  },
};

/**
 * Get pump settings from storage
 * @returns {Object} Pump settings object
 */
export function getPumpSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return mergeWithDefaults(parsed);
    }
  } catch (error) {
    console.error('[PumpSettings] Error loading settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save pump settings to storage
 * @param {Object} settings - Settings to save
 */
export function savePumpSettings(settings) {
  try {
    const toSave = {
      ...settings,
      meta: {
        ...settings.meta,
        lastUpdated: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    console.log('[PumpSettings] Settings saved:', toSave.meta.source);
    return true;
  } catch (error) {
    console.error('[PumpSettings] Error saving settings:', error);
    return false;
  }
}

/**
 * Update specific settings fields
 * @param {Object} updates - Partial settings to update
 */
export function updatePumpSettings(updates) {
  const current = getPumpSettings();
  const merged = deepMerge(current, updates);
  merged.meta.source = 'manual';
  return savePumpSettings(merged);
}

/**
 * Clear all pump settings
 */
export function clearPumpSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[PumpSettings] Settings cleared');
    return true;
  } catch (error) {
    console.error('[PumpSettings] Error clearing settings:', error);
    return false;
  }
}

/**
 * Check if pump settings are locked (won't be overwritten by CSV)
 * @returns {boolean}
 */
export function isPumpSettingsLocked() {
  const settings = getPumpSettings();
  return settings?.meta?.isLocked === true;
}

/**
 * Toggle the lock state of pump settings
 * @param {boolean} locked - Whether to lock (true) or unlock (false)
 * @returns {boolean} Success
 */
export function togglePumpSettingsLock(locked) {
  try {
    const settings = getPumpSettings();
    settings.meta.isLocked = locked;
    settings.meta.lastUpdated = new Date().toISOString();
    savePumpSettings(settings);
    console.log(`[PumpSettings] Settings ${locked ? 'LOCKED' : 'UNLOCKED'}`);
    return true;
  } catch (error) {
    console.error('[PumpSettings] Error toggling lock:', error);
    return false;
  }
}

/**
 * Calculate recommended settings based on TDD
 * Uses 500-rule for CR and 1800-rule for ISF
 * @param {number} tdd - Total Daily Dose
 * @returns {Object} Recommended CR and ISF
 */
export function calculateRecommendedSettings(tdd) {
  if (!tdd || tdd <= 0) return { cr: null, isf: null };
  
  return {
    cr: Math.round((500 / tdd) * 10) / 10,    // 500-rule, 1 decimal
    isf: Math.round(1800 / tdd),               // 1800-rule, integer
  };
}

/**
 * Merge stored settings with defaults
 */
function mergeWithDefaults(stored) {
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    device: { ...DEFAULT_SETTINGS.device, ...stored.device },
    targetGlucose: { ...DEFAULT_SETTINGS.targetGlucose, ...stored.targetGlucose },
    calculated: { 
      ...DEFAULT_SETTINGS.calculated, 
      ...stored.calculated,
      recommended: {
        ...DEFAULT_SETTINGS.calculated.recommended,
        ...stored.calculated?.recommended,
      },
    },
    meta: { ...DEFAULT_SETTINGS.meta, ...stored.meta },
  };
}

/**
 * Deep merge helper
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ============================================================================
// DEVICE HISTORY MANAGEMENT
// ============================================================================

/**
 * Get device history from storage
 * @returns {Array} Array of historical device records
 */
export function getDeviceHistory() {
  try {
    const stored = localStorage.getItem(DEVICE_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[DeviceHistory] Error loading history:', error);
  }
  return [];
}

/**
 * Archive current device to history
 * Call this before switching to a new pump/transmitter
 * @param {Object} device - Device object to archive
 * @param {string} endDate - When device was retired (ISO string)
 * @param {string} notes - Optional notes (e.g., "Returned for replacement")
 * @returns {boolean} Success
 */
export function archiveDevice(device, endDate = null, notes = '') {
  if (!device || !device.serial) {
    console.warn('[DeviceHistory] Cannot archive device without serial');
    return false;
  }
  
  try {
    const history = getDeviceHistory();
    
    // Check if device already archived
    const existing = history.find(d => d.serial === device.serial);
    if (existing) {
      // Update existing entry
      existing.endDate = endDate || new Date().toISOString();
      existing.notes = notes || existing.notes;
      localStorage.setItem(DEVICE_HISTORY_KEY, JSON.stringify(history));
      console.log('[DeviceHistory] Updated existing device:', device.serial);
      return true;
    }
    
    // Add new historical entry
    const archived = {
      ...device,
      endDate: endDate || new Date().toISOString(),
      archivedAt: new Date().toISOString(),
      notes,
    };
    
    history.push(archived);
    localStorage.setItem(DEVICE_HISTORY_KEY, JSON.stringify(history));
    console.log('[DeviceHistory] Archived device:', device.serial);
    return true;
  } catch (error) {
    console.error('[DeviceHistory] Error archiving device:', error);
    return false;
  }
}

/**
 * Remove device from history
 * @param {string} serial - Device serial to remove
 * @returns {boolean} Success
 */
export function removeFromHistory(serial) {
  try {
    const history = getDeviceHistory();
    const filtered = history.filter(d => d.serial !== serial);
    localStorage.setItem(DEVICE_HISTORY_KEY, JSON.stringify(filtered));
    console.log('[DeviceHistory] Removed device:', serial);
    return true;
  } catch (error) {
    console.error('[DeviceHistory] Error removing device:', error);
    return false;
  }
}

/**
 * Export device history for backup
 * @returns {Object} Export data including current settings and history
 */
export function exportDeviceData() {
  return {
    currentSettings: getPumpSettings(),
    deviceHistory: getDeviceHistory(),
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
}

/**
 * Import device data from backup
 * @param {Object} data - Exported data object
 * @returns {boolean} Success
 */
export function importDeviceData(data) {
  try {
    if (data.currentSettings) {
      savePumpSettings(data.currentSettings);
    }
    if (data.deviceHistory && Array.isArray(data.deviceHistory)) {
      localStorage.setItem(DEVICE_HISTORY_KEY, JSON.stringify(data.deviceHistory));
    }
    console.log('[DeviceHistory] Imported device data');
    return true;
  } catch (error) {
    console.error('[DeviceHistory] Error importing data:', error);
    return false;
  }
}

/**
 * Clear device history
 */
export function clearDeviceHistory() {
  try {
    localStorage.removeItem(DEVICE_HISTORY_KEY);
    console.log('[DeviceHistory] History cleared');
    return true;
  } catch (error) {
    console.error('[DeviceHistory] Error clearing history:', error);
    return false;
  }
}

export { DEFAULT_SETTINGS };
