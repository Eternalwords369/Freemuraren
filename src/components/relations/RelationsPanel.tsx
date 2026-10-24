"use client";

import { ArrowLeft, ArrowRight, Link2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { NODE_KIND_LABEL, RELATION_INVERSE, RELATION_LABEL, RELATION_TYPES } from "@/lib/constants";
import { useCodex } from "@/lib/db/client";
import type { CodexData } from "@/lib/db/schema";
import { hrefForRef } from "@/lib/search";
import type { NodeKind, NodeRef, RelationType } from "@/lib/types";
import { compareSv, matchScore } from "@/lib/utils";
import { EmptyState } from "../ui/Display";
import { useConfirm, useToast } from "../ui/Feedback";

export interface NodeOption {
  ref: NodeRef;
  title: string;
}

export function allNodes(data: CodexData): NodeOption[] {
  return [
    ...data.sources.map((s) => ({ ref: { kind: "source" as const, id: s.id }, title: s.title })),
    ...data.notes.map((n) => ({ ref: { kind: "note" as const, id: n.id }, title: n.title })),
    ...data.symbols.map((s) => ({ ref: { kind: "symbol" as const, id: s.id }, title: s.name })),
    ...data.concepts.map((c) => ({ ref: { kind: "concept" as const, id: c.id }, title: c.name })),
  ];
}

const refKey = (r: NodeRef) => `${r.kind}:${r.id}`;

export function parseRefKey(key: string): NodeRef | null {
  const i = key.indexOf(":");
  if (i < 0) return null;
  const kind = key.slice(0, i) as NodeKind;
  if (!["source", "note", "symbol", "concept"].includes(kind)) return null;
  return { kind, id: key.slice(i + 1) };
}

/** Relationer för en nod: lista, länkar åt båda håll och formulär för nya kopplingar. */
export function RelationsPanel({ node, headingLevel = "h2" }: { node: NodeRef; headingLevel?: "h2" | "h3" }) {
  const { state, store } = useCodex();
  const confirm = useConfirm();
  const toast = useToast();
  const data = state.db.data;
  const [adding, setAdding] = useState(false);

  const relations = data.relations.filter(
    (r) => refKey(r.from) === refKey(node) || refKey(r.to) === refKey(node),
  );

  const Heading = headingLevel;

  const remove = async (id: string, label: string) => {
    const ok = await confirm({
      title: "Ta bort kopplingen?",
      message: `Kopplingen ”${label}” tas bort. Posterna finns kvar.`,
      confirmLabel: "Ta bort koppling",
      tone: "danger",
    });
    if (!ok) return;
    const res = store.relations.delete(id);
    toast(res.ok ? "Kopplingen är borttagen." : res.error, res.ok ? "success" : "error");
  };

  return (
    <section aria-labelledby="relations-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Heading id="relations-heading" className="flex items-center gap-2 text-[1.5rem] text-ink">
          <Link2 size={18} className="text-gold" aria-hidden="true" /> Kopplingar
        </Heading>
        {!adding && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>
            <Plus size={14} aria-hidden="true" /> Ny koppling
          </button>
        )}
      </div>

      {adding && <AddRelationForm node={node} onDone={() => setAdding(false)} />}

      {relations.length === 0 ? (
        !adding && (
          <EmptyState compact title="Inga kopplingar ännu">
            Koppla posten till källor, symboler, begrepp eller anteckningar. Kopplingarna syns också i Kunskapskartan.
          </EmptyState>
        )
      ) : (
        <ul className="mt-3 divide-y divide-line rounded-[var(--radius-lg)] border border-line">
          {relations.map((r) => {
            const outgoing = refKey(r.from) === refKey(node);
            const other = outgoing ? r.to : r.from;
            const label = outgoing ? RELATION_LABEL[r.type] : RELATION_INVERSE[r.type];
            const title = store.nodeTitle(other);
            return (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                {outgoing ? (
                  <ArrowRight size={16} className="mt-1 shrink-0 text-gold" aria-hidden="true" />
                ) : (
                  <ArrowLeft size={16} className="mt-1 shrink-0 text-ink-3" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{label}</p>
                  <Link href={hrefForRef(other)} className="text-ink underline-offset-4 hover:text-gold-strong hover:underline">
                    {title}
                  </Link>
                  <span className="ml-2 text-xs text-ink-3">{NODE_KIND_LABEL[other.kind]}</span>
                  {r.note && <p className="mt-1 text-sm text-ink-2">{r.note}</p>}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm shrink-0"
                  onClick={() => remove(r.id, `${label} ${title}`)}
                  aria-label={`Ta bort kopplingen ${label.toLowerCase()} ${title}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Utan node väljs även startposten i formuläret (används i Kunskapskartan). */
export function AddRelationForm({ node, onDone }: { node?: NodeRef; onDone: () => void }) {
  const { state, store } = useCodex();
  const toast = useToast();
  const uid = useId();
  const nodes = useMemo(
    () => allNodes(state.db.data).sort((a, b) => compareSv(a.title, b.title)),
    [state.db.data],
  );

  const [fromKey, setFromKey] = useState(node ? refKey(node) : "");
  const [type, setType] = useState<RelationType>("relaterar-till");
  const [filter, setFilter] = useState("");
  const [toKey, setToKey] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const chooseFrom = !node;
  const candidates = nodes.filter((n) => refKey(n.ref) !== fromKey && (!filter.trim() || matchScore(filter, n.title) > 0));

  const submit = () => {
    const from = parseRefKey(fromKey);
    const to = parseRefKey(toKey);
    if (!from) return setError("Välj vilken post kopplingen utgår från.");
    if (!to) return setError("Välj en post att koppla till.");
    const res = store.relations.create({ from, to, type, note: note.trim() || undefined });
    if (!res.ok) return setError(res.error);
    toast("Kopplingen är skapad.");
    onDone();
  };

  const groups: { kind: NodeKind; label: string }[] = [
    { kind: "source", label: "Källor" },
    { kind: "note", label: "Anteckningar" },
    { kind: "symbol", label: "Symboler" },
    { kind: "concept", label: "Begrepp" },
  ];

  const selectOptions = (list: NodeOption[]) =>
    groups.map((g) => {
      const items = list.filter((n) => n.ref.kind === g.kind);
      return items.length ? (
        <optgroup key={g.kind} label={g.label}>
          {items.map((n) => (
            <option key={refKey(n.ref)} value={refKey(n.ref)}>
              {n.title}
            </option>
          ))}
        </optgroup>
      ) : null;
    });

  if (nodes.length < 2) {
    return (
      <p className="rounded-[var(--radius-md)] border border-line bg-surface p-4 text-sm text-ink-2">
        Det behövs minst två poster för att skapa en koppling.{" "}
        <button type="button" className="text-gold underline underline-offset-2" onClick={onDone}>
          Stäng
        </button>
      </p>
    );
  }

  return (
    <form
      className="card space-y-4 p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      aria-label="Ny koppling"
    >
      {chooseFrom && (
        <div>
          <label htmlFor={`${uid}-from`} className="field-label">
            Från
          </label>
          <select id={`${uid}-from`} className="input" value={fromKey} onChange={(e) => setFromKey(e.target.value)}>
            <option value="">Välj post…</option>
            {selectOptions(nodes)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor={`${uid}-type`} className="field-label">
          Relation
        </label>
        <select id={`${uid}-type`} className="input" value={type} onChange={(e) => setType(e.target.value as RelationType)}>
          {RELATION_TYPES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${uid}-filter`} className="field-label">
          Till
        </label>
        <input
          id={`${uid}-filter`}
          className="input mb-2"
          type="search"
          placeholder="Filtrera listan…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-describedby={`${uid}-count`}
        />
        <select
          id={`${uid}-to`}
          aria-label="Välj post att koppla till"
          className="input"
          value={toKey}
          onChange={(e) => {
            setToKey(e.target.value);
            setError("");
          }}
        >
          <option value="">Välj post…</option>
          {selectOptions(candidates)}
        </select>
        <p id={`${uid}-count`} className="field-hint">
          {candidates.length} poster att välja bland.
        </p>
      </div>
      <div>
        <label htmlFor={`${uid}-note`} className="field-label">
          Kommentar <span className="font-normal text-ink-3">(valfritt)</span>
        </label>
        <input id={`${uid}-note`} className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Avbryt
        </button>
        <button type="submit" className="btn btn-primary">
          Skapa koppling
        </button>
      </div>
    </form>
  );
}
