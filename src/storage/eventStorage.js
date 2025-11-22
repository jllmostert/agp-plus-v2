/**
 * EVENT STORAGE MODULE
 * 
 * Manages cartridge change events in localStorage.
 * Events are detected once during CSV processing and cached for fast lookups.
 * 
 * Note: Sensor changes are stored in the sensor database (IndexedDB),
 * not in this event storage. This module only handles cartridge events.
 * 
 * Architecture:
 * - Single scan per CSV upload/page load
 * - Fast date-based lookups for day profiles
 * - No runtime detection overhead
 * 
 * @module eventStorage
 * @version 3.7.0
 */

const EVENTS_KEY = 'agp-device-events';

/**
 * Store cartridge events in localStorage
 * 
 * @param {Object} events - { cartridgeChanges: [], lastScanned: ISO timestamp }
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
 * @returns {Object} { cartridgeChanges: [] }
 */
export function getEventsForDate(date) {
  const allEvents = getAllEvents();
  
  if (!allEvents) {
    return { cartridgeChanges: [] };
  }
  
  // Filter cartridge events for this specific date
  const cartridgeChanges = (allEvents.cartridgeChanges || []).filter(e => e.date === date);
  
  return { cartridgeChanges };
}

/**
 * Check if cartridge events exist for current dataset
 * 
 * @returns {boolean}
 */
export function hasEvents() {
  const events = getAllEvents();
  return events !== null && events.cartridgeChanges?.length > 0;
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
 * Store a cartridge change event
 * 
 * @param {Date} timestamp - When the cartridge change occurred
 * @param {string} alarmText - Alarm text from CSV (usually "Rewind")
 * @param {string} sourceFile - Source filename for metadata
 */
export function storeCartridgeChange(timestamp, alarmText, sourceFile) {
  const allEvents = getAllEvents() || { cartridgeChanges: [] };
  
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
 * @returns {Object} { cartridgeCount: number }
 */
export function getEventStats() {
  const events = getAllEvents();
  
  if (!events) {
    return { cartridgeCount: 0 };
  }
  
  return {
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
