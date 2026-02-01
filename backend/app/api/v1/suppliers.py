from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from pydantic import BaseModel
from app.core.config import settings
from supabase import Client, create_client

router = APIRouter()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# Schemas
class SupplierCreate(BaseModel):
    name: str
    cnpj: str
    tenant_id: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class SupplierResponse(BaseModel):
    id: str
    name: str
    cnpj: str
    tenant_id: str
    created_at: str

@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier(supplier: SupplierCreate, supabase: Client = Depends(get_supabase)):
    # 1. Verificar duplicidade no mesmo tenant
    existing = supabase.table("suppliers").select("id").eq("cnpj", supplier.cnpj).eq("tenant_id", supplier.tenant_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Fornecedor ja cadastrado para esta empresa")

    # 2. Inserir
    result = supabase.table("suppliers").insert(supplier.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao criar fornecedor")
    
    return result.data[0]

@router.get("/suppliers", response_model=List[SupplierResponse])
async def list_suppliers(tenant_id: str, supabase: Client = Depends(get_supabase)):
    result = supabase.table("suppliers").select("*").eq("tenant_id", tenant_id).execute()
    return result.data

@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: str, supabase: Client = Depends(get_supabase)):
    result = supabase.table("suppliers").select("*").eq("id", supplier_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Fornecedor nao encontrado")
    return result.data[0]

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: str, supplier: SupplierCreate, supabase: Client = Depends(get_supabase)):
    result = supabase.table("suppliers").update(supplier.model_dump()).eq("id", supplier_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Fornecedor nao encontrado")
    return result.data[0]

@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier(supplier_id: str, supabase: Client = Depends(get_supabase)):
    supabase.table("suppliers").delete().eq("id", supplier_id).execute()
    return None
