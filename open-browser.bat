@echo off
chcp 65001 > nul

REM Wait a bit for server to be ready
timeout /t 3 /nobreak

REM Try ports 3000-3003
for %%P in (3000 3001 3002 3003) do (
    tasklist /FI "WINDOWTITLE eq StayOS*" 2>NUL | find /I /N "StayOS" >NUL
    if "%ERRORLEVEL%"=="0" (
        start http://localhost:%%P
        exit /b
    )
)

REM Default to 3000 if none found
start http://localhost:3000
