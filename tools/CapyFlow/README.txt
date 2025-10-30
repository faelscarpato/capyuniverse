
CapyFlow — Versão Embutida (Ferramenta do CapyUniverse)
=======================================================

1) Copie esta pasta para o CapyUniverse (ex.: `/tools/capyflow/`).  
2) Edite o `src` do iframe no `capyflow-embed.html` para o caminho real do seu CapyFlow standalone.  
3) Adicione a ferramenta no catálogo (tools.json).  
4) O embed envia API key global e preferências via postMessage.

Exemplo de detecção (no CapyFlow):
```js
const isEmbedded = new URLSearchParams(location.search).get('embedded') === '1';
if (isEmbedded) document.documentElement.classList.add('embedded');
```
