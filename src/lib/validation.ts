/**
 * Validering i två lager:
 *  1. Formulärvalidering (validateXInput) som ger fältvisa felmeddelanden.
 *  2. Strukturvalidering av hela databasen, används vid inläsning och import.
 * Båda delar samma regler för obligatoriska fält och längdgränser.
 */
import {
  EPISTEMIC,
  INVESTIGATION_STATUS,
  LIMITS,
  NOTE_TYPES,
  RELATION_TYPES,
  SOURCE_TYPES,
  TOPICS,
} from "./constants";
import type { CodexData } from "./db/schema";
import { isValidHttpUrl } from "./utils";

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

function requiredText(value: string, label: string, max: number = LIMITS.title): string | undefined {
  const v = value.trim();
  if (!v) return `${label} behöver fyllas i.`;
  if (v.length > max) return `${label} får vara högst ${max} tecken.`;
  return undefined;
}

function optionalText(value: string | undefined, label: string, max: number): string | undefined {
  if (value && value.length > max) return `${label} får vara högst ${max} tecken.`;
  return undefined;
}

function clean<K extends string>(errors: Record<K, string | undefined>): FieldErrors<K> {
  const out: FieldErrors<K> = {};
  for (const key of Object.keys(errors) as K[]) {
    if (errors[key]) out[key] = errors[key];
  }
  return out;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export interface ArchiveFormInput {
  title: string;
  content: string;
  author: string;
  url: string;
  comment: string;
  publication: string;
  year: string;
}

export function validateArchiveInput(input: ArchiveFormInput): FieldErrors<keyof ArchiveFormInput> {
  const url = input.url.trim();
  return clean({
    title: requiredText(input.title, "Titel"),
    content: optionalText(input.content, "Innehållet", LIMITS.long),
    author: optionalText(input.author, "Upphovsperson", LIMITS.short),
    url:
      url && !isValidHttpUrl(url)
        ? "Ange en fullständig adress som börjar med https:// eller http://."
        : optionalText(url, "Adressen", LIMITS.url),
    comment: optionalText(input.comment, "Kommentaren", LIMITS.long),
    publication: optionalText(input.publication, "Publiceringsuppgiften", LIMITS.short),
    year: optionalText(input.year, "Årtalet", 40),
  });
}

export interface SymbolFormInput {
  name: string;
  description: string;
  historicalContext: string;
  personalInterpretation: string;
  glyphCharacter: string;
  glyphKind: "builtin" | "character";
}

export function validateSymbolInput(input: SymbolFormInput): FieldErrors<keyof SymbolFormInput> {
  return clean({
    name: requiredText(input.name, "Namn"),
    description: optionalText(input.description, "Beskrivningen", LIMITS.long),
    historicalContext: optionalText(input.historicalContext, "Historiskt sammanhang", LIMITS.long),
    personalInterpretation: optionalText(input.personalInterpretation, "Personlig tolkning", LIMITS.long),
    glyphCharacter:
      input.glyphKind === "character" && [...input.glyphCharacter.trim()].length === 0
        ? "Skriv ett tecken, t.ex. ☉ eller ☿."
        : input.glyphKind === "character" && [...input.glyphCharacter.trim()].length > 3
          ? "Använd högst tre tecken."
          : undefined,
    glyphKind: undefined,
  });
}

export function validateTitleOnly(title: string, label = "Titel"): FieldErrors<"title"> {
  return clean({ title: requiredText(title, label) });
}

/* ------------------------------------------------------------------ */
/* Strukturvalidering                                                  */
/* ------------------------------------------------------------------ */

type Check = (value: unknown, path: string, errors: string[]) => void;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str =
  (opts: { optional?: boolean; nonEmpty?: boolean; max?: number } = {}): Check =>
  (v, path, errors) => {
    if (v === undefined && opts.optional) return;
    if (typeof v !== "string") return void errors.push(`${path}: förväntade text.`);
    if (opts.nonEmpty && !v.trim()) errors.push(`${path}: får inte vara tomt.`);
    if (opts.max && v.length > opts.max) errors.push(`${path}: är längre än ${opts.max} tecken.`);
  };

const isoDate =
  (optional = false): Check =>
  (v, path, errors) => {
    if (v === undefined && optional) return;
    if (typeof v !== "string" || Number.isNaN(Date.parse(v)))
      errors.push(`${path}: förväntade ett giltigt datum.`);
  };

const bool =
  (optional = false): Check =>
  (v, path, errors) => {
    if (v === undefined && optional) return;
    if (typeof v !== "boolean") errors.push(`${path}: förväntade sant/falskt.`);
  };

const oneOf =
  (values: readonly string[], optional = false): Check =>
  (v, path, errors) => {
    if (v === undefined && optional) return;
    if (typeof v !== "string" || !values.includes(v))
      errors.push(`${path}: okänt värde ${JSON.stringify(v)}.`);
  };

const arr =
  (item: Check): Check =>
  (v, path, errors) => {
    if (!Array.isArray(v)) return void errors.push(`${path}: förväntade en lista.`);
    v.forEach((x, i) => item(x, `${path}[${i}]`, errors));
  };

const obj =
  (shape: Record<string, Check>): Check =>
  (v, path, errors) => {
    if (!isObj(v)) return void errors.push(`${path}: förväntade ett objekt.`);
    for (const [key, check] of Object.entries(shape)) check(v[key], `${path}.${key}`, errors);
  };

const base = {
  id: str({ nonEmpty: true, max: 100 }),
  createdAt: isoDate(),
  updatedAt: isoDate(),
  isExample: bool(true),
};

const topicIds = TOPICS.map((t) => t.id);
const archive = {
  ...base,
  title: str({ nonEmpty: true, max: LIMITS.title }),
  content: str({ max: LIMITS.long }),
  author: str({ optional: true, max: LIMITS.short }),
  url: str({ optional: true, max: LIMITS.url }),
  topics: arr(oneOf(topicIds)),
  tagIds: arr(str({ nonEmpty: true })),
  comment: str({ optional: true, max: LIMITS.long }),
  epistemic: oneOf(
    EPISTEMIC.map((e) => e.id),
    true,
  ),
};

const nodeRef = obj({
  kind: oneOf(["source", "note", "symbol", "concept"]),
  id: str({ nonEmpty: true }),
});

const glyph: Check = (v, path, errors) => {
  if (!isObj(v)) return void errors.push(`${path}: förväntade ett objekt.`);
  if (v.kind === "builtin") str({ nonEmpty: true })(v.name, `${path}.name`, errors);
  else if (v.kind === "character") str({ nonEmpty: true, max: 12 })(v.value, `${path}.value`, errors);
  else errors.push(`${path}.kind: okänt värde.`);
};

const COLLECTION_SCHEMAS: Record<keyof CodexData, Check> = {
  sources: arr(
    obj({
      ...archive,
      entity: oneOf(["source"]),
      type: oneOf(SOURCE_TYPES),
      publication: str({ optional: true, max: LIMITS.short }),
      year: str({ optional: true, max: 40 }),
    }),
  ),
  notes: arr(
    obj({
      ...archive,
      entity: oneOf(["note"]),
      type: oneOf(NOTE_TYPES),
      sourceId: str({ optional: true }),
      status: oneOf(["oppen", "besvarad"], true),
    }),
  ),
  symbols: arr(
    obj({
      ...base,
      name: str({ nonEmpty: true, max: LIMITS.title }),
      glyph,
      description: str({ max: LIMITS.long }),
      historicalContext: str({ max: LIMITS.long }),
      traditions: arr(
        obj({
          id: str({ nonEmpty: true }),
          tradition: str({ max: LIMITS.short }),
          interpretation: str({ max: LIMITS.long }),
        }),
      ),
      personalInterpretation: str({ max: LIMITS.long }),
      relatedConcepts: arr(str({ max: LIMITS.short })),
      references: arr(str({ max: LIMITS.long })),
      tagIds: arr(str({ nonEmpty: true })),
    }),
  ),
  concepts: arr(
    obj({
      ...base,
      name: str({ nonEmpty: true, max: LIMITS.title }),
      description: str({ max: LIMITS.long }),
      topics: arr(oneOf(topicIds)),
      tagIds: arr(str({ nonEmpty: true })),
    }),
  ),
  relations: arr(
    obj({
      ...base,
      from: nodeRef,
      to: nodeRef,
      type: oneOf(RELATION_TYPES.map((r) => r.id)),
      note: str({ optional: true, max: LIMITS.long }),
    }),
  ),
  tags: arr(obj({ ...base, name: str({ nonEmpty: true, max: LIMITS.tag }) })),
  goals: arr(
    obj({
      ...base,
      title: str({ nonEmpty: true, max: LIMITS.title }),
      description: str({ max: LIMITS.long }),
      status: oneOf(["aktiv", "klar"]),
      completedAt: isoDate(true),
      milestones: arr(
        obj({
          id: str({ nonEmpty: true }),
          title: str({ nonEmpty: true, max: LIMITS.title }),
          done: bool(),
          doneAt: isoDate(true),
        }),
      ),
      topics: arr(oneOf(topicIds)),
    }),
  ),
  journal: arr(
    obj({
      ...base,
      title: str({ max: LIMITS.title }),
      body: str({ nonEmpty: true, max: LIMITS.long }),
      entryDate: isoDate(),
      tagIds: arr(str({ nonEmpty: true })),
    }),
  ),
  investigations: arr(
    obj({
      ...base,
      title: str({ nonEmpty: true, max: LIMITS.title }),
      note: str({ max: LIMITS.long }),
      status: oneOf(INVESTIGATION_STATUS.map((s) => s.id)),
      exploreSlug: str({ optional: true }),
    }),
  ),
};

const recentVisit = obj({ ref: nodeRef, at: isoDate() });
const activityEvent = obj({
  id: str({ nonEmpty: true }),
  at: isoDate(),
  action: oneOf(["skapade", "uppdaterade", "raderade", "slutforde", "importerade"]),
  kind: str({ nonEmpty: true }),
  entityId: str({ optional: true }),
  title: str(),
});

export const MAX_REPORTED_ERRORS = 12;

/** Validerar datadelen och metadata. Returnerar en lista med begripliga fel. */
export function validateDataShape(data: unknown, meta: unknown): string[] {
  const errors: string[] = [];
  if (!isObj(data)) return ["data: saknas eller är inte ett objekt."];
  for (const key of Object.keys(COLLECTION_SCHEMAS) as (keyof CodexData)[]) {
    COLLECTION_SCHEMAS[key](data[key], `data.${key}`, errors);
  }
  if (meta !== undefined) {
    obj({ recent: arr(recentVisit), activity: arr(activityEvent), examplesInitialized: bool(true) })(
      meta,
      "meta",
      errors,
    );
  }
  if (errors.length === 0) {
    // Dubblett-ID inom samma samling gör att poster skriver över varandra.
    for (const key of Object.keys(COLLECTION_SCHEMAS) as (keyof CodexData)[]) {
      const seen = new Set<string>();
      for (const item of data[key] as { id: string }[]) {
        if (seen.has(item.id)) errors.push(`data.${key}: ID ${item.id} förekommer flera gånger.`);
        seen.add(item.id);
      }
    }
  }
  return errors;
}
