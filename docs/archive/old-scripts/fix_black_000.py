#!/usr/bin/env python3
"""Fix remaining #000 instances"""
import os, re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Replace #000 in style contexts
    content = re.sub(r"color: '#000'", "color: 'var(--color-black)'", content)
    content = re.sub(r'color: "#000"', 'color: "var(--color-black)"', content)
    content = re.sub(r"border: '([^']*) #000'", r"border: '\1 var(--color-black)'", content)
    content = re.sub(r'border: "([^"]*) #000"', r'border: "\1 var(--color-black)"', content)
    
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
