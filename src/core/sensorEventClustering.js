/**
 * Sensor Event Clustering Module
 * 
 * Clusters sensor-related alerts by time to identify true sensor changes.
 * Uses 4-hour window clustering and user prompts for ambiguous cases.
 * 
 * DETECTION RULES:
 * ✅ SENSOR CONNECTED = new sensor
 * ✅ CHANGE SENSOR = old sensor removal prompt
 * ❌ LOST SENSOR SIGNAL = signal loss, NOT sensor change
 * ❌ SENSOR UPDATING ALERT = warmup, NOT sensor change
 */

const RELEVANT_ALERTS = ['SENSOR CONNECTED', 'CHANGE SENSOR'];
const CLUSTER_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Find exact timestamp of a specific alert type in a cluster
 * 
 * @param {Array} alerts - Alert objects with .alert and .timestamp
 * @param {string} targetAlertType - Alert type to find (e.g., "SENSOR CONNECTED")
 * @returns {Date|null} Exact timestamp or null if not found
 */
export function getExactAlertTimestamp(alerts, targetAlertType) {
  if (!alerts || alerts.length === 0) return null;
  
  // Case-insensitive, flexible matching (handles both "SENSOR CONNECTED" and "SENSOR_CONNECTED")
  const targetUpper = targetAlertType.toUpperCase().replace(/[_\s]/g, '');
  
  const exactAlert = alerts.find(a => {
    if (!a.alert) return false;
    const alertUpper = a.alert.toUpperCase().replace(/[_\s]/g, '');
    return alertUpper.includes(targetUpper);
  });
  
  return exactAlert?.timestamp || null;
}

/**
 * Find first valid glucose reading after sensor connection events
 * Fallback when exact "SENSOR CONNECTED" alert is not available
 * 
 * @param {Array} glucoseReadings - Glucose data points with .timestamp
 * @param {Array} alerts - Sensor alerts for context
 * @returns {Date|null} Timestamp of first valid reading after connection
 */
export function firstValidReadingAfterConnect(glucoseReadings, alerts) {
  if (!glucoseReadings || glucoseReadings.length === 0) return null;
  if (!alerts || alerts.length === 0) return null;
  
  // Find earliest sensor-related alert (connection, change, etc.)
  const sensorAlerts = alerts.filter(a => 
    a.alert && (
      a.alert.includes('SENSOR') || 
      a.alert.includes('CONNECTED') ||
      a.alert.includes('CHANGE')
    )
  );
  
  if (sensorAlerts.length === 0) return null;
  
  // Get earliest alert timestamp
  const earliestAlertTime = sensorAlerts.reduce((earliest, a) => {
    const aTime = new Date(a.timestamp);
    return aTime < earliest ? aTime : earliest;
  }, new Date(sensorAlerts[0].timestamp));
  
  // Find first glucose reading within 4 hours after earliest alert
  const SEARCH_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours
  
  const validReading = glucoseReadings
    .filter(reading => {
      if (!reading.timestamp) return false;
      const readingTime = new Date(reading.timestamp);
      const timeDiff = readingTime - earliestAlertTime;
      
      // Within 4 hours after alert, and reading has valid glucose value
      return timeDiff >= 0 && 
             timeDiff < SEARCH_WINDOW_MS && 
             reading.glucose && 
             !isNaN(reading.glucose);
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
  
  return validReading ? new Date(validReading.timestamp) : null;
}

/**
 * Cluster sensor alerts by time
 * @param {Array} readings - CSV readings with alert field
 * @returns {Array} Array of clusters, each with {startTime, endTime, alerts: []}
 */
export function clusterSensorAlerts(readings) {
  // Filter for relevant sensor alerts only
  const sensorAlerts = readings
    .filter(r => r.alert && RELEVANT_ALERTS.some(a => r.alert.includes(a)))
    .map(r => ({
      timestamp: new Date(r.timestamp),
      alert: r.alert,
      glucose: r.glucose
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (sensorAlerts.length === 0) return [];

  const clusters = [];
  let currentCluster = {
    startTime: sensorAlerts[0].timestamp,
    endTime: sensorAlerts[0].timestamp,
    alerts: [sensorAlerts[0]]
  };

  for (let i = 1; i < sensorAlerts.length; i++) {
    const alert = sensorAlerts[i];
    const timeSinceLast = alert.timestamp - currentCluster.endTime;

    if (timeSinceLast <= CLUSTER_WINDOW_MS) {
      // Add to current cluster
      currentCluster.endTime = alert.timestamp;
      currentCluster.alerts.push(alert);
    } else {
      // Start new cluster
      clusters.push(currentCluster);
      currentCluster = {
        startTime: alert.timestamp,
        endTime: alert.timestamp,
        alerts: [alert]
      };
    }
  }

  // Don't forget last cluster
  clusters.push(currentCluster);

  return clusters;
}

/**
 * Analyze cluster to determine if it's a real sensor change
 * Now uses exact alert timestamps with fallback chain
 * 
 * @param {Object} cluster - {startTime, endTime, alerts: []}
 * @param {Array} glucoseReadings - Optional glucose readings for fallback
 * @returns {Object} Analysis with confidence, reason, estimatedTime, detection_method
 */
export function analyzeCluster(cluster, glucoseReadings = null) {
  const { alerts } = cluster;
  const hasConnected = alerts.some(a => a.alert.includes('SENSOR CONNECTED'));
  const hasChange = alerts.some(a => a.alert.includes('CHANGE SENSOR'));

  // Try to get exact "SENSOR CONNECTED" timestamp
  const exactAlertTime = getExactAlertTimestamp(alerts, 'SENSOR CONNECTED');
  
  // Fallback to first valid reading after connection
  const fallbackTime = glucoseReadings 
    ? firstValidReadingAfterConnect(glucoseReadings, alerts)
    : null;
  
  // Ultimate fallback: cluster start time
  const ultimateFallback = cluster.startTime;
  
  // Determine started_at with priority chain
  const started_at = exactAlertTime || fallbackTime || ultimateFallback;
  
  // Track detection method for diagnostics
  const detection_method = exactAlertTime 
    ? 'exact_alert' 
    : fallbackTime 
      ? 'fallback_reading' 
      : 'estimated';

  // High confidence: Both alerts present
  if (hasConnected && hasChange) {
    return {
      confidence: 'high',
      reason: 'Both SENSOR CONNECTED and CHANGE SENSOR present',
      needsConfirmation: false,
      estimatedTime: cluster.startTime, // Keep for backwards compat
      started_at,                        // NEW: Exact timestamp
      detection_method
    };
  }

  // Medium confidence: SENSOR CONNECTED only
  if (hasConnected) {
    return {
      confidence: 'medium',
      reason: 'SENSOR CONNECTED without CHANGE SENSOR prompt',
      needsConfirmation: alerts.length === 1, // Ask if single event
      estimatedTime: alerts.find(a => a.alert.includes('SENSOR CONNECTED')).timestamp,
      started_at,
      detection_method
    };
  }

  // Medium confidence: CHANGE SENSOR only
  if (hasChange) {
    return {
      confidence: 'medium',
      reason: 'CHANGE SENSOR prompt without SENSOR CONNECTED',
      needsConfirmation: true, // Always ask - did they actually change it?
      estimatedTime: cluster.startTime,
      started_at,
      detection_method
    };
  }

  // Should never reach here due to filtering, but safety net
  return {
    confidence: 'low',
    reason: 'No relevant sensor alerts',
    needsConfirmation: false,
    estimatedTime: null,
    started_at: null,
    detection_method: 'none'
  };
}

/**
 * Generate user prompt for ambiguous cluster
 * @param {Object} cluster - Cluster object
 * @param {Object} analysis - Analysis result
 * @returns {Object} {message: string, suggestedAction: string}
 */
export function generateUserPrompt(cluster, analysis) {
  const timeStr = cluster.startTime.toLocaleString('nl-NL');
  const duration = Math.round((cluster.endTime - cluster.startTime) / 1000 / 60); // minutes
  
  const alertList = cluster.alerts
    .map(a => `- ${a.timestamp.toLocaleTimeString('nl-NL')}: ${a.alert}`)
    .join('\n');

  if (analysis.confidence === 'medium' && cluster.alerts.length === 1) {
    return {
      message: `Mogelijke sensor change gedetecteerd op ${timeStr}:

${alertList}

Was dit een echte sensor change?`,
      suggestedAction: 'confirm',
      options: ['Ja, nieuwe sensor', 'Nee, vals alarm']
    };
  }

  if (analysis.confidence === 'medium' && cluster.alerts.some(a => a.alert.includes('CHANGE SENSOR'))) {
    return {
      message: `CHANGE SENSOR prompt gezien op ${timeStr}, maar geen SENSOR CONNECTED:

${alertList}

Heb je daadwerkelijk de sensor vervangen?`,
      suggestedAction: 'confirm',
      options: ['Ja, vervangen', 'Nee, alleen prompt gezien']
    };
  }

  return {
    message: `Cluster van ${cluster.alerts.length} sensor alerts over ${duration} minuten vanaf ${timeStr}:

${alertList}

Is dit één sensor change of meerdere events?`,
    suggestedAction: 'review',
    options: ['Eén sensor change', 'Meerdere changes', 'Geen change, ruis']
  };
}

/**
 * Process all readings and return detected sensor changes with confidence levels
 * @param {Array} readings - CSV readings
 * @returns {Object} {confident: [], needsReview: []}
 */
export function detectSensorChangesWithClustering(readings) {
  const clusters = clusterSensorAlerts(readings);
  const confident = [];
  const needsReview = [];

  for (const cluster of clusters) {
    const analysis = analyzeCluster(cluster);
    
    if (analysis.needsConfirmation) {
      needsReview.push({
        cluster,
        analysis,
        prompt: generateUserPrompt(cluster, analysis)
      });
    } else if (analysis.confidence === 'high') {
      confident.push({
        timestamp: analysis.estimatedTime,
        confidence: 'high',
        source: 'csv-alert-cluster',
        reason: analysis.reason,
        alerts: cluster.alerts.map(a => a.alert)
      });
    }
  }

  return { confident, needsReview };
}
