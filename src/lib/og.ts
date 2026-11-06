/**
 * Imaginea Open Graph (og:image) a paginilor: implicit /og/{limba}.png (generată la build de
 * src/pages/og/[limba].png.ts); pe Acasă, fotografia din hero, dacă există, decupată 1200×630.
 * Tot aici, imaginea biroului pentru JSON-LD (aceeași fotografie din hero).
 */
import { getImage } from 'astro:assets';
import { getEntry } from 'astro:content';
import { t, type Locale } from '../i18n';
import { url } from './url';

export const LATIME_OG = 1200;
export const INALTIME_OG = 630;

export interface ImagineOg {
  /** Calea (cu baza site-ului) sau adresa absolută; Seo.astro o face absolută. */
  src: string;
  latime: number;
  inaltime: number;
  alt: string;
  tip: 'image/png' | 'image/jpeg';
}

/** Imaginea implicită, pe limbă. */
export function imagineOgImplicita(locale: Locale, notar: string): ImagineOg {
  return { src: url(`/og/${locale}.png`), latime: LATIME_OG, inaltime: INALTIME_OG, alt: t(locale, 'og.alt', { notar }), tip: 'image/png' };
}

/**
 * Fotografia din hero, 1200×630 JPEG, dacă a fost încărcată: cea din pagini/{limba}/acasa.yaml,
 * altfel cea din varianta RO. Textul alternativ vine din fișierul limbii cerute.
 */
export async function imagineOgHero(locale: Locale = 'ro'): Promise<(Omit<ImagineOg, 'alt'> & { alt?: string }) | undefined> {
  const [acasa, acasaRo] = await Promise.all([getEntry('acasa', `${locale}/acasa`), getEntry('acasa', 'ro/acasa')]);
  const imagine = acasa?.data.hero.imagine ?? acasaRo?.data.hero.imagine;
  if (!imagine) return undefined;
  const rezultat = await getImage({ src: imagine, width: LATIME_OG, height: INALTIME_OG, fit: 'cover', format: 'jpg', quality: 82 });
  return { src: rezultat.src, latime: LATIME_OG, inaltime: INALTIME_OG, alt: acasa?.data.hero.imagineAlt || undefined, tip: 'image/jpeg' };
}
