@echo off
REM ========================================
REM Odonto Master - Script de Inicializacao
REM Para VPS Windows (execucao manual/teste)
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo    Odonto Master - Iniciando Servidor
echo ========================================

REM Definir diretorio do projeto
cd /d "%~dp0"

REM Verificar se Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    echo Instale Python 3.8 ou superior.
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Verificar se ambiente virtual existe
if not exist "venv" (
    echo Criando ambiente virtual...
    python -m venv venv
    if errorlevel 1 (
        echo ERRO: Falha ao criar ambiente virtual!
        pause
        exit /b 1
    )
)

REM Ativar ambiente virtual
call venv\Scripts\activate.bat

REM Verificar/Instalar dependencias
echo Verificando dependencias...
pip install -r requirements.txt --quiet

REM Verificar se SECRET_KEY existe no arquivo
if exist ".secret_key" (
    set /p SECRET_KEY=<".secret_key"
    echo SECRET_KEY carregada do arquivo .secret_key
) else (
    REM Gerar nova SECRET_KEY
    echo Gerando nova SECRET_KEY...
    for /f "delims=" %%i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set SECRET_KEY=%%i
    echo !SECRET_KEY!>".secret_key"
    echo SECRET_KEY gerada e salva em .secret_key
)

REM Configurar variaveis de ambiente
set PORT=5000
set HOST=0.0.0.0
set THREADS=4

echo.
echo ========================================
echo Configuracoes:
echo    HOST: %HOST%
echo    PORT: %PORT%
echo    THREADS: %THREADS%
echo ========================================
echo.

REM Criar pasta de logs
if not exist "logs" mkdir logs

REM Iniciar servidor
echo Iniciando servidor na porta %PORT%...
echo Pressione Ctrl+C para parar.
echo.
python run_server.py

pause
endlocal
