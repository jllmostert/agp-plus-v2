---
tier: 1
status: active
last_updated: 2025-11-03
purpose: Define documentation structure and maintenance guidelines
location: root (moved from archive, now actively enforced)
---

# 📁 AGP+ Documentation Hygiene Guide

**Version:** 2.1  
**Last Updated:** 3 November 2025  
**Status:** ✅ ACTIVE - Enforced structure  
**Location**: Root directory (promoted from archive)

---

## 🎯 Goals

- **Clarity**: Instant navigation to relevant docs
- **Discipline**: Files live in correct tier
- **Efficiency**: Load only active layers

---

## 🧩 Three-Tier System

| Tier | Function | Files | Location | Update Frequency |
|------|----------|-------|----------|------------------|
| **Tier 1** | Operational entry points | `START_HERE.md`, `HANDOFF.md` | **Root** | Daily |
| **Tier 2** | Project planning/status | `STATUS.md`, `TEST_PLAN.md`, architecture docs | **/project/** | Weekly |
| **Tier 3** | Stable reference | `metric_definitions.md`, `minimed_780g_ref.md`, `GIT_WORKFLOW.md` | **/reference/** | Rarely |

---

## 📂 Current Structure

```
agp-plus/
├── START_HERE.md          ← Navigation hub (Tier 1)
├── HANDOFF.md             ← Current session (Tier 1)
│
├── project/               ← Tier 2
│   ├── STATUS.md
│   ├── TEST_PLAN.md
│   ├── V3_ARCHITECTURE.md
│   └── V3_IMPLEMENTATION_GUIDE.md
│
├── reference/             ← Tier 3
│   ├── metric_definitions.md
│   ├── minimed_780g_ref.md
│   ├── GIT_WORKFLOW.md
│   └── V3_ARCHITECTURE_DECISIONS.md
│
└── docs/                  ← Legacy folder (archival only)
    ├── archive/
    └── handoffs/
```

---

## 🧭 Core Principles

### 1. Metadata Headers (Required)

Every document starts with:
```yaml
---
tier: 2
status: active
last_updated: 2025-10-30
purpose: Brief description of document role
---
```

### 2. One Entry Point

`START_HERE.md` routes to all active docs:
- Lists Tier 1 operational docs
- Links to Tier 2 project docs
- References Tier 3 (read on demand)

### 3. No Duplication

- Old files → `/docs/archive/YYYY-MM/`
- Never keep `STATUS.md` + `STATUS_old.md`

### 4. Update Discipline

- **Tier 1**: Update every session
- **Tier 2**: Update when features change
- **Tier 3**: Only for corrections/additions

---

## 🪜 Session Lifecycle

### Start
1. Open `START_HERE.md`
2. Check `HANDOFF.md` for current tasks
3. Review `project/STATUS.md` for phase tracking

### Work
- Update Tier 2 as features progress
- Reference Tier 3 when needed

### End
- Update `HANDOFF.md` with progress
- Archive old handoff → `/docs/handoffs/YYYY-MM-DD.md`
- Update `STATUS.md` completion checkboxes

---

## 🧱 Document Roles

| File | Tier | Purpose |
|------|------|---------|
| `START_HERE.md` | 1 | Central navigation index |
| `HANDOFF.md` | 1 | Current session state |
| `STATUS.md` | 2 | Phase tracking + completion |
| `TEST_PLAN.md` | 2 | Validation scenarios |
| `V3_ARCHITECTURE.md` | 2 | System design overview |
| `V3_IMPLEMENTATION_GUIDE.md` | 2 | Module interfaces |
| `metric_definitions.md` | 3 | Glucose metrics reference |
| `minimed_780g_ref.md` | 3 | Device + CSV format |
| `GIT_WORKFLOW.md` | 3 | Version control guide |
| `V3_ARCHITECTURE_DECISIONS.md` | 3 | Design rationale |

---

## 🧼 Hygiene Rules

### For Jo
- Keep only 1 active `HANDOFF.md` in root
- Version old handoffs by date: `HANDOFF_2025-10-30.md` → `docs/handoffs/`
- Add metadata headers to new files
- Monthly audit: archive inactive Tier 2 docs

### For Claude
- Load Tier 1 + Tier 2 by default
- Only read Tier 3 when specifically needed
- Never modify Tier 3 without explicit request
- Append progress to `HANDOFF.md` after each session

---

## 🔁 Monthly Maintenance

- [ ] Archive old handoffs from root
- [ ] Move completed Tier 2 docs to `/docs/archive/YYYY-MM/`
- [ ] Verify `START_HERE.md` links
- [ ] Confirm all files have metadata headers
- [ ] Update `last_updated` dates

---

## 📌 Key Philosophy

**"Write once, read often — but only the right layer."**

- Tier 1 changes daily
- Tier 2 changes weekly  
- Tier 3 changes rarely

This rhythm keeps context fresh and documentation useful.

---

**Last Audit:** 2025-10-30  
**Structure Version:** 2.0 (Active)  
**Compliance:** ✅ All docs following tier system
