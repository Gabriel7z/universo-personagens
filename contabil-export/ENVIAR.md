# Como enviar para github.com/Gabriel7z/CONTABIL

O bot não tem permissão de escrita no seu repo. Rode **no seu PC** (com Git instalado):

```bash
git clone https://github.com/Gabriel7z/CONTABIL.git
cd CONTABIL

# Copie para esta pasta os arquivos de contabil-export/:
# index.html, assets/, .github/, README.md, .gitignore, publish.sh

git add .
git commit -m "Radar Tributario MVP"
git push origin main
```

## Ativar site grátis (GitHub Pages)

1. https://github.com/Gabriel7z/CONTABIL/settings/pages
2. Branch: **main** → pasta **/ (root)** → Save
3. Site: **https://gabriel7z.github.io/CONTABIL/**

## Arquivos deste pacote

- `index.html` — app principal
- `assets/styles.css` — estilos
- `assets/app.js` — simulador + alertas + PDF + empresas
- `.github/workflows/pages.yml` — deploy automático
