@echo off
title GigKavacham
color 0A
echo Starting GigKavacham ML Server...
start "ML Server" cmd /k ^
  "cd /d "%~dp0backend" ^
  && call venv\Scripts\activate.bat ^
  && python ml\services\ml_server.py"
echo Waiting for ML models to load (20 seconds)...
timeout /t 20 /nobreak
echo Starting Node Backend...
start "Node Backend" cmd.exe /k "cd /d "%~dp0backend" && npm run dev"
echo Starting Frontend...
if exist "%~dp0frontend\package.json" (
  start "Frontend" cmd /k ^
    "cd /d "%~dp0frontend" ^
    && npm run dev"
) else (
  start "Frontend" cmd /k ^
    "cd /d "%~dp0" ^
    && npm run dev"
)
echo.
echo All services started.
echo ML Server  : http://localhost:5001/health
echo Frontend   : http://localhost:5173
echo.
pause
