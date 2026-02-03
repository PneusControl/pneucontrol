from fastapi import APIRouter, Depends, HTTPException
from supabase import Client, create_client
from app.core.config import get_settings
from typing import Dict, Any

router = APIRouter()
settings = get_settings()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

@router.get("/dashboard/stats")
async def get_dashboard_stats(tenant_id: str, supabase: Client = Depends(get_supabase)):
    """Retorna estatisticas resumidas para o dashboard principal."""
    try:
        # 1. Pneus em uso
        in_use = supabase.table("tire_inventory")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .eq("status", "em_uso")\
            .execute()
        
        # 2. Alertas de calor (simulado por enquanto, ou busca de inspecoes recentes com temp alta)
        # Vamos buscar inspecoes com temperatura > 80 graus nas ultimas 24h
        heat_alerts = 0
        
        # 3. Trocas urgentes (sulco < 3mm)
        urgent = supabase.table("tire_inventory")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .lt("sulco_atual", 3.0)\
            .execute()

        return {
            "tires_in_use": in_use.count if in_use.count is not None else 0,
            "heat_alerts": heat_alerts,
            "urgent_replacements": urgent.count if urgent.count is not None else 0,
            "total_fleet_health": 95 # Percentual simulado
        }
    except Exception as e:
        print(f"Erro ao calcular stats: {e}")
        return {
            "tires_in_use": 0,
            "heat_alerts": 0,
            "urgent_replacements": 0,
            "total_fleet_health": 100
        }
