# 🎯 AGP+ GENERAL HANDOFF
**Project**: AGP+ (Ambulatory Glucose Profile Plus)  
**Last Updated**: October 26, 2025  
**Current Version**: v3.0-dev  
**Status**: Phase 3.5 Complete ✅

---

## 📍 WHERE WE ARE

**Current Phase**: V3 Master Dataset - Comparison Debug **Complete**  
**Branch**: v3.0-dev  
**Latest Commit**: 6034fcb  
**Features**: All working (metrics, comparison, filtering, workdays, day profiles)

**See detailed handoff**: `HANDOFF_V3_DEBUG_COMPLETE.md`

---

## 🚀 QUICK START

```bash
# Navigate to project
cd /Users/jomostert/Documents/Projects/agp-plus

# Start dev server (if not running)
export PATH="/opt/homebrew/bin:$PATH"
npm run dev

# Access at http://localhost:3001
```

---

## 🗂️ KEY FILES

| File | Purpose |
|------|---------|
| `src/components/AGPGenerator.jsx` | Main app orchestrator |
| `src/hooks/useMasterDataset.js` | V3 data management |
| `src/hooks/useComparison.js` | Period comparison logic |
| `src/storage/masterDatasetStorage.js` | IndexedDB operations |
| `HANDOFF_V3_DEBUG_COMPLETE.md` | Detailed session notes |
| `PROJECT_BRIEFING_V2_2_0.md` | Full project context |
| `DIVIDE_CONQUER_INDEX.md` | Phase breakdown |

---

## 💾 DATA ARCHITECTURE

```
V3 Master Dataset (IndexedDB)
├── 28,387 glucose readings
├── 4 monthly buckets (Jul-Oct 2025)
├── 52 workdays configured
└── Sensor/cartridge events tracked
```

---

## ✅ WORKING FEATURES

- ✅ Master dataset with incremental storage
- ✅ Date range filtering (14d, 30d, 90d, custom)
- ✅ Comparison data (14d/30d previous period)
- ✅ Workday vs restday metrics
- ✅ Individual day profiles
- ✅ Event detection (hypo/hyper/device)
- ✅ HTML export

---

## 🎯 NEXT PRIORITIES

1. **Phase 4.0**: Direct CSV → V3 Upload (bypass V2)
2. **Phase 5.0**: UI Polish (remove migration banner, etc.)
3. **Optional**: Y-axis optimization (54-250 mg/dL)

---

## 🛠️ CRITICAL TOOLS

**File Operations**: Use Desktop Commander exclusively  
**Paths**: Always use absolute paths: `/Users/jomostert/Documents/Projects/agp-plus/`  
**Git**: Chain commands with `&&` for reliability

---

## 🧠 PROJECT PHILOSOPHY

- **Clinical Accuracy**: ADA/ATTD standards, mg/dL only
- **Brutalist Design**: 3px borders, monospace, high contrast
- **KISS Principle**: Simple solutions over clever hacks
- **5-min Resolution**: Never aggregate, preserve variability

---

## 📚 DOCUMENTATION

| Document | Purpose |
|----------|---------|
| PROJECT_BRIEFING_V2_2_0.md | Complete project context |
| HANDOFF_V3_DEBUG_COMPLETE.md | Latest session details |
| DIVIDE_CONQUER_INDEX.md | Phase-by-phase roadmap |
| metric_definitions.md | Clinical calculations reference |
| minimed_780g_ref.md | Device specifications |

---

## 💡 KEY PATTERNS

**Desktop Commander**:
```javascript
// Always use absolute paths
/Users/jomostert/Documents/Projects/agp-plus/src/...

// Git operations
git add -A && git commit -m "message" && git push origin v3.0-dev

// File operations (15000ms timeout for git)
timeout_ms: 15000
```

**Data Flow**:
```
CSV Upload → Parser → IndexedDB Buckets → Transform to V2 Format → Engines → UI
```

**Hook Pattern**:
```javascript
// Filtered data for display
const { readings } = useMasterDataset();

// Full data for calculations
const { allReadings } = useMasterDataset();
```

---

*For complete context, see `HANDOFF_V3_DEBUG_COMPLETE.md`*  
*For project overview, see `PROJECT_BRIEFING_V2_2_0.md`*
