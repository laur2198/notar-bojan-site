#!/usr/bin/env node
/**
 * Verificator de linkuri interne pentru build-ul static din `dist/`, fără dependențe.
 *
 * Parcurge toate fișierele .html, extrage `href`, `src` și `srcset` și verifică pentru fiecare
 * adresă internă (nu http(s) extern, mailto:, tel:, data:) că:
 *   - fișierul țintă există în `dist/` (cale, cale/index.html sau cale.html), ținând cont de
 *     calea de bază (`BASE_PATH`, ex. /notar-bojan-site/);
 *   - ancora (#id), dacă există, e prezentă pe pagina țintă.
 *
 * Utilizare:
 *   node scripts/verifica-linkuri.mjs                 # dist/, fără bază
 *   BASE_PATH=/notar-bojan-site/ node scripts/verifica-linkuri.mjs
 *   node scripts/verifica-linkuri.mjs --ignora /en/   # linkurile spre /en/ se raportează, dar nu eșuează
 *
 * Iese cu cod 1 dacă găsește linkuri rupte (în afara celor ignorate).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const DIST = resolve('dist');
const args = process.argv.slice(2);
const ignorate = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--ignora' && args[i + 1]) ignorate.push(args[++i]);
}

const baza = (() => {
  const b = (process.env.BASE_PATH ?? '/').trim() || '/';
  return ('/' + b.replace(/^\/+|\/+$/g, '') + '/').replace(/\/+/g, '/');
})();

if (!existsSync(DIST)) {
  console.error('Lipsește dist/. Rulați întâi build-ul.');
  process.exit(1);
}

/** @param {string} dir @returns {string[]} */
function fisiereHtml(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return fisiereHtml(p);
    return p.endsWith('.html') ? [p] : [];
  });
}

/** Calea URL a unei pagini din dist (cu bază). @param {string} fisier */
function caleUrl(fisier) {
  const rel = relative(DIST, fisier).split(sep).join('/');
  const fara = rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel;
  return baza + fara;
}

/** @param {string} html */
function iduri(html) {
  return new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => decodeEntitati(m[1])));
}

/** @param {string} s */
function decodeEntitati(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/** @param {string} html @returns {string[]} */
function adrese(html) {
  // Fără conținutul scripturilor JSON-LD (URL-uri absolute, verificate separat ca date).
  const curat = html.replace(/<script[\s\S]*?<\/script>/g, '');
  const rezultat = [];
  for (const m of curat.matchAll(/\s(?:href|src)="([^"]*)"/g)) rezultat.push(decodeEntitati(m[1]));
  for (const m of curat.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const parte of decodeEntitati(m[1]).split(',')) {
      const url = parte.trim().split(/\s+/)[0];
      if (url) rezultat.push(url);
    }
  }
  return rezultat;
}

/** Găsește fișierul din dist pentru o cale URL (fără bază). @param {string} cale */
function fisierPentru(cale) {
  const p = join(DIST, decodeURIComponent(cale));
  if (cale.endsWith('/')) return existsSync(join(p, 'index.html')) ? join(p, 'index.html') : null;
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(join(p, 'index.html'))) return join(p, 'index.html');
  if (existsSync(p + '.html')) return p + '.html';
  return null;
}

const pagini = fisiereHtml(DIST);
const cacheIduri = new Map(pagini.map((f) => [f, iduri(readFileSync(f, 'utf8'))]));
/** @type {{ pagina: string; link: string; motiv: string; ignorat: boolean }[]} */
const rupte = [];
let verificate = 0;

for (const fisier of pagini) {
  const html = readFileSync(fisier, 'utf8');
  const paginaUrl = caleUrl(fisier);
  for (const link of adrese(html)) {
    if (link === '' || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(link)) continue; // extern, mailto:, tel:, data:
    verificate++;
    const absolut = new URL(link, 'http://site.local' + paginaUrl);
    let cale = absolut.pathname;
    const ancora = absolut.hash ? decodeURIComponent(absolut.hash.slice(1)) : '';
    const ignorat = ignorate.some((p) => cale.startsWith(baza + p.replace(/^\/+/, '')));

    if (!cale.startsWith(baza)) {
      rupte.push({ pagina: paginaUrl, link, motiv: `în afara căii de bază ${baza}`, ignorat });
      continue;
    }
    const tinta = fisierPentru(cale.slice(baza.length - 1));
    if (!tinta) {
      rupte.push({ pagina: paginaUrl, link, motiv: 'pagina sau fișierul nu există', ignorat });
      continue;
    }
    if (ancora && tinta.endsWith('.html') && !cacheIduri.get(tinta)?.has(ancora)) {
      rupte.push({ pagina: paginaUrl, link, motiv: `ancora #${ancora} lipsește`, ignorat });
    }
  }
}

const blocante = rupte.filter((r) => !r.ignorat);
const ignorateGasite = rupte.filter((r) => r.ignorat);
console.log(`Bază: ${baza} · ${pagini.length} pagini · ${verificate} linkuri interne verificate.`);
if (ignorateGasite.length) {
  const unice = [...new Set(ignorateGasite.map((r) => r.link))];
  console.log(`Ignorate (${ignorate.join(', ')}): ${ignorateGasite.length} apariții, ${unice.length} adrese unice: ${unice.join(', ')}`);
}
if (blocante.length) {
  console.error(`\n${blocante.length} linkuri rupte:`);
  for (const r of blocante) console.error(`  ${r.pagina}  →  ${r.link}  (${r.motiv})`);
  process.exit(1);
}
console.log('Zero linkuri interne rupte.');
