@echo off
REM ========================================
REM Odonto Master - Instalador de Servico Windows
REM Requer NSSM (Non-Sucking Service Manager)
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo    Odonto Master - Instalador de Servico
echo ========================================
echo.

REM Verificar se esta executando como Administrador
net session >nul 2>&1
if errorlevel 1 (
    echo ERRO: Execute como Administrador!
    echo Clique com botao direito e selecione "Executar como administrador"
    pause
    exit /b 1
)

REM Definir variaveis
set SERVICE_NAME=OdontoMaster
set PROJECT_PATH=%~dp0
set PYTHON_PATH=%PROJECT_PATH%venv\Scripts\python.exe
set SCRIPT_PATH=%PROJECT_PATH%run_server.py

REM Verificar se NSSM esta instalado
where nssm >nul 2>&1
if errorlevel 1 (
    echo ERRO: NSSM nao encontrado!
    echo.
    echo Baixe NSSM em: https://nssm.cc/download
    echo Extraia e adicione nssm.exe ao PATH do sistema.
    echo Ou copie para C:\Windows\System32\
    echo.
    pause
    exit /b 1
)

REM Verificar se o servico ja existe
nssm status %SERVICE_NAME% >nul 2>&1
if not errorlevel 1 (
    echo Servico %SERVICE_NAME% ja existe.
    set /p REINSTALL="Deseja reinstalar? (S/N): "
    if /i "!REINSTALL!"=="S" (
        echo Parando servico...
        nssm stop %SERVICE_NAME%
        echo Removendo servico...
        nssm remove %SERVICE_NAME% confirm
    ) else (
        echo Operacao cancelada.
        pause
        exit /b 0
    )
)

REM Verificar se ambiente virtual existe
if not exist "%PYTHON_PATH%" (
    echo Criando ambiente virtual...
    python -m venv venv
    if errorlevel 1 (
        echo ERRO: Falha ao criar ambiente virtual!
        echo Verifique se Python esta instalado corretamente.
        pause
        exit /b 1
    )
    echo Instalando dependencias...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

REM Gerar SECRET_KEY automaticamente se nao existir
echo.
echo ========================================
echo Configuracao de Seguranca
echo ========================================
echo.

REM Verificar se ja existe uma SECRET_KEY salva
if exist "%PROJECT_PATH%.secret_key" (
    set /p SAVED_KEY=<"%PROJECT_PATH%.secret_key"
    echo SECRET_KEY existente encontrada.
    set /p USE_EXISTING="Usar a chave existente? (S/N): "
    if /i "!USE_EXISTING!"=="S" (
        set SECRET_KEY=!SAVED_KEY!
        goto :install_service
    )
)

REM Gerar nova SECRET_KEY
echo Gerando nova SECRET_KEY...
for /f "delims=" %%i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set SECRET_KEY=%%i

if "!SECRET_KEY!"=="" (
    echo ERRO: Falha ao gerar SECRET_KEY!
    echo Gerando chave alternativa...
    set SECRET_KEY=OdontoMaster_%RANDOM%%RANDOM%%RANDOM%%RANDOM%
)

echo Nova SECRET_KEY gerada com sucesso!

REM Salvar SECRET_KEY em arquivo (para referencia futura)
echo !SECRET_KEY!>"%PROJECT_PATH%.secret_key"
echo SECRET_KEY salva em .secret_key

:install_service
echo.
echo ========================================
echo Instalando Servico
echo ========================================
echo.

REM Criar pasta de logs
if not exist "%PROJECT_PATH%logs" (
    mkdir "%PROJECT_PATH%logs"
    echo Pasta de logs criada.
)

REM Instalar servico
echo Instalando servico %SERVICE_NAME%...
nssm install %SERVICE_NAME% "%PYTHON_PATH%"
nssm set %SERVICE_NAME% AppParameters "%SCRIPT_PATH%"
nssm set %SERVICE_NAME% AppDirectory "%PROJECT_PATH%"

REM Configurar variaveis de ambiente do servico
nssm set %SERVICE_NAME% AppEnvironmentExtra "SECRET_KEY=!SECRET_KEY!"
nssm set %SERVICE_NAME% AppEnvironmentExtra +PORT=5000
nssm set %SERVICE_NAME% AppEnvironmentExtra +HOST=0.0.0.0
nssm set %SERVICE_NAME% AppEnvironmentExtra +THREADS=4

REM Configurar logs
nssm set %SERVICE_NAME% AppStdout "%PROJECT_PATH%logs\stdout.log"
nssm set %SERVICE_NAME% AppStderr "%PROJECT_PATH%logs\stderr.log"

REM Configurar rotacao de logs
nssm set %SERVICE_NAME% AppStdoutCreationDisposition 4
nssm set %SERVICE_NAME% AppStderrCreationDisposition 4
nssm set %SERVICE_NAME% AppRotateFiles 1
nssm set %SERVICE_NAME% AppRotateBytes 5242880

REM Configurar reinicio automatico
nssm set %SERVICE_NAME% AppRestartDelay 5000
nssm set %SERVICE_NAME% AppStopMethodConsole 3000

REM Configurar descricao
nssm set %SERVICE_NAME% DisplayName "Odonto Master - Programa Embaixador"
nssm set %SERVICE_NAME% Description "Sistema de gestao de embaixadores da Odonto Master"

REM Configurar inicio automatico
nssm set %SERVICE_NAME% Start SERVICE_AUTO_START

echo.
echo ========================================
echo Servico instalado com sucesso!
echo ========================================
echo.
echo Informacoes do servico:
echo    Nome: %SERVICE_NAME%
echo    Porta: 5000
echo    Logs: %PROJECT_PATH%logs\
echo.
echo Comandos uteis:
echo    nssm start %SERVICE_NAME%    - Iniciar servico
echo    nssm stop %SERVICE_NAME%     - Parar servico
echo    nssm restart %SERVICE_NAME%  - Reiniciar servico
echo    nssm status %SERVICE_NAME%   - Ver status
echo    nssm edit %SERVICE_NAME%     - Editar configuracoes
echo.
echo ========================================
echo IMPORTANTE: Apos iniciar, altere a senha
echo do admin padrao (admin/admin123)!
echo ========================================
echo.

set /p START_NOW="Deseja iniciar o servico agora? (S/N): "
if /i "!START_NOW!"=="S" (
    nssm start %SERVICE_NAME%
    timeout /t 3 /nobreak >nul
    nssm status %SERVICE_NAME%
    echo.
    echo Servico iniciado!
    echo Acesse: http://localhost:5000
    echo Admin: http://localhost:5000/admin/login
)

echo.
pause
endlocal
