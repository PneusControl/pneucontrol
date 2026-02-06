from fastapi import APIRouter, Depends, HTTPException
from supabase import Client, create_client
from app.core.config import get_settings
from typing import Dict, Any, List
from datetime import datetime, timedelta

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
        tires_in_use = in_use.count if in_use.count is not None else 0
        
        # 2. Total de pneus (para calcular saúde)
        total_tires = supabase.table("tire_inventory")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .neq("status", "descarte")\
            .execute()
        total = total_tires.count if total_tires.count is not None else 0
        
        # 3. Trocas urgentes (sulco < 3mm)
        urgent = supabase.table("tire_inventory")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .eq("status", "em_uso")\
            .lt("sulco_atual", 3.0)\
            .execute()
        urgent_count = urgent.count if urgent.count is not None else 0
        
        # 4. Alertas de pressão (inspeções com alerta_pressao = true nos últimos 7 dias)
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
        pressure_alerts = supabase.table("inspection_details")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .eq("alerta_pressao", True)\
            .gte("created_at", seven_days_ago)\
            .execute()
        pressure_alert_count = pressure_alerts.count if pressure_alerts.count is not None else 0
        
        # 5. Inspeções nos últimos 30 dias
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        recent_inspections = supabase.table("inspections")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .gte("created_at", thirty_days_ago)\
            .execute()
        inspections_count = recent_inspections.count if recent_inspections.count is not None else 0
        
        # 6. Calcular saúde da frota (% de pneus OK)
        # Pneus OK = não tem alerta de sulco (sulco >= 3mm)
        if total > 0:
            healthy_percent = round(((total - urgent_count) / total) * 100)
        else:
            healthy_percent = 100
        
        return {
            "tires_in_use": tires_in_use,
            "total_tires": total,
            "heat_alerts": pressure_alert_count,  # Renomeado semanticamente
            "urgent_replacements": urgent_count,
            "recent_inspections": inspections_count,
            "total_fleet_health": healthy_percent
        }
    except Exception as e:
        print(f"Erro ao calcular stats: {e}")
        return {
            "tires_in_use": 0,
            "total_tires": 0,
            "heat_alerts": 0,
            "urgent_replacements": 0,
            "recent_inspections": 0,
            "total_fleet_health": 100
        }


@router.get("/dashboard/brand-ranking")
async def get_brand_ranking(tenant_id: str, supabase: Client = Depends(get_supabase)):
    """Retorna ranking de marcas baseado em desempenho médio (sulco atual / sulco inicial)."""
    try:
        # Buscar todos os pneus em uso com sulco inicial e atual
        tires = supabase.table("tire_inventory")\
            .select("marca, sulco_inicial, sulco_atual")\
            .eq("tenant_id", tenant_id)\
            .eq("status", "em_uso")\
            .gt("sulco_inicial", 0)\
            .execute()
        
        # Agrupar por marca e calcular média de desgaste
        brand_stats: Dict[str, Dict] = {}
        for tire in tires.data:
            marca = tire.get("marca", "Desconhecida")
            sulco_inicial = tire.get("sulco_inicial", 1)
            sulco_atual = tire.get("sulco_atual", 0)
            
            # Percentual de vida restante
            vida_restante = (sulco_atual / sulco_inicial) * 100 if sulco_inicial > 0 else 0
            
            if marca not in brand_stats:
                brand_stats[marca] = {"count": 0, "total_vida": 0}
            brand_stats[marca]["count"] += 1
            brand_stats[marca]["total_vida"] += vida_restante
        
        # Calcular média e criar ranking
        ranking = []
        for marca, stats in brand_stats.items():
            avg_vida = stats["total_vida"] / stats["count"] if stats["count"] > 0 else 0
            ranking.append({
                "marca": marca,
                "quantidade": stats["count"],
                "vida_media_percent": round(avg_vida, 1)
            })
        
        # Ordenar por vida média (melhor primeiro)
        ranking.sort(key=lambda x: x["vida_media_percent"], reverse=True)
        
        return {"ranking": ranking[:10]}  # Top 10
    except Exception as e:
        print(f"Erro ao calcular ranking: {e}")
        return {"ranking": []}
