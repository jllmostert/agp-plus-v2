/**
 * Event Clustering Utilities
 * Helper functions for grouping and deduplicating device events
 */

/**
 * Check if alert is a valid sensor change indicator
 * Only SENSOR CONNECTED and CHANGE SENSOR indicate actual sensor changes
 * Other alerts (LOST SENSOR SIGNAL, SENSOR UPDATING) are context/noise
 * 
 * @param {string} alert - Alert text from CSV
 * @returns {boolean} True if alert indicates sensor change
 */
export function isValidSensorChangeAlert(alert) {
  if (!alert) return false;
  
  const upperAlert = alert.toUpperCase();
  
  // Valid sensor change indicators
  if (upperAlert.includes('SENSOR CONNECTED')) return true;
  if (upperAlert.includes('CHANGE SENSOR')) return true;
  
  // Noise - not actual sensor changes
  if (upperAlert.includes('LOST SENSOR SIGNAL')) return false;
  if (upperAlert.includes('SENSOR UPDATING')) return false;
  if (upperAlert.includes('SENSOR EXCEPTION')) return false;
  
  return false;
}

/**
 * Group events by date
 * @param {Array} events - Array of event objects with {date, time, timestamp}
 * @returns {Object} Events grouped by date key (YYYY/MM/DD)
 */
export function groupEventsByDate(events) {
  const grouped = {};
  
  events.forEach(event => {
    const dateKey = event.date;
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });
  
  return grouped;
}

/**
 * Calculate time span between events in minutes
 * @param {Array} events - Array of event objects with timestamp field
 * @returns {number} Time span in minutes
 */
export function getTimeSpanMinutes(events) {
  if (events.length <= 1) return 0;
  
  const timestamps = events.map(e => e.timestamp.getTime());
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  
  return (max - min) / (1000 * 60); // Convert ms to minutes
}

/**
 * Cluster events within time window
 * Groups events that occur within specified minutes of each other
 * 
 * @param {Array} events - Array of event objects with timestamp
 * @param {number} windowMinutes - Time window in minutes (default: 60)
 * @returns {Array} Array of event clusters, each with representative event
 */
export function clusterEventsByTime(events, windowMinutes = 60) {
  if (events.length === 0) return [];
  
  // Sort by timestamp
  const sorted = [...events].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  const clusters = [];
  let currentCluster = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const timeDiff = getTimeSpanMinutes([currentCluster[0], sorted[i]]);
    
    if (timeDiff <= windowMinutes) {
      // Within window - add to current cluster
      currentCluster.push(sorted[i]);
    } else {
      // Outside window - start new cluster
      clusters.push(currentCluster);
      currentCluster = [sorted[i]];
    }
  }
  
  // Add final cluster
  clusters.push(currentCluster);
  
  return clusters;
}

/**
 * Get representative event from cluster
 * Returns the earliest event (first in chronological order)
 * 
 * @param {Array} cluster - Array of events
 * @returns {Object} Representative event
 */
export function getRepresentativeEvent(cluster) {
  if (cluster.length === 1) return cluster[0];
  
  // Return earliest event
  return cluster.reduce((earliest, current) => 
    current.timestamp < earliest.timestamp ? current : earliest
  );
}

/**
 * Format event cluster for display to user
 * @param {Array} cluster - Array of events
 * @returns {string} Formatted string for UI display
 */
export function formatClusterForDisplay(cluster) {
  const timeSpan = getTimeSpanMinutes(cluster);
  const earliest = getRepresentativeEvent(cluster);
  
  return {
    date: earliest.date,
    time: earliest.time,
    count: cluster.length,
    timeSpan: Math.round(timeSpan),
    alerts: cluster.map(e => e.alert).filter(Boolean)
  };
}

/**
 * Deduplicate sensor events using intelligent clustering
 * 
 * Strategy:
 * 1. Filter for valid sensor change alerts only
 * 2. Group by date
 * 3. For each date with multiple events:
 *    - If events within 60 minutes: cluster as one
 *    - If events >60 minutes apart: flag for user confirmation
 * 
 * @param {Array} sensorAlerts - Raw sensor alerts from CSV parsing
 * @returns {Object} {confirmedEvents, ambiguousGroups}
 */
export function deduplicateSensorEvents(sensorAlerts) {
  // Filter for valid sensor change alerts only
  const validAlerts = sensorAlerts.filter(event => 
    isValidSensorChangeAlert(event.alert)
  );
  
  
  // Group by date
  const byDate = groupEventsByDate(validAlerts);
  
  const confirmedEvents = [];
  const ambiguousGroups = [];
  
  Object.entries(byDate).forEach(([date, dateEvents]) => {
    if (dateEvents.length === 1) {
      // Single event - straightforward
      confirmedEvents.push(dateEvents[0]);
    } else {
      // Multiple events on same date
      const timeSpan = getTimeSpanMinutes(dateEvents);
      
      if (timeSpan <= 60) {
        // Events clustered within 60 minutes - likely one sensor change
        const representative = getRepresentativeEvent(dateEvents);
        confirmedEvents.push(representative);
      } else {
        // Events >60 min apart - need user confirmation
        ambiguousGroups.push({
          date,
          events: dateEvents,
          timeSpan
        });
      }
    }
  });
  
  return {
    confirmedEvents,
    ambiguousGroups
  };
}
