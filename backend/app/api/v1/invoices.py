from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.core.config import get_settings
from app.core.secrets import secrets_manager
from app.services.nfe.nfe_service import NFeService
from supabase import Client, create_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

class InvoiceItem(BaseModel):
    sku: Optional[str] = None
    description: str
    qty: float
    unit_price: float
    ncm: Optional[str] = None
    serial_number: Optional[str] = None

class InvoiceConfirmRequest(BaseModel):
    tenant_id: str
    nfe_number: str
    series: str
    issue_date: str
    issuer_cnpj: str
    issuer_name: str
    total_value: float
    items: List[InvoiceItem]

@router.post("/invoices/upload")
async def upload_invoice(
    tenant_id: str, 
    file: UploadFile = File(...), 
    supabase: Client = Depends(get_supabase)
):
    """
    Endpoint de Upload. Processa o arquivo (XML ou PDF) e retorna os dados para REVISAO.
    Nao salva no banco ainda.
    """
    content = await file.read()
    
    try:
        # Tentar buscar chave do OpenRouter para PDF
        openrouter_key = None
        if file.filename.lower().endswith('.pdf'):
            try:
                openrouter_key = await secrets_manager.get_secret("OPENROUTER_API_KEY")
            except:
                logger.warning("OPENROUTER_API_KEY nao encontrada para OCR")

        service = NFeService(openrouter_key=openrouter_key)
        data = await service.process_file(content, file.filename)
        
        return {
            "success": True,
            "data": data,
            "filename": file.filename
        }
        
    except Exception as e:
        logger.exception("Erro no upload da invoice")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Erro ao processar arquivo: {str(e)}"
        )

@router.post("/invoices/confirm")
async def confirm_invoice(
    request: InvoiceConfirmRequest, 
    supabase: Client = Depends(get_supabase)
):
    """
    Endpoint de Confirmacao. Salva a nota e os pneus no banco apos revisao do usuario.
    """
    try:
        # 1. Registrar a Nota Fiscal na tabela 'invoices'
        invoice_record = {
            "tenant_id": request.tenant_id,
            "nfe_number": request.nfe_number,
            "series": request.series,
            "issuer_cnpj": request.issuer_cnpj,
            "issuer_name": request.issuer_name,
            "issue_date": request.issue_date,
            "total_value": request.total_value,
            "status": "finalizada"
        }
        
        # Upsert baseado na chave unica (tenant_id, nfe_number, series) se existir constraint
        res_invoice = supabase.table("invoices").insert(invoice_record).execute()
        
        # 2. Criar pneus no estoque (tire_inventory)
        tires_to_create = []
        for item in request.items:
            # So cria se tiver serial_number (obrigatorio para inventory)
            if item.serial_number:
                tires_to_create.append({
                    "tenant_id": request.tenant_id,
                    "serial_number": item.serial_number,
                    "brand": "Importado (NF)",
                    "model": item.description[:50], # Limitar tamanho
                    "size": "N/D",
                    "status": "stock",
                    "initial_tread": 20.0, # Default para novo
                    "current_tread": 20.0,
                    "dot": "0000"
                })

        if tires_to_create:
            supabase.table("tire_inventory").upsert(tires_to_create, on_conflict="tenant_id,serial_number").execute()

        return {
            "success": True,
            "message": "Nota Fiscal e pneus registrados com sucesso",
            "count": len(tires_to_create)
        }

    except Exception as e:
        logger.exception("Erro ao confirmar invoice")
        raise HTTPException(status_code=500, detail=f"Erro ao salvar dados: {str(e)}")

@router.get("/invoices")
async def list_invoices(tenant_id: str, supabase: Client = Depends(get_supabase)):
    result = supabase.table("invoices").select("*").eq("tenant_id", tenant_id).order("issue_date", desc=True).execute()
    return result.data
