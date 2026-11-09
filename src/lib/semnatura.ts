/**
 * Citirea semnăturii (src/assets/semnatura.svg) la build. Fișierul e făcut manual și nu se
 * modifică din cod: o singură linie cu stroke (fill="none"), viewBox, `data-linie-y` (linia de
 * dedesubt, în unitățile viewBox-ului), `data-segmente` (numărul de path-uri) și path-urile, fiecare
 * cu pathLength="100" și data-len (lungimea reală, care dă durata lui în animație).
 */

export interface DateSemnatura {
  viewBox: string;
  latime: number;
  inaltime: number;
  /** Poziția liniei de dedesubt, în unitățile viewBox-ului. */
  linieY: number;
  /** Grosimea liniei din fișier (stroke-width pe <svg>), în px (vector-effect non-scaling-stroke). */
  grosime: number;
  /** Conținutul <svg>-ului, fără comentarii. */
  interior: string;
  /** data-len pentru fiecare <path>, în ordinea din fișier (stânga → dreapta). */
  lungimi: number[];
  /** Numărul de path-uri declarat în fișier (`data-segmente` pe <svg>). */
  segmenteDeclarate: number;
}

const atribut = (tag: string, nume: string) => tag.match(new RegExp(`\\s${nume}="([^"]*)"`))?.[1];

export function citesteSemnatura(svg: string): DateSemnatura {
  const faraComentarii = svg.replace(/<!--[\s\S]*?-->/g, '');
  const radacina = faraComentarii.match(/<svg\b[^>]*>/)?.[0] ?? '';
  const viewBox = atribut(radacina, 'viewBox')?.trim();
  if (!viewBox) throw new Error('semnatura.svg: lipsește viewBox pe <svg>.');
  const [, , latime, inaltime] = viewBox.split(/[\s,]+/).map(Number);
  if (!latime || !inaltime) throw new Error(`semnatura.svg: viewBox invalid „${viewBox}”.`);
  const linieY = Number(atribut(radacina, 'data-linie-y'));
  if (!Number.isFinite(linieY)) throw new Error('semnatura.svg: lipsește data-linie-y pe <svg>.');
  const segmenteDeclarate = Number(atribut(radacina, 'data-segmente'));
  if (!Number.isInteger(segmenteDeclarate)) throw new Error('semnatura.svg: lipsește data-segmente pe <svg>.');
  const grosime = Number(atribut(radacina, 'stroke-width') ?? 2);
  const interior = faraComentarii.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)?.[1]?.trim() ?? '';
  const trasee = [...interior.matchAll(/<path\b[^>]*>/g)].map((m) => m[0]);
  if (trasee.length !== segmenteDeclarate) {
    throw new Error(`semnatura.svg: data-segmente="${segmenteDeclarate}", dar fișierul are ${trasee.length} <path>.`);
  }
  const lungimi = trasee.map((p, i) => {
    if (atribut(p, 'pathLength') !== '100') throw new Error(`semnatura.svg: path-ul ${i} nu are pathLength="100".`);
    const len = Number(atribut(p, 'data-len'));
    if (!(len > 0)) throw new Error(`semnatura.svg: path-ul ${i} nu are data-len valid.`);
    return len;
  });
  return { viewBox, latime, inaltime, linieY, grosime, interior, lungimi, segmenteDeclarate };
}

/**
 * Scrie pe fiecare <path>, în ordine, intervalul lui din gestul total: data-a (început) și
 * data-b (sfârșit), fracțiuni din 1.
 */
export function adaugaIntervale(interior: string, intervale: { delay: number; d: number }[]): string {
  let i = 0;
  const rezultat = interior.replace(/<path\b/g, (potrivire) => {
    const interval = intervale[i++];
    if (!interval) return potrivire;
    const b = i === intervale.length ? 1 : interval.delay + interval.d;
    return `${potrivire} data-a="${+interval.delay.toFixed(6)}" data-b="${+b.toFixed(6)}"`;
  });
  if (i !== intervale.length) throw new Error(`semnatura.svg: ${i} path-uri, dar ${intervale.length} intervale.`);
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
