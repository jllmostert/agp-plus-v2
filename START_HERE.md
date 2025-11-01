---
tier: 1
status: active
last_updated: 2025-11-01 23:50
purpose: Central navigation for AGP+ v3.6.0 → Domain G → Domain F
---

# 🧭 START HERE - AGP+ v3.6.0

**Status**: Domain C Complete ✅ → Domain G Next  
**Version**: v3.6.0 (committed: 4733095)  
**Last Session**: 2025-11-01 23:15-23:45 (Domain C + housekeeping, 30 min)  
**Next**: Domain G (Export/Import, 45 min) → Domain F (Visualization, 60 min)

---

## 🎯 NEW SESSION CHECKLIST

1. **Read HANDOFF.md** ← Domain G analysis instructions (Priority 1)
2. **Verify git**: `git log --oneline -3` (should show 4733095)
3. **Apply lessons learned**: Read large files in chunks (offset/length)

---

## 📂 KEY FILES

**For Next Session** (Domain G):
- `HANDOFF.md` - Complete Domain G instructions + lessons learned
- `src/utils/exportUtils.js` - Export functionality
- `src/utils/importUtils.js` - Import validation
- `src/utils/pdfGenerator.js` - PDF generation

**After Domain G** (Domain F):
- `src/components/AGPChart.jsx` - Main chart
- `src/components/DayNightChart.jsx` - Day/night split
- `src/hooks/useChartData.js` - Data transformation

**Reference**:
- `docs/analysis/DOMAIN_C_UI_COMPONENTS_ANALYSIS.md` - Just completed
- `docs/analysis/TIER2_ANALYSIS_SUMMARY.md` - Progress tracking

---

## 🚀 QUICK START

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"

# Verify status
git log --oneline -3  # Latest: 4733095 (Domain C)
git status           # Clean

# Start Domain G
# IMPORTANT: Use offset/length for files >800 lines (lessons learned!)
```

---

## 📊 PROJECT STATUS

**Completed**:
- ✅ Block A: Performance (metrics 3-64ms)
- ✅ Block B.1-B.8: Parser (dynamic, validated, tested)
- ✅ B.6.4: Validation layer (3-tier system)
- ✅ TIER2 Analysis: 5/6 domains complete
  - ✅ Domain A: Parsing (8.5/10)
  - ✅ Domain B: Metrics (9.0/10)
  - ✅ Domain C: UI Components (6.5/10) ← Just completed
  - ✅ Domain D: Storage (7.0/10)
  - ✅ Domain E: Stock (8.0/10)

**Next** (ordered priority):
1. 🔄 Domain G: Export/Import (45 min) ← START HERE
2. 📋 Domain F: Visualization (60 min)
3. 📋 TIER2 Synthesis (30 min)

**Architecture Score**: 7.3/10 (down from 8.0 due to UI complexity)

---

## 💡 CRITICAL LESSONS LEARNED

**Apply these to avoid context overflow**:

1. **Large files**: ALWAYS use offset/length for files >800 lines
   - Check file size first: `get_file_info(path)`
   - Read in 100-line chunks: `read_file(path, offset=0, length=100)`
   
2. **Write operations**: Max 25-30 lines per call
   - Use `mode='append'` for building large files
   - Save incrementally (don't wait for end)

3. **Progress tracking**: Document DURING work
   - Take notes in chunks
   - Commit partial work
   - Recovery easier with incremental saves

4. **Recovery**: Chunk-based reading works perfectly
   - Read structure first (50-100 lines)
   - Jump to specific sections with offset
   - Build complete picture incrementally

**See HANDOFF.md for full details**

---

## 🗂️ RECENT HOUSEKEEPING (2025-11-01)

**Archived**:
- `docs/archive/2025-11/` - 4 old analysis docs
- `docs/handoffs/archive/2025-11/` - 4 old session handoffs

**Active Documents**:
- `HANDOFF.md` - Current session instructions
- `START_HERE.md` - This file (navigation)
- `PROGRESS.md` - Session history

**Analysis Docs**:
- `TIER2_ANALYSIS_SUMMARY.md` - Status tracker (5/6 complete)
- `TIER2_SYNTHESIS.md` - Comprehensive synthesis
- `DOMAIN_C_UI_COMPONENTS_ANALYSIS.md` - Latest analysis

---

**Version**: 4.0 (Post-Domain C + Housekeeping)  
**Git**: 4733095 (v3.6.0), ready for Domain G analysis
