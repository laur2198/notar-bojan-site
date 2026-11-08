/**
 * Utilitare pentru testele de browser (node:test + Playwright), fără dependențe în proiect:
 * Playwright se ia din mediu (instalare globală / NODE_PATH). Dacă lipsește, testele se sar.
 * Servește `dist/` (rulați `npm run build` înainte) pe un port liber, cu antetele CSP din
 * public/_headers, ca scripturile inline să fie verificate exact ca pe Cloudflare.
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';

const DIST = resolve('dist');
const TIPURI = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.xml': 'application/xml', '.txt': 'text/plain' };

/** Playwright din mediu sau `null`. */
export function incarcaPlaywright() {
  try {
    return createRequire(import.meta.url)('playwright');
  } catch {
    return null;
  }
}

/** CSP-ul regulii `/*` din public/_headers. */
function cspImplicit() {
  const text = readFileSync(resolve('public/_headers'), 'utf8');
  return text.match(/^\/\*\n(?:[ \t]+.*\n)*?[ \t]+Content-Security-Policy:\s*(.+)$/m)?.[1];
}

/** Pornește serverul static; întoarce { url, inchide }. */
export async function serveste() {
  if (!existsSync(join(DIST, 'index.html'))) throw new Error('Lipsește dist/: rulați `npm run build` înainte de `npm run test:e2e`.');
  const csp = cspImplicit();
  const server = createServer((req, res) => {
    let cale = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (existsSync(cale) && statSync(cale).isDirectory()) cale = join(cale, 'index.html');
    if (!cale.startsWith(DIST) || !existsSync(cale)) {
      res.writeHead(404, { 'content-type': TIPURI['.html'] });
      createReadStream(join(DIST, '404.html')).pipe(res);
      return;
    }
    res.writeHead(200, { 'content-type': TIPURI[extname(cale)] ?? 'application/octet-stream', ...(csp ? { 'content-security-policy': csp } : {}) });
    createReadStream(cale).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}`, inchide: () => new Promise((r) => server.close(r)) };
}
