/**
 * Textele de interfață în engleză. Tipul impune exact aceleași chei ca ro.ts:
 * o cheie lipsă sau în plus e eroare de compilare.
 */
import type { ro } from './ro';

export const en: Record<keyof typeof ro, string> = {
  'skip.continut': 'Skip to content',

  // Navigation
  'nav.principal': 'Main menu',
  'nav.subsol': 'Useful links',
  'nav.servicii': 'Services',
  'nav.programare': 'Appointments',
  'nav.faq': 'FAQ',
  'nav.despre': 'About',
  'nav.contact': 'Contact',
  'nav.recenzii': 'Reviews',
  'nav.confidentialitate': 'Privacy policy (in Romanian)',
  'meniu.deschide': 'Menu',
  'meniu.inchide': 'Close',

  // Buttons and actions
  'actiune.programare': 'Book an appointment',
  'actiune.programareScurt': 'Book',
  'actiune.suna': 'Call us',
  'actiune.indisponibil': 'phone number not available yet',
  'actiune.bara': 'Quick actions',

  // Wordmark
  'wordmark.profesie': 'Notary public',

  // Language
  'limba.comutator': 'Site language',
  'limba.nume': 'English',

  // Contact
  'contact.telefon': 'Phone',
  'contact.email': 'Email',
  'contact.adresa': 'Address',
  'contact.judet': '{judet} County',

  // Opening hours
  'program.titlu': 'Opening hours',
  'program.caption': 'Office opening hours',
  'program.coloanaZi': 'Day',
  'program.coloanaOre': 'Hours',
  'program.interval': '{deschidere}–{inchidere}',
  'program.inchis': 'Closed',
  'program.azi': 'today',
  'program.deschisAcum': 'Open now',
  'program.panaLa': 'until {ora}',
  'program.inchisAcum': 'Closed now',
  'program.inchisAstazi': 'Closed today – {motiv}',
  'program.deschidem': 'we open {cand} at {ora}',
  'program.maine': 'tomorrow',
  'program.inZiua': 'on {zi}',
  'program.laData': 'on {data}',

  // Days of the week, Monday to Sunday
  'zi.0': 'Monday',
  'zi.1': 'Tuesday',
  'zi.2': 'Wednesday',
  'zi.3': 'Thursday',
  'zi.4': 'Friday',
  'zi.5': 'Saturday',
  'zi.6': 'Sunday',

  // Footer
  'subsol.contact': 'Contact',
  'subsol.linkuri': 'Links',
  'subsol.copyright': '© {an} {denumire}',

  // Home page
  'acasa.programare': 'Request an appointment',
  'acasa.suna': 'Call us: {telefon}',
  'acasa.toateServiciile': 'See all services and fees',
  'acasa.despreLink': 'About the office (in Romanian)',
  'acasa.toateIntrebarile': 'All questions',
  'foto.deCompletat': 'Photo – to be added',

  // Practical information band
  'banda.eticheta': 'Practical information',
  'banda.adresa': 'Address',
  'program.inchisPe': 'The office is closed on {data} – {motiv}',
  'harta.deschide': 'Open in Google Maps',

  // Reviews
  'recenzii.numar.one': '{n} Google review',
  'recenzii.numar.few': '{n} Google reviews',
  'recenzii.numar.other': '{n} Google reviews',
  'recenzii.vedetiNoastre': 'See our reviews on Google',
  'recenzii.vedeti': 'See the reviews on Google',
  'recenzii.inAsteptare': 'Reviews will be added once the Google profiles are sorted out',
  'recenzii.citestiTot': 'Read more',
  'recenzii.sursa': 'Google review',
  'recenzii.notaStele': 'Rating: {nota} out of 5 stars',

  // Header, bottom bar, band, services (calibration after the reference site)
  'antet.email': 'Email us: {email}',
  'bara.locatie': 'Location',
  'banda.birou': 'The notary office',
  'banda.programul': 'Our opening hours',
  'banda.recenziiClienti': 'Client reviews',
  'banda.cumAjungeti': 'Getting here',
  'banda.vedetiRecenziile': 'See the reviews',
  'hero.fotoDeCompletat': 'Photo of the building/office – to be added',
  'servicii.vedeti': 'View service',

  // Services and fees
  'servicii.titlu': 'Services and fees',
  'servicii.seoTitlu': 'Services and fees – Notary public Brasov | Bojan Elena Luminita',
  'servicii.seoDescriere': 'Notarial services at the office in Brasov, Romania: property sales, inheritance, powers of attorney, certified copies and signatures.',
  'servicii.onorariiTitlu': 'Indicative fees',
  'servicii.coloanaServiciu': 'Service',
  'servicii.coloanaOnorariu': 'Indicative fee',
  'servicii.onorariuCard': 'Fee:',
  'servicii.altele': 'Other services',
  'servicii.seoTitluPagina': '{titlu} – Notary public Brasov | Bojan Elena Luminita',
  'breadcrumbs.acasa': 'Home',

  // "Prepare your file" box
  'dosar.titlu': 'Prepare your file',
  'dosar.durata': 'Duration',
  'dosar.onorariu': 'Fee',
  'dosar.acte': 'Documents needed',
  'dosar.nota': 'We confirm the final list after checking your documents.',
  'dosar.trimite': 'Email us your documents',
  'dosar.notaEmail': 'Your email app will open. The limit for one message is 25 MB; if your documents are larger, send several emails.',
  'dosar.adresa': 'Address for documents:',
  'dosar.sunati': 'Or call us:',

  // Prefilled email for documents
  'email.salut': 'Hello,',
  'email.nume': 'Full name:',
  'email.telefon': 'Phone:',
  'email.data': 'Preferred date (approximate):',
  'email.observatii': 'Notes:',
  'email.atasate': 'I have attached the following documents:',

  // Pages (stage 5)
  'pagina.seoTitlu': '{titlu} – Notary public Brasov | Bojan Elena Luminita',
  'programare.cardTitlu': 'Online appointment',
  'programare.alegeti': 'Choose a date and time',
  'programare.nota': 'Appointments are made through Google Calendar. The office will confirm your appointment.',
  'programare.altfel': 'Prefer to call or message us?',
  'embed.afiseaza': 'Show the calendar here',
  'embed.info': 'The calendar is hosted by Google. If you show it here, Google may set cookies and learn that you visited this page. Until then, this page loads nothing from Google.',
  'embed.deschide': 'Open the calendar in a new tab',
  'embed.titluIframe': 'Appointment calendar',
  'faq.seoDescriere': 'Answers to frequently asked questions about appointments, documents, fees and signing notarial acts at the notary office in Brasov.',
  'recenzii.titluPagina': 'Reviews',
  'recenzii.seoDescriere': 'Reviews of the notary office of Bojan Elena Luminita in Brasov, published by clients on Google.',
  'recenzii.vedetiToate': 'See all reviews on Google',
  'recenzii.goale': 'You can read client reviews on the office Google profile.',
  'contact.emailActe': 'Email for documents',
  'banda.adresaTitlu': 'Address',
  'banda.contactTitlu': 'Phone, WhatsApp and email',
  'harta.titlu': 'Map',
  'doc.cuprins': 'Contents',
  'doc.actualizat': 'Last updated: {data}',

  // English version (stage 6)
  'faq.titlu': 'Frequently asked questions',
  'servicii.detaliiRo': 'Details in Romanian',
  'servicii.onorariiScurt': 'Fees',
  'despre.nota': 'Good to know',

  // WhatsApp
  'whatsapp.nume': 'WhatsApp',
  'whatsapp.scrieti': 'Message us on WhatsApp',
  'whatsapp.mesaj': 'Hello, I would like information about…',
  'whatsapp.nota': 'On WhatsApp we answer questions and bookings. Please send documents by email, from the service page.',

  // 404 page
  '404.titlu': 'Page not found',
  '404.descriere': 'The page you are looking for does not exist or has been moved.',
  '404.text': 'The page you are looking for does not exist or has been moved. You can continue here:',
  '404.acasa': 'Home page',
  '404.telefon': 'Or call us:',

  // Links
  'link.indisponibil': 'link not available yet',

  // Misc
  'draft.eticheta': 'Proposed text – awaiting approval',
  'breadcrumbs.eticheta': 'You are here',
  'link.filaNoua': '(opens in a new tab)',
};
