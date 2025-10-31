#!/usr/bin/env python3
"""Final cleanup: white literals"""
import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    content = content.replace("color: 'white'", "color: 'var(--color-white)'")
    content = content.replace('color: "white"', 'color: "var(--color-white)"')
    
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
