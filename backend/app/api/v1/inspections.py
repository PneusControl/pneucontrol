from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.core.config import get_settings
from app.services.storage.r2 import R2Service
from app.services.ai.vision import VisionAnalysisService
from supabase import Client, create_client
from datetime import datetime
import uuid
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()

def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


# ============================================================================
# SCHEMAS (Alinhados com o Banco de Dados Real)
# ============================================================================

class InspectionItemCreate(BaseModel):
    """Item de inspeção para cada pneu - alinhado com inspection_details."""
    tire_id: str
    posicao_veiculo: str  # Ex: "E1D", "E1E", "E2DI", "E2DE" (obrigatório)
    sulco_interno: Optional[float] = None
    sulco_central: Optional[float] = None
    sulco_externo: Optional[float] = None
    pressao_atual: Optional[float] = None
    pressao_recomendada: Optional[float] = Field(default=110.0)  # PSI padrão caminhão
    tem_avaria: bool = False
    descricao_avaria: Optional[str] = None
    checklist_avarias: Optional[Dict[str, bool]] = None  # {"bolha": false, "corte": true}
    observacoes: Optional[str] = None


class InspectionCreate(BaseModel):
    """Criação de inspeção completa."""
    tenant_id: str
    vehicle_id: str
    inspector_id: str
    odometer_km: float
    items: List[InspectionItemCreate]


class DamageAnalysisRequest(BaseModel):
    """Request para análise de avaria por IA."""
    tenant_id: str
    tire_id: str
    inspection_id: Optional[str] = None  # Vincula a uma inspeção existente


# ============================================================================
# HELPERS
# ============================================================================

def calculate_sulco_medio(interno: float, central: float, externo: float) -> float:
    """Calcula sulco médio a partir das 3 medições."""
    values = [v for v in [interno, central, externo] if v is not None]
    return round(sum(values) / len(values), 2) if values else 0.0


def determine_alerts(sulco_medio: float, pressao_atual: float, pressao_recomendada: float) -> tuple:
    """Determina alertas de sulco e pressão."""
    alerta_sulco = sulco_medio < 3.0  # Abaixo de 3mm = alerta
    alerta_pressao = False
    if pressao_atual and pressao_recomendada:
        diff_percent = abs(pressao_atual - pressao_recomendada) / pressao_recomendada * 100
        alerta_pressao = diff_percent > 10  # Mais de 10% de diferença
    return alerta_sulco, alerta_pressao


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/inspections", status_code=status.HTTP_201_CREATED)
async def create_inspection(
    request: InspectionCreate,
    supabase: Client = Depends(get_supabase)
):
    """
    Registra uma inspeção completa de um veículo.
    Atualiza o hodômetro do veículo e o sulco/status de cada pneu.
    """
    try:
        # 1. Registrar a inspeção mestre
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
        logger.info(f"Inspeção {inspection_id} criada para veículo {request.vehicle_id}")

        # 2. Atualizar KM do veículo (usando coluna correta)
        supabase.table("vehicles").update({
            "km_atual": request.odometer_km
        }).eq("id", request.vehicle_id).execute()

        # 3. Registrar medições de cada pneu
        for item in request.items:
            # Calcular sulco médio
            sulco_medio = calculate_sulco_medio(
                item.sulco_interno, 
                item.sulco_central, 
                item.sulco_externo
            )
            
            # Determinar alertas
            alerta_sulco, alerta_pressao = determine_alerts(
                sulco_medio, 
                item.pressao_atual or 0, 
                item.pressao_recomendada or 110
            )
            
            # Registrar item da inspeção (colunas reais do banco)
            detail_record = {
                "id": str(uuid.uuid4()),
                "tenant_id": request.tenant_id,  # OBRIGATÓRIO
                "inspection_id": inspection_id,
                "tire_id": item.tire_id,
                "posicao_veiculo": item.posicao_veiculo,  # OBRIGATÓRIO
                "sulco_interno": item.sulco_interno,
                "sulco_central": item.sulco_central,
                "sulco_externo": item.sulco_externo,
                "sulco_medio": sulco_medio,
                "pressao_atual": item.pressao_atual,
                "pressao_recomendada": item.pressao_recomendada,
                "tem_avaria": item.tem_avaria,
                "descricao_avaria": item.descricao_avaria,
                "checklist_avarias": item.checklist_avarias or {},
                "alerta_sulco": alerta_sulco,
                "alerta_pressao": alerta_pressao,
                "observacoes": item.observacoes
            }
            
            supabase.table("inspection_details").insert(detail_record).execute()
            
            # Atualizar inventário de pneus (coluna correta: sulco_atual)
            supabase.table("tire_inventory").update({
                "sulco_atual": sulco_medio
            }).eq("id", item.tire_id).execute()

        return {
            "success": True, 
            "id": inspection_id,
            "items_count": len(request.items)
        }
    
    except Exception as e:
        logger.exception("Erro ao criar inspeção")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inspections/analyze-damage")
async def analyze_damage(
    tenant_id: str = Query(..., description="ID do tenant"),
    tire_id: str = Query(..., description="ID do pneu"),
    inspection_id: Optional[str] = Query(None, description="ID da inspeção para vincular"),
    file: UploadFile = File(...),
):
    """
    Fluxo de Análise de Avaria: Upload R2 -> IA Vision -> Registro em inspection_details.
    
    Nota: Em vez de usar tabela tire_damages (que não existe), 
    armazena em inspection_details.ai_analysis (JSONB).
    """
    try:
        # 1. Upload para R2
        storage = R2Service()
        file_content = await file.read()
        filename = f"inspections/{tenant_id}/{tire_id}/{uuid.uuid4()}.jpg"
        photo_url = await storage.upload_file(file_content, filename, file.content_type)
        logger.info(f"Foto uploaded: {photo_url}")

        # 2. Análise via IA
        ai_service = VisionAnalysisService()
        analysis = await ai_service.analyze_tire_photo(photo_url)
        logger.info(f"Análise IA concluída: severity={analysis.get('severity')}")

        # 3. Salvar no banco de dados
        supabase = get_supabase()
        
        # Se tem inspection_id, atualiza o item existente
        if inspection_id:
            # Buscar o inspection_detail correspondente
            existing = supabase.table("inspection_details")\
                .select("id")\
                .eq("inspection_id", inspection_id)\
                .eq("tire_id", tire_id)\
                .maybe_single()\
                .execute()
            
            if existing.data:
                # Atualizar com análise de IA
                supabase.table("inspection_details").update({
                    "photo_lateral_url": photo_url,
                    "ai_analysis": analysis,
                    "ai_severity": analysis.get("severity", "baixa"),
                    "tem_avaria": analysis.get("has_damage", False),
                    "descricao_avaria": analysis.get("description")
                }).eq("id", existing.data["id"]).execute()
                
                return {
                    "success": True,
                    "photo_url": photo_url,
                    "analysis": analysis,
                    "updated_detail_id": existing.data["id"]
                }
        
        # Se não tem inspection_id, cria uma inspeção pontual de avaria
        inspection_id = str(uuid.uuid4())
        
        # Buscar vehicle_id do pneu
        tire_info = supabase.table("tire_inventory")\
            .select("vehicle_id")\
            .eq("id", tire_id)\
            .maybe_single()\
            .execute()
        
        vehicle_id = tire_info.data.get("vehicle_id") if tire_info.data else None
        
        # Criar inspeção mestre pontual
        supabase.table("inspections").insert({
            "id": inspection_id,
            "tenant_id": tenant_id,
            "vehicle_id": vehicle_id,
            "status": "avaria_detectada"
        }).execute()
        
        # Criar detalhe com análise de IA
        detail_id = str(uuid.uuid4())
        supabase.table("inspection_details").insert({
            "id": detail_id,
            "tenant_id": tenant_id,
            "inspection_id": inspection_id,
            "tire_id": tire_id,
            "posicao_veiculo": "N/A",  # Será preenchido depois se necessário
            "photo_lateral_url": photo_url,
            "ai_analysis": analysis,
            "ai_severity": analysis.get("severity", "baixa"),
            "tem_avaria": True,
            "descricao_avaria": analysis.get("description", "Avaria detectada por IA")
        }).execute()
        
        return {
            "success": True,
            "photo_url": photo_url,
            "analysis": analysis,
            "inspection_id": inspection_id,
            "detail_id": detail_id
        }

    except Exception as e:
        logger.exception("Erro na análise de avaria")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inspections")
async def list_inspections(
    tenant_id: str = Query(..., description="ID do tenant"),
    limit: int = Query(50, ge=1, le=100),
    supabase: Client = Depends(get_supabase)
):
    """Lista histórico de inspeções de um tenant."""
    try:
        result = supabase.table("inspections")\
            .select("*, vehicles(placa)")\
            .eq("tenant_id", tenant_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        
        # Retorna lista vazia se não houver dados (evita erros)
        return result.data or []
    
    except Exception as e:
        logger.exception("Erro ao listar inspeções")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inspections/{inspection_id}")
async def get_inspection_details(
    inspection_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Retorna detalhes completos de uma inspeção."""
    try:
        # Buscar inspeção mestre
        inspection = supabase.table("inspections")\
            .select("*, vehicles(placa, modelo, marca)")\
            .eq("id", inspection_id)\
            .maybe_single()\
            .execute()
        
        if not inspection.data:
            raise HTTPException(status_code=404, detail="Inspeção não encontrada")
        
        # Buscar itens detalhados
        details = supabase.table("inspection_details")\
            .select("*, tire_inventory(dot, marca, modelo)")\
            .eq("inspection_id", inspection_id)\
            .execute()
        
        return {
            "inspection": inspection.data,
            "details": details.data or []
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao buscar detalhes da inspeção")
        raise HTTPException(status_code=500, detail=str(e))
