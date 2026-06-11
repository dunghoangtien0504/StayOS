@echo off
chcp 65001 > nul
title StayOS Deploy
cls

echo.
echo ╔═══════════════════════════════════════╗
echo ║        StayOS - Deploy to Server      ║
echo ╚═══════════════════════════════════════╝
echo.

cd /d "D:\Kinh doanh\AI\StayOS"

REM Fix git permissions
echo [1/4] Fixing permissions...
icacls ".git" /grant "%USERNAME%:(OI)(CI)F" /T >nul 2>&1
takeown /F ".git" /R /D Y >nul 2>&1

REM Git add
echo [2/4] Staging changes...
git add src/app/finance/reports/page.tsx src/components/dashboard/DashboardView.tsx src/components/layout/Shell.tsx
if errorlevel 1 (
    echo ERROR: git add failed
    pause
    exit /b 1
)

REM Git commit
echo [3/4] Committing...
git commit -m "feat: KPI trend thuc, date filter bao cao, search topbar"
if errorlevel 1 (
    echo Nothing to commit or error
)

REM Git push
echo [4/4] Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ERROR: Push failed - check credentials
    pause
    exit /b 1
)

echo.
echo ✅ Done! Server se tu deploy trong 1-2 phut.
echo    Mo: https://stay.dunghoang.com
echo.
pause
