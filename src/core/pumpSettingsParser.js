/**
 * Pump Settings Parser
 * 
 * Extracts MiniMed 780G pump settings from CareLink CSV exports.
 * Detects CR, ISF, Target, Basal Profile, and device info.
 * 
 * @module core/pumpSettingsParser
 */

/**
 * Parse pump settings from CSV content
 * @param {string} csvContent - Raw CSV file content
 * @returns {Object} Parsed pump settings
 */
export function parsePumpSettings(csvContent) {
  const lines = csvContent.split(/\r?\n/);
  
  const settings = {
    device: parseDeviceInfo(lines),
    carbRatios: [],
    insulinSensitivity: [],
    targetGlucose: { low: null, high: null },
    activeInsulinTime: null,
    basalProfile: [],
    calculated: {
      tdd: null,
      tddBolus: null,
      tddBasal: null,
      recommended: { cr: null, isf: null },
    },
    meta: {
      source: 'csv',
      lastUpdated: new Date().toISOString(),
      csvDate: null,
    },
  };

  // Find header row and parse data rows
  const { headerIndex, headers } = findHeaders(lines);
  if (headerIndex === -1) {
    console.warn('[PumpSettingsParser] No header row found');
    return settings;
  }

  // Extract date from CSV metadata
  const dateMatch = lines.slice(0, 5).join('').match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) {
    settings.meta.csvDate = dateMatch[1];
  }

  // Parse data rows
  const crMap = new Map();      // hour -> ratio
  const isfMap = new Map();     // hour -> factor
  const basalMap = new Map();   // hour -> rate
  let targetHigh = null;
  let targetLow = null;
  let totalBolus = 0;
  let bolusCount = 0;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((h, idx) => row[h] = values[idx]);

    // Extract time hour
    const time = row['Time'] || '';
    const hourMatch = time.match(/^(\d{2}):/);
    const hour = hourMatch ? parseInt(hourMatch[1]) : null;

    // Carb Ratio
    const crRaw = row['BWZ Carb Ratio (g/U)'];
    if (crRaw && crRaw !== '' && hour !== null) {
      const cr = parseNumber(crRaw);
      if (cr && cr > 0 && cr < 50) {
        crMap.set(hour, cr);
      }
    }

    // ISF
    const isfRaw = row['BWZ Insulin Sensitivity (mg/dL/U)'];
    if (isfRaw && isfRaw !== '' && hour !== null) {
      const isf = parseNumber(isfRaw);
      if (isf && isf > 0 && isf < 200) {
        isfMap.set(hour, isf);
      }
    }

    // Target Glucose
    const targetHighRaw = row['BWZ Target High BG (mg/dL)'];
    const targetLowRaw = row['BWZ Target Low BG (mg/dL)'];
    if (targetHighRaw && parseNumber(targetHighRaw) > 0) {
      targetHigh = parseNumber(targetHighRaw);
    }
    if (targetLowRaw && parseNumber(targetLowRaw) > 0) {
      targetLow = parseNumber(targetLowRaw);
    }

    // Basal Rate (from scheduled rates at even hours)
    const basalRaw = row['Basal Rate (U/h)'];
    if (basalRaw && basalRaw !== '' && hour !== null) {
      const basal = parseNumber(basalRaw);
      if (basal && basal > 0 && basal < 10) {
        // Only record at scheduled times (even hours typically)
        const timeStr = time.substring(0, 5);
        if (timeStr.endsWith(':00:00') || timeStr.match(/^\d{2}:00/)) {
          basalMap.set(hour, basal);
        }
      }
    }

    // Bolus for TDD calculation
    const bolusRaw = row['Bolus Volume Delivered (U)'];
    if (bolusRaw && bolusRaw !== '') {
      const bolus = parseNumber(bolusRaw);
      if (bolus && bolus > 0) {
        totalBolus += bolus;
        bolusCount++;
      }
    }
  }

  // Convert maps to time blocks
  settings.carbRatios = mapToTimeBlocks(crMap, 'ratio');
  settings.insulinSensitivity = mapToTimeBlocks(isfMap, 'factor');
  settings.basalProfile = mapToTimeBlocks(basalMap, 'rate');

  // Set target glucose
  if (targetHigh) settings.targetGlucose.high = targetHigh;
  if (targetLow) settings.targetGlucose.low = targetLow;

  // Calculate TDD estimates
  if (bolusCount > 0) {
    // Estimate daily bolus from data
    const days = countUniqueDays(lines, headerIndex, headers);
    if (days > 0) {
      const avgDailyBolus = totalBolus / days;
      settings.calculated.tddBolus = Math.round(avgDailyBolus * 10) / 10;
      
      // Estimate basaal from profile
      const avgBasal = calculateDailyBasal(settings.basalProfile);
      settings.calculated.tddBasal = Math.round(avgBasal * 10) / 10;
      
      // Total TDD
      const tdd = avgDailyBolus + avgBasal;
      settings.calculated.tdd = Math.round(tdd * 10) / 10;
      
      // Recommended settings (500/1800 rules)
      if (tdd > 0) {
        settings.calculated.recommended = {
          cr: Math.round((500 / tdd) * 10) / 10,
          isf: Math.round(1800 / tdd),
        };
      }
    }
  }

  console.log('[PumpSettingsParser] Parsed settings:', {
    crBlocks: settings.carbRatios.length,
    isfBlocks: settings.insulinSensitivity.length,
    basalBlocks: settings.basalProfile.length,
    tdd: settings.calculated.tdd,
  });

  return settings;
}

/**
 * Parse device info from CSV header lines
 */
function parseDeviceInfo(lines) {
  const device = {
    model: 'MiniMed 780G',
    serial: '',
    hardwareVersion: '',
    firmwareVersion: '',
  };

  // First few lines contain device info
  const header = lines.slice(0, 10).join(';');
  
  // Model
  const modelMatch = header.match(/MiniMed\s+780G\s+MMT-\d+/i);
  if (modelMatch) device.model = modelMatch[0];

  // Serial
  const serialMatch = header.match(/Serial Number[";,]+([A-Z0-9]+)/i);
  if (serialMatch) device.serial = serialMatch[1];

  // Hardware version
  const hwMatch = header.match(/Hardware Version[";,]+([A-Z0-9.]+)/i);
  if (hwMatch) device.hardwareVersion = hwMatch[1];

  // Firmware version
  const fwMatch = header.match(/Firmware Version[";,]+([0-9.]+)/i);
  if (fwMatch) device.firmwareVersion = fwMatch[1];

  return device;
}

/**
 * Find header row in CSV
 */
function findHeaders(lines) {
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    if (lines[i].includes('Index') && lines[i].includes('Date') && lines[i].includes('Time')) {
      const headers = parseCSVLine(lines[i]);
      return { headerIndex: i, headers };
    }
  }
  return { headerIndex: -1, headers: [] };
}

/**
 * Parse CSV line handling semicolon delimiter
 */
function parseCSVLine(line) {
  return line.split(';').map(v => v.replace(/^"|"$/g, '').trim());
}

/**
 * Parse number from string (handles comma decimal)
 */
function parseNumber(str) {
  if (!str || str === '') return null;
  const normalized = str.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

/**
 * Convert hour->value map to time blocks
 * Groups consecutive hours with same value
 */
function mapToTimeBlocks(hourMap, valueKey) {
  if (hourMap.size === 0) return [];

  // Get sorted hours
  const hours = Array.from(hourMap.keys()).sort((a, b) => a - b);
  
  const blocks = [];
  let currentValue = hourMap.get(hours[0]);
  let currentStart = hours[0];

  for (let i = 1; i < hours.length; i++) {
    const value = hourMap.get(hours[i]);
    if (value !== currentValue) {
      // New block
      blocks.push({
        startTime: `${String(currentStart).padStart(2, '0')}:00`,
        [valueKey]: currentValue,
      });
      currentValue = value;
      currentStart = hours[i];
    }
  }

  // Add final block
  blocks.push({
    startTime: `${String(currentStart).padStart(2, '0')}:00`,
    [valueKey]: currentValue,
  });

  return blocks;
}

/**
 * Count unique days in data
 */
function countUniqueDays(lines, headerIndex, headers) {
  const dateIdx = headers.indexOf('Date');
  if (dateIdx === -1) return 0;

  const dates = new Set();
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values[dateIdx]) {
      dates.add(values[dateIdx]);
    }
  }
  return dates.size;
}

/**
 * Calculate daily basal from profile
 */
function calculateDailyBasal(basalProfile) {
  if (!basalProfile || basalProfile.length === 0) return 0;

  let total = 0;
  for (let i = 0; i < basalProfile.length; i++) {
    const current = basalProfile[i];
    const next = basalProfile[i + 1];
    
    const startHour = parseInt(current.startTime.split(':')[0]);
    const endHour = next ? parseInt(next.startTime.split(':')[0]) : 24;
    const duration = endHour - startHour;
    
    total += current.rate * duration;
  }
  
  return total;
}

/**
 * Merge parsed settings with existing settings
 * Only overwrites fields that have actual data
 */
export function mergePumpSettings(existing, parsed) {
  const merged = { ...existing };

  // Device info - always update from CSV
  if (parsed.device?.model) merged.device = { ...merged.device, ...parsed.device };

  // CR - update if we found blocks
  if (parsed.carbRatios?.length > 0) merged.carbRatios = parsed.carbRatios;

  // ISF - update if we found blocks  
  if (parsed.insulinSensitivity?.length > 0) merged.insulinSensitivity = parsed.insulinSensitivity;

  // Target - update if found
  if (parsed.targetGlucose?.high) merged.targetGlucose.high = parsed.targetGlucose.high;
  if (parsed.targetGlucose?.low) merged.targetGlucose.low = parsed.targetGlucose.low;

  // Basal - update if found
  if (parsed.basalProfile?.length > 0) merged.basalProfile = parsed.basalProfile;

  // Calculated values - always update
  if (parsed.calculated?.tdd) {
    merged.calculated = { ...merged.calculated, ...parsed.calculated };
  }

  // Update metadata
  merged.meta = {
    ...merged.meta,
    source: 'csv',
    lastUpdated: new Date().toISOString(),
    csvDate: parsed.meta?.csvDate || null,
  };

  return merged;
}
