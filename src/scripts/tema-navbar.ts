/**
 * Tema navbar-ului după secțiunea de sub el (V3): fiecare secțiune declară
 * `data-tema-sectiune="light|dark"`; navbar-ul (`[data-navbar]`) primește `data-tema` după
 * secțiunea care conține linia de la jumătatea înălțimii lui. Fără GSAP: scroll pasiv + rAF.
 * Nu e mișcare (doar schimbă culorile), deci rulează și la prefers-reduced-motion.
 *
 * Tot aici, `data-derulat` pe navbar când pagina e derulată cu mai mult de PRAG_DERULARE px: sub
 * pragul de desktop, navbar-ul primește atunci fundal plin în culoarea temei (Header.astro), ca
 * textul paginii să nu treacă pe sub el. La încărcare, starea (temă + derulare) se aplică fără
 * tranziție, deci o pagină reîncărcată deja derulată pornește direct cu fundal.
 */

export type Tema = 'light' | 'dark';

export interface ZonaSectiune {
  top: number;
  bottom: number;
  tema: Tema;
}

/**
 * Tema secțiunii care conține linia y, sau null. Dacă mai multe o conțin, câștigă ultima în
 * ordinea documentului: cea mai interioară (ex. o secțiune închisă din <main data-tema-sectiune="light">)
 * sau, la granița dintre două secțiuni alăturate, cea care începe.
 */
export function temaLaY(y: number, sectiuni: readonly ZonaSectiune[]): Tema | null {
  let tema: Tema | null = null;
  for (const s of sectiuni) if (s.top <= y && s.bottom > y) tema = s.tema;
  return tema;
}

/**
 * Tema unui strat care acoperă linia y (ex. o bandă a shutter-ului, scalată): doar dacă stratul
 * chiar se vede acolo (dreptunghiul cu transformarea aplicată, minim 2 px înălțime).
 */
function temaStrat(y: number, straturi: HTMLElement[]): Tema | null {
  for (const s of straturi) {
    const r = s.getBoundingClientRect();
    if (r.height >= 2 && r.top <= y && r.bottom > y) return s.dataset.temaStrat === 'dark' ? 'dark' : 'light';
  }
  return null;
}

/**
 * Eveniment pe `document` care cere recalcularea temei fără derulare (ex. benzile shutter-ului,
 * care continuă să se miște după oprirea derulării, din cauza scrub-ului întârziat).
 */
export const EVENIMENT_TEMA = 'tema-navbar-actualizeaza';

/** Peste câți px de derulare navbar-ul de sub prag primește fundal plin. */
export const PRAG_DERULARE = 8;

/** Navbar-ul primește fundal plin (sub pragul de desktop) peste PRAG_DERULARE px de derulare. */
export const esteDerulat = (scrollY: number) => scrollY > PRAG_DERULARE;

/** Pornește urmărirea. Întoarce funcția de oprire. */
export function pornesteTemaNavbar(navbar: HTMLElement | null = document.querySelector('[data-navbar]')): () => void {
  if (!navbar) return () => {};
  // Panoul meniului compact e în navbar: nu e o secțiune de sub el.
  const sectiuni = [...document.querySelectorAll<HTMLElement>('[data-tema-sectiune]')].filter((s) => !navbar.contains(s));
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
    // Straturile peste secțiuni (ex. benzile shutter-ului) au prioritate unde acoperă linia.
    const strat = temaStrat(y, [...document.querySelectorAll<HTMLElement>('[data-tema-strat]')]);
    const finala = strat ?? tema;
    if (finala && navbar.dataset.tema !== finala) navbar.dataset.tema = finala;
    navbar.toggleAttribute('data-derulat', esteDerulat(window.scrollY));
  };
  const programeaza = () => {
    if (cerut) return;
    cerut = true;
    requestAnimationFrame(actualizeaza);
  };
  addEventListener('scroll', programeaza, { passive: true });
  addEventListener('resize', programeaza);
  document.addEventListener(EVENIMENT_TEMA, programeaza);
  // Prima potrivire (ex. pagina reîncărcată la jumătate) e imediată, fără tranziția de culoare.
  navbar.toggleAttribute('data-fara-tranzitie', true);
  actualizeaza();
  requestAnimationFrame(() => requestAnimationFrame(() => navbar.removeAttribute('data-fara-tranzitie')));
  return () => {
    removeEventListener('scroll', programeaza);
    removeEventListener('resize', programeaza);
    document.removeEventListener(EVENIMENT_TEMA, programeaza);
  };
}
