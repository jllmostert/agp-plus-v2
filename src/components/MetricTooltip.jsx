import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * MetricTooltip - Hover tooltip for metric explanations
 * 
 * Shows clinical definition and interpretation of metrics
 * 
 * @version 2.1.2
 */
export default function MetricTooltip({ metric }) {
  const [isVisible, setIsVisible] = useState(false);

  const explanations = {
    tir: 'Percentage of time glucose is 70-180 mg/dL. Target: ≥70%.',
    tar: 'Percentage of time glucose is >180 mg/dL. Target: ≤25%.',
    tbr: 'Percentage of time glucose is <70 mg/dL. Target: <4%.',
    mean: 'Average glucose value across the period. Goal: maintain stable levels.',
    cv: 'Coefficient of Variation: glucose variability. Target: ≤36%. Lower = more stable.',
    gmi: 'Glucose Management Indicator: estimated HbA1c from CGM data. Target: <7.0%.',
    gri: 'Glycemia Risk Index: composite risk score. <20 = very low, 20-40 = low, 40-60 = moderate, 60-80 = high, ≥80 = very high risk.',
    mage: 'Mean Amplitude of Glycemic Excursions: measures major glucose swings.',
    modd: 'Mean Of Daily Differences: day-to-day glucose pattern consistency.'
  };

  const explanation = explanations[metric];
  if (!explanation) return null;

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <HelpCircle 
        style={{ 
          width: '14px', 
          height: '14px', 
          color: 'var(--text-secondary)',
          cursor: 'help',
          opacity: 0.6
        }} 
      />
      
      {isVisible && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--bg-primary)',
