import React from 'react';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

/**
 * MetricsDisplay - Display grid for glucose metrics
 * 
 * Shows a 4-column responsive grid of metric cards with clinical values.
 * All metrics follow ADA/ATTD consensus guidelines.
 * 
 * @param {Object} props.metrics - Calculated metrics from metrics-engine.js
 * @param {number} props.metrics.tir - Time in Range (70-180 mg/dL) %
 * @param {number} props.metrics.tar - Time Above Range (>180 mg/dL) %
 * @param {number} props.metrics.tbr - Time Below Range (<70 mg/dL) %
 * @param {number} props.metrics.mean - Mean glucose (mg/dL)
 * @param {number} props.metrics.sd - Standard deviation (mg/dL)
 * @param {number} props.metrics.cv - Coefficient of variation %
 * @param {number} props.metrics.gmi - Glucose Management Indicator %
 * @param {number} props.metrics.mage - Mean Amplitude of Glycemic Excursions (mg/dL)
 * @param {number} props.metrics.modd - Mean of Daily Differences (mg/dL)
 * @param {number} props.metrics.days - Number of days in period
 * @param {number} props.metrics.readingCount - Total CGM readings
 * 
 * @version 2.1.0
 */
export default function MetricsDisplay({ metrics }) {
  if (!metrics) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-400">No metrics available. Please upload CSV data.</p>
      </div>
    );
  }

  const metricCards = [
    // Row 1: Time in Ranges
    {
      id: 'tir',
      label: 'Time in Range',
      value: metrics.tir,
      unit: '%',
      icon: Activity,
      target: '≥70%',
      colorClass: getColorClass('tir', metrics.tir),
      format: (val) => val.toFixed(1),
    },
    {
      id: 'tar',
      label: 'Time Above Range',
      value: metrics.tar,
      unit: '%',
      icon: TrendingUp,
      target: '<25%',
      colorClass: getColorClass('tar', metrics.tar),
      format: (val) => val.toFixed(1),
    },
    {
      id: 'tbr',
      label: 'Time Below Range',
      value: metrics.tbr,
      unit: '%',
      icon: TrendingDown,
      target: '<4%',
      colorClass: getColorClass('tbr', metrics.tbr),
      format: (val) => val.toFixed(1),
    },
    {
      id: 'mean',
      label: 'Mean Glucose',
      value: metrics.mean,
      unit: 'mg/dL',
      icon: Activity,
      target: '70-180',
      colorClass: getColorClass('mean', metrics.mean),
      format: (val) => val.toFixed(0),
      subtitle: `± ${metrics.sd.toFixed(0)} SD`,
    },

    // Row 2: Variability & Estimated HbA1c
    {
      id: 'cv',
      label: 'Coefficient of Variation',
      value: metrics.cv,
      unit: '%',
      icon: Zap,
      target: '≤36%',
      colorClass: getColorClass('cv', metrics.cv),
      format: (val) => val.toFixed(1),
    },
    {
      id: 'gmi',
      label: 'GMI (est. HbA1c)',
      value: metrics.gmi,
      unit: '%',
      icon: Activity,
      target: '<7.0%',
      colorClass: getColorClass('gmi', metrics.gmi),
      format: (val) => val.toFixed(1),
    },
    {
      id: 'mage',
      label: 'MAGE',
      value: metrics.mage,
      unit: 'mg/dL',
      icon: Zap,
      target: 'Lower better',
      colorClass: 'text-gray-100',
      format: (val) => val.toFixed(0),
      subtitle: 'Glycemic excursions',
    },
    {
      id: 'modd',
      label: 'MODD',
      value: metrics.modd,
      unit: 'mg/dL',
      icon: Zap,
      target: 'Lower better',
      colorClass: 'text-gray-100',
      format: (val) => val.toFixed(0),
      subtitle: 'Day-to-day variability',
    },

    // Row 3: Data quality
    {
      id: 'days',
      label: 'Analysis Period',
      value: metrics.days,
      unit: 'days',
      icon: Activity,
      colorClass: 'text-gray-100',
      format: (val) => val.toFixed(0),
    },
    {
      id: 'readings',
      label: 'CGM Readings',
      value: metrics.readingCount,
      unit: '',
      icon: Activity,
      colorClass: 'text-gray-100',
      format: (val) => val.toLocaleString(),
      subtitle: `${((metrics.readingCount / (metrics.days * 288)) * 100).toFixed(0)}% coverage`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Glucose Metrics</h2>
        <div className="text-sm text-gray-400">
          ADA/ATTD Consensus Guidelines
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <MetricCard key={card.id} {...card} />
        ))}
      </div>

      {/* Data Quality Warning */}
      {metrics.readingCount / (metrics.days * 288) < 0.7 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <p className="text-sm text-yellow-300">
            ⚠️ CGM coverage is below 70%. Metrics may not be fully representative.
            Aim for at least 70% CGM wear time for reliable analysis.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * MetricCard - Reusable card component for individual metrics
 */
function MetricCard({ label, value, unit, icon: Icon, target, colorClass, format, subtitle }) {
  return (
    <div className="metric-card group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="metric-label">{label}</div>
        {Icon && <Icon className="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors" />}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`metric-value ${colorClass}`}>
          {format ? format(value) : value}
        </span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>

      {/* Subtitle or Target */}
      {subtitle && (
        <div className="text-xs text-gray-500">{subtitle}</div>
      )}
      {target && !subtitle && (
        <div className="text-xs text-gray-500">Target: {target}</div>
      )}
    </div>
  );
}

/**
 * Get color class based on metric type and value
 * Uses clinical thresholds from ADA/ATTD consensus
 */
function getColorClass(metricType, value) {
  switch (metricType) {
    case 'tir':
      if (value >= 70) return 'text-green-400';
      if (value >= 50) return 'text-yellow-400';
      return 'text-red-400';
    
    case 'tar':
      if (value < 25) return 'text-green-400';
      if (value < 50) return 'text-yellow-400';
      return 'text-red-400';
    
    case 'tbr':
      if (value < 4) return 'text-green-400';
      if (value < 7) return 'text-yellow-400';
      return 'text-red-400';
    
    case 'mean':
      if (value >= 70 && value <= 180) return 'text-green-400';
      if (value >= 54 && value <= 250) return 'text-yellow-400';
      return 'text-red-400';
    
    case 'cv':
      if (value <= 36) return 'text-green-400';
      if (value <= 45) return 'text-yellow-400';
      return 'text-red-400';
    
    case 'gmi':
      if (value < 7.0) return 'text-green-400';
      if (value < 8.0) return 'text-yellow-400';
      return 'text-red-400';
    
    default:
      return 'text-gray-100';
  }
}
