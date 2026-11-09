/*
 * Desenul semnăturii prin stroke-dashoffset (fără librării). Script clasic, pus inline (împreună
 * cu pornirea) în <head> pentru intro și imediat după SVG pentru hero; de aceea nu are import/export.
 *
 * Fiecare <path> are pathLength="100" (dasharray 100 101 din CSS) și intervalul lui [data-a,
 * data-b] din gestul total (calculat la build, proporțional cu data-len). Un singur progres P
 * (0 → 1, easing cubic-bezier(0.77, 0, 0.175, 1) pe tot gestul) dă dashoffset-ul fiecărui path:
 * 100 − 100 × clamp((P − a) / (b − a), 0, 1). Path-urile se desenează strict pe rând, de la
 * stânga la dreapta. În HTML dashoffset-ul e 0 (desenat complet); scripturile îl pun la 101 doar
 * când animația chiar rulează.
 */

/** cubic-bezier(0.77, 0, 0.175, 1): progresul pentru timpul t ∈ [0, 1] (bisecție pe x). */
function semnaturaEasing(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  var bez = function (s, p1, p2) {
    return 3 * p1 * s * (1 - s) * (1 - s) + 3 * p2 * s * s * (1 - s) + s * s * s;
  };
  var lo = 0, hi = 1, s = t;
  for (var i = 0; i < 30; i++) {
    s = (lo + hi) / 2;
    if (bez(s, 0.77, 0.175) < t) lo = s;
    else hi = s;
  }
  return bez(s, 0, 1);
}

/*
 * Un path neînceput primește 101, nu 100: la exact 100 rămâne o liniuță de lungime zero, pe care
 * stroke-linecap: round o desenează ca un punct vizibil la începutul path-ului.
 */
var SEMNATURA_ASCUNS = 101;

/** Dashoffset-ul fiecărui path pentru progresul P (≥ 100 = nedesenat, 0 = desenat). */
function semnaturaOffseturi(P, intervale) {
  var rezultat = [];
  for (var i = 0; i < intervale.length; i++) {
    var a = intervale[i][0], b = intervale[i][1];
    var f = Math.min(1, Math.max(0, b > a ? (P - a) / (b - a) : P >= b ? 1 : 0));
    rezultat.push(f > 0 ? 100 - 100 * f : SEMNATURA_ASCUNS);
  }
  return rezultat;
}

/** Path-urile semnăturii și intervalele lor. */
function semnaturaTrasee(svg) {
  var trasee = Array.prototype.slice.call(svg.querySelectorAll('path[data-a]'));
  return {
    trasee: trasee,
    intervale: trasee.map(function (p) {
      return [parseFloat(p.getAttribute('data-a')), parseFloat(p.getAttribute('data-b'))];
    }),
  };
}

/** Ascunde semnătura (dashoffset 101 pe toate path-urile), înainte de desen. */
function pregatesteSemnatura(svg) {
  semnaturaTrasee(svg).trasee.forEach(function (p) {
    p.style.strokeDashoffset = String(SEMNATURA_ASCUNS);
  });
}

/** Desenează semnătura în `durata` ms; `gata` se apelează la final. */
function deseneazaSemnatura(svg, durata, gata) {
  var s = semnaturaTrasee(svg);
  var start = null;
  var aplica = function (P) {
    var o = semnaturaOffseturi(P, s.intervale);
    for (var i = 0; i < s.trasee.length; i++) s.trasee[i].style.strokeDashoffset = o[i].toFixed(3);
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
