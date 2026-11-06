import { describe, expect, it } from 'vitest';
import { breadcrumbList, faqPage, idBirou, notaryBirou, programSchema, serializeaza, serviciu, zileLibereSchema, type DateBirouJsonLd } from './jsonld';

describe('JSON-LD', () => {
  it('idBirou stabil, cu baza site-ului', () => {
    expect(idBirou('https://notar-bojan.pages.dev/')).toBe('https://notar-bojan.pages.dev/#birou');
    expect(idBirou('https://laur2198.github.io/notar-bojan-site/')).toBe('https://laur2198.github.io/notar-bojan-site/#birou');
  });

  it('BreadcrumbList cu poziții de la 1 și adrese absolute', () => {
    const b = breadcrumbList([
      { nume: 'Acasă', url: 'https://x.ro/' },
      { nume: 'Servicii', url: 'https://x.ro/servicii/' },
      { nume: 'Succesiune', url: 'https://x.ro/servicii/succesiune/' },
    ]);
    expect(b['@type']).toBe('BreadcrumbList');
    expect(b.itemListElement.map((e) => [e.position, e.name, e.item])).toEqual([
      [1, 'Acasă', 'https://x.ro/'],
      [2, 'Servicii', 'https://x.ro/servicii/'],
      [3, 'Succesiune', 'https://x.ro/servicii/succesiune/'],
    ]);
  });

  it('Service cu provider prin @id', () => {
    const s = serviciu({ nume: 'Succesiune', descriere: 'd', url: 'https://x.ro/servicii/succesiune/', idBirou: 'https://x.ro/#birou', zona: 'Brașov' });
    expect(s.provider).toEqual({ '@id': 'https://x.ro/#birou' });
    expect(s.areaServed).toEqual({ '@type': 'City', name: 'Brașov' });
  });

  it('serializeaza nu poate închide tag-ul <script>', () => {
    const t = serializeaza({ a: '</script><script>alert(1)</script>' });
    expect(t).not.toContain('</script>');
    expect(JSON.parse(t)).toEqual({ a: '</script><script>alert(1)</script>' });
  });
});

describe('faqPage', () => {
  it('Question/Answer, fără întrebările cu marcaj «DE COMPLETAT»', () => {
    const f = faqPage(
      [
        { intrebare: 'Trebuie programare?', raspuns: 'Da. «DE COMPLETAT: excepții»' },
        { intrebare: 'Pot trimite actele?', raspuns: 'Da, pe email.' },
        { intrebare: 'Cum se plătește?', raspuns: '«DE COMPLETAT: numerar, card»' },
      ],
      'ro',
    );
    expect(f['@type']).toBe('FAQPage');
    expect(f.inLanguage).toBe('ro');
    expect(f.mainEntity).toEqual([
      { '@type': 'Question', name: 'Pot trimite actele?', acceptedAnswer: { '@type': 'Answer', text: 'Da, pe email.' } },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Notary (etapa 8)
// ---------------------------------------------------------------------------

const PROGRAM_LV: DateBirouJsonLd['program'] = [
  { zi: 'luni', deschidere: '09:00', inchidere: '17:00', inchis: false },
  { zi: 'marți', deschidere: '09:00', inchidere: '17:00', inchis: false },
  { zi: 'miercuri', deschidere: '09:00', inchidere: '17:00', inchis: false },
  { zi: 'joi', deschidere: '09:00', inchidere: '17:00', inchis: false },
  { zi: 'vineri', deschidere: '09:00', inchidere: '15:00', inchis: false },
  { zi: 'sâmbătă', deschidere: '00:00', inchidere: '00:00', inchis: true },
  { zi: 'duminică', deschidere: '00:00', inchidere: '00:00', inchis: true },
];

const COMPLET: DateBirouJsonLd = {
  denumire: 'Birou Individual Notarial Bojan Elena Luminița',
  telefon: '+40268123456',
  email: 'contact@exemplu.ro',
  adresa: { strada: 'Str. Exemplu nr. 1', oras: 'Brașov', judet: 'Brașov', codPostal: '500001' },
  program: PROGRAM_LV,
  zileLibere: [
    { data: '2026-11-30', motiv: 'Sfântul Andrei' },
    { data: '2026-12-25', motiv: 'Crăciunul' },
    { data: '2027-11-30', motiv: 'Sfântul Andrei' },
    { data: '2026-01-01', motiv: 'Anul Nou (trecut)' },
  ],
  googleProfilUrl: 'https://maps.app.goo.gl/exemplu',
  coordonate: { lat: 45.6427, lng: 25.5887 },
};

const OPTIUNI = { radacina: 'https://notar.ro/', azi: '2026-11-06' };

/** Nicio valoare goală sau cu marcaj, oriunde în obiect. */
function valoriCurate(x: unknown): boolean {
  if (typeof x === 'string') return x.trim() !== '' && !x.includes('«DE COMPLETAT');
  if (Array.isArray(x)) return x.length > 0 && x.every(valoriCurate);
  if (x && typeof x === 'object') return Object.values(x).every(valoriCurate);
  return x !== null && x !== undefined;
}

describe('Notary – nodul biroului', () => {
  it('date complete: toate câmpurile, @id comun cu paginile de serviciu', () => {
    const n = notaryBirou(COMPLET, { ...OPTIUNI, imagine: 'https://notar.ro/_astro/hero.jpg' });
    expect(n['@type']).toBe('Notary');
    expect(n['@id']).toBe('https://notar.ro/#birou');
    expect(n).toMatchObject({
      name: 'Birou Individual Notarial Bojan Elena Luminița',
      url: 'https://notar.ro/',
      telephone: '+40268123456',
      email: 'contact@exemplu.ro',
      address: { '@type': 'PostalAddress', streetAddress: 'Str. Exemplu nr. 1', addressLocality: 'Brașov', addressRegion: 'Brașov', postalCode: '500001', addressCountry: 'RO' },
      geo: { '@type': 'GeoCoordinates', latitude: 45.6427, longitude: 25.5887 },
      image: 'https://notar.ro/_astro/hero.jpg',
      areaServed: { '@type': 'City', name: 'Brașov' },
      knowsLanguage: ['ro'],
      sameAs: ['https://maps.app.goo.gl/exemplu'],
    });
    expect(n.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '09:00', closes: '17:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Friday'], opens: '09:00', closes: '15:00' },
    ]);
    // Doar zilele libere din următoarele 12 luni: nu cea trecută, nu cea de peste un an.
    expect(n.specialOpeningHoursSpecification?.map((z) => z.validFrom)).toEqual(['2026-11-30', '2026-12-25']);
    expect(n.specialOpeningHoursSpecification?.[0]).toEqual({
      '@type': 'OpeningHoursSpecification', validFrom: '2026-11-30', validThrough: '2026-11-30', opens: '00:00', closes: '00:00',
    });
    expect(n).not.toHaveProperty('aggregateRating');
    expect(n).not.toHaveProperty('review');
    expect(valoriCurate(n)).toBe(true);
  });

  it('date cu marcaje «DE COMPLETAT»: câmpurile lipsesc, nimic parțial', () => {
    const n = notaryBirou(
      {
        ...COMPLET,
        telefon: '+40«DE COMPLETAT»',
        email: '«DE COMPLETAT: contact@domeniu.ro»',
        adresa: { strada: '«DE COMPLETAT: strada și numărul»', oras: 'Brașov', judet: 'Brașov', codPostal: '«DE COMPLETAT: cod poștal»' },
        googleProfilUrl: '«DE COMPLETAT: link recenzii Google»',
        coordonate: { lat: null, lng: null },
      },
      OPTIUNI,
    );
    for (const camp of ['telephone', 'email', 'sameAs', 'geo', 'image']) expect(n).not.toHaveProperty(camp);
    expect(n.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'Brașov', addressRegion: 'Brașov', addressCountry: 'RO' });
    expect(serializeaza(n)).not.toContain('DE COMPLETAT');
    expect(valoriCurate(n)).toBe(true);
  });

  it('fără coordonate (sau doar una): fără geo', () => {
    expect(notaryBirou({ ...COMPLET, coordonate: { lat: null, lng: null } }, OPTIUNI)).not.toHaveProperty('geo');
    expect(notaryBirou({ ...COMPLET, coordonate: { lat: 45.6, lng: null } }, OPTIUNI)).not.toHaveProperty('geo');
  });

  it('program cu sâmbătă deschisă: apare ca grup separat; duminica închisă lipsește', () => {
    const program = PROGRAM_LV.map((z) => (z.zi === 'sâmbătă' ? { ...z, deschidere: '10:00', inchidere: '13:00', inchis: false } : z));
    expect(programSchema(program)).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '09:00', closes: '17:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Friday'], opens: '09:00', closes: '15:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '10:00', closes: '13:00' },
    ]);
  });

  it('zile libere: fereastra de 12 luni pornește de azi, inclusiv', () => {
    expect(zileLibereSchema(COMPLET.zileLibere, '2026-11-30').map((z) => z.validFrom)).toEqual(['2026-11-30', '2026-12-25']);
    expect(zileLibereSchema(COMPLET.zileLibere, '2026-12-01').map((z) => z.validFrom)).toEqual(['2026-12-25', '2027-11-30']);
  });
});
