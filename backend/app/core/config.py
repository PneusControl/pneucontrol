"""
Configuracoes do backend.
Carrega variaveis de ambiente do .env (apenas Supabase + ENCRYPTION_KEY + REDIS_URL).
Secrets externos (API keys) ficam no banco via SecretsManager.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configuracoes da aplicacao."""

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str

    # Criptografia (chave Fernet para secrets no banco)
    ENCRYPTION_KEY: str

    # Redis (Celery broker + cache)
    REDIS_URL: str = "redis://localhost:6379"

    # App
    APP_NAME: str = "Pneu Control API"
    APP_VERSION: str = "3.0.0"
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retorna instancia cacheada das configuracoes."""
    return Settings()


# Instancia global para facilitar importacoes
settings = get_settings()
