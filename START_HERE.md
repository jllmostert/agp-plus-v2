---
tier: 1
status: active
last_updated: 2025-11-01 22:10
purpose: Central navigation for AGP+ v3.5.0-rc
---

# 🧭 START HERE - AGP+ v3.5.0-rc

**Status**: Block B.8 - 83% complete (15/18 tests passing)  
**Last Session**: 2025-11-01 21:45-22:05 (20 min)  
**Next**: Fix 3 test failures (10 min) → Complete B.8

---

## 🎯 NEW SESSION CHECKLIST

1. **Read HANDOFF.md** ← Complete instructions (30 min work)
2. **Check PROGRESS.md** ← History (lines 1-150)
3. **Run tests**: `npx vitest run` (should show 15/18)

**⚠️ Token Warning**: Previous session 98K. Keep next <80K!

---

## 📂 KEY FILES

- `HANDOFF.md` - Next tasks
- `PROGRESS.md` - Session history  
- `CHANGELOG.md` - v3.5.0 entry ✅
- `src/core/__tests__/` - Test files
- `src/core/parsers.js` - Main parser (708 lines)

---

## 🚀 QUICK START

```bash
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"

# Check tests
npx vitest run  # 15/18 passing

# Check git
git log --oneline -3  # Last: 99116ea
git status           # Should be clean
```

---

## 🎯 WHAT'S LEFT (30 min)

1. **Fix 3 test failures** (10 min)
   - Add data lines to fixture CSVs
   - Fix field name in metadata test

2. **Add edge case tests** (15 min)
   - Create parser.edge-cases.test.js

3. **Document + release** (5 min)
   - README update
   - Tag v3.5.0

---

**Version**: 1.0 (Compact for token efficiency)  
**Git**: Clean, commit `99116ea`, ready to work
