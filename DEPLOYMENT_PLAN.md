# AGP+ v3.0 Deployment Plan

**Version:** 3.0.0  
**Status:** Production Ready  
**Date:** October 26, 2025

---

## 🎯 Overview

This document outlines the plan to:
1. Merge v3.0-dev → main (retire v2.2)
2. Deploy to jenana.eu (one.com hosting)
3. Establish production workflow

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [x] All critical bugs fixed (comparison dates, ProTime persistence, cartridge detection)
- [x] UI/UX improvements complete (compact date selector, comparison headers)
- [x] Documentation updated (README, CHANGELOG, MASTER_INDEX)
- [x] Version numbers consistent (package.json = 3.8.0)
- [x] Git committed and pushed to v3.0-dev

### Testing Requirements
- [ ] Test full CSV upload workflow
- [ ] Verify ProTime PDF upload + persistence
- [ ] Test all 3 comparison modes (Period, Day/Night, Workday)
- [ ] Verify sensor history modal
- [ ] Test database export/cleanup
- [ ] Verify day profiles render correctly
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)

### Build Validation
- [ ] Run production build: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Verify all assets load correctly
- [ ] Check console for errors
- [ ] Verify IndexedDB persistence works

---

## 🔀 Git Merge Strategy

### Step 1: Final Testing on v3.0-dev
```bash
cd /Users/jomostert/Documents/Projects/agp-plus
git checkout v3.0-dev
git pull origin v3.0-dev

# Test thoroughly
./start.sh
# Run through all features manually
```

### Step 2: Merge to Main
```bash
# Ensure v3.0-dev is up to date
git checkout v3.0-dev
git pull origin v3.0-dev

# Switch to main and merge
git checkout main
git pull origin main

# Merge v3.0-dev into main
git merge v3.0-dev -m "Merge v3.0.0 - Production ready with master dataset architecture"

# Push to remote
git push origin main
```

### Step 3: Tag Release
```bash
git tag -a v3.0.0 -m "AGP+ v3.0.0 - Production Ready
- Complete rewrite with master dataset architecture
- IndexedDB persistent storage
- Period/Day-Night/Workday comparisons
- Device event tracking and export
- Compact UI and brutalist design"

git push origin v3.0.0
```

### Step 4: Archive v2.2
```bash
# Create archive branch for v2.2
git checkout main  # Assuming main currently has v2.2
git checkout -b archive/v2.2
git push origin archive/v2.2

# Update main to v3.8
git checkout main
git merge v3.0-dev
git push origin main
```

---

## 🚀 Deployment to jenana.eu (one.com)

### Build for Production
```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Build optimized production bundle
npm run build

# Output will be in dist/ folder
```

### one.com Deployment Steps

#### Option 1: FTP Upload (Manual)
1. Build project: `npm run build`
2. Connect to one.com FTP:
   - Host: `ftp.jenana.eu` (or `ftp.one.com`)
   - Username: [your FTP username]
   - Password: [your FTP password]
3. Navigate to `public_html/` or `httpdocs/`
4. Upload contents of `dist/` folder
5. Test at https://jenana.eu

#### Option 2: File Manager (one.com Control Panel)
1. Build project: `npm run build`
2. Log into one.com control panel
3. Go to File Manager
4. Navigate to public root
5. Upload all files from `dist/` folder
6. Test at https://jenana.eu

#### Option 3: Git Deployment (Advanced)
```bash
# On one.com server (if SSH access available)
cd /path/to/public_html
git clone https://github.com/jllmostert/agp-plus-v2.git .
npm install
npm run build
cp -r dist/* .
```

### Post-Deployment Checklist
- [ ] Site loads at https://jenana.eu
- [ ] All static assets load (CSS, JS, images)
- [ ] IndexedDB works in production
- [ ] CSV upload functional
- [ ] ProTime upload functional
- [ ] All calculations accurate
- [ ] Export features work
- [ ] No console errors

---

## 🔧 Production Configuration

### Environment Settings
The app is designed to run without environment variables. All configuration is client-side:
- IndexedDB for data persistence
- localStorage for cached events
- No API keys required
- No backend services needed

### Browser Compatibility
Ensure the following are supported:
- Chrome 90+ ✅
- Safari 14+ ✅
- Firefox 88+ ✅
- Edge 90+ ✅

### Performance Targets
- Initial load: < 2s
- CSV processing: < 5s for 10k readings
- IndexedDB operations: < 1s
- Day profile rendering: < 2s

---

## 📊 Monitoring & Maintenance

### What to Monitor
1. **Browser Console Errors**
   - Check for any JavaScript errors
   - Verify IndexedDB operations succeed

2. **User Feedback**
   - Track any bugs reported
   - Monitor feature requests
   - Note performance issues

3. **Data Persistence**
   - Ensure IndexedDB quota not exceeded
   - Verify data survives browser restart
   - Check localStorage not cleared

### Backup Strategy
- **User Data**: Client-side only (IndexedDB)
- **Code**: GitHub repository (main + v3.0-dev branches)
- **Hosting**: one.com automatic backups
- **Export**: Users can export their data as JSON

---

## 🆘 Rollback Plan

If critical issues arise after deployment:

### Quick Rollback (FTP)
1. Keep backup of v2.2 dist/ folder
2. Re-upload v2.2 files to hosting
3. Notify users of temporary downtime

### Git Rollback
```bash
git checkout main
git revert HEAD  # Undo last merge
git push origin main
# Re-build and re-deploy
```

---

## 📝 Post-Deployment Tasks

1. **Update GitHub README**
   - Change status from "Development" to "Production"
   - Update deployment URL to jenana.eu
   - Add live demo link

2. **Create GitHub Release**
   - Tag: v3.8.0
   - Title: "AGP+ v3.8.0 - Production Ready"
   - Release notes from CHANGELOG.md

3. **User Communication**
   - Announce v3.8 release
   - Highlight new features
   - Provide upgrade instructions (none needed - web app)

4. **Documentation**
   - Update user guide if needed
   - Create video tutorial (optional)
   - Update screenshots in README

---

## 🎓 Future Improvements

### Short-term (v3.1)
- [ ] Adaptive Y-axis scaling in day profiles
- [ ] Advanced sensor alert detection from CSV
- [ ] Historical sensor database integration
- [ ] Improved export formats (PDF reports)

### Long-term (v4.0)
- [ ] Multi-user support
- [ ] Cloud sync (optional)
- [ ] Mobile-responsive design
- [ ] PWA support (offline capability)

---

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/jllmostert/agp-plus-v2/issues
- Email: [your-email]
- Documentation: README.md, docs/MASTER_INDEX_V3_8.md
