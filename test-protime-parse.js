/**
 * Test ProTime Parser with Real Data
 * Tests the parseProTime function with actual PDF text
 */

// ProTime PDF text from uploaded file (Oktober 2025)
const protimePDFText = `Datum In Uit Rooster Normtijd Aanwezigheid Tellers Afwezigheid
Week 40
wo 01/10 8:52 17:03 OD Var. Dag 8u (9u) 8:00 8:00 0:11 - Extra Prestatie 1010 -
do 02/10 11:31 19:47 OD Var. Dag 8u (11u45) 8:00 8:00 0:15 - Extra Prestatie 1010 -
vr 03/10 11:32 19:46 OD Var. Dag 8u (11u45) 8:00 8:00 0:14 - Extra Prestatie 1010 -
za 04/10 - - OZ Vrije Dag - - - -
zo 05/10 - - OZ Vrije Dag - - - -
Week 41
ma 06/10 11:34 19:46 OD Var. Dag 8u (11u45) 8:00 8:00 0:12 - Extra Prestatie 1010 -
di 07/10 8:43 17:00 OD Var. Dag 8u (9u) 8:00 8:00 0:15 - Extra Prestatie 1010 -
wo 08/10 8:35 17:06 OD Var. Dag 8u (9u) 8:00 8:00 0:15 - Extra Prestatie 1010 -
do 09/10 14:00 17:50 OD Var. Dag 8u (14u) 8:00 3:50 - 4:10 - Recup Overuren
vr 10/10 - - OZ Vrije Dag - - - -
za 11/10 - - OZ Vrije Dag - - - -
zo 12/10 - - OZ Vrije Dag - - - -
Week 42
ma 13/10 13:26 22:00 OD Var. Dag 8u (13u) 8:00 8:00 0:34 - Meeruren 8060 2:00 - Nachttoeslag 23% (HD/OPA) 1750 -
di 14/10 - - OA Var. Dag 7u36 (9u) 7:36 - - 7:36 - Vakantie Bediende
wo 15/10 - - OA Var. Dag 7u36 (9u) 7:36 - - 7:36 - Vakantie Bediende
do 16/10 - - OZ Vrije Dag - - - -
vr 17/10 11:27 19:49 OD Var. Dag 8u (11u45) 8:00 8:00 0:15 - Extra Prestatie 1010 -
za 18/10 13:38 22:00 OD Var. Dag 8u (14u) 8:00 8:00 0:15 - Extra Prestatie 1010 8:15 - Toeslag 50% (zat OPA) 1713 -
zo 19/10 13:39 22:00 OD Var. Dag 8u (14u) 8:00 8:00 0:15 - Extra Prestatie 1010 8:15 - Toeslag 100% (Zo OPA/DISP) 1751 -
Week 43
ma 20/10 13:32 22:01 OD Var. Dag 8u (14u) 8:00 8:00 0:15 - Extra Prestatie 1010 2:01 - Nachttoeslag 23% (HD/OPA) 1750 -
di 21/10 9:00 17:00 OD Var. Dag 8u (9u) 8:00 8:00 - -
wo 22/10 - - OZ Vrije Dag - - - -
do 23/10 11:45 19:45 OD Var. Dag 8u (11u45) 8:00 8:00 - -
vr 24/10 - - OZ Vrije Dag - - - -
za 25/10 - - OZ Vrije Dag - - - -
zo 26/10 - - OZ Vrije Dag - - - -
Week 44
ma 27/10 11:35 19:46 OD Var. Dag 8u (11u45) 8:00 8:00 0:11 - Extra Prestatie 1010 -
di 28/10 11:34 19:39 OD Var. Dag 8u (11u45) 8:00 7:54 0:11 - Extra Prestatie 1010 0:06 - Recup Meeruren
wo 29/10 - - OD Var. Dag 8u (14u) 8:00 - - 8:00 - Vakantie Bediende
do 30/10 - - OZ Vrije Dag - - - -
vr 31/10 - - OZ Vrije Dag - - - -
Totaal - - - 151:12 123:44 2:44 - Extra Prestatie 1010 0:34 - Meeruren 8060 4:01 - Nachttoeslag 23% (HD/OPA) 1750 8:15 - Toeslag 100% (Zo OPA/DISP) 1751 8:15 - Toeslag 50% (zat OPA) 1713 0:06 - Recup Meeruren 4:10 - Recup Overuren 23:12 - Vakantie Bediende
JO MOSTERT - Gegenereerd op 30/10/2025 10:10`;

// Import the parseProTime function
import { parseProTime } from './src/core/parsers.js';

console.log('=== TESTING PROTIME PARSER ===\n');
console.log('Input text length:', protimePDFText.length);
console.log('Input lines:', protimePDFText.split('\n').length);
console.log('\n');

try {
  const workdays = parseProTime(protimePDFText);
  
  console.log('✅ PARSE SUCCESS');
  console.log('Workdays found:', workdays.size);
  console.log('\nWorkday dates:');
  
  // Sort and display
  const sorted = Array.from(workdays).sort();
  sorted.forEach(date => {
    console.log(`  ${date}`);
  });
  
  // Expected workdays from manual count:
  // Week 40: wo 01/10, do 02/10, vr 03/10 = 3 days
  // Week 41: ma 06/10, di 07/10, wo 08/10, do 09/10 (recup but has time) = 4 days
  // Week 42: ma 13/10, vr 17/10, za 18/10, zo 19/10 = 4 days (di/wo vacation, do free)
  // Week 43: ma 20/10, di 21/10, do 23/10 = 3 days (wo free, vr free)
  // Week 44: ma 27/10, di 28/10 = 2 days (wo vacation, do/vr free)
  // TOTAL EXPECTED: 16 workdays
  
  console.log('\n=== ANALYSIS ===');
  console.log('Expected workdays: 16');
  console.log('Found workdays:', workdays.size);
  
  if (workdays.size === 16) {
    console.log('✅ CORRECT! Parser working as expected.');
  } else {
    console.log('❌ MISMATCH! Parser found', workdays.size, 'instead of 16');
    console.log('\nDEBUGGING:');
    
    // Check what's missing or extra
    const expected = [
      '2025/10/01', '2025/10/02', '2025/10/03',
      '2025/10/06', '2025/10/07', '2025/10/08', '2025/10/09',
      '2025/10/13', '2025/10/17', '2025/10/18', '2025/10/19',
      '2025/10/20', '2025/10/21', '2025/10/23',
      '2025/10/27', '2025/10/28'
    ];
    
    const found = Array.from(workdays);
    const missing = expected.filter(d => !found.includes(d));
    const extra = found.filter(d => !expected.includes(d));
    
    if (missing.length > 0) {
      console.log('Missing dates:', missing);
    }
    if (extra.length > 0) {
      console.log('Extra dates:', extra);
    }
  }
  
} catch (error) {
  console.log('❌ PARSE ERROR');
  console.error(error);
}
