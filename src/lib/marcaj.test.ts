import { describe, expect, it } from 'vitest';
import { esteDraft, marcheazaPlaceholder } from './marcaj';

describe('marcheazaPlaceholder', () => {
  it('escapează HTML-ul și marchează toate formele de marcaj', () => {
    expect(marcheazaPlaceholder('A <b>&</b> «DE COMPLETAT: x» și «DE COMPLETAT» apoi «DE COMPLETAT neînchis')).toBe(
      'A &lt;b&gt;&amp;&lt;/b&gt; <mark class="todo">«DE COMPLETAT: x»</mark> și ' +
        '<mark class="todo">«DE COMPLETAT»</mark> apoi <mark class="todo">«DE COMPLETAT neînchis</mark>',
    );
  });

  it('text fără marcaj: doar escapare', () => {
    expect(marcheazaPlaceholder('Brașov "centru"')).toBe('Brașov &quot;centru&quot;');
  });
});

describe('esteDraft', () => {
  it('validat: false', () => expect(esteDraft({ data: { validat: false, titlu: 'x' } })).toBe(true));
  it('marcaj într-un câmp imbricat', () =>
    expect(esteDraft({ data: { validat: true, a: [{ b: '«DE COMPLETAT»' }] } })).toBe(true));
  it('marcaj doar în corpul Markdown', () =>
    expect(esteDraft({ data: { validat: true }, body: 'text «DE COMPLETAT: x»' })).toBe(true));
  it('validat și fără marcaje', () =>
    expect(esteDraft({ data: { validat: true, data: new Date(), n: 3 }, body: 'gata' })).toBe(false));
});
