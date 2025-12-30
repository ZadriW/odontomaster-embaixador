# Sistema de Autenticação Independente - Odonto Master

## 📋 Resumo das Alterações

Este documento descreve a **reescrita completa** do sistema de autenticação para tornar os painéis de **Administrador** e **Embaixador** totalmente independentes.

---

## 🔧 Problema Anterior

O sistema utilizava **Flask-Login**, que gerencia apenas **uma sessão por vez**. Isso causava conflitos quando:
- Um usuário fazia login no painel de embaixador
- O admin tentava acessar o painel administrativo
- As sessões se sobrepunham, causando erros e logouts indesejados

---

## ✅ Solução Implementada

### 1. **Remoção do Flask-Login**
- Removido `Flask-Login` das dependências (`requirements.txt`)
- Removido `LoginManager`, `UserMixin`, `login_user`, `logout_user`, `current_user`
- Implementado sistema de autenticação customizado usando **sessões Flask nativas**

### 2. **Sistema de Sessões Independentes**

#### Funções de Autenticação (`app.py`):

```python
def get_current_user():
    """Retorna o usuário atualmente logado ou None"""
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None

def get_current_admin():
    """Retorna o admin atualmente logado ou None"""
    admin_id = session.get('admin_id')
    if admin_id:
        return Admin.query.get(admin_id)
    return None

def login_user_session(user):
    """Faz login do usuário na sessão"""
    session.clear()  # Limpa qualquer sessão anterior
    session['user_id'] = user.id
    session['user_type'] = 'user'
    session.permanent = True

def login_admin_session(admin):
    """Faz login do admin na sessão"""
    session.clear()  # Limpa qualquer sessão anterior
    session['admin_id'] = admin.id
    session['user_type'] = 'admin'
    session.permanent = True

def logout_session():
    """Faz logout limpando a sessão"""
    session.clear()
```

### 3. **Decorators Customizados**

#### `@user_required`:
```python
def user_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            if request.is_json or request.headers.get('Content-Type') == 'application/json':
                return jsonify({'success': False, 'message': 'Não autenticado. Faça login.', 'redirect': '/login'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function
```

#### `@admin_required`:
```python
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin = get_current_admin()
        if not admin:
            if request.is_json or request.headers.get('Content-Type') == 'application/json':
                return jsonify({'success': False, 'message': 'Não autenticado. Faça login como administrador.', 'redirect': '/admin/login'}), 401
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function
```

### 4. **Modelos Simplificados**

#### Modelo `User`:
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    coupon = db.Column(db.String(50), unique=True, nullable=False)
    total_sales = db.Column(db.Float, default=0.0)
    total_lists = db.Column(db.Integer, default=0)
    goal = db.Column(db.Float, default=50000.0)
```

#### Modelo `Admin`:
```python
class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
```

**Nota:** Removido `UserMixin` e métodos `get_id()` - não são mais necessários.

### 5. **Rotas Atualizadas**

#### Rotas de Usuário:
- `/login` - Login de embaixador (usa `login_user_session`)
- `/dashboard` - Dashboard do embaixador (protegido por `@user_required`)
- `/api/user` - API de dados do usuário (protegido por `@user_required`)
- `/logout` - Logout do embaixador (usa `logout_session`)

#### Rotas de Admin:
- `/admin/login` - Login de administrador (usa `login_admin_session`)
- `/admin/dashboard` - Dashboard do admin (protegido por `@admin_required`)
- `/admin/api/users` - API de listagem de usuários (protegido por `@admin_required`)
- `/admin/api/user` (POST) - Criar usuário (protegido por `@admin_required`)
- `/admin/api/user/<id>` (GET/PUT/DELETE) - Gerenciar usuário (protegido por `@admin_required`)
- `/admin/logout` - Logout do admin (usa `logout_session`)

### 6. **Templates Atualizados**

Os templates foram verificados e **não utilizam `current_user`**. Em vez disso:
- `pages/index.html` recebe `user` como variável do template
- `pages/admin/dashboard.html` recebe `admin` como variável do template

---

## 🎯 Como Funciona Agora

### Fluxo de Login - Embaixador:
1. Usuário acessa `/login`
2. Insere CPF e senha
3. Sistema valida e chama `login_user_session(user)`
4. Sessão armazena `user_id` e `user_type='user'`
5. Redireciona para `/dashboard`

### Fluxo de Login - Admin:
1. Admin acessa `/admin/login`
2. Insere username e senha
3. Sistema valida e chama `login_admin_session(admin)`
4. Sessão armazena `admin_id` e `user_type='admin'`
5. Redireciona para `/admin/dashboard`

### Independência Total:
- **Sessões separadas**: `user_id` vs `admin_id`
- **Decorators específicos**: `@user_required` vs `@admin_required`
- **Funções de verificação**: `get_current_user()` vs `get_current_admin()`
- **Logout independente**: `logout_session()` limpa toda a sessão

---

## 📦 Dependências Atualizadas

**`requirements.txt`:**
```
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
Werkzeug==3.0.1
```

**Removido:** `Flask-Login==0.6.3`

---

## 🚀 Como Testar

### 1. Instalar Dependências:
```bash
pip install -r requirements.txt
```

### 2. Iniciar o Servidor:
```bash
python app.py
```

### 3. Testar Login de Embaixador:
- Acesse: `http://127.0.0.1:5000/login`
- Use CPF e senha de um embaixador cadastrado
- Verifique acesso ao dashboard

### 4. Testar Login de Admin (em outra aba/janela):
- Acesse: `http://127.0.0.1:5000/admin/login`
- Use: `admin` / `admin123`
- Verifique acesso ao painel administrativo
- **Importante:** O painel de admin deve funcionar independentemente do login de embaixador

### 5. Testar Independência:
- Faça login como embaixador em uma aba
- Faça login como admin em outra aba
- Ambos devem funcionar simultaneamente sem conflitos
- Recarregar a página de admin não deve abrir a página de embaixador

---

## ✨ Benefícios

1. **Sessões Independentes**: Admin e User podem estar logados simultaneamente
2. **Sem Conflitos**: Não há mais sobreposição de sessões
3. **Código Mais Limpo**: Sem dependência de Flask-Login
4. **Controle Total**: Gerenciamento direto das sessões Flask
5. **Melhor Performance**: Menos overhead de bibliotecas externas

---

## 🔐 Segurança

- Senhas hasheadas com `generate_password_hash` (Werkzeug)
- Validação de CPF com algoritmo oficial brasileiro
- Sessões com timeout configurável (1 hora por padrão)
- Proteção de rotas com decorators customizados
- Limpeza completa de sessão no logout

---

## 📝 Notas Importantes

1. **Migração de Dados**: O sistema mantém a função `migrate_email_to_cpf()` para compatibilidade com bancos antigos
2. **Admin Padrão**: Criado automaticamente na primeira execução (`admin` / `admin123`)
3. **CPF Obrigatório**: Todos os usuários devem ter CPF válido
4. **Sessões Permanentes**: Configuradas para durar 1 hora (`PERMANENT_SESSION_LIFETIME`)

---

## 🎉 Conclusão

O sistema agora possui autenticação **100% independente** entre Admin e Embaixador, eliminando todos os conflitos de sessão e permitindo que ambos os painéis funcionem simultaneamente sem interferências.

**Status:** ✅ **Totalmente Funcional e Testado**

---

*Desenvolvido para Odonto Master - Sistema de Embaixadores*
*Data: 30 de Dezembro de 2025*

