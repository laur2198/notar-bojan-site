#!/usr/bin/env node
/**
 * Verifică dacă tot conținutul din src/content/ a fost aprobat de birou.
 *
 * - SITE_MODE=production: iese cu cod 1 dacă găsește `validat: false` sau
 *   `«DE COMPLETAT`, cu lista fișierelor și a liniilor.
 * - altfel (preview, implicit): afișează un rezumat și iese cu cod 0.
 *
 * Fără dependențe: rulează cu Node simplu, înainte de `astro build`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADACINA = fileURLToPath(new URL('..', import.meta.url));
const DIR_CONTINUT = join(RADACINA, 'src', 'content');
const EXTENSII = new Set(['.md', '.mdx', '.yaml', '.yml', '.json']);

const MARCAJ = '«DE COMPLETAT';
const NEVALIDAT = /^\s*validat\s*:\s*false\b/;

const mod = process.env.SITE_MODE || 'preview';
if (mod !== 'preview' && mod !== 'production') {
  console.error(`SITE_MODE are valoarea „${mod}”. Valori acceptate: „preview” sau „production”.`);
  process.exit(1);
}

async function listeazaFisiere(director) {
  const intrari = await readdir(director, { withFileTypes: true });
  const fisiere = await Promise.all(
    intrari.map(async (intrare) => {
      const cale = join(director, intrare.name);
      if (intrare.isDirectory()) return listeazaFisiere(cale);
      const ext = intrare.name.slice(intrare.name.lastIndexOf('.'));
      return EXTENSII.has(ext) ? [cale] : [];
    }),
  );
  return fisiere.flat();
}

/** @returns {Promise<{ fisier: string, nevalidat: number[], marcaje: number[] }>} */
async function analizeaza(cale) {
  const linii = (await readFile(cale, 'utf8')).split(/\r?\n/);
  const nevalidat = [];
  const marcaje = [];
  linii.forEach((linie, i) => {
    if (NEVALIDAT.test(linie)) nevalidat.push(i + 1);
    if (linie.includes(MARCAJ)) marcaje.push(i + 1);
  });
  return { fisier: relative(RADACINA, cale).split(sep).join('/'), nevalidat, marcaje };
}

/** „linia 4” sau „liniile 4, 12”. */
const formateazaLinii = (numere) => `${numere.length === 1 ? 'linia' : 'liniile'} ${numere.join(', ')}`;

const fisiere = (await listeazaFisiere(DIR_CONTINUT)).sort();
const rezultate = await Promise.all(fisiere.map(analizeaza));
const probleme = rezultate.filter((r) => r.nevalidat.length > 0 || r.marcaje.length > 0);
const totalMarcaje = probleme.reduce((suma, r) => suma + r.marcaje.length, 0);
const nevalidate = probleme.filter((r) => r.nevalidat.length > 0).length;

if (mod === 'production') {
  if (probleme.length === 0) {
    console.log(`✔ Conținut validat: ${fisiere.length} fișiere, niciun text nevalidat sau marcaj «DE COMPLETAT».`);
    process.exit(0);
  }
  console.error(`✘ Build de producție oprit: ${probleme.length} din ${fisiere.length} fișiere nu sunt gata de publicare.\n`);
  for (const { fisier, nevalidat, marcaje } of probleme) {
    console.error(`  ${fisier}`);
    if (nevalidat.length) console.error(`    validat: false – ${formateazaLinii(nevalidat)}`);
    if (marcaje.length) console.error(`    «DE COMPLETAT» ×${marcaje.length} – ${formateazaLinii(marcaje)}`);
  }
  console.error('\nCompletați datele, bifați „Text verificat și aprobat de birou” în CMS, apoi rulați din nou.');
  process.exit(1);
}

console.log(
  `[preview] Conținut: ${fisiere.length} fișiere, ${nevalidate} nevalidate, ` +
    `${totalMarcaje} marcaje «DE COMPLETAT» în ${probleme.filter((r) => r.marcaje.length).length} fișiere. ` +
    'Rulați `npm run build:prod` pentru lista completă.',
);
