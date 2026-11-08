/**
 * Extrage desenul mâinilor dintr-un SVG continuous-line cu licență (src/assets/surse/maini.svg) și
 * îl transformă în trăsături (polilinii în coordonatele documentului), gata de netezit și așezat
 * de genereaza-semnatura.mjs.
 *
 * - Ia toate <path>, <polyline>, <line> din document, cu transformările lor (atributul `transform`
 *   pe element și pe grupurile părinte: matrix, translate, scale, rotate, skewX, skewY). Ignoră
 *   ce e în <defs>, <clipPath>, <mask>, <symbol>, <pattern>.
 * - Avertizează dacă desenul pare un contur umplut (fill fără stroke): atunci linia de mijloc nu
 *   e chiar trăsătura, iar rezultatul trebuie verificat vizual.
 * - Înlănțuie trăsăturile: cea mai lungă e gestul principal, orientat de la stânga la dreapta;
 *   bucățile care încep/se termină aproape de capetele lui (sub 6% din lățime) se leagă de el,
 *   celelalte rămân trăsături separate („stiloul” ridicat), ordonate de la stânga la dreapta, cu
 *   bucata din capătul stâng prima și cea din capătul drept ultima.
 */
import { dist, esantioneaza, parseazaPath } from './geometrie.mjs';

const IGNORATE = new Set(['defs', 'clippath', 'mask', 'symbol', 'pattern', 'marker', 'title', 'desc', 'metadata']);

/** Matrice 2D [a, b, c, d, e, f] (ca în SVG) – compunere și aplicare. */
const IDENTITATE = [1, 0, 0, 1, 0, 0];
const inmulteste = (m, n) => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
const aplica = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

export function parseazaTransform(text = '') {
  let m = IDENTITATE;
  for (const [, nume, args] of text.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = (args.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(Number);
    const rad = (g) => (g * Math.PI) / 180;
    let t = IDENTITATE;
    switch (nume) {
      case 'matrix': t = v.slice(0, 6); break;
      case 'translate': t = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0]; break;
      case 'scale': t = [v[0], 0, 0, v[1] ?? v[0], 0, 0]; break;
      case 'rotate': {
        const [c, s] = [Math.cos(rad(v[0])), Math.sin(rad(v[0]))];
        const r = [c, s, -s, c, 0, 0];
        t = v.length >= 3 ? inmulteste(inmulteste([1, 0, 0, 1, v[1], v[2]], r), [1, 0, 0, 1, -v[1], -v[2]]) : r;
        break;
      }
      case 'skewX': t = [1, 0, Math.tan(rad(v[0])), 1, 0, 0]; break;
      case 'skewY': t = [1, Math.tan(rad(v[0])), 0, 1, 0, 0]; break;
    }
    m = inmulteste(m, t);
  }
  return m;
}

const atribut = (tag, nume) => tag.match(new RegExp(`\\s${nume}\\s*=\\s*"([^"]*)"`))?.[1] ?? tag.match(new RegExp(`\\s${nume}\\s*=\\s*'([^']*)'`))?.[1];
const stil = (tag, nume) => atribut(tag, nume) ?? atribut(tag, 'style')?.match(new RegExp(`(?:^|;)\\s*${nume}\\s*:\\s*([^;]+)`))?.[1]?.trim();

/** Trăsăturile din document (polilinii), plus avertismente. */
export function extrageTrasaturi(svg) {
  const text = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '');
  // fill/stroke se moștenesc de la grupuri (implicit în SVG: fill negru, fără stroke).
  const stiva = [{ m: IDENTITATE, ignorat: false, fill: 'black', stroke: 'none' }];
  const trasaturi = [];
  let umplute = 0;
  let cuLinie = 0;
  for (const [tag, inchidere, numeBrut, autoInchis] of text.matchAll(/<(\/?)([\w:-]+)\b[^>]*?(\/?)>/g)) {
    const nume = numeBrut.toLowerCase().replace(/^svg:/, '');
    const parinte = stiva.at(-1);
    if (inchidere) {
      if (stiva.length > 1) stiva.pop();
      continue;
    }
    const m = inmulteste(parinte.m, parseazaTransform(atribut(tag, 'transform')));
    const ignorat = parinte.ignorat || IGNORATE.has(nume);
    const fill = stil(tag, 'fill') ?? parinte.fill;
    const stroke = stil(tag, 'stroke') ?? parinte.stroke;
    if (!ignorat && ['path', 'polyline', 'polygon', 'line'].includes(nume)) {
      let d = '';
      if (nume === 'path') d = atribut(tag, 'd') ?? '';
      else if (nume === 'line') d = `M ${atribut(tag, 'x1') ?? 0} ${atribut(tag, 'y1') ?? 0} L ${atribut(tag, 'x2') ?? 0} ${atribut(tag, 'y2') ?? 0}`;
      else d = `M ${atribut(tag, 'points') ?? ''}${nume === 'polygon' ? ' Z' : ''}`;
      if (stroke !== 'none') cuLinie++;
      else if (fill !== 'none') umplute++;
      for (const segmente of parseazaPath(d)) trasaturi.push(esantioneaza(segmente, 10).map((p) => aplica(m, p)));
    }
    // Elementele cu conținut (inclusiv <path>…</path>) deschid un nivel, închis de tag-ul de final.
    if (!autoInchis) stiva.push({ m, ignorat, fill, stroke });
  }
  const avertismente = [];
  if (!trasaturi.length) throw new Error('SVG-ul mâinilor nu conține <path>, <polyline> sau <line>.');
  if (umplute > cuLinie) avertismente.push(`desenul pare un contur umplut (${umplute} forme cu fill, ${cuLinie} cu stroke): verificați rezultatul vizual.`);
  return { trasaturi, avertismente };
}

const lungimePoli = (p) => p.slice(1).reduce((s, q, i) => s + dist(p[i], q), 0);

/** Înlănțuie trăsăturile de la stânga la dreapta (vezi descrierea modulului). */
export function inlantuie(polilinii) {
  const toate = polilinii.flat();
  const latime = Math.max(...toate.map(([x]) => x)) - Math.min(...toate.map(([x]) => x)) || 1;
  const golLegat = 0.06 * latime;
  const ramase = polilinii.filter((p) => p.length > 1 && lungimePoli(p) > 0.01 * latime).sort((p, q) => lungimePoli(q) - lungimePoli(p));
  if (!ramase.length) throw new Error('Nicio trăsătură utilizabilă în desenul mâinilor.');
  const principal = ramase.shift().slice();
  if (principal[0][0] > principal.at(-1)[0]) principal.reverse();
  // Leagă repetat bucata cea mai apropiată de unul din capetele gestului principal, cât timp golul
  // e sub prag; ce rămâne devin trăsături separate.
  for (;;) {
    let best = null;
    ramase.forEach((p, i) => {
      for (const [capat, laFinal] of [[principal.at(-1), true], [principal[0], false]])
        for (const [punct, invers] of [[p[0], false], [p.at(-1), true]]) {
          const d = dist(capat, punct);
          if (d <= golLegat && (!best || d < best.d)) best = { i, d, laFinal, invers };
        }
    });
    if (!best) break;
    const p = ramase.splice(best.i, 1)[0];
    if (best.laFinal) principal.push(...(best.invers ? p.slice().reverse() : p));
    else principal.unshift(...(best.invers ? p : p.slice().reverse()));
  }
  const lanturi = [principal, ...ramase.map((p) => (p[0][0] <= p.at(-1)[0] ? p : p.slice().reverse()))];
  const mijloc = (p) => p.reduce((s, q) => s + q[0], 0) / p.length;
  lanturi.sort((p, q) => mijloc(p) - mijloc(q));
  const primul = lanturi.reduce((best, p) => (p[0][0] < best[0][0] ? p : best));
  const ultimul = lanturi.reduce((best, p) => (p.at(-1)[0] > best.at(-1)[0] ? p : best));
  return [primul, ...lanturi.filter((p) => p !== primul && p !== ultimul), ...(ultimul !== primul ? [ultimul] : [])];
}
