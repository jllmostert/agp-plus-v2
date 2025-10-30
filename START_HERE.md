---
tier: 1
status: active
last_updated: 2025-10-30
purpose: Entry point for all development sessions
---

# START HERE — AGP+ v3.1 Development

**Quick Status**: Server running on port 3001 | Phase 4 UI implementation ready

## 🚀 Quick Start (Every Session)

### 1. Read Current State
```bash
cat HANDOFF.md  # Current phase details
cat project/STATUS.md  # Overall project status
```

### 2. Start Dev Server
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001
```
Open: http://localhost:3001/

### 3. Verify Setup
- ✅ App loads without errors
- ✅ 219 sensors shown in UI
- ✅ No console errors in DevTools

## 📂 Project Structure

```
agp-plus/
├── START_HERE.md          ← You are here
├── HANDOFF.md             ← Current phase details (READ FIRST)
├── src/
│   ├── components/        ← React UI
│   ├── core/              ← Pure calculation engines  
│   ├── storage/           ← IndexedDB + SQLite
│   ├── hooks/             ← React hooks
│   └── styles/            ← CSS
├── test-data/             ← Real CSV exports (READ-ONLY)
├── public/                ← Static assets
├── project/               ← Architecture docs
└── reference/             ← Technical references
```

## 🎯 Current Mission (v3.1 Phase 4)

**Goal**: Build sensor registration UI for CSV-detected sensor changes

**Status**: Detection engine complete (Phases 1-3), UI ready to implement

**Last Completed**: Import error fixes (Session 2025-10-30, 13:57)
- Fixed 3 import mismatches causing white screen
- Simplified workflow to use unified detection engine
- Commit: 7aa4399

**Next Step**: Implement Phase 4A - Modal container & file upload UI

## 📋 Document Hierarchy

### Tier 1 (Start Here)
- `START_HERE.md` - This file
- `HANDOFF.md` - Current phase handoff
- `DocumentHygiene.md` - File structure rules

### Tier 2 (Project Docs)
- `project/STATUS.md` - Overall project status
- `project/V3_ARCHITECTURE.md` - Technical design
- `project/TEST_PLAN.md` - Testing strategy

### Tier 3 (References)
- `reference/metric_definitions.md` - CGM metrics
- `reference/minimed_780g_ref.md` - Pump settings
- `reference/GIT_WORKFLOW.md` - Version control

## 🔧 Common Tasks

### Start Fresh Session
```bash
# 1. Check server status
cat .dev-server-pid

# 2. Kill if needed
kill -9 $(cat .dev-server-pid | head -1)

# 3. Start server
npx vite --port 3001

# 4. Open browser
open http://localhost:3001/
```

### Check Current Work
```bash
# What phase are we in?
grep "^phase:" HANDOFF.md

# What's the last commit?
git log -1 --oneline

# What files changed?
git status
```

### Run Tests
```bash
# Detection engine test harness
open public/test-sensor-detection.html
# Expected: 2 HIGH confidence candidates
```

### Inspect Storage
1. Open DevTools → Application
2. Navigate to IndexedDB → agp-plus-v3
3. Check tables: sensors (219 records), masterData

## 🎨 Development Principles

### Brutalist Theme
- 3px solid borders, no shadows
- Monospace typography
- High contrast black/white
- Print-compatible
- Fast loading

### Data Flow
1. **CSV Upload** → Parser extracts sections
2. **Detection Engine** → Analyzes alerts + gaps
3. **User Review** → Confirms/ignores candidates  
4. **IndexedDB** → Persists sensor records

### File Guidelines
- **Read-only**: test-data/ (never modify)
- **Chunk writes**: ≤30 lines per write operation
- **Use Desktop Commander**: Required for all file ops
- **Test with real data**: No dummy values

## 🧪 Testing Checklist

Before any commit:
- [ ] Server starts without errors
- [ ] App loads at http://localhost:3001/
- [ ] Console has no errors
- [ ] Test CSV processes correctly
- [ ] Expected output matches reality

## 🚨 Critical Paths

### Detection Engine Files (Don't Break!)
- `src/core/csvSectionParser.js` - 3-section parser
- `src/core/glucoseGapAnalyzer.js` - Gap detection
- `src/core/sensorDetectionEngine.js` - Unified detection
- `src/core/sensorEventClustering.js` - Alert clustering

### Storage Layer Files (Handle with Care!)
- `src/storage/sensorStorage.js` - IndexedDB CRUD
- `src/storage/masterDataStorage.js` - Main data store
- `src/storage/sensorImport.js` - SQLite import

### Test Data (READ-ONLY)
- `test-data/SAMPLE__Jo Mostert 30-10-2025_7d.csv` - 7-day export
- Expected: 2 sensor changes (Oct 30, Oct 25)

## 📊 Key Metrics

**Current State**:
- Sensors in DB: 219 (March 2022 - Oct 2025)
- Detection accuracy: 100% (2/2 candidates)
- Test CSV: 2826 lines, 3 sections
- App version: v3.0 (stable) → v3.1 (in progress)

**Performance Targets**:
- CSV parse: <500ms
- Detection: <1000ms
- UI render: <100ms
- IndexedDB write: <50ms

## 🔗 Quick Links

- **Live App**: http://localhost:3001/
- **GitHub**: (local only, no remote)
- **Test Harness**: http://localhost:3001/test-sensor-detection.html
- **DevTools**: Chrome → F12

## 📝 Session Start Routine

1. **Read**: `HANDOFF.md` (phase details)
2. **Start**: Server on port 3001
3. **Verify**: App loads, no errors
4. **Check**: Git status, current branch
5. **Plan**: Read phase checklist
6. **Code**: Focus on one phase at a time
7. **Test**: Real CSV data, not dummy
8. **Commit**: Small, focused commits
9. **Update**: HANDOFF.md for next session

## ⚡ Power Tips

- **Always use absolute paths** in code
- **Never quote source material** (copyright!)
- **Test incrementally** - don't write 200 lines blind
- **Use detection engine** - don't re-implement logic
- **Check IndexedDB** after storage operations
- **Console.log liberally** during development
- **Clean up logs** before committing

## 🎯 Current Phase Focus

**Phase 4: Registration UI**
- Build modal container
- File upload with drag-drop
- Candidates review table  
- Confirm/ignore/split actions
- Debug log panel

**See**: `HANDOFF.md` for detailed implementation plan

---

**Version**: v3.1-phase4  
**Server**: Port 3001 (PID 31953)  
**Last Updated**: 2025-10-30 13:57 CET  
**Status**: ✅ Ready for Phase 4 implementation