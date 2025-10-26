# AGP+ COLOR CONSOLIDATION PLAN
**Created:** October 26, 2025  
**Priority:** 2 (Visual Consistency Audit)  
**Status:** CSS variables updated, ready for component implementation

---

## BRUTALIST COLOR PALETTE (DEFINITIVE)

### Core Palette - ONE shade per color
```css
--color-green:  #00b300   /* Success, good values, TIR */
--color-yellow: #e6c700   /* Warnings, caution, alerts */
--color-orange: #ff6600   /* Suboptimal, insufficient data, hyper */
--color-red:    #cc0000   /* Critical, danger, hypo, errors */
```

---

## IMPLEMENTATION STATUS

✅ **Phase 1 COMPLETE**: CSS variables defined in globals.css
⏳ **Phase 2 IN PROGRESS**: Component-by-component color replacement

---

## QUICK START: Replace Colors in Components

### Search & Replace Pattern

**WRONG** (hardcoded):
```javascript
style={{ color: '#00c700' }}
style={{ background: '#2563eb' }}
```

**RIGHT** (CSS variables):
```javascript
style={{ color: 'var(--color-green)' }}
style={{ background: 'var(--color-green)' }}
```

### Common Replacements

| Old Color | New Variable | Meaning |
|-----------|--------------|---------|
| `#2563eb`, `#3b82f6` | `var(--color-green)` | Active/primary (was blue) |
| `#00c700`, `#10b981` | `var(--color-green)` | Success |
| `#f4e300`, `#fbbf24` | `var(--color-yellow)` | Warning |
| `#ff8c00`, `#f97316` | `var(--color-orange)` | Suboptimal |
| `#c70000`, `#dc2626` | `var(--color-red)` | Critical |
| `#1a1a1a`, `#111` | `var(--bg-secondary)` | Dark background |
| `#666`, `#777`, `#888` | `var(--text-secondary)` | Secondary text |
| `#999`, `#aaa` | `var(--text-tertiary)` | Tertiary text |

---

## PRIORITY FILES TO FIX

1. **DateRangeFilter.jsx** - Replace blues with green
2. **AGPChart.jsx** - Percentile colors + event markers  
3. **MetricsDisplay.jsx** - TIR/TAR/TBR colors
4. **DayProfileCard.jsx** - Match AGPChart colors

---

## COLOR MEANINGS

| Color | Use Case |
|-------|----------|
| 🟢 Green | Success, good values, TIR, data ready |
| 🟡 Yellow | Warnings, caution, alerts |
| 🟠 Orange | Suboptimal, hyper, Level 1 hypo |
| 🔴 Red | Critical, Level 2 hypo, errors |
