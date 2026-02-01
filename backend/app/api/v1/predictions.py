from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from app.core.config import get_settings
from app.services.prediction.engine import PredictionService
from supabase import Client, create_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()
prediction_service = PredictionService()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

@router.get("/predictions/tire/{tire_id}")
async def get_tire_prediction(
    tire_id: str,
    tenant_id: str,
    supabase: Client = Depends(get_supabase)
):
    """
    Retorna métricas preditivas de um pneu específico.
    """
    try:
        # 1. Buscar dados do pneu
        tire_result = supabase.table("tire_inventory").select("*").eq("id", tire_id).eq("tenant_id", tenant_id).single().execute()
        if not tire_result.data:
            raise HTTPException(status_code=404, detail="Pneu não encontrado")
        
        tire = tire_result.data

        # 2. Buscar histórico de inspeções
        # Nota: Assume-se a existência da tabela inspection_details
        history_result = supabase.table("inspection_details").select(
            "created_at, tread_depth, inspections(odometer_km)"
        ).eq("tire_id", tire_id).order("created_at", desc=False).execute()

        history = []
        for item in history_result.data:
            history.append({
                "date": item["created_at"],
                "km": item["inspections"]["odometer_km"],
                "tread": item["tread_depth"]
            })

        # 3. Processar métricas
        tire_data = {
            "initial_tread": tire.get("initial_tread", 18.0),
            "initial_km": 0, # Idealmente teríamos o KM de montagem
            "cost": tire.get("purchase_price", 1200.0),
            "avg_monthly_km": 5000 # Default
        }

        metrics = prediction_service.calculate_tire_metrics(history, tire_data)
        return metrics

    except Exception as e:
        logger.exception(f"Erro ao calcular predição para pneu {tire_id}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predictions/fleet/rankings")
async def get_fleet_rankings(
    tenant_id: str,
    supabase: Client = Depends(get_supabase)
):
    """
    Retorna um ranking de performance por marca/modelo para a frota do tenant.
    """
    try:
        # 1. Buscar todos os pneus do tenant que já tenham dados de performance
        # Em uma implementação real, isso seria agregado via View no Supabase ou processado em batch
        tires_result = supabase.table("tire_inventory").select("*").eq("tenant_id", tenant_id).execute()
        
        # Aqui simplificamos: pegamos os dados atuais. No futuro, usaríamos o Celery para pré-calcular isso.
        fleet_data = []
        for tire in tires_result.data:
            if tire.get("total_km_run") and tire.get("cpk"):
                fleet_data.append({
                    "brand": tire["brand"],
                    "model": tire["model"],
                    "total_km": tire["total_km_run"],
                    "cpk": tire["cpk"]
                })

        if not fleet_data:
            return {"message": "Dados insuficientes para ranking", "rankings": []}

        rankings = prediction_service.benchmark_brands(fleet_data)
        return {"rankings": rankings}

    except Exception as e:
        logger.exception("Erro ao gerar ranking da frota")
        raise HTTPException(status_code=500, detail=str(e))
