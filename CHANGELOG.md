# Changelog

All notable changes to AGP+ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.1] - 2025-10-25

### Changed - Architecture Improvements
- **Refactored Day Profiles Logic**: Extracted business logic from `AGPGenerator` component to new `useDayProfiles` hook
  - Improves separation of concerns (components vs hooks vs engines)
  - Component now purely orchestrates UI, hook handles data processing
  - Maintains three-layer architecture: Components → Hooks → Engines

### Fixed - Technical Debt
- **Hook Initialization Order**: Fixed bug where `useDayProfiles` was called before `useMetrics`, causing undefined variable errors
- **Outlier Array Calculation**: Resolved "outlierLow not defined" error by recalculating arrays locally in `DayProfileCard`
  - `calculateAdaptiveYAxis` returns scalar outlier counts, component needs arrays for `.length` checks

### Added - Documentation
- **Comprehensive Inline Comments**: Added JSDoc to complex algorithms in `day-profile-engine.js`
  - Sensor change detection: 3-10 hour gap threshold rationale, marker placement strategy
  - Cartridge change detection: Clinical context for Medtronic Rewind events
  - 24-hour curve binning: 5-minute interval strategy with ATTD consensus alignment
  - Badge criteria: Already had excellent documentation with ADA/ATTD guidelines
- **PROJECT_BRIEFING Updates**: Documented `useDayProfiles` hook in architecture reference
  - Added to hooks section with trigger conditions and data flow
  - Updated Hook responsibility matrix with v2.2.1 marker

### Technical Details
- **New File**: `/src/hooks/useDayProfiles.js` (94 lines) - Extracts day profile generation with AGP overlay
- **Modified Files**: `AGPGenerator.jsx` (simplified), `DayProfileCard.jsx` (outlier fix)
- **Architecture**: Maintains proper separation - no components calling engines directly

---

## [2.2.0] - 2025-10-24

### Added - Day Profiles Feature
- **Individual Day Analysis**: View last 7 complete days with detailed glucose curves
- **DayProfileCard Component**: Single-day visualization with 24h glucose curve, TIR bar, and metrics
- **DayProfilesModal Component**: Full-screen modal displaying 7 day profiles
- **Achievement Badges**: Automatic detection of Perfect Day, Zen Master, and exceptional performance
- **Event Detection per Day**: Hypoglycemic events (L1: 54-70 mg/dL, L2: <54 mg/dL), hyperglycemic events (>250 mg/dL), sensor changes
- **Adaptive Y-axis Algorithm**: Dynamic range adjustment (54-250 mg/dL baseline, expands to 40-400 as needed)
- **Smart Tick Generation**: Always includes 70 & 180 mg/dL thresholds when in visible range
- **AGP Reference Overlay**: Dotted median line from overall period for context
- **Print Export**: `day-profiles-exporter.js` generates optimized HTML for A4 printing
  - Maximum 2 pages (4 days on page 1, 3 days on page 2)
  - Brutalist print design with B/W patterns for TIR visualization
  - Compact layout: 56mm height per card with aggressive spacing optimization
  - Legend moved to page 2 to maximize space on page 1

### Changed - AGP Visualization Simplification
- **Removed Mean Curve**: AGP chart now displays only the median (P50) line
  - Aligns with ADA/ATTD clinical guidelines for AGP visualization
  - Median is more robust to outliers and represents "typical day" pattern
  - Matches commercial CGM platform standards (Medtronic, Dexcom)
  - Median line now solid black (2.5px) instead of dashed for better visibility
- **Updated Legend**: Removed "Gemiddeld" (mean) entry, simplified to median + percentile bands

### Changed - Metrics Layout Reorganization
- **HypoglycemiaEvents Panel**: Replaced "Total Events" card with GRI (Glycemia Risk Index)
  - New 4-card layout: Level 2 <54 | Level 1 54-70 | TBR <70 | GRI
  - GRI displays risk level classification (Very Low/Low/Moderate/High/Very High)
  - Moved from secondary metrics grid to hypo panel for semantic clarity
- **Secondary Grid Restructure**: Consolidated Analysis Period and Data Quality under "Overview"
  - **Overview Section**: Analysis Period (days with complete/partial breakdown) | Data Quality (uptime % with readings count)
  - Removed standalone Risk Assessment section
  - New hierarchy in Data Quality card: Uptime % (primary) with readings count (subtitle)
- **Final Grid Layout**:
  1. Range Distribution: TAR >180 | TBR <70
  2. Variability Metrics: MAGE | MODD
  3. Glucose Range: Minimum | Maximum
  4. Overview: Analysis Period | Data Quality

### Added - Day Profiles Feature
- **Individual Day Analysis**: View last 7 complete days with detailed glucose curves
- **DayProfileCard Component**: Single-day visualization with 24h glucose curve, TIR bar, and metrics
- **DayProfilesModal Component**: Full-screen modal displaying 7 day profiles
- **Achievement Badges**: Automatic detection of Perfect Day, Zen Master, and exceptional performance
- **Event Detection per Day**: Hypoglycemic events (L1: 54-70 mg/dL, L2: <54 mg/dL), hyperglycemic events (>250 mg/dL), sensor changes
- **AGP Reference Overlay**: Dotted median line from overall period for context
- **Print Export**: `day-profiles-exporter.js` generates optimized HTML for A4 printing
  - Maximum 2 pages (4 days on page 1, 3 days on page 2)
  - Brutalist print design with B/W patterns for TIR visualization
  - Compact layout: 56mm height per card with aggressive spacing optimization
  - Legend moved to page 2 to maximize space on page 1

### Technical Changes
- Added `day-profile-engine.js` in `src/core/` for day-level calculations
- Added `day-profiles-exporter.js` in `src/core/` (700+ lines) for HTML generation
- Added `DayProfileCard.jsx` (548 lines) in `src/components/`
- Added `DayProfilesModal.jsx` (156 lines) in `src/components/`
- Updated `AGPGenerator.jsx` to include day profiles button and modal portal
- Day profiles use full 5-minute resolution (288 bins per day) for accurate visualization

### Fixed - UI/UX Polish & Code Quality
- **Button Text**: Changed to "BEKIJK DAGPROFIELEN" (Dutch, uppercase for consistency)
- **Button Font Size**: Increased from 14px to 16px for better readability
- **Version Numbers**: Updated to v2.2.0 across package.json, footer, and component headers
- **Code Cleanup**: Removed all console.log() debug statements (production-ready)
- **Documentation**: Complete v2.2.0 handoff, briefing, and index files updated

---

## [2.1.3] - 2025-10-23

### Added - Data Persistence & Patient Information
- **IndexedDB Storage**: Unlimited client-side data storage for CSV uploads
- **Save/Load Uploads**: Save multiple datasets with custom names, lock protection
- **Patient Information Management**: Auto-extraction from CSV + manual entry modal
  - Auto-extracts: Name, device model, serial number, sensor type
  - Manual fields: Date of birth, physician, email
  - Displays in app header and HTML exports
- **Storage Management UI**: View saved uploads, storage usage, rename, delete
- **Load Success Toast**: Visual feedback when loading saved data
- **Metric Tooltips**: Clinical definitions on hover for all metrics

### Technical Changes
- Added `useUploadStorage.js` hook (450 lines) for IndexedDB operations
- Added `patientStorage.js` and `uploadStorage.js` in `src/utils/`
- Added `PatientInfo.jsx` (278 lines) modal component
- Added `SavedUploadsList.jsx` (318 lines) for upload management
- Added `metricDefinitions.js` with clinical metric descriptions
- Added `Tooltip.jsx` and `MetricTooltip.jsx` components
- Updated `html-exporter.js` to include patient info in reports

---

## [2.1.0] - 2025-10-20

### Changed - Complete Architecture Rewrite
- **Modular Component Structure**: Split monolithic component into 10 separate files
- **Custom Hooks**: Extracted business logic into `useCSVData`, `useMetrics`, `useComparison`
- **Core Modules**: Separated calculation engines into `src/core/`
- **Production Structure**: Organized folders: `components/`, `hooks/`, `core/`, `utils/`

### Added - Enhanced Features
- **Auto-comparison**: Automatically triggers for preset periods (14/30/90 days)
- **Day/Night Toggle**: Enable/disable 06:00-00:00 vs 00:00-06:00 split analysis
- **Collapsible UI**: Organized sections with clean expand/collapse behavior
- **ProTime Modal**: Dual-tab import (PDF text paste + JSON file upload)
- **Empty States**: Helpful onboarding messages throughout UI
- **Error Handling**: Clear, user-friendly error messages with dismiss functionality
- **6-Metric Comparison**: Added TIR, Mean±SD, CV, GMI, MAGE, MODD with delta indicators
- **Overall Assessment**: Automatic summary of period-over-period changes

### Technical Improvements
- Vite build system with optimized bundling
- Improved code organization (~5,000+ lines across modular files)
- Better separation of concerns (UI vs logic vs calculations)
- Enhanced state management with proper React patterns

---

## [2.0.0] - 2025-10-15

### Added - Initial Production Release
- Complete AGP analysis following ADA/ATTD 2019 guidelines
- 8 core clinical metrics (TIR, TAR, TBR, CV, GMI, Mean, MAGE, MODD)
- AGP visualization with percentile bands (10th, 25th, 50th, 75th, 90th)
- Event detection (hypoglycemia L1/L2, hyperglycemia)
- Period comparison for historical context
- Day/Night split analysis
- Workday split analysis (with ProTime integration)
- HTML report export with print optimization
- Responsive dark theme UI

### Technical Foundation
- React 18 + Vite
- Tailwind CSS styling
- Lucide React icons
- Pure SVG visualization (no chart libraries)
- CareLink CSV parsing with validation

---

## Future Versions

### [2.3.0] - Planned
- Adaptive Y-axis for day profiles (54-250 mg/dL primary range)
- Improved chart density and information scannability
- Outlier indicators for values outside primary range

### [3.0.0] - Under Consideration
- Backend API integration
- User accounts & cloud sync
- Multi-patient comparison
- PDF export
- Mobile app (React Native)

---

## Version Naming Convention

- **Major (X.0.0)**: Breaking changes, major architectural shifts
- **Minor (x.Y.0)**: New features, backward-compatible additions
- **Patch (x.y.Z)**: Bug fixes, minor improvements

---

**Project Repository**: [GitHub URL]  
**Documentation**: See `/docs/` folder for detailed technical documentation
