/**
 * INSULIN ENGINE - Total Daily Dose (TDD) Calculation
 * AGP+ v3.1 Phase 0
 * 
 * Exports:
 * - calculateDailyTDD: Calculate TDD for each day from Section 1 + Section 2
 * - calculateTDDStatistics: Calculate aggregate statistics (mean, SD, CV)
 * - validateTDDData: Flag unusual TDD values and ratios
 */

/**
 * Calculate Total Daily Dose for each day
 * 
 * Combines:
 * - Section 2: Auto insulin (CLOSED_LOOP_AUTO_INSULIN) = autobasaal + micro-bolussen
 * - Section 1: Meal boluses (CLOSED_LOOP_BG_CORRECTION_AND_FOOD_BOLUS)
 * 
 * @param {Array} section1Data - Parsed Section 1 (meal boluses)
 * @param {Array} section2Data - Parsed Section 2 (auto insulin)
 * @returns {Object} TDD data by date (YYYY/MM/DD format)
 */
export function calculateDailyTDD(section1Data, section2Data) {
  const tddByDay = {};
  
  // Step 1: Get auto insulin from Section 2
  // Section 2 contains daily aggregated auto insulin (one row per day)
  const autoInsulinByDay = {};
  section2Data.forEach(row => {
    if (row.bolusSource === 'CLOSED_LOOP_AUTO_INSULIN') {
      const date = row.date; // Format: YYYY/MM/DD
      const amount = parseFloat(row.bolusVolumeDelivered);
      
      if (!isNaN(amount)) {
        autoInsulinByDay[date] = amount;
      }
    }
  });
  
  // Step 2: Get meal boluses from Section 1
  // Count BOTH automated meal boluses AND manual boluses
  // - CLOSED_LOOP_BG_CORRECTION_AND_FOOD_BOLUS: Auto mode meal boluses
  // - BOLUS_WIZARD: Manual boluses (corrections, meals, or both)
  // Filter out priming insulin and cancelled boluses
  const mealBolusByDay = {};
  section1Data.forEach(row => {
    const isMealBolus = row.bolusSource === 'CLOSED_LOOP_BG_CORRECTION_AND_FOOD_BOLUS';
    const isManualBolus = row.bolusSource === 'BOLUS_WIZARD';
    
    if ((isMealBolus || isManualBolus) && row.bolusVolumeDelivered > 0) {
      const date = row.date;
      
      if (!mealBolusByDay[date]) {
        mealBolusByDay[date] = 0;
      }
      mealBolusByDay[date] += parseFloat(row.bolusVolumeDelivered);
    }
  });
  
  // Step 3: Calculate TDD for each day
  const allDates = new Set([
    ...Object.keys(autoInsulinByDay),
    ...Object.keys(mealBolusByDay)
  ]);
  
  allDates.forEach(date => {
    const auto = autoInsulinByDay[date] || 0;
    const meal = mealBolusByDay[date] || 0;
    const tdd = auto + meal;
    
    tddByDay[date] = {
      date,
      autoInsulin: auto,
      mealBolus: meal,
      tdd,
      autoPercent: tdd > 0 ? (auto / tdd) * 100 : 0,
      mealPercent: tdd > 0 ? (meal / tdd) * 100 : 0
    };
  });
  
  
  return tddByDay;
}

/**
 * Calculate aggregate TDD statistics
 * 
 * @param {Object} tddByDay - TDD data by date
 * @returns {Object|null} Statistics {meanTDD, sdTDD, minTDD, maxTDD, ...}
 */
export function calculateTDDStatistics(tddByDay) {
  const tddValues = Object.values(tddByDay).map(d => d.tdd);
  const autoValues = Object.values(tddByDay).map(d => d.autoInsulin);
  const mealValues = Object.values(tddByDay).map(d => d.mealBolus);
  
  if (tddValues.length === 0) {
    return null;
  }
  
  // Calculate mean
  const meanTDD = tddValues.reduce((sum, val) => sum + val, 0) / tddValues.length;
  const meanAuto = autoValues.reduce((sum, val) => sum + val, 0) / autoValues.length;
  const meanMeal = mealValues.reduce((sum, val) => sum + val, 0) / mealValues.length;
  
  // Calculate standard deviation
  const variance = tddValues.reduce((sum, val) => sum + Math.pow(val - meanTDD, 2), 0) / tddValues.length;
  const sdTDD = Math.sqrt(variance);
  
  // Range
  const minTDD = Math.min(...tddValues);
  const maxTDD = Math.max(...tddValues);
  
  // Average percentages
  const avgAutoPercent = (meanAuto / meanTDD) * 100;
  const avgMealPercent = (meanMeal / meanTDD) * 100;
  
  return {
    meanTDD,
    sdTDD,
    minTDD,
    maxTDD,
    meanAuto,
    meanMeal,
    avgAutoPercent,
    avgMealPercent,
    dataPoints: tddValues.length
  };
}

/**
 * Validate TDD data and flag issues
 * 
 * Flags:
 * - Unusually low TDD (<15E) - possible incomplete day
 * - Unusually high TDD (>60E) - verify pump data
 * - Unusual auto/meal ratios (<20% or >70% auto)
 * - Missing auto insulin (Section 2 incomplete)
 * 
 * @param {Object} tddByDay - TDD data by date
 * @returns {Object} Validation results {warnings: [], info: [], isValid: boolean}
 */
export function validateTDDData(tddByDay) {
  const warnings = [];
  const info = [];
  
  Object.entries(tddByDay).forEach(([date, data]) => {
    // Flag unusually low TDD
    if (data.tdd < 15) {
      warnings.push({
        date,
        type: 'LOW_TDD',
        message: `Low TDD (${data.tdd.toFixed(1)}E) - possible incomplete day`,
        severity: 'warning'
      });
    }
    
    // Flag unusually high TDD
    if (data.tdd > 60) {
      warnings.push({
        date,
        type: 'HIGH_TDD',
        message: `High TDD (${data.tdd.toFixed(1)}E) - verify pump data`,
        severity: 'warning'
      });
    }
    
    // Flag unusual auto/meal ratios
    // Clinical guideline: 40-50% auto insulin is optimal
    if (data.autoPercent < 20 || data.autoPercent > 70) {
      info.push({
        date,
        type: 'UNUSUAL_RATIO',
        message: `Unusual auto/meal ratio (${data.autoPercent.toFixed(0)}%/${data.mealPercent.toFixed(0)}%)`,
        severity: 'info'
      });
    }
    
    // Flag missing auto insulin
    if (data.autoInsulin === 0 && data.mealBolus > 0) {
      warnings.push({
        date,
        type: 'MISSING_AUTO',
        message: 'No auto insulin data - Section 2 may be incomplete',
        severity: 'error'
      });
    }
  });
  
  return {
    warnings,
    info,
    isValid: warnings.filter(w => w.severity === 'error').length === 0
  };
}
