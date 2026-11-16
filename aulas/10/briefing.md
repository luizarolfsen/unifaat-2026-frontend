Briefing para produção audiovisual e de conteúdo
Aula Completa
2026.2



Professor: Luan Tavares Lourenço
Disciplina: Frontend


Aula:
1☐ 2☐ 3☐ 4☐ 5☐ 6☐ 7☐ 8☐ 9☐ 10☒ 11☐ 12☐ 13☐ 14☐ 15☐ 16☐


Título da aula:

Mensageria e Websockets


Opção do TA:  Vídeo ☐Texto ☒

1 - Introdução

Até aqui, toda comunicação do nosso sistema seguiu o mesmo desenho: o **cliente pergunta** e o **servidor responde**. O navegador pede uma página, o React pede dados ao backend com o Axios, o backend responde e a conversa acaba. Esta aula quebra esse desenho em duas frentes, e as duas pertencem a uma mesma ideia maior, a **mensageria**: sistemas que conversam trocando **mensagens** por um intermediário, em vez de se chamarem diretamente.

A primeira frente é o **backend**. Na aula de **Filas** de Desenvolvimento Web apresentamos o RabbitMQ, o **producer**, o **worker** (consumer) e o **job**. Na Aula 07 (Elasticsearch) esses containers voltaram ao projeto por uma necessidade real: o ciclo de vida HTTP precisa ficar **leve**, e o trabalho pesado ou demorado vai para outro processo. Aqui vamos **relembrar** esse fluxo no código do curso, entender o que ele garante (um job vai para **um** worker só) e ver como se **escala** (mais workers na mesma fila). Depois vem a outra metade da mensageria: quando uma mensagem precisa chegar a **todos** os interessados, e não a um só. Para isso existe o **exchange** do RabbitMQ.

A segunda frente é o **navegador**. Notificar todo mundo só serve de algo se a notificação chegar **na tela** sem o usuário recarregar a página, e se o próprio cliente também puder **mandar** mensagens. O HTTP comum não faz isso, e por isso existe o **WebSocket**: uma conexão que o cliente abre uma vez e que passa a trafegar nos **dois sentidos**.

Fechamos juntando as duas frentes num **chat em rede**: cada aluno da sala vira um cliente, as mensagens passam por um novo container do projeto (o entrypoint `websocket`), e o RabbitMQ distribui cada mensagem para todos os servidores que tenham alunos conectados. É o exemplo que mostra, na prática, por que filas e exchanges são necessários para **escalar** conexões. E fecha com uma regra de arquitetura: o websocket **só conecta e distribui eventos**; o que for pesado vai para um **worker**, e os dois conversam pelo **mesmo RabbitMQ**.

A aula é conduzida com explicações animadas em passos, mostrando as mensagens correndo entre os containers. Os exemplos usam o projeto do curso (`_web.js`, `_worker.js`, `app/Jobs`, `rabbit.js`).

2 - Relembrando Filas: Producer, Fila e Worker

2.1 - Por Que o Ciclo HTTP Deve Ser Leve

Uma requisição HTTP tem um começo e um fim: o navegador espera a resposta, e cada segundo gasto no servidor é um segundo com o usuário olhando para um *loading*. Por isso o controller deve fazer **só o necessário para responder**: validar, gravar no banco e devolver. Tudo o que é pesado, demorado ou que **não precisa estar pronto na resposta** sai do ciclo HTTP e vai para um **worker**:

| Tarefa | Onde roda |
|--------|-----------|
| validar a entrada, gravar o usuário no Postgres, devolver `201` | no controller (ciclo HTTP) |
| indexar o usuário no Elasticsearch, enviar e-mail de boas-vindas, gerar relatório | no **worker**, depois da resposta |

Foi exatamente essa necessidade que trouxe de volta, na Aula 07, o entrypoint `worker` e o container do RabbitMQ: o `CreateUserController` grava o usuário e responde; a indexação no Elasticsearch acontece **depois**, fora da requisição.

2.2 - O Fluxo: Producer, Fila e Consumer

O fluxo tem três peças, e a fila no meio é o que **desacopla** as outras duas:

```text
 producer                       fila                      consumer
 (controller, command,          (RabbitMQ,                (entrypoint worker,
  qualquer entrypoint)           guarda a mensagem)        executa o job)

 UserController ──dispatch──►  [ job | job | job ] ──────►  Worker
   responde 201 e segue         fica na fila até             pega, executa
   a vida                       alguém consumir              e confirma (ack)
```

- **Producer**: quem **lança** o job na fila. Pode ser **qualquer entrypoint** (o `_web.js` por um controller, o `_command.js` por um comando, até outro worker). Ele não sabe quem vai executar nem quando;
- **Fila**: o banco de mensagens do RabbitMQ. A fila é **durável** (`durable: true`): se o RabbitMQ reiniciar, as mensagens que estavam nela continuam lá;
- **Consumer (worker)**: o entrypoint `_worker.js`, um processo Node separado, em **outro container** (`nodeworker-container`), que fica conectado à fila e executa cada job que chega.

2.3 - O Job Como Unidade de Execução

O que viaja pela fila é a **unidade de execução**: o **job**. Um job é um arquivo em `app/Jobs/`, criado com `createJob`, que tem um `name` e um `handle(payload)`:

```js
// app/Jobs/SyncUserElasticJob.js
import { createJob } from '../../utils/job.js'
import UserElasticService from '../Services/UserElasticService.js'

export default createJob({
    name: 'SyncUserElasticJob',
    handle: async (payload) => {
        const { id } = payload

        const result = await UserElasticService.sync(id)

        console.log(`Usuário ${id} sincronizado no Elasticsearch: ${result}`)
    }
})
```

O `createJob` devolve, além do `handle`, o método **`dispatch(queue, payload)`**, que é o lado do producer. No controller, lançar o job é uma linha:

```js
// app/Http/Controllers/UserApi/CreateUserController.js
const user = await UserModel.create({ name, email, password: hashedPassword })

// Fora do ciclo HTTP: o worker indexa no Elasticsearch depois
await SyncUserElasticJob.dispatch("default", { id: user.id })

return response.status(201).json(user)
```

O `dispatch` não executa nada: ele **publica uma mensagem JSON** na fila `default` e devolve. O que trafega é só o **nome do job** e o **payload**, nada de funções:

```json
{ "job": "SyncUserElasticJob", "payload": { "id": 42 } }
```

Do outro lado, o `_worker.js` carrega todos os jobs de `app/Jobs/` (`loadJobs`) e consome a fila. Para cada mensagem, lê o JSON, procura o job pelo nome e chama o `handle`:

```js
// _worker.js (resumo)
const jobs = await loadJobs(jobsPath)       // { SyncUserElasticJob: handle, ... }

await rabbit.consume(queue, async (msg) => {
    const { job, payload } = JSON.parse(msg.content.toString())

    await jobs[job](payload)
})
```

2.4 - Por Que Dividir em Camadas

Repare que cada camada tem **uma responsabilidade só**, e é isso que mantém o sistema fácil de mudar:

| Camada | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Producer | `CreateUserController` | decidir **quando** lançar o job; não sabe como ele é feito |
| Job | `SyncUserElasticJob` | descrever **o que** fazer com o payload (a unidade de execução) |
| Service | `UserElasticService` | a regra de negócio, a mesma que um controller ou um comando poderia chamar |
| Infra | `rabbit.js` | falar com o RabbitMQ (`publish`, `consume`); o resto do código não conhece o `amqplib` |
| Worker | `_worker.js` | **entrypoint**: conectar na fila e despachar cada mensagem para o job certo |

Por isso o payload leva só o `id` e não o usuário inteiro: o service busca o **estado atual** no Postgres na hora de executar, e o job sempre indexa a versão mais nova, mesmo que o usuário tenha sido alterado enquanto a mensagem esperava na fila.

2.5 - O Que a Fila Garante: Um Job, Um Worker

Uma fila pode ter **um ou mais workers conectados**. A regra do RabbitMQ para uma fila é simples: **cada mensagem é entregue a um único consumidor**. Se há três workers na fila `default`, um job chega em **um** deles, é executado **uma vez** e some da fila; o próximo job vai para outro, em revezamento (*round-robin*).

O que garante que o job não se perde no meio do caminho é a **confirmação (`ack`)**: o RabbitMQ só apaga a mensagem da fila quando o worker confirma que terminou. No nosso `rabbit.js` o `ack` é enviado **depois** do `handle`:

```js
// rabbit.js (resumo)
return ch.consume(queue, async (msg) => {
    await onMessage(msg, ch)    // executa o job

    ch.ack(msg)                 // só agora o RabbitMQ apaga a mensagem
}, options)
```

Isso traz um cuidado com o termo **idempotência**, que vale esclarecer:

- **Entrega para um worker só** é uma propriedade **da fila**: não é idempotência;
- **Idempotência** é uma propriedade **do job**: executá-lo duas vezes dá o mesmo resultado de executá-lo uma. Ela importa porque, se o worker **morrer depois de executar e antes do `ack`**, o RabbitMQ entende que a mensagem não foi processada e **entrega de novo** a outro worker. A garantia da fila é, portanto, *pelo menos uma vez*;
- o `SyncUserElasticJob` é idempotente por construção: sincronizar o usuário `42` duas vezes deixa o índice igual. Já um job "cobrar a fatura" precisaria de um cuidado extra (por exemplo, guardar que aquela cobrança já foi feita);
- no nosso worker, o erro do job é capturado e logado, e o `ack` sai mesmo assim. Um job que **falha** é descartado e não é tentado de novo; só a morte do processo causa reentrega.

2.6 - Escalando: Mais Workers Pendurados na Fila

A fila escala **no lado de quem consome**. Se o producer lança jobs mais rápido do que o worker executa, a fila cresce. A solução é pendurar **mais workers na mesma fila**:

```text
                           ┌──► Worker 1
 producer ──► [ fila default ] ──► Worker 2      cada job vai para UM deles
                           └──► Worker 3         (a fila escoa 3x mais rápido)
```

No nosso projeto isso não exige mudar código: o worker é só um container, e o Compose sobe quantas **réplicas** forem pedidas:

```bash
# 3 workers consumindo a mesma fila
docker compose up -d --scale nodeworker-container=3
```

Cada réplica abre a **própria conexão** com o RabbitMQ e se registra como consumidor da fila; os workers **competem** pelas mensagens (o padrão se chama *competing consumers*). Uma observação sobre o termo *pooling* que costuma aparecer aqui: o grupo de workers é, sim, um *pool*, mas o RabbitMQ **não faz polling**. Ele **empurra** (*push*) cada mensagem para um consumidor assim que ela chega, sem o worker precisar perguntar "tem job?" de tempos em tempos.

3 - Mensageria: a Outra Metade, Exchange e Notificações

3.1 - Quando Todos Precisam Receber

Fila resolve o problema de **dividir trabalho**: cada mensagem é de **um** consumidor. Mas existe o problema inverso: um fato aconteceu e **todos** os interessados precisam saber. Exemplos:

- uma mensagem foi enviada no chat e todos os alunos da sala precisam vê-la;
- um usuário foi criado e o painel, o log de auditoria e o serviço de e-mail precisam reagir, **cada um do seu jeito**;
- uma tarefa mudou de status e todas as telas abertas devem atualizar.

Isso **não é um job**. Um job é uma ordem ("faça isto"), executada uma vez por um worker. Isto é uma **notificação** ("isto aconteceu"), entregue a **vários consumidores**, e nenhum deles é "o" responsável. Tentar resolver com uma fila só dá errado: os consumidores **competiriam** pela mensagem e só um a receberia.

| | Job | Notificação |
|---|-----|-------------|
| O que é | uma **ordem** de trabalho | um **aviso** de que algo aconteceu |
| Quem recebe | **um** worker | **todos** os consumidores |
| Escala por | **mais workers** na mesma fila | **mais consumidores**, cada um com a sua fila |
| Exemplo | indexar usuário no Elasticsearch | nova mensagem no chat |

3.2 - O Que É um Exchange

Um **exchange** é o **roteador** do RabbitMQ: uma caixa de entrada que **recebe** as mensagens do producer e as **distribui** para as filas ligadas a ele. A mudança de pensamento é esta: o producer **não publica mais na fila**, publica no **exchange**, e o exchange decide para qual(is) fila(s) a cópia vai.

```text
 producer ──► [ EXCHANGE ] ──binding──► [ fila A ] ──► consumer A
                   │
                   └────binding──► [ fila B ] ──► consumer B
```

Três conceitos formam o roteamento:

- **Exchange**: recebe e roteia; **não guarda** mensagem (quem guarda é a fila);
- **Binding**: a **ligação** entre um exchange e uma fila ("esta fila quer o que passar por aquele exchange");
- **Routing key**: um texto que o producer coloca na mensagem; o tipo do exchange usa essa chave (ou não) para decidir o destino.

O **tipo** do exchange define a regra de distribuição:

| Tipo | Regra |
|------|-------|
| `direct` | entrega às filas cuja *binding key* é **igual** à routing key |
| `fanout` | entrega a **todas** as filas ligadas, ignorando a routing key (o *broadcast*) |
| `topic` | a routing key casa com um **padrão** (`pedido.*`, `chat.#`) |
| `headers` | decide pelos **cabeçalhos** da mensagem |

Para notificações o tipo é o **`fanout`**: cada fila ligada recebe uma **cópia** da mensagem.

3.3 - A Fila Também Tem Um Exchange (Implícito)

Se o producer sempre publica em um exchange, como o nosso `dispatch` consegue publicar direto na fila `default`? Porque existe um **exchange padrão** (*default exchange*), sem nome (`""`), do tipo `direct`, que o RabbitMQ cria sozinho. Toda fila declarada é ligada a ele **automaticamente**, com a *binding key* igual ao **nome da fila**. O método `sendToQueue` do `amqplib` é só um atalho:

```js
// as duas linhas fazem exatamente a mesma coisa
channel.sendToQueue('default', buffer)

channel.publish('', 'default', buffer)   // exchange "" (padrão), routing key = nome da fila
```

Ou seja, **toda mensagem passa por um exchange**; no caso das filas de jobs ele ficava escondido. Agora vamos usar um exchange de forma **explícita**.

3.4 - Configurando um Exchange na Conexão

No `amqplib` o exchange é declarado no **canal** da conexão, com `assertExchange`, que **cria se não existir** (e é seguro repetir). O consumidor declara o exchange, cria a **própria fila**, liga uma à outra e consome:

```js
// consumidor de notificações
const channel = await connection.createChannel()

// 1. o exchange fanout, que distribui para todas as filas ligadas
await channel.assertExchange('notifications', 'fanout', { durable: false })

// 2. uma fila SÓ DESTE consumidor: nome vazio = o RabbitMQ gera um; exclusive = some ao desconectar
const { queue } = await channel.assertQueue('', { exclusive: true })

// 3. binding: liga a fila ao exchange (no fanout a routing key é ignorada, por isso '')
await channel.bindQueue(queue, 'notifications', '')

// 4. consome a própria fila
await channel.consume(queue, (msg) => {
    console.log('Notificação:', msg.content.toString())
}, { noAck: true })
```

E o producer publica no exchange, sem saber quantos consumidores existem:

```js
// producer de notificações
await channel.assertExchange('notifications', 'fanout', { durable: false })

channel.publish('notifications', '', Buffer.from(JSON.stringify({ event: 'chat:message', payload })))
```

O ponto central está no passo 2: no fanout **cada consumidor tem a sua própria fila**, e ela é **dinâmica**: com o nome vazio, o RabbitMQ gera uma fila nova (`amq.gen-...`) para cada consumidor que sobe e ela some quando o processo cai (`exclusive`). Se 5 consumidores sobem, o exchange passa a ter **5 filas dinâmicas ligadas**. É isso que transforma a competição em *broadcast*: não são vários consumidores disputando **uma** fila; são **várias filas** (uma por consumidor) recebendo **cópias** da mesma mensagem.

```text
                                  ┌─► [ fila do consumer 1 ] ──► consumer 1
 producer ──► [ exchange fanout ] ─┼─► [ fila do consumer 2 ] ──► consumer 2
                                  └─► [ fila do consumer 3 ] ──► consumer 3
```

Em termos de código, o `rabbit.js` ganha duas capacidades novas ao lado de `publish` e `consume`: declarar o exchange e **assinar** (declarar a fila exclusiva, ligar e consumir). Jobs de um lado (fila + workers), **notificações do outro** (exchange + consumidores).

4 - WebSocket: o Servidor Também Fala Primeiro

4.1 - O Limite do HTTP

No modelo cliente-servidor, **quem inicia a conversa é sempre o cliente**. O navegador abre a conexão, manda a requisição, o servidor responde e a troca termina. O servidor **nunca** consegue mandar algo por conta própria. Para um chat isso é um problema: quando o aluno B escreve, como o navegador do aluno A fica sabendo?

A saída "tradicional" é o ***polling***: o cliente pergunta de tempos em tempos "tem novidade?" (`setInterval` com Axios). Funciona, mas desperdiça requisições (quase todas voltam vazias) e ainda tem atraso (a mensagem espera o próximo ciclo). O WebSocket resolve na raiz.

4.2 - O Que É um Socket

Um **socket** é uma **ponta de comunicação** entre dois programas: o par **endereço IP + porta** de cada lado, por onde os bytes passam. Todo HTTP já usa sockets por baixo (uma conexão TCP): a diferença é que o HTTP, por padrão, usa a conexão para **uma pergunta e uma resposta**.

O **WebSocket** é um protocolo (RFC 6455) que **mantém a conexão aberta** depois de estabelecida. Enquanto o HTTP é um "pedido com resposta", o WebSocket é um **túnel**: aberto uma vez, qualquer um dos lados envia quando quiser. Isso se chama comunicação **bidirecional** (*full-duplex*). Os endereços usam outro esquema: `ws://` (sem criptografia) e `wss://` (sobre TLS, o equivalente ao HTTPS).

4.3 - Quem Abre o Túnel Sempre É o Cliente

Mesmo no WebSocket, **o cliente vai atrás do servidor**. Quem inicia a conexão é o navegador, e isso não é detalhe: é por isso que funciona atrás de roteadores, NAT e firewalls (o servidor nunca precisa "chamar" um computador de aluno). Depois de aberto, o túnel é dos dois.

A conexão nasce como **HTTP comum**, com um pedido especial de troca de protocolo, o *handshake*:

```http
GET /socket HTTP/1.1
Host: localhost:8080
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

O servidor aceita respondendo com o status **`101 Switching Protocols`**:

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

A sequência completa é:

1. o cliente abre uma conexão TCP e envia o `GET` com `Upgrade: websocket`;
2. o servidor responde `101 Switching Protocols` (o `Sec-WebSocket-Accept` é calculado a partir do `Sec-WebSocket-Key`, provando que ele entende WebSocket);
3. **a mesma conexão TCP** deixa de falar HTTP e passa a trocar **frames** do WebSocket, nos dois sentidos, até alguém fechar.

4.4 - Como Aparece no Navegador

No Chrome, abra o DevTools (`F12`), aba **Network**, e use o filtro **WS**. A conexão aparece como **uma linha só** (e não uma por mensagem, como no Fetch/XHR). Clicando nela:

- **Headers**: o `GET` do handshake, com `Upgrade: websocket`, e o status **`101 Switching Protocols`**;
- **Messages**: a lista de **frames**, cada um com uma seta: **verde (↑)** para o que o cliente **enviou**, **vermelha (↓)** para o que **recebeu**, com o conteúdo e o horário. É o equivalente do "ver a resposta" que já fazemos no HTTP, mas **ao vivo**.

4.5 - A API do Navegador e as Bibliotecas

O navegador já traz uma API nativa, a `WebSocket`, com quatro eventos e um método:

```js
const socket = new WebSocket('ws://localhost:8080/socket')

socket.onopen = () => socket.send('oi')                  // túnel aberto
socket.onmessage = (event) => console.log(event.data)    // chegou algo do servidor
socket.onclose = () => console.log('fechou')             // túnel fechado
```

O navegador, porém, é só **um lado**. O **servidor** também precisa falar WebSocket, e o Node não traz isso pronto. Por isso, em Node, usamos uma biblioteca **no backend e outra no frontend**, e elas precisam ser **do mesmo "sabor"**:

| Biblioteca | Backend | Frontend | O que é |
|------------|---------|----------|---------|
| `ws` | `ws` | a `WebSocket` nativa do navegador | WebSocket **puro**: só o protocolo; você cuida de reconexão, formato das mensagens e grupos |
| Socket.IO | `socket.io` | `socket.io-client` | **protocolo próprio** em cima do WebSocket: eventos nomeados, reconexão automática, salas (*rooms*), confirmação de recebimento |

A diferença que costuma pegar todo mundo: o **Socket.IO não é WebSocket puro**. O cliente `socket.io-client` **não conversa** com um servidor `ws`, e o contrário também não. Além disso, o Socket.IO começa a conexão por requisições HTTP comuns (*long polling*) e **sobe** para WebSocket em seguida; no Network você verá primeiro algumas requisições `polling` e depois a linha `101`. Em troca, ele entrega o que um chat precisa pronto, e o modelo dele é o que queremos: **eventos nomeados com payload**.

```ts
// frontend (socket.io-client)
import { io } from "socket.io-client"

const socket = io()    // sem URL: conecta na mesma origem, no caminho /socket.io

socket.emit("chat:message", { name: "Ana", text: "oi, turma" })     // cliente → servidor

socket.on("chat:message", (payload) => {                           // servidor → cliente
    console.log(payload.name, payload.text)
})
```

5 - A Arquitetura do Chat

5.1 - Um Novo Entrypoint: `websocket`

O projeto já tem entrypoints para cada papel: `_web.js` (HTTP), `_worker.js` (fila de jobs), `_command.js` (terminal). Entra mais um, o **`_websocket.js`**, em **outro container** (`nodewebsocket-container`), porque ele tem um ciclo de vida diferente: o servidor HTTP atende e **solta** a conexão; o servidor de WebSocket **mantém centenas de conexões abertas** por horas. Separar permite escalar e reiniciar cada um sem derrubar o outro.

A unidade de execução também muda de nome. No worker era o **Job** (uma ordem para a fila); no websocket é o **Event**, uma mensagem **nomeada** com um payload, como `chat:message`. O paralelo é direto:

| | Fila de jobs | WebSocket |
|---|--------------|-----------|
| Entrypoint (consumer) | `_worker.js` | `_websocket.js` |
| Unidade de execução | **Job** (`app/Jobs`) | **Event** (`app/Events`) |
| Producer | controller, command... | o **client**, que abre a conexão e emite o Event |
| Transporte | RabbitMQ (fila) | WebSocket (túnel) + RabbitMQ (exchange) |

**Regra do entrypoint websocket:** ele **só conecta e distribui eventos**. Assim como o controller do HTTP, ele **não processa nada pesado**: o que demora vai para um worker (seção 5.3). Websocket e worker são dois containers diferentes que se conectam **no mesmo RabbitMQ**.

5.2 - O Event e o Entrypoint em Código (Modularizado)

A estrutura segue a do worker: **cada responsabilidade em um arquivo**, e o entrypoint só **monta as peças**. O ponto de design pedido é que o **exchange seja escolhido por parâmetro** ao subir o container, do mesmo jeito que o worker escolhe a fila com `--queue`. Os arquivos novos (e o que muda no `rabbit.js`) são:

```text
src/
├── _websocket.js                 # entrypoint: lê --exchange e --port e monta tudo
├── app/
│   └── Events/
│       └── Chat/                 # uma pasta por domínio
│           └── ChatMessageEvent.js   # a unidade de execução (um Event por arquivo)
├── database/connections/
│   └── rabbit.js                 # ganha: assertExchange, notify, subscribe
└── utils/
    ├── event.js                  # createEvent (o equivalente do createJob)
    └── loadEvents.js             # lê app/Events e as subpastas (o equivalente do loadJobs)
```

**1. A infraestrutura (`rabbit.js`).** Ao lado de `publish` e `consume`, entram três funções que recebem o **nome do exchange como parâmetro**, e nenhuma delas sabe qual é o exchange do chat:

```js
// database/connections/rabbit.js (acrescentar, dentro do mesmo módulo)
const assertExchange = async (exchange, type = 'fanout', options = { durable: false }) => {
    const ch = await createChannel()
    await ch.assertExchange(exchange, type, options)
    return ch
}

// producer: publica no exchange; quem entrega é o fanout
const notify = async (exchange, event, payload) => {
    const ch = await assertExchange(exchange)
    const message = Buffer.from(JSON.stringify({ event, payload }))

    return ch.publish(exchange, '', message)
}

// consumer: fila exclusiva DESTE processo, ligada ao exchange
const subscribe = async (exchange, onNotification) => {
    const ch = await assertExchange(exchange)
    const { queue } = await ch.assertQueue('', { exclusive: true })

    await ch.bindQueue(queue, exchange, '')

    return ch.consume(queue, (msg) => {
        if (!msg) {
            return
        }

        const { event, payload } = JSON.parse(msg.content.toString())

        onNotification(event, payload)
    }, { noAck: true })
}

// e no return do módulo: { ..., assertExchange, notify, subscribe }
```

**2. A unidade de execução (`createEvent` e `loadEvents`).** O `createEvent` só valida e devolve; o `loadEvents` lê o diretório e monta um mapa `nome do Event → Event`, como o `loadJobs`:

```js
// utils/event.js
export function createEvent({ name, handle }) {
    if (!name || typeof name !== 'string') {
        throw new Error('Event precisa receber um name válido.')
    }

    if (typeof handle !== 'function') {
        throw new Error('Event precisa receber um handle(payload, context) válido.')
    }

    return { name, handle }
}
```

```js
// utils/loadEvents.js
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export default async function loadEvents(eventsPath) {
    const entries = await fs.readdir(eventsPath, { withFileTypes: true })
    const events = {}

    for (const entry of entries) {
        const fullPath = path.join(eventsPath, entry.name)

        // uma subpasta por domínio (Chat/, ...): lê de forma recursiva
        if (entry.isDirectory()) {
            Object.assign(events, await loadEvents(fullPath))
            continue
        }

        if (!entry.name.endsWith('.js')) {
            continue
        }

        const eventModule = await import(pathToFileURL(fullPath).href)
        const event = eventModule.default

        if (!event || typeof event.handle !== 'function') {
            continue
        }

        events[event.name] = event
    }

    return events
}
```

**3. O Event (`app/Events/Chat`).** **Um Event por arquivo**, agrupados por domínio em pastas. O arquivo descreve **o que fazer quando o cliente emitir aquele nome**. O `context` traz o `socket` de quem enviou e a função `notify`, **já presa ao exchange escolhido** pelo entrypoint, então o Event não conhece nome de exchange:

```js
// app/Events/Chat/ChatMessageEvent.js
import { createEvent } from '../../../utils/event.js'

export default createEvent({
    name: 'chat:message',
    handle: async (payload, context) => {
        const text = String(payload?.text ?? '').trim()

        if (!text) {
            return
        }

        const name = String(payload?.name ?? '').trim() || 'anônimo'

        // não entrega na tela: publica no exchange e TODOS os servidores recebem a cópia
        await context.notify('chat:message', { name, text: text.slice(0, 500), sentAt: Date.now() })
    }
})
```

Para criar um Event novo (`chat:typing`, por exemplo) basta **adicionar um arquivo** em `app/Events/Chat` (ou numa pasta nova, se for outro domínio); o `loadEvents` acha sozinho e um nome repetido dá erro na subida; o entrypoint não muda, assim como um Job novo não muda o `_worker.js`.

**4. O entrypoint (`_websocket.js`).** Lê os parâmetros, carrega os Events, aceita conexões, registra um `socket.on` por Event e **assina o exchange escolhido** para fazer o *broadcast*:

```js
// _websocket.js
import { Command } from 'commander'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'
import loadEvents from './utils/loadEvents.js'
import rabbit from './database/connections/rabbit.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const program = new Command()

program
    .name('websocket')
    .description('Servidor WebSocket (consumer de notificações do RabbitMQ)')
    .option('--exchange <exchange>', 'Nome do exchange fanout que este servidor assina')
    .option('--port <port>', 'Porta do servidor WebSocket')
    .parse(process.argv)

const options = program.opts()
const exchange = options.exchange || 'notifications'
const port = Number(options.port || 3001)

const events = await loadEvents(path.join(__dirname, 'app', 'Events'))

const httpServer = createServer()
const io = new Server(httpServer)

await rabbit.connect()

// o Event só enxerga "notify"; o exchange fica preso aqui, na hora de montar
const notify = (event, payload) => rabbit.notify(exchange, event, payload)

io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`)

    for (const event of Object.values(events)) {
        socket.on(event.name, (payload) => event.handle(payload, { socket, notify }))
    }

    socket.on('disconnect', () => console.log(`Cliente saiu: ${socket.id}`))
})

// volta do exchange: cada servidor entrega aos SEUS clients conectados
await rabbit.subscribe(exchange, (event, payload) => io.emit(event, payload))

httpServer.listen(port, () => {
    console.log(`Websocket iniciado na porta ${port}. Exchange: ${exchange}`)
})
```

**5. Subindo com o exchange por parâmetro.** Igual ao `--queue` do worker, o exchange é argumento de linha de comando. O `Dockerfile` do container tem `ENTRYPOINT ["nodemon", "_websocket.js"]` (como o do worker), e no Compose o `command` entrega os argumentos:

```bash
# local
node _websocket.js --exchange notifications --port 3001

# duas "salas" independentes: servidores com exchanges diferentes não se enxergam
node _websocket.js --exchange chat-turma-a --port 3001
node _websocket.js --exchange chat-turma-b --port 3002
```

```yaml
# docker-compose.yml (acrescentar)
nodewebsocket-container:
  build:
    context: .
    dockerfile: docker/node-websocket/Dockerfile
  command: ["--exchange", "notifications", "--port", "3001"]   # vão como argumentos do ENTRYPOINT (nodemon _websocket.js)
  env_file:
    - .env
    - .env.docker
  volumes:
    - ./src:/app
    - nodemodules-volume:/app/node_modules
  depends_on:
    - rabbitmq-container
  networks:
    app-network:
      aliases:
        - nodewebsocket_host
```

Compare com o `_worker.js`: ele também carrega as unidades de execução (`loadJobs`), recebe a fila por parâmetro, conecta no RabbitMQ e fica ouvindo. A diferença é **de onde vem a mensagem**: no worker vem da fila; aqui vem do **túnel WebSocket** (o client é o producer), e a volta chega pelo **exchange**.

5.3 - Evento Pesado: o Websocket Só Distribui, o Worker Processa

O entrypoint `websocket` segue a mesma regra do ciclo HTTP: **ficar leve**. Ele faz só duas coisas: **manter as conexões** e **distribuir eventos** (receber do túnel, publicar no exchange, entregar a cópia que volta). Todo Event que dependa de **processamento pesado** (o **upload de imagem no chat**: validar, redimensionar, gerar a miniatura; ou gerar um relatório, chamar uma API lenta, varrer o histórico no banco) **não roda dentro do websocket**.

O motivo é do próprio Node: o processo tem **um único fio de execução** (o *event loop*). Enquanto uma conta pesada roda nele, o processo **não atende ninguém**: os túneis que ele mantém ficam congelados, ninguém envia nem recebe mensagem e até os *pings* que mantêm a conexão viva podem estourar o tempo. É o problema do controller que demora, só que pior: aqui o preço é pago por **todos os clientes conectados naquele servidor**.

A solução reaproveita tudo que já vimos, e quem faz a ponte é o **mesmo RabbitMQ**: o Event só entrega um **job** a um worker e responde na hora; o worker processa fora do websocket e, ao terminar, **joga o resultado em outro exchange**, que o websocket já assina para entregar de volta aos clientes.

```text
 client ──chat:image──► websocket ──dispatch──► [ fila images ] ──► worker
   ▲                      só distribui                                processa o pesado
   │                                                                      │
   └──── io.emit ◄── websocket ◄──── [ exchange results ] ◄──── publish(resultado)
```

O caminho, passo a passo (o exemplo é o **upload de uma imagem no chat**):

1. o client envia o arquivo por **HTTP** para o storage (o arquivo **não** viaja pela fila nem pelo túnel) e emite `chat:image` pelo túnel só com a **referência** (`file`); o Event chega ao websocket;
2. o Event **não processa**: faz o `dispatch` de um job na fila `images` e responde `chat:image:queued` **na hora** (o autor vê "enviando imagem..."; o websocket continua livre para os outros clientes);
3. um **worker** (outro container, no mesmo RabbitMQ) consome a fila `images` e faz o pesado: valida, redimensiona e gera a miniatura;
4. ao terminar, o worker **publica o resultado em outro exchange**, o `results`;
5. cada servidor websocket tem a **sua fila dinâmica** ligada ao `results` (o mesmo mecanismo do `notifications`): o fanout copia o resultado para a fila de cada um, e cada um faz `io.emit` aos **seus** clients;
6. todos os alunos da sala **veem a imagem** pelo túnel, inclusive o autor.

**Filas dinâmicas no mesmo exchange:** o exchange de distribuição não conhece os websockets. Cada websocket que sobe **cria uma fila nova para si** (nome vazio, gerado pelo RabbitMQ, `exclusive`) e a **liga** ao exchange; quando o processo cai, a fila some. Com 5 websockets no ar, o `results` tem **5 filas dinâmicas ligadas**, uma por websocket, e cada resultado publicado é **copiado 5 vezes**. É por isso que subir mais um websocket não exige mudar nada no worker, no Event nem no exchange.

O Event não tem nenhuma conta, só entrega o trabalho:

```js
// app/Events/ChatImageEvent.js
import { createEvent } from '../../utils/event.js'
import ProcessChatImageJob from '../Jobs/ProcessChatImageJob.js'

export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const { room, file, author } = payload

        // não processa nada: entrega a imagem (a referência) a um worker e responde na hora
        await ProcessChatImageJob.dispatch('images', { room, file, author })

        context.socket.emit('chat:image:queued', { room })
    }
})
```

O job é o mesmo `createJob` da seção 2.3; o pesado roda aqui e o resultado sai por **outro exchange**:

```js
// app/Jobs/ProcessChatImageJob.js
import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'
import ChatImageService from '../Services/ChatImageService.js'

export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { room, file, author } = payload

        // o trabalho pesado roda AQUI, no worker: valida, redimensiona, gera a miniatura
        const image = await ChatImageService.process(file)

        // o resultado vai para OUTRO exchange; cada websocket recebe uma cópia na sua fila dinâmica
        await rabbit.notify('results', 'chat:image:ready', { room, author, url: image.url, thumb: image.thumb })
    }
})
```

No entrypoint, entra um segundo parâmetro (o exchange de resultados) e uma segunda assinatura. Ela cria a fila dinâmica deste servidor no `results` e entrega o que chegar aos clients dele:

```js
// _websocket.js (acrescentar)
program.option('--results <exchange>', 'Exchange de onde chegam os resultados dos workers')

const results = options.results || 'results'

// cria a fila dinâmica DESTE servidor no results e entrega aos SEUS clients
await rabbit.subscribe(results, (event, payload) => io.emit(event, payload))
```

E o worker sobe numa fila própria, para o pesado não competir com os jobs leves:

```bash
# um worker só para o pesado (mesma imagem, outra fila)
node _worker.js --queue images
```

**Pegadinha do `dispatch`:** hoje ele **fecha a conexão** ao terminar, o que serve para o controller e o comando (processos curtos). No websocket, que mantém a conexão aberta o tempo todo, isso derrubaria a assinatura do exchange. A regra é **fechar só se foi ele quem abriu**:

```js
// utils/job.js (dispatch): fecha só a conexão que ele mesmo abriu
const jaAberta = rabbit.isConnected()

await rabbit.connect()

try {
    return await rabbit.publish(queue, { job: name, payload }, options)
} finally {
    if (!jaAberta) {
        await rabbit.close()
    }
}
```

Resumindo a divisão de trabalho: **o websocket conecta e distribui; o worker processa**. Os dois são consumers do **mesmo RabbitMQ** (o websocket das filas dinâmicas dos exchanges `notifications` e `results`, o worker da fila de jobs), e é por isso que dá para escalar cada lado separadamente: mais websockets para mais conexões, mais workers para mais processamento.

5.4 - Worker × Websocket: Diferenças, Semelhanças e um Fluxo Só

Worker e websocket são os dois entrypoints que **se penduram no RabbitMQ**, e é fácil confundi-los. A divisão é simples: **o worker faz o pesado; o websocket segura as conexões**, ficando **no meio** do caminho, entre o banco de dados de mensageria (o RabbitMQ) e o client.

**Semelhanças:**

- os dois são **entrypoints Node**, cada um no seu container (`nodeworker-container` e `nodewebsocket-container`), com `nodemon`;
- os dois são **consumers do mesmo RabbitMQ**, pelo mesmo `rabbit.js`;
- os dois carregam **unidades de execução** de uma pasta (`loadJobs` e `loadEvents`) e recebem o destino por **parâmetro** (`--queue` e `--exchange`);
- os dois são **sem estado em memória**: dá para subir quantas réplicas forem precisas (`--scale`).

**Diferenças:**

| | worker (`_worker.js`) | websocket (`_websocket.js`) |
|---|---|---|
| É um servidor? | **Não**: não tem porta e ninguém bate nele | **Sim**: tem porta (`3001`) e aceita conexões |
| Conexões que mantém | só a do **RabbitMQ** | a do RabbitMQ **e** centenas de túneis com os clients |
| Como se pendura no RabbitMQ | numa **fila** (jobs) | numa **fila dinâmica** de um exchange (eventos) |
| Unidade de execução | **Job** (`app/Jobs`) | **Event** (`app/Events`) |
| Processamento | **pode ser pesado**: existe para isso | **nada pesado**: o fio dele já está ocupado mantendo as conexões |
| Parâmetro | `--queue` | `--exchange` e `--results` |
| Como escala | mais workers **na mesma fila** | mais websockets, e o **nginx** reparte as conexões |
| Quem aciona | o RabbitMQ **empurra** o job | o **client** abre o túnel (pelo nginx) |

A diferença que explica todas as outras: **o websocket, além de se conectar ao RabbitMQ, mantém a conexão de cada client**. O fio dele (o *event loop*) já está ocupado segurando centenas de túneis, e por isso ele **não pode** gastar CPU com conta pesada. O worker não tem nenhum client para segurar: ele existe justamente para gastar CPU.

Como os dois estão no **mesmo RabbitMQ**, eles **compartilham um mesmo fluxo** da arquitetura, nos dois sentidos:

- o **websocket lança um job** na fila para o **worker** processar (seção 5.3);
- o **worker lança um evento** num exchange para o **websocket** mandar ao client (o `rabbit.notify` do job);

```text
 client ◄──túnel──► websocket ──job (fila)──► worker
                       ▲  segura as conexões     │ faz o pesado
                       └──── evento (exchange) ◄─┘
```

5.5 - Nginx: Repassando e Distribuindo as Conexões

O navegador continua falando só com o **Nginx** (porta 8080), e ele tem **dois papéis** com o websocket. O primeiro é **repassar** o `Upgrade` ao container, para o handshake funcionar. O segundo é **distribuir** as conexões entre as **réplicas** do websocket:

```nginx
upstream websocket_servers {
    # ip_hash;                       # sticky: só se o client usar polling (em sala de aula todos saem pelo mesmo IP)
    server nodewebsocket_host:3001;   # o Docker devolve o IP de cada réplica
}

location /socket.io/ {
    proxy_pass http://websocket_servers;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

Sem o `Upgrade` o handshake não chega ao Node e a conexão fica presa no *polling*. Por servir tudo na **mesma origem** (`localhost:8080`), o `io()` do frontend não precisa de URL nem de CORS.

```text
 clients ──túneis──► nginx ──┬──► websocket 1 ──► fila dinâmica 1 ──┐
                             ├──► websocket 2 ──► fila dinâmica 2 ──┼── mesmo exchange
                             └──► websocket 3 ──► fila dinâmica 3 ──┘
```

**O nginx também entra na escalabilidade.** Escalar o websocket é **subir mais réplicas** (`--scale nodewebsocket-container=3`), e quem decide **em qual réplica** cada client cai é o nginx:

- o nginx escolhe a réplica **uma vez**, quando o túnel abre: depois disso a conexão fica **presa** a ela e as mensagens não são reencaminhadas;
- o nginx resolve o nome `nodewebsocket_host` **na subida**: ao subir réplicas novas, recarregue-o (`nginx -s reload`);
- o Socket.IO começa por *polling*, e as várias requisições da mesma sessão precisam cair **na mesma réplica** (*sticky*, como o `ip_hash`). **Cuidado em sala de aula:** todos saem pelo mesmo IP, e o `ip_hash` colocaria a turma inteira numa réplica só. Para a demonstração, o client pode usar só WebSocket (`io({ transports: ["websocket"] })`), sem *polling* e sem *sticky*, e o nginx reparte no revezamento;
- o exchange garante o resto: não importa em qual réplica cada client caiu, a mensagem chega a **todas** pelas filas dinâmicas.

6 - Escalabilidade: Muitos Servidores, Todos os Clientes

6.1 - O Problema: Cada Servidor Só Conhece os Seus Clientes

Imagine **10 alunos** no chat. Com um servidor só, tudo funciona: `io.emit` entrega a todos, porque os 10 sockets estão nele. Agora a sala enche e sobem **dois** containers `websocket`, e o Nginx distribui as conexões: **4 alunos caem no servidor A e 6 no servidor B**.

Uma conexão WebSocket é **presa** ao processo que a aceitou. O servidor A só enxerga os 4 sockets **dele**. Quando um aluno do A escreve, o `io.emit` do A alcança só os outros 3 do A (e o próprio autor). Os **6 alunos do B nunca recebem**.

```text
          ┌── Servidor A ── (aluno 1, 2, 3, 4)       aluno 1 escreve...
 Nginx ───┤
          └── Servidor B ── (aluno 5, 6, 7, 8, 9, 10)     ...e ninguém do B fica sabendo
```

Perceba que **não dá para resolver com a fila de jobs**: se o servidor A publicasse a mensagem na fila `default`, ela iria para **um** consumidor só (o A ou o B, em revezamento), exatamente o comportamento errado. Aqui é o caso de **notificação para todos os consumidores**.

6.2 - A Solução: Exchange Fanout Entre os Servidores

Cada servidor `websocket` é um **consumidor** do exchange `notifications` (seção 3.4), com a **sua própria fila dinâmica** no mesmo exchange: criamos **uma fila por websocket**, e é o exchange que copia a mensagem para todas elas. O fluxo de uma mensagem, do clique à tela dos 10 alunos, é:

```text
 1. aluno 1 emite  chat:message ──► Servidor A       (WebSocket, o client é o producer)
 2. Servidor A publica a mensagem ──► [ exchange fanout "notifications" ]
 3. o exchange copia para:  [ fila do A ]   [ fila do B ]
 4. Servidor A consome a sua fila ──► io.emit para os seus 4 clients
    Servidor B consome a sua fila ──► io.emit para os seus 6 clients
 5. os 10 alunos recebem (inclusive o autor): é o broadcast
```

No código da seção 5.2 isso já está pronto, em duas pontas: o Event **não faz `io.emit`**, só chama `notify` (publica no exchange), e o `io.emit` acontece no `rabbit.subscribe`, quando a **cópia volta** da fila do servidor. Para escalar basta subir **mais um container com o mesmo `--exchange`**; cada um cria a sua fila exclusiva e passa a receber as cópias:

```bash
docker compose up -d --scale nodewebsocket-container=2
```

O autor também recebe a própria mensagem **pela volta do exchange**. Isso é proposital: tem um único caminho para a mensagem aparecer na tela, o mesmo para todos, e o chat não precisa tratar "mensagem minha" de forma diferente.

6.3 - Os Dois Escalonamentos Lado a Lado

Agora temos **dois** jeitos de escalar, que usam o RabbitMQ de formas opostas, e saber qual usar é o ponto da aula:

| | Jobs (worker) | Notificações (websocket) |
|---|---------------|--------------------------|
| Objetivo de escalar | **escoar** a fila mais rápido | **atender** mais conexões abertas |
| Como se escala | mais workers **na mesma fila** | mais servidores, **cada um com a sua fila** ligada ao exchange |
| Cada mensagem chega a | **um** consumidor (competem) | **todos** os consumidores (cópias) |
| O que o consumidor faz | executa o job | entrega aos **seus** clients conectados |
| Quantos containers | `--scale nodeworker-container=N` | `--scale nodewebsocket-container=N` |

Em ambos o princípio é o mesmo: **o producer não sabe quantos consumidores existem**. Quem decide se a mensagem vai para um ou para todos é a **topologia** (fila direta x exchange fanout), e é por isso que a mensageria permite crescer sem mexer no código de quem produz.

Um último cuidado de escala: como a conexão fica **presa** ao servidor que a aceitou, o Nginx precisa mandar **todas as requisições de uma mesma sessão** Socket.IO para o **mesmo** servidor enquanto ela estiver no *polling* inicial (*sticky session*, por exemplo `ip_hash`). Depois que o túnel WebSocket sobe, a conexão é uma só e o problema desaparece.

7 - Juntando Tudo

7.1 - O Quadro Geral

```text
 Navegador (React)                  Nginx                 Backend
 ┌──────────────┐              ┌──────────┐      ┌────────────────────────┐
 │ socket.io-   │──WebSocket──►│ :8080    │─────►│ websocket (A, B, ...)  │
 │ client       │◄─────────────│ Upgrade  │      │   producer + consumer  │
 └──────────────┘              └──────────┘      └──────┬─────────────────┘
                                                        │ publish / consume
                                                 ┌──────▼──────────┐
                                                 │    RabbitMQ     │
                                                 │ exchange fanout │ ◄── notificações
                                                 │ fila "default"  │ ◄── jobs ──► worker(s)
                                                 └─────────────────┘
```

7.2 - Resumo da Aula

- o ciclo de vida HTTP deve ser o mais **leve** possível: o que é pesado ou não precisa estar na resposta vai para um **worker**;
- o fluxo é **producer → fila → consumer**; a unidade de execução é o **job** (`createJob`, `dispatch`, `handle`), e a divisão em camadas (controller, job, service, infra, worker) mantém cada parte com uma responsabilidade;
- cada mensagem de uma fila vai para **um** worker só; a confirmação (`ack`) vem depois do `handle`, a garantia é *pelo menos uma vez* e por isso o job deve ser **idempotente**;
- escalar jobs é **pendurar mais workers na mesma fila** (*competing consumers*); o RabbitMQ empurra as mensagens, não há *polling*;
- **filas** são só uma parte da **mensageria**; a outra são as **notificações**: um aviso para **todos** os consumidores, não uma ordem para um;
- o **exchange** recebe do producer e roteia para as filas ligadas por **bindings**; o tipo `fanout` copia a mensagem para todas; toda publicação passa por um exchange, e o `sendToQueue` usa o exchange padrão (`""`);
- no fanout **cada consumidor tem a sua fila** (exclusiva); jobs de um lado, notificações do outro;
- o **WebSocket** mantém a conexão aberta e permite troca **bidirecional**; **o cliente sempre abre o túnel**, por um `GET` HTTP com `Upgrade: websocket` respondido com **`101 Switching Protocols`**; no Chrome aparece em **Network → WS**, com os frames em **Messages**;
- em Node, usamos uma lib **no backend e uma no frontend, do mesmo sabor**: `ws` (puro) ou `socket.io` + `socket.io-client` (protocolo próprio, com eventos, salas e reconexão; não conversa com `ws` puro);
- a arquitetura do chat: entrypoint `_websocket.js` em outro container, **Event** como unidade de execução, o **client** como producer; o Nginx repassa o `Upgrade`;
- o websocket **só conecta e distribui eventos**; o que é **pesado** (como o upload de imagem no chat) vai para um **worker** (job na fila `images`) e o resultado volta por **outro exchange** (`results`), tudo no **mesmo RabbitMQ**: uma conta pesada no websocket congelaria todos os túneis do processo;
- **worker faz o pesado; websocket segura as conexões** entre o RabbitMQ e o client: o worker não é servidor (sem porta), o websocket é (tem porta) e por isso não processa nada pesado; os dois compartilham um fluxo (o websocket lança job para o worker, o worker lança evento para o websocket mandar ao client);
- **o nginx também escala as conexões**: ele repassa o `Upgrade` e distribui os túneis entre as réplicas do websocket (`upstream`); a conexão fica presa à réplica escolhida;
- num exchange de distribuição, **cada websocket cria a sua fila dinâmica** ligada a ele: N websockets, N filas no mesmo exchange, cada mensagem copiada N vezes;
- ao escalar para vários servidores de websocket, cada um só conhece os **seus** clients; o **exchange fanout** distribui cada mensagem para **todos** os servidores, e cada um faz o **broadcast** aos seus clients.

Questões do TA:


QUESTÃO 1

No projeto do curso, o `CreateUserController` grava o usuário no Postgres, chama `SyncUserElasticJob.dispatch("default", { id: user.id })` e responde `201`. Sobre esse fluxo, é correto afirmar que:

A) O `dispatch` executa o `handle` do job dentro da própria requisição HTTP e só depois o controller responde; a fila serve apenas para registrar que o job foi executado.

B) A mensagem que viaja pela fila contém a função `handle` serializada, e por isso o worker não precisa ter o arquivo do job em `app/Jobs`.

C) O `dispatch` apenas publica na fila uma mensagem JSON com o nome do job e o payload; o `_worker.js`, em outro container, encontra o job pelo nome e executa o `handle`, de modo que o ciclo HTTP não espera pela indexação no Elasticsearch.

D) Só o `_web.js` pode ser producer; um comando do `_command.js` não consegue lançar jobs na fila.

E) O payload leva o usuário inteiro para que o worker não precise consultar o Postgres, e isso garante que o índice sempre receba a versão mais recente.

Gabarito: C

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 2

Três workers estão conectados à mesma fila `default`, e o producer lança 9 jobs. Sobre a entrega e a idempotência, é correto afirmar que:

A) Cada job é entregue aos **três** workers, e cada um o executa, porque a fila funciona como *broadcast*.

B) Cada job é entregue a **um** único worker, em revezamento; a mensagem só é apagada depois do `ack`. Se um worker morrer depois de executar o job e antes do `ack`, o job pode ser entregue de novo, e por isso o `handle` deve ser idempotente.

C) A idempotência é uma garantia da fila: o RabbitMQ nunca entrega a mesma mensagem duas vezes, então o job não precisa se preocupar com execução repetida.

D) O RabbitMQ faz *polling* nos workers para perguntar quem está livre, e o job só é entregue ao primeiro que responder.

E) Com mais de um worker na fila, o `ack` deixa de ser necessário, porque os outros workers confirmam por ele.

Gabarito: B

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 3

O `sendToQueue('default', buffer)` do `amqplib` publica direto na fila, sem informar nenhum exchange. Sobre isso, é correto afirmar que:

A) Mensagens publicadas dessa forma não passam por nenhum exchange; o exchange só existe quando se usa o tipo `fanout`.

B) O RabbitMQ cria o exchange padrão (nome vazio, tipo `fanout`), e por isso toda fila recebe todas as mensagens publicadas por qualquer producer.

C) O `sendToQueue` ignora o RabbitMQ e grava a mensagem em um arquivo local, que o worker lê depois.

D) É um atalho para publicar no **exchange padrão** (`""`, tipo `direct`), ao qual toda fila é ligada automaticamente com a *binding key* igual ao nome da fila; `channel.publish('', 'default', buffer)` faz o mesmo.

E) O exchange padrão distribui a mensagem para todas as filas existentes; a routing key serve só para registrar o nome do job.

Gabarito: D

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 4

Para notificar **todos** os consumidores de um evento (por exemplo, uma nova mensagem de chat), foi criado o exchange `notifications` do tipo `fanout`. Sobre a configuração correta no RabbitMQ, é correto afirmar que:

A) Todos os consumidores devem consumir a **mesma fila** ligada ao exchange; o fanout garante que cada um receba uma cópia, mesmo disputando a mesma fila.

B) O exchange guarda as mensagens e as entrega aos consumidores que se conectarem depois, de modo que não é preciso criar filas.

C) O fanout usa a *routing key* para escolher a fila de destino, e por isso o producer precisa informar o nome de cada consumidor.

D) Cada consumidor declara a **sua própria fila** (por exemplo, exclusiva e com nome gerado), faz o `bindQueue` ao exchange e consome essa fila; o producer publica no exchange e o fanout entrega uma **cópia** a cada fila ligada, ignorando a routing key.

E) O fanout entrega a mensagem a **um** só consumidor, escolhido em revezamento, como uma fila de jobs.

Gabarito: D

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 5

Sobre o WebSocket e o seu *handshake*, é correto afirmar que:

A) O servidor abre a conexão com o cliente assim que tem uma novidade, e por isso o navegador precisa de uma porta aberta para receber conexões de entrada.

B) O **cliente** inicia a conexão com um `GET` HTTP contendo `Upgrade: websocket`; o servidor aceita respondendo `101 Switching Protocols`, e a mesma conexão TCP passa a trocar *frames* nos dois sentidos. No Chrome, a conexão aparece uma vez em **Network → WS**, com os frames na aba **Messages**.

C) Cada mensagem enviada pelo WebSocket é uma nova requisição HTTP, e por isso o Network mostra uma linha por mensagem.

D) O WebSocket só permite o cliente enviar dados; para o servidor responder é preciso uma requisição HTTP separada.

E) O Socket.IO é uma implementação do WebSocket puro, e por isso o `socket.io-client` conversa normalmente com um servidor criado com a biblioteca `ws`.

Gabarito: B

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 6

O chat roda em **dois** containers `websocket` (A, com 4 alunos, e B, com 6 alunos), e cada servidor, ao receber um Event do cliente, faz apenas `io.emit` para os clientes **dele**. Um aluno do servidor A escreve. Sobre o que acontece e como resolver, é correto afirmar que:

A) Os 10 alunos recebem a mensagem, porque o Nginx repete automaticamente o `io.emit` em todos os servidores.

B) Os 6 alunos do servidor B não recebem, porque cada servidor só conhece os sockets que ele aceitou. A solução é publicar o Event numa **fila** `default`, de onde os servidores o consomem.

C) Apenas o autor recebe, porque o `io.emit` entrega somente ao socket que enviou o Event.

D) Basta subir mais workers de jobs, porque o worker mantém as conexões WebSocket dos alunos.

E) Os 6 alunos do servidor B não recebem, porque cada servidor só conhece os sockets que ele aceitou. A solução é o servidor A **publicar no exchange fanout**, com cada servidor consumindo a **sua própria fila** ligada a ele; cada um faz então o *broadcast* para os seus clientes, e os 10 (inclusive o autor) recebem. Uma fila única não serve, porque entregaria a mensagem a **um** servidor só.

Gabarito: E

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 7

No chat, o Event `chat:image` precisa validar, redimensionar e gerar a miniatura de uma imagem enviada pelo aluno, o que leva alguns segundos. Sobre onde esse processamento deve rodar, é correto afirmar que:

A) O Event só faz o `dispatch` de um job para um worker e responde na hora; o worker processa e publica o resultado em **outro exchange**, e cada servidor websocket, pela **sua fila dinâmica** ligada a esse exchange, entrega a imagem aos clients dele. O websocket só conecta e distribui eventos, e os dois usam o mesmo RabbitMQ.

B) Pode rodar dentro do `handle` do Event, porque o websocket é um processo separado do HTTP e por isso pode demorar sem afetar ninguém.

C) Pode rodar dentro do `handle` desde que a função seja `async`, porque `async` executa o trabalho em outro processo do sistema operacional e libera o servidor.

D) Basta subir mais instâncias do websocket: cada instância processa a imagem sem travar as demais conexões dela.

E) O worker deve devolver o resultado respondendo à requisição HTTP original do cliente, que fica esperando enquanto a imagem é processada.

Gabarito: A

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 8

Sobre as diferenças e semelhanças entre os entrypoints `worker` e `websocket`, é correto afirmar que:

A) Os dois são servidores com porta; a única diferença é que o worker fala HTTP e o websocket fala WebSocket.

B) O websocket pode fazer processamento pesado, desde que seja um evento por vez, porque ele não precisa cuidar da conexão do RabbitMQ.

C) O worker mantém centenas de conexões abertas com os clients e por isso escala com mais réplicas atrás do nginx.

D) Os dois escalam do mesmo jeito: mais réplicas na mesma fila, em que cada mensagem vai para uma única réplica.

E) Os dois se penduram no mesmo RabbitMQ e executam unidades (Job e Event); o worker não é servidor (sem porta) e pode fazer o trabalho pesado, enquanto o websocket é servidor (tem porta), mantém os túneis dos clients além da conexão com o RabbitMQ e por isso não deve processar nada pesado.

Gabarito: E

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 9

O chat roda com 3 réplicas do `websocket`. Sobre a distribuição das conexões dos clients entre elas, é correto afirmar que:

A) O RabbitMQ distribui as conexões dos clients entre as réplicas, porque é ele quem recebe o `Upgrade`.

B) Não é preciso nginx: cada client escolhe sozinho uma réplica pelo nome do container.

C) O nginx (com um `upstream`) reparte as conexões entre as réplicas e repassa o `Upgrade`; a conexão fica presa à réplica escolhida e, no *polling* inicial do Socket.IO, a mesma sessão precisa cair sempre na mesma réplica (*sticky*). Por isso o nginx também entra na escalabilidade, e o exchange garante que a mensagem chegue a todas as réplicas.

D) O nginx reparte cada mensagem do chat entre as réplicas, uma por réplica, e por isso o exchange fanout deixa de ser necessário.

E) Depois de aberto o túnel, o nginx reencaminha cada mensagem para uma réplica diferente, para equilibrar a carga.

Gabarito: C

Misturar as alternativas? ( x) Sim (  ) Não
