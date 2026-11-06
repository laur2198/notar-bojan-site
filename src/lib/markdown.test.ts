import { describe, expect, it } from 'vitest';
import { extrageIntro, extrageSectiune } from './markdown';

const CORP = `## Cum ajungeți

«DE COMPLETAT: repere, ex. „la parterul blocului …”.»
Intrarea e din **strada principală**.

Vedeți [harta](https://exemplu.ro).

## Parcare

Text despre parcare.`;

describe('extrageSectiune', () => {
  it('textul secțiunii, fără titlu și fără formatare', () => {
    expect(extrageSectiune(CORP, 'Cum ajungeți')).toBe(
      '«DE COMPLETAT: repere, ex. „la parterul blocului …”.» Intrarea e din strada principală.\n\nVedeți harta.',
    );
  });
  it('ultima secțiune merge până la final', () => {
    expect(extrageSectiune(CORP, 'Parcare')).toBe('Text despre parcare.');
  });
  it('secțiune lipsă sau corp gol', () => {
    expect(extrageSectiune(CORP, 'Altceva')).toBeUndefined();
    expect(extrageSectiune(undefined, 'Parcare')).toBeUndefined();
  });
});

describe('extrageIntro', () => {
  it('textul de dinaintea primului titlu', () => {
    expect(extrageIntro('Alegeți din **calendar** ziua.\nA doua linie.\n\n## Înainte\n\nText.')).toBe('Alegeți din calendar ziua. A doua linie.');
  });
  it('fără intro, fără titluri, corp gol', () => {
    expect(extrageIntro('## Titlu\n\nText.')).toBeUndefined();
    expect(extrageIntro('Doar text.')).toBe('Doar text.');
    expect(extrageIntro(undefined)).toBeUndefined();
  });
  it('blockquote-urile nu fac parte din intro', () => {
    expect(extrageIntro('> Notă de lucru.\n\n## Titlu')).toBeUndefined();
  });
});
