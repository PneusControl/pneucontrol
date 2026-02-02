from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.core.config import get_settings
from app.services.nfe.nfe_service import NFeService
from supabase import Client, create_client
import logging
import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/nfe", tags=["NFe Import"])
settings = get_settings()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

class InvoiceItemReview(BaseModel):
    description: str
    quantity: float
    unit_price: float
    brand: Optional[str] = "N/D"
    model: Optional[str] = "N/D"
    size: Optional[str] = "N/D"
    serial_number: Optional[str] = None

class SupplierReview(BaseModel):
    cnpj: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None

class NFeReviewResponse(BaseModel):
    nfe_number: str
    series: Optional[str] = "1"
    issue_date: str
    total_amount: float
    supplier: SupplierReview
    items: List[InvoiceItemReview]

@router.post("/upload-xml")
async def upload_xml(
    tenant_id: str, 
    file: UploadFile = File(...), 
    supabase: Client = Depends(get_supabase)
):
    """Processa XML e retorna dados para revisao."""
    content = await file.read()
    try:
        service = NFeService() # Assumindo que NFeService ja lida com XML
        data = await service.process_file(content, file.filename)
        
        # Match de Fornecedor
        supplier_match = supabase.table("suppliers").select("id").eq("tenant_id", tenant_id).eq("cnpj", data["supplier"]["cnpj"]).execute()
        
        data["supplier"]["exists"] = len(supplier_match.data) > 0
        if data["supplier"]["exists"]:
            data["supplier"]["id"] = supplier_match.data[0]["id"]

        return data
    except Exception as e:
        logger.exception("Erro no upload XML")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload-pdf")
async def upload_pdf(
    tenant_id: str, 
    file: UploadFile = File(...), 
    supabase: Client = Depends(get_supabase)
):
    """Processa PDF via OCR e retorna dados para revisao."""
    # Similar ao XML mas usando OCR service
    content = await file.read()
    try:
        service = NFeService()
        data = await service.process_file(content, file.filename) # Service ja deve rotear para OCR se PDF
        return data
    except Exception as e:
        logger.exception("Erro no upload PDF")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/confirm")
async def confirm_import(
    tenant_id: str,
    data: Dict[str, Any],
    supabase: Client = Depends(get_supabase)
):
    """Confirma a importacao, cria fornecedor se necessario e injeta pneus no inventario."""
    try:
        # 1. Garantir Fornecedor
        supplier_cnpj = data["supplier"]["cnpj"]
        res_supp = supabase.table("suppliers").select("id").eq("tenant_id", tenant_id).eq("cnpj", supplier_cnpj).execute()
        
        if not res_supp.data:
            # Criar fornecedor se nao existir
            new_supp = {
                "tenant_id": tenant_id,
                "cnpj": supplier_cnpj,
                "razao_social": data["supplier"]["name"],
                "contato_email": data["supplier"].get("email"),
                "contato_telefone": data["supplier"].get("phone"),
                "status": "ativo"
            }
            res_supp = supabase.table("suppliers").insert(new_supp).execute()
        
        supplier_id = res_supp.data[0]["id"]

        # 2. Registrar Importacao (Audit)
        import_record = {
            "tenant_id": tenant_id,
            "numero_nf": data["nfe_number"],
            "supplier_id": supplier_id,
            "valor_total": data["total_amount"],
            "data_emissao": data["issue_date"],
            "status": "finalizada",
            "quantidade_itens": len(data["items"]),
            "tipo": "xml" if data.get("source") == "xml" else "pdf"
        }
        res_import = supabase.table("nfe_imports").insert(import_record).execute()
        import_id = res_import.data[0]["id"] if res_import.data else None

        # 3. Criar Pneus no Inventario
        tires_to_create = []
        for item in data["items"]:
            qty = int(item.get("quantity", 1))
            for i in range(qty):
                # Gerar numero de serie provisorio se nao houver
                serial = item.get("serial_number") or f"PEND-{data['nfe_number']}-{i+1}"
                
                tires_to_create.append({
                    "tenant_id": tenant_id,
                    "supplier_id": supplier_id,
                    "nfe_import_id": import_id,
                    "numero_serie": serial.upper(),
                    "marca": item.get("brand", "N/D"),
                    "modelo": item.get("model", "N/D"),
                    "medida": item.get("size", "N/D"),
                    "status": "estoque",
                    "sulco_inicial": 20.0,
                    "sulco_atual": 20.0,
                    "valor_compra": item.get("unit_price", 0)
                })

        if tires_to_create:
            supabase.table("tire_inventory").insert(tires_to_create).execute()

        return {"success": True, "message": f"{len(tires_to_create)} pneus importados com sucesso."}

    except Exception as e:
        logger.exception("Erro na confirmacao NFe")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(tenant_id: str, supabase: Client = Depends(get_supabase)):
    """Retorna historico de importacoes com join de fornecedor."""
    # Usando nfe_imports
    result = supabase.table("nfe_imports").select("*, suppliers(razao_social)").eq("tenant_id", tenant_id).order("created_at", desc=True).execute()
    
    # Flattening para o frontend
    for item in result.data:
        if item.get("suppliers"):
            item["supplier_name"] = item["suppliers"]["razao_social"]
        # Alias para compatibilidade frontend
        item["invoice_number"] = item["numero_nf"]
        item["total_amount"] = item["valor_total"]
        item["issue_date"] = item["data_emissao"]
            
    return result.data
