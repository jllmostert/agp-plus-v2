# AGP+ Deployment naar agp.jenana.eu

**Datum**: 2025-11-08  
**Doel**: AGP+ hosten op GitHub Pages met custom domain agp.jenana.eu  
**DNS Provider**: one.com  

---

## 📋 SETUP CHECKLIST

### ✅ Stap 1: GitHub Repository Instellingen

1. **Open GitHub Repository**: https://github.com/jllmostert/agp-plus-v2
2. **Settings** → **Pages** (in linker sidebar)
3. **Source**: 
   - Deploy from a branch → selecteer **gh-pages** (wordt automatisch aangemaakt)
   - OF: GitHub Actions (aanbevolen - wordt gebruikt door workflow)
4. **Custom domain**: 
   - Vul in: `agp.jenana.eu`
   - Klik **Save**
   - ✅ Wacht op DNS check (kan 24-48 uur duren)
5. **Enforce HTTPS**: 
   - ☑️ Vink aan zodra DNS is geverifieerd

---

### ✅ Stap 2: DNS Configuratie bij one.com

**Inloggen op one.com**:
- URL: https://www.one.com/admin/
- Ga naar: **DNS Settings** voor domein `jenana.eu`

**DNS Records Toevoegen**:

#### Optie A: CNAME Record (Aanbevolen)
```
Type:  CNAME
Name:  agp
Value: jllmostert.github.io
TTL:   3600 (1 hour)
```

#### Optie B: A Records (Alternatief)
Als CNAME niet werkt, gebruik deze 4 A records:
```
Type:  A
Name:  agp
Value: 185.199.108.153
TTL:   3600

Type:  A
Name:  agp
Value: 185.199.109.153
TTL:   3600

Type:  A
Name:  agp
Value: 185.199.110.153
TTL:   3600

Type:  A
Name:  agp
Value: 185.199.111.153
TTL:   3600
```

**Let op**:
- Propagatie duurt 10 minuten - 48 uur
- Check status: https://dnschecker.org/#CNAME/agp.jenana.eu

---

### ✅ Stap 3: Eerste Deployment

**Via Command Line** (eenmalig):
```bash
cd /Users/jomostert/Documents/Projects/agp-plus

# Build productie versie
npm run build

# Check dist/ directory
ls -la dist/

# Commit en push (triggert auto-deploy)
git add -A
git commit -m "feat: GitHub Pages deployment setup

- Added GitHub Actions workflow for auto-deploy
- Added CNAME for agp.jenana.eu custom domain
- Updated vite.config.js for production build
- DNS instructions for one.com"

git push origin main
```

**GitHub Actions** zal nu automatisch:
1. ✅ Code builden
2. ✅ Deployen naar GitHub Pages
3. ✅ Beschikbaar maken op agp.jenana.eu

**Monitor deployment**:
- GitHub → Actions tab
- Klik op laatst workflow run
- Wacht tot groen ✅

---

### ✅ Stap 4: Verificatie

**Check of site live is**:
1. **GitHub Pages URL** (tijdelijk): https://jllmostert.github.io/agp-plus-v2
2. **Custom domain** (na DNS propagatie): https://agp.jenana.eu

**Test checklist**:
- [ ] Site laadt zonder errors
- [ ] CSV import werkt
- [ ] Sensor history werkt
- [ ] localStorage werkt (data blijft na refresh)
- [ ] HTTPS certificaat is actief (slotje in browser)

---

## 🔧 TROUBLESHOOTING

### DNS niet werkend na 24 uur?

**Check DNS propagatie**:
```bash
# macOS/Linux
dig agp.jenana.eu

# Of online
https://dnschecker.org/#CNAME/agp.jenana.eu
```

**Verwacht resultaat**:
```
agp.jenana.eu. 3600 IN CNAME jllmostert.github.io.
```

**Als niet werkend**:
1. Controleer of CNAME exact `jllmostert.github.io` is (geen trailing slash)
2. Verwijder oude A/AAAA records voor subdomain `agp`
3. Wacht nog 24 uur (DNS kan traag zijn)

### GitHub Pages geeft 404?

**Check**:
1. Repository → Settings → Pages: Is GitHub Pages enabled?
2. Custom domain correct ingevuld? (`agp.jenana.eu`)
3. CNAME file aanwezig in `public/`? (check in repo)
4. Workflow succesvol? (GitHub → Actions tab)

**Fix**:
```bash
# Rebuild en force push
npm run build
git add dist/
git commit -m "fix: force rebuild for GitHub Pages"
git push origin main --force
```

### Site werkt maar data verdwijnt?

**localStorage settings**:
- Check browser privacy settings
- Disable "Clear cookies on exit"
- Gebruik JSON export als backup tussen devices

---

## 🔄 TOEKOMSTIGE UPDATES

**Automatisch bij elke push**:
```bash
git add .
git commit -m "feature: nieuwe functionaliteit"
git push origin main
```

GitHub Actions bouwt en deploy automatisch binnen 2-5 minuten ✅

**Check deployment status**:
- GitHub → Actions tab
- Zie groen vinkje voor succesvolle deployment

---

## 📊 DEPLOYMENT FLOW

```
Local Development
      ↓
   git push
      ↓
GitHub Actions Workflow
      ↓
   npm ci (install)
      ↓
   npm run build
      ↓
Upload to gh-pages branch
      ↓
GitHub Pages Serving
      ↓
https://agp.jenana.eu
```

**Time**: ~3-5 minuten per deployment

---

## 🛡️ DATA PRIVACY

**AGP+ is 100% client-side**:
- ✅ Alle data in jouw browser (localStorage + IndexedDB)
- ✅ Niets wordt naar server gestuurd
- ✅ GitHub Pages host alleen HTML/JS/CSS files
- ✅ GDPR compliant (geen tracking, geen cookies)

**Backup strategie**:
- Export JSON regelmatig (via EXPORT panel)
- Sla JSON op in cloud (Google Drive, Dropbox)
- Import JSON op nieuw device als nodig

---

## 📝 FILES CREATED

```
✅ .github/workflows/deploy.yml  - Auto-deployment workflow
✅ public/CNAME                   - Custom domain configuratie
✅ public/.nojekyll               - Bypass Jekyll processing
✅ vite.config.js                 - Updated voor productie build
✅ docs/DEPLOYMENT.md             - Dit document
```

---

## 🎯 SUCCESS CRITERIA

Deployment is succesvol als:
- [x] GitHub Actions workflow compleet zonder errors
- [ ] https://agp.jenana.eu laadt de applicatie
- [ ] HTTPS certificaat is actief (groen slotje)
- [ ] Data blijft bewaard na browser refresh
- [ ] CSV import/export werkt
- [ ] Sensor history modal werkt

---

**Klaar voor productie!** 🚀

Bij problemen: check GitHub Actions logs of DNS checker.
