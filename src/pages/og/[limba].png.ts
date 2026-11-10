/**
 * Imaginea Open Graph implicită (1200×630), generată la build, câte una pe limbă:
 * /og/ro.png și /og/en.png. Pe paleta caldă (CLAUDE.md §5, V3b), fără negru: fundal maro
 * închis (--c-brand-900); sus „Notar public în Brașov” (Geist, alb); jos denumirea biroului
 * (Geist, bej --c-brand-300), o linie fină bej și numele notarului mare, în alb (Funnel Display
 * 600, spațiere negativă, ca wordmark-ul), cât de mare încape pe lățime.
 *
 * Desenată cu `sharp` (vine cu Astro, e motorul lui de imagini; nu e o dependență nouă) și cu
 * fonturile din src/assets/og/ (TTF statice derivate din pachetele Fontsource, vezi README-ul de
 * acolo). Pagina Acasă folosește fotografia din hero, dacă există (src/lib/og.ts).
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

interface Font {
  fisier: string;
  familie: string;
}

const DISPLAY: Font = { fisier: 'FunnelDisplay-SemiBold.ttf', familie: 'Funnel Display OG SemiBold' };
const TEXT: Font = { fisier: 'Geist-Regular.ttf', familie: 'Geist OG' };

/**
 * Un rând de text, ca PNG transparent; se micșorează (pas 4 px) până încape în `latimeMax`.
 * `spatiere` e letter-spacing în em (negativ = mai strâns), ca în CSS.
 */
async function rand(text: string, font: Font, marime: number, culoareText: string, latimeMax: number, spatiere = 0) {
  for (let m = marime; m >= 24; m -= 4) {
    // Pango: letter_spacing în 1/1024 dintr-un punct; la dpi 72, 1 pt = 1 px.
    const ls = Math.round(spatiere * m * 1024);
    const { data, info } = await sharp({
      text: {
        text: `<span foreground="${culoareText}" letter_spacing="${ls}">${escape(text)}</span>`,
        font: `${font.familie} ${m}`,
        fontfile: resolve(FONTURI, font.fisier),
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
  await Promise.all([DISPLAY, TEXT].map((f) => readFile(resolve(FONTURI, f.fisier))));

  const margine = 72;
  const latimeText = LATIME_OG - 2 * margine;
  const subtitlu = await rand(t(locale, 'og.subtitlu'), TEXT, 40, culoare('c-paper'), latimeText);
  const denumire = await rand(birou.denumire, TEXT, 28, culoare('c-brand-300'), latimeText);
  const nume = await rand(birou.notar, DISPLAY, 160, culoare('c-paper'), latimeText, -0.045);

  // Sus: subtitlul. Jos, de jos în sus: numele, linia fină, denumirea biroului.
  const straturi: OverlayOptions[] = [{ input: subtitlu.data, top: margine, left: margine }];
  const yNume = INALTIME_OG - margine - nume.inaltime + Math.round(nume.inaltime * 0.12);
  const yLinie = yNume - 20;
  straturi.push({ input: nume.data, top: yNume, left: margine - Math.round(nume.inaltime * 0.03) });
  straturi.push({
    input: { create: { width: latimeText, height: 2, channels: 4, background: culoare('c-brand-300') } },
    top: yLinie,
    left: margine,
  });
  straturi.push({ input: denumire.data, top: yLinie - 16 - denumire.inaltime, left: margine });

  const png = await sharp({ create: { width: LATIME_OG, height: INALTIME_OG, channels: 3, background: culoare('c-brand-900') } })
    .composite(straturi)
    .png({ compressionLevel: 9 })
    .toBuffer();

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
