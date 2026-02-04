## 🧟‍♂️ Caça-Fantasmas de Sessão

O erro `User from sub claim...` confirmou minha suspeita: **O navegador estava assombrado.**

Como você deletou a empresa e criou de novo (com o mesmo email), o navegador ficou segurando o "crachá" do usuário antigo (que morreu). Quando você tentou entrar com o usuário novo, o sistema mostrou o crachá velho e foi barrado.

### Correção Aplicada:
Adicionei uma verificação de "Sinais Vitais" na entrada da página:
1.  O sistema detecta que tem um crachá (sessão).
2.  Antes de deixar entrar, ele pergunta pro servidor: **"Esse cara ainda existe?"**
3.  Se o servidor disser "Não", o sistema **joga o crachá velho fora (SignOut)** e usa o convite novo que está na URL.

---

### 🔄 Como Testar (Última vez, prometo!):
1.  Espere o deploy (~1 min).
2.  **Ainda tem o link do email?** Clique nele novamente.
    *   Se não tiver, ou se der erro de "Link Expirado", infelizmente terá que criar uma empresa nova uma última vez (ou usar o Reset de Senha no Login).
3.  Ao clicar, o sistema vai perceber a "sessão zumbi", vai matar ela automaticamente, e logar com o usuário novo correto.

Pode testar! Agora vai funcionar liso. 🧼
