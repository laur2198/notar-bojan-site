/**
 * Helperi pentru conținut: modul de build și datele biroului (CLAUDE.md §7).
 * Funcțiile pure pentru marcaje stau în `marcaj.ts` și sunt re-exportate aici.
 */
import { getEntry } from 'astro:content';

export {
  MARCAJ,
  MARCAJ_VALIDARE,
  areMarcaj,
  escapeHtml,
  esteDraft,
  marcheazaInHtml,
  marcheazaPlaceholder,
  textAlt,
  type IntrareContinut,
} from './marcaj';

// ---------------------------------------------------------------------------
// Modul de build
// ---------------------------------------------------------------------------

export type ModSite = 'preview' | 'production';

function citesteModSite(valoare: string | undefined): ModSite {
  if (valoare === undefined || valoare === '' || valoare === 'preview') return 'preview';
  if (valoare === 'production') return 'production';
  throw new Error(`SITE_MODE are valoarea „${valoare}”. Valori acceptate: „preview” (implicit) sau „production”.`);
}

/** `preview` (implicit) sau `production`, din variabila de mediu `SITE_MODE`. */
export const SITE_MODE: ModSite = citesteModSite(import.meta.env.SITE_MODE);

export const estePreview = SITE_MODE === 'preview';

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

/** Datele biroului din `src/content/setari/birou.yaml`. */
export async function getBirou() {
  const intrare = await getEntry('birou', 'birou');
  if (!intrare) {
    throw new Error('Lipsește src/content/setari/birou.yaml (colecția „birou”).');
  }
  return intrare.data;
}

export type Birou = Awaited<ReturnType<typeof getBirou>>;
