@echo off
chcp 65001 > nul
title StayOS Dev Server
cls

echo.
echo ╔═════════════════════════════════════════════════════╗
echo ║          StayOS - Property Management System         ║
echo ║            Quick Start Development Server            ║
echo ╚═════════════════════════════════════════════════════╝
echo.

REM Kill existing processes
echo 🧹 Cleaning up old processes...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak

REM Clean cache
echo 📦 Cleaning cache...
rmdir /s /q .next >nul 2>&1

echo.
echo 🚀 Starting server on http://localhost:3002
echo ⏳ This will take a moment...
echo.

REM Start dev server in a new window
start "StayOS Development Server" cmd /k "title StayOS Dev Server && npm run dev"

REM Wait for server to start
timeout /t 5 /nobreak

REM Open browser
echo.
echo 🌐 Opening browser...
start http://localhost:3002

echo.
echo ✅ StayOS is running!
echo.
echo 📌 Press Ctrl+C in the server window to stop
echo.

pause
