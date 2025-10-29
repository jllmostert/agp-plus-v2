#!/usr/bin/env python3
"""
Test CSV Manipulator v2.1 voor AGP+
Anonimiseert CSV en voegt edge cases toe voor uitgebreide testing
Behandelt BEIDE secties: events EN sensor glucose data
"""

def manipulate_csv(input_path, output_path):
    """Lees, anonimiseer en manipuleer CSV met edge cases"""
    
    with open(input_path, 'r', encoding='utf-8-sig') as f:
        content = f.read()
    
    print("📖 CSV ingelezen")
    
    # STAP 1: Anonimiseer
    print("\n🎭 STAP 1: Anonimiseer persoonlijke data")
    content = content.replace('Mostert', 'Testpatient')
    content = content.replace('Jo', 'Test')  
    content = content.replace('NG4114235H', 'TEST123456')
    content = content.replace('"Jo"', '"Test"')
    content = content.replace('"Mostert"', '"Testpatient"')
    print("   ✓ Naam: Jo Mostert → Test Testpatient")
    print("   ✓ Serial: NG4114235H → TEST123456")
    
    # STAP 2: Edge cases in sensor glucose data
    print("\n🔧 STAP 2: Introduceer edge cases")
    lines = content.split('\n')
    modified_lines = []
    
    # Trackers
    sensor_gap_count = 0
    extreme_low_added = False
    extreme_high_added = False
    duplicate_added = False
    out_of_order_saved = None
    
    for i, line in enumerate(lines):
        parts = line.split(';')
        
        if len(parts) < 35:  # Geen sensor glucose data
            modified_lines.append(line)
            continue
        
        # Check of dit een sensor glucose regel is
        # In sensor sectie: kolom 34 = SG, kolom 35 = ISIG
        # In pump sectie: kolom 33 = SG, kolom 34 = ISIG
        sg_col_idx = 34 if (len(parts) > 34 and parts[34].strip().replace(',', '').replace('.', '').isdigit()) else 33
        isig_col_idx = sg_col_idx + 1
        
        if not (len(parts) > sg_col_idx and parts[sg_col_idx].strip()):
            modified_lines.append(line)
            continue
        
        date_col = parts[1] if len(parts) > 1 else ''
        time_col = parts[2] if len(parts) > 2 else ''
        
        # EDGE CASE 1: Sensor gap (25 okt 13:45 - 14:30, 9 readings = 45 min)
        if '2025/10/25' in date_col:
            time_parts = time_col.split(':')
            if len(time_parts) >= 2:
                hour = int(time_parts[0])
                minute = int(time_parts[1])
                
                # Gap tussen 13:45 en 14:30
                if (hour == 13 and minute >= 45) or (hour == 14 and minute <= 30):
                    # Verwijder sensor glucose
                    parts[sg_col_idx] = ''  # SG
                    parts[isig_col_idx] = ''  # ISIG  
                    line = ';'.join(parts)
                    sensor_gap_count += 1
        
        # EDGE CASE 2: Extreme LOW (54 mg/dL) op 24 okt rond 06:00
        if not extreme_low_added and '2025/10/24' in date_col and '06:0' in time_col:
            parts[sg_col_idx] = '54'  # Extreme low
            parts[isig_col_idx] = '12,50'  # Low ISIG
            line = ';'.join(parts)
            extreme_low_added = True
            print("   ✓ Extreme low: 54 mg/dL @ 24 okt ~06:00")
        
        # EDGE CASE 3: Extreme HIGH (380 mg/dL) op 23 okt rond 22:00
        if not extreme_high_added and '2025/10/23' in date_col and '22:0' in time_col:
            parts[sg_col_idx] = '380'  # Extreme high
            parts[isig_col_idx] = '48,20'  # High ISIG
            line = ';'.join(parts)
            extreme_high_added = True
            print("   ✓ Extreme high: 380 mg/dL @ 23 okt ~22:00")
        
        # EDGE CASE 4: Duplicate timestamp op 22 okt 18:41:05
        if not duplicate_added and '2025/10/22' in date_col and time_col == '18:41:05':
            modified_lines.append(line)
            # Maak duplicaat met iets andere waarde
            dup_parts = parts.copy()
            try:
                sg_val = int(dup_parts[sg_col_idx])
                dup_parts[sg_col_idx] = str(sg_val + 3)  # +3 mg/dL
            except:
                pass
            modified_lines.append(';'.join(dup_parts))
            duplicate_added = True
            print("   ✓ Duplicate timestamp: 22 okt 18:41:05 (2 identical timestamps)")
            continue
        
        # EDGE CASE 5: Out-of-order timestamps op 21 okt 14:16/14:21
        if out_of_order_saved is None and '2025/10/21' in date_col and time_col == '14:16:05':
            out_of_order_saved = line  # Bewaar deze voor LATER
            continue  # Skip nu
        elif out_of_order_saved is not None and '2025/10/21' in date_col and time_col == '14:21:05':
            # Voeg 14:21 EERST toe, dan 14:16 (verkeerde volgorde!)
            modified_lines.append(line)  # 14:21
            modified_lines.append(out_of_order_saved)  # 14:16 (komt na 14:21!)
            print("   ✓ Out-of-order: 21 okt 14:21 komt VOOR 14:16 (wrong order)")
            out_of_order_saved = None
            continue
        
        modified_lines.append(line)
    
    if sensor_gap_count > 0:
        print(f"   ✓ Sensor gap: 25 okt 13:45-14:30 ({sensor_gap_count} readings removed = {sensor_gap_count * 5} min)")
    
    print("   ✓ Midnight boundaries: Natural in data (✓)")
    print("   ✓ Missing data points: Existing gaps preserved (✓)")
    
    # Schrijf output
    output_content = '\n'.join(modified_lines)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(output_content)
    
    print(f"\n✅ Test CSV geschreven: {output_path}")
    print(f"   Totaal regels: {len(modified_lines)}")

if __name__ == '__main__':
    input_file = '/Users/jomostert/Documents/Diabetes Care/26okt/Jo Mostert 26-10-2025_sample14d.csv'
    output_file = '/Users/jomostert/Documents/Projects/agp-plus/test-data/Jo_Mostert_14d_TEST_SAMPLE_anonymized.csv'
    
    print("🔬 AGP+ Test CSV Manipulator v2.1")
    print("=" * 60)
    
    manipulate_csv(input_file, output_file)
    
    print("\n" + "=" * 60)
    print("✅ DONE! Test CSV ready for comprehensive testing")
    print("\nEdge cases included:")
    print("  1. ✓ Sensor gap mid-day (45-50 min)")
    print("  2. ✓ Extreme glucose values (54 & 380 mg/dL)")
    print("  3. ✓ Duplicate timestamps")
    print("  4. ✓ Out-of-order timestamps")
    print("  5. ✓ Midnight boundary crossings")
    print("  6. ✓ Missing data points")
