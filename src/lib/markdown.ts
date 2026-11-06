/**
 * Extrage textul unei secțiuni `## Titlu` dintr-un corp Markdown, ca text simplu
 * (fără titlu, fără marcaje de formatare), pentru blocuri scurte (ex. banda de pe Acasă).
 * Funcție pură, testată în markdown.test.ts.
 */
export function extrageSectiune(body: string | undefined, titlu: string): string | undefined {
  if (!body) return undefined;
  const linii = body.replace(/\r\n/g, '\n').split('\n');
  const start = linii.findIndex((l) => /^##\s+/.test(l) && l.replace(/^##\s+/, '').trim() === titlu);
  if (start === -1) return undefined;
  const sfarsit = linii.findIndex((l, i) => i > start && /^#{1,2}\s+/.test(l));
  const text = linii
    .slice(start + 1, sfarsit === -1 ? undefined : sfarsit)
    .join('\n')
    .trim()
    .split(/\n\s*\n/)
    .map((paragraf) =>
      paragraf
        .replace(/^[-*]\s+/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/\s*\n\s*/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .join('\n\n');
  return text || undefined;
}
