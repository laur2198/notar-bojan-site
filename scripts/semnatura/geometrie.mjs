/**
 * Geometria comună a semnăturii (folosită de genereaza-semnatura.mjs și vectorizeaza-maini.mjs):
 * simplificarea poliliniilor, netezirea Catmull-Rom → Bézier cubic, lungimi, parsarea path-urilor.
 * Un punct e [x, y]; un segment cubic e { a, c1, c2, b }.
 */

const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const scade = (p, q) => [p[0] - q[0], p[1] - q[1]];
const aduna = (p, q) => [p[0] + q[0], p[1] + q[1]];
const ori = (p, k) => [p[0] * k, p[1] * k];
export const unitar = (v) => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
export { aduna, dist, ori, scade };

/** Ramer–Douglas–Peucker: scoate punctele redundante (abatere sub `eps`) dintr-o polilinie. */
export function simplifica(puncte, eps) {
  const curate = puncte.filter((p, i) => i === 0 || dist(p, puncte[i - 1]) > 1e-6);
  if (curate.length < 3) return curate;
  const [a, b] = [curate[0], curate.at(-1)];
  let max = 0;
  let index = 0;
  for (let i = 1; i < curate.length - 1; i++) {
    const p = curate[i];
    const lungime = dist(a, b);
    const d = lungime < 1e-9 ? dist(p, a) : Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / lungime;
    if (d > max) [max, index] = [d, i];
  }
  if (max <= eps) return [a, b];
  return [...simplifica(curate.slice(0, index + 1), eps).slice(0, -1), ...simplifica(curate.slice(index), eps)];
}

/**
 * Catmull-Rom centripet (alpha = 0.5) → segmente Bézier cubice: curba trece prin toate punctele,
 * fără colțuri și fără bucle parazite la punctele inegal distanțate. Capetele: tangenta e
 * direcția primului / ultimului segment.
 */
export function catmullRom(puncte, alpha = 0.5) {
  if (puncte.length < 2) return [];
  const p = [puncte[0], ...puncte, puncte.at(-1)];
  // Punctele fantomă de la capete: prelungiri, ca tangenta de capăt să urmeze primul/ultimul segment.
  p[0] = aduna(puncte[0], scade(puncte[0], puncte[1] ?? puncte[0]));
  p[p.length - 1] = aduna(puncte.at(-1), scade(puncte.at(-1), puncte.at(-2) ?? puncte.at(-1)));
  const segmente = [];
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const d1 = Math.max(dist(p0, p1) ** alpha, 1e-6);
    const d2 = Math.max(dist(p1, p2) ** alpha, 1e-6);
    const d3 = Math.max(dist(p2, p3) ** alpha, 1e-6);
    const c1 = [0, 1].map((k) => (d1 * d1 * p2[k] - d2 * d2 * p0[k] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[k]) / (3 * d1 * (d1 + d2)));
    const c2 = [0, 1].map((k) => (d3 * d3 * p1[k] - d2 * d2 * p3[k] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[k]) / (3 * d3 * (d3 + d2)));
    segmente.push({ a: p1, c1, c2, b: p2 });
  }
  return segmente;
}

export const punctBezier = (s, t) =>
  [0, 1].map((k) => (1 - t) ** 3 * s.a[k] + 3 * (1 - t) ** 2 * t * s.c1[k] + 3 * (1 - t) * t ** 2 * s.c2[k] + t ** 3 * s.b[k]);

/** Lungimea unui segment cubic (eșantionare fină; eroare neglijabilă la scara viewBox-ului). */
export function lungime(s) {
  let l = 0;
  let prev = s.a;
  for (let i = 1; i <= 200; i++) {
    const q = punctBezier(s, i / 200);
    l += dist(prev, q);
    prev = q;
  }
  return l;
}

/** Eșantionează segmente cubice într-o polilinie (`pas` puncte pe segment). */
export const esantioneaza = (segmente, pas = 12) => [segmente[0].a, ...segmente.flatMap((s) => Array.from({ length: pas }, (_, i) => punctBezier(s, (i + 1) / pas)))];

/** Segment drept ca cubic. */
export const dreapta = (a, b) => ({ a, c1: aduna(a, ori(scade(b, a), 1 / 3)), c2: aduna(a, ori(scade(b, a), 2 / 3)), b });

/**
 * Parsează un path SVG cu comenzi M, L, C, Z (absolute sau relative, cum le scrie autotrace sau
 * un editor) în subpath-uri de segmente cubice.
 */
export function parseazaPath(d) {
  const subpaths = [];
  let p = [0, 0];
  let start = [0, 0];
  for (const [, cmd, rest] of d.matchAll(/([MmLlCcZzHhVv])([^MmLlCcZzHhVv]*)/g)) {
    const n = (rest.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
    const rel = cmd === cmd.toLowerCase();
    const abs = (x, y) => (rel ? [p[0] + x, p[1] + y] : [x, y]);
    switch (cmd.toUpperCase()) {
      case 'M':
        for (let i = 0; i < n.length; i += 2) {
          const q = abs(n[i], n[i + 1]);
          if (i === 0) { start = q; subpaths.push([]); } else subpaths.at(-1).push(dreapta(p, q));
          p = q;
        }
        break;
      case 'L':
        for (let i = 0; i < n.length; i += 2) { const q = abs(n[i], n[i + 1]); subpaths.at(-1).push(dreapta(p, q)); p = q; }
        break;
      case 'H':
        for (const x of n) { const q = [rel ? p[0] + x : x, p[1]]; subpaths.at(-1).push(dreapta(p, q)); p = q; }
        break;
      case 'V':
        for (const y of n) { const q = [p[0], rel ? p[1] + y : y]; subpaths.at(-1).push(dreapta(p, q)); p = q; }
        break;
      case 'C':
        for (let i = 0; i < n.length; i += 6) {
          const c1 = abs(n[i], n[i + 1]), c2 = abs(n[i + 2], n[i + 3]), b = abs(n[i + 4], n[i + 5]);
          subpaths.at(-1).push({ a: p, c1, c2, b });
          p = b;
        }
        break;
      case 'Z':
        if (dist(p, start) > 1e-6) subpaths.at(-1).push(dreapta(p, start));
        p = start;
        break;
    }
  }
  return subpaths.filter((s) => s.length);
}

const r1 = (n) => Math.round(n * 10) / 10;
/** Segmente cubice → atributul d (M + C), cu o zecimală. */
export const dDinSegmente = (segmente) =>
  `M ${segmente[0].a.map(r1).join(' ')} ` + segmente.map((s) => `C ${[s.c1, s.c2, s.b].map((q) => q.map(r1).join(' ')).join(', ')}`).join(' ');

/** Transformare de similaritate (rotație + scară uniformă + translație) care duce A→A2 și B→B2. */
export function similaritate([A, B], [A2, B2]) {
  const v = scade(B, A);
  const v2 = scade(B2, A2);
  const s = Math.hypot(...v2) / Math.hypot(...v);
  const unghi = Math.atan2(v2[1], v2[0]) - Math.atan2(v[1], v[0]);
  const [cos, sin] = [Math.cos(unghi) * s, Math.sin(unghi) * s];
  return ([x, y]) => {
    const [dx, dy] = [x - A[0], y - A[1]];
    return [A2[0] + cos * dx - sin * dy, A2[1] + sin * dx + cos * dy];
  };
}

/**
 * Întoarcerile bruște ale peniței (unghi de întoarcere peste `unghiMin` grade, ex. vârful lui „n”)
 * rămân ascuțite și după Catmull-Rom. Aici fiecare astfel de punct primește doi vecini la distanța
 * `raza`, pe segmentul de intrare și pe cel de ieșire: curba trece prin vârf cu tangenta
 * perpendiculară pe trăsături, deci întoarcerea devine o buclă strânsă, rotunjită.
 */
export function rotunjesteIntoarceri(puncte, raza, unghiMin = 100) {
  const rezultat = [puncte[0]];
  for (let i = 1; i < puncte.length - 1; i++) {
    const [a, p, b] = [puncte[i - 1], puncte[i], puncte[i + 1]];
    const uIn = unitar(scade(p, a));
    const uOut = unitar(scade(b, p));
    const intoarcere = (Math.acos(Math.max(-1, Math.min(1, uIn[0] * uOut[0] + uIn[1] * uOut[1]))) * 180) / Math.PI;
    const r = Math.min(raza, dist(a, p) / 3, dist(p, b) / 3);
    if (intoarcere > unghiMin && r > 1e-3) rezultat.push(scade(p, ori(uIn, r)), p, aduna(p, ori(uOut, r)));
    else rezultat.push(p);
  }
  rezultat.push(puncte.at(-1));
  return rezultat;
}
