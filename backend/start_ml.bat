@echo off
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo Starting GigKavacham ML Service on port 5001...
python ml\services\ml_server.py
