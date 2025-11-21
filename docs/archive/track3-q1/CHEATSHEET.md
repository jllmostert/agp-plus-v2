# 📄 Phase 2 - One-Page Cheat Sheet

**Phase 1**: ✅ COMPLETE | **Phase 2**: 📋 READY | **Time**: 4-6 hours

---

## 🚀 START NOW (Copy-Paste)

**Option 1 - Quick Start** (90 lines):
```bash
cat /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/track3-q1/PHASE2_QUICK_START.md
```
Copy entire output → Paste into new Claude chat

**Option 2 - Full Start** (427 lines):
```bash
cat /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/track3-q1/PHASE2_SESSION_STARTER.md
```
Copy entire output → Paste into new Claude chat

---

## 📋 VERIFY FIRST (30 seconds)

```bash
# 1. Phase 1 complete?
grep "SESSION 35" /Users/jomostert/Documents/Projects/agp-plus/docs/handoffs/PROGRESS.md | grep COMPLETE

# 2. ImportPanel uses context?
grep "useData" /Users/jomostert/Documents/Projects/agp-plus/src/components/panels/ImportPanel.jsx

# 3. Server runs?
cd /Users/jomostert/Documents/Projects/agp-plus && export PATH="/opt/homebrew/bin:$PATH" && npx vite --port 3001
```

**All ✅?** → Ready to start Phase 2

---

## 🎯 PHASE 2 GOAL

**Extract**: startDate, endDate, safeDateRange from AGPGenerator  
**Create**: PeriodContext.jsx (~200 lines) + usePeriod.js (~50 lines)  
**Result**: AGPGenerator -150 lines, better separation

---

## 📝 TASKS (4-6 hours)

1. Create PeriodContext.jsx (90 min)
2. Create usePeriod.js (30 min)
3. Update AGPGenerator (60 min)
4. Update child components (60 min)
5. Test everything (45 min)
6. Update docs (30 min)

---

## ⚠️ RULES (Avoid Context Overflow)

1. **Read in chunks**: `DC: read_file path=... length=100`
2. **Search first**: `DC: start_search path=... pattern="..."`
3. **Small edits**: Use `edit_block` with 2-5 line context
4. **Test often**: After each major change
5. **Work incrementally**: 1 file → test → next file

---

## 📚 DOCUMENTS CREATED

```
track3-q1/
├── PHASE2_QUICK_START.md          → Quick start (recommended)
├── PHASE2_SESSION_STARTER.md      → Full instructions
├── SESSION_HANDOFF.md             → Verification checklist
└── SESSION_35_DELIVERABLES.md     → What was delivered
```

---

## ✅ SUCCESS = All These True

- [ ] PeriodContext.jsx created (~200 lines)
- [ ] usePeriod.js created (~50 lines)
- [ ] AGPGenerator uses usePeriod()
- [ ] PeriodSelector uses usePeriod()
- [ ] Server starts, no errors
- [ ] Period selection works
- [ ] PROGRESS.md updated

---

## 🆘 IF STUCK

**Server won't start?**
```bash
DC: read_process_output pid=XXXXX timeout_ms=5000
```

**Context overflow?**
- Stop, new chat, copy starter prompt, continue

**Forgot what's done?**
```bash
DC: read_file /Users/.../PROGRESS.md offset=-100
```

---

**READY?** Pick a starter prompt and go! 🚀
