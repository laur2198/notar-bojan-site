/**
 * Cursorul cu bulă (Cursor.astro): punctul urmărește mouse-ul cu întârziere (lerp 0.22 pe cadru),
 * iar bula afișează textul din data-cursor al elementului de sub mouse. Pornește doar la
 * (hover: hover) and (pointer: fine) și fără mișcare redusă; se oprește dacă preferința se schimbă.
 */

export const INTEROGARE_CURSOR = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
/** Fracțiunea din distanța rămasă parcursă la fiecare cadru. */
export const LERP = 0.22;
/** Sub această distanță (px) de marginea dreaptă, bula trece în stânga cursorului. */
export const MARGINE = 220;

/** Un pas de interpolare liniară: de la `curent` spre `tinta`. */
export const lerp = (curent: number, tinta: number, f = LERP) => curent + (tinta - curent) * f;

export function pornesteCursor(): void {
  const gasit = document.querySelector<HTMLElement>('[data-cursor-urmaritor]');
  const gasitBula = gasit?.querySelector<HTMLElement>('[data-cursor-bula]');
  if (!gasit || !gasitBula) return;
  const cursor: HTMLElement = gasit;
  const bula: HTMLElement = gasitBula;
  const conditie = matchMedia(INTEROGARE_CURSOR);

  let mx = 0;
  let my = 0;
  let cx = 0;
  let cy = 0;
  let mutat = false;
  let cadru = 0;

  const programeaza = () => {
    if (!cadru) cadru = requestAnimationFrame(bucla);
  };

  const laMiscare = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX;
    my = e.clientY;
    if (!mutat) {
      cx = mx;
      cy = my;
      mutat = true;
      cursor.toggleAttribute('data-activ', true);
    }
    programeaza();
  };

  function bucla() {
    cadru = 0;
    cx = lerp(cx, mx);
    cy = lerp(cy, my);
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    if (mutat) {
      const tinta = document.elementFromPoint(mx, my)?.closest<HTMLElement>('[data-cursor]');
      const text = tinta?.dataset.cursor ?? '';
      if (text && bula.textContent !== text) bula.textContent = text;
      cursor.toggleAttribute('data-bula', !!text);
      cursor.toggleAttribute('data-margine', !!text && mx > innerWidth - MARGINE);
    }
    // Bucla se oprește când punctul a ajuns la mouse; o repornesc mișcarea și derularea.
    if (Math.abs(mx - cx) > 0.1 || Math.abs(my - cy) > 0.1) programeaza();
  }

  const porneste = () => {
    addEventListener('pointermove', laMiscare, { passive: true });
    addEventListener('scroll', programeaza, { passive: true });
  };
  const opreste = () => {
    removeEventListener('pointermove', laMiscare);
    removeEventListener('scroll', programeaza);
    cancelAnimationFrame(cadru);
    cadru = 0;
    mutat = false;
    cursor.removeAttribute('data-activ');
    cursor.removeAttribute('data-bula');
  };

  if (conditie.matches) porneste();
  conditie.addEventListener('change', (e) => (e.matches ? porneste() : opreste()));
}
