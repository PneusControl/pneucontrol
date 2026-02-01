# Guia de Arquitetura - Pneu Control v3.0
## Vercel (Frontend) + VPS Hostinger (Backend) + Supabase

---

## 🏛️ ARQUITETURA COMPLETA

```
┌────────────────────────────────────────────────┐
│  FRONTEND (Next.js 15)                         │
│  Deploy: Vercel (Git push automático)         │
│  URL: pneucontrol.vercel.app                  │
│  Secrets: Apenas Supabase credentials         │
└──────────────────┬─────────────────────────────┘
                   │ HTTPS/API Calls
                   ▼
┌────────────────────────────────────────────────┐
│  BACKEND (FastAPI + Redis + Celery)           │
│  Deploy: VPS Hostinger + Easypanel            │
│  URL: api.pneucontrol.com.br                  │
│  Secrets: Busca do Supabase (system_config)   │
└──────────────────┬─────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐  ┌──────────────────────┐
│  SUPABASE        │  │  CLOUDFLARE R2       │
│  - PostgreSQL    │  │  - Image Storage     │
│  - Auth          │  │  - CDN Global        │
│  - Secrets DB    │  │  ⚠️ Config Manual    │
│  - Edge Funcs    │  │                      │
└──────────────────┘  └──────────────────────┘
```

---

## 📁 ESTRUTURA DE PASTAS

### Projeto Raiz
```
pneu-control/
├── web-app/                    # Next.js (Vercel)
├── backend/                    # FastAPI (VPS Hostinger)
├── docs/                       # Documentação
│   ├── PRD_PNEU_CONTROL_v3_FINAL.md
│   ├── GUIA_ARQUITETURA_v3_FINAL.md
│   └── CHECKLIST_v3_FINAL.md
└── README.md
```

### Web App (Next.js 15 - Vercel)
```
web-app/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (system)/               # System Admin (você)
│   │   └── system/
│   │       ├── dashboard/
│   │       ├── companies/
│   │       └── secrets/        # NOVO: Gestão de API Keys
│   ├── (dashboard)/            # Tenant users
│   │   ├── dashboard/
│   │   ├── suppliers/
│   │   ├── vehicles/
│   │   ├── tires/
│   │   └── inspections/
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── system/
│   │   ├── CNPJSearch.tsx
│   │   ├── CompanyForm.tsx
│   │   └── SecretsManager.tsx  # NOVO
│   ├── suppliers/
│   ├── tires/
│   └── vehicles/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── api/
│   │   └── client.ts           # Busca API_URL do Supabase
│   └── hooks/
│
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── capacitor.config.ts
└── package.json
```

### Backend (FastAPI - VPS Hostinger)
```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── system_admin.py
│   │       ├── suppliers.py
│   │       ├── vehicles.py
│   │       ├── tires.py
│   │       ├── nfe.py
│   │       ├── inspections.py
│   │       └── predictions.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── secrets.py          # NOVO: SecretsManager
│   │   └── logging.py
│   │
│   ├── services/
│   │   ├── cnpj/
│   │   │   └── brasilapi.py
│   │   ├── nfe/
│   │   │   ├── xml_parser.py
│   │   │   └── pdf_ocr.py
│   │   ├── ai/
│   │   │   └── openrouter.py
│   │   ├── prediction/
│   │   │   └── calculator.py
│   │   ├── storage/
│   │   │   └── cloudflare_r2.py
│   │   └── email/
│   │       └── resend.py       # NOVO
│   │
│   ├── tasks/
│   │   ├── celery_app.py
│   │   └── predictions.py
│   │
│   └── main.py
│
├── requirements.txt
├── Dockerfile
└── .env
```

---

## 🔐 SISTEMA DE SECRETS (SUPABASE)

### Tabela system_config

```sql
-- Já está no PRD, mas reforçando:
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,  -- Valor criptografado
    description TEXT,
    is_encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
CREATE POLICY "Only system admins can manage"
ON system_config FOR ALL
USING (auth.uid() IN (SELECT id FROM system_admins));
```

### Backend: SecretsManager

```python
# app/core/secrets.py
from cryptography.fernet import Fernet
from supabase import create_client
import os

class SecretsManager:
    def __init__(self):
        # Chave mestra (única variável sensível no .env)
        self.cipher = Fernet(os.getenv("ENCRYPTION_KEY").encode())
        
        # Cliente Supabase
        self.supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
    
    def encrypt(self, value: str) -> str:
        """Criptografa um valor"""
        return self.cipher.encrypt(value.encode()).decode()
    
    def decrypt(self, encrypted_value: str) -> str:
        """Descriptografa um valor"""
        return self.cipher.decrypt(encrypted_value.encode()).decode()
    
    async def get_secret(self, key: str) -> str:
        """
        Busca secret do Supabase e descriptografa se necessário
        
        Exemplo:
        >>> secrets = SecretsManager()
        >>> api_key = await secrets.get_secret('OPENROUTER_API_KEY')
        """
        response = self.supabase.table('system_config') \
            .select('value, is_encrypted') \
            .eq('key', key) \
            .single() \
            .execute()
        
        if not response.data:
            raise ValueError(f"Secret '{key}' not found in system_config")
        
        value = response.data['value']
        
        if response.data['is_encrypted']:
            return self.decrypt(value)
        
        return value
    
    async def set_secret(self, key: str, value: str, description: str = None, encrypt: bool = True):
        """
        Salva secret no Supabase
        
        Exemplo:
        >>> await secrets.set_secret(
        ...     'OPENROUTER_API_KEY',
        ...     'sk-or-xxx',
        ...     'OpenRouter API Key',
        ...     encrypt=True
        ... )
        """
        if encrypt:
            value = self.encrypt(value)
        
        self.supabase.table('system_config').upsert({
            'key': key,
            'value': value,
            'description': description,
            'is_encrypted': encrypt
        }).execute()

# Singleton global
secrets_manager = SecretsManager()
```

### Uso no Backend

```python
# app/services/ai/openrouter.py
from app.core.secrets import secrets_manager
from openai import OpenAI

class AIService:
    def __init__(self):
        self.client = None
    
    async def _init_client(self):
        """Inicializa cliente com API key do banco"""
        if not self.client:
            api_key = await secrets_manager.get_secret('OPENROUTER_API_KEY')
            
            self.client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key
            )
    
    async def analyze_tire(self, image_base64: str):
        await self._init_client()
        
        response = self.client.chat.completions.create(
            model="google/gemini-flash-1.5",
            messages=[...]
        )
        
        return response
```

### Frontend: Interface de Gestão de Secrets

```typescript
// components/system/SecretsManager.tsx
'use client'

import { useState } from 'react'
import { Key, Eye, EyeOff, Save } from 'lucide-react'

export function SecretsManager() {
  const [secrets, setSecrets] = useState([
    { key: 'OPENROUTER_API_KEY', description: 'API Key OpenRouter' },
    { key: 'RESEND_API_KEY', description: 'API Key Resend' },
    { key: 'R2_ACCESS_KEY_ID', description: 'Cloudflare R2 Access Key' },
    { key: 'R2_SECRET_ACCESS_KEY', description: 'Cloudflare R2 Secret' },
  ])
  
  const [showValue, setShowValue] = useState<Record<string, boolean>>({})
  
  const handleSave = async (key: string, value: string) => {
    await fetch('/api/system/secrets', {
      method: 'POST',
      body: JSON.stringify({ key, value })
    })
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestão de Secrets</h2>
      
      {secrets.map(secret => (
        <div key={secret.key} className="bg-white p-6 rounded-2xl border">
          <div className="flex items-center gap-2 mb-2">
            <Key size={18} className="text-indigo-600" />
            <h3 className="font-bold">{secret.key}</h3>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">{secret.description}</p>
          
          <div className="flex gap-2">
            <input
              type={showValue[secret.key] ? 'text' : 'password'}
              className="flex-1 px-4 py-2 rounded-xl border"
              placeholder="••••••••••••••••"
            />
            
            <button
              onClick={() => setShowValue(prev => ({
                ...prev,
                [secret.key]: !prev[secret.key]
              }))}
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              {showValue[secret.key] ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            
            <button
              onClick={() => handleSave(secret.key, '')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl"
            >
              <Save size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## ☁️ CLOUDFLARE R2 - SETUP COMPLETO

### ⚠️ PONTO DE PAUSA PARA O AGENTE

Quando o desenvolvedor chegar no Sprint 7 (Upload de Imagens), o agente deve:

```
⚠️ ATENÇÃO: Chegamos na parte de upload de imagens.

É necessário configurar o Cloudflare R2 AGORA antes de prosseguir.

MOTIVO: O Supabase Storage (plano free) oferece apenas 50MB, 
insuficiente para fotos de pneus que serão coletadas.

Por favor, siga as instruções abaixo para configurar o R2.
Quando terminar, volte aqui e digite "R2 configurado" para continuar.

INSTRUÇÕES:
[Agente deve exibir as instruções do PRD aqui]
```

### Service de Upload (Backend)

```python
# app/services/storage/cloudflare_r2.py
import boto3
from app.core.secrets import secrets_manager
from datetime import datetime
import uuid

class CloudflareR2:
    def __init__(self):
        self.client = None
    
    async def _init_client(self):
        """Inicializa cliente S3 com credenciais do banco"""
        if not self.client:
            endpoint = await secrets_manager.get_secret('R2_ENDPOINT')
            access_key = await secrets_manager.get_secret('R2_ACCESS_KEY_ID')
            secret_key = await secrets_manager.get_secret('R2_SECRET_ACCESS_KEY')
            
            self.client = boto3.client(
                's3',
                endpoint_url=endpoint,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key
            )
            
            self.bucket = await secrets_manager.get_secret('R2_BUCKET_NAME')
            self.public_url = await secrets_manager.get_secret('R2_PUBLIC_URL')
    
    async def upload_tire_photo(
        self, 
        file_bytes: bytes, 
        tenant_id: str,
        tire_id: str,
        photo_type: str  # 'lateral' ou 'tread'
    ) -> str:
        """
        Upload de foto de pneu
        
        Returns:
            URL pública da imagem
        """
        await self._init_client()
        
        # Gerar nome único
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{tenant_id}/{tire_id}/{photo_type}_{timestamp}_{uuid.uuid4().hex[:8]}.webp"
        
        # Upload
        self.client.put_object(
            Bucket=self.bucket,
            Key=filename,
            Body=file_bytes,
            ContentType='image/webp',
            CacheControl='max-age=31536000'  # 1 ano
        )
        
        # Retorna URL pública
        return f"{self.public_url}/{filename}"
    
    async def delete_photo(self, photo_url: str):
        """Deleta foto do R2"""
        await self._init_client()
        
        # Extrai filename da URL
        filename = photo_url.replace(f"{self.public_url}/", "")
        
        self.client.delete_object(
            Bucket=self.bucket,
            Key=filename
        )

# Singleton
r2_storage = CloudflareR2()
```

### Endpoint de Upload

```python
# app/api/v1/inspections.py
from fastapi import APIRouter, UploadFile, File
from app.services.storage.cloudflare_r2 import r2_storage
from PIL import Image
import io

router = APIRouter()

@router.post("/inspections/{inspection_id}/upload-photo")
async def upload_tire_photo(
    inspection_id: str,
    tire_id: str,
    photo_type: str,  # 'lateral' ou 'tread'
    file: UploadFile = File(...)
):
    """
    Upload de foto de pneu com conversão para WebP
    """
    # Lê arquivo
    contents = await file.read()
    
    # Converte para WebP (compressão)
    image = Image.open(io.BytesIO(contents))
    image = image.convert('RGB')
    
    # Redimensiona se necessário (max 1920px)
    if image.width > 1920:
        ratio = 1920 / image.width
        new_height = int(image.height * ratio)
        image = image.resize((1920, new_height), Image.Resampling.LANCZOS)
    
    # Converte para WebP
    webp_buffer = io.BytesIO()
    image.save(webp_buffer, format='WEBP', quality=85)
    webp_bytes = webp_buffer.getvalue()
    
    # Upload para R2
    photo_url = await r2_storage.upload_tire_photo(
        webp_bytes,
        tenant_id=get_current_tenant(),
        tire_id=tire_id,
        photo_type=photo_type
    )
    
    # Salva URL no banco
    await supabase.table('inspection_details') \
        .update({
            f'photo_{photo_type}_url': photo_url
        }) \
        .eq('inspection_id', inspection_id) \
        .eq('tire_id', tire_id) \
        .execute()
    
    return {
        "success": True,
        "photo_url": photo_url
    }
```

---

## 📧 RESEND - EMAIL SERVICE

### Setup

```python
# app/services/email/resend.py
import resend
from app.core.secrets import secrets_manager

class EmailService:
    def __init__(self):
        self.client = None
    
    async def _init_client(self):
        """Inicializa Resend com API key do banco"""
        if not self.client:
            api_key = await secrets_manager.get_secret('RESEND_API_KEY')
            resend.api_key = api_key
    
    async def send_welcome_email(
        self,
        to: str,
        company_name: str,
        admin_name: str,
        setup_link: str
    ):
        """
        Envia email de boas-vindas para novo admin
        """
        await self._init_client()
        
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0;">Bem-vindo ao Pneu Control</h1>
            </div>
            
            <div style="padding: 40px; background: #f9fafb;">
              <h2>Olá, {admin_name}!</h2>
              
              <p>Sua empresa <strong>{company_name}</strong> foi cadastrada com sucesso no Pneu Control.</p>
              
              <p>Para começar a usar o sistema, clique no botão abaixo e defina sua senha de acesso:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{setup_link}" 
                   style="background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: bold;">
                  Configurar Minha Conta
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Este link expira em 48 horas.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #6b7280; font-size: 12px;">
                Se você não solicitou este cadastro, ignore este email.
              </p>
            </div>
          </body>
        </html>
        """
        
        params = {
            "from": "Pneu Control <noreply@pneucontrol.com.br>",
            "to": [to],
            "subject": f"Bem-vindo ao Pneu Control - {company_name}",
            "html": html_content
        }
        
        email = resend.Emails.send(params)
        return email

# Singleton
email_service = EmailService()
```

### Uso na Edge Function

```typescript
// supabase/functions/create-user/index.ts
import { EmailService } from './email-service.ts'

// Após criar usuário e gerar link:
const emailService = new EmailService()

await emailService.sendWelcomeEmail(
  email,
  companyName,
  adminName,
  setupLink
)
```

---

## 🚀 DEPLOY

### Frontend (Vercel)

**Setup:**
1. Push código para GitHub
2. Conectar repo na Vercel
3. Configurar:
   - Framework: Next.js
   - Root Directory: `web-app`
   - Build Command: `npm run build`
   - Environment Variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
     ```
4. Deploy automático ativado ✅

**Git Workflow:**
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
# Vercel detecta e faz deploy automático!
```

---

### Backend (VPS Hostinger + Easypanel)

**Setup no Easypanel:**

1. **Criar App Python:**
   - Name: `pneu-control-api`
   - Source: GitHub repo
   - Build: Docker
   - Port: 8000

2. **Dockerfile:**
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

3. **Environment Variables (Easypanel):**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx
ENCRYPTION_KEY=[gerar com: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"]
REDIS_URL=redis://pneu-redis:6379
```

4. **Criar Redis (Easypanel):**
   - Name: `pneu-redis`
   - Type: Redis
   - Auto-link com backend

5. **Criar Celery Worker (Easypanel):**
   - Name: `pneu-celery-worker`
   - Same repo
   - CMD: `celery -A app.tasks.celery_app worker --loglevel=info`

6. **Criar Celery Beat (Easypanel):**
   - Name: `pneu-celery-beat`
   - Same repo
   - CMD: `celery -A app.tasks.celery_app beat --loglevel=info`

**Resultado:**
```
✅ pneu-control-api (FastAPI)
✅ pneu-redis (Redis)
✅ pneu-celery-worker (Tasks)
✅ pneu-celery-beat (Scheduler)
```

---

## 💰 CUSTOS ESTIMADOS

```
Frontend (Vercel):
- Free tier: Grátis (100GB bandwidth)
- Pro (se necessário): $20/mês

Backend (VPS Hostinger):
- Já possui VPS: R$ 0 adicional
- Easypanel: Grátis (self-hosted)

Database (Supabase):
- Free tier: Grátis (500MB)
- Pro (se necessário): $25/mês

Storage (Cloudflare R2):
- ~R$ 15/mês (100GB imagens)

Email (Resend):
- Free tier: 100 emails/dia
- Paid: $20/mês (50k emails)

TOTAL INICIAL: R$ 15/mês (só R2)
TOTAL ESCALADO: ~$65/mês (todos pagos)
```

---

**Versão:** 3.0 (Infraestrutura Final)  
**Última atualização:** 30 de Janeiro de 2026  
**Status:** ✅ Pronto para Implementação
