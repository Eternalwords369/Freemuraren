"use client";

import { ArrowRight, List, Maximize2, Network, Pencil, Plus, Trash2, Waypoints, ZoomIn, ZoomOut } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ARCHIVE_TYPE_LABEL, NODE_KIND_LABEL, RELATION_INVERSE, RELATION_LABEL } from "@/lib/constants";
import type { CodexData } from "@/lib/db/schema";
import type { CodexStore } from "@/lib/db/store";
import { layoutGraph, type Point } from "@/lib/graph";
import { hrefForRef } from "@/lib/search";
import type { KnowledgeRelation, NodeRef } from "@/lib/types";
import { cx, excerpt } from "@/lib/utils";
import { AddRelationForm, parseRefKey, RelationsPanel } from "../relations/RelationsPanel";
import { DataGate } from "../ui/DataGate";
import { Dialog } from "../ui/Dialog";
import { EmptyState, ExampleBadge, PageHeader } from "../ui/Display";
import { useConfirm, useToast } from "../ui/Feedback";
import { ConceptEditor } from "./ConceptEditor";

type DisplayKind = "source" | "note" | "question" | "symbol" | "concept";

const DISPLAY: Record<DisplayKind, { label: string; color: string }> = {
  source: { label: "Källor", color: "var(--c-epi-historisk)" },
  note: { label: "Anteckningar", color: "var(--c-ink)" },
  question: { label: "Frågor och hypoteser", color: "var(--c-epi-filosofisk)" },
  symbol: { label: "Symboler", color: "var(--c-epi-symbolisk)" },
  concept: { label: "Begrepp", color: "var(--c-epi-vetenskap)" },
};

interface GraphNode {
  key: string;
  ref: NodeRef;
  display: DisplayKind;
  title: string;
  subtitle: string;
  body: string;
  isExample?: boolean;
}

const keyOf = (r: NodeRef) => `${r.kind}:${r.id}`;

function buildNodes(data: CodexData): GraphNode[] {
  return [
    ...data.sources.map((s) => ({
      key: `source:${s.id}`,
      ref: { kind: "source" as const, id: s.id },
      display: "source" as const,
      title: s.title,
      subtitle: [ARCHIVE_TYPE_LABEL[s.type], s.author].filter(Boolean).join(" · "),
      body: s.content,
      isExample: s.isExample,
    })),
    ...data.notes.map((n) => ({
      key: `note:${n.id}`,
      ref: { kind: "note" as const, id: n.id },
      display: (n.type === "fragestallning" || n.type === "hypotes" ? "question" : "note") as DisplayKind,
      title: n.title,
      subtitle: ARCHIVE_TYPE_LABEL[n.type],
      body: n.content,
      isExample: n.isExample,
    })),
    ...data.symbols.map((s) => ({
      key: `symbol:${s.id}`,
      ref: { kind: "symbol" as const, id: s.id },
      display: "symbol" as const,
      title: s.name,
      subtitle: "Symbol",
      body: s.description,
      isExample: s.isExample,
    })),
    ...data.concepts.map((c) => ({
      key: `concept:${c.id}`,
      ref: { kind: "concept" as const, id: c.id },
      display: "concept" as const,
      title: c.name,
      subtitle: "Begrepp",
      body: c.description,
      isExample: c.isExample,
    })),
  ];
}

export function KnowledgeMap() {
  return <DataGate>{(data, store) => <MapBody data={data} store={store} />}</DataGate>;
}

function MapBody({ data, store }: { data: CodexData; store: CodexStore }) {
  const params = useSearchParams();
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();

  const [view, setView] = useState<"graf" | "lista">("graf");
  const [hidden, setHidden] = useState<DisplayKind[]>([]);
  const [onlyConnected, setOnlyConnected] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(() => params.get("nod"));
  const [addingRelation, setAddingRelation] = useState<"free" | null>(null);
  const [conceptEditor, setConceptEditor] = useState<{ open: boolean; id?: string }>({ open: false });

  const allNodes = useMemo(() => buildNodes(data), [data]);
  const connected = useMemo(() => {
    const s = new Set<string>();
    for (const r of data.relations) {
      s.add(keyOf(r.from));
      s.add(keyOf(r.to));
    }
    return s;
  }, [data.relations]);

  const nodes = allNodes.filter((n) => !hidden.includes(n.display) && (!onlyConnected || connected.has(n.key)));
  const nodeKeys = new Set(nodes.map((n) => n.key));
  const edges = data.relations.filter((r) => nodeKeys.has(keyOf(r.from)) && nodeKeys.has(keyOf(r.to)));
  const selected = selectedKey ? allNodes.find((n) => n.key === selectedKey) : undefined;

  useEffect(() => {
    const ref = selectedKey ? parseRefKey(selectedKey) : null;
    if (ref) store.touch(ref);
  }, [selectedKey, store]);

  const select = (key: string | null) => {
    setSelectedKey(key);
    router.replace(key ? `/karta?nod=${encodeURIComponent(key)}` : "/karta", { scroll: false });
  };

  const toggleKind = (k: DisplayKind) => setHidden((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]));

  const deleteConcept = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Radera begreppet ”${name}”?`,
      message: "Begreppet och dess kopplingar raderas permanent. Det går inte att ångra.",
      confirmLabel: "Radera begreppet",
      tone: "danger",
    });
    if (!ok) return;
    const res = store.concepts.delete(id);
    if (!res.ok) return toast(res.error, "error");
    toast("Begreppet är raderat.");
    select(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Kunskapskarta"
        title="Relationer mellan idéer"
        lead="Dina källor, anteckningar, frågor, symboler och begrepp – och de kopplingar du själv har gjort mellan dem."
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConceptEditor({ open: true })}>
              <Plus size={16} aria-hidden="true" /> Nytt begrepp
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setAddingRelation("free")} disabled={allNodes.length < 2}>
              <Waypoints size={16} aria-hidden="true" /> Ny koppling
            </button>
          </>
        }
      />

      {allNodes.length === 0 ? (
        <EmptyState
          icon={<Network size={32} strokeWidth={1.3} aria-hidden="true" />}
          title="Kartan är tom"
          action={
            <>
              <Link href="/arkiv?ny=anteckning" className="btn btn-primary">
                Skriv en anteckning
              </Link>
              <button type="button" className="btn btn-secondary" onClick={() => setConceptEditor({ open: true })}>
                Lägg till ett begrepp
              </button>
            </>
          }
        >
          Kartan byggs av ditt eget material. Lägg till poster och koppla ihop dem, så växer kartan fram här.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Visa nodtyper">
              {(Object.keys(DISPLAY) as DisplayKind[]).map((k) => (
                <button key={k} type="button" className="chip" aria-pressed={!hidden.includes(k)} onClick={() => toggleKind(k)}>
                  <NodeShape kind={k} size={12} />
                  {DISPLAY[k].label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink-2">
                <input type="checkbox" className="size-4 accent-[var(--c-gold)]" checked={onlyConnected} onChange={(e) => setOnlyConnected(e.target.checked)} />
                Bara kopplade
              </label>
              <div className="flex rounded-[var(--radius-md)] border border-line p-0.5" role="group" aria-label="Visningsläge">
                <button type="button" className={cx("btn btn-sm", view === "graf" ? "btn-secondary" : "btn-ghost")} aria-pressed={view === "graf"} onClick={() => setView("graf")}>
                  <Network size={15} aria-hidden="true" /> Graf
                </button>
                <button type="button" className={cx("btn btn-sm", view === "lista" ? "btn-secondary" : "btn-ghost")} aria-pressed={view === "lista"} onClick={() => setView("lista")}>
                  <List size={15} aria-hidden="true" /> Lista
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              {view === "graf" ? (
                <Graph nodes={nodes} edges={edges} selectedKey={selectedKey} onSelect={select} />
              ) : (
                <RelationList nodes={allNodes} relations={edges} store={store} onSelect={select} />
              )}
              {data.relations.length === 0 && (
                <p className="mt-3 text-sm text-ink-3">
                  Inga kopplingar ännu. Välj en nod och skapa en koppling, eller använd knappen Ny koppling.
                </p>
              )}
            </div>

            <aside aria-label="Vald nod" className="lg:sticky lg:top-8 lg:self-start">
              {selected ? (
                <div className="card animate-fade space-y-4 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <NodeShape kind={selected.display} size={14} />
                    <span className="meta">{selected.subtitle || NODE_KIND_LABEL[selected.ref.kind]}</span>
                    {selected.isExample && <ExampleBadge />}
                  </div>
                  <h2 className="text-[1.6rem] leading-tight text-ink">{selected.title}</h2>
                  {selected.body && <p className="text-sm text-ink-2">{excerpt(selected.body, 220)}</p>}
                  <div className="flex flex-wrap gap-2">
                    {selected.ref.kind === "concept" ? (
                      <>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConceptEditor({ open: true, id: selected.ref.id })}>
                          <Pencil size={14} aria-hidden="true" /> Redigera
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteConcept(selected.ref.id, selected.title)}>
                          <Trash2 size={14} aria-hidden="true" /> Radera
                        </button>
                      </>
                    ) : (
                      <Link href={hrefForRef(selected.ref)} className="btn btn-secondary btn-sm">
                        Öppna <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    )}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => select(null)}>
                      Avmarkera
                    </button>
                  </div>
                  <div className="hairline" />
                  <RelationsPanel node={selected.ref} headingLevel="h3" />
                </div>
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-line p-5 text-sm text-ink-2">
                  <p className="font-display text-xl text-ink">Välj en nod</p>
                  <p className="mt-1.5">
                    Klicka eller tryck på en nod för att se dess kopplingar. Med tangentbordet: Tabb till en nod och Enter.
                  </p>
                  <p className="mt-3 text-ink-3">
                    {nodes.length} noder · {edges.length} kopplingar
                  </p>
                </div>
              )}
            </aside>
          </div>
        </>
      )}

      <Dialog open={addingRelation === "free"} onRequestClose={() => setAddingRelation(null)} title="Ny koppling">
        {addingRelation === "free" && <AddRelationForm onDone={() => setAddingRelation(null)} />}
      </Dialog>

      <ConceptEditor
        open={conceptEditor.open}
        concept={conceptEditor.id ? store.concepts.getById(conceptEditor.id) : undefined}
        onClose={() => setConceptEditor({ open: false })}
        onSaved={(c) => select(`concept:${c.id}`)}
      />
    </>
  );
}

/* ------------------------------- Graf --------------------------------- */

function NodeShape({ kind, size }: { kind: DisplayKind; size: number }) {
  return (
    <svg width={size} height={size} viewBox="-10 -10 20 20" aria-hidden="true" className="shrink-0">
      <ShapePath kind={kind} r={8} />
    </svg>
  );
}

function ShapePath({ kind, r, strong }: { kind: DisplayKind; r: number; strong?: boolean }) {
  const color = DISPLAY[kind].color;
  const sw = strong ? 2.5 : 1.5;
  switch (kind) {
    case "source":
      return <circle r={r} fill={color} stroke={color} strokeWidth={sw} />;
    case "note":
      return <rect x={-r * 0.85} y={-r * 0.85} width={r * 1.7} height={r * 1.7} rx={2} fill={color} />;
    case "question":
      return <polygon points={`0,${-r} ${r},${r * 0.8} ${-r},${r * 0.8}`} fill={color} />;
    case "symbol":
      return <polygon points={`0,${-r} ${r},0 0,${r} ${-r},0`} fill={color} />;
    case "concept":
      return (
        <>
          <circle r={r} fill="var(--c-bg)" stroke={color} strokeWidth={sw + 0.5} />
          <circle r={r * 0.35} fill={color} />
        </>
      );
  }
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      // Avrunda så att layouten inte räknas om för små förändringar.
      if (entry) setWidth(Math.round(entry.contentRect.width / 40) * 40);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

function Graph({
  nodes,
  edges,
  selectedKey,
  onSelect,
}: {
  nodes: GraphNode[];
  edges: KnowledgeRelation[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const W = Math.max(width, 320);
  const H = W < 640 ? 540 : 600;
  const maxLabel = W < 640 ? 18 : 24;

  const structureKey = nodes.map((n) => n.key).join("|") + "#" + edges.map((e) => `${keyOf(e.from)}>${keyOf(e.to)}`).join("|");
  const positions = useMemo(() => {
    void structureKey;
    return layoutGraph(
      nodes.map((n) => ({ id: n.key })),
      edges.map((e) => ({ source: keyOf(e.from), target: keyOf(e.to) })),
      { width: W, height: H, padX: W < 640 ? 56 : 90 },
    );
    // Layouten beror bara på strukturen, inte på titlar eller annan text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey, W, H]);

  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);

  const neighbours = useMemo(() => {
    const s = new Set<string>();
    if (!selectedKey) return s;
    for (const e of edges) {
      if (keyOf(e.from) === selectedKey) s.add(keyOf(e.to));
      if (keyOf(e.to) === selectedKey) s.add(keyOf(e.from));
    }
    return s;
  }, [edges, selectedKey]);

  const zoom = (factor: number) =>
    setView((v) => {
      const k = Math.min(3, Math.max(0.5, v.k * factor));
      // Zooma kring mitten av ytan.
      const cx = W / 2;
      const cy = H / 2;
      return { k, x: cx - ((cx - v.x) * k) / v.k, y: cy - ((cy - v.y) * k) / v.k };
    });

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest("[data-node]")) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };
  const onPointerUp = () => {
    if (drag.current && !drag.current.moved) onSelect(null);
    drag.current = null;
  };

  const p = (key: string): Point => positions.get(key) ?? { x: W / 2, y: H / 2 };

  return (
    <div ref={ref} className="relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-[radial-gradient(ellipse_at_center,rgba(20,28,44,0.9),rgba(7,10,18,0.9))]">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button type="button" className="btn btn-secondary btn-icon btn-sm" onClick={() => zoom(1.25)} aria-label="Zooma in">
          <ZoomIn size={16} aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-secondary btn-icon btn-sm" onClick={() => zoom(0.8)} aria-label="Zooma ut">
          <ZoomOut size={16} aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-secondary btn-icon btn-sm" onClick={() => setView({ x: 0, y: 0, k: 1 })} aria-label="Återställ vy">
          <Maximize2 size={16} aria-hidden="true" />
        </button>
      </div>

      {nodes.length === 0 ? (
        <p className="grid h-64 place-items-center text-sm text-ink-3">Inga noder matchar filtret.</p>
      ) : (
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full cursor-grab touch-none select-none active:cursor-grabbing"
          role="group"
          aria-label={`Kunskapskarta med ${nodes.length} noder och ${edges.length} kopplingar`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (drag.current = null)}
        >
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            <g aria-hidden="true">
              {edges.map((e) => {
                const a = p(keyOf(e.from));
                const b = p(keyOf(e.to));
                const active = selectedKey && (keyOf(e.from) === selectedKey || keyOf(e.to) === selectedKey);
                return (
                  <g key={e.id}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={active ? "var(--c-gold)" : "var(--c-line-strong)"}
                      strokeWidth={active ? 1.6 : 1}
                      strokeDasharray={e.type === "motsager" ? "4 4" : undefined}
                      opacity={selectedKey && !active ? 0.25 : 1}
                    />
                    {active && (
                      <text
                        x={(a.x + b.x) / 2}
                        y={(a.y + b.y) / 2 - 5}
                        textAnchor="middle"
                        className="fill-gold-strong"
                        style={{ fontSize: 11, paintOrder: "stroke", stroke: "var(--c-bg)", strokeWidth: 4 }}
                      >
                        {keyOf(e.from) === selectedKey ? RELATION_LABEL[e.type] : RELATION_INVERSE[e.type]}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
            {nodes.map((n) => {
              const pt = p(n.key);
              const isSel = n.key === selectedKey;
              const dim = selectedKey && !isSel && !neighbours.has(n.key);
              const label = n.title.length > maxLabel ? `${n.title.slice(0, maxLabel - 1)}…` : n.title;
              return (
                <g
                  key={n.key}
                  data-node
                  transform={`translate(${pt.x} ${pt.y})`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSel}
                  aria-label={`${n.title}, ${n.subtitle || NODE_KIND_LABEL[n.ref.kind]}`}
                  className="cursor-pointer outline-none [&:focus-visible>circle.focus]:opacity-100"
                  opacity={dim ? 0.3 : 1}
                  onClick={() => onSelect(isSel ? null : n.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(isSel ? null : n.key);
                    }
                  }}
                >
                  <circle r={22} fill="transparent" />
                  <circle className="focus" r={17} fill="none" stroke="var(--c-focus)" strokeWidth={2} opacity={0} />
                  {isSel && <circle r={15} fill="none" stroke="var(--c-gold)" strokeWidth={1.5} strokeDasharray="2 3" />}
                  <ShapePath kind={n.display} r={isSel ? 9 : 7} strong={isSel} />
                  <text
                    y={22}
                    textAnchor="middle"
                    className={isSel ? "fill-gold-strong" : "fill-ink-2"}
                    style={{ fontSize: W < 640 ? 11 : 12, paintOrder: "stroke", stroke: "var(--c-bg)", strokeWidth: 3.5, fontWeight: isSel ? 600 : 400 }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      )}
      <p className="border-t border-line px-4 py-2 text-xs text-ink-3">
        Dra i bakgrunden för att panorera. Streckad linje betyder ”motsäger”.
      </p>
    </div>
  );
}

/* ------------------------------- Lista -------------------------------- */

function RelationList({
  nodes,
  relations,
  store,
  onSelect,
}: {
  nodes: GraphNode[];
  relations: KnowledgeRelation[];
  store: CodexStore;
  onSelect: (key: string) => void;
}) {
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  if (relations.length === 0)
    return (
      <EmptyState compact title="Inga kopplingar att visa">
        Ändra filtret eller skapa en ny koppling.
      </EmptyState>
    );
  return (
    <ul className="divide-y divide-line rounded-[var(--radius-lg)] border border-line">
      {relations.map((r) => {
        const from = byKey.get(keyOf(r.from));
        const to = byKey.get(keyOf(r.to));
        return (
          <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
            <button type="button" className="flex items-center gap-2 text-left text-ink hover:text-gold-strong" onClick={() => onSelect(keyOf(r.from))}>
              {from && <NodeShape kind={from.display} size={11} />}
              {from?.title ?? store.nodeTitle(r.from)}
            </button>
            <span className="text-xs font-semibold tracking-wide text-gold uppercase">{RELATION_LABEL[r.type]}</span>
            <button type="button" className="flex items-center gap-2 text-left text-ink hover:text-gold-strong" onClick={() => onSelect(keyOf(r.to))}>
              {to && <NodeShape kind={to.display} size={11} />}
              {to?.title ?? store.nodeTitle(r.to)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
