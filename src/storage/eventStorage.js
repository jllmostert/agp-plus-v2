/**
 * Device Event Storage Engine for AGP+ v3.0
 * 
 * Manages persistent storage of sensor and cartridge changes:
 * - Idempotent IDs prevent duplicates on CSV re-upload
 * - User can confirm/reject false positives
 * - Query by date range for visualization
 * 
 * Event Types:
 * - sensor_change: Detected from gaps (2-10 hours)
 * - cartridge_change: Detected from "Rewind" alarms
 */

import { STORES, openDB, getRecord, putRecord, queryByIndex } from './db.js';

/**
 * Generate idempotent event ID from timestamp
 * Same timestamp = same ID = no duplicates
 * 
 * @param {Date} timestamp
 * @param {string} type - 'sensor' or 'cartridge'
 * @returns {string} "sensor_20251015_143000" or "cartridge_20251020_091500"
 */
function generateEventId(timestamp, type) {
  const dateStr = timestamp.toISOString()
    .replace(/[:-]/g, '')
    .replace(/\.\d{3}Z/, '');  // "2025-10-15T14:30:00.000Z" → "20251015T143000"
  
  return `${type}_${dateStr}`;
}

/**
 * Store sensor change event
 * Idempotent: same timestamp = update, not duplicate
 * 
 * @param {Date} timestamp - When sensor was changed
 * @param {number} gapMinutes - Duration of gap (for validation)
 * @param {string} sourceFile - CSV filename
 */
export async function storeSensorChange(timestamp, gapMinutes, sourceFile) {
  const id = generateEventId(timestamp, 'sensor');
  
  const event = {
    id,
    timestamp,
    type: 'sensor_change',
    gapMinutes,
    sourceFile,
    confirmed: true,  // Default: assume valid, user can override
    notes: null,
    createdAt: new Date()
  };
  
  await putRecord(STORES.SENSOR_EVENTS, event);
  console.log(`[SensorEvent] Stored: ${timestamp.toISOString()}`);
}

/**
 * Store cartridge change event
 * 
 * @param {Date} timestamp - When cartridge was changed
 * @param {string} alarmText - CSV alarm string ("Rewind")
 * @param {string} sourceFile - CSV filename
 */
export async function storeCartridgeChange(timestamp, alarmText, sourceFile) {
  const id = generateEventId(timestamp, 'cartridge');
  
  const event = {
    id,
    timestamp,
    type: 'cartridge_change',
    sourceAlarm: alarmText,
    sourceFile,
    confirmed: true,
    notes: null,
    createdAt: new Date()
  };
  
  await putRecord(STORES.CARTRIDGE_EVENTS, event);
  console.log(`[CartridgeEvent] Stored: ${timestamp.toISOString()}`);
}

/**
 * Get all sensor changes in date range
 * 
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array} Confirmed sensor change events
 */
export async function getSensorChangesInRange(startDate, endDate) {
  const range = IDBKeyRange.bound(startDate, endDate);
  const events = await queryByIndex(STORES.SENSOR_EVENTS, 'timestamp', range);
  
  // Filter to confirmed only
  return events.filter(e => e.confirmed);
}

/**
 * Get all cartridge changes in date range
 * 
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array} Confirmed cartridge change events
 */
export async function getCartridgeChangesInRange(startDate, endDate) {
  const range = IDBKeyRange.bound(startDate, endDate);
  const events = await queryByIndex(STORES.CARTRIDGE_EVENTS, 'timestamp', range);
  
  return events.filter(e => e.confirmed);
}

/**
 * Get all events for a specific day (for DayProfileCard)
 * 
 * @param {Date} date - Any time on the target day
 * @returns {Object} { sensorChanges: Array, cartridgeChanges: Array }
 */
export async function getEventsForDay(date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  
  const [sensors, cartridges] = await Promise.all([
    getSensorChangesInRange(dayStart, dayEnd),
    getCartridgeChangesInRange(dayStart, dayEnd)
  ]);
  
  return {
    sensorChanges: sensors,
    cartridgeChanges: cartridges
  };
}

/**
 * Toggle event confirmation (user marks false positive)
 * 
 * @param {string} eventId
 * @param {string} eventType - 'sensor' or 'cartridge'
 */
export async function toggleEventConfirmation(eventId, eventType) {
  const storeName = eventType === 'sensor' 
    ? STORES.SENSOR_EVENTS 
    : STORES.CARTRIDGE_EVENTS;
  
  const event = await getRecord(storeName, eventId);
  
  if (event) {
    event.confirmed = !event.confirmed;
    await putRecord(storeName, event);
    console.log(`[ToggleEvent] ${eventId}: confirmed=${event.confirmed}`);
  }
}

/**
 * Get event statistics
 * @returns {Object} { totalSensors, totalCartridges, dateRange }
 */
export async function getEventStats() {
  const db = await openDB();
  
  // Count events
  const sensorTx = db.transaction(STORES.SENSOR_EVENTS, 'readonly');
  const sensorCount = await new Promise((resolve, reject) => {
    const req = sensorTx.objectStore(STORES.SENSOR_EVENTS).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  
  const cartridgeTx = db.transaction(STORES.CARTRIDGE_EVENTS, 'readonly');
  const cartridgeCount = await new Promise((resolve, reject) => {
    const req = cartridgeTx.objectStore(STORES.CARTRIDGE_EVENTS).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  
  return {
    totalSensors: sensorCount,
    totalCartridges: cartridgeCount
  };
}
