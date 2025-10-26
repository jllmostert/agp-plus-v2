/**
 * day-profiles-exporter.js
 * Generate standalone HTML for printing day profiles
 * 
 * Design principles:
 * - Maximum 2 A4 pages (3-4 profiles per page)
 * - Brutalist print optimization (monospace, 3px borders, B/W)
 * - Compact but readable (efficient space usage)
 * - Self-contained (no external dependencies)
 */

/**
 * Calculate dynamic Y-axis range for a single day curve
 * Same logic as DayProfileCard for consistency
 */
const calculateDynamicYRange = (curve) => {
  const validGlucose = curve
    .filter(d => d.hasData && d.glucose !== null)
    .map(d => d.glucose);

  if (validGlucose.length === 0) {
    return { yMin: 54, yMax: 250 }; // Fallback to clinical range
  }

  const dataMin = Math.min(...validGlucose);
  const dataMax = Math.max(...validGlucose);
  const dataRange = dataMax - dataMin;

  // Dynamic padding: more zoom for tight ranges, less for wide ranges
  const padding_buffer = dataRange < 100 ? 30 : dataRange < 150 ? 20 : 15;

  // Adaptive range: start with clinical range (54-250), expand if needed
  const yMin = Math.max(40, Math.min(54, dataMin - padding_buffer));
  const yMax = Math.min(400, Math.max(250, dataMax + padding_buffer));

  return { yMin, yMax };
};

/**
 * Generate SVG for single day glucose curve
 */
const generateDayCurveSVG = (curve, events, sensorChanges, cartridgeChanges, agpCurve) => {
  const width = 650;  // Wider for better horizontal stretch
  const height = 85;  // Smaller height to fit in compact card
  const padding = { top: 6, right: 15, bottom: 15, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate dynamic Y-axis range
  const { yMin, yMax } = calculateDynamicYRange(curve);
  const yScale = (glucose) => {
    return chartHeight - ((glucose - yMin) / (yMax - yMin)) * chartHeight;
  };
  
  // X-axis scale (288 bins = 24 hours)
  const xScale = (bin) => (bin / 288) * chartWidth;
  
  // Calculate smart Y-axis ticks
  const calculateYTicks = () => {
    const range = yMax - yMin;
    const idealTickCount = 4; // Fewer ticks for compact display
    const roughStep = range / idealTickCount;
    
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
  
  // Target zone (only render if 70 and 180 are in range)
  const targetLow = (yMin <= 180 && yMax >= 180) ? yScale(180) : null;
  const targetHigh = (yMin <= 70 && yMax >= 70) ? yScale(70) : null;
  const targetHeight = (targetLow !== null && targetHigh !== null) ? targetHigh - targetLow : 0;
  
  // Generate curve path
  const curvePoints = curve
    .filter(d => d.hasData && d.glucose !== null)
    .map(d => `${xScale(d.bin)},${yScale(d.glucose)}`)
    .join(' L ');
  const curvePath = curvePoints ? `M ${curvePoints}` : '';
  
  // AGP median reference
  let agpPath = '';
  if (agpCurve && agpCurve.length === 288) {
    agpPath = `M ${agpCurve.map((d, i) => `${xScale(i)},${yScale(d.p50)}`).join(' L ')}`;
  }
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${targetHeight > 0 ? `
      <!-- Target zone (70-180 mg/dL) -->
      <rect x="${padding.left}" y="${padding.top + targetLow}" 
            width="${chartWidth}" height="${targetHeight}" 
            fill="var(--bg-tertiary)"/>
      ` : ''}
      
      <!-- Grid lines for critical thresholds (if in range) -->
      ${yMin <= 180 && yMax >= 180 ? `
      <line x1="${padding.left}" y1="${padding.top + yScale(180)}" 
            x2="${padding.left + chartWidth}" y2="${padding.top + yScale(180)}" 
            stroke="var(--grid-line)" stroke-width="0.5" stroke-dasharray="2,2"/>
      ` : ''}
      ${yMin <= 70 && yMax >= 70 ? `
      <line x1="${padding.left}" y1="${padding.top + yScale(70)}" 
            x2="${padding.left + chartWidth}" y2="${padding.top + yScale(70)}" 
            stroke="var(--grid-line)" stroke-width="0.5" stroke-dasharray="2,2"/>
      ` : ''}
      
      <!-- Y-axis labels (dynamic ticks) -->
      ${yTicks.map(tick => `
      <text x="${padding.left - 5}" y="${padding.top + yScale(tick) + 2}" 
            text-anchor="end" font-size="7" fill="var(--text-secondary)">${tick}</text>
      `).join('')}
      
      <!-- X-axis labels -->
      ${[0, 6, 12, 18, 24].map(hour => `
        <text x="${padding.left + xScale((hour * 60) / 5)}" 
              y="${height - padding.bottom + 15}" 
              text-anchor="middle" font-size="7" fill="var(--text-secondary)">${String(hour).padStart(2, '0')}:00</text>
      `).join('')}
      
      <g transform="translate(${padding.left}, ${padding.top})">
        <!-- AGP reference (dotted) -->
        ${agpPath ? `<path d="${agpPath}" fill="none" stroke="var(--color-gray-mid)" stroke-width="1" stroke-dasharray="3,2" opacity="0.5"/>` : ''}
        
        <!-- Daily glucose curve -->
        ${curvePath ? `<path d="${curvePath}" fill="none" stroke="var(--ink)" stroke-width="1.5"/>` : ''}
        
        <!-- Event markers -->
        ${events.hypoL2.events.map(event => `
          <circle cx="${xScale((event.minuteOfDay || 0) / 5)}" 
                  cy="${yScale(event.startGlucose || 50)}" 
                  r="3" fill="var(--color-red)" stroke="var(--ink)" stroke-width="1"/>
        `).join('')}
        ${events.hypoL1.events.map(event => `
          <circle cx="${xScale((event.minuteOfDay || 0) / 5)}" 
                  cy="${yScale(event.startGlucose || 65)}" 
                  r="3" fill="var(--color-orange)" stroke="var(--ink)" stroke-width="1"/>
        `).join('')}
        ${events.hyper.events.map(event => `
          <circle cx="${xScale((event.minuteOfDay || 0) / 5)}" 
                  cy="${yScale(event.startGlucose || 260)}" 
                  r="3" fill="var(--color-orange)" stroke="var(--ink)" stroke-width="1"/>
        `).join('')}
        
        <!-- Sensor change - red dashed line when sensor stops -->
        ${sensorChanges.filter(c => c.type === 'start').map(change => `
          <line x1="${xScale(change.minuteOfDay / 5)}" y1="0" 
                x2="${xScale(change.minuteOfDay / 5)}" y2="${chartHeight}" 
                stroke="var(--color-red)" stroke-width="1.5" stroke-dasharray="4,4"/>
        `).join('')}
        
        <!-- Cartridge change - orange dotted line -->
        ${cartridgeChanges.map(change => `
          <line x1="${xScale(change.minuteOfDay / 5)}" y1="0" 
                x2="${xScale(change.minuteOfDay / 5)}" y2="${chartHeight}" 
                stroke="var(--color-orange)" stroke-width="1.5" stroke-dasharray="2,2"/>
        `).join('')}
      </g>
    </svg>
  `;
};

/**
 * Generate TIR bar pattern for print (B/W)
 */
const generateTIRBarSVG = (metrics) => {
  const tir = parseFloat(metrics.tir);
  const tar = parseFloat(metrics.tar);
  const tbr = parseFloat(metrics.tbr);
  
  const width = 35;
  const height = 65; // Smaller to fit compact card
  
  const tarHeight = (tar / 100) * height;
  const tirHeight = (tir / 100) * height;
  const tbrHeight = (tbr / 100) * height;
  
  let yPos = 0;
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <!-- TAR (top, dots pattern) -->
      ${tar > 0 ? `
        <defs>
          <pattern id="tar-dots" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="var(--ink)"/>
          </pattern>
        </defs>
        <rect x="0" y="${yPos}" width="${width}" height="${tarHeight}" 
              fill="url(#tar-dots)" stroke="var(--ink)" stroke-width="1"/>
        <text x="${width/2}" y="${yPos + tarHeight/2 + 3}" 
              text-anchor="middle" font-size="8" font-weight="bold" fill="var(--ink)">
          ${tar > 8 ? `${metrics.tar}%` : ''}
        </text>
      ` : ''}
      
      <!-- TIR (middle, solid ink) -->
      ${(() => { yPos += tarHeight; return ''; })()}
      ${tir > 0 ? `
        <rect x="0" y="${yPos}" width="${width}" height="${tirHeight}" 
              fill="var(--ink)" stroke="var(--ink)" stroke-width="1"/>
        <text x="${width/2}" y="${yPos + tirHeight/2 + 3}" 
              text-anchor="middle" font-size="8" font-weight="bold" fill="var(--paper)">
          ${tir > 8 ? `${metrics.tir}%` : ''}
        </text>
      ` : ''}
      
      <!-- TBR (bottom, stripes pattern) -->
      ${(() => { yPos += tirHeight; return ''; })()}
      ${tbr > 0 ? `
        <defs>
          <pattern id="tbr-stripes" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect x="0" y="0" width="2" height="4" fill="var(--ink)"/>
          </pattern>
        </defs>
        <rect x="0" y="${yPos}" width="${width}" height="${tbrHeight}" 
              fill="url(#tbr-stripes)" stroke="var(--ink)" stroke-width="1"/>
        <text x="${width/2}" y="${yPos + tbrHeight/2 + 3}" 
              text-anchor="middle" font-size="8" font-weight="bold" fill="var(--ink)">
          ${tbr > 8 ? `${metrics.tbr}%` : ''}
        </text>
      ` : ''}
    </svg>
  `;
};

/**
 * Generate single day profile card (compact print version)
 */
const generateDayCard = (profile) => {
  const { date, dayOfWeek, metrics, curve, events, sensorChanges, cartridgeChanges, badges } = profile;
  
  const dateStr = profile.dateObj.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  return `
    <div class="day-card">
      <!-- Header -->
      <div class="day-header">
        <div class="day-date">
          <strong>${dayOfWeek}</strong>
          <span>${dateStr}</span>
        </div>
        <div class="day-badges">
          ${badges.map(badge => `
            <span class="badge" title="${badge.description}">${badge.emoji} ${badge.name}</span>
          `).join('')}
        </div>
      </div>
      
      <!-- Main: Curve + TIR Bar -->
      <div class="day-main">
        <div class="day-curve">
          ${generateDayCurveSVG(curve, events, sensorChanges, cartridgeChanges, profile.agpCurve)}
        </div>
        <div class="day-tir">
          ${generateTIRBarSVG(metrics)}
          <div class="tir-label">TIR</div>
        </div>
      </div>
      
      <!-- Footer: Metrics -->
      <div class="day-metrics">
        <div class="metric">
          <span class="label">TIR</span>
          <span class="value">${metrics.tir}%</span>
        </div>
        <div class="metric">
          <span class="label">TAR</span>
          <span class="value">${metrics.tar}%</span>
        </div>
        <div class="metric">
          <span class="label">TBR</span>
          <span class="value">${metrics.tbr}%</span>
        </div>
        <div class="metric">
          <span class="label">Mean±SD</span>
          <span class="value">${metrics.mean}±${metrics.sd}</span>
        </div>
        <div class="metric">
          <span class="label">CV</span>
          <span class="value">${metrics.cv}%</span>
        </div>
      </div>
    </div>
  `;
};

/**
 * Generate complete HTML for day profiles export
 */
export const generateDayProfilesHTML = (dayProfiles, patientInfo = null) => {
  if (!dayProfiles || dayProfiles.length === 0) {
    throw new Error('No day profiles to export');
  }
  
  // Limit to 7 days max (fits on 2 pages)
  const profiles = dayProfiles.slice(0, 7);
  
  // Split into pages (3-4 per page)
  const page1Profiles = profiles.slice(0, 4);
  const page2Profiles = profiles.slice(4);
  
  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AGP+ Dagprofielen - ${profiles[0]?.date} tot ${profiles[profiles.length - 1]?.date}</title>
  <style>
    /* ===================================================================
       AGP+ DAY PROFILES EXPORT - BRUTALIST PRINT DESIGN
       Maximum 2 A4 pages, 3-4 profiles per page
       Monospace, high contrast, B/W optimized
       =================================================================== */
    
    :root {
      /* Paper & Ink - Brutalist Foundation */
      --paper: #e3e0dc;
      --ink: #1a1816;
      
      /* Grayscale */
      --color-gray-mid: #6b6560;
      --color-gray-light: #a8a39d;
      --grid-line: #c5c0b8;
      
      /* Backgrounds */
      --bg-secondary: #ebe8e4;
      --bg-tertiary: #d8d4cf;
      
      /* Text */
      --text-secondary: #6b6560;
      
      /* Accents */
      --color-red: #8b1a1a;
      --color-orange: #a0522d;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: "Courier New", "Courier", monospace;
      font-size: 9pt;
      line-height: 1.3;
      color: var(--ink);
      background: var(--paper);
      padding: 8mm;
      -webkit-font-smoothing: none;
      -moz-osx-font-smoothing: grayscale;
    }
    
    @media print {
      body { padding: 5mm; }
      .page-break { page-break-before: always; }
      @page {
        size: A4 portrait;
        margin: 5mm;
      }
    }
    
    /* Header */
    .report-header {
      border: 3px solid var(--ink);
      padding: 4mm;
      margin-bottom: 2mm;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 3mm;
      align-items: center;
    }
    
    .report-title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .report-subtitle {
      font-size: 8pt;
      color: var(--text-secondary);
      margin-top: 1mm;
    }
    
    .patient-info {
      text-align: right;
      font-size: 8pt;
      line-height: 1.4;
    }
    
    .patient-info strong {
      font-weight: bold;
    }
    
    /* Day cards grid */
    .days-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2mm;
      margin-bottom: 2mm;
    }
    
    .day-card {
      border: 3px solid var(--ink);
      background: var(--paper);
      display: grid;
      grid-template-rows: auto 1fr auto;
      height: 56mm; /* Even smaller to fit 4 per page with header */
      page-break-inside: avoid;
    }
    
    /* Day header */
    .day-header {
      border-bottom: 2px solid var(--ink);
      padding: 1mm 2mm;
      background: var(--ink);
      color: var(--paper);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .day-date {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .day-date span {
      margin-left: 2mm;
      font-size: 7pt;
      color: var(--color-gray-light);
    }
    
    .day-badges {
      display: flex;
      gap: 1.5mm;
    }
    
    .badge {
      padding: 0.5mm 1.5mm;
      border: 1.5px solid var(--paper);
      background: rgba(227, 224, 220, 0.1);
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Day main content */
    .day-main {
      padding: 1.5mm;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 2mm;
      align-items: center;
      overflow: hidden; /* Prevent content overflow */
    }
    
    .day-curve {
      width: 100%;
    }
    
    .day-curve svg {
      width: 100%;
      height: auto;
    }
    
    .day-tir {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2mm;
    }
    
    .tir-label {
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    /* Day metrics footer */
    .day-metrics {
      border-top: 2px solid var(--ink);
      padding: 1mm 2mm;
      background: var(--bg-secondary);
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1.5mm;
    }
    
    .metric {
      display: flex;
      flex-direction: column;
      gap: 0.5mm;
    }
    
    .metric .label {
      font-size: 6pt;
      font-weight: bold;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .metric .value {
      font-size: 9pt;
      font-weight: bold;
      color: #000;
    }
    
    /* Legend */
    .legend {
      border: 2px solid #000;
      padding: 3mm;
      margin-top: 4mm;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2mm;
      font-size: 8pt;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    
    .legend-marker {
      width: 8px;
      height: 8px;
      border: 1px solid #000;
      flex-shrink: 0;
    }
    
    .legend-marker.hypo-l2 { background: #DC2626; }
    .legend-marker.hypo-l1 { background: #F59E0B; }
    .legend-marker.hyper { background: #EF4444; }
    .legend-marker.sensor { 
      background: repeating-linear-gradient(
        45deg,
        #dc2626,
        #dc2626 1px,
        transparent 1px,
        transparent 3px
      );
    }
    .legend-marker.cartridge { 
      background: repeating-linear-gradient(
        45deg,
        #FF8C00,
        #FF8C00 1px,
        transparent 1px,
        transparent 2px
      );
    }
    
    /* Footer */
    .report-footer {
      margin-top: 4mm;
      padding-top: 3mm;
      border-top: 1px solid #ccc;
      font-size: 7pt;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  
  <!-- Page 1 -->
  <div class="report-header">
    <div>
      <div class="report-title">AGP+ Dagprofielen</div>
      <div class="report-subtitle">Glucose analyse per dag</div>
    </div>
    ${patientInfo ? `
      <div class="patient-info">
        <strong>${patientInfo.firstName || ''} ${patientInfo.lastName || ''}</strong><br>
        ${patientInfo.dateOfBirth ? `Geb: ${patientInfo.dateOfBirth}<br>` : ''}
        ${patientInfo.cgmModel ? `CGM: ${patientInfo.cgmModel}<br>` : ''}
        Gegenereerd: ${new Date().toLocaleDateString('nl-NL')}
      </div>
    ` : `
      <div class="patient-info">
        Gegenereerd: ${new Date().toLocaleDateString('nl-NL')}
      </div>
    `}
  </div>
  
  <!-- Days grid - Page 1 -->
  <div class="days-grid">
    ${page1Profiles.map(profile => generateDayCard(profile)).join('')}
  </div>
  
  ${page2Profiles.length > 0 ? `
    <!-- Page 2 -->
    <div class="page-break"></div>
    
    <div class="report-header">
      <div>
        <div class="report-title">AGP+ Dagprofielen</div>
        <div class="report-subtitle">Vervolg - Pagina 2</div>
      </div>
      ${patientInfo ? `
        <div class="patient-info">
          <strong>${patientInfo.firstName || ''} ${patientInfo.lastName || ''}</strong>
        </div>
      ` : ''}
    </div>
    
    <!-- Days grid - Page 2 -->
    <div class="days-grid">
      ${page2Profiles.map(profile => generateDayCard(profile)).join('')}
    </div>
    
    <!-- Legend (moved to page 2 to save space on page 1) -->
    <div class="legend">
      <div class="legend-item">
        <div class="legend-marker hypo-l2"></div>
        <span>Hypo L2 (&lt;54)</span>
      </div>
      <div class="legend-item">
        <div class="legend-marker hypo-l1"></div>
        <span>Hypo L1 (54-70)</span>
      </div>
      <div class="legend-item">
        <div class="legend-marker hyper"></div>
        <span>Hyper (&gt;250)</span>
      </div>
      <div class="legend-item">
        <div class="legend-marker sensor"></div>
        <span>Sensor wissel</span>
      </div>
      <div class="legend-item">
        <div class="legend-marker cartridge"></div>
        <span>Cartridge wissel</span>
      </div>
    </div>
  ` : `
    <!-- Legend (on page 1 only if no page 2) -->
    <div class="legend">
      <div class="legend-item">
        <div class="legend-marker hypo-l2"></div>
        <span>Hypo L2 (&lt;54)</span>
      </div>
      <div class="legend-item">
        <div class="legend-marker hypo-l1"></div>
        <span>Hypo L1 (54-70)</span>
      </div>
      <div class="legend-item">
        <div class="legend-marker hyper"></div>
        <span>Hyper (&gt;250)</span>
      </div>
      <div class="legend-item">
        <div class="legend-marker sensor"></div>
        <span>Sensor wissel</span>
      </div>
      <div class="legend-item">
        <div class="legend-marker cartridge"></div>
        <span>Cartridge wissel</span>
      </div>
    </div>
  `}
  
  <!-- Footer -->
  <div class="report-footer">
    AGP+ v2.2 - Day Profiles Export | Medtronic MiniMed 780G Data | 
    Generated: ${new Date().toLocaleString('nl-NL')}
  </div>
  
</body>
</html>`;

  return html;
};

/**
 * Download day profiles HTML as file
 */
export const downloadDayProfilesHTML = (dayProfiles, patientInfo = null) => {
  try {
    const html = generateDayProfilesHTML(dayProfiles, patientInfo);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate unique filename with timestamp (consistent with AGP report format)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
    link.download = `AGP_DayProfiles_${timestamp}.html`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading day profiles HTML:', error);
    throw error;
  }
};
