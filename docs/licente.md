# Licențe pentru resursele grafice ale site-ului

## Semnătura din hero și din intro (`src/assets/semnatura.svg`)

Fișierul e pus de birou / designer și se folosește ca atare (geometria nu se modifică din cod).

| Element | Sursă | Licență / condiții | Cum e folosit |
|---|---|---|---|
| Literele „Notar” și „Bojan” | fontul **Imperial Script** (© 2008 The Imperial Script Project Authors, https://github.com/googlefonts/imperial-script) | **SIL Open Font License 1.1** – folosire, modificare și includere în produse permise, inclusiv comercial; fontul nu se vinde separat; numele rezervat al fontului nu se folosește pentru versiuni modificate. Text: https://openfontlicense.org | Doar în SVG: contururile glifelor, convertite în path-uri și descoperite prin mască. Fișierul fontului nu se încarcă pe site și nu e în build. |
| Mâinile care se strâng | **Vecteezy**, ilustrația nr. 79569313 | **Vecteezy Pro Standard License** – fără atribuire, folosire ca parte din logo permisă pentru conținut vectorial (de confirmat factura/ID-ul licenței). | Contururi umplute, descoperite prin mască, parte decorativă a semnăturii (aria-hidden). Pe ecrane < 640 px apar doar mâinile. Fără atribuire pe site. |

Istoric: versiunile provizorii anterioare foloseau fontul Lavishly Yours (SIL OFL), apoi Mr De Haviland
(SIL OFL) și un gest abstract derivat dintr-un element Canva; înlocuite. Între timp, mâinile au fost
folosite sub licența Vecteezy Free, cu atribuire în subsol; atribuirea s-a scos odată cu trecerea la
Pro Standard.

Note:
- Factura și ID-ul licenței Pro Standard Vecteezy pentru ilustrația 79569313 se păstrează la birou;
  până la confirmarea lor, licența e trecută ca „de confirmat”.
- Dacă semnătura se înlocuiește cu desenul unui ilustrator, se actualizează acest tabel cu
  licența / cesiunea de drepturi a ilustratorului.

## Fotografiile provizorii (`src/assets/fotografii-provizorii/`)

Fotografii de stoc, folosite **doar pe site-ul de previzualizare**, până vin fotografiile reale ale
biroului (CLAUDE.md §5). Fiecare e marcată în CMS cu „Fotografie provizorie” (`fotoProvizorie: true`)
și poartă pe site eticheta „Fotografie provizorie”; build-ul de producție se oprește cât timp există
vreuna (`scripts/verifica-continut.mjs`). Nu reprezintă biroul, notarul sau clienții lui.

Licența: **Unsplash License** (https://unsplash.com/license) – folosire gratuită, inclusiv comercială,
fără atribuire obligatorie; nu permite vânzarea fotografiilor neschimbate și nici compilarea lor într-un
serviciu concurent. Lista surselor e și în `src/assets/fotografii-provizorii/SURSE.md`.

| Fișier | Unde apare | Sursa (Unsplash) |
|---|---|---|
| `acasa-hero.jpg` | Hero-ul paginii Acasă (RO și EN) | https://unsplash.com/photos/elegant-table-lamp-on-a-wooden-desk-with-mirror-ZHw4bVH97t0 |
| `serviciu-vanzare-cumparare.jpg` | Serviciul Vânzare-cumpărare | https://unsplash.com/photos/white-and-red-wooden-house-miniature-on-brown-table-rgJ1J8SDEAY |
| `serviciu-succesiune.jpg` | Serviciul Succesiune | https://unsplash.com/photos/brown-paper-and-black-pen-B6yDtYs2IgY |
| `serviciu-donatie.jpg` | Serviciul Donație | https://unsplash.com/photos/a-person-holding-a-bunch-of-keys-in-their-hand-Ebj87ehFNNU |
| `serviciu-procuri.jpg` | Serviciul Procuri | https://unsplash.com/photos/black-and-silver-fountain-pen-hjwKMkehBco |
| `serviciu-legalizari.jpg` | Serviciul Legalizări | https://unsplash.com/photos/rubber-stamp-on-legal-document-7PMGUqYQpYc |
| `serviciu-divort.jpg` | Serviciul Divorț | https://unsplash.com/photos/green-cactus-plant-on-white-table-nCk22aqZjlM |
| `pas-1-trimiteti-actele.jpg` | „Cum lucrăm”, pasul 1 | https://unsplash.com/photos/a-laptop-computer-sitting-on-top-of-a-wooden-desk-3q4V539j_bw |
| `pas-2-verificam-dosarul.jpg` | „Cum lucrăm”, pasul 2 | https://unsplash.com/photos/two-people-reviewing-documents-at-meeting-table-TFFn3BYLc5s |
| `pas-3-semnati-la-birou.jpg` | „Cum lucrăm”, pasul 3 | https://unsplash.com/photos/person-writing-on-white-paper-wB9iWZKwljw |

## Fonturile site-ului

Geist, Geist Mono (Vercel) și Funnel Display (NoirBlancRouge): SIL Open Font License 1.1, self-hosted
prin pachetele Fontsource (`@fontsource-variable/*`).
