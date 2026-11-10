/**
 * Grila de puncte din secțiunea frazelor (FrazeSticky.astro), după prototip: punctele de bază
 * (0.125em la pas de 3em, maro de brand la .14) le desenează CSS-ul; aici, pe un canvas peste ele, doar
 * punctele din jurul cursorului (rază 10 pași), mai mari (până la +75%) și opace, cu urmărire
 * lină (lerp 0.12 pe poziție, 0.08 pe intensitate). Redesenare doar cât cutia e vizibilă și cât
 * se mișcă ceva. Doar la pointer fin și fără mișcare redusă; altfel canvasul rămâne gol.
 */

const INTEROGARE = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

/** Influența cursorului asupra unui punct (0–1): 1 sub cursor, 0 la `raza`. */
export function influenta(dx: number, dy: number, raza: number, intensitate: number): number {
  return Math.max(0, 1 - Math.hypot(dx, dy) / raza) * intensitate;
}

export function pornestePuncte(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-puncte]');
  const cutie = canvas?.closest<HTMLElement>('[data-puncte-cutie]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !cutie || !ctx) return;
  const conditie = matchMedia(INTEROGARE);

  let dpr = 1;
  let w = 0;
  let h = 0;
  let marime = 0;
  let pas = 0;
  let raza = 0;
  let vizibil = false;
  let cadru = 0;
  let tinta = 0;
  let intensitate = 0;
  const p = { x: -9999, y: -9999, cx: -9999, cy: -9999 };

  const dimensiuni = () => {
    const em = Number.parseFloat(getComputedStyle(cutie).fontSize);
    const r = cutie.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    marime = 0.125 * em;
    pas = marime + 3 * em;
    raza = pas * 10;
  };

  /* Punctele CSS sunt centrate (background-position: center): aceeași grilă, aici. */
  const desen = () => {
    ctx.clearRect(0, 0, w, h);
    if (intensitate < 0.002) return;
    const x0 = (w / 2) % pas;
    const y0 = (h / 2) % pas;
    const primX = x0 + Math.max(0, Math.floor((p.cx - raza - x0) / pas)) * pas;
    const primY = y0 + Math.max(0, Math.floor((p.cy - raza - y0) / pas)) * pas;
    for (let y = primY; y <= Math.min(h, p.cy + raza); y += pas) {
      for (let x = primX; x <= Math.min(w, p.cx + raza); x += pas) {
        const inf = influenta(x - p.cx, y - p.cy, raza, intensitate);
        if (inf <= 0) continue;
        const m = marime * (1 + 0.75 * inf);
        // Maro de brand (#4A2E1E): peste punctul CSS de .14, ajunge la ~.9 lângă cursor.
        ctx.fillStyle = `rgba(74,46,30,${(0.88 * inf).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, m / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const bucla = () => {
    cadru = 0;
    p.cx += (p.x - p.cx) * 0.12;
    p.cy += (p.y - p.cy) * 0.12;
    intensitate += (tinta - intensitate) * 0.08;
    desen();
    const seMisca = Math.abs(tinta - intensitate) > 0.002 || Math.abs(p.x - p.cx) > 0.5 || Math.abs(p.y - p.cy) > 0.5;
    if (vizibil && seMisca) cadru = requestAnimationFrame(bucla);
  };
  const porneste = () => {
    if (!cadru && vizibil) cadru = requestAnimationFrame(bucla);
  };

  const laMiscare = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const r = cutie.getBoundingClientRect();
    const inauntru = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    p.x = e.clientX - r.left;
    p.y = e.clientY - r.top;
    if (inauntru && tinta === 0) {
      p.cx = p.x;
      p.cy = p.y;
    }
    tinta = inauntru ? 1 : 0;
    porneste();
  };

  const observator = new IntersectionObserver((intrari) => {
    vizibil = intrari.some((i) => i.isIntersecting);
    if (vizibil) porneste();
  });
  const redimensionare = new ResizeObserver(() => {
    dimensiuni();
    desen();
  });

  const activeaza = () => {
    dimensiuni();
    observator.observe(cutie);
    redimensionare.observe(cutie);
    addEventListener('pointermove', laMiscare, { passive: true });
  };
  const dezactiveaza = () => {
    observator.disconnect();
    redimensionare.disconnect();
    removeEventListener('pointermove', laMiscare);
    cancelAnimationFrame(cadru);
    cadru = 0;
    tinta = 0;
    intensitate = 0;
    ctx.clearRect(0, 0, w, h);
  };

  if (conditie.matches) activeaza();
  conditie.addEventListener('change', (e) => (e.matches ? activeaza() : dezactiveaza()));
}
