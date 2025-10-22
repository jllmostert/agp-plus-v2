import React, { useState } from 'react';
import { Sun, Moon, ToggleLeft, ToggleRight } from 'lucide-react';

/**
 * DayNightSplit - Day/Night analysis component
 * 
 * Displays glucose metrics split by day (06:00-00:00) and night (00:00-06:00)
 * with toggle to enable/disable the analysis.
 * 
 * @param {Object} props.dayMetrics - Metrics for daytime period (06:00-00:00)
 * @param {Object} props.nightMetrics - Metrics for nighttime period (00:00-06:00)
 * @param {boolean} props.enabled - Whether day/night split is enabled
 * @param {Function} props.onToggle - Callback when toggle is clicked
 * 
 * @version 2.1.0
 */
export default function DayNightSplit({ dayMetrics, nightMetrics, enabled, onToggle }) {
  if (!dayMetrics || !nightMetrics) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">
          Day/Night Analysis
        </h3>
        
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all
            ${enabled 
              ? 'bg-blue-600 text-white border-2 border-blue-400' 
              : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
          `}
        >
          {enabled ? (
            <>
              <ToggleRight className="w-5 h-5" />
              <span>Enabled</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5" />
              <span>Disabled</span>
            </>
          )}
        </button>
      </div>

      {/* Only show cards when enabled */}
      {enabled && (
        <>
          {/* Time Period Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Sun className="w-4 h-4 text-blue-400" />
              <span>Day: 06:00 - 00:00 (18 hours)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Night: 00:00 - 06:00 (6 hours)</span>
            </div>
          </div>

          {/* Side-by-side Metrics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Day Card */}
            <DayNightCard
              type="day"
              metrics={dayMetrics}
              compareMetrics={nightMetrics}
            />

            {/* Night Card */}
            <DayNightCard
              type="night"
              metrics={nightMetrics}
              compareMetrics={dayMetrics}
            />
          </div>

          {/* Insights */}
          <DayNightInsights dayMetrics={dayMetrics} nightMetrics={nightMetrics} />
        </>
      )}

      {/* Disabled State Message */}
      {!enabled && (
        <div className="card bg-gray-800/50 border-gray-700">
          <p className="text-sm text-gray-400 text-center">
            Click "Disabled" above to enable day/night split analysis
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * DayNightCard - Individual card for day or night metrics
 */
function DayNightCard({ type, metrics, compareMetrics }) {
  const isDay = type === 'day';
  const themeColor = isDay ? 'blue' : 'indigo';
  const Icon = isDay ? Sun : Moon;
  const label = isDay ? 'Day' : 'Night';
  const timeRange = isDay ? '06:00 - 00:00' : '00:00 - 06:00';

  // Calculate deltas (current - compare)
  const deltas = {
    tir: metrics.tir - compareMetrics.tir,
    tar: metrics.tar - compareMetrics.tar,
    tbr: metrics.tbr - compareMetrics.tbr,
    mean: metrics.mean - compareMetrics.mean,
    cv: metrics.cv - compareMetrics.cv,
  };

  const metricItems = [
    {
      label: 'TIR (70-180)',
      value: metrics.tir,
      unit: '%',
      format: (v) => v.toFixed(1),
      delta: deltas.tir,
      betterIfHigher: true,
    },
    {
      label: 'TAR (>180)',
      value: metrics.tar,
      unit: '%',
      format: (v) => v.toFixed(1),
      delta: deltas.tar,
      betterIfLower: true,
    },
    {
      label: 'TBR (<70)',
      value: metrics.tbr,
      unit: '%',
      format: (v) => v.toFixed(1),
      delta: deltas.tbr,
      betterIfLower: true,
    },
    {
      label: 'Mean',
      value: metrics.mean,
      unit: 'mg/dL',
      format: (v) => v.toFixed(0),
      subtitle: `± ${metrics.sd.toFixed(0)} SD`,
      delta: deltas.mean,
    },
    {
      label: 'CV',
      value: metrics.cv,
      unit: '%',
      format: (v) => v.toFixed(1),
      delta: deltas.cv,
      betterIfLower: true,
    },
    {
      label: 'Min',
      value: metrics.min,
      unit: 'mg/dL',
      format: (v) => v.toFixed(0),
    },
    {
      label: 'Max',
      value: metrics.max,
      unit: 'mg/dL',
      format: (v) => v.toFixed(0),
    },
    {
      label: 'Readings',
      value: metrics.readingCount,
      unit: '',
      format: (v) => v.toLocaleString(),
    },
  ];

  return (
    <div className={`card border-2 border-${themeColor}-600/50`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
        <Icon className={`w-5 h-5 text-${themeColor}-400`} />
        <div className="flex-1">
          <h4 className={`text-lg font-semibold text-${themeColor}-400`}>{label}</h4>
          <p className="text-xs text-gray-500">{timeRange}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metricItems.map((item, idx) => (
          <MetricItem key={idx} {...item} themeColor={themeColor} />
        ))}
      </div>
    </div>
  );
}

/**
 * MetricItem - Individual metric display within day/night card
 */
function MetricItem({ label, value, unit, format, subtitle, delta, betterIfHigher, betterIfLower, themeColor }) {
  const formattedValue = format ? format(value) : value;

  // Determine delta color
  let deltaColor = 'text-gray-600';
  if (delta !== undefined && Math.abs(delta) > 0.5) {
    if (betterIfHigher) {
      deltaColor = delta > 0 ? 'text-green-400' : 'text-red-400';
    } else if (betterIfLower) {
      deltaColor = delta < 0 ? 'text-green-400' : 'text-red-400';
    }
  }

  return (
    <div className="text-left">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-semibold text-${themeColor}-400`}>
          {formattedValue}
        </span>
        {unit && <span className="text-xs text-gray-600">{unit}</span>}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-600 mt-0.5">{subtitle}</div>
      )}
      {delta !== undefined && Math.abs(delta) > 0.5 && (
        <div className={`text-xs ${deltaColor} mt-0.5`}>
          {delta > 0 ? '+' : ''}{format ? format(delta) : delta.toFixed(1)}
        </div>
      )}
    </div>
  );
}

/**
 * DayNightInsights - Automatic insights based on day/night differences
 */
function DayNightInsights({ dayMetrics, nightMetrics }) {
  const insights = [];

  // TIR comparison
  const tirDiff = dayMetrics.tir - nightMetrics.tir;
  if (Math.abs(tirDiff) > 5) {
    const betterPeriod = tirDiff > 0 ? 'daytime' : 'nighttime';
    const worsePeriod = tirDiff > 0 ? 'nighttime' : 'daytime';
    insights.push({
      type: 'info',
      message: `Time in Range is ${Math.abs(tirDiff).toFixed(1)}% higher during ${betterPeriod}`,
      suggestion: tirDiff < 0 
        ? 'Consider adjusting daytime insulin or meal timing'
        : 'Review nighttime basal rates if control is suboptimal',
    });
  }

  // TBR nighttime warning
  if (nightMetrics.tbr > 4) {
    insights.push({
      type: 'warning',
      message: `Nighttime TBR is ${nightMetrics.tbr.toFixed(1)}% (target: <4%)`,
      suggestion: 'Consider reducing nighttime basal rates to prevent nocturnal hypoglycemia',
    });
  }

  // TAR nighttime issue
  if (nightMetrics.tar > 25) {
    insights.push({
      type: 'warning',
      message: `Nighttime TAR is ${nightMetrics.tar.toFixed(1)}% (target: <25%)`,
      suggestion: 'Review nighttime basal rates or evening meal timing',
    });
  }

  // CV comparison
  const cvDiff = dayMetrics.cv - nightMetrics.cv;
  if (Math.abs(cvDiff) > 5) {
    const morePeriod = cvDiff > 0 ? 'daytime' : 'nighttime';
    insights.push({
      type: 'info',
      message: `Glucose variability is ${Math.abs(cvDiff).toFixed(1)}% higher during ${morePeriod}`,
      suggestion: morePeriod === 'daytime'
        ? 'Daytime variability may be related to meals or activity'
        : 'Consider more stable nighttime basal rates',
    });
  }

  // No major differences
  if (insights.length === 0) {
    insights.push({
      type: 'positive',
      message: 'Glucose control is well-balanced between day and night periods',
      suggestion: null,
    });
  }

  return (
    <div className="space-y-2">
      {insights.map((insight, idx) => (
        <InsightCard key={idx} {...insight} />
      ))}
    </div>
  );
}

/**
 * InsightCard - Individual insight/recommendation card
 */
function InsightCard({ type, message, suggestion }) {
  const styles = {
    positive: 'bg-green-900/20 border-green-700 text-green-300',
    info: 'bg-blue-900/20 border-blue-700 text-blue-300',
    warning: 'bg-yellow-900/20 border-yellow-700 text-yellow-300',
  };

  const icons = {
    positive: '✓',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className={`card ${styles[type]}`}>
      <p className="text-sm">
        {icons[type]} {message}
      </p>
      {suggestion && (
        <p className="text-xs mt-2 opacity-80">
          💡 {suggestion}
        </p>
      )}
    </div>
  );
}
