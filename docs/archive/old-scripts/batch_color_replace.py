#!/usr/bin/env python3
"""Batch color replacement for AGP+ brutalist consolidation"""

import os

# Color mapping
COLOR_MAP = {
    '#10b981': 'var(--color-green)',
    '#f59e0b': 'var(--color-orange)',
    '#ef4444': 'var(--color-red)',
    '#f9fafb': 'var(--bg-primary)',
    '#111827': 'var(--bg-secondary)',
    '#1f2937': 'var(--bg-tertiary)',
    '#9ca3af': 'var(--text-tertiary)',
    '#6b7280': 'var(--text-secondary)',
    '#d1d5db': 'var(--border-tertiary)',
}

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    for old, new in COLOR_MAP.items():
        content = content.replace(f"'{old}'", f"'{new}'")
        content = content.replace(f'"{old}"', f'"{new}"')
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

components_dir = '/Users/jomostert/Documents/Projects/agp-plus/src/components'
for filename in os.listdir(components_dir):
    if filename.endswith('.jsx'):
        filepath = os.path.join(components_dir, filename)
        if replace_in_file(filepath):
            print(f"✅ {filename}")

print("\n🎨 DONE")
