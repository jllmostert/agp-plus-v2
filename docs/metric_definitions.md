# CGM Metric Definitions - Complete Reference

**Versie**: 1.0  
**Laatst bijgewerkt**: 10 oktober 2025  
**Doel**: Autoritaire referentie voor alle glucose metrics volgens International Consensus

---

## 1. CORE CONSENSUS METRICS

### 1.1 Centrale Tendens

#### Mean Glucose (Gemiddelde Glucose)
**Definitie**: Rekenkundig gemiddelde van alle glucose metingen in de periode.

**Formule**:
```
Mean = Î£(glucose_i) / n
```

**Eenheid**: mg/dL (of mmol/L)

**Interpretatie**:
- **Doel**: Individueel, maar meestal 140-160 mg/dL voor T1DM
- Correleert met HbA1c/GMI
- **Niet** het hele verhaal: SD en CV zijn minstens even belangrijk!

**Klinische betekenis**:
- Mean van 154 mg/dL â‰ˆ HbA1c van 7.0%
- Elke 28.7 mg/dL verandering â‰ˆ 1% HbA1c verandering

---

#### Median Glucose (Mediaan)
**Definitie**: Middelste waarde wanneer alle metingen gesorteerd zijn.

**Formule**:
```
Median = 50e percentiel van gesorteerde glucose waarden
```

**Interpretatie**:
- Robuuster dan mean (minder beÃ¯nvloed door uitschieters)
- Bij symmetrische distributie: mean â‰ˆ median
- Bij rechtse skew (veel hypers): mean > median
- Bij linkse skew (veel hypo's): mean < median

**Gebruik in AGP**:
- Mediaan lijn is de **primaire lijn** in AGP curve
- Toont "typische" glucose op elk tijdstip

---

### 1.2 Variabiliteit Metrics

#### Standard Deviation (SD)
**Definitie**: Maat voor spreiding rond het gemiddelde.

**Formule**:
```
SD = âˆš[Î£(glucose_i - mean)Â² / n]
```

**Eenheid**: mg/dL

**Interpretatie**:
- **Laag**: <50 mg/dL = stabiele glucose
- **Acceptabel**: 50-70 mg/dL = normale variatie
- **Hoog**: >70 mg/dL = veel schommelingen

**Klinische betekenis**:
- Hoge SD = hoger risico op hypo's Ã©n hypers
- SD alleen is niet genoeg â†’ gebruik CV!

---

#### Coefficient of Variation (CV)
**Definitie**: Genormaliseerde maat voor variabiliteit (SD relatief t.o.v. mean).

**Formule**:
```
CV = (SD / Mean) Ã— 100
```

**Eenheid**: % (percentage)

**Consensus Target**:
- **â‰¤36%** voor T1DM en T2DM (International Consensus 2023)

**Interpretatie**:
- **<36%**: Stabiele glucose controle âœ“
- **36-40%**: Verhoogde variabiliteit âš 
- **>40%**: Hoge variabiliteit, risico op glucose excursies âŒ

**Voordelen boven SD**:
- Onafhankelijk van glucose niveau (normalisatie)
- Vergelijkbaar tussen patiÃ«nten met verschillende mean glucose
- Betere predictor van hypoglykemie risico dan SD alleen

**Klinische betekenis**:
- CV >36% â†’ Verhoogd risico op hypo's (zelfs bij goede TIR!)
- Vaak veroorzaakt door: te agressieve correcties, verkeerde ISF/CR, onvoorspelbare maaltijdabsorptie

---

### 1.3 Glucose Management Indicator (GMI)

**Definitie**: Geschatte HbA1c gebaseerd op mean glucose uit CGM data.

**Formule**:
```
GMI (%) = 3.31 + (0.02392 Ã— Mean Glucose in mg/dL)
```

**Alternatieve formule** (mmol/L):
```
GMI (%) = 3.31 + (0.02392 Ã— Mean Glucose in mmol/L Ã— 18.0182)
```

**Consensus Target**:
- **<7.0%** voor meeste T1DM volwassenen
- <7.5% voor sommige kwetsbare groepen
- <6.5% voor sommige T2DM patiÃ«nten

**Interpretatie**:
- GMI vervangt "estimated A1c" (eA1c) terminologie
- Correleert goed met lab HbA1c (RÂ² ~0.8-0.9)
- **Let op**: GMI â‰  HbA1c (kan 0.5-1% verschillen!)

**Waarom verschillen GMI en HbA1c?**:
- Individuele rode bloedcel levensduur variaties
- Hemoglobine glycatievariaties
- CGM meet glucose, HbA1c meet glycatie
- Anemia, hemoglobinopathieÃ«n beÃ¯nvloeden HbA1c maar niet GMI

**Klinische gebruik**:
- Trend monitoring (is GMI aan het stijgen/dalen?)
- Tussen-consultatie indicatie van controle
- **Niet** vervangen van lab HbA1c voor diagnose!

---

### 1.4 Time in Ranges (TIR/TAR/TBR)

International Consensus definieert **5 glucose ranges** voor T1DM en insuline-gebruikende T2DM:

#### Time Below Range Level 2 (TBR2)
- **Range**: <54 mg/dL (<3.0 mmol/L)
- **Target**: <1% van tijd
- **Klinisch**: Ernstige hypoglykemie, acute interventie nodig
- **Kleurcode**: Rood

#### Time Below Range Level 1 (TBR1)
- **Range**: 54-69 mg/dL (3.0-3.8 mmol/L)
- **Target**: <4% van tijd
- **Klinisch**: Hypoglykemie, verhoogd risico op Level 2
- **Kleurcode**: Oranje/Geel

#### Time in Range (TIR)
- **Range**: 70-180 mg/dL (3.9-10.0 mmol/L)
- **Target**: >70% van tijd
- **Klinisch**: Optimale controle, laag risico op complicaties
- **Kleurcode**: Groen

#### Time Above Range Level 1 (TAR1)
- **Range**: 181-250 mg/dL (10.1-13.9 mmol/L)
- **Target**: <25% van tijd
- **Klinisch**: Hyperglykemie, verhoogd risico op complicaties bij langdurige blootstelling
- **Kleurcode**: Oranje/Geel

#### Time Above Range Level 2 (TAR2)
- **Range**: >250 mg/dL (>13.9 mmol/L)
- **Target**: <5% van tijd
- **Klinisch**: Ernstige hyperglykemie, risico op ketoacidose
- **Kleurcode**: Rood

**Berekening**:
```javascript
TIR = (aantal metingen 70-180 mg/dL / totaal aantal metingen) Ã— 100
```

**Consensus Combinaties**:
- **TBR totaal** (TBR1 + TBR2): <5%
- **TAR totaal** (TAR1 + TAR2): <30%
- Primaire focus: TIR >70% + TBR <4% (hypo-veiligheid eerst!)

**Klinische interpretatie**:
- TIR 70% = ~17 uren/dag in range
- TIR 80% = ~19 uren/dag in range
- **Elke 5% TIR verbetering** â‰ˆ ~0.5% HbA1c reductie
- TBR >5% = prioriteit! (hypo's gevaarlijker dan hypers op korte termijn)

---

## 2. ADVANCED VARIABILITY METRICS

### 2.1 MAGE (Mean Amplitude of Glycemic Excursions)

**Definitie**: Meet de **gemiddelde amplitude van grote glucose schommelingen** (excursies).

**Ontwikkeling**: Service & Nelson (1970), nog steeds gold standard voor intra-dag variabiliteit.

**Algoritme** (stap-voor-stap):

1. **Bereken mean en SD** van alle glucose waarden
2. **Identificeer lokale extrema** (pieken en dalen):
   - Piek: glucose_i > glucose_{i-1} EN glucose_i > glucose_{i+1}
   - Dal: glucose_i < glucose_{i-1} EN glucose_i < glucose_{i+1}
3. **Filter significante extrema**: Behoud alleen extrema die >1 SD van mean liggen
   - |extremum - mean| > SD
4. **Bereken amplitudes**: Absoluut verschil tussen opeenvolgende significante extrema
5. **MAGE = gemiddelde** van alle amplitudes

**Formule**:
```
MAGE = Î£|extremum_{i+1} - extremum_i| / (n_extrema - 1)

waarbij: |extremum - mean| > SD
```

**Eenheid**: mg/dL

**Interpretatie**:
- **<60 mg/dL**: Lage variabiliteit, stabiele controle âœ“
- **60-100 mg/dL**: Matige variabiliteit, acceptabel voor T1DM
- **100-140 mg/dL**: Hoge variabiliteit, onderzoek oorzaken âš 
- **>140 mg/dL**: Zeer hoge variabiliteit, klinische actie nodig âŒ

**Klinische betekenis**:
- Meet **grote** schommelingen (bijv. postprandiale spikes, correctie-overcorrecties)
- Gevoelig voor maaltijd-gerelateerde excursies
- Correleert met oxidatieve stress en endotheel schade

**Typische oorzaken hoge MAGE**:
- Verkeerde carb ratio (te veel/weinig insuline voor maaltijd)
- Slechte bolus timing (bolus te laat â†’ spike, te vroeg â†’ hypo)
- Te agressieve correcties (ISF te sterk)
- Grote maaltijden met hoog glycemische index
- Dawn phenomenon (ochtendstijging) + agressieve correctie

**Verschil met CV**:
- CV meet **totale variabiliteit** (alle fluctuaties)
- MAGE meet alleen **grote excursies** (>1 SD)
- Je kan lage CV hebben met hoge MAGE (weinig kleine schommelingen, maar af en toe grote spikes)

---

### 2.2 MODD (Mean of Daily Differences)

**Definitie**: Meet de **dag-tot-dag variabiliteit** door glucose op identieke tijdstippen te vergelijken.

**Ontwikkeling**: Molnar et al. (1972), meet inter-dag reproducibility.

**Algoritme** (stap-voor-stap):

1. **Groepeer data per dag** (midnight-to-midnight)
2. **Voor elk tijdstip T** (bijv. 08:15):
   - Vind glucose op dag N op tijdstip T: G_N(T)
   - Vind glucose op dag N+1 op tijdstip T: G_{N+1}(T)
3. **Bereken absoluut verschil**: |G_{N+1}(T) - G_N(T)|
4. **Herhaal voor alle tijdstippen** en alle dag-paren
5. **MODD = gemiddelde** van alle verschillen

**Formule**:
```
MODD = Î£|glucose_{dag+1}(tijd) - glucose_dag(tijd)| / n_comparisons
```

**Eenheid**: mg/dL

**Interpretatie**:
- **<40 mg/dL**: Zeer consistente dag-tot-dag patronen âœ“
- **40-60 mg/dL**: Acceptabele dag-tot-dag variatie
- **60-80 mg/dL**: Verhoogde inter-dag variabiliteit âš 
- **>80 mg/dL**: Hoge onvoorspelbaarheid, lifestyle factoren? âŒ

**Klinische betekenis**:
- Meet **reproducibility** van glucose patronen
- Lage MODD = voorspelbare dagen (routine werkt goed)
- Hoge MODD = onvoorspelbare dagen (lifestyle chaos, stress, variabele activiteit)

**Typische oorzaken hoge MODD**:
- Inconsistente maaltijdtijden of -samenstelling
- Variabele fysieke activiteit (workout vs rustdag)
- Stress/ziekte variabiliteit
- Onregelmatig slaappatroon
- Weekend vs weekdag verschillen
- Menstruele cyclus effecten (vrouwen)

**Verschil met MAGE**:
- MAGE meet **grote schommelingen binnen een dag**
- MODD meet **verschillen tussen dagen op zelfde tijdstip**
- Lage MAGE + hoge MODD = stabiel binnen dag, maar onvoorspelbaar tussen dagen

**Use case voor MODD**:
- Evaluatie van lifestyle consistentie
- Identificeren van dag-type effecten (werk vs weekend)
- Menstruele cyclus glucose variatie tracking
- Seizoensinvloeden (zomer vs winter activiteit)

---

### 2.3 CONGA (Continuous Overall Net Glycemic Action)

**Definitie**: Meet glucose variabiliteit door SD te berekenen van verschillen tussen metingen op vaste tijdsintervallen.

**Ontwikkeling**: McDonnell et al. (2005)

**Formule**:
```
CONGA_n = SD van {glucose(t) - glucose(t-n)}

waarbij n = interval (meestal 1h, 2h, 4h, of 6h)
```

**Varianten**:
- **CONGA-1**: 1-uurs interval (intra-dag korte termijn)
- **CONGA-2**: 2-uurs interval
- **CONGA-4**: 4-uurs interval (postprandiale excursies)
- **CONGA-6**: 6-uurs interval (maaltijd cycli)

**Interpretatie**:
- Hogere CONGA = meer variabiliteit op dat tijdsinterval
- CONGA-1 gevoelig voor snelle schommelingen
- CONGA-4 gevoelig voor maaltijd effecten

**Status in dit project**: âŒ **NIET GEBRUIKT**
- Reden: Minder gevalideerd dan MAGE/MODD
- Minder klinische consensus over targets
- MAGE + MODD geven voldoende inzicht

---

### 2.4 GRI (Glycemia Risk Index)

**Definitie**: Samengestelde score die zowel hypo- als hyperglycemie risico combineert.

**Formule** (vereenvoudigd):
```
GRI = 0.5 Ã— (hypo_component + hyper_component)

hypo_component = functie van TBR1, TBR2, lage glucose events
hyper_component = functie van TAR1, TAR2, hoge glucose events
```

**Schaal**: 0-100
- **<20**: Zeer laag risico âœ“
- **20-40**: Laag risico
- **40-60**: Matig risico âš 
- **60-80**: Hoog risico âŒ
- **>80**: Zeer hoog risico

**Status in dit project**: ðŸ¤” **OPTIONEEL**
- Niet in initiÃ«le MVP (v1.0)
- Overwegen voor toekomstige versie
- Nuttig voor quick risk assessment
- Maar: loss of detail (TIR/TAR/TBR zijn duidelijker)

---

## 3. INSULINE METRICS (MiniMed 780G Specifiek)

### 3.1 Total Daily Dose (TDD)

**Definitie**: Totale insuline gebruikt over 24 uur (bolus + basaal).

**Formule**:
```
TDD = Î£(bolus_doses) + âˆ«(basal_rate Ã— tijd)
```

**Eenheid**: Units (E) per dag

**Typische waarden T1DM**:
- **Kinderen**: 0.5-1.0 E/kg/dag
- **Adolescenten**: 1.0-1.5 E/kg/dag
- **Volwassenen**: 0.5-1.0 E/kg/dag
- **Jo Mostert** (60 kg): ~30-60 E/dag verwacht

**Bolus/Basaal Ratio**:
```
Bolus % = (totaal bolus / TDD) Ã— 100
Basaal % = (totaal basaal / TDD) Ã— 100
```

**Target ratio**:
- **Traditioneel**: 50/50 (50% bolus, 50% basaal)
- **Moderne pumps**: 40-60% bolus acceptabel
- **SmartGuard/closed-loop**: Vaak 55-65% bolus (algoritme verhoogt basaal automatisch)

---

### 3.2 Insulin Sensitivity Factor (ISF)

**Definitie**: Hoeveel mg/dL Ã©Ã©n eenheid insuline de glucose verlaagt.

**Formule (1800-regel)**:
```
ISF (mg/dL/E) = 1800 / TDD
```

**Alternatief (mmol/L)**:
```
ISF (mmol/L/E) = 100 / TDD
```

**Voorbeeld**:
- TDD = 45 E â†’ ISF = 1800/45 = 40 mg/dL/E
- Betekenis: 1 E insuline verlaagt glucose met 40 mg/dL

**Klinische gebruik**:
- MiniMed 780G gebruikt ISF voor **correctie bolussen**
- SmartGuard gebruikt ISF voor **auto-correcties**
- Te lage ISF (bijv. 25) = te agressief â†’ hypo's
- Te hoge ISF (bijv. 60) = te zwak â†’ blijvende hyperglykemie

**Verificatie**:
- Vergelijk 1800-regel ISF met ingestelde ISF in pomp
- Groot verschil? â†’ Mogelijk herijking nodig

---

### 3.3 Carb Ratio (CR)

**Definitie**: Hoeveel gram koolhydraten Ã©Ã©n eenheid insuline afdekt.

**Formule (500-regel)**:
```
CR (g/E) = 500 / TDD
```

**Voorbeeld**:
- TDD = 45 E â†’ CR = 500/45 = 11 g/E
- Betekenis: 1 E insuline dekt 11 gram KH

**MiniMed 780G**:
- Kan **verschillende CR per tijdsblok** (ontbijt/lunch/diner)
- Ontbijt vaak lagere CR (bijv. 8 g/E) = dawn phenomenon
- Avond vaak hogere CR (bijv. 12 g/E) = betere gevoeligheid

**Klinische gebruik**:
- Bolus Wizard gebruikt CR voor **maaltijd bolussen**
- SmartGuard past bolus aan o.b.v. glucose trend
- Verkeerde CR â†’ chronische post-prandiale hyper/hypo

---

### 3.4 Active Insulin Time (AIT)

**Definitie**: Hoe lang insuline actief blijft na een bolus (insulin on board duration).

**MiniMed 780G range**: 2-8 uur

**Typische waarden**:
- **Snelle analogen** (Humalog, NovoRapid): 3-4 uur
- **Ultra-snelle analogen** (Fiasp, Lyumjev): 2-3 uur
- **SmartGuard default**: 2 uur (conservatief!)

**Klinische impact**:
- Te kort AIT â†’ stacking (teveel overlappende bolussen) â†’ hypo
- Te lang AIT â†’ te weinig correcties â†’ hyperglykemie
- SmartGuard gebruikt AIT voor **Insulin On Board** berekening

**Jo's case**:
- Waarschijnlijk 2-3u AIT gezien goede controle
- Overwegen verlengen naar 3-4u bij trage maaltijden (pizza, pasta)

---

## 4. AGP VISUALISATIE METRICS

### 4.1 Percentielen

**Definitie**: Waarde waaronder X% van alle metingen valt op dat tijdstip.

**Berekening**:
```javascript
function percentile(sortedArray, p) {
  const index = (p / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}
```

**AGP curve gebruikt**:
- **p5**: 5e percentiel (ondergrens variatie)
- **p25**: 25e percentiel (IQR ondergrens)
- **p50**: 50e percentiel (mediaan)
- **p75**: 75e percentiel (IQR bovengrens)
- **p95**: 95e percentiel (bovengrens variatie)
- **mean**: Gemiddelde (aparte lijn!)

**Interpretatie**:
- **p25-p75** (Interquartile Range): Bevat 50% van metingen
- **p5-p95**: Bevat 90% van metingen (extreem laag/hoog excluded)
- **Mediaan vs Mean**: Als mediaan < mean â†’ rechtse skew (meer hypers dan hypo's)

---

## 5. TARGETS OVERZICHT (T1DM Volwassenen)

| Metric | Target | Excellent | Acceptabel | Actie Nodig |
|--------|--------|-----------|------------|-------------|
| **GMI** | <7.0% | <6.5% | 6.5-7.5% | >7.5% |
| **TIR** | >70% | >80% | 60-70% | <60% |
| **TAR totaal** | <30% | <20% | 30-40% | >40% |
| **TAR2** | <5% | <3% | 5-10% | >10% |
| **TBR totaal** | <5% | <3% | 5-7% | >7% |
| **TBR2** | <1% | <0.5% | 1-2% | >2% |
| **CV** | â‰¤36% | <30% | 36-40% | >40% |
| **MAGE** | - | <60 | 60-100 | >100 |
| **MODD** | - | <40 | 40-60 | >60 |

**Prioriteit ranking**:
1. **TBR <5%** (veiligheid eerst!)
2. **TIR >70%** (primaire effectiviteit)
3. **CV â‰¤36%** (stabiliteit)
4. **TAR2 <5%** (ernstige hypers voorkomen)
5. MAGE, MODD (verfijning)

---

## 6. BEREKENINGSVOORBEELDEN

### Voorbeeld 1: Basis Metrics
```
Gegeven: 14 dagen data, 4082 metingen

Glucose waarden: [142, 138, 151, ..., 130] mg/dL

Mean = (142 + 138 + 151 + ... + 130) / 4082 = 146.7 mg/dL

SD = âˆš[(142-146.7)Â² + (138-146.7)Â² + ... + (130-146.7)Â²] / 4082
   = 51.2 mg/dL

CV = (51.2 / 146.7) Ã— 100 = 34.9%

GMI = 3.31 + (0.02392 Ã— 146.7) = 6.8%

TIR = (aantal tussen 70-180) / 4082 Ã— 100 = 73.0%
```

### Voorbeeld 2: MAGE Berekening
```
Mean = 146.7, SD = 51.2

Extrema: [245 (peak), 90 (valley), 220 (peak), 85 (valley), 210 (peak)]

Significante extrema (|x - 146.7| > 51.2):
- 245: |245 - 146.7| = 98.3 > 51.2 âœ“
- 90: |90 - 146.7| = 56.7 > 51.2 âœ“
- 220: |220 - 146.7| = 73.3 > 51.2 âœ“
- 85: |85 - 146.7| = 61.7 > 51.2 âœ“
- 210: |210 - 146.7| = 63.3 > 51.2 âœ“

Amplitudes:
- |90 - 245| = 155
- |220 - 90| = 130
- |85 - 220| = 135
- |210 - 85| = 125

MAGE = (155 + 130 + 135 + 125) / 4 = 136.3 mg/dL
```

### Voorbeeld 3: MODD Berekening
```
Dag 1, 08:00 â†’ 145 mg/dL
Dag 2, 08:00 â†’ 160 mg/dL
Verschil: |160 - 145| = 15 mg/dL

Dag 1, 12:00 â†’ 200 mg/dL
Dag 2, 12:00 â†’ 185 mg/dL
Verschil: |185 - 200| = 15 mg/dL

... (voor alle tijdstippen)

MODD = gemiddelde van alle verschillen = 52.4 mg/dL
```

---

## 7. REFERENTIES

### International Consensus Documents
1. **Battelino T, et al.** Clinical Targets for Continuous Glucose Monitoring Data Interpretation. *Diabetes Care* 2023;46(8):1593-1603.
2. **Danne T, et al.** International Consensus on Use of Continuous Glucose Monitoring. *Diabetes Care* 2017;40(12):1631-1640.

### Metric Development Papers
3. **Service FJ, et al.** Mean amplitude of glycemic excursions. *Diabetes* 1970;19:644-655.
4. **Molnar GD, et al.** Day-to-day variation of continuously monitored glycaemia. *Diabetologia* 1972;8:342-348.
5. **McDonnell CM, et al.** A novel approach to continuous glucose analysis. *Diabetes Technol Ther* 2005;7:253-263.

### Validation Studies
6. **Rodbard D.** Interpretation of continuous glucose monitoring data. *Diabetes Technol Ther* 2009;11 Suppl 1:S45-54.
7. **Kovatchev BP, et al.** Glucose variability: timing, risk analysis, and relationship to hypoglycemia. *Diabetes Care* 2016;39:502-510.

---

**Einde Metric Definitions Document**

*Voor implementatie details, zie Project Briefing v3.0*