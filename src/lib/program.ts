/**
 * Starea programului („Deschis acum” / „Închis acum”), calculată pe fusul
 * Europe/Bucharest din `program` și `zileLibere` (CLAUDE.md §8).
 *
 * Funcții pure, fără DOM și fără Astro: rulează în browser (StareProgram,
 * ProgramSaptamana) și în testele Vitest (program.test.ts).
 *
 * Calculul lucrează pe „ora de perete” din București (data YYYY-MM-DD și ora HH:MM
 * obținute prin Intl), deci trecerea la ora de vară sau de iarnă e tratată de Intl.
 */

export const FUS_ORAR = 'Europe/Bucharest';

/** O zi din `birou.program`. Lista are 7 elemente, de luni (index 0) până duminică (index 6). */
export interface ZiProgram {
  zi: string;
  deschidere: string;
  inchidere: string;
  inchis: boolean;
}

export interface ZiLibera {
  data: string;
  motiv: string;
  /** Traducerea motivului (paginile EN). */
  motivEn?: string;
  /** Pe paginile EN: motivul a rămas în română (fără traducere), deci se marchează `lang="ro"`. */
  motivRo?: boolean;
}

/**
 * Ziua liberă pregătită pentru o limbă: pe EN, `motivEn` dacă există; altfel motivul în
 * română, marcat `motivRo` (ca textul să primească `lang="ro"`).
 */
export function ziLiberaPentru(zi: ZiLibera, locale: 'ro' | 'en'): ZiLibera {
  if (locale === 'ro') return { data: zi.data, motiv: zi.motiv };
  return zi.motivEn ? { data: zi.data, motiv: zi.motivEn } : { data: zi.data, motiv: zi.motiv, motivRo: true };
}

/**
 * Scrie `text` în `el`; dacă `fragmentRo` apare în text, îl învelește într-un
 * `<span lang="ro">` (un motiv netradus pe o pagină EN). Doar în browser.
 */
export function scrieCuFragmentRo(el: HTMLElement, text: string, fragmentRo?: string): void {
  const i = fragmentRo ? text.indexOf(fragmentRo) : -1;
  if (!fragmentRo || i < 0) {
    el.textContent = text;
    return;
  }
  const span = document.createElement('span');
  span.lang = 'ro';
  span.textContent = fragmentRo;
  el.replaceChildren(text.slice(0, i), span, text.slice(i + fragmentRo.length));
}

export interface MomentLocal {
  /** Data locală, YYYY-MM-DD. */
  data: string;
  /** 0 = luni … 6 = duminică. */
  ziIndex: number;
  /** Ora locală, HH:MM (00:00–23:59). */
  ora: string;
}

export interface Deschidere {
  data: string;
  ziIndex: number;
  ora: string;
  /** 0 = azi, 1 = mâine etc. */
  zileDistanta: number;
}

export type Stare =
  | { tip: 'deschis'; pana: string }
  | { tip: 'inchis'; motiv?: string; urmatoarea?: Deschidere };

/** Câte zile înainte caută următoarea deschidere. */
const ORIZONT_ZILE = 14;

/** Indexul zilei (0 = luni) pentru o dată YYYY-MM-DD. */
export function indexZi(data: string): number {
  return (new Date(`${data}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** Adaugă `zile` la o dată YYYY-MM-DD (aritmetică pe calendar, fără fus orar). */
export function adaugaZile(data: string, zile: number): string {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + zile);
  return d.toISOString().slice(0, 10);
}

/** Data și ora de perete în fusul dat, pentru un moment absolut. */
export function momentLocal(acum: Date, fus: string = FUS_ORAR): MomentLocal {
  const parti = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: fus,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(acum)
      .map((p) => [p.type, p.value]),
  );
  const data = `${parti.year}-${parti.month}-${parti.day}`;
  return { data, ziIndex: indexZi(data), ora: `${parti.hour}:${parti.minute}` };
}

function ziDeschisa(zi: ZiProgram | undefined): zi is ZiProgram {
  return zi !== undefined && !zi.inchis && zi.deschidere !== '' && zi.inchidere !== '';
}

/** Starea biroului la momentul `acum`. */
export function calculeazaStare(
  acum: Date,
  program: readonly ZiProgram[],
  zileLibere: readonly ZiLibera[],
  fus: string = FUS_ORAR,
): Stare {
  const m = momentLocal(acum, fus);
  const libere = new Map(zileLibere.map((z) => [z.data, z.motiv]));
  const motivAzi = libere.get(m.data);
  const azi = program[m.ziIndex];

  if (motivAzi === undefined && ziDeschisa(azi) && m.ora >= azi.deschidere && m.ora < azi.inchidere) {
    return { tip: 'deschis', pana: azi.inchidere };
  }

  for (let distanta = 0; distanta <= ORIZONT_ZILE; distanta++) {
    const data = adaugaZile(m.data, distanta);
    if (libere.has(data)) continue;
    const ziIndex = indexZi(data);
    const zi = program[ziIndex];
    if (!ziDeschisa(zi)) continue;
    // Azi contează doar dacă încă nu s-a deschis (dacă era deschis, am ieșit mai sus).
    if (distanta === 0 && m.ora >= zi.deschidere) continue;
    return {
      tip: 'inchis',
      ...(motivAzi !== undefined && { motiv: motivAzi }),
      urmatoarea: { data, ziIndex, ora: zi.deschidere, zileDistanta: distanta },
    };
  }

  return { tip: 'inchis', ...(motivAzi !== undefined && { motiv: motivAzi }) };
}

// ---------------------------------------------------------------------------
// Mesajul afișat
// ---------------------------------------------------------------------------

/** Textele de interfață necesare mesajului; vin din src/i18n (cheile `program.*`). */
export interface EticheteStare {
  deschisAcum: string;
  /** Conține `{ora}`. */
  panaLa: string;
  inchisAcum: string;
  /** Conține `{motiv}`. */
  inchisAstazi: string;
  /** Conține `{cand}` și `{ora}`. */
  deschidem: string;
  azi: string;
  maine: string;
  /** Conține `{zi}`, ex. „{zi}” (RO) sau „on {zi}” (EN). */
  inZiua: string;
  /** Conține `{data}`, ex. „pe {data}” (RO) sau „on {data}” (EN). */
  laData: string;
  /** Numele zilelor, de luni până duminică. */
  zile: readonly string[];
  /** Locale pentru formatul datei, ex. „ro-RO”, „en-GB”. */
  localeData: string;
}

export const SEPARATOR = ' · ';

function inlocuieste(sablon: string, valori: Record<string, string>): string {
  return sablon.replace(/\{(\w+)\}/g, (tot, cheie: string) => valori[cheie] ?? tot);
}

function candDeschidem(urm: Deschidere, e: EticheteStare): string {
  if (urm.zileDistanta === 0) return e.azi;
  if (urm.zileDistanta === 1) return e.maine;
  if (urm.zileDistanta < 7) return inlocuieste(e.inZiua, { zi: e.zile[urm.ziIndex] ?? '' });
  const data = new Intl.DateTimeFormat(e.localeData, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${urm.data}T00:00:00Z`),
  );
  return inlocuieste(e.laData, { data });
}

/** Textul stării, ex. „Deschis acum · până la 17:00”. */
export function mesajStare(stare: Stare, e: EticheteStare): string {
  if (stare.tip === 'deschis') {
    return e.deschisAcum + SEPARATOR + inlocuieste(e.panaLa, { ora: stare.pana });
  }
  const inceput = stare.motiv !== undefined ? inlocuieste(e.inchisAstazi, { motiv: stare.motiv }) : e.inchisAcum;
  if (!stare.urmatoarea) return inceput;
  return (
    inceput + SEPARATOR + inlocuieste(e.deschidem, { cand: candDeschidem(stare.urmatoarea, e), ora: stare.urmatoarea.ora })
  );
}

// ---------------------------------------------------------------------------
// Zile libere apropiate (nota din banda de informații)
// ---------------------------------------------------------------------------

/**
 * Zilele libere de azi până la `zile` zile înainte (inclusiv), sortate după dată.
 * Ex. pe 20 dec., cu fereastra de 14 zile: 25 și 26 decembrie, 1 și 2 ianuarie.
 */
export function zileLibereApropiate(
  acum: Date,
  zileLibere: readonly ZiLibera[],
  zile = 14,
  fus: string = FUS_ORAR,
): ZiLibera[] {
  const azi = momentLocal(acum, fus).data;
  const limita = adaugaZile(azi, zile);
  return zileLibere.filter((z) => z.data >= azi && z.data <= limita).sort((a, b) => a.data.localeCompare(b.data));
}

/** Zilele libere de azi încolo, sortate (lista din „Vedeți programul complet”). */
export function zileLibereViitoare(acum: Date, zileLibere: readonly ZiLibera[], fus: string = FUS_ORAR): ZiLibera[] {
  const azi = momentLocal(acum, fus).data;
  return zileLibere.filter((z) => z.data >= azi).sort((a, b) => a.data.localeCompare(b.data));
}
