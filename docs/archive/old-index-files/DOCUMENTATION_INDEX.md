# AGP+ v3.0 - Documentation Index

## 📚 How to Use This Documentation

This folder uses a **TIER 1-2-3 system** for efficient onboarding:
- **TIER 1:** Quick start (read first, ~200 lines)
- **TIER 2:** Status & technical docs (read when needed)
- **TIER 3:** Complete reference (deep dive when required)

---

## 🎯 TIER 1: START HERE

### [START_HERE.md](./START_HERE.md) ⭐ **READ THIS FIRST**

**Purpose:** Quick overview to get you productive immediately  
**Time:** 10-15 minutes  
**Contains:**
- Current status (95% production ready)
- Critical server commands
- Desktop Commander tooling (REQUIRED)
- Immediate next steps
- Known bugs & constraints
- Links to TIER 2/3 docs

**Essential for:** Everyone - AI assistants, developers, new contributors

---

## 📊 TIER 2: Status & Technical Deep Dives

**Read these when you need specific context:**

### Status Documents

### [V3_PHASE_4_STATUS_CHECK.md](./V3_PHASE_4_STATUS_CHECK.md)
Phase 4 implementation status - what's done vs. what needs verification

### [V3_SESSION_SUMMARY_OCT27.md](./V3_SESSION_SUMMARY_OCT27.md)
Latest session summary (Oct 27) - version consolidation & doc cleanup

### [V3_MASTER_INDEX.md](./V3_MASTER_INDEX.md)
Quick reference index (deprecated - use PROJECT_BRIEFING instead)

---

## 📖 TIER 3: Complete Reference

**Deep dive documentation - read when you need full context:**

### [PROJECT_BRIEFING_V3_0.md](./PROJECT_BRIEFING_V3_0.md) - Complete Project Overview

**Purpose:** Comprehensive handoff with all details (339 lines)  
**Time:** 30-40 minutes  
**Contains:** Everything from TIER 1 + complete testing checklist, full commands, deployment steps

**When to read:** When you need complete context beyond quick start

### Clinical Standards
- IndexedDB schema with month-bucketing
- Master dataset architecture
- Hook orchestration layer
- 3-tier event detection
- Data flow diagrams

### [V3_ARCHITECTURE_DECISIONS.md](./V3_ARCHITECTURE_DECISIONS.md)
Architecture Decision Records (ADRs):
- Why IndexedDB over localStorage
- Month-bucketing rationale
- Brutalist design philosophy
- Clinical accuracy priorities

### [V3_IMPLEMENTATION_GUIDE.md](./V3_IMPLEMENTATION_GUIDE.md)
Phase-by-phase roadmap:
- Phase 1: Storage Schema ✓
- Phase 2: Migration & Events ✓
- Phase 3: UI Integration ✓
- Phase 4: Direct CSV Upload (95% done)

---

## 📖 Reference Documents

### Clinical Standards
- **[metric_definitions.md](./metric_definitions.md)** - ADA/ATTD formulas (GMI, TIR, CV, etc.)
- **[minimed_780g_ref.md](./minimed_780g_ref.md)** - Device specifications

### Development
- **[GIT_WORKFLOW.md](./GIT_WORKFLOW.md)** - Branch strategy & conventions
- **[COLOR_CONSOLIDATION_PLAN.md](./COLOR_CONSOLIDATION_PLAN.md)** - CSS variable system

### Cleanup Records
- **[CLEANUP_SUMMARY_OCT27.md](./CLEANUP_SUMMARY_OCT27.md)** - Documentation audit results
- **[DOCUMENTATION_RENAMING_SUMMARY.md](./DOCUMENTATION_RENAMING_SUMMARY.md)** - 62 file renames (V2_/V3_)

---

## 📁 Archive

Historical documentation preserved for reference:

- **[archive/](./archive/)** - Old handoffs, session summaries, early implementations
- **[archive/2025-10-pre-audit/](./archive/2025-10-pre-audit/)** - Pre-cleanup docs
- **[archive/pre-v3.8/](./archive/pre-v3.8/)** - Early v3 development

**Note:** All archived files are prefixed with V2_* or V3_* for easy identification.

---

## 🎯 Quick Navigation

**Need to...**
- **Start working on the project?** → Read PROJECT_BRIEFING_V3_0.md
- **Understand the architecture?** → Read V3_ARCHITECTURE.md
- **Know what's left to do?** → Read V3_PHASE_4_STATUS_CHECK.md
- **Look up a metric formula?** → Read metric_definitions.md
- **Check device specs?** → Read minimed_780g_ref.md
- **Understand git workflow?** → Read GIT_WORKFLOW.md

---

## 📊 File Organization

**Naming Convention:**
- `PROJECT_BRIEFING_*` = Main project briefing/handoff
- `V3_*` = Active v3.0 documentation
- `V2_*` = Deprecated v2.x documentation (archived)
- No prefix = Version-agnostic reference

**Document Types:**
- Briefings: Start here documents
- Architecture: Technical design docs
- Status: Current state & progress
- Reference: Timeless clinical/technical specs
- Cleanup: Documentation maintenance records

---

## ⚡ TL;DR

1. Read **PROJECT_BRIEFING_V3_0.md** first
2. Use other docs as reference when needed
3. Archive contains history (usually don't need to read)
4. V2_* files are old and deprecated
5. V3_* files are current and active

**Current Status:** v3.0.0 PRODUCTION READY (95%) - Phase 4 verification pending

---

**Last Updated:** October 27, 2025  
**Version:** v3.0.0  
**Branch:** v3.0-dev
