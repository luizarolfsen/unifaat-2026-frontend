# Unifaat :: Frontend :: 2026.2

Repositório centralizado para todas as aulas do bimestre de Frontend. Aqui você encontra os slides, briefings e os projetos compartilhados de cada bimestre.

---

## 📚 Aulas do Bimestre

| Aula | Material |
|------|----------|
| **Aula 01** - Servidor de Arquivos Estáticos e DOM | [Acesso](./aulas/01/README.md) |
| **Aula 02** - CSS, Seletores e JS Reativo | [Acesso](./aulas/02/README.md) |
| **Aula 03** - Vite, Forms e Listeners | [Acesso](./aulas/03/README.md) |
| **Aula 04** - Navegadores Web e API | [Acesso](./aulas/04/README.md) |
| **Aula 05** - Pré Compiladores e Typescript | [Acesso](./aulas/05/README.md) |
| **Aula 06** - Revisão Geral | [Acesso](./aulas/06/README.md) |
| **Aula 07** - Views e Elasticsearch | [Briefing](./aulas/07/briefing.md) · [Raio-X do código](./aulas/07/raio-x/index.html) |

Documentação: [rede Docker do projeto](./aulas/rede-docker/index.html) (diagrama interativo dos containers, portas e volumes).

---

## Estrutura do Repositório

```
.
├── src/                      # Projeto compartilhado - Bimestre 01 (usado em TODAS as aulas)
│   ├── app/                  # Controllers, Middlewares, Models, Commands (Node/Express)
│   ├── bootstrap/ database/ routes/ utils/ docs/ storage/
│   ├── resources/            # Fonte do frontend (HTML, TS, CSS, img) — compilado pelo Vite
│   │   └── views/            # Views do servidor (EJS)
│   ├── public/               # Saída do Vite (gerada, não versionada)
│   ├── _web.js _command.js _worker.js   # Entry points do Node
│   ├── vite.config.js tsconfig.json nodemon.json
│   ├── docker/               # Configurações Docker
│   ├── package.json
│   └── readme.md             # Documentação detalhada do projeto
│
├── aulas/                     # Materiais de todas as aulas
│   └── 04/                    # Aula 04 - Navegadores Web e API
│       ├── slide/             # Slides em PDF
│       └── briefing.md        # Briefing da aula
│
├── docker/                    # Dockerfiles (raiz)
├── docker-compose.yml         # Orquestração dos containers
├── .env                       # Variáveis de ambiente (raiz)
├── .env.example               # Template de .env
├── .env.docker                # Variáveis do Docker
├── package.json               # Scripts auxiliares (raiz)
└── README.md                  # Este arquivo
```

---

## Como Usar

### 1. Clonar o Repositório

```sh
git clone https://github.com/luan-tavares/unifaat-2026-frontend.git
cd unifaat-2026-frontend
```

### 2. Configurar Variáveis de Ambiente

```sh
cp .env.example .env
```

Edite o `.env` na **raiz** e preencha as variáveis vazias:

```env
POSTGRES_HOST=localhost
POSTGRES_DB=unifaat
POSTGRES_PORT=6789
POSTGRES_USER=aluno                    # ← PREENCHER
POSTGRES_PASSWORD=123456               # ← PREENCHER

NGNIX_WEB_PORT=8080
NGINX_PORT=80
NODE_WEB_PORT=3000

RABBITMQ_USER=aluno                    # ← PREENCHER
RABBITMQ_PASSWORD=123456               # ← PREENCHER

JWT_SECRET=seu_segredo_super_seguro    # ← PREENCHER (mude em produção!)
```

> O usuário e a senha do RabbitMQ só são criados na **primeira** subida do container. Para trocar depois, apague o volume `rabbitmq-volume`.

### 3. Instalar dependências

```sh
npm i
```

### 4. Subir a aplicação com Docker

```sh
docker compose up -d --build
```

Sobem 8 containers: `nginx`, `nodeweb`, `nodeworker`, `nodevitehmr`, `nodevitecompiler`, `postgres`, `rabbitmq` e `elasticsearch`. Confira com `docker compose ps` e acompanhe os logs com `docker compose logs -f nodeweb-container nodeworker-container`:

- `Servidor node web rodando na porta 3000` ✅
- `Worker iniciado. Aguardando mensagens na fila: default` ✅

O Elasticsearch leva uns 20 a 40 segundos para ficar pronto na primeira subida.

### 5. Executar Migrations e Seed (pelo container de comandos)

```sh
docker compose run --rm nodecommand-container migrate
docker compose run --rm nodecommand-container seed
```

Você verá:
```
Executada: 001_create_users_table.js
Executada: 002_create_tasks_table.js
Executada: 003_add_profile_fields_to_users.js
✓ Usuários criados
✓ Tarefas criadas
✓ 40 usuários indexados no Elasticsearch
```

> Rode pelo `nodecommand-container`, não com `npm run migrate`/`npm run seed` no seu PC: o seed também popula o Elasticsearch, que **não tem porta no host** (só a rede interna do Docker alcança `elasticsearch_host:9200`).

Pronto! A aplicação está completamente configurada e rodando.

### Já tinha o projeto? Atualizando para a Aula 07

```sh
git pull

# 1) .env: acrescente NGINX_PORT=80, RABBITMQ_USER e RABBITMQ_PASSWORD (veja o passo 2)

# 2) Dependências novas (ejs, amqplib): o node_modules dos containers fica num volume
#    que só é criado uma vez. Recrie o volume:
docker compose down
docker volume rm "$(basename "$PWD")_nodemodules-volume"
docker compose up -d --build

# 3) Migration nova (campos de perfil em users) e seed (completa os perfis e popula o Elastic)
docker compose run --rm nodecommand-container migrate
docker compose run --rm nodecommand-container seed
```

> A pasta `src/` mudou de estrutura na Aula 07: não existem mais `src/backend/` e `src/frontend/`. Tudo fica na raiz de `src/` (`app/`, `routes/`, `resources/`, `public/`...). Se sobrar uma pasta `src/frontend/public` antiga, pode apagar.

---

## Acessar os Materiais das Aulas

Com o Docker em execução, você pode visualizar todos os slides e materiais das aulas em:

**`http://localhost:8080/aulas/`**

Você encontrará uma página com todas as aulas disponíveis, seus slides em PDF, briefings e materiais de apoio organizados de forma amigável para navegação.

---

## Como Fazer o Trabalho Final (TF)

**IMPORTANTE:** Para acessar a descrição completa do Trabalho Final (TF), você **DEVE**:

1. Entrar no diretório da aula em questão
   - Exemplo: `aulas/04/`
   
2. Abrir o arquivo **`README.md`** lá
   - Ele contém:
     - Descrição detalhada do TF
     - Arquivos que você precisa editar
     - Como rodar localmente
     - **Link para enviar sua solução**

**Prazo Aula 04 - Navegadores Web e API:** 21/09/2026T23:59:59

**Não confunda:** Este README aqui é para setup geral. O README dentro de cada aula (`aulas/04/README.md`, etc) é que tem a descrição do TF específico.

---

## Acessar a Aplicação

Com o Docker rodando, você pode acessar:

| Recurso | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | `http://localhost:8080` | Páginas estáticas e views (login em `/login`) |
| **API** | `http://localhost:8080/users` | API REST (o nginx encaminha para o Node) |
| **API Docs** | `http://localhost:8080/docs` | Documentação Swagger, incluindo `POST /users/search` |
| **Vite Dev (HMR)** | `http://localhost:5172` | Frontend em desenvolvimento com hot reload |
| **RabbitMQ** | `http://localhost:15672` | Painel das filas (usuário e senha do `.env`) |
| **Aulas e Materiais** | `http://localhost:8080/aulas/` | Todos os slides e materiais das aulas |
| **Rede Docker** | `http://localhost:8080/aulas/rede-docker/` | Diagrama interativo dos containers |

---

## Projeto Compartilhado do Bimestre 01 (src/)

O `src/` é o projeto base do **primeiro bimestre** que evolui ao longo das aulas. Ele contém:

- **Backend**: API Node.js com Express e PostgreSQL, views EJS, busca com Elasticsearch e jobs em fila (RabbitMQ + worker)
- **Frontend**: HTML + TypeScript compilados pelo Vite (`src/resources` → `src/public`)
- **Docker**: NGINX, Node.js (web, worker e comandos), PostgreSQL, RabbitMQ, Elasticsearch e Vite (HMR e compilador)

**Acesso às aplicações:**
- Frontend estático: `http://localhost:8080`
- Vite Dev (HMR): `http://localhost:5172`
- API Node.js: `nodeweb_host:3000` (só na rede interna; de fora, pelo nginx em `http://localhost:8080`)
- PostgreSQL: `localhost:6789`
- RabbitMQ: `localhost:5672` (AMQP) e `http://localhost:15672` (painel)
- Elasticsearch: sem porta no host (`elasticsearch_host:9200`, só na rede interna)

---

## Containers Docker

### Containers de Infraestrutura

| Container               | Imagem Base          | Função                                                      | Porta Interna |
|-------------------------|-----------------------|--------------------------------------------------------------|---------------|
| `nginx-container`       | `nginx:1.25-alpine`  | Servir arquivos estáticos HTTP (reverse proxy).               | 80            |
| `nodeweb-container`     | `node:25`             | Rodar a API/aplicação Node (servida via `nodemon _web.js`).   | 3000          |
| `nodecommand-container` | `node:25`             | Rodar comandos CLI avulsos (`migrate`, `seed`) via `_command.js`. | —          |
| `nodevitehmr-container` | `node:25`             | Servir o frontend via Vite HMR                                | 5172          |
| `nodevitecompiler-container` | `node:24`        | Pré-compilar o frontend (`vite build --watch`): TypeScript, Bootstrap, Axios e FontAwesome viram JS/CSS puro em `public/`. | —          |
| `postgres-container`    | `postgres:18`         | Banco de dados PostgreSQL da aplicação.                       | 5432          |
| `elasticsearch-container` | `elasticsearch:9.5.5` | Banco de busca. Sem porta exposta: só a rede interna (`elasticsearch_host:9200`) acessa. | 9200 |
| `rabbitmq-container`    | `rabbitmq:3.13.1-management-alpine` | Fila de mensagens (jobs). Painel web em http://localhost:15672. | 5672 / 15672 |
| `nodeworker-container`  | `node:25`             | Worker: consome a fila e executa os jobs de `app/Jobs` (`nodemon _worker.js`). | — |

### Volumes Persistentes

| Volume                              | Utilizado por             | Finalidade                                                              |
|--------------------------------------|---------------------------|--------------------------------------------------------------------------|
| `public-volume:/var/www`            | `nginx-container`         | Disponibilizar os arquivos estáticos compilados do frontend (`public/`).  |
| `./aulas:/var/www/aulas`            | `nginx-container`         | Disponibilizar materiais das aulas (slides, PDFs, etc).                 |
| `./src/logs/nginx:/var/log/nginx`   | `nginx-container`         | Persistir os logs do NGINX fora do container.                            |
| `./src:/app`                        | `nodeweb-container`, `nodecommand-container`, `nodeworker-container` | Disponibilizar o código do projeto (`src/`) dentro do container. |
| `public-volume:/app/public`         | `nodeweb-container`       | Ler os arquivos compilados do frontend (mesmo volume do NGINX).          |
| `./src/resources:/app/resources`    | `nodevitehmr-container`, `nodevitecompiler-container` | Código-fonte que o Vite serve (HMR) e compila (`vite build --watch`). |
| `public-volume:/app/public`         | `nodevitecompiler-container` | Escrever o resultado da compilação (mesmo volume do NGINX e do Node web). |
| `nodemodules-volume:/app/node_modules` | node containers       | Isolar o `node_modules` instalado em build-time.                        |
| `postgres-volume:/var/lib/postgresql` | `postgres-container`    | Persistir os dados do banco entre reinicializações.                      |
| `elastic-volume:/usr/share/elasticsearch/data` | `elasticsearch-container` | Persistir os índices do Elasticsearch.                     |
| `rabbitmq-volume:/var/lib/rabbitmq` | `rabbitmq-container`  | Persistir filas e usuário do RabbitMQ.                                   |

### Redes

Todos os containers estão conectados à rede Docker personalizada `app-network`. Dentro dela, cada container é encontrado pelo alias (`nodeweb_host`, `postgres_host`, `rabbitmq_host`, `elasticsearch_host`...).

### Portas Expostas Externamente

| Serviço     | Porta Interna | Porta Externa | Acesso Externo        |
|-------------|---------------|---------------|-----------------------|
| NGINX       | 80            | **8080**      | http://localhost:8080 |
| VITE HMR    | 5172          | **5172**      | http://localhost:5172 |
| PostgreSQL  | 5432          | **6789**      | localhost:6789        |
| RabbitMQ    | 5672          | **5672**      | localhost:5672 (AMQP) |
| RabbitMQ    | 15672         | **15672**     | http://localhost:15672 (painel) |
| Elasticsearch | 9200        | —             | nenhum: só a rede interna |

---

## Comandos Comuns

```sh
# Instalar dependências
npm run i

# Subir a aplicação
docker compose up --build

# Rodar migrations pendentes
docker compose run --rm nodecommand-container migrate

# Popular banco (e o índice do Elasticsearch) com dados iniciais
docker compose run --rm nodecommand-container seed

# Disparar um job de exemplo na fila (o worker executa)
docker compose run --rm nodecommand-container create-example-job

# Testar o Elasticsearch de dentro da rede (ele não tem porta no host)
docker compose exec nodeweb-container curl http://elasticsearch_host:9200

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um container específico
docker compose logs nodeweb-container

# Parar containers (sem remover)
docker compose stop

# Remover containers
docker compose down

# Remover tudo (containers + volumes)
docker compose down -v

# Rodar servidor web local
npm run web

# Rodar com nodemon (desenvolvimento)
npm run dev
```

---

## Dicas Úteis

- Sempre faça as alterações em `src/` — é o projeto compartilhado
- Cada aula tem seus próprios tópicos listados em `aulas/[numero]/briefing.md`
- Os slides estão em PDF em `aulas/[numero]/slide/`
- Mantenha o `.env` atualizado e **nunca** commite variáveis sensíveis
- Todos os comandos npm rodam da raiz do repositório
- Código do servidor (Node): `src/app/`, `src/routes/`, `src/database/`...
- Código do frontend: `src/resources/` (o Vite compila para `src/public/`, nunca edite `public/` à mão)
- Views do servidor (EJS): `src/resources/views/`

---

## Referências

- [Documentação completa do Projeto (src/)](./src/readme.md)
- [Briefing Aula 04](./aulas/04/briefing.md)

---

Desenvolvido por **Luan Tavares** para UNIFAAT
