from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.core.config import get_settings
from app.services.storage.r2 import R2Service
from app.services.ai.vision import VisionAnalysisService
from supabase import Client, create_client
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

class InspectionItem(BaseModel):
    tire_id: str
    tread_depth: float
    pressure: Optional[float] = None
    status: str = "ok" # ok, warning, critical
    observations: Optional[str] = None

class InspectionCreate(BaseModel):
    tenant_id: str
    vehicle_id: str
    inspector_id: str
    odometer_km: float
    items: List[InspectionItem]

@router.post("/inspections", status_code=status.HTTP_201_CREATED)
async def create_inspection(
    request: InspectionCreate,
    supabase: Client = Depends(get_supabase)
):
    """
    Registra uma inspecao completa de um veiculo.
    Atualiza o hodometro do veiculo e o sulco/status de cada pneu.
    """
    try:
        # 1. Registrar a inspecao mestre
        inspection_id = str(uuid.uuid4())
        inspection_record = {
            "id": inspection_id,
            "tenant_id": request.tenant_id,
            "vehicle_id": request.vehicle_id,
            "inspector_id": request.inspector_id,
            "odometer_km": request.odometer_km,
            "status": "concluida"
        }
        
        supabase.table("inspections").insert(inspection_record).execute()

        # 2. Atualizar KM do veículo
        supabase.table("vehicles").update({"current_km": request.odometer_km}).eq("id", request.vehicle_id).execute()

        # 3. Registrar medições e atualizar inventario
        for item in request.items:
            # Registrar item da inspecão
            supabase.table("inspection_details").insert({
                "inspection_id": inspection_id,
                "tire_id": item.tire_id,
                "tread_depth": item.tread_depth,
                "pressure": item.pressure,
                "status": item.status,
                "observations": item.observations
            }).execute()
            
            # Atualizar inventario de pneus
            supabase.table("tire_inventory").update({
                "current_tread": item.tread_depth,
                "last_inspection_at": "now()" # Opcional: timestamp
            }).eq("id", item.tire_id).execute()

        return {"success": True, "id": inspection_id}
    
    except Exception as e:
        logger.exception("Erro ao criar inspecao")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/inspections/analyze-damage")
async def analyze_damage(
    tenant_id: str,
    tire_id: str,
    file: UploadFile = File(...),
):
    """
    Fluxo de Analise de Avaria: Upload R2 -> IA Vision -> Registro no Banco.
    """
    try:
        # 1. Upload para R2
        storage = R2Service()
        file_content = await file.read()
        filename = f"inspections/{tenant_id}/{tire_id}/{uuid.uuid4()}.jpg"
        photo_url = await storage.upload_file(file_content, filename, file.content_type)

        # 2. Analise via IA
        ai_service = VisionAnalysisService() # Vai buscar do SecretsManager
        analysis = await ai_service.analyze_tire_photo(photo_url)

        # 3. Salvar registro de avaria no Supabase
        # Nota: Presume-se que a tabela tire_damages existe
        supabase = get_supabase()
        damage_record = {
            "tire_id": tire_id,
            "tenant_id": tenant_id,
            "photo_url": photo_url,
            "ai_analysis": analysis,
            "severity": analysis.get("severity", "baixa"),
            "recommendation": analysis.get("recommendation")
        }
        
        result = supabase.table("tire_damages").insert(damage_record).execute()
        
        return {
            "success": True,
            "photo_url": photo_url,
            "analysis": analysis
        }

    except Exception as e:
        logger.exception("Erro na analise de avaria")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inspections")
async def list_inspections(tenant_id: str, supabase: Client = Depends(get_supabase)):
    """Lista historico de inspecoes de um tenant."""
    result = supabase.table("inspections").select("*, vehicles(plate)").eq("tenant_id", tenant_id).order("created_at", desc=True).execute()
    return result.data
