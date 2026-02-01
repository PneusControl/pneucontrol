#!/usr/bin/env python3
"""
Script utilitario para criptografar secrets antes de inserir no banco.

Uso:
    python scripts/encrypt_secret.py "sk-or-v1-xxxxx"
"""

import sys
from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

# Carrega .env
load_dotenv()

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    print("ERRO: ENCRYPTION_KEY nao encontrada no .env")
    sys.exit(1)

if len(sys.argv) < 2:
    print("Uso: python scripts/encrypt_secret.py 'valor_para_criptografar'")
    sys.exit(1)

valor = sys.argv[1]

cipher = Fernet(ENCRYPTION_KEY.encode())
encrypted = cipher.encrypt(valor.encode()).decode()

print(f"\n✅ Valor criptografado:\n{encrypted}\n")
print("Cole este valor na coluna 'value' da tabela system_config.")
