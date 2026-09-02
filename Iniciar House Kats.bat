@echo off
title House Kats
cd /d "%~dp0"

echo.
echo   House Kats - iniciando...
echo.

if not exist "node_modules" (
  echo   Primeira vez: instalando as dependencias. Isso leva um minuto.
  echo.
  call npm install --no-audit --no-fund
  echo.
)

call npm start

echo.
echo   O servidor parou. Feche esta janela ou pressione uma tecla para sair.
echo   (Se disse que a porta esta ocupada, ja tem uma janela do app aberta.)
pause >nul
