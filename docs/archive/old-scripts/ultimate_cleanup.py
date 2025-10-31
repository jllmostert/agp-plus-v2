#!/usr/bin/env python3
"""ULTIMATE FINAL cleanup - every remaining hex"""
import os, re

# Every possible hex variation
COLORS = {
    '#fca5a5': 'var(--color-red)',  # light red
    '#fecaca': 'var(--color-red)',  # lighter red
    '#dc2626': 'var(--color-red)',  # red
    '#fee2e2': 'var(--bg-secondary)',  # very light red bg
}

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Replace exact style property matches
    for old, new in COLORS.items():
        # Match in style properties
        content = re.sub(f"(color|backgroundColor|borderColor): '{old}'", f"\\1: '{new}'", content)
        content = re.sub(f'(color|backgroundColor|borderColor): "{old}"', f'\\1: "{new}"', content)
        # Match in border strings
        content = re.sub(f"border: '([^']*) {old}'", f"border: '\\1 {new}'", content)
        content = re.sub(f'border: "([^"]*) {old}"', f'border: "\\1 {new}"', content)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

components_dir = '/Users/jomostert/Documents/Projects/agp-plus/src/components'
for filename in os.listdir(components_dir):
    if filename.endswith('.jsx'):
        filepath = os.path.join(components_dir, filename)
        if fix_file(filepath):
            print(f"✅ {filename}")

print("🎨 DONE - ALL COLORS CONSOLIDATED!")
