/**
 * VisualizationContainer.jsx
 * 
 * Container for all data visualization and metrics display.
 * Extracted from AGPGenerator.jsx (Sprint C1 Phase 3)
 * 
 * Handles:
 * - Main charts (AGPChart)
 * - Metrics (MetricsDisplay - includes HypoglycemiaEvents + WorkScheduleAnalysis)
 * - Split views (DayNightSplit)
 * - Comparison view
 * 
 * @version 1.2.0 - Moved HypoglycemiaEvents into MetricsDisplay
 * @version 1.1.0 - Removed duplicate WorkdaySplit (now in MetricsDisplay)
 * @created 2025-11-02
 */

import React from 'react';
import AGPChart from '../AGPChart';
import MetricsDisplay from '../MetricsDisplay';
import DayNightSplit from '../DayNightSplit';
import ComparisonView from '../ComparisonView';
import { usePeriod } from '../../hooks/usePeriod';

const VisualizationContainer = React.memo(function VisualizationContainer({
  // Metrics data
  metricsResult,
  comparisonData,
  
  // TDD data
  tddData,
  
  // Feature toggles
  dayNightEnabled,
  onDayNightToggle
}) {
  // Get period state from context
  const { startDate, endDate } = usePeriod();
  
  if (!metricsResult) return null;
  
  return (
    <>
      {/* 1. AGP CHART - Visual Overview First */}
      <section className="section">
        <AGPChart
          agpData={metricsResult.agp}
          events={metricsResult.events}
          metrics={metricsResult.metrics}
          comparison={comparisonData?.comparisonAGP || null}
        />
      </section>

      {/* 2. HERO METRICS - TIR, Mean, CV, GMI + All Secondary + HypoglycemiaEvents + WorkSchedule */}
      <section className="section">
        <MetricsDisplay
          metrics={metricsResult.metrics}
          tddData={tddData}
          workdayMetrics={metricsResult.workdayMetrics}
          restdayMetrics={metricsResult.restdayMetrics}
          events={metricsResult.events}
          startDate={startDate}
          endDate={endDate}
        />
      </section>

      {/* 3. DAY/NIGHT SPLIT */}
      <section className="section">
        <DayNightSplit
          dayMetrics={metricsResult.dayMetrics}
          nightMetrics={metricsResult.nightMetrics}
          enabled={dayNightEnabled}
          onToggle={onDayNightToggle}
        />
      </section>

      {/* 4. PERIOD COMPARISON - Last */}
      {comparisonData && (
        <section className="section">
          <ComparisonView
            currentMetrics={metricsResult.metrics}
            previousMetrics={comparisonData.comparison}
            startDate={startDate}
            endDate={endDate}
            prevStart={comparisonData.prevStart}
            prevEnd={comparisonData.prevEnd}
          />
        </section>
      )}
    </>
  );
});

export default VisualizationContainer;
