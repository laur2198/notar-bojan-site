/**
 * Helperi pentru conținut: datele biroului, detectarea textelor nevalidate
 * și evidențierea marcajelor «DE COMPLETAT» (CLAUDE.md §7).
 */
import { getEntry } from 'astro:content';

export const MARCAJ = '«DE COMPLETAT';

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

// ---------------------------------------------------------------------------
// Texte nevalidate
// ---------------------------------------------------------------------------

function contineMarcaj(valoare: unknown): boolean {
  if (typeof valoare === 'string') return valoare.includes(MARCAJ);
  if (Array.isArray(valoare)) return valoare.some(contineMarcaj);
  if (valoare !== null && typeof valoare === 'object' && !(valoare instanceof Date)) {
    return Object.values(valoare).some(contineMarcaj);
  }
  return false;
}

interface IntrareContinut {
  data: unknown;
  body?: string;
}

/**
 * `true` dacă intrarea nu e aprobată de birou: `validat === false`, sau orice
 * câmp text (inclusiv corpul Markdown) conține `«DE COMPLETAT`.
 */
export function esteDraft(intrare: IntrareContinut): boolean {
  const date = intrare.data as { validat?: unknown } | null;
  if (date !== null && typeof date === 'object' && date.validat === false) return true;
  return contineMarcaj(intrare.data) || (intrare.body?.includes(MARCAJ) ?? false);
}

// ---------------------------------------------------------------------------
// Evidențierea marcajelor
// ---------------------------------------------------------------------------

const ENTITATI: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (caracter) => ENTITATI[caracter] ?? caracter);
}

/** `«DE COMPLETAT»`, `«DE COMPLETAT: …»` sau un marcaj neînchis (până la capătul textului). */
const REGEX_MARCAJ = /«DE COMPLETAT(?:[^»]*»|[^»]*$)/g;

/**
 * Întoarce HTML sigur pentru `set:html`: textul e escapat, iar fiecare marcaj
 * `«DE COMPLETAT…»` e înfășurat în `<mark class="todo">`.
 */
export function marcheazaPlaceholder(text: string): string {
  let rezultat = '';
  let ultim = 0;
  for (const potrivire of text.matchAll(REGEX_MARCAJ)) {
    const start = potrivire.index;
    rezultat += escapeHtml(text.slice(ultim, start));
    rezultat += `<mark class="todo">${escapeHtml(potrivire[0])}</mark>`;
    ultim = start + potrivire[0].length;
  }
  return rezultat + escapeHtml(text.slice(ultim));
}
