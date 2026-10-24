"use client";

import { ArrowLeft, Pencil, Plus, Search, Shapes, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CodexData } from "@/lib/db/schema";
import type { CodexStore } from "@/lib/db/store";
import type { SymbolEntry } from "@/lib/types";
import { compareSv, excerpt, formatDate, matchScore } from "@/lib/utils";
import { RelationsPanel } from "../relations/RelationsPanel";
import { DataGate } from "../ui/DataGate";
import { EmptyState, ExampleBadge, PageHeader, TagList, TextLink } from "../ui/Display";
import { useConfirm, useToast } from "../ui/Feedback";
import { SymbolEditor } from "./SymbolEditor";
import { SymbolGlyph } from "./SymbolGlyph";

/* ------------------------------- Lista -------------------------------- */

export function SymbolLexicon() {
  return <DataGate>{(data) => <LexiconBody data={data} />}</DataGate>;
}

function LexiconBody({ data }: { data: CodexData }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tagId, setTagId] = useState("");
  const [creating, setCreating] = useState(false);

  const tagNames = useMemo(() => new Map(data.tags.map((t) => [t.id, t.name])), [data.tags]);
  const usedTags = data.tags
    .filter((t) => data.symbols.some((s) => s.tagIds.includes(t.id)))
    .sort((a, b) => compareSv(a.name, b.name));

  const results = data.symbols
    .filter((s) => !tagId || s.tagIds.includes(tagId))
    .filter(
      (s) =>
        !query.trim() ||
        matchScore(
          query,
          s.name,
          s.description,
          s.historicalContext,
          s.personalInterpretation,
          s.relatedConcepts.join(" "),
          s.traditions.map((t) => `${t.tradition} ${t.interpretation}`).join(" "),
          s.tagIds.map((t) => tagNames.get(t) ?? "").join(" "),
        ) > 0,
    )
    .sort((a, b) => compareSv(a.name, b.name));

  return (
    <>
      <PageHeader
        eyebrow="Symbollexikon"
        title="Tecken och betydelser"
        lead="Symboler med historiskt sammanhang, tolkningar i olika traditioner och din egen läsning – hållna isär."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden="true" /> Ny symbol
          </button>
        }
      />

      {data.symbols.length === 0 ? (
        <EmptyState
          icon={<Shapes size={32} strokeWidth={1.3} aria-hidden="true" />}
          title="Lexikonet är tomt"
          action={
            <>
              <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
                <Plus size={16} aria-hidden="true" /> Lägg till en symbol
              </button>
              <Link href="/installningar#exempel" className="btn btn-secondary">
                Läs in exempelsymboler
              </Link>
            </>
          }
        >
          Beskriv en symbol du stött på: var den förekommer, hur den tolkats och vad den betyder för dig.
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="symbol-search" className="sr-only">
                Sök symboler
              </label>
              <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input
                id="symbol-search"
                type="search"
                className="input pl-10"
                placeholder="Sök namn, tradition, tolkning eller begrepp"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="sm:w-56">
              <label htmlFor="symbol-tag" className="sr-only">
                Filtrera på tagg
              </label>
              <select id="symbol-tag" className="input" value={tagId} onChange={(e) => setTagId(e.target.value)}>
                <option value="">Alla taggar</option>
                {usedTags.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-ink-2" aria-live="polite">
              {results.length} av {data.symbols.length} symboler
            </p>
            {(query || tagId) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setQuery("");
                  setTagId("");
                }}
              >
                <X size={14} aria-hidden="true" /> Rensa
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="mt-4">
              <EmptyState compact title="Inga symboler matchar">
                Prova ett annat sökord eller en annan tagg.
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((s) => (
                <li key={s.id}>
                  <Link href={`/symboler/${s.id}`} className="card card-link group flex h-full gap-4 p-5">
                    <div className="grid size-16 shrink-0 place-items-center rounded-[var(--radius-md)] border border-line bg-bg text-gold transition-colors group-hover:border-gold/40">
                      <SymbolGlyph glyph={s.glyph} className="size-11 text-[2.75rem]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[1.35rem] text-ink group-hover:text-gold-strong">{s.name}</h2>
                        {s.isExample && <ExampleBadge />}
                      </div>
                      {s.description && <p className="mt-1 text-sm text-ink-2">{excerpt(s.description, 110)}</p>}
                      {s.traditions.length > 0 && (
                        <p className="meta mt-2">{s.traditions.map((t) => t.tradition).filter(Boolean).join(" · ")}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <SymbolEditor open={creating} onClose={() => setCreating(false)} onSaved={(s) => router.push(`/symboler/${s.id}`)} />
    </>
  );
}

/* ------------------------------ Detalj -------------------------------- */

export function SymbolDetail({ id }: { id: string }) {
  return (
    <DataGate>
      {(_, store) => {
        const symbol = store.symbols.getById(id);
        if (!symbol)
          return (
            <EmptyState
              title="Symbolen finns inte"
              action={
                <Link href="/symboler" className="btn btn-secondary">
                  Till symbollexikonet
                </Link>
              }
            >
              Den kan ha raderats, eller så finns den inte i den här webbläsaren.
            </EmptyState>
          );
        return <SymbolBody symbol={symbol} store={store} />;
      }}
    </DataGate>
  );
}

function SymbolBody({ symbol, store }: { symbol: SymbolEntry; store: CodexStore }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    store.touch({ kind: "symbol", id: symbol.id });
  }, [store, symbol.id]);

  const remove = async () => {
    const ok = await confirm({
      title: `Radera symbolen ”${symbol.name}”?`,
      message: "Symbolen och dess kopplingar raderas permanent från den här webbläsaren. Det går inte att ångra.",
      confirmLabel: "Radera symbolen",
      tone: "danger",
    });
    if (!ok) return;
    const res = store.symbols.delete(symbol.id);
    if (!res.ok) return toast(res.error, "error");
    toast("Symbolen är raderad.");
    router.push("/symboler");
  };

  const tags = store.tags.namesFor(symbol.tagIds);

  return (
    <article className="animate-rise">
      <TextLink href="/symboler">
        <ArrowLeft size={16} aria-hidden="true" /> Symbollexikon
      </TextLink>

      <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative grid size-32 shrink-0 place-items-center rounded-full border border-line bg-surface text-gold sm:size-40">
          <div aria-hidden="true" className="absolute inset-3 rounded-full border border-dashed border-line" />
          <SymbolGlyph glyph={symbol.glyph} className="size-20 text-[5rem] sm:size-24 sm:text-[6rem]" label={`Symbolen ${symbol.name}`} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Symbol</p>
            {symbol.isExample && <ExampleBadge />}
          </div>
          <h1 className="mt-2 text-[2.6rem] text-ink sm:text-5xl">{symbol.name}</h1>
          {symbol.description && <p className="mt-2 max-w-[60ch] text-lg text-ink-2">{symbol.description}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
              <Pencil size={16} aria-hidden="true" /> Redigera
            </button>
            <button type="button" className="btn btn-danger" onClick={remove}>
              <Trash2 size={16} aria-hidden="true" /> Radera
            </button>
          </div>
        </div>
      </header>

      {symbol.isExample && (
        <p className="mt-6 max-w-[64ch] rounded-[var(--radius-md)] border border-dashed border-gold/40 px-4 py-3 text-sm text-ink-2">
          Exempelmaterial. Uppgifterna är avsedda att visa hur lexikonet fungerar och är inte verifierade forskningsresultat. Kontrollera
          alltid mot egna källor.
        </p>
      )}

      <div className="hairline my-8" />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-10">
          <Section title="Historiskt sammanhang" empty="Inget historiskt sammanhang angivet.">
            {symbol.historicalContext}
          </Section>

          <section aria-labelledby="trad-h">
            <h2 id="trad-h" className="mb-4 text-[1.6rem]">
              Tolkningar i olika traditioner
            </h2>
            {symbol.traditions.length === 0 ? (
              <p className="text-ink-3">Inga traditioner angivna.</p>
            ) : (
              <dl className="space-y-3">
                {symbol.traditions.map((t) => (
                  <div key={t.id} className="card p-4">
                    <dt className="eyebrow">{t.tradition || "Namnlös tradition"}</dt>
                    <dd className="mt-1.5 text-ink-2">{t.interpretation}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-3 text-xs text-ink-3">
              Tolkningar beskriver vad traditionerna själva menar. De är inte påståenden om att tolkningen är sann.
            </p>
          </section>

          <section aria-labelledby="pers-h" className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
            <h2 id="pers-h" className="eyebrow">
              Personlig tolkning
            </h2>
            {symbol.personalInterpretation ? (
              <p className="prose-codex mt-2 whitespace-pre-line">{symbol.personalInterpretation}</p>
            ) : (
              <p className="mt-2 text-sm text-ink-3">
                Du har inte skrivit någon egen tolkning ännu.{" "}
                <button type="button" className="text-gold underline underline-offset-2" onClick={() => setEditing(true)}>
                  Skriv en
                </button>
              </p>
            )}
          </section>

          <RelationsPanel node={{ kind: "symbol", id: symbol.id }} />
        </div>

        <aside className="space-y-6 text-sm" aria-label="Uppgifter om symbolen">
          {symbol.relatedConcepts.length > 0 && (
            <div>
              <h2 className="meta mb-2">Relaterade begrepp</h2>
              <ul className="flex flex-wrap gap-1.5">
                {symbol.relatedConcepts.map((c) => (
                  <li key={c} className="badge">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h2 className="meta mb-2">Källhänvisningar</h2>
            {symbol.references.length ? (
              <ul className="space-y-2 text-ink-2">
                {symbol.references.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-3">Inga källhänvisningar ännu.</p>
            )}
          </div>
          {tags.length > 0 && (
            <div>
              <h2 className="meta mb-2">Taggar</h2>
              <TagList names={tags} className="text-ink-2" />
            </div>
          )}
          <p className="meta">
            Skapad {formatDate(symbol.createdAt)} · uppdaterad {formatDate(symbol.updatedAt)}
          </p>
        </aside>
      </div>

      <SymbolEditor open={editing} symbol={symbol} onClose={() => setEditing(false)} />
    </article>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: string }) {
  return (
    <section>
      <h2 className="mb-3 text-[1.6rem]">{title}</h2>
      {children ? <p className="prose-codex whitespace-pre-line">{children}</p> : <p className="text-ink-3">{empty}</p>}
    </section>
  );
}
