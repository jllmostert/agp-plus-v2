# 🚀 QUICK START - V3.8.0 Development

**For Next Session** | October 26, 2025, 23:45 CET

---

## 📖 READ FIRST

**Main Handoff**: `docs/handoffs/HANDOFF_V3_8_0_NEXT_PHASE_OCT26.md`
- Complete phase planning
- Implementation roadmap
- Testing strategies

**Previous Version**: `QUICKSTART_V3_7_2.md` (archived)

---

## ✅ WHAT'S DONE (V3.7.2)

### 🎨 UI Successfully Refactored:
- ✅ Status indicator: Compact, right-aligned, less intrusive
- ✅ Three-button layout: IMPORT/DAGPROFIELEN/EXPORT
- ✅ Collapsible sections: Clean progressive disclosure
- ✅ Day profiles: Button order fixed (Close → Print)

**User Verdict**: "JA PERFECT" 💚

---

## 🐛 ISSUES TO FIX FIRST

### 1. Import Database Button
**Problem**: Visible but non-functional  
**Solution**: Hide until Phase 4 or implement now  
**Priority**: P0 (causes confusion)

### 2. UI Clutter Under Import
**Problem**: Too much "rommel" below the three buttons  
**Solution**: Keep only:
- Upload CSV (+ ✓ indicator)
- Import Database (if functional)
- ProTime PDFs (+ ✓ indicator)

**Priority**: P0 (clean interface)

---

## 🔄 SERVER RESTART

```bash
# Kill any processes, navigate, set PATH, start server
lsof -ti:3001,5173 | xargs kill -9 2>/dev/null && \
cd /Users/jomostert/Documents/Projects/agp-plus && \
export PATH="/opt/homebrew/bin:$PATH" && \
npx vite --port 3001
```

**Chrome**: `CMD + SHIFT + R` for hard refresh  
**MCP**: Desktop Commander + Chrome connectors available!

---

## 🎯 THIS SESSION PRIORITIES

### P0: Git Housekeeping
```bash
# Push 7 waiting commits
git push origin v3.0-dev

# Check clean state
git status
```

### P1: UI Cleanup (Before New Features)
- [ ] Remove clutter under IMPORT buttons
- [ ] Fix/hide Import Database button
- [ ] Test all interactions
- [ ] Hard refresh + verify

### P2: Database Export (JSON)
- [ ] Create `src/storage/export.js`
- [ ] Implement `exportMasterDataset()`
- [ ] Add to EXPORT section
- [ ] Test with 28k+ readings

### P3: Sensor History Integration
- [ ] Analyze sensor database structure
- [ ] Decide: Link / Embed / Import
- [ ] Implement chosen approach

---

## 🎨 FUTURE IMPROVEMENTS (Documented)

### AGP Chart Sizing
> "Op groot scherm: AGPchart is niet groot genoeg. Op zich mag die een groot deel van het scherm innemen. Het is gewoon een fancy chart!"

**Action**: Responsive sizing for large screens

### Color Consistency
**Current issues**:
- Percentiles: "lelijk blauw" instead of HTML colors
- Inconsistent line weights/styles
- Multiple shades of same colors

**Target Palette** (Brutalist):
- 🟢 Green: Good values, confirmations
- 🟡 Yellow: Warnings, limited data
- 🟠 Orange: Hypers (dotted lines)
- 🔴 Red: Hypos (dashed lines), critical alerts

**Action**: Color audit + consolidation

### Typography Simplification
> "Gebruiken we in het algemeen niet net iets teveel verschillende fonts?"

**Action**: Font audit, reduce to 2-3 families

### Profile Indicators
- Hypos: Red dashed lines
- Hypers: Orange dotted lines
- AGP chart: Dots/circles for events
- Horizontal lines: Consistent weights (2-3px brutalist)

**Action**: Visual polish phase

---

## 🧪 TESTING CHECKLIST

### Before Git Push:
- [ ] IMPORT button expands/collapses
- [ ] Three sub-buttons visible (CSV, Database, ProTime)
- [ ] No confusing UI elements
- [ ] EXPORT button expands/collapses
- [ ] Four export options visible
- [ ] DAGPROFIELEN works (last 7 days)
- [ ] Status indicator shows correct data

### After Database Export:
- [ ] Export button in EXPORT section
- [ ] JSON downloads successfully
- [ ] File contains 28k+ readings
- [ ] Structure is human-readable
- [ ] Includes metadata (dates, counts)

---

## 📊 CURRENT STATE

**Version**: v3.7.2 (→ v3.8.0-dev)  
**Dataset**: 28,528 readings (Jul 11 - Oct 26, 2025)  
**Branch**: v3.0-dev (7 commits unpushed)  
**Server**: http://localhost:3001/  
**Status**: UI refactor complete, ready for cleanup + database export

---

## 🔍 QUICK DEBUG COMMANDS

### Via Chrome Connector:
```javascript
// Verify three main buttons
['IMPORT', 'DAGPROFIELEN', 'EXPORT'].every(b => 
  document.body.innerText.includes(b)
);

// Check version
document.querySelector('h1').textContent; // "AGP+ V3.7.2"

// Verify dataset
document.body.innerText.includes('28,528 readings');
```

---

## 📂 KEY FILE LOCATIONS

**Project Root**: `/Users/jomostert/Documents/Projects/agp-plus/`

**To Modify**:
- Main UI: `src/components/AGPGenerator.jsx`
- Storage: `src/storage/` (new: `export.js`)
- Engines: `src/core/` (calculation logic)

**Sensor Database**: `/Users/jomostert/Documents/Projects/Sensoren/sensor_database_brutalist.html`

---

## 🎯 ARCHITECTURAL PRINCIPLES

### Data Separation (CRITICAL):
```
Raw Data (IndexedDB)
    ↓
Export/Processing Layer
    ↓
Presentation (React)
```

**Why**:
- Troubleshooting: Inspect raw data anytime
- Future-proof: Data survives CSV format changes
- Clean: Storage ≠ Processing ≠ UI

---

## 💡 KEY INSIGHTS

### From V3.7.2 Success:
1. **User feedback crucial**: "JA PERFECT" after direct checks
2. **Progressive disclosure works**: Collapsibles reduce clutter
3. **Small commits better**: Incremental changes easier to review
4. **Desktop Commander essential**: macOS requires it for file ops

### For V3.8.0:
1. **Clean UI first**: Remove clutter before adding features
2. **Export for debugging**: Raw data access crucial
3. **Define palette upfront**: Color consistency from start
4. **Audit fonts early**: Typography proliferation is real

---

## 📚 DOCUMENTATION

**Handoffs**: `docs/handoffs/HANDOFF_V3_*.md`  
**This file**: Current session priorities  
**Archived**: Previous QUICKSTART files (v3.7.x)

**Project Knowledge**: Available via MCP search  
**Briefing**: `/mnt/project/PROJECT_BRIEFING_V2_2_0_PART*.md`

---

## 🚀 READY TO GO

1. **Push commits** → Clean git state
2. **Clean UI** → Remove clutter
3. **Export JSON** → Database backup
4. **Test thoroughly** → Verify all works
5. **Document changes** → Update handoffs

---

*Methodische aanpak, schone documentatie, schoon design!* 🎯

**Last Updated**: October 26, 2025, 23:45 CET
