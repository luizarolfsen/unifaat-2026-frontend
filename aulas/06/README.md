# Aula 06 — Revisão Geral

**Disciplina:** Frontend
**Semestre:** 2026.2
**Professor:** Luan Tavares Lourenço

---

## 1. Introdução

Esta aula não introduz conteúdo novo — ela amarra os fios que já foram passados entre as Aulas 01 a 05. Não vamos mexer em código: o objetivo é revisitar cada conceito na ordem em que ele apareceu, entender por que ele apareceu naquele momento e reforçar os pontos que costumam gerar confusão.

O fio condutor do bimestre foi este: tudo começou com um HTML aberto direto no navegador, sem nenhuma ferramenta por trás. Aula a aula, dois eixos cresceram em paralelo:

1. **A estrutura do próprio frontend** — de um arquivo solto para arquivos estáticos servidos por Nginx (Aula 01), depois manipulados via DOM e estilizados via CSS (Aula 02), depois organizados com Vite e formulários (Aula 03), e por fim escritos em TypeScript com generics (Aula 05).
2. **A comunicação com o backend e o navegador como ambiente** — cookies, JWT, CORS e as ferramentas do DevTools (Aula 04).

Vamos passar por cada aula nessa ordem.

---

## 2. Aula 01 — Arquivos Estáticos e Nginx

### 2.1 — Por que não abrir o HTML direto no navegador

Existem três formas de "rodar" um HTML:

1. 😔 **Abrir o arquivo direto no navegador** (duplo clique no `index.html`). Funciona, mas é o método de iniciante: não simula nada parecido com produção, caminhos relativos e requisições podem se comportar de forma diferente, e não existe nenhum controle sobre como os arquivos são entregues.
2. 😐 **Criar um backend só para servir arquivos estáticos.** Funciona, mas é caro: subir um servidor de aplicação (Node, por exemplo) só para devolver HTML/CSS/JS sem nenhuma lógica de negócio é desperdício de recurso.
3. 😀 **Usar um servidor web dedicado a isso — Nginx, rodando em Docker.** Essa é a abordagem do curso.

### 2.2 — Por que Nginx especificamente

Nginx é um servidor web feito para exatamente essa tarefa: entregar arquivos estáticos (HTML, CSS, JS, imagens) de forma rápida e eficiente, sem precisar de um runtime de aplicação por trás. Rodando dentro de um container Docker:

- O `docker-compose` cria uma rede interna para os containers do projeto;
- O diretório local `./public` é mapeado para `/usr/share/nginx/html` dentro do container;
- Tudo que existe em `./public` passa a ser servido pelo Nginx, acessível via `http://localhost:[porta]` — exatamente como aconteceria em produção.

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

**O ganho real**: ambiente de servidor de verdade, sem custo de um backend, e padronizado via Docker — o mesmo container que roda no seu computador é o que rodaria em produção.

### 2.3 — A diretiva `try_files`

Essa é a linha que efetivamente decide como cada requisição é resolvida, e por isso merece ser lida com calma:

```nginx
try_files $uri $uri/ =404;
```

O Nginx testa os argumentos **em ordem**, da esquerda para a direita, e usa o **primeiro que existir**:

1. **`$uri`** — tenta servir o caminho pedido exatamente como veio na URL, como **arquivo**. Uma requisição para `/sobre.html` procura por `sobre.html` dentro de `root`.
2. **`$uri/`** — se o primeiro não existir, tenta o mesmo caminho como **diretório** (repare na barra no final). Uma requisição para `/blog` procura por uma pasta `blog/` e, dentro dela, serve o arquivo definido em `index` (no caso, `index.html`).
3. **`=404`** — se nenhum dos dois existir, o Nginx desiste e responde com o status `404` diretamente, sem tentar mais nada.

```
requisição: GET /blog
   ↓
1) existe arquivo "blog"?          → não
2) existe diretório "blog/"?       → sim → serve blog/index.html
   (se não existisse, cairia no passo 3)
3) responde 404
```

**Por que essa diretiva existe**: sem ela, o Nginx tentaria interpretar a URL de um jeito só (por exemplo, só como arquivo), e qualquer link para uma pasta sem barra no final, ou qualquer rota que não bata 1-para-1 com um arquivo físico, quebraria. `try_files` é o que permite esse encadeamento de tentativas — primeiro o mais específico (arquivo exato), depois o mais genérico (pasta com index), e só então falha.

---

## 3. Aula 02 — Seletores do DOM e CSS

### 3.1 — A árvore DOM: pais, filhos e irmãos

Antes de falar de seletores, vale fixar o que eles selecionam de dentro: o **DOM (Document Object Model)** é a representação do HTML, depois de parseado, como uma **árvore de nós**. Cada tag vira um nó, e esses nós se relacionam exatamente como uma árvore genealógica:

- **Pai (parent)** — o nó que contém outro diretamente. `<body>` é pai de `<header>` se `<header>` está escrito dentro dele.
- **Filho (child)** — o nó contido diretamente por outro. `<header>` é filho de `<body>`.
- **Irmãos (siblings)** — nós que compartilham o mesmo pai. Se `<header>` e `<main>` estão os dois dentro de `<body>`, eles são irmãos entre si.
- **Descendente/Ancestral** — a mesma relação, mas não necessariamente direta: um nó dentro de um nó dentro de outro nó continua sendo descendente do primeiro, mesmo sem ser filho direto.

```html
<body>              <!-- pai de header, main e footer -->
  <header>...</header>   <!-- filho de body; irmão de main e footer -->
  <main>
    <article>...</article> <!-- filho de main; neto/descendente de body -->
  </main>
  <footer>...</footer>    <!-- filho de body; irmão de header e main -->
</body>
```

Essa relação de parentesco é exatamente o que os métodos de navegação da Vendor API expõem em código:

```javascript
const main = document.querySelector("main");

main.parentElement;       // Element | null — o pai (body)
main.children;             // HTMLCollection — os filhos diretos (article)
main.firstElementChild;    // Element | null — o primeiro filho
main.lastElementChild;     // Element | null — o último filho
main.closest("body");      // Element | null — sobe pelos ancestrais até achar quem casa
```

Não é acaso que `closest()` "sobe" e `children` "desce apenas um nível": eles seguem exatamente a mesma estrutura de árvore que o navegador construiu ao parsear o HTML. Entender essa árvore é o que explica, mais adiante, por que um clique em um elemento filho também é visto pelos listeners registrados nos elementos pai (Seção 4.5).

### 3.2 — Os cinco métodos de seleção

Esse é o núcleo mais cobrado da revisão. Cada método tem um retorno diferente — e é exatamente esse retorno que costuma confundir:

| Método | O que seleciona | O que retorna |
|---|---|---|
| `document.querySelector(seletor)` | o **primeiro** elemento que casa com um seletor **CSS** | um `Element` único, ou `null` se não achar nada |
| `document.querySelectorAll(seletor)` | **todos** os elementos que casam com um seletor **CSS** | uma `NodeList` (parece array, mas não é um array de JS puro) |
| `document.getElementById(id)` | o elemento com aquele `id` | um `Element` único, ou `null` (nunca uma lista — `id` é único no documento) |
| `document.getElementsByClassName(classe)` | todos os elementos com aquela `class` | uma `HTMLCollection` (coleção "viva": atualiza sozinha se o DOM mudar) |
| `document.getElementsByTagName(tag)` | todos os elementos daquela tag | uma `HTMLCollection` |

```javascript
const titulo = document.querySelector("h1");           // Element | null
const itens = document.querySelectorAll("li");          // NodeList
const form = document.getElementById("loginForm");      // Element | null
const botoes = document.getElementsByClassName("btn");  // HTMLCollection
const paragrafos = document.getElementsByTagName("p");  // HTMLCollection
```

**Por que `querySelector`/`querySelectorAll` ganharam a preferência no curso**: eles aceitam qualquer seletor CSS — tag, classe, id, hierarquia, atributo, pseudo-classe — enquanto os `getElementBy*` só entendem exatamente o critério do próprio nome (só id, só classe, só tag).

### 3.2 — Cardinalidade: por que `id` retorna um e `class` retorna vários

A diferença de retorno acima não é acidente de API — ela reflete a própria regra do HTML:

- **`id` é 1 para 1**: um elemento tem no máximo um `id`, e aquele `id` não pode se repetir em nenhum outro elemento do documento. Por isso `getElementById` e um `querySelector("#meuId")` **sempre** devolvem um elemento único (ou `null`).
- **`class` é n para n**: um elemento pode ter várias classes, e uma mesma classe pode estar em quantos elementos forem necessários. Por isso buscar por classe naturalmente devolve uma coleção.

### 3.3 — Exemplos de seletores (a mesma sintaxe do CSS)

O motivo de `querySelector`/`querySelectorAll` serem tão poderosos é que eles falam a **mesma linguagem de seleção do CSS** — o que estiliza também seleciona:

```css
/* seletores de hierarquia */
*      {}   /* todos os elementos */
A B    {}   /* descendente: qualquer filho, em qualquer nível, dentro de A */
A > B  {}   /* filho direto: B precisa ser filho imediato de A */
A + B  {}   /* irmão imediato: B vem logo depois de A, mesmo pai */
A ~ B  {}   /* irmãos subsequentes: B vem depois de A, mesmo pai */

/* seletores de atributo */
[disabled] {}       /* possui o atributo disabled */
[type="text"] {}     /* atributo com valor exatamente "text" */
[href^="https"] {}   /* valor do atributo começa com "https" */
[src$=".png"] {}     /* valor do atributo termina com ".png" */

/* pseudo-classes */
:first-child {}   /* primeiro filho do pai */
:last-child {}    /* último filho do pai */
:nth-child(n) {}  /* posição n entre os filhos */
:hover {}         /* enquanto o mouse está sobre o elemento */
:focus {}         /* enquanto o elemento está em foco */
```

```javascript
// os mesmos seletores usados em CSS funcionam em querySelector/querySelectorAll
const primeiroLink = document.querySelector("section > ul li a");    // Element | null
const inputsTexto = document.querySelectorAll('[type="text"]');       // NodeList
const primeirosFilhos = document.querySelectorAll(".lista :first-child"); // NodeList
```

### 3.4 — `style`, navegação na árvore e manipulação

```javascript
const destaque = document.querySelector(".destaque");

// style: acessa CSS via objeto — kebab-case vira camelCase
destaque.style.backgroundColor = "#f0f0f0"; // equivale a background-color
destaque.style.fontSize = "18px";           // equivale a font-size

// navegação na árvore
destaque.children;            // HTMLCollection — filhos diretos (sem nós de texto)
destaque.firstElementChild;   // Element | null
destaque.lastElementChild;    // Element | null
destaque.parentElement;       // Element | null
destaque.closest(".container"); // Element | null — sobe a árvore até achar quem casa
```

```javascript
const titulo = document.getElementById("titulo");

titulo.append(" 🚀");                      // adiciona conteúdo no final
titulo.prepend("🔥 ");                     // adiciona conteúdo no início
titulo.innerText = "Novo título";          // altera só o texto
titulo.innerHTML = "<em>Novo título</em>"; // altera o HTML interno
titulo.remove();                           // remove o elemento

const botao = document.createElement("button"); // cria um novo elemento
botao.setAttribute("id", "meuBotao");           // define um atributo
botao.getAttribute("id");                       // lê um atributo
document.body.append(botao);                    // insere como filho
```

### 3.5 — display, responsividade e CSS como commodity

`display` decide como o elemento se comporta no fluxo da página: `block` ocupa toda a largura e quebra linha (padrão de `div`/`p`); `inline` ocupa só o espaço do conteúdo e não aceita `width`/`height` (padrão de `span`/`a`); `inline-block` é o meio-termo — não quebra linha, mas aceita dimensões.

```css
@media (max-width: 768px) {
  body { background-color: lightblue; }
}
```

Media queries aplicam CSS condicionado ao tamanho de tela — base da responsividade. E vale a virada de perspectiva: em produção, CSS puro escrito do zero é cada vez mais raro — frameworks como Bootstrap e Tailwind resolvem a maior parte dos casos comuns. Entender seletor, propriedade e `display` na unha é o que permite entender o que essas classes prontas fazem por baixo, em vez de usá-las como caixa-preta.

---

## 4. Aula 03 — Vite, Build e Listeners

### 4.1 — O que é um build

**Build** é o processo que pega o código-fonte como o desenvolvedor escreve — múltiplos arquivos, sintaxes modernas, às vezes código que o navegador não entende direto — e o transforma no conjunto de arquivos otimizado e compatível que efetivamente vai para produção. Ferramentas que fazem esse trabalho são **build tools** (ou bundlers). O Vite é uma delas.

### 4.2 — Vite: HMR e pré-compilação

O Vite tem duas finalidades:

- **HMR (Hot Module Replacement)**: sem ele, qualquer alteração exige recarregar a página inteira, perdendo estado (valores de formulário, scroll). Com HMR, o Vite mantém uma conexão ativa com o navegador e, ao salvar um arquivo, identifica exatamente qual módulo mudou e substitui só ele, em tempo real.
- **Pré-compilação**: é o que permite escrever em TypeScript e sintaxes modernas — o navegador recebe sempre JavaScript puro na saída (aprofundado na Aula 05).

Toda configuração parte do `vite.config.js`:

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
    root: 'public',
    server: {
        open: (process.env.IS_CONTAINER !== "TRUE"),
        hmr: true,
        host: true,   // aceita conexões de fora do localhost
        port: 5173
    }
})
```

### 4.3 — Listeners: revisão de `addEventListener`

```javascript
const botao = document.querySelector("#meuBotao");

botao.addEventListener("click", function (event) {
  console.log("cliquei");
});
```

`addEventListener` registra uma função callback que o navegador chama sozinho quando o evento acontece. Principais eventos: `click`, `dblclick`, `mouseover`/`mouseout` (propagam para filhos), `mouseenter`/`mouseleave` (não propagam), `keydown`/`keyup`, `input` (a cada digitação), `change` (ao perder o foco ou mudar select/checkbox), `focus`/`blur`, `submit`, `load`, `DOMContentLoaded`.

### 4.4 — `target` vs `currentTarget`

Este é o par que mais gera confusão, então vale fixar a regra:

- **`event.target`** — o elemento onde o evento **efetivamente ocorreu**. Pode ser um filho interno do elemento que tem o listener.
- **`event.currentTarget`** — o elemento **no qual o listener foi registrado**.

```javascript
container.addEventListener("click", function (event) {
  console.log("target:", event.target);               // pode ser um filho
  console.log("currentTarget:", event.currentTarget);  // sempre "container"

  // closest sobe a árvore a partir do target até achar o elemento clicável
  const item = event.target.closest(".item");
});
```

Isso justifica, na prática, usar `closest()` dentro de um handler para achar o elemento "clicável" mesmo quando o clique bate num filho interno — como um `<span>` dentro de um `<button>`.

### 4.5 — `preventDefault()` e `stopPropagation()`

Outro par que costuma ser confundido — cada um resolve um problema diferente:

- **`event.preventDefault()`** — cancela o **comportamento padrão do navegador** para aquele evento (um link navegar, um formulário recarregar a página ao ser enviado). Não impede o evento de continuar se propagando.
- **`event.stopPropagation()`** — impede que o evento continue **se propagando pela árvore**, ou seja, que listeners de elementos ancestrais sejam disparados pelo mesmo evento. Não cancela nenhum comportamento padrão.

```javascript
link.addEventListener("click", function (event) {
  event.preventDefault();      // cancela a navegação do link
});

item.addEventListener("click", function (event) {
  event.stopPropagation();     // impede que o clique "borbulhe" para os pais
});
```

**Fases do evento**: todo evento percorre até três fases — *capturing* (desce da raiz até o alvo), *target* (chega no elemento onde ocorreu) e *bubbling* (sobe do alvo de volta até a raiz). Por padrão, `addEventListener` escuta na fase de bubbling — é por isso que um clique em um filho também dispara os listeners dos pais, e é exatamente essa propagação que `stopPropagation()` interrompe.

### 4.6 — Forms e o evento `submit`

```html
<form id="form-usuario">
  <input type="text" name="nome" placeholder="Nome" required>
  <input type="email" name="email" required>
  <input type="checkbox" name="ativo" checked>
  <button type="submit">Salvar</button>
</form>
```

Atributos principais: `value` (valor atual), `placeholder` (texto de exemplo), `disabled` (desabilita e **não** envia no submit), `readonly` (não edita, mas **envia** no submit), `checked` (checkbox/radio marcado), `required` (exige preenchimento), `name` (identifica o campo), `type` (tipo do input).

```javascript
const formulario = document.querySelector("#form-usuario");

formulario.addEventListener("submit", function (event) {
  event.preventDefault(); // evita o reload padrão da página

  const nome = formulario.nome.value;
  const email = formulario.email.value;
});
```

O listener de `submit` é registrado no próprio `<form>` — nunca em cada input isolado ou só no botão — porque ele engloba todos os campos internos.

---

## 5. Aula 04 — O Navegador como Ambiente

### 5.1 — `window` e `document`: quem é o quê

Esse é o ponto que mais vale reforçar nesta aula: até aqui, `document` foi tratado como se fosse o próprio ambiente do frontend. Na prática, ele é só uma **propriedade** de um objeto maior — `window` — que representa a própria aba/janela do navegador, e é o verdadeiro objeto global do JS de frontend:

```javascript
// document não é um objeto isolado — é uma propriedade de window
console.log(window.document === document); // true
```

A relação é hierárquica, não uma equivalência entre dois objetos soltos:

- **`window`** — o ambiente inteiro: a aba do navegador. É dentro dele que tudo mais vive.
- **`document`** — uma das propriedades de `window`, especificamente a que representa **a árvore DOM da página carregada** (Seção 3.1).

```javascript
// tudo que parece "solto" no JS de frontend é, na verdade, de window
window.document           // a árvore DOM (o que já vínhamos chamando de "document")
window.localStorage       // armazenamento
window.fetch               // requisições HTTP
window.console             // logs
window.innerWidth, window.innerHeight  // dimensões da própria janela
window.location.href                    // URL atual da aba
```

Por isso é possível escrever só `document.querySelector(...)` em vez de `window.document.querySelector(...)` — o JS de frontend permite omitir o prefixo `window.` para esses membros globais, mas o prefixo continua existindo por trás. E é também por isso que `window` aceita seus próprios eventos — coisas que pertencem à janela como um todo, não a um elemento específico da árvore do `document`:

```javascript
// resize e scroll pertencem a window, não a document
window.addEventListener("resize", function () {
  console.log("nova largura:", window.innerWidth);
});

window.addEventListener("scroll", function () {
  console.log("posição do scroll:", window.scrollY);
});
```

**Resumindo a hierarquia**: `window` é o ambiente; `document` é a árvore DOM que vive dentro dele; e cookies, `localStorage` e `sessionStorage` (Seção 5.2) também são acessados a partir de `window` — nunca de um objeto isolado.

### 5.2 — DevTools, cookies, JWT e CORS

O DevTools (`Ctrl+Shift+I`) expõe a memória do navegador na prática: **Elements** mostra o DOM já parseado em memória (não o HTML original recebido do servidor), **Console** exibe logs e executa JS ao vivo contra o `window`/`document` da própria aba aberta, **Network** mostra a cascata de requisições conforme o navegador descobre assets durante o parsing do HTML.

Cookies resolvem o caráter *stateless* do HTTP — o navegador reenvia automaticamente os cookies de um domínio em toda requisição futura para ele. `Max-Age` define por quanto tempo o cookie vive, `HttpOnly` o torna inacessível via `document.cookie` (protegendo contra roubo por script malicioso), `Secure` exige HTTPS. JWT é um token de autenticação *stateless*, dividido em `header.payload.signature` — qualquer um lê o payload (é só Base64), mas só quem tem o *secret* (guardado só no backend, em `.env`) consegue gerar uma assinatura válida. CORS existe porque o navegador aplica a *same-origin policy*: protocolo, domínio e porta juntos formam a origem, e o backend precisa liberar explicitamente outras origens via `Access-Control-Allow-Origin`.

---

## 6. Aula 05 — TypeScript, Generics e Pré-Compilação

### 6.1 — Por que o navegador (e o Node) só entendem JavaScript puro

O navegador não compila, não interpreta — só entende JavaScript puro (e CSS puro). Se você mandar um `.ts` direto para ele, ele quebra:

```typescript
// arquivo: calcular.ts — enviado direto para o navegador
function calcular(valor: number): number {
  return valor + 10;
}
// ✗ SyntaxError: Unexpected token ':'
```

**Transpilação** (ES6+ → ES5, TypeScript → JavaScript) e **compilação** (Sass → CSS) resolvem isso: transformam código expressivo em código que o navegador entende nativamente. É essa tarefa que um **pré-compilador** automatiza — o Vite compila TypeScript e aplica minificação (reduz tamanho) e bundling (agrupa arquivos em poucos bundles).

### 6.2 — Tipar para escalar

```typescript
let nome: string = "Ana";
let idade: number = 25;
let tags: string[] = ["frontend", "typescript"];
let id: string | number = 42; // union: pode ser string OU number

type Usuario = {
  id: number;
  nome: string;
  email: string;
};

const user: Usuario = { id: 1, nome: "Ana", email: "ana@example.com" };
```

TypeScript força que cada função declare seu contrato — que tipo recebe, que tipo retorna. Em projeto pequeno isso parece burocracia; em projeto real (múltiplos devs, milhares de linhas) é o que evita que refatorações quebrem código "que deveria funcionar".

### 6.3 — Generics: uma função para infinitos tipos

Sem generics, duplicar a função para cada tipo:

```typescript
function wrapString(valor: string): string { return valor; }
function wrapNumber(valor: number): number { return valor; }
```

Com `<T>` — um placeholder de tipo que o TypeScript infere na chamada:

```typescript
function wrap<T>(valor: T): T {
  return valor;
}

wrap("hello"); // T = string
wrap(42);      // T = number

// constraint: T precisa ter uma propriedade id
function getId<T extends { id: number }>(obj: T): number {
  return obj.id;
}
```

O maior uso prático no curso é tipar respostas do Axios:

```typescript
async function userListApi(): Promise<Usuario[]> {
  const response = await clientApi.get<Usuario[]>("/users");
  return response.data;
}
```

`clientApi.get<Usuario[]>()` diz ao TypeScript: "a propriedade `data` dessa resposta é do tipo `Usuario[]`" — uma função de API type-safe para qualquer tipo, sem duplicar código.

### 6.4 — Estrutura `resources/` → `public/`

A partir dessa aula, o projeto passa a ter uma pasta de origem (`resources/`, onde ficam os `.ts` e o `index.html`) e uma de destino (`public/`, onde o Vite entrega o JavaScript compilado). Em desenvolvimento (`npm run dev`), o Vite serve tudo em memória via watcher; em produção (`npm run build`), ele gera de fato os arquivos finais minificados em `public/`.

---

## 7. Conclusão

Esta revisão percorreu o caminho completo do bimestre:

1. **Aula 01** — arquivos estáticos servidos por Nginx via Docker, em vez de abrir o HTML direto ou gastar um backend inteiro só para isso; a diretiva `try_files` como o mecanismo que decide, em cascata, se serve um arquivo, um diretório com index, ou responde 404.
2. **Aula 02** — a árvore DOM (pais, filhos, irmãos) como base de tudo; os cinco métodos de seleção do DOM e a diferença entre retornar um elemento (`querySelector`, `getElementById`) ou uma coleção (`querySelectorAll`, `getElementsByClassName`, `getElementsByTagName`), explicada pela cardinalidade de `id` (1 para 1) e `class` (n para n); os mesmos seletores do CSS funcionam na Vendor API do JS.
3. **Aula 03** — o conceito de build por trás do Vite, HMR para produtividade, e os listeners aprofundados: `target` (onde o evento ocorreu) vs `currentTarget` (onde o listener foi registrado), `preventDefault()` (cancela comportamento padrão) vs `stopPropagation()` (interrompe a propagação pela árvore).
4. **Aula 04** — a hierarquia `window` → `document`: `document` é propriedade de `window`, que é o verdadeiro objeto global do frontend; DevTools, cookies, JWT e CORS.
5. **Aula 05** — TypeScript como tipagem que escala, generics (`<T>`) como reutilização type-safe, e o Vite como pré-compilador profissional, com a estrutura `resources/` → `public/`.

---

## 8. Referências

- **MDN Web Docs**: [Document Object Model (DOM)](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model), [EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener), [Event.target](https://developer.mozilla.org/en-US/docs/Web/API/Event/target), [Event.currentTarget](https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget), [Event.preventDefault()](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault), [Event.stopPropagation()](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation)
- **MDN**: [Window](https://developer.mozilla.org/en-US/docs/Web/API/Window), [The HTML form element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form), [Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
- **Nginx Documentation**: [try_files Directive](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files), [Serving Static Content](https://nginx.org/en/docs/beginners_guide.html)
- **Vite Documentation**: [Features](https://vitejs.dev/guide/features.html), [Server Options](https://vitejs.dev/config/server-options.html), [Build Options](https://vitejs.dev/config/build-options.html)
- **TypeScript Handbook**: [Type Basics](https://www.typescriptlang.org/docs/handbook/), [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

## 9. TF Aula 06 - Revisão Geral

📄 **[Descrição completa em TF06.md](./TF06.md)**

### Objetivo

Sem código novo nesta aula, o TF também muda de formato: **7 questões
dissertativas e conceituais**, sem exigir escrita de código — `try_files`,
a hierarquia Node/Element/HTMLElement, coleções estáticas vs. vivas,
`target`/`currentTarget`, `preventDefault`/`stopPropagation` (com as fases
do evento), `window`/`document`, e generics.

### Como entregar

🔗 https://docs.google.com/forms/d/e/1FAIpQLSeYG0oQTpWqqZGSCAsTJwpw26Yrd2laubS9VVqqAA_Lr2L_Og/viewform?usp=publish-editor

Detalhes completos estão em **[TF06.md](./TF06.md)**.
