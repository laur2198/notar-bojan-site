import { describe, expect, it } from 'vitest';
import { linkActe, linkEmail, linkExtern, linkTelefon, linkWhatsapp } from './contact';

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

describe('linkExtern', () => {
  it('https valid', () => {
    expect(linkExtern('https://maps.app.goo.gl/abc', 'Hartă')).toEqual({ href: 'https://maps.app.goo.gl/abc', text: 'Hartă', valid: true });
  });
  it('marcaj, http sau text: fără href', () => {
    expect(linkExtern('«DE COMPLETAT: link Google Maps»', 'Hartă').valid).toBe(false);
    expect(linkExtern('http://exemplu.ro', 'x').href).toBeUndefined();
    expect(linkExtern('nu e link', 'x').valid).toBe(false);
  });
});

describe('linkActe', () => {
  const CORP = {
    salut: 'Bună ziua,',
    nume: 'Nume și prenume:',
    telefon: 'Telefon:',
    data: 'Data aproximativă dorită:',
    observatii: 'Observații:',
    atasate: 'Am atașat următoarele documente:',
  };

  it('mailto cu subiect și corp codificate corect (%20, %0D%0A, diacritice)', () => {
    const l = linkActe('acte@notar.ro', 'Acte – Succesiune', CORP);
    expect(l.valid).toBe(true);
    expect(l.href).toMatch(/^mailto:acte@notar\.ro\?subject=Acte%20%E2%80%93%20Succesiune&body=/);
    const u = new URL(l.href!);
    expect(u.searchParams.get('subject')).toBe('Acte – Succesiune');
    const corp = decodeURIComponent(l.href!.split('&body=')[1]!);
    expect(corp.split('\r\n')).toEqual([
      'Bună ziua,',
      '',
      'Nume și prenume: ',
      'Telefon: ',
      'Data aproximativă dorită: ',
      'Observații: ',
      '',
      'Am atașat următoarele documente:',
      '- ',
      '',
    ]);
    expect(l.href).toContain('%0D%0A');
    expect(l.href).not.toMatch(/[ \r\n+]/);
  });

  it('caractere speciale din subiect (&, ?, #) nu strică linkul', () => {
    const l = linkActe('acte@notar.ro', 'Acte & întrebări? #1', CORP);
    expect(new URL(l.href!).searchParams.get('subject')).toBe('Acte & întrebări? #1');
  });

  it('adresă «DE COMPLETAT» sau invalidă: fără href', () => {
    expect(linkActe('«DE COMPLETAT: acte@domeniu.ro»', 'x', CORP)).toEqual({
      href: undefined,
      text: '«DE COMPLETAT: acte@domeniu.ro»',
      valid: false,
    });
    expect(linkActe('acte@', 'x', CORP).valid).toBe(false);
  });
});

describe('linkWhatsapp', () => {
  it('număr valid: wa.me fără „+”, mesaj RO codificat, text în format național', () => {
    const l = linkWhatsapp({ whatsapp: '+40722123456' }, 'ro');
    expect(l.valid).toBe(true);
    expect(l.text).toBe('0722 123 456');
    expect(l.href).toBe(
      'https://wa.me/40722123456?text=' + encodeURIComponent('Bună ziua, aș dori informații despre…'),
    );
    expect(l.href).toBe(
      'https://wa.me/40722123456?text=Bun%C4%83%20ziua%2C%20a%C8%99%20dori%20informa%C8%9Bii%20despre%E2%80%A6',
    );
    expect(decodeURIComponent(new URL(l.href!).searchParams.get('text')!)).toBe('Bună ziua, aș dori informații despre…');
  });

  it('mesajul EN', () => {
    const l = linkWhatsapp({ whatsapp: '+40722123456' }, 'en');
    expect(l.href).toBe('https://wa.me/40722123456?text=Hello%2C%20I%20would%20like%20information%20about%E2%80%A6');
    expect(new URL(l.href!).searchParams.get('text')).toBe('Hello, I would like information about…');
  });

  it('marcaj «DE COMPLETAT» sau format greșit: fără href, valid=false', () => {
    expect(linkWhatsapp({ whatsapp: '+40«DE COMPLETAT»' }, 'ro')).toEqual({ href: undefined, text: '+40«DE COMPLETAT»', valid: false });
    expect(linkWhatsapp({ whatsapp: '0722 123 456' }, 'ro').valid).toBe(false);
    expect(linkWhatsapp({ whatsapp: '+4072212345' }, 'en').href).toBeUndefined();
  });
});
