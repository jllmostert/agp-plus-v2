# 🚀 Quick Start: Phase 2 (Copy-Paste This)

---

I'm continuing AGP+ Context API refactoring. **Phase 1 complete**, starting **Phase 2: PeriodContext**.

**Project**: `/Users/jomostert/Documents/Projects/agp-plus`

## 📖 Step 1: Read Plan (REQUIRED)

```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/track3-q1/PHASE2_PERIODCONTEXT_PLAN.md
```

**Read the ENTIRE plan before coding.** It has complete instructions.

## 🎯 Objective

Extract period state from AGPGenerator → Create PeriodContext

**What moves**: startDate, endDate, safeDateRange, period handlers

**Result**: ~150 lines removed from AGPGenerator, better separation

## ⚠️ Avoid Context Overflow

1. **Read in chunks**: `DC: read_file path=... length=100`
2. **Work incrementally**: 1 file → test → next file
3. **Search first**: `DC: start_search` before editing
4. **Small edits**: Use `edit_block` with 2-5 line context
5. **Test often**: Start server after each major change

## 📋 Tasks (4-6 hours)

1. ✅ Task 2.1: Create PeriodContext.jsx (~90 min)
2. ✅ Task 2.2: Create usePeriod.js hook (~30 min)
3. ✅ Task 2.3: Update AGPGenerator (~60 min)
4. ✅ Task 2.4: Update child components (~60 min)
5. ✅ Task 2.5: Test everything (~45 min)
6. ✅ Task 2.6: Update docs (~30 min)

## 🛠️ Key Commands

**Read plan**:
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/track3-q1/PHASE2_PERIODCONTEXT_PLAN.md
```

**Read current progress**:
```bash
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md offset=-100
```

**Start server**:
```bash
DC: start_process command="cd /Users/jomostert/Documents/Projects/agp-plus && export PATH=\"/opt/homebrew/bin:\$PATH\" && npx vite --port 3001" timeout_ms=15000
```

**Check server output**:
```bash
DC: read_process_output pid=XXXXX timeout_ms=5000
```

## ✅ Success Criteria

- [ ] PeriodContext.jsx created (~200 lines)
- [ ] usePeriod.js created (~50 lines)
- [ ] AGPGenerator reduced by ~150 lines
- [ ] All components using period state updated
- [ ] Server starts, no errors
- [ ] Period selection works
- [ ] PROGRESS.md updated

## 📞 Start Response Template

After reading the plan, begin with:

> ✅ **Phase 2 Plan Read**
> - Objective: Extract period state to PeriodContext
> - Strategy: Work incrementally, test after each change
> - Starting with Task 2.1: Create PeriodContext.jsx
> 
> First action: [describe what you're doing]

---

**Full details**: See PHASE2_SESSION_STARTER.md (427 lines)

**Ready?** Read the plan, then start coding! 🚀
