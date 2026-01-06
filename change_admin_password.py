"""
Script para alterar a senha do administrador
Execute: python change_admin_password.py
"""

from app import app, db, Admin
from werkzeug.security import generate_password_hash
import getpass

def change_admin_password():
    with app.app_context():
        # Buscar admin
        admin = Admin.query.filter_by(username='admin').first()
        
        if not admin:
            print("ERRO: Admin 'admin' não encontrado no banco de dados!")
            return
        
        print("=" * 60)
        print("Alterar Senha do Administrador")
        print("=" * 60)
        print(f"Usuário: {admin.username}")
        print(f"Email: {admin.email}")
        print(f"Nome: {admin.name}")
        print("=" * 60)
        
        # Solicitar nova senha
        new_password = getpass.getpass("Digite a nova senha: ")
        
        if len(new_password) < 6:
            print("ERRO: A senha deve ter pelo menos 6 caracteres!")
            return
        
        confirm_password = getpass.getpass("Confirme a nova senha: ")
        
        if new_password != confirm_password:
            print("ERRO: As senhas não coincidem!")
            return
        
        # Atualizar senha
        admin.password = generate_password_hash(new_password)
        db.session.commit()
        
        print("=" * 60)
        print("✅ Senha alterada com sucesso!")
        print("=" * 60)
        print(f"Usuário: {admin.username}")
        print("Nova senha configurada.")
        print("=" * 60)

if __name__ == '__main__':
    change_admin_password()


