/**
 * Citirea semnăturii (src/assets/semnatura.svg) la build. Fișierul e făcut manual și nu se
 * modifică din cod: viewBox, `data-linie-y` (linia de dedesubt, în unitățile viewBox-ului), un
 * <g> cu translate, în <defs> câte un <clipPath> cu <rect class="wipe" data-len data-w> pentru
 * fiecare segment, apoi segmentele: <g data-segment clip-path="url(#…)"> cu forme umplute.
 */

export interface SegmentSemnatura {
  /** Id-ul clipPath-ului din fișier (ex. „c0”). */
  id: string;
  /** Lungimea gestului segmentului: dă durata lui, proporțional. */
  len: number;
  /** Lățimea completă a dreptunghiului (dezvăluit integral). */
  w: number;
}

export interface DateSemnatura {
  viewBox: string;
  latime: number;
  inaltime: number;
  /** Poziția liniei de dedesubt, în unitățile viewBox-ului. */
  linieY: number;
  /** Conținutul <svg>-ului, fără comentarii (id-urile încă neprefixate). */
  interior: string;
  segmente: SegmentSemnatura[];
  /** Numărul de segmente declarat în fișier (`data-segmente` pe <svg>), dacă există. */
  segmenteDeclarate: number | null;
}

export function citesteSemnatura(svg: string): DateSemnatura {
  const faraComentarii = svg.replace(/<!--[\s\S]*?-->/g, '');
  const radacina = faraComentarii.match(/<svg\b[^>]*>/)?.[0] ?? '';
  const atribut = (tag: string, nume: string) => tag.match(new RegExp(`\\s${nume}="([^"]*)"`))?.[1];
  const viewBox = atribut(radacina, 'viewBox')?.trim();
  if (!viewBox) throw new Error('semnatura.svg: lipsește viewBox pe <svg>.');
  const [, , latime, inaltime] = viewBox.split(/[\s,]+/).map(Number);
  if (!latime || !inaltime) throw new Error(`semnatura.svg: viewBox invalid „${viewBox}”.`);
  const linieY = Number(atribut(radacina, 'data-linie-y'));
  if (!Number.isFinite(linieY)) throw new Error('semnatura.svg: lipsește data-linie-y pe <svg>.');
  const interior = faraComentarii.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)?.[1]?.trim() ?? '';
  const segmente = [...interior.matchAll(/<clipPath\b[^>]*\sid="([^"]+)"[^>]*>\s*(<rect\b[^>]*>)/g)].map(([, id, rect]) => ({
    id: id!,
    len: Number(atribut(rect!, 'data-len')),
    w: Number(atribut(rect!, 'data-w')),
  }));
  if (!segmente.length) throw new Error('semnatura.svg: niciun <clipPath> cu <rect class="wipe">.');
  for (const s of segmente) {
    if (!(s.len > 0) || !(s.w > 0)) throw new Error(`semnatura.svg: segmentul ${s.id} are data-len/data-w invalide.`);
  }
  const declarate = atribut(radacina, 'data-segmente');
  const segmenteDeclarate = declarate === undefined ? null : Number(declarate);
  if (segmenteDeclarate !== null && segmenteDeclarate !== segmente.length) {
    throw new Error(`semnatura.svg: data-segmente="${declarate}", dar fișierul are ${segmente.length} clipPath-uri cu rect.wipe.`);
  }
  return { viewBox, latime, inaltime, linieY, interior, segmente, segmenteDeclarate };
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
