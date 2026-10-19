# Conteúdo da Prova 1 — Frontend 2026.2

---

## Mapa de estudo

| Tema | Aula | Onde treinar |
|---|---|---|
| `try_files` e Nginx | 01 | Parte 1 |
| Árvore DOM, `closest`, `children`, seletores | 01 e 02 | Parte 2 |
| `target`, `currentTarget`, delegação, `preventDefault`, `stopPropagation` | 02 e 03 | Parte 3 |
| `window` e `document` | 04 | Parte 4 |
| Pré-compilador / Vite | 03 e 05 | Parte 5 |
| **TypeScript: primitivos, objetos, funções e generics** | **05** | **Parte 6** |

---

## 1. Nginx e `try_files` (Aula 01)

O Nginx serve **arquivos estáticos** direto do sistema de arquivos, sem passar pelo backend (sem rota, sem middleware, sem controller). É mais rápido e é o que se usa em produção.

```nginx
server {
    listen 80;
    root /var/www;
    index index.html;
    location / {
        try_files $uri $uri/ =404;
    }
}
```

`try_files` recebe uma **lista de tentativas, avaliada em ordem, da esquerda para a direita**. A primeira que der certo vence e as outras nem são olhadas:

1. `$uri` → o caminho pedido existe como **arquivo**? Serve.
2. `$uri/` → (com a barra no final) existe como **diretório**? Serve o `index` dele.
3. `=404` → último recurso: nada deu certo, responde **404**. O `=404` **não é** um arquivo nem uma tentativa de busca: é a resposta final.

Exemplo: pedido `GET /blog`.

```text
1) existe o arquivo "blog"?        não
2) existe o diretório "blog/"?     sim → serve blog/index.html
```

Sem o `$uri/`, o Nginx só saberia procurar arquivos exatos: `/blog` daria 404, mesmo existindo `blog/index.html`. Até a raiz (`/`) quebraria.

**Prioridade entre `location`**: o Nginx não lê de cima para baixo. Ele escolhe o **prefixo mais longo** que casa com o caminho. `/imagens/foto.png` cai em `location /imagens/` mesmo que `location /` esteja escrito antes.

**Por que Nginx + Docker** (e não abrir o HTML com dois cliques, nem criar um backend só para servir arquivo)? Porque cria um **ambiente de servidor real**, igual à produção, sem backend desnecessário.

---

## 2. DOM, seletores e navegação na árvore (Aulas 01 e 02)

O HTML chega ao navegador como **texto**. O navegador faz o *parsing* e monta o **DOM**: uma árvore de objetos em memória. Cada tag vira um nó com **pai**, **filhos** e **irmãos**. É a mesma ideia de `JSON.parse`: texto que vira objeto manipulável.

### 2.1 Navegando na árvore

```html
<section id="loja">
  <h2>Ofertas</h2>
  <ul class="lista">
    <li class="item destaque">Caneta</li>
    <li class="item">Caderno</li>
  </ul>
</section>
```

```js
const li = document.querySelector(".item");

li.parentElement;                 // <ul class="lista">  (só o pai DIRETO)
li.closest(".lista");             // <ul class="lista">  (sobe procurando)
li.closest("section");            // <section id="loja"> (sobe vários níveis)
li.closest(".item");              // o PRÓPRIO li (começa por ele mesmo!)
li.closest("h2");                 // null (h2 é irmão do ul, não ancestral)
li.nextElementSibling;            // o próximo <li>
document.querySelector(".lista").children;      // 2 elementos <li>
document.querySelector(".lista").childNodes;    // 5 nós (2 li + 3 textos de quebra de linha)
```

O que decorar:

| | Faz o quê | Retorna |
|---|---|---|
| `parentElement` | sobe **um** nível | `Element` ou `null` |
| `closest(seletor)` | começa **no próprio elemento** e sobe por **ancestrais** até casar | `Element` ou `null` |
| `children` | filhos que são **elementos** | `HTMLCollection` |
| `childNodes` | **todos** os nós filhos, inclusive texto (espaços e quebras de linha) | `NodeList` |
| `firstElementChild` / `lastElementChild` | primeiro/último filho elemento | `Element` ou `null` |

**Pegadinhas clássicas**
- `closest()` **só sobe** (próprio elemento + ancestrais). Nunca procura irmãos nem filhos.
- `parentElement` não é "o ancestral mais externo": é só o pai imediato.
- `children` **não conta** a quebra de linha entre as tags; `childNodes` conta.

### 2.2 Selecionando

| Método | Retorna |
|---|---|
| `getElementById("x")` | `Element` ou `null` |
| `querySelector(seletor)` | **o primeiro** que casa: `Element` ou `null` |
| `querySelectorAll(seletor)` | **todos** que casam: `NodeList` |
| `getElementsByClassName` / `getElementsByTagName` | `HTMLCollection` |

`id` é **1 para 1** (um por elemento, nunca repete no documento). `class` é **n para n** (um elemento pode ter várias, e uma classe pode estar em vários elementos). Por isso id devolve um elemento e class devolve coleção.

### 2.3 Seletores (valem no CSS **e** no `querySelector`)

| Seletor | Significa |
|---|---|
| `A B` | **descendente**: B em qualquer nível dentro de A |
| `A > B` | **filho direto**: B é filho imediato de A |
| `A + B` | **irmão adjacente**: B vem logo depois de A, mesmo pai |
| `A ~ B` | **irmãos seguintes**: todo B depois de A, mesmo pai |
| `.a.b` (sem espaço) | **o mesmo elemento** tem as classes `a` **e** `b` |
| `.a .b` (com espaço) | `.b` **dentro** de `.a` |
| `[type="text"]`, `[href^="https"]`, `[src$=".png"]`, `[class*="alert"]` | atributo igual / começa com / termina com / contém |
| `:first-child`, `:last-child`, `:nth-child(n)`, `:hover`, `:focus` | estados e posições |

**Como montar um seletor difícil: traduza frase por frase.**

```html
<form class="login">
  <label class="campo">E-mail</label>
  <input type="email">
  <input type="password">
</form>
```

"O `input` que vem **imediatamente depois** de um `label.campo` que é **filho direto** do `form.login`":

```text
form.login > label.campo + input
 └ 1) filho direto ┘      └ 2) irmão adjacente
```

Dicas: `.x.y` = mesma tag com as duas classes; `+` só pega **um** irmão (o próximo); `~` pega **todos** os seguintes; um espaço aceita qualquer profundidade, `>` exige filho direto.

---

## 3. Eventos (Aulas 02 e 03)

### 3.1 `target` e `currentTarget`

```js
lista.addEventListener("click", (event) => {
  event.target;         // ONDE o clique realmente aconteceu (pode ser um filho)
  event.currentTarget;  // ONDE o listener está registrado (aqui: sempre `lista`)
});
```

Clicou num `<button>` dentro de um `<li>` dentro de `lista`? `target` é o `button`; `currentTarget` é `lista`. Se o clique pode cair num filho interno (ícone, texto), use `event.target.closest("li")` para achar o elemento que interessa.

### 3.2 Propagação e delegação

Todo evento percorre até três fases:

```text
① capturing  ↓  window → html → body → ... → pai do alvo
② target        o elemento onde aconteceu
③ bubbling   ↑  alvo → pai → ... → body → html → window
```

`addEventListener` escuta, por padrão, a fase de **bubbling**. Para escutar na de capturing: `{ capture: true }` como terceiro argumento.

Como o evento **borbulha**, dá pra registrar **um único listener no pai** e tratar os filhos pelo `target`: é a **delegação de eventos**. Vantagens: menos listeners (menos memória), e funciona também para itens **criados depois**, sem registrar nada de novo.

### 3.3 `preventDefault()` x `stopPropagation()`: problemas diferentes

| | Cancela | Exemplo |
|---|---|---|
| `event.preventDefault()` | o **comportamento padrão** do navegador (link navega, formulário recarrega a página) | `<a href="#">` não pula pro topo |
| `event.stopPropagation()` | a **propagação** (listeners dos ancestrais não disparam) | clique no filho não ativa o listener do pai |

**Um não substitui o outro**, e nenhum faz o trabalho do outro. `preventDefault` **não** impede a propagação; `stopPropagation` **não** impede a navegação.

Quando usar os dois juntos:

```html
<div class="dropdown">
  <a href="#" class="toggle">Menu ▾</a>
  <ul class="opcoes">...</ul>
</div>
```

```js
// listener global: clicou fora? fecha todos os menus
document.addEventListener("click", () => fecharMenus());

document.querySelector(".toggle").addEventListener("click", (event) => {
  event.preventDefault();   // o href="#" não rola a página pro topo
  event.stopPropagation();  // o clique não sobe até o document, que fecharia o menu
  abrirMenu();
});
```

**Formulários**: o listener de `submit` vai no `<form>` (não no botão), e `preventDefault()` evita o recarregamento da página. Atributos: `disabled` e `readonly` não editam, mas só o `readonly` é enviado no submit; `required` exige preenchimento; `name` identifica o campo.

---

## 4. `window` e `document` (Aula 04)

```text
window   ← o OBJETO GLOBAL do navegador (a janela/aba)
 ├─ document         (o DOM)
 ├─ localStorage / sessionStorage
 ├─ fetch
 ├─ location, history, console
 └─ eventos como resize e scroll
```

- `document` é **propriedade** de `window` (e não o contrário): `window.document === document` é `true`.
- `localStorage`, `fetch` e os eventos `resize`/`scroll` **vivem em `window`**, não em `document`.
- Escrever `document.querySelector()` em vez de `window.document.querySelector()` funciona porque tudo que está no objeto global pode ser usado **sem o prefixo** `window.`. `document` continua sendo parte de `window`.
- `window` e `document` existem **no navegador**. No Node (backend) não existem.

Cookies e JWT (também da Aula 04): `HttpOnly` impede o JS de ler o cookie; `Secure` só envia por HTTPS; `Max-Age` define a validade em segundos. O JWT tem `header.payload.signature`: o payload é só Base64 (**qualquer um lê**), e o **secret** que assina fica **só no backend** (variável de ambiente), nunca no frontend.

---

## 5. Pré-compiladores e Vite (Aulas 03 e 05)

O navegador só entende **JavaScript e CSS puros**. TypeScript, JSX (React) e Sass precisam ser **convertidos** antes. Um pré-compilador faz isso automaticamente. O Vite tem duas serventias: **HMR** (no dia a dia) e **pré-compilação** (a mais importante).

```text
resources/ (você escreve .ts) → Vite compila → public/ (JS puro, que o navegador lê)
npm run dev    → servidor com watcher, compila em memória, não termina
npm run build  → compilação pontual: minifica, agrupa e grava em public/
```

### Benefícios práticos (saiba listar pelo menos 4, **cada um com explicação**)

1. **Usar o que o navegador não entende.** Escreve TypeScript/JSX, o pré-compilador converte para JavaScript comum.
2. **Arquivos menores (minificação).** Remove espaços e comentários e encurta nomes de variáveis: menos bytes na rede, página carrega mais rápido.
3. **Organização e escalabilidade.** O código pode ficar em vários módulos/arquivos pequenos, e o build junta tudo.
4. **Bundle (unificação de módulos).** Muitos arquivos viram poucos: em vez de dezenas de requisições HTTP, o navegador faz 2 ou 3.
5. **Controle de cache (hash no nome do arquivo).** `app.3f9a1c.js`: se o conteúdo muda, o nome muda e o navegador baixa a versão nova; se não mudou, reaproveita o cache.
6. **HMR (Hot Module Reload).** Salvou o arquivo, o navegador atualiza só aquele módulo, sem recarregar a página nem perder o estado. Mais produtividade.

---

## 6. TypeScript: tipagem de primitivos, objetos, funções e generics (Aula 05)

### 6.1 A ideia

**TypeScript é fundamental no frontend de hoje.** Projetos reais têm vários desenvolvedores, milhares de linhas e mudanças constantes; os tipos funcionam como documentação executável do que cada pedaço de código aceita e devolve. A partir da Aula 05, todo código novo do projeto é escrito em `.ts`.

JavaScript é **dinamicamente tipado**: nada impede de passar uma `string` onde se esperava um `number`, e o erro só aparece com o código rodando. TypeScript acrescenta **tipos**: o erro aparece **ao escrever/compilar**, antes de chegar ao navegador. Os tipos são **removidos** na compilação: o navegador recebe JS puro. Tipar é escrever o **contrato** de cada pedaço de código: o que entra, o que sai, que formato tem cada objeto.

A sintaxe é sempre **`nome: Tipo`** (dois-pontos depois do nome).

### 6.2 Tipos primitivos

```ts
let nome: string = "Ana";
let idade: number = 25;        // inteiro e decimal são o mesmo tipo: number
let ativo: boolean = true;
let nada: null = null;
let indefinido: undefined = undefined;
```

- Os tipos são escritos em **minúsculas**: `string`, `number`, `boolean`. (`String`, `Number` com maiúscula são outra coisa.)
- **Inferência**: se você já atribui um valor, o TypeScript descobre o tipo sozinho (`let x = 5` já é `number`). Mas **parâmetros de função** precisam de tipo explícito.
- **Union** (`|`): "um tipo **ou** outro".

```ts
let id: string | number = 42;
id = "uuid-abc123";            // também vale

type Papel = "admin" | "aluno"; // união de valores exatos
```

- `any` desliga a checagem (evite). `unknown` é "não sei o tipo ainda" e te obriga a checar antes de usar.

### 6.3 Arrays

```ts
const tags: string[] = ["frontend", "typescript"];
const notas: number[] = [7.5, 9, 10];
const outras: Array<number> = [1, 2, 3];   // mesma coisa que number[]
```

`T[]` e `Array<T>` são equivalentes. Lê-se "array **de** T".

### 6.4 Objetos: `type`

Para descrever o **formato** de um objeto, nomeie com `type`: lista cada propriedade e o tipo dela.

```ts
type Produto = {
  id: number;
  nome: string;
  preco: number;
  emEstoque: boolean;
};

const caneta: Produto = { id: 1, nome: "Caneta", preco: 3.5, emEstoque: true };
```

O TypeScript confere **tudo**: faltou propriedade, sobrou propriedade ou tipo errado, dá erro.

```text
const x: Produto = { id: 1, nome: "Caneta" };               ✗ faltam preco e emEstoque
const y: Produto = { id: "1", nome: "Caneta", ... };        ✗ id é string, deveria ser number
```

Variações úteis:

```ts
type Endereco = { rua: string; cidade: string };

type Cliente = {
  id: number;
  nome: string;
  telefone?: string;      // ? = propriedade OPCIONAL (pode não existir)
  endereco: Endereco;     // um type dentro de outro
  tags: string[];         // array dentro do objeto
};
```

**Array de objetos**: use o `type` seguido de `[]`.

```ts
const produtos: Produto[] = [
  { id: 1, nome: "Caneta", preco: 3.5, emEstoque: true },
  { id: 2, nome: "Caderno", preco: 18, emEstoque: false },
];
```

Separador entre propriedades no `type`: `;` (ou `,`). Dentro do **valor** do objeto, `,`.

### 6.5 Funções: tipar argumentos **e** retorno

```ts
function somar(a: number, b: number): number {
  return a + b;
}
//        └ tipo de cada argumento ┘   └ tipo do RETORNO (depois dos parênteses)

const dobrar = (n: number): number => n * 2;   // arrow function: mesma regra

function avisar(msg: string): void {            // void = não retorna nada
  console.log(msg);
}

async function listar(): Promise<Produto[]> {   // async sempre devolve Promise<...>
  return [];
}
```

**Função como argumento (callback)**: o tipo é escrito como uma "assinatura" com seta `=>`.

```ts
//                    ┌ nome do parâmetro ┐   ┌ retorno do callback
function aplicar(lista: number[], regra: (n: number) => boolean): number[] {
  return lista.filter(regra);
}

aplicar([1, 2, 3, 4], (n) => n % 2 === 0);   // [2, 4]
```

Repare que `(n: number) => boolean` usa **`=>`** (assinatura do callback), enquanto o retorno da função usa **`:`**.

### 6.6 Generics: a mesma função para qualquer tipo

**O problema.** Sem generics, uma função que serve a vários tipos vira cópia e cola:

```ts
function primeiroDeNumeros(lista: number[]): number { return lista[0]; }
function primeiroDeTextos(lista: string[]): string { return lista[0]; }
function primeiroDeProdutos(lista: Produto[]): Produto { return lista[0]; }
// ...uma nova cópia para cada tipo. Mudou a regra? Edita todas, e esquece uma.
```

**A solução: um parâmetro de tipo `<T>`** ("T" de *Type*; é só um nome, podia ser `<Item>`). É um **espaço reservado** que o TypeScript preenche **na hora da chamada**.

```ts
function primeiro<T>(lista: T[]): T {
  return lista[0];
}

primeiro([10, 20, 30]);        // T = number   → retorna number
primeiro(["a", "b"]);          // T = string   → retorna string
primeiro(produtos);            // T = Produto  → retorna Produto
primeiro<string>(["x", "y"]);  // também dá pra informar T na mão
```

Uma só função, **sem perder a segurança**: `primeiro(produtos).nome` funciona; `primeiro(produtos).foo` dá erro.

Como ler `function primeiro<T>(lista: T[]): T`: "para **qualquer** tipo `T`, recebo uma lista **de T** e devolvo **um T**".

**Receita para transformar uma função tipada em genérica**
1. Escreva o `<T>` **logo depois do nome** da função: `function nome<T>(...)`.
2. Troque o tipo concreto (`Produto`, `Usuario`...) por `T` **em todos os lugares**: parâmetros, retorno **e** dentro do tipo do callback.
3. O `T` só existe dentro da função. Quem chama é que "decide" o T.

**Onde isso aparece no dia a dia: o Axios.** O `<T>` em `get<T>` diz ao TypeScript qual é o tipo de `response.data`:

```ts
const response = await clientApi.get<Produto[]>("/produtos");
response.data;   // Produto[]  → autocomplete e erros de tipo em tudo que vem da API
```

### 6.7 Passo a passo: tipar uma função e torná-la genérica

Parta de um JS como este:

```js
const produtos = [
  { id: 1, nome: 'Caneta', preco: 3.5, emEstoque: true },
  { id: 2, nome: 'Caderno', preco: 18, emEstoque: false }
];

function contar(lista, regra) {
  let total = 0;
  for (const item of lista) {
    if (regra(item)) {
      total++;
    }
  }
  return total;
}

const qtdEmEstoque = contar(produtos, (p) => p.emEstoque);
```

E tipe em **etapas**, uma de cada vez:

**1) Criar o `type`**: olhe para **um** objeto do array e copie cada propriedade com o tipo do valor.

```ts
type Produto = {
  id: number;
  nome: string;
  preco: number;
  emEstoque: boolean;
};
```

**2) Tipar o array**: `: Tipo[]` depois do nome da constante.

```ts
const produtos: Produto[] = [
  { id: 1, nome: 'Caneta', preco: 3.5, emEstoque: true },
  { id: 2, nome: 'Caderno', preco: 18, emEstoque: false },
];
```

**3) Tipar a função (argumentos e retorno)**: a lista é `Produto[]`; o callback recebe um `Produto` e devolve `boolean`; a função devolve um `number` (a contagem).

```ts
function contar(
  lista: Produto[],
  regra: (item: Produto) => boolean
): number {
  let total = 0;
  for (const item of lista) {
    if (regra(item)) {
      total++;
    }
  }
  return total;
}
```

**4) Tornar genérica**: `<T>` depois do nome e `Produto` vira `T` onde aparecia. O retorno continua `number`, porque a função devolve uma contagem, não um `T`.

```ts
function contar<T>(
  lista: T[],
  regra: (item: T) => boolean
): number {
  let total = 0;
  for (const item of lista) {
    if (regra(item)) {
      total++;
    }
  }
  return total;
}

const qtdEmEstoque = contar(produtos, (p) => p.emEstoque);   // T = Produto
const qtdPares = contar([1, 2, 3, 4], (n) => n % 2 === 0);   // T = number
```

> O essencial é o que aparece na **assinatura** (nome, parâmetros e retorno).

### 6.8 Erros comuns

| Erro | Certo |
|---|---|
| `nome: String`, `id: Number` | `nome: string`, `id: number` (minúsculo) |
| Esquecer o `[]` no array de objetos: `const produtos: Produto = [...]` | `const produtos: Produto[] = [...]` |
| Esquecer o tipo de **retorno** | `function f(...): Tipo { }` |
| Tipar o callback como `Function` ou `any` | `(item: T) => boolean` |
| Esquecer o `<T>` depois do nome: `function f(lista: T[])` | `function f<T>(lista: T[])` |
| Generic pela metade: `<T>` declarado, mas `lista: Produto[]` | trocar **todos** os `Produto` por `T` |
| Retorno do callback errado: `(item: T) => T` | `(item: T) => boolean` (quando é um filtro/regra) |
| `{ id: number, nome: string }` com valores no lugar de tipos: `{ id: 1 }` | no `type` vão **tipos**, não valores |

### 6.9 Exercícios (tente sem olhar a resposta; gabarito no fim)

**Ex. 1.** Tipe o objeto e o array abaixo, criando o `type Tarefa`:

```js
const tarefas = [
  { id: 1, titulo: "Estudar TS", concluida: false },
  { id: 2, titulo: "Revisar DOM", concluida: true },
];
```

**Ex. 2.** Tipe os argumentos e o retorno:

```js
function mediaDe(notas) {
  let soma = 0;
  for (const n of notas) {
    soma += n;
  }
  return soma / notas.length;
}
```

**Ex. 3.** Tipe a função, em que `formatar` é um callback que recebe uma `Tarefa` e devolve uma `string`, e a função devolve um array de `string`:

```js
function listarTitulos(lista, formatar) {
  return lista.map(formatar);
}
```

**Ex. 4.** Transforme a função do Ex. 3 em genérica, para aceitar **qualquer** tipo de item (não só `Tarefa`).

**Ex. 5.** Escreva uma função genérica `ultimo` que receba um array de qualquer tipo e devolva o último elemento.

**Ex. 6.** O que está errado, e como corrigir?

```text
type Aluno = { nome: String; nota: number };
const alunos: Aluno = [{ nome: "Bia", nota: 9 }];
function maior<T>(lista: Aluno[]): Aluno { return lista[0]; }
```

---

## 7. Treino: questões de alternativas (dos briefings)

Gabarito comentado no fim desta seção. Justifique cada resposta, não decore a letra.


### Aula 01 — Nginx, HTML semântico e DOM

**Questão 1.** Qual das alternativas descreve corretamente a vantagem de usar um container Nginx com Docker para servir arquivos estáticos em vez de abrir o arquivo HTML diretamente no navegador?

- A) Permite que o navegador renderize a página sem precisar do protocolo HTTP.
- B) Garante que o código JavaScript seja executado sem precisar de um navegador.
- C) Cria um ambiente de servidor real, simulando como os arquivos seriam servidos em produção.
- D) Torna desnecessário o uso do navegador, pois o Nginx já renderiza o HTML.
- E) Substitui completamente a necessidade de HTML e CSS no frontend.

**Questão 2.** Por que usar tags semânticas (como `<header>`, `<nav>`, `<main>`, `<footer>`) em vez de apenas divs em um documento HTML?

- A) Porque as tags semânticas deixam a página mais colorida automaticamente.
- B) Porque os navegadores não conseguem interpretar div.
- C) Porque melhoram a interpretação do conteúdo por navegadores, mecanismos de busca e leitores de tela.
- D) Porque as tags semânticas eliminam a necessidade de CSS.
- E) Porque o HTML semântico é obrigatório para que o JavaScript funcione.

**Questão 3.** No contexto do DOM (Document Object Model), qual das alternativas abaixo descreve corretamente o uso de querySelector?

- A) Cria um novo elemento no DOM e insere dentro de um nó pai.
- B) Seleciona todos os elementos que possuem um atributo específico.
- C) Seleciona o primeiro elemento que corresponde a um seletor CSS fornecido.
- D) Remove o elemento selecionado do DOM.
- E) Adiciona um evento de clique a um botão.


### Aula 02 — Seletores, `id`/`class` e eventos

**Questão 4.** Sobre a relação entre os seletores usados em CSS (.classe, #id) e os métodos querySelector/querySelectorAll do JavaScript, é correto afirmar que:

- A) São linguagens de seleção completamente diferentes, e a semelhança na sintaxe entre .classe no CSS e .classe no querySelector é apenas coincidência.
- B) O CSS e o JS reutilizam a mesma linguagem de seletores, o que permite que uma expressão como section > ul li a funcione igualmente para estilizar no CSS e para buscar elementos com querySelector.
- C) querySelector aceita apenas seletores de tag e classe, enquanto seletores de id só podem ser usados diretamente em CSS.
- D) querySelectorAll exige uma sintaxe própria de seleção, distinta da usada em folhas de estilo CSS, para evitar ambiguidade entre os dois contextos.
- E) Seletores avançados, como os de atributo ([type="text"]) e pseudo-classes (:hover), existem apenas no CSS e não podem ser usados como argumento em querySelector ou querySelectorAll.

**Questão 5.** Sobre a cardinalidade dos atributos id e class em um documento HTML, é correto afirmar que:

- A) Tanto id quanto class podem se repetir livremente em quantos elementos forem necessários, sem nenhuma restrição de unicidade.
- B) O id estabelece uma relação de 1 para 1 com o elemento, não devendo se repetir em nenhum outro elemento do documento, enquanto a class estabelece uma relação de n para n, podendo estar presente em vários elementos e um elemento podendo ter várias classes.
- C) O id estabelece uma relação de n para n, já que pode ser reaproveitado em diversos elementos, enquanto a class é sempre única por elemento.
- D) Um elemento pode ter no máximo um id e no máximo uma class, o que torna ambos os atributos equivalentes em termos de cardinalidade.
- E) A class é 1 para 1 porque cada classe só pode ser aplicada a um único elemento por vez, enquanto o id é n para n por poder ser reaproveitado.

**Questão 6.** Sobre o comportamento de event.target e event.currentTarget dentro de um listener registrado com addEventListener, é correto afirmar que:

- A) event.target e event.currentTarget são sempre o mesmo elemento, já que ambos se referem ao elemento em que o evento foi registrado.
- B) event.target é o elemento onde o listener foi registrado, enquanto event.currentTarget é o elemento onde o evento efetivamente ocorreu, podendo ser um filho.
- C) event.currentTarget é o elemento onde o listener foi registrado, enquanto event.target é o elemento onde o evento efetivamente ocorreu — podendo ser um filho interno, o que justifica o uso de closest() para localizar o elemento de interesse a partir dele.
- D) event.target só existe em eventos de teclado, enquanto event.currentTarget só existe em eventos de clique.
- E) stopPropagation() altera o valor de event.target, fazendo com que ele passe a apontar para o elemento no qual o listener foi registrado.


### Aula 03 — Vite, eventos e formulários

**Questão 7.** Sobre o conceito de build e a finalidade do Vite no ambiente de desenvolvimento do frontend, é correto afirmar que:

- A) Build é o processo de leitura de arquivos estáticos pelo Nginx, sem relação com transformação de código.
- B) O HMR do Vite recarrega a página inteira a cada alteração salva, sendo equivalente a um F5 automático.
- C) Build é o processo que transforma o código-fonte em arquivos prontos para o navegador, e o Vite, como build tool, oferece Hot Module Reload (atualiza só o módulo alterado, sem recarregar a página) além de pré-compilação, sua finalidade mais relevante no curso.
- D) O Vite substitui o navegador, executando o JavaScript diretamente no servidor sem necessidade de DOM.
- E) A pré-compilação do Vite é opcional e só existe para projetos que não usam TypeScript.

**Questão 8.** Sobre as fases de propagação de um evento no DOM e o método stopPropagation(), é correto afirmar que:

- A) Um evento sempre ocorre em uma única fase, e stopPropagation() não tem efeito algum sobre listeners de elementos ancestrais.
- B) Um evento pode percorrer até três fases — capturing, target e bubbling —; por padrão addEventListener escuta na fase de bubbling, e stopPropagation() interrompe a propagação, impedindo que listeners de ancestrais sejam disparados pelo mesmo evento.
- C) A fase de capturing é a mais usada na prática e não pode ser desativada.
- D) stopPropagation() cancela o comportamento padrão do navegador para o evento, substituindo a função de preventDefault().
- E) Bubbling significa que o evento é disparado simultaneamente em todos os elementos da árvore, sem ordem definida.

**Questão 9.** Sobre o registro do listener de submit em um formulário HTML, é correto afirmar que:

- A) O listener deve ser registrado no botão de envio (button type="submit"), nunca no elemento form.
- B) O evento submit é disparado automaticamente mesmo sem um botão do tipo submit dentro do form, mas o listener correto é registrado no elemento form, que engloba os campos internos; preventDefault() evita o reload padrão da página ao enviar.
- C) preventDefault() dentro do listener de submit impede que os valores dos campos sejam lidos via JS.
- D) Campos com o atributo disabled são enviados normalmente no submit, junto com os demais.
- E) O atributo readonly impede que o campo seja enviado no submit, assim como disabled.


### Aula 04 — Cookies e JWT

**Questão 10.** Sobre os atributos Max-Age, HttpOnly e Secure de um cookie, é correto afirmar que:

- A) HttpOnly impede que o cookie seja lido ou escrito via document.cookie pelo JS de frontend, Max-Age define por quantos segundos o cookie permanece válido antes de ser descartado automaticamente pelo navegador, e Secure garante que o cookie só seja enviado em conexões HTTPS.
- B) Max-Age define o algoritmo de criptografia do cookie, enquanto HttpOnly e Secure controlam apenas o domínio de origem.
- C) Um cookie HttpOnly continua acessível normalmente via document.cookie, servindo apenas como recomendação sem efeito prático no navegador.
- D) Secure impede que o cookie expire, tornando o atributo Max-Age desnecessário quando os dois são usados juntos.
- E) HttpOnly e Secure são atributos equivalentes, ambos controlando exclusivamente por quanto tempo o cookie é válido.

**Questão 11.** Sobre a estrutura de um JWT e o armazenamento do secret usado para assiná-lo, é correto afirmar que:

- A) O JWT é composto por header, payload e signature, separados por ponto; o payload pode ser lido por qualquer pessoa (é apenas Base64), mas o secret usado para gerar e validar a signature fica armazenado somente no backend, tipicamente em uma variável de ambiente no .env, nunca exposto ao frontend.
- B) O secret usado para assinar o JWT deve ficar salvo no frontend, para que o navegador consiga validar sozinho a assinatura de cada token recebido.
- C) O payload de um JWT é criptografado e ilegível sem a chave secreta, o que impede qualquer pessoa de ver os dados nele contidos.
- D) A signature de um JWT tem como única função identificar o algoritmo usado no header, sem relação com o payload.
- E) Armazenar o secret em um arquivo .env no backend é uma prática desnecessária, já que o valor pode ser escrito diretamente no código-fonte versionado sem nenhum risco.


### Aula 05 — Generics, Vite e API contextual

**Questão 12.** Sobre Generics em TypeScript, é correto afirmar que:

- A) Generics são tipos que só funcionam com números e strings; para outros tipos é preciso duplicar a função.
- B) Generics são uma forma de escrever código reutilizável e type-safe que funciona com qualquer tipo, usando um placeholder <T> que é substituído quando a função é chamada; evita duplicação de código mantendo verificação de tipos.
- C) Generics apenas funcionam dentro de classes; funções não podem ser genéricas.
- D) Um generic sem constraints aceita qualquer tipo, mas se você adicionar uma constraint (extends), ele perde a capacidade de ser genérico.
- E) Generics são compilados para tipos reais apenas no navegador, não durante a compilação do TypeScript.

**Questão 13.** Sobre o Vite como pré compilador e entry point, é correto afirmar que:

- A) O Vite é apenas um servidor com HMR; não compila TypeScript ou outras linguagens.
- B) O Vite é um pré compilador completo que transforma TypeScript em JavaScript, compila automaticamente, e pode ser containerizado como um entry point separado no Docker Compose; a configuração atual (root: 'resources', server.host, IS_CONTAINER) já foi preparada para isso.
- C) O Vite só funciona com CSS; TypeScript precisa de outro compilador.
- D) Pré compiladores removem a necessidade de um servidor web; o Vite gera arquivos .js que rodam sozinhos sem nenhum processo.
- E) A pasta resources é opcional; o Vite funcionará sem ela usando raízes padrão.

**Questão 14.** Sobre API Contextual e a relação entre JWT e URLs, é correto afirmar que:

- A) API Contextual significa que o servidor infere o contexto do usuário a partir do JWT no cookie, sem o cliente precisar passar esse dado redundantemente na URL; isso elimina redundância e reduz pontos de falha, porque a URL não contém IDs que já estão no token.
- B) API Contextual exige que o cliente continue passando o ID do usuário na URL, mesmo que esteja no JWT, para garantir que o backend sempre receba uma confirmação dupla de identidade.
- C) O uso de JWT em cookies já garante automaticamente segurança contra endpoints chamados com IDs incorretos; não há necessidade de refatorar URLs.
- D) Remover o ID da URL torna a API menos segura, porque o backend não consegue mais validar quem é o usuário sem receber o ID como parâmetro.
- E) API Contextual é apenas uma convenção de nomenclatura; não afeta a segurança ou funcionamento real da aplicação.


### Aula 06 — Revisão geral

**Questão 15.** Sobre a diretiva `try_files $uri $uri/ =404;` em uma configuração do Nginx, é correto afirmar que:

- A) O Nginx ignora a ordem dos argumentos e responde com o que for mais rápido de achar.
- B) `$uri` tenta servir o caminho como arquivo; se não existir, `$uri/` tenta o mesmo caminho como diretório (servindo seu index); se nenhum dos dois existir, `=404` responde com esse status.
- C) `=404` é sempre executado primeiro, e só depois o Nginx tenta `$uri` e `$uri/` como alternativa.
- D) `$uri/` serve arquivos estáticos apenas quando o Nginx está rodando fora de um container Docker.
- E) A diretiva `try_files` é usada exclusivamente para servir arquivos `.html`, nunca diretórios.

**Questão 16.** Sobre a árvore DOM e a cardinalidade dos atributos `id` e `class`, é correto afirmar que:

- A) `id` e `class` têm a mesma cardinalidade, já que ambos podem se repetir livremente em quantos elementos forem necessários.
- B) `id` estabelece uma relação 1 para 1 (não se repete no documento), enquanto `class` estabelece uma relação n para n (um elemento pode ter várias classes, e uma classe pode estar em vários elementos) — por isso `getElementById` sempre retorna um elemento único ou `null`, enquanto `getElementsByClassName` retorna uma coleção.
- C) `class` é 1 para 1 e `id` é n para n, o inverso do que a maioria dos desenvolvedores assume.
- D) A cardinalidade de `id` e `class` depende apenas da ordem em que os elementos aparecem no HTML, não de nenhuma regra fixa.
- E) `getElementById` retorna uma `HTMLCollection`, exatamente como `getElementsByClassName`.

**Questão 17.** Sobre `event.target` e `event.currentTarget` dentro de um listener registrado com `addEventListener`, é correto afirmar que:

- A) `event.target` é o elemento onde o evento efetivamente ocorreu (podendo ser um filho interno), enquanto `event.currentTarget` é o elemento no qual o listener foi registrado — o que justifica usar `closest()` a partir do `target` para achar o elemento de interesse.
- B) `event.target` e `event.currentTarget` são sempre idênticos, não importa onde o clique ocorra dentro do elemento.
- C) `event.currentTarget` é o elemento onde o evento ocorreu, enquanto `event.target` é o elemento onde o listener foi registrado.
- D) `event.target` só existe em eventos de teclado, nunca em eventos de clique.
- E) `closest()` só pode ser chamado a partir de `event.currentTarget`, nunca a partir de `event.target`.

**Questão 18.** Sobre a relação entre os objetos `window` e `document`, é correto afirmar que:

- A) `window` e `document` são objetos completamente independentes, sem nenhuma relação hierárquica entre si.
- B) `document` é uma propriedade de `window`, que representa a própria janela/aba do navegador e expõe outras APIs, como `localStorage` e eventos próprios (`resize`, `scroll`), que não pertencem a `document`.
- C) `window` é uma propriedade de `document`, acessível apenas depois que o DOM termina de ser parseado.
- D) `window.document === document` retorna `false` em qualquer navegador atualizado.
- E) `document` é exclusivo de ambientes de backend (Node), enquanto `window` é exclusivo do navegador.

**Questão 19.** Sobre generics em TypeScript, considerando a função abaixo:

```ts
function wrap<T>(valor: T): T {
  return valor;
}
```

é correto afirmar que:

- A) `<T>` obriga o desenvolvedor a especificar manualmente o tipo em toda chamada da função, nunca podendo ser inferido.
- B) `<T>` é um placeholder de tipo que o TypeScript infere a partir do argumento passado na chamada, permitindo que a mesma função funcione para qualquer tipo sem duplicar código e sem perder segurança de tipos.
- C) Generics eliminam a necessidade de tipar o retorno da função, que passa a ser sempre `any`.
- D) `wrap<T>` só pode ser usada com tipos primitivos (`string`, `number`, `boolean`), nunca com objetos.
- E) Generics são exclusivos de bibliotecas como o Axios e não podem ser usados em funções definidas pelo próprio desenvolvedor.


#### Gabarito do treino

| Questão | Resposta | Por quê |
|---|---|---|
| 1 | **C** | Nginx no Docker cria um ambiente de servidor real, igual à produção. |
| 2 | **C** | Tags semânticas ajudam navegadores, buscadores e leitores de tela a entender a página. |
| 3 | **C** | `querySelector` devolve o primeiro elemento que casa com o seletor CSS. |
| 4 | **B** | CSS e JS usam a mesma linguagem de seletores. |
| 5 | **B** | `id` é 1 para 1; `class` é n para n. |
| 6 | **C** | `target` = onde ocorreu; `currentTarget` = onde o listener está; `closest()` ajuda a achar o elemento de interesse. |
| 7 | **C** | Build transforma o código-fonte em arquivos prontos; o HMR atualiza só o módulo alterado; a pré-compilação é o recurso mais relevante. |
| 8 | **B** | Três fases (capturing, target, bubbling); o padrão é bubbling; `stopPropagation` interrompe a propagação. |
| 9 | **B** | O listener de `submit` vai no `<form>`; `preventDefault()` evita o recarregamento da página. |
| 10 | **A** | `HttpOnly` bloqueia o JS, `Max-Age` define a validade, `Secure` exige HTTPS. |
| 11 | **A** | JWT = header.payload.signature; payload legível por qualquer um; secret só no backend. |
| 12 | **B** | Generics: `<T>` é um espaço reservado preenchido na chamada; reutiliza código sem perder checagem de tipos. |
| 13 | **B** | O Vite transforma TS em JS puro e pode ser containerizado como entry point. |
| 14 | **A** | API contextual: o servidor lê o usuário do JWT, sem o ID redundante na URL. |
| 15 | **B** | `try_files` testa em ordem: arquivo, diretório, 404. |
| 16 | **B** | `id` 1 para 1, `class` n para n; por isso id devolve um elemento e class uma coleção. |
| 17 | **A** | `target` é onde ocorreu; `currentTarget` é onde o listener foi registrado. |
| 18 | **B** | `document` é propriedade de `window`; `localStorage`, `resize` e `scroll` pertencem a `window`. |
| 19 | **B** | `<T>` é inferido do argumento: mesma função para qualquer tipo, sem perder segurança. |

---

## 8. Dissertativas do TF 06: pontos-chave para a resposta

Use como roteiro: uma boa resposta explica **o que é**, **por que existe** e **o que acontece sem isso**.

**1. `try_files` (Aula 01).** Testa os argumentos **em ordem**, da esquerda para a direita, e o primeiro que resolver vence (por isso a ordem importa: não dá para testar tudo ao mesmo tempo). `$uri` busca um **arquivo**; `$uri/` busca um **diretório** e serve o `index` dele; `=404` é a resposta final quando nada deu certo. Sem a busca por diretório, `/blog` daria 404 mesmo existindo `blog/index.html`; o visitante teria de digitar `/blog/index.html`, e até a página inicial quebraria.

**2. `Node`, `Element` e `HTMLElement` (Aula 02).** É uma cadeia de **especialização**: `Node` é a base de **tudo** que existe na árvore (elemento, texto, comentário, o próprio `document`); `Element` é o nó que representa uma **tag** (HTML ou SVG) e traz o que só faz sentido para tags: atributos, `children`, `closest`, `querySelector`; `HTMLElement` é a tag **HTML** em particular (`style`, `innerText`, `dataset`). Um tipo único para tudo obrigaria a ter, num simples texto, métodos que não fazem sentido (um texto não tem `children`). Diferença prática: `childNodes` inclui **nós de texto** (os espaços e quebras de linha entre as tags); `children` só os **elementos**. Importa ao percorrer ou manipular filhos: com `childNodes` o primeiro filho pode ser um texto em branco, não a tag que você queria.

**3. `target` e `currentTarget` (Aula 03).** `target` é onde o clique **realmente** aconteceu (o `<button>`); `currentTarget` é onde o listener foi **registrado** (o `<ul>`). Como o evento **borbulha** do botão para os ancestrais, o `<ul>` o recebe. Um único listener no pai (**delegação**) é comum porque usa menos listeners e menos memória, e funciona para itens **criados depois** sem registrar nada novo; o código usa `event.target.closest("li")` para achar o item.

**4. Fases, `preventDefault` e `stopPropagation` (Aula 03).** **Capturing**: o evento desce da raiz até o alvo. **Target**: chega ao elemento de origem. **Bubbling**: sobe do alvo de volta à raiz. O padrão é escutar no bubbling (o mais útil na prática: o pai reage ao que aconteceu nos filhos); capturing só com `{ capture: true }`. `preventDefault()` cancela o **comportamento padrão** do navegador (navegar num link, recarregar no submit), **sem** parar a propagação. `stopPropagation()` interrompe a **subida** do evento aos ancestrais, **sem** cancelar o padrão. Os dois juntos: um link `<a href="#">` dentro de um elemento que tem listener de clique (ex.: o menu que fecha ao clicar fora): `preventDefault` evita pular para o topo, `stopPropagation` evita que o clique chegue ao listener do ancestral.

**5. `window` e `document` (Aula 04).** `window` é o **objeto global** do navegador (a janela/aba); `document` é **propriedade** dele. Em `window` vivem `localStorage`, `fetch` e eventos como `resize` e `scroll`; em `document`, o DOM. `document.querySelector` funciona sem o `window.` porque propriedades do objeto global são acessíveis **diretamente**; isso é só atalho de escrita, `document` continua sendo parte de `window`.

**6. Generics (Aula 05).** Sem generics, cada tipo exigiria uma cópia da função (`string`, `number`, `Usuario`...). Num projeto que cresce isso causa **duplicação**: uma mudança de regra precisa ser repetida em N lugares (e alguém esquece um), mais tipos significam mais cópias, mais código para revisar e mais risco de **divergência entre as versões**. Com `<T>` há **uma** função: o TypeScript preenche o `T` em cada chamada e continua conferindo os tipos (`T` não é `any`). Tipar a resposta HTTP, como em `clientApi.get<Usuario[]>(...)`, é a aplicação mais comum: diz ao TypeScript qual é o tipo de `response.data`, e a partir daí o autocomplete e os erros de tipo valem para tudo que veio da API.

---

## 9. Gabarito dos exercícios de TypeScript (Parte 6.9)

**Ex. 1**

```ts
type Tarefa = {
  id: number;
  titulo: string;
  concluida: boolean;
};

const tarefas: Tarefa[] = [
  { id: 1, titulo: "Estudar TS", concluida: false },
  { id: 2, titulo: "Revisar DOM", concluida: true },
];
```

**Ex. 2**

```ts
function mediaDe(notas: number[]): number {
  let soma = 0;
  for (const n of notas) {
    soma += n;
  }
  return soma / notas.length;
}
```

**Ex. 3**

```ts
function listarTitulos(lista: Tarefa[], formatar: (item: Tarefa) => string): string[] {
  return lista.map(formatar);
}
```

**Ex. 4** (só o que era `Tarefa` vira `T`; o retorno continua `string[]`, porque o callback devolve `string`, não `T`)

```ts
function listarTitulos<T>(lista: T[], formatar: (item: T) => string): string[] {
  return lista.map(formatar);
}

listarTitulos(tarefas, (t) => t.titulo.toUpperCase());   // T = Tarefa
listarTitulos([1, 2, 3], (n) => `nº ${n}`);              // T = number
```

**Ex. 5**

```ts
function ultimo<T>(lista: T[]): T {
  return lista[lista.length - 1];
}
```

**Ex. 6.** Três erros: (1) `String` com maiúscula, o certo é `string`; (2) `alunos: Aluno` mas o valor é um array, o certo é `Aluno[]`; (3) `maior<T>` declara o `T` mas não o usa (`lista: Aluno[]`, retorno `Aluno`), então a função **não** é genérica de verdade. Corrigido:

```ts
type Aluno = { nome: string; nota: number };
const alunos: Aluno[] = [{ nome: "Bia", nota: 9 }];
function maior<T>(lista: T[]): T { return lista[0]; }
```

---

## 10. Checklist final

- [ ] Explico `try_files` em ordem (`$uri`, `$uri/`, `=404`) e o que quebraria sem `$uri/`.
- [ ] Sei dizer o que `closest`, `parentElement`, `children` e `childNodes` devolvem, e que `closest` começa **no próprio elemento**.
- [ ] Monto um seletor com `>`, `+`, `~` e `.a.b` traduzindo frase por frase.
- [ ] Diferencio `target` de `currentTarget` e sei por que a delegação funciona (bubbling).
- [ ] Sei o que `preventDefault` e `stopPropagation` cancelam (e que um não faz o trabalho do outro).
- [ ] Sei que `document` é propriedade de `window`, e onde vivem `localStorage`, `fetch`, `resize`.
- [ ] Listo 4 benefícios de um pré-compilador **com explicação**.
- [ ] Escrevo, sem olhar, um `type` de objeto, um array tipado e uma função com argumentos, callback e retorno tipados.
- [ ] Transformo essa função em genérica (`<T>` no nome, `T` em todo lugar do tipo concreto).
- [ ] Refiz os exercícios 1 a 6 sem consultar o gabarito.
