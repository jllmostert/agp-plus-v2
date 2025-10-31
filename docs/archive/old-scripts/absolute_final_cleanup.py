#!/usr/bin/env python3
"""FINAL COMPLETE cleanup - all remaining hex colors"""
import os, re

# Complete color mapping
COLORS = {
    '#7f1d1d': 'var(--color-red)',
    '#dc2626': 'var(--color-red)',
    '#fee2e2': 'var(--bg-secondary)',
    '#fef2f2': 'var(--bg-primary)',
}

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Replace all variations
    for old, new in COLORS.items():
        content = re.sub(f"'{old}'", f"'{new}'", content)
        content = re.sub(f'"{old}"', f'"{new}"', content)
    
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

print("🎨 DONE")
