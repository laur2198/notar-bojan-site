/**
 * Marcajele «DE COMPLETAT» (CLAUDE.md §3.5, §7). Funcții pure, fără dependențe
 * de Astro, ca să poată fi testate cu Vitest.
 */

export const MARCAJ = '«DE COMPLETAT';

export function areMarcaj(text: string | null | undefined): boolean {
  return typeof text === 'string' && text.includes(MARCAJ);
}

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

/**
 * Marchează `«DE COMPLETAT…»` în HTML deja randat (ex. corpul Markdown): doar în textul
 * dintre etichete, nu în atribute. Textul e deja escapat de randare, deci nu se mai escapează.
 */
export function marcheazaInHtml(html: string): string {
  return html
    .split(/(<[^>]*>)/)
    .map((bucata) =>
      bucata.startsWith('<') || !bucata.includes(MARCAJ)
        ? bucata
        : bucata.replace(REGEX_MARCAJ, (m) => `<mark class="todo">${m}</mark>`),
    )
    .join('');
}

function contineMarcaj(valoare: unknown): boolean {
  if (typeof valoare === 'string') return valoare.includes(MARCAJ);
  if (Array.isArray(valoare)) return valoare.some(contineMarcaj);
  if (valoare !== null && typeof valoare === 'object' && !(valoare instanceof Date)) {
    return Object.values(valoare).some(contineMarcaj);
  }
  return false;
}

export interface IntrareContinut {
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
