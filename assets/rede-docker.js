/* Diagrama interativo da rede Docker (aulas/rede-docker).
   Os itens são elementos HTML posicionados no palco; as setas são desenhadas
   num SVG por cima, a partir da posição real de cada elemento (recalculadas
   quando o tamanho muda). Sem else: early return / continue. */
(function(){
  var W = 1800;
  var stage = document.getElementById('stage');
  var svg = document.getElementById('wires');
  var NS = 'http://www.w3.org/2000/svg';

  var items = {};
  Array.prototype.forEach.call(stage.querySelectorAll('.item'), function(el){
    items[el.dataset.id] = el;
  });

  /* badges "origem:destino" das pastas montadas, dentro dos containers */
  var badges = {};
  Array.prototype.forEach.call(stage.querySelectorAll('[data-mb]'), function(el){
    badges[el.dataset.mb] = el;
  });

  /* ── conexões ─────────────────────────────────────────────
     kind: port (host → porta publicada → container), net (rede interna),
           vol (montagem de volume/pasta)
     flow (só nas montagens): in = o container lê da pasta/volume,
           out = o container escreve nela, both = lê e escreve
     points: pontos intermediários no sistema 1800 × 1160 (setas com cotovelo) */
  var EDGES = [
    { id: 'b-8080', from: 'browser', to: 'p8080', kind: 'port' },
    { id: '8080-nginx', from: 'p8080', to: 'nginx', kind: 'port' },
    { id: 'b-5172', from: 'browser', to: 'p5172', kind: 'port', points: [[78, 795]] },
    { id: '5172-hmr', from: 'p5172', to: 'vitehmr', kind: 'port' },
    { id: 'b-15672', from: 'browser', to: 'p15672', kind: 'port', points: [[78, 120], [1030, 120]] },
    { id: '15672-rabbit', from: 'p15672', to: 'rabbitmq', kind: 'port' },
    { id: 'tools-5672', from: 'tools', to: 'p5672', kind: 'port' },
    { id: '5672-rabbit', from: 'p5672', to: 'rabbitmq', kind: 'port' },
    { id: 'tools-6789', from: 'tools', to: 'p6789', kind: 'port' },
    { id: '6789-pg', from: 'p6789', to: 'postgres', kind: 'port' },

    { id: 'nginx-web', from: 'nginx', to: 'nodeweb', kind: 'net', points: [[1040, 465]] },
    { id: 'web-rabbit', from: 'nodeweb', to: 'rabbitmq', kind: 'net', points: [[1110, 640], [1110, 430]] },
    { id: 'web-pg', from: 'nodeweb', to: 'postgres', kind: 'net' },
    { id: 'web-es', from: 'nodeweb', to: 'elasticsearch', kind: 'net' },
    { id: 'cmd-rabbit', from: 'nodecommand', to: 'rabbitmq', kind: 'net' },
    { id: 'cmd-pg', from: 'nodecommand', to: 'postgres', kind: 'net' },
    { id: 'cmd-es', from: 'nodecommand', to: 'elasticsearch', kind: 'net' },
    { id: 'worker-rabbit', from: 'nodeworker', to: 'rabbitmq', kind: 'net' },
    { id: 'worker-pg', from: 'nodeworker', to: 'postgres', kind: 'net' },
    { id: 'worker-es', from: 'nodeworker', to: 'elasticsearch', kind: 'net' },


    { id: 'm-nginx-public', from: 'nginx', to: 'v-public', kind: 'vol', flow: 'in', src: 'mb-nginx-public' },
    { id: 'm-nginx-aulas', from: 'nginx', to: 'b-aulas', kind: 'vol', flow: 'in' , anchor: 'mb-nginx-aulas' },
    { id: 'm-nginx-logs', from: 'nginx', to: 'b-logs', kind: 'vol', flow: 'out' , anchor: 'mb-nginx-logs' },
    { id: 'm-compiler-public', from: 'vitecompiler', to: 'v-public', kind: 'vol', flow: 'out', src: 'mb-compiler-public' },
    { id: 'm-compiler-resources', from: 'vitecompiler', to: 'b-resources', kind: 'vol', flow: 'in' , anchor: 'mb-compiler-resources' },
    { id: 'm-compiler-nm', from: 'vitecompiler', to: 'v-nodemodules', kind: 'vol', flow: 'in', src: 'mb-compiler-nm' },
    { id: 'm-hmr-resources', from: 'vitehmr', to: 'b-resources', kind: 'vol', flow: 'in' , anchor: 'mb-hmr-resources' },
    { id: 'm-hmr-nm', from: 'vitehmr', to: 'v-nodemodules', kind: 'vol', flow: 'in', src: 'mb-hmr-nm' },
    { id: 'm-web-src', from: 'nodeweb', to: 'b-src', kind: 'vol', flow: 'in' , anchor: 'mb-web-src' },
    { id: 'm-web-public', from: 'nodeweb', to: 'v-public', kind: 'vol', flow: 'in', points: [[930, 925]], src: 'mb-web-public' },
    { id: 'm-web-nm', from: 'nodeweb', to: 'v-nodemodules', kind: 'vol', flow: 'in', src: 'mb-web-nm' },
    { id: 'm-cmd-src', from: 'nodecommand', to: 'b-src', kind: 'vol', flow: 'in' , anchor: 'mb-cmd-src' },
    { id: 'm-cmd-nm', from: 'nodecommand', to: 'v-nodemodules', kind: 'vol', flow: 'in', src: 'mb-cmd-nm' },
    { id: 'm-worker-src', from: 'nodeworker', to: 'b-src', kind: 'vol', flow: 'in' , anchor: 'mb-worker-src' },
    { id: 'm-worker-nm', from: 'nodeworker', to: 'v-nodemodules', kind: 'vol', flow: 'in', src: 'mb-worker-nm' },
    { id: 'm-pg-vol', from: 'postgres', to: 'v-postgres', kind: 'vol', flow: 'both', src: 'mb-pg-vol' },
    { id: 'm-pg-init', from: 'postgres', to: 'b-init', kind: 'vol', flow: 'in' , anchor: 'mb-pg-init' },
    { id: 'm-rabbit-vol', from: 'rabbitmq', to: 'v-rabbitmq', kind: 'vol', flow: 'both', src: 'mb-rabbit-vol' },
    { id: 'm-es-vol', from: 'elasticsearch', to: 'v-elastic', kind: 'vol', flow: 'both', src: 'mb-es-vol' }
  ];

  /* ── detalhes de cada item (painel) ─────────────────────── */
  var INFO = {
    browser: { t: 'Navegador (no host)', p: 'Está fora da rede Docker. Só alcança o que tem porta publicada: 8080 (nginx), 5172 (Vite HMR) e 15672 (painel do RabbitMQ).' },
    tools: { t: 'Ferramentas no host', p: 'psql, DBeaver ou um Node rodando fora do Docker. Entram pelas portas publicadas 6789 (Postgres) e 5672 (RabbitMQ).' },
    nginx: { t: 'nginx-container', d: [['imagem', 'build docker/nginx (nginx:stable-alpine)'], ['porta', '8080 no host → 80'], ['hostname', 'sem alias (ninguém chama o nginx por dentro)'], ['montagens', 'public-volume → /var/www · ./aulas → /var/www/aulas · ./src/logs/nginx → /var/log/nginx']], p: 'Porta de entrada. try_files procura o arquivo estático em /var/www (public-volume); se não achar, @node faz proxy_pass para nodeweb_host:3000.' },
    nodeweb: { t: 'nodeweb-container', d: [['imagem', 'build docker/node-web (node:25)'], ['entry point', 'nodemon _web.js (Express na 3000)'], ['hostname', 'nodeweb_host'], ['montagens', './src → /app · public-volume → /app/public · nodemodules-volume → /app/node_modules']], p: 'API, views EJS e busca. Fala com postgres_host:5432, rabbitmq_host:5672 (dispatch de jobs) e elasticsearch_host:9200 (busca). Não tem porta no host: só o nginx chega nele.' },
    nodecommand: { t: 'nodecommand-container (efêmero)', d: [['imagem', 'build docker/node-command (node:25)'], ['entry point', 'node _command.js (migrate, seed, create-example-job...)'], ['hostname', 'nodecommand_host'], ['montagens', './src → /app · nodemodules-volume → /app/node_modules'], ['ciclo de vida', 'sobe, executa um comando e some (run --rm)']], p: 'Não fica rodando: docker compose run --rm nodecommand-container migrate cria o container, executa o comando e o remove. Tem acesso a Postgres, RabbitMQ e Elastic (migrations, seeds, carga inicial do índice).' },
    nodeworker: { t: 'nodeworker-container', d: [['imagem', 'build docker/node-worker (node:25)'], ['entry point', 'nodemon _worker.js (fila default)'], ['hostname', 'nodeworker_host'], ['montagens', './src → /app · nodemodules-volume → /app/node_modules']], p: 'Consome a fila do RabbitMQ e executa os jobs de app/Jobs, como o SyncUserElasticJob: lê o usuário no Postgres e grava no Elasticsearch.' },
    vitehmr: { t: 'nodevitehmr-container', d: [['imagem', 'build docker/node-vite-hmr (node:25)'], ['porta', '5172 no host → 5172'], ['montagens', './src/resources → /app/resources · nodemodules-volume → /app/node_modules']], p: 'Servidor de desenvolvimento do Vite com HMR: o navegador abre localhost:5172 e vê as mudanças do TypeScript na hora.' },
    vitecompiler: { t: 'nodevitecompiler-container', d: [['imagem', 'build docker/node24-vite-compiler (node:24)'], ['entry point', 'vite build --watch'], ['montagens', './src/resources → /app/resources · public-volume → /app/public · nodemodules-volume → /app/node_modules']], p: 'Não é servidor: compila resources/ (do seu PC) para public/ (public-volume), que o nginx serve e o nodeweb lê (manifest do helper vite()).' },
    postgres: { t: 'postgres-container', d: [['imagem', 'postgres:18'], ['porta', '6789 no host → 5432'], ['hostname', 'postgres_host'], ['montagens', 'postgres-volume → /var/lib/postgresql · ./src/docker/postgres/init → /docker-entrypoint-initdb.d']], p: 'Fonte da verdade. Os dados vivem no postgres-volume e sobrevivem a docker compose down.' },
    rabbitmq: { t: 'rabbitmq-container', d: [['imagem', 'rabbitmq:3.13.1-management-alpine'], ['portas', '5672 → 5672 (AMQP) · 15672 → 15672 (painel)'], ['hostname', 'rabbitmq_host'], ['montagens', 'rabbitmq-volume → /var/lib/rabbitmq']], p: 'A fila. O nodeweb publica (dispatch), o worker consome. O painel em localhost:15672 mostra filas, mensagens e consumers.' },
    elasticsearch: { t: 'elasticsearch-container', d: [['imagem', 'elasticsearch:9.5.5'], ['porta', 'nenhuma no host'], ['hostname', 'elasticsearch_host (porta 9200 só dentro da rede)'], ['montagens', 'elastic-volume → /usr/share/elasticsearch/data']], p: 'Banco de busca. Sem bloco ports: o navegador nunca fala com ele. Só nodeweb, nodecommand e nodeworker, pela app-network.' },
    p8080: { t: 'Porta 8080 → 80', p: 'ports: "8080:80". O que chega na 8080 do seu PC vai para a 80 do nginx: o site inteiro é http://localhost:8080.' },
    p5172: { t: 'Porta 5172 → 5172', p: 'ports: "5172:5172" do vite-hmr. Servidor de desenvolvimento com HMR.' },
    p5672: { t: 'Porta 5672 → 5672', p: 'AMQP do RabbitMQ publicado no host, para quem roda Node fora do Docker. Dentro da rede, o acesso é rabbitmq_host:5672.' },
    p15672: { t: 'Porta 15672 → 15672', p: 'Painel web do RabbitMQ: http://localhost:15672, com o usuário e a senha do .env.' },
    p6789: { t: 'Porta 6789 → 5432', p: 'ports: "6789:5432". Do host, o banco está em localhost:6789; dentro da rede, em postgres_host:5432.' },
    'v-public': { t: 'public-volume (volume interno)', p: 'O vite-compiler escreve o build em /app/public; o nginx lê em /var/www; o nodeweb lê em /app/public (manifest.json do helper vite()). O mesmo volume, em três containers, com caminhos diferentes.' },
    'v-nodemodules': { t: 'nodemodules-volume (volume interno)', p: 'O node_modules dos 5 containers Node. Criado uma vez: dependência nova exige docker volume rm fe-2026_nodemodules-volume antes do up --build.' },
    'v-postgres': { t: 'postgres-volume (volume interno)', p: 'Os dados do Postgres, em /var/lib/postgresql.' },
    'v-rabbitmq': { t: 'rabbitmq-volume (volume interno)', p: 'Filas e usuário do RabbitMQ (o usuário é criado só na primeira subida).' },
    'v-elastic': { t: 'elastic-volume (volume interno)', p: 'Os índices do Elasticsearch, em /usr/share/elasticsearch/data.' },
    'b-src': { t: './src (pasta do seu PC)', p: 'Montada em /app no nodeweb, nodecommand e nodeworker: salvou no editor, o container já vê (nodemon reinicia).' },
    'b-resources': { t: './src/resources (pasta do seu PC)', p: 'Fonte do frontend (HTML, TS, CSS, views). Montada em /app/resources no vite-hmr e no vite-compiler.' },
    'b-aulas': { t: './aulas (pasta do seu PC)', p: 'Montada em /var/www/aulas no nginx: slides, briefings e raio-x servidos em localhost:8080/aulas.' },
    'b-logs': { t: './src/logs/nginx (pasta do seu PC)', p: 'Os logs do nginx (/var/log/nginx) aparecem direto no seu PC.' },
    'b-init': { t: './src/docker/postgres/init (pasta do seu PC)', p: 'Scripts que o Postgres roda na primeira subida (/docker-entrypoint-initdb.d).' }
  };

  /* ── cenários ─────────────────────────────────────────── */
  var SCENARIOS = {
    pagina: { t: 'HTTP estático (Vite pré-compiler)', steps: [
      { e: ['m-compiler-resources', 'm-compiler-public', 'b-8080', '8080-nginx', 'm-nginx-public'] }
    ]},
    list: { t: 'HTTP API · list e get one (GET /users e GET /users/:id)', steps: [
      { e: ['b-8080', '8080-nginx', 'nginx-web', 'web-pg'], x: 'Uma API HTTP comum: GET /users (list) ou GET /users/:id (get one) entra pela 8080 do host (→ 80 do nginx). Não existe arquivo com esse caminho no public-volume, então o nginx faz proxy_pass para nodeweb_host:3000. No nodeweb, rota → controller → UserModel (findAndCountAll na lista, findByPk no get one), que consulta o Postgres em postgres_host:5432.' },
      { e: ['nginx-web', '8080-nginx', 'b-8080'], x: 'O controller monta o JSON (a lista paginada { page, limit, total, next, data } ou o usuário encontrado) e responde. A resposta volta pelo mesmo caminho: nodeweb → nginx → navegador. Sem fila, sem Elastic: só nginx, Node e Postgres.' }
    ]},
    hmr: { t: 'Vite HMR (desenvolvimento)', steps: [
      { e: ['b-5172', '5172-hmr', 'm-hmr-resources', 'm-hmr-nm'], x: 'Modo desenvolvimento: o navegador abre localhost:5172, que vai direto para o vite-hmr (nodevitehmr-container:5172), sem passar pelo nginx. O Vite lê o código do seu PC em /app/resources (bind ./src/resources) e as dependências no nodemodules-volume, e compila em memória: nada é escrito no public-volume.' },
      { e: ['m-hmr-resources', '5172-hmr', 'b-5172'], x: 'Você salva um .ts em ./src/resources: o vite-hmr enxerga a mudança na hora (bind mount), recompila só aquele módulo e avisa o navegador por WebSocket (na mesma porta 5172). O navegador troca o módulo sem recarregar a página: Hot Module Replacement.' }
    ]},
    migration: { t: 'Migration (nodecommand)', steps: [
      { e: ['m-cmd-src', 'm-cmd-nm', 'cmd-pg', 'm-pg-vol'], x: 'No terminal do host: docker compose run --rm nodecommand-container migrate. O Docker cria um container efêmero do node-command, que lê as migrations do seu PC (./src → /app/database/migrations) e as dependências (nodemodules-volume), conecta no Postgres pela rede interna (postgres_host:5432), executa as migrations pendentes e registra na tabela migrations. O Postgres grava as tabelas no postgres-volume.' },
      { e: [], items: ['nodecommand', 'postgres'], x: 'O comando termina e o --rm apaga o container: o nodecommand só existiu durante a execução. O que fica é o resultado no Postgres, persistido no postgres-volume.' }
    ]},
    fila: { t: 'HTTP API · actions (POST / PUT / DELETE /users)', steps: [
      { e: ['b-8080', '8080-nginx', 'nginx-web', 'web-pg', 'web-rabbit', 'worker-rabbit', 'worker-pg', 'worker-es'], x: 'Igual ao list e get one até o Postgres: a action (POST, PUT ou DELETE /users) entra pela 8080, o nginx passa para nodeweb_host:3000 e o controller grava no Postgres (postgres_host:5432). A diferença: o controller publica um job no RabbitMQ (rabbitmq_host:5672), o RabbitMQ entrega ao nodeworker (fila default), e o worker lê o usuário atual no Postgres e grava no Elasticsearch (elasticsearch_host:9200): PUT se existe, DELETE se não existe mais.' },
      { e: ['nginx-web', '8080-nginx', 'b-8080'], x: 'O controller responde (201, 200 ou 204) logo depois de publicar o job: a resposta volta nodeweb → nginx → navegador sem esperar o worker nem o Elastic. Por isso a busca pode levar alguns milissegundos para enxergar a mudança.' }
    ]},
    busca: { t: 'HTTP API · search (POST /users/search)', steps: [
      { e: ['b-8080', '8080-nginx', 'nginx-web', 'web-pg', 'web-es'], x: 'Igual ao list e get one: POST /users/search entra pela 8080, o nginx passa para nodeweb_host:3000 e o nodeweb fala com o Postgres. A diferença: o nodeweb se conecta direto no Elasticsearch (elasticsearch_host:9200, só pela rede interna). Etapa 1: os filtros (LIKE %x% virando wildcard) rodam no Elastic, que devolve só os ids. Etapa 2: WHERE id IN (...) no Postgres pela chave primária.' },
      { e: ['nginx-web', '8080-nginx', 'b-8080'], x: 'O JSON com os usuários (na ordem do Elastic, dados atuais do Postgres, sem senha) volta nodeweb → nginx → navegador. Sem fila e sem worker: a busca só lê.' }
    ]}


  };

  /* volumes que acendem junto com o container nos cenários:
     bancos/fila → onde guardam os dados; containers Node → node_modules */
  var DATA_VOLUMES = {
    rabbitmq: ['m-rabbit-vol'],
    elasticsearch: ['m-es-vol'],
    postgres: ['m-pg-vol'],
    nodeweb: ['m-web-nm'],
    nodeworker: ['m-worker-nm'],
    nodecommand: ['m-cmd-nm'],
    vitehmr: ['m-hmr-nm'],
    vitecompiler: ['m-compiler-nm']
  };

  /* ── geometria ────────────────────────────────────────── */
  function box(id){
    var el = items[id] || badges[id];
    var s = stage.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height, cx: r.left - s.left + r.width / 2, cy: r.top - s.top + r.height / 2 };
  }

  /* ponto da borda do retângulo b na direção do ponto (tx, ty) */
  function edgePoint(b, tx, ty, gap){
    var dx = tx - b.cx;
    var dy = ty - b.cy;
    if(dx === 0 && dy === 0){ return [b.cx, b.cy]; }
    var sx = dx === 0 ? Infinity : (b.w / 2 + gap) / Math.abs(dx);
    var sy = dy === 0 ? Infinity : (b.h / 2 + gap) / Math.abs(dy);
    var s = Math.min(sx, sy);
    return [b.cx + dx * s, b.cy + dy * s];
  }

  function el(name, attrs){
    var n = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function(k){ n.setAttribute(k, attrs[k]); });
    return n;
  }

  var paths = {};
  var labels = {};

  function draw(){
    var k = stage.clientWidth / W;
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 ' + stage.clientWidth + ' ' + stage.clientHeight);

    var defs = el('defs', {});
    var marker = el('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
    marker.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', fill: 'context-stroke' }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    EDGES.forEach(function(edge){
      /* a seta sai sempre de quem usa (o container, o navegador) e aponta para o que é usado.
         Pasta do host montada (anchor): sai da pasta na borda e entra no container até o
         badge "origem:destino" */
      /* volume interno (src): a seta sai do badge "volume:destino" do container */
      var a = box(edge.anchor ? edge.to : (edge.src || edge.from));
      var b = box(edge.anchor ? edge.anchor : edge.to);
      var mids = (edge.points || []).map(function(p){ return [p[0] * k, p[1] * k]; });
      var first = mids.length ? mids[0] : [b.cx, b.cy];
      var last = mids.length ? mids[mids.length - 1] : [a.cx, a.cy];
      var gapEnd = 4;
      var start = edgePoint(a, first[0], first[1], 2);
      var end = edgePoint(b, last[0], last[1], gapEnd);
      var pts = [start].concat(mids, [end]);
      var d = 'M' + pts.map(function(p){ return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L');

      var attrs = { d: d, class: 'wire ' + edge.kind + (edge.flow ? ' ' + edge.flow : '') + (edge.scenarioOnly ? ' only-scenario' : '') + (edge.anchor ? ' m-bind' : '') + (edge.src ? ' m-volume' : ''), 'data-id': edge.id };
      attrs['marker-end'] = 'url(#arrow)';
      var path = el('path', attrs);
      svg.appendChild(path);
      paths[edge.id] = path;

      if(!edge.label){ return; }
      /* rótulo perto do destino (rede); nas montagens, no meio da linha e do
         lado para onde ela vai, para rótulos vizinhos não se sobreporem */
      var t = edge.kind === 'vol' ? 0.5 : 0.72;
      var total = path.getTotalLength();
      var p = path.getPointAtLength(total * t);
      var anchor = 'start';
      var dx = 6;
      var mountLeft = end[0] < start[0];
      if(edge.kind === 'vol' && mountLeft){
        anchor = 'end';
        dx = -6;
      }
      var text = el('text', { x: (p.x + dx).toFixed(1), y: (p.y - 6).toFixed(1), 'text-anchor': anchor, class: 'wire-label ' + edge.kind + (edge.scenarioOnly ? ' only-scenario' : '') });
      text.textContent = edge.label;
      if(edge.kind === 'vol'){ text.setAttribute('opacity', '0'); }
      svg.appendChild(text);
      labels[edge.id] = text;
    });

    applyState();
  }

  /* ── estado: foco em item e cenário ───────────────────── */
  var focusId = null;
  var hoverId = null;
  var scenario = null;

  function neighbors(id){
    var set = {};
    set[id] = true;
    EDGES.forEach(function(e){
      if(e.from === id || e.to === id){ set[e.from] = true; set[e.to] = true; }
    });
    return set;
  }

  /* Ligações em destaque de um item: tudo que toca nele (volumes, pastas,
     containers pela rede, portas) e mais um elo de cada cadeia:
     - porta publicada: quem chega nela pelo host (navegador → 8080 → nginx);
     - volume que ele escreve: quem lê esse volume (compiler → public → nginx);
     - volume que ele lê: quem escreve nele (public ← compiler, visto do nginx). */
  var WRITES = { out: true, both: true };
  var READS = { in: true, both: true };

  function relatedEdges(id){
    var ids = [];
    EDGES.forEach(function(e){
      if(e.scenarioOnly){ return; }
      if(e.from !== id && e.to !== id){ return; }
      ids.push(e.id);

      if(e.kind === 'port'){
        var port = e.from === id ? e.to : e.from;
        EDGES.forEach(function(x){
          if(x.kind !== 'port' || x.to !== port || x.id === e.id){ return; }
          ids.push(x.id);
        });
        return;
      }

      if(e.kind !== 'vol' || e.from !== id){ return; }
      var mount = e.to;
      EDGES.forEach(function(x){
        if(x.kind !== 'vol' || x.to !== mount || x.id === e.id){ return; }
        var feeds = WRITES[e.flow] && READS[x.flow];
        var fed = READS[e.flow] && WRITES[x.flow];
        if(!feeds && !fed){ return; }
        ids.push(x.id);
      });
    });
    return ids;
  }

  function clearClasses(){
    Object.keys(paths).forEach(function(id){ paths[id].classList.remove('hot', 'flow'); });
    Object.keys(labels).forEach(function(id){
      labels[id].classList.remove('lit');
      if(labels[id].classList.contains('vol')){ labels[id].setAttribute('opacity', '0'); }
    });
    Object.keys(items).forEach(function(id){ items[id].classList.remove('lit'); });
    Object.keys(badges).forEach(function(id){ badges[id].classList.remove('lit'); });
    stage.classList.remove('focus');
  }

  function lightEdge(id, cls){
    var e = EDGES.filter(function(x){ return x.id === id; })[0];
    paths[id].classList.add(cls);
    items[e.from].classList.add('lit');
    items[e.to].classList.add('lit');
    if(e.anchor){ badges[e.anchor].classList.add('lit'); }
    if(e.src){ badges[e.src].classList.add('lit'); }
    if(!labels[id]){ return; }
    labels[id].classList.add('lit');
    labels[id].setAttribute('opacity', '1');
  }

  function applyState(){
    clearClasses();
    if(scenario){ return applyScenario(); }
    var target = hoverId || focusId;
    if(!target){ return; }

    stage.classList.add('focus');
    items[target].classList.add('lit');
    relatedEdges(target).forEach(function(id){ lightEdge(id, 'hot'); });
  }

  /* setas e itens de um cenário: todos os passos de uma vez */
  function scenarioEdges(sc){
    var ids = [];
    sc.steps.forEach(function(st){
      st.e.forEach(function(id){
        if(ids.indexOf(id) === -1){ ids.push(id); }
      });
    });
    return ids;
  }

  function applyScenario(){
    var sc = SCENARIOS[scenario];
    stage.classList.add('focus');
    scenarioEdges(sc).forEach(function(id){ lightEdge(id, 'flow'); });
    sc.steps.forEach(function(st){
      (st.items || []).forEach(function(id){ items[id].classList.add('lit'); });
    });

    /* container aceso no cenário: os volumes dele acendem junto */
    Object.keys(DATA_VOLUMES).forEach(function(container){
      if(!items[container].classList.contains('lit')){ return; }
      DATA_VOLUMES[container].forEach(function(edgeId){
        if(paths[edgeId].classList.contains('flow')){ return; }
        lightEdge(edgeId, 'hot');
      });
    });
  }

  /* ── bolinha andando nas setas do passo atual ─────────── */
  var dots = [];
  function syncDots(){
    dots.forEach(function(d){ d.node.remove(); });
    dots = [];
    if(!scenario){ return; }
    var ids = scenarioEdges(SCENARIOS[scenario]);
    ids.forEach(function(id, i){
      /* a bolinha leva as classes da seta (net, port, m-bind...) para sumir junto com o filtro */
      var c = el('circle', { r: 6, class: 'pulse ' + paths[id].getAttribute('class').replace('wire ', '') });
      svg.appendChild(c);
      dots.push({ node: c, path: paths[id], offset: i / ids.length });
    });
  }

  function tick(time){
    var t = (time % 1600) / 1600;
    dots.forEach(function(d){
      var len = d.path.getTotalLength();
      var p = d.path.getPointAtLength(len * ((t + d.offset) % 1));
      d.node.setAttribute('cx', p.x);
      d.node.setAttribute('cy', p.y);
    });
    requestAnimationFrame(tick);
  }
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){ requestAnimationFrame(tick); }

  /* ── eventos ──────────────────────────────────────────── */
  function selectItem(id){
    scenario = null;
    setScenarioButtons();
    focusId = focusId === id ? null : id;
    applyState();
    syncDots();
  }

  Object.keys(items).forEach(function(id){
    /* passar o mouse: destaque temporário (não mexe no painel nem no item clicado) */
    items[id].addEventListener('mouseenter', function(){
      if(scenario){ return; }
      hoverId = id;
      applyState();
    });
    items[id].addEventListener('mouseleave', function(){
      if(hoverId !== id){ return; }
      hoverId = null;
      applyState();
    });
    items[id].addEventListener('click', function(ev){ ev.stopPropagation(); selectItem(id); });
    items[id].addEventListener('keydown', function(ev){
      if(ev.key !== 'Enter' && ev.key !== ' '){ return; }
      ev.preventDefault();
      selectItem(id);
    });
  });

  stage.addEventListener('click', function(){
    if(!focusId){ return; }
    selectItem(focusId);
  });

  function setScenarioButtons(){
    Array.prototype.forEach.call(document.querySelectorAll('[data-scenario]'), function(b){
      b.setAttribute('aria-pressed', String(b.dataset.scenario === scenario));
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-scenario]'), function(b){
    b.addEventListener('click', function(){
      focusId = null;
      scenario = scenario === b.dataset.scenario ? null : b.dataset.scenario;
      setScenarioButtons();
      applyState();
      syncDots();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-layer]'), function(b){
    b.addEventListener('click', function(){
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      stage.classList.toggle('hide-' + b.dataset.layer, !on);
    });
  });

  new ResizeObserver(function(){ draw(); syncDots(); }).observe(stage);
})();
