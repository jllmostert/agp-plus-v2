/**
 * Test ProTime Multi-Month Import
 * Verifies that multiple PDF imports are merged correctly
 */

// Simplified parseProTime (without all the complexity)
function parseProTime(input) {
  const workdays = new Set();
  let currentYear = new Date().getFullYear();
  
  const lines = input.split('\n');
  
  // Extract year from header
  const headerYearMatch = input.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (headerYearMatch) {
    currentYear = parseInt(headerYearMatch[3]);
  }
  
  lines.forEach((line) => {
    // Match date lines
    const dateMatch = line.match(/(ma|di|wo|do|vr|za|zo)\s+(\d{1,2})\/(\d{1,2})/);
    
    if (dateMatch) {
      const [_, dayAbbr, dayNum, month] = dateMatch;
      
      const hasTimeFormat = /\d{1,2}:\d{2}/.test(line);
      const isVacation = line.includes('Vakantie') || line.includes('OA Var');
      const isFreeDay = line.includes('OZ Vrije Dag') || line.includes('Vrije Dag');
      
      if (hasTimeFormat && !isVacation && !isFreeDay) {
        const paddedMonth = month.padStart(2, '0');
        const paddedDay = dayNum.padStart(2, '0');
        const dateStr = `${currentYear}/${paddedMonth}/${paddedDay}`;
        workdays.add(dateStr);
      }
    }
  });
  
  return workdays;
}

// Simulate multi-month import like the app does
function simulateMultiMonthImport(pdfTexts) {
  let allWorkdays = new Set(); // Start with empty
  
  pdfTexts.forEach((text, index) => {
    console.log(`\n=== Import ${index + 1} ===`);
    
    const newWorkdays = parseProTime(text);
    console.log(`Found ${newWorkdays.size} workdays in this PDF`);
    
    // OLD WAY (BUG): Replace
    // allWorkdays = new Set(newWorkdays);  // ❌ Overwrites!
    
    // NEW WAY (FIX): Merge
    allWorkdays = new Set([
      ...allWorkdays,
      ...newWorkdays
    ]);
    
    console.log(`Total workdays after import: ${allWorkdays.size}`);
  });
  
  return allWorkdays;
}

// Test data: 3 months of ProTime PDFs
const october2025 = `JO MOSTERT - Gegenereerd op 30/10/2025 10:10
Week 40
wo 01/10 8:52 17:03 OD Var. Dag 8u (9u) 8:00 8:00 0:11 - Extra Prestatie 1010 -
do 02/10 11:31 19:47 OD Var. Dag 8u (11u45) 8:00 8:00 0:15 - Extra Prestatie 1010 -
vr 03/10 11:32 19:46 OD Var. Dag 8u (11u45) 8:00 8:00 0:14 - Extra Prestatie 1010 -`;

const november2025 = `JO MOSTERT - Gegenereerd op 30/11/2025 10:10
Week 45
ma 03/11 8:52 17:03 OD Var. Dag 8u (9u) 8:00 8:00 0:11 - Extra Prestatie 1010 -
di 04/11 11:31 19:47 OD Var. Dag 8u (11u45) 8:00 8:00 0:15 - Extra Prestatie 1010 -
wo 05/11 11:32 19:46 OD Var. Dag 8u (11u45) 8:00 8:00 0:14 - Extra Prestatie 1010 -`;

const december2025 = `JO MOSTERT - Gegenereerd op 22/12/2025 10:10
Week 51
ma 15/12 8:52 17:03 OD Var. Dag 8u (9u) 8:00 8:00 0:11 - Extra Prestatie 1010 -
di 16/12 11:31 19:47 OD Var. Dag 8u (11u45) 8:00 8:00 0:15 - Extra Prestatie 1010 -
wo 17/12 11:32 19:46 OD Var. Dag 8u (11u45) 8:00 8:00 0:14 - Extra Prestatie 1010 -
do 18/12 11:32 19:46 OD Var. Dag 8u (11u45) 8:00 8:00 0:14 - Extra Prestatie 1010 -`;

console.log('=== MULTI-MONTH PROTIME IMPORT TEST ===\n');

const result = simulateMultiMonthImport([october2025, november2025, december2025]);

console.log('\n=== FINAL RESULTS ===');
console.log(`Total workdays across 3 months: ${result.size}`);
console.log('\nAll workday dates:');
Array.from(result).sort().forEach(date => console.log(`  ${date}`));

console.log('\n=== VALIDATION ===');
const expected = 3 + 3 + 4; // Oct: 3, Nov: 3, Dec: 4 = 10 total
console.log(`Expected: ${expected} workdays`);
console.log(`Found: ${result.size} workdays`);

if (result.size === expected) {
  console.log('✅ CORRECT! Multi-month merge works!');
} else {
  console.log('❌ FAILED! Workdays not merged correctly');
}
