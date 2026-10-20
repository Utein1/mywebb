@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   Orbit Portfolio - Cloudflare deploy
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js 22 or newer first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [ERROR] node_modules is missing. Run npm install first.
  pause
  exit /b 1
)

echo [1/2] Building front-end and type-checking...
call npm run build
if errorlevel 1 (
  echo.
  echo [ERROR] Build failed. The existing deployment was not changed.
  pause
  exit /b 1
)

echo.
echo [2/2] Deploying to Cloudflare...
call npx wrangler deploy
if errorlevel 1 (
  echo.
  echo [ERROR] Deployment failed.
  echo If authorization has expired, run: npx wrangler login
  pause
  exit /b 1
)

echo.
echo Deploy completed.
echo.
pause
exit /b 0
