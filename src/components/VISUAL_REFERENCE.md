# SensorRegistration Visual Reference

## Modal Layout (ASCII Mockup)

```
╔════════════════════════════════════════════════════════════════════════╗
║ SENSOR REGISTRATION                                              [✕]  ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  1. UPLOAD CARELINK CSV                                                ║
║                                                                        ║
║  ┌────────────────────────────────┐  ┌──────────────────────────┐     ║
║  │ 📄 SAMPLE__Jo Mostert 30-10... │  │ 🔍 LOAD & ANALYSE       │     ║
║  └────────────────────────────────┘  └──────────────────────────┘     ║
║                                                                        ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  2. REVIEW DETECTED SENSORS (2)                                        ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │ TIMESTAMP         │ CONFIDENCE │ SCORE │ ACTIONS                │ ║
║  ├──────────────────────────────────────────────────────────────────┤ ║
║  │ 2025-10-30 13:41  │ 🟢 HIGH    │ 90/100│ [✓CONFIRM][✗IGNORE][✂SPLIT]│ ║
║  │ 2025-10-25 08:11  │ 🟢 HIGH    │ 80/100│ [✓CONFIRM][✗IGNORE][✂SPLIT]│ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
╠════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  3. DEBUG LOG                                                          ║
║                                                                        ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │ [14:23:15] File selected: SAMPLE__Jo Mostert 30-10-2025_7d.csv  │ ║
║  │ [14:23:16] Reading CSV file...                                   │ ║
║  │ [14:23:16] CSV loaded: 245678 characters, 2826 lines            │ ║
║  │ [14:23:16] Parsing CSV sections...                               │ ║
║  │ [14:23:16] Parsed: 460 alerts, 2016 glucose readings            │ ║
║  │ [14:23:17] Clustering sensor events...                           │ ║
║  │ [14:23:17] Found 8 event clusters                                │ ║
║  │ [14:23:17] Detecting glucose gaps...                             │ ║
║  │ [14:23:17] Found 2 gaps ≥120 min                                 │ ║
║  │ [14:23:17] Matching clusters to gaps...                          │ ║
║  │ [14:23:17] Identified 2 sensor change candidates                 │ ║
║  │ [14:23:17] ✅ Analysis complete: 2 candidates found              │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

## Color Scheme (Brutalist Theme)

### Primary Colors
- **Background**: #E5E5E5 (Light gray)
- **Borders**: #000000 (Solid black, 3px)
- **Text**: #000000 (Black)
- **Header**: #000000 background, #FFFFFF text

### Interactive Elements
- **File button**: White background (#FFF)
  - Hover: Black background, white text
- **Analyze button**: Green (#4A9D4A)
  - Hover: Dark green (#3A7D3A)
  - Disabled: Gray (#CCC)

### Confidence Badges
- **🟢 HIGH**: #2D7A2D (Dark green text)
- **🟡 MEDIUM**: #D4A017 (Gold text)
- **🔴 LOW**: #B22222 (Firebrick red text)

### Action Buttons
- **✓ CONFIRM**: Green (#4A9D4A) with white text
  - Hover: #3A7D3A
- **✗ IGNORE**: Gray (#D0D0D0) with black text
  - Hover: #A0A0A0
- **✂ SPLIT**: Gold (#FFD700) with black text
  - Hover: #E6C200

### Debug Log
- **Background**: Black (#000)
- **Text**: Bright green (#0F0)
- **Timestamps**: Cyan (#0AA)
- **Data**: Gray (#AAA)

## Typography

- **Font family**: 'Courier New', monospace
- **Headers**: 
  - H2: 1.5rem, weight 700, letter-spacing 2px
  - H3: 1.1rem, weight 700, letter-spacing 1px
- **Body**: 1rem, weight 400
- **Buttons**: 0.85-1rem, weight 700
- **Debug log**: 0.9rem

## Layout Measurements

### Modal
- **Max width**: 1200px
- **Max height**: 90vh
- **Padding**: 2rem on overlay
- **Border**: 3px solid black

### Sections
- **Padding**: 2rem internal
- **Borders**: 3px solid black between sections

### Table
- **Grid columns**: 2fr | 1.5fr | 0.8fr | 2.5fr
- **Header padding**: 1rem
- **Row padding**: 1rem
- **Gap**: None (solid borders)

### Buttons
- **Padding**: 0.5rem 1rem (small), 1rem 2rem (large)
- **Border**: 2px-3px solid black
- **Gap**: 0.5rem between action buttons

### Debug Log
- **Max height**: 300px
- **Overflow**: Auto scroll
- **Entry padding**: 0.5rem bottom
- **Border between entries**: 1px solid #0A0

## Responsive Breakpoints

### Desktop (default)
- Full 4-column grid
- All features visible
- Font size: 1rem

### Tablet (<900px)
- Adjusted grid: 1.5fr | 1fr | 0.8fr | 2fr
- Font size: 0.9rem
- Action buttons stack vertically

### Mobile (not optimized yet)
- Consider implementing in Phase 5

## Interaction States

### File Input
1. **Default**: White button "📁 SELECT CSV FILE"
2. **File selected**: "📄 [filename]"
3. **Hover**: Black background, white text

### Analyze Button
1. **Default**: Green "🔍 LOAD & ANALYSE"
2. **Analyzing**: Green "⚙️ ANALYZING..." (disabled)
3. **Completed**: Returns to default
4. **Hover (enabled)**: Dark green

### Candidate Row
1. **Default**: White background
2. **Hover**: Light gray background (#F5F5F5)
3. **After confirm/ignore**: Disappears (remove from DOM)

### Action Buttons
1. **Default**: Colored background with border
2. **Hover**: Darker shade
3. **Click**: Triggers action immediately

## Z-Index Layering

- **Overlay**: z-index: 9999 (top layer)
- **Modal**: Inside overlay
- **Content**: Natural stacking

## Accessibility Notes

- All buttons have clear labels
- Contrast ratios meet WCAG AA
- Keyboard navigation possible (tab through buttons)
- Screen reader friendly (semantic HTML)

## Animation/Transitions

- **All transitions**: 0.2s (fast brutalist feel)
- **No fade-ins**: Instant appearance
- **No slide animations**: Direct show/hide
- **Hover states**: Immediate color change

## Browser Compatibility

- **Tested**: Chrome (primary)
- **Expected**: Firefox, Safari, Edge
- **Not supported**: IE11 (GridLayout requirement)

---

**Design Philosophy**: Brutalism
**Priority**: Function over form
**Contrast**: Maximum (black on white, green on black)
**Borders**: Always 3px solid
**Typography**: Monospace only
**Animations**: Minimal (transitions only)
