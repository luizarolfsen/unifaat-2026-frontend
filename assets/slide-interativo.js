/* Widgets interativos dos slides (FE). Carregar ANTES de slide.js, para que as
   miniaturas (clones) já nasçam com o estado inicial desenhado.
   Widgets: [data-passos] passo a passo · [data-abas] partes do componente ·
   [data-semaforo] máquina de estados · [data-render] re-renderização (estado e parâmetro) ·
   [data-foto] "foto" do estado. Passos e abas animam SOZINHOS (autoplay, sem botões); P para/retoma e
   ↑ ↓ vão passo a passo. Sem else: early return / continue. */
(function(){
  function $all(raiz, sel){ return Array.prototype.slice.call(raiz.querySelectorAll(sel)); }
  function aberto(sel){ return document.querySelector('.deck .slide:not([hidden]) ' + sel); }

  /* ── setas: de cada variável de referência até o objeto no heap ── */
  var NS = 'http://www.w3.org/2000/svg';
  var bolinhas = [];
  function visivel(el){
    var passo = el.closest('[data-de]');
    if(!passo) return true;
    return passo.classList.contains('vis');
  }
  function desenharSetas(mem){
    var svg = mem.querySelector('svg.setas');
    var caixa = mem.getBoundingClientRect();
    if(caixa.width === 0) return;
    var escala = caixa.width / mem.offsetWidth;
    svg.innerHTML = '';
    bolinhas = bolinhas.filter(function(b){ return b.svg !== svg; });
    $all(mem, '[data-aponta]').forEach(function(origem){
      if(!visivel(origem)) return;
      var alvos = $all(mem, '[data-alvo="' + origem.dataset.aponta + '"]').filter(visivel);
      if(alvos.length === 0) return;
      var o = origem.getBoundingClientRect();
      var d = alvos[0].getBoundingClientRect();
      var x1 = (o.right - caixa.left) / escala + 2;
      var y1 = (o.top + o.height / 2 - caixa.top) / escala;
      var path = document.createElementNS(NS, 'path');
      var ponta = document.createElementNS(NS, 'polygon');
      // origem e destino na mesma coluna (objeto apontando para outro objeto do heap):
      // a seta sai pela direita, faz a volta e entra pela direita do destino
      if(d.left < o.right){
        var x2v = (d.right - caixa.left) / escala + 3;
        var y2v = (d.top + d.height / 2 - caixa.top) / escala;
        path.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + (x1 + 44) + ' ' + y1 + ', ' + (x2v + 44) + ' ' + y2v + ', ' + x2v + ' ' + y2v);
        ponta.setAttribute('points', x2v + ',' + y2v + ' ' + (x2v + 9) + ',' + (y2v - 5) + ' ' + (x2v + 9) + ',' + (y2v + 5));
      }
      if(d.left >= o.right){
        var x2 = (d.left - caixa.left) / escala - 3;
        var y2 = (d.top + d.height / 2 - caixa.top) / escala;
        var folga = Math.max((x2 - x1) / 2, 20);
        path.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + (x1 + folga) + ' ' + y1 + ', ' + (x2 - folga) + ' ' + y2 + ', ' + x2 + ' ' + y2);
        ponta.setAttribute('points', x2 + ',' + y2 + ' ' + (x2 - 9) + ',' + (y2 - 5) + ' ' + (x2 - 9) + ',' + (y2 + 5));
      }
      svg.appendChild(path);
      svg.appendChild(ponta);
      var bola = document.createElementNS(NS, 'circle');
      bola.setAttribute('r', '6');
      bola.setAttribute('cx', x1);
      bola.setAttribute('cy', y1);
      svg.appendChild(bola);
      bolinhas.push({ svg: svg, path: path, bola: bola, atraso: bolinhas.length * 0.17 });
    });
  }

  // a bolinha viaja da variável até o objeto, como o pacote na rede docker
  function andar(tempo){
    var t = (tempo % 1600) / 1600;
    bolinhas.forEach(function(b){
      var tam = b.path.getTotalLength();
      var p = b.path.getPointAtLength(tam * ((t + b.atraso) % 1));
      b.bola.setAttribute('cx', p.x);
      b.bola.setAttribute('cy', p.y);
    });
    requestAnimationFrame(andar);
  }
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(andar);

  /* ── autoplay: o widget anima sozinho, em loop, SEM botões na tela. Teclado: P para/retoma,
        ↑ ↓ andam passo a passo (e param a animação). Só anda enquanto o slide está aberto. ── */
  function autoplay(raiz, cfg){
    var tocando = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var decorrido = 0;
    var vistoAntes = false;

    function rotulo(){
      raiz.classList.toggle('pausado', !tocando);
    }
    function slideAberto(){
      var slide = raiz.closest('.slide');
      if(!slide) return true;
      return !slide.hidden;
    }
    function definir(valor){
      tocando = valor;
      decorrido = 0;
      rotulo();
    }

    setInterval(function(){
      if(!slideAberto()){ vistoAntes = false; return; }
      if(!vistoAntes){
        vistoAntes = true;
        decorrido = 0;
        if(tocando) cfg.reiniciar();
        return;
      }
      if(!tocando) return;
      decorrido += 200;
      if(decorrido < cfg.espera()) return;
      decorrido = 0;
      cfg.avancar();
    }, 200);

    rotulo();
    return {
      definir: definir,
      alternar: function(){ definir(!tocando); },
      tocando: function(){ return tocando; },
      zerar: function(){ decorrido = 0; }
    };
  }

  /* ── passo a passo ──────────────────────────────────── */
  function initPassos(raiz){
    var total = parseInt(raiz.dataset.passos, 10);
    var legendas = $all(raiz, '.passos-legendas li');
    var leg = raiz.querySelector('.w-leg');
    var num = raiz.querySelector('.w-n');
    var prev = raiz.querySelector('.p-prev');
    var next = raiz.querySelector('.p-next');
    var n = 1;

    function mostrar(){
      $all(raiz, '[data-de]').forEach(function(el){
        var de = parseInt(el.dataset.de, 10);
        var ate = Infinity;
        if(el.dataset.ate) ate = parseInt(el.dataset.ate, 10);
        el.classList.toggle('vis', n >= de && n <= ate);
      });
      $all(raiz, '[data-ativo]').forEach(function(el){
        el.classList.toggle('ativo', el.dataset.ativo.split(' ').indexOf(String(n)) !== -1);
      });
      if(leg) leg.innerHTML = legendas[n - 1] ? legendas[n - 1].innerHTML : '';
      if(num) num.textContent = n + '/' + total;
      if(prev) prev.disabled = n === 1;
      if(next) next.disabled = n === total;
      if(mem){
        desenharSetas(mem);
        setTimeout(function(){ desenharSetas(mem); }, 300);
      }
    }

    var mem = raiz.querySelector('.memoria');
    if(mem){
      new ResizeObserver(function(){ desenharSetas(mem); }).observe(mem);
    }

    var auto = null;

    raiz.irPara = function(i){
      n = Math.min(Math.max(i, 1), total);
      if(auto) auto.zerar();
      mostrar();
    };
    // passo manual (‹ ›, ↑ ↓): para a animação e segue passo a passo
    raiz.passo = function(delta){
      if(auto) auto.definir(false);
      raiz.irPara(n + delta);
    };
    raiz.atual = function(){ return n; };

    if(raiz.querySelector('.w-barra')){
      auto = autoplay(raiz, {
        espera: function(){ return n === total ? 4500 : 2800; },
        avancar: function(){ raiz.irPara(n === total ? 1 : n + 1); },
        reiniciar: function(){ raiz.irPara(1); }
      });
    }
    raiz.tocando = function(){ return auto ? auto.tocando() : false; };
    raiz.definirTocando = function(valor){ if(auto) auto.definir(valor); };
    raiz.alternar = function(){ if(auto) auto.alternar(); };

    if(prev) prev.addEventListener('click', function(){ raiz.passo(-1); });
    if(next) next.addEventListener('click', function(){ raiz.passo(1); });
    mostrar();
  }

  /* ── abas: partes do componente ─────────────────────── */
  function initAbas(raiz){
    var botoes = $all(raiz, '[data-aba]');
    function abrir(nome){
      botoes.forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.aba === nome)); });
      $all(raiz, '[data-parte]').forEach(function(p){
        p.classList.toggle('on', p.dataset.parte.split(' ').indexOf(nome) !== -1);
      });
      $all(raiz, '[data-texto]').forEach(function(t){ t.classList.toggle('on', t.dataset.texto === nome); });
      $all(raiz, '.abas-txt').forEach(function(e){ e.dataset.atual = nome; });
    }
    var atual = 0;
    var auto = null;
    botoes.forEach(function(b, i){
      b.addEventListener('click', function(){
        if(auto) auto.definir(false);     // escolheu a aba na mão: para a animação
        atual = i;
        abrir(b.dataset.aba);
      });
    });
    raiz.aba = function(delta){
      if(auto) auto.definir(false);
      atual = Math.min(Math.max(atual + delta, 0), botoes.length - 1);
      abrir(botoes[atual].dataset.aba);
    };
    abrir(botoes[0].dataset.aba);

    // as abas passam sozinhas (sem botão); clicar numa aba ou usar ↑ ↓ para a animação
    auto = autoplay(raiz, {
      espera: function(){ return 4200; },
      avancar: function(){
        atual = (atual + 1) % botoes.length;
        abrir(botoes[atual].dataset.aba);
      },
      reiniciar: function(){
        atual = 0;
        abrir(botoes[0].dataset.aba);
      }
    });
    raiz.tocando = function(){ return auto.tocando(); };
    raiz.definirTocando = function(valor){ auto.definir(valor); };
    raiz.alternar = function(){ auto.alternar(); };
  }

  /* ── semáforo: máquina de estados ───────────────────── */
  function initSemaforo(raiz){
    var proximo = { verde: 'amarelo', amarelo: 'vermelho', vermelho: 'verde' };
    var estado = 'vermelho';
    var chip = raiz.querySelector('.estado-chip b');

    function mostrar(){
      $all(raiz, '.sem-luz').forEach(function(l){ l.classList.toggle('on', l.classList.contains(estado)); });
      $all(raiz, 'tr[data-estado]').forEach(function(tr){ tr.classList.toggle('on', tr.dataset.estado === estado); });
      chip.textContent = '"' + estado + '"';
    }
    raiz.querySelector('.sem-passa').addEventListener('click', function(){
      estado = proximo[estado];
      mostrar();
    });
    mostrar();
  }

  /* ── re-renderização: estado e parâmetro ────────────── */
  function initRender(raiz){
    var nome = 'Estudar React';
    var isDone = false;
    var renders = 1;
    var ocupado = false;
    var linhas = $all(raiz, '[data-l]');
    var frame = raiz.querySelector('.rr-frame');
    var li = raiz.querySelector('.rr-tela li');
    var causa = raiz.querySelector('.rr-causa');
    var fases = $all(raiz, '[data-fase]');

    function pausa(ms){ return new Promise(function(ok){ setTimeout(ok, ms); }); }

    function desenhar(){
      raiz.querySelector('.rr-nome').textContent = '"' + nome + '"';
      raiz.querySelector('.rr-is-done').textContent = String(isDone);
      li.querySelector('.cb').classList.toggle('on', isDone);
      li.querySelector('.rr-txt').textContent = nome;
      raiz.querySelector('.rr-n').textContent = String(renders);
    }

    function fase(n){
      fases.forEach(function(f){ f.classList.toggle('on', f.dataset.fase === String(n)); });
    }

    // acende as linhas do código que pertencem ao evento (data-ev) e espera
    async function acender(ev, ms){
      var alvo = $all(raiz, '[data-ev="' + ev + '"]');
      alvo.forEach(function(l){ l.classList.add('ativo'); });
      await pausa(ms);
      alvo.forEach(function(l){ l.classList.remove('ativo'); });
    }

    async function rodarFuncao(){
      fase(3);
      renders = renders + 1;
      desenhar();
      frame.classList.add('on');
      for(var i = 0; i < linhas.length; i++){
        linhas[i].classList.add('ativo');
        await pausa(110);
        linhas[i].classList.remove('ativo');
      }
      li.classList.remove('pisca');
      void li.offsetWidth;
      li.classList.add('pisca');
      await pausa(400);
      frame.classList.remove('on');
      fase(0);
    }

    li.addEventListener('click', async function(){
      if(ocupado) return;
      ocupado = true;
      isDone = !isDone;
      causa.textContent = 'estado mudou: setIsDone(' + isDone + ')';
      fase(1);
      await acender(1, 900);        // clique no <li> → onClick
      fase(2);
      await acender(2, 1000);       // aoClicar() → setIsDone(!isDone)
      await rodarFuncao();
      ocupado = false;
    });

    $all(raiz, '[data-nome]').forEach(function(b){
      b.addEventListener('click', async function(){
        if(ocupado) return;
        if(b.dataset.nome === nome) return;
        ocupado = true;
        nome = b.dataset.nome;
        $all(raiz, '[data-nome]').forEach(function(o){ o.setAttribute('aria-pressed', String(o === b)); });
        causa.textContent = 'parâmetro mudou: o pai passou nome = "' + nome + '"';
        await pausa(700);
        await rodarFuncao();
        ocupado = false;
      });
    });

    desenhar();
  }

  /* ── a "foto" do estado ─────────────────────────────── */
  function initFoto(raiz){
    var nome = 'Estudar React';
    var priority = 0;
    var renders = 1;
    var modo = 'funcao';
    var ocupado = false;
    var linhas = $all(raiz, '[data-l]');
    var chamadas = $all(raiz, '.foto-chamada');
    var frame = raiz.querySelector('.rr-frame');
    var li = raiz.querySelector('.rr-tela li');
    var log = raiz.querySelector('.foto-log');

    function pausa(ms){ return new Promise(function(ok){ setTimeout(ok, ms); }); }

    function textoChamada(){
      var texto = '        setPriority(priority + 1)';
      if(modo === 'funcao') texto = '        setPriority(atual => atual + 1)';
      chamadas.forEach(function(c){ c.textContent = texto; });
    }

    function desenhar(){
      li.querySelector('.foto-nome').textContent = nome;
      li.querySelector('.foto-priority-big').textContent = String(priority);
      raiz.querySelector('.foto-priority').textContent = String(priority);
      raiz.querySelector('.rr-n').textContent = String(renders);
    }

    function acender(seletor, ms){
      var alvo = $all(raiz, seletor);
      alvo.forEach(function(l){ l.classList.add('ativo'); });
      return pausa(ms).then(function(){ alvo.forEach(function(l){ l.classList.remove('ativo'); }); });
    }

    // a "foto" desta renderização: priority não muda enquanto a função não rodar de novo
    var fotoValor = 0;

    async function rodarFuncao(){
      renders = renders + 1;
      desenhar();
      frame.classList.add('on');
      for(var i = 0; i < linhas.length; i++){
        linhas[i].classList.add('ativo');
        await pausa(90);
        linhas[i].classList.remove('ativo');
      }
      li.classList.remove('pisca');
      void li.offsetWidth;
      li.classList.add('pisca');
      await pausa(400);
      frame.classList.remove('on');
    }

    li.addEventListener('click', async function(){
      if(ocupado) return;
      ocupado = true;
      fotoValor = priority;
      log.textContent = 'foto desta renderização: priority = ' + fotoValor;
      await acender('[data-ev="1"]', 700);          // clique no <li> → onClick
      await acender('[data-ev="2"]', 500);          // aumentarTres()

      var pedido = fotoValor;                       // o que o React vai guardar
      var fila = fotoValor;                         // valor que a função recebe
      var ids = ['3a', '3b', '3c'];
      for(var i = 0; i < ids.length; i++){
        var antes = fila;
        if(modo === 'direta'){
          pedido = fotoValor + 1;
          log.textContent = log.textContent + '\n' + (i + 1) + ') priority vale ' + fotoValor + ' → pede ' + pedido;
        }
        if(modo === 'funcao'){
          fila = antes + 1;
          pedido = fila;
          log.textContent = log.textContent + '\n' + (i + 1) + ') atual vale ' + antes + ' → pede ' + pedido;
        }
        await acender('[data-ev="' + ids[i] + '"]', 800);
      }
      log.textContent = log.textContent + '\nresultado: priority = ' + pedido;
      priority = pedido;
      await rodarFuncao();
      ocupado = false;
    });

    $all(raiz, '[data-modo]').forEach(function(b){
      b.addEventListener('click', function(){
        if(ocupado) return;
        modo = b.dataset.modo;
        $all(raiz, '[data-modo]').forEach(function(o){ o.setAttribute('aria-pressed', String(o === b)); });
        textoChamada();
      });
    });

    raiz.querySelector('.foto-reset').addEventListener('click', function(){
      if(ocupado) return;
      priority = 0;
      renders = 1;
      log.textContent = '';
      desenhar();
    });

    textoChamada();
    desenhar();
  }

  /* ── inicialização e teclado ────────────────────────── */
  $all(document, '[data-passos]').forEach(initPassos);
  $all(document, '[data-abas]').forEach(initAbas);
  $all(document, '[data-semaforo]').forEach(initSemaforo);
  $all(document, '[data-render]').forEach(initRender);
  $all(document, '[data-foto]').forEach(initFoto);

  // ↑ / ↓ acionam o vai e volta do interativo do slide aberto (passos, abas, semáforo);
  // ← / → continuam trocando de slide (slide.js). N / B também avançam/voltam o passo.
  function interativo(delta){
    var w = aberto('[data-passos]');
    if(w){ w.passo(delta); return; }

    var abas = aberto('[data-abas]');
    if(abas){ abas.aba(delta); return; }

    var sem = aberto('[data-semaforo]');
    if(sem && delta > 0) sem.querySelector('.sem-passa').click();
  }

  window.addEventListener('keydown', function(e){
    if(e.ctrlKey || e.metaKey || e.altKey) return;

    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault();
      e.stopImmediatePropagation();
      interativo(e.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    var tecla = e.key.toLowerCase();
    if(tecla === 'p'){
      var animado = aberto('[data-passos]') || aberto('[data-abas]');
      if(animado) animado.alternar();
      return;
    }
    if(tecla !== 'n' && tecla !== 'b') return;
    interativo(tecla === 'n' ? 1 : -1);
  }, true);

  // PDF: cada widget mostra o passo "de impressão" (data-print) e depois volta
  var guardado = [];
  function paraImpressao(){
    guardado = [];
    $all(document, '.deck [data-passos]').forEach(function(w){
      guardado.push([w, w.atual(), w.tocando()]);
      w.definirTocando(false);          // PDF: nada se mexe sozinho
      if(w.dataset.print) w.irPara(parseInt(w.dataset.print, 10));
    });
    $all(document, '.deck [data-abas]').forEach(function(w){
      guardado.push([w, null, w.tocando()]);
      w.definirTocando(false);
    });
  }
  function voltarDaImpressao(){
    guardado.forEach(function(par){
      if(par[1] !== null) par[0].irPara(par[1]);
      par[0].definirTocando(par[2]);
    });
    guardado = [];
  }
  function redesenharTodas(){
    $all(document, '.deck .memoria').forEach(desenharSetas);
  }
  var emImpressao = window.matchMedia('print');
  emImpressao.addEventListener('change', function(){
    redesenharTodas();
    setTimeout(redesenharTodas, 50);
  });
  window.addEventListener('beforeprint', paraImpressao);
  window.addEventListener('beforeprint', function(){ setTimeout(redesenharTodas, 0); });
  window.addEventListener('afterprint', voltarDaImpressao);
})();
