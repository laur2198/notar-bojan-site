# Surse pentru semnătură

- `maini.svg` (de adăugat): desenul mâinilor care se strâng, **continuous-line** (trăsături, nu
  contururi umplute), cu licență care permite folosirea pe site. Păstrați lângă el dovada licenței
  (ex. `maini-licenta.txt`: sursa, autorul, tipul licenței, data).
  Apoi: `node scripts/genereaza-semnatura.mjs`. Generatorul (prin `scripts/semnatura/extrage-maini.mjs`):
  - extrage `<path>`, `<polyline>`, `<line>` cu transformările lor (fără `<defs>`, măști etc.);
  - înlănțuie bucățile într-o trăsătură continuă (golurile mici se leagă), de la stânga la dreapta;
  - le netezește ca literele (Catmull-Rom) și le așază între ieșirea din „notar” și intrarea în
    „bojan” (capătul din stânga al desenului pe ieșire, cel din dreapta pe intrare);
  - avertizează dacă desenul pare un contur umplut.
- Până vine fișierul, în mijloc rămâne linia de legătură provizorie din `scripts/semnatura/maini.svg`.

Fișierele de aici nu se servesc pe site (nu sunt importate de nicio pagină).
