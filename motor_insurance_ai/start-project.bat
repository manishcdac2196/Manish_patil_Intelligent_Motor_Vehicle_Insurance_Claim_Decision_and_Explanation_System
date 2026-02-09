@echo off
REM Windows shim to run the PowerShell startup script (no admin required)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-project.ps1" %*
pause