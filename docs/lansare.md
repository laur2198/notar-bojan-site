# Checklist de lansare – Birou Individual Notarial Bojan Elena Luminița

În ordine. Detaliile tehnice sunt în README, secțiunea „Lansare pe Cloudflare Pages”.

## 1. Conținut (în Pages CMS, de către birou)

- [ ] **Setări birou**: adresa (strada, codul poștal), telefonul (`+40…` și forma afișată), WhatsApp Business, emailul general și cel pentru acte, linkurile Google Maps, profil Google și pagina de programări Google Calendar, coordonatele sediului.
- [ ] **Programul** confirmat de notar; textul „orele de mai sus sunt un exemplu” șters.
- [ ] **Zilele libere** confirmate pentru anul în curs (și, opțional, motivul în engleză); textul de confirmare șters.
- [ ] **Fotografiile**: clădirea/biroul (hero, pe Acasă), portretul notarului (Despre). Fără ele, pe site rămân blocurile „Fotografie – de completat”.
- [ ] **Titlul și descrierea pentru Google** ale paginii Acasă: titlu de cel mult 60 de caractere, descriere de cel mult 155 (RO și EN). Sugestie: „Notar public în Brașov – Bojan Elena Luminița”.
- [ ] Toate textele cu «DE COMPLETAT» completate: pagini, servicii, prețuri, întrebări frecvente, politica de confidențialitate (inclusiv data actualizării).
- [ ] **Politica de confidențialitate** citită și aprobată de birou (operatorul de date): temeiuri legale, termene de păstrare, furnizori (Google, WhatsApp/Meta, Cloudflare). Nota „Text propus…” de la început ștearsă.
- [ ] Recenziile Google reale copiate (opțional), cu limba lor dacă nu sunt în română.
- [ ] Bifa **„Text validat”** pusă pe fiecare fișier, după citire.

## 2. Build de producție

- [ ] Local sau în Cloudflare: `npm run build:prod` trece (verde). Dacă se oprește, lista din log arată fișierele cu `validat: false` sau «DE COMPLETAT».
- [ ] Fără avertismente SEO în log (titluri ≤ 60, descrieri ≤ 155).

## 3. Deploy pe Cloudflare Pages

- [ ] Proiect Pages legat de repository, branch `main`, preset **Astro**, build `npm run build:prod`, output `dist`.
- [ ] Variabile (Production): `NODE_VERSION=22`, `SITE_MODE=production`, `SITE_URL=https://<domeniu>`. **Fără** `BASE_PATH`.
- [ ] Primul deploy reușit; site-ul se deschide pe `<proiect>.pages.dev`.

## 4. Domeniu și HTTPS

- [ ] Domeniul (și `www`) adăugat la **Custom domains**; DNS configurat.
- [ ] Certificat HTTPS activ; **Always Use HTTPS** pornit; `http://` redirecționează la `https://`.
- [ ] `www` → domeniul principal (redirect 301).
- [ ] `SITE_URL` = domeniul final (altfel canonical-ul și sitemap-ul indică altă adresă); deploy refăcut după orice schimbare.

## 5. Verificări pe site-ul public

- [ ] `https://<domeniu>/robots.txt` conține `Allow: /` și linkul spre sitemap.
- [ ] `https://<domeniu>/sitemap-index.xml` se deschide.
- [ ] În codul paginii (Ctrl+U) nu există `noindex`; nu apare nicăieri „Text propus” sau fundal galben.
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) pe pagina principală: `Notary` fără erori; pe /intrebari-frecvente/: `FAQPage`.
- [ ] Imaginea de distribuire: un link trimis pe WhatsApp sau Facebook arată numele și „Notar public în Brașov”.

## 6. Google Search Console

- [ ] Proprietate de tip **Domeniu**, verificată prin înregistrarea DNS `TXT`.
- [ ] Sitemap trimis: `https://<domeniu>/sitemap-index.xml`.
- [ ] **Request indexing** pentru pagina principală.

## 7. Google Business Profile

- [ ] Profilul unificat al biroului (duplicatele închise) are la **Website** adresa `https://<domeniu>/`.
- [ ] Linkul de programare din profil indică pagina de programări (sau `https://<domeniu>/programare/`).
- [ ] Programul și zilele libere din profil sunt aceleași ca pe site.

## 8. Test pe telefon (de către cineva din birou)

- [ ] Pe un telefon real, cu datele mobile: pagina principală se încarcă repede; programul și „Deschis acum” sunt corecte.
- [ ] **Sunați**, **WhatsApp**, **Programare** și **Locație** din bara de jos funcționează.
- [ ] Pe o pagină de serviciu, „Trimiteți actele pe email” deschide emailul cu subiectul completat.
- [ ] Comutatorul RO/EN duce la pagina corespunzătoare.
- [ ] Un om care nu cunoaște site-ul găsește în sub un minut programul, telefonul și cum cere o programare.

## După lansare

- [ ] Search Console, după 1–2 săptămâni: paginile indexate, fără erori la „Pagini” și „Îmbunătățiri”.
- [ ] O dată pe an (sau la orice schimbare de program): zilele libere actualizate în CMS (publicarea reconstruiește site-ul și JSON-LD-ul).
