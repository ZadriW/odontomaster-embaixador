# 🔐 Como Alterar a Senha do Administrador

## ⚡ Comando Rápido

**No PowerShell:**
```powershell
.\change_admin_password.ps1
```

---

## 📋 Passo a Passo

### 1. Abra o PowerShell

### 2. Navegue até o diretório do projeto:
```powershell
cd C:\Users\adriano.almeida\Desktop\Adriano\Ranking
```

### 3. Execute o script:
```powershell
.\change_admin_password.ps1
```

### 4. Se o ambiente virtual não existir:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Depois execute novamente:
```powershell
.\change_admin_password.ps1
```

---

## 📝 O que o script faz:

1. ✅ Busca o admin no banco de dados
2. ✅ Solicita nova senha (sem exibir na tela)
3. ✅ Solicita confirmação
4. ✅ Valida que a senha tem pelo menos 6 caracteres
5. ✅ Valida que as senhas coincidem
6. ✅ Atualiza a senha no banco de dados
7. ✅ Confirma a alteração

---

## ⚠️ Importante

- **No PowerShell, sempre use `.\` antes do nome do arquivo!**
- O script precisa do ambiente virtual (`venv`) criado
- O banco de dados deve existir (`database/users.db`)

---

## 🔍 Verificar se funcionou

Após alterar a senha, teste fazendo login em:
- URL: `http://localhost:5000/admin/login`
- Usuário: `admin`
- Senha: A nova senha que você definiu

---

## 📂 Arquivos Relacionados

- `change_admin_password.ps1` - Script PowerShell principal
- `change_admin_password.py` - Script Python (executado pelo .ps1)

---

**✅ Pronto! Use `.\change_admin_password.ps1` sempre que precisar alterar a senha do admin.**


