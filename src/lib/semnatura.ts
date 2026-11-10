/**
 * Semnătura (src/assets/semnatura.svg), citită și pregătită la build. Fișierul îl pune biroul /
 * designerul și nu se modifică din cod (nici geometria, nici ordinea).
 *
 * Structura fișierului:
 *   - trei <mask> (#m-notar, #m-maini, #m-bojan) cu path-uri cu stroke alb, `class="rev"`,
 *     `data-word`, `data-len` și `pathLength="100"`: linia centrală a fiecărei trăsături;
 *   - literele (Imperial Script, contururi) și mâinile (contururi) sunt forme umplute,
 *     `fill="currentColor"`, fiecare cu `mask="url(#m-…)"`: se văd doar cât le descoperă masca.
 *
 * Animația desenează path-urile .rev (stroke-dashoffset 100 → 0), în ordinea notar → maini →
 * bojan, fiecare în intervalul lui [a, b] din gestul total, proporțional cu data-len.
 *
 * Pe ecranele înguste (< 640 px) semnătura întreagă devine prea mică: se arată doar mâinile
 * (masca #m-maini și grupul lor, cu viewBox-ul decupat pe ele) și, sub ele, „Notar Bojan” ca
 * text în Imperial Script (Semnatura.astro).
 */

export const ORDINE_CUVINTE = ['notar', 'maini', 'bojan'] as const;
export type Cuvant = (typeof ORDINE_CUVINTE)[number];

/** Textul de sub mâini pe mobil: aceleași cuvinte ca literele din SVG. */
export const TEXT_SEMNATURA_MOBIL = 'Notar Bojan';

export interface TraseuRev {
  cuvant: Cuvant;
  /** Lungimea reală, în unitățile viewBox-ului (dă durata trăsăturii în animație). */
  len: number;
}

export interface DateSemnatura {
  viewBox: string;
  latime: number;
  inaltime: number;
  /** Conținutul <svg>-ului, fără comentarii. */
  interior: string;
  /** Path-urile .rev, în ordinea din fișier. */
  trasee: TraseuRev[];
}

/** Intervalul unei trăsături din gestul total: [a, b], fracțiuni din 1. */
export type Interval = [a: number, b: number];

const atribut = (tag: string, nume: string) => tag.match(new RegExp(`\\s${nume}="([^"]*)"`))?.[1];
const REV = /<path\b[^>]*\sclass="rev"[^>]*>/g;

export function citesteSemnatura(svg: string): DateSemnatura {
  const faraComentarii = svg.replace(/<!--[\s\S]*?-->/g, '');
  const radacina = faraComentarii.match(/<svg\b[^>]*>/)?.[0] ?? '';
  const viewBox = atribut(radacina, 'viewBox')?.trim();
  if (!viewBox) throw new Error('semnatura.svg: lipsește viewBox pe <svg>.');
  const [, , latime, inaltime] = viewBox.split(/[\s,]+/).map(Number);
  if (!latime || !inaltime) throw new Error(`semnatura.svg: viewBox invalid „${viewBox}”.`);
  const interior = faraComentarii.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)?.[1]?.trim() ?? '';
  for (const c of ORDINE_CUVINTE) {
    if (!interior.includes(`<mask id="m-${c}"`)) throw new Error(`semnatura.svg: lipsește <mask id="m-${c}">.`);
    if (!interior.includes(`mask="url(#m-${c})"`)) throw new Error(`semnatura.svg: nicio formă nu folosește masca #m-${c}.`);
  }
  const trasee = [...interior.matchAll(REV)].map(([p], i): TraseuRev => {
    const cuvant = atribut(p, 'data-word') as Cuvant;
    if (!ORDINE_CUVINTE.includes(cuvant)) throw new Error(`semnatura.svg: path-ul .rev ${i} are data-word „${cuvant}”.`);
    if (atribut(p, 'pathLength') !== '100') throw new Error(`semnatura.svg: path-ul .rev ${i} nu are pathLength="100".`);
    const len = Number(atribut(p, 'data-len'));
    if (!(len > 0)) throw new Error(`semnatura.svg: path-ul .rev ${i} nu are data-len valid.`);
    return { cuvant, len };
  });
  if (!trasee.length) throw new Error('semnatura.svg: niciun path class="rev".');
  return { viewBox, latime, inaltime, interior, trasee };
}

/**
 * Intervalele trăsăturilor, în ordinea din fișier. Ordinea desenării: toate trăsăturile „notar”,
 * apoi „maini”, apoi „bojan” (în cadrul unui cuvânt, ordinea din fișier); intervalele sunt
 * consecutive în ordinea desenării, proporționale cu data-len, și acoperă exact [0, 1].
 */
export function intervaleSemnatura(trasee: readonly TraseuRev[]): Interval[] {
  const total = trasee.reduce((s, t) => s + t.len, 0);
  if (!(total > 0)) throw new Error('Lungimile trăsăturilor trebuie să fie pozitive.');
  const ordine = trasee
    .map((t, i) => ({ t, i }))
    .sort((x, y) => ORDINE_CUVINTE.indexOf(x.t.cuvant) - ORDINE_CUVINTE.indexOf(y.t.cuvant) || x.i - y.i);
  const rezultat: Interval[] = new Array(trasee.length);
  let cumul = 0;
  ordine.forEach(({ t, i }, k) => {
    const a = cumul / total;
    cumul += t.len;
    rezultat[i] = [a, k === ordine.length - 1 ? 1 : cumul / total];
  });
  return rezultat;
}

/** Scrie pe fiecare path .rev, în ordinea din fișier, intervalul lui: data-a și data-b. */
export function adaugaIntervale(interior: string, intervale: readonly Interval[]): string {
  let i = 0;
  const rezultat = interior.replace(REV, (p) => {
    const interval = intervale[i++];
    if (!interval) return p;
    return p.replace(/^<path\b/, `<path data-a="${+interval[0].toFixed(6)}" data-b="${+interval[1].toFixed(6)}"`);
  });
  if (i !== intervale.length) throw new Error(`semnatura.svg: ${i} path-uri .rev, dar ${intervale.length} intervale.`);
  return rezultat;
}

/**
 * Prefixează id-urile și referințele lor (url(#…), href="#…"), ca SVG-ul să poată apărea de
 * mai multe ori în aceeași pagină (intro + hero) fără id-uri duplicate.
 */
export function prefixeazaId(interior: string, prefix: string): string {
  return interior
    .replace(/(\sid=")([^"]+)"/g, (_, inceput: string, id: string) => `${inceput}${prefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${prefix}${id})`)
    .replace(/(\s(?:xlink:)?href=")#([^"]+)"/g, (_, inceput: string, id: string) => `${inceput}#${prefix}${id}"`);
}

/** Doar mâinile: masca #m-maini și grupul de forme care o folosește. */
export function extrageMaini(interior: string): string {
  const masca = interior.match(/<mask id="m-maini"[\s\S]*?<\/mask>/)?.[0];
  const deschidere = interior.match(/<g\b[^>]*\smask="url\(#m-maini\)"[^>]*>/);
  if (!masca || !deschidere || deschidere.index === undefined) throw new Error('semnatura.svg: lipsesc masca sau grupul mâinilor.');
  const sfarsit = interior.indexOf('</g>', deschidere.index);
  if (sfarsit < 0) throw new Error('semnatura.svg: grupul mâinilor nu se închide.');
  return `${masca}${interior.slice(deschidere.index, sfarsit + 4)}`;
}

/**
 * viewBox-ul mâinilor: cutia contururilor lor (punctele din `d`, care sunt poligoane) plus o
 * margine, ca vârfurile să nu fie tăiate.
 */
export function viewBoxMaini(interior: string, margine = 6): string {
  const deschidere = interior.match(/<g\b[^>]*\smask="url\(#m-maini\)"[^>]*>/);
  const grup = deschidere?.index === undefined ? '' : interior.slice(deschidere.index, interior.indexOf('</g>', deschidere.index));
  const numere = [...grup.matchAll(/\sd="([^"]+)"/g)].flatMap((m) => (m[1]!.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number));
  if (numere.length < 4 || numere.length % 2) throw new Error('semnatura.svg: contururile mâinilor nu sunt poligoane (x,y).');
  const xs = numere.filter((_, i) => i % 2 === 0);
  const ys = numere.filter((_, i) => i % 2 === 1);
  const x = Math.floor(Math.min(...xs) - margine);
  const y = Math.floor(Math.min(...ys) - margine);
  const w = Math.ceil(Math.max(...xs) + margine) - x;
  const h = Math.ceil(Math.max(...ys) + margine) - y;
  return `${x} ${y} ${w} ${h}`;
}

export interface SemnaturaRandata {
  viewBox: string;
  latime: number;
  inaltime: number;
  /** Semnătura întreagă (ecrane ≥ 640 px), cu id-uri prefixate și intervale. */
  intreaga: string;
  /** Doar mâinile (ecrane < 640 px), cu id-uri prefixate separat și intervalele lor (0 → 1). */
  maini: string;
  viewBoxMaini: string;
}

/**
 * Conținutul celor două SVG-uri ale unei instanțe. `sufix` e unic pe pagină (intro, hero…):
 * id-urile măștilor devin `semnatura-{sufix}-m-…` (întreaga) și `semnatura-{sufix}-mobil-m-…`.
 */
export function randeazaSemnatura(svg: string, sufix: string): SemnaturaRandata {
  const s = citesteSemnatura(svg);
  const intreaga = prefixeazaId(adaugaIntervale(s.interior, intervaleSemnatura(s.trasee)), `semnatura-${sufix}-`);
  const doarMaini = extrageMaini(s.interior);
  const traseeMaini = s.trasee.filter((t) => t.cuvant === 'maini');
  const maini = prefixeazaId(adaugaIntervale(doarMaini, intervaleSemnatura(traseeMaini)), `semnatura-${sufix}-mobil-`);
  return { viewBox: s.viewBox, latime: s.latime, inaltime: s.inaltime, intreaga, maini, viewBoxMaini: viewBoxMaini(s.interior) };
}
