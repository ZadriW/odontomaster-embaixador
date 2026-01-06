"""
Odonto Master - Servidor de Produção com Waitress
Este script inicia o servidor Flask usando Waitress (compatível com Windows)

Uso:
    python run_server.py
    
Variáveis de ambiente:
    PORT: Porta do servidor (padrão: 5000)
    HOST: Host do servidor (padrão: 0.0.0.0)
    THREADS: Número de threads (padrão: 4)
    SECRET_KEY: Chave secreta para sessões (OBRIGATÓRIO em produção)
"""

import os
import sys
import logging
from datetime import datetime
from waitress import serve
from app import app, create_tables

def setup_logging():
    """Configura sistema de logs"""
    # Criar pasta de logs se não existir
    logs_dir = os.path.join(os.path.dirname(__file__), 'logs')
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir)
    
    # Configurar logging
    log_file = os.path.join(logs_dir, f'server_{datetime.now().strftime("%Y%m%d")}.log')
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    return logging.getLogger(__name__)

def main():
    # Configurar logging
    logger = setup_logging()
    
    # Criar tabelas do banco de dados se não existirem
    logger.info('Inicializando banco de dados...')
    create_tables()
    
    # Configurações do servidor
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    threads = int(os.environ.get('THREADS', 4))
    
    # Verificar se SECRET_KEY está configurada
    secret_key = os.environ.get('SECRET_KEY')
    if not secret_key or secret_key == 'odonto-master-secret-key-2025-dev-change-in-production':
        logger.warning('=' * 60)
        logger.warning('[AVISO] SECRET_KEY nao esta configurada!')
        logger.warning('   Em producao, defina uma SECRET_KEY segura:')
        logger.warning('   set SECRET_KEY=sua-chave-secreta-aqui')
        logger.warning('=' * 60)
    
    logger.info('=' * 60)
    logger.info('Odonto Master - Servidor de Producao')
    logger.info('=' * 60)
    logger.info(f'   Host: {host}')
    logger.info(f'   Porta: {port}')
    logger.info(f'   Threads: {threads}')
    logger.info(f'   URL: http://{host}:{port}')
    logger.info('=' * 60)
    logger.info('Rotas disponiveis:')
    logger.info(f'   - Login Embaixador: http://{host}:{port}/login')
    logger.info(f'   - Login Admin:      http://{host}:{port}/admin/login')
    logger.info('=' * 60)
    logger.info('Servidor iniciado com sucesso!')
    logger.info('Pressione Ctrl+C para parar o servidor')
    logger.info('=' * 60)
    
    # Iniciar servidor Waitress
    try:
        serve(
            app,
            host=host,
            port=port,
            threads=threads,
            url_scheme='https',  # Assume que haverá proxy HTTPS
            ident='OdontoMaster',
            _quiet=False  # Mostra logs de requisições
        )
    except KeyboardInterrupt:
        logger.info('Servidor encerrado pelo usuario.')
    except Exception as e:
        logger.error(f'Erro ao iniciar servidor: {e}')
        sys.exit(1)

if __name__ == '__main__':
    main()
