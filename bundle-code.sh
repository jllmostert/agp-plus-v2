#!/bin/bash
# AGP+ Code Bundler
# Bundles all source code into a single file for external review

OUTPUT_FILE="agp-plus-complete-code.txt"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

echo "════════════════════════════════════════════════════════" > "$OUTPUT_FILE"
echo "AGP+ v2.1 - Complete Source Code Bundle" >> "$OUTPUT_FILE"
echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "════════════════════════════════════════════════════════" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "📦 Bundling source code..."

# Function to add a file to bundle
add_file() {
    local file=$1
    if [ -f "$file" ]; then
        echo "" >> "$OUTPUT_FILE"
        echo "┌────────────────────────────────────────────────────────┐" >> "$OUTPUT_FILE"
        echo "│ FILE: $file" >> "$OUTPUT_FILE"
        echo "└────────────────────────────────────────────────────────┘" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo "✓ Added: $file"
    else
        echo "⚠ Skipped (not found): $file"
    fi
}

# Core modules
echo ""
echo "📂 CORE MODULES"
add_file "src/core/metrics-engine.js"
add_file "src/core/parsers.js"
add_file "src/core/html-exporter.js"

# Hooks
echo ""
echo "🪝 CUSTOM HOOKS"
add_file "src/hooks/useCSVData.js"
add_file "src/hooks/useMetrics.js"
add_file "src/hooks/useComparison.js"

# Components
echo ""
echo "🎨 COMPONENTS"
add_file "src/components/AGPGenerator.jsx"
add_file "src/components/FileUpload.jsx"
add_file "src/components/PeriodSelector.jsx"
add_file "src/components/MetricsDisplay.jsx"
add_file "src/components/AGPChart.jsx"
add_file "src/components/ComparisonView.jsx"
add_file "src/components/DayNightSplit.jsx"
add_file "src/components/WorkdaySplit.jsx"
add_file "src/components/HypoglycemiaEvents.jsx"
add_file "src/components/TIRBar.jsx"

# Utils
echo ""
echo "🔧 UTILITIES"
add_file "src/utils/pdfParser.js"

# Styles
echo ""
echo "🎨 STYLES"
add_file "src/styles/globals.css"

# Config
echo ""
echo "⚙️ CONFIGURATION"
add_file "package.json"
add_file "vite.config.js"
add_file "index.html"
add_file "src/main.jsx"

# Footer
echo "" >> "$OUTPUT_FILE"
echo "════════════════════════════════════════════════════════" >> "$OUTPUT_FILE"
echo "End of Bundle - $(wc -l < "$OUTPUT_FILE") lines total" >> "$OUTPUT_FILE"
echo "════════════════════════════════════════════════════════" >> "$OUTPUT_FILE"

echo ""
echo "✅ Bundle complete: $OUTPUT_FILE"
echo "📊 Total lines: $(wc -l < "$OUTPUT_FILE")"
echo "💾 File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo ""
echo "🚀 You can now share this file for external review"
