# GitHub Repository About Update Instructions

## Current Status
- ❌ GitHub About shows: "AGP+ v2.0 - Modular Medtronic 780G analysis tool"
- ✅ Should show: "AGP+ v4.2.2 - Professional diabetes data analysis with stock management"

## How to Update

### Via GitHub Web UI (RECOMMENDED)
1. Go to: https://github.com/jllmostert/agp-plus-v2
2. Look at top right section - click ⚙️ (Settings) icon next to "About"
3. In "Description" field, enter:
   ```
   AGP+ v4.2.2 - Professional diabetes data analysis with stock management
   ```
4. Click "Save changes"

### Via GitHub CLI (Alternative)
```bash
gh repo edit jllmostert/agp-plus-v2 \
  --description "AGP+ v4.2.2 - Professional diabetes data analysis with stock management"
```

## Verification
After update, the About section should show:
- **Description**: AGP+ v4.2.2 - Professional diabetes data analysis with stock management
- **Website**: https://agp.jenana.eu
- **Topics**: diabetes, cgm, medtronic, glucose-monitoring, ambulatory-glucose-profile

## Related Files Updated
- ✅ README.md - Version updated to v4.2.2
- ✅ package.json - Version 4.2.2
- ✅ index.html - Meta tags updated
- ✅ src/version.js - Single source of truth

---

**Note**: The GitHub About section cannot be updated via git commits - it requires manual update through GitHub's web interface or CLI.
