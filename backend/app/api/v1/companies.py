from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from app.core.config import settings
from app.core.secrets import secrets_manager
from supabase import Client, create_client

router = APIRouter()

# Supabase client lazy initialization
def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# Schemas
class CompanyCreate(BaseModel):
    razao_social: str
    nome_fantasia: Optional[str] = None
    cnpj: str
    porte: Optional[str] = None
    regime_tributario: Optional[str] = None
    segmento: Optional[str] = "Transporte"
    endereco: Optional[dict] = None
    admin_name: str
    admin_email: str
    plan: Optional[str] = "basic"

class CompanyResponse(BaseModel):
    id: str
    name: str  # Frontend compatible
    razao_social: Optional[str] = None
    nome_fantasia: Optional[str] = None
    cnpj: str
    status: str
    created_at: str
    porte: Optional[str] = None
    segmento: Optional[str] = None

async def process_company_onboarding(company: CompanyCreate, tenant_id: str, supabase: Client):
    """
    Fluxo assincrono de onboarding: gera link e envia email.
    """
    try:
        # 1. Gerar link de convite via Edge Function
        res_user = supabase.functions.invoke("create-user", body={
            "email": company.admin_email,
            "tenant_id": tenant_id,
            "full_name": company.admin_name
        })
        
        invite_data = res_user.data
        if not invite_data or "invite_link" not in invite_data:
            print(f"Erro ao gerar link de convite: {invite_data}")
            return

        invite_link = invite_data["invite_link"]

        # 2. Buscar API Key do Resend para enviar o e-mail
        resend_key = await secrets_manager.get_secret("RESEND_API_KEY")

        # 3. Enviar e-mail de boas-vindas
        email_html = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <h1 style="color: #2563eb;">Bem-vindo ao Pneu Control!</h1>
                <p>Olá <strong>{company.admin_name}</strong>,</p>
                <p>Sua conta para a empresa <strong>{company.razao_social}</strong> foi criada com sucesso.</p>
                <p>Para começar a gerenciar seus pneus e frotas, clique no botão abaixo para definir sua senha:</p>
                <div style="margin: 30px 0;">
                    <a href="{invite_link}" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                       Configurar minha Senha
                    </a>
                </div>
                <p>Este link é válido por 48 horas.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">Se você não solicitou esta conta, ignore este email.</p>
            </body>
        </html>
        """

        supabase.functions.invoke("send-email", body={
            "to": company.admin_email,
            "subject": f"Bem-vindo ao Pneu Control - {company.razao_social}",
            "html": email_html,
            "resend_api_key": resend_key
        })

    except Exception as e:
        print(f"Erro crítico no onboarding da empresa {tenant_id}: {str(e)}")

@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(company: CompanyCreate, background_tasks: BackgroundTasks, supabase: Client = Depends(get_supabase)):
    """
    Cria uma nova empresa (tenant) e agenda o onboarding (link + email).
    """
    # 1. Verificar se CNPJ ja existe
    existing = supabase.table("tenants").select("id").eq("cnpj", company.cnpj).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CNPJ ja cadastrado"
        )
    
    # 2. Inserir em tenants
    new_tenant = {
        "nome_fantasia": company.nome_fantasia or company.razao_social,
        "razao_social": company.razao_social,
        "cnpj": company.cnpj,
        "porte": company.porte,
        "regime_tributario": company.regime_tributario,
        "segmento": company.segmento,
        "endereco": company.endereco,
        "status": "active",
        "max_vehicles": 100
    }
    
    result = supabase.table("tenants").insert(new_tenant).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar empresa"
        )
    
    tenant_id = result.data[0]["id"]
    
    # 3. Agendar onboarding em background para não travar a resposta da API
    background_tasks.add_task(process_company_onboarding, company, tenant_id, supabase)
    
    # Map for response
    resp = result.data[0]
    resp["name"] = resp.get("nome_fantasia") or resp.get("razao_social")
    
    return resp

@router.get("/companies", response_model=List[CompanyResponse])
async def list_companies(supabase: Client = Depends(get_supabase)):
    """Lista todas as empresas."""
    result = supabase.table("tenants").select("*").execute()
    
    # Map fields for frontend
    for item in result.data:
        item["name"] = item.get("nome_fantasia") or item.get("razao_social")
        
    return result.data

@router.get("/companies/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: str, supabase: Client = Depends(get_supabase)):
    """Busca detalhes de uma empresa especifica."""
    result = supabase.table("tenants").select("*").eq("id", company_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa nao encontrada")
    
    resp = result.data[0]
    resp["name"] = resp.get("nome_fantasia") or resp.get("razao_social")
    
    return resp

@router.put("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: str, company: CompanyCreate, supabase: Client = Depends(get_supabase)):
    """Atualiza dados de uma empresa."""
    update_data = {
        "nome_fantasia": company.nome_fantasia or company.razao_social,
        "razao_social": company.razao_social,
        "porte": company.porte,
        "regime_tributario": company.regime_tributario,
        "segmento": company.segmento,
        "endereco": company.endereco
    }
    
    result = supabase.table("tenants").update(update_data).eq("id", company_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    resp = result.data[0]
    resp["name"] = resp.get("nome_fantasia") or resp.get("razao_social")
    return resp

@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(company_id: str, supabase: Client = Depends(get_supabase)):
    """Exclui uma empresa e todos os dados relacionados (incluindo usuarios)."""
    # 1. Buscar IDs de usuarios para remover do Auth do Supabase
    users = supabase.table("users").select("id").eq("tenant_id", company_id).execute()
    
    # Nota: A remocao do auth.users deve ser feita via Admin API ou Edge Function
    # Como as tabelas tem ON DELETE CASCADE, deletar o tenant limpa o banco principal.
    
    result = supabase.table("tenants").delete().eq("id", company_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    # 2. (Opcional/Recomendado) Chamar limpeza de auth.users via Edge Function
    # Por enquanto, focamos na limpeza do banco de dados que ja tem os cascades.
    
    return None
