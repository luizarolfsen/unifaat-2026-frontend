// Escala o palco 1280x720 para caber na janela (menos a sidebar e o HUD).
(function(){
  var raiz = document.documentElement;

  function ajustar(){
    var sidebar = document.getElementById('sidebar');
    var hud = document.querySelector('.hud');
    var larguraSidebar = sidebar ? sidebar.getBoundingClientRect().width : 0;
    var alturaHud = hud ? hud.getBoundingClientRect().height : 0;

    var larguraLivre = window.innerWidth - larguraSidebar - 48;
    var alturaLivre = window.innerHeight - alturaHud - 32;
    var escala = Math.min(larguraLivre / 1280, alturaLivre / 720);
    raiz.style.setProperty('--escala', Math.max(escala, 0.2).toFixed(4));
  }

  window.addEventListener('resize', ajustar);
  window.addEventListener('load', ajustar);
  ajustar();
})();
