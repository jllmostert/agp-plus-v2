# AGP+ v2.1 - Ambulatory Glucose Profile Analyzer

> **Professional diabetes data analysis tool following ADA/ATTD 2019 clinical guidelines**

## Overview

AGP+ is a React-based web application for analyzing continuous glucose monitoring (CGM) data from Medtronic CareLink CSV exports. It provides comprehensive glycemic metrics, AGP visualization, and period-over-period comparison following international clinical standards.

**Version:** 2.1.0  
**Status:** Production Ready  
**Last Updated:** October 2025

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/[your-username]/agp-plus.git
cd agp-plus

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
http://localhost:3001
```

---

## Core Features

### Data Import
- ✅ Medtronic CareLink CSV upload
- ✅ ProTime workday data integration (PDF/JSON)
- ✅ Automatic data validation & error handling

### Clinical Analysis
- ✅ **8 Core Metrics**: TIR, TAR, TBR, CV, GMI, Mean Glucose, MAGE, MODD
- ✅ **AGP Visualization**: Percentile bands (10th, 25th, 50th, 75th, 90th)
- ✅ **Event Detection**: Hypoglycemia (L1/L2), hyperglycemia alerts
- ✅ **Period Comparison**: Auto-comparison for 14/30/90-day periods
- ✅ **Day/Night Analysis**: Separate metrics for 06:00-22:00 vs 22:00-06:00
- ✅ **Workday Split**: Compare workdays vs rest days (ProTime integration)

### User Experience
- ✅ Preset period buttons (14/30/90 days)
- ✅ Custom date range picker
- ✅ Toggle-able analysis modes
- ✅ Dark theme optimized interface
- ✅ Responsive design (desktop/tablet/mobile)
- ✅ HTML report export

---

## Architecture

### Technology Stack
- **React 18** - Component framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling system
- **Lucide React** - Icon library

### Project Structure
```
agp-plus/
├── src/
│   ├── components/        # 8 React UI components
│   │   ├── AGPGenerator.jsx
│   │   ├── FileUpload.jsx
│   │   ├── PeriodSelector.jsx
│   │   ├── MetricsDisplay.jsx
│   │   ├── AGPChart.jsx
│   │   ├── ComparisonView.jsx
│   │   ├── DayNightSplit.jsx
│   │   └── WorkdaySplit.jsx
│   │
│   ├── hooks/             # 3 Custom React hooks
│   │   ├── useCSVData.js
│   │   ├── useMetrics.js
│   │   └── useComparison.js
│   │
│   ├── core/              # 3 Calculation engines
│   │   ├── metrics-engine.js
│   │   ├── parsers.js
│   │   └── html-exporter.js
│   │
│   └── styles/            # Tailwind CSS
│
├── public/                # Static assets
├── package.json
├── vite.config.js
└── index.html
```

### Data Flow
```
CSV Upload → Parse Data → Select Period → Calculate Metrics → Render UI
     ↓            ↓             ↓              ↓              ↓
FileUpload → useCSVData → AGPGenerator → useMetrics → Display Components
                                    ↓
                              useComparison
                                    ↓
                            ComparisonView
```

---

## Clinical Standards

AGP+ follows international guidelines for CGM data analysis:

- **ADA/ATTD 2019** - Core CGM metrics definitions
- **International Consensus 2017** - AGP methodology
- **FDA Guidance 2016** - AGP visualization standards

### Target Ranges (Type 1 Diabetes)
| Metric | Target | Range |
|--------|--------|-------|
| **TIR** | ≥70% | 70-180 mg/dL |
| **TAR** | ≤25% | >180 mg/dL |
| **TBR** | <4% | <70 mg/dL |
| **CV** | ≤36% | Glycemic variability |
| **GMI** | <7.0% | Glucose Management Indicator |

---

## Documentation

### Essential Reading

1. **[PROJECT BRIEFING](./AGP_PLUS_v2.1_PROJECT_BRIEFING.md)** ⭐ Start here
   - Complete technical documentation
   - Architecture & component details
   - Algorithm explanations
   - Known limitations

2. **[DESIGN SYSTEM](./DESIGN_SYSTEM_QUICK_REF.md)**
   - UI/UX guidelines
   - Color schemes & typography
   - Component patterns

3. **[METRIC DEFINITIONS](./metric_definitions.md)**
   - Clinical metric explanations
   - Calculation formulas
   - Target ranges & interpretation

4. **[MINIMED 780G REFERENCE](./minimed_780g_ref.md)**
   - Device specifications
   - CareLink data format
   - SmartGuard algorithm notes

### Code Reference

The `/docs/artifacts/` folder contains reference implementations:
- `ARTIFACT-01__metrics-engine_js.txt` - Calculation engine
- `ARTIFACT-02__parsers_js.txt` - CSV parsing logic
- `ARTIFACT-03__html-exporter_js.txt` - Report generation

---

## Development

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Commands
```bash
# Development
npm run dev              # Start dev server (port 3001)

# Build
npm run build            # Production build → dist/
npm run preview          # Preview production build

# Code Quality
npm run lint             # ESLint (if configured)
```

### Testing Workflow
1. Upload sample CareLink CSV
2. Select 30-day period
3. Verify all metrics display correctly
4. Check AGP chart renders
5. Test comparison view (if historical data available)
6. Toggle day/night analysis
7. Import ProTime data (if available)
8. Export HTML report

---

## Known Limitations

### Basal Rate Data
⚠️ **CareLink CSV exports do NOT include SmartGuard auto-adjustments**

The CSV contains only the *programmed* basal pattern, not actual delivery. This makes Total Daily Dose (TDD) calculations unreliable (-26% to -1% error).

**Solution:** Use Medtronic PDF reports (Therapy Management Dashboard) for accurate TDD data.

**Design Decision:** We don't calculate metrics we can't trust. Honesty > features.

### Data Requirements
- Minimum 7 days of CGM data
- At least 70% CGM coverage for reliable metrics
- Date ranges must be within available data

---

## Deployment

### Netlify (Recommended)
```bash
npm run build
# Upload dist/ folder to Netlify
# Or connect GitHub for auto-deploy
```

### Vercel
```bash
npm i -g vercel
vercel
```

### GitHub Pages
```bash
# Update vite.config.js base path
npm run build
npx gh-pages -d dist
```

---

## Future Enhancements

### Planned Features
- [ ] PDF export (in addition to HTML)
- [ ] Save/load sessions (localStorage)
- [ ] Multiple CSV comparison
- [ ] Custom target ranges
- [ ] A1C correlation tracking

### Under Consideration
- [ ] Backend API integration
- [ ] User accounts & cloud storage
- [ ] Mobile app (React Native)
- [ ] Real-time CGM integration

---

## Support

### Issues & Questions
- **GitHub Issues**: [Report bugs or request features](https://github.com/[your-username]/agp-plus/issues)
- **Documentation**: Review project briefing for detailed explanations
- **Clinical Questions**: Consult with healthcare provider

### Contributing
Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Follow existing code style
4. Test thoroughly
5. Submit pull request with clear description

---

## License

[Add your license here - e.g., MIT, GPL, etc.]

---

## Acknowledgments

Built following clinical guidelines from:
- American Diabetes Association (ADA)
- Advanced Technologies & Treatments for Diabetes (ATTD)
- International Consensus on CGM Data

Data format based on:
- Medtronic CareLink export specifications
- Medtronic MiniMed 780G system

---

## Contact

**Project Maintainer**: [Your name]  
**Email**: [Your email]  
**Repository**: [GitHub URL]

---

*Made with ❤️ for better diabetes management*
