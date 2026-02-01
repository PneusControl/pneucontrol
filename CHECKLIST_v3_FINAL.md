# Checklist de Implementação - Pneu Control v3.0
## Guia Prático Organizado por Funcionalidade

---

## 🎯 VISÃO GERAL

**Organização:** Por módulos e funcionalidades (sem estimativas de tempo)  
**Stack:** Next.js 15 (Vercel) + FastAPI (VPS) + Supabase  
**Deploy:** Frontend automático (Vercel) / Backend manual (Easypanel)  

---

## ✅ FASE 0: SETUP INICIAL

### 0.1 Ambiente de Desenvolvimento

```bash
# Ferramentas necessárias
- Node.js 20+
- Python 3.12+
- Docker Desktop (para testes locais)
- Git
- VSCode
- Android Studio (para mobile)
```

### 0.2 Criar Repositório

```bash
# GitHub
1. Criar repo: pneu-control
2. Clone local
3. Estrutura inicial:
   mkdir web-app backend docs
   touch README.md .gitignore
```

### 0.3 Configurar Supabase

- [ ] Criar projeto: https://supabase.com
- [ ] Copiar URL e Keys (para .env)
- [ ] **Executar SQL do schema (14 tabelas - incluindo system_config)**
- [ ] Configurar RLS policies
- [ ] Criar Edge Functions:
  - [ ] `create-user` (criação de admin da empresa)
  - [ ] `send-email` (envio de emails via Resend)

**SQL Schema Principal:**
```sql
-- 1. system_config (SECRETS)
-- 2. system_admins (VOCÊ)
-- 3. tenants (EMPRESAS)
-- 4. users (USUÁRIOS)
-- 5. suppliers (FORNECEDORES)
-- 6. vehicles (VEÍCULOS)
-- 7. tire_inventory (PNEUS)
-- 8. tire_lifecycle (VIDAS)
-- 9. inspections (INSPEÇÕES)
-- 10. inspection_details (DETALHES)
-- 11. predictions_cache (PREDIÇÕES)
-- 12. supplier_performance (RANKING)
-- 13. purchase_calendar (CALENDÁRIO)
-- 14. nfe_imports (HISTÓRICO NF)
```

### 0.4 Configurar Serviços Externos

**Resend (Email):**
- [ ] Criar conta: https://resend.com
- [ ] Verificar domínio (se tiver) ou usar domínio teste
- [ ] Gerar API Key
- [ ] **Salvar no Supabase (system_config)**

**OpenRouter (IA):**
- [ ] Criar conta: https://openrouter.ai
- [ ] Adicionar créditos ($5 inicial)
- [ ] Gerar API Key
- [ ] **Salvar no Supabase (system_config)**

**⚠️ IMPORTANTE:** NÃO salvar secrets em .env (exceto Supabase)!

### 0.5 Gerar Chave de Criptografia

```bash
# Python
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Copiar output
# Salvar em .env do backend como ENCRYPTION_KEY
```

---

## 🔧 FASE 1: BACKEND - FUNDAÇÃO

### 1.1 Setup FastAPI

- [ ] **Criar estrutura:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependências
pip install fastapi uvicorn sqlalchemy pydantic-settings
pip install openai httpx redis celery python-dotenv
pip install python-multipart pillow boto3 cryptography resend

# Salvar
pip freeze > requirements.txt
```

- [ ] **Criar main.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Pneu Control API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://pneucontrol.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "3.0.0"}
```

- [ ] **Testar:**
```bash
uvicorn app.main:app --reload
# Abrir: http://localhost:8000/docs
```

### 1.2 Sistema de Secrets

- [ ] **Criar SecretsManager:**
```python
# app/core/secrets.py
# [Código completo no GUIA_ARQUITETURA]
```

- [ ] **Popular tabela system_config:**
```sql
-- Supabase SQL Editor
INSERT INTO system_config (key, value, description, is_encrypted) VALUES
('OPENROUTER_API_KEY', '[VALOR_CRIPTOGRAFADO]', 'OpenRouter API', true),
('RESEND_API_KEY', '[VALOR_CRIPTOGRAFADO]', 'Resend API', true);

-- Para criptografar:
-- python scripts/encrypt_secret.py "sk-or-xxx"
```

- [ ] **Testar leitura de secret:**
```python
# scripts/test_secrets.py
import asyncio
from app.core.secrets import secrets_manager

async def test():
    key = await secrets_manager.get_secret('OPENROUTER_API_KEY')
    print(f"Key loaded: {key[:10]}...")

asyncio.run(test())
```

### 1.3 Service de Busca CNPJ

- [ ] **Criar BrasilAPIService:**
```python
# app/services/cnpj/brasilapi.py
# [Código completo no GUIA_ARQUITETURA]
```

- [ ] **Criar endpoint:**
```python
# app/api/v1/cnpj.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/cnpj/{cnpj}")
async def search_cnpj(cnpj: str):
    # Implementação
    pass
```

- [ ] **Registrar rota:**
```python
# app/main.py
from app.api.v1 import cnpj

app.include_router(cnpj.router, prefix="/api/v1", tags=["cnpj"])
```

- [ ] **Testar:**
```bash
curl http://localhost:8000/api/v1/cnpj/12345678000190
```

### 1.4 Rotas System Admin

- [ ] **POST /api/v1/system/companies** (criar empresa)
- [ ] **GET /api/v1/system/companies** (listar empresas)
- [ ] **GET /api/v1/system/dashboard** (estatísticas)
- [ ] **POST /api/v1/system/secrets** (salvar secret)
- [ ] **GET /api/v1/system/secrets** (listar secrets)

**Validação:**
- [ ] Criar empresa teste via Postman
- [ ] Verificar no Supabase se foi criada
- [ ] Edge Function dispara email
- [ ] Email chega na caixa

---

## 🎨 FASE 2: FRONTEND - GESTÃO DO SISTEMA

### 2.1 Setup Next.js

```bash
cd web-app
npx create-next-app@latest . --typescript --tailwind --app

# Instalar dependências
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
npm install @tanstack/react-query zustand
npm install lucide-react recharts
npm install react-hook-form zod @hookform/resolvers
```

### 2.2 Configurar Tailwind

- [ ] Criar `tailwind.config.ts` (código no PRD)
- [ ] Criar `postcss.config.js`
- [ ] Ajustar `app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #F8F9FD;
}

body {
  font-family: var(--font-inter), sans-serif;
}
```

### 2.3 Estrutura de Rotas

- [ ] Criar grupos de rotas:
```
app/
├── (auth)/
│   └── login/page.tsx
├── (system)/
│   └── system/
│       ├── dashboard/page.tsx
│       ├── companies/
│       │   ├── page.tsx
│       │   └── new/page.tsx
│       └── secrets/page.tsx
└── layout.tsx
```

### 2.4 Tela de Login

- [ ] Design seguindo protótipo (estilo Panze)
- [ ] Form com email/senha
- [ ] Integração com Supabase Auth
- [ ] Redirect para dashboard correto (system ou tenant)

### 2.5 Dashboard System Admin

**KPIs:**
- [ ] Total de empresas ativas
- [ ] Total de veículos
- [ ] Total de inspeções (30 dias)
- [ ] Consumo de IA (fotos processadas)

**Gráficos:**
- [ ] Crescimento mensal (LineChart)
- [ ] Top 5 empresas (BarChart)

### 2.6 Cadastro de Empresa

**Componente CNPJSearch:**
- [ ] Input com máscara CNPJ
- [ ] Botão "Buscar" → API /cnpj/{cnpj}
- [ ] Auto-preenche campos:
  - Razão Social
  - Nome Fantasia
  - Endereço
  - Porte
  - Regime

**Formulário:**
- [ ] Dados do Admin (Nome, Email)
- [ ] Botão "Salvar e Enviar Email"
- [ ] Feedback de sucesso

**Validação:**
- [ ] Cadastrar empresa teste
- [ ] Verificar Supabase
- [ ] Confirmar recebimento de email

### 2.7 Gestão de Secrets (Interface)

**Componente SecretsManager:**
- [ ] Lista de secrets configuráveis
- [ ] Input com show/hide (tipo password)
- [ ] Botão salvar
- [ ] Criptografia automática

**Secrets a gerenciar:**
- [ ] OPENROUTER_API_KEY
- [ ] RESEND_API_KEY
- [ ] R2_ACCESS_KEY_ID
- [ ] R2_SECRET_ACCESS_KEY

---

## 📦 FASE 3: CADASTROS BÁSICOS (TENANT)

### 3.1 Fornecedores

**Backend:**
- [ ] POST /api/v1/suppliers (criar)
- [ ] GET /api/v1/suppliers (listar)
- [ ] GET /api/v1/suppliers/{id} (detalhes)
- [ ] PUT /api/v1/suppliers/{id} (editar)
- [ ] DELETE /api/v1/suppliers/{id} (deletar)

**Frontend:**
- [ ] Página de lista (tabela com filtros)
- [ ] Formulário de cadastro
- [ ] Integração com busca CNPJ
- [ ] Modal de detalhes

**Validação:**
- [ ] Cadastrar 3 fornecedores teste
- [ ] Editar fornecedor
- [ ] Deletar fornecedor

### 3.2 Veículos

**Backend:**
- [ ] POST /api/v1/vehicles (criar)
- [ ] GET /api/v1/vehicles (listar)
- [ ] GET /api/v1/vehicles/{id} (detalhes)

**Frontend:**
- [ ] Página de lista
- [ ] Formulário com AxleConfigBuilder
- [ ] Templates de eixos:
  - [ ] 4x2 (6 pneus)
  - [ ] 6x2 (10 pneus)
  - [ ] 6x4 (10 pneus)
  - [ ] 6x6 (14 pneus)
  - [ ] Bitrem 9 eixos (38 pneus)
  - [ ] Personalizado
- [ ] Diagrama visual (SVG)

**Validação:**
- [ ] Cadastrar veículo 6x4
- [ ] Verificar configuração de eixos no JSON

### 3.3 Pneus (Manual)

**Backend:**
- [ ] POST /api/v1/tires (criar)
- [ ] GET /api/v1/tires (listar com filtros)
- [ ] GET /api/v1/tires/{id} (detalhes)
- [ ] POST /api/v1/tires/import-csv (importar CSV)

**Frontend:**
- [ ] Página de inventário (lista)
- [ ] Filtros: fornecedor, marca, status, localização
- [ ] Formulário de cadastro manual
- [ ] Upload CSV

**Template CSV:**
- [ ] Criar arquivo exemplo: `template-pneus.csv`

**Validação:**
- [ ] Cadastrar 10 pneus manualmente
- [ ] Importar 20 pneus via CSV

---

## 📄 FASE 4: ENTRADA DE NOTA FISCAL

### 4.1 Parser XML (NFe)

**Backend:**
- [ ] Service: NFEXMLParser (código no GUIA_ARQUITETURA)
- [ ] Extração de fornecedor (CNPJ, Razão Social)
- [ ] Extração de produtos (código, descrição, NCM, valor)
- [ ] Parsing inteligente de descrição:
  - [ ] Marca (MICHELIN, PIRELLI, etc)
  - [ ] Modelo (XZA3, FH01, etc)
  - [ ] Medida (295/80R22.5)

**Endpoint:**
- [ ] POST /api/v1/nfe/upload-xml
- [ ] Validação do XML
- [ ] Processamento automático:
  - [ ] Buscar/Criar fornecedor
  - [ ] Criar pneus
  - [ ] Registrar em nfe_imports

**Validação:**
- [ ] Upload de 2 XMLs reais
- [ ] Verificar criação de fornecedor
- [ ] Verificar criação de pneus
- [ ] Conferir parsing de descrição

### 4.2 OCR de PDF

**Backend:**
- [ ] Service: PDFOCR (Gemini 1.5 Flash)
- [ ] Conversão PDF → base64
- [ ] Prompt de extração estruturada
- [ ] Parse do JSON retornado

**Endpoint:**
- [ ] POST /api/v1/nfe/upload-pdf
- [ ] Mesmo processamento do XML

**Validação:**
- [ ] Upload de 2 PDFs de NF
- [ ] Verificar precisão da extração
- [ ] Comparar com XML manual

### 4.3 Frontend - Upload de NF

**Página:**
- [ ] Drag & drop (XML ou PDF)
- [ ] Preview dos dados extraídos
- [ ] Tabela de produtos identificados
- [ ] Edição antes de confirmar
- [ ] Botão "Confirmar Importação"

**Histórico:**
- [ ] Página de NFs importadas
- [ ] Filtros: fornecedor, data, tipo
- [ ] Detalhes da importação
- [ ] Log de processamento

---

## 🔍 FASE 5: INSPEÇÃO WEB

### 5.1 Formulário de Inspeção

**Backend:**
- [ ] POST /api/v1/inspections (criar cabeçalho)
- [ ] POST /api/v1/inspections/{id}/details (adicionar pneu)
- [ ] GET /api/v1/inspections (listar)
- [ ] GET /api/v1/inspections/{id} (detalhes completo)

**Frontend:**
- [ ] Página: Nova Inspeção
- [ ] Seleção de veículo
- [ ] Campo: KM do hodômetro
- [ ] Diagrama visual dos pneus (axle_configuration)
- [ ] Click em pneu → Modal de inspeção

**Modal de Inspeção Individual:**
- [ ] Posição (DD, DE, TD1, etc)
- [ ] Profundidade de sulco (mm)
- [ ] Pressão encontrada (PSI)
- [ ] Pressão recomendada (alerta se divergir)
- [ ] Checklist de avarias:
  - [ ] Ausência tampa válvula
  - [ ] Emparelhamento irregular
  - [ ] Geometria irregular
  - [ ] Desgaste irregular
  - [ ] Rolamento com folga
- [ ] Observações (text area)
- [ ] Upload de foto (próxima fase)

**Validação:**
- [ ] Criar inspeção de veículo 6x4
- [ ] Inspecionar 10 pneus
- [ ] Salvar inspeção completa
- [ ] Visualizar no histórico

### 5.2 Upload de Fotos (Cloudflare R2)

**⚠️ PONTO DE PAUSA - CONFIGURAR R2:**

Quando chegar aqui, o agente deve exibir:
```
⚠️ ATENÇÃO: Antes de prosseguir, é necessário configurar o Cloudflare R2.

MOTIVO: Supabase Storage (free) = 50MB, insuficiente para fotos.

INSTRUÇÕES:
[Exibir instruções do PRD]

Quando terminar, digite: "R2 configurado"
```

**Backend (após R2 configurado):**
- [ ] Service: CloudflareR2 (código no GUIA_ARQUITETURA)
- [ ] Conversão de imagem para WebP
- [ ] Compressão (quality 85)
- [ ] Redimensionamento (max 1920px)
- [ ] Upload para R2
- [ ] Retorno da URL pública

**Endpoint:**
- [ ] POST /api/v1/inspections/{id}/upload-photo
- [ ] Params: tire_id, photo_type (lateral/tread)
- [ ] Salva URL em inspection_details

**Frontend:**
- [ ] Botão "Fotografar" no modal
- [ ] Preview da foto
- [ ] Upload automático
- [ ] Exibição da foto salva

**Validação:**
- [ ] Upload de 10 fotos
- [ ] Verificar conversão para WebP
- [ ] Confirmar storage no R2
- [ ] Visualizar fotos na interface

### 5.3 IA de Análise de Avarias

**Backend:**
- [ ] Service: AIAnalysis (OpenRouter + Gemini Flash)
- [ ] Prompt de inspeção (código no PRD)
- [ ] Parse do JSON retornado
- [ ] Salvar em inspection_details.ai_analysis

**Endpoint:**
- [ ] POST /api/v1/analyze-tire
- [ ] Recebe: foto (base64 ou URL)
- [ ] Retorna: análise estruturada

**Frontend:**
- [ ] Botão "Analisar com IA" ao lado do upload
- [ ] Loading durante análise (~5-8s)
- [ ] Card com resultado:
  - [ ] Avarias detectadas
  - [ ] Gravidade (low/medium/high/critical)
  - [ ] Localização (sidewall, tread, etc)
  - [ ] Recomendações
  - [ ] Safety score
- [ ] Badge visual na lista de pneus

**Validação:**
- [ ] Upload de foto com bolha → IA detecta
- [ ] Upload de pneu OK → IA confirma
- [ ] Testar com 10 fotos diferentes
- [ ] Conferir precisão (target: >85%)

---

## 📊 FASE 6: MOTOR DE PREDIÇÃO

### 6.1 Cálculos Base

**Backend:**
- [ ] Service: PredictionCalculator
- [ ] Função: calculate_km_per_mm()
- [ ] Função: predict_removal()
- [ ] Função: calculate_cpk()
- [ ] Função: generate_alerts()

**Lógica:**
```python
# KM/mm
km_per_mm = (KM_atual - KM_anterior) / (Sulco_anterior - Sulco_atual)

# Projeção
tread_to_consume = current_tread - 3.0  # 3mm = ponto recapagem
km_remaining = tread_to_consume * km_per_mm
days_remaining = km_remaining / avg_km_per_day
projected_date = today + timedelta(days=days_remaining)

# Alertas
<= 7 dias: CRITICAL
<= 30 dias: URGENT
<= 60 dias: ATTENTION
> 60 dias: OK

# CPK
cpk = (custo_compra + soma_recapagens) / km_total
```

**Endpoint:**
- [ ] GET /api/v1/predictions/{tire_id} (predição de um pneu)
- [ ] POST /api/v1/predictions/recalculate (força recálculo)

**Validação:**
- [ ] Criar 2 inspeções do mesmo pneu (simular 30 dias)
- [ ] Verificar cálculo de KM/mm
- [ ] Verificar projeção de data
- [ ] Conferir CPK

### 6.2 Celery Tasks + Scheduler

**Backend:**
- [ ] Setup Celery (celery_app.py)
- [ ] Task: recalculate_all_predictions()
- [ ] Scheduler: APScheduler (diário 3h AM)
- [ ] Task: calculate_supplier_performance()

**Redis (VPS):**
- [ ] Configurar Redis no Easypanel
- [ ] Conectar backend ao Redis

**Validação:**
- [ ] Rodar task manualmente
- [ ] Verificar population de predictions_cache
- [ ] Verificar supplier_performance
- [ ] Agendar task diária

### 6.3 Dashboard de Predições

**Frontend:**
- [ ] KPI: Pneus críticos (contagem)
- [ ] KPI: Gasto previsto 90 dias (R$)
- [ ] KPI: Economia vs gestão reativa

**Calendário de Compras:**
- [ ] Gráfico de barras (6 meses)
- [ ] Breakdown por fornecedor
- [ ] Tooltip com detalhes

**Ranking de Fornecedores:**
- [ ] Tabela ordenada por CPK
- [ ] Coluna: Rendimento médio (KM/mm)
- [ ] Coluna: Pneus rastreados
- [ ] Badge de ranking (🥇🥈🥉)

**Alertas Urgentes:**
- [ ] Lista de pneus críticos
- [ ] Botão de ação rápida
- [ ] Link para detalhes do veículo

---

## 📱 FASE 7: MOBILE APP

### 7.1 Capacitor Setup

```bash
cd web-app

# Instalar Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/camera @capacitor/network @capacitor/preferences
npm install dexie  # IndexedDB

# Inicializar
npx cap init "Pneu Control" com.pneucontrol.app

# Criar plataforma Android
npx cap add android
```

**Configurar next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // IMPORTANTE para Capacitor
  images: {
    unoptimized: true
  },
  trailingSlash: true
}
```

**Criar capacitor.config.ts:**
```typescript
// [Código no PRD]
```

### 7.2 Offline Storage (Dexie.js)

**Schema:**
```javascript
// lib/offline/db.ts
import Dexie from 'dexie'

const db = new Dexie('PneuControlOffline')

db.version(1).stores({
  inspections: '++id, vehicle_id, synced, created_at',
  inspection_details: '++id, inspection_id, tire_id',
  pending_photos: '++id, tire_id, photo_base64, synced'
})
```

**Sync Manager:**
- [ ] Detectar conexão (Network API)
- [ ] Upload em lote
- [ ] Retry logic
- [ ] Feedback visual

### 7.3 Telas Mobile

**Login:**
- [ ] Seguir design do protótipo
- [ ] Form com email/senha
- [ ] Integração Supabase Auth

**Lista de Veículos:**
- [ ] Cards com placa
- [ ] Indicador de inspeções pendentes
- [ ] Busca por placa

**Diagrama do Veículo:**
- [ ] Desenho dos eixos (axle_configuration)
- [ ] Pneus coloridos por status:
  - 🟢 OK
  - 🟡 Atenção
  - 🔴 Não inspecionado
- [ ] Campo: KM atual

**Inspeção Individual:**
- [ ] Posição do pneu (DD, DE, etc)
- [ ] Campo: Pressão
- [ ] Checklist de avarias
- [ ] Botão: Fotografar (Camera API)
- [ ] Preview da foto
- [ ] Observações

**Sincronização:**
- [ ] Tela de status
- [ ] Lista de inspeções pendentes
- [ ] Botão "Sincronizar Agora"
- [ ] Progress bar

### 7.4 Build APK

```bash
# Build Next.js
npm run build

# Sincronizar com Capacitor
npx cap sync

# Abrir Android Studio
npx cap open android

# No Android Studio:
# 1. Build > Generate Signed Bundle / APK
# 2. Selecionar APK
# 3. Configurar keystore (criar se não tiver)
# 4. Build

# APK gerado em:
# android/app/build/outputs/apk/release/app-release.apk
```

**Validação:**
- [ ] Instalar APK em device físico
- [ ] Testar login
- [ ] Criar inspeção offline (modo avião)
- [ ] Ativar Wi-Fi e verificar sync
- [ ] Testar captura de foto

---

## 🚀 FASE 8: DEPLOY PRODUÇÃO

### 8.1 Frontend (Vercel)

**Setup Inicial:**
- [ ] Push código para GitHub
- [ ] Conectar repo na Vercel: https://vercel.com
- [ ] Configurar:
  - Framework: Next.js
  - Root Directory: `web-app`
  - Build Command: `npm run build`
  - Output Directory: `.next`

**Environment Variables (Vercel):**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

- [ ] Primeiro deploy (automático)
- [ ] Testar: https://pneucontrol.vercel.app
- [ ] Deploy automático ativado ✅

**Domínio Customizado (Opcional):**
- [ ] Vercel → Settings → Domains
- [ ] Add: pneucontrol.com.br
- [ ] Configurar DNS (CNAME → Vercel)
- [ ] SSL automático

### 8.2 Backend (VPS Hostinger + Easypanel)

**Preparar Código:**
- [ ] Criar `Dockerfile` (código no GUIA_ARQUITETURA)
- [ ] Criar `requirements.txt` atualizado
- [ ] Commit e push

**Easypanel:**
- [ ] Acessar painel Easypanel
- [ ] Criar App: `pneu-control-api`
- [ ] Source: GitHub repo
- [ ] Build: Docker
- [ ] Port: 8000

**Environment Variables (Easypanel):**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx
ENCRYPTION_KEY=[sua_chave]
REDIS_URL=redis://pneu-redis:6379
```

**Criar Redis (Easypanel):**
- [ ] New Service → Redis
- [ ] Name: `pneu-redis`
- [ ] Auto-link com backend

**Criar Workers (Easypanel):**
- [ ] Service: `pneu-celery-worker`
  - CMD: `celery -A app.tasks.celery_app worker --loglevel=info`
- [ ] Service: `pneu-celery-beat`
  - CMD: `celery -A app.tasks.celery_app beat --loglevel=info`

**Validação:**
- [ ] API responde: https://api.pneucontrol.com.br/health
- [ ] Swagger UI: https://api.pneucontrol.com.br/docs
- [ ] Redis conectado
- [ ] Celery workers rodando

### 8.3 Testes em Produção

**Frontend:**
- [ ] Login funciona
- [ ] Cadastro de empresa funciona
- [ ] Dashboard carrega
- [ ] API calls funcionam

**Backend:**
- [ ] Health check OK
- [ ] Busca CNPJ funciona
- [ ] Secrets carregam do banco
- [ ] Upload de imagens (R2) funciona
- [ ] IA de avarias funciona
- [ ] Celery tasks executam

**Mobile:**
- [ ] APK instala
- [ ] Login funciona
- [ ] Inspeção offline funciona
- [ ] Sincronização funciona

---

## ✅ CHECKLIST FINAL DE VALIDAÇÃO

### Funcionalidades Core

**Gestão do Sistema:**
- [ ] Login como system admin
- [ ] Dashboard master com KPIs
- [ ] Cadastro de empresa
- [ ] Email de boas-vindas chega
- [ ] Gestão de secrets

**Cadastros:**
- [ ] Fornecedores (CRUD completo)
- [ ] Veículos (com templates de eixos)
- [ ] Pneus (manual + CSV + NF)

**Entrada de NF:**
- [ ] Upload XML (parsing)
- [ ] Upload PDF (OCR)
- [ ] Cadastro automático de fornecedor
- [ ] Cadastro automático de pneus

**Inspeção:**
- [ ] Web: formulário completo
- [ ] Mobile: offline-first
- [ ] Upload de fotos (R2)
- [ ] IA de avarias

**Predição:**
- [ ] Cálculo de KM/mm
- [ ] Projeção de troca
- [ ] CPK
- [ ] Alertas
- [ ] Celery task diário

**Dashboard:**
- [ ] KPIs principais
- [ ] Calendário de compras
- [ ] Ranking de fornecedores
- [ ] Relatórios PDF

### Performance

- [ ] API < 300ms (p95)
- [ ] IA < 8s por foto
- [ ] Dashboard carrega < 3s
- [ ] Mobile sync < 60s para 10 inspeções

### Segurança

- [ ] RLS configurado
- [ ] Secrets no banco (criptografados)
- [ ] Edge Functions funcionando
- [ ] SSL ativo (Vercel + backend)
- [ ] Backup diário (Supabase)

### Mobile

- [ ] APK instalável
- [ ] Funciona offline
- [ ] Camera funciona
- [ ] Sincronização automática

---

## 📚 DOCUMENTOS DE REFERÊNCIA

Durante a implementação, consulte:

- **PRD v3.0:** Visão completa, funcionalidades, schema do banco
- **GUIA_ARQUITETURA v3.0:** Código de exemplo, implementações críticas
- **Este Checklist:** Ordem de execução, validações

---

## 💡 DICAS IMPORTANTES

1. **Vá por fases:** Complete uma fase antes de passar para a próxima
2. **Teste sempre:** Cada endpoint, cada tela, cada funcionalidade
3. **Consulte os docs:** Código pronto no GUIA_ARQUITETURA
4. **Secrets no banco:** NUNCA no .env (exceto Supabase)
5. **R2 pausar:** Quando chegar em upload de fotos, configurar R2 primeiro
6. **Mobile ao final:** Deixe web funcionando 100% antes

---

**Versão:** 3.0 (Infraestrutura Final)  
**Última atualização:** 30 de Janeiro de 2026  
**Status:** ✅ Pronto para Implementação

**BOA SORTE NO DESENVOLVIMENTO! 🚀**
