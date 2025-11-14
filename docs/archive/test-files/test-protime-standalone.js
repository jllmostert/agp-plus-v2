/**
 * STANDALONE ProTime Parser Test
 * Direct copy of parseProTime function to test without dependencies
 */

// Standalone parseProTime function (copied from parsers.js)
function parseProTime(input) {
  // Try JSON parsing first
  try {
    const data = JSON.parse(input);
    const workdays = new Set();
    
    // Various JSON format handling...
    if (data.workdays && Array.isArray(data.workdays) && data.workdays.length > 0 && typeof data.workdays[0] === 'object') {
      data.workdays.forEach(entry => {
        if (entry.date && entry.is_workday) {
          const normalizedDate = entry.date.replace(/-/g, '/');
          workdays.add(normalizedDate);
        }
      });
    }
    else if (data.workdays && Array.isArray(data.workdays)) {
      data.workdays.forEach(d => {
        workdays.add(d.replace(/-/g, '/'));
      });
    }
    else if (Array.isArray(data)) {
      data.forEach(d => {
        workdays.add(d.replace(/-/g, '/'));
      });
    }
    else if (typeof data === 'object') {
      Object.entries(data)
        .filter(([_, val]) => val === true)
        .forEach(([date, _]) => {
          workdays.add(date.replace(/-/g, '/'));
        });
    }
    
    if (workdays.size > 0) return workdays;
    
  } catch (e) {
    // Not JSON, try PDF text parsing
  }
  
  // PDF text parsing
  const workdays = new Set();
  let currentYear = new Date().getFullYear();
  
  const lines = input.split('\n');
  
  // Try to extract year from PDF header first
  const headerYearMatch = input.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (headerYearMatch) {
    currentYear = parseInt(headerYearMatch[3]);
    console.log(`[DEBUG] Found year in header: ${currentYear}`);
  }
  
  lines.forEach((line, index) => {
    // Extract year from "Week XX YYYY" headers
    const yearMatch = line.match(/Week\s+\d+\s+(20\d{2})/);
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1]);
      console.log(`[DEBUG] Line ${index}: Week header with year ${currentYear}`);
      return;
    }
    
    // Match lines with date format: day DD/MM
    const dateMatch = line.match(/(ma|di|wo|do|vr|za|zo)\s+(\d{1,2})\/(\d{1,2})/);
    
    if (dateMatch) {
      const [_, dayAbbr, dayNum, month] = dateMatch;
      
      // Check if this is a work day
      const hasTimeFormat = /\d{1,2}:\d{2}/.test(line);
      const isVacation = line.includes('Vakantie') || line.includes('OA Var');
      const isFreeDay = line.includes('OZ Vrije Dag') || line.includes('Vrije Dag');
      
      console.log(`[DEBUG] Line ${index}: ${dayAbbr} ${dayNum}/${month} - hasTime:${hasTimeFormat} vacation:${isVacation} free:${isFreeDay}`);
      
      // Only count as workday if has time and not vacation/free
      if (hasTimeFormat && !isVacation && !isFreeDay) {
        const paddedMonth = month.padStart(2, '0');
        const paddedDay = dayNum.padStart(2, '0');
        const dateStr = `${currentYear}/${paddedMonth}/${paddedDay}`;
        workdays.add(dateStr);
        console.log(`[DEBUG]   ✓ Added workday: ${dateStr}`);
      } else {
        console.log(`[DEBUG]   ✗ Skipped (not workday)`);
      }
    }
  });
  
  if (workdays.size > 0) return workdays;
  
  throw new Error('Could not parse ProTime data. Expected PDF text or JSON format.');
}

// ProTime PDF text from Oktober 2025
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

console.log('=== PROTIME PARSER TEST ===\n');

try {
  const workdays = parseProTime(protimePDFText);
  
  console.log('\n=== RESULTS ===');
  console.log('✅ Parse succeeded');
  console.log(`Found ${workdays.size} workdays\n`);
  
  const sorted = Array.from(workdays).sort();
  sorted.forEach(date => console.log(`  ${date}`));
  
  // Expected: 16 workdays
  console.log('\n=== VALIDATION ===');
  console.log(`Expected: 16 workdays`);
  console.log(`Found: ${workdays.size} workdays`);
  
  if (workdays.size === 16) {
    console.log('✅ CORRECT!');
  } else {
    console.log('❌ MISMATCH!');
  }
  
} catch (error) {
  console.log('\n❌ PARSE FAILED');
  console.error(error.message);
}
