/*
 * Scriptul din <head>: clasic, extern, SINCRON (CSP: script-src 'self', fără inline). Rulează
 * înainte de primul paint și pune pe <html> clasele de care depinde CSS-ul (CLAUDE.md §3.2):
 *   - `js`        mereu;
 *   - `miscare`   doar fără prefers-reduced-motion: reduce. Sub ea, CSS-ul ascunde starea
 *                 inițială a dezvăluirilor ([data-reveal], [data-divider], intrarea hero-ului)
 *                 până pornește src/scripts/miscare.ts, care pune `miscare-gata`. Fără JS sau la
 *                 mișcare redusă clasa nu există, deci totul e vizibil;
 *   - `ancora-initiala`  intrarea cu #ancoră: saltul inițial e instant (miscare.ts realiniază
 *                 pagina după fonturi și refresh-ul ScrollTrigger, apoi scoate clasa).
 * Intro-ul cu semnătura a fost scos în V3d (la cererea clientei).
 * Plasă de siguranță: dacă modulele nu pornesc (eroare de rețea), conținutul nu rămâne ascuns.
 * Fără import/export: se servește ca atare (`?url`), nu prin bundler.
 */
(function () {
  var html = document.documentElement;
  html.classList.add('js');
  var redus = !window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (redus || !window.requestAnimationFrame) return;
  html.classList.add('miscare');

  // Saltul inițial la ancoră e instant: derularea lină ar fi anulată de refresh-ul ScrollTrigger.
  if (location.hash.length > 1) html.classList.add('ancora-initiala');

  setTimeout(function () {
    if (!html.classList.contains('miscare-gata')) {
      html.classList.remove('miscare');
      html.classList.remove('ancora-initiala');
    }
  }, 4000);
})();
