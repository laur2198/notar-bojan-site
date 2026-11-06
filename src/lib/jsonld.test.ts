import { describe, expect, it } from 'vitest';
import { breadcrumbList, faqPage, idBirou, serializeaza, serviciu } from './jsonld';

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
