/*
 * Scriptul din <head>: clasic, extern, SINCRON (CSP: script-src 'self', fără inline). Rulează
 * înainte de primul paint și pune pe <html> clasele de care depinde CSS-ul (CLAUDE.md §3.2):
 *   - `js`        mereu;
 *   - `miscare`   doar fără prefers-reduced-motion: reduce. Sub ea, CSS-ul ascunde starea
 *                 inițială a dezvăluirilor ([data-reveal], [data-divider]) până pornește
 *                 src/scripts/miscare.ts, care pune `miscare-gata`. Fără JS sau la mișcare
 *                 redusă clasa nu există, deci totul e vizibil;
 *   - `cu-intro`  intro-ul cu semnătura (IntroSemnatura.astro), o dată pe sesiune, doar cu mișcare.
 *                 Atributul data-pornire-intro="manual" pe <script> îl dezactivează automat (ghidul /stil/
 *                 îl pornește din buton); `#intro` în adresă îl forțează. Intrarea cu altă
 *                 ancoră (ex. /#faq) îl sare: vizitatorul vrea direct secțiunea, nu un ecran peste ea.
 * Plase de siguranță: dacă modulele nu pornesc (eroare de rețea), conținutul nu rămâne ascuns.
 * Fără import/export: se servește ca atare (`?url`), nu prin bundler.
 */
(function () {
  var html = document.documentElement;
  html.classList.add('js');
  var redus = !window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (redus || !window.requestAnimationFrame) return;
  html.classList.add('miscare');

  var script = document.currentScript;
  var automat = !script || script.getAttribute('data-pornire-intro') !== 'manual';
  var fortat = location.hash === '#intro';
  var vazut = true;
  try {
    vazut = sessionStorage.getItem('intro-vazut') === '1';
  } catch (e) {
    // Fără sessionStorage nu putem ține minte că a rulat: nu-l arătăm deloc.
  }
  var ancora = location.hash.length > 1 && !fortat;
  if (fortat || (automat && !vazut && !ancora)) html.classList.add('cu-intro');
  // Saltul inițial la ancoră e instant: derularea lină ar fi anulată de refresh-ul ScrollTrigger.
  // miscare.ts realiniază pagina după fonturi și refresh, apoi scoate clasa.
  if (ancora) html.classList.add('ancora-initiala');

  setTimeout(function () {
    if (!html.classList.contains('miscare-gata')) html.classList.remove('miscare');
    if (!html.classList.contains('intro-pornit')) html.classList.remove('cu-intro');
    if (!html.classList.contains('miscare-gata')) html.classList.remove('ancora-initiala');
  }, 4000);
})();
