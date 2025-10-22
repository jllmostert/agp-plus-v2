# AGP+ v2.1.1 - PROJECT STATUS

**Version:** 2.1.1  
**Status:** Production Ready (IndexedDB Migration Complete)  
**Last Updated:** October 22, 2025

---

## ✅ WHAT WORKS (v2.1.1)

**Core Features:**
- CSV upload + parsing (Medtronic CareLink format)
- ProTime import (PDF/JSON workday data)
- 8 clinical metrics (TIR, TBR, TAR, GMI, CV, Mean, SD, hypoglycemia events)
- AGP chart visualization (percentile bands + median)
- Period comparison (period-over-period deltas)
- HTML export (standalone, shareable)
- **Upload management** (save/load/lock/delete)
- **IndexedDB storage** (50MB+ capacity, auto-migration)

---

## 🚧 KNOWN LIMITATIONS

### 1. Upload Isolation
**Problem:** Each upload is independent  
**Impact:** Can't merge multiple CSVs, must switch uploads manually  

### 2. ProTime Upload-Based
**Problem:** ProTime linked to upload, not dates  
**Impact:** 3-month CSV + 1-month ProTime = ProTime applies to all 3 months (wrong!)

### 3. No Incremental Updates  
**Problem:** Can't extend existing uploads  
**Impact:** New daily data = new upload (can't add to existing)

---

## 🎯 ROADMAP: v3.0 - Incremental Master

**Goal:** Date-based data management

**Features:**
- Global ProTime map (date-based, not upload-based)
- Auto-merge all uploads by timestamp
- Incremental updates (extend current month)
- Auto-lock history (previous months = read-only)

**See:** `ROADMAP_v3.0.md` for complete implementation plan

**Safety:** Feature branch (`feature/v3-incremental-master`)

---

## 📁 PROJECT STRUCTURE

```
agp-plus/
├── src/
│   ├── components/       # 8 React UI components
│   ├── hooks/            # 4 custom hooks (incl. useUploadStorage)
│   ├── core/             # 3 calculation modules
│   ├── utils/            # uploadStorage.js (IndexedDB)
│   └── styles/           # CSS + Tailwind
├── PROJECT_STATUS_v2.1.1.md  # This file
├── ROADMAP_v3.0.md           # v3.0 implementation plan
└── package.json
```

---

## 🚀 QUICK START (New Chat)

```
Continue AGP+ v2.1.1 work.

Project: /Users/jomostert/Documents/Projects/agp-plus/

Read: view /mnt/project/HANDOFF_PROMPT_NEW_CHAT.md

Task: [describe what you want]
```

---

**Status:** Ready for use! v3.0 planned for future.
