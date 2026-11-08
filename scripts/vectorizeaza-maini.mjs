#!/usr/bin/env node
/**
 * Vectorizează mâinile din semnătură dintr-o fotografie (un desen de mână cu linie închisă pe fond
 * deschis) și le scrie în scripts/semnatura/maini.svg, apoi regenerează src/assets/semnatura.svg.
 *
 * Pași:
 *   1. ImageMagick: alb-negru + prag (--prag, implicit 50%), cu o ușoară estompare înainte, ca
 *      zgomotul hârtiei să nu treacă pragul → PBM.
 *   2. Linia de mijloc (centerline):
 *        - `autotrace -centerline` dacă e instalat (scriptul încearcă să-l instaleze: apt-get pe
 *          Debian/Ubuntu care îl mai au, brew pe macOS);
 *        - altfel, fallback propriu: subțiere Zhang-Suen până la un schelet de 1 px, apoi urmărirea
 *          scheletului în polilinii. (autotrace nu mai e în depozitele Ubuntu 24.04.)
 *   3. Trăsăturile se înlănțuie de la stânga la dreapta (golurile mici se leagă, cele mari rămân
 *      ridicări de penită), se simplifică și se netezesc ca literele (Catmull-Rom centripet).
 *   4. maini.svg primește path-ul în coordonatele imaginii; genereaza-semnatura.mjs îl așază prin
 *      similaritate: capătul din stânga pe ieșirea din „notar”, cel din dreapta pe intrarea în „bojan”.
 *
 * Utilizare:
 *   node scripts/vectorizeaza-maini.mjs [--foto src/assets/surse/maini.jpg] [--prag 50]
 *        [--iesire scripts/semnatura/maini.svg] [--fara-autotrace] [--fara-generare]
 *        [--svg …] [--css …]   (transmise generatorului)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { catmullRom, dDinSegmente, dist, esantioneaza, parseazaPath, rotunjesteIntoarceri, simplifica } from './semnatura/geometrie.mjs';

const arg = (nume, implicit) => {
  const i = process.argv.indexOf(`--${nume}`);
  return i > -1 ? process.argv[i + 1] : implicit;
};
const are = (nume) => process.argv.includes(`--${nume}`);
const FOTO = resolve(arg('foto', 'src/assets/surse/maini.jpg'));
const PRAG = Number(arg('prag', '50'));
const IESIRE = resolve(arg('iesire', 'scripts/semnatura/maini.svg'));
const LATURA_MAX = 1200; // px, latura cea mai lungă după redimensionare

const exista = (comanda) => spawnSync('sh', ['-c', `command -v ${comanda}`]).status === 0;

if (!existsSync(FOTO)) {
  console.error(`✗ Lipsește fotografia: ${FOTO}\n  Puneți desenul mâinilor (linie închisă pe fond deschis) în src/assets/surse/maini.jpg.`);
  process.exit(1);
}

// ---------------------------------------------------------------- 1. prag
const magick = exista('magick') ? ['magick'] : exista('convert') ? ['convert'] : null;
if (!magick) {
  console.error('✗ Lipsește ImageMagick (magick / convert). Instalați-l: apt-get install imagemagick sau brew install imagemagick.');
  process.exit(1);
}
const lucru = mkdtempSync(join(tmpdir(), 'maini-'));
const pbm = join(lucru, 'maini.pbm');
execFileSync(magick[0], [FOTO, '-auto-orient', '-colorspace', 'Gray', '-resize', `${LATURA_MAX}x${LATURA_MAX}>`, '-blur', '0x1', '-threshold', `${PRAG}%`, '-compress', 'none', pbm]);

// ---------------------------------------------------------------- 2. linia de mijloc
function asiguraAutotrace() {
  if (are('fara-autotrace')) return false;
  if (exista('autotrace')) return true;
  const incercari = [
    exista('apt-get') && ['sh', ['-c', 'apt-get install -y autotrace || (apt-get update && apt-get install -y autotrace)']],
    exista('brew') && ['brew', ['install', 'autotrace']],
  ].filter(Boolean);
  for (const [cmd, args] of incercari) {
    console.log(`… autotrace lipsește, încerc: ${cmd} ${args.join(' ')}`);
    spawnSync(cmd, args, { stdio: 'inherit' });
    if (exista('autotrace')) return true;
  }
  console.log('… autotrace nu e disponibil: folosesc fallback-ul propriu (schelet Zhang-Suen).');
  return false;
}

/** Polilinii (puncte în pixeli) din autotrace -centerline. */
function cuAutotrace() {
  const svg = execFileSync('autotrace', ['-centerline', '-background-color', 'FFFFFF', '-color-count', '2', '-output-format', 'svg', pbm], { encoding: 'utf8', maxBuffer: 64 << 20 });
  return [...svg.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].flatMap(([, d]) => parseazaPath(d)).map((segmente) => esantioneaza(segmente, 8));
}

/** Citește PBM-ul text (P1): matrice de 0/1, 1 = cerneală. */
function citestePbm(cale) {
  const jetoane = readFileSync(cale, 'utf8').replace(/#.*$/gm, '').split(/\s+/).filter(Boolean);
  if (jetoane[0] !== 'P1') throw new Error('PBM neașteptat (se aștepta P1).');
  const [w, h] = [Number(jetoane[1]), Number(jetoane[2])];
  const biti = jetoane.slice(3).join('');
  const m = Array.from({ length: h }, (_, y) => Uint8Array.from({ length: w }, (_, x) => (biti[y * w + x] === '1' ? 1 : 0)));
  return { w, h, m };
}

/** Subțiere Zhang-Suen: scheletul de 1 px al trăsăturilor. */
function zhangSuen({ w, h, m }) {
  const v = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? m[y][x] : 0);
  let schimbat = true;
  while (schimbat) {
    schimbat = false;
    for (const pas of [0, 1]) {
      const sterge = [];
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          if (!m[y][x]) continue;
          const p = [v(x, y - 1), v(x + 1, y - 1), v(x + 1, y), v(x + 1, y + 1), v(x, y + 1), v(x - 1, y + 1), v(x - 1, y), v(x - 1, y - 1)];
          const b = p.reduce((s, q) => s + q, 0);
          if (b < 2 || b > 6) continue;
          let a = 0;
          for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) a++;
          if (a !== 1) continue;
          if (pas === 0 ? p[0] * p[2] * p[4] || p[2] * p[4] * p[6] : p[0] * p[2] * p[6] || p[0] * p[4] * p[6]) continue;
          sterge.push([x, y]);
        }
      for (const [x, y] of sterge) m[y][x] = 0;
      if (sterge.length) schimbat = true;
    }
  }
  return { w, h, m };
}

/**
 * Urmărește scheletul în polilinii, pe „continuitate bună”: pornește din capătul cel mai din stânga
 * și, la fiecare nod (încrucișare de degete), continuă pe ramura cu cea mai mică schimbare de
 * direcție, ca penița care trece peste o linie deja trasă. Muchiile nu se parcurg de două ori;
 * nodurile se pot traversa de mai multe ori.
 */
function urmaresteSchelet({ w, h, m }) {
  const cheie = (x, y) => y * w + x;
  const vecini = ([x, y]) => {
    const r = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h && m[y + dy][x + dx]) r.push([x + dx, y + dy]);
    return r;
  };
  const muchie = (a, b) => [cheie(...a), cheie(...b)].sort((p, q) => p - q).join('-');
  const parcurse = new Set();
  const pixeli = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y][x]) pixeli.push([x, y]);
  const libere = (p) => vecini(p).filter((q) => !parcurse.has(muchie(p, q)));
  const linii = [];
  const traseaza = (start) => {
    const linie = [start];
    let cur = start;
    for (;;) {
      const optiuni = libere(cur);
      if (!optiuni.length) break;
      const inapoi = linie[Math.max(0, linie.length - 6)];
      const dir = [cur[0] - inapoi[0], cur[1] - inapoi[1]];
      const l = Math.hypot(...dir) || 1;
      const scor = (q) => (linie.length < 2 ? -Math.hypot(q[0] - cur[0], q[1] - cur[1]) : ((q[0] - cur[0]) * dir[0] + (q[1] - cur[1]) * dir[1]) / (l * Math.hypot(q[0] - cur[0], q[1] - cur[1])));
      const urm = optiuni.reduce((best, q) => (scor(q) > scor(best) ? q : best));
      parcurse.add(muchie(cur, urm));
      // Scările de 1 px ale scheletului: vecinii comuni ai lui cur și urm se marchează și ei,
      // ca să nu rămână triunghiuri mici neparcurse.
      for (const q of vecini(cur)) if (vecini(urm).some((r) => r[0] === q[0] && r[1] === q[1])) { parcurse.add(muchie(cur, q)); parcurse.add(muchie(urm, q)); }
      linie.push(urm);
      cur = urm;
    }
    return linie;
  };
  // Capetele (un singur vecin), de la stânga la dreapta; apoi orice pixel cu muchii libere.
  const capete = pixeli.filter((p) => vecini(p).length === 1).sort((a, b) => a[0] - b[0]);
  for (const p of [...capete, ...pixeli]) while (libere(p).length) linii.push(traseaza(p));
  return linii;
}

const folosesteAutotrace = asiguraAutotrace();
let polilinii = folosesteAutotrace ? cuAutotrace() : urmaresteSchelet(zhangSuen(citestePbm(pbm)));

// ---------------------------------------------------------------- 3. înlănțuire și netezire
const toate = polilinii.flat();
const latime = Math.max(...toate.map(([x]) => x)) - Math.min(...toate.map(([x]) => x));
const lungimePoli = (p) => p.slice(1).reduce((s, q, i) => s + dist(p[i], q), 0);
polilinii = polilinii.filter((p) => lungimePoli(p) > 0.02 * latime); // fără puncte izolate și zgomot
if (!polilinii.length) throw new Error('Nicio trăsătură găsită: încercați alt --prag.');

const GOL_LEGAT = 0.06 * latime;
// Ordinea: trăsătura cea mai lungă e gestul principal (de regulă de la capătul din stânga la cel din
// dreapta, orientat așa); celelalte bucăți se leagă de el dacă sunt aproape, altfel rămân trăsături
// separate, ordonate de la stânga la dreapta. Capetele compoziției: primul punct al primei trăsături
// (stânga) și ultimul punct al ultimei (dreapta).
polilinii.sort((p, q) => lungimePoli(q) - lungimePoli(p));
const principal = polilinii.shift();
if (principal[0][0] > principal.at(-1)[0]) principal.reverse();
const lanturi = [principal];
for (const p of polilinii) {
  const dStart = Math.min(dist(p[0], principal[0]), dist(p.at(-1), principal[0]));
  const dFinal = Math.min(dist(p[0], principal.at(-1)), dist(p.at(-1), principal.at(-1)));
  if (dFinal <= GOL_LEGAT && dFinal <= dStart) {
    const orientat = dist(p[0], principal.at(-1)) <= dist(p.at(-1), principal.at(-1)) ? p : p.slice().reverse();
    principal.push(...orientat);
  } else if (dStart <= GOL_LEGAT) {
    const orientat = dist(p.at(-1), principal[0]) <= dist(p[0], principal[0]) ? p : p.slice().reverse();
    principal.unshift(...orientat);
  } else lanturi.push(p[0][0] <= p.at(-1)[0] ? p : p.slice().reverse());
}
const mijloc = (p) => p.reduce((s, q) => s + q[0], 0) / p.length;
lanturi.sort((p, q) => mijloc(p) - mijloc(q));
// Trăsătura care atinge capătul din stânga merge prima, cea care atinge capătul din dreapta, ultima.
const primul = lanturi.reduce((best, p) => (p[0][0] < best[0][0] ? p : best));
const ultimul = lanturi.reduce((best, p) => (p.at(-1)[0] > best.at(-1)[0] ? p : best));
const ordonate = [primul, ...lanturi.filter((p) => p !== primul && p !== ultimul), ...(ultimul !== primul ? [ultimul] : [])];

const eps = 0.004 * latime;
const trasee = ordonate.map((p) => catmullRom(rotunjesteIntoarceri(simplifica(p, eps), 0.01 * latime)));

// ---------------------------------------------------------------- 4. scriere
const metoda = folosesteAutotrace ? 'autotrace -centerline' : 'schelet Zhang-Suen';
const xs = trasee.flat().flatMap((s) => [s.a[0], s.b[0]]);
const ys = trasee.flat().flatMap((s) => [s.a[1], s.b[1]]);
const vb = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map((n) => Math.round(n));
writeFileSync(
  IESIRE,
  `<!-- Mâinile – vectorizate din ${arg('foto', 'src/assets/surse/maini.jpg')} de scripts/vectorizeaza-maini.mjs (${metoda}, prag ${PRAG}%).
     Se pot înlocui cu un desen manual (un path, de la capătul din stânga la cel din dreapta).
     Generatorul așază path-ul prin similaritate: primul punct pe ieșirea din „notar”, ultimul pe intrarea în „bojan”. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" data-sursa="fotografie, ${metoda}">
${trasee.map((t) => `  <path d="${dDinSegmente(t)}"/>`).join('\n')}
</svg>
`,
);
console.log(`✓ ${IESIRE}: ${trasee.length} trăsătur${trasee.length === 1 ? 'ă' : 'i'} (${metoda}).`);

if (!are('fara-generare')) {
  const transmise = ['svg', 'css'].flatMap((n) => (arg(n) ? [`--${n}`, arg(n)] : []));
  execFileSync(process.execPath, [resolve('scripts/genereaza-semnatura.mjs'), '--maini', IESIRE, ...transmise], { stdio: 'inherit' });
}
