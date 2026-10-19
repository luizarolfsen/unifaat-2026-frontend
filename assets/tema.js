(function(){
  var root = document.documentElement;
  var button = null;

  function read(){
    var m = document.cookie.match(/(?:^|;\s*)tema=(dark|light)/);
    if(m) return m[1];
    return 'light';
  }

  function save(theme){
    document.cookie = 'tema=' + theme + '; path=/; max-age=31536000; SameSite=Lax';
  }

  function paint(theme){
    root.setAttribute('data-theme', theme);
    if(!button) return;
    var dark = theme === 'dark';
    button.textContent = dark ? '☀' : '☾';
    button.setAttribute('aria-pressed', String(dark));
    button.title = dark ? 'Tema claro (T)' : 'Tema escuro (T)';
  }

  function toggle(){
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    save(next);
    paint(next);
  }

  function mount(){
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'tema-toggle';
    button.setAttribute('aria-label', 'Alternar tema claro/escuro');
    button.addEventListener('click', toggle);

    var hud = document.querySelector('.hud');
    if(hud) hud.appendChild(button);
    if(!hud) document.body.appendChild(button);
    paint(root.getAttribute('data-theme'));
  }

  // aplica antes da primeira pintura (o script roda no <head>)
  paint(read());

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  if(document.readyState !== 'loading') mount();

  window.addEventListener('keydown', function(e){
    if(e.key !== 't' && e.key !== 'T') return;
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    toggle();
  });

  // PDF e impressão sempre saem no tema claro
  var before = null;
  window.addEventListener('beforeprint', function(){
    before = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
  });
  window.addEventListener('afterprint', function(){
    if(before) root.setAttribute('data-theme', before);
    before = null;
  });
})();
