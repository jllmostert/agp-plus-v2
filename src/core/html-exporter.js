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

/**
 * Generate SVG path data for AGP curve
 */
const generateAGPPath = (agpData, percentile) => {
  return agpData.map((d, i) => {
    const x = 60 + (i / CONFIG.AGP_BINS) * 780;
    const y = 350 - ((d[percentile] / CONFIG.GLUCOSE.MAX) * 300);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
};

/**
 * Generate SVG path for filled AGP band
 */
const generateAGPBand = (agpData, topPercentile, bottomPercentile) => {
  const topPath = agpData.map((d, i) => {
    const x = 60 + (i / CONFIG.AGP_BINS) * 780;
    const y = 350 - ((d[topPercentile] / CONFIG.GLUCOSE.MAX) * 300);
    return `${x},${y}`;
  }).join(' L ');
  
  const bottomPath = agpData.slice().reverse().map((d, i) => {
    const reverseIdx = CONFIG.AGP_BINS - 1 - i;
    const x = 60 + (reverseIdx / CONFIG.AGP_BINS) * 780;
    const y = 350 - ((d[bottomPercentile] / CONFIG.GLUCOSE.MAX) * 300);
    return `${x},${y}`;
  }).join(' L ');
  
  return `M ${topPath} L ${bottomPath} Z`;
};

/**
 * Generate complete HTML report
 */
export const generateHTML = (options) => {
  const {
    metrics,
    agpData,
    events,
    startDate,
    endDate,
    dayNightMetrics = null,
    workdaySplit = null,
    comparison = null
  } = options;

  // Validate required data
  if (!metrics || !agpData || !startDate || !endDate) {
    console.error('generateHTML: Missing required data', { metrics: !!metrics, agpData: !!agpData, startDate: !!startDate, endDate: !!endDate });
    throw new Error('Missing required data for HTML generation');
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AGP+ Report - ${startDate} to ${endDate}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: "Courier New", "Courier", monospace;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      background: #fff;
      padding: 8mm;
    }
    
    @media print {
      body {
        padding: 5mm;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      @page {
        size: A4;
        margin: 5mm;
      }
    }
    
    /* Header */
    .header {
      border-bottom: 3px solid #000;
      padding-bottom: 4mm;
      margin-bottom: 4mm;
    }
    
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    
    .subtitle {
      font-size: 9pt;
      color: #333;
    }
    
    /* Section spacing */
    .section {
      margin-bottom: 5mm;
    }
    
    h2 {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 2mm;
      padding-bottom: 1mm;
      border-bottom: 2px solid #000;
    }
    
    /* Metrics Grid - Compact 4-column */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3mm;
      margin-bottom: 3mm;
    }
    
    .metric-card {
      border: 2px solid #000;
      padding: 2mm;
    }
    
    .metric-label {
      font-size: 8pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    
    .metric-value {
      font-size: 20pt;
      font-weight: bold;
      line-height: 1;
    }
    
    .metric-subtitle {
      font-size: 7pt;
      margin-top: 1mm;
    }
    
    /* TIR Bar - High contrast */
    .tir-bar {
      display: flex;
      height: 8mm;
      border: 2px solid #000;
      margin-bottom: 2mm;
    }
    
    .tir-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      font-weight: bold;
      border-right: 1px solid #000;
    }
    
    .tir-segment:last-child {
      border-right: none;
    }
    
    /* Patterns for print clarity */
    .tir-tbr { 
      background: repeating-linear-gradient(
        45deg,
        #fff,
        #fff 2px,
        #000 2px,
        #000 4px
      );
    }
    .tir-tir { background: #000; color: #fff; }
    .tir-tar { background: #ddd; }
    
    .tir-legend {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      margin-bottom: 3mm;
    }
    
    /* SVG - High contrast for print */
    svg {
      border: 2px solid #000;
      background: #fff;
      margin-bottom: 3mm;
    }
    
    /* Details Grid - Compact 2-column */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3mm;
      margin-bottom: 3mm;
    }
    
    .details-card {
      border: 2px solid #000;
      padding: 2mm;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 1mm 0;
      border-bottom: 1px solid #ccc;
      font-size: 9pt;
    }
    
    .detail-row:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-weight: normal;
    }
    
    .detail-value {
      font-weight: bold;
    }
    
    /* Event Summary - Inline compact */
    .event-summary {
      display: flex;
      gap: 3mm;
      margin-top: 3mm;
    }
    
    .event-card {
      flex: 1;
      border: 2px solid #000;
      padding: 2mm;
      text-align: center;
    }
    
    .event-label {
      font-size: 8pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    
    .event-count {
      font-size: 18pt;
      font-weight: bold;
    }
    
    /* Comparison Grid - 3 columns */
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3mm;
      margin-top: 3mm;
    }
    
    .comparison-card {
      border: 2px solid #000;
      padding: 2mm;
    }
    
    .comparison-label {
      font-size: 8pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    
    .comparison-values {
      display: flex;
      align-items: baseline;
      gap: 2mm;
      font-size: 11pt;
      margin-bottom: 1mm;
    }
    
    .comparison-old {
      color: #666;
    }
    
    .comparison-arrow {
      font-weight: bold;
    }
    
    .comparison-new {
      font-size: 16pt;
      font-weight: bold;
    }
    
    .comparison-delta {
      font-size: 9pt;
      font-weight: bold;
    }
    
    /* Split Grid - 2 columns */
    .split-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3mm;
      margin-top: 3mm;
    }
    
    .split-card {
      border: 2px solid #000;
      padding: 2mm;
    }
    
    .split-header {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 2mm;
      padding-bottom: 1mm;
      border-bottom: 1px solid #000;
    }
    
    .split-info {
      font-size: 8pt;
      color: #666;
      margin-bottom: 2mm;
    }
    
    /* Footer */
    .footer {
      margin-top: 5mm;
      padding-top: 2mm;
      border-top: 1px solid #000;
      font-size: 7pt;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AGP+ Report</h1>
    <div class="subtitle">Medtronic 780G | ${startDate} to ${endDate} (${metrics.days} days) | Generated: ${new Date().toLocaleDateString()}</div>
  </div>

  <div class="section">
    <h2>Glucose Metrics</h2>
    
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
          <span class="detail-label">TAR (time above 180 mg/dL)</span>
          <span class="detail-value">${metrics.tar}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">TBR (time below 70 mg/dL)</span>
          <span class="detail-value">${metrics.tbr}%</span>
        </div>
      </div>
      <div class="details-card">
        <div class="detail-row">
          <span class="detail-label">Minimum</span>
          <span class="detail-value">${metrics.min} mg/dL</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Maximum</span>
          <span class="detail-value">${metrics.max} mg/dL</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Days analyzed</span>
          <span class="detail-value">${metrics.days}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total readings</span>
          <span class="detail-value">${metrics.readingCount}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Ambulatory Glucose Profile</h2>
    
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
    
    <div class="tir-legend">
      <span><strong>TBR</strong> &lt;70 mg/dL (striped)</span>
      <span><strong>TIR</strong> 70-180 mg/dL (black - TARGET)</span>
      <span><strong>TAR</strong> &gt;180 mg/dL (gray)</span>
    </div>
    
    <svg viewBox="0 0 900 450" width="100%">
      <!-- Grid lines - critical thresholds -->
      <line x1="60" y1="${350 - (54/400)*300}" x2="840" y2="${350 - (54/400)*300}" 
        stroke="#000" stroke-width="2" stroke-dasharray="8,4" />
      <line x1="60" y1="${350 - (70/400)*300}" x2="840" y2="${350 - (70/400)*300}" 
        stroke="#000" stroke-width="3" />
      <line x1="60" y1="${350 - (180/400)*300}" x2="840" y2="${350 - (180/400)*300}" 
        stroke="#000" stroke-width="3" />
      <line x1="60" y1="${350 - (250/400)*300}" x2="840" y2="${350 - (250/400)*300}" 
        stroke="#000" stroke-width="2" stroke-dasharray="8,4" />
      
      <!-- Y-axis labels -->
      <text x="45" y="${350 - (54/400)*300 + 5}" font-size="12" font-weight="bold" text-anchor="end">54</text>
      <text x="45" y="${350 - (70/400)*300 + 5}" font-size="13" font-weight="bold" text-anchor="end">70</text>
      <text x="45" y="${350 - (180/400)*300 + 5}" font-size="13" font-weight="bold" text-anchor="end">180</text>
      <text x="45" y="${350 - (250/400)*300 + 5}" font-size="12" font-weight="bold" text-anchor="end">250</text>
      <text x="45" y="355" font-size="11" text-anchor="end">0</text>
      <text x="45" y="55" font-size="11" text-anchor="end">400</text>
      <text x="20" y="210" font-size="11" font-weight="bold" text-anchor="middle" transform="rotate(-90 20 210)">mg/dL</text>
      
      <!-- X-axis -->
      ${[0, 3, 6, 9, 12, 15, 18, 21, 24].map(hour => {
        const x = 60 + (hour / 24) * 780;
        return `
          <line x1="${x}" y1="50" x2="${x}" y2="360" stroke="#ccc" stroke-width="1" />
          <text x="${x}" y="375" font-size="11" text-anchor="middle">${String(hour).padStart(2, '0')}:00</text>
        `;
      }).join('')}
      <text x="450" y="395" font-size="11" font-weight="bold" text-anchor="middle">Time of Day</text>
      
      <!-- AGP bands - higher contrast -->
      <path d="${generateAGPBand(agpData, 'p5', 'p95')}" fill="#ddd" />
      <path d="${generateAGPBand(agpData, 'p25', 'p75')}" fill="#aaa" />
      
      <!-- Median line - thick black -->
      <path d="${generateAGPPath(agpData, 'p50')}" stroke="#000" stroke-width="3" fill="none" />
      
      <!-- Mean line - dashed -->
      <path d="${generateAGPPath(agpData, 'mean')}" stroke="#666" stroke-width="2" stroke-dasharray="6,3" fill="none" />
      
      ${comparison ? `
      <!-- Comparison median - dotted -->
      <path d="${generateAGPPath(comparison.comparisonAGP, 'p50')}" stroke="#000" stroke-width="2" stroke-dasharray="2,4" fill="none" />
      ` : ''}
      
      <!-- Legend box -->
      <rect x="680" y="60" width="150" height="${comparison ? '110' : '90'}" fill="#fff" stroke="#000" stroke-width="2" />
      <text x="755" y="78" font-size="11" font-weight="bold" text-anchor="middle">LEGEND</text>
      <line x1="690" y1="85" x2="720" y2="85" stroke="#000" stroke-width="3" />
      <text x="725" y="88" font-size="10">Median (p50)</text>
      <line x1="690" y1="100" x2="720" y2="100" stroke="#666" stroke-width="2" stroke-dasharray="6,3" />
      <text x="725" y="103" font-size="10">Mean</text>
      ${comparison ? `
      <line x1="690" y1="115" x2="720" y2="115" stroke="#000" stroke-width="2" stroke-dasharray="2,4" />
      <text x="725" y="118" font-size="10">Previous</text>
      ` : ''}
      <rect x="690" y="${comparison ? '125' : '110'}" width="30" height="8" fill="#aaa" />
      <text x="725" y="${comparison ? '132' : '117'}" font-size="10">IQR (p25-p75)</text>
      <rect x="690" y="${comparison ? '140' : '125'}" width="30" height="8" fill="#ddd" />
      <text x="725" y="${comparison ? '147' : '132'}" font-size="10">p5-p95</text>
    </svg>
    
    <div class="event-summary">
      <div class="event-card">
        <div class="event-label">HYPO L2 (&lt;54)</div>
        <div class="event-count">${events.hypoL2.count}</div>
      </div>
      <div class="event-card">
        <div class="event-label">HYPO L1 (54-69)</div>
        <div class="event-count">${events.hypoL1.count}</div>
      </div>
      <div class="event-card">
        <div class="event-label">HYPER (&gt;250)</div>
        <div class="event-count">${events.hyper.count}</div>
      </div>
    </div>
  </div>

  ${comparison ? `
  <div class="section page-break">
    <h2>Period Comparison</h2>
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
    <h2>Day vs Night Analysis</h2>
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
    <h2>Workday vs Rest Day Analysis</h2>
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

  <div class="footer">
    AGP+ Generator v2.1 | Medtronic MiniMed 780G + Guardian Sensor 4 | International Consensus 2023
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