# React: Referências e Efeitos

**TF da Aula 09 · Frontend · UNIFAAT 2026.2 · Prof. Luan Lourenço**

Este arquivo é a descrição do TF. Link deste TF (por extenso):
https://github.com/luan-tavares/unifaat-2026-frontend/tree/main/aulas/09

---

## Objetivo

Criar um **app React** (Vite + TypeScript) que **lista os usuários e as tasks
de cada um** consumindo o **backend do nosso curso**, usando agora o que vimos
na aula: **referências (`useRef`), efeitos (`useEffect`) e um custom hook seu**,
o `useAxios`. O Axios chama a API; o hook guarda os estados da requisição.

A entrega segue o **fluxo Git do curso**: uma branch própria, um diretório com
o mesmo nome dela e, dentro dele, o app e um `tf.md` com os seus dados. A
entrega é um **Pull Request** do seu fork para o `main` do professor.

## Antes de começar: o backend do curso

O app consome a API do projeto do curso, que roda no Docker (veja "Já tinha o
projeto? Atualizando" no README da raiz). Com o projeto atualizado:

```sh
docker compose up -d --build
docker compose run --rm nodecommand-container migrate
docker compose run --rm nodecommand-container seed
```

O seed cria os usuários e as tasks. A API fica em **`http://localhost:8080`**
e a documentação (Swagger) em `http://localhost:8080/docs`.

O **seu app tem que rodar em `http://localhost:5173`** (a porta padrão do
`npm run dev`): é uma das origens que o backend libera no **CORS**. Em outra
porta, o navegador bloqueia as chamadas.

As rotas deste TF **não exigem login**:

| Para quê | Rota | Resposta |
|----------|------|----------|
| Listar usuários (paginado) | `GET /users?page=1&limit=5` | `{ page, limit, total, next, data: User[] }` |
| Listar as tasks de um usuário | `GET /users/{id}/tasks?page=1&limit=20` | `{ page, limit, total, next, data: Task[] }` |
| Marcar a task como feita | `PUT /users/{id}/tasks/{taskId}` com `{ "is_done": true }` | a `Task` atualizada |

Instale o Axios no projeto: `npm install axios`.

## O que NÃO pode usar

Agora **pode** usar `useRef` e `useEffect`. Mas **não use**:

- ❌ `fetch` direto, `useSWR`, React Query ou qualquer outra biblioteca de
  requisição (só o **Axios**)
- ❌ bibliotecas de estado, de formulário ou de UI além do que o Vite gera
- ❌ `async` na função passada ao `useEffect` (declare a função `async` **dentro**
  do efeito e chame-a, como vimos na aula)

## O que o app precisa fazer

Tipos usados (copie só o que o app usa; são os mesmos do backend):

```ts
interface User {
    id: number
    name: string
    email: string
    job_title: string | null
}

interface Task {
    id: number
    name: string
    is_done: boolean
    id_user: number
}

interface PaginatedResponse<T> {
    data: T[]
    page: number
    limit: number
    total: number
    next: number | null
}
```

1. **Cliente do Axios** em um único arquivo, `src/api/clientApi.ts`, com
   `axios.create({ baseURL: "http://localhost:8080" })`. Toda chamada do app
   passa por ele.
2. **Custom hook `useAxios<T>(url: string | null)`**, em
   `src/hooks/useAxios.ts`, que devolve `{ data, error, isLoading, refetch }`:
   - os três estados nascem dentro do hook (`useState`);
   - o GET (pelo `clientApi`) roda em um `useEffect` com dependências **só
     primitivas** (`[url, attempt]`, nunca um objeto criado no corpo do
     componente);
   - a **limpeza** do efeito cancela a requisição anterior com
     **`AbortController`** (`signal` no Axios, `controller.abort()` na limpeza);
   - no `catch`, um cancelamento (`isCancel(err)`) é **ignorado**: não vira
     erro na tela;
   - com `url === null` o hook fica **parado** (sem requisição);
   - `refetch()` refaz a chamada mudando um estado (o efeito faz o trabalho).
3. **Lista de usuários paginada** (`UserList`): usa
   `useAxios<PaginatedResponse<User>>` com a url
   `/users?page=${page}&limit=5`, em que **`page` é um estado**. Os botões
   **"Anterior"** e **"Próxima"** mudam a página (a url muda, o efeito roda de
   novo), e "Próxima" fica desabilitada quando `next` é `null`. Clicar num
   usuário o **escolhe**.
4. **Tasks do usuário escolhido** (`UserTasks`): outro componente usa
   `useAxios<PaginatedResponse<Task>>` com a url
   `/users/${user.id}/tasks?page=1&limit=20` **dependendo do usuário
   escolhido**. Trocar de usuário (ou de página) rapidamente **nunca** pode
   mostrar a resposta velha: garanta isso com a **limpeza do efeito** (e, se
   quiser, com `key={user.id}` no componente).
5. **Estados da tela** (vindos do hook): **"Carregando..."** enquanto
   `isLoading`; a **mensagem de erro** com um botão **"Tentar de novo"** que
   chama `refetch()`; a lista só aparece quando há `data`. Para testar o erro,
   derrube o backend (`docker compose stop`) e clique num usuário.
6. **Marcar a task como feita**: clicar na task faz o
   `PUT /users/{id}/tasks/{taskId}` com `{ is_done: !task.is_done }` num
   **handler** (nunca num efeito) e, quando o PUT termina, chama `refetch()`
   para recarregar a lista. Enquanto o PUT está no ar, mostre **"Salvando..."**
   (estado `isSaving`) e, se falhar, uma mensagem de erro.
7. **Filtro das tasks por nome**, local (sem chamar a API), num campo com
   **`useRef`**:
   - o campo recebe **foco automático** quando a tela monta (`useEffect` com
     `[]` e `ref.current?.focus()`);
   - o botão **"Limpar"** apaga o texto **e devolve o foco** ao campo
     (`ref.current?.focus()` no handler).
8. **Um dado de bastidor em `useRef`**, que **não renderiza** a tela: quantas
   respostas de tasks o app já recebeu (`ref.current += 1` num efeito quando o
   `data` chega). Ele aparece só num botão **"Mostrar"** (no `console.log` ou
   num texto) e nunca em estado.
9. **Um efeito que sincroniza o título da aba**: `document.title` mostra o nome
   do usuário escolhido e a quantidade de tasks (ex.: `Ana Souza · 6 tasks`), e
   volta a um título padrão quando ninguém está escolhido.

## Regras de código

- ✅ Componentes separados, no mínimo: `UserList`, `UserTasks` e o `App` (dono
  do usuário escolhido, que passa dados por props e funções por callback)
- ✅ O hook em **arquivo próprio**: `src/hooks/useAxios.ts` (nome começa com
  `use`, chamado sempre no topo do componente, antes de qualquer `return`)
- ✅ Tipar tudo em TypeScript (`strict`), sem `any`; `type Props` em cada
  componente; generics explícitos: `useAxios<PaginatedResponse<User>>`,
  `useAxios<PaginatedResponse<Task>>`, `useRef<HTMLInputElement>(null)`,
  `useState<User | null>(null)`
- ✅ Arquivos de componente em **`.tsx`**
- ✅ Só `const`: nunca `let` em componente nem em hook
- ✅ Estado booleano com prefixo `is`: `const [isSaving, setIsSaving] = ...`
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

6. Abrir o **Pull Request no repositório do professor**
   (`luan-tavares/unifaat-2026-frontend`). O PR **nasce no repositório do
   professor** (o *base*) e traz a sua branch do **seu fork** (o *head*): é o
   professor quem recebe e corrige, não o seu fork.

   **Pelo navegador**, abra este endereço (troque `SEU-USUARIO` pelo seu
   usuário do GitHub; ele já escolhe o `main` do professor como destino):

```text
https://github.com/luan-tavares/unifaat-2026-frontend/compare/main...SEU-USUARIO:1234567-tf-09?expand=1
```

   **Ou pelo terminal** (GitHub CLI), na raiz do seu clone, com `--repo`
   apontando para o repositório do professor:

```sh
gh pr create \
  --repo luan-tavares/unifaat-2026-frontend \
  --base main \
  --head SEU-USUARIO:1234567-tf-09 \
  --title "TF-09 · 1234567 · Maria da Silva" \
  --body-file 1234567-tf-09/tf.md
```

   - **Título do PR:** `TF-09 · RA · Nome` (ex.: `TF-09 · 1234567 · Maria da Silva`)
   - **Descrição:** o conteúdo do seu `tf.md`
   - **Conferir:** a página do PR fica em
     `github.com/luan-tavares/unifaat-2026-frontend/pull/NÚMERO` (no repositório
     do **professor**, não no seu) e mostra `luan-tavares:main ← SEU-USUARIO:1234567-tf-09`

O PR nunca será mergeado: o professor o fecha depois de corrigir.

A entrega termina no Pull Request: **não há formulário**. O professor corrige
a partir do seu PR.

## Como conferir antes de entregar

- A branch no GitHub se chama `RA-tf-09` (com o **seu** RA)
- Na raiz existe o diretório com o mesmo nome da branch
- Dentro dele: `tf.md` (Nome, RA e GitHub) e a pasta `app/`
- O backend está no ar (`docker compose up -d`) e `cd app && npm install && npm run dev` abre o app em `http://localhost:5173` com a lista de usuários carregada
- `npx tsc --noEmit` (dentro de `app/`) sem erro
- Nenhum `any` no código
- O hook está em arquivo próprio (`src/hooks/useAxios.ts`), genérico em `<T>`, e
  aceita `url: string | null`
- A limpeza do efeito usa **`AbortController`** (`controller.abort()`) e o
  `catch` ignora o cancelamento com `isCancel`
- Trocar de usuário várias vezes seguidas não mostra tasks do usuário anterior
- O campo de filtro recebe foco ao abrir a tela e depois de "Limpar"
- O dado guardado em `useRef` não aparece na tela sem o botão "Mostrar"
- Os botões Anterior/Próxima trocam a página; "Próxima" desabilita quando `next` é `null`
- Marcar uma task como feita chama o PUT e a lista se atualiza (`refetch`)
- Com o backend parado, aparece o erro e o botão "Tentar de novo"
- O título da aba muda ao escolher um usuário

## Regras gerais

- ✅ Uma branch por TF, com o nome `RA-tf-09`
- ✅ Entrega por Pull Request **aberto no repositório do professor** (título `TF-09 · RA · Nome`)
- ❌ Não commitar no `main`, nem fazer merge do PR
- ❌ Nome da branch fora do formato `RA-tf-09` = TF com nota ZERO

**Prazo:** a definir.

## Dúvidas?

Revise o `briefing.md` desta aula (seções 2 a 5: reforço de estado e props,
referências, efeitos e custom hooks) e a documentação "Fluxo Git do aluno"
(abas Fluxo do aluno, Comandos Git e Troubleshooting).
