@echo off
REM ========================================
REM Odonto Master - Backup do Banco de Dados
REM Execute diariamente via Agendador de Tarefas
REM ========================================

setlocal enabledelayedexpansion

REM Configuracoes
set PROJECT_PATH=%~dp0
set DATABASE_PATH=%PROJECT_PATH%database\users.db
set BACKUP_DIR=%PROJECT_PATH%backups
set DATE_STAMP=%date:~6,4%%date:~3,2%%date:~0,2%
set TIME_STAMP=%time:~0,2%%time:~3,2%
set TIME_STAMP=%TIME_STAMP: =0%

REM Criar pasta de backups se nao existir
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

REM Verificar se banco de dados existe
if not exist "%DATABASE_PATH%" (
    echo ERRO: Banco de dados nao encontrado!
    echo Caminho: %DATABASE_PATH%
    exit /b 1
)

REM Fazer backup
set BACKUP_FILE=%BACKUP_DIR%\users_%DATE_STAMP%_%TIME_STAMP%.db
copy "%DATABASE_PATH%" "%BACKUP_FILE%" >nul

if errorlevel 1 (
    echo ERRO: Falha ao fazer backup!
    exit /b 1
)

echo Backup realizado: %BACKUP_FILE%

REM Limpar backups antigos (manter ultimos 30 dias)
forfiles /p "%BACKUP_DIR%" /s /m users_*.db /d -30 /c "cmd /c del @path" 2>nul

echo Backup concluido com sucesso!
echo Total de backups: 
dir /b "%BACKUP_DIR%\users_*.db" 2>nul | find /c /v ""

endlocal


