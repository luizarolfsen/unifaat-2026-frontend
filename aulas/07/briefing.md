Briefing para produção audiovisual e de conteúdo 
Aula Completa
2026.2


Professor: Luan Tavares Lourenço
Disciplina: Frontend


Aula:
1☐ 2☐ 3☐ 4☐ 5☐ 6☐ 7☒ 8☐ 9☐ 10☐ 11☐ 12☐ 13☐ 14☐ 15☐ 16☐ 


Título da aula: 

Views e Elasticsearch


Opção do TA:  Vídeo ☐Texto ☒

1 - Introdução

Durante todo o primeiro bimestre a palavra de ordem foi estático. O HTML, o CSS, o JavaScript compilado pelo Vite, as imagens e as fontes ficaram em uma pasta e foram entregues pelo Nginx, sem nenhum processamento no servidor. O Nginx não abre o arquivo, não executa nada e não consulta banco: ele encontra o arquivo no disco e devolve. Essa é a forma mais barata e mais rápida de entregar conteúdo, e por isso insistimos tanto nela.

O contrário de estático é dinâmico: conteúdo que só existe depois que o servidor executa código. Isso não é novidade para a turma. No semestre passado, em Desenvolvimento Web, cada rota da API montava um JSON a partir de dados do banco e devolvia como resposta. Esse JSON não existia em disco: era gerado na hora, a cada requisição.

Esta aula começa juntando as duas pontas. O HTML, o arquivo inicial de qualquer página no navegador, também pode vir dinamicamente na resposta, exatamente como o JSON vinha. Isso abre a porta para a camada que faltava no nosso projeto de desenvolvimento web: a View, o V do MVC. Models e Controllers já fazem parte do projeto desde o semestre passado. Com a View, o HTML passa a viajar pelo ciclo de vida HTTP completo, passando por middlewares, controladores e camada de dados, e isso permite coisas que eram impossíveis com estático, como proteger uma página inteira com sessão antes de ela sair do servidor. Para escrever views sem sofrimento, vamos apresentar o EJS.

Na segunda parte, a aula sai do HTML e vai para a busca. Filtros complexos por vários campos ao mesmo tempo, com texto livre, em uma base grande, são caros para o banco relacional. Para isso existe o Elasticsearch: outro tipo de banco de dados, especializado em busca. Ele não substitui o Postgres. Ele trabalha ao lado dele, como um auxiliar de busca, em um modelo de duas etapas: a busca complexa acontece no Elasticsearch, que devolve só os ids, e esses ids voltam para o Postgres em um `WHERE IN` simples pela chave primária.

O ponto delicado é manter o Elasticsearch alimentado. Cada inserção, atualização e exclusão feita no Postgres precisa chegar ao Elasticsearch, mas isso não pode acontecer dentro do ciclo HTTP. Por isso voltam dois velhos conhecidos de Desenvolvimento Web: o RabbitMQ e o worker. A aula termina com três containers a mais no docker-compose, dois conhecidos e um novo, e com uma discussão importante sobre consistência: a busca pode atrasar alguns milissegundos, mas os dados que o usuário vê continuam sempre íntegros.

2 - Conteúdo Estático x Conteúdo Dinâmico

2.1 - O Que Foi Estático Até Aqui

Relembrando a configuração do Nginx da Aula 01:

```nginx
location / {
    try_files $uri.html $uri $uri/ @node;
}
```

Quando o navegador pede `/login`, o Nginx procura `login.html`, depois `login`, depois o diretório `login/`. Se encontrar, devolve o arquivo como ele está no disco. Só se não encontrar nada é que a requisição vai para o Node (bloco `@node`). O conteúdo estático tem três características:

- **Está pronto antes da requisição chegar:** é um arquivo no disco;
- **É igual para todo mundo:** o usuário A e o usuário B recebem exatamente os mesmos bytes;
- **Não exige processamento:** nenhum código roda no servidor backend para entregá-lo.

Tudo que o frontend tinha de dinâmico (lista de tarefas, nome do usuário logado) chegava depois, por JavaScript: o navegador recebia o HTML estático vazio, o JS rodava, chamava a API com Axios e preenchia o DOM.

2.2 - Conteúdo Dinâmico: Qualquer Arquivo Pode Sair do Backend

Conteúdo dinâmico é aquele que o servidor produz ao receber a requisição, executando código. No semestre passado, isso era o JSON:

```javascript
export default async function ListTaskController(request, response) {
    const tasks = await TaskModel.findAll();

    return response.status(200).json(tasks);
}
```

O texto JSON é montado a partir do banco, na hora, e muda conforme os dados. Mas não é só JSON que pode sair do backend. Qualquer tipo de arquivo que o Nginx entrega como estático também pode ser entregue pelo Node: HTML, CSS, JS, imagem, vídeo, fonte. O próprio projeto já tem um exemplo: o `GetFileController`, que devolve um arquivo pela rota `/arquivo?file=nome_do_arquivo`. Para o navegador, não existe diferença entre um arquivo que veio do disco via Nginx e um conteúdo que o Node gerou: ele só enxerga a resposta HTTP.

2.3 - O HTML Também É Só Texto: o Papel do Content-Type

Uma resposta HTTP é um conjunto de headers mais um corpo. O corpo é só uma sequência de bytes. Quem diz ao navegador o que fazer com esses bytes é o header `Content-Type`:

- `Content-Type: application/json` → o navegador trata como dado (o Axios faz o parse);
- `Content-Type: text/css` → o navegador aplica como folha de estilo;
- `Content-Type: image/png` → o navegador desenha a imagem;
- `Content-Type: text/html; charset=utf-8` → o navegador monta a página e cria o DOM.

Quando o Nginx entrega um `.html` estático, ele mesmo coloca `text/html` no header, com base na extensão do arquivo. Quando o Node monta um HTML como texto e devolve com o mesmo header, o navegador faz exatamente a mesma coisa: monta a página, cria o DOM, baixa o CSS e o JS referenciados. O navegador não sabe, e não precisa saber, se aquele HTML existia em disco ou foi gerado há um milissegundo.

```javascript
// o mesmo corpo, entregue como texto puro ou como página
response.set("Content-Type", "text/plain; charset=utf-8");
response.send("<h1>Olá</h1>"); // navegador mostra os caracteres <h1>Olá</h1>

response.set("Content-Type", "text/html; charset=utf-8");
response.send("<h1>Olá</h1>"); // navegador mostra um título "Olá"
```

No Express, o `response.send()` com uma string já define `text/html` automaticamente se nenhum `Content-Type` foi informado. Aqui o header foi colocado de forma explícita para deixar claro que é ele que decide.

3 - Views: o V Que Faltava no MVC

3.1 - Um Controller Que Monta HTML

O primeiro impulso é montar o HTML dentro do próprio controller, do mesmo jeito que montávamos o JSON:

```javascript
import TaskModel from "../../Models/TaskModel.js";

export default async function TasksPageController(request, response) {
    const tasks = await TaskModel.findAll({
        where: { id_user: request.user.id }
    });

    let items = "";

    for (const task of tasks) {
        items += `<li>${task.name}</li>`;
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Minhas tarefas</title>
</head>
<body>
    <h1>Minhas tarefas</h1>
    <ul>${items}</ul>
</body>
</html>`;

    response.set("Content-Type", "text/html; charset=utf-8");

    return response.status(200).send(html);
}
```

Funciona: o navegador recebe uma página completa, já com as tarefas do usuário, sem nenhuma chamada de API depois. Mas é uma má prática, por três motivos:

- **Mistura de responsabilidades:** o mesmo arquivo cuida da lógica da requisição HTTP (ler o usuário, consultar o banco, definir status e headers) e da formatação do texto HTML. Qualquer mudança visual obriga a mexer no controller;
- **Não escala:** uma página real tem cabeçalho, menu, rodapé, formulários. Concatenar tudo isso em template strings vira um arquivo ilegível, e o cabeçalho acaba copiado em todo controller;
- **Não escapa o conteúdo:** `${task.name}` entra no HTML exatamente como está no banco. Se alguém cadastrar uma tarefa chamada `<script>...</script>`, esse script roda no navegador de quem abrir a página. Esse problema (XSS) é assunto da próxima aula, de Segurança.

3.2 - Separando a View

A solução é a mesma que o MVC já aplicou ao banco. Os Models isolaram o acesso a dados; os Controllers isolaram a lógica HTTP. Falta isolar a apresentação: essa é a View. A View recebe dados prontos e devolve o texto HTML. Ela não sabe de onde os dados vieram, não lê cookie, não define status, não consulta banco.

- **Model:** acessa e representa os dados (`TaskModel`, `UserModel`);
- **Controller:** recebe a requisição, chama os Models, escolhe a resposta;
- **View:** transforma os dados em HTML.

O controller passa a só entregar os dados para a View:

```javascript
export default async function TasksPageController(request, response) {
    const tasks = await TaskModel.findAll({
        where: { id_user: request.user.id }
    });

    return response.status(200).render("tasks", { tasks: tasks });
}
```

O `response.render()` procura a view tasks, executa com os dados recebidos, coloca o `Content-Type` `text/html` e devolve. O arquivo da view é apresentado na seção 4.

3.3 - O HTML Dentro do Ciclo de Vida HTTP

Esta é a ideia central da primeira parte da aula. Com o arquivo estático, o HTML ficava fora do backend: o Nginx o devolvia antes de qualquer código rodar. Com a View, o HTML passa a percorrer o mesmo caminho que o JSON da API sempre percorreu:

```text
requisição GET /tasks
        ↓
middlewares (cookies, autenticação)
        ↓
controller
        ↓
models / serviços (Postgres)
        ↓
view (monta o HTML com os dados)
        ↓
resposta Content-Type: text/html
```

Isso significa que tudo que já existe no backend para proteger e preparar uma requisição de API passa a valer também para a página: middleware de cookie, middleware de autenticação, consultas ao banco, regras de negócio.

3.4 - Exemplo: a Tela de Login com Middleware de Sessão

Até agora, o login era o arquivo estático `login.html`. O Nginx o entregava para qualquer pessoa, e quem decidia se o usuário já estava logado era o JavaScript do próprio navegador: o `login.ts` chamava `checkAuthentication()` (uma requisição para `/users/me`) e, se o token fosse válido, redirecionava para as tarefas. Tudo isso acontecia depois que a página já tinha chegado. Com conteúdo estático não havia outra opção: o Nginx não sabe o que é um JWT.

Com View, essa decisão passa para o servidor, **antes de o HTML existir**. Um middleware de página lê o cookie `auth_token`: se o token é válido, o usuário já está logado e é redirecionado para as tarefas; se não há cookie, ou o token é inválido ou expirou, a requisição segue para o controller, que mostra o login.

Arquivo `app/Http/Middlewares/RedirectIfAuthenticatedMiddleware.js`:

```javascript
import jwt from "jsonwebtoken";

export default function RedirectIfAuthenticatedMiddleware(request, response, next) {
    const token = request.cookies.auth_token;

    if (!token) {
        return next();
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return next();
    }

    return response.redirect("/tasks.html");
}
```

O controller só manda renderizar a view:

```javascript
export default function LoginViewController(request, response) {
    return response.status(200).render("login");
}
```

E a rota da página usa o middleware exatamente como uma rota de API usa:

```javascript
router.get("/login", RedirectIfAuthenticatedMiddleware, LoginViewController);
```

O caminho de uma requisição `GET /login` passa a ser: `ParseCookiesMiddleware` → `RedirectIfAuthenticatedMiddleware` → `LoginViewController` → view `login.ejs`. Quem já tem sessão recebe um 302 para `/tasks.html` e nenhum byte do formulário de login.

O mesmo raciocínio protege uma página privada, no sentido inverso: um middleware que, sem token válido, redireciona para `/login` em vez de responder 401 com JSON, como a API faz:

```javascript
export default function WebAuthMiddleware(request, response, next) {
    const token = request.cookies.auth_token;

    if (!token) {
        return response.redirect("/login");
    }

    try {
        request.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return response.redirect("/login");
    }

    return next();
}
```

3.5 - Cuidado com o try_files do Nginx

O Nginx continua na frente de tudo. A regra `try_files $uri.html $uri $uri/ @node` procura primeiro um arquivo estático. Se existir um `login.html` na pasta `public/`, o Nginx entrega esse arquivo em `/login` e a requisição nunca chega ao Node. Por isso, ao transformar o login em View, o `login.html` saiu do projeto e da lista de entradas do Vite. Regra geral: **uma rota de View não pode ter um arquivo estático com o mesmo nome.** Os assets (CSS, JS compilado pelo Vite, imagens) continuam estáticos e servidos pelo Nginx: a View gera só o HTML inicial e referencia esses arquivos.

3.6 - Uma Pasta Só: resources, public e views

A separação entre `backend/` e `frontend/` dentro de `src/` deixou de fazer sentido: a View é HTML gerado pelo servidor, mas é frontend. A partir desta aula, tudo fica na raiz de `src/`:

```text
src/
├── app/            Controllers, Middlewares, Models, Commands
├── bootstrap/  database/  routes/  utils/  docs/  storage/
├── resources/      fonte do frontend: HTML, TypeScript, CSS, imagens
│   └── views/      templates EJS, o HTML montado pelo servidor
├── public/         saída compilada pelo Vite (servida pelo Nginx)
├── _web.js  _command.js
└── vite.config.js  tsconfig.json  package.json
```

É a mesma ideia da Aula 05, `resources/` (fonte) e `public/` (compilado), agora na raiz. As views ficam dentro de `resources/`, junto com o resto do frontend.

4 - EJS: Facilitando a Escrita de Views

4.1 - O Que É e Como Instalar

Escrever HTML dentro de template string é exatamente o que tornou o controller da seção 3.1 ilegível. Um template engine resolve isso: escrevemos um arquivo que é praticamente HTML, com marcações especiais onde entram os dados. O EJS (Embedded JavaScript) é um dos mais simples do ecossistema Node, porque dentro das marcações se escreve JavaScript comum.

Instalação, como qualquer lib do Node:

```bash
npm install ejs
```

Configuração no Express, no arquivo que cria a aplicação (`_web.js`):

```javascript
const web = express();

web.set("view engine", "ejs");
web.set("views", path.join(CONSTANTS.DIR, "resources", "views"));
```

A primeira linha diz que, ao chamar `response.render`("login"), o Express deve procurar `login.ejs`. A segunda diz em qual pasta: `src/resources/views` (CONSTANTS.DIR é a raiz do projeto).

Atenção no Docker: o `node_modules` dos containers fica em um volume nomeado, criado uma única vez. Uma dependência nova (como o ejs) não aparece no container só com rebuild da imagem; é preciso recriar o volume:

```bash
docker compose down
docker volume rm fe-2026_nodemodules-volume
docker compose up -d --build
```

4.2 - As Marcações do EJS

- `<%= valor %>` → imprime o valor escapado: caracteres como `<` e `>` viram `&lt;` e `&gt;`, então um nome de tarefa com `<script>` aparece como texto e não executa;
- `<%- valor %>` → imprime o valor sem escapar: usado para incluir HTML confiável, como outras views;
- `<% código %>` → executa JavaScript sem imprimir nada: `if`, laços, variáveis;
- `<%# comentário %>` → comentário da view: não aparece no HTML entregue ao navegador (e não pode conter outra tag `<%` dentro).

4.3 - Hello World

A primeira View do projeto, na rota `GET /hello`. O controller não monta HTML, só decide os dados:

```javascript
export default function HelloWorldController(request, response) {
    let nome = "mundo";

    if (request.query.nome) {
        nome = request.query.nome;
    }

    return response.status(200).render("hello", {
        nome: nome,
        agora: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    });
}
```

Arquivo `resources/views/hello.ejs`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Hello World - View</title>
</head>
<body>
    <h1>Olá, <%= nome %>!</h1>
    <p>Este HTML não existe em disco: o servidor montou agora, às <%= agora %>.</p>
</body>
</html>
```

Acessando `/hello?nome=Luan`, o navegador recebe "Olá, Luan!" com a hora do servidor. Acessando `/hello?nome=<script>alert(1)</script>`, o `<%= %>` escapa o valor e a página mostra o texto `&lt;script&gt;`, sem executar nada. Esse escape é assunto da próxima aula, de Segurança.

4.4 - Carregando o CSS e o JS Compilados: o Helper vite()

A View é HTML do servidor, mas precisa do CSS e do JS do frontend, que o Vite compila com um hash no nome do arquivo (`src/app.aQR1sM3P.js`), para que o navegador nunca use uma versão velha em cache. A View não tem como adivinhar esse nome.

A solução já estava pronta desde a Aula 05: com `build.manifest`: true, o Vite grava em `public/.vite/manifest.json` um mapa do arquivo fonte para o compilado:

```json
"js/app.ts": {
  "file": "src/app.aQR1sM3P.js",
  "isEntry": true
}
```

O helper `utils/vite.js` lê esse manifest e devolve as tags prontas. Ele é registrado uma vez no `_web.js` e fica disponível em todas as views:

```javascript
web.locals.vite = vite;
```

Na view:

```html
<%- vite(["css/app.css", "js/app.ts"]) %>
```

vira:

```html
<link rel="stylesheet" href="/src/app.Bg3PD_Gv.css">
<script type="module" src="/src/app.aQR1sM3P.js"></script>
```

Para isso, `css/app.css` e `js/app.ts` entram como entradas avulsas no `rollupOptions`.input do `vite.config.js`. Aqui se usa `<%- %>`, sem escape, porque o HTML gerado pelo helper é confiável.

4.5 - A View de Login

O formulário de login era montado pelo `loginRender.ts`, criando elemento por elemento com document.`createElement`. Agora ele vem pronto do servidor, como HTML comum, em `resources/views/login.ejs` (trecho):

```html
<head>
    <title>Login - Tasks</title>
    <%- vite(["css/app.css", "js/app.ts", "js/pages/login.ts"]) %>
</head>
<body>
    <form id="login-form" class="d-flex flex-column gap-3">
        <h2 class="text-center mb-4">Login</h2>

        <label for="email-input" class="form-label">Email</label>
        <input id="email-input" type="email" class="form-control" required>

        <label for="password-input" class="form-label">Senha</label>
        <input id="password-input" type="password" class="form-control" required>

        <button type="submit" class="btn btn-primary btn-lg mt-3">Entrar</button>

        <div id="login-message" class="alert alert-danger d-none"></div>
    </form>
</body>
```

O `loginRender.ts` foi apagado, e o `login.ts` ficou só com os listeners, que continuam encontrando o formulário pelos mesmos ids:

```typescript
import loginListeners from "../listeners/loginListeners";

window.addEventListener("DOMContentLoaded", async () => {
  await loginListeners();
});
```

A divisão de responsabilidades ficou assim: o servidor decide se mostra o login (middleware) e monta o HTML (view); o navegador cuida da interação (listener do submit, chamada ao `/api/login` com Axios, mensagem de erro).

4.6 - Partials: Reaproveitando Pedaços

O `include()` permite quebrar a página em pedaços reutilizáveis. Um cabeçalho que se repete em várias páginas vira um arquivo só, `resources/views/partials/header.ejs`:

```html
<header>
    <span>Olá, <%= user.name %></span>
    <a href="/logout">Sair</a>
</header>
```

E é incluído em qualquer view, recebendo os dados que precisa:

```html
<%- include("partials/header", { user: user }) %>
```

Uma página de tarefas montada no servidor usaria o partial, um laço e uma condição, sempre sem else:

```html
<% if (tasks.length === 0) { %>
    <p>Nenhuma tarefa cadastrada.</p>
<% } %>

<ul>
    <% for (const task of tasks) { %>
        <li class="<%= task.is_done ? 'done' : '' %>"><%= task.name %></li>
    <% } %>
</ul>
```

A lógica de apresentação (laço, condição, classe CSS) fica na View; a lógica HTTP (quem é o usuário, quais tarefas buscar) fica no controller.

5 - Elasticsearch: um Banco de Dados Para Buscar

5.1 - O Problema: Filtros Complexos por N Campos

Pense em uma tela de busca de tarefas com vários filtros ao mesmo tempo: texto livre no nome, situação (concluída ou não), dono, intervalo de datas, ordenação por relevância. Em SQL, isso vira algo assim:

```sql
SELECT * FROM tasks
WHERE id_user = 7
  AND is_done = false
  AND created_at >= '2026-10-01'
  AND name ILIKE '%relatorio%'
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;
```

Com poucos dados, o Postgres resolve isso sem esforço. Com milhões de linhas, alguns problemas aparecem:

- O `ILIKE '%texto%'` não usa índice comum: o banco precisa ler linha por linha;
- Cada combinação de filtros pede um índice diferente, e não dá para criar índice para todas as combinações;
- **Não existe relevância:** o SQL sabe dizer se a linha bate ou não, mas não qual bate melhor;
- **Não entende linguagem:** "relatório", "relatorio" e "relatórios" são textos diferentes para o `ILIKE`.

E isso acontece na camada de API, no protocolo HTTP, que foi o centro do ano inteiro nas duas matérias: cada requisição de busca segura uma conexão com o banco que também está atendendo todas as gravações do sistema.

5.2 - O Que É o Elasticsearch

O Elasticsearch é um banco de dados otimizado para busca. Ele guarda documentos em JSON, organizados em índices:

- Índice → parecido com uma tabela (ex.: tasks);
- Documento → parecido com uma linha, mas em JSON;
- `_id` → o identificador do documento. Vamos usar o mesmo id da chave primária do Postgres.

A diferença está em como ele organiza os dados por dentro. Para campos de texto, ele monta um índice invertido: em vez de guardar "a tarefa 42 tem o nome Entregar relatório", ele guarda "a palavra relatorio aparece nas tarefas 42, 57 e 90". Antes disso, ele normaliza o texto (minúsculas, acentos, plurais, dependendo da configuração). Buscar por uma palavra vira consultar uma lista pronta, e combinar vários campos vira cruzar listas. Por isso filtros por N campos, que custam caro no banco relacional, são o caso comum no Elasticsearch, e cada resultado vem com uma nota de relevância (score).

5.3 - Busca Vetorial, em Poucas Palavras

O Elasticsearch também faz busca vetorial. A ideia, de forma bem simples: um modelo de IA transforma um texto em um vetor, uma lista de números que representa o significado daquele texto. Textos com significados parecidos geram vetores próximos. A busca vetorial procura os documentos cujos vetores estão mais perto do vetor da pergunta. Assim, buscar por "pagar boleto" pode encontrar uma tarefa chamada "quitar conta de luz", mesmo sem nenhuma palavra em comum. É a base das buscas semânticas e de boa parte das aplicações com IA. Nesta aula vamos usar a busca tradicional por campos; a vetorial fica como conceito.

5.4 - Mais um Container

Do ponto de vista da infraestrutura, não há nada de novo: o Elasticsearch é um servidor como o Postgres e o Nginx, que roda em um container, fala TCP/IP, tem porta e host. A porta padrão é a 9200, e a comunicação com ele é por uma API REST com JSON, o mesmo HTTP que usamos o ano todo.

A diferença está em quem pode falar com ele. **O Elasticsearch não tem porta exposta**: o docker-compose não tem o bloco ports nesse container, então nenhuma porta da máquina hospedeira aponta para ele. Ele só é acessível dentro da rede interna do Docker (app-network), pelo host `elasticsearch_host` na porta 9200, e só dois containers precisam falar com ele: o servidor web (nodeweb), que faz a busca, e o worker, que alimenta o índice. **O navegador e qualquer outra máquina de fora nunca falam direto com o Elasticsearch**: toda busca passa pela API, pelos middlewares e controllers, e volta pelo Postgres. É o mesmo princípio de não expor um banco de dados para a internet, e é o que torna aceitável, em ambiente local, subir o Elasticsearch sem usuário e senha.

```yaml
elasticsearch-container:
  image: elasticsearch:9.5.5
  restart: unless-stopped
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
    - ES_JAVA_OPTS=-Xms512m -Xmx512m
  # sem "ports": só a rede interna (app-network) alcança o Elasticsearch
  volumes:
    - elastic-volume:/usr/share/elasticsearch/data
  networks:
    app-network:
      aliases:
        - elasticsearch_host
```

- `discovery.type=single-node` → um nó só, sem cluster (desenvolvimento);
- `xpack.security.enabled=false` → sem usuário e senha nem HTTPS, apenas para ambiente local, e só porque o container não tem porta exposta;
- `ES_JAVA_OPTS` → limita a memória da JVM, porque o Elasticsearch é escrito em Java e por padrão tenta usar bastante memória.

Como não há porta exposta, um curl http://localhost:9200 na máquina hospedeira não responde. Para testar, o curl precisa partir de dentro da rede interna, por exemplo de dentro do container do servidor web:

```bash
docker compose exec nodeweb-container curl http://elasticsearch_host:9200
```

A resposta é um JSON com o nome do nó e a versão. No .env, `ELASTIC_HOST`=`elasticsearch_host` e `ELASTIC_PORT`=9200 são o endereço interno usado pelo servidor web e pelo worker.

6 - A Busca em Duas Etapas

6.1 - O Postgres Continua Sendo a Fonte da Verdade

O Elasticsearch não substitui o Postgres. O Postgres continua sendo a fonte da verdade: é nele que os dados são gravados primeiro, com transação, chave estrangeira e integridade. O Elasticsearch guarda uma cópia, organizada para busca. Essa cópia pode estar atrasada (veremos por quê na seção 8), então a busca é feita em duas etapas.

6.2 - Etapa 1: a Query Complexa no Elasticsearch

A busca com todos os filtros vai para o Elasticsearch, e ele devolve só os ids que satisfazem a consulta, já ordenados por relevância. O "`_source`": false pede para não trazer o documento, apenas os ids:

```http
POST /tasks/_search
{
  "_source": false,
  "size": 20,
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "relatorio" } }
      ],
      "filter": [
        { "term": { "id_user": 7 } },
        { "term": { "is_done": false } },
        { "range": { "created_at": { "gte": "2026-10-01" } } }
      ]
    }
  }
}
```

Resposta (resumida):

```json
{
  "hits": {
    "total": { "value": 3 },
    "hits": [
      { "_id": "57", "_score": 2.1 },
      { "_id": "42", "_score": 1.8 },
      { "_id": "90", "_score": 0.9 }
    ]
  }
}
```

No bool, o must é a parte que conta para a relevância (busca textual), e o filter são condições exatas, que só incluem ou excluem documentos.

6.3 - Etapa 2: WHERE IN de Volta no Postgres

Com os ids em mãos, a consulta no Postgres é a mais simples e rápida que existe, pela chave primária:

```sql
SELECT * FROM tasks WHERE id IN (57, 42, 90);
```

Com Sequelize, passar um array no where já gera o IN:

```javascript
const tasks = await TaskModel.findAll({
    where: { id: ids }
});
```

O `WHERE IN` não garante a ordem da lista. Como a ordem de relevância veio do Elasticsearch, é preciso reordenar o resultado pelos ids recebidos:

```javascript
const tasksById = new Map(tasks.map((task) => [task.id, task]));

const ordered = ids
    .map((id) => tasksById.get(id))
    .filter((task) => task !== undefined);
```

O controller de busca completo, falando com o Elasticsearch pela API REST via Axios:

```javascript
import axios from "axios";
import TaskModel from "../../../Models/TaskModel.js";

const elastic = axios.create({
    baseURL: `http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}`
});

export default async function SearchTaskController(request, response) {
    const idUser = request.user.id;
    const { q, is_done } = request.query;

    const must = [];
    const filter = [{ term: { id_user: idUser } }];

    if (q) {
        must.push({ match: { name: q } });
    }

    if (is_done !== undefined) {
        filter.push({ term: { is_done: is_done === "true" } });
    }

    // Etapa 1: busca complexa no Elasticsearch, só os ids
    const { data } = await elastic.post("/tasks/_search", {
        _source: false,
        size: 20,
        query: { bool: { must: must, filter: filter } }
    });

    const ids = data.hits.hits.map((hit) => Number(hit._id));

    if (ids.length === 0) {
        return response.status(200).json([]);
    }

    // Etapa 2: WHERE IN pela chave primária, na fonte da verdade
    const tasks = await TaskModel.findAll({
        where: { id: ids, id_user: idUser }
    });

    const tasksById = new Map(tasks.map((task) => [task.id, task]));

    const ordered = ids
        .map((id) => tasksById.get(id))
        .filter((task) => task !== undefined);

    return response.status(200).json(ordered);
}
```

6.4 - Por Que os Dados Voltam Sempre Íntegros

**Este é o ponto mais importante da segunda parte da aula.** O Elasticsearch decide quais registros entram no resultado e em que ordem. Mas o que o usuário vê, cada campo de cada tarefa, sempre vem do Postgres, no momento da requisição. Isso protege a resposta das três situações em que a cópia do Elasticsearch está atrasada:

- **Tarefa excluída no Postgres, mas ainda no Elasticsearch:** o id volta na etapa 1, mas o `WHERE IN` não encontra a linha, e ela simplesmente não aparece. O usuário nunca vê um registro que não existe mais;
- **Tarefa alterada no Postgres, mas com a versão antiga no Elasticsearch:** o `WHERE IN` traz a versão atual. O usuário vê o nome novo, nunca o antigo;
- **Tarefa recém-criada, ainda não indexada:** ela não aparece na busca por alguns milissegundos e aparece na próxima.

Ou seja: **a busca pode ficar levemente desatualizada, mas o dado nunca fica errado.**

7 - Alimentando o Elasticsearch: a API REST

Toda operação no Elasticsearch é uma requisição HTTP com JSON. Os exemplos abaixo mostram o verbo e o caminho; no código, viram chamadas Axios para `http://elasticsearch_host:9200`.

7.1 - Criando o Índice (Mapping)

O mapping diz o tipo de cada campo, como o CREATE TABLE do SQL. É ele que define se o campo é texto analisado (busca por palavras) ou valor exato (filtro):

```http
PUT /tasks
{
  "mappings": {
    "properties": {
      "name":       { "type": "text" },
      "is_done":    { "type": "boolean" },
      "id_user":    { "type": "integer" },
      "created_at": { "type": "date" }
    }
  }
}
```

Só os campos usados na busca precisam ir para o Elasticsearch. Ele não precisa ter tudo que o Postgres tem, porque o dado completo sempre volta do Postgres.

7.2 - Inserir e Atualizar: Upsert

O PUT em `/indice/_doc/id` cria o documento se ele não existe e o substitui inteiro se já existe. É um upsert, e por isso a mesma chamada serve para inserir e para atualizar:

```http
PUT /tasks/_doc/42
{
  "name": "Entregar relatório",
  "is_done": false,
  "id_user": 7,
  "created_at": "2026-10-19T19:00:00Z"
}
```

A resposta informa o que aconteceu: "result": "created" na primeira vez, "result": "updated" nas seguintes. Para atualizar só alguns campos, existe o `_update`:

```http
POST /tasks/_update/42
{
  "doc": { "is_done": true },
  "doc_as_upsert": true
}
```

7.3 - Excluir

```http
DELETE /tasks/_doc/42
```

Se o documento não existir, o Elasticsearch responde 404 com "result": "`not_found`". Para a sincronização isso não é erro: o objetivo era que o documento não existisse, e ele não existe.

7.4 - Ler

Um documento pelo id:

```http
GET /tasks/_doc/42
```

E a busca com queries complexas, pelo `_search`, como na seção 6.2. Os blocos mais usados dentro do bool:

- `match` → busca textual em campo text, com relevância;
- `term` → valor exato (id, booleano, status);
- `terms` → valor exato dentro de uma lista;
- `range` → intervalo (gte, lte) para números e datas.

7.5 - Carga Inicial: _bulk

As tarefas que já existem no Postgres antes do Elasticsearch subir precisam ser indexadas uma vez. Para isso existe o `_bulk`, que recebe várias operações em uma requisição, no formato NDJSON (um JSON por linha: a ação e, em seguida, o documento):

```http
POST /_bulk
{ "index": { "_index": "tasks", "_id": "1" } }
{ "name": "Estudar EJS", "is_done": false, "id_user": 7, "created_at": "2026-10-10T10:00:00Z" }
{ "index": { "_index": "tasks", "_id": "2" } }
{ "name": "Subir o Elasticsearch", "is_done": true, "id_user": 7, "created_at": "2026-10-11T10:00:00Z" }
```

Esse é um bom candidato a comando (como os de migration e seed do projeto), executado uma vez ou sempre que for preciso reconstruir o índice.

8 - Sincronização Assíncrona: Filas, RabbitMQ e Worker

8.1 - Por Que Não Atualizar o Elasticsearch no Ciclo HTTP

A forma ingênua seria, no `CreateTaskController`, gravar no Postgres e logo em seguida chamar o PUT do Elasticsearch, antes de responder. Isso traz três problemas:

- **Latência:** o usuário espera duas gravações em dois bancos para receber o 201;
- **Acoplamento de falhas:** se o Elasticsearch estiver fora do ar, a criação da tarefa quebra, mesmo com o dado já salvo no Postgres, que é o que importa;
- **Dependência do processo HTTP:** a indexação fica presa à requisição. Com fila, a mensagem fica guardada no RabbitMQ; se o worker estiver parado, as mensagens se acumulam e são processadas quando ele voltar.

A indexação não é parte do que o usuário pediu. Ele pediu para criar a tarefa. Por isso ela sai do ciclo HTTP e vira um trabalho assíncrono, executado depois, por outro processo.

8.2 - Três Containers a Mais

É aqui que voltam os conceitos de Desenvolvimento Web do semestre passado:

- **RabbitMQ (conhecido):** o servidor de filas. O controller publica uma mensagem e segue a vida;
- **Worker (conhecido):** um processo Node separado, sem rota HTTP, que fica escutando a fila e executa os jobs;
- **Elasticsearch (novo):** o banco de busca, alimentado pelo worker.

No docker-compose, o RabbitMQ e o worker voltam exatamente como estavam no projeto de Desenvolvimento Web. O RabbitMQ usa a imagem com painel de gerenciamento:

```yaml
rabbitmq-container:
  image: rabbitmq:3.13.1-management-alpine
  ports:
    - "5672:5672"      # conexão com a fila (producers/consumers)
    - "15672:15672"    # painel de gerenciamento web
  environment:
    RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
    RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
  volumes:
    - rabbitmq-volume:/var/lib/rabbitmq
  networks:
    app-network:
      aliases:
        - rabbitmq_host
```

O worker é mais um entry point do mesmo código Node, ao lado do `_web.js` e do `_command.js`. O container dele roda o `_worker.js` em vez do servidor HTTP:

```yaml
nodeworker-container:
  build:
    context: .
    dockerfile: docker/node-worker/Dockerfile
  env_file:
    - .env
    - .env.docker
  depends_on:
    - postgres-container
    - rabbitmq-container
  environment:
    POSTGRES_HOST: postgres_host
    POSTGRES_PORT: 5432
    RABBITMQ_HOST: rabbitmq_host
    RABBITMQ_PORT: 5672
  networks:
    app-network:
      aliases:
        - nodeworker_host
```

O Dockerfile do worker termina com ENTRYPOINT ["nodemon", "`_worker.js`"]. O `_worker.js` carrega todos os jobs da pasta `app/Jobs`, conecta no RabbitMQ e fica consumindo a fila informada em --queue (sem o parâmetro, a fila default). Para cada mensagem, lê o nome do job e o payload e executa o handle correspondente:

```bash
node _worker.js --queue=default
```

O fluxo de uma criação de tarefa fica assim:

```text
POST /me/tasks
    ↓
controller grava no Postgres (fonte da verdade)
    ↓
controller publica o job na fila (RabbitMQ)
    ↓
controller responde 201 (sem esperar o Elasticsearch)

... milissegundos depois, em outro container ...

worker consome o job
    ↓
worker faz o upsert no Elasticsearch
```

8.3 - O Job de Sincronização

Os jobs seguem o padrão de Desenvolvimento Web: cada job é um arquivo em `app/Jobs`, exportado com `createJob`({ name, handle }). O `createJob` devolve o próprio job com o método dispatch(fila, payload), que publica no RabbitMQ a mensagem { job: name, payload }; o worker recebe essa mensagem e chama o handle(payload).

Arquivo `app/Jobs/SyncTaskSearchJob.js`. Um único job resolve inserção, atualização e exclusão: ele recebe só o id, busca a situação atual no Postgres e espelha no Elasticsearch:

```javascript
import axios from "axios";
import { createJob } from "../../utils/job.js";
import TaskModel from "../Models/TaskModel.js";

const elastic = axios.create({
    baseURL: `http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}`
});

export default createJob({
    name: "SyncTaskSearchJob",
    handle: async (payload) => {
        const { id } = payload;

        const task = await TaskModel.findByPk(id);

        // Não existe mais no Postgres: some do Elasticsearch também
        if (!task) {
            await elastic.delete(`/tasks/_doc/${id}`, {
                validateStatus: (status) => status === 200 || status === 404
            });

            return;
        }

        // Existe: upsert com o estado atual
        await elastic.put(`/tasks/_doc/${id}`, {
            name: task.name,
            is_done: task.is_done,
            id_user: task.id_user,
            created_at: task.created_at
        });
    }
});
```

Mandar só o id, e não os dados da tarefa, tem uma vantagem: se dois jobs da mesma tarefa forem processados fora de ordem, os dois leem o estado atual do Postgres e o Elasticsearch termina igual à fonte da verdade.

8.4 - Disparando o Job nos Controllers

Nos controllers de criação, atualização e exclusão, uma linha depois da gravação no Postgres. No `CreateTaskController`:

```javascript
import SyncTaskSearchJob from "../../../Jobs/SyncTaskSearchJob.js";

// ...

const task = await TaskModel.create({
    name: name,
    is_done: is_done || false,
    id_user: idUser
});

await SyncTaskSearchJob.dispatch("default", { id: task.id });

return response.status(201).json(task);
```

O dispatch só publica a mensagem na fila default e retorna. Quem fala com o Elasticsearch é o worker. No `UpdateTaskController` e no `DeleteTaskController` a chamada é a mesma, com o id da tarefa alterada ou excluída: no caso da exclusão, o job não encontra a tarefa no Postgres e remove o documento do Elasticsearch.

8.5 - Consistência Eventual: o Preço e a Garantia

Como a indexação é assíncrona, existe uma janela, normalmente de milissegundos, em que o Postgres e o Elasticsearch estão diferentes. Isso se chama **consistência eventual**: os dois bancos ficam iguais, mas não no mesmo instante. Além da fila, o próprio Elasticsearch é quase em tempo real: um documento gravado fica disponível para busca após o próximo refresh do índice, que por padrão acontece a cada segundo.

O preço dessa janela aparece na camada de busca e de agregação: a contagem de resultados pode estar uma unidade acima ou abaixo, uma tarefa que acabou de ser concluída ainda pode aparecer no filtro de pendentes, uma tarefa recém-criada ainda não aparece.

E a garantia vem da busca em duas etapas (seção 6.4): como os dados exibidos sempre voltam do Postgres pelo `WHERE IN`, o usuário nunca vê um dado errado ou um registro que não existe mais. **O Elasticsearch decide quem aparece; o Postgres decide o que aparece.** A integridade fica com quem sempre foi responsável por ela.

9 - Conclusão

Esta aula fechou dois ciclos.

1. Views: o HTML, que passou o bimestre inteiro como arquivo estático, também pode ser conteúdo dinâmico. Basta o `Content-Type` `text/html` para o navegador tratá-lo como se tivesse vindo do disco. Montar esse HTML no controller funciona, mas mistura responsabilidades; a View é a camada que isola a apresentação e completa o MVC (Model, View, Controller). Com isso, a página passa pelo ciclo de vida HTTP inteiro, e um middleware consegue decidir sobre a sessão antes que o HTML saia do servidor, como na tela de login, coisa impossível com estático. O EJS facilita escrever views com marcações simples e escape automático, e o helper `vite()` liga a View ao CSS e JS compilados pelo Vite via `manifest.json`. Para acomodar as views, o projeto deixou de separar `backend/` e `frontend/`: tudo fica na raiz de `src/`, com `resources/views` para os templates.

2. Elasticsearch: um banco de dados especializado em busca, para filtros complexos por N campos e relevância, e que também oferece busca vetorial. Ele não substitui o Postgres: a busca é feita em duas etapas, com a query complexa no Elasticsearch devolvendo ids e o `WHERE IN` pela chave primária no Postgres trazendo os dados íntegros. A alimentação é feita pela API REST (PUT para upsert, DELETE para excluir, `_search` para ler), sempre de forma assíncrona, por jobs publicados no RabbitMQ e executados pelo worker. A busca tem consistência eventual; os dados exibidos, não.

10 - Referências

Express: Using template engines with Express (https://expressjs.com/en/guide/using-template-engines.html).

EJS: documentação oficial (https://ejs.co).

MDN: `Content-Type` (https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type).

Elasticsearch Guide: Index API, Update API, Delete API, Search API, Bulk API, Query DSL (bool, match, term, range).

Elasticsearch Guide: Install Elasticsearch with Docker.

RabbitMQ: Tutorials, Work Queues (https://www.rabbitmq.com/tutorials).


Questões do TA:


QUESTÃO 1 

Sobre servir HTML de forma dinâmica pelo backend, é correto afirmar que:

A) O navegador só consegue montar o DOM a partir de arquivos .html lidos do disco pelo Nginx; HTML gerado pelo Node é exibido como texto puro.

B) Para o navegador entregar a página corretamente, o HTML dinâmico precisa ser convertido em JSON e montado depois via JavaScript.

C) O HTML é um texto como qualquer outro conteúdo; se o backend o devolver com o header `Content-Type: text/html`, o navegador o trata exatamente como trataria um arquivo estático.

D) Conteúdo dinâmico se limita a JSON; HTML, CSS, imagens e fontes só podem ser entregues como arquivos estáticos.

E) O header `Content-Type` é opcional e não influencia em como o navegador interpreta o corpo da resposta.

Gabarito: C

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 2

Sobre a camada de View no MVC, é correto afirmar que:

A) A View deve consultar o banco de dados diretamente, para que o controller fique responsável apenas pelas rotas.

B) Montar o HTML com template strings dentro do controller é a prática recomendada, pois mantém toda a lógica da página em um só lugar.

C) A View substitui os middlewares, já que a proteção de uma página passa a ser feita dentro do próprio template.

D) A View isola a formatação do HTML: o controller trata a requisição HTTP e busca os dados, e a View apenas transforma esses dados em HTML; assim, a página percorre o ciclo de vida HTTP e pode ser protegida por middleware antes de sair do servidor.

E) Com Views, os arquivos de CSS e JS deixam de poder ser servidos como estáticos pelo Nginx.

Gabarito: D

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 3

Sobre a busca em duas etapas com Elasticsearch e Postgres, é correto afirmar que:

A) O Elasticsearch executa a busca complexa e devolve os ids que satisfazem os filtros; esses ids voltam para o Postgres em um `WHERE IN` pela chave primária, de modo que os dados exibidos sempre vêm da fonte da verdade.

B) O Elasticsearch substitui o Postgres, passando a ser a fonte da verdade da aplicação.

C) O `WHERE IN` é usado no Elasticsearch, e a busca textual com relevância é feita no Postgres.

D) Como o Elasticsearch já devolve o documento completo, consultar o Postgres depois da busca é apenas redundância.

E) O `WHERE IN` preserva automaticamente a ordem de relevância calculada pelo Elasticsearch.

Gabarito: A

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 4

Sobre a sincronização entre Postgres e Elasticsearch, é correto afirmar que:

A) A atualização do Elasticsearch deve acontecer dentro do ciclo HTTP, antes da resposta, para garantir que a busca esteja sempre sincronizada no mesmo instante.

B) Com filas, a busca no Elasticsearch fica sempre igual ao Postgres, sem nenhum atraso.

C) O controller grava no Postgres e publica um job no RabbitMQ; o worker faz o upsert ou a exclusão no Elasticsearch de forma assíncrona. A busca pode ficar alguns milissegundos desatualizada, mas os dados continuam íntegros porque são lidos do Postgres via `WHERE IN`.

D) Se o Elasticsearch estiver fora do ar, a criação da tarefa deve falhar, já que os dois bancos precisam estar sempre iguais.

E) O worker é um endpoint HTTP que o navegador chama depois de criar a tarefa, para atualizar o Elasticsearch.

Gabarito: C

Misturar as alternativas? ( x) Sim (  ) Não
