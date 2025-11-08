/**
 * Metric Definitions for Tooltips/Help
 * 
 * Provides concise, clinical explanations for AGP+ metrics.
 * Used in on-screen tooltips and HTML export annotations.
 * 
 * Format: { label, unit, description, target?, interpretation? }
 * 
 * SCIENTIFIC REFERENCES:
 * - TIR/TAR/TBR: Battelino T et al., Diabetes Care 2019;42(8):1593-1603 (ATTD Consensus)
 * - GMI: Beck RW et al., Diabetes Care 2019;42(4):659-666
 * - CV: Monnier L et al., Diabetes Care 2008;31(11):2116-2119
 * - MAGE: Service FJ et al., Diabetes 1970;19(9):644-655
 * - MODD: Molnar GD et al., Diabetologia 1972;8:342-348
 * - Mean/SD: ADA Standards of Care 2023
 */

export const METRIC_DEFINITIONS = {
  tir: {
    label: 'Time In Range',
    unit: '%',
    description: 'Percentage of time glucose is between 70-180 mg/dL',
    target: '≥70%',
    interpretation: 'Higher is better. Gold standard for glucose control.'
  },
  
  tar: {
    label: 'Time Above Range',
    unit: '%',
    description: 'Percentage of time glucose is >180 mg/dL',
    target: '≤25%',
    interpretation: 'Lower is better. Indicates hyperglycemia exposure.'
  },
  
  tbr: {
    label: 'Time Below Range',
    unit: '%',
    description: 'Percentage of time glucose is <70 mg/dL',
    target: '<4%',
    interpretation: 'Lower is better. Indicates hypoglycemia risk.'
  },
  
  cv: {
    label: 'Coefficient of Variation',
    unit: '%',
    description: 'Standard deviation divided by mean glucose, expressed as percentage',
    target: '≤36%',
    interpretation: 'Measures glucose variability. Lower = more stable.'
  },
  
  gmi: {
    label: 'Glucose Management Indicator',
    unit: '%',
    description: 'Estimated HbA1c based on mean glucose levels',
    target: '<7.0%',
    interpretation: 'Approximates lab HbA1c from CGM data.'
  },
  
  gri: {
    label: 'Glycemia Risk Index',
    unit: '',
    description: 'Composite risk score weighing hypo and hyperglycemia',
    target: '<20 (very low), <40 (low), <60 (moderate), <80 (high), ≥80 (very high)',
    interpretation: 'Single number for overall glucose risk. Lower is better.'
  },
  
  mage: {
    label: 'Mean Amplitude of Glycemic Excursions',
    unit: 'mg/dL',
    description: 'Average size of major glucose swings (excursions ≥1 SD)',
    target: '<60 mg/dL',
    interpretation: 'Captures intraday glucose variability and swings.'
  },
  
  modd: {
    label: 'Mean Of Daily Differences',
    unit: 'mg/dL',
    description: 'Average glucose difference at same time on consecutive days',
    target: '<40 mg/dL',
    interpretation: 'Measures day-to-day glucose consistency.'
  },
  
  mean: {
    label: 'Mean Glucose',
    unit: 'mg/dL',
    description: 'Average glucose level across the entire period',
    target: '70-180 mg/dL',
    interpretation: 'Central tendency of glucose control.'
  },
  
  sd: {
    label: 'Standard Deviation',
    unit: 'mg/dL',
    description: 'Measure of glucose spread around the mean',
    target: '<50 mg/dL',
    interpretation: 'Absolute measure of variability (complement to CV).'
  }
};

/**
 * Get tooltip text for a metric
 * @param {string} metricId - Metric identifier (e.g., 'tir', 'cv')
 * @returns {string} Formatted tooltip text
 */
export function getMetricTooltip(metricId) {
  const def = METRIC_DEFINITIONS[metricId];
  if (!def) return '';
  
  let text = `${def.label}: ${def.description}`;
  if (def.target) {
    text += `. Target: ${def.target}`;
  }
  return text;
}

/**
 * Get one-line explanation for HTML export
 * @param {string} metricId - Metric identifier
 * @returns {string} Brief explanation
 */
export function getMetricExplanation(metricId) {
  const def = METRIC_DEFINITIONS[metricId];
  if (!def) return '';
  return def.description;
}
