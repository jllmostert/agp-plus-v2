import React from 'react';
import { Briefcase, Home, TrendingUp, Activity } from 'lucide-react';

/**
 * WorkdaySplit - Workday vs. Rest-day Analysis Component
 * 
 * Displays side-by-side comparison of glucose metrics for workdays vs. rest days.
 * Uses ProTime data to classify days as work or rest.
 * 
 * @param {Object} props.workdayMetrics - Metrics calculated for workdays only
 * @param {Object} props.restdayMetrics - Metrics calculated for rest days only
 * @param {number} props.workdayCount - Number of workdays in period
 * @param {number} props.restdayCount - Number of rest days in period
 * 
 * @version 2.1.0
 */
export default function WorkdaySplit({ 
  workdayMetrics, 
  restdayMetrics, 
  workdayCount, 
  restdayCount 
}) {
  if (!workdayMetrics || !restdayMetrics) {
    return null;
  }

  // Calculate deltas (workday - restday)
  const deltas = {
    tir: workdayMetrics.tir - restdayMetrics.tir,
    mean: workdayMetrics.mean - restdayMetrics.mean,
    cv: workdayMetrics.cv - restdayMetrics.cv,
    mage: workdayMetrics.mage - restdayMetrics.mage,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">
          Work Schedule Analysis
        </h3>
        <div className="text-sm text-gray-400">
          ProTime-based split
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Workdays</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{workdayCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((workdayCount / (workdayCount + restdayCount)) * 100).toFixed(0)}% of period
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-gray-300">Rest Days</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{restdayCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((restdayCount / (workdayCount + restdayCount)) * 100).toFixed(0)}% of period
          </div>
        </div>
      </div>

      {/* Side-by-side Metrics Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Workday Card */}
        <WorkdayCard
          type="workday"
          metrics={workdayMetrics}
          dayCount={workdayCount}
          deltas={deltas}
        />

        {/* Rest Day Card */}
        <WorkdayCard
          type="restday"
          metrics={restdayMetrics}
          dayCount={restdayCount}
          deltas={deltas}
        />
      </div>

      {/* Insights */}
      <WorkdayInsights deltas={deltas} />
    </div>
  );
}

/**
 * WorkdayCard - Individual card for workday or rest-day metrics
 */
function WorkdayCard({ type, metrics, dayCount, deltas }) {
  const isWorkday = type === 'workday';
  const themeColor = isWorkday ? 'yellow' : 'green';
  const Icon = isWorkday ? Briefcase : Home;
  const label = isWorkday ? 'Workdays' : 'Rest Days';

  const metricItems = [
    {
      label: 'Time in Range',
      value: metrics.tir,
      unit: '%',
      format: (v) => v.toFixed(1),
      delta: isWorkday ? deltas.tir : -deltas.tir,
      betterIfHigher: true,
    },
    {
      label: 'Mean Glucose',
      value: metrics.mean,
      unit: 'mg/dL',
      format: (v) => v.toFixed(0),
      subtitle: `± ${metrics.sd.toFixed(0)} SD`,
      delta: isWorkday ? deltas.mean : -deltas.mean,
      betterIfLower: true,
    },
    {
      label: 'CV',
      value: metrics.cv,
      unit: '%',
      format: (v) => v.toFixed(1),
      delta: isWorkday ? deltas.cv : -deltas.cv,
      betterIfLower: true,
    },
    {
      label: 'MAGE',
      value: metrics.mage,
      unit: 'mg/dL',
      format: (v) => v.toFixed(0),
      delta: isWorkday ? deltas.mage : -deltas.mage,
      betterIfLower: true,
    },
  ];

  return (
    <div className={`card border-2 border-${themeColor}-600/50`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
        <Icon className={`w-5 h-5 text-${themeColor}-400`} />
        <h4 className={`text-lg font-semibold text-${themeColor}-400`}>{label}</h4>
        <span className="text-sm text-gray-500 ml-auto">({dayCount} days)</span>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {metricItems.map((item, idx) => (
          <MetricRow key={idx} {...item} />
        ))}
      </div>
    </div>
  );
}

/**
 * MetricRow - Individual metric display with optional delta
 */
function MetricRow({ label, value, unit, format, subtitle, delta, betterIfHigher, betterIfLower }) {
  const formattedValue = format ? format(value) : value;
  
  // Determine delta color
  let deltaColor = 'text-gray-500';
  if (delta !== undefined && delta !== 0) {
    if (betterIfHigher) {
      deltaColor = delta > 0 ? 'text-green-400' : 'text-red-400';
    } else if (betterIfLower) {
      deltaColor = delta < 0 ? 'text-green-400' : 'text-red-400';
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm text-gray-400">{label}</div>
        {subtitle && <div className="text-xs text-gray-600 mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold text-gray-100">
          {formattedValue}
        </span>
        <span className="text-sm text-gray-500">{unit}</span>
        {delta !== undefined && Math.abs(delta) > 0.1 && (
          <span className={`text-xs ml-2 ${deltaColor}`}>
            {delta > 0 ? '+' : ''}{format ? format(delta) : delta.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * WorkdayInsights - Automatic insights based on deltas
 */
function WorkdayInsights({ deltas }) {
  const insights = [];

  // TIR insights
  if (Math.abs(deltas.tir) > 5) {
    const betterDay = deltas.tir > 0 ? 'workdays' : 'rest days';
    const diff = Math.abs(deltas.tir).toFixed(1);
    insights.push({
      type: deltas.tir > 0 ? 'positive' : 'warning',
      message: `Time in Range is ${diff}% higher on ${betterDay}`,
    });
  }

  // CV insights
  if (Math.abs(deltas.cv) > 3) {
    const betterDay = deltas.cv < 0 ? 'workdays' : 'rest days';
    const diff = Math.abs(deltas.cv).toFixed(1);
    insights.push({
      type: deltas.cv < 0 ? 'positive' : 'warning',
      message: `Glucose variability (CV) is ${diff}% lower on ${betterDay}`,
    });
  }

  // MAGE insights
  if (Math.abs(deltas.mage) > 10) {
    const betterDay = deltas.mage < 0 ? 'workdays' : 'rest days';
    const diff = Math.abs(deltas.mage).toFixed(0);
    insights.push({
      type: deltas.mage < 0 ? 'positive' : 'warning',
      message: `Glycemic excursions (MAGE) are ${diff} mg/dL lower on ${betterDay}`,
    });
  }

  if (insights.length === 0) {
    return (
      <div className="card bg-blue-900/20 border-blue-700">
        <p className="text-sm text-blue-300">
          ✓ Glucose control is similar between workdays and rest days (no major differences detected)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {insights.map((insight, idx) => (
        <div
          key={idx}
          className={`card ${
            insight.type === 'positive'
              ? 'bg-green-900/20 border-green-700'
              : 'bg-yellow-900/20 border-yellow-700'
          }`}
        >
          <p className={`text-sm ${
            insight.type === 'positive' ? 'text-green-300' : 'text-yellow-300'
          }`}>
            {insight.type === 'positive' ? '✓' : '⚠'} {insight.message}
          </p>
        </div>
      ))}
    </div>
  );
}
