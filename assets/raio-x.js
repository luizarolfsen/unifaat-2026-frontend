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
})();
