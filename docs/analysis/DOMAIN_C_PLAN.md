# Domain C: UI Components Analysis Plan

**Priority**: P1 (Highest)  
**Effort**: 90 minutes  
**Files**: 8-10 components (~4,000 lines)

---

## 🎯 OBJECTIVES

1. **Architecture**: Component coupling, state management, file sizes
2. **User Flows**: CSV upload → sensor detection → assignment → storage
3. **Performance**: Large dataset rendering, modal performance
4. **Accessibility**: ARIA labels, keyboard nav, color contrast
5. **Issues**: Known bugs (TDD display), technical debt

---

## 📂 FILES TO ANALYZE

**Primary** (read these):
- `AGPGenerator.jsx` (800 lines) - Report assembly
- `SensorHistoryModal.jsx` (1,388 lines) ⚠️ - Sensor management
- `DayProfilesModal.jsx` (400 lines) - Daily profiles
- `StockManagementModal.jsx` (600 lines) - Batch management
- `BatchAssignmentDialog.jsx` (300 lines) - Assignment flow

**Secondary** (skim if time):
- FileUpload.jsx, PatientInfo.jsx, DataManagementModal.jsx

---

## ⏱️ TIME ALLOCATION

**Phase 1: Read Components** (30 min)
- Focus on structure, not details
- Note: responsibilities, props, state patterns
- Identify: large files, coupling issues

**Phase 2: Map User Flows** (20 min)
- CSV upload → Detection → Assignment
- Sensor CRUD operations
- Export/Import workflow

**Phase 3: Performance Check** (15 min)
- Large table rendering (1000+ sensors)
- Modal open/close speed
- Re-render patterns (React DevTools)

**Phase 4: Document Findings** (25 min)
- Architecture score
- Issues list (priority ranked)
- Refactoring recommendations

---

## 📊 EXPECTED FINDINGS

**Likely Issues**:
- ⚠️ SensorHistoryModal.jsx too large (1,388 lines)
- ⚠️ Props drilling in AGPGenerator
- ⚠️ Modal performance with large datasets
- 🟢 Good: Brutalist theme consistent

**Priority Fixes**:
1. Split large components (SensorHistoryModal)
2. Optimize table rendering (virtualization?)
3. Add error boundaries
4. Improve loading states

---

## ✅ DELIVERABLE

**Create**: `DOMAIN_C_UI_COMPONENTS_ANALYSIS.md`

**Structure**:
1. Executive Summary (score, risk)
2. Component Breakdown (per-file)
3. User Flow Analysis
4. Performance Assessment
5. Issues & Recommendations
6. Refactoring Opportunities

---

**Next Session**: Start with Phase 1 (read components)
