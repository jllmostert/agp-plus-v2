# AGP+ v2.1 - Lokale Setup Checklist

**Doel:** Lokale directory voorbereiden voor GitHub migratie  
**Tijd:** ~10 minuten

---

## 📥 STAP 1: Download bestanden uit deze chat

Download alle outputs van deze chat naar een tijdelijke folder:

```
~/Downloads/agp-migration/
├── GITHUB_MIGRATION_PLAN.md
├── GITHUB_REPO_STRUCTURE.md
├── STATUS_CHECK_AND_NEXT_STEPS.md
├── PROMPTS_FOR_MIGRATION.md
└── SETUP_CHECKLIST.md (dit bestand)
```

---

## 📂 STAP 2: Maak lokale project directory

```bash
# Kies een locatie (bijvoorbeeld ~/Projects/)
cd ~/Projects/

# Maak hoofdfolder
mkdir agp-plus
cd agp-plus

# Initialize Git
git init
git branch -M main

# Maak directory structuur
mkdir -p src/core
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/styles
mkdir -p docs
mkdir -p public

# Maak placeholder files voor Git tracking
touch src/core/.gitkeep
touch src/components/.gitkeep
touch src/hooks/.gitkeep
touch src/styles/.gitkeep
touch public/.gitkeep

# Maak basis .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Build output
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Misc
.cache/
EOF

echo "✅ Directory structuur gemaakt!"
```

**Je hebt nu:**
```
~/Projects/agp-plus/
├── .git/
├── .gitignore
├── src/
│   ├── core/
│   ├── components/
│   ├── hooks/
│   └── styles/
├── docs/
└── public/
```

---

## 📋 STAP 3: Kopieer artifacts naar /src/core/

**Van Claude Project Files → Lokaal:**

1. **metrics-engine.js**
   ```bash
   # Download ARTIFACT-01__metrics-engine_js.txt uit project files
   # Hernoem en verplaats:
   cp ~/Downloads/ARTIFACT-01__metrics-engine_js.txt ~/Projects/agp-plus/src/core/metrics-engine.js
   ```

2. **parsers.js**
   ```bash
   # Download ARTIFACT-02__parsers_js.txt uit project files
   cp ~/Downloads/ARTIFACT-02__parsers_js.txt ~/Projects/agp-plus/src/core/parsers.js
   ```

3. **html-exporter.js**
   ```bash
   # Download ARTIFACT-03__html-exporter_js.txt uit project files
   cp ~/Downloads/ARTIFACT-03__html-exporter_js.txt ~/Projects/agp-plus/src/core/html-exporter.js
   ```

**Verifieer:**
```bash
ls -la src/core/
# Moet tonen:
# metrics-engine.js  (~352 lines)
# parsers.js         (~183 lines)
# html-exporter.js   (~690 lines)
```

---

## 📚 STAP 4: Kopieer documentatie naar /docs/

**Van deze chat outputs → Lokaal:**

```bash
cd ~/Projects/agp-plus/docs/

# Kopieer de 4 main docs
cp ~/Downloads/agp-migration/GITHUB_MIGRATION_PLAN.md .
cp ~/Downloads/agp-migration/GITHUB_REPO_STRUCTURE.md .
cp ~/Downloads/agp-migration/STATUS_CHECK_AND_NEXT_STEPS.md .
cp ~/Downloads/agp-migration/PROMPTS_FOR_MIGRATION.md .
```

**Je hebt nu:**
```
docs/
├── GITHUB_MIGRATION_PLAN.md
├── GITHUB_REPO_STRUCTURE.md
├── STATUS_CHECK_AND_NEXT_STEPS.md
└── PROMPTS_FOR_MIGRATION.md
```

---

## 🎯 STAP 5: First Git Commit

```bash
cd ~/Projects/agp-plus/

# Check status
git status

# Add alles
git add .

# First commit
git commit -m "chore: initial project structure with core logic and documentation

- Add core modules: metrics-engine, parsers, html-exporter
- Add project documentation and migration plan
- Setup directory structure for React components"

# Verify
git log --oneline
# Moet tonen: chore: initial project structure...
```

---

## 🔗 STAP 6: GitHub Repository Setup

**Optie A: Via GitHub Website**
1. Ga naar https://github.com/new
2. Repository name: `agp-plus`
3. Description: `AGP+ v2.1 - Ambulatory Glucose Profile Generator for Medtronic 780G`
4. Public / Private (jouw keuze)
5. **NIET** initialize with README (je hebt al lokaal content)
6. Create repository

**Optie B: Via GitHub CLI**
```bash
# Install gh CLI eerst: https://cli.github.com/
gh repo create agp-plus --public --source=. --remote=origin
```

**Koppel lokaal aan remote:**
```bash
cd ~/Projects/agp-plus/

# Add remote (vervang USERNAME)
git remote add origin https://github.com/USERNAME/agp-plus.git

# Push
git push -u origin main
```

**Verifieer:** Ga naar https://github.com/USERNAME/agp-plus  
Je moet zien: initial commit met core files + docs

---

## ✅ STAP 7: Verify Setup

**Check lokaal:**
```bash
cd ~/Projects/agp-plus/

# Tree view
tree -L 2 -a

# Moet tonen:
# .
# ├── .git/
# ├── .gitignore
# ├── docs/
# │   ├── GITHUB_MIGRATION_PLAN.md
# │   ├── GITHUB_REPO_STRUCTURE.md
# │   ├── STATUS_CHECK_AND_NEXT_STEPS.md
# │   └── PROMPTS_FOR_MIGRATION.md
# ├── src/
# │   ├── core/
# │   │   ├── metrics-engine.js
# │   │   ├── parsers.js
# │   │   └── html-exporter.js
# │   ├── components/
# │   ├── hooks/
# │   └── styles/
# └── public/

# Check Git status
git status
# Moet tonen: "nothing to commit, working tree clean"

# Check remote
git remote -v
# Moet tonen: origin https://github.com/USERNAME/agp-plus.git
```

**Check GitHub:**
- [ ] Repository bestaat op GitHub
- [ ] Initial commit zichtbaar
- [ ] Core files aanwezig in /src/core/
- [ ] Docs aanwezig in /docs/

---

## 🚀 STAP 8: Klaar voor Volgende Fase

**Je hebt nu:**
✅ Lokale Git repository met core logic  
✅ GitHub remote repository gekoppeld  
✅ Clean directory structuur  
✅ Documentation up-to-date  
✅ Ready voor component development

**Volgende stappen:**
1. Open nieuwe Claude chat
2. Upload deze bestanden naar project files:
   - ARTIFACT-01__metrics-engine_js.txt
   - ARTIFACT-02__parsers_js.txt
   - ARTIFACT-03__html-exporter_js.txt
   - PROMPTS_FOR_MIGRATION.md
3. Start met **PROMPT 1** (Repository Setup & Config Files)

---

## 📝 Quick Reference Commands

```bash
# Check project status
cd ~/Projects/agp-plus && git status

# View file tree
tree -L 3 -I 'node_modules|.git'

# Count lines in core
wc -l src/core/*.js

# View recent commits
git log --oneline -5

# Create new branch for development
git checkout -b feature/add-components

# Stash changes temporarily
git stash

# Apply stashed changes
git stash pop

# Push changes to GitHub
git push origin main
```

---

## ⚠️ Troubleshooting

### "Permission denied (publickey)"
```bash
# Check SSH keys
ls -la ~/.ssh/

# Generate new key if needed
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH Keys → Add new
```

### "Git not found"
```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt-get install git

# Windows
# Download from: https://git-scm.com/download/win
```

### "Tree command not found"
```bash
# macOS
brew install tree

# Ubuntu/Debian
sudo apt-get install tree

# Windows (via chocolatey)
choco install tree
```

---

## 🎉 Success Criteria

Before moving to PROMPT 1, verify:

- [x] Lokale directory `~/Projects/agp-plus/` bestaat
- [x] Git repository geïnitialiseerd
- [x] Core files in `/src/core/` (3 bestanden, ~1225 lines totaal)
- [x] Documentation in `/docs/` (4 bestanden)
- [x] GitHub remote gekoppeld
- [x] First commit gepusht naar GitHub
- [x] `.gitignore` configured
- [x] Directory structuur compleet

**Als alle checkboxes ✅ zijn: You're ready! 🚀**

---

**Next:** Open nieuwe Claude chat en start met PROMPT 1!
