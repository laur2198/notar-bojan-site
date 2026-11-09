/*
 * Dezvăluirea semnăturii (fără librării). Script clasic, pus inline (împreună cu pornirea) în
 * <head> pentru intro și după SVG pentru hero; de aceea nu are import/export.
 *
 * Fiecare segment al semnăturii e un <g clip-path> cu un <rect class="wipe" data-len data-w> în
 * clipPath. Un singur progres global P (0 → 1, easing cubic-bezier(0.77, 0, 0.175, 1) pe tot
 * gestul) dă lățimea fiecărui dreptunghi: data-w × clamp((P − a) / (b − a), 0, 1), cu
 * intervalele [a, b] consecutive și proporționale cu data-len. Segmentele se dezvăluie strict pe
 * rând, de la stânga la dreapta.
 */

/** cubic-bezier(0.77, 0, 0.175, 1): progresul pentru timpul t ∈ [0, 1] (bisecție pe x). */
function semnaturaEasing(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  var x1 = 0.77, y1 = 0, x2 = 0.175, y2 = 1;
  var bez = function (s, p1, p2) {
    return 3 * p1 * s * (1 - s) * (1 - s) + 3 * p2 * s * s * (1 - s) + s * s * s;
  };
  var lo = 0, hi = 1, s = t;
  for (var i = 0; i < 30; i++) {
    s = (lo + hi) / 2;
    if (bez(s, x1, x2) < t) lo = s;
    else hi = s;
  }
  return bez(s, y1, y2);
}

/** Intervalele [a, b] consecutive, proporționale cu lungimile; ultimul b = 1. */
function semnaturaIntervale(lungimi) {
  var total = 0, cumul = 0, rezultat = [];
  for (var i = 0; i < lungimi.length; i++) total += lungimi[i];
  for (var j = 0; j < lungimi.length; j++) {
    var a = cumul / total;
    cumul += lungimi[j];
    rezultat.push([a, j === lungimi.length - 1 ? 1 : cumul / total]);
  }
  return rezultat;
}

/** Lățimile dreptunghiurilor pentru progresul P. */
function semnaturaLatimi(P, intervale, latimi) {
  var rezultat = [];
  for (var i = 0; i < latimi.length; i++) {
    var a = intervale[i][0], b = intervale[i][1];
    var f = b > a ? (P - a) / (b - a) : P >= b ? 1 : 0;
    rezultat.push(latimi[i] * Math.min(1, Math.max(0, f)));
  }
  return rezultat;
}

/** Dreptunghiurile semnăturii, cu lungimile și lățimile complete. */
function semnaturaSegmente(svg) {
  var rects = Array.prototype.slice.call(svg.querySelectorAll('rect.wipe'));
  return {
    rects: rects,
    lungimi: rects.map(function (r) { return parseFloat(r.getAttribute('data-len')) || 0; }),
    latimi: rects.map(function (r) { return parseFloat(r.getAttribute('data-w')) || 0; }),
  };
}

/** Ascunde semnătura (toate lățimile la 0), înainte de dezvăluire. */
function pregatesteSemnatura(svg) {
  semnaturaSegmente(svg).rects.forEach(function (r) { r.setAttribute('width', '0'); });
}

/** Dezvăluie semnătura în `durata` ms; `gata` se apelează la final. */
function dezvaluieSemnatura(svg, durata, gata) {
  var s = semnaturaSegmente(svg);
  var intervale = semnaturaIntervale(s.lungimi);
  var start = null;
  var aplica = function (P) {
    var w = semnaturaLatimi(P, intervale, s.latimi);
    for (var i = 0; i < s.rects.length; i++) s.rects[i].setAttribute('width', w[i].toFixed(2));
  };
  aplica(0);
  var cadru = function (acum) {
    if (start === null) start = acum;
    var t = Math.min(1, (acum - start) / durata);
    aplica(semnaturaEasing(t));
    if (t < 1) requestAnimationFrame(cadru);
    else if (gata) gata();
  };
  requestAnimationFrame(cadru);
}
