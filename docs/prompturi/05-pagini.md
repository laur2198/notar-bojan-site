# Prompt 5 – Programare, FAQ, Recenzii, Despre, Contact, Confidențialitate, 404

Branch: `etapa-5-pagini`

--- PROMPT ---

Citește `CLAUDE.md`, fișierele din `src/content/pagini/ro/`, `faq/ro.yaml`, `recenzii/recenzii.yaml` și `setari/birou.yaml`, apoi componentele existente. Fă un plan și așteaptă aprobarea mea.

## Context

Restul paginilor în română. Reutilizează componentele din etapele 3 și 4: nu crea variante noi ale acelorași elemente.

## Ce construiești

1. **`/programare/`** (`pagini/ro/programare.md`):
   - `h1`, textul introductiv și un card mare cu butonul primar **„Alegeți data și ora”**, care trimite la `birou.programareUrl` în tab nou, anunțat vizual și pentru cititoarele de ecran. Sub buton: „Programarea se face prin Google Calendar. Biroul vă confirmă programarea.”;
   - dacă `programareUrl` conține `«DE COMPLETAT`, butonul e dezactivat vizual (cu `aria-disabled`, nu șters) și în preview apare marcajul;
   - lângă card: telefonul, programul (`ProgramSaptamana`) și `StareProgram`;
   - restul textului Markdown (Înainte de programare, Anulare);
   - **fără iframe**. Lasă în cod o componentă `EmbedCuConsimtamant.astro` (facade: un buton „Afișați calendarul aici”, iar la click se încarcă iframe-ul, cu text despre cookie-urile Google), **nefolosită deocamdată**, documentată în README.
2. **`/intrebari-frecvente/`:** toate întrebările din `faq/ro.yaml`, cu `ListaFaq`, și JSON-LD `FAQPage`. Răspunsurile care conțin `«DE COMPLETAT` sunt **excluse** din JSON-LD.
3. **`/recenzii/`:** ratingul agregat (dacă există), toate recenziile din listă, sortate descrescător după dată, cu `CardRecenzie`, și butonul „Vedeți toate recenziile pe Google”. Cu lista goală: un mesaj neutru și butonul spre Google. Fără JSON-LD `Review` (recenziile Google nu se marchează ca recenzii proprii).
4. **`/despre/`:** layout pe două coloane (fotografie placeholder 4:5, text). Corpul Markdown are tipografie de articol și `measure` limitat.
5. **`/contact/`:**
   - pe desktop, un grid cu: carduri pentru adresă (cu „Deschideți în Google Maps”), telefon, email general și email pentru acte, plus programul complet și `StareProgram`;
   - textul Markdown (Cum ajungeți, Parcare);
   - o zonă de hartă: imagine statică placeholder (bloc crem cu iconiță de pin și adresa), cu linkul spre Google Maps. Fără iframe;
   - JSON-LD-ul nu se face aici, ci în etapa 8.
6. **`/confidentialitate/`:** tipografie de document, cuprins generat din `h2` și data actualizării. Blockquote-ul inițial apare doar în preview: la build de producție nu se afișează (sau scrie în raport cum ai rezolvat).
7. **`404`:** mesaj în română și engleză, cu linkuri spre Acasă, Servicii și Contact și telefonul.

## Ce NU faci

- Nu modifici conținutul.
- Nu încarci Google Maps, Google Calendar sau altă resursă externă la încărcarea paginii.
- Nu creezi formular de contact (nu e în contract): contactul se face prin telefon, email și programare.

## Criterii de acceptare

- Toate linkurile interne din site funcționează. Rulează un link checker pe `dist/` (de ex. un script simplu cu `linkinator` instalat local ca devDependency, justificat) și raportează rezultatul.
- JSON-LD `FAQPage` e valid: verifică structura față de documentația schema.org/Google și raportează.
- `npm run build`, `npm run check`, testele și axe trec pe toate paginile noi.
- Capturi pe 375 și pe 1280 px pentru fiecare pagină nouă.

## La final

Commit: `feat: pagini programare, FAQ, recenzii, despre, contact, confidențialitate, 404`.
