@echo off
echo ========================================
echo Parando servidor Flask Odonto Master
echo ========================================
echo.

REM Encontrar e parar processos Python relacionados ao servidor
echo Procurando processos Python relacionados ao servidor...

REM Parar processos na porta 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Processo encontrado na porta 5000: %%a
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo Erro ao parar processo %%a
    ) else (
        echo Processo %%a finalizado com sucesso!
    )
)

REM Parar processos Python relacionados ao run_server.py ou app.py
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq python.exe" /FO CSV ^| findstr /V "INFO:" ^| findstr python.exe') do (
    echo Verificando processo Python: %%a
    wmic process where "ProcessId=%%a" get CommandLine 2>nul | findstr /i "run_server app.py" >nul
    if not errorlevel 1 (
        echo Parando processo Python %%a...
        taskkill /PID %%a /F >nul 2>&1
        if errorlevel 1 (
            echo Erro ao parar processo %%a
        ) else (
            echo Processo %%a finalizado com sucesso!
        )
    )
)

REM Verificar se ainda há processos na porta 5000
timeout /t 2 /nobreak >nul
netstat -ano | findstr :5000 | findstr LISTENING >nul
if errorlevel 1 (
    echo.
    echo ========================================
    echo Servidor parado com sucesso!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo AVISO: Ainda ha processos na porta 5000
    echo Execute este script novamente ou verifique manualmente
    echo ========================================
    echo.
    echo Processos ainda ativos na porta 5000:
    netstat -ano | findstr :5000 | findstr LISTENING
)

echo.
pause


