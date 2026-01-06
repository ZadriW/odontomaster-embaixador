@echo off
REM ========================================
REM Odonto Master - Desinstalador de Serviço
REM ========================================

echo ========================================
echo    Odonto Master - Remover Servico
echo ========================================
echo.

REM Verificar se está executando como Administrador
net session >nul 2>&1
if errorlevel 1 (
    echo ERRO: Execute como Administrador!
    pause
    exit /b 1
)

set SERVICE_NAME=OdontoMaster

REM Verificar se NSSM está instalado
where nssm >nul 2>&1
if errorlevel 1 (
    echo ERRO: NSSM nao encontrado!
    pause
    exit /b 1
)

REM Verificar se o serviço existe
nssm status %SERVICE_NAME% >nul 2>&1
if errorlevel 1 (
    echo Servico %SERVICE_NAME% nao encontrado.
    pause
    exit /b 0
)

echo Parando servico %SERVICE_NAME%...
nssm stop %SERVICE_NAME%

echo Removendo servico %SERVICE_NAME%...
nssm remove %SERVICE_NAME% confirm

echo.
echo Servico removido com sucesso!
echo.

pause

