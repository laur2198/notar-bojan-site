import { describe, expect, it } from 'vitest';
import { extrageSectiune } from './markdown';

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
