#!/usr/bin/env node

/**
 * Smart Console Cleanup
 * 
 * Removes ONLY debug statements:
 * - console.log()
 * - console.warn()
 * 
 * KEEPS error handling:
 * - console.error()
 * 
 * Also checks for mixed language comments and reports them.
 */

const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
  'src/components',
  'src/core',
  'src/hooks',
  'src/storage',
  'src/utils'
];

let stats = {
  filesScanned: 0,
  filesModified: 0,
  logLinesRemoved: 0,
  warnLinesRemoved: 0,
  errorLinesKept: 0,
  languageIssues: []
};

// Dutch words that indicate mixed language
const DUTCH_WORDS = /\b(het|de|een|en|van|voor|met|als|aan|op|bij|dat|dit|deze|die|is|zijn|heeft|kan|moet|wordt|worden|maken|doen|krijgen|geven|komen|gaan|zien|weten|zeggen|gebruiken|werken|lezen|schrijven|zoeken|vinden)\b/i;

function checkLanguageMix(filePath, content) {
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    // Check comments for Dutch
    const commentMatch = line.match(/\/\/\s*(.+)$|\/\*\s*(.+?)\s*\*\//);
    if (commentMatch) {
      const comment = commentMatch[1] || commentMatch[2];
      if (DUTCH_WORDS.test(comment)) {
        issues.push({
          file: filePath,
          line: index + 1,
          text: line.trim()
        });
      }
    }
  });
  
  return issues;
}

function cleanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Check for language issues
  const langIssues = checkLanguageMix(filePath, content);
  if (langIssues.length > 0) {
    stats.languageIssues.push(...langIssues);
  }
  
  let modified = false;
  const cleanedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Remove console.log() - full line removal
    if (/^\s*console\.log\([^)]*\);?\s*$/.test(line)) {
      stats.logLinesRemoved++;
      modified = true;
      continue;  // Skip this line
    }
    
    // Remove console.warn() - full line removal
    if (/^\s*console\.warn\([^)]*\);?\s*$/.test(line)) {
      stats.warnLinesRemoved++;
      modified = true;
      continue;  // Skip this line
    }
    
    // Keep console.error() - count for stats
    if (/console\.error/.test(line)) {
      stats.errorLinesKept++;
    }
    
    cleanedLines.push(line);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
    stats.filesModified++;
    const totalRemoved = stats.logLinesRemoved + stats.warnLinesRemoved;
    console.log(`✓ ${path.relative(process.cwd(), filePath)} (-${totalRemoved - (stats.filesModified === 1 ? 0 : stats.logLinesRemoved + stats.warnLinesRemoved - totalRemoved)} lines)`);
  }
}

function scanDirectory(dir) {
  const fullPath = path.join(process.cwd(), dir);
  
  if (!fs.existsSync(fullPath)) {
    return;
  }
  
  const files = fs.readdirSync(fullPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(fullPath, file.name);
    
    if (file.isDirectory()) {
      if (!file.name.startsWith('.') && file.name !== 'node_modules') {
        scanDirectory(path.join(dir, file.name));
      }
    } else if (file.isFile()) {
      // Skip backup/disabled files
      if (file.name.includes('.backup') || file.name.includes('.disabled')) {
        continue;
      }
      
      if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        stats.filesScanned++;
        cleanFile(filePath);
      }
    }
  }
}

// Main
console.log('🧹 Smart Console Cleanup\n');
console.log('Removing: console.log(), console.warn()');
console.log('Keeping: console.error()\n');

for (const dir of DIRECTORIES) {
  scanDirectory(dir);
}

console.log('\n✅ Cleanup Complete!\n');
console.log('Statistics:');
console.log(`  Files scanned:     ${stats.filesScanned}`);
console.log(`  Files modified:    ${stats.filesModified}`);
console.log(`  console.log():     ${stats.logLinesRemoved} removed`);
console.log(`  console.warn():    ${stats.warnLinesRemoved} removed`);
console.log(`  console.error():   ${stats.errorLinesKept} kept`);

if (stats.languageIssues.length > 0) {
  console.log(`\n⚠️  Language Issues Found: ${stats.languageIssues.length}`);
  console.log('\nMixed Dutch/English comments detected:\n');
  
  // Group by file
  const byFile = {};
  stats.languageIssues.forEach(issue => {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  });
  
  Object.keys(byFile).forEach(file => {
    console.log(`📄 ${path.relative(process.cwd(), file)}`);
    byFile[file].forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.text}`);
    });
    console.log('');
  });
}
