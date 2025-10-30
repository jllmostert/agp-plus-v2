/**
 * Sensor Detection Engine
 * 
 * Combines alert clustering with glucose gap analysis to detect sensor changes.
 * Produces high/medium/low confidence candidates for user review.
 */

import { clusterSensorAlerts, analyzeCluster } from './sensorEventClustering.js';
import { detectGlucoseGaps, findGapsNearTime } from './glucoseGapAnalyzer.js';
import { debug } from '../utils/debug.js';

const MATCH_WINDOW_HOURS = 6; // Time window for cluster-gap correlation

/**
 * Detect sensor changes using both alerts and gaps
 * @param {Array} alerts - Alert events from Section 1
 * @param {Array} glucoseReadings - Glucose readings from Section 3
 * @returns {Object} { candidates: [], summary: {} }
 */
export function detectSensorChanges(alerts, glucoseReadings) {
  debug.log('[Detection Engine] Starting sensor change detection');
  
  // Step 1: Cluster alerts
  const clusters = clusterSensorAlerts(alerts.map(a => ({
    timestamp: a.timestamp,
    alert: a.alert,
    glucose: a.glucose
  })));
  
  // Step 2: Detect gaps
  const gaps = detectGlucoseGaps(glucoseReadings);
  
  // Step 3: Match clusters to gaps
  const candidates = [];
  
  for (const cluster of clusters) {
    const clusterAnalysis = analyzeCluster(cluster);
    
    // Find nearby gaps
    const nearbyGaps = findGapsNearTime(
      gaps, 
      clusterAnalysis.estimatedTime || cluster.startTime,
      MATCH_WINDOW_HOURS
    );
    
    // Calculate confidence
    const confidence = calculateConfidence(clusterAnalysis, nearbyGaps);
    
    const candidate = {
      timestamp: clusterAnalysis.estimatedTime || cluster.startTime,
      confidence: confidence.level,
      score: confidence.score,
      alerts: cluster.alerts.map(a => a.alert),
      gaps: nearbyGaps.map(g => ({
        duration: g.durationMinutes,
        startTime: g.startTime
      })),
      reason: buildReasonString(clusterAnalysis, nearbyGaps, confidence)
    };
    
    candidates.push(candidate);
  }
  
  // Step 4: Add high-confidence standalone gaps (no nearby alerts)
  const unmatchedGaps = gaps.filter(gap => {
    return !candidates.some(c => 
      c.gaps.some(cg => cg.startTime.getTime() === gap.startTime.getTime())
    );
  });
  
  for (const gap of unmatchedGaps) {
    if (gap.durationMinutes >= 240) { // 4+ hours
      candidates.push({
        timestamp: gap.startTime,
        confidence: 'medium',
        score: 60,
        alerts: [],
        gaps: [{ duration: gap.durationMinutes, startTime: gap.startTime }],
        reason: `Long glucose gap (${gap.durationMinutes} min) without alerts - possible sensor change`
      });
    }
  }
  
  // Sort by timestamp descending (newest first)
  candidates.sort((a, b) => b.timestamp - a.timestamp);
  
  debug.log('[Detection Engine] Detection complete', {
    candidates: candidates.length,
    high: candidates.filter(c => c.confidence === 'high').length,
    medium: candidates.filter(c => c.confidence === 'medium').length,
    low: candidates.filter(c => c.confidence === 'low').length
  });
  
  return {
    candidates,
    summary: {
      totalCandidates: candidates.length,
      highConfidence: candidates.filter(c => c.confidence === 'high').length,
      mediumConfidence: candidates.filter(c => c.confidence === 'medium').length,
      lowConfidence: candidates.filter(c => c.confidence === 'low').length,
      totalGapsDetected: gaps.length,
      totalClustersFound: clusters.length
    }
  };
}

/**
 * Calculate confidence score and level
 * @param {Object} clusterAnalysis - Analysis from sensorEventClustering
 * @param {Array} nearbyGaps - Gaps within time window
 * @returns {Object} { level: 'high'|'medium'|'low', score: number }
 */
function calculateConfidence(clusterAnalysis, nearbyGaps) {
  let score = 0;
  
  // Base score from cluster analysis
  if (clusterAnalysis.confidence === 'high') {
    score += 70;
  } else if (clusterAnalysis.confidence === 'medium') {
    score += 50;
  } else {
    score += 20;
  }
  
  // Boost score if nearby gap exists
  if (nearbyGaps.length > 0) {
    const longestGap = Math.max(...nearbyGaps.map(g => g.durationMinutes));
    
    if (longestGap >= 240) { // 4+ hours
      score += 20;
    } else if (longestGap >= 120) { // 2-4 hours
      score += 10;
    }
  }
  
  // Determine level from score
  let level;
  if (score >= 80) {
    level = 'high';
  } else if (score >= 50) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  return { level, score };
}

/**
 * Build human-readable reason string
 */
function buildReasonString(clusterAnalysis, nearbyGaps, confidence) {
  const parts = [clusterAnalysis.reason];
  
  if (nearbyGaps.length > 0) {
    const gapDurations = nearbyGaps.map(g => `${g.durationMinutes}min`).join(', ');
    parts.push(`Glucose gap(s): ${gapDurations}`);
  }
  
  parts.push(`Confidence score: ${confidence.score}/100`);
  
  return parts.join(' • ');
}
