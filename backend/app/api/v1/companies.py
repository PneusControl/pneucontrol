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
    Usa chamadas HTTP diretas para as Edge Functions para maior confiabilidade.
    """
    import httpx
    
    try:
        supabase_url = settings.SUPABASE_URL
        service_key = settings.SUPABASE_SERVICE_KEY
        
        headers = {
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "apikey": service_key
        }
        
        # 1. Gerar link de convite via Edge Function
        print(f"DEBUG: Gerando link de convite para {company.admin_email}...")
        
        async with httpx.AsyncClient() as client:
            # Chamar create-user
            create_user_res = await client.post(
                f"{supabase_url}/functions/v1/create-user",
                headers=headers,
                json={
                    "email": company.admin_email,
                    "tenant_id": tenant_id,
                    "full_name": company.admin_name
                },
                timeout=30.0
            )
            
            print(f"DEBUG: Status create-user: {create_user_res.status_code}")
            print(f"DEBUG: Resposta create-user: {create_user_res.text}")
            
            if create_user_res.status_code != 200:
                print(f"DEBUG ERROR: Falha ao chamar create-user: {create_user_res.text}")
                return
            
            invite_data = create_user_res.json()
            if not invite_data or "invite_link" not in invite_data:
                print(f"DEBUG ERROR: Resposta invalida de create-user: {invite_data}")
                return
            
            invite_link = invite_data["invite_link"]
            print(f"DEBUG: Link gerado: {invite_link}")

            # 2. Buscar API Key do Resend para enviar o e-mail
            resend_key = await secrets_manager.get_secret("RESEND_API_KEY")
            if not resend_key:
                print("DEBUG ERROR: RESEND_API_KEY nao encontrada")
                return
            
            print(f"DEBUG: RESEND_API_KEY obtida: {resend_key[:10]}...")

            # 3. Enviar e-mail de boas-vindas
            email_html = f"""
            <html>
                <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background-color: #f8fafc; margin: 0; padding: 0;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header com Logo -->
                        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 30px; text-align: center;">
                            <img src="https://trax.app.br/brand/logo.png" alt="Trax Prediction" style="height: 60px; margin-bottom: 10px;" />
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Bem-vindo ao Trax Prediction!</h1>
                        </div>
                        
                        <!-- Conteúdo -->
                        <div style="padding: 40px 30px;">
                            <p style="font-size: 16px; line-height: 1.6;">Olá <strong>{company.admin_name}</strong>,</p>
                            <p style="font-size: 16px; line-height: 1.6;">Sua conta para a empresa <strong>{company.razao_social}</strong> foi criada com sucesso no sistema de gestão preditiva de pneus.</p>
                            <p style="font-size: 16px; line-height: 1.6;">Para começar a gerenciar seus pneus e frotas, clique no botão abaixo para definir sua senha de acesso:</p>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{invite_link}" 
                                   style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                                   Configurar minha Senha
                                </a>
                            </div>
                            
                            <p style="font-size: 14px; color: #64748b; text-align: center;">Este link é válido por 48 horas.</p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="font-size: 12px; color: #94a3b8; margin: 0;">Se você não solicitou esta conta, ignore este email.</p>
                            <p style="font-size: 12px; color: #94a3b8; margin: 10px 0 0 0;">© 2026 Trax Prediction - Gestão Inteligente de Pneus</p>
                        </div>
                    </div>
                </body>
            </html>
            """

            print(f"DEBUG: Enviando e-mail via Edge Function para {company.admin_email}...")
            
            send_email_res = await client.post(
                f"{supabase_url}/functions/v1/send-email",
                headers=headers,
                json={
                    "to": company.admin_email,
                    "subject": f"Bem-vindo ao Pneu Control - {company.razao_social}",
                    "html": email_html,
                    "resend_api_key": resend_key
                },
                timeout=30.0
            )
            
            print(f"DEBUG: Status send-email: {send_email_res.status_code}")
            print(f"DEBUG: Resposta send-email: {send_email_res.text}")
            
            if send_email_res.status_code != 200:
                print(f"ERROR: Falha ao enviar email: {send_email_res.text}")
            else:
                print(f"SUCCESS: E-mail enviado para {company.admin_email}")

    except Exception as e:
        print(f"Erro crítico no onboarding da empresa {tenant_id}: {str(e)}")
        import traceback
        traceback.print_exc()

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
    import httpx
    
    print(f"DEBUG: Iniciando exclusao da empresa {company_id}...")
    
    try:
        supabase_url = settings.SUPABASE_URL
        service_key = settings.SUPABASE_SERVICE_KEY
        
        headers = {
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "apikey": service_key
        }
        
        # 1. Buscar os IDs dos usuarios vinculados ANTES de qualquer delete
        users_res = supabase.table("users").select("id").eq("tenant_id", company_id).execute()
        user_ids = [u["id"] for u in users_res.data]
        print(f"DEBUG: Encontrados {len(user_ids)} usuarios para limpar do Auth: {user_ids}")
        
        # 2. Verificar se o tenant existe antes de prosseguir
        tenant_check = supabase.table("tenants").select("id").eq("id", company_id).execute()
        if not tenant_check.data:
            print(f"DEBUG ERROR: Empresa {company_id} nao encontrada.")
            raise HTTPException(status_code=404, detail="Empresa não encontrada")
        
        # 3. PRIMEIRO: Deletar usuarios do Supabase Auth via Edge Function
        # Isso precisa acontecer ANTES de deletar o tenant
        if user_ids:
            print(f"DEBUG: Deletando {len(user_ids)} usuarios do Auth...")
            async with httpx.AsyncClient() as client:
                for uid in user_ids:
                    try:
                        print(f"DEBUG: Chamando delete-user para {uid}...")
                        delete_res = await client.post(
                            f"{supabase_url}/functions/v1/delete-user",
                            headers=headers,
                            json={"user_id": uid},
                            timeout=30.0
                        )
                        print(f"DEBUG: Resposta delete-user para {uid}: {delete_res.status_code}")
                        
                        if delete_res.status_code != 200:
                            print(f"WARNING: Falha ao remover usuario {uid} do Auth: {delete_res.text}")
                    except Exception as auth_err:
                        print(f"WARNING: Erro ao chamar delete-user para {uid}: {str(auth_err)}")
        
        # 4. DEPOIS: Excluir o Tenant (o cascade limpara as tabelas public.*)
        print(f"DEBUG: Deletando tenant {company_id}...")
        result = supabase.table("tenants").delete().eq("id", company_id).execute()
        
        if not result.data:
            print(f"DEBUG ERROR: Falha ao deletar tenant {company_id}.")
            raise HTTPException(status_code=500, detail="Erro ao excluir empresa")

        print(f"DEBUG: Empresa {company_id} e seus {len(user_ids)} usuarios excluidos com sucesso.")
        
    except Exception as e:
        print(f"Erro critico na exclusao da empresa: {str(e)}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Erro interno ao excluir empresa: {str(e)}")
    
    return None


@router.post("/companies/{company_id}/resend-email")
async def resend_company_onboarding(company_id: str, background_tasks: BackgroundTasks, supabase: Client = Depends(get_supabase)):
    """Reenvia o e-mail de onboarding para o admin da empresa."""
    # 1. Buscar a empresa
    res_tenant = supabase.table("tenants").select("*").eq("id", company_id).single().execute()
    if not res_tenant.data:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    tenant = res_tenant.data
    
    # 2. Buscar o usuário admin vinculado a esse tenant
    res_user = supabase.table("users").select("*").eq("tenant_id", company_id).eq("role", "admin").execute()
    if not res_user.data:
        raise HTTPException(status_code=400, detail="Usuário admin não encontrado para esta empresa.")

    user = res_user.data[0]
    
    # Mapear para o schema CompanyCreate para reuso da funcao
    mock_company = CompanyCreate(
        razao_social=tenant.get("razao_social"),
        nome_fantasia=tenant.get("nome_fantasia"),
        cnpj=tenant.get("cnpj"),
        admin_name=user.get("full_name"),
        admin_email=user.get("email"),
        plan=tenant.get("plan", "basic")
    )
    
    background_tasks.add_task(process_company_onboarding, mock_company, company_id, supabase)
    
    return {"message": "Processo de reenvio de e-mail iniciado"}
