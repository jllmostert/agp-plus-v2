/**
 * VisualizationContainer.jsx
 * 
 * Container for all data visualization and metrics display.
 * Extracted from AGPGenerator.jsx (Sprint C1 Phase 3)
 * 
 * Handles:
 * - Main charts (AGPChart, MetricsDisplay)
 * - Events (HypoglycemiaEvents)
 * - Split views (DayNightSplit, WorkdaySplit)
 * - Comparison view
 * 
 * @version 1.0.0
 * @created 2025-11-02
 */

import React from 'react';
import AGPChart from '../AGPChart';
import MetricsDisplay from '../MetricsDisplay';
import HypoglycemiaEvents from '../HypoglycemiaEvents';
import DayNightSplit from '../DayNightSplit';
import WorkdaySplit from '../WorkdaySplit';
import ComparisonView from '../ComparisonView';
import { usePeriod } from '../../hooks/usePeriod';

const VisualizationContainer = React.memo(function VisualizationContainer({
  // Metrics data
  metricsResult,
  comparisonData,
  
  // TDD data
  tddData,
  
  // Feature toggles
  workdays,
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

      {/* 2. HERO METRICS - TIR, Mean, CV, GMI + All Secondary */}
      <section className="section">
        <MetricsDisplay
          metrics={metricsResult.metrics}
          tddData={tddData}
          startDate={startDate}
          endDate={endDate}
        />
      </section>

      {/* 3. HYPOGLYCEMIA EVENTS - Warning Panel */}
      <section className="section">
        <HypoglycemiaEvents 
          events={metricsResult.events} 
          tbrPercent={metricsResult.metrics?.tbr}
          gri={metricsResult.metrics?.gri}
        />
      </section>

      {/* 4. DAY/NIGHT SPLIT */}
      <section className="section">
        <DayNightSplit
          dayMetrics={metricsResult.dayMetrics}
          nightMetrics={metricsResult.nightMetrics}
          enabled={dayNightEnabled}
          onToggle={onDayNightToggle}
        />
      </section>

      {/* 5. WORKDAY SPLIT - Only show when ProTime loaded */}
      {workdays && metricsResult.workdayMetrics && metricsResult.restdayMetrics && (
        <section className="section">
          <WorkdaySplit
            workdayMetrics={metricsResult.workdayMetrics}
            restdayMetrics={metricsResult.restdayMetrics}
            workdays={workdays}
            startDate={startDate}
            endDate={endDate}
          />
        </section>
      )}

      {/* 6. PERIOD COMPARISON - Last */}
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
