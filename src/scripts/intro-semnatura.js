(function () {
  var h = document.documentElement;
  try {
    if (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (sessionStorage.getItem('intro-vazut')) return;
    sessionStorage.setItem('intro-vazut', '1');
  } catch (e) {
    return;
  }
  var sablon = document.getElementById('intro-semnatura');
  var strat = sablon && sablon.content && sablon.content.firstElementChild;
  if (!strat) return;
  strat = strat.cloneNode(true);
  var semnatura = strat.querySelector('svg');
  if (!(window.CSS && CSS.registerProperty)) semnatura.classList.add('fara-property');
  var evenimente = ['click', 'touchstart', 'keydown', 'wheel'];
  var inchis = false;
  var temporizator;
  function inchide() {
    if (inchis) return;
    inchis = true;
    clearTimeout(temporizator);
    evenimente.forEach(function (e) {
      removeEventListener(e, inchide, true);
    });
    strat.classList.add('intro--iese');
    setTimeout(function () {
      strat.remove();
    }, 400);
  }
  h.classList.add('intro-rulat');
  h.appendChild(strat);
  evenimente.forEach(function (e) {
    addEventListener(e, inchide, { capture: true, passive: true });
  });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      if (inchis) return;
      semnatura.classList.add('desenat');
      temporizator = setTimeout(inchide, 1850);
    });
  });
})();
