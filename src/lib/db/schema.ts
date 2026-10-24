import type {
  ActivityEvent,
  Concept,
  InvestigationTopic,
  JournalEntry,
  KnowledgeRelation,
  LearningGoal,
  Note,
  RecentVisit,
  Source,
  SymbolEntry,
  Tag,
} from "../types";

export const APP_ID = "living-cosmos-codex";
export const EXPORT_FORMAT = "living-cosmos-codex-export";
/** Höj och lägg till en migrering i migrations.ts när datamodellen ändras. */
export const SCHEMA_VERSION = 1;

export interface CodexData {
  sources: Source[];
  notes: Note[];
  symbols: SymbolEntry[];
  concepts: Concept[];
  relations: KnowledgeRelation[];
  tags: Tag[];
  goals: LearningGoal[];
  journal: JournalEntry[];
  investigations: InvestigationTopic[];
}

export type CollectionKey = keyof CodexData;

export const COLLECTION_KEYS: CollectionKey[] = [
  "sources",
  "notes",
  "symbols",
  "concepts",
  "relations",
  "tags",
  "goals",
  "journal",
  "investigations",
];

export const COLLECTION_LABEL: Record<CollectionKey, string> = {
  sources: "källor",
  notes: "anteckningar",
  symbols: "symboler",
  concepts: "begrepp",
  relations: "relationer",
  tags: "taggar",
  goals: "lärandemål",
  journal: "journalanteckningar",
  investigations: "undersökningar",
};

export interface CodexMeta {
  recent: RecentVisit[];
  activity: ActivityEvent[];
  /** Sant när exempelmaterial har lagts in första gången (eller användaren valt bort det). */
  examplesInitialized: boolean;
}

export interface CodexDatabase {
  app: typeof APP_ID;
  schemaVersion: number;
  data: CodexData;
  meta: CodexMeta;
}

export interface CodexExport extends Omit<CodexDatabase, "app"> {
  format: typeof EXPORT_FORMAT;
  exportedAt: string;
}

export function emptyData(): CodexData {
  return {
    sources: [],
    notes: [],
    symbols: [],
    concepts: [],
    relations: [],
    tags: [],
    goals: [],
    journal: [],
    investigations: [],
  };
}

export function emptyDatabase(): CodexDatabase {
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    data: emptyData(),
    meta: { recent: [], activity: [], examplesInitialized: false },
  };
}
