(function () {
  /*
   * Semnătura din hero (rulează inline, imediat după SVG, înainte de primul paint).
   * Rămâne complet vizibilă (starea din HTML) dacă: intro-ul a rulat la această încărcare,
   * utilizatorul cere mișcare redusă, sau browserul nu are IntersectionObserver / rAF.
   * Altfel o ascunde acum și o dezvăluie în 3.5 s la prima intrare în viewport (threshold 0.4).
   */
  var svg = document.querySelector('[data-semnatura="hero"]');
  var h = document.documentElement;
  if (!svg || h.classList.contains('intro-rulat')) return;
  if (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window) || !window.requestAnimationFrame) return;
  pregatesteSemnatura(svg);
  var observator = new IntersectionObserver(
    function (intrari) {
      for (var i = 0; i < intrari.length; i++) {
        if (intrari[i].isIntersecting) {
          observator.disconnect();
          dezvaluieSemnatura(svg, 3500);
          return;
        }
      }
    },
    { threshold: 0.4 },
  );
  observator.observe(svg);
})();
