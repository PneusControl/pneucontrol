## 🧩 Última Peça do Quebra-Chave Corrigida

O problema do "Timeout" foi identificado:
O **React Strict Mode** estava executando a verificação do token **duas vezes**.
1.  Primeira vez: Consome o token (sucesso).
2.  Segunda vez: Tenta usar o mesmo token (que agora é inválido/já usado) -> Falha/Timeout.

### Solução Aplicada:
Adicionei uma proteção (`useRef`) para garantir que o token seja processado apenas **uma única vez**.

---

### ⚠️ Como Testar (Importante):
Como os links anteriores já foram "queimados" pelas tentativas falhas:

1.  Aguarde o deploy do Vercel (~1-2 min).
2.  **Crie uma NOVA empresa.** (Isso gerará um link fresco).
3.  Clique no link do email.

Agora deve funcionar de primeira, sem travar e sem timeout.
A parte crítica (banco de dados e exclusão) você já confirmou que está 100%. Falta só esse detalhe da UX do primeiro acesso.
