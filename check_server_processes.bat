@echo off
echo ====================================
echo Verificando processos do servidor...
echo ====================================
echo.

echo Processos Python relacionados ao Flask/Waitress:
echo ------------------------------------------------
tasklist /FI "IMAGENAME eq python.exe" /FO TABLE
echo.

echo Processos na porta 5000:
echo ------------------------------------------------
netstat -ano | findstr :5000
echo.

echo ====================================
echo Para encerrar um processo, use:
echo taskkill /PID [NUMERO_PID] /F
echo ====================================
pause

