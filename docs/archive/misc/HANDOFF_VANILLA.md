# AGP+ Vanilla Handoff

**Version:** 3.9.1  
**Last Updated:** 2025-11-08  
**Purpose:** Quick reference for starting any work session

---

## 🚀 Quick Start

### Start Development Server

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

**Server URL:** http://localhost:3001

**Common Issue:** If port 3001 is taken, Vite will auto-select 3002/3003.

---

## 📁 Project Structure

```
agp-plus/
├── src/
│   ├── components/
│   │   ├── panels/              # Main UI panels (Import, Export, Sensors)
│   │   └── containers/          # Container components (VisualizationContainer)
│   ├── core/                    # Pure calculation engines
│   │   ├── metrics-engine.js    # TIR, MAGE, MODD calculations
│   │   └── sensor-history-engine.js
│   ├── hooks/                   # React hooks (data orchestration)
│   │   └── useSensorDatabase.js # Sensor storage management
│   ├── storage/                 # IndexedDB/localStorage wrappers
│   │   └── sensorStorage.js
│   └── utils/                   # Helper functions
│       ├── metricDefinitions.js # Tooltips + references
│       └── version.js           # Single source of truth for version
├── docs/
│   ├── HANDOFF_VANILLA.md       # ⬅️ You are here
│   ├── archive/2025-11/         # Archived session notes
│   └── *.md                     # Reference documentation
├── test-data/                   # Sample CSV files
└── public/                      # Static assets
```

---

## 🎯 Current State (v3.9.1)

### ✅ Working Features

1. **Data Import**
   - Medtronic CareLink CSV parsing
   - ProTime PDF workday detection
   - Multi-file upload with progress
   - Merge strategies (overwrite/add)

2. **Metrics Calculation**
   - TIR/TAR/TBR (ATTD Consensus 2019)
   - GMI (Beck et al. 2019)
   - CV (Monnier et al. 2008)
   - MAGE (Service et al. 1970) - validated ✅
   - MODD (Molnar et al. 1972) - validated ✅

3. **Visualization**
   - AGP Chart (percentile bands)
   - Metrics Grid (hero layout)
   - Day Profiles (24h curves)
   - Comparison Views (period/day-night/workday)

4. **Storage**
   - IndexedDB (glucose readings, month-bucketed)
   - localStorage (sensor history, recent data)
   - SQLite (historical sensors, read-only)
   - JSON Export/Import (complete database backup)

5. **Scientific References**
   - Footer includes methodology citations
   - metricDefinitions.js has full references

### 🚧 Known Issues

None critical. See GitHub issues for enhancements.

---

## 🔧 Common Development Tasks

### Adding a New Metric

1. **Calculate in `core/metrics-engine.js`:**
   ```javascript
   function calculateNewMetric(data) {
     // Pure function, no side effects
     return result;
   }
   ```

2. **Add definition to `utils/metricDefinitions.js`:**
   ```javascript
   newMetric: {
     label: 'New Metric',
     unit: 'mg/dL',
     description: '...',
     target: '>X%',
     interpretation: '...'
   }
   ```

3. **Display in `components/MetricsDisplay.jsx`:**
   ```javascript
   <MetricCard
     label="New Metric"
     value={metrics.newMetric}
     ...
   />
   ```

### Fixing UI Layout Issues

**Primary components:**
- `MetricsDisplay.jsx` - Hero metrics grid
- `AGPChart.jsx` - Main AGP visualization
- `DayProfileCard.jsx` - Individual 24h profiles

**Design system:**
- Brutalist (high contrast, 3px borders, monospace)
- Colors in `src/styles/globals.css`
- No gradients, no shadows

### Testing Changes

1. **Manual Testing:**
   - Upload test CSV from `test-data/`
   - Check metrics calculations
   - Verify UI rendering
   - Test export/import

2. **Validation:**
   - Compare MAGE/MODD with GlyCulator
   - Check TIR against CareLink reports
   - Verify GMI formula: 3.31 + 0.02392 × mean

---

## 📊 Data Flow

```
CSV Upload
    ↓
Parse (parseData.js)
    ↓
Store IndexedDB (month buckets)
    ↓
Detect Events (sensor/cartridge changes)
    ↓
Calculate Metrics (metrics-engine.js)
    ↓
Generate AGP (percentiles per 5-min bin)
    ↓
Render Components (React)
```

---

## 🔑 Key Files Reference

| File | Purpose |
|------|---------|
| `src/components/AGPGenerator.jsx` | Main app container |
| `src/core/metrics-engine.js` | All metric calculations |
| `src/storage/indexedDbStorage.js` | IndexedDB wrapper |
| `src/storage/sensorStorage.js` | Sensor history management |
| `src/utils/parseData.js` | CSV parsing logic |
| `src/utils/metricDefinitions.js` | Metric tooltips + references |
| `src/styles/globals.css` | Design system (colors, borders) |

---

## 🐛 Debugging Tips

### Enable Debug Logs

In `metrics-engine.js`, uncomment:
```javascript
const DEBUG = true;
```

### Check IndexedDB

Chrome DevTools → Application → IndexedDB → `agp-plus-db`

### Inspect localStorage

Chrome DevTools → Application → Local Storage → `http://localhost:3001`

**Keys:**
- `agp-sensor-database` - Recent sensor data
- `agp-deleted-sensors` - Deleted sensor IDs
- `agp-patient-info` - Patient metadata

### Common Errors

**"No data available"**
- Check CSV format (Medtronic CareLink export)
- Verify date range covers uploaded data
- Check IndexedDB has glucose readings

**"MAGE/MODD calculation failed"**
- Ensure >14 days of data
- Check for gaps (needs 70%+ coverage)
- Verify glucose values are valid (40-400 mg/dL)

---

## 📝 Git Workflow

### Before Starting Work

```bash
git status                 # Check current state
git pull origin main       # Get latest changes
git checkout -b feature/   # Create feature branch
```

### Making Changes

```bash
git add -A                 # Stage all changes
git commit -m "type(scope): message"
git push origin feature/   # Push to GitHub
```

**Commit Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `refactor` - Code restructuring
- `test` - Testing
- `chore` - Maintenance

### Merging

```bash
git checkout main
git merge feature/branch
git push origin main
```

---

## 📚 Scientific References

**Always cite these in documentation:**

1. **TIR/TAR/TBR:** Battelino T et al., *Diabetes Care* 2019;42(8):1593-1603
2. **GMI:** Beck RW et al., *Diabetes Care* 2019;42(4):659-666
3. **CV:** Monnier L et al., *Diabetes Care* 2008;31(11):2116-2119
4. **MAGE:** Service FJ et al., *Diabetes* 1970;19(9):644-655
5. **MODD:** Molnar GD et al., *Diabetologia* 1972;8:342-348

**Full methodology in footer:**
See `src/components/AGPGenerator.jsx` lines ~1870-1885

---

## 🎨 Design Philosophy

**Brutalist Medical Interface**

**Principles:**
- High contrast (accessibility first)
- 3px solid borders (clarity)
- Monospace typography (precision)
- No gradients or shadows (print-compatible)
- Black/white/orange palette (Soviet propaganda posters)

**Why?**
Medical professionals scan data quickly under fluorescent lights.
Aesthetics take a back seat to function.

**Don't:**
- Add rounded corners
- Use subtle grays
- Add animations
- Use custom fonts

**Do:**
- Maximize contrast
- Use bold weights
- Add white space
- Embrace the brutality

---

## 🔮 Future Enhancements

**Potential areas for improvement:**

1. **mmol/L Support** - Unit conversion for non-US users
2. **Timezone Handling** - Multi-timezone support
3. **Device Support** - Other CGM systems (Dexcom, Libre)
4. **Advanced Analytics** - ML pattern detection
5. **Mobile App** - React Native version
6. **Sensor Database** - Complete historical sensor tracking

---

## 🆘 Getting Help

**Documentation:**
- `/docs/V3_ARCHITECTURE.md` - System design
- `/docs/STATUS.md` - Current priorities
- `/docs/TEST_PLAN.md` - Testing procedures

**Code Comments:**
- Most files have detailed header comments
- Check function docstrings for usage

**External Resources:**
- ADA Standards: https://diabetesjournals.org/care
- ATTD Consensus: Search "Battelino 2019 CGM metrics"
- Medtronic Docs: CareLink user manual

---

## ✅ Pre-Session Checklist

- [ ] Read this handoff
- [ ] Pull latest from main
- [ ] Check current version (src/utils/version.js)
- [ ] Review recent commits (git log -10)
- [ ] Start dev server
- [ ] Load test data
- [ ] Verify core functionality

---

## 🎯 Post-Session Checklist

- [ ] Test all changes manually
- [ ] Update version if needed
- [ ] Update CHANGELOG.md
- [ ] Commit with descriptive message
- [ ] Push to GitHub
- [ ] Update documentation if needed
- [ ] Create handoff note (if complex changes)

---

**Last Updated:** 2025-11-08  
**Current Branch:** main  
**Status:** ✅ Production-ready

**Built with care for better diabetes management. 🩺**
