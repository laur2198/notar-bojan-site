#!/usr/bin/env node
/**
 * Generează semnătura „notar · mâini · bojan” o singură dată, static (la runtime nu se generează
 * nimic):
 *   - src/assets/semnatura.svg          trei grupuri <g data-grup="notar|maini|bojan">, câte un
 *                                       <path> pe trăsătură (pathLength="100"), plus punctul de accent;
 *   - src/styles/semnatura-segmente.css intervalul fiecărei trăsături din gestul total:
 *                                       --delay (început) și --d (durată), fracțiuni din 1.
 *
 * Literele vin dintr-un font SINGLE-LINE (o trăsătură, nu contur), din scripts/semnatura/:
 *   - EMS Allure (EMSAllure.svg) – SIL Open Font License, derivat din Allura (Rob Leuschke);
 *   - Hershey Script 1-stroke (HersheyScript1.svg) – licența Hershey (în metadatele fișierului).
 * Ambele din pachetul npm `hersheytext` 2.0.0 (extensia Hershey Text a Inkscape / Evil Mad Scientist).
 *
 * Literele unui cuvânt se leagă într-un singur path acolo unde ieșirea unei litere atinge intrarea
 * următoarei (scris legat); unde „stiloul” se ridică, trăsătura următoare e alt <path>.
 * Lungimile se calculează aici (exact pe segmentele drepte, prin eșantionare pe curbe) și dau
 * durata fiecărei trăsături, proporțional; trăsăturile se desenează strict secvențial.
 *
 * Utilizare: node scripts/genereaza-semnatura.mjs [--font allure|hershey] [--svg cale] [--css cale]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const arg = (nume, implicit) => {
  const i = process.argv.indexOf(`--${nume}`);
  return i > -1 ? process.argv[i + 1] : implicit;
};
const FONTURI = { allure: 'EMSAllure.svg', hershey: 'HersheyScript1.svg' };
const FONT = arg('font', 'allure');
const IESIRE_SVG = resolve(arg('svg', 'src/assets/semnatura.svg'));
const IESIRE_CSS = resolve(arg('css', 'src/styles/semnatura-segmente.css'));
if (!FONTURI[FONT]) throw new Error(`Font necunoscut: ${FONT} (allure | hershey).`);

// Compoziția (unități viewBox). Lățimea e fixă; x-height-ul rezultă din lățime (cuvintele,
// mâinile și cele două spații egale umplu lățimea utilă), iar înălțimea viewBox-ului rezultă din
// x-height (≈ 35% din ea). Cu un font de mână, 900 × 260 și x-height 35% din 260 nu încap
// împreună: cuvintele ar fi de ~2× mai late decât lățimea disponibilă.
const LATIME = 900;
const MARGINE = 24; // stânga și dreapta
const PROPORTIE_MAINI = 0.35; // lățimea mâinilor din lățimea compoziției
const PROPORTIE_SPATIU = 0.05; // fiecare din cele două spații egale, din lățimea compoziției
const PROPORTIE_X_HEIGHT = 0.35; // înălțimea literelor mici din înălțimea viewBox-ului
const SUS = 6; // spațiu deasupra celei mai înalte ascendente
const PRAG_LEGARE = 0.12; // ieșire/intrare mai apropiate de 12% din x-height → aceeași trăsătură

const r1 = (n) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------- font
const svgFont = readFileSync(resolve('scripts/semnatura', FONTURI[FONT]), 'utf8');
const glife = new Map(
  [...svgFont.matchAll(/<glyph\b[^>]*>/g)].map(([tag]) => {
    const u = tag.match(/unicode="([^"]*)"/)?.[1];
    const adv = Number(tag.match(/horiz-adv-x="([^"]*)"/)?.[1] ?? 0);
    const d = tag.match(/\sd="([^"]*)"/)?.[1] ?? '';
    return [u, { adv, trasaturi: polilinii(d) }];
  }),
);
const xHeightFont = Math.max(...glife.get('n').trasaturi.flat().map(([, y]) => y));

/** Glifele fonturilor sunt polilinii (doar M și L): listă de trăsături, fiecare listă de puncte. */
function polilinii(d) {
  const trasaturi = [];
  for (const [, cmd, rest] of d.matchAll(/([ML])([^ML]*)/g)) {
    const [x, y] = rest.trim().split(/[\s,]+/).map(Number);
    if (cmd === 'M') trasaturi.push([[x, y]]);
    else trasaturi.at(-1).push([x, y]);
  }
  return trasaturi;
}

/** Cuvântul: trăsăturile legate, în coordonate font (y în sus), pornind de la x = 0. */
function cuvant(text) {
  const prag = PRAG_LEGARE * xHeightFont;
  const trasaturi = [];
  let cursor = 0;
  for (const litera of text) {
    const g = glife.get(litera);
    if (!g) throw new Error(`Fontul ${FONT} nu are litera „${litera}”.`);
    for (const t of g.trasaturi) {
      const puncte = t.map(([x, y]) => [x + cursor, y]);
      const ultima = trasaturi.at(-1);
      const capat = ultima?.at(-1);
      if (capat && Math.hypot(capat[0] - puncte[0][0], capat[1] - puncte[0][1]) < prag) ultima.push(...puncte.slice(1));
      else trasaturi.push(puncte);
    }
    cursor += g.adv;
  }
  return trasaturi;
}

// ---------------------------------------------------------------- trasee și lungimi
/** Parsează un path cu comenzi absolute M, L, C în listă de subpath-uri de segmente. */
function segmenteDinPath(d) {
  const subpaths = [];
  let p = [0, 0];
  for (const [, cmd, rest] of d.matchAll(/([MLC])([^MLC]*)/g)) {
    const n = rest.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === 'M') { p = [n[0], n[1]]; subpaths.push({ start: p, seg: [] }); }
    else if (cmd === 'L') for (let i = 0; i < n.length; i += 2) { subpaths.at(-1).seg.push({ tip: 'L', a: p, b: [n[i], n[i + 1]] }); p = [n[i], n[i + 1]]; }
    else for (let i = 0; i < n.length; i += 6) { const c1 = [n[i], n[i + 1]], c2 = [n[i + 2], n[i + 3]], b = [n[i + 4], n[i + 5]]; subpaths.at(-1).seg.push({ tip: 'C', a: p, c1, c2, b }); p = b; }
  }
  return subpaths;
}
const bezier = (s, t) => [0, 1].map((k) => (1 - t) ** 3 * s.a[k] + 3 * (1 - t) ** 2 * t * s.c1[k] + 3 * (1 - t) * t ** 2 * s.c2[k] + t ** 3 * s.b[k]);
function lungime(seg) {
  if (seg.tip === 'L') return Math.hypot(seg.b[0] - seg.a[0], seg.b[1] - seg.a[1]);
  let l = 0, prev = seg.a;
  for (let i = 1; i <= 400; i++) { const q = bezier(seg, i / 400); l += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; }
  return l;
}
const transforma = (sp, f) => ({ start: f(sp.start), seg: sp.seg.map((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Array.isArray(v) ? f(v) : v]))) });
const dDin = (sp) => `M ${sp.start.map(r1).join(' ')} ` + sp.seg.map((s) => (s.tip === 'L' ? `L ${s.b.map(r1).join(' ')}` : `C ${[s.c1, s.c2, s.b].map((p) => p.map(r1).join(' ')).join(', ')}`)).join(' ');
const puncteSp = (sp) => [sp.start, ...sp.seg.flatMap((s) => (s.tip === 'L' ? [s.b] : [0.25, 0.5, 0.75, 1].map((t) => bezier(s, t))))];

// ---------------------------------------------------------------- compoziția
const subpathsCuvant = (text) => cuvant(text).map((t) => ({ start: t[0], seg: t.slice(1).map((b, i) => ({ tip: 'L', a: t[i], b })) }));
const notar = subpathsCuvant('notar');
const bojan = subpathsCuvant('bojan');

const svgMaini = readFileSync(resolve('scripts/semnatura/maini.svg'), 'utf8');
const dMaini = svgMaini.replace(/<!--[\s\S]*?-->/g, '').match(/<path\b[^>]*\sd="([^"]+)"/)[1].replace(/\s+/g, ' ');
const bazaMaini = Number(svgMaini.match(/data-baza="([^"]+)"/)[1]);
const maini = segmenteDinPath(dMaini);

// Lățimile, pe punctele reale ale trăsăturilor (în unități font).
const extinderi = (sps, k) => { const v = sps.flatMap(puncteSp).map((p) => p[k]); return [Math.min(...v), Math.max(...v)]; };
const latimeUtila = LATIME - 2 * MARGINE;
const latimeMaini = PROPORTIE_MAINI * latimeUtila;
const spatiu = PROPORTIE_SPATIU * latimeUtila;
const latimeCuvinteFont = [notar, bojan].reduce((s, c) => { const [a, b] = extinderi(c, 0); return s + b - a; }, 0);
const scara = (latimeUtila - latimeMaini - 2 * spatiu) / latimeCuvinteFont;
const xHeight = xHeightFont * scara;
const INALTIME = Math.round(xHeight / PROPORTIE_X_HEIGHT);
const ascendenta = Math.max(extinderi(notar, 1)[1], extinderi(bojan, 1)[1]) * scara;
const BAZA = r1(SUS + ascendenta); // linia de bază comună: literele și mâinile stau pe ea
if (BAZA > INALTIME) throw new Error('Ascendentele nu încap în înălțimea viewBox-ului.');
const [nMin, nMax] = extinderi(notar, 0).map((x) => x * scara);
const [bMin, bMax] = extinderi(bojan, 0).map((x) => x * scara);
const [mMin, mMax] = extinderi(maini, 0);
const scaraMaini = latimeMaini / (mMax - mMin);

const xNotar = MARGINE - nMin;
const xMaini = MARGINE + (nMax - nMin) + spatiu;
const xBojan = xMaini + latimeMaini + spatiu - bMin;
const dinFont = (x0) => ([x, y]) => [x0 + x * scara, BAZA - y * scara];
const dinMaini = ([x, y]) => [xMaini + (x - mMin) * scaraMaini, BAZA - (bazaMaini - y) * scaraMaini];

const grupuri = [
  { nume: 'notar', subpaths: notar.map((sp) => transforma(sp, dinFont(xNotar))) },
  { nume: 'maini', subpaths: maini.map((sp) => transforma(sp, dinMaini)) },
  { nume: 'bojan', subpaths: bojan.map((sp) => transforma(sp, dinFont(xBojan))) },
];

// ---------------------------------------------------------------- intervale
const toate = grupuri.flatMap((g) => g.subpaths.map((sp) => ({ grup: g.nume, sp, l: sp.seg.reduce((s, x) => s + lungime(x), 0) })));
const total = toate.reduce((s, t) => s + t.l, 0);
let cumul = 0;
for (const t of toate) { t.delay = cumul / total; cumul += t.l; t.d = t.l / total; }
const ultim = toate.at(-1).sp.seg.at(-1).b;
const f6 = (n) => Number(n.toFixed(6));

// ---------------------------------------------------------------- scriere
let i = 0;
const corpGrup = (g) => toate.filter((t) => t.grup === g.nume).map((t) => `    <path class="semnatura__traseu" data-segment="${i++}" pathLength="100" vector-effect="non-scaling-stroke" d="${dDin(t.sp)}"/>`).join('\n');
const svg = `<!-- Generat de scripts/genereaza-semnatura.mjs (font: ${FONT === 'allure' ? 'EMS Allure, SIL OFL' : 'Hershey Script 1-stroke, licența Hershey'}). Nu se editează manual.
     Compoziția: „notar” · mâini · „bojan”, pe aceeași linie de bază (y = ${BAZA}). -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LATIME} ${INALTIME}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <g data-grup="notar">
${corpGrup(grupuri[0])}
  </g>
  <!-- Mâinile – provizoriu, se pot înlocui cu un desen manual (un path, același viewBox). -->
  <g data-grup="maini">
${corpGrup(grupuri[1])}
  </g>
  <g data-grup="bojan">
${corpGrup(grupuri[2])}
  </g>
  <!-- Accentul: punctul de la capătul ultimei trăsături, r = 4 în unitățile viewBox. -->
  <circle class="semnatura__punct" cx="${r1(ultim[0])}" cy="${r1(ultim[1])}" r="4"/>
</svg>
`;
const css = `/*
 * Generat de scripts/genereaza-semnatura.mjs. Nu se editează manual.
 * Intervalul fiecărei trăsături din gestul total (0–1): --delay = început, --d = durată,
 * proporțional cu lungimea reală. Suma lui --d = 1; trăsăturile se succed fără suprapunere.
 * Lungime totală: ${r1(total)} unități viewBox, ${toate.length} trăsături.
 */
.semnatura {
  /* Cât coboară linia de semnătură sub baza SVG-ului: (înălțime − bază) / înălțime. */
  --semnatura-sub-baza: ${f6((INALTIME - BAZA) / INALTIME * 100)}%;
}

${toate.map((t, k) => `.semnatura__traseu[data-segment="${k}"] { --delay: ${f6(t.delay)}; --d: ${f6(t.d)}; }`).join('\n')}
`;
writeFileSync(IESIRE_SVG, svg);
writeFileSync(IESIRE_CSS, css);
console.log(`✓ ${FONT}: viewBox 0 0 ${LATIME} ${INALTIME}, bază y=${BAZA}, x-height ${r1(xHeight)} (${r1((xHeight / INALTIME) * 100)}%), ${toate.length} trăsături (notar ${grupuri[0].subpaths.length}, mâini ${grupuri[1].subpaths.length}, bojan ${grupuri[2].subpaths.length}), spații ${r1(spatiu)}, mâini ${r1(latimeMaini)} (${r1((latimeMaini / latimeUtila) * 100)}%)`);
