(function(){
  // barra de progresso de leitura
  var bar = document.createElement('div');
  bar.className = 'progress';
  bar.innerHTML = '<i></i>';
  document.body.appendChild(bar);
  var fill = bar.firstChild;
  function progress(){
    var max = document.documentElement.scrollHeight - innerHeight;
    fill.style.width = (max > 0 ? Math.min(scrollY / max, 1) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', progress, { passive: true });
  progress();

  // botão de copiar nos blocos de código
  Array.prototype.forEach.call(document.querySelectorAll('pre.code'), function(pre){
    var wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy';
    btn.textContent = 'copiar';
    btn.addEventListener('click', function(){
      navigator.clipboard.writeText(pre.innerText).then(function(){
        btn.textContent = 'copiado ✓';
        setTimeout(function(){ btn.textContent = 'copiar'; }, 1500);
      });
    });
    wrap.appendChild(btn);
  });

  var toc = document.querySelector('.toc');
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  if(!toc || !links.length) return;

  // em tela estreita o sumário começa recolhido
  if(window.matchMedia('(max-width: 960px)').matches) toc.removeAttribute('open');

  var byId = {};
  links.forEach(function(a){ byId[a.getAttribute('href').slice(1)] = a; });
  var heads = links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });

  function mark(){
    var current = heads[0];
    heads.forEach(function(h){
      if(h.getBoundingClientRect().top <= 120) current = h;
    });
    links.forEach(function(a){ a.classList.remove('on'); });
    var on = byId[current.id];
    on.classList.add('on');
    on.scrollIntoView({ block: 'nearest' });
  }
  window.addEventListener('scroll', mark, { passive: true });
  mark();
})();
