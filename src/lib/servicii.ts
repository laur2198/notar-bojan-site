/**
 * Logica paginilor de servicii (pură, testată în servicii.test.ts).
 */

export interface ServiciuOrdonat {
  slug: string;
  ordine: number;
}

/**
 * Serviciile „vecine” după `ordine`, fără cel curent: cele mai apropiate ca ordine
 * (la egalitate, cel de dinainte), apoi afișate în ordinea lor obișnuită.
 */
export function serviciiVecine<T extends ServiciuOrdonat>(toate: readonly T[], slugCurent: string, cate = 3): T[] {
  const curent = toate.find((s) => s.slug === slugCurent);
  if (!curent) return [];
  return toate
    .filter((s) => s.slug !== slugCurent)
    .sort((a, b) => Math.abs(a.ordine - curent.ordine) - Math.abs(b.ordine - curent.ordine) || a.ordine - b.ordine)
    .slice(0, cate)
    .sort((a, b) => a.ordine - b.ordine);
}

/** Serviciile fără onorariu în preturi/ro.yaml și onorariile fără pagină de serviciu. */
export function verificaPreturi(sluguriServicii: readonly string[], sluguriPreturi: readonly string[]) {
  const servicii = new Set(sluguriServicii);
  const preturi = new Set(sluguriPreturi);
  return {
    faraOnorariu: sluguriServicii.filter((s) => !preturi.has(s)),
    faraPagina: sluguriPreturi.filter((s) => !servicii.has(s)),
  };
}
