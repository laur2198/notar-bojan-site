/**
 * Denumirea oficială a biroului (cerință a clientei, V3c): „Birou Individual Notarial Bojan Elena
 * Luminița”, niciodată doar numele persoanei sau o formă prescurtată, și netradusă în EN.
 * Pentru afișarea pe două rânduri (navbar, wordmark-ul gigant), o împărțim în forma juridică
 * (sus) și numele notarului (jos), din câmpurile `denumire` și `notar` din birou.yaml.
 */
export interface DenumireImpartita {
  /** Ex. „Birou Individual Notarial”. Gol dacă denumirea nu se termină cu numele notarului. */
  sus: string;
  /** Ex. „Bojan Elena Luminița” (sau toată denumirea, dacă nu se poate împărți). */
  jos: string;
}

export function imparteDenumirea(denumire: string, notar: string): DenumireImpartita {
  const d = denumire.trim();
  const n = notar.trim();
  if (n && d.endsWith(n) && d.length > n.length) {
    return { sus: d.slice(0, d.length - n.length).trim(), jos: n };
  }
  return { sus: '', jos: d };
}
