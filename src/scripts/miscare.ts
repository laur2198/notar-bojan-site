/**
 * Infrastructura de mișcare (CLAUDE.md §3.2): GSAP + ScrollTrigger, din npm.
 *
 * Regula: o SINGURĂ verificare a preferinței de mișcare, aici. Animațiile se înregistrează cu
 * `adaugaAnimatie()` și rulează numai în interiorul lui gsap.matchMedia() pentru
 * '(prefers-reduced-motion: no-preference)'. La `reduce` (sau dacă preferința se schimbă în timp
 * ce pagina e deschisă), gsap anulează tot ce s-a creat în interior: conținutul rămâne în starea
 * finală, cea din HTML/CSS. Nicio animație nu se scrie în afara acestui modul.
 *
 * Cât timp mișcarea e activă, <html> are atributul data-miscare="activa"; CSS-ul poate ascunde
 * starea inițială a unei dezvăluiri DOAR sub acest atribut, ca fără JS și la reduced-motion
 * conținutul să fie vizibil.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const INTEROGARE_MISCARE = '(prefers-reduced-motion: no-preference)';

export interface Unelte {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
}

/** O animație: primește uneltele; poate întoarce o funcție de curățare. */
export type Animatie = (unelte: Unelte) => void | (() => void);

const animatii: Animatie[] = [];
let pornita: gsap.MatchMedia | null = null;

/** Înregistrează o animație; rulează la pornirea mișcării (și la fiecare repornire). */
export function adaugaAnimatie(animatie: Animatie): void {
  animatii.push(animatie);
}

/** Pornește mișcarea (o singură dată pe pagină). Întoarce contextul gsap.matchMedia. */
export function pornesteMiscarea(radacina: HTMLElement = document.documentElement): gsap.MatchMedia {
  if (pornita) return pornita;
  gsap.registerPlugin(ScrollTrigger);
  pornita = gsap.matchMedia();
  pornita.add(INTEROGARE_MISCARE, () => {
    radacina.dataset.miscare = 'activa';
    const curatari = animatii.map((a) => a({ gsap, ScrollTrigger }));
    return () => {
      curatari.forEach((c) => c?.());
      delete radacina.dataset.miscare;
    };
  });
  return pornita;
}

/** Doar pentru teste: reia starea modulului. */
export function _reseteaza(): void {
  animatii.length = 0;
  pornita?.revert();
  pornita = null;
}
