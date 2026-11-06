/**
 * Schemele de conținut (CLAUDE.md §7).
 *
 * Reguli:
 * - fiecare fișier are `validat: boolean` obligatoriu;
 * - câmpurile cu format (telefon, email, URL, oră) acceptă fie formatul real,
 *   fie un text care conține `«DE COMPLETAT`, ca preview-ul să se genereze
 *   înainte ca biroul să trimită datele. Producția e blocată separat de
 *   `scripts/verifica-continut.mjs`;
 * - datele calendaristice se acceptă ca string sau ca `Date` (YAML transformă
 *   `2026-12-25` fără ghilimele în `Date`) și se normalizează la `YYYY-MM-DD`.
 *
 * Toate colecțiile folosesc `glob()`: `file()` cere un array de obiecte cu `id`
 * și ar transforma fiecare cheie din `birou.yaml` într-o intrare separată.
 */
import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const BAZA = './src/content';
const MARCAJ = '«DE COMPLETAT';

const areMarcaj = (text: string) => text.includes(MARCAJ);

/** Acceptă formatul real sau un text marcat «DE COMPLETAT. */
function formatSauDeCompletat(format: z.ZodType<string>, descriere: string) {
  return z.string().refine((text) => areMarcaj(text) || format.safeParse(text).success, {
    message: `Trebuie să fie ${descriere} sau să conțină „${MARCAJ}…»”.`,
  });
}

const telefon = formatSauDeCompletat(
  z.string().regex(/^\+40\d{9}$/),
  'un număr în format internațional, fără spații (ex. +40268123456)',
);
const email = formatSauDeCompletat(z.email(), 'o adresă de email validă');
const url = formatSauDeCompletat(z.url({ protocol: /^https$/ }), 'un link complet care începe cu https://');

const ORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Dată calendaristică, ca string `YYYY-MM-DD` sau ca `Date` din YAML; rezultatul e mereu string. */
const dataCalendaristica = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data trebuie să fie în formatul AAAA-LL-ZZ.'), z.date()])
  .transform((valoare) => (typeof valoare === 'string' ? valoare : valoare.toISOString().slice(0, 10)))
  .refine((text) => {
    const data = new Date(`${text}T00:00:00Z`);
    return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === text;
  }, 'Data nu există în calendar.');

/** Câmp de imagine opțional: gol (`""`/`null`) sau o cale procesată de `image()`. */
const imagineOptionala = (image: SchemaContext['image']) =>
  z.union([z.literal(''), image()]).nullish().transform((valoare) => valoare || undefined);

const validat = z.boolean();

/** Număr opțional: gol în YAML (`null`) sau câmp omis de CMS (`undefined`) devin `null`. */
const numarOptional = (schema: z.ZodNumber) => schema.nullish().transform((valoare) => valoare ?? null);

// ---------------------------------------------------------------------------
// setari/birou.yaml
// ---------------------------------------------------------------------------

const ZILE = ['luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă', 'duminică'] as const;

const ziProgram = z
  .object({
    zi: z.enum(ZILE),
    deschidere: z.string(),
    inchidere: z.string(),
    inchis: z.boolean(),
  })
  .superRefine((zi, ctx) => {
    if (zi.inchis) return;
    for (const camp of ['deschidere', 'inchidere'] as const) {
      if (!ORA.test(zi[camp])) {
        ctx.addIssue({ code: 'custom', path: [camp], message: `Ora trebuie să fie în formatul HH:MM (${zi.zi}).` });
      }
    }
    if (ORA.test(zi.deschidere) && ORA.test(zi.inchidere) && zi.deschidere >= zi.inchidere) {
      ctx.addIssue({ code: 'custom', path: ['inchidere'], message: `Ora de închidere trebuie să fie după ora de deschidere (${zi.zi}).` });
    }
  });

const birou = defineCollection({
  loader: glob({ base: `${BAZA}/setari`, pattern: 'birou.yaml' }),
  schema: z.object({
    denumire: z.string().min(1),
    notar: z.string().min(1),
    adresa: z.object({
      strada: z.string().min(1),
      oras: z.string().min(1),
      judet: z.string().min(1),
      codPostal: formatSauDeCompletat(z.string().regex(/^\d{6}$/), 'un cod poștal de 6 cifre'),
    }),
    telefon,
    telefonAfisat: z.string().min(1),
    email,
    emailActe: email,
    program: z
      .array(ziProgram)
      .length(7, 'Programul trebuie să aibă exact 7 zile, de luni până duminică.')
      .refine((zile) => zile.every((zi, i) => zi.zi === ZILE[i]), 'Zilele trebuie să fie în ordine, de luni până duminică.'),
    programConfirmare: z.string().optional(),
    zileLibere: z.array(
      z.object({
        data: dataCalendaristica,
        motiv: z.string().min(1),
        /** Traducerea motivului pentru paginile EN (etapa 6). Fără ea, apare motivul în română. */
        motivEn: z.string().min(1).optional(),
      }),
    ),
    zileLibereConfirmare: z.string().optional(),
    googleMapsUrl: url,
    googleProfilUrl: url,
    rating: numarOptional(z.number().min(1).max(5)),
    numarRecenzii: numarOptional(z.number().int().min(0)),
    programareUrl: url,
    coordonate: z.object({
      lat: numarOptional(z.number().min(-90).max(90)),
      lng: numarOptional(z.number().min(-180).max(180)),
    }),
    validat,
  }),
});

// ---------------------------------------------------------------------------
// pagini/{ro,en}/acasa.yaml
// ---------------------------------------------------------------------------

const acasa = defineCollection({
  loader: glob({ base: `${BAZA}/pagini`, pattern: '*/acasa.yaml' }),
  schema: ({ image }) =>
    z.object({
      seo: z.object({
        titlu: z.string().min(1),
        descriere: z.string().min(1),
      }),
      hero: z.object({
        /** Nu se mai afișează (structura calibrată după referință); păstrat opțional pentru fișierele existente. */
        eticheta: z.string().optional(),
        titlu: z.string().min(1),
        subtitlu: z.string().min(1),
        imagine: imagineOptionala(image),
        imagineAlt: z.string(),
      }),
      servicii: z.object({
        titlu: z.string().min(1),
        intro: z.string().min(1),
      }),
      pasi: z.object({
        titlu: z.string().min(1),
        intro: z.string().min(1),
        lista: z.array(z.object({ titlu: z.string().min(1), text: z.string().min(1) })).min(1),
      }),
      recenzii: z.object({
        titlu: z.string().min(1),
        intro: z.string().min(1),
      }),
      despre: z.object({
        titlu: z.string().min(1),
        text: z.string().min(1),
        imagine: imagineOptionala(image),
        imagineAlt: z.string(),
      }),
      faq: z.object({
        titlu: z.string().min(1),
        numarAfisat: z.number().int().min(0),
      }),
      final: z.object({
        titlu: z.string().min(1),
        text: z.string().min(1),
      }),
      validat,
    }),
});

// ---------------------------------------------------------------------------
// pagini/**/*.md (despre, programare, contact, confidentialitate)
// ---------------------------------------------------------------------------

const pagini = defineCollection({
  loader: glob({ base: `${BAZA}/pagini`, pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      titlu: z.string().min(1),
      seoDescriere: z.string().min(1),
      imagine: imagineOptionala(image),
      imagineAlt: z.string().optional(),
      /** Doar în confidentialitate.md; nu apare în CLAUDE.md §7. Dată sau marcaj «DE COMPLETAT. */
      actualizat: z
        .union([dataCalendaristica, z.string().refine(areMarcaj, `Trebuie să fie o dată AAAA-LL-ZZ sau să conțină „${MARCAJ}…»”.`)])
        .optional(),
      validat,
    }),
});

// ---------------------------------------------------------------------------
// servicii/ro/*.md
// ---------------------------------------------------------------------------

const servicii = defineCollection({
  // `id` = câmpul `slug` din frontmatter (comportament implicit al glob()).
  loader: glob({ base: `${BAZA}/servicii/ro`, pattern: '*.md' }),
  schema: ({ image }) => z.object({
    titlu: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug-ul poate conține doar litere mici fără diacritice, cifre și cratimă.'),
    ordine: z.number().int(),
    evidentiat: z.boolean(),
    rezumat: z.string().min(1).max(160, 'Rezumatul are maximum 160 de caractere (e folosit și ca meta description).'),
    pentruCine: z.string().min(1),
    durata: z.string().min(1),
    onorariu: z.string().min(1),
    acteNecesare: z.array(z.string().min(1)).min(1),
    subiectEmail: z.string().min(1),
    /** Opțional: imaginea 16:10 de pe cardul serviciului. */
    imagine: imagineOptionala(image),
    imagineAlt: z.string().optional(),
    validat,
  }),
});

// ---------------------------------------------------------------------------
// servicii-en/servicii.yaml
// ---------------------------------------------------------------------------

const serviciiEn = defineCollection({
  loader: glob({ base: `${BAZA}/servicii-en`, pattern: 'servicii.yaml' }),
  schema: z.object({
    intro: z.string().min(1),
    lista: z
      .array(
        z.object({
          titlu: z.string().min(1),
          text: z.string().min(1),
          slugRo: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        }),
      )
      .min(1),
    fees: z.string().min(1),
    validat,
  }),
});

// ---------------------------------------------------------------------------
// preturi/ro.yaml
// ---------------------------------------------------------------------------

const preturi = defineCollection({
  loader: glob({ base: `${BAZA}/preturi`, pattern: '*.yaml' }),
  schema: z.object({
    intro: z.string().min(1),
    nota: z.string().min(1),
    lista: z.array(
      z.object({
        serviciu: z.string().min(1),
        text: z.string().min(1),
      }),
    ),
    validat,
  }),
});

// ---------------------------------------------------------------------------
// faq/{ro,en}.yaml
// ---------------------------------------------------------------------------

const faq = defineCollection({
  loader: glob({ base: `${BAZA}/faq`, pattern: '*.yaml' }),
  schema: z.object({
    intrebari: z
      .array(
        z.object({
          intrebare: z.string().min(1),
          raspuns: z.string().min(1),
        }),
      )
      .min(1),
    validat,
  }),
});

// ---------------------------------------------------------------------------
// recenzii/recenzii.yaml – doar recenzii reale de pe Google
// ---------------------------------------------------------------------------

const recenzii = defineCollection({
  loader: glob({ base: `${BAZA}/recenzii`, pattern: 'recenzii.yaml' }),
  schema: z.object({
    lista: z.array(
      z.object({
        autor: z.string().min(1),
        data: dataCalendaristica,
        nota: z.number().int().min(1).max(5),
        text: z.string().min(1),
        sursa: z.literal('Google'),
      }),
    ),
    validat,
  }),
});

export const collections = { birou, acasa, pagini, servicii, serviciiEn, preturi, faq, recenzii };
