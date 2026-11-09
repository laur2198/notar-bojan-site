/**
 * Imaginea Open Graph implicită (1200×630), generată la build, câte una pe limbă:
 * /og/ro.png și /og/en.png. Fundal ink, numele notarului cu majuscule (ca în wordmark),
 * alb, „Notar public în Brașov” dedesubt și denumirea biroului jos, în muted-dark.
 *
 * Desenată cu `sharp` (vine cu Astro, e motorul lui de imagini; nu e o dependență nouă) și cu
 * fonturile Inter din src/assets/og/ (vezi README-ul de acolo). Pagina Acasă folosește
 * fotografia din hero, dacă există (src/lib/og.ts).
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp, { type OverlayOptions } from 'sharp';
import { LOCALES, t, type Locale } from '../../i18n';
import { getBirou } from '../../lib/continut';
import { INALTIME_OG, LATIME_OG } from '../../lib/og';
import { culoare } from '../../lib/tokens';

export const getStaticPaths = (() => LOCALES.map((limba) => ({ params: { limba } }))) satisfies GetStaticPaths;

const FONTURI = resolve(process.cwd(), 'src/assets/og');

/** Escapare pentru marcajul Pango (textul vine din conținut). */
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Un rând de text, ca PNG transparent, cu fontul dat; se micșorează dacă depășește `latimeMax`. */
async function rand(text: string, fisierFont: string, familie: string, marime: number, culoareText: string, latimeMax: number) {
  for (let m = marime; m >= 24; m -= 4) {
    const { data, info } = await sharp({
      text: {
        text: `<span foreground="${culoareText}">${escape(text)}</span>`,
        font: `${familie} ${m}`,
        fontfile: resolve(FONTURI, fisierFont),
        rgba: true,
        dpi: 72,
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true });
    if (info.width <= latimeMax || m <= 24) return { data, latime: info.width, inaltime: info.height };
  }
  throw new Error('unreachable');
}

export const GET: APIRoute = async ({ params }) => {
  const locale = params.limba as Locale;
  const birou = await getBirou();
  // Fonturile trebuie să existe: fără ele, textul ar ieși cu pătrățele pe serverul de build.
  await Promise.all(['Inter-Bold.otf', 'Inter-Regular.otf'].map((f) => readFile(resolve(FONTURI, f))));

  const margine = 88;
  const latimeText = LATIME_OG - 2 * margine;
  const alb = culoare('c-paper');
  const nume = await rand(birou.notar.toLocaleUpperCase('ro'), 'Inter-Bold.otf', 'Inter Bold', 76, alb, latimeText);
  const subtitlu = await rand(t(locale, 'og.subtitlu'), 'Inter-Regular.otf', 'Inter', 44, alb, latimeText);
  const denumire = await rand(birou.denumire, 'Inter-Regular.otf', 'Inter', 28, culoare('c-muted-dark'), latimeText);

  // Bloc centrat vertical: linie de accent, nume, subtitlu; denumirea biroului jos.
  const linie = { latime: 96, inaltime: 6 };
  const spatiu = 28;
  const inaltimeBloc = linie.inaltime + spatiu + nume.inaltime + 12 + subtitlu.inaltime;
  let y = Math.round((INALTIME_OG - inaltimeBloc) / 2) - 24;
  const straturi: OverlayOptions[] = [];
  straturi.push({
    input: { create: { width: linie.latime, height: linie.inaltime, channels: 4, background: culoare('c-muted-dark') } },
    top: y,
    left: margine,
  });
  y += linie.inaltime + spatiu;
  straturi.push({ input: nume.data, top: y, left: margine });
  y += nume.inaltime + 12;
  straturi.push({ input: subtitlu.data, top: y, left: margine });
  straturi.push({ input: denumire.data, top: INALTIME_OG - margine + 20 - denumire.inaltime, left: margine });

  const png = await sharp({ create: { width: LATIME_OG, height: INALTIME_OG, channels: 3, background: culoare('c-ink') } })
    .composite(straturi)
    .png({ compressionLevel: 9 })
    .toBuffer();

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
