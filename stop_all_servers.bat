@echo off
echo ========================================
echo Parando TODOS os servidores Flask
echo ========================================
echo.

echo Procurando e parando todos os processos Python relacionados...

REM Parar todos os processos Python que podem estar rodando o servidor
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq python.exe" /FO LIST ^| findstr "PID:"') do (
    set "pid=%%a"
    set "pid=!pid:PID:=!"
    set "pid=!pid: =!"
    
    REM Verificar se o processo está relacionado ao servidor
    wmic process where "ProcessId=!pid!" get CommandLine 2>nul | findstr /i "run_server app.py flask" >nul
    if not errorlevel 1 (
        echo Parando processo Python PID: !pid!
        taskkill /PID !pid! /F >nul 2>&1
        if errorlevel 1 (
            echo [ERRO] Nao foi possivel parar processo !pid!
        ) else (
            echo [OK] Processo !pid! finalizado!
        )
    )
)

REM Forcar parada de qualquer processo na porta 5000
echo.
echo Verificando porta 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Processo na porta 5000 (PID: %%a) sendo finalizado...
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo [AVISO] Nao foi possivel parar processo %%a - pode precisar de privilegios de administrador
    ) else (
        echo [OK] Processo %%a finalizado!
    )
)

REM Aguardar um pouco
timeout /t 2 /nobreak >nul

REM Verificar resultado final
echo.
echo ========================================
echo Verificando processos restantes...
echo ========================================

netstat -ano | findstr :5000 | findstr LISTENING >nul
if errorlevel 1 (
    echo [SUCESSO] Nenhum processo encontrado na porta 5000
    echo Servidor parado completamente!
) else (
    echo [AVISO] Ainda ha processos na porta 5000:
    netstat -ano | findstr :5000 | findstr LISTENING
    echo.
    echo Tente executar este script como Administrador ou finalize manualmente.
)

echo.
echo Processos Python ativos:
tasklist /FI "IMAGENAME eq python.exe" 2>nul | findstr python.exe
echo.

pause


