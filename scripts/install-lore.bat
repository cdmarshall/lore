@echo off
setlocal enabledelayedexpansion
rem Lore installer (Windows). Double-click to run.
rem Finds the lore-<version>.zip you already downloaded (next to this file,
rem or in your Downloads), unpacks it to %USERPROFILE%\src\lore, and tells
rem you what to do next. If Lore is already installed there, it points you
rem at the update path instead of touching anything.

set "TARGET=%USERPROFILE%\src\lore"
set "ZIP="

echo == Lore installer ==
echo.

for /f "delims=" %%f in ('dir /b /o-d "%~dp0lore-*.zip" 2^>nul') do if not defined ZIP set "ZIP=%~dp0%%f"
if not defined ZIP for /f "delims=" %%f in ('dir /b /o-d "%USERPROFILE%\Downloads\lore-*.zip" 2^>nul') do if not defined ZIP set "ZIP=%USERPROFILE%\Downloads\%%f"

if not defined ZIP (
  echo No lore-version.zip found next to this installer or in your Downloads.
  echo Download the Lore package first, then run this again.
  echo.
  pause
  exit /b 1
)

if exist "%TARGET%\release-manifest.json" (
  echo Lore is already installed at %TARGET%.
  echo To update it, open Cowork in that folder and say "update Lore".
  echo.
  pause
  exit /b 0
)

echo Unpacking %ZIP% to %TARGET% ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "New-Item -ItemType Directory -Force '%TARGET%' | Out-Null; Expand-Archive -LiteralPath '%ZIP%' -DestinationPath '%TARGET%' -Force"
if errorlevel 1 (
  echo Unpack failed. You can unzip the package manually to %TARGET% instead.
  echo.
  pause
  exit /b 1
)

echo.
echo Done. Next steps:
echo   1. Open the Claude desktop app (Cowork).
echo   2. Select %TARGET% as your working folder.
echo   3. Say hello. Onboarding starts on its own.
echo.
pause
