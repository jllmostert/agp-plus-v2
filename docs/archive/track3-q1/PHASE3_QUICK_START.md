# 🚀 AGP+ Phase 3 Quick Start

**Copy-paste this to start Phase 3 in a new session**

---

I'm continuing AGP+ Context API refactoring. **Phase 2 complete**, starting **Phase 3: MetricsContext**.

**Project**: `/Users/jomostert/Documents/Projects/agp-plus`

## Current Status

✅ Phase 1 (DataContext): Complete  
✅ Phase 2 (PeriodContext): Complete  
🎯 Phase 3 (MetricsContext): Starting now

**Track 3 Progress**: 50% → 75% (after this phase)

---

## 📋 What Phase 3 Does

**Extract metrics calculation logic** from AGPGenerator into MetricsContext:
- `metricsResult` (calculated metrics from useMetrics hook)
- `comparisonData` (comparison period metrics)
- `dayProfiles` (day-by-day profiles)
- `tddData` (total daily dose statistics)

**Result**: ~200-300 lines removed from AGPGenerator, cleaner separation

---

## 🎯 Quick Start Commands

**1. Read PROGRESS.md (last 100 lines)**
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md offset=-100
```

**2. Start server**
```bash
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && export PATH=\"/opt/homebrew/bin:\$PATH\" && npx vite --port 3001" timeout_ms=15000
```

**3. Check server output**
```bash
DC: read_process_output pid=XXXXX timeout_ms=5000
```

---

## ⚠️ Key Reminders

1. **Work in small chunks** - Create file → Test → Continue
2. **Test after each change** - Don't make 10 edits without testing
3. **Update PROGRESS.md frequently** - Don't wait until the end
4. **Use edit_block with minimal context** - 2-5 lines max
5. **Search before editing** - Know what you're changing

---

## 📊 Estimated Time

**Total**: 5-7 hours
- Task 3.1: Create MetricsContext (2 hours)
- Task 3.2: Create useMetrics hook (30 min)
- Task 3.3: Update AGPGenerator (2 hours)
- Task 3.4: Update child components (1.5 hours)
- Task 3.5: Testing (1 hour)
- Task 3.6: Documentation (30 min)

---

## ✅ Success Criteria

- [ ] MetricsContext.jsx created (~250 lines)
- [ ] useMetrics.js hook created (~50 lines)
- [ ] AGPGenerator reduced by ~200-300 lines
- [ ] Components using metrics updated
- [ ] Server starts without errors
- [ ] All metrics calculations working
- [ ] PROGRESS.md updated

---

## 🚀 Ready to Start?

Begin with:

> ✅ **Phase 3 Starting**
> - Read PROGRESS.md to confirm Phase 2 complete
> - Start server
> - Begin creating MetricsContext.jsx
> 
> Strategy: Work incrementally, test frequently, update docs

**Let's go!** 🎉
