/**
 * EMERGENCY DEBUG SCRIPT
 * 
 * Paste this entire script into browser console while AGP+ is running.
 * It will help diagnose why the cleanup button isn't working.
 */

console.log('🔍 ===== AGP+ CLEANUP DEBUG SCRIPT =====');
console.log('');

// 1. Find the cleanup button
console.log('1️⃣ Searching for CLEANUP button...');
const cleanupBtn = document.querySelector('button');
const allButtons = document.querySelectorAll('button');
console.log(`   Found ${allButtons.length} buttons total`);

let targetButton = null;
allButtons.forEach((btn, i) => {
  if (btn.textContent.includes('CLEANUP')) {
    console.log(`   ✅ Found CLEANUP button at index ${i}`);
    console.log(`   - Text: "${btn.textContent}"`);
    console.log(`   - Disabled: ${btn.disabled}`);
    console.log(`   - Display: ${window.getComputedStyle(btn).display}`);
    console.log(`   - Visibility: ${window.getComputedStyle(btn).visibility}`);
    console.log(`   - Opacity: ${window.getComputedStyle(btn).opacity}`);
    console.log(`   - Pointer events: ${window.getComputedStyle(btn).pointerEvents}`);
    targetButton = btn;
  }
});

if (!targetButton) {
  console.log('   ❌ CLEANUP button NOT FOUND!');
  console.log('   Available button texts:');
  allButtons.forEach((btn, i) => {
    console.log(`   ${i}: "${btn.textContent.trim().substring(0, 50)}"`);
  });
} else {
  console.log('');
  console.log('2️⃣ Testing button click simulation...');
  
  // Try to click it
  try {
    console.log('   Attempting programmatic click...');
    targetButton.click();
    console.log('   ✅ Click executed (check if modal appeared)');
  } catch (err) {
    console.log('   ❌ Click failed:', err.message);
  }
  
  console.log('');
  console.log('3️⃣ Checking React event handlers...');
  
  // Check for React fiber (internal React structure)
  const reactKey = Object.keys(targetButton).find(key => key.startsWith('__react'));
  if (reactKey) {
    console.log('   ✅ React event handlers attached');
    const fiber = targetButton[reactKey];
    console.log('   - Fiber found:', !!fiber);
    console.log('   - Props:', fiber?.memoizedProps);
  } else {
    console.log('   ❌ No React event handlers found!');
  }
}

console.log('');
console.log('4️⃣ Checking for modal in DOM...');
const modals = document.querySelectorAll('[class*="modal"], [class*="Modal"], .fixed');
console.log(`   Found ${modals.length} potential modal elements`);
modals.forEach((modal, i) => {
  const display = window.getComputedStyle(modal).display;
  const visibility = window.getComputedStyle(modal).visibility;
  console.log(`   Modal ${i}: display=${display}, visibility=${visibility}`);
});

console.log('');
console.log('5️⃣ Checking Chrome Extension conflicts...');
console.log('   Active extensions:', navigator?.userAgent);
console.log('   Check chrome://extensions to see if any extensions might interfere');

console.log('');
console.log('6️⃣ Manual Test Instructions:');
console.log('   → Try clicking the CLEANUP button with your mouse now');
console.log('   → Watch this console for [AGPGenerator] log messages');
console.log('   → If you see "[AGPGenerator] 🗑️ CLEANUP button clicked!" then the button works');
console.log('   → If you see NOTHING, the click is being blocked before reaching React');

console.log('');
console.log('🔍 ===== DEBUG SCRIPT COMPLETE =====');
console.log('Copy the output above and send to Claude for analysis');
