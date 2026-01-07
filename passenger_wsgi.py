"""
Passenger WSGI file for King Host shared hosting
Este arquivo é usado pelo Passenger (servidor WSGI usado pela King Host)

IMPORTANTE: Após fazer upload para o servidor, ajuste o caminho do INTERP
conforme a versão de Python disponível na sua conta King Host.
"""
import sys
import os

# Diretório base da aplicação
base_dir = os.path.dirname(os.path.abspath(__file__))

# Adiciona o diretório da aplicação ao sys.path
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

# Configura variáveis de ambiente antes de importar a aplicação
# A SECRET_KEY será gerada automaticamente pelo app.py se não existir
os.environ.setdefault('FLASK_ENV', 'production')

# Importa a aplicação Flask
from app import app as application, create_tables

# Garante que as tabelas e o admin padrão sejam criados
create_tables()
