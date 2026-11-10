# Licențe pentru resursele grafice ale site-ului

## Semnătura din hero și din intro (`src/assets/semnatura.svg`, provizorie)

| Element | Sursă | Licență / condiții | Cum e folosit |
|---|---|---|---|
| Literele „Notar” și „Bojan” | fontul **Mr De Haviland** (Sudtipos; Google Fonts) | **SIL Open Font License 1.1** – folosire, modificare și includere în produse permise, inclusiv comercial; fontul nu se vinde separat; numele rezervat al fontului nu se folosește pentru versiuni modificate. Text: https://openfontlicense.org | Linia de mijloc extrasă din glife, ca path-uri cu stroke (nu se încarcă fontul pe site). |
| Mâinile care se strâng | gest abstract (4 trăsături) derivat dintr-un element grafic din **Canva** | **Licența de conținut Canva** – permis ca element **decorativ într-un design**; NU ca logo, marcă sau element de identitate înregistrabil, și nu redistribuit separat, ca fișier de sine stătător. | Parte decorativă a compoziției semnăturii, nu logo. |

Istoric: o versiune provizorie anterioară folosea fontul Lavishly Yours (SIL OFL) ca forme umplute; înlocuită.

Note:
- Dacă semnătura se înlocuiește cu desenul unui ilustrator, se actualizează acest tabel cu licența/cesiunea
  de drepturi a ilustratorului.
- Dacă semnătura (sau compoziția cu mâinile) ajunge să fie folosită ca logo al biroului (ex. pe
  cărți de vizită, antet, firmă), elementul din Canva trebuie înlocuit: licența Canva nu permite
  folosirea ca marcă.

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
