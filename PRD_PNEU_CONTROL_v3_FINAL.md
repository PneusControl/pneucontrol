# PRD: Pneu Control v3.0 FINAL
## Sistema Inteligente de Gestão e Predição de Pneus para Frotas Pesadas

**Versão:** 3.0 (Final - Infraestrutura Ajustada)  
**Data:** 30 de Janeiro de 2026  
**Owner:** Valmir Junior (Developer/System Admin)  
**Status:** ✅ Pronto para Implementação  

---

## 🎯 VISÃO EXECUTIVA

### O Problema
Transportadoras perdem milhares de reais mensalmente por:
- Não saberem quando trocar pneus (troca antecipada = desperdício / troca tardia = perda de carcaça)
- Falta de controle sobre qual marca/fornecedor rende mais no trajeto específico
- Avarias não detectadas que causam paradas em rodovia
- Gestão manual em planilhas Excel (dados imprecisos e defasados)
- Falta de rastreabilidade de pneus por fornecedor

### A Solução
**Pneu Control** é um SaaS B2B que automatiza diagnóstico e **prevê com precisão**:
- ✅ Data exata para recapagem (quando o pneu atingirá 3mm)
- ✅ Custo por Km (CPK) real de cada marca/modelo/fornecedor
- ✅ Calendário de compras (quantos pneus comprar e quando)
- ✅ Detecção de avarias via IA antes que causem problemas
- ✅ Entrada automática de pneus via Nota Fiscal (XML/PDF)
- ✅ Comparativo de fornecedores com análise de rendimento

### Diferencial Competitivo
1. **Motor de Predição Próprio:** Cálculo de KM/mm + projeção de vida útil
2. **IA para Análise de Avarias:** Detecta bolhas, cortes, desgaste irregular em fotos
3. **Entrada Automatizada de NF:** XML + OCR de PDF = zero digitação
4. **Gestão de Fornecedores:** CPK por fornecedor, não só por marca
5. **Offline-First Mobile:** Borracheiro trabalha sem internet, sincroniza depois

---

## 👥 MODELO DE NEGÓCIO E ACESSOS

### **Estrutura de Usuários**

```
┌─────────────────────────────────────────────────┐
│  VALMIR JUNIOR (System Admin / Developer)      │
│  Email: valmirmoreirajunior@gmail.com          │
│  Senha: Levymojr123                            │
│  Role: system_admin                            │
│  Acesso: TOTAL (incluindo Gestão do Sistema)  │
└─────────────────┬───────────────────────────────┘
                  │
                  │ Cadastra empresas via
                  │ "Módulo Gestão do Sistema"
                  │
                  ▼
         ┌────────────────────┐
         │  EMPRESAS (Tenants) │
         │  Acesso: COMPLETO   │
         │  (exceto Gestão)    │
         └────────┬────────────┘
                  │
                  │ Cria usuários internos
                  │
                  ▼
    ┌─────────────────────────────────┐
    │  Admin da Empresa               │
    │  - Gerencia frota               │
    │  - Cria gerentes/operadores     │
    │  - Acessa relatórios completos  │
    └─────────────────────────────────┘
                  │
                  ├─► Gerentes: Visualizam + Criam inspeções
                  └─► Operadores: Apenas criam inspeções (mobile)
```

### **Fluxo de Onboarding (Cadastro de Empresa)**

**Responsável:** Valmir Junior (você) no módulo "Gestão do Sistema"

**Passo a passo:**
1. **Validação Comercial:** Cliente entra em contato e você aprova
2. **Cadastro no Sistema:**
   - Acessa módulo "Gestão do Sistema"
   - Clica em "Nova Empresa"
   - Digita CNPJ → Sistema busca automaticamente em API pública:
     * Razão Social
     * Nome Fantasia
     * Endereço completo
     * Porte (ME, EPP, Grande)
     * Regime tributário (Simples, Lucro Presumido, Lucro Real)
     * Segmento/CNAE
   - Preenche dados do Admin:
     * Nome completo
     * Email corporativo
   - Clica em "Salvar Empresa"

3. **Email Automático (via Resend):**
   - Sistema dispara email via Resend com:
     * Link de setup inicial (gerado via `supabase.auth.admin.generateLink`)
     * Instruções de boas-vindas
     * Prazo de 48h para ativar conta

4. **Setup do Admin:**
   - Admin clica no link do email
   - Define senha (mínimo 8 caracteres, com número e letra maiúscula)
   - Confirma senha
   - É redirecionado para tela de login
   - Faz primeiro acesso

**Tecnologia:** Edge Function `create-user` usando SERVICE_ROLE_KEY (conforme documento `configuracao-empresa-tenant.md`)

---

## 📊 PERSONAS E JORNADAS

### Persona 1: System Admin (Você - Valmir Junior)
**Acesso:** Módulo "Gestão do Sistema"

**Ações:**
- Cadastrar/Editar/Desativar empresas
- Visualizar dashboard master:
  * Total de empresas ativas
  * Total de veículos cadastrados (todos os tenants)
  * Total de inspeções realizadas (últimos 30 dias)
  * Consumo de IA (fotos processadas)
  * Empresas com mais uso
- Gerar relatórios financeiros (faturamento previsto)
- Configurar API keys e secrets no Supabase

### Persona 2: Gestor de Frota (Admin da Empresa)
**Quem é:** Carlos, 42 anos, gerente de manutenção de transportadora com 50 caminhões

**Dores:**
- Não sabe quanto vai gastar com pneus nos próximos 3 meses
- Desconfia que está comprando do fornecedor errado (caro e baixo rendimento)
- Recebe relatórios do borracheiro em papel/WhatsApp

**Jornada no Pneu Control:**
1. Acessa dashboard e vê: "Você precisará de 12 pneus em Março (R$ 28.800)"
2. Compara fornecedores: "Fornecedor X (Pirelli) rende 8% mais que Fornecedor Y (Pirelli) no seu trajeto"
3. Identifica problema: "Veículo placa ABC-1234 tem desgaste irregular - verificar alinhamento"
4. Faz upload de Nota Fiscal → Sistema cadastra 10 pneus automaticamente
5. Exporta relatório para diretoria com ROI do investimento em pneus

### Persona 3: Borracheiro/Operador (Mobile App)
**Quem é:** João, 35 anos, responsável por inspecionar 15 caminhões/dia

**Dores:**
- Preencher papel com 18 medições por caminhão é demorado
- Esquece de anotar pressão ou número de série
- Não tem feedback se está fazendo medição correta
- Pátio não tem sinal de internet estável

**Jornada no Pneu Control:**
1. Abre app (offline), seleciona placa do caminhão
2. Vê desenho dos eixos com 18 posições
3. Toca no pneu DD (Dianteiro Direito) → Sistema abre checklist
4. Insere pressão (120 PSI) → App alerta: "Recomendado: 125 PSI"
5. Fotografa pneu → IA detecta: "⚠️ Possível bolha lateral"
6. Marca checklist de avarias
7. Digita KM do hodômetro (212.450 km)
8. Próximo pneu... ao final, sincroniza tudo quando houver Wi-Fi

---

## 🏗️ ARQUITETURA TÉCNICA

### Stack Aprovada

#### Frontend Web (Dashboard Gestor + Gestão do Sistema)
```
- Framework: Next.js 15 (App Router)
- Deploy: Vercel (Git push automático)
- UI: Design do protótipo (estilo Panze) + Tailwind CSS
- Ícones: Lucide React
- Gráficos: Recharts
- Fonte: Inter (Google Fonts)
- Forms: React Hook Form + Zod
- Estado: Zustand (global state leve)
- Data Fetching: TanStack React Query
```

#### Frontend Mobile (App Operador)
```
- Base: Next.js 15 (mesmo código do web)
- Empacotamento: Capacitor.js 6
- Camera: @capacitor/camera
- Storage Offline: @capacitor/preferences + Dexie.js (IndexedDB)
- Network: @capacitor/network (detectar online/offline)
- Build: Android Studio (APK)
```

#### Backend (API + IA Engine)
```
- Deploy: VPS Hostinger (Easypanel + Docker)
- API REST: FastAPI (Python 3.12)
- Validação: Pydantic V2
- IA Vision: OpenRouter → Gemini 1.5 Flash (análise de avarias)
- OCR: Gemini 1.5 Flash (leitura de PDF de NF)
- XML Parser: xml.etree.ElementTree (Python nativo)
- Predição: Pandas + NumPy (cálculos de KM/mm, projeções)
- Task Queue: Celery + Redis (processamento assíncrono)
- Scheduler: APScheduler (recalcular predições diariamente)
```

#### Banco de Dados & Storage
```
- DB Principal: Supabase (PostgreSQL 15)
  * Auth: Supabase Auth (RLS ativado)
  * Edge Functions: create-user, send-email
  * Secrets Storage: Tabela system_config (API keys criptografadas)
  
- Cache: Redis (VPS Hostinger via Easypanel) - predições pré-calculadas

- Storage de Imagens: Cloudflare R2 (compatível S3)
  ⚠️ IMPORTANTE: Precisa configuração manual no Cloudflare
  → Quando chegar nesta etapa, o agente deve pausar e instruir
  
- CDN: Cloudflare (otimização WebP automática)

- Email: Resend (envio de emails transacionais)
```

#### DevOps & Infra
```
- Frontend: Vercel (deploy automático via Git)
- Backend: VPS Hostinger + Easypanel (Docker)
- Redis: VPS Hostinger + Easypanel
- Monitoramento: Logs via Easypanel + Sentry (erros)
```

---

## 🔐 SEGURANÇA E GESTÃO DE SECRETS

### **Tabela system_config (Supabase)**

**⚠️ CRÍTICO:** Todas as API keys e secrets ficam no banco, não em variáveis de ambiente.

**Schema:**
```sql
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,  -- Criptografado
    description TEXT,
    is_encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Apenas system_admins podem acessar
CREATE POLICY "Only system admins can access system_config"
ON system_config FOR ALL
USING (
    auth.uid() IN (SELECT id FROM system_admins)
);

-- Exemplo de dados:
INSERT INTO system_config (key, value, description) VALUES
('OPENROUTER_API_KEY', 'sk-or-xxx-encrypted', 'API Key OpenRouter para IA'),
('RESEND_API_KEY', 're_xxx-encrypted', 'API Key Resend para emails'),
('R2_ENDPOINT', 'https://xxx.r2.cloudflarestorage.com', 'Cloudflare R2 endpoint'),
('R2_ACCESS_KEY_ID', 'xxx-encrypted', 'R2 Access Key'),
('R2_SECRET_ACCESS_KEY', 'xxx-encrypted', 'R2 Secret Key'),
('R2_BUCKET_NAME', 'pneu-control-images', 'Nome do bucket R2'),
('R2_PUBLIC_URL', 'https://images.pneucontrol.com.br', 'URL pública do R2');
```

### **Criptografia de Secrets**

**Backend (Python):**
```python
# app/core/secrets.py
from cryptography.fernet import Fernet
import os

class SecretsManager:
    def __init__(self):
        # Chave mestra (única no .env do backend)
        self.cipher = Fernet(os.getenv("ENCRYPTION_KEY"))
    
    def encrypt(self, value: str) -> str:
        return self.cipher.encrypt(value.encode()).decode()
    
    def decrypt(self, encrypted_value: str) -> str:
        return self.cipher.decrypt(encrypted_value.encode()).decode()
    
    async def get_secret(self, key: str) -> str:
        """Busca secret do Supabase e descriptografa"""
        result = await supabase.table('system_config').select('value, is_encrypted').eq('key', key).single().execute()
        
        if result.data['is_encrypted']:
            return self.decrypt(result.data['value'])
        return result.data['value']

# Uso:
secrets = SecretsManager()
openrouter_key = await secrets.get_secret('OPENROUTER_API_KEY')
```

### **Variáveis de Ambiente (Apenas Supabase)**

**Frontend (.env.local na Vercel):**
```bash
# Apenas credenciais do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

**Backend (.env na VPS):**
```bash
# Apenas credenciais do Supabase + chave mestra
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx
ENCRYPTION_KEY=xxx  # Gerada uma vez, nunca muda
REDIS_URL=redis://localhost:6379
```

**⚠️ IMPORTANTE:** Todos os outros secrets (OpenRouter, Resend, R2) ficam no banco!

---

## ☁️ CLOUDFLARE R2 - CONFIGURAÇÃO NECESSÁRIA

### **⚠️ AVISO IMPORTANTE PARA O AGENTE:**

Quando chegar na implementação de upload de imagens (Sprint 7), **o agente deve PAUSAR e instruir o desenvolvedor** a configurar o Cloudflare R2 manualmente.

**Motivo:** Plano free do Supabase oferece apenas 50MB de storage, insuficiente para fotos de pneus.

### **Instruções para o Desenvolvedor (Quando Solicitado):**

**Passo 1: Criar Conta Cloudflare**
1. Acesse: https://cloudflare.com
2. Crie conta (free)
3. Vá em R2 Object Storage

**Passo 2: Criar Bucket**
1. "Create Bucket"
2. Nome: `pneu-control-images`
3. Location: Automatic

**Passo 3: Gerar API Keys**
1. R2 → Manage R2 API Tokens
2. "Create API Token"
3. Permissions: Object Read & Write
4. Copiar:
   - Access Key ID
   - Secret Access Key
   - Endpoint (formato: https://xxx.r2.cloudflarestorage.com)

**Passo 4: Configurar Domínio Público (Opcional)**
1. R2 → Buckets → pneu-control-images → Settings
2. Public Access → Connect Custom Domain
3. Configurar: `images.pneucontrol.com.br` (ou subdomínio escolhido)
4. Cloudflare cria DNS automaticamente

**Passo 5: Salvar no Supabase**
```sql
-- Executar no Supabase SQL Editor:
INSERT INTO system_config (key, value, description, is_encrypted) VALUES
('R2_ENDPOINT', 'https://xxx.r2.cloudflarestorage.com', 'R2 Endpoint', false),
('R2_ACCESS_KEY_ID', '[VALOR_CRIPTOGRAFADO]', 'R2 Access Key', true),
('R2_SECRET_ACCESS_KEY', '[VALOR_CRIPTOGRAFADO]', 'R2 Secret', true),
('R2_BUCKET_NAME', 'pneu-control-images', 'Bucket Name', false),
('R2_PUBLIC_URL', 'https://images.pneucontrol.com.br', 'Public URL', false);

-- Para criptografar os valores, usar o script Python do SecretsManager
```

**Passo 6: Testar Upload**
```python
# Script de teste (backend)
python scripts/test_r2_upload.py
```

**Custo Estimado R2:**
- Storage: $0.015/GB/mês
- Operações: Grátis (até 10M req/mês)
- **Estimativa:** ~R$ 15/mês (100GB de imagens)

---

## 📐 ESTRUTURA DO BANCO DE DADOS

### Schema Supabase (PostgreSQL)

```sql
-- =====================================================
-- TABELA 0: SYSTEM_CONFIG (Secrets e Configurações)
-- =====================================================
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Apenas system_admins
CREATE POLICY "Only system admins can manage config"
ON system_config FOR ALL
USING (auth.uid() IN (SELECT id FROM system_admins));

-- =====================================================
-- TABELA 1: SYSTEM_ADMINS (Developer/Owner)
-- =====================================================
CREATE TABLE system_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE POLICY "Only system admins can access"
ON system_admins FOR ALL
USING (id = auth.uid());

-- =====================================================
-- TABELA 2: TENANTS (Empresas Clientes)
-- =====================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    porte VARCHAR(50),
    regime_tributario VARCHAR(50),
    segmento VARCHAR(100),
    endereco JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES system_admins(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA 3: USERS (Usuários das Empresas)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    INDEX idx_tenant_user (tenant_id, id)
);

CREATE POLICY "Users can view own tenant users"
ON users FOR SELECT
USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
));

-- =====================================================
-- TABELAS 4-13: [IGUAL AO PRD v2.0]
-- suppliers, vehicles, tire_inventory, tire_lifecycle,
-- inspections, inspection_details, predictions_cache,
-- supplier_performance, purchase_calendar, nfe_imports
-- =====================================================
-- [Schema completo mantido do PRD anterior]
```

*(Restante das 10 tabelas mantidas do PRD v2.0)*

---

## 🔧 MÓDULOS E FUNCIONALIDADES

### MÓDULO 0: Gestão do Sistema (System Admin - Você)

**Acesso:** Exclusivo para `system_admins` (Valmir Junior)

#### Funcionalidades:

**0.1 Dashboard Master**
- Total de empresas ativas
- Total de veículos (todas as empresas)
- Total de inspeções (últimos 30 dias)
- Gráfico de crescimento mensal
- Consumo de IA (fotos processadas + custo estimado)
- Top 5 empresas mais ativas

**0.2 Gestão de Empresas**
[Igual ao PRD v2.0]

**0.3 Gestão de Secrets (NOVO)**
- Interface para adicionar/editar API keys
- Criptografia automática de valores sensíveis
- Histórico de alterações
- Teste de conexão (verificar se key funciona)

---

### MÓDULO 1-5: [IGUAL AO PRD v2.0]

*(Mantém todas as funcionalidades de fornecedores, veículos, pneus, inspeção, predição, IA)*

---

## 💰 MODELO DE PRECIFICAÇÃO

### Modelo B2B Direto (Sem Self-Service)

**Investimento Mensal:**
- **R$ 799/mês** (até 30 veículos)
- **R$ 1.499/mês** (até 80 veículos)
- **R$ 2.499/mês** (acima de 80 veículos)

**Inclui:**
- ✅ Acesso completo ao sistema (web + mobile)
- ✅ Usuários ilimitados
- ✅ Motor de predição
- ✅ Análise de avarias com IA (até 500 fotos/mês)
- ✅ Entrada automática de NF (XML/PDF)
- ✅ Suporte via WhatsApp/Email
- ✅ Onboarding + Treinamento (2h)

**Add-ons:**
- Análise IA extra (acima de 500 fotos): **R$ 0,50/foto**
- Integração com ERP customizada: **R$ 3.000** (one-time)
- Consultoria de otimização de frota: **R$ 150/hora**

---

## 🔐 SEGURANÇA E COMPLIANCE

### Segurança de Dados
- **Criptografia:** TLS 1.3 (transit) + AES-256 (at rest)
- **Auth:** JWT + Refresh Tokens (Supabase)
- **RLS:** Isolamento por tenant
- **RBAC:** System Admin, Admin, Manager, Operator
- **Secrets:** Criptografados no banco (Fernet)
- **2FA:** Opcional via Supabase Auth
- **Backup:** Diário automatizado (Supabase)

### LGPD
- Política de privacidade
- Termo de uso
- Consentimento explícito
- Direito ao esquecimento
- Portabilidade de dados
- DPO designado

---

## 📚 DOCUMENTAÇÃO COMPLEMENTAR

### Arquivos de Configuração Obrigatórios

**1. `tailwind.config.ts`**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81'
        },
        emerald: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981'
        },
        orange: {
          50: '#fff7ed',
          400: '#fb923c',
          500: '#f97316'
        },
        rose: {
          500: '#f43f5e'
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif']
      }
    }
  },
  plugins: []
}

export default config
```

**2. `postcss.config.js`**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**3. `.env.example` (Frontend)**
```bash
# Supabase (único secret no frontend)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

**4. `.env.example` (Backend)**
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx

# Chave mestra de criptografia (gerar uma vez)
ENCRYPTION_KEY=xxx

# Redis (VPS Hostinger)
REDIS_URL=redis://localhost:6379

# TODOS OS OUTROS SECRETS FICAM NO BANCO (system_config)!
```

---

## 🎯 ROADMAP DE DESENVOLVIMENTO

### Organização por Funcionalidade (Sem Prazos)

#### FASE 1: MVP Core - Backend + Gestão

**Fundação:**
- Setup Next.js + Supabase + FastAPI
- Módulo Gestão do Sistema (você)
- Cadastro de empresas com busca CNPJ
- Edge Function: create-user
- Email de boas-vindas (Resend)
- Sistema de secrets (Supabase)

**Cadastros Básicos:**
- CRUD Fornecedores
- CRUD Veículos (templates de eixos)
- CRUD Pneus (manual + CSV)

**Entrada de NF:**
- Upload XML (parsing)
- Upload PDF (OCR com Gemini)
- Cadastro automático de fornecedor + pneus
- Histórico de NFs importadas

#### FASE 2: Inspeção e Inteligência

**Inspeção Web:**
- Formulário de inspeção
- Upload de fotos (Cloudflare R2)
- Checklist de avarias
- Integração IA (análise de avarias)

**Motor de Predição:**
- Cálculo de KM/mm
- Projeção de troca
- CPK
- Celery Task diário
- Dashboard básico

**Mobile App:**
- App Capacitor (estrutura)
- Telas: Login, Lista de veículos, Inspeção
- Offline storage (Dexie.js)
- Sincronização
- Build APK

#### FASE 3: Aprimoramentos e Escala

**Dashboard Completo:**
- Página de fornecedores
- Ranking de fornecedores
- Calendário de compras
- Relatórios PDF

**Otimizações:**
- Performance (lazy loading, cache)
- Testes E2E
- Deploy VPS (Easypanel)
- Monitoramento

#### FASE 4: Funcionalidades Avançadas (Futuro)

- Planilha de carga inicial
- Gestão de estoque (warehouse)
- Alertas por WhatsApp
- Multi-idioma
- App para recapador

---

## ✅ CHECKLIST FINAL

### Documentação
- [x] PRD completo
- [ ] Guia de Arquitetura
- [ ] Checklist de Implementação

### Validações
- [ ] Design aprovado (protótipo Next.js)
- [ ] Stack aprovada
- [ ] Banco de dados validado
- [ ] Fluxos de usuário aprovados

### Ambiente
- [ ] Supabase configurado
- [ ] Cloudflare R2 configurado (quando necessário)
- [ ] Redis na VPS (Easypanel)
- [ ] Resend configurado

---

**Versão:** 3.0 (Final - Infraestrutura Ajustada)  
**Última atualização:** 30 de Janeiro de 2026  
**Status:** ✅ Aprovado para Desenvolvimento  

**Autor:** Claude (Anthropic) + Especificações do Cliente (Valmir Junior)

---

**🚀 PRÓXIMO PASSO:** Implementação da Fundação (Backend + Gestão do Sistema)
