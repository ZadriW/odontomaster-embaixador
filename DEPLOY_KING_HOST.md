# 🌐 Guia de Deploy - Flask Application

## ⚠️ AVISO IMPORTANTE SOBRE KING HOST

A **King Host NÃO oferece suporte a Python/Flask** em planos de **hospedagem compartilhada**.

### Você tem hospedagem compartilhada King Host?

Se sim, este guia **NÃO será aplicável**. Você precisará:

1. **Fazer upgrade para VPS King Host**, ou
2. **Migrar para outro provedor** que suporte Python nativamente

### Provedores Recomendados para Flask:

| Provedor | Melhor para | Preço | Deploy | Complexidade |
|----------|-------------|-------|--------|--------------|
| **PythonAnywhere** | Iniciantes | Gratuito/Pago | FTP/Git | ⭐ Fácil |
| **Railway.app** | Projetos modernos | Gratuito/Pago | Git | ⭐⭐ Médio |
| **Render.com** | Profissionais | Gratuito/Pago | Git | ⭐⭐ Médio |
| **Vercel** | Serverless | Gratuito/Pago | Git | ⭐⭐⭐ Avançado |
| **DigitalOcean** | Controle total | A partir $5/mês | SSH/Docker | ⭐⭐⭐⭐ Avançado |

---

## 📋 Pré-requisitos (VPS King Host)

✅ Este guia é aplicável apenas para:
- **VPS King Host** com Python configurado
- **Cloud King Host** com Python habilitado
- **Servidores dedicados** com acesso root

### Requisitos (para VPS/Cloud):
- Conta King Host VPS/Cloud com Python habilitado
- Acesso ao painel de controle (cPanel)
- Acesso SSH (recomendado)
- Domínio configurado e apontando para o servidor

---

## 🚀 Passo 1: Preparar os Arquivos Localmente

### 1.1 Estrutura do Projeto

Certifique-se de que seu projeto local tem esta estrutura:

```
Ranking/
├── app.py                      # Aplicação Flask principal
├── passenger_wsgi.py           # Arquivo WSGI para Passenger
├── .htaccess                   # Configurações Apache
├── requirements.txt            # Dependências Python
├── .gitignore                  # Arquivos ignorados
├── assets/                     # CSS, JS estáticos
│   ├── CSS/
│   │   ├── style.css
│   │   ├── login/
│   │   └── admin/
│   └── JS/
│       ├── script.js
│       ├── login/
│       └── admin/
├── pages/                      # Templates HTML
│   ├── index.html
│   ├── login.html
│   └── admin/
│       ├── login.html
│       └── dashboard.html
└── images/                     # Imagens
    └── logo-ranking.png
```

### 1.2 Arquivos a NÃO Enviar

**Não envie para o servidor:**
- `venv/` ou `virtualenv/` (será criado no servidor)
- `__pycache__/`
- `database/` (será criado automaticamente)
- `.secret_key` (será gerado automaticamente no servidor)
- Arquivos `.ps1` (específicos para Windows local)
- `change_admin_password.py` (opcional, só se precisar alterar senha via SSH)

---

## 📁 Passo 2: Enviar Arquivos via FTP

### 2.1 Conectar via FTP

Use um cliente FTP como FileZilla:

- **Host:** ftp.seudominio.com.br (ou o host fornecido pela King Host)
- **Usuário:** seu_usuario_kinghost
- **Senha:** sua_senha_kinghost
- **Porta:** 21 (FTP) ou 22 (SFTP)

### 2.2 Enviar Arquivos

1. Conecte ao servidor FTP
2. Navegue até a pasta `public_html`
3. Envie **todos** os arquivos do projeto (exceto os listados acima)
4. Mantenha a estrutura de pastas intacta

**Estrutura final no servidor:**

```
/home/seu_usuario/public_html/
├── app.py
├── passenger_wsgi.py
├── .htaccess
├── requirements.txt
├── assets/
│   ├── CSS/
│   └── JS/
├── pages/
│   ├── index.html
│   ├── login.html
│   └── admin/
└── images/
```

---

## 🐍 Passo 3: Configurar Python no cPanel

### ⚠️ IMPORTANTE: King Host e Python

A King Host **NÃO oferece suporte nativo a aplicações Python** via cPanel na maioria dos planos de hospedagem compartilhada. O "Setup Python App" só está disponível em planos VPS ou Cloud.

### Opções para hospedar Flask na King Host:

#### **Opção 1: Migrar para VPS King Host** (Recomendado)
Se você tem um plano de hospedagem compartilhada, precisará migrar para um plano VPS da King Host que suporte Python.

#### **Opção 2: Usar outro provedor**
Considere provedores com suporte a Python em hospedagem compartilhada:
- **PythonAnywhere** (gratuito para projetos pequenos)
- **Heroku** (fácil deploy com Git)
- **Railway.app** (moderno e simples)
- **Render.com** (suporte a Flask/Python)
- **DigitalOcean App Platform**

---

### 3.1 Se você tem VPS King Host com Python habilitado:

1. Faça login no cPanel
2. Procure por **"Setup Python App"** ou **"Python Selector"**
3. Se **NÃO encontrar** esta opção, seu plano não suporta Python

### 3.2 Criar Aplicação Python (apenas VPS)

Se você tem acesso ao "Setup Python App":

| Campo | Valor |
|-------|-------|
| **Python version** | 3.9 ou superior |
| **Application root** | /home/seu_usuario/public_html |
| **Application URL** | (deixe vazio para domínio principal) |
| **Application startup file** | passenger_wsgi.py |
| **Application Entry point** | application |

Clique em **"CREATE"**

### 3.3 Instalar Dependências (apenas VPS com Python)

**Via Interface do cPanel:**
1. Na tela "Setup Python App", localize sua aplicação
2. Clique em **"Run Pip Install"** ou **"Install Dependencies"**
3. No campo de texto, digite:
   ```
   Flask==3.0.0 Flask-SQLAlchemy==3.1.1 Werkzeug==3.0.1
   ```
4. Clique em **"Install"**

**Via SSH (método alternativo):**
```bash
cd ~/public_html
source /home/seu_usuario/virtualenv/public_html/3.9/bin/activate
pip install -r requirements.txt
```

---

## ⚠️ ATENÇÃO: Se Não Conseguir Configurar Python

Se você **não encontrou** a opção "Setup Python App" no cPanel, significa que seu plano de hospedagem compartilhada King Host **não suporta Python**.

### Soluções alternativas:

1. **Contate o suporte da King Host** e pergunte sobre suporte a Python/Flask
2. **Upgrade para VPS** na própria King Host
3. **Migre para outro provedor** que suporte Python nativamente

### Provedores recomendados para Flask:

| Provedor | Tipo | Preço | Deploy |
|----------|------|-------|--------|
| PythonAnywhere | Shared | Gratuito/Pago | FTP + cPanel |
| Railway.app | Cloud | Gratuito/Pago | Git |
| Render.com | Cloud | Gratuito/Pago | Git |
| Heroku | Cloud | Pago | Git |
| DigitalOcean | VPS/Cloud | A partir $5/mês | Git/Docker |

---

## 📂 Passo 4: Criar Pastas Necessárias

Via **File Manager** no cPanel:

1. Navegue até `public_html`
2. Crie as seguintes pastas:
   - `database`
   - `logs`
   - `backups`

3. **Defina permissões** para cada pasta:
   - Clique com botão direito na pasta
   - Selecione **"Change Permissions"**
   - Marque: `755` (rwxr-xr-x)

---

## 🔄 Passo 5: Reiniciar a Aplicação

### Método 1: Via cPanel (Recomendado)

1. Volte ao **"Setup Python App"**
2. Encontre sua aplicação na lista
3. Clique no botão **"RESTART"**

### Método 2: Via arquivo restart.txt

1. No **File Manager**, navegue até `public_html`
2. Crie uma pasta chamada `tmp` (se não existir)
3. Dentro de `tmp`, crie um arquivo vazio chamado `restart.txt`

Toda vez que modificar esse arquivo, o Passenger reinicia a aplicação.

### Método 3: Via SSH

```bash
cd ~/public_html
mkdir -p tmp
touch tmp/restart.txt
```

---

## ✅ Passo 6: Testar o Site

### 6.1 Verificar se o site está online

Acesse seu domínio no navegador:

| Página | URL |
|--------|-----|
| Login Embaixador | `http://seudominio.com.br/login` |
| Login Admin | `http://seudominio.com.br/admin/login` |

### 6.2 Credenciais padrão

**Credenciais padrão do admin:**
- **Usuário:** `admin`
- **Senha:** `adminmaster123`

> ⚠️ **CRÍTICO:** Altere a senha do admin **IMEDIATAMENTE** após o primeiro acesso!

### 6.3 Troubleshooting inicial

Se o site **não carregar**:

1. **Verifique os logs de erro:**
   - cPanel > "Errors" ou "Error Log"
   - Procure por mensagens de erro do Passenger

2. **Verifique se Python está instalado:**
   ```bash
   ssh seu_usuario@seudominio.com.br
   python3 --version
   ```

3. **Verifique o passenger_wsgi.py:**
   - Certifique-se de que o arquivo existe em `public_html/`
   - Verifique permissões (644)

4. **Reinicie a aplicação:**
   ```bash
   touch ~/public_html/tmp/restart.txt
   ```

---

## 🔒 Passo 7: Segurança (MUITO IMPORTANTE!)

### 7.1 Alterar Senha do Admin

**IMEDIATAMENTE após o deploy, altere a senha padrão!**

**Opção A - Via SSH:**
```bash
cd ~/public_html
source /home/seu_usuario/virtualenv/public_html/3.9/bin/activate
python change_admin_password.py
```

**Opção B - Diretamente no banco (avançado):**
```bash
cd ~/public_html
source /home/seu_usuario/virtualenv/public_html/3.9/bin/activate
python -c "
from app import app, db, Admin
from werkzeug.security import generate_password_hash
with app.app_context():
    admin = Admin.query.filter_by(username='admin').first()
    admin.password = generate_password_hash('SUA_NOVA_SENHA_FORTE')
    db.session.commit()
    print('Senha alterada!')
"
```

### 7.2 Configurar HTTPS/SSL

1. No cPanel, acesse **"SSL/TLS"** ou **"Let's Encrypt SSL"**
2. Instale um certificado SSL gratuito (Let's Encrypt)
3. Após instalado, edite o arquivo `.htaccess` via File Manager
4. **Descomente** as linhas de redirecionamento HTTPS:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

5. Salve o arquivo e teste acessando `http://` (deve redirecionar para `https://`)

### 7.3 Verificar Proteções

O arquivo `.htaccess` já protege:
- Arquivos `.py`, `.db`, `.env`, `.secret_key`
- Pastas `database/`, `logs/`, `backups/`
- Listagem de diretórios desabilitada

---

## 💾 Passo 8: Backup do Banco de Dados

### 8.1 Backup Manual

**Via File Manager:**
1. Navegue até `public_html/database/`
2. Clique com botão direito em `users.db`
3. Selecione **"Download"**

**Via SSH:**
```bash
cd ~/public_html
cp database/users.db backups/users_$(date +%Y%m%d_%H%M%S).db
```

### 8.2 Backup Automático (Cron Job)

1. No cPanel, acesse **"Cron Jobs"**
2. Adicione um novo cron job:

| Campo | Valor |
|-------|-------|
| Minuto | 0 |
| Hora | 3 |
| Dia | * |
| Mês | * |
| Dia da semana | * |
| Comando | `cd ~/public_html && cp database/users.db backups/users_$(date +\%Y\%m\%d).db 2>/dev/null` |

Isso cria um backup diário às 03:00.

---

## 🔄 Atualizar o Projeto

Quando precisar atualizar o código:

1. **Faça backup do banco:**
   - Baixe `database/users.db` via FTP

2. **Envie os novos arquivos:**
   - Via FTP, sobrescreva os arquivos modificados
   - **NÃO sobrescreva** a pasta `database/`

3. **Reinicie a aplicação:**
   - Via cPanel: "Setup Python App" > "RESTART"
   - Ou: `touch tmp/restart.txt`

4. **Teste o site** para garantir que tudo funciona

---

## 🛑 Troubleshooting

### Erro 500 - Internal Server Error

1. Verifique os logs:
   - cPanel > "Errors" ou "Error Log"
   - Ou arquivo `logs/passenger.log` (se configurado)

2. Verifique se as dependências foram instaladas:
   ```bash
   source /home/seu_usuario/virtualenv/public_html/3.9/bin/activate
   pip list
   ```

3. Verifique permissões das pastas (755)

### Site não carrega / Erro 404

- Verifique se `passenger_wsgi.py` existe em `public_html/`
- Verifique se a aplicação Python está criada no cPanel
- Reinicie a aplicação

### CSS/JS não carrega

- Verifique se a pasta `assets/` foi enviada
- Verifique permissões (755 para pastas, 644 para arquivos)
- Limpe o cache do navegador (Ctrl+Shift+R)

### Erro "Module not found"

```bash
cd ~/public_html
source /home/seu_usuario/virtualenv/public_html/3.9/bin/activate
pip install Flask Flask-SQLAlchemy Werkzeug
touch tmp/restart.txt
```

### Banco de dados não cria

1. Verifique se a pasta `database/` existe com permissão 755
2. Reinicie a aplicação
3. Acesse qualquer página para forçar a criação

### SECRET_KEY não gera

A SECRET_KEY é gerada automaticamente. Se houver problema:

```bash
cd ~/public_html
python -c "import secrets; print(secrets.token_hex(32))" > .secret_key
chmod 600 .secret_key
touch tmp/restart.txt
```

---

## ✅ Checklist Final

- [ ] Arquivos enviados via FTP para `public_html/`
- [ ] Aplicação Python criada no cPanel
- [ ] Dependências instaladas (Flask, Flask-SQLAlchemy, Werkzeug)
- [ ] Pastas `database/`, `logs/`, `backups/` criadas (permissão 755)
- [ ] Aplicação reiniciada
- [ ] Site acessível via domínio
- [ ] Login admin funcionando (`admin` / `adminmaster123`)
- [ ] ⚠️ **SENHA DO ADMIN ALTERADA** (CRÍTICO!)
- [ ] SSL/HTTPS configurado
- [ ] Redirecionamento HTTP→HTTPS ativo
- [ ] Backup automático configurado (Cron Job)

---

## 🌐 URLs do Sistema

| Página | URL |
|--------|-----|
| Login Embaixador | `https://seudominio.com.br/login` |
| Dashboard Embaixador | `https://seudominio.com.br/dashboard` |
| Login Admin | `https://seudominio.com.br/admin/login` |
| Dashboard Admin | `https://seudominio.com.br/admin/dashboard` |

---

## 📞 Suporte

### King Host
- **Central de Ajuda:** https://king.host/ajuda
- **Telefone:** 0800 000 7464
- **Chat:** Disponível no painel cPanel

### Informações do Sistema
- **Admin padrão:** `admin` / `adminmaster123` ⚠️ ALTERE!
- **Banco de dados:** `database/users.db` (SQLite)
- **SECRET_KEY:** `.secret_key` (gerada automaticamente)
- **Logs:** `logs/` (se configurado)

---

---

## 🔄 Alternativa: Deploy em PythonAnywhere (Recomendado para Iniciantes)

Se você não tem VPS King Host, recomendamos o **PythonAnywhere**:

### Vantagens:
- ✅ Suporte nativo a Flask
- ✅ Plano gratuito disponível
- ✅ Interface web simples
- ✅ Não precisa de SSH
- ✅ SSL gratuito incluído

### Deploy rápido no PythonAnywhere:

1. Crie conta em https://www.pythonanywhere.com
2. Faça upload dos arquivos via "Files"
3. Crie um Web App (Flask, Python 3.9+)
4. Configure o WSGI file apontando para `app.py`
5. Recarregue o app

**Documentação:** https://help.pythonanywhere.com/pages/Flask/

---

**🎉 Deploy concluído! Seu sistema está pronto para uso.**

*Última atualização: Janeiro 2026*

---

## 📚 Guias Adicionais

- [Deploy no Railway.app](https://railway.app/template/flask)
- [Deploy no Render.com](https://render.com/docs/deploy-flask)
- [Deploy no DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-gunicorn-and-nginx-on-ubuntu-20-04)
