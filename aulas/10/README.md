# Mensageria e Websockets

**TF da Aula 10 · Frontend · UNIFAAT 2026.2 · Prof. Luan Lourenço**

Este arquivo é a descrição do TF. Link deste TF (por extenso):
https://github.com/luan-tavares/unifaat-2026-frontend/tree/main/aulas/10

---

## Objetivo

Na aula montamos um **chat público em tempo real**: o navegador abre um túnel
websocket, o `nginx` leva até o container `nodewebsocket-container` e o
**RabbitMQ** (exchange `notifications`, uma fila dinâmica por websocket)
espalha cada evento para todo mundo.

No TF você **estende esse mesmo chat** com 3 funcionalidades, uma para cada
peça da arquitetura: um **Event novo** (digitando), **salas** com um Event de
sair (duas salas) e um **upload de imagem processado por um worker**.

Diferente do TF09, aqui **não há app novo**: o código muda **dentro do projeto
do curso** (`src/` e `docker-compose.yml`), na sua branch do fork.

## Antes de começar

Atualize o projeto (veja "Já tinha o projeto? Atualizando" no README da raiz),
suba tudo e confira o chat em duas abas:

```sh
docker compose up -d --build
```

Abra `http://localhost:8080/chat` em **duas abas** com nomes diferentes. Se o
chat não conversar entre as abas, não comece o TF: resolva antes.

Releia o `briefing.md` desta aula (seções de Event, exchange e "worker ×
websocket"): as 3 partes seguem exatamente o padrão que o `ChatMessageEvent`
e o `ChatJoinEvent` já usam.

## O que o TF pede

### 1. Event "digitando…" (`chat:typing`)

Quando alguém está digitando, os outros veem **"fulano está digitando…"**.

- **Backend:** um Event novo em `src/app/Events/Chat/ChatTypingEvent.js`, criado
  com `createEvent`, `name: 'chat:typing'`. Ele só chama
  `context.notify('chat:typing', { name })`. **Não pode** mexer no
  `_websocket.js` para registrar: o `loadEvents` descobre o arquivo sozinho (se
  precisar mexer, o Event está no lugar errado).
- **Frontend (`ChatApp.tsx`):**
  - ao digitar no campo, emite `chat:typing`, mas **no máximo 1 vez a cada
    ~1,5 s** (não emita a cada tecla; guarde o horário do último envio em
    `useRef`);
  - ao receber `chat:typing` de **outra pessoa** (nunca de você mesmo), mostra
    o aviso acima do campo;
  - o aviso **some sozinho** depois de 3 s sem novo `chat:typing` (um
    `setTimeout` guardado em `useRef`, **com limpeza**) e também some quando a
    mensagem dessa pessoa chega;
  - várias pessoas: "ana e beto estão digitando…".

### 2. Salas e Event de sair (`chat:leave`)

O chat passa a ter **duas salas**: `geral` e `dev`.

- **Backend:**
  - `chat:join` passa a receber `{ name, room }` e coloca o socket na sala
    (`context.socket.join(room)`); crie o Event `chat:leave`
    (`src/app/Events/Chat/ChatLeaveEvent.js`, `name: 'chat:leave'`), que tira o
    socket da sala (`socket.leave(room)`) e avisa os outros;
  - **todo evento de chat leva `room` no payload** (`chat:message`,
    `chat:joined`, `chat:left`, `chat:typing`);
  - no `_websocket.js`, o consumidor do exchange passa a entregar
    **só para quem está na sala**: se o payload tem `room`, use
    `io.to(payload.room).emit(event, payload)`; sem `room` (ex.: a lista de
    presença), continua `io.emit`.
- **Frontend:**
  - duas abas/botões **"# geral"** e **"# dev"**; cada sala mostra **só as suas
    mensagens** (o `feed` fica separado por sala, ou filtrado por `room`);
  - trocar de sala emite `chat:leave` na antiga e `chat:join` na nova;
  - botão **"Sair da sala"**: emite `chat:leave` e volta para a tela do nome;
  - a mensagem de sistema **"fulano saiu da sala"** aparece em **outra cor**
    (diferente da de "entrou"; ex.: `bg-warning-subtle`), igual ao padrão do
    "entrou".

Teste: duas abas em `geral` e uma terceira em `dev`. A mensagem de `geral`
**não** pode aparecer em `dev`.

### 3. Upload de imagem processado por um worker (`chat:image`)

Esta é a parte da regra da aula: **o websocket só conecta e distribui; o
trabalho pesado vai para um worker**.

- **Frontend:** um botão **"📎 imagem"** (`<input type="file" accept="image/*">`
  num handler explícito). Limite de **500 KB** (maior que isso, mostre um erro
  e **não envie**). Leia o arquivo com `FileReader` e emita `chat:image` com
  `{ name, room, filename, data }` (`data` = o `dataURL` em base64).
- **Event (`src/app/Events/Chat/ChatImageEvent.js`, `name: 'chat:image'`):**
  **não processa nada.** Só valida e **lança um job** na fila `images`:

```js
await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
```

- **Job (`src/app/Jobs/ProcessChatImageJob.js`):** o `handle` faz o trabalho
  "pesado": gerar uma **miniatura** (pode usar `sharp`, com
  `npm install sharp` em `src/`, ou, se não conseguir instalar, simular o peso
  com uma espera de 3 s) e, no fim, **avisa o resultado por um exchange**:
  `rabbit.notify('results', 'chat:image', { name, room, filename, thumb })`.
- **Worker:** suba **mais um worker** para a fila `images`, copiando o serviço
  `nodeworker-container` do `docker-compose.yml` com `--queue images` (nome
  sugerido: `nodeworker-images-container`). Ele **não tem porta** e não é
  servidor.
- **Voltando para a tela:** o `_websocket.js` passa a assinar **também** o
  exchange `results` (novo parâmetro `--results`, padrão `results`) e entrega o
  `chat:image` para a sala, igual a qualquer outro evento. No React, a imagem
  aparece no feed (`<img>`), junto com "fulano enviou uma imagem".
- **Armadilha (resolva e explique no `tf.md`):** o `dispatch` do `createJob`
  chama `rabbit.close()` no `finally`. Dentro do websocket isso **derruba a
  conexão do RabbitMQ** que o servidor está usando. Corrija para só fechar a
  conexão **se ela foi aberta pelo próprio `dispatch`** (use `rabbit.isConnected()`
  antes do `connect`).

Prova de que está certo: com o worker de imagens **parado**
(`docker compose stop nodeworker-images-container`), o chat de texto continua
funcionando normalmente e a imagem **fica na fila**; ao subir o worker de novo,
ela aparece. É a vantagem de tirar o pesado do websocket.

## Regras de código

- ✅ Cada Event em **arquivo próprio**, em `src/app/Events/Chat/`, com
  `createEvent` (nome `dominio:acao`)
- ✅ O Event **não importa** o `io` nem o `rabbit` direto: usa o `context`
  (`socket`, `notify`, `presence`)
- ✅ Job em `src/app/Jobs/`, com `createJob`; o Event só chama `dispatch`
- ✅ React em **TypeScript** (`strict`), sem `any`; os tipos novos entram em
  `src/resources/js/types/chat.ts`
- ✅ Só `const` (nunca `let`) no React; booleano com prefixo `is`
  (`isTyping`, `isSending`)
- ✅ Todo `useEffect` com dependências corretas e **função de limpeza** (timers
  e `socket.off`)
- ✅ Handler de clique/evento **explícito** (`onClick={handleLeave}`), nunca
  função anônima grande no JSX
- ✅ Sem `else` / `else if` (early return ou valor padrão antes do `if`)
- ✅ `key` estável nas listas (nunca o índice)
- ❌ Nada de processamento pesado dentro do `_websocket.js` ou de um Event

## Como entregar

A branch **tem que se chamar `RA-tf-10`**: o seu RA, `-tf-` e o número do TF
com 2 dígitos. Exemplo para o RA `1234567`: `1234567-tf-10`.

**Sem a branch com esse nome, o TF vale ZERO.**

1. Fazer o **fork** do repositório do professor e clonar o **seu fork**
   (veja a documentação "Fluxo Git do aluno").
2. Atualizar o `main` e criar a branch do TF a partir dele:

```sh
git switch main
git pull --ff-only upstream main
git switch -c 1234567-tf-10
```

3. Fazer as 3 partes **no próprio projeto** (`src/`, `docker-compose.yml`) e,
   na **raiz do repositório**, criar um diretório com **exatamente o mesmo nome
   da branch**, só com o `tf.md`:

```text
1234567-tf-10/
└── tf.md
```

4. Criar o `tf.md` com o seu **nome**, o seu **RA**, o seu **GitHub** (link do
   perfil, por extenso) e **um parágrafo** explicando a "armadilha" do
   `dispatch` (o que acontecia e como você corrigiu):

```text
Nome: Maria da Silva
RA: 1234567
GitHub: https://github.com/maria-silva

Armadilha do dispatch: ...
```

5. Commitar e enviar para o **seu fork** (sem `node_modules` e **sem o
   `.env`**):

```sh
git add -A
git commit -m "TF-10"
git push -u origin 1234567-tf-10
```

6. Abrir o **Pull Request no repositório do professor**
   (`luan-tavares/unifaat-2026-frontend`). O PR **nasce no repositório do
   professor** (o *base*) e traz a sua branch do **seu fork** (o *head*).

   **Pelo navegador** (troque `SEU-USUARIO` pelo seu usuário do GitHub):

```text
https://github.com/luan-tavares/unifaat-2026-frontend/compare/main...SEU-USUARIO:1234567-tf-10?expand=1
```

   **Ou pelo terminal** (GitHub CLI):

```sh
gh pr create \
  --repo luan-tavares/unifaat-2026-frontend \
  --base main \
  --head SEU-USUARIO:1234567-tf-10 \
  --title "TF-10 · 1234567 · Maria da Silva" \
  --body-file 1234567-tf-10/tf.md
```

   - **Título do PR:** `TF-10 · RA · Nome`
   - **Descrição:** o conteúdo do seu `tf.md`
   - **Conferir:** a página do PR mostra `luan-tavares:main ← SEU-USUARIO:1234567-tf-10`

O PR nunca será mergeado: o professor o fecha depois de corrigir. A entrega
termina no Pull Request: **não há formulário**.

## Como conferir antes de entregar

- A branch no GitHub se chama `RA-tf-10` (com o **seu** RA) e existe o
  diretório de mesmo nome com o `tf.md`
- `docker compose up -d --build` sobe tudo e `http://localhost:8080/chat` abre
- **Digitando:** na aba A, digitar mostra "… está digitando" na aba B (nunca
  na própria A) e some em ~3 s; o envio não dispara a cada tecla
- **Salas:** mensagem em `geral` não aparece em `dev`; trocar de sala e
  "Sair da sala" funcionam; "saiu da sala" tem cor diferente de "entrou"
- **Eventos:** `ChatTypingEvent.js` e `ChatLeaveEvent.js` existem em
  `app/Events/Chat/` e o `_websocket.js` **não** os cita pelo nome
- **Imagem:** acima de 500 KB é recusada; abaixo, aparece a miniatura para
  quem está na sala, **depois** do worker processar
- Com `nodeworker-images-container` parado, o texto segue funcionando e a
  imagem espera na fila (ao subir o worker, ela chega)
- O `dispatch` só fecha o RabbitMQ se foi ele que abriu
- `npx tsc --noEmit` sem erro e nenhum `any`

## Regras gerais

- ✅ Uma branch por TF, com o nome `RA-tf-10`
- ✅ Entrega por Pull Request **aberto no repositório do professor** (título `TF-10 · RA · Nome`)
- ❌ Não commitar no `main`, nem fazer merge do PR
- ❌ Nome da branch fora do formato `RA-tf-10` = TF com nota ZERO

**Prazo:** a definir.

## Dúvidas?

Revise o `briefing.md` desta aula (Event, exchange fanout com fila dinâmica,
"worker × websocket" e a regra "websocket só conecta e distribui") e a
documentação "Fluxo Git do aluno" (abas Fluxo do aluno, Comandos Git e
Troubleshooting).
