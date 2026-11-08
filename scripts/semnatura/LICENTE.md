# Fonturile single-line din acest dosar

Folosite DOAR la build, de `scripts/genereaza-semnatura.mjs`, ca să genereze `src/assets/semnatura.svg`.
Nu se servesc pe site. Sursa: pachetul npm `hersheytext` 2.0.0 (MIT), dosarul `svg_fonts/`
(fonturile SVG ale extensiei Hershey Text din Inkscape, conversie Evil Mad Scientist Laboratories).

| Fișier | Font | Licență |
|---|---|---|
| `EMSAllure.svg` | EMS Allure (Sheldon B. Michaels, derivat din Allura de Rob Leuschke, TypeSETit) | SIL Open Font License 1.1 – https://openfontlicense.org |

Fontul folosit în semnătură: **EMS Allure** (Hershey Script a fost comparat și abandonat). Mențiunile de licență sunt păstrate în metadatele fișierului.
`maini.svg`: linia de legătură provizorie din mijloc, folosită cât timp lipsește desenul cu licență `src/assets/surse/maini.svg` (vezi README-ul de acolo).
`geometrie.mjs`: simplificare, netezire Catmull-Rom → Bézier, parsarea path-urilor SVG. `extrage-maini.mjs`: extragerea și înlănțuirea desenului mâinilor.
