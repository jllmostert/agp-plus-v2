# AGP+ v3.0 - HANDOFF (27 Oktober 2025 - Sessie 2)

**Van:** Huidige sessie  
**Voor:** Volgende AI assistant  
**Datum:** 27 oktober 2025  
**Status:** v3.0.0 - Phase 4 Bug Fix In Progress

---

## 🔍 WAT NET GEBEURD IS

### Sessie Start
- Server error gefixt: duplicate `const dayData` declarations in day-profile-engine.js (regel 65, 242, 281)
- Server draait nu op port 3001

### Phase 4 Verification Uitgevoerd
Getest met `test-data/test_with_alerts.csv` die bevat:
- 2x "SENSOR CONNECTED" events (21/10 en 23/10)  
- 2x "Rewind" events (22/10 en 24/10)

**Resultaat:**
- ✅ CSV parsing werkt (alert en rewind kolommen worden geparsed)
- ✅ Detection functies bestaan in day-profile-engine.js
- ✅ Event storage functies bestaan (storeSensorChange, storeCartridgeChange)
- ❌ **PROBLEEM:** Events worden NIET opgeslagen in localStorage

### Bug Fix Poging
**Gevonden:** In `masterDatasetStorage.js` regel 434:
- Gebruikt `parseCSV` maar moet `parseCSVContent` zijn
- **GEFIXT:** Regel 434 aangepast naar `parseCSVContent`

**Status:** Fix geïmplementeerd maar nog niet volledig getest

---

## 🎯 WAT MOET JE DOEN

### Opdracht 1: Test de Bug Fix (15 min)
1. Start server op port 3001:
   ```bash
   cd /Users/jomostert/Documents/Projects/agp-plus
   export PATH="/opt/homebrew/bin:$PATH"
   npx vite --port 3001
   ```

2. Test met debug logging:
   ```javascript
   // Voeg tijdelijk debug logs toe aan detectAndStoreEvents
   // in masterDatasetStorage.js regel 311
   console.log('[detectAndStoreEvents] Readings:', readings.length);
   console.log('[detectAndStoreEvents] Alerts:', readings.filter(r => r.alert));
   ```

3. Upload `test-data/test_with_alerts.csv` via UI of console

4. Check localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('agp-device-events'))
   ```

### Opdracht 2: Als Fix Niet Werkt - Debug Verder
**Mogelijke oorzaken:**
1. `parseCSVContent` geeft alert/rewind velden niet door
2. `detectAndStoreEvents` krijgt verkeerde data
3. Date/time parsing gaat mis

**Debug stappen:**
```javascript
// Check wat parseCSVContent teruggeeft
const { parseCSVContent } = await import('/src/core/parsers.js');
const data = parseCSVContent(csvString);
console.log('Parsed:', data.filter(r => r.alert || r.rewind));

// Check wat uploadCSVToV3 doorgeeft
// Voeg logs toe op regel 469 in masterDatasetStorage.js
console.log('Passing to detectAndStoreEvents:', readings);
```

### Opdracht 3: Als Fix Wel Werkt - Finalize
1. Verwijder alle debug console.logs
2. Test complete flow nogmaals
3. Commit changes:
   ```bash
   git add -A
   git commit -m "fix: CSV alert detection for sensor events in Phase 4"
   git push origin v3.0-dev
   ```
4. Update documentatie met fix

---

## 📁 RELEVANTE FILES

### Hoofdfiles voor dit probleem:
```
/src/storage/masterDatasetStorage.js    # Regel 434 (parseCSV → parseCSVContent)
                                        # Regel 311 (detectAndStoreEvents functie)
                                        # Regel 469 (aanroep detectAndStoreEvents)

/src/core/parsers.js                   # parseCSVContent functie (regel 115-180)
                                       # Check of alert/rewind in return object

/src/storage/eventStorage.js           # storeSensorChange (regel 100)
                                       # storeCartridgeChange (regel 133)

/test-data/test_with_alerts.csv       # Test bestand met events
```

---

## 🐛 KNOWN ISSUES

### Hoofdprobleem: Sensor Alert Detection
- **Symptoom:** Sensor events worden niet opgeslagen, cartridge events ook niet
- **Oorzaak:** Waarschijnlijk parseCSV vs parseCSVContent mismatch
- **Fix attempt:** Regel 434 aangepast, maar moet nog getest worden
- **Fallback:** Als fix niet werkt, check of alert/rewind velden doorkomen

### Andere Issues (niet kritiek)
- Console.logs nog aanwezig in sommige modules
- Hybrid v2/v3 mode actief (intentioneel voor backwards compat)

---

## ⚡ QUICK COMMANDS

```bash
# Start server (ALTIJD port 3001!)
cd /Users/jomostert/Documents/Projects/agp-plus
export PATH="/opt/homebrew/bin:$PATH"
npx vite --port 3001

# Test in browser console
const { uploadCSVToV3 } = await import('/src/storage/masterDatasetStorage.js');
const testCSV = await fetch('/test-data/test_with_alerts.csv').then(r => r.text());
await uploadCSVToV3(testCSV);

# Check results
JSON.parse(localStorage.getItem('agp-device-events'))

# Git commit als alles werkt
git add -A && git commit -m "fix: Phase 4 sensor detection" && git push origin v3.0-dev
```

---

## ✅ SUCCESS CRITERIA

- [ ] Sensor events worden opgeslagen (2 events voor test CSV)
- [ ] Cartridge events worden opgeslagen (2 events voor test CSV)  
- [ ] localStorage key `agp-device-events` bevat beide types
- [ ] Rode lijnen verschijnen in day profiles voor sensor changes
- [ ] Geen console errors
- [ ] Debug logs verwijderd
- [ ] Committed en gepusht naar v3.0-dev

---

## 💡 CONTEXT

**Project Status:** v3.0.0 bijna production ready
- Phase 1-3: ✅ COMPLETE
- Phase 4: 95% complete (alleen deze bug fix nodig)

**Na deze fix:** Project is PRODUCTION READY voor deployment naar jenana.eu

**Desktop Commander:** VERPLICHT voor alle file operations (project staat op macOS)

---

**Current Branch:** v3.0-dev  
**Last Change:** masterDatasetStorage.js regel 434 (parseCSV → parseCSVContent)  
**Test File:** /test-data/test_with_alerts.csv
