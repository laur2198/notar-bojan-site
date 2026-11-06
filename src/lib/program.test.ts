import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { ro } from '../i18n/ro';
import {
  adaugaZile,
  calculeazaStare,
  type EticheteStare,
  indexZi,
  mesajStare,
  momentLocal,
  type ZiLibera,
  type ZiProgram,
  zileLibereApropiate,
  zileLibereViitoare,
} from './program';

// Programul din exemplu: luni–joi 09–17, vineri 09–15, weekend închis.
const PROGRAM: ZiProgram[] = [
  { zi: 'luni', deschidere: '09:00', inchidere: '17:00', inchis: false },
  { zi: 'marți', deschidere: '09:00', inchidere: '17:00', inchis: false },
  { zi: 'miercuri', deschidere: '09:00', inchidere: '17:00', inchis: false },
  { zi: 'joi', deschidere: '09:00', inchidere: '17:00', inchis: false },
  { zi: 'vineri', deschidere: '09:00', inchidere: '15:00', inchis: false },
  { zi: 'sâmbătă', deschidere: '', inchidere: '', inchis: true },
  { zi: 'duminică', deschidere: '', inchidere: '', inchis: true },
];

const LIBERE: ZiLibera[] = [
  { data: '2026-12-01', motiv: 'Ziua Națională a României' },
  { data: '2026-12-25', motiv: 'Crăciunul' },
  { data: '2026-12-26', motiv: 'A doua zi de Crăciun' },
  { data: '2027-01-01', motiv: 'Anul Nou' },
  { data: '2027-01-02', motiv: 'Anul Nou' },
];

const eticheta = (d: Record<string, string>, locale: string): EticheteStare => ({
  deschisAcum: d['program.deschisAcum']!,
  panaLa: d['program.panaLa']!,
  inchisAcum: d['program.inchisAcum']!,
  inchisAstazi: d['program.inchisAstazi']!,
  deschidem: d['program.deschidem']!,
  azi: d['program.azi']!,
  maine: d['program.maine']!,
  inZiua: d['program.inZiua']!,
  laData: d['program.laData']!,
  zile: [0, 1, 2, 3, 4, 5, 6].map((i) => d[`zi.${i}`]!),
  localeData: locale,
});
const RO = eticheta(ro, 'ro-RO');
const EN = eticheta(en, 'en-GB');

/** Mesajul RO la un moment dat în UTC. */
const mesaj = (iso: string, libere: ZiLibera[] = LIBERE, program: ZiProgram[] = PROGRAM, e = RO) =>
  mesajStare(calculeazaStare(new Date(iso), program, libere), e);

describe('utilitare de calendar', () => {
  it('indexZi: 0 = luni, 6 = duminică', () => {
    expect(indexZi('2026-11-09')).toBe(0); // luni
    expect(indexZi('2026-11-15')).toBe(6); // duminică
  });

  it('adaugaZile trece corect peste lună și an', () => {
    expect(adaugaZile('2026-12-31', 1)).toBe('2027-01-01');
    expect(adaugaZile('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('momentLocal folosește ora din București (UTC+2 iarna)', () => {
    expect(momentLocal(new Date('2026-11-10T22:30:00Z'))).toEqual({ data: '2026-11-11', ziIndex: 2, ora: '00:30' });
  });
});

describe('calculeazaStare / mesajStare (RO)', () => {
  it('zi lucrătoare, în program', () => {
    // marți 10 nov. 2026, 12:00 în București (UTC+2)
    expect(calculeazaStare(new Date('2026-11-10T10:00:00Z'), PROGRAM, LIBERE)).toEqual({ tip: 'deschis', pana: '17:00' });
    expect(mesaj('2026-11-10T10:00:00Z')).toBe('Deschis acum · până la 17:00');
  });

  it('exact la deschidere e deschis, exact la închidere e închis', () => {
    expect(mesaj('2026-11-10T07:00:00Z')).toBe('Deschis acum · până la 17:00'); // 09:00
    expect(mesaj('2026-11-10T15:00:00Z')).toBe('Închis acum · deschidem mâine la 09:00'); // 17:00
  });

  it('înainte de deschidere', () => {
    // marți 07:30 local
    expect(mesaj('2026-11-10T05:30:00Z')).toBe('Închis acum · deschidem azi la 09:00');
  });

  it('după program', () => {
    // marți 18:00 local
    expect(mesaj('2026-11-10T16:00:00Z')).toBe('Închis acum · deschidem mâine la 09:00');
  });

  it('weekend', () => {
    // sâmbătă 14 nov. 2026, 10:00 local
    expect(mesaj('2026-11-14T08:00:00Z')).toBe('Închis acum · deschidem luni la 09:00');
    // duminică seara
    expect(mesaj('2026-11-15T18:00:00Z')).toBe('Închis acum · deschidem mâine la 09:00');
  });

  it('zi liberă', () => {
    // marți 1 dec. 2026, 10:00 local
    expect(mesaj('2026-12-01T08:00:00Z')).toBe('Închis astăzi – Ziua Națională a României · deschidem mâine la 09:00');
  });

  it('vineri cu program redus', () => {
    // vineri 13 nov. 2026
    expect(mesaj('2026-11-13T12:30:00Z')).toBe('Deschis acum · până la 15:00'); // 14:30
    expect(mesaj('2026-11-13T13:30:00Z')).toBe('Închis acum · deschidem luni la 09:00'); // 15:30
  });

  it('zi liberă urmată de weekend: următoarea deschidere e lunea', () => {
    // vineri 25 dec. 2026 (Crăciun), sâmbătă 26 (liberă și weekend), duminică 27 → luni 28
    const stare = calculeazaStare(new Date('2026-12-25T08:00:00Z'), PROGRAM, LIBERE);
    expect(stare).toEqual({
      tip: 'inchis',
      motiv: 'Crăciunul',
      urmatoarea: { data: '2026-12-28', ziIndex: 0, ora: '09:00', zileDistanta: 3 },
    });
    expect(mesajStare(stare, RO)).toBe('Închis astăzi – Crăciunul · deschidem luni la 09:00');
    // joi 24 dec. seara: sare peste 25–27
    expect(mesaj('2026-12-24T17:00:00Z')).toBe('Închis acum · deschidem luni la 09:00');
    // vineri 1 ian. 2027 (Anul Nou) → luni 4 ian.
    expect(mesaj('2027-01-01T09:00:00Z')).toBe('Închis astăzi – Anul Nou · deschidem luni la 09:00');
  });

  it('trecerea la ora de vară (28 mar. 2027): 06:30 UTC e 09:30 în București, deci deschis', () => {
    // luni 29 mar. 2027, UTC+3; cu ora de iarnă ar fi fost 08:30, adică închis
    expect(momentLocal(new Date('2027-03-29T06:30:00Z')).ora).toBe('09:30');
    expect(mesaj('2027-03-29T06:30:00Z')).toBe('Deschis acum · până la 17:00');
    // duminica schimbării: următoarea deschidere e luni
    expect(mesaj('2027-03-28T10:00:00Z')).toBe('Închis acum · deschidem mâine la 09:00');
  });

  it('trecerea la ora de iarnă (25 oct. 2026): 06:30 UTC e 08:30 în București, deci închis', () => {
    // luni 26 oct. 2026, UTC+2; cu ora de vară ar fi fost 09:30, adică deschis
    expect(momentLocal(new Date('2026-10-26T06:30:00Z')).ora).toBe('08:30');
    expect(mesaj('2026-10-26T06:30:00Z')).toBe('Închis acum · deschidem azi la 09:00');
    expect(mesaj('2026-10-26T07:00:00Z')).toBe('Deschis acum · până la 17:00');
  });

  it('deschidere la peste o săptămână: afișează data', () => {
    const libere: ZiLibera[] = Array.from({ length: 9 }, (_, i) => ({
      data: adaugaZile('2026-12-28', i),
      motiv: 'Concediu',
    }));
    // 9 zile libere: luni 28 dec. – marți 5 ian. → următoarea deschidere e miercuri 6 ian., la 9 zile distanță
    expect(mesaj('2026-12-28T08:00:00Z', libere)).toBe('Închis astăzi – Concediu · deschidem pe 6 ianuarie la 09:00');
  });

  it('nicio deschidere în următoarele 14 zile: doar „Închis acum”', () => {
    const inchisMereu = PROGRAM.map((z) => ({ ...z, inchis: true, deschidere: '', inchidere: '' }));
    expect(mesaj('2026-11-10T10:00:00Z', [], inchisMereu)).toBe('Închis acum');
  });
});

describe('mesajStare (EN)', () => {
  it('formulează mesajele în engleză', () => {
    expect(mesaj('2026-11-10T10:00:00Z', LIBERE, PROGRAM, EN)).toBe('Open now · until 17:00');
    expect(mesaj('2026-11-14T08:00:00Z', LIBERE, PROGRAM, EN)).toBe('Closed now · we open on Monday at 09:00');
    expect(mesaj('2026-11-10T05:30:00Z', LIBERE, PROGRAM, EN)).toBe('Closed now · we open today at 09:00');
    expect(mesaj('2026-12-01T08:00:00Z', LIBERE, PROGRAM, EN)).toBe(
      'Closed today – Ziua Națională a României · we open tomorrow at 09:00',
    );
  });
});

describe('zileLibereApropiate / zileLibereViitoare', () => {
  const lista: ZiLibera[] = [
    { data: '2027-01-01', motiv: 'Anul Nou' },
    { data: '2026-12-25', motiv: 'Crăciunul' },
    { data: '2026-11-30', motiv: 'Sfântul Andrei' },
    { data: '2026-12-26', motiv: 'A doua zi de Crăciun' },
  ];

  it('fereastra de 14 zile, sortată, inclusiv azi și ziua a 14-a', () => {
    // 17 dec. 2026, 10:00 în București: limita e 31 dec., deci 1 ian. nu intră
    expect(zileLibereApropiate(new Date('2026-12-17T08:00:00Z'), lista).map((z) => z.data)).toEqual([
      '2026-12-25',
      '2026-12-26',
    ]);
    // 18 dec.: 1 ian. e la exact 14 zile
    expect(zileLibereApropiate(new Date('2026-12-18T08:00:00Z'), lista).map((z) => z.data)).toEqual([
      '2026-12-25',
      '2026-12-26',
      '2027-01-01',
    ]);
    // ziua liberă de azi apare
    expect(zileLibereApropiate(new Date('2026-11-30T08:00:00Z'), lista)[0]?.motiv).toBe('Sfântul Andrei');
  });

  it('nimic în fereastră', () => {
    expect(zileLibereApropiate(new Date('2026-11-06T08:00:00Z'), lista)).toEqual([]);
  });

  it('folosește data din București, nu UTC (23:30 UTC pe 29 nov. e deja 30 nov.)', () => {
    expect(zileLibereApropiate(new Date('2026-11-29T23:30:00Z'), lista, 0).map((z) => z.motiv)).toEqual(['Sfântul Andrei']);
  });

  it('zileLibereViitoare exclude zilele trecute', () => {
    expect(zileLibereViitoare(new Date('2026-12-26T12:00:00Z'), lista).map((z) => z.data)).toEqual(['2026-12-26', '2027-01-01']);
  });
});
