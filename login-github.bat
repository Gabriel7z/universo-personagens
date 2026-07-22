@echo off
title Login GitHub - universo-personagens
echo.
echo ============================================
echo   LOGIN NO GITHUB
echo ============================================
echo.
echo 1. Pressione ENTER quando pedir
echo 2. Vai aparecer um CODIGO tipo: ABCD-1234
echo 3. O navegador abre sozinho (ou va em github.com/login/device)
echo 4. Cole o codigo e autorize
echo.
pause
gh auth login --hostname github.com --git-protocol https --web
echo.
if %ERRORLEVEL% EQU 0 (
  echo Login OK! Agora volte no Cursor e diga: publique no github
) else (
  echo Login falhou. Tente de novo ou use o metodo do token no README.
)
echo.
pause
