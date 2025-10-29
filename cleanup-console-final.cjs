#!/usr/bin/env node

/**
 * Console Log Cleanup Script
 * 
 * Removes debug console.log() and console.warn() statements from source files.
 * Keeps console.error() for critical error handling.
 * 
 * Usage: node cleanup-console-final.cjs
 */

const fs = require('fs');
const path = require('path');

// Directories to clean
const DIRECTORIES = [
  'src/components',
  'src/core',
  'src/hooks',
  'src/storage',
  'src/utils'
];

// Patterns to remove
const PATTERNS_TO_REMOVE = [
  /^\s*console\.log\([^)]*\);?\s*$/gm,     // console.log(...);
  /^\s*console\.warn\([^)]*\);?\s*$/gm,    // console.warn(...);
];

// Patterns to keep (don't touch these)
const PATTERNS_TO_KEEP = [
  /console\.error/,  // Keep error logging
  /\/\*\*.*console\.log.*\*\//s,  // Keep JSDoc comments mentioning console.log
];

let stats = {
  filesScanned: 0,
  filesModified: 0,
  linesRemoved: 0
};

function shouldKeepLine(line) {
  for (const pattern of PATTERNS_TO_KEEP) {
    if (pattern.test(line)) {
      return true;
    }
  }
  return false;
}

function cleanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const originalLineCount = lines.length;
  
  let modified = false;
  const cleanedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let shouldRemove = false;
    
    // Check if line should be kept (error logging, comments, etc)
    if (shouldKeepLine(line)) {
      cleanedLines.push(line);
      continue;
    }
    
    // Check if line matches removal patterns
    for (const pattern of PATTERNS_TO_REMOVE) {
      if (pattern.test(line)) {
        shouldRemove = true;
        modified = true;
        stats.linesRemoved++;
        break;
      }
    }
    
    if (!shouldRemove) {
      cleanedLines.push(line);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
    stats.filesModified++;
    console.log(`✓ Cleaned: ${filePath} (${stats.linesRemoved} lines removed)`);
  }
}

function scanDirectory(dir) {
  const fullPath = path.join(process.cwd(), dir);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠ Directory not found: ${dir}`);
    return;
  }
  
  const files = fs.readdirSync(fullPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(fullPath, file.name);
    
    if (file.isDirectory()) {
      // Skip node_modules, .git, etc
      if (!file.name.startsWith('.') && file.name !== 'node_modules') {
        scanDirectory(path.join(dir, file.name));
      }
    } else if (file.isFile()) {
      // Only process .js, .jsx files
      if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        stats.filesScanned++;
        cleanFile(filePath);
      }
    }
  }
}

// Main execution
console.log('🧹 Starting console cleanup...\n');

for (const dir of DIRECTORIES) {
  console.log(`📁 Scanning ${dir}...`);
  scanDirectory(dir);
}

console.log('\n✅ Cleanup complete!');
console.log(`\nStats:`);
console.log(`  Files scanned: ${stats.filesScanned}`);
console.log(`  Files modified: ${stats.filesModified}`);
console.log(`  Lines removed: ${stats.linesRemoved}`);
