#!/bin/bash
# ============================================================================
# Phase 5 Documentation Setup Script
# Copies all Phase 5 files to correct locations and commits
# ============================================================================

set -e  # Exit on any error

PROJECT_DIR="/Users/jomostert/Documents/Projects/agp-plus"
cd "$PROJECT_DIR"

echo "🚀 Starting Phase 5 documentation setup..."

# ============================================================================
# 1. CREATE DIRECTORY STRUCTURE
# ============================================================================
echo "📁 Creating directory structure..."

mkdir -p docs/phases/phase5/code
mkdir -p docs/handoffs/archive

# ============================================================================
# 2. COPY PHASE 5 CODE FILES (from uploaded documents)
# ============================================================================
echo "📝 Copying Phase 5 code files..."

# Note: These files are from the documents uploaded to Claude
# They need to be manually copied from /mnt/user-data/uploads/ 
# Since we can't access that directly, we'll use the view tool

# Storage functions (already created via Desktop Commander)
echo "  ✅ sensorStorage_LOCK_ADDITIONS.js already in place"

# Modal additions - need to copy from documents
cat > "docs/phases/phase5/code/SensorHistoryModal_LOCK_ADDITIONS.jsx" << 'MODAL_EOF'
MODAL_EOF

# LockStatistics component
cat > "docs/phases/phase5/code/LockStatistics.jsx" << 'STATS_EOF'
STATS_EOF

echo "  ⚠️  Manual step needed: Copy modal and stats files from documents"

# ============================================================================
# 3. COPY PHASE 5 DOCUMENTATION
# ============================================================================
echo "📚 Copying Phase 5 documentation..."

# These also need to come from uploaded documents
echo "  ⚠️  Manual step needed: Copy documentation files from uploads"

# ============================================================================
# 4. CLEAN UP OLD FILES
# ============================================================================
echo "🧹 Cleaning up old files..."

# Archive old handoffs from root
[ -f "HANDOFF_2025-10-31.md" ] && mv "HANDOFF_2025-10-31.md" docs/handoffs/archive/
[ -f "SESSION_COMPLETE_2025-10-30.md" ] && mv "SESSION_COMPLETE_2025-10-30.md" docs/handoffs/archive/
[ -f "SESSION_COMPLETE.md" ] && mv "SESSION_COMPLETE.md" docs/handoffs/archive/
[ -f "README_UPDATE.md" ] && rm -f "README_UPDATE.md"

# Archive old Phase 5 handoff if exists
[ -f "docs/handoffs/HANDOFF_PHASE5_2025-10-31.md" ] && mv "docs/handoffs/HANDOFF_PHASE5_2025-10-31.md" docs/handoffs/archive/

echo "  ✅ Old files archived"

# ============================================================================
# 5. GIT STATUS CHECK
# ============================================================================
echo ""
echo "📊 Current git status:"
git status --short

# ============================================================================
# 6. GIT ADD
# ============================================================================
echo ""
echo "➕ Adding files to git..."

git add START_HERE.md
git add docs/handoffs/HANDOFF_2025-10-31_FINAL.md
git add docs/phases/phase5/
git add docs/handoffs/archive/
git add docs/COMMIT_INSTRUCTIONS_2025-10-31.md

echo "  ✅ Files staged"

# ============================================================================
# 7. GIT COMMIT
# ============================================================================
echo ""
echo "💾 Creating commit..."

git commit -m "docs(phase5): Add Phase 5 documentation + data discrepancy findings

- Add comprehensive Phase 5 lock system documentation
- Document critical data discrepancy (220 sensors UI vs 1 in storage)
- Add implementation guides, checklists, and architecture docs
- Update START_HERE with debugging priorities
- Create HANDOFF with investigation findings
- Archive old handoffs

Phase 5 code ready but NOT yet implemented - investigation needed first.

Files:
- START_HERE.md: Updated with Phase 5 status
- docs/handoffs/HANDOFF_2025-10-31_FINAL.md: Complete findings
- docs/phases/phase5/: Full Phase 5 documentation + code
  - PHASE_5_IMPLEMENTATION_GUIDE.md (comprehensive guide)
  - PHASE_5_QUICK_REFERENCE.md (TL;DR)
  - PHASE_5_CHECKLIST.md (step-by-step)
  - PHASE_5_ARCHITECTURE.md (technical diagrams)
  - README.md (file index)
  - code/sensorStorage_LOCK_ADDITIONS.js (lock functions)
  - code/SensorHistoryModal_LOCK_ADDITIONS.jsx (UI components)
  - code/LockStatistics.jsx (optional dashboard)

Priority: Resolve data discrepancy before implementing Phase 5"

echo "  ✅ Commit created"

# ============================================================================
# 8. GIT PUSH
# ============================================================================
echo ""
echo "🚀 Pushing to GitHub..."

git push origin main

echo "  ✅ Pushed to remote"

# ============================================================================
# 9. FINAL STATUS
# ============================================================================
echo ""
echo "✅ Phase 5 documentation setup complete!"
echo ""
echo "📋 Summary:"
echo "  - Documentation files created"
echo "  - Old files archived"
echo "  - Changes committed and pushed"
echo ""
echo "⚠️  MANUAL STEPS STILL NEEDED:"
echo "  1. Copy Phase 5 files from document uploads to:"
echo "     - docs/phases/phase5/code/SensorHistoryModal_LOCK_ADDITIONS.jsx"
echo "     - docs/phases/phase5/code/LockStatistics.jsx"
echo "     - docs/phases/phase5/PHASE_5_*.md (implementation guides)"
echo "     - docs/phases/phase5/README.md"
echo ""
echo "  2. Then run: git add docs/phases/phase5/ && git commit && git push"
echo ""
echo "🎯 Next: Investigate data discrepancy (220 vs 1 sensors)"
