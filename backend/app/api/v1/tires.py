from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
from app.core.config import settings
from supabase import Client, create_client
from app.services.fleet.bulk_import import BulkImportService
import io

router = APIRouter()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# Schemas
class TireCreate(BaseModel):
    serial_number: str
    brand: str
    model: str
    size: str
    tenant_id: str
    status: Optional[str] = "stock" # stock, mounted, scrap, retreading
    initial_tread: Optional[float] = 0
    current_tread: Optional[float] = 0
    dot: Optional[str] = None

class TireResponse(BaseModel):
    id: str
    serial_number: str
    brand: str
    model: str
    size: str
    tenant_id: str
    status: str
    current_tread: Optional[float]
    created_at: str

@router.post("/tires", response_model=TireResponse, status_code=status.HTTP_201_CREATED)
async def create_tire(tire: TireCreate, supabase: Client = Depends(get_supabase)):
    """Cadastra um pneu individualmente."""
    # 1. Verificar duplicidade
    existing = supabase.table("tire_inventory") \
        .select("id") \
        .eq("tenant_id", tire.tenant_id) \
        .eq("serial_number", tire.serial_number.upper()) \
        .execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Número de série já cadastrado nesta empresa")

    # 2. Inserir
    tire_data = tire.model_dump()
    tire_data["serial_number"] = tire.serial_number.upper()
    
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
