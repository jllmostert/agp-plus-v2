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
