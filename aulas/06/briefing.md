Briefing para produção audiovisual e de conteúdo
Aula Completa
2026.2



Professor: Luan Tavares Lourenço
Disciplina: Frontend


Aula:
1☐ 2☐ 3☐ 4☐ 5☐ 6☒ 7☐ 8☐ 9☐ 10☐ 11☐ 12☐ 13☐ 14☐ 15☐ 16☐


Título da aula:

Revisão Geral


Opção do TA:  Vídeo ☐Texto ☒

1 - Introdução

Esta é uma aula de revisão — sem conteúdo novo e sem mudança de código. O slide desta aula é propositalmente enxuto (16 telas, para caber numa aula de revisão sem se arrastar); este briefing existe para carregar o que o slide não tem espaço para carregar: a explicação completa, com nuances, exceções e o "por quê" por trás de cada ponto. O foco pedido para esta revisão recai sobre seis pontos específicos, que são tratados aqui com mais profundidade do que em qualquer aula anterior: a diretiva `try_files` do Nginx, a árvore DOM (pais, filhos, irmãos) por trás dos seletores — incluindo a hierarquia Node → Element → HTMLElement e a diferença entre coleções vivas e estáticas —, o par `target`/`currentTarget`, o par `preventDefault`/`stopPropagation` (com as três fases do evento), a relação entre `window` e `document`, e generics em TypeScript.

2 - Aula 01: Nginx e a diretiva try_files

2.1 - Por que não abrir o HTML direto

Antes de chegar em `try_files`, vale relembrar por que a alternativa mais óbvia — abrir o `index.html` direto no navegador, via `file://` — não é usada no curso. Quando um arquivo é aberto assim, o navegador não fala HTTP nenhum: não existem headers de resposta, não existe status code, e o próprio conceito de "rota" desaparece — cada link é resolvido como caminho de arquivo no disco, não como URL de um servidor. Isso quebra qualquer coisa que dependa de HTTP de verdade (fetch/Axios para uma API, cookies, CORS) e não reproduz o ambiente de produção. Um backend inteiro só para servir HTML/CSS/JS resolveria o problema de simular HTTP, mas ao custo de manter um runtime de aplicação (Node, por exemplo) rodando só para devolver bytes estáticos — trabalho que um servidor web dedicado faz de forma mais eficiente e mais simples de configurar.

2.2 - Nginx em Docker: a mecânica completa

Rodar o Nginx dentro de um container Docker, orquestrado por `docker-compose`, monta o seguinte encadeamento:

- O `docker-compose.yml` declara o serviço do Nginx e cria, implicitamente, uma rede Docker interna compartilhada por todos os serviços definidos no arquivo;
- Um volume mapeia o diretório local `./public` para `/usr/share/nginx/html` (ou para o `root` configurado) dentro do container — ou seja, qualquer arquivo que exista localmente em `./public` passa a existir, do ponto de vista do Nginx, dentro do container;
- O Nginx expõe a porta 80 internamente, e o `docker-compose` mapeia essa porta para uma porta do host (`ports: - "8080:80"`, por exemplo), tornando o conteúdo acessível via `http://localhost:8080`;
- Diferente de abrir o arquivo direto, aqui existe HTTP de verdade: headers, status codes, e o mesmo comportamento que existiria em um servidor de produção.

2.3 - A diretiva `try_files`: mecânica completa

```nginx
server {
    listen 80;
    root /var/www;
    index index.html;

    location / {
        autoindex on;
        try_files $uri $uri/ =404;
    }

    error_page 404 /404.html;
}
```

`try_files` recebe uma lista de argumentos e os testa **em ordem, da esquerda para a direita**, usando o **primeiro que resolver para um arquivo ou diretório existente**:

1. `$uri` — o caminho da requisição, tratado como **caminho de arquivo**, relativo a `root`. Uma requisição `GET /sobre.html` testa se existe o arquivo `/var/www/sobre.html`.
2. `$uri/` — o mesmo caminho, agora tratado como **diretório** (repare na barra adicionada no fim). Se existir uma pasta `/var/www/blog/`, o Nginx entra nela e serve o arquivo declarado em `index` (`index.html`, aqui) — mecanismo conhecido como "directory index".
3. `=404` — um argumento especial: se nada antes dele resolveu, o Nginx interrompe a busca e responde imediatamente com o código informado (`404` aqui), sem tentar mais nenhum fallback. É esse retorno explícito de status que distingue `=404` de um simples "próximo candidato" — ele nunca é tratado como caminho de arquivo.

Dois detalhes que não aparecem no slide, mas que valem a pena fixar:

- **A ordem importa e é definitiva**: se o primeiro argumento resolver, os seguintes nem são avaliados. Não existe "testar todos e escolher o melhor" — é sequencial, e para no primeiro sucesso.
- **`autoindex on`** (na mesma `location`) só entra em jogo quando `try_files` resolve para um diretório que **não tem** um arquivo `index.html` dentro — nesse caso, em vez de dar erro, o Nginx gera automaticamente uma listagem HTML dos arquivos daquela pasta. Sem `autoindex on`, um diretório sem `index.html` resultaria em `403 Forbidden`, não em `404`.
- **`error_page 404 /404.html`** só entra depois que `try_files` já decidiu por `=404` — ele troca a página de erro padrão do Nginx por uma página customizada, mas não muda o status HTTP retornado (continua `404`).

Por que essa diretiva existe: sem ela, o Nginx precisaria de uma regra explícita para cada tipo de URL (arquivo exato vs. pasta com index vs. rota inexistente). `try_files` resolve isso com uma única linha declarativa, testando do caminho mais específico (arquivo exato) para o mais genérico (pasta com index), e só então desistindo.

3 - Aula 02: A Árvore DOM e os Seletores

3.1 - A árvore: pais, filhos e irmãos

O HTML, depois de parseado pelo navegador, deixa de ser texto e se torna uma **árvore de nós** — essa árvore é o DOM (Document Object Model). "Árvore" aqui não é metáfora solta: é a mesma estrutura de dados de uma árvore genealógica ou de um sistema de arquivos, com as mesmas relações:

- **Pai (parent)** — o nó que contém outro diretamente em seu corpo.
- **Filho (child)** — o nó contido diretamente por outro.
- **Irmãos (siblings)** — nós diferentes que compartilham o mesmo pai.
- **Ancestral/Descendente** — a mesma relação de pai/filho, mas em qualquer profundidade (não precisa ser direto). Um neto continua sendo descendente do avô.

```html
<body>                    <!-- raiz da subárvore visível; pai de header, main, footer -->
  <header>...</header>    <!-- filho de body; irmão de main e footer -->
  <main>
    <article>...</article> <!-- filho de main; descendente (neto) de body -->
  </main>
  <footer>...</footer>    <!-- filho de body; irmão de header e main -->
</body>
```

3.2 - A hierarquia por trás do DOM: Node, Element e HTMLElement

Isso não aparece no slide, mas é o que explica por que nem todo nó tem os mesmos métodos disponíveis. O DOM é organizado em uma cadeia de herança:

- **`Node`** — a classe mais genérica. Qualquer coisa que exista na árvore é um `Node`: uma tag, um nó de texto solto, um comentário `<!-- -->`, e até o próprio `document`. É em `Node` que vivem propriedades bem genéricas, como `parentNode` e `childNodes` (que, atenção, incluem nós de texto — quebras de linha e espaços viram nós de texto também).
- **`Element`** — herda de `Node`, e representa especificamente nós que são **tags** (HTML ou SVG). É em `Element` que aparecem `parentElement`, `children`, `closest()` — todos ignorando nós de texto, trabalhando só com tags de verdade.
- **`HTMLElement`** — herda de `Element`, e é a especialização para tags **HTML** (em oposição a SVG). É aqui que moram `id`, `className`/`classList`, `style`, `innerText`, `innerHTML` — as propriedades mais usadas no dia a dia.

Essa cadeia (`Node` → `Element` → `HTMLElement`) explica, por exemplo, por que se usa `children` (de `Element`) em vez de `childNodes` (de `Node`) quando se quer navegar só pelas tags de um elemento, ignorando quebras de linha e espaços que o navegador também registra como nós.

3.3 - Navegação na árvore via código

```javascript
const main = document.querySelector("main");

main.parentElement;         // Element | null — o pai (body)
main.children;               // HTMLCollection — filhos diretos (só tags, sem texto)
main.firstElementChild;      // Element | null — primeiro filho
main.lastElementChild;       // Element | null — último filho
main.closest("body");        // Element | null — sobe pelos ancestrais até achar quem casa
```

`closest()` sobe a árvore (procura em si mesmo, depois no pai, depois no avô, e assim por diante, até achar um elemento que case com o seletor, ou até chegar no topo sem achar nada — retornando `null`). `children` desce **um único nível**, nunca mais que isso. Ambos seguem exatamente essa mesma árvore de `Node`/`Element` descrita acima.

3.4 - Os cinco métodos de seleção e a cardinalidade

| Método | O que seleciona | Retorno |
|---|---|---|
| `querySelector(seletor)` | 1º elemento que casa com um seletor **CSS** | `Element` ou `null` |
| `querySelectorAll(seletor)` | todos que casam com um seletor **CSS** | `NodeList` **estática** |
| `getElementById(id)` | elemento com aquele `id` | `Element` ou `null` |
| `getElementsByClassName(classe)` | todos com aquela `class` | `HTMLCollection` **viva** |
| `getElementsByTagName(tag)` | todos daquela tag | `HTMLCollection` **viva** |

O detalhe que geralmente escapa: `querySelectorAll` devolve uma **NodeList estática** — é uma foto do DOM no momento da chamada; se elementos forem adicionados ou removidos depois, essa lista **não muda sozinha**. Já `getElementsByClassName`/`getElementsByTagName` devolvem uma **HTMLCollection viva** — ela se atualiza automaticamente se o DOM mudar depois (adicionar um elemento com aquela classe faz ele aparecer na coleção já obtida, sem precisar chamar o método de novo). Essa diferença já causou bugs sutis em código real: iterar uma `HTMLCollection` viva enquanto se remove elementos dela pode pular itens, porque a coleção encolhe no meio da iteração.

A cardinalidade de `id` (1 para 1: nunca se repete no documento) e `class` (n para n: um elemento pode ter várias, e uma classe pode estar em vários elementos) é o que explica, na raiz, por que `getElementById`/`querySelector("#id")` nunca retornam lista, e por que os demais sempre retornam coleção.

3.5 - Seletores CSS = seletores do JS

```css
A B    {}   /* descendente: qualquer filho, em qualquer nível */
A > B  {}   /* filho direto */
A + B  {}   /* irmão imediato */
A ~ B  {}   /* irmãos subsequentes */
[type="text"] {}    /* atributo com valor exato */
[href^="https"] {}  /* atributo que começa com */
:first-child {}     /* primeiro filho do pai */
:hover {}           /* estado: mouse sobre o elemento */
```

`querySelector`/`querySelectorAll` aceitam qualquer seletor CSS válido — inclusive esses de hierarquia, atributo e pseudo-classe — porque implementam a mesma linguagem de seleção do CSS. Os `getElementBy*` não: cada um entende apenas o critério do próprio nome (só id, só classe, só tag), nunca uma combinação.

3.6 - `style` e manipulação

```javascript
const destaque = document.querySelector(".destaque");

destaque.style.backgroundColor = "#f0f0f0"; // kebab-case → camelCase
destaque.style.fontSize = "18px";

destaque.append(" 🚀");                     // adiciona no final
destaque.prepend("🔥 ");                    // adiciona no início
destaque.innerText = "Novo texto";          // só o texto
destaque.innerHTML = "<em>Novo</em>";       // HTML interno
destaque.remove();                          // remove da árvore

const botao = document.createElement("button");
botao.setAttribute("id", "meuBotao");
document.body.append(botao);
```

4 - Aula 03: Build, Vite e Listeners

4.1 - O que é um build

**Build** é o processo que transforma o código-fonte (múltiplos arquivos, sintaxes modernas, às vezes código que o navegador não entende direto) no conjunto de arquivos otimizado e compatível que efetivamente vai para produção. Ferramentas que automatizam isso são **build tools** — o Vite é uma delas, entre outras (Webpack, Parcel, esbuild).

4.2 - Vite: HMR e pré-compilação

- **HMR (Hot Module Replacement)**: sem ele, qualquer alteração exige recarregar a página inteira, perdendo todo o estado em memória (valores de formulário, scroll, estado de componentes). O Vite mantém uma conexão viva (via WebSocket) com o navegador; ao salvar um arquivo, ele identifica qual módulo mudou e envia só essa atualização, que o navegador aplica sem recarregar.
- **Pré-compilação**: transforma sintaxes que o navegador não entende (TypeScript, por exemplo) em JavaScript puro — aprofundada na Aula 05.

4.3 - Listeners: `addEventListener` e o catálogo de eventos

```javascript
botao.addEventListener("click", function (event) { ... });
```

Eventos mais usados: `click`, `dblclick` (clique duplo); `mouseover`/`mouseout` (o ponteiro entra/sai — **propagam** para filhos); `mouseenter`/`mouseleave` (equivalentes que **não propagam**); `keydown`/`keyup`; `input` (a cada digitação); `change` (ao perder o foco, ou mudar select/checkbox); `focus`/`blur`; `submit`; `load` (recurso terminou de carregar); `DOMContentLoaded` (HTML terminou de ser parseado, sem esperar imagens/estilos).

4.4 - `target` vs `currentTarget`

- **`event.target`** — o elemento onde o evento **efetivamente ocorreu**. Pode ser um filho interno.
- **`event.currentTarget`** — o elemento **no qual o listener foi registrado**. Dentro do próprio handler, `this` também aponta para `currentTarget` (quando o handler é uma `function` tradicional, não uma arrow function).

```javascript
container.addEventListener("click", function (event) {
  console.log(event.target);         // pode ser um <span> dentro de um <button>
  console.log(event.currentTarget);  // sempre "container"
  const item = event.target.closest(".item"); // acha o elemento "clicável" real
});
```

4.5 - `preventDefault()`, `stopPropagation()` e as três fases do evento

Todo evento percorre até três fases: **capturing** (desce da raiz do documento até o elemento alvo), **target** (chega no elemento onde o evento ocorreu de fato) e **bubbling** (sobe do alvo de volta até a raiz). Por padrão, `addEventListener` registra o listener para a fase de **bubbling** — a mais comum na prática. A fase de capturing só é ativada passando `{ capture: true }` como terceiro argumento:

```javascript
// escuta na fase de capturing (menos comum) em vez de bubbling
container.addEventListener("click", handler, { capture: true });
```

É o bubbling que explica por que um clique em um filho também dispara os listeners dos elementos pai (o evento "sobe" por eles). `stopPropagation()` interrompe exatamente essa subida — nenhum listener de ancestral, registrado no mesmo tipo de evento, é disparado depois dele. Já `preventDefault()` não tem nada a ver com propagação: ele cancela o **comportamento padrão do navegador** associado àquele evento (um link navegar, um form recarregar a página), continuando a propagação normalmente — os dois podem, inclusive, ser chamados juntos no mesmo handler, resolvendo dois problemas diferentes ao mesmo tempo.

4.6 - Forms

Atributos: `value`, `placeholder`, `disabled` (não envia no submit), `readonly` (envia, mas não edita), `checked`, `required`, `name`, `type`. O listener de `submit` é sempre registrado no `<form>` (nunca em cada input isolado, nem só no botão), porque ele engloba todos os campos internos — e `preventDefault()` ali dentro é o que evita o reload padrão da página ao enviar.

5 - Aula 04: window e document

5.1 - A hierarquia completa

`document` não é um objeto independente — é uma **propriedade** de `window`, que representa a própria aba/janela do navegador e é o verdadeiro objeto global do JS de frontend:

```javascript
console.log(window.document === document); // true
```

`window` é o topo de tudo: não existe nada "acima" dele no ambiente do frontend. Dentro dele vivem, entre outras coisas: `document` (a árvore DOM da página carregada), `localStorage`/`sessionStorage` (armazenamento), `fetch` (requisições), `console` (logs), `navigator` (dados do navegador/dispositivo), `location` (URL atual) e `innerWidth`/`innerHeight` (dimensões da própria janela). O JS de frontend permite omitir o prefixo `window.` para esses membros globais — por isso se escreve `document.querySelector(...)` e não `window.document.querySelector(...)` — mas o prefixo continua existindo por trás, e é por isso que `window.document === document` é sempre `true`.

Uma consequência prática dessa hierarquia: `window` aceita seus próprios eventos, que pertencem à janela como um todo (não a um elemento específico da árvore de `document`):

```javascript
window.addEventListener("resize", function () {
  console.log("nova largura:", window.innerWidth);
});
window.addEventListener("scroll", function () {
  console.log("posição do scroll:", window.scrollY);
});
```

5.2 - DevTools, cookies, JWT e CORS (revisão rápida)

DevTools (`Ctrl+Shift+I`): **Elements** mostra o DOM em memória (já parseado, não o HTML original), **Console** exibe logs e executa JS ao vivo contra o `window`/`document` da própria aba, **Network** mostra a cascata de requisições. Cookies resolvem o caráter *stateless* do HTTP (`Max-Age`, `HttpOnly`, `Secure`). JWT é `header.payload.signature`, com o *secret* guardado só no backend. CORS existe pela *same-origin policy* (protocolo + domínio + porta), liberada via `Access-Control-Allow-Origin`.

6 - Aula 05: TypeScript, Generics e Pré-Compilação

6.1 - Por que o navegador só entende JavaScript puro

```typescript
function calcular(valor: number): number { return valor + 10; }
// enviado direto ao navegador: ✗ SyntaxError: Unexpected token ':'
```

TypeScript precisa ser **transpilado** para JavaScript puro antes de chegar ao navegador (ou ao Node) — é essa tarefa que um pré-compilador como o Vite automatiza, junto com minificação (reduz tamanho removendo espaços/comentários e encurtando nomes) e bundling (agrupa múltiplos arquivos em poucos bundles, reduzindo requisições HTTP).

6.2 - Generics: o problema e a solução

Sem generics, duplica-se a função para cada tipo:

```typescript
function wrapString(valor: string): string { return valor; }
function wrapNumber(valor: number): number { return valor; }
```

Com `<T>` — um placeholder de tipo que o TypeScript infere na própria chamada:

```typescript
function wrap<T>(valor: T): T { return valor; }
wrap("hello"); // T = string
wrap(42);      // T = number

// constraint: T precisa ter uma propriedade id
function getId<T extends { id: number }>(obj: T): number {
  return obj.id;
}
```

O uso mais prático no curso é tipar respostas do Axios:

```typescript
async function userListApi(): Promise<Usuario[]> {
  const response = await clientApi.get<Usuario[]>("/users");
  return response.data;
}
```

`clientApi.get<Usuario[]>()` diz ao TypeScript que a propriedade `data` daquela resposta é `Usuario[]` — uma função de API type-safe para qualquer tipo, sem duplicar código. `Promise<T>` no retorno de `userListApi` segue a mesma lógica: é o próprio generic embutido no tipo de retorno de uma função `async`.

6.3 - Estrutura `resources/` → `public/`

Pasta de origem (`resources/`, com os `.ts` e o `index.html`) e pasta de destino (`public/`, com o JavaScript compilado). Em desenvolvimento (`npm run dev`), o Vite serve tudo em memória via watcher; em produção (`npm run build`), gera de fato os arquivos finais minificados em `public/`.

7 - Referências

MDN — Document Object Model (DOM), Node, Element, HTMLElement
MDN — Window, EventTarget.addEventListener(), Event.target, Event.currentTarget, Event.preventDefault(), Event.stopPropagation()
Nginx Documentation — try_files Directive
Vite Documentation — Features, Server Options, Build Options
TypeScript Handbook — Generics




Questões do TA:



QUESTÃO 1
Sobre a diretiva `try_files $uri $uri/ =404;` em uma configuração do Nginx, é correto afirmar que:

A) O Nginx testa os três argumentos ao mesmo tempo e escolhe aleatoriamente qual resposta enviar.

B) `$uri` tenta servir o caminho como arquivo; se não existir, `$uri/` tenta o mesmo caminho como diretório (servindo seu index); se nenhum dos dois existir, `=404` responde com esse status.

C) `=404` é sempre executado primeiro, e só depois o Nginx tenta `$uri` e `$uri/` como alternativa.

D) `$uri/` serve arquivos estáticos apenas quando o Nginx está rodando fora de um container Docker.

E) A diretiva `try_files` é usada exclusivamente para servir arquivos `.html`, nunca diretórios.

Gabarito: B)

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 2
Sobre a árvore DOM e a cardinalidade dos atributos `id` e `class`, é correto afirmar que:

A) `id` e `class` têm a mesma cardinalidade, já que ambos podem se repetir livremente em quantos elementos forem necessários.

B) `id` estabelece uma relação 1 para 1 (não se repete no documento), enquanto `class` estabelece uma relação n para n (um elemento pode ter várias classes, e uma classe pode estar em vários elementos) — por isso `getElementById` sempre retorna um elemento único ou `null`, enquanto `getElementsByClassName` retorna uma coleção.

C) `class` é 1 para 1 e `id` é n para n, o inverso do que a maioria dos desenvolvedores assume.

D) A cardinalidade de `id` e `class` depende apenas da ordem em que os elementos aparecem no HTML, não de nenhuma regra fixa.

E) `getElementById` retorna uma `HTMLCollection`, exatamente como `getElementsByClassName`.

Gabarito: B)

Misturar as alternativas? (x ) Sim (  ) Não


QUESTÃO 3
Sobre `event.target` e `event.currentTarget` dentro de um listener registrado com `addEventListener`, é correto afirmar que:

A) `event.target` é o elemento onde o evento efetivamente ocorreu (podendo ser um filho interno), enquanto `event.currentTarget` é o elemento no qual o listener foi registrado — o que justifica usar `closest()` a partir do `target` para achar o elemento de interesse.

B) `event.target` e `event.currentTarget` são sempre idênticos, não importa onde o clique ocorra dentro do elemento.

C) `event.currentTarget` é o elemento onde o evento ocorreu, enquanto `event.target` é o elemento onde o listener foi registrado.

D) `event.target` só existe em eventos de teclado, nunca em eventos de clique.

E) `closest()` só pode ser chamado a partir de `event.currentTarget`, nunca a partir de `event.target`.

Gabarito: A)

Misturar as alternativas? (x ) Sim (  ) Não


QUESTÃO 4
Sobre a relação entre os objetos `window` e `document`, é correto afirmar que:

A) `window` e `document` são objetos completamente independentes, sem nenhuma relação hierárquica entre si.

B) `document` é uma propriedade de `window`, que representa a própria janela/aba do navegador e expõe outras APIs, como `localStorage` e eventos próprios (`resize`, `scroll`), que não pertencem a `document`.

C) `window` é uma propriedade de `document`, acessível apenas depois que o DOM termina de ser parseado.

D) `window.document === document` retorna `false` em qualquer navegador atualizado.

E) `document` é exclusivo de ambientes de backend (Node), enquanto `window` é exclusivo do navegador.

Gabarito: B)

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 5
Sobre generics em TypeScript, considerando a função abaixo:

function wrap<T>(valor: T): T {
  return valor;
}

é correto afirmar que:

A) `<T>` obriga o desenvolvedor a especificar manualmente o tipo em toda chamada da função, nunca podendo ser inferido.

B) `<T>` é um placeholder de tipo que o TypeScript infere a partir do argumento passado na chamada, permitindo que a mesma função funcione para qualquer tipo sem duplicar código e sem perder segurança de tipos.

C) Generics eliminam a necessidade de tipar o retorno da função, que passa a ser sempre `any`.

D) `wrap<T>` só pode ser usada com tipos primitivos (`string`, `number`, `boolean`), nunca com objetos.

E) Generics são exclusivos de bibliotecas como o Axios e não podem ser usados em funções definidas pelo próprio desenvolvedor.

Gabarito: B)

Misturar as alternativas? (x ) Sim (  ) Não
