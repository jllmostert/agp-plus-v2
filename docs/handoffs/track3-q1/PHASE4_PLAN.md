# Track 3 Phase 4: UIContext Extraction

**Status**: 🔄 PLANNED  
**Sessions**: 40-43  
**Estimated**: 4-6 hours  
**Goal**: 0 useState in AGPGenerator

---

## 🎯 OBJECTIVE

Extract laatste 8 state variables uit AGPGenerator naar centralized contexts.

**Target**:
- AGPGenerator: 1546 → ~1100-1200 lines
- useState calls: 8 → 0
- Complete context pattern: Data + Period + Metrics + UI

---

## 📊 CURRENT STATE (8 variables)

**In AGPGenerator.jsx**:
```javascript
const [selectedDateRange, setSelectedDateRange] = useState({ start, end })
const [dayNightEnabled, setDayNightEnabled] = useState(false)
const [patientInfo, setPatientInfo] = useState(null)
const [loadToast, setLoadToast] = useState(null)
const [batchAssignmentDialog, setBatchAssignmentDialog] = useState({ open: false, suggestions: [] })
const [pendingUpload, setPendingUpload] = useState(null)
const [workdays, setWorkdays] = useState(null)
const [numDaysProfile, setNumDaysProfile] = useState(7)
```

**Question**: Waar hoort elke variable?
- `selectedDateRange` → PeriodContext? (of is dit anders dan PeriodContext.customRange?)
- `dayNightEnabled` → UIContext ✓
- `patientInfo` → DataContext? (of UIContext?)
- `loadToast` → UIContext ✓
- `batchAssignmentDialog` → UIContext ✓
- `pendingUpload` → UIContext ✓
- `workdays` → DataContext? (of UIContext?)
- `numDaysProfile` → UIContext ✓

**NOTE**: Sommige lijken DATA (patient, workdays), niet UI. Check contexts eerst!

---

## 🗂️ DISTRIBUTION PLAN

### Option A: Pure UIContext (all 8)
- UIContext krijgt ALLE 8 variables
- Simple, maar niet semantisch correct
- Patient/workdays zijn DATA, niet UI

### Option B: Distribute by semantics
- **DataContext**: patientInfo, workdays
- **PeriodContext**: selectedDateRange (?)
- **UIContext**: rest (6 variables)
- Correct, maar complexer

**DECISION NEEDED in Session 41**: Check existing contexts, decide distribution

---

## 📋 SESSION BREAKDOWN

### Session 40 ✅ DONE
- Planning
- Update PROGRESS.md
- Write this plan

### Session 41 (2 hours)
1. **Analyze existing contexts** (30 min)
   - Read DataContext: does it have patientInfo/workdays?
   - Read PeriodContext: what's selectedPeriod vs selectedDateRange?
   - Decide distribution (Option A or B)

2. **Create UIContext** (1 hour)
   - File: `src/contexts/UIContext.jsx`
   - State variables (6-8, depending on distribution)
   - Helper methods
   - Export UIProvider + useUI hook

3. **Create useUI hook** (30 min)
   - File: `src/hooks/useUI.js`
   - Wrapper around useContext(UIContext)
   - Same pattern as useData, usePeriod, useMetrics

### Session 42 (2 hours)
1. **Wrap App in UIProvider** (15 min)
   - Update App.jsx
   - Add UIProvider around existing providers

2. **Update AGPGenerator** (1.5 hours)
   - Remove useState calls
   - Replace with useUI() hook
   - Test each replacement incrementally
   - Commit after each major change

3. **Update consuming components** (15 min)
   - Any components that receive these props
   - Use useUI() directly instead

### Session 43 (1 hour)
1. **Testing** (30 min)
   - Fresh load
   - All panels work
   - No console errors
   - Performance check

2. **Documentation** (30 min)
   - Update ARCHITECTURE_OVERVIEW.md
   - Update PROGRESS.md
   - Write SESSION_43_SUMMARY.md
   - Git commit + push

---

## 🎯 ACCEPTANCE CRITERIA

- [ ] AGPGenerator has 0 useState calls
- [ ] All 8 state variables in contexts
- [ ] No functionality broken
- [ ] No console errors
- [ ] AGPGenerator ~1100-1200 lines
- [ ] Tests pass
- [ ] Documentation updated

---

## ⚠️ RISKS & MITIGATIONS

**Risk 1**: State distribution unclear
- **Mitigation**: Analyze contexts first, decide early

**Risk 2**: Breaking changes during refactor
- **Mitigation**: Small commits, test after each change

**Risk 3**: Context overflow
- **Mitigation**: Work in 30-line chunks, frequent commits

---

## 🚫 OUT OF SCOPE (per Jo's feedback)

**NOT doing**:
- ❌ Insulin-on-board visualization (missing autocorrections data)
- ❌ Basal rate overlay
- ❌ Advanced insulin metrics
- ❌ Track 4 Medical Accuracy features

**Postponed**:
- ⏭️ Sprint S3 Workday/Weekend split (only metrics, no viz)
- ⏭️ Separate workday/weekend visualizations

**Focus**: UIContext extraction ONLY

---

## 📚 REFERENCE

**Existing contexts**:
- `src/contexts/DataContext.jsx`
- `src/contexts/PeriodContext.jsx`
- `src/contexts/MetricsContext.jsx`

**Existing hooks**:
- `src/hooks/useData.js`
- `src/hooks/usePeriod.js`
- `src/hooks/useMetrics.js`

**Pattern to follow**: Same as above ☝️

---

**Next**: Session 41 - Create UIContext
