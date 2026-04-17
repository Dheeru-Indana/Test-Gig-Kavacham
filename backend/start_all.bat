@echo off
echo Starting GigKavacham...
start "ML Service" cmd /k "cd /d %~dp0 && call venv\Scripts\activate && python ml\services\ml_server.py"
timeout /t 5
start "Node Backend" cmd /k "cd /d %~dp0\.. && npm run dev"
echo All services started.
