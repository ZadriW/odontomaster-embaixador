# ========================================
# Script PowerShell para alterar senha do Admin
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Alterar Senha do Administrador" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se ambiente virtual existe
if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "ERRO: Ambiente virtual nao encontrado!" -ForegroundColor Red
    Write-Host "Execute primeiro: python -m venv venv" -ForegroundColor Yellow
    Write-Host "E depois: .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Ativar ambiente virtual e executar script
& "venv\Scripts\python.exe" "change_admin_password.py"

Read-Host "`nPressione Enter para sair"


