(function(){
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;

  function slideFromHash(){
    var n = parseInt(String(location.hash).replace('#', ''), 10);
    if(isNaN(n)) return 0;
    return Math.min(Math.max(n - 1, 0), total - 1);
  }

  var current = slideFromHash();

  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var fill = document.getElementById('progressFill');
  var counterCurrent = document.getElementById('counterCurrent');
  var counterTotal = document.getElementById('counterTotal');
  var eyebrowLabel = document.getElementById('eyebrowLabel');
  var sidebar = document.getElementById('sidebar');

  counterTotal.textContent = String(total).padStart(2, '0');

  // miniaturas: clone real de cada slide dentro de um palco 1280x720
  var thumbs = slides.map(function(slide, i){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.setAttribute('aria-label', 'Ir para o slide ' + (i + 1));

    var num = document.createElement('span');
    num.className = 'thumb-num';
    num.textContent = String(i + 1).padStart(2, '0');

    var frame = document.createElement('span');
    frame.className = 'thumb-frame';
    var stage = document.createElement('span');
    stage.className = 'thumb-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.inert = true;

    var clone = slide.cloneNode(true);
    clone.hidden = false;
    stage.appendChild(clone);
    frame.appendChild(stage);

    btn.appendChild(num);
    btn.appendChild(frame);
    btn.addEventListener('click', function(){ goTo(i); });
    sidebar.appendChild(btn);
    return btn;
  });

  function updateThumbScale(){
    var frame = thumbs[0].querySelector('.thumb-frame');
    sidebar.style.setProperty('--thumb-scale', frame.clientWidth / 1280);
  }
  window.addEventListener('resize', updateThumbScale);
  updateThumbScale();

  var direction = 0;

  function render(){
    slides.forEach(function(s, i){ s.hidden = (i !== current); });

    // o slide novo entra deslizando pelo lado de onde se "vem":
    // avançar = entra pela direita, voltar = entra pela esquerda
    var shown = slides[current];
    shown.classList.remove('from-right', 'from-left');
    if(direction !== 0){
      void shown.offsetWidth; // reinicia a animação
      shown.classList.add(direction > 0 ? 'from-right' : 'from-left');
    }
    thumbs.forEach(function(t, i){
      if(i === current) t.setAttribute('aria-current', 'true');
      if(i !== current) t.removeAttribute('aria-current');
    });
    thumbs[current].scrollIntoView({ block: 'nearest' });
    fill.style.width = ((current + 1) / total * 100) + '%';
    counterCurrent.textContent = String(current + 1).padStart(2, '0');
    eyebrowLabel.textContent = slides[current].dataset.eyebrow || '';
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    history.replaceState(null, '', '#' + (current + 1));
  }

  function goTo(i){
    if(i < 0 || i >= total) return;
    direction = i === current ? 0 : (i > current ? 1 : -1);
    current = i;
    render();
  }

  function go(delta){
    goTo(current + delta);
  }

  prevBtn.addEventListener('click', function(){ go(-1); });
  nextBtn.addEventListener('click', function(){ go(1); });

  window.addEventListener('keydown', function(e){
    if(['ArrowRight','ArrowDown','PageDown',' '].indexOf(e.key) !== -1){
      e.preventDefault(); go(1); return;
    }
    if(['ArrowLeft','ArrowUp','PageUp'].indexOf(e.key) !== -1){
      e.preventDefault(); go(-1); return;
    }
    if(e.key === 'Home'){
      e.preventDefault(); goTo(0); return;
    }
    if(e.key === 'End'){
      e.preventDefault(); goTo(total - 1);
    }
  });

  // celular: avisa uma única vez que dá pra arrastar pro lado (some sozinho ou no primeiro gesto)
  var tip = null;
  function hideTip(){
    if(!tip) return;
    tip.classList.remove('on');
    var old = tip;
    tip = null;
    setTimeout(function(){ old.remove(); }, 400);
  }
  function showTip(){
    try{ if(localStorage.getItem('dica-arrastar')) return; }catch(e){}
    tip = document.createElement('div');
    tip.className = 'swipe-tip';
    tip.setAttribute('aria-hidden', 'true');
    tip.textContent = '‹  arraste para o lado  ›';
    document.body.appendChild(tip);
    setTimeout(function(){ if(tip) tip.classList.add('on'); }, 600);
    setTimeout(hideTip, 4600);
    try{ localStorage.setItem('dica-arrastar', '1'); }catch(e){}
  }
  if(window.matchMedia('(pointer: coarse)').matches) showTip();

  // celular: arrastar pro lado troca de slide (esquerda = próximo, direita = anterior)
  var deck = document.getElementById('deck');
  var touch = null;

  // não rouba o gesto de quem está rolando um bloco de código/tabela na horizontal
  function scrollsSideways(el){
    while(el && el !== deck){
      if(el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true;
      el = el.parentElement;
    }
    return false;
  }

  deck.addEventListener('touchstart', function(e){
    touch = null;
    if(e.touches.length !== 1) return;
    if(scrollsSideways(e.target)) return;
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, { passive: true });

  deck.addEventListener('touchend', function(e){
    if(!touch) return;
    var dx = e.changedTouches[0].clientX - touch.x;
    var dy = e.changedTouches[0].clientY - touch.y;
    var fast = Date.now() - touch.t < 700;
    touch = null;
    if(!fast || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    hideTip();
    go(dx < 0 ? 1 : -1);
    window.scrollTo(0, 0);
  }, { passive: true });

  window.addEventListener('hashchange', function(){ goTo(slideFromHash()); });

  render();
})();
