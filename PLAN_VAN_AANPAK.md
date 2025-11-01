# PLAN VAN AANPAK - AGP+ v3.6.0 → v4.0

**Datum**: 2025-11-02  
**Status**: TIER2 Analyse Compleet (6/6 domains)  
**Huidige Versie**: v3.6.0  
**Doel Versie**: v4.0 (production-ready)

---

## 🎯 HOOFDDOELSTELLINGEN

1. **Documentatie Compleet Maken** (5 uur)
2. **Kritieke Veiligheid & Accessibility** (15 uur)
3. **Data Integriteit & Backup** (15 uur)
4. **Code Maintainability** (optioneel, 35+ uur)

**Totaal Minimaal**: ~35 uur (zonder grote refactors)  
**Totaal Volledig**: ~70 uur (met alle refactors)

---

## ðŸ"„ FASE 1: DOCUMENTATIE AFRONDEN (5 uur)

### Doel
Alle TIER2 analyses consolideren in master documenten zodat je een complete roadmap hebt.

### Taken

#### 1.1 TIER2_SYNTHESIS.md Updaten (2 uur)
**Status**: âš ï¸ Verouderd (bevat alleen Domain A/B/D/E, mist F/G)

**Te doen**:
- [ ] Domain F (Visualization) toevoegen aan synthesis
- [ ] Domain G (Export/Import) toevoegen aan synthesis
- [ ] Overall score bijwerken (7.5/10)
- [ ] Kritieke findings consolideren
- [ ] Master roadmap maken met alle sprints

**Output**: Complete TIER2_SYNTHESIS.md met alle 6 domains

---

#### 1.2 PROJECT_BRIEFING.md Updaten (2 uur)
**Locatie**: `/Users/jomostert/Documents/Projects/agp-plus/docs/PROJECT_BRIEFING.md`

**Te doen**:
- [ ] Architectural status updaten (v3.6.0 achievements)
- [ ] Known issues sectie updaten met TIER2 findings
- [ ] Roadmap naar v4.0 toevoegen
- [ ] Production readiness checklist toevoegen

**Output**: Actuele PROJECT_BRIEFING.md

---

#### 1.3 README.md Updaten (1 uur)
**Te doen**:
- [ ] Huidige features lijst updaten
- [ ] Known limitations toevoegen
- [ ] Roadmap naar v4.0 linken
- [ ] Accessibility status vermelden

**Output**: Accurate README voor gebruikers/developers

---

## ðŸš¨ FASE 2: KRITIEKE VEILIGHEID (15 uur)

### Prioriteit: P0 (MUST-DO voor medische app)

Dit zijn niet-onderhandelbare fixes voor een medische applicatie. Accessibility en data backup zijn wettelijke/ethische requirements.

---

### Sprint F1: Chart Accessibility (5 uur)

**Waarom kritiek**: Medische apps moeten toegankelijk zijn voor gebruikers met screen readers. Dit is niet alleen best practice, maar een requirement voor medische software.

**Taken**:
- [ ] F0.1: ARIA labels toevoegen aan alle SVG charts (2u)
  - role="img", aria-label, aria-describedby
  - Title en description elementen in SVG
  
- [ ] F0.2: Data tabel alternatieven (3u)
  - Hidden table met volledige AGP data
  - Screen reader kan metrics lezen
  - Keyboard navigatie voor focus

**Files**:
- `/src/components/AGPChart.jsx`
- `/src/components/DailyGlucoseChart.jsx`  
- `/src/components/PercentileGlucoseChart.jsx`

**Resultaat**: Screen reader gebruikers kunnen alle glucose data begrijpen

**Score impact**: 6.5/10 → 7.5/10

---

### Sprint G1: Complete Backup/Restore (10 uur)

**Waarom kritiek**: Een medische app zonder betrouwbare backup is onverantwoord. Momenteel kan je alleen exporteren, niet importeren.
**Taken**:
- [ ] G0.1: JSON Import Functionaliteit (4u)
  - Parse JSON export format
  - Validate schema (version, metadata)
  - Restore sensors + readings + batches
  - Error handling + user feedback
  
- [ ] G0.2: SQLite Schema Validatie (2u)
  - Check database structure before import
  - Prevent corrupt DB imports
  - Clear error messages
  
- [ ] G0.3: Duplicate Detection (2u)
  - Check sensor_id before import
  - Warn user of duplicates
  - Allow "skip" or "overwrite" choice
  
- [ ] Testing: Import/Export Round-trip (2u)
  - Export → Import → Verify data identity
  - Test with multiple sensors
  - Test with corrupt files

**Files**:
- `/src/utils/sensorStorage.js` (add importFromJSON)
- `/src/components/SensorHistoryModal.jsx` (add import button)
- `/src/utils/validation.js` (new file for schema validation)

**Resultaat**: Volledige backup/restore capability, data veiligheid

**Score impact**: 7.0/10 → 8.5/10

---

## âš ï¸ FASE 3: DATA INTEGRITEIT (15 uur, P1)

### Prioriteit: Hoog (moet voor v4.0)

Deze fixes voorkomen bugs en verbeteren betrouwbaarheid.

---

### Sprint A1: Parser Robustness (8 uur)

**Waarom belangrijk**: Huidige parser breekt als Medtronic kolommen verandert. Dit is al gebeurd in het verleden.

**Taken**:
- [ ] A0.1: Dynamic Column Detection in Main Parser (4u)
  - Replace hardcoded indices (34, 18, 13, etc.)
  - Use column headers to find indices
  - Add validation: alle required columns aanwezig?
  
- [ ] A0.2: Glucose Bounds Validation (2u)
  - Filter readings <20 mg/dL (sensor errors)
  - Filter readings >600 mg/dL (sensor errors)
  - Log filtered readings
  
- [ ] A0.3: Unit Tests voor Parser (2u)
  - Test met verschillende CSV formats
  - Test met corrupt data
  - Test met missing columns

**Files**:
- `/src/utils/parsers.js`
- `/src/utils/__tests__/parsers.test.js` (nieuwe test file)

**Resultaat**: Parser blijft werken bij Medtronic format changes

**Score impact**: 8.5/10 (Parser) blijft robust

---

### Sprint B1: Metrics Performance Validation (7 uur)

**Waarom belangrijk**: Je weet dat metrics accuraat zijn, maar niet of ze snel genoeg zijn bij grote datasets.

**Taken**:
- [ ] B0.1: Performance Benchmarking (3u)
  - Test met 14 dagen data (~4000 readings)
  - Test met 90 dagen data (~26000 readings)
  - Test met 365 dagen data (~100000 readings)
  - Verify <1000ms target
  
- [ ] B1.1: Unit Tests voor Metrics (4u)
  - MAGE calculation verification
  - MODD calculation verification  
  - Edge cases (single day, missing data)
  - DST transition handling

**Files**:
- `/src/engines/metrics-engine.js`
- `/src/engines/__tests__/metrics-engine.test.js` (nieuwe test file)
- `/docs/performance/METRICS_BENCHMARK.md` (nieuwe benchmark doc)

**Resultaat**: Je WEET dat metrics snel genoeg zijn + bewijzen met data

**Score impact**: 9.0/10 (Metrics) blijft excellent met tests

---

## 🔧 FASE 4: CODE QUALITY (optioneel, 35+ uur)

### Prioriteit: P2/P3 (nice-to-have, niet essentieel voor v4.0)

**Jo's Opmerking**: File size is niet jouw prioriteit. Je ziet geen nadelen van grote files.

**Mijn Advies**: Ik ben het ermee eens dat file size **op zich** geen probleem is. MAAR, de god components (AGPGenerator: 1962 lijnen, SensorHistoryModal: 1387 lijnen) hebben een ander probleem:


**Niet het probleem**: "File is te groot"  
**Wel het probleem**: 
1. **Re-render performance** - Elke state change re-rendert 1962 lijnen code
2. **Testbaarheid** - Moeilijk om kleine functies te unit testen
3. **Change risk** - Bug in één sectie kan andere secties breken

**Dus**: Splitting is NIET om files kleiner te maken, maar om:
- **Performance** te verbeteren (met React.memo op sub-components)
- **Testing** mogelijk te maken (kleine units testen)
- **Maintainability** te verhogen (change isolation)

**Mijn Aanbeveling**: Dit zijn P2/P3 taken. Doe dit ALLEEN als je:
1. Performance problemen ervaart (slow UI, lag)
2. Bugs vind die moeilijk te debuggen zijn
3. Tijd over hebt na P0/P1 werk

---

### Sprint C1: Split God Components (optioneel, 20 uur)

**Alleen doen als**: Performance problemen of moeilijk te debuggen bugs

**AGPGenerator Split** (16u):
- Extract ModalManager (modals state)
- Extract DataLoadingContainer (data fetching)
- Extract VisualizationContainer (charts)
- Add React.memo to prevent unnecessary re-renders

**Voordeel**: 
- 50% minder re-renders
- Makkelijker te testen
- Maar: NIET essentieel als huidige performance OK is

---

### Sprint C2: Table Virtualization (3 uur)

**Alleen doen als**: Je hebt >1000 sensoren en table is traag

**Wat**: react-window voor sensor table  
**Voordeel**: 10x sneller rendering bij grote datasets  
**Nadeel**: Extra dependency

**Advies**: Skip dit tenzij je performance problemen ziet

---

### Sprint F2: WCAG Compliance (9 uur)

**Wat**: Color contrast validation, color-blind testing, keyboard shortcuts

**Advies**: P1 (niet kritiek maar wel belangrijk voor professionele app)

---

## 📊 EFFORT OVERZICHT

### Minimum Viable v4.0 (P0 Only)
| Sprint | Uren | Prioriteit | Impact |
|--------|------|------------|--------|
| Documentatie | 5h | P0 | Roadmap clarity |
| F1: Accessibility | 5h | P0 | Medical compliance |
| G1: Backup/Restore | 10h | P0 | Data safety |
| **TOTAAL** | **20h** | | **Production ready** |

### Recommended v4.0 (P0 + P1)
| Sprint | Uren | Prioriteit | Impact |
|--------|------|------------|--------|
| P0 taken | 20h | Must-do | Baseline |
| A1: Parser Robustness | 8h | P1 | Future-proof |
| B1: Metrics Validation | 7h | P1 | Confidence |
| **TOTAAL** | **35h** | | **Solid foundation** |

### Complete v4.0 (All Sprints)
| Sprint | Uren | Prioriteit | Impact |
|--------|------|------------|--------|
| P0 + P1 taken | 35h | Essential | Strong base |
| C1: God Components | 20h | P2 | Code quality |
| C2: Virtualization | 3h | P2 | Scale |
| F2: WCAG Full | 9h | P1 | Professional |
| **TOTAAL** | **67h** | | **Excellent quality** |

---

## 🎯 AANBEVOLEN AANPAK

### Optie A: Minimaal (20 uur, 1 week)
**Voor**: Snel production ready
**Scope**: P0 alleen (documentatie + accessibility + backup)
**Resultaat**: Veilig en compliant, maar nog wat technical debt

**Planning**:
- Week 1: Alle P0 sprints + documentatie
- Deploy v4.0

---

### Optie B: Aanbevolen (35 uur, 2 weken)
**Voor**: Goede balans tussen snelheid en kwaliteit
**Scope**: P0 + P1 (+ parser + metrics testing)
**Resultaat**: Solide fundament, future-proof

**Planning**:
- Week 1: P0 sprints (documentatie + accessibility + backup)
- Week 2: P1 sprints (parser robustness + metrics validation)
- Deploy v4.0


---

### Optie C: Volledig (67 uur, 4 weken)
**Voor**: Maximale kwaliteit, lange termijn investment
**Scope**: Alles (P0 + P1 + P2)
**Resultaat**: Production-grade, schaalbaar, makkelijk te onderhouden

**Planning**:
- Week 1: P0 sprints
- Week 2: P1 sprints
- Week 3-4: P2 sprints (god components, virtualization, WCAG)
- Deploy v4.0

---

## 🚀 CONCRETE NEXT STEPS

### Dit Kun Je NU Doen (30 min)

1. **Review dit plan** - Kies welke optie (A/B/C) je wilt
2. **Update PROGRESS.md** met je keuze
3. **Besluit**: Start met documentatie of spring meteen naar code?

---

### Als Je Kiest voor Documentatie Eerst (Fase 1)

```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Start met TIER2_SYNTHESIS.md updaten
# Voeg Domain F en G toe
# Consolideer alle findings

# Daarna PROJECT_BRIEFING.md
# Dan README.md
```

**Deliverable**: Complete documentatie basis voor implementatie

---

### Als Je Direct Code Wilt (Fase 2)

```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Start met Sprint F1 (Accessibility)
# Dit is meest kritiek voor medische app
# 5 uur werk, grote impact

# Daarna Sprint G1 (Backup/Restore)
# 10 uur werk, completeert feature
```

**Deliverable**: Veilige, toegankelijke app met volledige backup

---

## 📋 CHECKLIST: V4.0 PRODUCTION READY

Gebruik deze checklist om te bepalen wanneer je klaar bent voor v4.0:

### Must-Have (P0)
- [ ] âœ… TIER2_SYNTHESIS.md compleet met 6 domains
- [ ] âœ… PROJECT_BRIEFING.md geüpdatet naar v3.6.0+
- [ ] âœ… README.md accurate met known limitations
- [ ] âœ… Charts hebben ARIA labels
- [ ] âœ… Charts hebben data table alternatieven
- [ ] âœ… JSON import werkt (niet alleen export)
- [ ] âœ… SQLite schema validatie bij import
- [ ] âœ… Duplicate detection bij import
- [ ] âœ… Import/export round-trip test passed

### Should-Have (P1)
- [ ] 🔄 Parser gebruikt dynamic column detection
- [ ] 🔄 Glucose bounds validation (20-600 mg/dL)
- [ ] 🔄 Parser unit tests
- [ ] 🔄 Metrics performance benchmarks
- [ ] 🔄 Metrics unit tests (MAGE, MODD, GRI)

### Nice-to-Have (P2/P3)
- [ ] ⏸️ AGPGenerator gesplitst in sub-components
- [ ] ⏸️ Table virtualization voor >1000 sensoren
- [ ] ⏸️ WCAG color contrast validation
- [ ] ⏸️ Color-blind friendly palette
- [ ] ⏸️ Full keyboard navigation

---

## 💡 BELANGRIJKE OPMERKINGEN

### Over File Size
Je hebt gelijk: file size op zich is geen probleem. Maar:
- **Performance**: Grote components = meer re-renders = trage UI
- **Testing**: Kleine functies zijn makkelijker te testen
- **Debugging**: Bug isolation is simpeler met kleinere units

**Advies**: Doe refactoring ALLEEN als:
1. Je performance problemen ziet (lag, slow rendering)
2. Bugs moeilijk te vinden zijn
3. Je tijd over hebt na kritieke werk

### Over TIER2 Scores
Scores zijn relatief, niet absoluut:
- **6.5/10** = Functioneel maar met known issues
- **7.5/10** = Solide met minor issues
- **9.0/10** = Excellent, weinig verbeterpunten

**Huidige 7.5/10 gemiddelde**: Prima voor v3.6.0, maar accessibility en backup zijn must-fix voor v4.0.

### Over Medical App Requirements
Als medische applicatie zijn deze **niet-onderhandelbaar**:
1. **Accessibility** - Screen readers, keyboard nav
2. **Data Safety** - Backup/restore, geen data loss
3. **Clinical Accuracy** - Al excellent! âœ…
4. **Auditability** - Logging, versioning


---

## 🎬 SAMENVATTING & BESLUIT

### Huidige Status
- âœ… TIER2 Analyse: Compleet (6/6 domains)
- âœ… Architectuur Score: 7.5/10 (solid foundation)
- âœ… Clinical Accuracy: Excellent (MAGE, MODD, GRI verified)
- âš ï¸ Accessibility: Missing (charts niet screen reader friendly)
- âš ï¸ Backup: Incomplete (kan exporteren maar niet importeren)

### De Keuze
Je hebt 3 opties:

**A. Minimaal** (20u, 1 week)
- Focus: Veiligheid + Compliance
- Scope: P0 alleen
- Deploy: v4.0-minimal

**B. Aanbevolen** (35u, 2 weken) ← **MIJN ADVIES**
- Focus: Veiligheid + Robustness
- Scope: P0 + P1
- Deploy: v4.0-stable

**C. Volledig** (67u, 4 weken)
- Focus: Maximale Kwaliteit
- Scope: Alles
- Deploy: v4.0-complete

### Wat Ik Zou Doen
Als ik jou was, zou ik **Optie B** kiezen:

**Waarom**:
1. P0 werk is niet-onderhandelbaar voor medische app
2. P1 werk maakt je parser future-proof (Medtronic changes)
3. P2 werk (god components) kan je later doen als je performance issues ziet
4. 35 uur is redelijk (2 volle werkweken of 4 part-time weken)

**Planning**:
- **Week 1**: 
  - Documentatie (5u)
  - Accessibility (5u)
  - Backup start (5u)
  
- **Week 2**:
  - Backup finish (5u)
  - Parser robustness (8u)
  - Metrics validation (7u)

- **Deploy**: v4.0-stable 🎉

### Volgende Sessie
Als je akkoord gaat met dit plan:

1. **Update PROGRESS.md** met je keuze (Optie A/B/C)
2. **Commit dit plan**: `git add . && git commit -m "feat: Add v4.0 implementation plan"`
3. **Kies start punt**:
   - Documentatie eerst? → Start met TIER2_SYNTHESIS.md
   - Code eerst? → Start met Sprint F1 (Accessibility)

**Wat wil jij doen?**

---

## 📁 BIJLAGEN

### Files om te Reviewen
```
/Users/jomostert/Documents/Projects/agp-plus/docs/analysis/DOMAIN_F_VISUALIZATION_ANALYSIS.md
/Users/jomostert/Documents/Projects/agp-plus/docs/analysis/DOMAIN_G_EXPORT_IMPORT_ANALYSIS.md
/Users/jomostert/Documents/Projects/agp-plus/docs/analysis/TIER2_ANALYSIS_SUMMARY.md
/Users/jomostert/Documents/Projects/agp-plus/docs/analysis/TIER2_SYNTHESIS.md (needs update)
```

### Files om te Maken
```
/Users/jomostert/Documents/Projects/agp-plus/src/utils/validation.js (nieuwe file)
/Users/jomostert/Documents/Projects/agp-plus/src/engines/__tests__/metrics-engine.test.js
/Users/jomostert/Documents/Projects/agp-plus/src/utils/__tests__/parsers.test.js
/Users/jomostert/Documents/Projects/agp-plus/docs/performance/METRICS_BENCHMARK.md
```

### Git Workflow
```bash
# Na elke sprint
git add .
git commit -m "feat(sprint-F1): Add ARIA labels to charts"
git push

# Voor v4.0 release
git tag v4.0.0
git push --tags
```

---

**Plan Versie**: 1.0  
**Datum**: 2025-11-02  
**Auteur**: Claude (Senior Technical Review)  
**Status**: Klaar voor Besluit

**Vraag**: Welke optie kies jij (A/B/C)? En waar wil je starten?
