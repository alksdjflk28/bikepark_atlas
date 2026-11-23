@echo off
setlocal
cd /d "%~dp0.."

set "BUN=%USERPROFILE%\.bun\bin\bun.exe"
if not exist "%BUN%" set "BUN=bun"

if not exist "dist\data\parks.json" (
  echo [%date% %time%] dist\data\parks.json fehlt - bitte einmal "bun run build" ausfuehren.>> ".update.log"
  exit /b 1
)

echo.>> ".update.log"
echo ==== %date% %time% ====>> ".update.log"
"%BUN%" tools\weekly-update.mjs >> ".update.log" 2>&1
