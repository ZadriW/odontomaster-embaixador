# 🖥️ Guia de Deploy - VPS Windows com Waitress e NSSM

## 📋 Pré-requisitos

### No VPS Windows:
- Windows Server 2016+ ou Windows 10/11
- Python 3.8+ instalado e no PATH
- Acesso de Administrador
- NSSM (Non-Sucking Service Manager)

---

## 🔧 Passo 1: Preparar o Ambiente

### 1.1 Instalar Python

1. Baixe Python em: https://www.python.org/downloads/
2. Durante instalação, marque **"Add Python to PATH"**
3. Verifique a instalação:

```cmd
python --version
pip --version
```

### 1.2 Instalar NSSM

1. Baixe NSSM em: https://nssm.cc/download
2. Extraia o arquivo
3. Copie `nssm.exe` (versão win64) para `C:\Windows\System32\`
4. Verifique:

```cmd
nssm --version
```

---

## 📁 Passo 2: Enviar Projeto para o VPS

### Opção A: Via Git (Recomendado)

```cmd
cd C:\
git clone https://github.com/seu-usuario/odontomaster-embaixador.git
cd odontomaster-embaixador
```

### Opção B: Via FTP/SFTP

1. Conecte via FileZilla ou WinSCP
2. Envie todos os arquivos para `C:\odontomaster-embaixador\`

### Estrutura esperada:

```
C:\odontomaster-embaixador\
├── app.py                  # Aplicação Flask principal
├── run_server.py           # Script do servidor Waitress
├── requirements.txt        # Dependências Python
├── start_server.bat        # Iniciar servidor (manual)
├── install_service.bat     # Instalar como serviço Windows
├── uninstall_service.bat   # Remover serviço
├── backup_database.bat     # Script de backup do banco
├── .gitignore              # Arquivos ignorados pelo Git
├── assets\                 # CSS, JS, imagens estáticas
│   ├── CSS\
│   │   ├── style.css
│   │   ├── login\
│   │   └── admin\
│   └── JS\
│       ├── script.js
│       ├── login\
│       └── admin\
├── pages\                  # Templates HTML
│   ├── index.html
│   ├── login.html
│   └── admin\
│       ├── login.html
│       └── dashboard.html
├── images\                 # Imagens
│   └── logo-ranking.png
├── database\               # Banco SQLite (criado automaticamente)
├── logs\                   # Logs do servidor (criado automaticamente)
└── backups\                # Backups do banco (criado automaticamente)
```

---

## 🛠️ Passo 3: Configurar Ambiente Virtual

Abra o Prompt de Comando como Administrador:

```cmd
cd C:\odontomaster-embaixador

REM Criar ambiente virtual
python -m venv venv

REM Ativar ambiente virtual
venv\Scripts\activate.bat

REM Instalar dependências
pip install -r requirements.txt
```

---

## 🚀 Passo 4: Testar Manualmente

```cmd
cd C:\odontomaster-embaixador

REM Executar script de inicialização (gera SECRET_KEY automaticamente)
start_server.bat
```

Acesse no navegador:
- http://localhost:5000/login (Embaixador)
- http://localhost:5000/admin/login (Admin: `admin` / `admin123`)

**Pressione Ctrl+C para parar o teste.**

---

## ⚙️ Passo 5: Instalar como Serviço Windows

### 5.1 Executar Instalador

1. Clique com botão direito em `install_service.bat`
2. Selecione **"Executar como administrador"**
3. O script irá:
   - Criar ambiente virtual (se não existir)
   - Gerar SECRET_KEY automaticamente
   - Instalar o serviço Windows
   - Configurar logs e reinício automático

### 5.2 Verificar Serviço

```cmd
nssm status OdontoMaster
```

Deve mostrar: `SERVICE_RUNNING`

---

## 🌐 Passo 6: Configurar Firewall

Abra a porta 5000 no Firewall do Windows:

```cmd
netsh advfirewall firewall add rule name="Odonto Master" dir=in action=allow protocol=tcp localport=5000
```

---

## 🔒 Passo 7: Configurar Proxy Reverso (Recomendado para HTTPS)

### Opção A: IIS com URL Rewrite

1. Instale o módulo URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite
2. Instale ARR (Application Request Routing)
3. Configure regra de proxy reverso para `http://localhost:5000`

### Opção B: nginx para Windows

```nginx
server {
    listen 80;
    server_name seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 💾 Passo 8: Configurar Backup Automático

### 8.1 Criar Tarefa Agendada

1. Abra o **Agendador de Tarefas** do Windows
2. Crie uma nova tarefa básica:
   - Nome: `OdontoMaster Backup`
   - Gatilho: Diariamente às 02:00
   - Ação: Iniciar um programa
   - Programa: `C:\odontomaster-embaixador\backup_database.bat`

### 8.2 Testar Backup Manual

```cmd
C:\odontomaster-embaixador\backup_database.bat
```

Os backups ficam em `C:\odontomaster-embaixador\backups\`

---

## 📊 Comandos Úteis

### Gerenciar Serviço:

```cmd
REM Iniciar serviço
nssm start OdontoMaster

REM Parar serviço
nssm stop OdontoMaster

REM Reiniciar serviço
nssm restart OdontoMaster

REM Ver status
nssm status OdontoMaster

REM Editar configurações (GUI)
nssm edit OdontoMaster

REM Remover serviço
nssm remove OdontoMaster confirm
```

### Ver Logs:

```cmd
REM Logs do servidor
type C:\odontomaster-embaixador\logs\stdout.log

REM Logs de erro
type C:\odontomaster-embaixador\logs\stderr.log

REM Logs datados (criados pelo run_server.py)
dir C:\odontomaster-embaixador\logs\server_*.log
```

---

## 🔄 Atualizar o Projeto

```cmd
REM Parar serviço
nssm stop OdontoMaster

REM Ativar ambiente virtual
cd C:\odontomaster-embaixador
venv\Scripts\activate.bat

REM Atualizar código (se usando Git)
git pull

REM Atualizar dependências
pip install -r requirements.txt

REM Reiniciar serviço
nssm start OdontoMaster
```

---

## 🛑 Troubleshooting

### Erro: "Python não encontrado"
- Verifique se Python está no PATH
- Reinstale Python marcando "Add to PATH"

### Erro: "NSSM não encontrado"
- Copie `nssm.exe` para `C:\Windows\System32\`

### Serviço não inicia
1. Verifique logs em `C:\odontomaster-embaixador\logs\`
2. Teste manualmente: `start_server.bat`
3. Verifique permissões da pasta

### Porta 5000 em uso
- Mude a porta editando o serviço:
  ```cmd
  nssm edit OdontoMaster
  ```
- Ou encerre o processo usando a porta:
  ```cmd
  netstat -ano | findstr :5000
  taskkill /PID <pid> /F
  ```

### Erro de banco de dados
- Verifique permissões de escrita em `C:\odontomaster-embaixador\database\`
- Delete `users.db` para recriar (perderá dados)

### SECRET_KEY inválida
- A SECRET_KEY é gerada automaticamente e salva em `.secret_key`
- Para gerar nova: delete `.secret_key` e execute `install_service.bat` novamente

---

## ✅ Checklist de Produção

- [ ] Python 3.8+ instalado
- [ ] NSSM instalado
- [ ] Projeto enviado para o VPS
- [ ] Ambiente virtual criado
- [ ] Dependências instaladas
- [ ] Teste manual funcionando
- [ ] Serviço Windows instalado
- [ ] Serviço iniciando automaticamente
- [ ] Firewall configurado (porta 5000)
- [ ] Proxy reverso configurado (opcional)
- [ ] SSL/HTTPS configurado (recomendado)
- [ ] **Senha do admin alterada** (IMPORTANTE!)
- [ ] Backup automático configurado
- [ ] Favicon adicionado (opcional)

---

## 🔐 Segurança - IMPORTANTE!

### Altere imediatamente após o deploy:

1. **Senha do admin padrão**
   - Acesse: `/admin/login`
   - Login: `admin` / `adminmaster123`
   - **Altere para uma senha forte!**

2. **SECRET_KEY**
   - Gerada automaticamente pelo `install_service.bat`
   - Salva em `.secret_key` (não commit no Git!)
   - Para gerar manualmente:
     ```cmd
     python -c "import secrets; print(secrets.token_hex(32))"
     ```

3. **Firewall**
   - Libere apenas portas necessárias (80, 443, 5000)
   - Bloqueie acesso direto à porta 5000 se usar proxy

4. **HTTPS**
   - Configure SSL para produção
   - Use Let's Encrypt (gratuito) ou certificado comercial

5. **Backups**
   - Configure backup automático diário
   - Teste restauração periodicamente

---

## 📂 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `app.py` | Aplicação Flask principal |
| `run_server.py` | Servidor Waitress para produção |
| `requirements.txt` | Dependências Python |
| `start_server.bat` | Iniciar servidor manualmente |
| `install_service.bat` | Instalar serviço Windows |
| `uninstall_service.bat` | Remover serviço |
| `backup_database.bat` | Backup do banco de dados |
| `.secret_key` | SECRET_KEY (não commit!) |
| `database/users.db` | Banco de dados SQLite |
| `logs/` | Logs do servidor |
| `backups/` | Backups do banco |

---

## 📞 Suporte

- **Admin padrão**: `admin` / `adminmaster123` (altere após primeiro login!)
- **Logs**: `C:\odontomaster-embaixador\logs\`
- **Banco de dados**: `C:\odontomaster-embaixador\database\users.db`
- **Backups**: `C:\odontomaster-embaixador\backups\`

---

## 🌐 URLs do Sistema

Após o deploy, o sistema estará disponível em:

| Página | URL |
|--------|-----|
| Login Embaixador | `http://seudominio.com/login` |
| Dashboard Embaixador | `http://seudominio.com/dashboard` |
| Login Admin | `http://seudominio.com/admin/login` |
| Dashboard Admin | `http://seudominio.com/admin/dashboard` |

---

**🎉 Deploy concluído! Seu sistema está pronto para uso em produção.**

*Última atualização: Janeiro 2026*
