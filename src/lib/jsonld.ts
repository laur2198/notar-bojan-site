/**
 * Date structurate JSON-LD (CLAUDE.md §9). Funcții pure, testate în jsonld.test.ts.
 * Adresele sunt absolute: `site` (SITE_URL) + calea cu bază.
 */

/** `@id`-ul stabil al biroului (entitatea `Notary`), folosit și de etapa 8: „{site}{bază}#birou”. */
export function idBirou(radacinaAbsoluta: string): string {
  return `${radacinaAbsoluta.replace(/#.*$/, '')}#birou`;
}

export interface Firimitura {
  nume: string;
  url: string;
}

export function breadcrumbList(elemente: readonly Firimitura[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: elemente.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.nume,
      item: e.url,
    })),
  };
}

export function serviciu(date: { nume: string; descriere: string; url: string; idBirou: string; zona: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: date.nume,
    description: date.descriere,
    url: date.url,
    serviceType: date.nume,
    areaServed: { '@type': 'City', name: date.zona },
    provider: { '@id': date.idBirou },
  };
}

/** JSON sigur în `<script type="application/ld+json">`: „<” devine „<” (fără `</script>` în text). */
export function serializeaza(date: unknown): string {
  return JSON.stringify(date).replace(/</g, '\\u003c');
}

/**
 * FAQPage (schema.org, Google): `mainEntity` cu `Question` / `acceptedAnswer` → `Answer`.
 * Întrebările cu răspuns încă necompletat («DE COMPLETAT», în întrebare sau răspuns) sunt excluse.
 */
export function faqPage(intrebari: readonly { intrebare: string; raspuns: string }[], limba: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: limba,
    mainEntity: intrebari
      .filter((q) => !q.intrebare.includes('«DE COMPLETAT') && !q.raspuns.includes('«DE COMPLETAT'))
      .map((q) => ({
        '@type': 'Question',
        name: q.intrebare,
        acceptedAnswer: { '@type': 'Answer', text: q.raspuns },
      })),
  };
}

// ---------------------------------------------------------------------------
// Biroul: nodul `Notary` (etapa 8)
// ---------------------------------------------------------------------------

const MARCAJ_DE_COMPLETAT = '«DE COMPLETAT';
const TELEFON_E164 = /^\+40\d{9}$/;
const EMAIL_VALID = /^[^\s@«»]+@[^\s@«»]+\.[^\s@«»]+$/;
const ZILE_SCHEMA = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

/** Textul, curățat, doar dacă e completat (nu e gol și nu conține «DE COMPLETAT). */
function completat(text: string | null | undefined): string | undefined {
  const t = text?.trim();
  return t && !t.includes(MARCAJ_DE_COMPLETAT) ? t : undefined;
}

function httpsValid(text: string | null | undefined): string | undefined {
  const t = completat(text);
  if (!t) return undefined;
  try {
    return new URL(t).protocol === 'https:' ? t : undefined;
  } catch {
    return undefined;
  }
}

/** Datele biroului necesare nodului `Notary` (subset din setari/birou.yaml). */
export interface DateBirouJsonLd {
  denumire: string;
  telefon: string;
  email: string;
  adresa: { strada: string; oras: string; judet: string; codPostal: string };
  program: readonly { zi: string; deschidere: string; inchidere: string; inchis: boolean }[];
  zileLibere: readonly { data: string; motiv: string }[];
  googleProfilUrl: string;
  coordonate: { lat: number | null; lng: number | null };
}

/** `openingHoursSpecification`: zilele cu același interval se grupează; zilele închise nu apar. */
export function programSchema(program: DateBirouJsonLd['program']) {
  const grupe = new Map<string, { dayOfWeek: string[]; opens: string; closes: string }>();
  program.forEach((zi, i) => {
    if (zi.inchis) return;
    const cheie = `${zi.deschidere}-${zi.inchidere}`;
    const grupa = grupe.get(cheie) ?? { dayOfWeek: [], opens: zi.deschidere, closes: zi.inchidere };
    grupa.dayOfWeek.push(ZILE_SCHEMA[i]!);
    grupe.set(cheie, grupa);
  });
  return [...grupe.values()].map((g) => ({ '@type': 'OpeningHoursSpecification', ...g }));
}

/**
 * `specialOpeningHoursSpecification`: zilele libere din următoarele 12 luni (inclusiv azi), ca zile
 * închise (convenția schema.org/Google: `opens` = `closes` = „00:00”). `azi` e data „YYYY-MM-DD”.
 */
export function zileLibereSchema(zileLibere: DateBirouJsonLd['zileLibere'], azi: string) {
  const limita = new Date(`${azi}T00:00:00Z`);
  limita.setUTCFullYear(limita.getUTCFullYear() + 1);
  const pana = limita.toISOString().slice(0, 10);
  return zileLibere
    .filter((z) => z.data >= azi && z.data < pana)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((z) => ({ '@type': 'OpeningHoursSpecification', validFrom: z.data, validThrough: z.data, opens: '00:00', closes: '00:00' }));
}

/**
 * Nodul `Notary` al biroului (CLAUDE.md §9), cu `@id` „{site}{bază}#birou”, același pe care îl referă
 * paginile de serviciu. Orice câmp gol sau cu «DE COMPLETAT» lipsește (nu se pune nici parțial).
 * `geo` doar cu ambele coordonate. Fără `aggregateRating` și fără `review` (vezi CLAUDE.md §9).
 */
export function notaryBirou(
  birou: DateBirouJsonLd,
  optiuni: { radacina: string; azi: string; imagine?: string; limbi?: readonly string[] },
) {
  const { adresa } = birou;
  const telefon = completat(birou.telefon);
  const email = completat(birou.email);
  const strada = completat(adresa.strada);
  const oras = completat(adresa.oras);
  const judet = completat(adresa.judet);
  const codPostal = completat(adresa.codPostal);
  const profil = httpsValid(birou.googleProfilUrl);
  const program = programSchema(birou.program);
  const libere = zileLibereSchema(birou.zileLibere, optiuni.azi);
  const { lat, lng } = birou.coordonate;
  const denumire = completat(birou.denumire);

  return {
    '@context': 'https://schema.org',
    '@type': 'Notary',
    '@id': idBirou(optiuni.radacina),
    ...(denumire && { name: denumire }),
    url: optiuni.radacina,
    ...(telefon && TELEFON_E164.test(telefon) && { telephone: telefon }),
    ...(email && EMAIL_VALID.test(email) && { email }),
    address: {
      '@type': 'PostalAddress',
      ...(strada && { streetAddress: strada }),
      ...(oras && { addressLocality: oras }),
      ...(judet && { addressRegion: judet }),
      ...(codPostal && { postalCode: codPostal }),
      addressCountry: 'RO',
    },
    ...(lat !== null && lng !== null && { geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } }),
    ...(program.length > 0 && { openingHoursSpecification: program }),
    ...(libere.length > 0 && { specialOpeningHoursSpecification: libere }),
    ...(optiuni.imagine && { image: optiuni.imagine }),
    ...(oras && { areaServed: { '@type': 'City', name: oras } }),
    knowsLanguage: [...(optiuni.limbi ?? ['ro'])],
    ...(profil && { sameAs: [profil] }),
  };
}
