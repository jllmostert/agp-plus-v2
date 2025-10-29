/**
 * EVENT STORAGE MODULE
 * 
 * Manages device events (sensor changes, cartridge changes) in localStorage.
 * Events are detected once during CSV processing and cached for fast lookups.
 * 
 * Architecture:
 * - Single scan per CSV upload/page load
 * - Fast date-based lookups for day profiles
 * - No runtime detection overhead
 * 
 * @module eventStorage
 * @version 3.6.0
 */

const EVENTS_KEY = 'agp-device-events';

/**
 * Store device events in localStorage
 * 
 * @param {Object} events - { sensorChanges: [], cartridgeChanges: [], lastScanned: ISO timestamp }
 */
export function storeEvents(events) {
  const data = {
    ...events,
    lastScanned: new Date().toISOString()
  };
  localStorage.setItem(EVENTS_KEY, JSON.stringify(data));
}

/**
 * Get all stored events
 * 
 * @returns {Object|null} Events object or null if not found
 */
export function getAllEvents() {
  try {
    const data = localStorage.getItem(EVENTS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('[eventStorage] Error getting events:', err);
    return null;
  }
}

/**
 * Get events for a specific date
 * 
 * @param {string} date - Date in YYYY/MM/DD format
 * @returns {Object} { sensorChanges: [], cartridgeChanges: [] }
 */
export function getEventsForDate(date) {
  const allEvents = getAllEvents();
  
  if (!allEvents) {
    return { sensorChanges: [], cartridgeChanges: [] };
  }
  
  // Filter events for this specific date
  const sensorChanges = (allEvents.sensorChanges || []).filter(e => e.date === date);
  const cartridgeChanges = (allEvents.cartridgeChanges || []).filter(e => e.date === date);
  
  return { sensorChanges, cartridgeChanges };
}

/**
 * Check if events exist for current dataset
 * 
 * @returns {boolean}
 */
export function hasEvents() {
  const events = getAllEvents();
  return events !== null && 
         (events.sensorChanges?.length > 0 || events.cartridgeChanges?.length > 0);
}

/**
 * Clear all stored events
 */
export function clearEvents() {
  localStorage.removeItem(EVENTS_KEY);
}

/**
 * Get last scanned timestamp
 * 
 * @returns {string|null} ISO timestamp or null
 */
export function getLastScanned() {
  const events = getAllEvents();
  return events?.lastScanned || null;
}

/**
 * Store a sensor change event
 * 
 * @param {Date} timestamp - When the sensor change occurred
 * @param {string} alarmText - Optional alarm text from CSV
 * @param {string} sourceFile - Source filename for metadata
 */
export function storeSensorChange(timestamp, alarmText, sourceFile) {
  const allEvents = getAllEvents() || { sensorChanges: [], cartridgeChanges: [] };
  
  const date = timestamp.toISOString().split('T')[0].replace(/-/g, '/'); // YYYY/MM/DD
  const time = timestamp.toTimeString().split(' ')[0]; // HH:MM:SS
  
  // Check for duplicates
  const exists = allEvents.sensorChanges.some(e => 
    e.date === date && e.time === time
  );
  
  if (exists) {
    throw new Error('Duplicate sensor change event');
  }
  
  allEvents.sensorChanges.push({
    date,
    time,
    timestamp: timestamp.toISOString(),
    alarmText: alarmText || 'Sensor Change',
    sourceFile,
    type: 'start' // Mark as sensor stop/start event
  });
  
  storeEvents(allEvents);
}

/**
 * Store a cartridge change event
 * 
 * @param {Date} timestamp - When the cartridge change occurred
 * @param {string} alarmText - Alarm text from CSV (usually "Rewind")
 * @param {string} sourceFile - Source filename for metadata
 */
export function storeCartridgeChange(timestamp, alarmText, sourceFile) {
  const allEvents = getAllEvents() || { sensorChanges: [], cartridgeChanges: [] };
  
  const date = timestamp.toISOString().split('T')[0].replace(/-/g, '/'); // YYYY/MM/DD
  const time = timestamp.toTimeString().split(' ')[0]; // HH:MM:SS
  
  // Check for duplicates
  const exists = allEvents.cartridgeChanges.some(e => 
    e.date === date && e.time === time
  );
  
  if (exists) {
    throw new Error('Duplicate cartridge change event');
  }
  
  allEvents.cartridgeChanges.push({
    date,
    time,
    timestamp: timestamp.toISOString(),
    alarmText: alarmText || 'Rewind',
    sourceFile
  });
  
  storeEvents(allEvents);
}

/**
 * Get event statistics
 * 
 * @returns {Object} { sensorCount: number, cartridgeCount: number }
 */
export function getEventStats() {
  const events = getAllEvents();
  
  if (!events) {
    return { sensorCount: 0, cartridgeCount: 0 };
  }
  
  return {
    sensorCount: events.sensorChanges?.length || 0,
    cartridgeCount: events.cartridgeChanges?.length || 0
  };
}

/**
 * Get cartridge history for export
 * Returns array of cartridge changes or empty array
 * 
 * @returns {Array}
 */
export function getCartridgeHistory() {
  const events = getAllEvents();
  return events?.cartridgeChanges || [];
}


/**
 * DELETE CARTRIDGE CHANGES IN DATE RANGE
 * 
 * Removes cartridge change events within specified date range from localStorage.
 * Updates event storage accordingly.
 * 
 * @param {Date} startDate - Start of deletion range (inclusive)
 * @param {Date} endDate - End of deletion range (inclusive)
 * @returns {Promise<number>} Count of events deleted
 */
export async function deleteCartridgeChangesInRange(startDate, endDate) {

  const events = getAllEvents();
  if (!events || !events.cartridgeChanges) {
    return 0;
  }
  
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const originalCount = events.cartridgeChanges.length;
  const filtered = events.cartridgeChanges.filter(event => {
    const ts = new Date(event.timestamp).getTime();
    return ts < startTime || ts > endTime;
  });
  
  const deleted = originalCount - filtered.length;
  
  // Update events in storage
  events.cartridgeChanges = filtered;
  storeEvents(events);
  
  return deleted;
}
