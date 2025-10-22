# AGP+ v2.1.1 - New Chat Quick Start

**Copy-paste this into a new Claude chat to continue working on AGP+:**

---

```
I'm continuing work on AGP+ v2.1.1 (diabetes glucose analysis app).

PROJECT LOCATION:
/Users/jomostert/Documents/Projects/agp-plus/

CURRENT STATUS:
- Version: 2.1.1 (Production Ready)
- Recent: IndexedDB migration complete (50MB+ storage)
- Tech: React + Vite + Tailwind + IndexedDB

PLEASE READ THESE FILES FIRST:
1. Project status: view /mnt/project/PROJECT_STATUS.md
2. If needed, full context: view /mnt/project/HANDOFF_PROMPT_NEW_CHAT.md

MY TASK TODAY:
[Describe what you want to work on]

Examples:
- "Test the upload storage with 5-year data"
- "Debug an issue with ProTime parsing"
- "Start v3.0 feature branch (incremental master)"
- "Update documentation"
- "Fix a bug in AGP chart rendering"
```

---

## 📚 Available Documentation

**In project context** (`/mnt/project/`):
- `PROJECT_STATUS.md` - Current state + limitations + v3.0 roadmap
- `HANDOFF_PROMPT_NEW_CHAT.md` - Complete context (500 lines)
- `HANDOFF_PROMPT_QUICK_START.md` - Quick reference (80 lines)
- `AGP_PLUS_v2.1_PROJECT_BRIEFING.md` - Full technical docs
- `MASTER_INDEX.md` - Complete file index

**On MacBook** (`~/Documents/Projects/agp-plus/`):
- `PROJECT_STATUS.md` - Same as above
- `ROADMAP_v3.0.md` - v3.0 implementation plan
- `README.md` - Project readme
- `src/` - All source code

---

## 🎯 Common Tasks

### Start Dev Server
```
Read project status first, then:

DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && npm run dev" timeout_ms=10000

Opens at: http://localhost:3001
```

### Check Git Status
```
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && git status && git log --oneline -5" timeout_ms=3000
```

### Read Component
```
DC: read_file /Users/jomostert/Documents/Projects/agp-plus/src/components/AGPGenerator.jsx
```

### Start v3.0 Feature Branch
```
DC: start_process "cd /Users/jomostert/Documents/Projects/agp-plus && git checkout -b feature/v3-incremental-master && git status" timeout_ms=3000

Then read roadmap:
view /mnt/project/ROADMAP_v3.0.md
```

---

## ⚠️ Important Notes

**Always use absolute paths with Desktop Commander:**
✅ `/Users/jomostert/Documents/Projects/agp-plus/src/...`
❌ `~/Documents/...` (tilde doesn't work)
❌ `./src/...` (relative paths unreliable)

**Current limitations (v2.1.1):**
- Uploads are isolated (can't merge)
- ProTime is upload-based (should be date-based)
- No incremental updates

**Planned (v3.0):**
- Date-based data model
- Auto-merge uploads
- Incremental master dataset
- See ROADMAP_v3.0.md for details

---

## 🚀 Ready to Start!

Copy the prompt at the top into your new chat, fill in your task, and go! 🎉
