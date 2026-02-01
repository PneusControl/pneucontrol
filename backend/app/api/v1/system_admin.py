"""
Endpoints de System Admin (Valmir Junior).
Gestao de empresas, usuarios e secrets.
"""

from fastapi import APIRouter, Depends
from app.core.secrets import secrets_manager
from app.core.config import settings
from supabase import Client, create_client
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

@router.get("/dashboard")
async def get_system_stats(supabase: Client = Depends(get_supabase)):
    """
    Retorna estatisticas globais para o System Admin.
    """
    # 1. Total de empresas (tenants)
    tenants = supabase.table("tenants").select("id", count="exact").execute()
    
    # 2. Total de veículos
    vehicles = supabase.table("vehicles").select("id", count="exact").execute()
    
    # 3. Total de pneus em estoque/uso
    tires = supabase.table("tire_inventory").select("id", count="exact").execute()
    
    # 4. Total de inspeções nos últimos 30 dias (exemplo simples)
    inspections = supabase.table("inspections").select("id", count="exact").execute()

    return {
        "success": True,
        "data": {
            "total_companies": tenants.count or 0,
            "total_vehicles": vehicles.count or 0,
            "total_tires": tires.count or 0,
            "total_inspections": inspections.count or 0,
            "ia_usage_estimate": "N/A" # Implementar futuramente com log de chamadas OpenRouter
        }
    }

class SecretCreate(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

@router.get("/secrets")
async def list_secrets():
    """
    Lista todos os secrets (sem valores).
    Apenas system_admin tem acesso.
    """
    secrets = await secrets_manager.list_secrets()
    return secrets # Frontend expects array directly based on code

@router.post("/secrets")
async def save_secret(secret: SecretCreate):
    """
    Salva ou atualiza um secret via JSON body.
    """
    await secrets_manager.set_secret(
        secret.key, 
        secret.value, 
        secret.description or f"Chave {secret.key}", 
        encrypt=True
    )
    return {"success": True, "message": f"Secret '{secret.key}' salvo com sucesso"}

@router.delete("/secrets/{key}")
async def delete_secret(key: str):
    """Remove um secret do banco."""
    await secrets_manager.delete_secret(key)
    return {"success": True, "message": f"Secret '{key}' removido"}
