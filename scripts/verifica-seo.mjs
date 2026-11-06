#!/usr/bin/env node
/**
 * Audit SEO pe build-ul din `dist/` (CLAUDE.md §9, etapa 8), fără dependențe.
 * Pentru fiecare pagină indexabilă (fără /stil/ și 404):
 *   - <title> unic și meta description unică; peste ~60, respectiv ~155 de caractere: avertisment
 *     (textele vin din conținut și se scurtează în CMS);
 *   - un singur <h1>; canonical absolut pe SITE_URL + bază;
 *   - og:title, og:description, og:url (= canonical), og:locale (ro_RO / en_US), og:image absolut,
 *     iar imaginea există în dist/;
 *   - JSON-LD: se parsează; nodul Notary e prezent, fără valori goale sau «DE COMPLETAT»,
 *     fără aggregateRating / review;
 *   - noindex: prezent în preview, absent în producție (SITE_MODE).
 * Plus robots.txt și sitemap. Iese cu 1 la orice problemă.
 *
 * Utilizare (după build): SITE_URL=… BASE_PATH=… SITE_MODE=… node scripts/verifica-seo.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const DIST = resolve('dist');
const SITE = (process.env.SITE_URL || 'https://notar-bojan.pages.dev').replace(/\/+$/, '');
const BAZA = ('/' + (process.env.BASE_PATH ?? '/').trim().replace(/^\/+|\/+$/g, '') + '/').replace(/\/+/g, '/');
const PRODUCTIE = process.env.SITE_MODE === 'production';
const RADACINA = SITE + BAZA;
const MAX_TITLU = 60;
const MAX_DESCRIERE = 155;

const probleme = [];
const avertismente = [];
const rau = (pagina, mesaj) => probleme.push(`${pagina}: ${mesaj}`);
/** Lungimea titlurilor și a descrierilor ține de conținut (CMS): avertisment, nu eroare. */
const atentie = (pagina, mesaj) => avertismente.push(`${pagina}: ${mesaj}`);

const fisiere = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? fisiere(p) : p.endsWith('.html') ? [p] : []; });
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const meta = (html, cheie) => { const m = html.match(new RegExp(`<meta (?:name|property)="${cheie}" content="([^"]*)"`)); return m ? decode(m[1]) : undefined; };

/** Valori goale sau marcaje oriunde într-un obiect JSON. */
function valoriProaste(x, cale = '') {
  if (typeof x === 'string') return x.trim() === '' || x.includes('«DE COMPLETAT') ? [cale] : [];
  if (Array.isArray(x)) return x.length === 0 ? [cale] : x.flatMap((v, i) => valoriProaste(v, `${cale}[${i}]`));
  if (x && typeof x === 'object') return Object.entries(x).flatMap(([k, v]) => valoriProaste(v, cale ? `${cale}.${k}` : k));
  return x === null || x === undefined ? [cale] : [];
}

const titluri = new Map();
const descrieri = new Map();
const pagini = fisiere(DIST)
  .map((f) => ({ f, cale: '/' + relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '') }))
  .filter(({ cale }) => !cale.startsWith('/stil/') && !/^\/404(\.html)?$/.test(cale));
const tabel = [];

for (const { f, cale } of pagini) {
  const html = readFileSync(f, 'utf8');
  const titlu = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const descriere = meta(html, 'description') ?? '';
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const asteptat = SITE + BAZA.replace(/\/$/, '') + cale;
  tabel.push({ cale, t: [...titlu].length, d: [...descriere].length });

  if (!titlu) rau(cale, 'lipsește <title>');
  if ([...titlu].length > MAX_TITLU) atentie(cale, `title are ${[...titlu].length} caractere (max. ${MAX_TITLU}): „${titlu}”`);
  if (!descriere) rau(cale, 'lipsește meta description');
  if ([...descriere].length > MAX_DESCRIERE) atentie(cale, `description are ${[...descriere].length} caractere (max. ${MAX_DESCRIERE})`);
  titluri.set(titlu, [...(titluri.get(titlu) ?? []), cale]);
  descrieri.set(descriere, [...(descrieri.get(descriere) ?? []), cale]);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) rau(cale, `${h1} elemente h1`);
  if (canonical !== asteptat) rau(cale, `canonical „${canonical}” ≠ „${asteptat}”`);
  if (meta(html, 'og:title') !== titlu) rau(cale, 'og:title diferit de title');
  if (meta(html, 'og:description') !== descriere) rau(cale, 'og:description diferit de description');
  if (meta(html, 'og:url') !== asteptat) rau(cale, `og:url „${meta(html, 'og:url')}”`);
  const locale = meta(html, 'og:locale');
  if (locale !== (cale.startsWith('/en/') ? 'en_US' : 'ro_RO')) rau(cale, `og:locale „${locale}”`);
  const imagine = meta(html, 'og:image');
  if (!imagine?.startsWith(RADACINA)) rau(cale, `og:image nu e absolut pe ${RADACINA}: „${imagine}”`);
  else if (!existsSync(join(DIST, decodeURIComponent(new URL(imagine).pathname.slice(BAZA.length))))) rau(cale, `og:image lipsește din dist: ${imagine}`);
  for (const c of ['og:image:width', 'og:image:height', 'og:image:alt', 'twitter:card']) if (!meta(html, c)) rau(cale, `lipsește ${c}`);
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  if (PRODUCTIE && noindex) rau(cale, 'noindex în producție');
  if (!PRODUCTIE && !noindex) rau(cale, 'lipsește noindex în preview');

  const blocuri = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let notary = 0;
  for (const b of blocuri) {
    let date;
    try { date = JSON.parse(b); } catch (e) { rau(cale, `JSON-LD invalid: ${e.message}`); continue; }
    for (const nod of [date].flat()) {
      if (!nod['@context'] || !nod['@type']) rau(cale, 'JSON-LD fără @context/@type');
      if (nod['@type'] === 'Notary') {
        notary++;
        if (nod['@id'] !== `${RADACINA}#birou`) rau(cale, `Notary @id „${nod['@id']}”`);
        if ('aggregateRating' in nod || 'review' in nod) rau(cale, 'Notary are aggregateRating/review');
        const proaste = valoriProaste(nod);
        if (proaste.length) rau(cale, `Notary are valori goale sau «DE COMPLETAT»: ${proaste.join(', ')}`);
      }
      if (nod.provider?.['@id'] && nod.provider['@id'] !== `${RADACINA}#birou`) rau(cale, 'Service.provider nu referă #birou');
    }
  }
  if (notary !== 1) rau(cale, `${notary} noduri Notary`);
}

for (const [t, c] of titluri) if (c.length > 1) rau(c.join(', '), `același title „${t}”`);
for (const [d, c] of descrieri) if (c.length > 1) rau(c.join(', '), `aceeași description „${d.slice(0, 50)}…”`);

const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (PRODUCTIE ? !/Allow: \/\n/.test(robots) || !robots.includes(`Sitemap: ${RADACINA}sitemap-index.xml`) : !/Disallow: \/\n/.test(robots)) rau('robots.txt', JSON.stringify(robots));
const sitemap = existsSync(join(DIST, 'sitemap-0.xml')) ? readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8') : '';
const loc = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
if (loc.length !== pagini.length) rau('sitemap', `${loc.length} adrese, ${pagini.length} pagini indexabile`);
if (loc.some((u) => /\/stil\/|\/404/.test(u))) rau('sitemap', 'conține /stil/ sau 404');

console.log(`Mod: ${PRODUCTIE ? 'producție' : 'preview'} · rădăcina ${RADACINA} · ${pagini.length} pagini indexabile`);
console.log(tabel.map((r) => `  ${r.cale.padEnd(30)} title ${String(r.t).padStart(2)} · description ${String(r.d).padStart(3)}`).join('\n'));
if (avertismente.length) {
  console.warn(`\n${avertismente.length} avertismente (de scurtat în CMS: Google taie textele mai lungi):`);
  for (const a of avertismente) console.warn('  ' + a);
}
if (probleme.length) {
  console.error(`\n${probleme.length} probleme:`);
  for (const p of probleme) console.error('  ' + p);
  process.exit(1);
}
console.log(avertismente.length ? 'SEO: zero probleme structurale (vezi avertismentele).' : 'SEO: zero probleme.');
