## 🕵️ Investigação de Permissão

Coloquei "sondas" no código para entender por que o **Gestão de Sistema** está aparecendo para quem não deve.
O banco diz que somente `valmirmoreirajunior` é admin. O código diz que deu erro ao buscar o admin (406). Então deveria estar escondido.

Se você está vendo, algo mágico está acontecendo.

### O que fazer:
1.  Espere o deploy.
2.  Acesse o sistema.
3.  Abra o Console do Navegador (F12).
4.  Procure por linhas começando com `[AuthDebug]` ou `[SidebarDebug]`.

Elas vão me dizer **quem** o sistema acha que você é e **por que** ele te deu a chave mestra.

(Isso, claro, só se você realmente usou um email DIFERENTE do seu email de developer. Se usou o mesmo, o mistério está resolvido: você é você).

**Aguardo o print ou o texto desses logs!**
