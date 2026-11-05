# Prompt 4 – Pagina „Servicii și prețuri” și paginile individuale de servicii

Branch: `etapa-4-servicii`

--- PROMPT ---

Citește `CLAUDE.md` (secțiunile 3, 7, 8 și 9), toate fișierele din `src/content/servicii/ro/`, `src/content/preturi/ro.yaml` și componentele existente, mai ales `CardServiciu` și `SectiuneCta`. Fă un plan și așteaptă aprobarea mea.

## Context

Fiecare serviciu are pagina lui. Pagina asta e și cea mai căutată pe Google („succesiune notar Brașov”), și cea în care clientul trimite actele pe email. Conținutul e propus de noi și va fi corectat de birou, deci șablonul trebuie să suporte texte mai lungi sau mai scurte fără să se strice.

## Ce construiești

### A. `/servicii/` – Servicii și prețuri

- `h1` „Servicii și prețuri”, cu intro-ul din `preturi/ro.yaml`.
- Grid cu **toate** serviciile, ordonate după `ordine`, folosind `CardServiciu`. Pe card apare și textul de onorariu din `preturi/ro.yaml`, potrivit după `serviciu` = `slug`.
- Sub grid, un tabel „Onorarii orientative” (serviciu / onorariu), semantic, care pe mobil se transformă în listă de perechi (fără scroll orizontal). Sub tabel, nota din `preturi/ro.yaml`.
- `SectiuneCta` la final.
- Dacă un serviciu din `preturi` nu are pagină sau invers, build-ul afișează un warning clar.

### B. `/servicii/[slug]/` – șablonul paginii de serviciu

Structura:
1. `Breadcrumbs`: Acasă › Servicii › {titlu}.
2. `h1` {titlu}, `pentruCine` ca lead și `DraftBadge` dacă e cazul.
3. **Pe desktop, două coloane:**
   - **Stânga (conținut):** corpul Markdown (`Ce este`, `Cum decurge`, `Bine de știut`), cu stiluri tipografice pentru `h2`, liste ordonate și neordonate și `strong`. `Cum decurge` (lista ordonată) se afișează ca pași numerotați vizual, în același stil ca `PasiLucru`.
   - **Dreapta (sticky pe desktop, în flux pe mobil, imediat după lead):** caseta „Pregătiți dosarul”, care conține:
     - `durata` și `onorariu` (cu iconițe simple);
     - lista `acteNecesare` ca checklist vizual (iconiță bifă, nu checkbox interactiv);
     - nota „Lista finală v-o confirmăm după verificarea actelor.”;
     - butonul primar **„Trimiteți actele pe email”**: link `mailto:` către `birou.emailActe`, cu `subject=subiectEmail` și `body` precompletat în română, cu rânduri goale pentru: Nume și prenume, Telefon, Data aproximativă dorită, Observații, plus fraza „Am atașat următoarele documente:”. Codificare corectă (`encodeURIComponent`, `%0D%0A` pentru rânduri noi);
     - sub buton, textul mic: „Se deschide aplicația de email. Limita unui mesaj este de 25 MB; dacă documentele sunt mai mari, trimiteți mai multe emailuri.”;
     - butonul secundar „Solicitați o programare” și linkul „Sau sunați: {telefonAfisat}”.
4. Secțiunea „Alte servicii”: 3 carduri cu servicii vecine după `ordine`, fără serviciul curent.
5. Întrebările din `faq/ro.yaml` care menționează serviciul nu se leagă automat. Lasă un TODO în cod pentru o eventuală legătură manuală.

### C. SEO pe paginile de serviciu

- Titlu: `{titlu} – Notar public Brașov | Bojan Elena Luminița`; meta description = `rezumat`.
- JSON-LD `BreadcrumbList`, plus `Service` cu `provider` care face referire la entitatea `Notary` (stabilește acum un `@id` stabil pentru birou, ex. `{site}/#birou`, pe care îl folosește și etapa 8).

## Ce NU faci

- Nu modifici textele din `src/content/servicii/`.
- Nu adaugi formulare de upload, calculatoare sau iframe-uri.
- Nu inventezi onorarii: dacă textul conține `«DE COMPLETAT`, se afișează marcat.

## Criterii de acceptare

- Toate cele 8 pagini de serviciu se generează. Un serviciu nou adăugat din CMS (testează cu un fișier temporar, apoi șterge-l) apare automat în `/servicii/` și primește pagină.
- Link-ul `mailto:` deschide un email cu subiectul și corpul corecte. Testează cu Gmail web în Chrome și cu clientul de email implicit pe Windows, și raportează ce ai putut verifica.
- Pe 375 px, caseta „Pregătiți dosarul” apare înaintea textului lung, iar butonul „Trimiteți actele” se vede fără mult scroll.
- Tabelul de onorarii e lizibil pe 375 px fără scroll orizontal.
- `npm run build`, `npm run check`, testele și axe trec pe `/servicii/` și pe 2 pagini de serviciu.
- Capturi pe 375 și pe 1280 px pentru `/servicii/` și `/servicii/succesiune/`.

## La final

Commit: `feat: servicii și prețuri, pagini individuale de serviciu`.
