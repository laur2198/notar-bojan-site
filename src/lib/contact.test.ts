import { describe, expect, it } from 'vitest';
import { linkEmail, linkTelefon } from './contact';

describe('linkTelefon', () => {
  it('număr valid: link tel: în format internațional', () => {
    expect(linkTelefon({ telefon: '+40268123456', telefonAfisat: '0268 123 456' })).toEqual({
      href: 'tel:+40268123456',
      text: '0268 123 456',
      valid: true,
    });
  });

  it('marcaj «DE COMPLETAT»: fără href, textul rămâne pentru afișare marcată', () => {
    expect(linkTelefon({ telefon: '+40«DE COMPLETAT»', telefonAfisat: '«DE COMPLETAT: 0268 xxx xxx»' })).toEqual({
      href: undefined,
      text: '«DE COMPLETAT: 0268 xxx xxx»',
      valid: false,
    });
  });

  it('format greșit (spații, prea scurt): fără href', () => {
    expect(linkTelefon({ telefon: '+40 268 123 456', telefonAfisat: '0268 123 456' }).valid).toBe(false);
    expect(linkTelefon({ telefon: '+4026812', telefonAfisat: '0268 12' }).href).toBeUndefined();
  });

  it('telefonAfisat gol: afișează numărul internațional', () => {
    expect(linkTelefon({ telefon: '+40268123456', telefonAfisat: '  ' }).text).toBe('+40268123456');
  });
});

describe('linkEmail', () => {
  it('adresă validă: mailto:', () => {
    expect(linkEmail(' contact@notar.ro ')).toEqual({ href: 'mailto:contact@notar.ro', text: 'contact@notar.ro', valid: true });
  });

  it('marcaj sau adresă invalidă: fără href', () => {
    expect(linkEmail('«DE COMPLETAT: contact@domeniu.ro»')).toEqual({
      href: undefined,
      text: '«DE COMPLETAT: contact@domeniu.ro»',
      valid: false,
    });
    expect(linkEmail('contact@').valid).toBe(false);
  });
});
