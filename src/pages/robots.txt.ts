/**
 * robots.txt, generat la build (CLAUDE.md §7, §9):
 * - preview: `Disallow: /` (împreună cu `noindex` pe pagini);
 * - producție: `Allow: /` și adresa sitemap-ului (cu SITE_URL și calea de bază).
 */
import type { APIRoute } from 'astro';
import { estePreview } from '../lib/continut';
import { url } from '../lib/url';

export const GET: APIRoute = ({ site }) => {
  const radacina = site ?? new URL('http://localhost');
  const text = estePreview
    ? ['# Preview: site-ul nu se indexează.', 'User-agent: *', 'Disallow: /', '']
    : ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL(url('/sitemap-index.xml'), radacina).href}`, ''];
  return new Response(text.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
