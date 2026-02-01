from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.core.config import settings
from supabase import Client, create_client

router = APIRouter()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# Schemas
class VehicleCreate(BaseModel):
    plate: str
    brand: str
    model: str
    year: int
    tenant_id: str
    axle_configuration: Dict[str, Any]
    current_km: Optional[int] = 0

class VehicleResponse(BaseModel):
    id: str
    plate: str
    brand: str
    model: str
    year: int
    tenant_id: str
    axle_configuration: Dict[str, Any]
    current_km: int
    created_at: str

@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(vehicle: VehicleCreate, supabase: Client = Depends(get_supabase)):
    # 1. Verificar duplicidade de placa
    existing = supabase.table("vehicles").select("id").eq("plate", vehicle.plate.upper()).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Placa ja cadastrada")

    # 2. Inserir
    vehicle_data = vehicle.model_dump()
    vehicle_data["plate"] = vehicle.plate.upper()
    
    result = supabase.table("vehicles").insert(vehicle_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao criar veiculo")
    
    return result.data[0]

@router.get("/vehicles", response_model=List[VehicleResponse])
async def list_vehicles(tenant_id: str, supabase: Client = Depends(get_supabase)):
    result = supabase.table("vehicles").select("*").eq("tenant_id", tenant_id).execute()
    return result.data

@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, supabase: Client = Depends(get_supabase)):
    result = supabase.table("vehicles").select("*").eq("id", vehicle_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Veiculo nao encontrado")
    return result.data[0]

@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(vehicle_id: str, vehicle: VehicleCreate, supabase: Client = Depends(get_supabase)):
    vehicle_data = vehicle.model_dump()
    vehicle_data["plate"] = vehicle.plate.upper()
    
    result = supabase.table("vehicles").update(vehicle_data).eq("id", vehicle_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Veiculo nao encontrado")
    return result.data[0]

@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(vehicle_id: str, supabase: Client = Depends(get_supabase)):
    supabase.table("vehicles").delete().eq("id", vehicle_id).execute()
    return None
