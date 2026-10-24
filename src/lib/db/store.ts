/**
 * CodexStore – appens datalager.
 *
 * - Håller hela databasen i minnet som ett oföränderligt objekt.
 * - Varje ändring går genom commit(), som sparar via en StorageAdapter.
 *   Misslyckas sparningen återställs minnet så att gränssnittet aldrig visar
 *   data som inte överlever en omladdning.
 * - Varje datatyp har ett eget litet repository med getAll, getById, create,
 *   update, delete och search, anpassat efter typens fält.
 */
import { LIMITS } from "../constants";
import type {
  ActivityAction,
  ActivityEvent,
  Concept,
  EntityKind,
  ID,
  InvestigationTopic,
  JournalEntry,
  KnowledgeRelation,
  LearningGoal,
  Milestone,
  NodeRef,
  Note,
  Source,
  SymbolEntry,
  Tag,
} from "../types";
import { compareSv, createId, matchScore, normalizeText, nowIso } from "../utils";
import { BACKUP_KEY, LocalStorageAdapter, type StorageAdapter } from "./adapter";
import { buildExampleData } from "./examples";
import { parseDatabase, toExport } from "./migrations";
import {
  COLLECTION_KEYS,
  emptyDatabase,
  type CodexData,
  type CodexDatabase,
  type CollectionKey,
} from "./schema";

export type StoreStatus = "loading" | "ready" | "error";

export interface StoreState {
  status: StoreStatus;
  db: CodexDatabase;
  /** Fel vid inläsning (t.ex. skadad data). */
  loadErrors?: string[];
  /** Senaste misslyckade sparning. */
  saveError?: string;
}

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };

type Stamp = "id" | "createdAt" | "updatedAt" | "isExample";

/** Indata för arkivposter. Taggar anges som namn och kopplas till Tag-poster i samma ändring. */
export type SourceInput = Omit<Source, Stamp | "entity" | "tagIds"> & { tags: string[] };
export type NoteInput = Omit<Note, Stamp | "entity" | "tagIds"> & { tags: string[] };
export type SymbolInput = Omit<SymbolEntry, Stamp | "tagIds"> & { tags: string[] };
export type ConceptInput = Omit<Concept, Stamp | "tagIds"> & { tags: string[] };
export type RelationInput = Omit<KnowledgeRelation, Stamp>;
export type GoalInput = Omit<LearningGoal, Stamp | "completedAt">;
export type JournalInput = Omit<JournalEntry, Stamp | "tagIds"> & { tags: string[] };
export type InvestigationInput = Omit<InvestigationTopic, Stamp>;

type Item<K extends CollectionKey> = CodexData[K][number];

const MAX_RECENT = 12;
const MAX_ACTIVITY = 100;

const KIND_BY_COLLECTION: Record<CollectionKey, EntityKind> = {
  sources: "source",
  notes: "note",
  symbols: "symbol",
  concepts: "concept",
  relations: "relation",
  tags: "tag",
  goals: "goal",
  journal: "journal",
  investigations: "investigation",
};

const PREFIX: Record<CollectionKey, string> = {
  sources: "src",
  notes: "note",
  symbols: "sym",
  concepts: "con",
  relations: "rel",
  tags: "tag",
  goals: "goal",
  journal: "jrn",
  investigations: "inv",
};

/**
 * Trimmar text och tar bort tomma värden för fält som är valfria i modellen.
 * Obligatoriska textfält behålls även när de är tomma.
 */
function tidy<T extends object>(input: T, optionalKeys: ReadonlySet<string> = OPTIONAL_STRING_KEYS): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      const v = value.trim();
      if (v || !optionalKeys.has(key)) out[key] = v;
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}

/** Valfria textfält i arkivposter och undersökningar. */
const OPTIONAL_STRING_KEYS: ReadonlySet<string> = new Set([
  "author",
  "url",
  "comment",
  "publication",
  "year",
  "sourceId",
  "exploreSlug",
]);
/** I relationer är kommentaren valfri (i undersökningar är "note" obligatorisk). */
const RELATION_OPTIONAL_KEYS: ReadonlySet<string> = new Set(["note"]);

function titleOf(item: unknown): string {
  const o = item as { title?: string; name?: string };
  return o.title || o.name || "Namnlös post";
}

function sameRef(a: NodeRef, b: NodeRef): boolean {
  return a.kind === b.kind && a.id === b.id;
}

export function normalizeTagName(name: string): string {
  return name.trim().replace(/^#/, "").replace(/\s+/g, " ").toLocaleLowerCase("sv-SE").slice(0, LIMITS.tag);
}

export class CodexStore {
  private state: StoreState = { status: "loading", db: emptyDatabase() };
  private listeners = new Set<() => void>();

  constructor(private readonly adapter: StorageAdapter) {}

  /* --------------------------- Livscykel ---------------------------- */

  init(): void {
    if (this.state.status !== "loading") return;
    this.state = this.readFromAdapter();
  }

  /** Läser in på nytt, t.ex. när en annan flik har ändrat datan. */
  reload(): void {
    this.state = this.readFromAdapter();
    this.emit();
  }

  private readFromAdapter(): StoreState {
    let raw: string | null;
    try {
      raw = this.adapter.read();
    } catch {
      return {
        status: "error",
        db: emptyDatabase(),
        loadErrors: ["Webbläsaren tillåter inte läsning av lokal lagring. Kontrollera sekretessinställningarna."],
      };
    }

    if (raw === null) {
      // Första besöket: lägg in märkt exempelmaterial en gång.
      const db = emptyDatabase();
      db.data = buildExampleData(nowIso());
      db.meta.examplesInitialized = true;
      const state: StoreState = { status: "ready", db };
      try {
        this.adapter.write(JSON.stringify(db));
      } catch {
        state.saveError = "Exempelmaterialet kunde inte sparas lokalt.";
      }
      return state;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.backup(raw);
      return { status: "error", db: emptyDatabase(), loadErrors: ["Den sparade datan är inte giltig JSON."] };
    }

    const result = parseDatabase(parsed);
    if (!result.ok) {
      this.backup(raw);
      return { status: "error", db: emptyDatabase(), loadErrors: result.errors };
    }
    if (result.migratedFrom !== undefined) {
      try {
        this.adapter.write(JSON.stringify(result.db));
      } catch {
        // Migreringen görs om vid nästa inläsning.
      }
    }
    return { status: "ready", db: { ...result.db, data: pruneDangling(result.db.data) } };
  }

  private backup(raw: string) {
    if (this.adapter instanceof LocalStorageAdapter) this.adapter.backupRaw(raw);
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): StoreState => {
    if (this.state.status === "loading" && typeof window !== "undefined") this.init();
    return this.state;
  };

  private emit() {
    for (const l of this.listeners) l();
  }

  private get data(): CodexData {
    return this.state.db.data;
  }

  /**
   * Utför en ändring och sparar. Vid fel återställs tillståndet.
   */
  private commit(
    mutate: (db: CodexDatabase) => CodexDatabase,
    activity?: Omit<ActivityEvent, "id" | "at">,
  ): Result {
    if (this.state.status !== "ready") {
      return { ok: false, error: "Datan är inte inläst. Ladda om sidan eller se Inställningar." };
    }
    const previous = this.state;
    let next = mutate(previous.db);
    if (activity) {
      const event: ActivityEvent = { id: createId("act"), at: nowIso(), ...activity };
      next = { ...next, meta: { ...next.meta, activity: [event, ...next.meta.activity].slice(0, MAX_ACTIVITY) } };
    }
    try {
      this.adapter.write(JSON.stringify(next));
    } catch (e) {
      const quota = e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22);
      const error = quota
        ? "Lagringsutrymmet i webbläsaren är fullt. Exportera och rensa äldre material för att frigöra plats."
        : "Ändringen kunde inte sparas i webbläsarens lagring.";
      this.state = { ...previous, saveError: error };
      this.emit();
      return { ok: false, error };
    }
    this.state = { status: "ready", db: next };
    this.emit();
    return { ok: true, value: undefined };
  }

  private setCollection<K extends CollectionKey>(db: CodexDatabase, key: K, items: CodexData[K]): CodexDatabase {
    return { ...db, data: { ...db.data, [key]: items } };
  }

  /* ---------------------- Generiska hjälpare ------------------------ */

  private insert<K extends CollectionKey>(
    key: K,
    build: (db: CodexDatabase) => { db: CodexDatabase; item: Item<K> },
  ): Result<Item<K>> {
    const out = build(this.state.db);
    const res = this.commit(
      () => this.setCollection(out.db, key, [out.item, ...(out.db.data[key] as Item<K>[])] as CodexData[K]),
      { action: "skapade", kind: KIND_BY_COLLECTION[key], entityId: out.item.id, title: titleOf(out.item) },
    );
    return res.ok ? { ok: true, value: out.item } : res;
  }

  private patch<K extends CollectionKey>(
    key: K,
    id: ID,
    build: (db: CodexDatabase, current: Item<K>) => { db: CodexDatabase; item: Item<K> },
    action: ActivityAction = "uppdaterade",
  ): Result<Item<K>> {
    const current = (this.data[key] as Item<K>[]).find((x) => x.id === id);
    if (!current) return { ok: false, error: "Posten finns inte längre. Den kan ha raderats i en annan flik." };
    const out = build(this.state.db, current);
    const res = this.commit(
      () => {
        const list = (out.db.data[key] as Item<K>[]).map((x) => (x.id === id ? out.item : x));
        return this.setCollection(out.db, key, list as CodexData[K]);
      },
      { action, kind: KIND_BY_COLLECTION[key], entityId: id, title: titleOf(out.item) },
    );
    return res.ok ? { ok: true, value: out.item } : res;
  }

  /** Tar bort en nod och allt som pekar på den (relationer, senaste besök, källkopplingar). */
  private removeNode(db: CodexDatabase, ref: NodeRef): CodexDatabase {
    const data = { ...db.data };
    data.relations = data.relations.filter((r) => !sameRef(r.from, ref) && !sameRef(r.to, ref));
    if (ref.kind === "source") {
      data.notes = data.notes.map((n) => (n.sourceId === ref.id ? { ...n, sourceId: undefined } : n));
    }
    return {
      ...db,
      data,
      meta: { ...db.meta, recent: db.meta.recent.filter((v) => !sameRef(v.ref, ref)) },
    };
  }

  private remove<K extends CollectionKey>(key: K, id: ID, ref?: NodeRef): Result {
    const current = (this.data[key] as Item<K>[]).find((x) => x.id === id);
    if (!current) return { ok: false, error: "Posten finns inte längre." };
    return this.commit(
      (db) => {
        const base = ref ? this.removeNode(db, ref) : db;
        return this.setCollection(base, key, (base.data[key] as Item<K>[]).filter((x) => x.id !== id) as CodexData[K]);
      },
      { action: "raderade", kind: KIND_BY_COLLECTION[key], entityId: id, title: titleOf(current) },
    );
  }

  /** Kopplar taggnamn till befintliga eller nya Tag-poster inom samma ändring. */
  private resolveTags(db: CodexDatabase, names: string[]): { db: CodexDatabase; tagIds: ID[] } {
    const tags = [...db.data.tags];
    const ids: ID[] = [];
    const now = nowIso();
    for (const raw of names) {
      const name = normalizeTagName(raw);
      if (!name) continue;
      let tag = tags.find((t) => t.name === name);
      if (!tag) {
        tag = { id: createId("tag"), name, createdAt: now, updatedAt: now };
        tags.push(tag);
      }
      if (!ids.includes(tag.id)) ids.push(tag.id);
    }
    return { db: this.setCollection(db, "tags", tags), tagIds: ids };
  }

  private newStamp(key: CollectionKey) {
    const now = nowIso();
    return { id: createId(PREFIX[key]), createdAt: now, updatedAt: now };
  }

  /* ------------------------- Repositories --------------------------- */

  readonly sources = {
    getAll: (): Source[] => this.data.sources,
    getById: (id: ID): Source | undefined => this.data.sources.find((s) => s.id === id),
    create: ({ tags, ...input }: SourceInput): Result<Source> =>
      this.insert("sources", (db) => {
        const t = this.resolveTags(db, tags);
        return { db: t.db, item: tidy({ ...input, entity: "source" as const, tagIds: t.tagIds, ...this.newStamp("sources") }) };
      }),
    update: (id: ID, { tags, ...input }: SourceInput): Result<Source> =>
      this.patch("sources", id, (db, cur) => {
        const t = this.resolveTags(db, tags);
        return {
          db: t.db,
          item: tidy({ ...input, entity: "source" as const, id, createdAt: cur.createdAt, updatedAt: nowIso(), tagIds: t.tagIds }),
        };
      }),
    delete: (id: ID): Result => this.remove("sources", id, { kind: "source", id }),
    search: (q: string): Source[] =>
      this.data.sources.filter((s) => matchScore(q, s.title, s.author, s.content, s.comment, s.publication) > 0),
  };

  readonly notes = {
    getAll: (): Note[] => this.data.notes,
    getById: (id: ID): Note | undefined => this.data.notes.find((n) => n.id === id),
    create: ({ tags, ...input }: NoteInput): Result<Note> =>
      this.insert("notes", (db) => {
        const t = this.resolveTags(db, tags);
        return { db: t.db, item: tidy({ ...input, entity: "note" as const, tagIds: t.tagIds, ...this.newStamp("notes") }) };
      }),
    update: (id: ID, { tags, ...input }: NoteInput): Result<Note> =>
      this.patch("notes", id, (db, cur) => {
        const t = this.resolveTags(db, tags);
        return {
          db: t.db,
          item: tidy({ ...input, entity: "note" as const, id, createdAt: cur.createdAt, updatedAt: nowIso(), tagIds: t.tagIds }),
        };
      }),
    setStatus: (id: ID, status: Note["status"]): Result<Note> =>
      this.patch("notes", id, (db, cur) => ({ db, item: { ...cur, status, updatedAt: nowIso() } })),
    delete: (id: ID): Result => this.remove("notes", id, { kind: "note", id }),
    search: (q: string): Note[] =>
      this.data.notes.filter((n) => matchScore(q, n.title, n.author, n.content, n.comment) > 0),
    openQuestions: (): Note[] =>
      this.data.notes.filter((n) => (n.type === "fragestallning" || n.type === "hypotes") && n.status !== "besvarad"),
  };

  readonly symbols = {
    getAll: (): SymbolEntry[] => this.data.symbols,
    getById: (id: ID): SymbolEntry | undefined => this.data.symbols.find((s) => s.id === id),
    create: ({ tags, ...input }: SymbolInput): Result<SymbolEntry> =>
      this.insert("symbols", (db) => {
        const t = this.resolveTags(db, tags);
        return { db: t.db, item: tidy({ ...input, tagIds: t.tagIds, ...this.newStamp("symbols") }) };
      }),
    update: (id: ID, { tags, ...input }: SymbolInput): Result<SymbolEntry> =>
      this.patch("symbols", id, (db, cur) => {
        const t = this.resolveTags(db, tags);
        return { db: t.db, item: tidy({ ...input, id, createdAt: cur.createdAt, updatedAt: nowIso(), tagIds: t.tagIds }) };
      }),
    delete: (id: ID): Result => this.remove("symbols", id, { kind: "symbol", id }),
    search: (q: string): SymbolEntry[] =>
      this.data.symbols.filter(
        (s) =>
          matchScore(
            q,
            s.name,
            s.description,
            s.historicalContext,
            s.personalInterpretation,
            s.relatedConcepts.join(" "),
            s.traditions.map((t) => `${t.tradition} ${t.interpretation}`).join(" "),
          ) > 0,
      ),
  };

  readonly concepts = {
    getAll: (): Concept[] => this.data.concepts,
    getById: (id: ID): Concept | undefined => this.data.concepts.find((c) => c.id === id),
    create: ({ tags, ...input }: ConceptInput): Result<Concept> =>
      this.insert("concepts", (db) => {
        const t = this.resolveTags(db, tags);
        return { db: t.db, item: tidy({ ...input, tagIds: t.tagIds, ...this.newStamp("concepts") }) };
      }),
    update: (id: ID, { tags, ...input }: ConceptInput): Result<Concept> =>
      this.patch("concepts", id, (db, cur) => {
        const t = this.resolveTags(db, tags);
        return { db: t.db, item: tidy({ ...input, id, createdAt: cur.createdAt, updatedAt: nowIso(), tagIds: t.tagIds }) };
      }),
    delete: (id: ID): Result => this.remove("concepts", id, { kind: "concept", id }),
    search: (q: string): Concept[] => this.data.concepts.filter((c) => matchScore(q, c.name, c.description) > 0),
  };

  readonly relations = {
    getAll: (): KnowledgeRelation[] => this.data.relations,
    getById: (id: ID): KnowledgeRelation | undefined => this.data.relations.find((r) => r.id === id),
    forNode: (ref: NodeRef): KnowledgeRelation[] =>
      this.data.relations.filter((r) => sameRef(r.from, ref) || sameRef(r.to, ref)),
    create: (input: RelationInput): Result<KnowledgeRelation> => {
      if (sameRef(input.from, input.to)) return { ok: false, error: "En post kan inte kopplas till sig själv." };
      if (!this.nodeExists(input.from) || !this.nodeExists(input.to))
        return { ok: false, error: "En av posterna finns inte längre." };
      const duplicate = this.data.relations.some(
        (r) => r.type === input.type && sameRef(r.from, input.from) && sameRef(r.to, input.to),
      );
      if (duplicate) return { ok: false, error: "Den relationen finns redan." };
      return this.insert("relations", (db) => ({ db, item: tidy({ ...input, ...this.newStamp("relations") }, RELATION_OPTIONAL_KEYS) }));
    },
    update: (id: ID, input: Pick<KnowledgeRelation, "type" | "note">): Result<KnowledgeRelation> =>
      this.patch("relations", id, (db, cur) => ({
        db,
        item: tidy({ ...cur, ...input, updatedAt: nowIso() }, RELATION_OPTIONAL_KEYS),
      })),
    delete: (id: ID): Result => this.remove("relations", id),
    search: (q: string): KnowledgeRelation[] =>
      this.data.relations.filter((r) => matchScore(q, r.note ?? "") > 0),
  };

  readonly tags = {
    getAll: (): Tag[] => [...this.data.tags].sort((a, b) => compareSv(a.name, b.name)),
    getById: (id: ID): Tag | undefined => this.data.tags.find((t) => t.id === id),
    namesFor: (ids: ID[]): string[] =>
      ids.map((id) => this.data.tags.find((t) => t.id === id)?.name).filter((n): n is string => Boolean(n)),
    /** Antal poster som använder varje tagg. */
    usage: (): Map<ID, number> => {
      const counts = new Map<ID, number>();
      const all = [
        ...this.data.sources,
        ...this.data.notes,
        ...this.data.symbols,
        ...this.data.concepts,
        ...this.data.journal,
      ];
      for (const item of all) for (const id of item.tagIds) counts.set(id, (counts.get(id) ?? 0) + 1);
      return counts;
    },
    rename: (id: ID, name: string): Result<Tag> => {
      const clean = normalizeTagName(name);
      if (!clean) return { ok: false, error: "Taggen behöver ett namn." };
      if (this.data.tags.some((t) => t.name === clean && t.id !== id))
        return { ok: false, error: `Taggen ”${clean}” finns redan.` };
      return this.patch("tags", id, (db, cur) => ({ db, item: { ...cur, name: clean, updatedAt: nowIso() } }));
    },
    delete: (id: ID): Result => {
      const strip = <T extends { tagIds: ID[] }>(items: T[]) =>
        items.map((x) => (x.tagIds.includes(id) ? { ...x, tagIds: x.tagIds.filter((t) => t !== id) } : x));
      const tag = this.tags.getById(id);
      if (!tag) return { ok: false, error: "Taggen finns inte längre." };
      return this.commit(
        (db) => ({
          ...db,
          data: {
            ...db.data,
            tags: db.data.tags.filter((t) => t.id !== id),
            sources: strip(db.data.sources),
            notes: strip(db.data.notes),
            symbols: strip(db.data.symbols),
            concepts: strip(db.data.concepts),
            journal: strip(db.data.journal),
          },
        }),
        { action: "raderade", kind: "tag", entityId: id, title: tag.name },
      );
    },
    deleteUnused: (): Result<number> => {
      const usage = this.tags.usage();
      const unused = this.data.tags.filter((t) => !usage.has(t.id));
      if (unused.length === 0) return { ok: true, value: 0 };
      const res = this.commit((db) =>
        this.setCollection(db, "tags", db.data.tags.filter((t) => usage.has(t.id))),
      );
      return res.ok ? { ok: true, value: unused.length } : res;
    },
    search: (q: string): Tag[] => this.data.tags.filter((t) => matchScore(q, t.name) > 0),
  };

  readonly goals = {
    getAll: (): LearningGoal[] => this.data.goals,
    getById: (id: ID): LearningGoal | undefined => this.data.goals.find((g) => g.id === id),
    create: (input: GoalInput): Result<LearningGoal> =>
      this.insert("goals", (db) => ({ db, item: tidy({ ...input, ...this.newStamp("goals") }) })),
    update: (id: ID, input: Pick<LearningGoal, "title" | "description" | "topics">): Result<LearningGoal> =>
      this.patch("goals", id, (db, cur) => ({ db, item: tidy({ ...cur, ...input, updatedAt: nowIso() }) })),
    setDone: (id: ID, done: boolean): Result<LearningGoal> =>
      this.patch(
        "goals",
        id,
        (db, cur) => ({
          db,
          item: {
            ...cur,
            status: done ? "klar" : "aktiv",
            completedAt: done ? nowIso() : undefined,
            updatedAt: nowIso(),
          },
        }),
        done ? "slutforde" : "uppdaterade",
      ),
    addMilestone: (goalId: ID, title: string): Result<LearningGoal> => {
      const clean = title.trim();
      if (!clean) return { ok: false, error: "Milstolpen behöver en titel." };
      return this.patch("goals", goalId, (db, cur) => ({
        db,
        item: {
          ...cur,
          updatedAt: nowIso(),
          milestones: [...cur.milestones, { id: createId("ms"), title: clean.slice(0, LIMITS.title), done: false }],
        },
      }));
    },
    toggleMilestone: (goalId: ID, milestoneId: ID): Result<LearningGoal> =>
      this.patch("goals", goalId, (db, cur) => ({
        db,
        item: {
          ...cur,
          updatedAt: nowIso(),
          milestones: cur.milestones.map(
            (m): Milestone =>
              m.id === milestoneId ? { ...m, done: !m.done, doneAt: m.done ? undefined : nowIso() } : m,
          ),
        },
      })),
    removeMilestone: (goalId: ID, milestoneId: ID): Result<LearningGoal> =>
      this.patch("goals", goalId, (db, cur) => ({
        db,
        item: { ...cur, updatedAt: nowIso(), milestones: cur.milestones.filter((m) => m.id !== milestoneId) },
      })),
    delete: (id: ID): Result => this.remove("goals", id),
    search: (q: string): LearningGoal[] =>
      this.data.goals.filter((g) => matchScore(q, g.title, g.description, g.milestones.map((m) => m.title).join(" ")) > 0),
  };

  readonly journal = {
    getAll: (): JournalEntry[] =>
      [...this.data.journal].sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.createdAt.localeCompare(a.createdAt)),
    getById: (id: ID): JournalEntry | undefined => this.data.journal.find((j) => j.id === id),
    create: ({ tags, ...input }: JournalInput): Result<JournalEntry> =>
      this.insert("journal", (db) => {
        const t = this.resolveTags(db, tags);
        return { db: t.db, item: tidy({ ...input, tagIds: t.tagIds, ...this.newStamp("journal") }) };
      }),
    update: (id: ID, { tags, ...input }: JournalInput): Result<JournalEntry> =>
      this.patch("journal", id, (db, cur) => {
        const t = this.resolveTags(db, tags);
        return { db: t.db, item: tidy({ ...input, id, createdAt: cur.createdAt, updatedAt: nowIso(), tagIds: t.tagIds }) };
      }),
    delete: (id: ID): Result => this.remove("journal", id),
    search: (q: string): JournalEntry[] => this.data.journal.filter((j) => matchScore(q, j.title, j.body) > 0),
  };

  readonly investigations = {
    getAll: (): InvestigationTopic[] => this.data.investigations,
    getById: (id: ID): InvestigationTopic | undefined => this.data.investigations.find((i) => i.id === id),
    findBySlug: (slug: string): InvestigationTopic | undefined =>
      this.data.investigations.find((i) => i.exploreSlug === slug),
    create: (input: InvestigationInput): Result<InvestigationTopic> =>
      this.insert("investigations", (db) => ({ db, item: tidy({ ...input, ...this.newStamp("investigations") }) })),
    update: (id: ID, input: Partial<InvestigationInput>): Result<InvestigationTopic> =>
      this.patch(
        "investigations",
        id,
        (db, cur) => ({ db, item: tidy({ ...cur, ...input, updatedAt: nowIso() }) }),
        input.status === "avslutad" ? "slutforde" : "uppdaterade",
      ),
    delete: (id: ID): Result => this.remove("investigations", id),
    search: (q: string): InvestigationTopic[] =>
      this.data.investigations.filter((i) => matchScore(q, i.title, i.note) > 0),
  };

  /* --------------------------- Noder -------------------------------- */

  nodeExists(ref: NodeRef): boolean {
    return Boolean(this.getNode(ref));
  }

  getNode(ref: NodeRef): Source | Note | SymbolEntry | Concept | undefined {
    switch (ref.kind) {
      case "source":
        return this.sources.getById(ref.id);
      case "note":
        return this.notes.getById(ref.id);
      case "symbol":
        return this.symbols.getById(ref.id);
      case "concept":
        return this.concepts.getById(ref.id);
    }
  }

  nodeTitle(ref: NodeRef): string {
    const node = this.getNode(ref);
    if (!node) return "Borttagen post";
    return "title" in node ? node.title : node.name;
  }

  /** Registrerar ett besök för "Fortsätt där du slutade". */
  touch(ref: NodeRef): void {
    if (this.state.status !== "ready" || !this.nodeExists(ref)) return;
    const recent = this.state.db.meta.recent;
    if (recent[0] && sameRef(recent[0].ref, ref)) return;
    this.commit((db) => ({
      ...db,
      meta: {
        ...db.meta,
        recent: [{ ref, at: nowIso() }, ...db.meta.recent.filter((v) => !sameRef(v.ref, ref))].slice(0, MAX_RECENT),
      },
    }));
  }

  /* ------------------------- Exempeldata ---------------------------- */

  readonly examples = {
    count: (): number => COLLECTION_KEYS.reduce((n, k) => n + (this.data[k] as { isExample?: boolean }[]).filter((x) => x.isExample).length, 0),
    /** Lägger tillbaka saknade exempelposter utan att röra användarens egna poster. */
    restore: (): Result<number> => {
      const examples = buildExampleData(nowIso());
      const data = { ...this.state.db.data } as Record<CollectionKey, { id: string }[]>;
      let added = 0;
      for (const key of COLLECTION_KEYS) {
        const existing = new Set(data[key].map((x) => x.id));
        const missing = (examples[key] as { id: string }[]).filter((x) => !existing.has(x.id));
        added += missing.length;
        data[key] = [...data[key], ...missing];
      }
      if (added === 0) return { ok: true, value: 0 };
      // Undvik dubbla taggnamn om användaren redan har en tagg med samma namn.
      const merged = pruneDangling(dedupeTags(data as unknown as CodexData));
      const res = this.commit(
        (db) => ({ ...db, data: merged, meta: { ...db.meta, examplesInitialized: true } }),
        { action: "importerade", kind: "data", title: `Exempelmaterial (${added} poster)` },
      );
      return res.ok ? { ok: true, value: added } : res;
    },
    /** Tar bort alla poster märkta som exempel. Redigerade exempel räknas som egna och behålls. */
    removeAll: (): Result<number> => {
      const removed = this.examples.count();
      const res = this.commit((db) => {
        let next = db;
        for (const key of ["sources", "notes", "symbols", "concepts"] as const) {
          for (const item of db.data[key]) {
            if (item.isExample) next = this.removeNode(next, { kind: KIND_BY_COLLECTION[key] as NodeRef["kind"], id: item.id });
          }
        }
        const data = { ...next.data } as Record<CollectionKey, { isExample?: boolean }[]>;
        for (const key of COLLECTION_KEYS) data[key] = data[key].filter((x) => !x.isExample);
        // Behåll exempeltaggar som används av egna poster.
        const used = new Set(
          [...next.data.sources, ...next.data.notes, ...next.data.symbols, ...next.data.concepts, ...next.data.journal]
            .filter((x) => !x.isExample)
            .flatMap((x) => x.tagIds),
        );
        data.tags = next.data.tags.filter((t) => !t.isExample || used.has(t.id));
        return { ...next, data: data as unknown as CodexData };
      });
      return res.ok ? { ok: true, value: removed } : res;
    },
  };

  /* ---------------------- Export och import ------------------------- */

  exportJson(): string {
    return JSON.stringify(toExport(this.state.db), null, 2);
  }

  replaceAll(incoming: CodexDatabase): Result {
    return this.commit(
      () => ({
        ...incoming,
        data: pruneDangling(incoming.data),
        meta: { ...incoming.meta, examplesInitialized: true },
      }),
      { action: "importerade", kind: "data", title: "Import som ersatte allt material" },
    );
  }

  mergeWith(incoming: CodexDatabase): Result<MergeSummary> {
    const { data, summary } = mergeData(this.state.db.data, incoming.data);
    const res = this.commit((db) => ({ ...db, data }), {
      action: "importerade",
      kind: "data",
      title: `Import som slogs samman (${summary.added} nya, ${summary.updated} uppdaterade)`,
    });
    return res.ok ? { ok: true, value: summary } : res;
  }

  /** Raderar allt innehåll. En tom struktur sparas så att exempel inte läggs in igen. */
  clearAll(): Result {
    try {
      this.adapter.clear();
      if (typeof window !== "undefined") window.localStorage.removeItem(BACKUP_KEY);
    } catch {
      /* fortsätt och skriv tom struktur */
    }
    const empty = emptyDatabase();
    empty.meta.examplesInitialized = true;
    try {
      this.adapter.write(JSON.stringify(empty));
    } catch {
      return { ok: false, error: "Lagringen kunde inte skrivas om." };
    }
    this.state = { status: "ready", db: empty };
    this.emit();
    return { ok: true, value: undefined };
  }

  /** Används när sparad data är oläsbar. Den gamla datan ligger kvar som säkerhetskopia. */
  resetAfterError(): Result {
    const empty = emptyDatabase();
    empty.meta.examplesInitialized = true;
    try {
      this.adapter.write(JSON.stringify(empty));
    } catch {
      return { ok: false, error: "Lagringen kunde inte skrivas om." };
    }
    this.state = { status: "ready", db: empty };
    this.emit();
    return { ok: true, value: undefined };
  }

  dismissSaveError(): void {
    if (!this.state.saveError) return;
    this.state = { ...this.state, saveError: undefined };
    this.emit();
  }

  storageSize(): number {
    try {
      return (this.adapter.read() ?? "").length * 2;
    } catch {
      return 0;
    }
  }
}

/* ------------------------- Sammanslagning --------------------------- */

export interface MergeSummary {
  added: number;
  updated: number;
  unchanged: number;
}

function dedupeTags(data: CodexData): CodexData {
  const byName = new Map<string, ID>();
  const remap = new Map<ID, ID>();
  const tags: Tag[] = [];
  for (const tag of data.tags) {
    const key = normalizeText(tag.name);
    const existing = byName.get(key);
    if (existing) remap.set(tag.id, existing);
    else {
      byName.set(key, tag.id);
      tags.push(tag);
    }
  }
  if (remap.size === 0) return data;
  const fix = <T extends { tagIds: ID[] }>(items: T[]) =>
    items.map((x) => ({ ...x, tagIds: [...new Set(x.tagIds.map((id) => remap.get(id) ?? id))] }));
  return {
    ...data,
    tags,
    sources: fix(data.sources),
    notes: fix(data.notes),
    symbols: fix(data.symbols),
    concepts: fix(data.concepts),
    journal: fix(data.journal),
  };
}

/**
 * Slår samman två datamängder. Poster med samma ID ersätts bara om den
 * inkommande versionen är senare uppdaterad. Taggar med samma namn slås ihop.
 */
export function mergeData(current: CodexData, incoming: CodexData): { data: CodexData; summary: MergeSummary } {
  const summary: MergeSummary = { added: 0, updated: 0, unchanged: 0 };
  const out = {} as Record<CollectionKey, { id: string; updatedAt: string }[]>;
  for (const key of COLLECTION_KEYS) {
    const map = new Map((current[key] as { id: string; updatedAt: string }[]).map((x) => [x.id, x]));
    for (const item of incoming[key] as { id: string; updatedAt: string }[]) {
      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
        summary.added++;
      } else if (item.updatedAt > existing.updatedAt) {
        map.set(item.id, item);
        summary.updated++;
      } else {
        summary.unchanged++;
      }
    }
    out[key] = [...map.values()];
  }
  return { data: pruneDangling(dedupeTags(out as unknown as CodexData)), summary };
}

/** Tar bort relationer och taggkopplingar som pekar på poster som inte finns. */
export function pruneDangling(data: CodexData): CodexData {
  const ids: Record<NodeRef["kind"], Set<ID>> = {
    source: new Set(data.sources.map((x) => x.id)),
    note: new Set(data.notes.map((x) => x.id)),
    symbol: new Set(data.symbols.map((x) => x.id)),
    concept: new Set(data.concepts.map((x) => x.id)),
  };
  const tagIds = new Set(data.tags.map((t) => t.id));
  const fixTags = <T extends { tagIds: ID[] }>(items: T[]) =>
    items.map((x) => (x.tagIds.every((t) => tagIds.has(t)) ? x : { ...x, tagIds: x.tagIds.filter((t) => tagIds.has(t)) }));
  return {
    ...data,
    relations: data.relations.filter((r) => ids[r.from.kind].has(r.from.id) && ids[r.to.kind].has(r.to.id)),
    notes: fixTags(data.notes).map((n) => (n.sourceId && !ids.source.has(n.sourceId) ? { ...n, sourceId: undefined } : n)),
    sources: fixTags(data.sources),
    symbols: fixTags(data.symbols),
    concepts: fixTags(data.concepts),
    journal: fixTags(data.journal),
  };
}
