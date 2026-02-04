## ☢️ Solução Nuclear para Zumbis (Erro 403)

O servidor se recusava a fazer o logout (403) porque o usuário velho não existia mais. Isso travava o token velho no seu navegador "para sempre".

### O que eu fiz:
Implementei uma limpeza **à força bruta**.
Agora, se o sistema detectar uma sessão inválida (usuário deletado):
1.  Ele ignora o erro do servidor.
2.  Ele vai direto na memória do navegador e **arranca os tokens do Supabase** manualmente.
3.  Ele recarrega a página (`F5` automático) para começar do zero, limpo.

---

### Como Testar:
1.  Aguarde o deploy.
2.  **Se você ainda está na tela de erro:** Apenas dê um F5 (Refresh).
    *   Se a URL ainda tiver o `#access_token=...`, vai funcionar na hora.
    *   Se a URL estiver limpa, clique no link do email novamente.

Dessa vez o navegador vai "piscar" (fazer a limpeza) e entrar corretamente.
Isso resolve o ciclo vicioso de criação/exclusão de usuários de teste. ☢️🧹
