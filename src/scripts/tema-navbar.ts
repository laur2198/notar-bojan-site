/**
 * Tema navbar-ului după secțiunea de sub el (V3): fiecare secțiune declară
 * `data-tema-sectiune="light|dark"`; navbar-ul (`[data-navbar]`) primește `data-tema` după
 * secțiunea care conține linia de la jumătatea înălțimii lui. Fără GSAP: scroll pasiv + rAF.
 * Nu e mișcare (doar schimbă culorile), deci rulează și la prefers-reduced-motion.
 */

export type Tema = 'light' | 'dark';

export interface ZonaSectiune {
  top: number;
  bottom: number;
  tema: Tema;
}

/** Tema secțiunii care conține linia y (prima, în ordinea documentului), sau null. */
export function temaLaY(y: number, sectiuni: readonly ZonaSectiune[]): Tema | null {
  for (const s of sectiuni) if (s.top <= y && s.bottom >= y) return s.tema;
  return null;
}

/** Pornește urmărirea. Întoarce funcția de oprire. */
export function pornesteTemaNavbar(navbar: HTMLElement | null = document.querySelector('[data-navbar]')): () => void {
  if (!navbar) return () => {};
  const sectiuni = [...document.querySelectorAll<HTMLElement>('[data-tema-sectiune]')];
  let cerut = false;
  const actualizeaza = () => {
    cerut = false;
    const y = navbar.offsetHeight / 2;
    const tema = temaLaY(
      y,
      sectiuni.map((s) => {
        const r = s.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, tema: s.dataset.temaSectiune === 'dark' ? 'dark' : 'light' };
      }),
    );
    if (tema && navbar.dataset.tema !== tema) navbar.dataset.tema = tema;
  };
  const programeaza = () => {
    if (cerut) return;
    cerut = true;
    requestAnimationFrame(actualizeaza);
  };
  addEventListener('scroll', programeaza, { passive: true });
  addEventListener('resize', programeaza);
  actualizeaza();
  return () => {
    removeEventListener('scroll', programeaza);
    removeEventListener('resize', programeaza);
  };
}
