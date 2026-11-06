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
