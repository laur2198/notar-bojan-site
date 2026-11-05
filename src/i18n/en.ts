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
  'subsol.copyright': '© {an} {denumire}',

  // Misc
  'draft.eticheta': 'Proposed text – awaiting approval',
  'breadcrumbs.eticheta': 'You are here',
  'link.filaNoua': '(opens in a new tab)',
};
