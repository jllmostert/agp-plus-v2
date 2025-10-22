# AGP+ v2.1 - Ambulatory Glucose Profile Generator

**Modern web application for analyzing Medtronic 780G CGM data with clinical metrics and visualization.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF)](https://vitejs.dev/)

---

## 🎯 Features

### Core Functionality
- **CSV Import**: Direct upload of Medtronic CareLink CSV exports
- **ProTime Integration**: Work schedule parsing for workday/rest-day analysis
- **Flexible Period Selection**: Preset periods (14/30/90 days) or custom date ranges
- **Automated Period Comparison**: Side-by-side metrics for current vs. previous periods
- **HTML Export**: Standalone, shareable AGP reports

### Clinical Metrics (Aligned with ADA/ATTD Consensus)
- **Time in Ranges**: TIR (70-180 mg/dL), TAR (>180/250 mg/dL), TBR (<70/54 mg/dL)
- **Glycemic Variability**: Coefficient of Variation (CV%), Standard Deviation (SD)
- **Mean Glucose & GMI**: Glucose Management Indicator (estimated HbA1c)
- **Advanced Metrics**: MAGE (per-day glycemic excursions), MODD (day-to-day variability)
- **Event Detection**: Hypo L1/L2 and hyperglycemia episodes with duration tracking

### Visualization
- **AGP Curve**: Median glucose with 5th-95th percentile bands across 24 hours
- **Event Markers**: Visual indicators for detected glycemic events
- **Comparison Overlay**: Optional period-over-period AGP comparison
- **Day/Night Split**: Separate analysis for daytime (06:00-00:00) and nighttime (00:00-06:00)
- **Workday Analysis**: ProTime-based workday vs. rest-day metrics comparison

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/jllmostert/agp-plus-v2.git
cd agp-plus-v2

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open automatically at `http://localhost:3000`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

The production files will be in the `dist/` directory.

---

## 📖 Usage

### 1. Export Data from CareLink
1. Log in to [Medtronic CareLink](https://carelink.minimed.eu/)
2. Navigate to: **Reports** → **Device Data** → **Export**
3. Select date range and download CSV file

### 2. Upload to AGP+
1. Click **"Upload CSV"** button in AGP+
2. Select your exported CareLink CSV file
3. Data is processed locally in your browser (no server upload)

### 3. Select Analysis Period
- Use preset buttons: **14 days**, **30 days**, or **90 days**
- Or manually select custom start/end dates
- Metrics update automatically

### 4. Optional: ProTime Work Schedule
1. Click **"Import ProTime"** button
2. Upload ProTime PDF or JSON export
3. Workday/rest-day split analysis appears automatically

### 5. Export Report
- Click **"Export HTML"** to download a standalone AGP report
- Share with healthcare providers or save for records

---

## 🏗️ Project Structure

```
agp-plus/
├── src/
│   ├── main.jsx                # Application entry point
│   ├── core/                   # Pure JavaScript logic (no React)
│   │   ├── metrics-engine.js   # Clinical metrics calculations
│   │   ├── parsers.js          # CSV & ProTime data parsing
│   │   └── html-exporter.js    # HTML report generation
│   ├── components/             # React UI components
│   │   ├── AGPGenerator.jsx    # Main container component
│   │   ├── FileUpload.jsx      # File upload UI
│   │   ├── PeriodSelector.jsx  # Date range selector
│   │   ├── MetricsDisplay.jsx  # Metrics cards grid
│   │   ├── AGPChart.jsx        # AGP visualization (SVG)
│   │   ├── ComparisonView.jsx  # Period comparison cards
│   │   ├── DayNightSplit.jsx   # Day/night analysis
│   │   └── WorkdaySplit.jsx    # Workday analysis
│   ├── hooks/                  # Custom React hooks
│   │   ├── useCSVData.js       # CSV data management
│   │   ├── useMetrics.js       # Metrics calculation wrapper
│   │   └── useComparison.js    # Comparison logic
│   └── styles/
│       └── globals.css         # Global styles (dark theme)
├── docs/                       # Documentation
│   ├── USER_GUIDE.md           # End-user instructions
│   ├── DEVELOPER_GUIDE.md      # Architecture & development guide
│   └── METRICS_REFERENCE.md    # Clinical metrics documentation
├── public/                     # Static assets
├── package.json                # Dependencies & scripts
├── vite.config.js              # Build configuration
└── index.html                  # HTML entry point
```

---

## 🔬 Clinical Validation

AGP+ implements metrics and visualizations aligned with:
- **ADA/ATTD Consensus Report** (2019) - International Consensus on Time in Range
- **Medtronic 780G Clinical Guidelines** - Device-specific thresholds
- **AGP Standard v1.0** - Ambulatory Glucose Profile standardized format

See [`docs/METRICS_REFERENCE.md`](docs/METRICS_REFERENCE.md) for detailed metric definitions and clinical interpretations.

---

## 🛠️ Development

### Tech Stack
- **Frontend**: React 18 (functional components, hooks)
- **Build Tool**: Vite 5 (fast HMR, optimized builds)
- **Styling**: Tailwind CSS utility classes (inline)
- **Icons**: Lucide React
- **Data Processing**: Pure JavaScript (no external analytics libraries)

### Code Philosophy
- **Separation of Concerns**: Core logic (`/src/core/`) is pure JS, independent of React
- **Testability**: Business logic functions are unit-testable without UI
- **Reusability**: Components are modular and composable
- **Performance**: Memoized calculations, optimized re-renders

### Contributing
Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Medtronic** - For the 780G Auto Mode CGM system
- **ADA/ATTD Consensus Group** - For standardized metrics definitions
- **International Diabetes Community** - For feedback and testing

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/jllmostert/agp-plus-v2/issues)
- **Documentation**: See [`docs/`](docs/) folder
- **Email**: jllmostert@gmail.com

---

**Built with ❤️ for better diabetes management**

*Version 2.1.0 - October 2025*
