/**
 * Textele de interfață în română (CLAUDE.md §6). Conținutul paginilor NU stă aici,
 * ci în src/content/. Cheile de aici sunt sursa de adevăr: en.ts trebuie să le aibă pe toate.
 */
export const ro = {
  'skip.continut': 'Sari la conținut',

  // Navigare
  'nav.principal': 'Meniul principal',
  'nav.subsol': 'Linkuri utile',
  'nav.servicii': 'Servicii',
  'nav.programare': 'Programare',
  'nav.faq': 'Întrebări frecvente',
  'nav.faqScurt': 'Întrebări',
  'nav.despre': 'Despre',
  'nav.contact': 'Contact',
  'nav.recenzii': 'Recenzii',
  'nav.confidentialitate': 'Politica de confidențialitate',
  'meniu.deschide': 'Meniu',
  'meniu.inchide': 'Închide',

  // Butoane și acțiuni
  'actiune.programare': 'Programare',
  'actiune.programareScurt': 'Programare',
  'actiune.suna': 'Sunați',
  'actiune.indisponibil': 'numărul de telefon nu este încă disponibil',
  'actiune.bara': 'Acțiuni rapide',

  // Wordmark
  'wordmark.profesie': 'Notar public',

  // Limba
  'limba.comutator': 'Limba site-ului',
  'limba.nume': 'Română',

  // Contact
  'contact.telefon': 'Telefon',
  'contact.email': 'Email',
  'contact.adresa': 'Adresa',
  'contact.judet': 'județul {judet}',

  // Program
  'program.titlu': 'Program',
  'program.caption': 'Programul de lucru al biroului',
  'program.coloanaZi': 'Ziua',
  'program.coloanaOre': 'Ore',
  'program.interval': '{deschidere}–{inchidere}',
  'program.inchis': 'Închis',
  'program.azi': 'azi',
  'program.deschisAcum': 'Deschis acum',
  'program.panaLa': 'până la {ora}',
  'program.inchisAcum': 'Închis acum',
  'program.inchisAstazi': 'Închis astăzi – {motiv}',
  'program.deschidem': 'deschidem {cand} la {ora}',
  'program.maine': 'mâine',
  'program.inZiua': '{zi}',
  'program.laData': 'pe {data}',

  // Zilele săptămânii, de luni până duminică
  'zi.0': 'luni',
  'zi.1': 'marți',
  'zi.2': 'miercuri',
  'zi.3': 'joi',
  'zi.4': 'vineri',
  'zi.5': 'sâmbătă',
  'zi.6': 'duminică',

  // Subsol
  'subsol.contact': 'Contact',
  'subsol.linkuri': 'Linkuri',
  'subsol.copyright': '© {an} {denumire}',
  'subsol.navigare': 'Navigare',
  'subsol.adresa': 'Adresă',
  'subsol.cif': 'CIF {cif}',
  'subsol.atribuire': 'Ilustrație:',
  'wordmark.acasa': '{denumire} – pagina principală',

  // Pagina Acasă
  'acasa.programare': 'Solicitați o programare',
  'acasa.suna': 'Sunați: {telefon}',
  'acasa.toateServiciile': 'Vedeți toate serviciile',
  'acasa.despreLink': 'Despre birou',
  'acasa.toateIntrebarile': 'Toate întrebările',
  'acasa.toateServiciileScurt': 'Toate serviciile',
  'acasa.etichete': 'Etichete',
  'acasa.fraze': 'Despre actul notarial',
  'acasa.fotoHero': 'Fotografie birou – urmează',
  'acasa.pasul': 'Pasul {n}',
  'cursor.serviciu': 'Vezi serviciul',
  'foto.provizorie': 'Fotografie provizorie',
  'foto.deCompletat': 'Fotografie – de completat',

  // Banda de informații practice
  'banda.eticheta': 'Informații practice',
  'banda.adresa': 'Adresa',
  'program.inchisPe': 'Biroul este închis pe {data} – {motiv}',
  'harta.deschide': 'Deschideți în Google Maps',

  // Recenzii
  'recenzii.numar.one': '{n} recenzie pe Google',
  'recenzii.numar.few': '{n} recenzii pe Google',
  'recenzii.numar.other': '{n} de recenzii pe Google',
  'recenzii.vedetiNoastre': 'Vedeți recenziile noastre pe Google',
  'recenzii.vedeti': 'Vedeți recenziile pe Google',
  'recenzii.inAsteptare': 'Recenziile se adaugă după rezolvarea profilurilor Google',
  'recenzii.citestiTot': 'Citiți tot',
  'recenzii.sursa': 'Recenzie de pe Google',
  'recenzii.notaStele': 'Nota: {nota} din 5 stele',

  // Antet, bara de jos, banda, servicii (calibrare după referință)
  'bara.locatie': 'Locație',
  'banda.birou': 'Biroul notarial',
  'banda.programul': 'Programul nostru',
  'banda.recenziiClienti': 'Recenziile clienților',
  'banda.cumAjungeti': 'Cum ajungeți',
  'banda.vedetiRecenziile': 'Vedeți recenziile',
  'hero.fotoDeCompletat': 'Fotografie clădire/birou – de completat',
  'servicii.vedeti': 'Vedeți serviciul',

  // Servicii (fără onorarii sau sume: CLAUDE.md §3.3)
  'servicii.titlu': 'Servicii',
  'servicii.seoTitlu': 'Servicii | {denumire}',
  'servicii.seoDescriere': 'Serviciile biroului notarial din Brașov și actele necesare pentru fiecare.',
  'servicii.intro': 'Onorariile notariale se stabilesc conform normelor în vigoare (Ordinul ministrului justiției nr. 177/C/2024). Suma exactă, împreună cu taxele legale, v-o comunicăm după ce verificăm actele.',
  'servicii.altele': 'Alte servicii',
  // „{titlu} la notar în Brașov”; fără „la notar” când titlul conține deja „notar” (src/lib/servicii.ts).
  'servicii.seoTitluPagina': '{titlu} la notar în Brașov | {denumire}',
  'servicii.seoTitluPaginaScurt': '{titlu} în Brașov | {denumire}',
  'breadcrumbs.acasa': 'Acasă',

  // Caseta „Pregătiți dosarul”
  'dosar.titlu': 'Pregătiți dosarul',
  'dosar.durata': 'Durata',
  'dosar.onorariu': 'Onorariu',
  'dosar.onorariuNorme': 'Norme: Ordinul ministrului justiției nr. 177/C/2024.',
  'dosar.acte': 'Acte necesare',
  'dosar.nota': 'Lista finală v-o confirmăm după verificarea actelor.',
  'dosar.trimite': 'Trimiteți actele pe email',
  'dosar.notaEmail': 'Se deschide aplicația de email. Limita unui mesaj este de 25 MB; dacă documentele sunt mai mari, trimiteți mai multe emailuri.',
  'dosar.adresa': 'Adresa pentru acte:',
  'dosar.sunati': 'Sau sunați:',

  // Emailul precompletat pentru acte
  'email.salut': 'Bună ziua,',
  'email.nume': 'Nume și prenume:',
  'email.telefon': 'Telefon:',
  'email.data': 'Data aproximativă dorită:',
  'email.observatii': 'Observații:',
  'email.atasate': 'Am atașat următoarele documente:',

  // Pagini (etapa 5)
  'pagina.seoTitlu': '{titlu} | {denumire}',
  'programare.cardTitlu': 'Programare online',
  'programare.alegeti': 'Alegeți data și ora',
  'programare.nota': 'Programarea se face prin Google Calendar. Biroul vă confirmă programarea.',
  'programare.altfel': 'Preferați să sunați sau să ne scrieți?',
  'embed.afiseaza': 'Afișați calendarul aici',
  'embed.info': 'Calendarul este găzduit de Google. Dacă îl afișați aici, Google poate seta cookie-uri și poate afla că ați vizitat această pagină. Până atunci, pagina nu încarcă nimic de la Google.',
  'embed.deschide': 'Deschideți calendarul într-o filă nouă',
  'embed.titluIframe': 'Calendarul de programări',
  'faq.seoDescriere': 'Răspunsuri la întrebările frecvente despre programare, acte, onorarii și semnarea actelor la biroul notarial din Brașov.',
  'recenzii.titluPagina': 'Recenzii',
  'recenzii.seoDescriere': 'Recenziile clienților publicate pe Google pentru {denumire}, Brașov.',
  'recenzii.vedetiToate': 'Vedeți toate recenziile pe Google',
  'recenzii.goale': 'Recenziile clienților pot fi citite pe profilul Google al biroului.',
  'contact.emailActe': 'Email pentru acte',
  'banda.adresaTitlu': 'Adresa',
  'banda.contactTitlu': 'Telefon, WhatsApp și email',
  'harta.titlu': 'Harta',
  'doc.cuprins': 'Cuprins',
  'doc.actualizat': 'Ultima actualizare: {data}',

  // Versiunea în engleză (etapa 6)
  'faq.titlu': 'Întrebări frecvente',
  'servicii.detaliiRo': 'Detalii în română',
  'despre.nota': 'Bine de știut',

  // Imaginea de distribuire (Open Graph)
  'og.subtitlu': 'Notar public în Brașov',
  'og.alt': '{denumire}, notar public în Brașov',

  // WhatsApp
  'whatsapp.nume': 'WhatsApp',
  'whatsapp.scrieti': 'Scrieți-ne pe WhatsApp',
  'whatsapp.mesaj': 'Bună ziua, aș dori informații despre…',
  'whatsapp.nota': 'Pe WhatsApp răspundem la întrebări și programări. Actele le trimiteți pe email, din pagina serviciului.',

  // Pagina 404
  '404.titlu': 'Pagina nu a fost găsită',
  '404.descriere': 'Pagina căutată nu există sau a fost mutată.',
  '404.text': 'Pagina pe care o căutați nu există sau a fost mutată. Puteți continua de aici:',
  '404.acasa': 'Pagina principală',
  '404.telefon': 'Sau sunați-ne:',

  // Linkuri
  'link.indisponibil': 'linkul nu este încă disponibil',

  // Diverse
  'draft.eticheta': 'Text propus – în curs de validare',
  'breadcrumbs.eticheta': 'Sunteți aici',
  'link.filaNoua': '(se deschide într-o filă nouă)',
} as const;
