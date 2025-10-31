#!/usr/bin/env python3
"""Final comprehensive cleanup"""
import os, re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Replace all variations
    replacements = [
        (r"#000'", "var(--color-black)'"),
        (r'#000"', 'var(--color-black)"'),
        (r"#fff'", "var(--color-white)'"),
        (r'#fff"', 'var(--color-white)"'),
        (r"#ffffff'", "var(--color-white)'"),
        (r'#ffffff"', 'var(--color-white)"'),
    ]
    
    for old, new in replacements:
        content = re.sub(old, new, content)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

components_dir = '/Users/jomostert/Documents/Projects/agp-plus/src/components'
count = 0
for filename in os.listdir(components_dir):
    if filename.endswith('.jsx'):
        filepath = os.path.join(components_dir, filename)
        if fix_file(filepath):
            count += 1
            print(f"✅ {filename}")

print(f"\n🎨 {count} files cleaned")
