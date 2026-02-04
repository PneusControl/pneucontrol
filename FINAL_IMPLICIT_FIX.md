## 🔧 Última Cartada Técnica: Desativando PKCE

O erro de `TIMEOUT` persistente indicava que o cliente Supabase estava tentando fazer uma troca de chaves complexa (PKCE) e falhando silenciosamente.

### O que mudei:
Forcei a página de setup a usar o modo **"Implicit" (Simplificado)**.
1.  Ela não tenta fazer troca de códigos com o servidor.
2.  Ela pega o token que veio no Email e usa diretamente.
3.  Ela não tenta "adivinhar" a sessão na URL automaticamente (desativei `detectSessionInUrl`).

---

### Teste Final:
1.  Espere o deploy.
2.  **Use o Link Novo:** (Precisa ter o `#access_token` na URL. Se não tiver, crie a empresa de novo).
3.  Agora o processamento deve ser instantâneo, pois removemos a etapa que estava travando na rede.

**Se ainda assim falhar:**
O botão **"Ir para Login e Redefinir Senha"** que aparece na tela de erro é sua saída garantida. Ele usa o fluxo padrão de recuperação de senha que sempre funciona. Use-o sem medo se o link direto continuar rebelde. O importante é que sua conta **existe e está segura no banco**.
