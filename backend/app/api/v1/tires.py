from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
from app.core.config import get_settings
from supabase import Client, create_client
from app.services.fleet.bulk_import import BulkImportService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# Schemas
class TireCreate(BaseModel):
    numero_serie: str
    marca: str
    modelo: str
    medida: str
    tenant_id: str
    supplier_id: Optional[str] = None
    status: Optional[str] = "estoque" 
    sulco_inicial: Optional[float] = 20.0
    sulco_atual: Optional[float] = 20.0
    dot: Optional[str] = None
    valor_compra: Optional[float] = 0.0
    numero_fogo: Optional[str] = None

class TireResponse(BaseModel):
    id: str
    numero_serie: str
    marca: str
    modelo: str
    medida: str
    tenant_id: str
    status: str
    sulco_atual: Optional[float]
    created_at: str

@router.post("/tires", response_model=TireResponse, status_code=status.HTTP_201_CREATED)
async def create_tire(tire: TireCreate, supabase: Client = Depends(get_supabase)):
    """Cadastra um pneu individualmente."""
    # 1. Verificar duplicidade
    existing = supabase.table("tire_inventory") \
        .select("id") \
        .eq("tenant_id", tire.tenant_id) \
        .eq("numero_serie", tire.numero_serie.upper()) \
        .execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Número de série já cadastrado nesta empresa")

    # 2. Inserir
    tire_data = tire.model_dump()
    tire_data["numero_serie"] = tire.numero_serie.upper()
    
    result = supabase.table("tire_inventory").insert(tire_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao cadastrar pneu")
    
    return result.data[0]

@router.get("/tires", response_model=List[TireResponse])
async def list_tires(tenant_id: str, supabase: Client = Depends(get_supabase)):
    """Lista pneus de um tenant."""
    result = supabase.table("tire_inventory").select("*").eq("tenant_id", tenant_id).execute()
    return result.data

@router.post("/tires/bulk-import")
async def import_tires(tenant_id: str, file: UploadFile = File(...), supabase: Client = Depends(get_supabase)):
    """Importação massiva de pneus via CSV."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Arquivo deve ser um CSV")
        
    content = await file.read()
    string_content = content.decode("utf-8")
    
    service = BulkImportService(supabase)
    result = await service.import_tires_csv(tenant_id, string_content)
    
    if not result["success"] and result["counts"]["success"] == 0:
        raise HTTPException(status_code=400, detail={"message": "Falha na importação", "errors": result["errors"]})
        
    return result
