/**
 * ARTIFACT-03: HTML Exporter
 * Generate standalone HTML reports for AGP analysis
 * 
 * Design principles:
 * - Print-optimized (A4, black/white, high contrast)
 * - Information density (minimal whitespace)
 * - Clear visual hierarchy
 * - Self-contained (no external dependencies)
 * 
 * Exports:
 * - generateHTML: Create complete HTML document
 * - downloadHTML: Trigger browser download
 */

import { CONFIG } from './metrics-engine.js';
import { APP_VERSION } from '../utils/version.js';

/**
 * Calculate dynamic Y-axis range based on actual data
 * Same logic as DayProfileCard for consistent behavior
 */
const calculateDynamicYRange = (agpData) => {
  // Extract all glucose values from AGP data
  const allValues = [];
  agpData.forEach(bin => {
    // Get all percentiles (5, 25, 50, 75, 95)
    Object.keys(bin).forEach(key => {
      if (!isNaN(bin[key])) {
        allValues.push(bin[key]);
      }
    });
  });

  if (allValues.length === 0) {
    // Fallback to clinical range if no data
    return { yMin: 54, yMax: 250 };
  }

  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const dataRange = dataMax - dataMin;

  // Dynamic padding: more zoom for tight ranges, less for wide ranges
  const padding_buffer = dataRange < 100 ? 30 : dataRange < 150 ? 20 : 15;

  // Adaptive range: start with clinical range (54-250), expand if needed
  const yMin = Math.max(40, Math.min(54, dataMin - padding_buffer));
  const yMax = Math.min(400, Math.max(250, dataMax + padding_buffer));

  return { yMin, yMax };
};

/**
 * Generate SVG path data for AGP curve with dynamic Y-axis
 */
const generateAGPPath = (agpData, percentile, yMin, yMax) => {
  const yRange = yMax - yMin;
  return agpData.map((d, i) => {
    const x = 60 + (i / CONFIG.AGP_BINS) * 780;
    const y = 350 - (((d[percentile] - yMin) / yRange) * 300);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
};

/**
 * Generate SVG path for filled AGP band with dynamic Y-axis
 */
const generateAGPBand = (agpData, topPercentile, bottomPercentile, yMin, yMax) => {
  const yRange = yMax - yMin;
  const topPath = agpData.map((d, i) => {
    const x = 60 + (i / CONFIG.AGP_BINS) * 780;
    const y = 350 - (((d[topPercentile] - yMin) / yRange) * 300);
    return `${x},${y}`;
  }).join(' L ');
  
  const bottomPath = agpData.slice().reverse().map((d, i) => {
    const reverseIdx = CONFIG.AGP_BINS - 1 - i;
    const x = 60 + (reverseIdx / CONFIG.AGP_BINS) * 780;
    const y = 350 - (((d[bottomPercentile] - yMin) / yRange) * 300);
    return `${x},${y}`;
  }).join(' L ');
  
  return `M ${topPath} L ${bottomPath} Z`;
};

/**
 * Generate automated clinical summary
 * One-line interpretation of key metrics
 */
const generateClinicalSummary = (metrics) => {
  const tir = parseFloat(metrics.tir);
  const cv = parseFloat(metrics.cv);
  const tbr = parseFloat(metrics.tbr);
  
  const parts = [];
  
  // TIR assessment
  if (tir >= 70) {
    parts.push(`TIR ${tir}% (target met)`);
  } else if (tir >= 50) {
    parts.push(`TIR ${tir}% (below target)`);
  } else {
    parts.push(`TIR ${tir}% (needs improvement)`);
  }
  
  // CV assessment
  if (cv <= 36) {
    parts.push('stable glucose');
  } else {
    parts.push('variable glucose');
  }
  
  // TBR warning
  if (tbr > 4) {
    parts.push(`TBR ${tbr}% (caution)`);
  } else if (tbr > 1) {
    parts.push(`TBR ${tbr}% (monitor)`);
  }
  
  return parts.join(', ');
};

/**
 * Generate complete HTML report
 */
export const generateHTML = (options) => {
  const {
    metrics,
    agpData,
    events,
    tddData = null,
    startDate,
    endDate,
    dayNightMetrics = null,
    workdaySplit = null,
    comparison = null,
    patientInfo = null
  } = options;

  // Validate required data
  if (!metrics || !agpData || !startDate || !endDate) {
    console.error('generateHTML: Missing required data', { metrics: !!metrics, agpData: !!agpData, startDate: !!startDate, endDate: !!endDate });
    throw new Error('Missing required data for HTML generation');
  }

  // Calculate dynamic Y-axis range
  const { yMin, yMax } = calculateDynamicYRange(agpData);
  const yRange = yMax - yMin;

  // Calculate Y-axis ticks
  const calculateYTicks = () => {
    const range = yMax - yMin;
    const idealTickCount = 5;
    const roughStep = range / idealTickCount;
    
    // Round to nice numbers
    let step;
    if (roughStep <= 25) step = 20;
    else if (roughStep <= 40) step = 25;
    else if (roughStep <= 60) step = 40;
    else step = 50;

    const ticks = [];
    const startTick = Math.ceil(yMin / step) * step;
    
    for (let tick = startTick; tick <= yMax; tick += step) {
      ticks.push(tick);
    }

    // Always include 70 and 180 if in range
    const CRITICAL_TICKS = [70, 180];
    const MIN_SPACING = 15;
    
    for (const critical of CRITICAL_TICKS) {
      if (yMin <= critical && yMax >= critical) {
        const hasConflict = ticks.some(t => t !== critical && Math.abs(t - critical) < MIN_SPACING);
        
        if (hasConflict) {
          const filtered = ticks.filter(t => Math.abs(t - critical) >= MIN_SPACING);
          ticks.length = 0;
          ticks.push(...filtered, critical);
        } else if (!ticks.includes(critical)) {
          ticks.push(critical);
        }
      }
    }

    return ticks.sort((a, b) => a - b);
  };

  const yTicks = calculateYTicks();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AGP+ Report - ${startDate} to ${endDate}</title>
  <style>
    /* ===================================================================
       AGP+ HTML EXPORT - BRUTALIST PRINT DESIGN
       Matches screen version: Monospace, uppercase, massive borders
       Optimized for: B/W printing, high contrast, information density
       =================================================================== */
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: "SF Mono", "Monaco", "Courier New", "Courier", monospace;
      font-size: 9pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
      padding: 8mm;
      /* Sharp edges, no smoothing */
      -webkit-font-smoothing: none;
      -moz-osx-font-smoothing: grayscale;
    }
    
    @media print {
      body {
        padding: 5mm;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      .page-landscape {
        page-break-before: always;
      }
      
      @page {
        size: A4 portrait;
        margin: 5mm;
      }
      
      @page :nth(2) {
        size: A4 landscape;
        margin: 8mm;
      }
    }
    
    /* Header - Brutalist */
    .header {
      border: 3px solid #000;
      padding: 4mm;
      margin-bottom: 5mm;
      background: #000;
      color: #fff;
    }
    
    h1 {
      font-size: 18pt;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 2mm;
    }
    
    .subtitle {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.8;
    }
    
    /* Section spacing */
    .section {
      margin-bottom: 6mm;
    }
    
    h2 {
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 3mm;
      padding: 2mm;
      border: 2px solid #000;
      background: #000;
      color: #fff;
    }
    
    /* Metrics Grid - 4-column hero cards, BRUTALIST borders */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3mm;
      margin-bottom: 4mm;
    }
    
    .metric-card {
      border: 3px solid #000;
      padding: 3mm;
    }
    
    .metric-label {
      font-size: 10pt;
      font-weight: 700;
      letterSpacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 2mm;
    }
    
    .metric-value {
      font-size: 20pt;
      font-weight: 700;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }
    
    .metric-subtitle {
      font-size: 9pt;
      margin-top: 2mm;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
    }
    
    /* TIR Bar - High contrast, BRUTALIST */
    .tir-bar {
      display: flex;
      height: 10mm;
      border: 3px solid #000;
      margin-bottom: 3mm;
    }
    
    .tir-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-right: 2px solid #000;
    }
    
    .tir-segment:last-child {
      border-right: none;
    }
    
    /* Patterns for print clarity - AGGRESSIVE CONTRAST */
    .tir-tbr { 
      background: repeating-linear-gradient(
        45deg,
        #fff,
        #fff 2px,
        #000 2px,
        #000 4px
      );
    }
    .tir-tir { 
      background: #000; 
      color: #fff; 
    }
    .tir-tar { 
      /* Dot pattern for B&W print distinction */
      background-image: radial-gradient(circle, #000 1px, transparent 1px);
      background-size: 5px 5px;
      background-color: #fff;
    }
    
    .tir-legend {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4mm;
    }
    
    /* SVG - BRUTALIST borders */
    svg {
      border: 3px solid #000;
      background: #fff;
      margin-bottom: 4mm;
    }
    
    /* Details Grid - Compact 2-column, BRUTALIST */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3mm;
      margin-bottom: 4mm;
    }
    
    .details-card {
      border: 3px solid #000;
      padding: 3mm;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 2mm 0;
      border-bottom: 1px solid #000;
      font-size: 9pt;
    }
    
    .detail-row:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 10pt;
    }
    
    .detail-value {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    
    /* Event Summary - BRUTALIST style */
    .event-summary {
      display: flex;
      gap: 3mm;
      margin-top: 4mm;
    }
    
    .event-card {
      flex: 1;
      border: 3px solid #000;
      padding: 3mm;
      text-align: center;
    }
    
    .event-label {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 2mm;
    }
    
    .event-count {
      font-size: 18pt;
      font-weight: 700;
      line-height: 1;
    }
    
    /* Comparison Grid - BRUTALIST 3 columns */
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3mm;
      margin-top: 4mm;
    }
    
    .comparison-card {
      border: 3px solid #000;
      padding: 3mm;
    }
    
    .comparison-label {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 2mm;
    }
    
    .comparison-values {
      display: flex;
      align-items: baseline;
      gap: 2mm;
      font-size: 10pt;
      margin-bottom: 1mm;
    }
    
    .comparison-old {
      color: #555; /* Darker for better print contrast (was #666) */
      font-variant-numeric: tabular-nums;
    }
    
    .comparison-arrow {
      font-weight: 700;
    }
    
    .comparison-new {
      font-size: 16pt;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    
    .comparison-delta {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    
    /* Split Grid - BRUTALIST 2 columns */
    .split-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3mm;
      margin-top: 4mm;
    }
    
    .split-card {
      border: 3px solid #000;
      padding: 3mm;
    }
    
    .split-header {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 2mm;
      padding-bottom: 2mm;
      border-bottom: 2px solid #000;
    }
    
    .split-info {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
      margin-bottom: 2mm;
    }
    
    /* Footer - BRUTALIST */
    .footer {
      margin-top: 6mm;
      padding: 3mm;
      border: 3px solid #000;
      background: #000;
      color: #fff;
      font-size: 7pt;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AGP+ v${__APP_VERSION__}</h1>
    ${patientInfo && patientInfo.name ? `
    <div class="subtitle" style="margin-bottom: 2mm; font-size: 10pt; background: #fff; color: #000; padding: 2mm; border: 2px solid #fff;">
      <div style="margin-bottom: 1mm;">
        <strong>PATIENT:</strong> ${patientInfo.name.toUpperCase()}${patientInfo.dob ? ` | <strong>DOB:</strong> ${new Date(patientInfo.dob).toLocaleDateString('nl-NL')}` : ''}
      </div>
      ${patientInfo.physician ? `<div style="margin-bottom: 1mm;"><strong>PHYSICIAN:</strong> ${patientInfo.physician.toUpperCase()}</div>` : ''}
      ${patientInfo.email ? `<div style="margin-bottom: 1mm;"><strong>EMAIL:</strong> ${patientInfo.email}</div>` : ''}
      ${patientInfo.cgm ? `<div><strong>CGM DEVICE:</strong> ${patientInfo.cgm.toUpperCase()}</div>` : ''}
    </div>
    ` : ''}
    <div class="subtitle">AMBULATORY GLUCOSE PROFILE | ${startDate} → ${endDate} (${metrics.days} DAYS)</div>
    <div class="subtitle" style="margin-top: 2mm; padding: 2mm; background: #f5f5f5; color: #000; border: 2px solid #ddd;">
      <strong>CLINICAL SUMMARY:</strong> ${generateClinicalSummary(metrics)}
    </div>
  </div>

  <div class="section">
    <h2>GLUCOSE METRICS</h2>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">TIME IN RANGE</div>
        <div class="metric-value">${metrics.tir}%</div>
        <div class="metric-subtitle">Target &gt;70%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">MEAN ± SD</div>
        <div class="metric-value">${metrics.mean}</div>
        <div class="metric-subtitle">± ${metrics.sd} mg/dL</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">CV</div>
        <div class="metric-value">${metrics.cv}%</div>
        <div class="metric-subtitle">Target ≤36%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">GMI</div>
        <div class="metric-value">${metrics.gmi}%</div>
        <div class="metric-subtitle">Est. HbA1c</div>
      </div>
    </div>
    
    <div class="details-grid">
      <div class="details-card">
        <div class="detail-row">
          <span class="detail-label">MAGE (glycemic excursion)</span>
          <span class="detail-value">${metrics.mage} mg/dL</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">MODD (day-to-day variability)</span>
          <span class="detail-value">${metrics.modd} mg/dL</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">GRI (glycemia risk index)</span>
          <span class="detail-value">${metrics.gri} ${
            Number(metrics.gri) < 20 ? '(Very low)' :
            Number(metrics.gri) < 40 ? '(Low)' :
            Number(metrics.gri) < 60 ? '(Moderate)' :
            Number(metrics.gri) < 80 ? '(High)' : '(Very high)'
          }</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">TAR (time above 180 mg/dL)</span>
          <span class="detail-value">${metrics.tar}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">TBR (time below 70 mg/dL)</span>
          <span class="detail-value">${metrics.tbr}%</span>
        </div>
      </div>
      <div class="details-card">
        ${tddData ? `
        <div class="detail-row">
          <span class="detail-label">TDD (Total Daily Dose)</span>
          <span class="detail-value">${tddData.meanTDD.toFixed(1)} ± ${tddData.sdTDD.toFixed(1)} E</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Range (Min - Max)</span>
          <span class="detail-value">${metrics.min} - ${metrics.max} mg/dL</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Days analyzed</span>
          <span class="detail-value">${metrics.days}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total readings</span>
          <span class="detail-value">${metrics.readingCount.toLocaleString()} <span style="font-size: 0.8em; color: #555;">(${metrics.dataQuality?.uptimePercent || 0}% uptime)</span></span>
        </div>
      </div>
    </div>
  </div>

  <div class="section page-landscape">
    <h2>AMBULATORY GLUCOSE PROFILE</h2>
    
    <div class="tir-bar">
      <div class="tir-segment tir-tbr" style="width: ${metrics.tbr}%">
        ${parseFloat(metrics.tbr) > 8 ? `${metrics.tbr}%` : ''}
      </div>
      <div class="tir-segment tir-tir" style="width: ${metrics.tir}%">
        ${metrics.tir}%
      </div>
      <div class="tir-segment tir-tar" style="width: ${metrics.tar}%">
        ${parseFloat(metrics.tar) > 8 ? `${metrics.tar}%` : ''}
      </div>
    </div>
    
    <!-- Annotations below TIR bar for print clarity -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 3mm; padding: 0 2mm; font-size: 8pt; font-weight: 700;">
      <div style="text-align: left;">
        <span style="background: repeating-linear-gradient(45deg, #fff, #fff 2px, #000 2px, #000 4px); padding: 1mm 2mm; border: 2px solid #000;">TBR ${metrics.tbr}%</span>
      </div>
      <div style="text-align: center;">
        <span style="background: #000; color: #fff; padding: 1mm 2mm; border: 2px solid #000;">TIR ${metrics.tir}%</span>
      </div>
      <div style="text-align: right;">
        <span style="background-image: radial-gradient(circle, #000 1px, transparent 1px); background-size: 5px 5px; background-color: #fff; color: #000; padding: 1mm 2mm; border: 2px solid #000;">TAR ${metrics.tar}%</span>
      </div>
    </div>
    
    <div class="tir-legend">
      <span><strong>TBR</strong> &lt;70 mg/dL (striped)</span>
      <span><strong>TIR</strong> 70-180 mg/dL (black - TARGET)</span>
      <span><strong>TAR</strong> &gt;180 mg/dL (dotted)</span>
    </div>
    
    <!-- Hypo events summary -->
    <div style="font-size: 8pt; color: #555; margin-bottom: 3mm; text-align: center;">
      <strong style="color: #000;">Hypo episodes/day:</strong> 
      <strong>${((events.hypoEpisodes?.count || 0) / metrics.days).toFixed(1)}</strong> (≥15min, &lt;70 mg/dL) • 
      <strong style="color: #000;">Severe (nadir &lt;54):</strong> 
      <strong>${((events.hypoEpisodes?.severeCount || 0) / metrics.days).toFixed(1)}</strong>
    </div>
    
    <svg viewBox="0 0 900 450" width="100%">
      <!-- Grid lines - critical thresholds (dynamic) -->
      ${[54, 70, 180, 250].filter(val => yMin <= val && yMax >= val).map(val => {
        const y = 350 - ((val - yMin) / yRange) * 300;
        const isDashed = val === 54 || val === 250;
        return `<line x1="60" y1="${y}" x2="840" y2="${y}" 
          stroke="#000" stroke-width="${isDashed ? '2' : '3'}" ${isDashed ? 'stroke-dasharray="8,4"' : ''} />`;
      }).join('\n      ')}
      
      <!-- Y-axis labels (dynamic ticks) -->
      ${yTicks.map(tick => {
        const y = 350 - ((tick - yMin) / yRange) * 300;
        const isCritical = tick === 70 || tick === 180;
        return `<text x="45" y="${y + 5}" font-size="${isCritical ? '13' : '12'}" font-weight="bold" text-anchor="end">${tick}</text>`;
      }).join('\n      ')}
      <text x="20" y="210" font-size="11" font-weight="bold" text-anchor="middle" transform="rotate(-90 20 210)">mg/dL</text>
      
      <!-- X-axis -->
      ${[0, 3, 6, 9, 12, 15, 18, 21, 24].map(hour => {
        const x = 60 + (hour / 24) * 780;
        return `
          <line x1="${x}" y1="50" x2="${x}" y2="360" stroke="#bbb" stroke-width="1" />
          <text x="${x}" y="375" font-size="11" text-anchor="middle">${String(hour).padStart(2, '0')}:00</text>
        `;
      }).join('')}
      <text x="450" y="395" font-size="11" font-weight="bold" text-anchor="middle">Time of Day</text>
      
      <!-- AGP bands - higher contrast for print -->
      <path d="${generateAGPBand(agpData, 'p5', 'p95', yMin, yMax)}" fill="#ccc" />
      <path d="${generateAGPBand(agpData, 'p25', 'p75', yMin, yMax)}" fill="#999" />
      
      <!-- Median line - thick black -->
      <path d="${generateAGPPath(agpData, 'p50', yMin, yMax)}" stroke="#000" stroke-width="3" fill="none" />
      
      <!-- Mean line - dashed (darker for print) -->
      <path d="${generateAGPPath(agpData, 'mean', yMin, yMax)}" stroke="#444" stroke-width="2" stroke-dasharray="6,3" fill="none" />
      
      ${comparison ? `
      <!-- Comparison median - dotted -->
      <path d="${generateAGPPath(comparison.comparisonAGP, 'p50', yMin, yMax)}" stroke="#000" stroke-width="2" stroke-dasharray="2,4" fill="none" />
      ` : ''}
      
      <!-- Hypo event markers - colored by severity -->
      ${(events.hypoEpisodes?.events || []).map(episode => {
        const x = 60 + (episode.minuteOfDay / 1440) * 780;
        const y = 350 - ((episode.startGlucose - yMin) / yRange) * 300;
        const isSevere = episode.severity === 'severe';
        return `
          <circle cx="${x}" cy="${y}" r="${isSevere ? 5 : 4}" fill="${isSevere ? '#dc2626' : '#ea580c'}" stroke="#000000" stroke-width="2"/>
          ${isSevere ? `<text x="${x}" y="${y + 1.5}" text-anchor="middle" fill="#ffffff" font-size="8" font-weight="bold">×</text>` : ''}
        `;
      }).join('')}
      
      <!-- Legend box -->
      <rect x="680" y="60" width="150" height="${comparison ? '110' : '90'}" fill="#fff" stroke="#000" stroke-width="2" />
      <text x="755" y="78" font-size="11" font-weight="bold" text-anchor="middle">LEGEND</text>
      <line x1="690" y1="85" x2="720" y2="85" stroke="#000" stroke-width="3" />
      <text x="725" y="88" font-size="10">Median (p50)</text>
      <line x1="690" y1="100" x2="720" y2="100" stroke="#444" stroke-width="2" stroke-dasharray="6,3" />
      <text x="725" y="103" font-size="10">Mean</text>
      ${comparison ? `
      <line x1="690" y1="115" x2="720" y2="115" stroke="#000" stroke-width="2" stroke-dasharray="2,4" />
      <text x="725" y="118" font-size="10">Previous</text>
      ` : ''}
      <rect x="690" y="${comparison ? '125' : '110'}" width="30" height="8" fill="#999" />
      <text x="725" y="${comparison ? '132' : '117'}" font-size="10">IQR (p25-p75)</text>
      <rect x="690" y="${comparison ? '140' : '125'}" width="30" height="8" fill="#ccc" />
      <text x="725" y="${comparison ? '147' : '132'}" font-size="10">p5-p95</text>
    </svg>
    
    <div class="event-summary">
      <div class="event-card">
        <div class="event-label">SEVERE (nadir &lt;54)</div>
        <div class="event-count">${events.hypoEpisodes?.severeCount || 0}</div>
      </div>
      <div class="event-card">
        <div class="event-label">LOW (nadir ≥54)</div>
        <div class="event-count">${events.hypoEpisodes?.lowCount || 0}</div>
      </div>
      <div class="event-card">
        <div class="event-label">HYPER (&gt;250)</div>
        <div class="event-count">${events.hyper.count}</div>
      </div>
    </div>
  </div>

  ${comparison ? `
  <div class="section page-break">
    <h2>PERIOD COMPARISON</h2>
    <div class="split-info">
      Previous: ${comparison.prevStart} to ${comparison.prevEnd} | Current: ${startDate} to ${endDate}
    </div>
    
    <div class="comparison-grid">
      <div class="comparison-card">
        <div class="comparison-label">TIME IN RANGE</div>
        <div class="comparison-values">
          <span class="comparison-old">${comparison.previous.tir}%</span>
          <span class="comparison-arrow">→</span>
          <span class="comparison-new">${metrics.tir}%</span>
        </div>
        <div class="comparison-delta">
          ${(parseFloat(metrics.tir) - parseFloat(comparison.previous.tir)) > 0 ? '▲' : '▼'} 
          ${Math.abs(parseFloat(metrics.tir) - parseFloat(comparison.previous.tir)).toFixed(1)}%
        </div>
      </div>
      <div class="comparison-card">
        <div class="comparison-label">MEAN ± SD</div>
        <div class="comparison-values">
          <span class="comparison-old">${comparison.previous.mean}±${comparison.previous.sd}</span>
          <span class="comparison-arrow">→</span>
          <span class="comparison-new">${metrics.mean}±${metrics.sd}</span>
        </div>
        <div class="comparison-delta">
          ${metrics.mean - comparison.previous.mean > 0 ? '▲' : '▼'} 
          ${Math.abs(metrics.mean - comparison.previous.mean)} mg/dL
        </div>
      </div>
      <div class="comparison-card">
        <div class="comparison-label">CV (VARIABILITY)</div>
        <div class="comparison-values">
          <span class="comparison-old">${comparison.previous.cv}%</span>
          <span class="comparison-arrow">→</span>
          <span class="comparison-new">${metrics.cv}%</span>
        </div>
        <div class="comparison-delta">
          ${(parseFloat(metrics.cv) - parseFloat(comparison.previous.cv)) > 0 ? '▲' : '▼'} 
          ${Math.abs(parseFloat(metrics.cv) - parseFloat(comparison.previous.cv)).toFixed(1)}%
        </div>
      </div>
    </div>
  </div>
  ` : ''}

  ${dayNightMetrics ? `
  <div class="section">
    <h2>DAY VS NIGHT ANALYSIS</h2>
    <div class="split-info">Night: 00:00-06:00 (6h) | Day: 06:00-00:00 (18h)</div>
    
    <div class="split-grid">
      <div class="split-card">
        <div class="split-header">DAY (06:00-00:00)</div>
        <div class="detail-row">
          <span class="detail-label">Time in Range</span>
          <span class="detail-value">${dayNightMetrics.day.tir}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Mean ± SD</span>
          <span class="detail-value">${dayNightMetrics.day.mean} ± ${dayNightMetrics.day.sd}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CV</span>
          <span class="detail-value">${dayNightMetrics.day.cv}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Readings</span>
          <span class="detail-value">${dayNightMetrics.day.readingCount}</span>
        </div>
      </div>
      <div class="split-card">
        <div class="split-header">NIGHT (00:00-06:00)</div>
        <div class="detail-row">
          <span class="detail-label">Time in Range</span>
          <span class="detail-value">${dayNightMetrics.night.tir}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Mean ± SD</span>
          <span class="detail-value">${dayNightMetrics.night.mean} ± ${dayNightMetrics.night.sd}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CV</span>
          <span class="detail-value">${dayNightMetrics.night.cv}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Readings</span>
          <span class="detail-value">${dayNightMetrics.night.readingCount}</span>
        </div>
      </div>
    </div>
  </div>
  ` : ''}

  ${workdaySplit ? `
  <div class="section">
    <h2>WORKDAY VS REST DAY ANALYSIS</h2>
    <div class="split-info">Workdays: ${workdaySplit.workdayCount} | Rest days: ${workdaySplit.restdayCount}</div>
    
    <div class="split-grid">
      <div class="split-card">
        <div class="split-header">WORKDAYS (${workdaySplit.workdayCount} days)</div>
        <div class="detail-row">
          <span class="detail-label">Time in Range</span>
          <span class="detail-value">${workdaySplit.workday.tir}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Mean ± SD</span>
          <span class="detail-value">${workdaySplit.workday.mean} ± ${workdaySplit.workday.sd}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CV</span>
          <span class="detail-value">${workdaySplit.workday.cv}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">MAGE</span>
          <span class="detail-value">${workdaySplit.workday.mage}</span>
        </div>
      </div>
      <div class="split-card">
        <div class="split-header">REST DAYS (${workdaySplit.restdayCount} days)</div>
        <div class="detail-row">
          <span class="detail-label">Time in Range</span>
          <span class="detail-value">${workdaySplit.restday.tir}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Mean ± SD</span>
          <span class="detail-value">${workdaySplit.restday.mean} ± ${workdaySplit.restday.sd}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CV</span>
          <span class="detail-value">${workdaySplit.restday.cv}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">MAGE</span>
          <span class="detail-value">${workdaySplit.restday.mage}</span>
        </div>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="footer" style="margin-top: 8mm; padding-top: 4mm; border-top: 3px solid #000; font-size: 7pt;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 2mm;">
      <div>
        <strong>REPORT GENERATED:</strong> ${new Date().toLocaleString('nl-NL', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }).toUpperCase()}
      </div>
      <div>
        <strong>AGP+ VERSION:</strong> ${APP_VERSION}
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; color: #555;">
      <div>
        <strong>ANALYSIS PERIOD:</strong> ${metrics.days} DAYS | ${metrics.readingCount.toLocaleString()} CGM READINGS
      </div>
      <div>
        <strong>DATA QUALITY:</strong> ${metrics.dataQuality?.uptimePercent}% UPTIME
      </div>
    </div>
    <div style="margin-top: 2mm; text-align: center; color: #888;">
      ADA STANDARDS OF MEDICAL CARE IN DIABETES—2025
    </div>
  </div>
</body>
</html>`;

  return html;
};

/**
 * Trigger browser download of HTML report
 */
export const downloadHTML = (options) => {
  const html = generateHTML(options);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Generate unique filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
  a.download = `AGP_Report_${timestamp}.html`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};