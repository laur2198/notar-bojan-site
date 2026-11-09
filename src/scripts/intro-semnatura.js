(function () {
  var h = document.documentElement;
  try {
    if (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.requestAnimationFrame) return;
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
  // Ascunsă înainte să intre în pagină: primul frame o arată deja de la zero.
  pregatesteSemnatura(semnatura);
  var evenimente = ['click', 'touchstart', 'keydown', 'wheel'];
  var inchis = false;
  function inchide() {
    if (inchis) return;
    inchis = true;
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
  // Desen 1.8 s, apoi fade 0.4 s (total ≤ 2.3 s de la primul frame).
  deseneazaSemnatura(semnatura, 1800, inchide);
})();
