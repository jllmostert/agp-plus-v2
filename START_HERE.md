---
title: START HERE - AGP+ v3.1 Development
date: 2025-10-31
status: ✅ Production Ready
---

# 🚀 START HERE - AGP+ Quick Start Guide

**Last Updated**: 2025-10-31 00:30 CET  
**Version**: v3.1 (Phase 4 Complete)  
**Status**: Production ready, all features working

---

## 🎯 What Is This?

**AGP+ (Ambulatory Glucose Profile Plus)** is a React web app that analyzes continuous glucose monitoring (CGM) data from Medtronic CareLink CSV exports. It generates clinical reports with glucose pattern analysis, insulin metrics, and device event tracking.

**Target Users**: Healthcare professionals and people with Type 1 Diabetes using MiniMed 780G insulin pumps with Guardian 4 CGM sensors.

---

## ⚡ Quick Start (30 seconds)

### 1. Start Server
```bash
cd ~/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### 2. Open Browser
```
http://localhost:3001/
```

### 3. Upload CSV
- Drag & drop a CareLink CSV file
- Or use test file: `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv`

### 4. View Reports
- AGP curve with percentiles
- Time in Range metrics
- TDD (Total Daily Dose) metrics
- Day profiles with device markers
- Sensor history

---

## 📂 Project Structure

```
agp-plus/
├── src/
│   ├── components/          # React UI components
│   │   ├── AGPGenerator.jsx           # Main app
│   │   ├── SensorRegistration.jsx     # CSV sensor upload
│   │   ├── SensorHistoryModal.jsx     # Sensor history view
│   │   └── DayProfilesModal.jsx       # Day profiles + markers
│   ├── core/               # Pure calculation engines
│   │   ├── sensorDetectionEngine.js   # Sensor change detection
│   │   ├── glucoseGapAnalyzer.js      # Gap analysis
│   │   ├── csvSectionParser.js        # CareLink CSV parser
│   │   └── agpCalculations.js         # AGP metrics
│   ├── storage/            # Data persistence
│   │   └── sensorStorage.js           # localStorage CRUD
│   ├── hooks/              # React hooks
│   │   ├── useSensorDatabase.js       # Sensor data loader
│   │   ├── useDeviceEvents.js         # Device event detection
│   │   └── useMasterDataset.js        # IndexedDB glucose data
│   └── utils/              # Utilities
│       └── debug.js                   # Debug logging
├── public/
│   └── sensor_database.db  # SQLite (219 historical sensors)
├── test-data/              # Sample CSV files
└── docs/                   # Documentation
```

---

## 🎨 Design Philosophy

**Brutalist Theme**: High contrast, print-optimized, clinical readability
- Black background
- White/red/green/yellow text
- 3px solid borders
- Monospace typography (JetBrains Mono)
- No shadows, no gradients
- Print-compatible

---

## 🔧 Current Features (v3.1)

### ✅ Working Features

**Core Analysis**:
- AGP curve with p5/p25/p50/p75/p95 percentiles
- Time in Range (TIR/TAR/TBR) metrics
- Glucose statistics (mean, median, CV, GMI)
- Variability metrics (MAGE, MODD)

**Insulin Tracking** (Phase 0 Complete):
- Total Daily Dose (TDD) calculation
- Auto vs Meal bolus breakdown
- Auto/Meal ratio percentage
- TDD displayed in main interface

**Sensor Management** (Phase 4 Complete):
- CSV upload with sensor change detection
- Smart status detection (running/success/failed)
- Automatic previous sensor end_date updates
- Duration auto-calculation
- Sensor history modal (219+ sensors)
- SQLite + localStorage merger

**Device Events**:
- Sensor change markers on day profiles (red dashed lines)
- Cartridge change markers (orange dashed lines)
- Automatic detection from CSV data

**Data Management**:
- Master dataset with IndexedDB persistence
- Upload history tracking
- Date range filtering
- Data import/export

---

## 📊 Key Metrics Explained

### Time in Ranges
- **TIR** (70-180 mg/dL): Target >70%
- **TAR** (>180 mg/dL): Target <30%
- **TBR** (<70 mg/dL): Target <5%
- **CV** (Coefficient of Variation): Target ≤36%

### Insulin Metrics
- **TDD**: Total Daily Dose (Units/day)
- **Auto**: Automated basal + corrections by SmartGuard
- **Meal**: Manual boluses for meals
- **Ratio**: Auto% vs Meal% (target ~50/50)

### Sensor Status
- **Running**: Active sensor (no end_date yet)
- **Success**: Sensor lasted ≥6.75 days (162 hours)
- **Failed**: Sensor ended before 6.75 days

---

## 🧪 Testing

### Test CSV File
```bash
test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv
```

**Contains**:
- 7 days of glucose data
- 2 sensor changes (Oct 25 + Oct 30)
- TDD metrics (23.0E average)
- Device events (sensor + cartridge)

### Test Workflow
1. **Clear storage**: `localStorage.clear()` in console
2. **Refresh page**: Cmd+Shift+R
3. **Upload test CSV**
4. **Check SENSORS tab**: Should show 2 HIGH confidence candidates
5. **Confirm both sensors**
6. **View sensor history**: Should show both sensors correctly
7. **View day profiles**: Should show sensor change markers

---

## 🐛 Debug Tools

### Browser Console
```javascript
// Check localStorage sensors
const sensors = JSON.parse(localStorage.getItem('agp_sensors') || '[]');
console.table(sensors);

// Check master dataset
const dataset = JSON.parse(localStorage.getItem('agp_masterDataset') || '{}');
console.log('Total readings:', dataset.allReadings?.length);

// Clear all data (nuclear option)
localStorage.clear();
window.location.reload();
```

### Debug Logging
All components use `debug.log()` for consistent logging:
```javascript
import { debug } from '../utils/debug.js';
debug.log('[ComponentName] Message:', data);
```

---

## 📝 Common Tasks

### Add New Feature
1. Create feature branch: `git checkout -b feature/my-feature`
2. Implement in appropriate layer (component/core/storage)
3. Test thoroughly
4. Document in code comments
5. Merge to main when complete

### Fix Bug
1. Reproduce bug
2. Add debug logging
3. Identify root cause
4. Fix in minimal scope
5. Test fix
6. Document in commit message

### Update Documentation
1. Update relevant `.md` files in docs/
2. Update this START_HERE.md if workflow changes
3. Update HANDOFF when session complete

---

## 🔗 Documentation Files

### Essential Reading
- **START_HERE.md** (this file) - Quick start guide
- **HANDOFF_2025-10-31.md** - Latest session details
- **minimed_780g_ref.md** - MiniMed 780G reference
- **metric_definitions.md** - Glucose metric definitions

### Phase Documentation
- **v3.1_DETECTION_ENGINE_COMPLETE.md** - Sensor detection (Phases 1-3)
- **SESSION_COMPLETE_2025-10-30.md** - Phase 4 completion
- **BUG_FIX_SENSOR_ENDTIME.md** - Bug fix details

### Architecture
- **PROJECT_BRIEFING_v3.0.md** - Master dataset architecture
- **v3.0_MIGRATION_COMPLETE.md** - Migration from v2 to v3

---

## 🚨 Important Notes

### ALWAYS Use Desktop Commander
Regular bash commands don't work with the project file structure. Use Desktop Commander MCP for all file operations.

### Server Start Command
```bash
cd ~/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### Data Persistence
- **IndexedDB**: Master glucose dataset
- **localStorage**: Sensors, uploads, patient info
- **SQLite**: Historical sensor database (read-only)

### Field Names (CRITICAL)
Always use SQLite-aligned field names:
- `sensor_id` (NOT `id`)
- `start_date` (NOT `start_timestamp`)
- `end_date` (NOT `end_timestamp`)
- `hw_version` (NOT `hardware_version`)

---

## 🎯 Current Phase

**Phase 4: Complete ✅**
- Sensor registration working
- Status detection working
- Auto-reload on close
- All bugs fixed

**Next Options**:
- **Phase 5**: Lock system (protect old sensors)
- **UI Polish**: Better loading states, confirm all, export
- **Advanced Features**: Sensor editing, bulk operations

---

## 💡 Pro Tips

### Debugging
1. Check browser console first
2. Use DevTools Application tab for localStorage/IndexedDB
3. Use debug.log() liberally
4. Test with real CSV data, not dummy data

### Git Workflow
- Main branch is always production-ready
- All features merged directly to main
- Detailed commit messages
- Push after each complete feature

### Performance
- Use memoization for expensive calculations
- Lazy load modals (React portals)
- IndexedDB for large datasets
- localStorage for small metadata

---

## 📞 Help & Resources

### External References
- **ADA Standards**: https://diabetesjournals.org/care
- **Medtronic CareLink**: User manual for CSV format
- **sql.js**: https://sql.js.org/documentation/

### Internal References
- Project memory in Claude (see userMemories)
- Detailed metric formulas in metric_definitions.md
- Device settings in minimed_780g_ref.md

---

## ✅ Health Check

Before starting work, verify:
- [ ] Server starts without errors
- [ ] Test CSV uploads successfully
- [ ] Console shows no red errors
- [ ] Sensor detection works
- [ ] Day profiles render
- [ ] TDD metrics display
- [ ] Sensor history opens

If all checks pass → System healthy, ready to work! 🟢

---

**Last Session**: 2025-10-31 00:30 CET  
**Status**: All systems operational  
**Branch**: main  
**Git**: Synced with GitHub

**🚀 Ready to build!**
