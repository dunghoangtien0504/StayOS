@echo off
chcp 65001 > nul
cls

echo.
echo 🛑 Stopping StayOS Dev Server...
echo.

taskkill /IM node.exe /F 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✓ Server stopped successfully
) else (
    echo ⚠ No running server found
)

echo.
pause
