# AGP+ Test Data

## Bestanden

### `Jo_Mostert_14d_TEST_SAMPLE_anonymized.csv`

Geanonimiseerde versie van echte Medtronic CareLink export (14 dagen, 13-26 oktober 2025) met geïntroduceerde edge cases voor uitgebreide testing.

---

## Anonimisering

✅ **Naam**: `Jo Mostert` → `Test Testpatient`  
✅ **Serial Number**: `NG4114235H` → `TEST123456`  
✅ **Alle persoonlijke identifiers verwijderd**

---

## Geïntroduceerde Edge Cases

### 1. ✅ Sensor Gap Mid-Day (Premature Failure Simulation)
- **Datum**: 25 oktober 2025
- **Tijd**: 13:45 - 14:30 uur
- **Duur**: 50 minuten (10 sensor readings verwijderd)
- **Type**: Lege sensor glucose waarden (geen SG/ISIG data)
- **Test**: Day profile moet rode stippellijn tonen voor sensor gap

### 2. ✅ Extreme Glucose Waarden
#### Extreme Low
- **Datum**: 24 oktober 2025, ~06:00 uur  
- **Waarde**: 54 mg/dL (kritisch laag)
- **ISIG**: 12,50 (correspond low signal)
- **Test**: Hypo detection, urgent low alerts

#### Extreme High
- **Datum**: 23 oktober 2025, ~22:00 uur
- **Waarde**: 380 mg/dL (zeer hoog)
- **ISIG**: 48,20 (correspond high signal)
- **Test**: Hyper detection, high glucose handling

### 3. ✅ Duplicate Timestamps
- **Datum**: 22 oktober 2025
- **Tijd**: 18:41:05 (exact dezelfde timestamp, 2x)
- **Variatie**: +3 mg/dL tussen duplicaten (169 vs 172 mg/dL)
- **Test**: Deduplication logic, welke waarde behouden?

### 4. ⚠️ Out-of-Order Timestamps  
- **Datum**: 21 oktober 2025
- **Probleem**: 14:16:05 timestamp ontbreekt (werd ge-skip in swap logica)
- **Resultaat**: 14:26 → 14:21 → 14:11 (14:16 missing)
- **Test**: Timestamp sorting, missing data detection

> **Note**: Deze edge case is deels aanwezig maar niet perfect - de 14:16 reading werd verwijderd in plaats van ge-swap. Toch nuttig om missing data detection te testen!

### 5. ✅ Midnight Boundary Crossings
- **Datum**: Elke dag in dataset (00:00:00 timestamps)
- **Type**: Natuurlijk aanwezig in originele data
- **Test**: Cross-day calculations, date transitions

### 6. ✅ Missing Data Points / Existing Gaps
- **Type**: Natuurlijke gaps uit originele data bewaard
- **Voorbeelden**:
  - Sensor disconnections ("LOST SENSOR SIGNAL" alerts)
  - Manual suspends ("USER_SUSPEND")
  - Battery changes ("INSERT BATTERY ALARM")
- **Test**: Gap detection zonder sensor change events

### 7. ✅ Sensor Change Events
- **Datum**: Diverse sensor changes in dataset
- **Test**: Sensor timeline, duration calculations, automatic vs manual detection

### 8. ✅ Cartridge Change Events  
- **Type**: Rewind + Tubing/Cannula fills
- **Detectie**: Zowel met alerts (expliciet) als zonder (manual detection via gaps)
- **Test**: Oranje stippellijn in day profiles

---

## Gebruik

### Importeren in AGP+

1. Open AGP+ app (localhost:3001)
2. Klik "V2 CSV Upload" (legacy mode)
3. Selecteer `Jo_Mostert_14d_TEST_SAMPLE_anonymized.csv`
4. Wacht op verwerking (28,000+ readings)
5. Analyseer output voor alle edge cases

### Expected Behavior

#### Day Profile (25 oktober)
- **13:45-14:30**: Rode stippellijn (sensor gap)
- **Rest**: Normale glucose curve

#### Day Profile (24 oktober)  
- **~06:00**: Extreme low (54 mg/dL) zichtbaar

#### Day Profile (23 oktober)
- **~22:00**: Extreme high (380 mg/dL) zichtbaar

#### Metrics Calculations
- **TIR/TBR/TAR**: Moeten extreme waarden correct verwerken
- **Mean Glucose**: Include 54 & 380 values
- **CV**: Check voor extreme variability impact

#### Deduplication
- **22 okt 18:41:05**: Alleen Ã©Ã©n waarde in final dataset (169 or 172?)

#### Sorting
- **21 okt 14:xx**: Timestamps in chronologische volgorde na sort

---

## Data Statistics

- **Periode**: 14 dagen (13-26 oktober 2025)
- **Glucose Readings**: ~5,200+ (na gap removal)
- **Sensors**: Meerdere sensors met changes
- **Cartridges**: Meerdere refills gedocumenteerd
- **Alerts**: HIGH/LOW/LOST SENSOR/BG REQUIRED/etc

---

## Testing Checklist

### Core Functionality
- [ ] CSV upload succesvol (v2 mode)
- [ ] Master dataset opslaan in IndexedDB
- [ ] Glucose readings correct parsed
- [ ] Sensor changes gedetecteerd
- [ ] Cartridge changes gedetecteerd

### Edge Cases
- [ ] Sensor gap (25 okt 13:45-14:30) toont rode lijn
- [ ] Extreme low (54) wordt correct weergegeven  
- [ ] Extreme high (380) wordt correct weergegeven
- [ ] Duplicate timestamp (22 okt 18:41) ge-deduplicated
- [ ] Out-of-order data (21 okt) correct gesorteerd
- [ ] Midnight boundaries geen problemen
- [ ] Missing data gaps correct gedetecteerd

### Metrics Accuracy
- [ ] TIR berekening klopt met extreme waarden
- [ ] Mean glucose include 54 & 380
- [ ] Standard deviation realistic
- [ ] CV percentage correct

### UI/UX
- [ ] Day profiles render zonder crashes
- [ ] Sensor timeline volledig
- [ ] No console errors
- [ ] Export works (HTML download)

---

## Known Issues

1. **Out-of-order edge case**: 14:16:05 timestamp werd verwijderd in plaats van ge-swap. Niet perfect maar toch bruikbaar voor testing.

2. **Sensor gap detectie**: Script verwijdert sensor glucose data maar events blijven. Manual cartridge detection zou dit moeten oppikken.

---

**Gemaakt**: 27 oktober 2025  
**Versie**: v2.1  
**Script**: `manipulate_test_csv.py`
