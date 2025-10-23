# AGP+ v2.1.1 - Handover for UI/UX Finetuning

**Copy-paste this into a new Claude chat for finetuning work:**

---

```
I'm working on AGP+ v2.1.1 - a diabetes glucose analysis web app (React).

PROJECT LOCATION:
/Users/jomostert/Documents/Projects/agp-plus/

CURRENT STATUS:
✅ v2.1.1 Production Ready
✅ IndexedDB storage implemented (50MB+)
✅ All core features working
🎯 NOW: UI/UX finetuning and polish

CRITICAL RULE FOR THIS SESSION:
⛔ DO NOT touch any storage/upload/IndexedDB code
⛔ NO implementation of storage features
✅ ONLY visual polish, UI improvements, refinements

PLEASE READ DOCUMENTATION:
1. First: view /mnt/project/PROJECT_STATUS.md
2. Context: view /mnt/project/AGP_PLUS_v2.1_PROJECT_BRIEFING.md
3. Design system: view /mnt/project/DESIGN_SYSTEM_QUICK_REF.md

TASK: UI/UX Finetuning
Focus areas:
- Visual polish (spacing, alignment, typography)
- Component refinement (better layout, clearer hierarchy)
- Design system consistency
- User experience improvements
- Accessibility (if needed)

WHAT TO REVIEW:
[Specify which components or areas need attention]

Examples:
- "Review AGP chart legend positioning and clarity"
- "Improve metrics grid spacing and alignment"  
- "Polish the period selector button states"
- "Review overall color consistency"
- "Improve mobile responsiveness"
```

---

## 🎨 DESIGN SYSTEM REFERENCE

**Colors:**
```css
--bg-primary: #0a0a0a       /* Near-black background */
--bg-secondary: #1a1a1a     /* Cards, sections */
--text-primary: #ffffff     /* Main text */
--text-secondary: #a0a0a0   /* Subtle text */
--color-green: #10b981      /* In-range, success */
--color-yellow: #fbbf24     /* Warning */
--color-red: #ef4444        /* Critical */
--color-orange: #f97316     /* High glucose */
```

**Typography:**
- System fonts: -apple-system, SF Pro, Segoe UI
- Headers: 700 weight, uppercase, tracked
- Body: 400-500 weight
- Metrics: 600 weight, tabular-nums

**Spacing:**
- Base: 4px grid
- Section margins: 24px
- Card padding: 16px
- Grid gaps: 16px

---

## 📁 KEY COMPONENTS

**UI Components:**
- FileUpload.jsx - CSV + ProTime upload buttons/modals
- PeriodSelector.jsx - Date range picker
- MetricsDisplay.jsx - 4-column metrics grid
- AGPChart.jsx - SVG percentile visualization
- ComparisonView.jsx - Period-over-period comparison
- TIRBar.jsx - Time In Range bar chart
- HypoglycemiaPanel.jsx - Hypo events display

**DO NOT TOUCH:**
❌ src/hooks/useUploadStorage.js
❌ src/utils/uploadStorage.js
❌ Any storage/IndexedDB code

---

## ⚠️ CRITICAL REMINDERS

**DO:**
✅ Improve CSS styling
✅ Adjust spacing/alignment
✅ Refine typography
✅ Polish layouts

**DON'T:**
❌ Touch storage code
❌ Modify upload logic
❌ Change data persistence

**WHY:** Storage is complete. This session is purely UI polish.

---

## 🚀 GETTING STARTED

1. Read docs (links at top)
2. Start dev server: `npm run dev` 
3. Identify UI issues
4. Make CSS/layout changes
5. Test in browser
6. Commit changes

---

## 🎨 DESIGN PHILOSOPHY

**AGP+ Style:**
- Brutalist/minimal aesthetic
- Dark theme
- High contrast
- Clean typography
- Generous whitespace
- Bold, clear metrics
- Medical device inspiration

**NOT:**
- Colorful/playful
- Gradients or shadows
- Ornamental elements

---

## 📦 GIT ETIQUETTE

**Commit messages:**
```
style: improve metrics grid spacing
style: refine AGP chart legend positioning
ui: adjust mobile responsiveness for TIR bar
```

Small, focused commits preferred!

---

## 🎯 READY!

Copy the prompt at top, specify UI areas to review, and let's polish! 🎨

**Remember: NO storage changes! Only visual polish!** ✨
