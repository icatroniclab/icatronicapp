@echo off
title ICATRONIC App
cd /d "C:\Users\leonardo\icatronicapp"
echo Iniciando ICATRONIC App...
start "" /min cmd /k "npm run dev"
timeout /t 5 /nobreak > nul
start "" "http://localhost:3000"
exit
