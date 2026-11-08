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
}

export function citesteSemnatura(svg: string): DateSemnatura {
  const faraComentarii = svg.replace(/<!--[\s\S]*?-->/g, '');
  const viewBox = faraComentarii.match(/<svg[^>]*\sviewBox="([^"]+)"/)?.[1];
  if (!viewBox) throw new Error('semnatura.svg: lipsește viewBox pe <svg>.');
  const [, , latime, inaltime] = viewBox.trim().split(/[\s,]+/).map(Number);
  if (!latime || !inaltime) throw new Error(`semnatura.svg: viewBox invalid „${viewBox}”.`);
  const trasee = [...faraComentarii.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)];
  if (trasee.length !== 1) throw new Error(`semnatura.svg: trebuie exact un <path>, găsite ${trasee.length}.`);
  return { viewBox: viewBox.trim(), latime, inaltime, d: trasee[0]![1]!.replace(/\s+/g, ' ').trim() };
}
