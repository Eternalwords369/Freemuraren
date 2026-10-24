import { validateDataShape, MAX_REPORTED_ERRORS } from "../validation";
import {
  APP_ID,
  EXPORT_FORMAT,
  SCHEMA_VERSION,
  emptyData,
  type CodexDatabase,
  type CodexExport,
} from "./schema";

type RawDoc = Record<string, unknown>;
type Migration = (doc: RawDoc) => RawDoc;

/**
 * Migreringar indexeras på den version de migrerar *från*.
 * När SCHEMA_VERSION höjs till N läggs en funktion till under nyckeln N - 1.
 */
const MIGRATIONS: Record<number, Migration> = {
  // v0 (förhandsversion): saknade meta och samlingen "investigations".
  0: (doc) => {
    const data = isObj(doc.data) ? doc.data : {};
    return {
      ...doc,
      schemaVersion: 1,
      data: { ...emptyData(), ...data },
      meta: isObj(doc.meta)
        ? doc.meta
        : { recent: [], activity: [], examplesInitialized: true },
    };
  },
};

function isObj(v: unknown): v is RawDoc {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export type ParseResult =
  | { ok: true; db: CodexDatabase; migratedFrom?: number }
  | { ok: false; errors: string[] };

export function migrate(doc: RawDoc, fromVersion: number): RawDoc {
  let current = doc;
  for (let v = fromVersion; v < SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`Det saknas en migrering från version ${v}.`);
    current = step(current);
  }
  return current;
}

/**
 * Tolkar sparad data eller en exportfil. Kontrollerar format och version,
 * migrerar äldre versioner och validerar varje post.
 */
export function parseDatabase(raw: unknown): ParseResult {
  if (!isObj(raw)) return { ok: false, errors: ["Filen innehåller inte ett giltigt JSON-objekt."] };

  const isStored = raw.app === APP_ID;
  const isExport = raw.format === EXPORT_FORMAT;
  if (!isStored && !isExport) {
    return {
      ok: false,
      errors: ["Filen kommer inte från THE LIVING COSMOS. Använd en fil som exporterats från Inställningar."],
    };
  }

  const version = raw.schemaVersion;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 0) {
    return { ok: false, errors: ["Filen saknar en giltig schemaversion."] };
  }
  if (version > SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [
        `Filen har schemaversion ${version}, men appen förstår högst version ${SCHEMA_VERSION}. Uppdatera appen först.`,
      ],
    };
  }

  let doc: RawDoc;
  try {
    doc = migrate(raw, version);
  } catch (e) {
    return { ok: false, errors: [e instanceof Error ? e.message : "Migreringen misslyckades."] };
  }

  const errors = validateDataShape(doc.data, doc.meta);
  if (errors.length > 0) {
    const shown = errors.slice(0, MAX_REPORTED_ERRORS);
    if (errors.length > shown.length) shown.push(`…och ${errors.length - shown.length} fel till.`);
    return { ok: false, errors: shown };
  }

  const meta = isObj(doc.meta) ? doc.meta : {};
  const db: CodexDatabase = {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    data: doc.data as CodexDatabase["data"],
    meta: {
      recent: (meta.recent as CodexDatabase["meta"]["recent"]) ?? [],
      activity: (meta.activity as CodexDatabase["meta"]["activity"]) ?? [],
      examplesInitialized: (meta.examplesInitialized as boolean | undefined) ?? true,
    },
  };
  return { ok: true, db, migratedFrom: version < SCHEMA_VERSION ? version : undefined };
}

export function toExport(db: CodexDatabase): CodexExport {
  return {
    format: EXPORT_FORMAT,
    exportedAt: new Date().toISOString(),
    schemaVersion: db.schemaVersion,
    data: db.data,
    meta: db.meta,
  };
}
