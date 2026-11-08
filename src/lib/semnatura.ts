/**
 * Citirea desenului semnăturii (src/assets/semnatura.svg) la build: viewBox-ul și path-ul unic.
 * Componenta Semnatura.astro randează propriul <svg> din aceste date, deci desenul final se
 * înlocuiește doar în asset (un singur path, același viewBox).
 */

export interface DateSemnatura {
  viewBox: string;
  latime: number;
  inaltime: number;
  d: string;
  /** Punctul de accent, pus exact pe ultimul punct al path-ului (scris în asset). */
  capat: { x: number; y: number; r: number };
}

/** Ultimul punct al unui path cu comenzi absolute (ultimele două numere ale lui d). */
export function ultimulPunct(d: string): { x: number; y: number } {
  const comenzi = d.match(/[a-zA-Z][^a-zA-Z]*/g) ?? [];
  const ultima = comenzi.filter((c) => !/^[zZ]/.test(c)).at(-1) ?? '';
  if (!/^[MLCSQT]/.test(ultima)) throw new Error(`semnatura.svg: ultima comandă a path-ului trebuie să fie absolută (M, L, C, S, Q, T), nu „${ultima[0]}”.`);
  const numere = ultima.slice(1).match(/-?\d*\.?\d+(?:e-?\d+)?/gi)?.map(Number) ?? [];
  return { x: numere.at(-2)!, y: numere.at(-1)! };
}

export function citesteSemnatura(svg: string): DateSemnatura {
  const faraComentarii = svg.replace(/<!--[\s\S]*?-->/g, '');
  const viewBox = faraComentarii.match(/<svg[^>]*\sviewBox="([^"]+)"/)?.[1];
  if (!viewBox) throw new Error('semnatura.svg: lipsește viewBox pe <svg>.');
  const [, , latime, inaltime] = viewBox.trim().split(/[\s,]+/).map(Number);
  if (!latime || !inaltime) throw new Error(`semnatura.svg: viewBox invalid „${viewBox}”.`);
  const trasee = [...faraComentarii.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)];
  if (trasee.length !== 1) throw new Error(`semnatura.svg: trebuie exact un <path>, găsite ${trasee.length}.`);
  const cerc = faraComentarii.match(/<circle\b[^>]*>/)?.[0] ?? '';
  const atribut = (nume: string) => Number(cerc.match(new RegExp(`\\s${nume}="([^"]+)"`))?.[1]);
  const capat = { x: atribut('cx'), y: atribut('cy'), r: atribut('r') };
  if (!cerc || [capat.x, capat.y, capat.r].some(Number.isNaN)) throw new Error('semnatura.svg: lipsește <circle cx cy r> (punctul de la capătul path-ului).');
  return { viewBox: viewBox.trim(), latime, inaltime, d: trasee[0]![1]!.replace(/\s+/g, ' ').trim(), capat };
}
