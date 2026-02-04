# Plano de Implementação: Arquitetura de Permissões e Correção Sistêmica

Este documento detalha como o sistema tratará a hierarquia de usuários, garantindo isolamento total entre empresas (Tenants) e distinção clara entre o Dono do SaaS (Developer) e os Administradores das Empresas.

## 1. Visão Geral da Hierarquia

O sistema opera em três níveis distintos de autoridade:

1.  **System Admin (Developer/Owner)**
    *   **Quem:** Apenas você (`valmirmoreirajunior@...`).
    *   **Poder:** Acesso global. Vê todas as empresas, métricas do SaaS e acesso irrestrito.
    *   **Mecanismo de Controle:** Tabela exclusiva `public.system_admins`. Se o email não estiver lá, o acesso ao módulo "Gestão de Sistema" é negado pelo Backend (RLS) e escondido no Frontend.

2.  **Tenant Admin (Cliente)**
    *   **Quem:** Quem contrata o sistema (ex: "Pedro" da Transportadora X).
    *   **Poder:** Deus *dentro da sua própria empresa*. Vê todos os veículos, pneus e funcionários DAQUELA empresa.
    *   **Isolamento:** Garantido pelo `tenant_id` no banco de dados. Um Admin **jamais** vê dados de outra empresa.
    *   **Criação:** Definido automaticamente ao criar a empresa (`role: 'admin'`).

3.  **Usuário Operacional (Sub-níveis)**
    *   **Quem:** Funcionários criados pelo Tenant Admin (Motoristas, Gestores de Frota, Borracheiros).
    *   **Poder:** Limitado pelo Admin. Pode ver apenas "Pneus" ou apenas "Ordens de Serviço".
    *   **Mecanismo:** Array de permissões `permissions` na tabela `users`.

---

## 2. Correção Imediata: O Caso "Pedro" (Menu Vazio)

A imagem mostrada (Sidebar vazia e role "Operator") ocorreu porque o sistema falhou em carregar o perfil do banco e "rebaixou" o admin para operador por segurança.

### Solução Robusta (Blindagem)
Não confiaremos apenas na leitura do banco no momento do login. Implementaremos uma "Dupla Checagem":
1.  **Auth Token (JWT):** O token de login JÁ CONTÉM a informação `role: 'admin'`. Isso é assinado criptograficamente pelo Supabase. É seguro e instantâneo.
2.  **Banco de Dados:** Traz detalhes extras (foto, nome customizado).

**Lógica da Correção:**
Se o banco demorar ou falhar (erro 406), o sistema **usará o Token** para garantir que o Admin VEJA o menu de Admin imediatamente. Isso impede que o dono da empresa veja uma tela em branco.

---

## 3. Gerenciamento de Sub-usuários (Sua Dúvida Principal)

> "Como vc vai fazer quando os admins criarem seus outros usuarios?"

A lógica já está desenhada para funcionar assim:

1.  **Interface de Criação de Usuário (Admin Panel):**
    *   Quando o Admin (Pedro) criar um usuário "João", ele verá checkboxes: [ ] Gestão de Pneus, [ ] Financeiro, [ ] Frota.
    *   O Backend salvará isso no campo `permissions` do João: `['tires', 'financial']`.

2.  **Sidebar Dinâmica:**
    *   O Admin (Pedro) tem `role: 'admin'`, então a Sidebar mostra **TUDO** automaticamente (exceto Gestão de Sistema).
    *   O João tem `role: 'operator'` (padrão), então a Sidebar varre o array `permissions`.
        *   Se tiver 'tires', mostra o menu Pneus.
        *   Se NÃO tiver 'financial', esconde Financeiro.

3.  **Segurança (Backend):**
    *   Mesmo se o João tentar acessar a URL `/dashboard/financial` direto, o Backend verificará se ele tem a permissão 'financial'. Se não tiver -> Acesso Negado.

---

## 4. Plano de Ação

### Passo 1: Correção do AuthProvider (Prioridade Zero)
Corrigir o "Menu Vazio" agora mesmo.
- **Ação:** Alterar `AuthProvider.tsx` para usar o `user_metadata` do JWT como fallback.
- **Resultado:** O usuário Pedro verá o menu completo de Admin imediatamente.

### Passo 2: Validação de Isolamento
Verificar se o Pedro (Admin) consegue ver o módulo "Gestão de Sistema".
- **Ação:** Confirmar que o código do Sidebar checa `isSystemAdmin` (que busca na tabela especial) e não apenas `role === 'admin'`.
- **Resultado:** Pedro vê Dashboard, Frota, etc., mas **NÃO** vê "Gestão de Sistema".

### Passo 3: Criação de Usuários (Futuro Próximo)
Implementar/Revisar a tela onde o Pedro cria funcionários.
- **Ação:** Garantir que o Admin possa selecionar as permissões específicas.

## User Review Required
- [ ] Aprova a lógica de "Dupla Checagem" (Token + Banco) para resolver o problema da tela branca?
- [ ] Entendido que a separação "Developer vs Admin" é feita pela tabela `system_admins` e não apenas pelo cargo?
