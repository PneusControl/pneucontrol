from fastapi import APIRouter, Depends
from supabase import Client, create_client
from app.core.config import get_settings
from typing import List, Dict, Any
from datetime import datetime, timedelta

router = APIRouter()
settings = get_settings()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


@router.get("/predictions/wear-history")
async def get_wear_history(tenant_id: str, supabase: Client = Depends(get_supabase)):
    """
    Retorna histórico de desgaste agregado dos últimos 6 meses.
    Usado para gráficos de tendência no dashboard.
    """
    try:
        # Buscar inspeções dos últimos 6 meses
        six_months_ago = (datetime.now() - timedelta(days=180)).isoformat()
        
        inspections = supabase.table("inspection_details")\
            .select("created_at, sulco_medio")\
            .eq("tenant_id", tenant_id)\
            .gte("created_at", six_months_ago)\
            .order("created_at")\
            .execute()
        
        # Agregar por mês
        monthly_data: Dict[str, List[float]] = {}
        for insp in inspections.data:
            date = datetime.fromisoformat(insp["created_at"].replace("Z", "+00:00"))
            month_key = date.strftime("%Y-%m")
            sulco = insp.get("sulco_medio") or 0
            
            if month_key not in monthly_data:
                monthly_data[month_key] = []
            monthly_data[month_key].append(sulco)
        
        # Calcular média por mês
        result = []
        for month, values in sorted(monthly_data.items()):
            avg_sulco = sum(values) / len(values) if values else 0
            result.append({
                "month": month,
                "sulco_medio": round(avg_sulco, 2),
                "inspections_count": len(values)
            })
        
        return {"history": result}
    except Exception as e:
        print(f"Erro ao buscar histórico: {e}")
        return {"history": []}


@router.get("/predictions/tire-lifecycle")
async def get_tire_lifecycle(tenant_id: str, limit: int = 10, supabase: Client = Depends(get_supabase)):
    """
    Retorna previsão de vida útil dos pneus com base em desgaste.
    Ordenado por pneus que precisam de troca mais urgente.
    """
    try:
        # Buscar pneus em uso com dados de sulco
        tires = supabase.table("tire_inventory")\
            .select("id, numero_serie, marca, modelo, sulco_inicial, sulco_atual, km_rodados")\
            .eq("tenant_id", tenant_id)\
            .eq("status", "em_uso")\
            .gt("sulco_inicial", 0)\
            .order("sulco_atual")\
            .limit(limit)\
            .execute()
        
        predictions = []
        for tire in tires.data:
            sulco_inicial = tire.get("sulco_inicial", 1)
            sulco_atual = tire.get("sulco_atual", 0)
            km_rodados = tire.get("km_rodados", 0)
            
            # Calcular vida restante percentual
            vida_percent = (sulco_atual / sulco_inicial) * 100 if sulco_inicial > 0 else 0
            
            # Estimar km restantes (se tiver km_rodados)
            if km_rodados > 0 and sulco_inicial > sulco_atual:
                desgaste_por_km = (sulco_inicial - sulco_atual) / km_rodados
                # Sulco mínimo legal = 1.6mm
                sulco_restante = sulco_atual - 1.6
                km_restantes = int(sulco_restante / desgaste_por_km) if desgaste_por_km > 0 else 0
            else:
                km_restantes = None
            
            # Classificar urgência
            if sulco_atual < 2:
                urgencia = "CRÍTICO"
            elif sulco_atual < 3:
                urgencia = "URGENTE"
            elif sulco_atual < 5:
                urgencia = "ATENÇÃO"
            else:
                urgencia = "OK"
            
            predictions.append({
                "id": tire["id"],
                "numero_serie": tire.get("numero_serie", ""),
                "marca": tire.get("marca", ""),
                "modelo": tire.get("modelo", ""),
                "sulco_atual": sulco_atual,
                "vida_percent": round(vida_percent, 1),
                "km_restantes": km_restantes,
                "urgencia": urgencia
            })
        
        return {"predictions": predictions}
    except Exception as e:
        print(f"Erro ao calcular previsões: {e}")
        return {"predictions": []}
