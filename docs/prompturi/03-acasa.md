# Prompt 3 – Pagina Acasă (propunerea de design)

Branch: `etapa-3-acasa`

--- PROMPT ---

Citește `CLAUDE.md` (secțiunile 3, 5 și 8), `src/content/pagini/ro/acasa.yaml`, `src/content/setari/birou.yaml`, `src/content/faq/ro.yaml`, `src/content/recenzii/recenzii.yaml` și componentele existente. Fă un plan, cu o schiță în text a secțiunilor pe 375 px și pe 1280 px, și așteaptă aprobarea mea.

## Context

Pagina asta e **propunerea de design** pe care clienta o aprobă înainte de restul site-ului (etapa 3 din contract), deci trebuie să arate finisat. Clienta a ales ca model structura site-ului notariatului Jesús Benavides din Barcelona: imediat sub prima secțiune apar informațiile practice (program, rating Google, adresă). Paleta e maro închis pe crem, conform secțiunii 5 din `CLAUDE.md`. Tonul e sobru, cald și de încredere: nu e un site de agenție, nu e „startup”.

## Ce construiești: secțiunile, în ordine

1. **Hero:**
   - pe desktop, două coloane: text (denumirea legală „Birou Individual Notarial” pe un rând mic, în fontul de text, fără majuscule integrale și fără `letter-spacing`, `h1` „Notar public în Brașov”, subtitlul, butonul primar „Solicitați o programare” și butonul secundar „Sunați: {telefonAfisat}”) și fotografia în format portret 4:5;
   - pe mobil: text, butoane pe toată lățimea, apoi fotografia, la o înălțime rezonabilă;
   - fotografia lipsește încă, așa că pune un placeholder cu eticheta „Fotografie – de completat” (`CLAUDE.md` §5). Fără fotografii stock.
2. **Banda de informații practice** (elementul preluat de la Benavides). Stă lipită sau ușor suprapusă peste baza hero-ului pe desktop, pe fundal alb, cu umbra `--shadow`. Are trei coloane:
   - **Program:** `StareProgram` („Deschis acum…”), programul de azi și linkul „Vedeți programul complet”, care deschide `<details>` cu `ProgramSaptamana`. Dacă există o zi liberă în următoarele 14 zile, apare o notă: „Biroul este închis pe 25 decembrie – Crăciunul”;
   - **Recenzii Google:** ratingul cu stele (SVG accesibil, cu text „4,8 din 5”) și numărul de recenzii, cu link spre `googleProfilUrl`. Dacă `rating` e gol, afișează doar „Vedeți recenziile noastre pe Google” și o iconiță neutră. **Nu afișa un rating inventat**;
   - **Adresă:** strada, orașul și linkul „Deschideți în Google Maps” (tab nou, anunțat).

   Pe mobil, cele trei coloane devin trei carduri stivuite.
3. **Servicii:** `h2`, intro și un grid cu serviciile `evidentiat: true`, ordonate după `ordine`. Grid-ul are 3 coloane pe desktop, 2 pe tabletă și 1 pe mobil. Fiecare card conține titlul (serif), `rezumat` și o săgeată decorativă. Titlul cardului e chiar linkul; fără „Aflați mai multe” repetat pe fiecare card. **Tot cardul e clicabil**, cu un singur link real (tehnica pseudo-element pe `a`), fără linkuri imbricate. Sub grid: „Vedeți toate serviciile și onorariile”.
4. **Cum lucrăm:** cei 3 pași din `pasi.lista`, ca listă ordonată, cu numere mari în serif și o linie de legătură decorativă `--c-ochre-500` pe desktop. Fundal `--c-cream-100`.
5. **Recenzii:**
   - dacă `recenzii.lista` are elemente: maximum 3 carduri cu nota, textul (trunchiat elegant la ~5 rânduri, cu „Citiți tot” spre `/recenzii/`), autorul, data și sursa „Google”;
   - dacă lista e goală: secțiunea afișează doar titlul, intro-ul și butonul „Vedeți recenziile pe Google”, iar în preview și un `DraftBadge` cu textul „Recenziile se adaugă după rezolvarea profilurilor Google”.

   Nu genera recenzii.
6. **Despre:** fotografia (placeholder), `despre.titlu`, `despre.text` (trecut prin `marcheazaPlaceholder`) și linkul „Despre birou”.
7. **Întrebări frecvente:** primele `faq.numarAfisat` întrebări din `faq/ro.yaml`, cu `<details>/<summary>`, plus linkul „Toate întrebările”.
8. **Secțiunea finală:** fundal `--c-brown-800`, text alb, `final.titlu`, `final.text`, butonul „Solicitați o programare” (stil inversat: fundal crem, text maro) și telefonul mare, clicabil.

## Cerințe

- Toate textele vin din conținut sau din `src/i18n/`. Nimic hardcodat.
- Componente reutilizabile: `CardServiciu`, `BandaInfo`, `PasiLucru`, `CardRecenzie`, `ListaFaq`, `SectiuneCta`. Le vor folosi și paginile următoare.
- Ritm vertical consecvent: secțiunile alternează fundalul crem cu crem închis, cu `--space-6`/`--space-7` între ele.
- Detaliile care dau calitate: linii subțiri `--c-sand-200`, numerele pașilor în serif, umbre discrete. Fără gradienți stridenți, fără iconițe de tip clipart. **Fără eyebrow** (text mic deasupra unui `h2`, care doar anunță titlul) și fără etichete cu MAJUSCULE spațiate: sunt cele mai recognoscibile semne de design generat de AI. Fiecare secțiune începe direct cu `h2`.
- Lighthouse pe mobil, în preview: Performance ≥ 95, Accessibility 100, Best Practices ≥ 95.
- Imaginile, când vor exista, trec prin `<Image>` din Astro. Hero-ul are `loading="eager"` și `fetchpriority="high"`.

## Ce NU faci

- Nu modifici conținutul din `src/content/`. Dacă un text e prea lung pentru design, îmi spui și nu-l scurtezi.
- Nu adaugi animații de intrare, carusele sau slidere.
- Nu faci varianta în engleză a paginii (etapa 6). Componentele trebuie însă să primească `locale`.

## Criterii de acceptare

- Pagina arată finisat pe 375, 768, 1024 și 1440 px. Fă capturi la toate patru.
- Funcționează complet cu JS dezactivat, cu excepția stării „Deschis acum”.
- În preview apar `DraftBadge` și marcajele galbene pe textele nevalidate.
- `npm run build`, `npm run check`, testele și axe trec (0 încălcări serious/critical).
- Raportează scorurile Lighthouse.

## La final

Fă o listă cu deciziile de design pe care trebuie să le aprobe clienta (de ex. fotografia în hero sau nu, poziția benzii de informații). Commit: `feat: pagina Acasă – propunere de design`.
