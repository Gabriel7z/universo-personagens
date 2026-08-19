#!/usr/bin/env bash
# Publica o Radar Tributário no GitHub (conta Gabriel7z)
set -euo pipefail

REPO="Gabriel7z/CONTABIL"
DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$DIR"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init -b main
  git add .
  git commit -m "Initial commit: Radar Tributario MVP"
fi

if ! gh repo view "$REPO" >/dev/null 2>&1; then
  echo "Criando repositório $REPO ..."
  gh repo create "$REPO" --public --source=. --remote=origin --description "Simulador fiscal para pequeno, médio e grande porte"
else
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$REPO.git"
fi

git push -u origin main

echo ""
echo "Pronto! Repositório: https://github.com/$REPO"
echo "Ative GitHub Pages: https://github.com/$REPO/settings/pages"
echo "URL final: https://gabriel7z.github.io/CONTABIL/"
