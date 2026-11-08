#!/usr/bin/env node
/**
 * Generează semnătura „notar · mâini · bojan” o singură dată, static (la runtime nu se generează
 * nimic):
 *   - src/assets/semnatura.svg          trei grupuri <g data-grup="notar|maini|bojan">, câte un
 *                                       <path> pe trăsătură (pathLength="100"), plus punctul de accent;
 *   - src/styles/semnatura-segmente.css intervalul fiecărei trăsături din gestul total:
 *                                       --delay (început) și --d (durată), fracțiuni din 1.
 *
 * Literele: fontul SINGLE-LINE EMS Allure (scripts/semnatura/EMSAllure.svg, SIL OFL; vezi
 * LICENTE.md). Glifele sunt polilinii; fiecare trăsătură se simplifică (Ramer–Douglas–Peucker) și
 * se netezește (Catmull-Rom centripet, alpha 0.5 → Bézier cubic); întoarcerile bruște ale peniței
 * se rotunjesc înainte (rotunjesteIntoarceri), deci fără colțuri.
 * Literele unui cuvânt se leagă într-un singur path acolo unde ieșirea unei litere atinge intrarea
 * următoarei (scris legat); unde „stiloul” se ridică, trăsătura următoare e alt <path>.
 *
 * Continuitatea: „notar” se termină cu o trăsătură de ieșire (din r) spre centru, „bojan” începe
 * cu o trăsătură de intrare din centru; între ele, zona mâinilor (~35% din lățime), luată din
 * scripts/semnatura/maini.svg și așezată prin similaritate între cele două capete (provizoriu: o
 * linie ușor ondulată; scripts/vectorizeaza-maini.mjs o înlocuiește din fotografie).
 *
 * Lungimile se calculează aici și dau durata fiecărei trăsături, proporțional; trăsăturile se
 * desenează strict secvențial, stânga → dreapta.
 *
 * Utilizare: node scripts/genereaza-semnatura.mjs [--svg cale] [--css cale] [--maini cale]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { aduna, catmullRom, dDinSegmente, dist, esantioneaza, lungime, ori, parseazaPath, rotunjesteIntoarceri, scade, similaritate, simplifica, unitar } from './semnatura/geometrie.mjs';

const arg = (nume, implicit) => {
  const i = process.argv.indexOf(`--${nume}`);
  return i > -1 ? process.argv[i + 1] : implicit;
};
const IESIRE_SVG = resolve(arg('svg', 'src/assets/semnatura.svg'));
const IESIRE_CSS = resolve(arg('css', 'src/styles/semnatura-segmente.css'));
const SURSA_MAINI = resolve(arg('maini', 'scripts/semnatura/maini.svg'));

// Compoziția (unități viewBox). Lățimea și înălțimea rezultă din litere, ca să încapă
// ascendentele și descendentele, care ies mult peste/sub linia de bază, ca la o semnătură.
const X_HEIGHT = 48.2; // înălțimea literelor mici: +30% față de iterația 1 (37.1)
const PROPORTIE_MAINI = 0.35; // zona mâinilor, din lățimea compoziției
const SPATIU = 0.6 * X_HEIGHT; // între cuvânt și capătul trăsăturii lui de ieșire/intrare
const MARGINE = 8; // în jurul desenului
const EPS_SIMPLIFICARE = 0.35; // unități viewBox
const PRAG_LEGARE = 0.12; // ieșire/intrare mai apropiate de 12% din x-height → aceeași trăsătură
const INALTIME_LEGATURA = 0.18 * X_HEIGHT; // capetele dinspre mâini: puțin deasupra liniei de bază

const r1 = (n) => Math.round(n * 10) / 10;
const f6 = (n) => Number(n.toFixed(6));

// ---------------------------------------------------------------- font
const svgFont = readFileSync(resolve('scripts/semnatura/EMSAllure.svg'), 'utf8');
const glife = new Map(
  [...svgFont.matchAll(/<glyph\b[^>]*>/g)].map(([tag]) => [
    tag.match(/unicode="([^"]*)"/)?.[1],
    { adv: Number(tag.match(/horiz-adv-x="([^"]*)"/)?.[1] ?? 0), trasaturi: polilinii(tag.match(/\sd="([^"]*)"/)?.[1] ?? '') },
  ]),
);
const xHeightFont = Math.max(...glife.get('n').trasaturi.flat().map(([, y]) => y));
const scara = X_HEIGHT / xHeightFont;

/** Glifele sunt polilinii (doar M și L). */
function polilinii(d) {
  const trasaturi = [];
  for (const [, cmd, rest] of d.matchAll(/([ML])([^ML]*)/g)) {
    const [x, y] = rest.trim().split(/[\s,]+/).map(Number);
    if (cmd === 'M') trasaturi.push([[x, y]]);
    else trasaturi.at(-1).push([x, y]);
  }
  return trasaturi;
}

/** Cuvântul: trăsăturile legate, în unități viewBox, cu linia de bază la y = 0 și x de la 0. */
function cuvant(text) {
  const prag = PRAG_LEGARE * X_HEIGHT;
  const trasaturi = [];
  let cursor = 0;
  for (const litera of text) {
    const g = glife.get(litera);
    if (!g) throw new Error(`Fontul nu are litera „${litera}”.`);
    for (const t of g.trasaturi) {
      const puncte = t.map(([x, y]) => [(x + cursor) * scara, -y * scara]);
      const ultima = trasaturi.at(-1);
      if (ultima && dist(ultima.at(-1), puncte[0]) < prag) ultima.push(...puncte.slice(1));
      else trasaturi.push(puncte);
    }
    cursor += g.adv;
  }
  const xMin = Math.min(...trasaturi.flat().map(([x]) => x));
  return trasaturi.map((t) => t.map(([x, y]) => [x - xMin, y]));
}

const RAZA_INTOARCERE = 0.05 * X_HEIGHT; // rotunjirea întoarcerilor bruște ale peniței
const neteda = (puncte) => catmullRom(rotunjesteIntoarceri(simplifica(puncte, EPS_SIMPLIFICARE), RAZA_INTOARCERE));
const muta = (dx, dy) => (t) => t.map(([x, y]) => [x + dx, y + dy]);

// ---------------------------------------------------------------- compoziția
const notar = cuvant('notar');
const bojan = cuvant('bojan');
const latime = (c) => Math.max(...c.flat().map(([x]) => x));
const [latN, latB] = [latime(notar), latime(bojan)];
const LATIME = Math.round((2 * MARGINE + latN + latB + 2 * SPATIU) / (1 - PROPORTIE_MAINI));
const latimeMaini = PROPORTIE_MAINI * LATIME;
const toate = [...notar, ...bojan].flat();
const BAZA = r1(MARGINE - Math.min(...toate.map(([, y]) => y))); // ascendenta cea mai înaltă + margine
const INALTIME = Math.round(BAZA + Math.max(...toate.map(([, y]) => y)) + MARGINE);

const xNotar = MARGINE;
const E = [xNotar + latN + SPATIU, BAZA - INALTIME_LEGATURA]; // capătul ieșirii din „notar”
const S = [E[0] + latimeMaini, BAZA - INALTIME_LEGATURA]; // începutul intrării în „bojan”
const xBojan = S[0] + SPATIU;

const traseeNotar = notar.map(muta(xNotar, BAZA)).map(neteda);
const traseeBojan = bojan.map(muta(xBojan, BAZA)).map(neteda);

// Ieșirea din r: continuă tangent ultima trăsătură a cuvântului și ajunge orizontal în E.
{
  const ultima = traseeNotar.at(-1);
  const s = ultima.at(-1);
  const P = s.b;
  const directie = unitar(scade(s.b, s.c2));
  const d = dist(P, E);
  ultima.push({ a: P, c1: aduna(P, ori(directie, 0.45 * d)), c2: [E[0] - 0.45 * d, E[1]], b: E });
}
// Intrarea în b: pleacă orizontal din S și intră tangent în prima trăsătură a cuvântului.
{
  const prima = traseeBojan[0];
  const s = prima[0];
  const B = s.a;
  const directie = unitar(scade(s.c1, s.a));
  const d = dist(S, B);
  prima.unshift({ a: S, c1: [S[0] + 0.45 * d, S[1]], c2: scade(B, ori(directie, 0.45 * d)), b: B });
}

// Mâinile: path-ul din maini.svg, așezat prin similaritate între E și S, apoi netezit.
const svgMaini = readFileSync(SURSA_MAINI, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const sursaMaini = svgMaini.match(/data-sursa="([^"]*)"/)?.[1] ?? 'necunoscută';
const subpathsMaini = [...svgMaini.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].flatMap(([, d]) => parseazaPath(d));
if (!subpathsMaini.length) throw new Error(`${SURSA_MAINI}: niciun <path>.`);
const asaza = similaritate([subpathsMaini[0][0].a, subpathsMaini.at(-1).at(-1).b], [E, S]);
const traseeMaini = subpathsMaini.map((segmente) => neteda(esantioneaza(segmente).map(asaza)));

const grupuri = [
  { nume: 'notar', trasee: traseeNotar },
  { nume: 'maini', trasee: traseeMaini },
  { nume: 'bojan', trasee: traseeBojan },
];

// ---------------------------------------------------------------- intervale
const segmente = grupuri.flatMap((g) => g.trasee.map((t) => ({ grup: g.nume, t, l: t.reduce((s, x) => s + lungime(x), 0) })));
const total = segmente.reduce((s, x) => s + x.l, 0);
let cumul = 0;
for (const x of segmente) {
  x.delay = cumul / total;
  cumul += x.l;
  x.d = x.l / total;
}
const ultim = segmente.at(-1).t.at(-1).b;

// ---------------------------------------------------------------- scriere
let i = 0;
const corpGrup = (g) =>
  segmente
    .filter((x) => x.grup === g.nume)
    .map((x) => `    <path class="semnatura__traseu" data-segment="${i++}" pathLength="100" vector-effect="non-scaling-stroke" d="${dDinSegmente(x.t)}"/>`)
    .join('\n');
const svg = `<!-- Generat de scripts/genereaza-semnatura.mjs (font: EMS Allure, SIL OFL). Nu se editează manual.
     Compoziția: „notar” · mâini · „bojan”, pe aceeași linie de bază (y = ${BAZA}). -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LATIME} ${INALTIME}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <g data-grup="notar">
${corpGrup(grupuri[0])}
  </g>
  <!-- Mâinile – provizoriu, se pot înlocui cu un desen manual (un path, același viewBox). Sursa: ${sursaMaini}. -->
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
 * Lungime totală: ${r1(total)} unități viewBox, ${segmente.length} trăsături.
 */
:root {
  /* Proporțiile desenului, pentru așezarea în pagină: înălțime / lățime și partea de sub linia de bază. */
  --semnatura-raport: ${f6(INALTIME / LATIME)};
  --semnatura-sub-baza-f: ${f6((INALTIME - BAZA) / INALTIME)};
}

.semnatura {
  /* Cât coboară linia de semnătură sub baza SVG-ului: (înălțime − bază) / înălțime. */
  --semnatura-sub-baza: ${f6(((INALTIME - BAZA) / INALTIME) * 100)}%;
}

${segmente.map((x, k) => `.semnatura__traseu[data-segment="${k}"] { --delay: ${f6(x.delay)}; --d: ${f6(x.d)}; }`).join('\n')}
`;
writeFileSync(IESIRE_SVG, svg);
writeFileSync(IESIRE_CSS, css);
console.log(
  `✓ viewBox 0 0 ${LATIME} ${INALTIME}, bază y=${BAZA}, x-height ${X_HEIGHT}, ${segmente.length} trăsături (notar ${traseeNotar.length}, mâini ${traseeMaini.length} [${sursaMaini}], bojan ${traseeBojan.length}), zona mâinilor ${r1(latimeMaini)} (${PROPORTIE_MAINI * 100}%)`,
);
