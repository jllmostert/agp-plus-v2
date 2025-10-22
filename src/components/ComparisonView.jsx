import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * ComparisonView - Period-over-period comparison component
 * 
 * Displays side-by-side comparison of current period vs. previous period
 * with delta calculations and color-coded improvements/deteriorations.
 * 
 * @param {Object} props.currentMetrics - Metrics for current period
 * @param {Object} props.previousMetrics - Metrics for previous period (comparison)
 * @param {Date} props.startDate - Current period start date
 * @param {Date} props.endDate - Current period end date
 * @param {Date} props.prevStart - Previous period start date
 * @param {Date} props.prevEnd - Previous period end date
 * 
 * @version 2.1.0
 */
export default function ComparisonView({ 
  currentMetrics, 
  previousMetrics, 
  startDate, 
  endDate,
  prevStart,
  prevEnd
}) {
  if (!currentMetrics || !previousMetrics) {
    return null;
  }

  // Format dates for display
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  };

  // Calculate days in each period
  const currentDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const previousDays = Math.ceil((prevEnd - prevStart) / (1000 * 60 * 60 * 24)) + 1;

  // Metrics to compare (3x2 grid)
  const comparisons = [
    {
      id: 'tir',
      label: 'Time in Range',
      current: currentMetrics.tir,
      previous: previousMetrics.tir,
      unit: '%',
      format: (v) => v.toFixed(1),
      betterIfHigher: true,
      target: '≥70%',
    },
    {
      id: 'mean',
      label: 'Mean Glucose',
      current: currentMetrics.mean,
      previous: previousMetrics.mean,
      unit: 'mg/dL',
      format: (v) => v.toFixed(0),
      subtitle: (v, sd) => `± ${sd.toFixed(0)} SD`,
      currentSD: currentMetrics.sd,
      previousSD: previousMetrics.sd,
      betterIfLower: true,
      betterIfInRange: { min: 70, max: 180 },
      target: '70-180',
    },
    {
      id: 'cv',
      label: 'CV',
      current: currentMetrics.cv,
      previous: previousMetrics.cv,
      unit: '%',
      format: (v) => v.toFixed(1),
      betterIfLower: true,
      target: '≤36%',
    },
    {
      id: 'gmi',
      label: 'GMI (est. HbA1c)',
      current: currentMetrics.gmi,
      previous: previousMetrics.gmi,
      unit: '%',
      format: (v) => v.toFixed(1),
      betterIfLower: true,
      target: '<7.0%',
    },
    {
      id: 'mage',
      label: 'MAGE',
      current: currentMetrics.mage,
      previous: previousMetrics.mage,
      unit: 'mg/dL',
      format: (v) => v.toFixed(0),
      betterIfLower: true,
      target: 'Lower better',
    },
    {
      id: 'modd',
      label: 'MODD',
      current: currentMetrics.modd,
      previous: previousMetrics.modd,
      unit: 'mg/dL',
      format: (v) => v.toFixed(0),
      betterIfLower: true,
      target: 'Lower better',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">
          Period Comparison
        </h3>
        <div className="text-sm text-gray-400">
          Current vs. Previous
        </div>
      </div>

      {/* Period Labels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card border-2 border-blue-600/50">
          <div className="text-sm text-gray-400 mb-1">Current Period</div>
          <div className="text-lg font-semibold text-blue-400">
            {formatDate(startDate)} → {formatDate(endDate)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{currentDays} days</div>
        </div>

        <div className="card border-2 border-gray-600/50">
          <div className="text-sm text-gray-400 mb-1">Previous Period</div>
          <div className="text-lg font-semibold text-gray-400">
            {formatDate(prevStart)} → {formatDate(prevEnd)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{previousDays} days</div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparisons.map((comparison) => (
          <ComparisonCard key={comparison.id} {...comparison} />
        ))}
      </div>

      {/* Overall Assessment */}
      <OverallAssessment comparisons={comparisons} />
    </div>
  );
}

/**
 * ComparisonCard - Individual comparison card for a metric
 */
function ComparisonCard({ 
  label, 
  current, 
  previous, 
  unit, 
  format, 
  subtitle,
  currentSD,
  previousSD,
  betterIfHigher, 
  betterIfLower,
  betterIfInRange,
  target 
}) {
  // Calculate delta
  const delta = current - previous;
  const deltaPercent = previous !== 0 ? ((delta / previous) * 100) : 0;

  // Determine if change is improvement
  let isImprovement = false;
  let isDeterioration = false;
  
  if (Math.abs(delta) > 0.1) { // Only consider significant changes
    if (betterIfHigher) {
      isImprovement = delta > 0;
      isDeterioration = delta < 0;
    } else if (betterIfLower) {
      isImprovement = delta < 0;
      isDeterioration = delta > 0;
    } else if (betterIfInRange) {
      // For mean: check if moving towards or away from target range
      const currentDistance = Math.min(
        Math.abs(current - betterIfInRange.min),
        Math.abs(current - betterIfInRange.max)
      );
      const previousDistance = Math.min(
        Math.abs(previous - betterIfInRange.min),
        Math.abs(previous - betterIfInRange.max)
      );
      isImprovement = currentDistance < previousDistance;
      isDeterioration = currentDistance > previousDistance;
    }
  }

  // Get delta icon and color
  const getDeltaDisplay = () => {
    if (Math.abs(delta) < 0.1) {
      return {
        icon: Minus,
        color: 'text-gray-500',
        text: 'No change',
      };
    }
    
    if (isImprovement) {
      return {
        icon: delta > 0 ? TrendingUp : TrendingDown,
        color: 'text-green-400',
        text: `${delta > 0 ? '+' : ''}${format(delta)} ${unit}`,
      };
    }
    
    if (isDeterioration) {
      return {
        icon: delta > 0 ? TrendingUp : TrendingDown,
        color: 'text-red-400',
        text: `${delta > 0 ? '+' : ''}${format(delta)} ${unit}`,
      };
    }
    
    return {
      icon: delta > 0 ? TrendingUp : TrendingDown,
      color: 'text-gray-400',
      text: `${delta > 0 ? '+' : ''}${format(delta)} ${unit}`,
    };
  };

  const deltaDisplay = getDeltaDisplay();
  const DeltaIcon = deltaDisplay.icon;

  return (
    <div className="card">
      {/* Label */}
      <div className="text-sm text-gray-400 mb-3">{label}</div>

      {/* Current Value */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-blue-400">
            {format(current)}
          </span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
        {subtitle && currentSD && (
          <div className="text-xs text-gray-600 mt-0.5">
            {subtitle(current, currentSD)}
          </div>
        )}
        <div className="text-xs text-gray-600">Current</div>
      </div>

      {/* Delta */}
      <div className={`flex items-center gap-1 mb-2 ${deltaDisplay.color}`}>
        <DeltaIcon className="w-4 h-4" />
        <span className="text-sm font-medium">{deltaDisplay.text}</span>
        {Math.abs(deltaPercent) > 1 && (
          <span className="text-xs">({deltaPercent > 0 ? '+' : ''}{deltaPercent.toFixed(0)}%)</span>
        )}
      </div>

      {/* Previous Value */}
      <div className="pt-2 border-t border-gray-700">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold text-gray-400">
            {format(previous)}
          </span>
          <span className="text-xs text-gray-600">{unit}</span>
        </div>
        {subtitle && previousSD && (
          <div className="text-xs text-gray-600 mt-0.5">
            {subtitle(previous, previousSD)}
          </div>
        )}
        <div className="text-xs text-gray-600">Previous</div>
      </div>

      {/* Target */}
      {target && (
        <div className="mt-2 text-xs text-gray-500">
          Target: {target}
        </div>
      )}
    </div>
  );
}

/**
 * OverallAssessment - Summary of improvements/deteriorations
 */
function OverallAssessment({ comparisons }) {
  let improvements = 0;
  let deteriorations = 0;
  let unchanged = 0;

  comparisons.forEach((comp) => {
    const delta = comp.current - comp.previous;
    
    if (Math.abs(delta) < 0.1) {
      unchanged++;
      return;
    }

    let isImprovement = false;
    if (comp.betterIfHigher) {
      isImprovement = delta > 0;
    } else if (comp.betterIfLower) {
      isImprovement = delta < 0;
    } else if (comp.betterIfInRange) {
      const currentDistance = Math.min(
        Math.abs(comp.current - comp.betterIfInRange.min),
        Math.abs(comp.current - comp.betterIfInRange.max)
      );
      const previousDistance = Math.min(
        Math.abs(comp.previous - comp.betterIfInRange.min),
        Math.abs(comp.previous - comp.betterIfInRange.max)
      );
      isImprovement = currentDistance < previousDistance;
    }

    if (isImprovement) {
      improvements++;
    } else {
      deteriorations++;
    }
  });

  // Determine overall message
  let message = '';
  let colorClass = '';
  let icon = '';

  if (improvements > deteriorations) {
    message = `Overall improvement: ${improvements} metrics improved, ${deteriorations} declined`;
    colorClass = 'bg-green-900/20 border-green-700 text-green-300';
    icon = '✓';
  } else if (deteriorations > improvements) {
    message = `Mixed results: ${improvements} metrics improved, ${deteriorations} declined`;
    colorClass = 'bg-yellow-900/20 border-yellow-700 text-yellow-300';
    icon = '⚠';
  } else {
    message = `Stable control: ${improvements} improved, ${deteriorations} declined, ${unchanged} unchanged`;
    colorClass = 'bg-blue-900/20 border-blue-700 text-blue-300';
    icon = '=';
  }

  return (
    <div className={`card ${colorClass}`}>
      <p className="text-sm">
        {icon} {message}
      </p>
    </div>
  );
}
