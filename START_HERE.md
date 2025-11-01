---
tier: 1
status: active
last_updated: 2025-11-01
purpose: Central navigation hub for AGP+ v3.x development
---

# 🧭 AGP+ Development - START HERE

**Version**: v3.1.1 (in progress)  
**Last Updated**: 2025-11-01  
**Current Phase**: Priority 2 & 3 Architecture Improvements

---

## 📍 QUICK STATUS

**What Just Happened** (2025-11-01):
- ✅ **Priority 1 Complete**: Batch validation + collision detection + storage indicators
- ✅ **Code Quality**: 7.9/10, Risk: MEDIUM → LOW
- ✅ **Git**: 7 commits pushed to main
- 📄 **Analysis**: TIER2_SYNTHESIS.md (764 lines) created

**What's Next**:
- 🎯 **Priority 2**: Error recovery logging (1 hour)
- 🎯 **Priority 3**: Maintenance features (2 hours)
- 📝 **Release**: Update CHANGELOG, push v3.1.1

**Current Focus**: See `HANDOFF.md` for complete implementation guide

---

## 🎯 TIER 1 - OPERATIONAL (Read Every Session)

### Primary Navigation

**🔥 Start Here First**:
- `HANDOFF.md` - **Current session state** (Priority 2 & 3 fixes)
  - What to build next
  - Complete code snippets
  - Testing procedures
  - Git workflow

**📊 Project Status**:
- `project/STATUS.md` - Phase tracking + completion checkboxes
- `CHANGELOG.md` - Version history + release notes

**🏃 Quick Actions**:
```bash
# Start development server
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001

# Check git status
git status
git log --oneline -5

# Run tests (if implemented)
npm test
```

---

## 📂 TIER 2 - PROJECT DOCS (Read When Planning)

### Architecture & Planning

**Deep Dive Analysis**:
- `docs/analysis/TIER2_SYNTHESIS.md` - **Complete architecture review**
  - 4,258 LOC analyzed across 12 files
  - Risk assessment: MEDIUM → LOW
  - Priority 1-4 action items
  - Implementation roadmap

**Project Documents**:
- `project/V3_ARCHITECTURE.md` - System design overview
- `project/V3_IMPLEMENTATION_GUIDE.md` - Module interfaces
- `project/TEST_PLAN.md` - Validation scenarios

**Recent Handoffs** (Archived):
- `docs/handoffs/2025-10-31_sensor-detection.md` - Sensor detection fixes
- `docs/handoffs/2025-11-01_priority1-fixes.md` - Batch validation + collision detection (will be archived)

---

## 📚 TIER 3 - REFERENCE (Read On Demand)

### Technical References

**Device & Data**:
- `reference/minimed_780g_ref.md` - MiniMed 780G settings + SmartGuard behavior
- `reference/metric_definitions.md` - Glucose metrics (International Consensus)

**Development**:
- `reference/GIT_WORKFLOW.md` - Version control guide + commit conventions
- `reference/V3_ARCHITECTURE_DECISIONS.md` - Design rationale + trade-offs

**Document System**:
- `docs/DocumentHygiene.md` - Three-tier documentation structure

---

## 🗺️ PROJECT STRUCTURE

```
agp-plus/
├── HANDOFF.md                  ← Current session (Tier 1)
├── START_HERE.md               ← This file (Tier 1)
├── CHANGELOG.md                ← Release notes (Tier 1)
│
├── src/                        ← Application code
│   ├── components/             ← React UI components
│   ├── core/                   ← Business logic engines
│   ├── hooks/                  ← React hooks
│   ├── storage/                ← Data persistence layer
│   └── utils/                  ← Helper functions
│
├── project/                    ← Tier 2 planning docs
│   ├── STATUS.md               ← Phase tracking
│   ├── V3_ARCHITECTURE.md      ← System design
│   └── TEST_PLAN.md            ← Test scenarios
│
├── docs/                       ← Documentation archive
│   ├── analysis/               ← Deep dive analysis
│   │   └── TIER2_SYNTHESIS.md  ← Architecture review
│   └── handoffs/               ← Archived session notes
│
└── reference/                  ← Tier 3 stable references
    ├── minimed_780g_ref.md
    ├── metric_definitions.md
    └── GIT_WORKFLOW.md
```

---

## 🚀 DEVELOPMENT WORKFLOW

### Starting a Session

1. **Read Current State**:
   ```bash
   # Open these in order:
   open HANDOFF.md              # What to do next
   open project/STATUS.md       # What's complete
   open docs/analysis/TIER2_SYNTHESIS.md  # Full context (if needed)
   ```

2. **Check Git Status**:
   ```bash
   git status
   git log --oneline -10
   git branch -a
   ```

3. **Start Dev Server**:
   ```bash
   cd /Users/jomostert/Documents/Projects/agp-plus
   export PATH="/opt/homebrew/bin:$PATH"
   npx vite --port 3001
   ```

4. **Open Browser**:
   - Navigate to: http://localhost:3001
   - Open DevTools (Console + Network tabs)

---

### During Development

**Key Commands**:
```bash
# Run specific component tests
npm test -- SensorHistoryModal

# Check for TypeScript/ESLint errors
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

**Debugging**:
- Check console for debug logs (search for `[useSensorDatabase]`, `[Stock]`, etc.)
- Use React DevTools for component state
- Monitor IndexedDB in DevTools > Application > Storage

---

### Ending a Session

1. **Update Handoff**:
   - Mark completed items with ✅
   - Add lessons learned
   - Note any blockers or questions

2. **Commit Changes**:
   ```bash
   git add [files]
   git commit -m "feat/fix/docs: descriptive message"
   git push origin main
   ```

3. **Update STATUS.md**:
   - Check off completed phases
   - Update completion percentages

4. **Archive Handoff** (if session complete):
   ```bash
   mkdir -p docs/handoffs
   mv HANDOFF.md docs/handoffs/YYYY-MM-DD_description.md
   git add docs/handoffs/
   git commit -m "chore: archive handoff"
   ```

---

## 🎯 CURRENT PRIORITIES (Nov 2025)

### ✅ Completed (v3.1.1)

**Priority 1** (2025-11-01, 45 min):
- ✅ Batch capacity validation
- ✅ Storage source indicators (already existed)
- ✅ Sensor ID collision detection

**Analysis**:
- ✅ TIER2_SYNTHESIS.md (764 lines)
- ✅ Risk reduced: MEDIUM → LOW

---

### 🎯 In Progress

**Priority 2** (Error Recovery) - 1 hour:
- [ ] Rollback logging for partial failures
- [ ] Enhanced error messages
- [ ] Recovery data storage

**Priority 3** (Maintenance) - 2 hours:
- [ ] Deleted sensors cleanup (90-day expiry)
- [ ] localStorage clear warning
- [ ] Enhanced lock status API

**Documentation** - 1 hour:
- [ ] Update CHANGELOG.md
- [ ] Update README.md
- [ ] Commit + push to GitHub

---

### ⏳ Future Work

**Priority 4** (v4.0) - 8-12 hours:
- [ ] Migrate stock storage to IndexedDB
- [ ] Implement atomic transactions
- [ ] Unified storage backend

**Performance**:
- [ ] Profile metrics engine
- [ ] Optimize deduplication
- [ ] Cache optimization

**Features** (if requested):
- [ ] Advanced metrics (GRI, CONGA)
- [ ] Multi-user support
- [ ] Export improvements

---

## 📖 DOCUMENTATION PHILOSOPHY

**Three-Tier System** (see `docs/DocumentHygiene.md`):

**Tier 1 (Operational)**: Read every session
- Changes daily
- Current session state
- Immediate action items

**Tier 2 (Planning)**: Read when planning features
- Changes weekly
- Project architecture
- Phase tracking

**Tier 3 (Reference)**: Read on demand
- Changes rarely
- Stable technical references
- Device documentation

**Golden Rule**: *Write once, read often — but only the right layer.*

---

## 🆘 TROUBLESHOOTING

### Server Won't Start
```bash
# Kill any existing process on port 3001
lsof -ti:3001 | xargs kill -9

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try again
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```

### Git Issues
```bash
# See what changed
git status
git diff

# Discard changes to file
git restore [file]

# Undo last commit (keep changes)
git reset --soft HEAD~1

# See full history
git log --graph --oneline --all
```

### Build Errors
```bash
# Clear cache
rm -rf node_modules/.vite

# Rebuild
npm run build
```

---

## 📞 KEY FILES BY TASK

### Working on CSV Parsing
- `src/core/csvSectionParser.js` - Parse CSV sections
- `src/core/sensorDetectionEngine.js` - Detect sensor events
- `reference/minimed_780g_ref.md` - CSV format reference

### Working on Metrics
- `src/core/metrics-engine.js` - Calculate metrics
- `src/utils/metricDefinitions.js` - Metric formulas
- `reference/metric_definitions.md` - International consensus

### Working on Sensors
- `src/storage/sensorStorage.js` - Sensor CRUD
- `src/hooks/useSensorDatabase.js` - SQLite + localStorage
- `src/components/SensorHistoryModal.jsx` - UI

### Working on Stock/Batches
- `src/storage/stockStorage.js` - Batch CRUD
- `src/core/stock-engine.js` - Matching logic
- `src/components/StockManagementModal.jsx` - UI

### Working on UI
- `src/components/AGPGenerator.jsx` - Main component
- `src/styles/globals.css` - Brutalist styles
- `src/components/AGPChart.jsx` - Visualization

---

## 🎓 KNOWLEDGE BASE

### Code Patterns

**Storage Access**:
```javascript
// localStorage (recent sensors)
import { getSensorHistory, addSensor } from './storage/sensorStorage.js';

// IndexedDB (glucose data)
import { getMasterDataset } from './storage/masterDatasetStorage.js';

// SQLite (historical sensors)
import { useSensorDatabase } from './hooks/useSensorDatabase.js';
```

**Event Detection**:
```javascript
// Three-tier confidence system
const result = detectSensors(csvData);
// result.sensorEvents = [
//   { timestamp, type, confidence: 'high|medium|low' }
// ]
```

**Metrics Calculation**:
```javascript
import { calculateMetrics } from './core/metrics-engine.js';

const metrics = calculateMetrics(glucoseData);
// Returns: { mean, SD, CV, TIR, TAR, TBR, GMI, MAGE, MODD }
```

---

## 💡 TIPS & BEST PRACTICES

### Before Starting Work
- ✅ Read HANDOFF.md completely
- ✅ Check git status (no unexpected changes)
- ✅ Review recent commits (context)
- ✅ Check STATUS.md (current phase)

### During Work
- ✅ Follow brutalist design principles (see style guide)
- ✅ Add debug logging for troubleshooting
- ✅ Write clear commit messages (see GIT_WORKFLOW.md)
- ✅ Test in browser before committing

### Before Committing
- ✅ Remove console.logs (keep debug.log)
- ✅ Check for TypeScript errors
- ✅ Verify no regressions
- ✅ Update documentation if needed

### Git Commit Messages
```bash
# Format: type(scope): description
feat(sensors): add collision detection
fix(metrics): correct MAGE calculation
docs: update CHANGELOG for v3.1.1
chore: archive old handoff
```

---

## 🔗 EXTERNAL RESOURCES

### Medtronic References
- MiniMed 780G User Guide (PDF)
- Guardian 4 Sensor Documentation
- CareLink CSV Export Format

### Standards & Consensus
- International Consensus on CGM Metrics (Battelino et al., 2023)
- ATTD Guidelines on Automated Insulin Delivery (2024)
- ISO 15197:2013 - Blood Glucose Monitoring

### Development Tools
- React Documentation: https://react.dev
- Vite Guide: https://vitejs.dev/guide/
- IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

---

## ✅ SESSION CHECKLIST

**Before Starting**:
- [ ] Read HANDOFF.md
- [ ] Check git status
- [ ] Start dev server
- [ ] Open browser + DevTools

**During Session**:
- [ ] Follow implementation guide
- [ ] Test as you build
- [ ] Debug any issues
- [ ] Keep notes in HANDOFF.md

**Before Ending**:
- [ ] Test all changes
- [ ] Commit with clear messages
- [ ] Push to GitHub
- [ ] Update HANDOFF.md
- [ ] Archive if session complete

---

## 📬 FEEDBACK & QUESTIONS

**Found a bug?**
- Add to HANDOFF.md under "Blockers"
- Create GitHub issue (if using issues)
- Note in project/STATUS.md

**Unclear documentation?**
- Note in HANDOFF.md under "Lessons Learned"
- Update relevant docs after resolving
- Follow DocumentHygiene.md principles

**Need help?**
- Check TIER2_SYNTHESIS.md for context
- Review reference docs (Tier 3)
- Search git history for similar issues

---

**Last Updated**: 2025-11-01 16:15  
**Next Review**: After Priority 2 & 3 completion  
**Status**: ✅ Up to date  
**Maintainer**: Jo Mostert
