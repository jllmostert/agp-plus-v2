# SPRINT C1: SPLIT GOD COMPONENTS

**Block**: D - Quality  
**Sprint**: C1 - Split God Components  
**Effort**: 20 hours  
**Status**: 🔄 READY TO START  
**Last Update**: 2025-11-02

---

## 🎯 DOEL

Break down massive components for better performance, testability, and maintainability.

**Target files**:
- `AGPGenerator.jsx` (1962 lines)
- `SensorHistoryModal.jsx` (1387 lines)

**Expected outcome**:
- 50% fewer re-renders
- Components <300 lines each
- Better performance

---

## 📋 TAKEN (20h totaal)

### Taak 1: Strategy Planning (2h)
- [ ] Read AGPGenerator.jsx (30 min)
- [ ] Identify component boundaries (30 min)
- [ ] Create hierarchy diagram (30 min)
- [ ] Document strategy (30 min)

### Taak 2: Extract Containers (6h)
- [ ] DataLoadingContainer (2h)
- [ ] VisualizationContainer (2h)
- [ ] ModalManager (2h)

### Taak 3: Extract Features (6h)
- [ ] DataUploadPanel (1.5h)
- [ ] MetricsPanel (1.5h)
- [ ] ChartPanel (1.5h)
- [ ] FilterPanel (1.5h)

### Taak 4: Table Virtualization (3h)
- [ ] Install react-window (5 min)
- [ ] Implement FixedSizeList (2h)
- [ ] Test & polish (55 min)

### Taak 5: Testing (3h)
- [ ] Manual testing (1h)
- [ ] Performance testing (1h)
- [ ] Regression testing (1h)

---

## ⚠️ CRITICAL: SESSION MANAGEMENT

**This sprint = 20 hours = MINIMUM 10 sessions**

**STOP and commit after**:
- Every component creation
- Every 2 hours maximum
- Before context feels full

**Update PROGRESS.md after every task!**

---

## ✅ DEFINITION OF DONE

- [ ] AGPGenerator <300 lines
- [ ] 7 new components created
- [ ] React.memo applied
- [ ] Table virtualization working
- [ ] Performance improved (measured)
- [ ] All tests pass
- [ ] PROGRESS.md updated
- [ ] Git committed

---

**Version**: 1.0  
**Created**: 2025-11-02
