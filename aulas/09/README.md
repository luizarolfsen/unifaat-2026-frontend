# React: Referências e Efeitos

**TF da Aula 09 · Frontend · UNIFAAT 2026.2 · Prof. Luan Lourenço**

Este arquivo é a descrição do TF. Link deste TF (por extenso):
https://github.com/luan-tavares/unifaat-2026-frontend/tree/main/aulas/09

---

## Objetivo

Criar um **app React** (Vite + TypeScript) que **lista usuários e os posts de
cada um** consumindo uma API de verdade, usando agora o que vimos na aula:
**referências (`useRef`), efeitos (`useEffect`) e um custom hook seu**, o
`useAxios`. O Axios chama a API; o hook guarda os estados da requisição.

A API é a **JSONPlaceholder**, pública e **sem autenticação** (não precisa de
login nem de backend seu):

- `https://jsonplaceholder.typicode.com/users` (lista de usuários)
- `https://jsonplaceholder.typicode.com/posts?userId=ID` (posts de um usuário)

Instale o Axios no projeto: `npm install axios`.

A entrega segue o **fluxo Git do curso**: uma branch própria, um diretório com
o mesmo nome dela e, dentro dele, o app e um `tf.md` com os seus dados. A
entrega é um **Pull Request** do seu fork para o `main` do professor.

## O que NÃO pode usar

Agora **pode** usar `useRef` e `useEffect`. Mas **não use**:

- ❌ `fetch` direto, `useSWR`, React Query ou qualquer outra biblioteca de
  requisição (só o **Axios**)
- ❌ bibliotecas de estado, de formulário ou de UI além do que o Vite gera
- ❌ `async` na função passada ao `useEffect` (declare a função `async` **dentro**
  do efeito e chame-a, como vimos na aula)

## O que o app precisa fazer

Tipos usados (só os campos que o app usa):

```ts
interface User {
    id: number
    name: string
    email: string
}

interface Post {
    id: number
    userId: number
    title: string
    body: string
}
```

1. **Custom hook `useAxios<T>(url: string | null)`**, em
   `src/hooks/useAxios.ts`, que devolve `{ data, error, isLoading, refetch }`:
   - os três estados nascem dentro do hook (`useState`);
   - o GET roda em um `useEffect` com dependências **só primitivas**
     (`[url, attempt]`, nunca um objeto criado no corpo do componente);
   - a **limpeza** do efeito cancela a requisição anterior com
     **`AbortController`** (`signal` no Axios, `controller.abort()` na limpeza);
   - no `catch`, um cancelamento (`isCancel(err)`) é **ignorado**: não vira
     erro na tela;
   - com `url === null` o hook fica **parado** (sem requisição);
   - `refetch()` refaz a chamada mudando um estado (o efeito faz o trabalho).
2. **Lista de usuários**: um componente usa `useAxios<User[]>` e mostra nome e
   e-mail de cada usuário. Clicar num usuário o **escolhe**.
3. **Posts do usuário escolhido**: outro componente usa `useAxios<Post[]>` com a
   url `.../posts?userId=ID` **dependendo do usuário escolhido** (`null` enquanto
   ninguém foi escolhido). Trocar de usuário rapidamente **nunca** pode mostrar
   a resposta velha: garanta isso com a **limpeza do efeito** (e, se quiser,
   com `key={user.id}` no componente).
4. **Estados da tela** (vindos do hook): **"Carregando..."** enquanto
   `isLoading`; a **mensagem de erro** com um botão **"Tentar de novo"** que
   chama `refetch()`; a lista só aparece quando há `data`.
5. **Filtro dos posts por título**, local (sem chamar a API), num campo com
   **`useRef`**:
   - o campo recebe **foco automático** quando a tela monta (`useEffect` com
     `[]` e `ref.current?.focus()`);
   - o botão **"Limpar"** apaga o texto **e devolve o foco** ao campo
     (`ref.current?.focus()` no handler).
6. **Um dado de bastidor em `useRef`**, que **não renderiza** a tela: por
   exemplo, quantas requisições o app já fez (somado em `ref.current += 1` a cada
   resposta) ou o último usuário carregado. Ele aparece só num botão
   **"Mostrar"** (que o exibe no `console.log` ou num texto) e nunca em estado.
7. **Um efeito que sincroniza o título da aba**: `document.title` mostra o nome
   do usuário escolhido e a quantidade de posts (ex.: `Leanne Graham · 10 posts`),
   e volta a um título padrão quando ninguém está escolhido.

## Regras de código

- ✅ Componentes separados, no mínimo: `UserList`, `UserPosts` e o `App` (dono
  do usuário escolhido, que passa dados por props e funções por callback)
- ✅ O hook em **arquivo próprio**: `src/hooks/useAxios.ts` (nome começa com
  `use`, chamado sempre no topo do componente, antes de qualquer `return`)
- ✅ Tipar tudo em TypeScript (`strict`), sem `any`; `type Props` em cada
  componente; generics explícitos: `useAxios<User[]>`, `useAxios<Post[]>`,
  `useRef<HTMLInputElement>(null)`, `useState<User | null>(null)`
- ✅ Arquivos de componente em **`.tsx`**
- ✅ Só `const`: nunca `let` em componente nem em hook
- ✅ Estado booleano com prefixo `is`: `const [isLoading, setIsLoading] = ...`
- ✅ Imutabilidade: nunca alterar array ou objeto do estado no lugar
- ✅ Todo `useEffect` com a lista de dependências correta e, quando cria algo
  (requisição, timer, assinatura), com a **função de limpeza**
- ✅ `ref.current` lido e alterado só em **handlers e efeitos**, nunca durante a
  renderização (no corpo do componente)
- ✅ Evento de clique explícito: função nomeada ligada no JSX
  (`onClick={handleChoose}`)
- ✅ Sem `else` / `else if` (early return ou valor padrão antes do `if`)
- ✅ `key` estável nas listas (o `id`, nunca o índice)

## Como entregar

A branch **tem que se chamar `RA-tf-09`**: o seu RA, `-tf-` e o número do TF
com 2 dígitos. Exemplo para o RA `1234567`: `1234567-tf-09`.

**Sem a branch com esse nome, o TF vale ZERO.**

1. Fazer o **fork** do repositório do professor e clonar o **seu fork**
   (veja a documentação "Fluxo Git do aluno").
2. Atualizar o `main` e criar a branch do TF a partir dele:

```sh
git switch main
git pull --ff-only upstream main
git switch -c 1234567-tf-09
```

3. Criar, na **raiz do repositório**, um diretório com **exatamente o mesmo
   nome da branch**, com o app React e o `tf.md` dentro:

```text
1234567-tf-09/
├── tf.md
└── app/            ← o projeto React (npm create vite@latest app -- --template react-ts)
```

```sh
mkdir 1234567-tf-09
cd 1234567-tf-09
npm create vite@latest app -- --template react-ts
cd app
npm install axios
```

4. Criar o `tf.md` dentro do diretório, com o seu **nome**, o seu **RA** e o
   seu **GitHub** (link do seu perfil, por extenso):

```text
Nome: Maria da Silva
RA: 1234567
GitHub: https://github.com/maria-silva
```

5. Commitar e enviar para o **seu fork**. Não commite a pasta
   `node_modules` (o `.gitignore` do Vite já cuida disso):

```sh
git add -A
git commit -m "TF-09"
git push -u origin 1234567-tf-09
```

6. Abrir o **Pull Request** da sua branch para o `main` do professor
   (`luan-tavares/unifaat-2026-frontend`):

```text
https://github.com/luan-tavares/unifaat-2026-frontend/compare/main...SEU-USUARIO:1234567-tf-09?expand=1
```

   - **Título do PR:** `TF-09 · RA · Nome` (ex.: `TF-09 · 1234567 · Maria da Silva`)
   - **Descrição:** o conteúdo do seu `tf.md`

O PR nunca será mergeado: o professor o fecha depois de corrigir.

A entrega termina no Pull Request: **não há formulário**. O professor corrige
a partir do seu PR.

## Como conferir antes de entregar

- A branch no GitHub se chama `RA-tf-09` (com o **seu** RA)
- Na raiz existe o diretório com o mesmo nome da branch
- Dentro dele: `tf.md` (Nome, RA e GitHub) e a pasta `app/`
- `cd app && npm install && npm run dev` abre o app e a lista de usuários carrega
- `npx tsc --noEmit` (dentro de `app/`) sem erro
- Nenhum `any` no código
- O hook está em arquivo próprio (`src/hooks/useAxios.ts`), genérico em `<T>`, e
  aceita `url: string | null`
- A limpeza do efeito usa **`AbortController`** (`controller.abort()`) e o
  `catch` ignora o cancelamento com `isCancel`
- Trocar de usuário várias vezes seguidas não mostra posts do usuário anterior
- O campo de filtro recebe foco ao abrir a tela e depois de "Limpar"
- O dado guardado em `useRef` não aparece na tela sem o botão "Mostrar"
- O título da aba muda ao escolher um usuário

## Regras gerais

- ✅ Uma branch por TF, com o nome `RA-tf-09`
- ✅ Entrega por Pull Request (título `TF-09 · RA · Nome`)
- ❌ Não commitar no `main`, nem fazer merge do PR
- ❌ Nome da branch fora do formato `RA-tf-09` = TF com nota ZERO

**Prazo:** a definir.

## Dúvidas?

Revise o `briefing.md` desta aula (seções 2 a 5: reforço de estado e props,
referências, efeitos e custom hooks) e a documentação "Fluxo Git do aluno"
(abas Fluxo do aluno, Comandos Git e Troubleshooting).
