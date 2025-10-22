# AGP+ v2.1 - DESIGN SYSTEM SAMENVATTING

**Stijl:** "USSR Aesthetic" + Professional Medical UI  
**Basisprincipe:** Dark, bold, functional

---

## ðŸŽ¨ KLEUREN

### React UI (Donker Thema)

**Basis:**
```css
Achtergrond: bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900
Kaarten: bg-neutral-800 border border-neutral-700
Headers: bg-gradient-to-r from-red-900 to-red-800
Tekst: text-white (primair), text-neutral-400 (secundair)
```

**Metrics Kaarten (GradiÃ«nten):**
```css
TIR (groen): from-green-900 to-green-800
Mean (blauw): from-blue-900 to-blue-800
CV (paars): from-purple-900 to-purple-800
GMI (oranje): from-orange-900 to-orange-800
```

**Status Kleuren:**
```css
Goed/Succes: bg-green-700, text-green-300
Waarschuwing: bg-yellow-700, text-yellow-300
Fout/Kritiek: bg-red-700, text-red-300
Info: bg-blue-700, text-blue-300
```

**Time-in-Range Bar:**
```css
TBR (laag): bg-red-600
TIR (doel): bg-green-600
TAR (hoog): bg-yellow-600
```

### HTML Export (Print)

**Zwart/Wit:**
```css
Achtergrond: #fff (wit)
Tekst: #000 (zwart)
Borders: 2px solid #000
Grijstinten: #ccc, #ddd, #aaa (voor AGP banden)
TIR Bar: Zwart, grijs, gestreept patroon
```

---

## ðŸ“ TYPOGRAFIE

### React UI
```css
Grote headers (h1): text-3xl font-bold
Sectie headers (h2): text-xl font-bold
Subsecties (h3): text-lg font-bold
Body tekst: text-sm (14px)
Labels: text-xs (12px)
Metric waardes: text-3xl font-bold (48px)
Subtitles: text-xs

Font: Systeem default (Tailwind sans-serif)
```

### HTML Export (Print)
```css
Font: "Courier New", "Courier", monospace
Body: 10pt
h1: 18pt bold
h2: 13pt bold
Metric waardes: 20pt bold
Labels: 8pt bold
Details: 9pt
Footer: 7pt
```

---

## ðŸ“ SPACING & LAYOUT

### Grid Systeem
```css
Metrics grid: grid-cols-4 gap-4 (4 kolommen)
Details grid: grid-cols-2 gap-4 (2 kolommen)
Split grid: grid-cols-2 gap-4 (dag/nacht, werk/rust)
Comparison: grid-cols-3 gap-3 (3 kolommen)
```

### Padding
```css
React UI:
- Container: p-6 (24px)
- Kaarten: p-4 of p-6 (16-24px)
- Secties: space-y-6 (24px tussen secties)

HTML Export:
- Body: 8mm
- Secties: margin-bottom 5mm
- Kaarten: 2mm
```

---

## ðŸ§© COMPONENT PATRONEN

### Basis Kaart
```jsx
<div className="bg-neutral-800 rounded-xl p-6 shadow-xl border border-neutral-700">
  <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
  {children}
</div>
```

### Metric Kaart
```jsx
<div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-4">
  <div className="text-green-300 text-sm mb-1">TIR</div>
  <div className="text-3xl font-bold text-white">72%</div>
  <div className="text-green-200 text-xs">Target &gt;70%</div>
</div>
```

### Detail Rij
```jsx
<div className="flex justify-between text-sm">
  <span className="text-neutral-400">MAGE</span>
  <span className="text-white font-semibold">45 mg/dL</span>
</div>
```

### Toggle Switch
```jsx
<button className={`relative inline-flex h-6 w-11 items-center rounded-full ${
  enabled ? 'bg-red-600' : 'bg-neutral-600'
}`}>
  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
    enabled ? 'translate-x-6' : 'translate-x-1'
  }`} />
</button>
```

---

## ðŸ“Š SVG STYLING (AGP Chart)

### Afmetingen
```jsx
viewBox="0 0 900 450"
Chart gebied: x: 60-840, y: 50-350
```

### AGP Elementen
```jsx
Target lijnen:
- 54 mg/dL: stroke="#000" stroke-width="2" stroke-dasharray="8,4" (gestippeld)
- 70 mg/dL: stroke="#000" stroke-width="3" (vet)
- 180 mg/dL: stroke="#000" stroke-width="3" (vet)
- 250 mg/dL: stroke="#000" stroke-width="2" stroke-dasharray="8,4" (gestippeld)

Percentiel banden:
- 5-95: fill="rgba(96, 165, 250, 0.2)" (blauw, 20%)
- 25-75: fill="rgba(96, 165, 250, 0.3)" (blauw, 30%)

Lijnen:
- Mediaan: stroke="#3b82f6" stroke-width="2.5" (blauw)
- Vergelijking: stroke="#9ca3af" stroke-width="2" stroke-dasharray="4,4" (grijs)

Event markers:
- Hypo L2: fill="#ef4444" (rood)
- Hypo L1: fill="#f97316" (oranje)
- Hyper: fill="#ef4444" (rood)
```

---

## âœ… DO'S

- âœ… Gebruik Tailwind utility classes (alleen core set)
- âœ… Behoud donker thema in React UI
- âœ… Gebruik gradiÃ«nten voor metric kaarten
- âœ… Houd print output zwart/wit
- âœ… Gebruik monospace voor exports
- âœ… Zorg voor duidelijke visuele hiÃ«rarchie
- âœ… Gebruik functionele kleuren (groen=goed, rood=waarschuwing)
- âœ… Houd borders zichtbaar (2-3px)

---

## âŒ DON'TS

- âŒ Gebruik GEEN custom Tailwind classes (geen JIT compiler)
- âŒ Voeg GEEN kleur toe aan print output
- âŒ Gebruik GEEN sans-serif voor exports
- âŒ Maak GEEN te kleine tekst (<10px)
- âŒ Gebruik GEEN complexe animaties
- âŒ Breek NIET A4 formaat in exports
- âŒ Gebruik GEEN externe dependencies in HTML exports
- âŒ Mix NIET kleurenschema's

---

## ðŸŽ¯ BELANGRIJKSTE REGELS

1. **Donker thema = React UI**  
   Grays (neutral-800/900), wit voor tekst

2. **Zwart/wit = HTML Export**  
   Print-geoptimaliseerd, minimaal inkt

3. **Functionele kleuren**  
   Groen = goed, Rood = waarschuwing, Blauw = info

4. **Bold typography**  
   Duidelijke hiÃ«rarchie, grote waardes

5. **Grid layouts**  
   4 kolommen (metrics), 2 kolommen (details/splits)

6. **Tailwind only**  
   Alleen pre-compiled utility classes

7. **Monospace voor print**  
   Courier New in HTML exports

8. **Responsive**  
   Grid kollapt naar 1 kolom op mobile

---

## ðŸ“š WAAR MEER INFO?

**Complete design system:**  
Zie project briefing â†’ DESIGN SYSTEM sectie  
`/mnt/project/AGP_PLUS_v2.1_PROJECT_BRIEFING.md`

**Voorbeelden in code:**  
Lees monoliet: `/mnt/project/AGP__v2_1_-_Collapsible_UI.tsx`

**Componenten in project:**  
Check `src/components/` voor implementaties

---

*Volg dit design system voor consistente UI/UX!*
