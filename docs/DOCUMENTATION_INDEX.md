# AGP+ v2.2 - Documentation Index

## 📚 How to Use This Documentation

This folder contains complete documentation for the AGP+ v2.2 project. Read documents in the order listed below for best understanding.

---

## 📖 Reading Order

### 1. **START HERE**: [HANDOFF_PROMPT_V2_2_0.md](./HANDOFF_PROMPT_V2_2_0.md) ⭐
Essential guide for working with the project:
- How to use Desktop Commander
- Project structure overview
- Common tasks and workflows
- Critical Y-axis algorithm explanation

**Time to read:** 15 minutes  
**Essential for:** Anyone starting work on AGP+

---

### 2. **TECHNICAL DEEP DIVE**: Project Briefing v2.2.0 🎯
Complete technical documentation split into two parts:

**Part 1:** [PROJECT_BRIEFING_V2_2_0_PART1.md](./PROJECT_BRIEFING_V2_2_0_PART1.md)
- Architecture overview
- Adaptive Y-axis algorithm (CRITICAL)
- Data structures
- Event detection algorithms
- Achievement badges

**Part 2:** [PROJECT_BRIEFING_V2_2_0_PART2.md](./PROJECT_BRIEFING_V2_2_0_PART2.md)
- File structure deep dive
- Component responsibilities
- Testing guide
- Known limitations
- Development workflow

**Time to read:** 60-90 minutes  
**Essential for:** Developers, contributors, anyone modifying code

---

### 3. **QUICK REFERENCE**: [MASTER_INDEX_V2_2_0.md](./MASTER_INDEX_V2_2_0.md) 🚀
One-page cheatsheet for common tasks:
- File structure map
- Common debugging tasks
- Design system quick rules
- Key algorithms summary
- Testing checklist

**Time to read:** 5 minutes (reference)  
**Essential for:** Quick lookups during development

---

### 4. **CLINICAL REFERENCE**: [metric_definitions.md](./metric_definitions.md) 🏥
Medical and clinical information:
- All metric definitions (TIR, CV, GMI, etc.)
- Calculation formulas
- Target ranges & clinical interpretation
- ADA/ATTD guideline references

**Time to read:** 15 minutes  
**Essential for:** Understanding the medical context, QA testing, validation

---

### 5. **DEVICE REFERENCE**: [minimed_780g_ref.md](./minimed_780g_ref.md) 📱
Medtronic MiniMed 780G specific documentation:
- Device specifications
- CareLink CSV format details
- SmartGuard algorithm notes
- Data export limitations

**Time to read:** 10 minutes  
**Essential for:** Data parsing work, troubleshooting CSV issues

---

## 🗂️ Additional Resources

### Root Documentation
- **[README.md](../README.md)** - Project overview, quick start, features
- **[CHANGELOG.md](../CHANGELOG.md)** - Version history and release notes
- **[ROADMAP_v3.0.md](../ROADMAP_v3.0.md)** - Future plans and enhancements

### No Longer Maintained
- ~~DESIGN_SYSTEM_QUICK_REF.md~~ - Design patterns now in PROJECT_BRIEFING
- ~~artifacts/~~ folder - Reference implementations (code has evolved, check live repo)

---

## 🎯 Quick Reference by Task

### "I want to understand the project"
1. Read [HANDOFF_PROMPT_V2_2_0.md](./HANDOFF_PROMPT_V2_2_0.md)
2. Skim [PROJECT_BRIEFING_V2_2_0_PART1.md](./PROJECT_BRIEFING_V2_2_0_PART1.md)

### "I need to start coding NOW"
1. Read [MASTER_INDEX_V2_2_0.md](./MASTER_INDEX_V2_2_0.md)
2. Keep it open while coding for quick reference

### "I'm working on day profiles feature"
1. Read [PROJECT_BRIEFING_V2_2_0_PART1.md](./PROJECT_BRIEFING_V2_2_0_PART1.md) - Adaptive Y-axis section
2. Check [MASTER_INDEX_V2_2_0.md](./MASTER_INDEX_V2_2_0.md) - Key algorithms
3. Look at `DayProfileCard.jsx` and `day-profile-engine.js`

### "I'm working on metrics calculations"
1. Read [metric_definitions.md](./metric_definitions.md)
2. Review `metrics-engine.js` in the codebase
3. Check calculation logic in PROJECT_BRIEFING Part 1

### "I'm debugging CSV parsing issues"
1. Read [minimed_780g_ref.md](./minimed_780g_ref.md)
2. Check `parsers.js` in the codebase
3. Review CSV format section in HANDOFF_PROMPT

### "I want to add a new feature"
1. Read both PROJECT_BRIEFING parts completely
2. Check [metric_definitions.md](./metric_definitions.md) if clinical
3. Review design patterns in existing components

---

## 📊 Documentation Stats

- **Total pages:** ~200+
- **Core documents:** 6
- **Last updated:** October 24, 2025
- **Version:** 2.2.0 - Day Profiles Edition

---

## ✅ Documentation Checklist

Before starting work on AGP+ v2.2, ensure you've read:

- [ ] HANDOFF_PROMPT_V2_2_0.md (how to work with project)
- [ ] Relevant sections of PROJECT_BRIEFING (your work area)
- [ ] MASTER_INDEX_V2_2_0.md (quick reference)
- [ ] metric_definitions.md (if working with calculations)

---

## 🔄 Version History

**v2.2.0 (October 24, 2025)** - Day Profiles Edition
- Added individual day analysis feature
- Added achievement badge system
- Enhanced event detection with sensor/cartridge changes
- Adaptive Y-axis algorithm implementation

**v2.1.3 (October 23, 2025)** - Data Persistence
- IndexedDB storage for uploads
- Patient information management
- Save/load functionality

**v2.1.0 (October 20, 2025)** - Architecture Rewrite
- Modular component structure
- Custom hooks pattern
- Auto-comparison feature

---

## 💡 Documentation Best Practices

**When reading:**
- Start with HANDOFF_PROMPT for context
- Use MASTER_INDEX for quick lookups
- Jump to PROJECT_BRIEFING for deep dives
- Use Ctrl+F / Cmd+F to search within documents

**When contributing:**
- Update docs alongside code changes
- Keep explanations clear and concise
- Include examples where helpful
- Update version numbers when needed

---

## 🎉 You're Ready!

You now have complete documentation for AGP+ v2.2. Start with the HANDOFF_PROMPT and explore from there.

Happy coding! 🚀

---

*Last updated: October 24, 2025 - v2.2.0*
