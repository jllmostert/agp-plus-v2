# AGP+ v2.1 - Documentation Index

## 📚 How to Use This Documentation

This folder contains complete documentation for the AGP+ v2.1 project. Read documents in the order listed below for best understanding.

---

## 📖 Reading Order

### 1. **START HERE**: [README.md](./README.md) ⭐
Quick overview of the project, features, and architecture. Perfect for new contributors or anyone wanting a high-level understanding.

**Time to read:** 10 minutes

---

### 2. **DEEP DIVE**: [AGP_PLUS_v2_1_PROJECT_BRIEFING.md](./AGP_PLUS_v2_1_PROJECT_BRIEFING.md) 🎯
Complete technical documentation including:
- Detailed component breakdown
- Data flow diagrams
- Algorithm explanations
- Known limitations & design decisions
- Implementation notes

**Time to read:** 45-60 minutes  
**Essential for:** Developers, contributors, anyone modifying code

---

### 3. **DESIGN REFERENCE**: [DESIGN_SYSTEM_QUICK_REF.md](./DESIGN_SYSTEM_QUICK_REF.md) 🎨
UI/UX guidelines and design patterns:
- Color schemes (React UI vs HTML export)
- Typography standards
- Component styling patterns
- Spacing & layout conventions

**Time to read:** 10 minutes  
**Essential for:** Frontend developers, UI/UX work

---

### 4. **CLINICAL REFERENCE**: [metric_definitions.md](./metric_definitions.md) 🏥
Medical and clinical information:
- All metric definitions (TIR, CV, GMI, etc.)
- Calculation formulas
- Target ranges & clinical interpretation
- ADA/ATTD guideline references

**Time to read:** 20 minutes  
**Essential for:** Understanding the medical context, QA testing, validation

---

### 5. **DEVICE REFERENCE**: [minimed_780g_ref.md](./minimed_780g_ref.md) 📱
Medtronic MiniMed 780G specific documentation:
- Device specifications
- CareLink CSV format details
- SmartGuard algorithm notes
- Data export limitations

**Time to read:** 15 minutes  
**Essential for:** Data parsing work, troubleshooting CSV issues

---

## 🗂️ Code Reference (artifacts/)

The `artifacts/` folder contains reference implementations of core modules:

- **ARTIFACT-01__metrics-engine_js.txt** - Calculation engine
  - Clinical metrics (TIR, CV, GMI, MAGE, MODD)
  - AGP percentile calculations
  - Event detection logic

- **ARTIFACT-02__parsers_js.txt** - Data parsing utilities
  - CareLink CSV parser
  - ProTime data parser
  - Date range validation

- **ARTIFACT-03__html-exporter_js.txt** - Report generation
  - HTML report template
  - Print-optimized styling
  - Data formatting

**Note:** These are reference files showing the implementation as it was built. The actual source code may have evolved - always check the live repository for current code.

---

## 🎯 Quick Reference by Task

### "I want to understand the project"
1. Read [README.md](./README.md)
2. Skim [AGP_PLUS_v2_1_PROJECT_BRIEFING.md](./AGP_PLUS_v2_1_PROJECT_BRIEFING.md)

### "I need to modify UI/styling"
1. Read [DESIGN_SYSTEM_QUICK_REF.md](./DESIGN_SYSTEM_QUICK_REF.md)
2. Check relevant sections in project briefing

### "I'm working on metrics calculations"
1. Read [metric_definitions.md](./metric_definitions.md)
2. Check `artifacts/ARTIFACT-01__metrics-engine_js.txt`
3. Review calculation logic in project briefing

### "I'm debugging CSV parsing issues"
1. Read [minimed_780g_ref.md](./minimed_780g_ref.md)
2. Check `artifacts/ARTIFACT-02__parsers_js.txt`
3. Review CSV format section in project briefing

### "I want to add a new feature"
1. Read [AGP_PLUS_v2_1_PROJECT_BRIEFING.md](./AGP_PLUS_v2_1_PROJECT_BRIEFING.md) completely
2. Check [metric_definitions.md](./metric_definitions.md) if clinical
3. Review [DESIGN_SYSTEM_QUICK_REF.md](./DESIGN_SYSTEM_QUICK_REF.md) for UI consistency

---

## 📊 Documentation Stats

- **Total pages:** ~150
- **Core documents:** 5
- **Reference implementations:** 3
- **Last updated:** October 2025
- **Version:** 2.1.0

---

## ✅ Documentation Checklist

Before starting work on AGP+, ensure you've read:

- [ ] README.md (overview)
- [ ] Relevant sections of PROJECT_BRIEFING (your work area)
- [ ] DESIGN_SYSTEM_QUICK_REF.md (if touching UI)
- [ ] metric_definitions.md (if working with calculations)

---

## 🔄 Keeping Documentation Updated

This documentation reflects AGP+ v2.1.0 as of October 2025. 

**If you make significant changes:**
1. Update relevant documentation files
2. Update version numbers
3. Update "Last Updated" dates
4. Create clear git commit describing documentation changes

---

## 💡 Documentation Best Practices

**When reading:**
- Start with README for context
- Jump to specific sections as needed
- Use Ctrl+F / Cmd+F to search within documents
- Keep PROJECT_BRIEFING open as reference

**When contributing:**
- Update docs alongside code changes
- Keep explanations clear and concise
- Include examples where helpful
- Link between related documents

---

## 🎉 You're Ready!

You now have complete documentation for AGP+ v2.1. Start with the README and explore from there.

Happy coding! 🚀

---

*Documentation structure designed for clarity and ease of navigation*
