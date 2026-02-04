## 🛡️ Setup Password Blindado

A página de definição de senha foi completamente reescrita para ser **resiliente a falhas de link**.

### O Problema que Ocorria:
O navegador ou o cliente Supabase processava o link automaticamente (criando a sessão) milissegundos antes do meu código tentar fazer a mesma coisa. O meu código recebia "Link Inválido" porque o link **já tinha sido usado com sucesso pelo sistema** logo antes.

### A Solução:
Agora o código faz o seguinte:
1.  Verifica: "Já estou logado?" (Se sim, ótimo! Ignora o link e prossegue).
2.  Se não, tenta usar o link.
3.  Se o link der erro, verifica de novo: "Será que logou no meio tempo?" (Se sim, ótimo!).

---

### Teste Final (Valendo!):
1.  Espere o deploy (~1-2 min).
2.  **Crie uma NOVA empresa.** (Essencial, pois links velhos não servem).
3.  Clique no link e defina a senha.

Agora é extremamente improvável que falhe, pois ele aceita tanto o processamento manual quanto o automático.
E como o banco/backend já estavam 100%, o ciclo total deve funcionar perfeitamente.
