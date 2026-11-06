#!/usr/bin/env node
/**
 * Verifică paginile EN din `dist/en/` (CLAUDE.md §6, etapa 6): niciun text în română în
 * interfață. Caută cuvinte cu diacritice românești (ă â î ș ț, inclusiv formele cu sedilă)
 * în textul vizibil și în atributele citite de oameni sau de cititoarele de ecran
 * (alt, title, aria-label, placeholder, meta description / og:*), plus JSON-LD.
 *
 * Excluderi:
 *   - tot ce e într-un element cu `lang` diferit de engleză: `lang="ro"` (comutatorul de limbă,
 *     motivele netraduse) sau limba unei recenzii (`de`, `fr`, `hu`…);
 *   - marcajele `<mark class="todo">` («DE COMPLETAT…»), care opresc oricum build-ul de producție;
 *   - numele proprii din NUME_PROPRII (numele notarului și al biroului, Brașov);
 *   - `<script>` (în afară de JSON-LD), `<style>` și atributele `data-*` (date pentru JS, nu text).
 *
 * Utilizare: node scripts/verifica-engleza.mjs [director]   (implicit dist/en/, după build).
 * Iese cu 1 dacă găsește text în română.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIR = resolve(process.argv[2] ?? 'dist/en');
const NUME_PROPRII = ['Birou Individual Notarial Bojan Elena Luminița', 'Bojan Elena Luminița', 'Luminița', 'Brașov'];
const DIACRITICE = /[ăâîșțşţĂÂÎȘȚŞŢ]/;
const CUVANT = /[\p{L}\p{M}'’-]*[ăâîșțşţĂÂÎȘȚŞŢ][\p{L}\p{M}'’-]*/gu;
const ATRIBUTE_TEXT = new Set(['alt', 'title', 'aria-label', 'placeholder']);
const META_TEXT = /^(description|og:title|og:description|og:site_name|twitter:)/;
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** @param {string} dir @returns {string[]} */
const fisiere = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? fisiere(p) : p.endsWith('.html') ? [p] : [];
  });

/** @param {string} s */
const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

/** @param {string} s */
function atribute(s) {
  /** @type {Record<string, string>} */
  const a = {};
  for (const m of s.matchAll(/([^\s=/]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g)) a[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return a;
}

/** Cuvintele cu diacritice dintr-un text, după scoaterea numelor proprii. @param {string} text */
function cuvinteRo(text) {
  let curat = text;
  for (const nume of NUME_PROPRII) curat = curat.split(nume).join(' ');
  return DIACRITICE.test(curat) ? [...curat.matchAll(CUVANT)].map((m) => m[0]) : [];
}

/**
 * @typedef {{ unde: string; cuvinte: string[]; context: string }} Gasit
 * @typedef {{ gasite: Gasit[]; altaLimba: number; marcaje: number }} Rezultat
 */

/**
 * Textele în română dintr-o pagină EN (HTML). Exclude elementele cu `lang` diferit de engleză
 * (ro, sau limba unei recenzii: de, fr…), marcajele `mark.todo` și numele proprii.
 * @param {string} html
 * @returns {Rezultat}
 */
export function gasesteTextRo(html) {
  /** @type {Gasit[]} */
  const gasite = [];
  let marcaje = 0;
  let altaLimba = 0;
  /** @type {{ tag: string; exclus: boolean; marcaj: boolean; json: boolean }[]} */
  const stiva = [];
  const exclus = () => stiva.some((e) => e.exclus);
  const raporteaza = (/** @type {string} */ unde, /** @type {string} */ text) => {
    const c = cuvinteRo(text);
    if (c.length) gasite.push({ unde, cuvinte: c, context: text.trim().replace(/\s+/g, ' ').slice(0, 90) });
  };

  for (const m of html.matchAll(/<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|[^<]+/g)) {
    const [tot, inchidere, tagBrut, restAtribute] = m;
    if (tot.startsWith('<!--')) continue;
    if (!tagBrut) {
      const parinte = stiva.at(-1);
      if (parinte && (parinte.tag === 'style' || (parinte.tag === 'script' && !parinte.json))) continue;
      const text = decode(tot);
      if (!DIACRITICE.test(text)) continue;
      if (exclus()) {
        stiva.some((e) => e.marcaj) ? marcaje++ : altaLimba++;
        continue;
      }
      raporteaza(parinte?.json ? 'JSON-LD' : `<${parinte?.tag ?? '?'}>`, text);
      continue;
    }
    const tag = tagBrut.toLowerCase();
    if (inchidere) {
      const i = stiva.map((e) => e.tag).lastIndexOf(tag);
      if (i >= 0) stiva.length = i;
      continue;
    }
    const a = atribute(restAtribute ?? '');
    // `<html lang="en">` e limba paginii; orice alt `lang` care nu e engleză scoate fragmentul din verificare.
    const altaLimbaAici = tag !== 'html' && a.lang !== undefined && !a.lang.toLowerCase().startsWith('en');
    const esteMarcaj = tag === 'mark' && (a.class ?? '').split(/\s+/).includes('todo');
    if (!exclus() && !altaLimbaAici) {
      for (const [nume, valoare] of Object.entries(a)) {
        if (ATRIBUTE_TEXT.has(nume)) raporteaza(`${tag}[${nume}]`, valoare);
      }
      if (tag === 'meta' && META_TEXT.test(a.name ?? a.property ?? '')) raporteaza(`meta[${a.name ?? a.property}]`, a.content ?? '');
    }
    if (VOID.has(tag) || restAtribute?.trim().endsWith('/')) continue;
    stiva.push({ tag, exclus: altaLimbaAici || esteMarcaj, marcaj: esteMarcaj, json: tag === 'script' && a.type === 'application/ld+json' });
  }
  return { gasite, altaLimba, marcaje };
}

function main() {
  if (!existsSync(DIR)) {
    console.error('Lipsește dist/en/. Rulați întâi build-ul.');
    process.exit(1);
  }
  /** @type {(Gasit & { fisier: string })[]} */
  const gasite = [];
  let marcajeExcluse = 0;
  let altaLimbaExcluse = 0;
  const lista = fisiere(DIR);
  for (const fisier of lista) {
    const r = gasesteTextRo(readFileSync(fisier, 'utf8'));
    gasite.push(...r.gasite.map((g) => ({ ...g, fisier: relative(DIR, fisier) })));
    marcajeExcluse += r.marcaje;
    altaLimbaExcluse += r.altaLimba;
  }
  console.log(`Paginile EN: ${lista.length} fișiere din ${relative(process.cwd(), DIR) || '.'}/.`);
  console.log(
    `Excluse: ${altaLimbaExcluse} fragmente cu lang diferit de engleză (ro, limba recenziilor), ${marcajeExcluse} marcaje «DE COMPLETAT» (mark.todo); nume proprii: ${NUME_PROPRII.join(', ')}.`,
  );
  if (gasite.length) {
    console.error(`\n${gasite.length} fragmente cu text în română:`);
    for (const g of gasite) console.error(`  ${g.fisier} ${g.unde}: ${g.cuvinte.join(', ')}  ← „${g.context}”`);
    process.exit(1);
  }
  console.log('Zero texte în română pe paginile EN.');
}

// Rulat direct (npm run verifica:en), nu importat (teste).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
