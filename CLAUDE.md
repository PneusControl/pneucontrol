# CLAUDE.md - Base de Conhecimento do Tech Lead

## Resumo Executivo

O **Pneu Control v3.0** e um SaaS B2B de gestao preditiva de pneus para frotas de veiculos pesados (caminhoes, carretas, bitrens). O sistema resolve um problema real e caro das transportadoras: a falta de controle sobre quando trocar pneus, qual fornecedor rende mais, e deteccao tardia de avarias que causam paradas em rodovia. O diferencial e o motor de predicao proprio (calculo de KM/mm + projecao de vida util) e a IA para analise de avarias via fotos.

O modelo de negocio e B2B direto (sem self-service). Valmir Junior e o system_admin que cadastra empresas manualmente apos validacao comercial. Cada empresa (tenant) recebe um admin que gerencia frota, gerentes e operadores. O borracheiro/operador usa o app mobile offline-first para inspecoes no patio.

A arquitetura e dividida em: Frontend (Next.js 15 na Vercel), Backend (FastAPI na VPS Hostinger via Easypanel), Supabase (PostgreSQL + Auth + Edge Functions), Cloudflare R2 (storage de imagens), Redis (cache/tasks) e Resend (emails). Os secrets ficam criptografados no banco (tabela system_config), nao em variaveis de ambiente.

O desenvolvimento segue 9 fases (0-8): Setup Inicial, Backend Fundacao, Frontend Gestao do Sistema, Cadastros Basicos, Entrada de NF, Inspecao Web, Motor de Predicao, Mobile App e Deploy Producao. A entrada automatizada de NF (XML parser + OCR de PDF) e um dos grandes diferenciais - zero digitacao para cadastrar pneus.

O faturamento projetado e R$ 799-2.499/mes por empresa, com custo operacional inicial de apenas ~R$ 15/mes (Cloudflare R2). Todo o codigo de referencia dos servicos criticos ja esta pronto no GUIA_ARQUITETURA.

---

## Stack Tecnica

### Frontend (Deploy: Vercel - automatico via Git)
- **Next.js 15** (App Router) - Framework React com SSR/SSG
- **TypeScript** - Tipagem estatica
- **Tailwind CSS** - Estilizacao utility-first (tema Panze do prototipo)
- **Lucide React** - Icones
- **Recharts** - Graficos (dashboard)
- **Inter** - Fonte principal (Google Fonts)
- **React Hook Form + Zod** - Formularios e validacao
- **Zustand** - Estado global leve
- **TanStack React Query** - Data fetching e cache
- **Capacitor.js 6** - Empacotamento mobile (Android/iOS)
- **Dexie.js** - IndexedDB wrapper para offline storage
- **Supabase Auth** - Autenticacao (JWT + Refresh Tokens)

### Backend (Deploy: VPS Hostinger + Easypanel + Docker)
- **FastAPI** (Python 3.12) - API REST
- **Pydantic V2** - Validacao de dados
- **Celery + Redis** - Task queue assincrona
- **APScheduler** - Scheduler (recalculo diario de predicoes)
- **OpenRouter -> Gemini 1.5 Flash** - IA Vision (analise de avarias) + OCR de PDF
- **xml.etree.ElementTree** - Parser XML de NFe (nativo Python)
- **Pandas + NumPy** - Calculos de predicao (KM/mm, CPK)
- **boto3** - Cliente S3 para Cloudflare R2
- **Pillow** - Processamento de imagens (conversao WebP)
- **cryptography (Fernet)** - Criptografia de secrets
- **resend** - Envio de emails transacionais

### Banco de Dados e Servicos
- **Supabase** (PostgreSQL 15) - DB principal + Auth + RLS + Edge Functions
- **Redis** (VPS Hostinger via Easypanel) - Cache de predicoes + Celery broker
- **Cloudflare R2** (compativel S3) - Storage de imagens de pneus
- **Resend** - Emails transacionais (boas-vindas, alertas)

---

## Arquitetura

```
                    +-----------------------+
                    |    USUARIOS           |
                    | Web (Desktop/Tablet)  |
                    | Mobile (Android APK)  |
                    +-----------+-----------+
                                |
                                | HTTPS
                                v
                    +-----------------------+
                    |  FRONTEND (Vercel)    |
                    |  Next.js 15           |
                    |  App Router           |
                    |  Tailwind + Recharts  |
                    |  Capacitor (mobile)   |
                    +------+-------+--------+
                           |       |
            Supabase Auth  |       | API Calls (HTTPS)
                           v       v
                +----------+--+ +--+-----------------+
                |  SUPABASE   | |  BACKEND (VPS)     |
                |  PostgreSQL | |  FastAPI + Celery   |
                |  Auth + RLS | |  Redis              |
                |  Edge Funcs | |  Easypanel (Docker) |
                |  Secrets DB | +--+---------+--------+
                +-------------+    |         |
                                   |         |
                          +--------+    +----+--------+
                          v             v             v
                   +-----------+  +-----------+  +--------+
                   |Cloudflare |  | OpenRouter|  | Resend |
                   |    R2     |  | Gemini AI |  | Email  |
                   | (imagens) |  | (avarias) |  |        |
                   +-----------+  +-----------+  +--------+
```

---

## Estrutura de Pastas

```
pneucontrol/                           # Raiz = Frontend Next.js 15
|-- app/                               # Next.js App Router (OFICIAL)
|   |-- page.tsx                       # Pagina principal (login + dashboard)
|   |-- layout.tsx                     # Root layout (Inter font)
|   +-- globals.css                    # Tailwind + custom scrollbar
|-- components/                        # (a criar) Componentes reutilizaveis
|   |-- ui/
|   |-- system/
|   |-- suppliers/
|   |-- vehicles/
|   +-- tires/
|-- lib/                               # (a criar) Integracao Supabase + API
|   |-- supabase/
|   |   |-- client.ts
|   |   +-- server.ts
|   |-- api/
|   |   +-- client.ts
|   +-- hooks/
|-- services/
|   +-- geminiService.ts               # Servico IA (migrar para backend)
|-- App.tsx                            # Versao Vite do dashboard
|-- constants.tsx                      # Dados mock (substituir por Supabase)
|-- types.ts                           # Interfaces TypeScript
|-- index.tsx                          # Entry point Vite
|-- index.html                         # HTML Vite
|-- next.config.js                     # Config Next.js (static export)
|-- vite.config.ts                     # Config Vite
|-- capacitor.config.ts                # Config Capacitor mobile
|-- tsconfig.json                      # TypeScript config
|-- package.json                       # Dependencias frontend
|-- .env.local                         # Vars ambiente frontend
|
|-- backend/                           # FastAPI (VPS Hostinger) - A CRIAR
|   |-- app/
|   |   |-- api/
|   |   |   |-- deps.py
|   |   |   +-- v1/
|   |   |       |-- system_admin.py
|   |   |       |-- cnpj.py
|   |   |       |-- suppliers.py
|   |   |       |-- vehicles.py
|   |   |       |-- tires.py
|   |   |       |-- nfe.py
|   |   |       |-- inspections.py
|   |   |       +-- predictions.py
|   |   |-- core/
|   |   |   |-- config.py
|   |   |   |-- security.py
|   |   |   |-- secrets.py            # SecretsManager (Fernet)
|   |   |   +-- logging.py
|   |   |-- services/
|   |   |   |-- cnpj/brasilapi.py
|   |   |   |-- nfe/xml_parser.py
|   |   |   |-- nfe/pdf_ocr.py
|   |   |   |-- ai/openrouter.py
|   |   |   |-- prediction/calculator.py
|   |   |   |-- storage/cloudflare_r2.py
|   |   |   +-- email/resend.py
|   |   |-- tasks/
|   |   |   |-- celery_app.py
|   |   |   +-- predictions.py
|   |   +-- main.py
|   |-- scripts/
|   |-- requirements.txt
|   |-- Dockerfile
|   +-- .env
|
|-- PRD_PNEU_CONTROL_v3_FINAL.md       # Documentacao
|-- GUIA_ARQUITETURA_v3_FINAL.md
|-- CHECKLIST_v3_FINAL.md
|-- CLAUDE.md
|-- README.md
+-- .gitignore
```

---

## Sistema de Secrets

### Principio: Secrets no banco, NAO em .env

Todas as API keys externas ficam criptografadas na tabela `system_config` do Supabase. O backend busca e descriptografa em runtime usando o `SecretsManager`.

### Variaveis de Ambiente (unicas permitidas)

**Frontend (.env.local):**
- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave publica do Supabase

**Backend (.env):**
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_KEY` - Service role key (privilegiada)
- `ENCRYPTION_KEY` - Chave Fernet para criptografia (gerada uma vez)
- `REDIS_URL` - Conexao Redis (redis://localhost:6379)

### Secrets no banco (system_config):
- `OPENROUTER_API_KEY` - IA (Gemini via OpenRouter)
- `RESEND_API_KEY` - Emails transacionais
- `R2_ENDPOINT` - Cloudflare R2 endpoint
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - Nome do bucket
- `R2_PUBLIC_URL` - URL publica das imagens

### Fluxo de uso:
```python
# CORRETO - Buscar do banco
from app.core.secrets import secrets_manager
api_key = await secrets_manager.get_secret('OPENROUTER_API_KEY')

# ERRADO - Nunca usar os.getenv para secrets externos
api_key = os.getenv("OPENROUTER_API_KEY")  # PROIBIDO
```

---

## Fases de Desenvolvimento

### FASE 0: Setup Inicial
- Ambiente de desenvolvimento (Node.js 20+, Python 3.12+)
- Repositorio e estrutura de pastas
- Configurar Supabase (projeto + SQL das 14 tabelas + RLS)
- Configurar servicos externos (Resend, OpenRouter)
- Gerar chave de criptografia (Fernet)

### FASE 1: Backend - Fundacao
- Setup FastAPI (main.py, CORS, health check)
- Sistema de Secrets (SecretsManager + popular system_config)
- Service de busca CNPJ (BrasilAPI)
- Rotas System Admin (CRUD empresas, dashboard, secrets)

### FASE 2: Frontend - Gestao do Sistema
- Setup Next.js 15 (App Router + Tailwind + Supabase Auth)
- Tela de Login (design Panze)
- Dashboard System Admin (KPIs, graficos)
- Cadastro de Empresa (busca CNPJ + email de boas-vindas)
- Interface de Gestao de Secrets

### FASE 3: Cadastros Basicos (Tenant)
- CRUD Fornecedores (backend + frontend)
- CRUD Veiculos (templates de eixos + diagrama SVG)
- CRUD Pneus (manual + CSV)

### FASE 4: Entrada de Nota Fiscal
- Parser XML de NFe (xml.etree.ElementTree)
- OCR de PDF (Gemini 1.5 Flash)
- Cadastro automatico de fornecedor + pneus
- Frontend: drag & drop, preview, confirmacao

### FASE 5: Inspecao Web
- Formulario de inspecao (selecao de veiculo, diagrama de pneus)
- Upload de fotos (Cloudflare R2) ** PAUSA para configurar R2 **
- IA de analise de avarias (OpenRouter + Gemini)

### FASE 6: Motor de Predicao
- Calculos: KM/mm, projecao de troca, CPK, alertas
- Celery tasks + scheduler (recalculo diario 3h AM)
- Dashboard de predicoes (calendario de compras, ranking fornecedores)

### FASE 7: Mobile App
- Capacitor setup + offline storage (Dexie.js)
- Telas: login, lista de veiculos, inspecao, sincronizacao
- Build APK (Android Studio)

### FASE 8: Deploy Producao
- Frontend na Vercel (deploy automatico)
- Backend na VPS Hostinger (Easypanel + Docker)
- Redis, Celery workers, testes em producao

---

## Decisoes Tecnicas Importantes

1. **Secrets no banco (system_config):** NUNCA usar .env para API keys externas. Apenas Supabase credentials e ENCRYPTION_KEY ficam em .env.

2. **Cloudflare R2 para imagens:** Supabase Storage free = 50MB (insuficiente). PAUSAR na Fase 5 para configurar R2 manualmente.

3. **Multi-tenant com RLS:** Cada empresa (tenant) so ve seus proprios dados. Isolamento garantido pelo Supabase RLS.

4. **Roles RBAC:** system_admin (Valmir), admin (empresa), manager, operator. Cada um com permissoes distintas.

5. **Offline-first mobile:** Dexie.js (IndexedDB) para armazenar inspecoes offline. Sincronizacao automatica quando houver conexao.

6. **IA via OpenRouter:** Nao usar Gemini diretamente - usar OpenRouter como proxy para flexibilidade de modelo. Modelo atual: google/gemini-flash-1.5.

7. **Celery + Redis para tasks pesadas:** Predicoes, processamento de NF, analise IA - tudo assincrono via Celery. Scheduler diario com APScheduler.

8. **Codigo de referencia nos docs:** SEMPRE verificar GUIA_ARQUITETURA antes de implementar. Os seguintes services ja tem codigo pronto: SecretsManager, BrasilAPIService, CloudflareR2, EmailService (Resend), XMLParser, PDFOCR.

9. **Edge Functions para criacao de usuarios:** Usar `supabase.auth.admin.generateLink` com SERVICE_ROLE_KEY para criar admins de empresa.

10. **Frontend oficial ja existe na raiz:** Os arquivos App.tsx, app/page.tsx, services/geminiService.ts, constants.tsx, types.ts sao o frontend oficial. O projeto tem setup dual (Vite via index.html + Next.js via app/). A evolucao deve: integrar Supabase Auth (substituindo login fake), conectar ao backend FastAPI (substituindo chamadas diretas ao Gemini), e substituir dados mock por dados reais do Supabase.

---

## Schema do Banco (14 tabelas)

1. `system_config` - Secrets e configuracoes (criptografadas)
2. `system_admins` - Developer/Owner (Valmir)
3. `tenants` - Empresas clientes (multi-tenant)
4. `users` - Usuarios das empresas (admin, manager, operator)
5. `suppliers` - Fornecedores de pneus
6. `vehicles` - Veiculos da frota (com axle_configuration JSON)
7. `tire_inventory` - Inventario de pneus
8. `tire_lifecycle` - Vidas dos pneus (novo, recapagem 1, 2, 3)
9. `inspections` - Cabecalho de inspecoes
10. `inspection_details` - Detalhes por pneu inspecionado
11. `predictions_cache` - Cache de predicoes (recalculado diariamente)
12. `supplier_performance` - Ranking de fornecedores (CPK, KM/mm)
13. `purchase_calendar` - Calendario de compras previstas
14. `nfe_imports` - Historico de notas fiscais importadas

---

## Frontend Oficial - Estado Atual

O frontend ja existe na raiz do projeto e possui:

### O que ja funciona (visual):
- Tela de Login (web desktop + mobile responsivo) com "Esqueci senha"
- Dashboard web com sidebar, KPIs, mapa de eixos, grafico de consumo, IA insights
- Dashboard mobile com design fintech (cards, acoes rapidas, atividades)
- Logout funcional (state-based)
- Simulacao termica via Gemini (geracao de imagem)
- AI Insights via Gemini (analise de pneus)

### O que precisa ser evoluido:
- Login fake (setState) -> Supabase Auth real
- Dados mock (constants.tsx) -> Dados reais do Supabase
- Gemini direto no cliente -> Backend FastAPI via OpenRouter
- Pagina unica (page.tsx) -> Rotas separadas (App Router)
- Sem RBAC -> Rotas por role (system_admin, admin, manager, operator)
- Sem multi-tenant -> RLS isolamento por empresa

### Arquivos-chave do frontend:
- `app/page.tsx` - Pagina principal (742 linhas - login + dashboard + mobile)
- `app/layout.tsx` - Root layout com Inter font
- `app/globals.css` - Tailwind + scrollbar customizado
- `App.tsx` - Versao alternativa Vite (418 linhas)
- `constants.tsx` - Dados mock
- `types.ts` - Interfaces (TireData, ConsumptionData, etc)
- `services/geminiService.ts` - Chamada direta ao Gemini
- `index.tsx` + `index.html` - Entry points Vite

---

## Proximos Passos Imediatos

1. **Configurar Supabase** (executar SQL das 14 tabelas + RLS)
2. **Criar diretorio backend/** e setup FastAPI
3. **Instalar dependencias** (pip install no backend)
4. **Atualizar .env.local** do frontend com credenciais Supabase reais
5. **Instalar dependencias faltantes no frontend** (supabase, react-query, zustand, react-hook-form, zod)
6. **Implementar Fase 1** (Backend: FastAPI + SecretsManager + CNPJ + System Admin routes)
