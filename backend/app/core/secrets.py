"""
SecretsManager - Gerenciador de secrets criptografados.
Busca API keys e configuracoes sensiveis da tabela system_config no Supabase.
Usa criptografia Fernet para proteger valores em repouso.

Uso:
    from app.core.secrets import secrets_manager
    api_key = await secrets_manager.get_secret('OPENROUTER_API_KEY')
"""

from cryptography.fernet import Fernet
from supabase import create_client, Client
from app.core.config import get_settings
from typing import Optional


class SecretsManager:
    """Gerencia secrets criptografados armazenados no Supabase."""

    def __init__(self):
        self._cipher: Optional[Fernet] = None
        self._supabase: Optional[Client] = None

    def _init(self):
        """Inicializa cipher e cliente Supabase (lazy loading)."""
        if self._cipher is None:
            settings = get_settings()
            self._cipher = Fernet(settings.ENCRYPTION_KEY.encode())
            self._supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY,
            )

    def encrypt(self, value: str) -> str:
        """Criptografa um valor com Fernet."""
        self._init()
        return self._cipher.encrypt(value.encode()).decode()

    def decrypt(self, encrypted_value: str) -> str:
        """Descriptografa um valor criptografado com Fernet."""
        self._init()
        return self._cipher.decrypt(encrypted_value.encode()).decode()

    async def get_secret(self, key: str) -> str:
        """
        Busca secret do Supabase e descriptografa se necessario.

        Args:
            key: Nome da chave (ex: 'OPENROUTER_API_KEY')

        Returns:
            Valor descriptografado do secret.

        Raises:
            ValueError: Se a chave nao for encontrada.
        """
        self._init()

        response = (
            self._supabase.table("system_config")
            .select("value, is_encrypted")
            .eq("key", key)
            .single()
            .execute()
        )

        if not response.data:
            raise ValueError(f"Secret '{key}' not found in system_config")

        value = response.data["value"]

        if response.data["is_encrypted"]:
            return self.decrypt(value)

        return value

    async def set_secret(
        self,
        key: str,
        value: str,
        description: str = None,
        encrypt: bool = True,
    ):
        """
        Salva ou atualiza secret no Supabase.

        Args:
            key: Nome da chave
            value: Valor a ser armazenado
            description: Descricao do secret
            encrypt: Se True, criptografa o valor antes de salvar
        """
        self._init()

        stored_value = self.encrypt(value) if encrypt else value

        self._supabase.table("system_config").upsert(
            {
                "key": key,
                "value": stored_value,
                "description": description,
                "is_encrypted": encrypt,
            }
        ).execute()

    async def list_secrets(self) -> list:
        """
        Lista todos os secrets (sem valores descriptografados).

        Returns:
            Lista de dicts com key, description, is_encrypted, updated_at.
        """
        self._init()

        response = (
            self._supabase.table("system_config")
            .select("key, description, is_encrypted, updated_at")
            .order("key")
            .execute()
        )

        return response.data or []

    async def delete_secret(self, key: str):
        """Remove um secret do banco."""
        self._init()
        self._supabase.table("system_config").delete().eq("key", key).execute()


# Singleton global
secrets_manager = SecretsManager()
