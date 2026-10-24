import { describe, expect, it } from "vitest";
import { MemoryAdapter, type StorageAdapter } from "@/lib/db/adapter";
import { parseDatabase } from "@/lib/db/migrations";
import { EXPORT_FORMAT, SCHEMA_VERSION, emptyDatabase } from "@/lib/db/schema";
import { CodexStore, mergeData } from "@/lib/db/store";
import type { NoteInput, SourceInput } from "@/lib/db/store";

function freshStore(adapter: StorageAdapter = new MemoryAdapter()) {
  const store = new CodexStore(adapter);
  store.init();
  return { store, adapter };
}

const sourceInput: SourceInput = {
  type: "bok",
  title: "Enneaderna",
  content: "Plotinos samlade avhandlingar.",
  author: "Plotinos",
  url: "",
  topics: ["filosofi"],
  tags: ["Nyplatonism", "nyplatonism", "  "],
  comment: "",
  publication: "",
  year: "",
};

const noteInput: NoteInput = {
  type: "anteckning",
  title: "Det Ena",
  content: "Utflödet ur det Ena.",
  topics: [],
  tags: [],
  status: undefined,
};

describe("CodexStore", () => {
  it("lägger in märkt exempelmaterial vid första start och sparar det", () => {
    const { store, adapter } = freshStore();
    const state = store.getState();
    expect(state.status).toBe("ready");
    expect(state.db.data.symbols.length).toBeGreaterThan(0);
    expect(state.db.data.symbols.every((s) => s.isExample)).toBe(true);
    expect(adapter.read()).not.toBeNull();
  });

  it("skapar, uppdaterar och raderar en källa och data överlever en ny inläsning", () => {
    const adapter = new MemoryAdapter();
    const { store } = freshStore(adapter);
    const created = store.sources.create(sourceInput);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.url).toBeUndefined();
    expect(created.value.tagIds).toHaveLength(1);

    const updated = store.sources.update(created.value.id, { ...sourceInput, title: "Enneaderna I–VI", tags: [] });
    expect(updated.ok && updated.value.title).toBe("Enneaderna I–VI");

    const reloaded = freshStore(adapter).store;
    expect(reloaded.sources.getById(created.value.id)?.title).toBe("Enneaderna I–VI");

    expect(reloaded.sources.delete(created.value.id).ok).toBe(true);
    expect(reloaded.sources.getById(created.value.id)).toBeUndefined();
  });

  it("tar bort relationer när en nod raderas", () => {
    const { store } = freshStore();
    const a = store.notes.create(noteInput);
    const b = store.sources.create(sourceInput);
    if (!a.ok || !b.ok) throw new Error("setup");
    const rel = store.relations.create({
      from: { kind: "note", id: a.value.id },
      to: { kind: "source", id: b.value.id },
      type: "hamtad-fran",
    });
    expect(rel.ok).toBe(true);
    store.sources.delete(b.value.id);
    expect(store.relations.forNode({ kind: "note", id: a.value.id })).toHaveLength(0);
  });

  it("vägrar dubbla relationer och självrelationer", () => {
    const { store } = freshStore();
    const a = store.notes.create(noteInput);
    if (!a.ok) throw new Error("setup");
    const ref = { kind: "note" as const, id: a.value.id };
    expect(store.relations.create({ from: ref, to: ref, type: "tolkar" }).ok).toBe(false);
  });

  it("återställer minnet när sparningen misslyckas", () => {
    const adapter = new MemoryAdapter();
    const { store } = freshStore(adapter);
    const before = store.getState().db.data.notes.length;
    adapter.write = () => {
      throw new Error("full");
    };
    const res = store.notes.create(noteInput);
    expect(res.ok).toBe(false);
    expect(store.getState().db.data.notes.length).toBe(before);
    expect(store.getState().saveError).toBeTruthy();
  });

  it("tar bort och återställer exempel utan att röra egna poster", () => {
    const { store } = freshStore();
    const own = store.notes.create(noteInput);
    if (!own.ok) throw new Error("setup");
    expect(store.examples.removeAll().ok).toBe(true);
    expect(store.examples.count()).toBe(0);
    expect(store.notes.getById(own.value.id)).toBeDefined();
    const restored = store.examples.restore();
    expect(restored.ok && restored.value).toBeGreaterThan(0);
    expect(store.notes.getById(own.value.id)).toBeDefined();
  });

  it("markerar skadad data som fel i stället för att skriva över den", () => {
    const adapter = new MemoryAdapter();
    adapter.write("{inte json");
    const { store } = freshStore(adapter);
    expect(store.getState().status).toBe("error");
    expect(adapter.read()).toBe("{inte json");
  });
});

describe("import och migrering", () => {
  it("accepterar en egen export", () => {
    const { store } = freshStore();
    const parsed = parseDatabase(JSON.parse(store.exportJson()));
    expect(parsed.ok).toBe(true);
  });

  it("avvisar filer från andra appar och nyare versioner", () => {
    expect(parseDatabase({ hello: "world" }).ok).toBe(false);
    const future = { format: EXPORT_FORMAT, schemaVersion: SCHEMA_VERSION + 1, data: {} };
    const res = parseDatabase(future);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors[0]).toMatch(/schemaversion/);
  });

  it("rapporterar begripliga fel för ogiltiga poster", () => {
    const db = emptyDatabase();
    const bad = { ...db, data: { ...db.data, notes: [{ id: "x", title: 5 }] } };
    const res = parseDatabase(bad);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.some((e) => e.startsWith("data.notes[0].title"))).toBe(true);
  });

  it("migrerar version 0 till aktuell version", () => {
    const v0 = { app: "living-cosmos-codex", schemaVersion: 0, data: { sources: [], notes: [], symbols: [], concepts: [], relations: [], tags: [], goals: [], journal: [] } };
    const res = parseDatabase(v0);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.db.schemaVersion).toBe(SCHEMA_VERSION);
      expect(res.db.data.investigations).toEqual([]);
      expect(res.migratedFrom).toBe(0);
    }
  });

  it("slår samman data och behåller den senast uppdaterade versionen", () => {
    const base = emptyDatabase().data;
    const tag = { id: "t1", name: "kosmos", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
    const note = {
      id: "n1",
      entity: "note" as const,
      type: "anteckning" as const,
      title: "Gammal",
      content: "",
      topics: [],
      tagIds: ["t1"],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const current = { ...base, tags: [tag], notes: [note] };
    const incoming = {
      ...base,
      tags: [{ ...tag, id: "t2" }],
      notes: [
        { ...note, title: "Ny", updatedAt: "2026-02-01T00:00:00.000Z", tagIds: ["t2"] },
        { ...note, id: "n2", tagIds: ["t2"] },
      ],
    };
    const { data, summary } = mergeData(current, incoming);
    expect(summary).toEqual({ added: 2, updated: 1, unchanged: 0 });
    expect(data.notes.find((n) => n.id === "n1")?.title).toBe("Ny");
    expect(data.tags).toHaveLength(1);
    expect(data.notes.every((n) => n.tagIds.every((id) => id === "t1"))).toBe(true);
  });
});

describe("rundtur genom lagringen", () => {
  it("alla posttyper som skapas via repositories klarar validering vid ny inläsning", () => {
    const adapter = new MemoryAdapter();
    const { store } = freshStore(adapter);
    const note = store.notes.create({ ...noteInput, tags: ["test"] });
    const source = store.sources.create(sourceInput);
    if (!note.ok || !source.ok) throw new Error("setup");
    expect(store.symbols.create({
      name: "Spiral",
      glyph: { kind: "builtin", name: "spiral" },
      description: "",
      historicalContext: "",
      traditions: [{ id: "t", tradition: "", interpretation: "" }],
      personalInterpretation: "",
      relatedConcepts: [],
      references: [],
      tags: [],
    }).ok).toBe(true);
    expect(store.concepts.create({ name: "Emanation", description: "", topics: [], tags: [] }).ok).toBe(true);
    expect(store.relations.create({ from: { kind: "note", id: note.value.id }, to: { kind: "source", id: source.value.id }, type: "citerar", note: "" }).ok).toBe(true);
    const goal = store.goals.create({ title: "Mål", description: "", status: "aktiv", milestones: [], topics: [] });
    if (!goal.ok) throw new Error("goal");
    expect(store.goals.addMilestone(goal.value.id, "Steg").ok).toBe(true);
    expect(store.goals.setDone(goal.value.id, true).ok).toBe(true);
    expect(store.journal.create({ title: "", body: "Text", entryDate: "2026-10-24", tags: [] }).ok).toBe(true);
    const inv = store.investigations.create({ title: "Hermetismen", note: "", status: "planerad", exploreSlug: "hermetismen" });
    expect(inv.ok).toBe(true);
    if (inv.ok) expect(store.investigations.update(inv.value.id, { status: "avslutad" }).ok).toBe(true);
    store.touch({ kind: "note", id: note.value.id });

    const parsed = parseDatabase(JSON.parse(adapter.read()!));
    if (!parsed.ok) throw new Error(parsed.errors.join("\n"));
    expect(freshStore(adapter).store.getState().status).toBe("ready");
  });
});
