---
tier: 1
status: active
last_updated: 2025-11-01 19:50
purpose: Central navigation hub for AGP+ v3.x development
---

# 🧭 AGP+ Development - START HERE

**Version**: v3.3.0 (in progress)  
**Last Updated**: 2025-11-01 19:50  
**Current Phase**: Block B - Critical Parser Fixes

---

## 📍 QUICK STATUS

**Current Session** (2025-11-01 Evening):
- ✅ **Block A COMPLETE** (v3.2.0): Performance benchmarking + glucose validation
- ✅ **Block B.6 COMPLETE** (v3.3.0): Dynamic column detection implemented
- 🎯 **Next**: Documentation update OR continue Block B (B.7/B.8)

**Last Commits**:
- `017b7ec` - Dynamic column detection (TESTED ✅)
- `827a038` - Helper function (safety checkpoint)
- `3b2c5d8` - Block A handoff archived

**Safety Checkpoint**: Can rollback to `827a038` if needed

---

## 🔄 WHAT CHANGED RECENTLY (v3.2.0 → v3.3.0)

### Session 1: Block A - Quick Wins (v3.2.0) ✅
**Time**: 18:35-19:10 (35 minutes)  
**Status**: COMPLETE

**Changes**:
- ✅ Performance benchmarking added to `metrics-engine.js`
- ✅ Glucose bounds validation (<20 or >600 mg/dL)
- ✅ Console timing logs (<1s target for 90 days)
- ✅ All tests passed

**Impact**: Can now track performance bottlenecks

---

### Session 2: Block B.6 - Dynamic Columns (v3.3.0) ✅
**Time**: 19:17-19:49 (32 minutes)  
**Status**: COMPLETE (TESTED)

**Changes**:
- ✅ `findColumnIndices()` helper function
- ✅ Dynamic column name → index mapping
- ✅ Replaced 8 hardcoded indices in `parsers.js`
- ✅ Fallback logic for backwards compatibility
- ✅ Clear error messages if columns missing

**Impact**: 
- **Before**: Parser breaks silently if Medtronic changes column order
- **After**: Parser detects columns dynamically, fails gracefully with clear errors
- **Risk**: MEDIUM-HIGH → LOW

**Files Modified**:
- `src/core/parsers.js` (+45 lines, major refactor)
- `PROGRESS.md` (real-time tracking)

**Test Results**: ✅ 90-day CSV verified, all metrics calculate correctly

---

## 🚨 READ THIS FIRST (New Session)

**If starting a new chat/session, read in this order**:

1. **`PROGRESS.md`** ← **PRIMARY SOURCE OF TRUTH**
   - Current session state (real-time updates)
   - What was just completed
   - Test results
   - TODO list
   - Exact timestamps

2. **`HANDOFF.md`** ← Context & Strategy
   - Overall Block B plan (7.5h roadmap)
   - Coding principles
   - Safety guidelines
   - Reference materials

3. **This file (START_HERE.md)** ← Navigation
   - Quick status overview
   - File structure
   - Git commands

**Golden Rule**: **PROGRESS.md is always up-to-date**. If there's a conflict, trust PROGRESS.md.

---

## 🎯 WHERE WE ARE (Block B Status)

### ✅ Completed
- **B.6.1**: Header structure analysis (8 min)
- **B.6.2**: `findColumnIndices()` helper (5 min)
- **B.6.3**: Dynamic column detection (9 min, TESTED ✅)

### 🎯 Next Up (Choose One)
- **B.7**: CSV format version detection (1h estimated)
- **B.8**: Unit tests for parser (3h estimated)
- **Docs**: Update CHANGELOG + tag v3.3.0 (15 min)

**Efficiency**: 73% faster than estimated (32 min vs 120 min!)

---

## 🔥 QUICK START (New Session)

**Step 1: Check Current State**
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git log --oneline -5
git status
```

**Step 2: Read PROGRESS.md**
- See what was just completed
- Check test results
- Read TODO list
- Note any blockers

**Step 3: Start Dev Server**
```bash
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
# Opens at http://localhost:3001
```

**Step 4: Decide Next Action**
- Continue Block B? (Check PROGRESS.md for next task)
- Document + tag release? (v3.3.0)
- New feature? (Check HANDOFF.md)

---

## 🎯 TIER 1 - OPERATIONAL (Read Every Session)

### Primary Navigation

**🔥 Essential Files (Read First)**:
1. **`PROGRESS.md`** ← Current state (ALWAYS read this!)
   - Real-time session tracking
   - What just shipped
   - Test results
   - TODO items
   - Exact timestamps

2. **`HANDOFF.md`** ← Strategy & context
   - Block B roadmap (7 tasks)
   - Coding principles
   - Safety guidelines
   - Reference materials

3. **`CHANGELOG.md`** ← Version history
   - v3.2.0: Performance + validation (shipped)
   - v3.3.0: Dynamic columns (in progress)

**📊 Status Tracking**:
- `project/STATUS.md` - Phase completion checkboxes

---

## 🛡️ SAFETY & ROLLBACK INFO

### Recent Major Changes (v3.3.0 in progress)

**⚠️ CRITICAL: Parser Refactor Active**
- File: `src/core/parsers.js`
- Change: Replaced hardcoded column indices with dynamic detection
- Status: **Tested ✅** (90-day CSV verified)
- Risk: LOW (fallback logic in place)

**Last Safe Checkpoints**:
```bash
017b7ec  # Current (Block B.6 complete, tested ✅)
827a038  # Safety point (helper function only)
3b2c5d8  # Block A complete (v3.2.0)
```

### Rollback Procedure (If Things Break)

**Option 1: Soft Revert (Undo last commit)**
```bash
git log --oneline -5  # Find commit to revert to
git revert HEAD       # Undo last commit (keeps history)
git push origin main
```

**Option 2: Hard Reset (Nuclear option)**
```bash
# ONLY IF THINGS ARE VERY BROKEN
git reset --hard 827a038   # Go back to safe point
# WARNING: Loses uncommitted work!
```

**Option 3: Create Safety Branch**
```bash
git checkout -b safety-backup-$(date +%Y%m%d)
git checkout main
# Now you can experiment safely
```

### Known Issues (Non-Blocking)

📝 **From TODO list in PROGRESS.md**:
- ⚠️ TDD not showing in all daily profiles (display only)
- Priority: P3 (low, fix later)
- File: Likely `src/components/DailyProfileModal.jsx`

---

## 📂 TIER 2 - PROJECT DOCS (Read When Planning)

### Architecture & Planning

**Deep Dive Analysis**:
- `docs/analysis/TIER2_SYNTHESIS.md` - Complete architecture review
  - 4,258 LOC analyzed across 12 files
  - Risk assessment: MEDIUM → LOW
  - Block-by-block roadmap

**Archived Handoffs**:
- `docs/handoffs/2025-11-01_block-a-quick-wins.md` - v3.2.0 (Block A)
- `docs/handoffs/` - Previous sessions

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

**Priority 1** (2025-11-01 morning, 45 min):
- ✅ Batch capacity validation
- ✅ Storage source indicators  
- ✅ Sensor ID collision detection

**Priority 2** (2025-11-01 afternoon, 30 min):
- ✅ Error recovery logging with rollback records
- ✅ Progress tracking for partial failures

**Priority 3** (2025-11-01 afternoon, 1.5 hours):
- ✅ 3.1: Deleted sensors 90-day cleanup
- ✅ 3.2: localStorage clear warning
- ✅ 3.3: Enhanced lock status API

**Documentation** (2025-11-01, 30 min):
- ✅ CHANGELOG.md (172-line v3.1.1 entry)
- ✅ Handoff archived
- ✅ Git commits pushed (10 commits)

**Analysis**:
- ✅ TIER2_SYNTHESIS.md (764 lines)
- ✅ Risk assessment: MEDIUM → LOW

---

### 🧹 In Progress

**Cleanup Phase** (This session) - 1 hour:
- [ ] Root directory file organization
- [ ] docs/archive/ consolidation
- [ ] public/ cleanup
- [ ] GitHub repository cleanup
- [ ] test-data/ organization
- [ ] Create v3.1.1 release tag

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
