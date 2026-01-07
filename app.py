from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os

app = Flask(__name__, 
            template_folder='pages',
            static_folder='assets')

# Configurações base
basedir = os.path.abspath(os.path.dirname(__file__))

# SECRET_KEY: Em produção, gera automaticamente e salva em arquivo
def get_secret_key():
    """Obtém ou gera a SECRET_KEY para a aplicação"""
    secret_key_file = os.path.join(basedir, '.secret_key')
    
    # Primeiro, verifica variável de ambiente
    if os.environ.get('SECRET_KEY'):
        return os.environ.get('SECRET_KEY')
    
    # Tenta ler do arquivo
    if os.path.exists(secret_key_file):
        try:
            with open(secret_key_file, 'r') as f:
                key = f.read().strip()
                if key:
                    return key
        except:
            pass
    
    # Gera nova chave e salva
    import secrets
    new_key = secrets.token_hex(32)
    try:
        with open(secret_key_file, 'w') as f:
            f.write(new_key)
        # Define permissões restritas (apenas leitura para owner)
        os.chmod(secret_key_file, 0o600)
    except:
        pass  # Se não conseguir salvar, usa a chave gerada apenas em memória
    
    return new_key

app.config['SECRET_KEY'] = get_secret_key()
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hora

# Rota para servir imagens da pasta images/
@app.route('/images/<path:filename>')
def images(filename):
    images_dir = os.path.join(basedir, 'images')
    return send_from_directory(images_dir, filename)

# Rota para favicon
@app.route('/favicon.ico')
def favicon():
    # Serve logo-ranking.png como favicon
    logo_path = os.path.join(basedir, 'images', 'logo-ranking.png')
    if os.path.exists(logo_path):
        return send_from_directory(os.path.join(basedir, 'images'), 'logo-ranking.png', mimetype='image/png')
    # Se não existir, retorna 204 No Content para evitar erro 404
    return '', 204

# Configuração do banco de dados
# Em produção, usar variável de ambiente DATABASE_URL (ex: PostgreSQL)
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Para PostgreSQL do Heroku/Render (formato: postgresql://user:pass@host/db)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # SQLite para desenvolvimento local
    database_dir = os.path.join(basedir, 'database')
    if not os.path.exists(database_dir):
        os.makedirs(database_dir)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(database_dir, 'users.db')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicialização
db = SQLAlchemy(app)

# ==================== MODELOS ====================

# Modelo de Usuário
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)  # CPF com formatação (000.000.000-00)
    password = db.Column(db.String(200), nullable=False)
    coupon = db.Column(db.String(50), unique=True, nullable=False)
    total_sales = db.Column(db.Float, default=0.0)
    total_lists = db.Column(db.Integer, default=0)
    goal = db.Column(db.Float, default=50000.0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'cpf': self.cpf,
            'coupon': self.coupon,
            'totalSales': self.total_sales,
            'totalLists': self.total_lists,
            'goal': self.goal
        }

# Modelo de Administrador
class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

# ==================== FUNÇÕES DE AUTENTICAÇÃO ====================

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
    """Faz login do usuário na sessão (sem afetar sessão do admin)"""
    # Define chaves do usuário sem remover chaves do admin
    # Permite que ambos (user e admin) estejam logados simultaneamente
    session['user_id'] = user.id
    # user_type não é necessário para verificação, mas pode ser usado para informação
    # Como podemos ter ambos logados, não sobrescrevemos user_type
    if 'user_type' not in session:
        session['user_type'] = 'user'
    session.permanent = True

def login_admin_session(admin):
    """Faz login do admin na sessão (sem afetar sessão do user)"""
    # Define chaves do admin sem remover chaves do user
    # Permite que ambos (user e admin) estejam logados simultaneamente
    session['admin_id'] = admin.id
    # user_type não é necessário para verificação, mas pode ser usado para informação
    # Como podemos ter ambos logados, não sobrescrevemos user_type
    if 'user_type' not in session:
        session['user_type'] = 'admin'
    session.permanent = True

def logout_user_session():
    """Faz logout do usuário (remove apenas chaves do user)"""
    session.pop('user_id', None)
    # Remove user_type apenas se for 'user' (não afeta se for 'admin')
    if session.get('user_type') == 'user':
        session.pop('user_type', None)
    # Se ainda há admin_id na sessão, admin continua logado

def logout_admin_session():
    """Faz logout do admin (remove apenas chaves do admin)"""
    session.pop('admin_id', None)
    # Remove user_type apenas se for 'admin' (não afeta se for 'user')
    if session.get('user_type') == 'admin':
        session.pop('user_type', None)
    # Se ainda há user_id na sessão, user continua logado

def logout_session():
    """Faz logout completo (limpa toda a sessão) - usar apenas quando necessário"""
    session.clear()

# ==================== DECORATORS ====================

def user_required(f):
    """Decorator para rotas que requerem autenticação de usuário"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            # Se for requisição JSON, retornar erro JSON
            if request.is_json or request.headers.get('Content-Type') == 'application/json':
                return jsonify({'success': False, 'message': 'Não autenticado. Faça login.', 'redirect': '/login'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator para rotas que requerem autenticação de admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin = get_current_admin()
        if not admin:
            # Se for requisição JSON, retornar erro JSON
            if request.is_json or request.headers.get('Content-Type') == 'application/json':
                return jsonify({'success': False, 'message': 'Não autenticado. Faça login como administrador.', 'redirect': '/admin/login'}), 401
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# ==================== FUNÇÕES AUXILIARES ====================

# Validar CPF
def validate_cpf(cpf):
    """
    Valida CPF brasileiro
    Remove formatação e verifica se é válido
    """
    # Remove caracteres não numéricos
    cpf = ''.join(filter(str.isdigit, str(cpf)))
    
    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais (CPF inválido)
    if cpf == cpf[0] * 11:
        return False
    
    # Validação dos dígitos verificadores
    def calculate_digit(cpf, positions):
        sum = 0
        for i, pos in enumerate(positions):
            sum += int(cpf[i]) * pos
        remainder = sum % 11
        return 0 if remainder < 2 else 11 - remainder
    
    # Verifica primeiro dígito
    first_digit = calculate_digit(cpf[:9], range(10, 1, -1))
    if int(cpf[9]) != first_digit:
        return False
    
    # Verifica segundo dígito
    second_digit = calculate_digit(cpf[:10], range(11, 1, -1))
    if int(cpf[10]) != second_digit:
        return False
    
    return True

# Formatar CPF (000.000.000-00)
def format_cpf(cpf):
    """
    Formata CPF removendo caracteres não numéricos e adicionando formatação
    """
    cpf = ''.join(filter(str.isdigit, str(cpf)))
    if len(cpf) == 11:
        return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"
    return cpf

# Gerar cupom único
def generate_coupon(name):
    import random
    clean_name = ''.join(name.upper().split())[:8]
    random_num = random.randint(10, 99)
    coupon = f"ODONTO{clean_name}{random_num}"
    
    while User.query.filter_by(coupon=coupon).first():
        random_num = random.randint(10, 99)
        coupon = f"ODONTO{clean_name}{random_num}"
    
    return coupon

# Criar admin padrão se não existir
def create_default_admin():
    with app.app_context():
        if not Admin.query.filter_by(username='admin').first():
            admin = Admin(
                username='admin',
                email='admin@odontomaster.com',
                password=generate_password_hash('adminmaster123'),
                name='Administrador'
            )
            db.session.add(admin)
            db.session.commit()
            print('Admin padrão criado: admin / adminmaster123')

# ==================== ROTAS DO USUÁRIO ====================

@app.route('/')
def home():
    user = get_current_user()
    admin = get_current_admin()
    
    if admin:
        return redirect(url_for('admin_dashboard'))
    if user:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Se já está logado como User, redireciona
    user = get_current_user()
    if user:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        cpf = data.get('cpf')
        password = data.get('password')
        
        # Validar e formatar CPF
        if not cpf:
            if request.is_json:
                return jsonify({'success': False, 'message': 'CPF é obrigatório!'}), 400
            flash('CPF é obrigatório!', 'error')
            return render_template('login.html')
        
        # Remover formatação e validar CPF
        cpf_clean = ''.join(filter(str.isdigit, str(cpf)))
        if not validate_cpf(cpf_clean):
            if request.is_json:
                return jsonify({'success': False, 'message': 'CPF inválido!'}), 400
            flash('CPF inválido!', 'error')
            return render_template('login.html')
        
        cpf_formatted = format_cpf(cpf_clean)
        user = User.query.filter_by(cpf=cpf_formatted).first()
        
        if user and check_password_hash(user.password, password):
            login_user_session(user)
            if request.is_json:
                return jsonify({'success': True, 'message': 'Login realizado com sucesso!', 'redirect': url_for('dashboard')})
            return redirect(url_for('dashboard'))
        else:
            if request.is_json:
                return jsonify({'success': False, 'message': 'CPF ou senha incorretos!'}), 401
            flash('CPF ou senha incorretos!', 'error')
    
    return render_template('login.html')

@app.route('/dashboard')
@user_required
def dashboard():
    user = get_current_user()
    return render_template('index.html', user=user)

@app.route('/api/user')
@user_required
def get_user():
    user = get_current_user()
    return jsonify(user.to_dict())

@app.route('/api/ranking/top3')
@user_required
def api_ranking_top3():
    """Retorna os 3 usuários com maior total_sales (apenas nome e posição)"""
    try:
        # Buscar os 3 usuários com maior total_sales, ordenados por total_sales descendente
        top_users = User.query.order_by(User.total_sales.desc()).limit(3).all()
        
        # Preparar dados para retorno (apenas nome e posição)
        ranking = []
        positions = ['1º', '2º', '3º']
        
        for index, user in enumerate(top_users):
            ranking.append({
                'position': positions[index],
                'name': user.name
            })
        
        return jsonify(ranking)
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao buscar ranking: {str(e)}'}), 500

@app.route('/logout')
def logout():
    logout_user_session()  # Remove apenas sessão do user
    return redirect(url_for('login'))

# ==================== ROTAS DO ADMINISTRADOR ====================

@app.route('/admin')
def admin_home():
    return redirect(url_for('admin_login'))

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    # Se já está logado como Admin, redireciona
    admin = get_current_admin()
    if admin:
        return redirect(url_for('admin_dashboard'))
    
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        username = data.get('username')
        password = data.get('password')
        
        admin = Admin.query.filter_by(username=username).first()
        
        if admin and check_password_hash(admin.password, password):
            login_admin_session(admin)
            if request.is_json:
                return jsonify({'success': True, 'message': 'Login realizado com sucesso!', 'redirect': url_for('admin_dashboard')})
            return redirect(url_for('admin_dashboard'))
        else:
            if request.is_json:
                return jsonify({'success': False, 'message': 'Usuário ou senha incorretos!'}), 401
            flash('Usuário ou senha incorretos!', 'error')
    
    return render_template('admin/login.html')

@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    admin = get_current_admin()
    users = User.query.order_by(User.id.desc()).all()
    total_users = len(users)
    total_sales = sum(u.total_sales for u in users)
    total_lists = sum(u.total_lists for u in users)
    
    stats = {
        'total_users': total_users,
        'total_sales': total_sales,
        'total_lists': total_lists
    }
    
    return render_template('admin/dashboard.html', admin=admin, users=users, stats=stats)

@app.route('/admin/api/users')
@admin_required
def admin_get_users():
    users = User.query.order_by(User.id.desc()).all()
    return jsonify([{
        'id': u.id,
        'name': u.name,
        'cpf': u.cpf,
        'coupon': u.coupon,
        'total_sales': u.total_sales,
        'total_lists': u.total_lists,
        'goal': u.goal
    } for u in users])

@app.route('/admin/api/user', methods=['POST'])
@admin_required
def admin_create_user():
    data = request.get_json()
    
    # Verificar se os dados foram recebidos
    if not data:
        return jsonify({'success': False, 'message': 'Dados não fornecidos!'}), 400
    
    name = data.get('name')
    cpf = data.get('cpf')
    password = data.get('password')
    
    if not all([name, cpf, password]):
        return jsonify({'success': False, 'message': 'Todos os campos são obrigatórios!'}), 400
    
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'A senha deve ter pelo menos 6 caracteres!'}), 400
    
    # Validar e formatar CPF
    cpf_clean = ''.join(filter(str.isdigit, str(cpf)))
    if not validate_cpf(cpf_clean):
        return jsonify({'success': False, 'message': 'CPF inválido!'}), 400
    
    cpf_formatted = format_cpf(cpf_clean)
    
    if User.query.filter_by(cpf=cpf_formatted).first():
        return jsonify({'success': False, 'message': 'Este CPF já está cadastrado!'}), 400
    
    try:
        hashed_password = generate_password_hash(password)
        coupon = generate_coupon(name)
        
        new_user = User(
            name=name,
            cpf=cpf_formatted,
            password=hashed_password,
            coupon=coupon,
            total_sales=0.0,
            total_lists=0,
            goal=50000.0
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuário cadastrado com sucesso!',
            'user': {
                'id': new_user.id,
                'name': new_user.name,
                'cpf': new_user.cpf,
                'coupon': new_user.coupon,
                'total_sales': new_user.total_sales,
                'total_lists': new_user.total_lists,
                'goal': new_user.goal
            }
        })
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Erro ao criar usuário: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Erro ao criar usuário: {str(e)}'}), 500

@app.route('/admin/api/user/<int:user_id>', methods=['GET'])
@admin_required
def admin_get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({
        'id': user.id,
        'name': user.name,
        'cpf': user.cpf,
        'coupon': user.coupon,
        'total_sales': user.total_sales,
        'total_lists': user.total_lists,
        'goal': user.goal
    })

@app.route('/admin/api/user/<int:user_id>', methods=['PUT'])
@admin_required
def admin_update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    try:
        if 'total_sales' in data:
            user.total_sales = float(data['total_sales'])
        if 'total_lists' in data:
            user.total_lists = int(data['total_lists'])
        if 'goal' in data:
            user.goal = float(data['goal'])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Dados atualizados com sucesso!',
            'user': {
                'id': user.id,
                'name': user.name,
                'total_sales': user.total_sales,
                'total_lists': user.total_lists,
                'goal': user.goal
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao atualizar: {str(e)}'}), 500

@app.route('/admin/api/user/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(user_id):
    user = User.query.get_or_404(user_id)
    
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Usuário excluído com sucesso!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir: {str(e)}'}), 500

@app.route('/admin/logout')
def admin_logout():
    logout_admin_session()  # Remove apenas sessão do admin
    return redirect(url_for('admin_login'))

# ==================== INICIALIZAÇÃO ====================

def migrate_email_to_cpf():
    """
    Migra a coluna email para cpf na tabela user
    """
    import sqlite3
    from sqlalchemy import inspect
    
    # Define o caminho do banco de dados
    database_dir = os.path.join(basedir, 'database')
    db_path = os.path.join(database_dir, 'users.db')
    if not os.path.exists(db_path):
        return  # Banco não existe ainda, será criado com a estrutura correta
    
    try:
        # Verificar se a tabela user existe
        inspector = inspect(db.engine)
        if 'user' not in inspector.get_table_names():
            return  # Tabela não existe ainda
        
        columns = [col['name'] for col in inspector.get_columns('user')]
        
        # Se já tem cpf e não tem email, já está migrado
        if 'cpf' in columns and 'email' not in columns:
            return
        
        # Se não tem email e não tem cpf, não precisa migrar (tabela vazia ou já atualizada)
        if 'email' not in columns and 'cpf' not in columns:
            return
        
        # Conectar diretamente ao SQLite para fazer a migração
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Recriar a tabela sem a coluna email
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_new (
                id INTEGER PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                cpf VARCHAR(14) NOT NULL UNIQUE,
                password VARCHAR(200) NOT NULL,
                coupon VARCHAR(50) NOT NULL UNIQUE,
                total_sales FLOAT,
                total_lists INTEGER,
                goal FLOAT
            )
        ''')
        
        # Se já tem cpf na tabela antiga, copiar dados incluindo cpf
        if 'cpf' in columns:
            # Verificar se há CPFs válidos (não o padrão)
            cursor.execute("SELECT COUNT(*) FROM user WHERE cpf IS NOT NULL AND cpf != '000.000.000-00'")
            valid_cpf_count = cursor.fetchone()[0]
            
            if valid_cpf_count > 0:
                # Copiar apenas usuários com CPF válido
                cursor.execute('''
                    INSERT INTO user_new (id, name, cpf, password, coupon, total_sales, total_lists, goal)
                    SELECT id, name, cpf, password, coupon, total_sales, total_lists, goal
                    FROM user
                    WHERE cpf IS NOT NULL AND cpf != '000.000.000-00'
                ''')
            # Se não há CPFs válidos, tabela nova fica vazia (admin precisará recriar usuários)
        else:
            # Se não tem cpf na tabela antiga, não podemos migrar (não há como converter email para CPF)
            # A tabela nova ficará vazia e o admin precisará recriar os usuários com CPF
            print('Aviso: Usuários existentes serão removidos pois não há como converter email para CPF.')
            print('O administrador precisará recriar os usuários com CPF.')
        
        # Remover tabela antiga e renomear nova
        cursor.execute('DROP TABLE user')
        cursor.execute('ALTER TABLE user_new RENAME TO user')
        
        conn.commit()
        conn.close()
        print('Migração de email para cpf concluída com sucesso!')
        
    except Exception as e:
        import traceback
        print(f'Erro na migração: {str(e)}')
        print(traceback.format_exc())
        # Se der erro, deixa o db.create_all() criar a estrutura correta

def create_tables():
    with app.app_context():
        # Executar migração antes de criar tabelas
        migrate_email_to_cpf()
        db.create_all()
        create_default_admin()

if __name__ == '__main__':
    create_tables()
    # Em produção, usar variável de ambiente PORT
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)
