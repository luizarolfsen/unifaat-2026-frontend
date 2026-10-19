# Aula 05 — Pré Compiladores e Typescript

**Disciplina:** Frontend  
**Semestre:** 2026.2  
**Professor:** Luan Tavares Lourenço

---

## 1. Introdução

O frontend começou esta disciplina como um arquivo HTML com JavaScript solto — HTML gerado à mão, JS inline, sem nenhuma ferramenta de construção. Ao longo das aulas, caminhou em duas frentes: (1) a estrutura — mudou de HTML puro para componentes, depois para Vite, trazendo Hot Module Replacement; (2) a comunicação — passou a falar com o backend via Axios, a se autenticar via JWT em cookies, e a respeitar CORS.

Esta aula marca o momento em que essas duas frentes convergem. Na estrutura, o projeto deixa de ser JavaScript puro e abraça TypeScript — não apenas como tipagem, mas como ferramenta essencial para organizar e escalar. Com TypeScript, cada função tem contrato explícito: que tipos recebe, que tipo retorna, quais propriedades um objeto possui. Isso que parecia "detalhe" em projetos pequenos (um desenvolvedor, 50 linhas de código) vira o diferencial em projetos reais: múltiplos desenvolvedores, milhares de linhas, mudanças frequentes. Tipos funcionam como documentação executável — o código é sua própria verdade sobre o que pode e o que não pode acontecer.

A partir desta aula, todo código novo será escrito em `.ts` (TypeScript), compilado automaticamente para `.js` (JavaScript puro) que o navegador entenda. Estrutura clara: arquivos fonte em uma pasta **resources/**, compilados pelo Vite para JavaScript puro em uma pasta **public/**, pronto para o navegador.

O Vite aqui não é mais apenas um servidor com HMR — é agora um pré compilador profissional. Ele compila TypeScript e aplica otimizações como **minificação** (reduz tamanho dos arquivos) e **bundling** (agrupa múltiplos arquivos em poucos bundles). Veremos dois modos: modo desenvolvimento (`npm run dev` com watcher contínuo) e modo produção (`npm run build` com compilação pontual e otimização final).

Na comunicação, consolidamos o JWT guardado em cookies, mas dessa vez usando as informações que já estão no token para eliminar redundância da API — se o backend sabe quem é o usuário pelo JWT, por que o frontend ainda passa o ID na URL? Essa é a **API Contextual**: o backend lê do token, não do cliente.

---

## 2. O Navegador (E O Node) Só Entendem JavaScript Puro

### 2.1 — A Vendor API: O Que o Navegador Aceita

O navegador, qualquer navegador moderno, só entende **JavaScript puro** (e CSS puro). Tudo que interagimos no frontend (DOM, eventos, requisições, storage) é fornecido pelo navegador através da **Vendor API** (Application Programming Interface específica do navegador):

```javascript
// O navegador expõe a Vendor API através do objeto window
window.document                    // Vendor API: DOM
window.addEventListener            // Vendor API: Eventos
window.fetch                       // Vendor API: Requisições HTTP
window.localStorage                // Vendor API: Armazenamento
window.console                     // Vendor API: Logs

// Tudo isso é JavaScript puro, que o navegador entende nativamente
document.querySelector(".card");
const response = await fetch("/api/users");
localStorage.setItem("tema", "escuro");
```

**Aqui mora a verdade fundamental**: o navegador não compila, não interpreta, não entende nada além de JavaScript puro. Ele não compila TypeScript. Não interpreta nenhum formato que não seja JS. Ele simplesmente recebe um arquivo `.js` e o executa contra a Vendor API. Se você enviar um arquivo `.ts` direto, o navegador lança um erro de sintaxe — porque `.ts` não é JavaScript válido para o navegador.

**Mesma coisa**: o Node (ambiente backend) também só entende JavaScript puro. TypeScript precisa ser compilado para `.js` antes de rodar, seja no navegador, seja no servidor.

### 2.2 — TypeScript e Outros Formatos: O Problema

TypeScript não é JavaScript. Sass não é CSS válido. O navegador (e o Node) não entendem nenhum deles. Se você tentar enviar um arquivo `.ts` para o navegador (ou rodar direto no Node), ele quebra:

```typescript
// arquivo: calcular.ts — enviado direto para o navegador
function calcular(valor: number): number {
  return valor + 10;
}

// ✗ SyntaxError: Unexpected token ':' — navegador não entende o ':' after 'valor'
```

**O navegador (e o Node) só falam uma língua: JavaScript puro.**

### 2.3 — Compilação e Transpilação: Conceitos

Para resolver isso, dois processos transformam código expressivo em JavaScript puro:

**Transpilação** — traduzir uma versão de linguagem para outra da mesma "geração":
- ES6+ → ES5 (deixar código moderno compatível com navegadores antigos)
- TypeScript → JavaScript (remover tipos, deixar JS puro)

**Compilação** — transformar código de uma linguagem para outra, geralmente mais baixo nível:
- Sass → CSS (variáveis, nesting se tornam CSS puro)
- TypeScript → JavaScript (pode envolver transformações maiores)

Na prática, os dois termos se misturam. O importante é: **código em formato X → JavaScript puro, enviado para o navegador (ou para Node).**

### 2.4 — Extensão de TypeScript: .ts

Arquivos TypeScript usam a extensão `.ts`. Exemplo: `userListApi.ts`, `calcular.ts`, `types.ts`, `App.ts`. Contém funções, tipos, lógica — tudo TypeScript.

```typescript
// userListApi.ts — TypeScript puro
export async function userListApi(): Promise<Usuario[]> {
  const response = await clientApi.get<Usuario[]>("/users");
  return response.data;
}

// calcular.ts — TypeScript puro
function calcular(valor: number): number {
  return valor + 10;
}
```

O Vite reconhece a extensão `.ts` e a transpila para `.js`, removendo types e deixando JavaScript puro pronto para o navegador (ou Node).

### 2.5 — Tipos Básicos em TypeScript: A Importância de Tipar para Escalar

**Quando um projeto é pequeno** (um desenvolvedor, 50 linhas), JavaScript solto funciona. **Quando cresce** (10 desenvolvedores, 10 mil linhas, mudanças frequentes), a falta de tipos vira caos: cada pessoa assume um contrato mental diferente, refatorações quebram código que "deveria" funcionar, debugging vira um inferno.

**TypeScript força explicitação**: cada função declara seu contrato — que tipo recebe, que tipo retorna, quais propriedades um objeto tem. Isso não é burocracia: é **organização pura**. É a diferença entre saber exatamente o que cada pedaço de código faz e adivinhar.

Os tipos mais comuns cobrem os tipos primitivos do JS:

```typescript
// Tipos primitivos
let nome: string = "Ana";
let idade: number = 25;
let ativo: boolean = true;

// Arrays
let tags: string[] = ["frontend", "typescript"];
let numeros: Array<number> = [1, 2, 3];

// Union: pode ser string OU number
let id: string | number = 42;
id = "uuid-abc123"; // também OK

// Type aliases: nomear tipos complexos
type Usuario = {
  id: number;
  nome: string;
  email: string;
};

const user: Usuario = { id: 1, nome: "Ana", email: "ana@example.com" };

// Enum: constantes com nomes significativos
enum StatusPedido {
  Pendente,
  Confirmado,
  Enviado,
  Entregue
}

let status: StatusPedido = StatusPedido.Confirmado;
```

---

## 3. Generics: Código Reutilizável, Type-Safe e Escalável

### 3.1 — O Problema: Duplicar Código para Cada Tipo (Escala em Risco)

Suponha uma função que receba um valor e o retorne. Sem generics:

```typescript
// sem generics, precisa duplicar a função para cada tipo
function wrapString(valor: string): string {
  return valor;
}

function wrapNumber(valor: number): number {
  return valor;
}

function wrapBoolean(valor: boolean): boolean {
  return valor;
}
```

O padrão é óbvio e repetitivo. **Pior**: cada duplicação é um ponto de risco. Você corrige um bug em `wrapString`, esquece de corrigir em `wrapNumber` e `wrapBoolean`. Generics resolvem exatamente isso: permitir que uma função funcione com qualquer tipo, mantendo segurança de tipos e eliminando duplicação. **Isso escala.**

### 3.2 — Introduzindo Generics com `<T>`

O símbolo `<T>` (T de "Type") é um placeholder para um tipo que será definido depois. Quando a função é chamada, o TypeScript infere qual tipo T deve ser:

```typescript
// com generics, uma função funciona para qualquer tipo
function wrap<T>(valor: T): T {
  return valor;
}

// TypeScript infere T = string
wrap("hello");      // retorna: string

// TypeScript infere T = number
wrap(42);           // retorna: number

// TypeScript infere T = boolean
wrap(true);         // retorna: boolean

// Explícito: especificar <T> manualmente
wrap<string>("hello");
```

A função `wrap` é idêntica para todos os tipos — o TypeScript apenas ajusta `T` para cada chamada, oferecendo type-checking completo sem duplicação de código.

### 3.3 — Generics com Constraints: Limitar os Tipos Aceitos

Às vezes é preciso garantir que T seja de um certo tipo. Constraints fazem isso:

```typescript
// T deve ser um objeto com propriedade 'id: number'
function getId<T extends { id: number }>(obj: T): number {
  return obj.id;
}

getId({ id: 1, nome: "Ana" });      // ✓ OK
getId({ id: 2, email: "hi@ex.com" }); // ✓ OK
getId("hello");                      // ✗ Erro: string não tem 'id'

// T deve estender string ou number
function processar<T extends string | number>(valor: T): T {
  return valor;
}
```

### 3.4 — Generics com Axios e API Responses

Generics brilham ao tipificar respostas de API. Axios retorna um objeto com propriedade `data` — o tipo de `data` pode variar (array de usuários, um token, etc). Generics permitem tipar isso:

```typescript
// Type genérico para resposta de API
type ApiResponse<T> = {
  data: T;
  status: number;
  statusText: string;
};

// Funções de API agora usam generics para tipar a resposta
async function userListApi(): Promise<ApiResponse<Usuario[]>> {
  const response = await clientApi.get("/users");
  return response.data;
}

async function loginApi(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
  const response = await clientApi.post("/login", { email, password });
  return response.data;
}

// Ou, mais comum, tipificar direto com Axios generics
async function userListApi(): Promise<Usuario[]> {
  const response = await clientApi.get<Usuario[]>("/users");
  return response.data;
}
```

O `<T>` em `clientApi.get<T>()` diz ao TypeScript: "a propriedade `data` dessa resposta será do tipo T".

### 3.5 — Generics com Arrays e Objetos

```typescript
// Array genérico: lista de qualquer tipo
type Lista<T> = T[];

const numeros: Lista<number> = [1, 2, 3];
const strings: Lista<string> = ["a", "b", "c"];

// Objeto com chaves genéricas
type Dicionario<T> = {
  [chave: string]: T;
};

const config: Dicionario<string> = {
  tema: "escuro",
  idioma: "pt-BR"
};

// Função que inverte um array
function reverter<T>(lista: T[]): T[] {
  return lista.reverse();
}

reverter([1, 2, 3]);           // [3, 2, 1]
reverter(["a", "b", "c"]);     // ["c", "b", "a"]
```

---

## 4. Pré Compiladores: Conceito e O Vite como Entry Point

### 4.1 — O que é um Pré Compilador

Um pré compilador (ou transpilador) é um programa que transforma código escrito em uma linguagem mais expressiva (TypeScript, Sass) em código que o navegador (ou Node) entenda nativamente (JavaScript puro, CSS puro). Exemplos:

- **TypeScript** → JavaScript (transpilação: remover tipos)
- **Sass** → CSS (transpilação: variáveis, nesting em CSS puro)
- **CoffeeScript** → JavaScript (transpilação: sintaxe CoffeeScript em JS)

O navegador (e o Node) não entendem nenhum desses formatos — só entendem JavaScript puro e CSS puro. Por isso, antes de enviar o código para produção (ou ao desenvolvedor durante o desenvolvimento), precisa-se transpilá-lo. Um pré compilador automatiza exatamente isso, tornando invisível para o desenvolvedor.

### 4.2 — As Duas Serventias do Vite: HMR e Pré Compilação

O Vite tem duas responsabilidades, frequentemente confundidas:

**Primeira serventia — HMR (Hot Module Replacement)**: Apresentado na aula anterior, permite que alterações em arquivos sejam refletidas no navegador instantaneamente, sem recarregar a página inteira. Isso é conforto durante desenvolvimento.

**Segunda serventia — Pré Compilação**: É a verdadeira potência. O Vite transforma TypeScript em JavaScript/CSS puro, de forma automática e invisível. No desenvolvimento, ele compila em memória. Em produção, roda `npm run build` e gera arquivos finais minificados, otimizados e prontos para deploy.

Exemplo prático:

```
desenvolvedor escreve: App.ts (TypeScript)
          ↓
      Vite compila
          ↓
navegador recebe: App.js (JavaScript puro)
          ↓
 navegador executa contra Vendor API
```

A compilação é tão invisível que muitos desenvolvedores não percebem que acontece — é só salvar um `.ts`, e o navegador já vê atualizado via HMR.

### 4.2.1 — Do node_modules para o Navegador: Tudo Compilado

Até agora, as libs (Axios, Bootstrap, fontes, etc) eram baixadas da internet e carregadas direto no navegador no arquivo HTML. Agora, com pré compilação:

1. Você faz `npm install` — as libs ficam em `node_modules/` (Axios, Bootstrap, fontes, etc)
2. Você as importa no seu código TypeScript: `import axios from 'axios'`, `import 'bootstrap/css/bootstrap.css'`
3. O Vite as detecta, compila junto com seu código, e as inclui no bundle final
4. O navegador recebe tudo pré-compilado e otimizado em um bundle único

Exemplo prático:

```typescript
// Antes (direto no HTML)
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.css">
<script src="https://cdn.jsdelivr.net/npm/axios@1/dist/axios.min.js"></script>

// Agora (no TypeScript)
import axios from 'axios'
import 'bootstrap/css/bootstrap.css'
import 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700'
```

**Benefícios:**
- Tudo vem compilado e otimizado pelo Vite, não pelo CDN
- Versionamento explícito no `package.json`, não na URL do CDN
- CSS é pré processado junto com o seu
- Fontes são incluídas no bundle, não requisições HTTP extras
- Zero mudanças no navegador: ele recebe tudo como JS/CSS puro

### 4.3 — Estrutura de Pastas: resources/ → public/

A partir desta aula, o projeto frontend tem uma estrutura clara de entrada e saída:

- **`resources/`** — pasta de origem (source), onde ficam todos os arquivos `.ts`, assets e `index.html`. O Vite procura aqui.

- **`public/`** — pasta de destino, onde o Vite coloca o JavaScript compilado e otimizado. O navegador lê daqui.

Durante desenvolvimento, o Vite cria um servidor em memória que serve os arquivos compilados instantaneamente. Em produção, roda `npm run build` e popula de verdade a pasta `public/`.

### 4.4 — Minificação e Bundling

O Vite aplica duas otimizações importantes em produção:

**Minificação** — remove espaços em branco, comentários, renomeia variáveis longas para nomes curtos (ex.: `console.log` vira algo como `c`). Um arquivo de 50KB vira 15KB minificado.

**Bundling** — agrupa múltiplos arquivos `.js` em poucos bundles (ex.: `main.js`, `vendor.js`). Em vez de 50 requisições HTTP (uma por arquivo), o navegador faz 2-3. Isso reduz latência de rede dramaticamente.

O Vite faz isso automaticamente em produção — `npm run build`. Em desenvolvimento, deixa o código legível e não minifica (para debug mais fácil).

### 4.5 — Comandos do Vite: Watcher vs Build

O Vite oferece dois modos de compilação:

**`npm run dev`** — inicia o servidor de desenvolvimento com **watcher contínuo**. O Vite fica "observando" (watching) a pasta `resources/`. Toda vez que você salva um arquivo `.ts`, o Vite:

1. Compila aquele arquivo
2. Notifica o navegador via WebSocket (HMR)
3. O navegador recarrega apenas o módulo alterado (não a página inteira)

Isso é o **"watcher"**: um processo que não termina, fica escutando mudanças. Útil durante desenvolvimento — você salva, o navegador atualiza automaticamente.

**`npm run build`** — compilação pontual, única. O Vite lê todos os arquivos em `resources/`, compila, minifica, bundla, e salva em `public/`. Depois termina. Útil em produção e em CI/CD.

**Conceito do Watcher**: em vez de você rodar manualmente `npm run build` toda vez que muda um arquivo, o watcher faz isso automaticamente. É como um "observador" que fica de olho. Economia de tempo e menos erros de esquecer de recompilar.

### 4.6 — Entry Points e Containerização

O Vite, na configuração atual, é um **entry point** do projeto — ele é um processo separado que sobe na porta 5173 (durante desenvolvimento) ou que faz o build final (em produção). A configuração atual do `vite.config.js` está estruturada para isso:

```javascript
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
    root: 'resources',
    server: {
        open: (process.env.IS_CONTAINER !== "TRUE"),
        hmr: true,
        host: true,
        port: 5173
    },
    resolve: {
        alias: {
            '@fa': path.resolve(__dirname, 'node_modules/@fortawesome/fontawesome-free')
        },
    },
    build: {
        outDir: '../public',
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: [
                "./resources/index.html"
            ],
            output: {
                assetFileNames: 'src/[name].[hash][extname]',
                entryFileNames: 'src/[name].[hash].js',
                chunkFileNames: 'src/[name].[hash].js',
            }
        }
    }
})
```

**Detalhes importantes:**

- **`root: 'resources'`** — o Vite procura por `index.html` e assets a partir de `resources/`
- **`server.open`** — se `IS_CONTAINER !== "TRUE"`, abre o navegador; se Docker, não abre
- **`server.hmr: true`** — ativa Hot Module Replacement
- **`server.host: true`** — escuta em `0.0.0.0` (importante para Docker)
- **`server.port: 5173`** — porta padrão
- **`build.outDir: '../public'`** — output compilado e minificado em `public/`
- **`build.manifest: true`** — gera `manifest.json` para rastrear assets
- **`rollupOptions`** — controla a geração de chunks, adicionando hash para cache-busting

### 4.7 — Vite como Container no Docker Compose

A estrutura de configuração atual já foi preparada para ser containerizada. Um futuro `Dockerfile` poderia ser:

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
ENV IS_CONTAINER=TRUE
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

Isso faria o Vite rodar como um container separado no `docker-compose.yml`, ao lado do backend. Cada entry point (Vite, backend, banco de dados) rodaria em seu próprio container, se comunicando via rede Docker — mantendo separação de responsabilidades e escalabilidade.

---

## 5. API Contextual: Eliminando Redundância via JWT

### 5.1 — O Padrão Atual: ID na URL

Até agora, as chamadas de API passam o ID do usuário como parâmetro na URL:

```javascript
// deleteApi.js — cliente passa o ID na URL
export async function userDeleteApi(id) {
    const { data } = await clientApi.delete(`/users/${id}`);
    return data;
}

// updateApi.js — cliente passa o ID do usuário na URL
export async function taskUpdateApi(idUser, taskId, updates) {
    const { data } = await clientApi.put(`/users/${idUser}/tasks/${taskId}`, updates);
    return data;
}
```

Isso funciona, mas tem uma redundância perigosa: o cliente está passando um ID que já está dentro do JWT, no cookie. O backend já sabe quem é o usuário através do token — por que recebe o ID novamente?

### 5.2 — O Problema: Confiança sem Verificação

Se o cliente pode passar qualquer ID na URL, nada impede ele de fazer uma requisição `DELETE` para `/users/42` mesmo se está autenticado como usuário 7. O backend precisa verificar: "esse ID na URL é o mesmo do JWT?" Essa verificação extra é necessária, mas ela revela o real problema: a URL contém informação que já devia estar no token.

```javascript
// backend: recebe DELETE /users/42
// backend: extrai userId do JWT (que é 7)
// backend: verifica se 42 === 7 → não é, então rejeita
// (mas isso só funciona se o backend lembrar de fazer essa verificação em TODA chamada)
```

### 5.3 — Introduzindo API Contextual: ID vem do Token

**API Contextual** significa que o servidor infere contexto do usuário a partir do token JWT, sem o cliente precisar passar esse dado novamente:

```javascript
// antes (com redundância)
DELETE /users/42  (com JWT id=7)
→ backend recebe dois "42"s e precisa verificar se correspondem

// depois (API contextual)
DELETE /users/me  (com JWT id=7)
→ backend resolve "/me" como o usuário do token (7)

// ou até omitir o usuário inteiramente em certos endpoints
DELETE /profile
→ backend sabe que é o usuário do token
```

Essa mudança simplifica e torna mais segura a API: o contexto é único (o token), e não precisa ser repetido em cada URL.

### 5.4 — Refatorando as APIs para Contextual

**userDeleteApi** — em vez de passar `id`, é só `DELETE /users/me`:

```javascript
// antes
export async function userDeleteApi(id) {
    const { data } = await clientApi.delete(`/users/${id}`);
    return data;
}

// depois (contextual)
export async function userDeleteApi() {
    const { data } = await clientApi.delete(`/users/me`);
    return data;
}
```

**taskUpdateApi** — o ID do usuário sai da URL, apenas o taskId fica:

```javascript
// antes: PUT /users/{idUser}/tasks/{taskId}
export async function taskUpdateApi(idUser, taskId, updates) {
    const { data } = await clientApi.put(`/users/${idUser}/tasks/${taskId}`, updates);
    return data;
}

// depois: PUT /me/tasks/{taskId}
export async function taskUpdateApi(taskId, updates) {
    const { data } = await clientApi.put(`/me/tasks/${taskId}`, updates);
    return data;
}
```

**userListApi** — se for listar apenas seus próprios usuários (caso admin), a URL muda:

```javascript
// se o endpoint era /users, continua assim para admin
// mas se era uma cópia pessoal, muda para /me ou similar
export async function userListApi({ page = 1, limit = 10 } = {}) {
    const { data } = await clientApi.get("/me", {
        params: { page, limit }
    });
    return data;
}
```

### 5.5 — Benefício de Segurança: Menos Pontos de Falha

Concentrar o contexto do usuário no JWT (e não na URL) significa:

- **Uma única fonte de verdade**: o token diz quem é
- **Menos verificações esquecidas**: o backend não precisa verificar se `idUser` da URL bate com o JWT, porque a URL não tem `idUser`
- **URLs mais limpas e semânticas**: `/users/me` é mais direto do que `/users/7` (que é inútil para o cliente conhecer — ele já sabe quem é)

---

## 6. Conclusão

Esta aula marcou uma evolução crucial em quatro eixos:

1. **Vendor API e Transpilação**: O navegador (e o Node) só entendem JavaScript puro. TypeScript, Sass e outros formatos precisam ser transpilados. Esse é o conceito fundamental que explica por que pré compiladores existem.

2. **TypeScript + Generics + Escalabilidade**: TypeScript força explicitação de tipos — documentação executável do que cada função pode fazer. Generics (`<T>`) permitem escrever código reutilizável, type-safe e escalável que funciona com qualquer tipo. Visto em ação ao tipar respostas de Axios (`clientApi.get<Usuario[]>()`), criando APIs type-safe para infinitos tipos. **Tipos não são detalhe: são a base para organizar e escalar projetos.**

3. **Vite: Duas Serventias**: Não é só HMR. A verdadeira potência é a **pré compilação invisível** — TypeScript → JavaScript/CSS puro, automaticamente. No desenvolvimento (HMR) e em produção (build otimizado com minificação e bundling). Já está estruturado para Docker: entry point separado, porta 5173, `server.host: true`, `IS_CONTAINER` para decidir comportamento.

4. **API Contextual**: Em vez de o cliente passar ID na URL, o backend o infere do JWT. Uma única fonte de verdade (o token), menos pontos de falha, URLs limpas.

---

## 7. Referências

- **TypeScript Handbook**: [Type Basics](https://www.typescriptlang.org/docs/handbook/), [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html), [Constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)
- **Vite Documentation**: [Features](https://vitejs.dev/guide/features.html), [Server Options](https://vitejs.dev/config/server-options.html), [Build Options](https://vitejs.dev/config/build-options.html)
- **Vite + Docker**: Containerizing Frontend Build Tools
- **MDN/Auth Best Practices**: [Stateless Authentication](https://developer.mozilla.org/en-US/docs/Glossary/Authentication), [Token-Based Access](https://developer.mozilla.org/en-US/docs/Glossary/JWT)

---

## 8. TF Aula 05 - Pré Compiladores e Typescript

📄 **[Descrição completa em TF05.md](./TF05.md)**

### Objetivo

Implementar as operações que faltam no gerenciador de tarefas: **excluir**, **alterar o nome** e **paginar** a listagem — tudo em **TypeScript** e usando as rotas **contextuais** (`/me/tasks`) vistas na Seção 5, em vez das antigas `/users/{idUser}/tasks`.

### O que você precisa fazer

**0. Migrar as chamadas de API para `/me/tasks`** — adapte `taskDeleteApi.ts`, `taskUpdateApi.ts` e `tasksListApi.ts` pra pararem de mandar `idUser` na URL e chamarem as rotas contextuais (o backend já expõe elas via `TaskViewContextApi`). Ajuste também quem chama essas funções.

**1. Excluir Tarefa (DELETE)** — em `render/taskRender.ts`, descomente o botão "Excluir" e ligue o `taskDeleteHandler`, que já existe. Depois da migração do item 0, ele passa a chamar `taskDeleteApi(taskId)` sem `idUser`.

**2. Alterar Tarefa (UPDATE — nome)** — a Aula 04 já cobriu o checkbox de "concluída". Agora falta o **nome**: adicione um jeito de editar (botão "Editar" ou duplo-clique) e chame `taskUpdateApi(taskId, { name })` num novo `listeners/taskEditHandler.ts`, seguindo o padrão dos outros handlers.

**3. Paginação** — o backend já pagina (`tasksListApi` retorna `PaginatedResponse<Task>` com `data`, `page`, `limit`, `total`), mas o frontend ignora isso hoje. Adicione botões "Anterior"/"Próxima" em `tasksListRender.ts`, chamando `tasksListRender(idUser, novaPagina)` de novo a cada troca.

### Arquivos a trabalhar

```
src/frontend/resources/js/
├── api/
│   ├── taskDeleteApi.ts       ← Migrar pra /me/tasks/{id} (sem idUser)
│   ├── taskUpdateApi.ts       ← Migrar pra /me/tasks/{id} (sem idUser)
│   └── tasksListApi.ts        ← Migrar pra /me/tasks (sem idUser)
├── render/
│   ├── taskRender.ts          ← Descomente o botão Excluir aqui
│   └── tasksListRender.ts     ← Adicione os controles de paginação aqui
├── listeners/
│   ├── taskDeleteHandler.ts   ← Ajustar chamada pra API contextual
│   ├── taskToggleHandler.ts   ← Ajustar chamada pra API contextual
│   └── taskEditHandler.ts     ← NOVO — você cria, seguindo o padrão dos outros
└── types/
    └── api.ts                 ← Já tem Task e PaginatedResponse<T> prontos
```

### APIs disponíveis (contextuais — idUser vem do JWT)

```
DELETE /me/tasks/{id}
PUT    /me/tasks/{id}   Body: { name?: string, is_done?: boolean }
GET    /me/tasks?page=1&limit=10   → { data: Task[], page, limit, total }
```

### Regras

- ✅ Tipar tudo — sem `any` solto. Reaproveite `Task` e `PaginatedResponse<T>` de `types/api.ts`
- ✅ Use as rotas contextuais (`/me/tasks`), não as antigas
- ✅ Siga o padrão do projeto (`js/api`, `js/listeners`, `js/render`)
- ✅ Recarregue a lista após excluir/alterar/paginar
- ❌ Não quebre o listar, criar e marcar como concluída (que já funcionam)
- ❌ Não pode usar frameworks além do que já existe (Bootstrap, Axios)

### Como entregar

🔗 https://docs.google.com/forms/d/e/1FAIpQLSeYG0oQTpWqqZGSCAsTJwpw26Yrd2laubS9VVqqAA_Lr2L_Og/viewform?usp=publish-editor

Detalhes completos estão em **[TF05.md](./TF05.md)**.
