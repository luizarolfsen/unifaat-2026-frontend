Briefing para produção audiovisual e de conteúdo
Aula Completa
2026.2



Professor: Luan Tavares Lourenço
Disciplina: Frontend


Aula:
1☐ 2☐ 3☐ 4☐ 5☐ 6☐ 7☐ 8☐ 9☒ 10☐ 11☐ 12☐ 13☐ 14☐ 15☐ 16☐


Título da aula:

React: Referências e Efeitos


Opção do TA:  Vídeo ☐Texto ☒

1 - Introdução

Na Aula 08 o React entrou pelo caminho mais importante: o **estado**. Vimos que um componente é uma função, que o `useState` guarda o valor fora da função, e que cada mudança de estado faz o componente **inteiro** rodar de novo, com uma "foto" nova do estado. Esta aula parte exatamente dali e faz duas coisas.

A primeira é **reforçar** o que sustenta tudo no React, porque as duas novidades da aula só fazem sentido com isso firme: tudo o que está dentro do componente (variáveis, funções, derivados, o `return`) roda de novo a cada mudança de estado ou de parâmetro; os parâmetros chegam desestruturados e valem só para aquela execução; pais e filhos formam uma árvore em que a renderização cai de cima para baixo; e a **tipagem** em TypeScript é o que mantém essa árvore coerente.

A segunda é apresentar as duas "saídas" do ciclo *estado → renderização → tela*:

- **Referências (`useRef`)**: uma caixa no **heap** que sobrevive às renderizações e que **não** avisa o React quando muda. Serve para acessar elementos do HTML e de componentes (e acionar eventos nativos como `focus()` e `click()`) e para guardar dados "de bastidor" que vão para o backend sem redesenhar a tela;
- **Efeitos (`useEffect`)**: código que roda **depois** de a tela ser atualizada, **por causa** de uma mudança de estado. É a parte da máquina de Turing que cuida da **transição entre estados**: o estado muda e algo fora da tela precisa acontecer (por exemplo, uma chamada assíncrona ao backend).

Fechamos juntando tudo num **custom hook** de Axios, o `useAxios`, que carrega seus próprios estados (`data`, `error`, `isLoading`) e os "enxerta" em qualquer componente: quando o estado do hook muda, o componente que o usa renderiza de novo, como se o estado fosse dele. No caminho explicamos o **`AbortController`**, a API nativa que cancela uma requisição e evita a condição de corrida, e uma tela do projeto (`GET /hooks`) mostra o hook funcionando, com um registro que conta cada requisição que começa, chega, falha ou é cancelada.

A aula é conduzida com explicações animadas em passos, mostrando na tela o que acontece na memória e no ciclo do componente. Os exemplos usam o projeto do curso (usuários, tasks, `clientApi`, `PaginatedResponse<T>`), sem backend novo.

2 - Reforço: Tudo Dentro do Componente Roda de Novo

2.1 - A Função Inteira Roda a Cada Renderização

Um componente é uma função, e **renderizar é chamar essa função**. Cada chamada cria um frame novo na call stack, com variáveis novas, e devolve JSX novo. Isso vale para **tudo** que está dentro do componente, não só para o `return`:

```tsx
import { useState } from "react"

type ContadorProps = {
    inicial: number
}

export function Contador({ inicial }: ContadorProps) {
    const [count, setCount] = useState(inicial)

    console.log("1. a função rodou; count =", count)

    const dobro = count * 2

    function handleClick() {
        setCount(count + 1)
    }

    return <button onClick={handleClick}>{count} (dobro: {dobro})</button>
}
```

A cada clique o console mostra a linha 1 de novo, e o que muda de uma execução para outra é o seguinte:

| O que está dentro do componente | A cada renderização |
|---------------------------------|---------------------|
| `const dobro = count * 2` | **recalculado** com o `count` daquela execução |
| `function handleClick() { ... }` | **função nova** (endereço novo no heap) |
| `const { inicial } = props` (parâmetros) | **lidos de novo** dos parâmetros recebidos |
| `useState(inicial)` | devolve o valor **guardado pelo React**; o `inicial` só vale na primeira vez |
| JSX do `return` | **descrito de novo**; o React compara com o anterior e altera só o que mudou |

A consequência prática é a regra que vamos usar a aula toda: **tudo que é calculado a partir de estado e de parâmetros deve ficar solto dentro do componente** (valor derivado), porque ele se atualiza sozinho. Guardar um derivado em outro estado é criar duas verdades que precisam ser sincronizadas, o problema que o React veio resolver.

2.2 - O Que Dispara uma Nova Renderização

Um componente roda de novo por três motivos, e só:

1. **O estado dele mudou**: alguém chamou `setEstado` com um valor diferente (o React compara com `Object.is`: primitivos por valor, objetos e arrays por **endereço**, lembra do heap da Aula 08?). Se o valor novo for igual ao atual, o React nem renderiza;
2. **O pai renderizou**: por padrão, quando um componente roda, todos os filhos que ele devolve no JSX rodam também, **mesmo que os parâmetros sejam iguais**;
3. **Os parâmetros mudaram**: na prática é uma consequência do motivo 2, já que parâmetros só mudam quando o pai roda e entrega outros.

Observe a cascata com dois componentes:

```tsx
import { useState } from "react"

type FilhoProps = {
    nome: string
}

function Filho({ nome }: FilhoProps) {
    console.log("   Filho rodou")

    return <p>{nome}</p>
}

export function Pai() {
    const [count, setCount] = useState(0)

    console.log("Pai rodou")

    function handleClick() {
        setCount(count + 1)
    }

    return (
        <>
            <button onClick={handleClick}>{count}</button>
            <Filho nome="Ana" />
        </>
    )
}
```

A cada clique o console imprime `Pai rodou` e, logo depois, `Filho rodou`, embora `nome="Ana"` nunca mude. O Filho não tem estado; ele roda porque o **pai** rodou. (Existe `React.memo` para pular filhos com parâmetros iguais, mas é otimização e fica fora desta aula.)

2.3 - Parâmetros Desestruturados

Todo componente recebe **um único objeto** de parâmetros, as `props`. A sintaxe `({ task, onToggle }: Props)` é só a **desestruturação** desse objeto na própria assinatura. As duas formas abaixo são equivalentes:

```tsx
type TaskItemProps = {
    task: Task
    onToggle: (task: Task) => void
}

// Forma completa: recebe o objeto e desestrutura dentro
function TaskItem(props: TaskItemProps) {
    const { task, onToggle } = props
    return <li onClick={() => onToggle(task)}>{task.name}</li>
}

// Forma usual: desestrutura na assinatura
function TaskItem({ task, onToggle }: TaskItemProps) {
    return <li onClick={() => onToggle(task)}>{task.name}</li>
}
```

Três propriedades da desestruturação que importam para o React:

- `task` e `onToggle` são **`const` novas a cada execução**: cada renderização tem a sua "foto" dos parâmetros, assim como tem a sua foto do estado (seção 7.6 da Aula 08);
- parâmetros são **somente leitura**: nunca se altera `task.name = ...`; quem muda o dado é o dono do estado, avisado por um callback;
- a desestruturação aceita **valor padrão**, **renomear** e **aninhar**, tudo tipado:

```tsx
type PaginacaoProps = {
    page?: number                 // opcional
    limit?: number
    user: { id: number, name: string }
}

function Paginacao({ page = 1, limit = 10, user: { id, name: userName } }: PaginacaoProps) {
    return <p>{userName} (#{id}): página {page}, {limit} por página</p>
}
```

`page = 1` vale quando o pai não envia nada; `user: { id, name: userName }` entra no objeto `user` e renomeia `name` para `userName`.

2.4 - Pai e Filho Aninhados

Os componentes formam uma **árvore**, e a renderização cai por ela **de cima para baixo**. Pegue a tela de usuários do projeto:

```text
Page
 └── UsersApp            ← estado: list, selected
      ├── (lista de usuários)
      └── UserTasks      ← recebe `user` por parâmetro
           └── (lista de tasks)
```

Seguindo uma mudança de estado em `UsersApp` (o usuário clicou num item e `setSelected` rodou):

1. `UsersApp` roda inteira, com o `selected` novo;
2. o JSX que ela devolve inclui `<UserTasks user={selected} />`, então `UserTasks` roda em seguida, já recebendo o `user` novo por parâmetro;
3. o que `UserTasks` devolve é comparado com o que estava na tela e só o necessário vai para o DOM.

E no sentido contrário? Se um **filho** tem estado próprio e ele muda, só **aquele filho** (e os descendentes dele) roda de novo; o pai **não** roda. Por isso o desenho é sempre o mesmo:

- **Para baixo, por parâmetros** (`user`, `tasks`);
- **Para cima, por callbacks** (`onSelect`, `onDelete`): o filho avisa, o dono do estado altera;
- o estado fica no **ancestral comum mais baixo** de quem precisa dele (*lifting state up*).

Duas regras sobre a árvore que serão úteis na seção 5:

- o React associa o estado ao **lugar do componente na árvore**: se o componente sai da tela (desmonta), o estado dele é **destruído**; quando volta, começa do zero;
- a prop especial **`key`** funciona como "identidade": mudar a `key` faz o React desmontar o componente e criar outro, **com estado novo**. Dentro de listas é isso que distingue um item do outro; fora de listas é o jeito de "reiniciar" um componente.

2.5 - Tipagem: o Que o TypeScript Garante na Árvore

Numa árvore de componentes o que quebra é a **conversa** entre pai e filho: o pai manda um dado errado, o filho espera outro, o callback tem outra assinatura. É por isso que o curso usa `.tsx`: o contrato entre eles vira um `type Props`, e o compilador acusa o erro **antes** de rodar.

```tsx
import type { ReactNode } from "react"

type AlertProps = {
    variant: "success" | "danger" | "warning"   // união literal: só esses três
    message: string
    onClose: () => void                         // callback sem parâmetros
    children?: ReactNode                        // conteúdo aninhado, opcional
}

type TaskItemProps = {
    task: Task
    onToggle: (task: Task) => void              // o filho passa a task inteira
    onDelete: (id: number) => void              // o filho passa só o id
}

// No pai, o compilador confere cada uma dessas ligações:
<Alert variant="info" message="Oi" onClose={fechar} />   // ERRO: "info" não existe em variant
<TaskItem task={task} onToggle={toggle} />               // ERRO: falta onDelete
<TaskItem task={task} onToggle={remove} onDelete={remove} />  // ERRO se remove for (id: number) => void
```

Onde a tipagem protege o fluxo de dados:

| Situação | Tipagem |
|----------|---------|
| Parâmetros do componente | `type NomeProps = { ... }` na assinatura |
| Estado com valor inicial vazio ou ausente | `useState<Task[]>([])`, `useState<User \| null>(null)` |
| Callback que sobe | `(user: User) => void`, a assinatura que o pai precisa implementar |
| Resposta de API reaproveitável | generic: `PaginatedResponse<Task>`, `PaginatedResponse<User>` |
| Evento do HTML | `ChangeEvent<HTMLInputElement>`, `FormEvent` |
| Referência (seção 3) | `useRef<HTMLInputElement>(null)` |

E o `useState<User | null>(null)` gera um benefício que vamos explorar: depois de um *early return*, o TypeScript **estreita** o tipo, e dali para baixo ele sabe que o valor não é `null`:

```tsx
type UserTasksProps = {
    user: User | null
}

export function UserTasks({ user }: UserTasksProps) {
    if (user === null) {
        return <p>Escolha um usuário.</p>
    }

    // aqui o TypeScript sabe que user é User (e não User | null)
    return <h2>Tasks de {user.name}</h2>
}
```

3 - Referências: `useRef`

3.1 - O Problema: Um Valor Que Sobrevive, Mas Não Redesenha

Já conhecemos dois lugares para guardar um valor num componente, e nenhum serve sempre:

- **variável comum**: nasce e morre dentro de cada execução da função (frame da call stack); a próxima renderização não a enxerga;
- **estado** (`useState`): sobrevive, mas **toda** mudança renderiza o componente de novo.

Existem valores que precisam sobreviver às renderizações **sem** provocar uma: o elemento HTML de um campo (para dar `focus()`), o id de um `setTimeout` (para cancelá-lo), a última busca enviada ao backend (para não repetir). Redesenhar a tela por causa deles seria desperdício, e às vezes causaria loop. Para isso existe o `useRef`.

3.2 - O Que É uma Referência

O `useRef` cria **um objeto com uma única propriedade, `current`**, e o guarda para o componente:

```tsx
import { useRef } from "react"

const clicksRef = useRef(0)

// clicksRef é este objeto, criado UMA vez no heap:
// { current: 0 }
```

O ponto central é o **heap** (Aula 08): na primeira renderização o React cria o objeto `{ current: 0 }` no heap. Nas renderizações seguintes, `useRef` devolve **o mesmo endereço**. Compare com o estado, que a cada renderização entrega uma foto nova:

```text
 Renderização 1          Renderização 2          Renderização 3
 ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
 │ count = 0    │        │ count = 1    │        │ count = 2    │   ← estado: uma "foto" por execução
 │ ref  ──┐     │        │ ref  ──┐     │        │ ref  ──┐     │
 └────────┼─────┘        └────────┼─────┘        └────────┼─────┘
          └────────────────────┬──┴─────────────────────┘
                               ▼
                    heap:  { current: ... }   ← o MESMO objeto nas três execuções
```

Daí vêm as duas propriedades que definem a referência:

- **Persiste**: o `current` continua valendo entre as renderizações, **a não ser que você o modifique**;
- **Mudar não renderiza**: `clicksRef.current += 1` altera o objeto no heap, no lugar. Lembra que, na Aula 08, alterar um objeto no lugar **não avisa o React**, e por isso proibimos isso com estado? Aqui acontece o inverso: usamos a mutação **de propósito**, justamente porque não queremos o aviso.

```tsx
export function ContadorDeCliques() {
    const clicksRef = useRef(0)

    function handleClick() {
        clicksRef.current += 1
        console.log("cliques:", clicksRef.current)   // o valor muda, a tela NÃO
    }

    return <button onClick={handleClick}>Clique (veja o console)</button>
}
```

O número cresce no console e a tela não se mexe, porque nenhuma renderização foi pedida. O valor só aparece na tela se alguma **outra** coisa (um estado) provocar uma renderização.

3.3 - Variável, Estado ou Referência?

| | Variável local | `useState` | `useRef` |
|---|----------------|------------|----------|
| **Onde vive** | frame da call stack | guardado pelo React | objeto `{ current }` no heap |
| **Sobrevive às renderizações** | não | sim (foto nova a cada execução) | sim (mesmo objeto) |
| **Mudar provoca renderização** | não | **sim** | **não** |
| **Como mudar** | atribuição | `setEstado(...)` | `ref.current = ...` |
| **Serve para** | cálculos temporários | o que **aparece na tela** | o que **não** aparece na tela |

A regra de bolso: *"se o usuário precisa **ver** a mudança, é estado; se só o **código** precisa lembrar, é referência"*. E uma regra de segurança do React: **não leia nem escreva `ref.current` durante a renderização** (no corpo do componente). Leia e altere em **handlers** e em **efeitos**, que é onde as coisas acontecem. Se a tela depende do valor, ele deveria ser estado.

3.4 - Referência para Elementos do HTML

O uso mais comum é acessar o **elemento do DOM** que o JSX criou. Passamos a referência na prop `ref` do elemento, e o React coloca o elemento em `current` depois de montar a tela (e volta para `null` quando o elemento sai):

```tsx
import { useRef, useState } from "react"
import { taskCreateApi } from "../api/taskCreateApi"
import type { Task } from "../types/api"

type TaskFormProps = {
    idUser: number
    onCreated: (task: Task) => void
}

export function TaskForm({ idUser, onCreated }: TaskFormProps) {
    const [name, setName] = useState("")
    const nameInputRef = useRef<HTMLInputElement>(null)

    async function handleCreate() {
        if (name.trim() === "") {
            nameInputRef.current?.focus()      // evento nativo do HTML: foca o campo
            return
        }

        const created = await taskCreateApi(idUser, { name })
        onCreated(created)
        setName("")
        nameInputRef.current?.focus()          // pronto para a próxima task
    }

    return (
        <div className="input-group mb-3">
            <input
                ref={nameInputRef}
                className="form-control"
                value={name}
                onChange={event => setName(event.target.value)}
            />
            <button className="btn btn-primary" onClick={handleCreate}>Adicionar</button>
        </div>
    )
}
```

Detalhes de tipagem que valem a atenção:

- `useRef<HTMLInputElement>(null)`: o generic diz **qual elemento** vai morar ali; o tipo resultante é `RefObject<HTMLInputElement | null>`;
- como `current` é `null` antes de montar e depois de desmontar, usamos `?.` (`nameInputRef.current?.focus()`);
- o nome do tipo vem do elemento: `HTMLInputElement`, `HTMLButtonElement`, `HTMLDivElement`, `HTMLFormElement`, `HTMLVideoElement`.

Com a referência em mãos, dá para **acionar os eventos e métodos nativos** do elemento, sem `document.getElementById`:

| Elemento | Chamada | Para quê |
|----------|---------|----------|
| `input` | `ref.current?.focus()` / `.select()` | dar foco, selecionar o texto |
| `input type="file"` escondido | `ref.current?.click()` | abrir o seletor de arquivo a partir de um botão bonito |
| `form` | `ref.current?.requestSubmit()` | enviar o formulário por código |
| qualquer `div` | `ref.current?.scrollIntoView()` | rolar até o elemento |
| `video` | `ref.current?.play()` | controlar a mídia |

3.5 - Referência para Componentes

E quando o elemento está **dentro de um componente filho**? No React 19, `ref` é um **parâmetro comum** do componente (nas versões antigas era preciso `forwardRef`). O filho decide a quem entregar a referência, e o pai passa a controlar aquele elemento:

```tsx
import type { ChangeEvent, Ref } from "react"

type TextFieldProps = {
    label: string
    value: string
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
    ref?: Ref<HTMLInputElement>
}

function TextField({ label, value, onChange, ref }: TextFieldProps) {
    return (
        <label className="form-label w-100">
            {label}
            <input ref={ref} className="form-control" value={value} onChange={onChange} />
        </label>
    )
}
```

No pai, é o mesmo uso da seção anterior, só que a ponte passa pelo componente:

```tsx
const nameInputRef = useRef<HTMLInputElement>(null)

<TextField ref={nameInputRef} label="Nome" value={name} onChange={handleName} />
```

Em vez de entregar o elemento inteiro, o filho pode expor **só os métodos que quer** (uma "API" do componente) com `useImperativeHandle`. O pai aciona o **componente**, sem saber que existe um `input` lá dentro:

```tsx
import { useImperativeHandle, useRef, useState } from "react"
import type { Ref } from "react"

type SearchBoxHandle = {
    focus: () => void
    clear: () => void
}

type SearchBoxProps = {
    onSearch: (text: string) => void
    ref?: Ref<SearchBoxHandle>
}

function SearchBox({ onSearch, ref }: SearchBoxProps) {
    const [text, setText] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
        focus() {
            inputRef.current?.focus()
        },
        clear() {
            setText("")
        },
    }))

    function handleSearch() {
        onSearch(text)
    }

    return (
        <div className="input-group">
            <input ref={inputRef} className="form-control" value={text} onChange={event => setText(event.target.value)} />
            <button className="btn btn-primary" onClick={handleSearch}>Buscar</button>
        </div>
    )
}
```

No pai: `const searchRef = useRef<SearchBoxHandle>(null)` e, num handler, `searchRef.current?.clear()`. O generic agora é o **tipo do contrato** (`SearchBoxHandle`), não um elemento do HTML.

3.6 - Referência para Guardar Dados Que Vão ao Backend

A referência não serve só para o DOM. É a "gaveta" do componente para dados que **acompanham o trabalho com o backend** mas que o usuário não vê. Três usos clássicos, todos em handlers:

**a) Campo não controlado: ler o valor só na hora de enviar.** O `input` controlado (`value` + `onChange`) renderiza o componente a cada tecla. Quando o valor só interessa no envio, a referência lê direto do elemento, sem nenhuma renderização durante a digitação:

```tsx
import { useRef } from "react"
import type { FormEvent } from "react"
import { taskCreateApi } from "../api/taskCreateApi"

type QuickTaskProps = {
    idUser: number
}

export function QuickTask({ idUser }: QuickTaskProps) {
    const nameRef = useRef<HTMLInputElement>(null)

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()

        const name = nameRef.current?.value.trim() ?? ""
        if (name === "") return

        await taskCreateApi(idUser, { name })      // o valor vai direto ao backend
        nameRef.current!.value = ""
    }

    return (
        <form onSubmit={handleSubmit} className="input-group">
            <input ref={nameRef} className="form-control" defaultValue="" />
            <button className="btn btn-primary">Adicionar</button>
        </form>
    )
}
```

Sem `value`, o campo é **não controlado** (o DOM é dono do valor; usamos `defaultValue`). Quando a interface precisa reagir ao texto (contador de caracteres, botão desabilitado, validação ao vivo), o certo é o campo controlado com estado.

**b) Lembrar o que já foi enviado, para não repetir a chamada.** O último termo buscado é um dado de bastidor: a tela não o mostra, mas ele evita uma requisição desnecessária:

```tsx
const lastSearchRef = useRef("")

async function handleSearch(event: FormEvent) {
    event.preventDefault()

    const term = text.trim()
    if (term === "") return
    if (term === lastSearchRef.current) return   // mesma busca: não chama o backend de novo

    lastSearchRef.current = term

    const result = await userSearchApi({ name: term }, 1, 10)
    setUsers(result.data)
}
```

**c) Guardar o id de um timer: *debounce* na busca.** O `setTimeout` devolve um número. Precisamos dele **na próxima renderização** para cancelar o timer anterior, mas guardá-lo em estado renderizaria à toa:

```tsx
const timerRef = useRef<number | undefined>(undefined)

function handleType(event: ChangeEvent<HTMLInputElement>) {
    const term = event.target.value
    setText(term)

    window.clearTimeout(timerRef.current)          // cancela o timer da tecla anterior
    timerRef.current = window.setTimeout(() => {
        search(term)                               // só busca 400 ms depois da última tecla
    }, 400)
}
```

Resumo de **para que usar** uma referência:

- acessar **elementos do HTML** e **acionar eventos nativos** (`focus`, `click`, `scrollIntoView`, `requestSubmit`);
- acessar **componentes** (`ref` como parâmetro, `useImperativeHandle`);
- guardar **dados que vão ao backend** ou que acompanham a requisição (campo não controlado, último termo enviado, id de timer, id da última requisição);
- guardar qualquer valor **mutável de bastidor** (contadores, valor anterior) sem provocar renderização.

4 - Efeitos: `useEffect`

4.1 - De Novo Turing: a Transição Entre Estados

Na Aula 08 apresentamos a máquina de Alan Turing: um **estado atual**, uma **entrada** e uma **função de transição** que decide o próximo estado e **uma ação**. O React espelha isso:

| Máquina de Turing | React |
|-------------------|-------|
| estado atual | `useState` e parâmetros |
| função de transição | o componente (estado + parâmetros → tela) |
| entrada | evento do usuário, resposta da API |
| **ação executada na transição** | **`useEffect`** |

O componente, sozinho, é uma função "pura": recebe estado e parâmetros e devolve tela. Só que a vida real exige **ações** quando o estado transiciona: buscar dados no backend, assinar um evento, mexer no título da aba, focar um campo. Essas ações não cabem no cálculo do JSX. O `useEffect` é o lugar delas: **o gerenciamento das transições de estado**. A frase para guardar:

> *Depois que o estado é atualizado (e a tela já foi desenhada), executa-se o efeito dessa mudança.*

4.2 - Anatomia e Ordem de Execução

```tsx
import { useEffect } from "react"

useEffect(() => {
    // 1. o efeito: roda DEPOIS da renderização

    return () => {
        // 2. a limpeza (opcional): roda antes do próximo efeito e ao desmontar
    }
}, [dependencias])   // 3. quando o efeito deve rodar de novo
```

A ordem completa de uma mudança de estado, que é a espinha da aula:

1. o evento chama `setEstado`, e o React agenda uma renderização;
2. a **função do componente roda** inteira e devolve o JSX;
3. o React atualiza o DOM e o navegador **pinta a tela**;
4. só então o React executa os **efeitos** cujas dependências mudaram (rodando antes a **limpeza** do efeito anterior);
5. se o efeito chamar `setEstado`, volta ao passo 1.

Por isso o efeito é o lugar certo para a chamada ao backend: o usuário já vê a tela (com "Carregando..."), e a resposta, quando chegar, vira estado e renderiza de novo.

4.3 - O Array de Dependências

O segundo parâmetro diz **quando** o efeito roda de novo:

| Dependências | Quando o efeito roda |
|--------------|----------------------|
| `[]` | **uma vez**, depois da primeira renderização (montagem) |
| `[user.id]` | na montagem **e** sempre que `user.id` mudar |
| omitido | depois de **toda** renderização (raramente é o que se quer) |

O React compara cada dependência com a anterior usando `Object.is`, a mesma comparação do `useState`. E aqui o **heap** volta a cobrar: primitivos são comparados por valor, **objetos, arrays e funções por endereço**. Como o componente roda inteiro a cada renderização, um objeto criado no corpo dele é um **endereço novo** toda vez:

```tsx
export function UserTasksErrado({ user }: UserTasksProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const params = { page: 1, limit: 20 }        // objeto NOVO a cada renderização

    useEffect(() => {
        async function load() {
            const result = await tasksListApi(user.id, params)
            setTasks(result.data)                // muda o estado → renderiza → params novo
        }                                        // → o efeito roda de novo → setTasks → ...
        load()
    }, [params])                                 // LOOP INFINITO de requisições
```

A saída é depender de **primitivos** (`[user.id, page, limit]`), nunca de objetos criados dentro do componente.

4.4 - O Efeito Também Vê a "Foto"

Assim como o handler de clique, o efeito é uma função criada **dentro** da renderização e enxerga os valores **daquela** renderização (estado e parâmetros daquela "foto"). O React guarda a função e só a executa quando as dependências mudam. Por isso a lista de dependências precisa citar **tudo** o que o efeito lê do componente: se `user.id` é usado dentro, `user.id` entra no array. Esquecer uma dependência significa rodar o efeito com uma foto velha.

4.5 - Limpeza e Cancelamento

A função devolvida pelo efeito é a **limpeza**. Ela roda em dois momentos: antes de o efeito rodar **de novo** (dependência mudou) e quando o componente **sai da tela**. É onde se desfaz o que o efeito fez:

```tsx
useEffect(() => {
    function handleKey(event: KeyboardEvent) {
        if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKey)       // efeito: assina

    return () => window.removeEventListener("keydown", handleKey)   // limpeza: cancela a assinatura
}, [onClose])
```

Na chamada ao backend a limpeza resolve um problema real, a **condição de corrida** (*race condition*): o usuário clica no usuário A e, antes da resposta, clica no B. Se a resposta de A chegar **depois** da de B, a tela mostraria as tasks de A sob o nome de B. A limpeza cancela a requisição velha com um `AbortController`, o mecanismo nativo de cancelamento que o Axios entende (`signal`):

```tsx
useEffect(() => {
    const controller = new AbortController()

    // ... GET com { signal: controller.signal } ...

    return () => controller.abort()    // mudou a dependência: cancela a requisição anterior
}, [user.id])
```

A seção seguinte abre esse mecanismo por dentro, porque ele aparece em todo efeito que chama o backend.

4.6 - AbortController: Cancelando uma Requisição

Antes de ver o código completo do efeito com API, vale entender o que é o `AbortController`, porque ele aparece em todo efeito que chama o backend e é fácil usá-lo sem saber o que faz.

**O que é.** O `AbortController` é uma API **nativa** do navegador (e do Node): não é do React nem do Axios. Ele serve para **avisar uma operação assíncrona de que ela deve parar**. Funciona com um par de objetos:

- o **`controller`**, que é o "botão de cancelar", com o método `abort()`;
- o **`controller.signal`**, que é o "fio" ligado a esse botão: quem recebe o `signal` fica sabendo quando o `abort()` é chamado.

O `signal` é entregue à requisição. O Axios e o `fetch` aceitam o mesmo parâmetro:

```ts
const controller = new AbortController()

// Axios
clientApi.get("/users/7/tasks", { signal: controller.signal })

// fetch (nativo do navegador)
fetch("/users/7/tasks", { signal: controller.signal })

// ... em algum momento:
controller.abort()     // a requisição pendente é cancelada
```

**O que acontece no `abort()`.** A promise da requisição é **rejeitada** na hora. Isso significa que o código que estava esperando no `await` cai no `catch`. O erro é de um tipo especial: `CanceledError` no Axios (que se reconhece com `isCancel(err)`) e `AbortError` no `fetch` (`err.name === "AbortError"`). Cancelar não é um defeito, e por isso o `catch` precisa **separar** o cancelamento do erro de verdade, senão a tela mostraria "Erro ao carregar" para uma requisição que nós mesmos cancelamos:

```ts
try {
    const response = await clientApi.get<T>(target, { signal: controller.signal })
    setData(response.data)
} catch (err) {
    if (isCancel(err)) return      // cancelamos de propósito: não é erro, não mexe em estado
    setError(getErrorMessage(err, "Erro ao carregar os dados"))
}
```

**Por que ele resolve a condição de corrida.** Veja a linha do tempo de um clique em A seguido de um clique em B, com e sem cancelamento:

```text
SEM AbortController                      COM AbortController (limpeza do efeito)

t0  clica em A  → GET /users/1/tasks     t0  clica em A  → GET /users/1/tasks
t1  clica em B  → GET /users/2/tasks     t1  clica em B  → limpeza: abort() em A
t2  resposta de B chega → tela mostra B                     → GET /users/2/tasks
t3  resposta de A chega → tela mostra A  t2  A rejeita com CanceledError (ignorada)
    (ERRADO: A sobrescreveu B)           t3  resposta de B chega → tela mostra B  ✔
```

**O que o `abort()` NÃO faz.** Cancelar é uma decisão do **navegador**: ele deixa de esperar a resposta e fecha a conexão. O servidor pode já ter recebido o pedido e até **processado** tudo. Por isso o cancelamento é seguro para **leitura** (GET): no máximo o servidor trabalhou à toa. Para escrita (POST, PUT, DELETE) ele **não desfaz** nada: a task pode ter sido criada no banco mesmo com a requisição cancelada, então não se usa o abort para "desistir" de gravar.

Três regras de uso:

- **Um controller por requisição**, criado **dentro do efeito**. Depois do `abort()` o `signal` fica cancelado para sempre (`signal.aborted` continua `true`): reaproveitar o mesmo controller faria a requisição seguinte nascer cancelada. Como o efeito roda de novo a cada mudança de dependência, ele cria um controller novo a cada execução;
- **abort numa requisição que já terminou não faz nada**: é inofensivo, mas é por isso que o nosso hook confere se ela ainda está pendente (seção 5.2) antes de avisar que cancelou;
- o abort mora na **limpeza** do efeito (`return () => controller.abort()`), porque é a limpeza que roda exatamente quando a dependência muda ou o componente sai da tela, que são os dois momentos em que a resposta antiga deixa de interessar.

4.7 - Efeito com API Assíncrona

Existe uma pegadinha: a função passada ao `useEffect` **não pode ser `async`**. Uma função `async` devolve uma `Promise`, e o React espera que o retorno seja a **função de limpeza** (ou nada). A solução é declarar uma função `async` **dentro** do efeito e chamá-la:

```tsx
useEffect(async () => {          // ERRADO: o efeito devolveria uma Promise
    ...
}, [])

useEffect(() => {                // CERTO: função async declarada dentro e chamada
    async function load() {
        ...
    }

    load()
}, [])
```

Agora o exemplo completo, no projeto. Antes, o `UsersApp` buscava as tasks num handler de clique e mantinha `tasks` e `error` como estados do pai. Vamos **mover a responsabilidade** para o componente que mostra as tasks: `UserTasks` recebe o `user` por parâmetro e, quando o `user.id` muda, o **efeito** busca no backend:

```tsx
import { useEffect, useState } from "react"
import { isCancel } from "axios"
import clientApi from "../api/_clientApi"
import { getErrorMessage } from "../utils/getErrorMessage"
import type { PaginatedResponse, Task, User } from "../types/api"

type UserTasksProps = {
    user: User
}

export function UserTasks({ user }: UserTasksProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()

        async function load() {
            setIsLoading(true)
            setError("")

            try {
                const response = await clientApi.get<PaginatedResponse<Task>>(
                    `/users/${user.id}/tasks?page=1&limit=20`,
                    { signal: controller.signal }
                )
                setTasks(response.data.data)
            } catch (err) {
                if (isCancel(err)) return          // cancelada pela limpeza: ignora em silêncio
                setError(getErrorMessage(err, "Erro ao carregar as tasks"))
            }

            setIsLoading(false)
        }

        load()

        return () => controller.abort()
    }, [user.id])

    if (isLoading) return <p className="text-muted">Carregando as tasks de {user.name}...</p>
    if (error !== "") return <div className="alert alert-danger">{error}</div>

    return (
        <>
            <h2 className="h5">Tasks de {user.name}</h2>

            {tasks.length === 0 && <p className="text-muted">Nenhuma task.</p>}

            <ul className="list-group">
                {tasks.map(task => (
                    <li key={task.id} className="list-group-item">{task.name}</li>
                ))}
            </ul>
        </>
    )
}
```

Lendo o código com o que aprendemos:

- **Três estados** descrevem a "máquina" da requisição: `isLoading` (esperando), `error` (falhou) e `tasks` (deu certo). O JSX só escolhe o que desenhar a partir deles;
- `isLoading` **começa `true`**: na primeira renderização a tela já mostra "Carregando...", e o efeito dispara a chamada logo depois;
- `[user.id]` é uma dependência **primitiva** (um número): trocou o usuário, o efeito roda de novo, com a limpeza do anterior cancelando a requisição velha;
- `setTasks` e `setIsLoading(false)` são chamados depois do `await`, e o React agrupa as duas mudanças numa **única** renderização;
- o `isCancel(err)` separa "a requisição foi cancelada de propósito" de "deu erro de verdade".

4.8 - Quando NÃO Usar um Efeito

O efeito é uma ferramenta para **sincronizar com algo de fora** (rede, DOM, eventos do navegador, timers). Não use para:

- **Valores derivados**: `pending = tasks.filter(...).length` é só uma conta dentro do componente, e se virar `useEffect` + `setPending` você cria uma renderização extra e uma segunda verdade;
- **Reagir a um clique ou a um envio**: quem fez foi o usuário, então o lugar é o **handler** (`handleCreate`, `handleSubmit`). Foi assim que o CRUD de tasks da Aula 08 funcionou, e continua certo.

A pergunta que decide: *"isto acontece por causa de uma **ação do usuário** (handler) ou por causa de **o que está na tela agora** (efeito)?"*. No `UserTasks`, a busca depende de **qual usuário está na tela**, e é por isso que ela virou efeito.

4.9 - O Efeito Roda Duas Vezes em Desenvolvimento

Se o entry do projeto montar o React dentro de `<StrictMode>`, em desenvolvimento o React executa cada efeito, a limpeza e o efeito de novo, **de propósito**, só para revelar efeitos sem limpeza correta. Em produção isso não acontece. É mais um motivo para sempre devolver a limpeza quando o efeito cria algo (requisição, assinatura, timer).

5 - Custom Hooks

5.1 - O Problema da Repetição

O `UserTasks` da seção anterior tem uma estrutura que se repete em **toda** tela que consulta o backend: `data`, `error`, `isLoading`, um `useEffect`, um `AbortController`, um `try/catch`. Copiar isso para cada componente é receita para divergência (um componente trata o erro, outro esquece).

Um **custom hook** é a saída: uma função comum, cujo nome começa com `use`, que **chama outros hooks** (`useState`, `useEffect`, `useRef`) e devolve valores. A lógica e os estados saem do componente e ficam num lugar só, reaproveitável.

Regras dos hooks (valem para os do React e para os seus):

- o nome começa com **`use`** (é como o React e o editor reconhecem um hook);
- só são chamados **no topo** do componente ou de outro hook (nunca dentro de `if`, laço ou função interna): o React identifica cada estado pela **ordem** das chamadas, e essa ordem precisa ser igual em toda renderização;
- só em **componentes** e em **outros hooks**.

5.2 - O `useAxios`

Vamos criar `resources/js/hooks/useAxios.ts`. Ele recebe uma `url` (e, opcionalmente, um `onEvent` para contar o que está fazendo) e devolve **três estados** (`data`, `error`, `isLoading`) mais uma função `refetch`:

```ts
import { useEffect, useRef, useState } from "react"
import { isCancel } from "axios"
import clientApi from "../api/_clientApi"
import { getErrorMessage } from "../utils/getErrorMessage"

// O que o hook conta para quem quiser acompanhar: começou, foi cancelado, chegou, falhou
export type AxiosEvent = "start" | "abort" | "done" | "error"

type UseAxiosResult<T> = {
    data: T | null
    error: string
    isLoading: boolean
    refetch: () => void
}

export function useAxios<T>(
    url: string | null,
    onEvent?: (event: AxiosEvent, url: string) => void
): UseAxiosResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(url !== null)
    const [attempt, setAttempt] = useState(0)
    const onEventRef = useRef(onEvent)

    // Sem dependências: depois de toda renderização a ref passa a apontar para a função mais recente
    useEffect(() => {
        onEventRef.current = onEvent
    })

    useEffect(() => {
        if (url === null) {
            setData(null)
            setIsLoading(false)
            return
        }

        const target = url
        const controller = new AbortController()
        const request = { isPending: true }

        async function load() {
            setIsLoading(true)
            setError("")
            onEventRef.current?.("start", target)

            try {
                const response = await clientApi.get<T>(target, { signal: controller.signal })
                request.isPending = false
                setData(response.data)
                onEventRef.current?.("done", target)
            } catch (err) {
                if (isCancel(err)) return
                request.isPending = false
                setError(getErrorMessage(err, "Erro ao carregar os dados"))
                onEventRef.current?.("error", target)
            }

            setIsLoading(false)
        }

        load()

        // Limpeza: só cancela se a requisição ainda está no ar (abort numa que já terminou não faz nada)
        return () => {
            if (!request.isPending) return

            controller.abort()
            onEventRef.current?.("abort", target)
        }
    }, [url, attempt])

    // Só muda um estado: quem faz o trabalho é o efeito (a transição de estados)
    function refetch() {
        setAttempt(current => current + 1)
    }

    return { data, error, isLoading, refetch }
}
```

Cada peça tem uma razão de ser:

- **`<T>`** é um generic: o hook não sabe o que a API devolve, quem **usa** diz o tipo (`useAxios<PaginatedResponse<Task>>`), e o `data` já sai tipado `T | null`;
- **`url: string | null`**: com `null` o hook fica parado, o que permite "só buscar quando já souber o que buscar" (a tela da seção 5.6 usa isso: sem usuário escolhido, o hook das tasks fica parado);
- **`[url, attempt]`** são as dependências, ambas **primitivas**: trocou a `url`, busca de novo; chamou `refetch`, o `attempt` muda e o efeito roda de novo. Repare que o `refetch` **só altera um estado**, e é o efeito (a transição de estados) que faz o trabalho, exatamente a ideia da seção 4.1;
- a limpeza cancela a requisição anterior com o `AbortController` da seção 4.6, então o hook já nasce **protegido contra a condição de corrida**;
- o hook devolve um **objeto**, e quem usa desestrutura só o que precisa (a mesma desestruturação da seção 2.3).

**Por que o `onEvent` vai numa referência.** O `onEvent` é uma função, e função é objeto no heap: o componente que chama o hook cria uma função **nova** a cada renderização (endereço novo, como na seção 2.1). Se ela entrasse na lista de dependências (`[url, attempt, onEvent]`), o React veria uma dependência diferente a cada renderização e rodaria o efeito **sempre**, cancelando e refazendo o GET sem parar, o mesmo loop da seção 4.3. Se ficasse fora da lista, o efeito leria uma função velha, a "foto" da seção 4.4. A saída é a referência da seção 3: o `onEventRef` é o **mesmo objeto** em toda renderização, o primeiro `useEffect` (sem dependências, roda depois de toda renderização) o aponta para a função mais recente, e o efeito do GET só lê `onEventRef.current` na hora de usar. Mudar `ref.current` não renderiza nem dispara efeito: é exatamente o "dado de bastidor" da seção 3.6.

**Por que o `request.isPending`.** A limpeza roda sempre que o efeito vai rodar de novo ou o componente desmonta, inclusive quando a requisição **já terminou** (por exemplo, num `refetch` depois de a resposta ter chegado). Chamar `controller.abort()` numa requisição concluída não faz nada, mas o evento `"abort"` apareceria no registro mesmo assim, contando um cancelamento que não aconteceu. Por isso o objeto `request = { isPending: true }`, criado junto com o controller, vira `false` quando a resposta (ou o erro) chega, e a limpeza só aborta, e só avisa `"abort"`, se ainda for `true`. Repare que `request` é um **objeto**: alterar `request.isPending` não reatribui a `const`, e o efeito e a limpeza enxergam o mesmo objeto, o que dispensa um `let`.

Um cuidado de projeto: o hook depende só de `url` (uma string) justamente por causa da seção 4.3. Se ele recebesse um objeto de configuração criado no corpo do componente, o efeito rodaria a cada renderização. Parâmetros de consulta entram na própria string: `/users/7/tasks?page=2&limit=20`.

5.3 - Enxertando o Hook no Componente

Agora o `UserTasks` perde todo o código de requisição e **herda** o estado do hook:

```tsx
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, Task, User } from "../types/api"

type UserTasksProps = {
    user: User
}

export function UserTasks({ user }: UserTasksProps) {
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
        `/users/${user.id}/tasks?page=1&limit=20`
    )

    function handleRetry() {
        refetch()
    }

    if (isLoading) return <p className="text-muted">Carregando as tasks de {user.name}...</p>

    if (error !== "") {
        return (
            <div className="alert alert-danger d-flex justify-content-between align-items-center">
                <span>{error}</span>
                <button className="btn btn-sm btn-outline-danger" onClick={handleRetry}>Tentar de novo</button>
            </div>
        )
    }

    if (data === null) return null

    const tasks = data.data

    return (
        <>
            <h2 className="h5">Tasks de {user.name}</h2>

            {tasks.length === 0 && <p className="text-muted">Nenhuma task.</p>}

            <ul className="list-group">
                {tasks.map(task => (
                    <li key={task.id} className="list-group-item d-flex justify-content-between">
                        <span>{task.name}</span>
                        <span className={task.is_done ? "badge text-bg-success" : "badge text-bg-secondary"}>
                            {task.is_done ? "feita" : "pendente"}
                        </span>
                    </li>
                ))}
            </ul>
        </>
    )
}
```

O ponto principal desta seção: **os estados do hook são estados do componente que o chama**. Quando o `useAxios` chama `setData`, `setError` ou `setIsLoading`, quem renderiza de novo é o `UserTasks`, a função inteira, com os valores novos de `data`, `error` e `isLoading`. O componente não escreve uma linha de `useState` e mesmo assim reage a cada mudança. Dois detalhes:

- **cada chamada ao hook tem o seu próprio estado**: dois componentes que usam `useAxios` não compartilham nada (o hook reaproveita **lógica**, não dados);
- os hooks vêm **antes** dos `if` com `return`: a regra da ordem das chamadas vale também aqui, e é por isso que o `useAxios` é chamado no topo, antes de qualquer retorno antecipado.

5.4 - Usando no Pai: `key` Reinicia o Estado

No `UsersApp` o pai agora só guarda **qual usuário está escolhido**. A busca, o carregando e o erro deixaram de ser dele:

```tsx
const [selected, setSelected] = useState<User | null>(null)

function handleSelect(user: User) {
    setSelected(user)
}

// ...no JSX, ao lado direito da tela:
<section className="col-lg-6">
    {selected === null && <p className="text-muted">Escolha um usuário para ver as tasks dele.</p>}
    {selected !== null && <UserTasks key={selected.id} user={selected} />}
</section>
```

O `key={selected.id}` aplica a regra da seção 2.4: ao escolher outro usuário a `key` muda, o React **desmonta** o `UserTasks` antigo e cria um novo, com os três estados do hook do zero (`isLoading` verdadeiro, `data` nulo). Sem a `key`, o mesmo componente seguiria vivo e mostraria, por um instante, as tasks do usuário anterior até o efeito rodar.

5.5 - Seguindo uma Renderização, Passo a Passo

O usuário clica em "Ana" (id 7) na lista:

1. O clique chama `handleSelect(ana)`, que chama `setSelected(ana)`;
2. `UsersApp` roda inteira: `selected` agora é `ana` e o JSX inclui `<UserTasks key={7} user={ana} />`;
3. `UserTasks` **monta**: roda a função, o `useAxios` cria seus três estados (`data = null`, `error = ""`, `isLoading = true`) e a tela mostra **"Carregando as tasks de Ana..."**;
4. O React atualiza o DOM, o navegador pinta, e só então o **efeito** do hook roda: monta a `url` `/users/7/tasks?page=1&limit=20` e dispara o GET pelo `clientApi`;
5. A resposta chega (um objeto novo no heap, `PaginatedResponse<Task>`); o hook chama `setData(...)` e `setIsLoading(false)`, e o React agrupa as duas mudanças numa **única** renderização;
6. `UserTasks` roda de novo: `isLoading` é falso, `data` não é nulo, e a lista de tasks aparece. **O `UsersApp` não rodou nesta etapa**, porque o estado que mudou era do filho;
7. O usuário clica em "Bruno" antes de uma nova resposta: a `key` muda, o `UserTasks` de Ana **desmonta**, a **limpeza** do efeito cancela a requisição pendente com `controller.abort()`, e o ciclo recomeça para Bruno a partir do passo 3.

Se a API falhar, o `catch` chama `setError(...)`, o componente renderiza com `error` preenchido, e o botão "Tentar de novo" chama `refetch()`: o `attempt` muda, o efeito roda de novo e o ciclo volta para o passo 4.

5.6 - A Tela do Nosso Hook

Para ver o hook trabalhando, e não só ler o código, o projeto ganha uma tela: a View **`GET /hooks`**. Ela é protegida pelo mesmo middleware das telas de tasks e de usuários (sem sessão, redireciona para `/login`), porque o hook chama a API usando o cookie de sessão. A View `hooks.ejs` entrega só o título e o `#root`, e o entry `pages/hooks.tsx` monta o componente **`HookLab`**.

O `HookLab` chama o `useAxios` **duas vezes**, e cada chamada tem os seus próprios estados:

```tsx
// Hook 1: a lista de usuários
const users = useAxios<PaginatedResponse<User>>("/users?page=1&limit=5")

// Hook 2: as tasks do usuário escolhido (url null = parado)
const tasksUrl = buildTasksUrl(selectedId, isBroken)
const tasks = useAxios<PaginatedResponse<Task>>(tasksUrl, handleEvent)
```

A `tasksUrl` é um valor **derivado** de dois estados do `HookLab` (`selectedId` e `isBroken`): sem usuário escolhido ela é `null` e o hook das tasks fica parado; com um usuário, ela vira `/users/{id}/tasks?page=1&limit=20`; com o botão de erro, vira uma rota que não existe. O `handleEvent`, passado como `onEvent`, escreve uma linha no registro a cada etapa do hook usando a forma de função: `setEvents(current => [...current, linha])`.

A tela tem **três painéis**:

1. **Hook da lista de usuários:** o `HookStatePanel` com os três estados do hook e, abaixo, um botão por usuário;
2. **Hook das tasks:** mostra a `url` atual, o `HookStatePanel` e três botões (`refetch()`, *Trocar 3x rápido (AbortController)* e *Forçar erro*);
3. **O que o hook contou:** o `EventLog`, um registro em fundo escuro com uma linha por evento (`começou`, `chegou`, `CANCELADO`, `falhou`), mais o botão *Limpar*.

O `HookStatePanel` desenha os estados com emblemas coloridos: `isLoading` fica **amarelo** quando verdadeiro, `error` fica **vermelho** quando tem mensagem, e `data` fica **verde** quando já chegou (o texto do `data` usa o rótulo `task(s)` nos dois painéis; no painel 1 ele conta usuários). Cada vez que um desses estados muda, o `HookLab` renderiza de novo, que é a ideia da seção 5.3.

Roteiro para mostrar em aula:

| O que fazer | O que aparece | Por quê |
|-------------|---------------|---------|
| Abrir `/hooks` | no painel 1, `isLoading` amarelo e depois `data` verde com 5 itens | o hook da lista roda o GET assim que o componente monta (efeito) |
| Clicar num usuário | o painel 2 mostra a `url`; o log ganha `começou` e depois `chegou`; `isLoading` amarelo e depois `data` verde | `setSelectedId` muda a `url`, e a mudança de dependência dispara o efeito |
| `refetch()` | o log ganha `começou` e `chegou` de novo, **na mesma url** | o `attempt` mudou, a `url` não: o efeito roda de novo só por causa dele |
| *Trocar 3x rápido* | o log mostra `começou`, `CANCELADO`, `começou`, `CANCELADO`, `começou`, `chegou` | a `url` muda a cada 5 ms, e a limpeza do efeito aborta a requisição anterior que ainda estava no ar |
| *Forçar erro* | `error` fica vermelho com a mensagem e o log mostra `falhou` | o servidor responde com erro, o `catch` chama `setError`, e `isLoading` volta a `false` |
| *Limpar* | o log esvazia, e **nenhuma** requisição nova aparece | só mudou o estado do log; a `url` e o `attempt` são os mesmos, então o efeito não roda |

Dois pontos para chamar atenção na tela:

- **A ordem do cancelamento.** Quando a `url` muda, primeiro roda a **limpeza** do efeito antigo (`CANCELADO` da requisição velha) e só depois o efeito novo (`começou` da nova), exatamente a ordem da seção 4.2. Se a resposta da primeira já tiver chegado antes da troca, ela aparece como `chegou` e não como `CANCELADO`: o hook só avisa o cancelamento quando a requisição ainda estava pendente;
- **O registro não dispara o efeito.** Toda linha nova no log é um `setEvents`, que renderiza o `HookLab` e cria um `handleEvent` novo (endereço novo). Mesmo assim o efeito do GET **não** roda de novo, porque o `onEvent` mora numa referência e não entra nas dependências. Se estivesse na lista, cada linha do log provocaria uma nova requisição, que escreveria outra linha, e assim sem parar.

6 - Juntando Tudo

6.1 - Qual Ferramenta Para Qual Problema

| Preciso de... | Ferramenta |
|---------------|------------|
| um valor que **aparece na tela** e muda com o tempo | `useState` |
| um valor **calculado** a partir de estado ou parâmetros | conta solta no componente (derivado) |
| **acessar um elemento**, acionar `focus()` / `click()`, ou guardar um dado de bastidor sem redesenhar | `useRef` |
| algo que acontece **depois** da tela, **por causa** de uma mudança de estado (API, assinatura, timer) | `useEffect` |
| **reaproveitar** estados e efeitos entre componentes | custom hook (`useAxios`) |
| reagir a **uma ação do usuário** | handler (`onClick`, `onSubmit`) |

6.2 - O Ciclo Completo

```text
   evento (clique, digitação)
        │  handler chama setEstado
        ▼
   ┌──────────────────────────┐
   │ função do componente roda │  ← tudo dentro dela roda de novo
   │ (estado + parâmetros)     │     (useRef devolve o MESMO objeto do heap)
   └──────────┬───────────────┘
              ▼
        React atualiza o DOM  →  navegador pinta a tela
              ▼
   ┌──────────────────────────┐
   │ efeitos cujas dependências│  ← a "ação" da transição: chamada ao backend
   │ mudaram (limpeza antes)   │
   └──────────┬───────────────┘
              │ a resposta chama setEstado
              ▼
        (volta ao topo: nova renderização)
```

6.3 - Resumo da Aula

- Tudo dentro do componente roda de novo a cada mudança de estado ou de parâmetro; derivados ficam soltos e se atualizam sozinhos;
- parâmetros chegam desestruturados, são `const` somente leitura e valem para aquela execução; o estado desce por parâmetros e sobe por callbacks;
- a tipagem (`type Props`, `useState<T>`, `useRef<T>`, `PaginatedResponse<T>`, `useAxios<T>`) mantém a conversa entre pai e filho coerente e o TypeScript estreita tipos depois de *early returns*;
- `useRef` é um objeto `{ current }` no heap, o mesmo em toda renderização; mudar não renderiza; serve para elementos, componentes e dados de bastidor que vão ao backend;
- `useEffect` roda **depois** da renderização, quando as dependências mudam; é a ação associada à transição de estados; devolve a limpeza; não aceita função `async` diretamente;
- o **`AbortController`** é uma API nativa: `controller.signal` vai na requisição e `controller.abort()` na limpeza do efeito faz a requisição rejeitar (`isCancel` no Axios), evitando que uma resposta atrasada sobrescreva a atual; um controller por requisição, criado dentro do efeito; o servidor pode já ter processado o pedido, então o abort é para leitura;
- um **custom hook** reaproveita estado e efeito, e os estados dele pertencem ao componente que o chama; um callback que o hook só precisa **ler** (como o `onEvent`) vai numa `useRef`, para não entrar nas dependências do efeito;
- a tela `GET /hooks` mostra tudo isso ao vivo: os três estados do hook, o `refetch`, o cancelamento (`CANCELADO` no log) e o erro.

Questões do TA:


QUESTÃO 1

Considere o componente `Pai`, que tem `const [count, setCount] = useState(0)` e devolve um botão e `<Filho nome="Ana" />`, sendo que `Filho` não possui estado. Cada clique no botão chama `setCount(count + 1)`. Sobre o que acontece a cada clique, é correto afirmar que:

A) Apenas `Pai` roda de novo, porque `Filho` recebe sempre o mesmo valor em `nome` e o React nunca executa um componente cujos parâmetros não mudaram.

B) Apenas `Filho` roda de novo, porque ele é o componente que desenha o resultado na tela.

C) `Pai` roda inteiro de novo (variáveis, funções internas e JSX são recriados) e, como o JSX dele inclui `Filho`, `Filho` também roda, mesmo com `nome` igual, porque a renderização cai do pai para os filhos.

D) Nenhum dos dois roda de novo, porque o `setCount` apenas altera o valor guardado, e a tela só é atualizada quando o DOM é recarregado.

E) `Pai` roda de novo, mas as funções declaradas dentro dele mantêm o mesmo endereço do heap entre as execuções, porque o React reaproveita o frame anterior da call stack.

Gabarito: C

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 2

Sobre o `useRef`, é correto afirmar que:

A) Ele devolve um objeto `{ current }` guardado no heap, o **mesmo** em todas as renderizações; alterar `ref.current` não provoca nova renderização, o que o torna adequado para acessar elementos do HTML e guardar dados de bastidor, como o id de um timer.

B) Ele devolve uma "foto" nova do valor a cada renderização, e alterar `ref.current` agenda uma nova renderização, exatamente como o `setEstado`.

C) Ele só pode ser usado com elementos do HTML; para guardar qualquer outro tipo de valor é obrigatório usar `useState`.

D) O valor de `ref.current` é recalculado a cada renderização, por isso não pode ser usado para lembrar algo entre uma renderização e outra.

E) Para que a tela mostre o novo valor de `ref.current`, basta alterá-lo dentro de um handler, pois o React observa a propriedade `current` e atualiza o DOM sozinho.

Gabarito: A

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 3

Um aluno escreveu o efeito abaixo dentro de um componente que recebe `user` por parâmetro:

```tsx
const params = { page: 1, limit: 20 }

useEffect(() => {
    async function load() {
        const result = await tasksListApi(user.id, params)
        setTasks(result.data)
    }

    load()
}, [params])
```

Ao abrir a tela, o navegador dispara requisições sem parar. Sobre o problema e a solução, é correto afirmar que:

A) O problema é a função `load` ser `async`; basta remover o `async` e usar `.then` para o efeito rodar uma única vez.

B) O problema é a chamada `load()` dentro do efeito; ela deveria ficar fora do `useEffect`, no corpo do componente.

C) O problema é o `setTasks`, que nunca pode ser chamado dentro de um efeito; o resultado deve ser guardado em uma variável comum.

D) `params` é um objeto criado no corpo do componente, ou seja, um **endereço novo** a cada renderização; como o React compara dependências por `Object.is`, o efeito roda a cada renderização, o `setTasks` renderiza de novo e o ciclo se repete. A solução é depender de valores primitivos, como `[user.id]` (ou `[user.id, page, limit]`).

E) O problema é o array de dependências estar presente; omitir o array faz o efeito rodar uma única vez, na montagem.

Gabarito: D

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 4

Sobre chamadas assíncronas ao backend dentro de um `useEffect` e o uso do `AbortController`, é correto afirmar que:

A) A função passada ao `useEffect` deve ser declarada com `async`, e o `controller.abort()` chamado na limpeza desfaz no servidor o que a requisição já tinha feito, como apagar o registro criado por um POST.

B) A função do efeito não deve ser `async`, porque uma função assíncrona devolve uma `Promise` no lugar da limpeza; declara-se uma função `async` dentro do efeito e chama-se em seguida. O `AbortController` é criado dentro do efeito, o `controller.signal` vai na requisição e a limpeza chama `controller.abort()`: a requisição rejeita (no Axios, o cancelamento é reconhecido com `isCancel(err)`, que o `catch` deve ignorar) e uma resposta atrasada não sobrescreve a atual. O servidor, porém, pode já ter processado o pedido, pois o abort só faz o navegador deixar de esperar.

C) Um único `AbortController` pode ser criado fora do componente e reaproveitado em todas as requisições, porque depois do `abort()` o `signal` volta ao estado inicial e aceita novas requisições.

D) O `AbortController` é um recurso do React, disponível apenas dentro de hooks, e o `isCancel` é um método dele para saber se o `signal` foi cancelado.

E) A limpeza do efeito só roda quando a página é fechada, e por isso não é possível cancelar a requisição anterior quando a dependência do efeito muda.

Gabarito: B

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 5

Um custom hook `useAxios<T>(url)` devolve `{ data, error, isLoading, refetch }` e é chamado dentro de `UserTasks`. Sobre o funcionamento desse hook, é correto afirmar que:

A) O hook mantém os estados em uma variável global; por isso, todos os componentes que o chamam compartilham o mesmo `data`, e uma mudança aparece em todos eles ao mesmo tempo.

B) Como o hook não é um componente, quando ele chama `setData` o `UserTasks` **não** renderiza de novo; é preciso criar um `useState` extra no componente para refletir o valor na tela.

C) O hook pode ser chamado dentro de um `if`, desde que a condição seja verdadeira na primeira renderização, pois o React guarda o estado pelo nome da variável.

D) O nome do hook não importa; o prefixo `use` é só uma convenção estética e o React identifica os hooks pelo conteúdo da função.

E) Os estados criados dentro do hook pertencem ao componente que o chamou: quando o hook chama `setData`, `setError` ou `setIsLoading`, o `UserTasks` roda de novo com os valores novos, e cada componente que chama o hook tem o seu próprio conjunto de estados; o hook deve ser chamado no topo, em toda renderização, na mesma ordem.

Gabarito: E

Misturar as alternativas? ( x) Sim (  ) Não
