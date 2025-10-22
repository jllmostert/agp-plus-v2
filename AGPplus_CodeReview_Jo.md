# AGP+ V2 Code Review (voor één gebruiker)

## Sterke punten
- **Heldere kernlaag**: één metrics-engine met TIR/TAR/TBR, CV, GMI, MAGE, MODD; en aparte AGP-percentielen.
- **Parser op maat van jouw CSV’s**: skip-regels, EU-decimaal (komma), harde kolomindex voor glucose.
- **HTML-export**: een zelfvoorzienend, print-geoptimaliseerd rapport.
- **Hooks met duidelijke verantwoordelijkheden**: `useCSVData`, `useMetrics`, `useComparison`.

---

## Belangrijkste verbeterpunten

### 1. Event-detectie: open einde dichtmaken
Huidige events sluiten niet af bij einde dataset. Voeg dit toe:

```js
if (currentEvent) {
  const duration = Math.round((utils.parseDate(endDate,'23:59:59') - currentEvent.start) / 60000);
  if (currentEvent.type === 'hypoL2' && duration >= CONFIG.HYPO_MIN_DURATION)
    hypoL2.push({...currentEvent, end: utils.parseDate(endDate,'23:59:59'), duration});
  if (currentEvent.type === 'hypoL1' && duration >= CONFIG.HYPO_MIN_DURATION)
    hypoL1.push({...currentEvent, end: utils.parseDate(endDate,'23:59:59'), duration});
  if (currentEvent.type === 'hyper' && duration >= CONFIG.HYPER_MIN_DURATION)
    hyper.push({...currentEvent, end: utils.parseDate(endDate,'23:59:59'), duration});
}
```

### 2. MAGE-definitie expliciet maken
Leg in comment vast welke methode je gebruikt (SD-drempel of piek-dal).  
Maak één synthetische testreeks (`__dev__/mage-check.js`) om resultaat te verifiëren.

### 3. Percentielen: lineaire interpolatie
Gebruik eenvoudige interpolatie i.p.v. `Math.floor(n*p)` om sprongen bij weinig samples te vermijden.

### 4. Tijdzone
Gebruik directe Date-constructie voor betrouwbaarheid:
```js
const dt = new Date(+year, +month - 1, +day, +hours, +minutes, +(seconds||0));
```

### 5. MODD-coverage verduidelijken
Toon “n.v.t.” als coverage < 70%, met subtitel “insufficient coverage”.

### 6. Parser-assumpties valideren
Controleer CSV-header of kolomindex. Geef nette foutmelding bij afwijkingen.

### 7. HTML-export opschonen
- Toon **Mean ± SD** met mg/dL-label.
- Verberg “Previous”-legend als er geen vergelijking is.
- Voeg metadata-blok toe (periode, aantal dagen, readings).

---

## Geen noodzaak tot:
- Web Workers
- CI/CD of Husky
- i18n-ondersteuning

---

## Mini-roadmap
1. Event-sluiting toevoegen  
2. parseDate aanpassen  
3. Percentielen verbeteren  
4. MODD “n.v.t.” toevoegen  
5. HTML-export afronden  

---

**Conclusie:**  
Voor één gebruiker is dit project uitstekend opgezet: lean, snel, en onderhoudbaar.  
Na deze mini-fixes heb je een robuuste, lokaal draaiende AGP-tool zonder vendor-gedoe.
