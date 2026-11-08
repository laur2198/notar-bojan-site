#!/usr/bin/env node
/**
 * CSP-ul din public/_headers e strict (`script-src 'self'`): un script inline rulează doar dacă
 * hash-ul lui sha256 e listat în script-src. Scriptul verifică, pe build-ul din `dist/`, că:
 *   - fiecare script inline executabil (fără src, fără type="application/ld+json") are hash-ul în
 *     TOATE politicile Content-Security-Policy din _headers;
 *   - nu rămân în _headers hash-uri care nu mai corespund niciunui script (hash-uri vechi).
 * La nepotrivire afișează hash-ul corect și iese cu 1.
 *
 * Utilizare (după build): node scripts/verifica-csp.mjs
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const DIST = resolve('dist');
const HEADERS = resolve('public/_headers');

const fisiere = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? fisiere(p) : p.endsWith('.html') ? [p] : []; });
const hash = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

/** hash → paginile în care apare scriptul inline. */
const inline = new Map();
for (const f of fisiere(DIST)) {
  const html = readFileSync(f, 'utf8');
  for (const [, atribute, continut] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\ssrc=/.test(atribute) || /type="application\/ld\+json"/.test(atribute) || continut.trim() === '') continue;
    const h = hash(continut);
    inline.set(h, [...(inline.get(h) ?? []), '/' + relative(DIST, f).replace(/\\/g, '/')]);
  }
}

const politici = [...readFileSync(HEADERS, 'utf8').matchAll(/Content-Security-Policy:\s*(.+)/g)].map((m) => m[1]);
const probleme = [];
for (const [i, politica] of politici.entries()) {
  const scriptSrc = politica.match(/script-src([^;]*)/)?.[1] ?? '';
  for (const [h, pagini] of inline) {
    if (!scriptSrc.includes(h)) probleme.push(`politica #${i + 1}: lipsește ${h} din script-src (script inline în ${pagini.length} pagini, ex. ${pagini[0]})`);
  }
  for (const [vechi] of scriptSrc.matchAll(/'sha256-[^']+'/g)) {
    if (!inline.has(vechi)) probleme.push(`politica #${i + 1}: hash-ul ${vechi} nu mai corespunde niciunui script inline (de șters)`);
  }
}

if (politici.length === 0) probleme.push('nicio politică Content-Security-Policy în public/_headers');

if (probleme.length) {
  console.error('✗ CSP: hash-urile scripturilor inline nu se potrivesc cu public/_headers:');
  for (const p of probleme) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✓ CSP: ${inline.size} script(uri) inline, hash-uri prezente în ${politici.length} politici.`);
