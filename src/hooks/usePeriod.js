import { usePeriod as usePeriodContext } from '../contexts/PeriodContext';

/**
 * Convenience hook for period context
 * Re-exports usePeriod from PeriodContext for consistency
 */
export { usePeriod } from '../contexts/PeriodContext';

/**
 * Hook for components that only need period dates
 * @returns {{ startDate, endDate, updateDateRange }}
 */
export function usePeriodDates() {
  const { startDate, endDate, updateDateRange } = usePeriodContext();
  return { startDate, endDate, updateDateRange };
}

/**
 * Hook for components that only need date range limits
 * @returns {{ min, max }}
 */
export function useDateRange() {
  const { safeDateRange } = usePeriodContext();
  return safeDateRange;
}

/**
 * Hook for components that need period info
 * @returns {{ days, isCustomRange, description }}
 */
export function usePeriodInfo() {
  const { periodInfo } = usePeriodContext();
  return periodInfo;
}
