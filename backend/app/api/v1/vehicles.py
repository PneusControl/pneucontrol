from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.core.config import get_settings
from supabase import Client, create_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


# ============================================================================
# SCHEMAS (Alinhados com o Banco de Dados - português)
# ============================================================================

class VehicleCreate(BaseModel):
    """Criação de veículo - colunas alinhadas com banco."""
    tenant_id: str
    placa: str
    tipo: str = "caminhao"  # caminhao, carreta, bitrem, etc
    marca: str
    modelo: str
    ano: Optional[int] = None
    chassi: Optional[str] = None
    km_atual: Optional[float] = Field(default=0)
    axle_configuration: Optional[Dict[str, Any]] = Field(default_factory=dict)
    total_pneus: Optional[int] = None
    status: str = "ativo"
    observacoes: Optional[str] = None


class VehicleUpdate(BaseModel):
    """Atualização parcial de veículo."""
    placa: Optional[str] = None
    tipo: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    ano: Optional[int] = None
    chassi: Optional[str] = None
    km_atual: Optional[float] = None
    axle_configuration: Optional[Dict[str, Any]] = None
    total_pneus: Optional[int] = None
    status: Optional[str] = None
    observacoes: Optional[str] = None


class VehicleResponse(BaseModel):
    """Resposta de veículo."""
    id: str
    tenant_id: str
    placa: str
    tipo: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    ano: Optional[int] = None
    chassi: Optional[str] = None
    km_atual: Optional[float] = None
    axle_configuration: Optional[Dict[str, Any]] = None
    total_pneus: Optional[int] = None
    status: Optional[str] = None
    observacoes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(vehicle: VehicleCreate, supabase: Client = Depends(get_supabase)):
    """Cadastra um novo veículo."""
    try:
        # 1. Verificar duplicidade de placa no tenant
        existing = supabase.table("vehicles")\
            .select("id")\
            .eq("tenant_id", vehicle.tenant_id)\
            .eq("placa", vehicle.placa.upper())\
            .maybe_single()\
            .execute()
        
        if existing.data:
            raise HTTPException(status_code=400, detail="Placa já cadastrada nesta empresa")

        # 2. Preparar dados
        vehicle_data = vehicle.model_dump(exclude_none=True)
        vehicle_data["placa"] = vehicle.placa.upper()
        
        # 3. Inserir
        result = supabase.table("vehicles").insert(vehicle_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Erro ao criar veículo")
        
        logger.info(f"Veículo criado: {result.data[0]['id']} - {vehicle.placa}")
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao criar veículo")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vehicles", response_model=List[VehicleResponse])
async def list_vehicles(
    tenant_id: str = Query(..., description="ID do tenant"),
    status_filter: Optional[str] = Query(None, alias="status"),
    placa_filter: Optional[str] = Query(None, alias="plate"),
    supabase: Client = Depends(get_supabase)
):
    """Lista veículos de um tenant."""
    try:
        query = supabase.table("vehicles").select("*").eq("tenant_id", tenant_id)
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        if placa_filter:
            query = query.eq("placa", placa_filter.upper())
        
        result = query.order("placa").execute()
        return result.data or []
    
    except Exception as e:
        logger.exception("Erro ao listar veículos")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, supabase: Client = Depends(get_supabase)):
    """Retorna detalhes de um veículo."""
    try:
        result = supabase.table("vehicles")\
            .select("*")\
            .eq("id", vehicle_id)\
            .maybe_single()\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Veículo não encontrado")
        
        return result.data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao buscar veículo")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: str, 
    vehicle: VehicleUpdate, 
    supabase: Client = Depends(get_supabase)
):
    """Atualiza um veículo existente."""
    try:
        # Preparar dados (remove None)
        update_data = vehicle.model_dump(exclude_none=True)
        
        if "placa" in update_data:
            update_data["placa"] = update_data["placa"].upper()
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
        
        result = supabase.table("vehicles")\
            .update(update_data)\
            .eq("id", vehicle_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Veículo não encontrado")
        
        logger.info(f"Veículo atualizado: {vehicle_id}")
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao atualizar veículo")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(vehicle_id: str, supabase: Client = Depends(get_supabase)):
    """Remove um veículo."""
    try:
        # Verificar se existe
        existing = supabase.table("vehicles")\
            .select("id")\
            .eq("id", vehicle_id)\
            .maybe_single()\
            .execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Veículo não encontrado")
        
        supabase.table("vehicles").delete().eq("id", vehicle_id).execute()
        logger.info(f"Veículo removido: {vehicle_id}")
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao deletar veículo")
        raise HTTPException(status_code=500, detail=str(e))

