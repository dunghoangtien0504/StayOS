@echo off
chcp 65001 > nul
title StayOS Dev Server
cls

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║         StayOS - Property Management System        ║
echo ║               Development Server                   ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM Kill any existing Node processes on port 3000-3003
for /f "tokens=5" %%a in ('netstat -ano ^| find "3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| find "3001" ^| find "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| find "3002" ^| find "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| find "3003" ^| find "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

echo ✓ Cleaned up old processes
echo.
echo ⏳ Cleaning cache...
rmdir /s /q .next >nul 2>&1
rmdir /s /q node_modules\.cache >nul 2>&1

echo ✓ Cache cleaned
echo.
echo 🚀 Starting development server...
echo.

npm run dev

pause
